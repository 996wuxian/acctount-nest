import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
  ) {}

  async create(dto: CreateReviewDto, userId: number, ip?: string) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('评分必须在 1 到 5 之间');
    }

    if (ip) {
      const bannedCount = await this.reviewRepo.count({
        where: { ip, isBanned: true },
      });
      if (bannedCount > 0) {
        throw new ForbiddenException('该IP已被封禁，无法评论');
      }
    }

    const review = this.reviewRepo.create({
      userId,
      rating: dto.rating,
      content: dto.content,
      ip,
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

    if (ip) {
      const bannedCount = await this.reviewRepo.count({
        where: { ip, isBanned: true },
      });
      if (bannedCount > 0) {
        throw new ForbiddenException('该IP已被封禁，无法评论');
      }
    }

    const reply = this.reviewRepo.create({
      messageId: parent.messageId,
      userId,
      content: dto.content,
      parent,
      ip,
    });
    return this.reviewRepo.save(reply);
  }

  async findByMessage(messageId: number) {
    return this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.children', 'c')
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
      .where('r.parent_id IS NULL')
      .orderBy('r.created_at', 'ASC')
      .addOrderBy('c.created_at', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    const review = await this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.children', 'c')
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
