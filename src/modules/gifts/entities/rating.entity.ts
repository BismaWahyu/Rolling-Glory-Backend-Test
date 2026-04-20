import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Gift } from './gift.entity';
import { Redemption } from './redemption.entity';

@Entity({ name: 'ratings' })
@Index(['user', 'gift'])
@Check(`"rating" >= 0 AND "rating" <= 5`)
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.ratings, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Gift, (gift) => gift.ratings, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'gift_id' })
  gift: Gift;

  @Column({ name: 'gift_id', type: 'uuid' })
  giftId: string;

  @ManyToOne(() => Redemption, (redemption) => redemption.ratings, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'redemption_id' })
  redemption: Redemption;

  @Column({ name: 'redemption_id', type: 'uuid' })
  redemptionId: string;

  @Column({ type: 'numeric', precision: 3, scale: 2 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  review: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
