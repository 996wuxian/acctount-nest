import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordReview } from './entities/record-review.entity';
import { RecordReviewService } from './record-review.service';
import { RecordReviewController } from './record-review.controller';
import { User } from '../user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../core/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecordReview, User]),
    JwtModule.register({
      // 与登录使用的 secret 保持一致
      secret: 'never-expire-token-secret',
    }),
  ],
  controllers: [RecordReviewController],
  providers: [RecordReviewService, JwtAuthGuard],
})
export class RecordReviewModule {}
