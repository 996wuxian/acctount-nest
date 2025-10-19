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

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_review_message')
  @Column({ type: 'int', unsigned: true, nullable: true })
  messageId: number;

  @Column({ type: 'int', unsigned: true })
  userId: number;

  @Column({ type: 'int', unsigned: true })
  rating: number;

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
