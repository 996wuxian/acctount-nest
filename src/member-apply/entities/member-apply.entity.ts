import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class MemberApply {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_member_apply_open_id')
  @Column({ type: 'int', unsigned: true })
  openId: number;

  @Column({ type: 'date' })
  payDate: string;

  @Column({ type: 'time' })
  payTime: string;

  @Column({ type: 'tinyint', default: 0 })
  status: number;
}

