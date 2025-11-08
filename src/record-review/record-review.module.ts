import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordReview } from './entities/record-review.entity';
import { RecordReviewService } from './record-review.service';
import { RecordReviewController } from './record-review.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecordReview])],
  controllers: [RecordReviewController],
  providers: [RecordReviewService],
})
export class RecordReviewModule {}
