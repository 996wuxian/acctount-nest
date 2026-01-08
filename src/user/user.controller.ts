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
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ReplyInvitationDto } from './dto/reply-invitation.dto';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
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
  ApiBearerAuth,
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

  @Get('food-apk')
  @ApiOperation({
    summary: '获取美食 APP 最新 APK（返回储存桶 URL）',
    description:
      '读取 food-package/release.json，比对 ?version；一致返回“已是最新”；不一致返回储存桶下载 URL、最新版本、日期与更新内容',
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
          example: 'http://dx.jcw2.cn/food-2.9.0_anzhuo.apk',
        },
        message: { type: 'string', example: '已经是最新版本' },
      },
    },
  })
  @ApiQuery({ name: 'version', required: false, description: '客户端当前版本' })
  foodApk(
    @Req() req: Request,
    @Query('version') version?: string,
  ): Record<string, any> {
    const assetsDir = path.resolve(__dirname, '../../food-package');
    const releasePath = path.join(assetsDir, 'release.json');

    if (!existsSync(releasePath)) {
      throw new NotFoundException(
        '缺少 food-package/release.json，无法确定 APK 版本',
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
      throw new NotFoundException('food-package/release.json 格式错误');
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
      process.env.FOOD_APK_BUCKET_BASE ?? 'http://dx.jcw2.cn'
    ).replace(/\/+$/, '');

    const explicitFile =
      (release as any)?.apkFileName || (release as any)?.fileName;

    if (!latestVersion && !explicitFile) {
      throw new NotFoundException('release.json 缺少 version 或文件名信息');
    }

    const apkFileName = explicitFile ?? `food-${latestVersion}_anzhuo.apk`;
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

  private getClientIp(req: any): string | undefined {
    const forwarded = (req.headers['x-forwarded-for'] as string) || '';
    const ip = forwarded.split(',')[0]?.trim();
    return (
      ip ||
      (req.ip as string) ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress
    );
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
  register(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const ip = this.getClientIp(req);
    return this.userService.register(createUserDto, ip);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建用户（同注册）' })
  @ApiOkResponse({ description: '创建成功' })
  create(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const ip = this.getClientIp(req);
    return this.userService.register(createUserDto, ip);
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
        isJbVip: { type: 'boolean', example: false },
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

  @Post('relation/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '邀请用户建立美食关联' })
  @ApiBody({ type: InviteUserDto })
  @ApiOkResponse({ description: '邀请发送成功' })
  inviteUser(@Req() req: any, @Body() dto: InviteUserDto) {
    const userId = req.user.sub;
    return this.userService.inviteUser(userId, dto);
  }

  @Get('relation/received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询我收到的邀请' })
  @ApiOkResponse({ description: '返回收到的邀请列表' })
  getReceivedInvitations(@Req() req: any) {
    const userId = req.user.sub;
    return this.userService.getReceivedInvitations(userId);
  }

  @Get('relation/sent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询我发送的邀请' })
  @ApiOkResponse({ description: '返回发送的邀请列表' })
  getSentInvitations(@Req() req: any) {
    const userId = req.user.sub;
    return this.userService.getSentInvitations(userId);
  }

  @Post('relation/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '回复邀请（同意/拒绝）' })
  @ApiBody({ type: ReplyInvitationDto })
  @ApiOkResponse({ description: '操作成功' })
  replyInvitation(@Req() req: any, @Body() dto: ReplyInvitationDto) {
    const userId = req.user.sub;
    return this.userService.replyInvitation(userId, dto);
  }

  @Delete('relation/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '解除关联关系' })
  @ApiParam({ name: 'id', description: '关联记录ID', example: 1 })
  @ApiOkResponse({ description: '解除成功' })
  removeRelation(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    return this.userService.removeRelation(userId, id);
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
