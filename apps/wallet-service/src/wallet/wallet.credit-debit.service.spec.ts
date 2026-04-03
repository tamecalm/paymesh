import { status } from '@grpc/grpc-js';
import { Prisma, PrismaClient, type Wallet } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { InsufficientBalanceException } from '../common/exceptions/insufficient-balance.exception';
import { WalletNotFoundException } from '../common/exceptions/wallet-not-found.exception';
import { WalletRepository } from './wallet.repository';
import { WalletCreditDebitService } from './wallet.credit-debit.service';

describe('WalletCreditDebitService', () => {
  let service: WalletCreditDebitService;
  let walletRepository: {
    findById: jest.Mock;
    updateBalance: jest.Mock;
  };
  let prisma: {
    $transaction: jest.Mock;
  };
  let tx: Record<string, unknown>;

  const baseWallet: Wallet = {
    id: 'wallet-1',
    userId: 'user-1',
    balance: new Prisma.Decimal('100.10'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    tx = { transaction: true };
    walletRepository = {
      findById: jest.fn(),
      updateBalance: jest.fn(),
    };
    prisma = {
      $transaction: jest.fn().mockImplementation((cb: (executor: unknown) => unknown) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletCreditDebitService,
        {
          provide: PrismaClient,
          useValue: prisma,
        },
        {
          provide: WalletRepository,
          useValue: walletRepository,
        },
      ],
    }).compile();

    service = module.get(WalletCreditDebitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('creditWallet', () => {
    it('should add the credit amount to the existing balance and return updated wallet', async () => {
      walletRepository.findById.mockResolvedValue(baseWallet);
      walletRepository.updateBalance.mockImplementation(async (id: string, balance: Prisma.Decimal) => ({
        ...baseWallet,
        id,
        balance,
      }));

      const result = await service.creditWallet(baseWallet.id, 200.2);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(walletRepository.findById).toHaveBeenCalledWith(baseWallet.id, tx);
      expect(walletRepository.updateBalance).toHaveBeenCalledWith(
        baseWallet.id,
        expect.any(Prisma.Decimal),
        tx,
      );
      expect(parseFloat(result.balance.toString())).toBe(parseFloat('300.30'));
      expect(result.balance.toString()).toBe('300.3');
    });

    it('should throw WalletNotFoundException when wallet does not exist', async () => {
      walletRepository.findById.mockResolvedValue(null);

      await expect(service.creditWallet('missing-wallet', 200.2)).rejects.toBeInstanceOf(
        WalletNotFoundException,
      );
      expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });
  });

  describe('debitWallet', () => {
    it('should subtract the debit amount from the existing balance and return updated wallet', async () => {
      const wallet: Wallet = {
        ...baseWallet,
        balance: new Prisma.Decimal('500.00'),
      };
      walletRepository.findById.mockResolvedValue(wallet);
      walletRepository.updateBalance.mockImplementation(async (id: string, balance: Prisma.Decimal) => ({
        ...wallet,
        id,
        balance,
      }));

      const result = await service.debitWallet(wallet.id, 200.2);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(walletRepository.findById).toHaveBeenCalledWith(wallet.id, tx);
      expect(walletRepository.updateBalance).toHaveBeenCalledWith(
        wallet.id,
        expect.any(Prisma.Decimal),
        tx,
      );
      expect(parseFloat(result.balance.toString())).toBe(parseFloat('299.80'));
      expect(result.balance.toString()).toBe('299.8');
    });

    it('should throw InsufficientBalanceException when debit amount exceeds balance', async () => {
      const wallet: Wallet = {
        ...baseWallet,
        balance: new Prisma.Decimal('100.00'),
      };
      walletRepository.findById.mockResolvedValue(wallet);

      try {
        await service.debitWallet(wallet.id, 999);
        throw new Error('Expected debitWallet to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientBalanceException);
        expect((error as InsufficientBalanceException).getError()).toEqual({
          code: status.FAILED_PRECONDITION,
          message: 'Insufficient balance. Available: 100, Required: 999',
        });
      }

      expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });

    it('should throw WalletNotFoundException when wallet does not exist', async () => {
      walletRepository.findById.mockResolvedValue(null);

      await expect(service.debitWallet('missing-wallet', 200.2)).rejects.toBeInstanceOf(
        WalletNotFoundException,
      );
      expect(walletRepository.updateBalance).not.toHaveBeenCalled();
    });
  });
});
