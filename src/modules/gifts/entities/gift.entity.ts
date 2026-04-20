import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Redemption } from './redemption.entity';
import { Rating } from './rating.entity';

@Entity({ name: 'gifts' })
export class Gift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string | null;

  @Index()
  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'points_required', type: 'int', default: 0 })
  pointsRequired: number;

  @Column({ name: 'is_hot', type: 'boolean', default: false })
  isHot: boolean;

  @Column({ name: 'is_new', type: 'boolean', default: false })
  isNew: boolean;

  @OneToMany(() => Redemption, (redemption) => redemption.gift)
  redemptions: Redemption[];

  @OneToMany(() => Rating, (rating) => rating.gift)
  ratings: Rating[];

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
