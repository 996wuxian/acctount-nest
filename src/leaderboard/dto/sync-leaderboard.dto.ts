import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SyncLeaderboardDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ description: '同步后的记录数', example: 42 })
  @IsInt()
  @Min(0)
  recordCount: number;
}

