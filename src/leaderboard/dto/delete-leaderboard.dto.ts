import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class DeleteLeaderboardDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsInt()
  @Min(1)
  userId: number;
}
