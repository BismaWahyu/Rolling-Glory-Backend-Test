import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GiftsService } from './gifts.service';
import { Gift } from './entities/gift.entity';
import { Redemption } from './entities/redemption.entity';
import { Rating } from './entities/rating.entity';
import { User } from '../users/entities/user.entity';

describe('GiftsService', () => {
  let service: GiftsService;
  let giftsRepo: any;
  let redemptionsRepo: any;
  let ratingsRepo: any;
  let dataSource: any;

  beforeEach(async () => {
    giftsRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ id: 'g1', ...v })),
      findOne: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(),
    };
    redemptionsRepo = { findOne: jest.fn() };
    ratingsRepo = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ id: 'r1', ...v })),
      createQueryBuilder: jest.fn(),
    };
    dataSource = { transaction: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GiftsService,
        { provide: getRepositoryToken(Gift), useValue: giftsRepo },
        { provide: getRepositoryToken(Redemption), useValue: redemptionsRepo },
        { provide: getRepositoryToken(Rating), useValue: ratingsRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(GiftsService);
  });

  describe('findOne', () => {
    it('returns gift with stars rounded to 0.5', async () => {
      giftsRepo.findOne.mockResolvedValue({ id: 'g1', name: 'Test Gift' });
      ratingsRepo.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: '3.6', count: '4' }),
      });

      const result = await service.findOne('g1');
      expect(result.stars).toBe(3.5);
      expect(result.averageRating).toBeCloseTo(3.6);
      expect(result.ratingCount).toBe(4);
    });

    it('throws NotFound for unknown gift', async () => {
      giftsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('redeem', () => {
    it('rejects when stock insufficient', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: any) => {
            if (entity === Gift) {
              return {
                createQueryBuilder: () => ({
                  setLock: () => ({
                    where: () => ({ getOne: () => Promise.resolve({ id: 'g1', stock: 0, pointsRequired: 100 }) }),
                  }),
                }),
                save: jest.fn(),
              };
            }
            return { findOne: jest.fn(), decrement: jest.fn(), save: jest.fn(), create: jest.fn() };
          },
        }),
      );

      await expect(service.redeem('g1', 'u1', { quantity: 1 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when user points insufficient', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({
          getRepository: (entity: any) => {
            if (entity === Gift) {
              return {
                createQueryBuilder: () => ({
                  setLock: () => ({
                    where: () => ({ getOne: () => Promise.resolve({ id: 'g1', stock: 5, pointsRequired: 1000 }) }),
                  }),
                }),
                save: jest.fn(),
              };
            }
            if (entity === User) {
              return { findOne: () => Promise.resolve({ id: 'u1', points: 100 }), decrement: jest.fn() };
            }
            return { create: jest.fn(), save: jest.fn() };
          },
        }),
      );

      await expect(service.redeem('g1', 'u1', { quantity: 1 })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('rate', () => {
    it('forbids rating without prior redemption', async () => {
      giftsRepo.findOne.mockResolvedValue({ id: 'g1' });
      redemptionsRepo.findOne.mockResolvedValue(null);
      await expect(service.rate('g1', 'u1', { rating: 5 })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('creates rating when redemption exists', async () => {
      giftsRepo.findOne.mockResolvedValue({ id: 'g1' });
      redemptionsRepo.findOne.mockResolvedValue({ id: 'red1' });
      const result = await service.rate('g1', 'u1', { rating: 4.5, review: 'good' });
      expect(result).toMatchObject({ giftId: 'g1', userId: 'u1', redemptionId: 'red1', rating: 4.5 });
    });
  });
});
