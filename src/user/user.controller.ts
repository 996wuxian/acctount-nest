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
  StreamableFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Request } from 'express';
import * as path from 'path';
import { existsSync, readFileSync, createReadStream } from 'fs';

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
    summary: 'APK 下载/地址（含版本判断）',
    description:
      '读取 package/release.json，比对 ?version；一致返回“已是最新”，并给出日期与更新内容；不一致返回下载 URL、最新版本、日期与更新内容；携带 ?download=1 直接下载最新版。',
  })
  @ApiOkResponse({
    description: '返回下载地址或直接下载文件',
    schema: {
      type: 'object',
      properties: {
        isLatest: { type: 'boolean', example: false },
        latestVersion: { type: 'string', example: '2.8.0' },
        date: { type: 'string', example: '2025-10-21' },
        content: { type: 'array', items: { type: 'string' } },
        url: {
          type: 'string',
          example: 'http://localhost:3000/user/apk?download=1',
        },
        message: { type: 'string', example: '已经是最新版本' },
      },
    },
  })
  @ApiQuery({ name: 'version', required: false, description: '客户端当前版本' })
  @ApiQuery({
    name: 'download',
    required: false,
    description: '为 1 时直接下载',
  })
  apk(
    @Req() req: Request,
    @Query('download') download?: string,
    @Query('version') version?: string,
  ): StreamableFile | Record<string, any> {
    const releasePath = path.resolve(process.cwd(), 'package', 'release.json');
    if (!existsSync(releasePath)) {
      throw new NotFoundException('缺少 release.json，无法确定 APK 版本');
    }

    let release: { version: string; date?: string; content?: string[] };
    try {
      release = JSON.parse(readFileSync(releasePath, 'utf8'));
    } catch {
      throw new NotFoundException('release.json 格式错误');
    }

    const latestVersion = release.version?.trim();
    const date = release.date ?? null;
    const content = Array.isArray(release.content) ? release.content : [];

    const apkFileName = `suixinji-${latestVersion}_anzhuo.apk`;
    const filePath = path.resolve(process.cwd(), 'package', apkFileName);

    // 标准化版本，用于健壮比较
    const normalizeVersion = (v?: string) =>
      String(v ?? '')
        .trim()
        .replace(/^v/i, ''); // 去掉前缀 v/V

    // 兼容不同参数名：version / v / ver
    const clientVersionRaw =
      version ??
      (req.query['v'] as string | undefined) ??
      (req.query['ver'] as string | undefined);

    const clientVersion = normalizeVersion(clientVersionRaw);
    const latestVersionNorm = normalizeVersion(latestVersion);

    if (download === '1') {
      if (!existsSync(filePath)) {
        throw new NotFoundException('APK 文件不存在');
      }
      return new StreamableFile(createReadStream(filePath), {
        type: 'application/vnd.android.package-archive',
        disposition: `attachment; filename="${apkFileName}"`,
      });
    }

    const isLatest = !!latestVersionNorm && clientVersion === latestVersionNorm;
    if (isLatest) {
      return {
        isLatest: true,
        latestVersion,
        date,
        content,
        message: '已经是最新版本',
      };
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/user/apk?download=1`;
    return { isLatest: false, latestVersion, date, content, url };
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
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新指定用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiOkResponse({ description: '更新成功' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除指定用户' })
  @ApiParam({ name: 'id', description: '用户ID', example: 1 })
  @ApiOkResponse({ description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @Get('apk/download')
  @ApiOperation({
    summary: '下载 APK',
    description: '直接返回最新版 APK 文件进行下载（基于 release.json）',
  })
  @ApiOkResponse({
    description: 'APK 二进制文件',
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  downloadApk(): StreamableFile {
    const releasePath = path.resolve(process.cwd(), 'package', 'release.json');
    if (!existsSync(releasePath)) {
      throw new NotFoundException('缺少 release.json，无法确定 APK 版本');
    }

    let release: { version: string };
    try {
      release = JSON.parse(readFileSync(releasePath, 'utf8'));
    } catch {
      throw new NotFoundException('release.json 格式错误');
    }

    const latestVersion = release.version?.trim();
    const apkFileName = `suixinji-${latestVersion}_anzhuo.apk`;
    const filePath = path.resolve(process.cwd(), 'package', apkFileName);

    if (!existsSync(filePath)) {
      throw new NotFoundException('APK 文件不存在');
    }

    return new StreamableFile(createReadStream(filePath), {
      type: 'application/vnd.android.package-archive',
      disposition: `attachment; filename="${apkFileName}"`,
    });
  }
}
