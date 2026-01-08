import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  UserRelation,
  UserRelationStatus,
} from './entities/user-relation.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ReplyInvitationDto } from './dto/reply-invitation.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserRelation)
    private readonly relationRepo: Repository<UserRelation>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto, ip?: string) {
    const ipSafe =
      typeof ip === 'string' && ip.trim() ? ip.trim().slice(0, 45) : null;

    if (ipSafe) {
      const count = await this.userRepo.count({ where: { ip: ipSafe } });
      if (count >= 2) {
        throw new HttpException(
          '请不要频繁注册。',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 第一步：插入用户，仅含必填字段
    const insertResult = await this.userRepo.insert({
      nickname: createUserDto.nickname,
      password: createUserDto.password,
      isVip: false,
      isJbVip: false,
      ip: ipSafe,
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

    // 设备登录数限制：已达 3 则拒绝登录
    if ((user.loginCount ?? 0) >= 3) {
      throw new UnauthorizedException('登录设备过多，请退出一些设备后登录');
    }
    // 成功登录则自增登录数
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ loginCount: () => 'loginCount + 1' })
      .where('id = :id', { id: user.id })
      .execute();

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

  async updateNicknameByAccount(account: number, nickname: string) {
    const acc = Number(account);
    if (!Number.isInteger(acc) || acc <= 0) {
      throw new Error('账号格式不正确');
    }
    const name = String(nickname ?? '').trim();
    if (!name) {
      throw new Error('昵称不能为空');
    }

    const result = await this.userRepo.update(
      { account: acc },
      { nickname: name },
    );
    if (!result.affected || result.affected < 1) {
      throw new NotFoundException('用户不存在');
    }

    return { account: acc, nickname: name };
  }

  async logoutByAccount(account: number) {
    const acc = Number(account);
    if (!Number.isInteger(acc) || acc <= 0) {
      throw new UnauthorizedException('账号格式不正确');
    }
    const user = await this.userRepo.findOne({ where: { account: acc } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const next = Math.max(0, (user.loginCount ?? 0) - 1);
    await this.userRepo.update({ id: user.id }, { loginCount: next });
    return { account: acc, loginCount: next };
  }

  async inviteUser(inviterId: number, dto: InviteUserDto) {
    const targetAccount = Number(dto.account);
    const targetUser = await this.userRepo.findOne({
      where: { account: targetAccount },
    });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }
    if (targetUser.id === inviterId) {
      throw new HttpException('不能邀请自己', HttpStatus.BAD_REQUEST);
    }

    const existing = await this.relationRepo.findOne({
      where: [
        { inviterId, inviteeId: targetUser.id },
        { inviterId: targetUser.id, inviteeId: inviterId },
      ],
    });

    if (existing) {
      if (existing.status === UserRelationStatus.ACCEPTED) {
        throw new HttpException('已经是好友关系', HttpStatus.BAD_REQUEST);
      }
      if (existing.status === UserRelationStatus.PENDING) {
        throw new HttpException(
          '邀请已发送或对方已邀请您',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Re-activate rejected invitation
      existing.status = UserRelationStatus.PENDING;
      existing.inviterId = inviterId;
      existing.inviteeId = targetUser.id;
      return await this.relationRepo.save(existing);
    }

    const relation = this.relationRepo.create({
      inviterId,
      inviteeId: targetUser.id,
      status: UserRelationStatus.PENDING,
    });
    return await this.relationRepo.save(relation);
  }

  async getReceivedInvitations(userId: number) {
    return await this.relationRepo.find({
      where: { inviteeId: userId },
      relations: ['inviter'],
      order: { createTime: 'DESC' },
    });
  }

  async getSentInvitations(userId: number) {
    return await this.relationRepo.find({
      where: { inviterId: userId },
      relations: ['invitee'],
      order: { createTime: 'DESC' },
    });
  }

  async replyInvitation(userId: number, dto: ReplyInvitationDto) {
    // Check if user already has an accepted relation before accepting
    if (dto.status === UserRelationStatus.ACCEPTED) {
      const myRelation = await this.relationRepo.findOne({
        where: [
          { inviterId: userId, status: UserRelationStatus.ACCEPTED },
          { inviteeId: userId, status: UserRelationStatus.ACCEPTED },
        ],
      });
      if (myRelation) {
        throw new HttpException(
          '您已有关联用户，不能接受邀请',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const relation = await this.relationRepo.findOne({
      where: { id: dto.relationId, inviteeId: userId },
    });
    if (!relation) {
      throw new NotFoundException('邀请记录不存在');
    }
    if (relation.status !== UserRelationStatus.PENDING) {
      throw new HttpException('该邀请已被处理', HttpStatus.BAD_REQUEST);
    }

    // Double check if the inviter has an accepted relation
    if (dto.status === UserRelationStatus.ACCEPTED) {
      const inviterRelation = await this.relationRepo.findOne({
        where: [
          {
            inviterId: relation.inviterId,
            status: UserRelationStatus.ACCEPTED,
          },
          {
            inviteeId: relation.inviterId,
            status: UserRelationStatus.ACCEPTED,
          },
        ],
      });
      if (inviterRelation) {
        throw new HttpException(
          '对方已有关联用户，无法建立关联',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    relation.status = dto.status;
    return await this.relationRepo.save(relation);
  }

  async removeRelation(userId: number, relationId: number) {
    const relation = await this.relationRepo.findOne({
      where: [
        {
          id: relationId,
          inviterId: userId,
          status: UserRelationStatus.ACCEPTED,
        },
        {
          id: relationId,
          inviteeId: userId,
          status: UserRelationStatus.ACCEPTED,
        },
      ],
    });

    if (!relation) {
      throw new NotFoundException('关联关系不存在');
    }

    return await this.relationRepo.remove(relation);
  }
}
