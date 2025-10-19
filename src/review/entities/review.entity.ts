import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_review_message')
  @Column({ type: 'int', unsigned: true, nullable: true })
  messageId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'int', unsigned: true, nullable: true })
  rating?: number | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string;

  @Column({ type: 'boolean', default: false })
  isBanned: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => Review, (review) => review.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Review | null;

  @OneToMany(() => Review, (review) => review.parent)
  children?: Review[];
}
