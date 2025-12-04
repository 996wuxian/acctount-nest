import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodReview } from './entities/food-review.entity';
import { FoodReviewService } from './food-review.service';
import { FoodReviewController } from './food-review.controller';
import { User } from '../user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../core/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoodReview, User]),
    JwtModule.register({
      secret: 'never-expire-token-secret',
    }),
  ],
  controllers: [FoodReviewController],
  providers: [FoodReviewService, JwtAuthGuard],
})
export class FoodReviewModule {}
