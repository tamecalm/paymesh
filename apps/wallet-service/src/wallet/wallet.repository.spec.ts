import { Prisma, PrismaClient, type Wallet } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { WalletRepository } from './wallet.repository';

describe('WalletRepository', () => {
  let repository: WalletRepository;
  let prisma: {
    wallet: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const fakeWallet: Wallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: new Prisma.Decimal('0'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = {
      wallet: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletRepository,
        {
          provide: PrismaClient,
          useValue: prisma,
        },
      ],
    }).compile();

    repository = module.get(WalletRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a wallet when given valid userId', async () => {
      const data = { userId: 'user-1' };
      prisma.wallet.create.mockResolvedValue(fakeWallet);

      const result = await repository.create(data);

      expect(result).toEqual(fakeWallet);
      expect(prisma.wallet.create).toHaveBeenCalledWith({
        data,
      });
    });

    it('should propagate Prisma errors on duplicate userId', async () => {
      const data = { userId: 'user-1' };
      const error = { code: 'P2002', message: 'Unique constraint failed' };
      prisma.wallet.create.mockRejectedValue(error);

      await expect(repository.create(data)).rejects.toEqual(error);
    });
  });

  describe('findById', () => {
    it('should return a wallet when found', async () => {
      prisma.wallet.findUnique.mockResolvedValue(fakeWallet);

      const result = await repository.findById(fakeWallet.id);

      expect(result).toEqual(fakeWallet);
      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { id: fakeWallet.id },
      });
    });

    it('should return null when wallet does not exist', async () => {
      prisma.wallet.findUnique.mockResolvedValue(null);

      const result = await repository.findById('missing-wallet');

      expect(result).toBeNull();
      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { id: 'missing-wallet' },
      });
    });
  });

  describe('updateBalance', () => {
    it('should update and return the wallet with the new Decimal balance', async () => {
      const balance = new Prisma.Decimal('300.30');
      const updatedWallet: Wallet = {
        ...fakeWallet,
        balance,
      };
      prisma.wallet.update.mockResolvedValue(updatedWallet);

      const result = await repository.updateBalance(fakeWallet.id, balance);

      expect(result).toEqual(updatedWallet);
      expect(prisma.wallet.update).toHaveBeenCalledWith({
        where: { id: fakeWallet.id },
        data: { balance },
      });
    });
  });
});
