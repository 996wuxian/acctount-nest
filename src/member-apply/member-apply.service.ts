import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberApply } from './entities/member-apply.entity';
import { CreateMemberApplyDto } from './dto/create-member-apply.dto';

@Injectable()
export class MemberApplyService {
  constructor(
    @InjectRepository(MemberApply)
    private readonly repo: Repository<MemberApply>,
  ) {}

  async create(dto: CreateMemberApplyDto) {
    const openId = Number(dto.openId);
    if (!Number.isInteger(openId) || openId <= 0) {
      throw new Error('开通ID格式不正确');
    }
    const entity = this.repo.create({
      openId,
      payDate: dto.payDate,
      payTime: dto.payTime.length === 5 ? `${dto.payTime}:00` : dto.payTime,
      status: dto.status ?? 0,
    });
    return this.repo.save(entity);
  }

  async findByOpenId(openIdParam: number) {
    const openId = Number(openIdParam);
    if (!Number.isInteger(openId) || openId <= 0) {
      throw new Error('开通ID格式不正确');
    }
    return this.repo
      .createQueryBuilder('m')
      .where('m.openId = :openId', { openId })
      .orderBy('m.payDate', 'DESC')
      .addOrderBy('m.payTime', 'DESC')
      .getMany();
  }
}
