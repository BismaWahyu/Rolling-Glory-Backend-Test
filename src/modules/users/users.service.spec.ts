import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../../common/enums/role.enum';

type MockRepo<T extends ObjectLiteral = ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = (): MockRepo<User> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  decrement: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockRepo<User>;

  beforeEach(async () => {
    repo = createMockRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('creates a user with hashed password', async () => {
    repo.findOne!.mockResolvedValue(null);
    repo.create!.mockImplementation((v) => v);
    repo.save!.mockImplementation(async (v) => ({ id: 'uuid', ...v }));

    const result = await service.create({
      username: 'john',
      email: 'john@test.com',
      password: 'plain123',
      role: Role.USER,
    });

    expect(result.password).not.toBe('plain123');
    expect(await bcrypt.compare('plain123', result.password)).toBe(true);
  });

  it('throws ConflictException if username/email exists', async () => {
    repo.findOne!.mockResolvedValue({ id: 'x' });
    await expect(
      service.create({ username: 'dup', email: 'd@x.com', password: 'secret' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when findOne cannot find user', async () => {
    repo.findOne!.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
