import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leaderboard } from './entities/leaderboard.entity';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { DeleteLeaderboardDto } from './dto/delete-leaderboard.dto';
import { SyncLeaderboardDto } from './dto/sync-leaderboard.dto';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private readonly repo: Repository<Leaderboard>,
  ) {}

  async create(dto: CreateLeaderboardDto) {
    if (!dto?.userId) {
      throw new BadRequestException('暂未登录');
    }

    const latestTime = dto.latestRecordTime
      ? new Date(dto.latestRecordTime)
      : null;

    const existed = await this.repo.findOne({ where: { userId: dto.userId } });
    if (existed) {
      const patch: Partial<Leaderboard> = {
        nickname: dto.nickname,
        recordCount: dto.recordCount,
        latestRecordTime: latestTime,
      };
      if (dto.avatar !== undefined) {
        patch.avatar = dto.avatar ?? null;
      }
      await this.repo.update({ userId: dto.userId }, patch);
    } else {
      const entityData: Partial<Leaderboard> = {
        userId: dto.userId,
        nickname: dto.nickname,
        recordCount: dto.recordCount,
        latestRecordTime: latestTime,
      };
      if (dto.avatar !== undefined) {
        entityData.avatar = dto.avatar ?? null;
      }
      const entity = this.repo.create(entityData);
      await this.repo.save(entity);
    }

    return this.repo.findOne({ where: { userId: dto.userId } });
  }

  async remove(dto: DeleteLeaderboardDto) {
    if (!dto?.userId) {
      throw new BadRequestException('暂未登录');
    }
    const res = await this.repo.delete({ userId: dto.userId });
    return { userId: dto.userId, deleted: !!res.affected };
  }

  async findAll() {
    return this.repo.find({
      order: { recordCount: 'DESC', latestRecordTime: 'DESC' },
    });
  }

  async syncRecordCount(dto: SyncLeaderboardDto) {
    if (!dto?.userId) {
      throw new BadRequestException('暂未登录');
    }
    const res = await this.repo.update(
      { userId: dto.userId },
      { recordCount: dto.recordCount },
    );
    return {
      userId: dto.userId,
      recordCount: dto.recordCount,
      updated: !!res.affected,
    };
  }
}
