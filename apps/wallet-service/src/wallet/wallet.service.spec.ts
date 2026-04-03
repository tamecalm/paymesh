import { Metadata, status } from '@grpc/grpc-js';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { Prisma, type Wallet } from '@prisma/client';
import { of, throwError } from 'rxjs';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception';
import { WalletNotFoundException } from '../common/exceptions/wallet-not-found.exception';
import { WalletCreditDebitService } from './wallet.credit-debit.service';
import { WalletRepository } from './wallet.repository';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByUserId: jest.Mock;
  };
  let userServiceClient: {
    getUserById: jest.Mock;
  };
  let clientGrpc: {
    getService: jest.Mock;
  };

  const originalApiKey = process.env.GRPC_API_KEY;

  const fakeUser = {
    id: 'user-1',
    name: 'Wallet Owner',
    email: 'owner@paymesh.dev',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const fakeWallet: Wallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: new Prisma.Decimal('0'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    process.env.GRPC_API_KEY = 'paymesh-dev-secret';

    walletRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
    };
    userServiceClient = {
      getUserById: jest.fn(),
    };
    clientGrpc = {
      getService: jest.fn().mockReturnValue(userServiceClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: WalletRepository,
          useValue: walletRepository,
        },
        {
          provide: WalletCreditDebitService,
          useValue: {
            creditWallet: jest.fn(),
            debitWallet: jest.fn(),
          },
        },
        {
          provide: 'USER_SERVICE',
          useValue: clientGrpc,
        },
      ],
    }).compile();

    service = module.get(WalletService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.GRPC_API_KEY;
    } else {
      process.env.GRPC_API_KEY = originalApiKey;
    }
  });

  describe('createWallet', () => {
    it('should create and return a wallet when user exists', async () => {
      const dto = { userId: fakeUser.id };
      userServiceClient.getUserById.mockReturnValue(of(fakeUser));
      walletRepository.findByUserId.mockResolvedValue(null);
      walletRepository.create.mockResolvedValue(fakeWallet);

      const result = await service.createWallet(dto);
      const metadata = userServiceClient.getUserById.mock.calls[0][1] as Metadata;

      expect(userServiceClient.getUserById).toHaveBeenCalledWith(
        { id: dto.userId },
        expect.any(Metadata),
      );
      expect(metadata.get('x-api-key')[0]).toBe('paymesh-dev-secret');
      expect(walletRepository.findByUserId).toHaveBeenCalledWith(dto.userId);
      expect(walletRepository.create).toHaveBeenCalledWith({ userId: dto.userId });
      expect(result).toMatchObject({
        id: fakeWallet.id,
        userId: fakeWallet.userId,
        balance: 0,
        createdAt: fakeWallet.createdAt.toISOString(),
        updatedAt: fakeWallet.updatedAt.toISOString(),
      });
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      const dto = { userId: 'missing-user' };
      userServiceClient.getUserById.mockReturnValue(
        throwError(() => new UserNotFoundException()),
      );

      await expect(service.createWallet(dto)).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
      expect(walletRepository.findByUserId).not.toHaveBeenCalled();
      expect(walletRepository.create).not.toHaveBeenCalled();
    });

    it('should throw RpcException with ALREADY_EXISTS when wallet already exists for user', async () => {
      const dto = { userId: fakeUser.id };
      userServiceClient.getUserById.mockReturnValue(of(fakeUser));
      walletRepository.findByUserId.mockResolvedValue(fakeWallet);

      try {
        await service.createWallet(dto);
        throw new Error('Expected createWallet to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(RpcException);
        expect((error as RpcException).getError()).toEqual({
          code: status.ALREADY_EXISTS,
          message: 'Wallet already exists for this user',
        });
      }

      expect(walletRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getWallet', () => {
    it('should return a wallet when found', async () => {
      walletRepository.findById.mockResolvedValue(fakeWallet);

      const result = await service.getWallet({ id: fakeWallet.id });

      expect(walletRepository.findById).toHaveBeenCalledWith(fakeWallet.id);
      expect(result).toMatchObject({
        id: fakeWallet.id,
        userId: fakeWallet.userId,
        balance: 0,
        createdAt: fakeWallet.createdAt.toISOString(),
        updatedAt: fakeWallet.updatedAt.toISOString(),
      });
    });

    it('should throw WalletNotFoundException when wallet does not exist', async () => {
      walletRepository.findById.mockResolvedValue(null);

      await expect(service.getWallet({ id: 'missing-wallet' })).rejects.toBeInstanceOf(
        WalletNotFoundException,
      );
    });
  });
});
