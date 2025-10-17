import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'int', unsigned: true, nullable: true })
  account: number;

  @Column({ type: 'varchar', length: 128, select: false })
  password: string;

  @Column({ type: 'varchar', length: 64 })
  nickname: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string;

  @Column({ type: 'tinyint', default: false })
  isVip: boolean;

  @CreateDateColumn({ name: 'register_time', type: 'datetime' })
  registerTime: Date;
}
