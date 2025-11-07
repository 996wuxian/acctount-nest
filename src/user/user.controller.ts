import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
  Query,
  NotFoundException,
  ParseIntPipe,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Request } from 'express';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';

import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('apk')
  @ApiOperation({
    summary: '获取最新 APK（返回储存桶 URL）',
    description:
      '读取 package/release.json，比对 ?version；一致返回“已是最新”；不一致返回储存桶下载 URL、最新版本、日期与更新内容',
  })
  @ApiOkResponse({
    description: '返回最新版本信息或储存桶下载地址',
    schema: {
      type: 'object',
      properties: {
        isLatest: { type: 'boolean', example: false },
        latestVersion: { type: 'string', example: '2.9.0' },
        date: { type: 'string', example: '2025-10-21' },
        content: { type: 'array', items: { type: 'string' } },
        url: {
          type: 'string',
          example: 'https://dx.jcw2.cn/suixinji-2.9.0_anzhuo.apk',
        },
        message: { type: 'string', example: '已经是最新版本' },
      },
    },
  })
  @ApiQuery({ name: 'version', required: false, description: '客户端当前版本' })
  apk(
    @Req() req: Request,
    @Query('version') version?: string,
  ): Record<string, any> {
    // 使用 __dirname，定位到根目录下的 package
    const assetsDir = path.resolve(__dirname, '../../package');
    const releasePath = path.join(assetsDir, 'release.json');

    if (!existsSync(releasePath)) {
      throw new NotFoundException('缺少 release.json，无法确定 APK 版本');
    }

    let release: { version: string; date?: string; content?: string[] };
    try {
      release = JSON.parse(readFileSync(releasePath, 'utf8'));
    } catch {
      throw new NotFoundException('release.json 格式错误');
    }

    const latestVersion = (release.version ?? '').trim();
    const date = release.date ?? null;
    const content = Array.isArray(release.content) ? release.content : [];

    // 版本标准化：去空白与前缀 v/V；兼容 version/v/ver
    const normalizeVersion = (v?: string) =>
      String(v ?? '')
        .trim()
        .replace(/^v/i, '');
    const clientVersionRaw =
      version ??
      (req.query['v'] as string | undefined) ??
      (req.query['ver'] as string | undefined);
    const isLatest =
      !!latestVersion &&
      normalizeVersion(clientVersionRaw) === normalizeVersion(latestVersion);

    // 储存桶域名可通过环境变量覆盖，默认使用 dx.jcw2.cn
    const bucketBase = (
      process.env.APK_BUCKET_BASE ?? 'http://dx.jcw2.cn'
    ).replace(/\/+$/, '');
    const apkFileName = `suixinji-${latestVersion}_anzhuo.apk`;
    const downloadUrl = `${bucketBase}/${apkFileName}`;

    if (isLatest) {
      return {
        isLatest: true,
        latestVersion,
        date,
        content,
        message: '已经是最新版本',
      };
    }

    return { isLatest: false, latestVersion, date, content, url: downloadUrl };
  }

  // 新增：另一个 APP 的版本查询（读取 record-package）
  @Get('record-apk')
  @ApiOperation({
    summary: '获取另一个 APP 最新 APK（返回储存桶 URL）',
    description:
      '读取 record-package/release.json，比对 ?version；一致返回“已是最新”；不一致返回储存桶下载 URL、最新版本、日期与更新内容',
  })
  @ApiOkResponse({
    description: '返回最新版本信息或储存桶下载地址',
    schema: {
      type: 'object',
      properties: {
        isLatest: { type: 'boolean', example: false },
        latestVersion: { type: 'string', example: '2.9.0' },
        date: { type: 'string', example: '2025-10-21' },
        content: { type: 'array', items: { type: 'string' } },
        url: {
          type: 'string',
          example: 'http://dx.jcw2.cn/record-2.9.0_anzhuo.apk',
        },
        message: { type: 'string', example: '已经是最新版本' },
      },
    },
  })
  @ApiQuery({ name: 'version', required: false, description: '客户端当前版本' })
  recordApk(
    @Req() req: Request,
    @Query('version') version?: string,
  ): Record<string, any> {
    const assetsDir = path.resolve(__dirname, '../../record-package');
    const releasePath = path.join(assetsDir, 'release.json');

    if (!existsSync(releasePath)) {
      throw new NotFoundException(
        '缺少 record-package/release.json，无法确定 APK 版本',
      );
    }

    let release: {
      version?: string;
      date?: string;
      content?: string[];
      apkFileName?: string;
      fileName?: string;
    };
    try {
      release = JSON.parse(readFileSync(releasePath, 'utf8'));
    } catch {
      throw new NotFoundException('record-package/release.json 格式错误');
    }

    const latestVersion = String(release.version ?? '').trim();
    const date = release.date ?? null;
    const content = Array.isArray(release.content) ? release.content : [];

    const normalizeVersion = (v?: string) =>
      String(v ?? '')
        .trim()
        .replace(/^v/i, '');
    const clientVersionRaw =
      version ??
      (req.query['v'] as string | undefined) ??
      (req.query['ver'] as string | undefined);
    const isLatest =
      !!latestVersion &&
      normalizeVersion(clientVersionRaw) === normalizeVersion(latestVersion);

    const bucketBase = (
      process.env.RECORD_APK_BUCKET_BASE ?? 'http://dx.jcw2.cn'
    ).replace(/\/+$/, '');

    const explicitFile =
      (release as any)?.apkFileName || (release as any)?.fileName;

    if (!latestVersion && !explicitFile) {
      throw new NotFoundException('release.json 缺少 version 或文件名信息');
    }

    const apkFileName = explicitFile ?? `record-${latestVersion}_anzhuo.apk`;
    const downloadUrl = `${bucketBase}/${apkFileName}`;

    if (isLatest) {
      return {
        isLatest: true,
        latestVersion,
        date,
        content,
        message: '已经是最新版本',
      };
    }

    return {
      isLatest: false,
      latestVersion,
      date,
      content,
      url: downloadUrl,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '注册用户',
    description: '传昵称和密码，返回分配的账号',
  })
  @ApiBody({ type: CreateUserDto, description: '注册请求体' })
  @ApiOkResponse({
    description: '注册成功',
    schema: {
      type: 'object',
      properties: {
        account: { type: 'integer', example: 10000000 },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '登录',
    description:
      '使用账号与密码登录，返回永不过期 token 和用户信息（不含密码）',
  })
  @ApiBody({ type: LoginUserDto, description: '登录请求体' })
  @ApiOkResponse({
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'eyJhbGciOi...' },
        id: { type: 'integer', example: 1 },
        account: { type: 'integer', example: 10000000 },
        nickname: { type: 'string', example: '张三' },
        avatar: {
          type: 'string',
          nullable: true,
          example: 'https://example.com/avatar.png',
        },
        isVip: { type: 'boolean', example: false },
        chatNum: { type: 'integer', example: 0 },
        registerTime: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-17T08:00:00.000Z',
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  login(@Body() dto: LoginUserDto) {
    return this.userService.login(dto);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建用户（同注册）' })
  @ApiOkResponse({ description: '创建成功' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有用户' })
  @ApiOkResponse({ description: '返回用户列表' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiOkResponse({ description: '返回用户详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新指定用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiOkResponse({ description: '更新成功' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除指定用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiOkResponse({ description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Post('nickname')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '修改昵称（根据 token 中的账号）',
    description: '从 Authorization Bearer token 中解析账号，根据账号更新昵称',
  })
  @ApiOkResponse({
    description: '修改成功',
    schema: {
      type: 'object',
      properties: {
        account: { type: 'integer', example: 10000000 },
        nickname: { type: 'string', example: '新的昵称' },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateNickname(
    @Req() req: Request,
    @Body()
    dto: {
      nickname: string;
    },
  ) {
    const auth = req.headers['authorization'];
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少或无效的授权信息');
    }
    let account: number | undefined;
    try {
      const token = auth.slice(7);
      const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString(
        'utf8',
      );
      const payload = JSON.parse(payloadStr);
      const acc = Number(payload?.account);
      if (Number.isInteger(acc) && acc > 0) {
        account = acc;
      }
    } catch {}
    if (!account) {
      throw new UnauthorizedException('无法解析 token 中的账号');
    }

    const nickname = String(dto?.nickname ?? '').trim();
    if (!nickname) {
      throw new BadRequestException('昵称不能为空');
    }

    return this.userService.updateNicknameByAccount(account, nickname);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '退出登录（根据 token 中的账号）' })
  @ApiOkResponse({
    description: '退出成功，登录数减 1（不小于 0）',
  })
  async logout(@Req() req: Request) {
    const auth = req.headers['authorization'];
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少或无效的授权信息');
    }
    let account: number | undefined;
    try {
      const token = auth.slice(7);
      const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString(
        'utf8',
      );
      const payload = JSON.parse(payloadStr);
      const acc = Number(payload?.account);
      if (Number.isInteger(acc) && acc > 0) {
        account = acc;
      }
    } catch {}
    if (!account) {
      throw new UnauthorizedException('无法解析 token 中的账号');
    }
    return this.userService.logoutByAccount(account);
  }
}
