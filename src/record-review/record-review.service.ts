import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordReview } from './entities/record-review.entity';
import { CreateRecordReviewDto } from './dto/create-record-review.dto';
import { ReplyRecordReviewDto } from './dto/reply-record-review.dto';

@Injectable()
export class RecordReviewService {
  constructor(
    @InjectRepository(RecordReview)
    private readonly repo: Repository<RecordReview>,
  ) {}

  async create(dto: CreateRecordReviewDto, ip?: string) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('评分必须在 1 到 5 之间');
    }
    const review = this.repo.create({
      rating: dto.rating,
      content: dto.content,
      ip: ip?.trim().slice(0, 45) || null,
    });
    const saved = await this.repo.save(review);
    await this.repo.update(saved.id, { messageId: saved.id });
    return this.repo.findOne({
      where: { id: saved.id },
      relations: ['children'],
    });
  }

  async reply(dto: ReplyRecordReviewDto, parentId: number, ip?: string) {
    const parent = await this.repo.findOne({
      where: { id: parentId },
      relations: ['parent'],
    });
    if (!parent) {
      throw new NotFoundException('父评价不存在');
    }
    if (parent.parent) {
      throw new BadRequestException('只允许回复根评价，不能对回复继续回复');
    }
    const reply = this.repo.create({
      messageId: parent.messageId,
      content: dto.content,
      parent,
      rating: null,
      ip: ip?.trim().slice(0, 45) || null,
    });
    return this.repo.save(reply);
  }

  async findByMessage(messageId: number) {
    return this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.children', 'c')
      .where('r.messageId = :messageId', { messageId })
      .andWhere('r.parent_id IS NULL')
      .orderBy('r.created_at', 'ASC')
      .addOrderBy('c.created_at', 'ASC')
      .getMany();
  }

  async findAllMessages() {
    return this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.children', 'c')
      .where('r.parent_id IS NULL')
      .orderBy('r.created_at', 'ASC')
      .addOrderBy('c.created_at', 'ASC')
      .getMany();
  }

  async findOne(id: number) {
    const review = await this.repo
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
    const exists = await this.repo.findOne({ where: { id: messageId } });
    if (!exists) {
      throw new NotFoundException('消息不存在');
    }
    const res = await this.repo.delete({ messageId });
    return { deletedCount: res.affected ?? 0 };
  }
}
