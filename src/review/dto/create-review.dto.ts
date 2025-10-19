import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: '评分(1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: '评价内容',
    example: '非常不错！',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString()
  @Length(1, 1000)
  content: string;
}
