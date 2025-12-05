import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberApply } from './entities/member-apply.entity';
import { MemberApplyService } from './member-apply.service';
import { MemberApplyController } from './member-apply.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MemberApply])],
  controllers: [MemberApplyController],
  providers: [MemberApplyService],
})
export class MemberApplyModule {}
