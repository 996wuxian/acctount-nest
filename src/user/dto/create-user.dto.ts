import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '昵称',
    minLength: 2,
    maxLength: 64,
    example: '张三',
  })
  @IsString()
  @Length(2, 64)
  nickname: string;

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
