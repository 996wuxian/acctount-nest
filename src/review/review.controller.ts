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
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/jwt-auth.guard';

@Controller('review')
@ApiTags('Review')
@ApiBearerAuth()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':parentId/reply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '回复评价（仅一级）',
    description: '仅允许回复根评价（不可对回复再回复），只需消息内容',
  })
  @ApiParam({
    name: 'parentId',
    description: '父评价ID（必须为根评价）',
    example: 10,
  })
  @ApiBody({ type: ReplyReviewDto })
  @ApiOkResponse({ description: '回复成功，返回回复对象' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  reply(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Body() dto: ReplyReviewDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? req.user?.id ?? req.user?.userId;
    const ip = this.getClientIp(req);
    return this.reviewService.reply(dto, userId, parentId, ip);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '创建评价（根评价）',
    description: '无需消息ID，系统会将该评价的 id 作为 messageId',
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiOkResponse({ description: '创建成功，返回评价对象' })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() dto: CreateReviewDto, @Req() req: any) {
    const userId = req.user?.sub ?? req.user?.id ?? req.user?.userId;
    const ip = this.getClientIp(req);
    return this.reviewService.create(dto, userId, ip);
  }

  @Get('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '获取全部消息（根评价线程）',
    description: '返回所有根评价及其直接回复',
  })
  @ApiOkResponse({ description: '查询成功' })
  findAllMessages() {
    return this.reviewService.findAllMessages();
  }

  @Get('message/:messageId')
  @ApiOperation({
    summary: '按消息查询评价列表',
    description: '返回该消息的所有根评价及其直接回复',
  })
  @ApiParam({ name: 'messageId', description: '消息ID', example: 1001 })
  @ApiOkResponse({ description: '查询成功' })
  findByMessage(@Param('messageId', ParseIntPipe) messageId: number) {
    return this.reviewService.findByMessage(messageId);
  }

  @Get(':id')
  @ApiOperation({ summary: '评价详情', description: '包含该评价的直接回复' })
  @ApiParam({ name: 'id', description: '评价ID', example: 1 })
  @ApiOkResponse({ description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.findOne(id);
  }

  @Delete('message/:messageId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除消息（整条评价线程）',
    description: '按 messageId 删除根评价及其直接回复',
  })
  @ApiParam({
    name: 'messageId',
    description: '消息ID（根评价的 id）',
    example: 1001,
  })
  @ApiOkResponse({ description: '删除成功' })
  deleteMessage(@Param('messageId', ParseIntPipe) messageId: number) {
    return this.reviewService.deleteMessage(messageId);
  }
  private getClientIp(req: any): string | undefined {
    const forwarded = (req.headers['x-forwarded-for'] as string) || '';
    const ip = forwarded.split(',')[0]?.trim();
    return (
      ip || req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress
    );
  }
}
