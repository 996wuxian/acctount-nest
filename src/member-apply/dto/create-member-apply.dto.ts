import { IsInt, Min, Matches, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMemberApplyDto {
  @ApiProperty({ description: '开通ID', example: 123 })
  @IsInt()
  @Min(1)
  openId: number;

  @ApiProperty({ description: '付款日期', example: '2025-12-01' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  payDate: string;

  @ApiProperty({ description: '付款时间', example: '09:30:00' })
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  payTime: string;

  @ApiProperty({
    description: '审核状态：0未审核，1已开通',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsIn([0, 1])
  status?: number;
}
