import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Req,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { isIpBlacklisted } from '../utils/ip-blacklist';
import { RecordReviewService } from './record-review.service';
import { CreateRecordReviewDto } from './dto/create-record-review.dto';
import { ReplyRecordReviewDto } from './dto/reply-record-review.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('record-review')
@ApiTags('RecordReview')
export class RecordReviewController {
  constructor(
    private readonly service: RecordReviewService,
    private readonly jwtService: JwtService,
  ) {}

  @Post(':parentId/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '回复评价（仅一级，record-review 独立表）',
    description: '仅允许回复根评价（不可对回复再回复），只需消息内容',
  })
  @ApiParam({ name: 'parentId', description: '父评价ID', example: 10 })
  @ApiBody({ type: ReplyRecordReviewDto })
  @ApiOkResponse({ description: '回复成功' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  reply(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Body() dto: ReplyRecordReviewDto,
    @Req() req: any,
  ) {
    const ip = this.getClientIp(req);
    if (ip && isIpBlacklisted(ip)) {
      throw new ForbiddenException('您的留言功能已被封禁');
    }
    const userId = this.tryGetUserId(req);
    return this.service.reply(dto, parentId, ip, userId);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '创建评价（record-review 根评价）',
    description: '无需消息ID，系统将该评价的 id 作为 messageId',
  })
  @ApiBody({ type: CreateRecordReviewDto })
  @ApiOkResponse({ description: '创建成功' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() dto: CreateRecordReviewDto, @Req() req: any) {
    const ip = this.getClientIp(req);
    if (ip && isIpBlacklisted(ip)) {
      throw new ForbiddenException('您的留言功能已被封禁');
    }
    const userId = this.tryGetUserId(req);
    return this.service.create(dto, ip, userId);
  }

  @Get('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '获取全部消息（record-review 根评价线程）',
    description: '返回所有根评价及其直接回复',
  })
  @ApiOkResponse({ description: '查询成功' })
  findAllMessages() {
    return this.service.findAllMessages();
  }

  @Get('message/:messageId')
  @ApiOperation({
    summary: '按消息查询评价列表（record-review）',
    description: '返回该消息的所有根评价及其直接回复',
  })
  @ApiParam({ name: 'messageId', description: '消息ID', example: 1001 })
  @ApiOkResponse({ description: '查询成功' })
  findByMessage(@Param('messageId', ParseIntPipe) messageId: number) {
    return this.service.findByMessage(messageId);
  }

  @Get(':id')
  @ApiOperation({
    summary: '评价详情（record-review）',
    description: '包含该评价的直接回复',
  })
  @ApiParam({ name: 'id', description: '评价ID', example: 1 })
  @ApiOkResponse({ description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete('message/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除消息（record-review 整条评价线程）',
    description: '按 messageId 删除根评价及其直接回复',
  })
  @ApiParam({
    name: 'messageId',
    description: '消息ID（根评价的 id）',
    example: 1001,
  })
  @ApiOkResponse({ description: '删除成功' })
  deleteMessage(@Param('messageId', ParseIntPipe) messageId: number) {
    return this.service.deleteMessage(messageId);
  }

  private getClientIp(req: any): string | undefined {
    const forwarded = (req.headers['x-forwarded-for'] as string) || '';
    const ip = forwarded.split(',')[0]?.trim();
    return (
      ip || req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress
    );
  }

  private tryGetUserId(req: any): number | undefined {
    const auth = req.headers?.authorization as string | undefined;
    if (!auth) return undefined;
    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token) return undefined;
    try {
      const payload: any = this.jwtService.verify(token); // 使用 JwtModule.register 的 secret
      const id = payload?.sub ?? payload?.id ?? payload?.userId;
      return typeof id === 'number' ? id : Number(id) || undefined;
    } catch {
      // token 无效/过期，按游客处理
      return undefined;
    }
  }
}
