import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateReviewDto, userId: number, ip?: string) {
    if (userId == null) {
      throw new UnauthorizedException('用户未认证或令牌不包含用户ID');
    }
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('评分必须在 1 到 5 之间');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在或未认证');
    }
    if (user.isBanned) {
      throw new ForbiddenException('该用户已被封禁，无法评论');
    }
    if (ip && user.ip !== ip) {
      await this.userRepo.update(user.id, { ip });
    }

    const review = this.reviewRepo.create({
      user: { id: userId } as any,
      rating: dto.rating,
      content: dto.content,
    });
    const saved = await this.reviewRepo.save(review);
    await this.reviewRepo.update(saved.id, { messageId: saved.id });
    return this.reviewRepo.findOne({ where: { id: saved.id } });
  }

  async reply(
    dto: ReplyReviewDto,
    userId: number,
    parentId: number,
    ip?: string,
  ) {
    if (userId == null) {
      throw new UnauthorizedException('用户未认证或令牌不包含用户ID');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在或未认证');
    }
    if (user.isBanned) {
      throw new ForbiddenException('该用户已被封禁，无法评论');
    }
    if (ip && user.ip !== ip) {
      await this.userRepo.update(user.id, { ip });
    }

    const parent = await this.reviewRepo.findOne({
      where: { id: parentId },
      relations: ['parent'],
    });
    if (!parent) {
      throw new NotFoundException('父评价不存在');
    }
    if (parent.parent) {
      throw new BadRequestException('只允许回复根评价，不能对回复继续回复');
    }

    const reply = this.reviewRepo.create({
      messageId: parent.messageId,
      user: { id: userId } as any,
      content: dto.content,
      parent,
      // 回复不需要评分
      rating: null,
    });
    return this.reviewRepo.save(reply);
  }

  async findByMessage(messageId: number) {
    return this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.children', 'c')
      .leftJoinAndSelect('r.user', 'ru')
      .leftJoinAndSelect('c.user', 'cu')
      .where('r.messageId = :messageId', { messageId })
      .andWhere('r.parent_id IS NULL')
      .orderBy('r.created_at', 'ASC')
      .addOrderBy('c.created_at', 'ASC')
      .getMany();
  }

  async findAllMessages() {
    return this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.children', 'c')
      .leftJoinAndSelect('r.user', 'ru')
      .leftJoinAndSelect('c.user', 'cu')
      .where('r.parent_id IS NULL')
      .orderBy('r.created_at', 'ASC')
      .addOrderBy('c.created_at', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    const review = await this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.children', 'c')
      .leftJoinAndSelect('r.user', 'ru')
      .leftJoinAndSelect('c.user', 'cu')
      .where('r.id = :id', { id })
      .orderBy('c.created_at', 'ASC')
      .getOne();

    if (!review) {
      throw new NotFoundException('评价不存在');
    }
    return review;
  }

  async deleteMessage(messageId: number) {
    const exists = await this.reviewRepo.findOne({ where: { id: messageId } });
    if (!exists) {
      throw new NotFoundException('消息不存在');
    }
    const res = await this.reviewRepo.delete({ messageId });
    return { deletedCount: res.affected ?? 0 };
  }
}
