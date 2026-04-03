import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, type User } from '@prisma/client';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const fakeUser: User = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@paymesh.dev',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaClient,
          useValue: prisma,
        },
      ],
    }).compile();

    repository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a user when given valid data', async () => {
      const dto = { name: 'Test User', email: 'test@paymesh.dev' };
      prisma.user.create.mockResolvedValue(fakeUser);

      const result = await repository.create(dto);

      expect(result).toEqual(fakeUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: dto,
      });
    });

    it('should propagate errors thrown by prisma', async () => {
      const dto = { name: 'Test User', email: 'test@paymesh.dev' };
      const error = new Error('Prisma create failed');
      prisma.user.create.mockRejectedValue(error);

      await expect(repository.create(dto)).rejects.toThrow(error);
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(fakeUser);

      const result = await repository.findById(fakeUser.id);

      expect(result).toEqual(fakeUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: fakeUser.id },
      });
    });

    it('should return null when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('missing-user');

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'missing-user' },
      });
    });
  });
});
