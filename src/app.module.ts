import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ReviewModule } from './review/review.module';
import { ExportModule } from './export/export.module';
import { RecordReviewModule } from './record-review/record-review.module';
import { FoodReviewModule } from './food-review/food-review.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'wuxian',
      database: 'accounting_db',
      // entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      retryDelay: 500,
      retryAttempts: 10,
      autoLoadEntities: true,
    }),
    UserModule,
    ReviewModule,
    ExportModule,
    RecordReviewModule,
    FoodReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
