import { status } from '@grpc/grpc-js';
import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { type User } from '@prisma/client';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: {
    create: jest.Mock;
    findByEmail: jest.Mock;
    findById: jest.Mock;
  };

  const fakeUser: User = {
    id: 'user-1',
    name: 'Auth Test',
    email: 'authtest@paymesh.dev',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create and return a user when email is not taken', async () => {
      const dto = { name: 'Auth Test', email: 'authtest@paymesh.dev' };
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(fakeUser);

      const result = await service.createUser(dto);

      expect(repository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(repository.create).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
      });
      expect(result).toMatchObject({
        id: fakeUser.id,
        name: fakeUser.name,
        email: fakeUser.email,
        createdAt: fakeUser.createdAt.toISOString(),
        updatedAt: fakeUser.updatedAt.toISOString(),
      });
    });

    it('should throw RpcException with ALREADY_EXISTS when email is already registered', async () => {
      const dto = { name: 'Auth Test', email: 'authtest@paymesh.dev' };
      repository.findByEmail.mockResolvedValue(fakeUser);

      try {
        await service.createUser(dto);
        throw new Error('Expected createUser to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(RpcException);
        expect((error as RpcException).getError()).toEqual({
          code: status.ALREADY_EXISTS,
          message: 'User with this email already exists',
        });
      }
    });
  });

  describe('getUserById', () => {
    it('should return a user when found', async () => {
      repository.findById.mockResolvedValue(fakeUser);

      const result = await service.getUserById({ id: fakeUser.id });

      expect(repository.findById).toHaveBeenCalledWith(fakeUser.id);
      expect(result).toMatchObject({
        id: fakeUser.id,
        name: fakeUser.name,
        email: fakeUser.email,
        createdAt: fakeUser.createdAt.toISOString(),
        updatedAt: fakeUser.updatedAt.toISOString(),
      });
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getUserById({ id: 'missing-user' })).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
    });
  });
});
