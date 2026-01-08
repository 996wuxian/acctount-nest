import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ description: 'The account number of the user to invite' })
  @IsNotEmpty()
  @IsNumber()
  account: number;
}
