import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      // 生产环境请用环境变量注入更安全的 SECRET
      secret: 'never-expire-token-secret',
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
