import { IsInt, Min, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginUserDto {
  @ApiProperty({
    description: '账号（从 10000000 起）',
    minimum: 10000000,
    example: 10000000,
  })
  @IsInt()
  @Min(10000000)
  account: number;

  @ApiProperty({
    description: '密码',
    minLength: 6,
    maxLength: 128,
    example: 'secret123',
  })
  @IsString()
  @Length(6, 128)
  password: string;
}
