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

@Entity({ name: 'food_review' })
export class FoodReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_food_review_message')
  @Column({ type: 'int', unsigned: true, nullable: true })
  messageId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'int', unsigned: true, nullable: true })
  rating?: number | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => FoodReview, (review) => review.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: FoodReview | null;

  @OneToMany(() => FoodReview, (review) => review.parent)
  children?: FoodReview[];
}
