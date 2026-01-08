import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum UserRelationStatus {
  PENDING = 0,
  ACCEPTED = 1,
  REJECTED = 2,
}

@Entity()
export class UserRelation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'inviter_id' })
  inviterId: number;

  @Column({ name: 'invitee_id' })
  inviteeId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviter_id' })
  inviter: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitee_id' })
  invitee: User;

  @Column({
    type: 'enum',
    enum: UserRelationStatus,
    default: UserRelationStatus.PENDING,
    comment: '0: pending, 1: accepted, 2: rejected',
  })
  status: UserRelationStatus;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;

  @UpdateDateColumn({ name: 'update_time' })
  updateTime: Date;
}
