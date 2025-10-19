import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { User } from '../user/entities/user.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../core/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, User]),
    JwtModule.register({
      // 与用户登录使用的 secret 保持一致
      secret: 'never-expire-token-secret',
    }),
  ],
  controllers: [ReviewController],
  providers: [ReviewService, JwtAuthGuard],
})
export class ReviewModule {}
