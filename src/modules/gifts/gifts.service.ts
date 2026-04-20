import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Gift } from './entities/gift.entity';
import { Redemption } from './entities/redemption.entity';
import { Rating } from './entities/rating.entity';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';
import { RedeemGiftDto } from './dto/redeem-gift.dto';
import { BulkRedeemDto } from './dto/bulk-redeem.dto';
import { RateGiftDto } from './dto/rate-gift.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { roundToHalfStar } from '../../common/utils/rating.util';
import { User } from '../users/entities/user.entity';

export interface GiftWithStars extends Gift {
  averageRating: number;
  stars: number;
  ratingCount: number;
}

@Injectable()
export class GiftsService {
  constructor(
    @InjectRepository(Gift) private readonly giftsRepo: Repository<Gift>,
    @InjectRepository(Redemption) private readonly redemptionsRepo: Repository<Redemption>,
    @InjectRepository(Rating) private readonly ratingsRepo: Repository<Rating>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateGiftDto): Promise<Gift> {
    const gift = this.giftsRepo.create(dto);
    return this.giftsRepo.save(gift);
  }

  async findAll(query: PaginationQueryDto): Promise<{ items: GiftWithStars[]; meta: Record<string, unknown> }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const order = query.order ?? 'DESC';
    const sortBy = query.sortBy ?? 'newest';
    const { minRating, inStock } = query;

    const qb = this.giftsRepo
      .createQueryBuilder('gift')
      .leftJoin('gift.ratings', 'rating')
      .addSelect('COALESCE(AVG(rating.rating), 0)', 'gift_avg_rating')
      .addSelect('COUNT(rating.id)', 'gift_rating_count')
      .groupBy('gift.id');

    if (inStock) {
      qb.andWhere('gift.stock > 0');
    }

    if (minRating !== undefined) {
      qb.having('COALESCE(AVG(rating.rating), 0) >= :minRating', { minRating });
    }

    if (sortBy === 'rating') {
      qb.orderBy('gift_avg_rating', order);
    } else {
      qb.orderBy('gift.created_at', order);
    }

    qb.skip((page - 1) * limit).take(limit);

    const raw = await qb.getRawAndEntities();
    const total = await this.countFiltered({ minRating, inStock });

