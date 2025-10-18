import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = this.userRepo.create({
      nickname: createUserDto.nickname,
      password: createUserDto.password,
      isVip: false,
    });
    const saved = await this.userRepo.save(user);
    const base = 10000000;
    const account = base + saved.id - 1;
    await this.userRepo.update(saved.id, { account });
    return { account };
  }

  async login(dto: LoginUserDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.account = :account', { account: dto.account })
      .getOne();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.password !== dto.password) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      account: user.account,
    });

    const { password, ...safeUser } = user as any;
    return { token, ...safeUser };
  }

  create(createUserDto: CreateUserDto) {
    return this.register(createUserDto);
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    console.log('🚀 ~ UserService ~ update ~ updateUserDto:', updateUserDto);
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
