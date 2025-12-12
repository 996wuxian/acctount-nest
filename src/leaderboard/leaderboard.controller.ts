import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { DeleteLeaderboardDto } from './dto/delete-leaderboard.dto';
import { SyncLeaderboardDto } from './dto/sync-leaderboard.dto';

@Controller('leaderboard')
@ApiTags('Leaderboard')
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建/更新排行榜记录（按 userId）' })
  @ApiBody({ type: CreateLeaderboardDto })
  @ApiOkResponse({
    description: '返回创建或更新后的记录，包含 status 和 data',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'integer', example: 200 },
        data: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 123 },
            avatar: { type: 'string' },
            nickname: { type: 'string', example: '测试用户' },
            recordCount: { type: 'integer', example: 5 },
            latestRecordTime: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() dto: CreateLeaderboardDto) {
    return this.service
      .create(dto)
      .then((data) => ({ status: HttpStatus.OK, data }));
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除排行榜记录（按 userId）' })
  @ApiBody({ type: DeleteLeaderboardDto })
  @ApiOkResponse({
    description: '返回删除结果，包含 status 和 data',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'integer', example: 200 },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'integer', example: 123 },
            deleted: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  remove(@Body() dto: DeleteLeaderboardDto) {
    return this.service
      .remove(dto)
      .then((data) => ({ status: HttpStatus.OK, data }));
  }

  @Get()
  @ApiOperation({ summary: '查询全部排行榜数据' })
  @ApiOkResponse({
    description: '返回排行榜记录数组，包含 status 和 data',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'integer', example: 200 },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              userId: { type: 'integer', example: 123 },
              avatar: { type: 'string' },
              nickname: { type: 'string', example: '测试用户' },
              recordCount: { type: 'integer', example: 5 },
              latestRecordTime: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
            },
          },
        },
      },
    },
  })
  findAll() {
    return this.service
      .findAll()
      .then((data) => ({ status: HttpStatus.OK, data }));
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据用户ID同步记录数' })
  @ApiBody({ type: SyncLeaderboardDto })
  @ApiOkResponse({
    description: '返回同步结果，包含 status 和 data',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'integer', example: 200 },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'integer', example: 123 },
            recordCount: { type: 'integer', example: 42 },
            updated: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  sync(@Body() dto: SyncLeaderboardDto) {
    return this.service
      .syncRecordCount(dto)
      .then((data) => ({ status: HttpStatus.OK, data }));
  }
}
