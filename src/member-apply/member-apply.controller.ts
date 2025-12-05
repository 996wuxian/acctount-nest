import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { MemberApplyService } from './member-apply.service';
import { CreateMemberApplyDto } from './dto/create-member-apply.dto';

@Controller('member-apply')
@ApiTags('MemberApply')
export class MemberApplyController {
  constructor(private readonly service: MemberApplyService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建会员申请记录' })
  @ApiBody({ type: CreateMemberApplyDto })
  @ApiOkResponse({
    description: '创建成功，返回记录',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        openId: { type: 'integer', example: 123 },
        payDate: { type: 'string', example: '2025-12-01' },
        payTime: { type: 'string', example: '09:30:00' },
        status: { type: 'integer', example: 0 },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() dto: CreateMemberApplyDto) {
    return this.service.create(dto);
  }

  @Get('open/:openId')
  @ApiOperation({ summary: '根据开通ID查询记录' })
  @ApiParam({ name: 'openId', description: '开通ID', example: 123 })
  @ApiOkResponse({
    description: '返回匹配的记录列表',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          openId: { type: 'integer', example: 123 },
          payDate: { type: 'string', example: '2025-12-01' },
          payTime: { type: 'string', example: '11:05:00' },
          status: { type: 'integer', example: 1 },
        },
      },
    },
  })
  findByOpenId(@Param('openId', ParseIntPipe) openId: number) {
    return this.service.findByOpenId(openId);
  }
}