    const items = raw.entities.map((gift, idx) => {
      const rawRow = raw.raw[idx];
      const avg = parseFloat(rawRow.gift_avg_rating) || 0;
      const count = parseInt(rawRow.gift_rating_count, 10) || 0;
      return { ...gift, averageRating: avg, stars: roundToHalfStar(avg), ratingCount: count };
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        sortBy,
        order,
        ...(minRating !== undefined ? { minRating } : {}),
        ...(inStock !== undefined ? { inStock } : {}),
      },
    };
  }

  private async countFiltered(filters: { minRating?: number; inStock?: boolean }): Promise<number> {
    const qb = this.giftsRepo
      .createQueryBuilder('gift')
      .leftJoin('gift.ratings', 'rating')
      .select('gift.id')
      .groupBy('gift.id');

    if (filters.inStock) {
      qb.andWhere('gift.stock > 0');
    }
    if (filters.minRating !== undefined) {
      qb.having('COALESCE(AVG(rating.rating), 0) >= :minRating', { minRating: filters.minRating });
    }

    const rows = await qb.getRawMany();
    return rows.length;
  }

  async findOne(id: string): Promise<GiftWithStars> {
    const gift = await this.giftsRepo.findOne({ where: { id } });
    if (!gift) throw new NotFoundException(`Gift ${id} not found`);

    const { avg, count } = await this.computeRating(id);
    return { ...gift, averageRating: avg, stars: roundToHalfStar(avg), ratingCount: count };
  }

  async update(id: string, dto: UpdateGiftDto): Promise<Gift> {
    const gift = await this.giftsRepo.findOne({ where: { id } });
    if (!gift) throw new NotFoundException(`Gift ${id} not found`);
    Object.assign(gift, dto);
    return this.giftsRepo.save(gift);
  }

  async replace(id: string, dto: CreateGiftDto): Promise<Gift> {
    const existing = await this.giftsRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Gift ${id} not found`);
    const merged = this.giftsRepo.create({ ...dto, id });
    return this.giftsRepo.save(merged);
  }

  async remove(id: string): Promise<{ id: string; name: string }> {
    const gift = await this.giftsRepo.findOne({ where: { id } });
    if (!gift) throw new NotFoundException(`Gift ${id} not found`);
    await this.giftsRepo.delete(id);
    return { id: gift.id, name: gift.name };
  }

  async redeem(giftId: string, userId: string, dto: RedeemGiftDto): Promise<Redemption> {
    const quantity = dto.quantity ?? 1;

    return this.dataSource.transaction(async (manager) => {
      const gift = await manager
        .getRepository(Gift)
        .createQueryBuilder('gift')
        .setLock('pessimistic_write')
        .where('gift.id = :id', { id: giftId })
        .getOne();

      if (!gift) throw new NotFoundException(`Gift ${giftId} not found`);
      if (gift.stock < quantity) {
        throw new BadRequestException(`Insufficient stock (available: ${gift.stock})`);
      }

      const user = await manager.getRepository(User).findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const pointsSpent = gift.pointsRequired * quantity;
      if (user.points < pointsSpent) {
        throw new BadRequestException('Insufficient points');
      }

      gift.stock -= quantity;
      await manager.getRepository(Gift).save(gift);
      await manager.getRepository(User).decrement({ id: userId }, 'points', pointsSpent);

      const redemption = manager.getRepository(Redemption).create({
        giftId,
        userId,
        quantity,
        pointsSpent,
      });
      return manager.getRepository(Redemption).save(redemption);
    });
  }

  async bulkRedeem(userId: string, dto: BulkRedeemDto): Promise<Redemption[]> {
    const normalized = dto.items.map((item) => ({
      giftId: item.giftId,
      quantity: item.quantity ?? 1,
    }));

    const merged = new Map<string, number>();
    for (const item of normalized) {
      merged.set(item.giftId, (merged.get(item.giftId) ?? 0) + item.quantity);
    }

    return this.dataSource.transaction(async (manager) => {
      const giftIds = Array.from(merged.keys());
      const gifts = await manager
        .getRepository(Gift)
        .createQueryBuilder('gift')
        .setLock('pessimistic_write')
        .where('gift.id IN (:...ids)', { ids: giftIds })
        .getMany();

      if (gifts.length !== giftIds.length) {
        const foundIds = new Set(gifts.map((g) => g.id));
        const missing = giftIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Gift(s) not found: ${missing.join(', ')}`);
      }

      let totalPoints = 0;
      for (const gift of gifts) {
        const qty = merged.get(gift.id)!;
        if (gift.stock < qty) {
          throw new BadRequestException(
            `Insufficient stock for gift "${gift.name}" (available: ${gift.stock}, requested: ${qty})`,
          );
        }
        totalPoints += gift.pointsRequired * qty;
      }

      const user = await manager.getRepository(User).findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (user.points < totalPoints) {
        throw new BadRequestException(
          `Insufficient points (required: ${totalPoints}, available: ${user.points})`,
        );
      }

      const redemptions: Redemption[] = [];
      for (const gift of gifts) {
        const qty = merged.get(gift.id)!;
        gift.stock -= qty;
        await manager.getRepository(Gift).save(gift);

        const redemption = manager.getRepository(Redemption).create({
          giftId: gift.id,
          userId,
          quantity: qty,
          pointsSpent: gift.pointsRequired * qty,
        });
        redemptions.push(await manager.getRepository(Redemption).save(redemption));
      }

      await manager.getRepository(User).decrement({ id: userId }, 'points', totalPoints);

      return redemptions;
    });
  }

  async listRatings(
    giftId: string,
    page = 1,
    limit = 10,
  ): Promise<{ items: Rating[]; meta: Record<string, unknown> }> {
    const gift = await this.giftsRepo.findOne({ where: { id: giftId } });
    if (!gift) throw new NotFoundException(`Gift ${giftId} not found`);

    const [items, total] = await this.ratingsRepo.findAndCount({
      where: { giftId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async rate(giftId: string, userId: string, dto: RateGiftDto): Promise<Rating> {
    const gift = await this.giftsRepo.findOne({ where: { id: giftId } });
    if (!gift) throw new NotFoundException(`Gift ${giftId} not found`);

    const redemption = await this.redemptionsRepo.findOne({
      where: { giftId, userId },
      order: { redeemedAt: 'DESC' },
    });
    if (!redemption) {
      throw new ForbiddenException('You can only rate gifts you have redeemed');
    }

    const rating = this.ratingsRepo.create({
      giftId,
      userId,
      redemptionId: redemption.id,
      rating: dto.rating,
      review: dto.review ?? null,
    });
    return this.ratingsRepo.save(rating);
  }

  private async computeRating(giftId: string): Promise<{ avg: number; count: number }> {
    const row = await this.ratingsRepo
      .createQueryBuilder('rating')
      .select('COALESCE(AVG(rating.rating), 0)', 'avg')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.gift_id = :giftId', { giftId })
      .getRawOne();
    return {
      avg: parseFloat(row?.avg ?? '0') || 0,
      count: parseInt(row?.count ?? '0', 10) || 0,
    };
  }
}
