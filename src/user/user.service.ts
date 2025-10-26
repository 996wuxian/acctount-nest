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
    // 第一步：插入用户，仅含必填字段
    const insertResult = await this.userRepo.insert({
      nickname: createUserDto.nickname,
      password: createUserDto.password,
      isVip: false,
    });

    // 可靠获取新用户 id（兼容不同驱动）
    const idCandidate =
      (insertResult.identifiers?.[0]?.id as number | undefined) ??
      (insertResult.raw?.insertId as number | undefined);

    const id = Number(idCandidate);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('注册失败：无法获取有效的用户ID');
    }

    // 第二步：计算并更新账号
    const base = 10000000;
    const account = base + id - 1;

    await this.userRepo.update(id, { account });

    // 返回分配的账号
    return { account };
  }

  async login(dto: LoginUserDto) {
    // 显式数值校验，杜绝 NaN 进入 SQL
    const accountNum = Number(dto.account);
    if (!Number.isInteger(accountNum) || accountNum <= 0) {
      throw new Error('账号格式不正确');
    }

    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.account = :account', { account: accountNum })
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
