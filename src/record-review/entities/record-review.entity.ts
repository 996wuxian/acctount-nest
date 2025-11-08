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

@Entity({ name: 'record_review' })
export class RecordReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_record_review_message')
  @Column({ type: 'int', unsigned: true, nullable: true })
  messageId: number | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  rating?: number | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => RecordReview, (review) => review.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: RecordReview | null;

  @OneToMany(() => RecordReview, (review) => review.parent)
  children?: RecordReview[];
}
