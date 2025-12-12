import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Length,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateLeaderboardDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({
    description: '头像（base64）',
    example: 'data:image/png;base64,iVBORw0KGgo...',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: '昵称', example: '小明' })
  @IsString()
  @Length(2, 64)
  nickname: string;

  @ApiProperty({ description: '记录数', example: 10 })
  @IsInt()
  @Min(0)
  recordCount: number;

  @ApiProperty({
    description: '最近记录时间（ISO 字符串）',
    example: '2025-12-01T10:20:30.000Z',
  })
  @IsDateString()
  latestRecordTime: string;
}
