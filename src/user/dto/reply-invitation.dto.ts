import { IsNotEmpty, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRelationStatus } from '../entities/user-relation.entity';

export class ReplyInvitationDto {
  @ApiProperty({ description: 'The ID of the invitation relation' })
  @IsNotEmpty()
  @IsNumber()
  relationId: number;

  @ApiProperty({
    description: 'Status to set: 1 for ACCEPTED, 2 for REJECTED',
    enum: UserRelationStatus,
  })
  @IsNotEmpty()
  @IsEnum(UserRelationStatus)
  status: UserRelationStatus;
}
