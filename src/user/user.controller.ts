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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
