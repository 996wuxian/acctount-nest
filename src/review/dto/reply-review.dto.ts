import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ReplyReviewDto {
  @ApiProperty({
    description: '回复内容',
    example: '同意你的看法',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @Length(1, 1000)
  content: string;
}
