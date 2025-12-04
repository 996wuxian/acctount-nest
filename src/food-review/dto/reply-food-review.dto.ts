import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional, IsInt } from 'class-validator';

export class ReplyFoodReviewDto {
  @ApiProperty({
    description: '回复内容',
    example: '同意你的看法',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @Length(1, 1000)
  content: string;

  @ApiProperty({ description: '评论者用户ID', example: 1, required: false })
  @IsOptional()
  @IsInt()
  userId?: number;
}
