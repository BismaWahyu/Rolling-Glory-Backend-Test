import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Gift } from './gift.entity';
import { Rating } from './rating.entity';

@Entity({ name: 'redemptions' })
@Index(['user', 'gift'])
export class Redemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.redemptions, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Gift, (gift) => gift.redemptions, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'gift_id' })
  gift: Gift;

  @Column({ name: 'gift_id', type: 'uuid' })
  giftId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'points_spent', type: 'int', default: 0 })
  pointsSpent: number;

  @OneToMany(() => Rating, (rating) => rating.redemption)
  ratings: Rating[];

  @CreateDateColumn({ name: 'redeemed_at' })
  redeemedAt: Date;
}
