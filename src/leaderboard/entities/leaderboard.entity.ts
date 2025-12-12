import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'leaderboard' })
export class Leaderboard {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'int', unsigned: true })
  userId: number;

  @Column({ type: 'longtext', nullable: true })
  avatar?: string | null;

  @Column({ type: 'varchar', length: 64 })
  nickname: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  recordCount: number;

  @Index('idx_leaderboard_latest_time')
  @Column({ type: 'datetime', nullable: true })
  latestRecordTime: Date | null;
}
