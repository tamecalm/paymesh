import { Injectable } from '@nestjs/common';
import { PrismaClient, type Wallet } from '@prisma/client';
import { InsufficientBalanceException } from '../common/exceptions/insufficient-balance.exception';
import { WalletNotFoundException } from '../common/exceptions/wallet-not-found.exception';
import { WalletRepository } from './wallet.repository';

@Injectable()
export class WalletCreditDebitService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly walletRepository: WalletRepository,
  ) {}

  async creditWallet(walletId: string, amount: number): Promise<Wallet> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.walletRepository.findById(walletId, tx);

      if (!wallet) {
        throw new WalletNotFoundException();
      }

      const currentBalance = new Prisma.Decimal(wallet.balance);
      const creditAmount = new Prisma.Decimal(amount);
      const newBalance = currentBalance.plus(creditAmount);

      return this.walletRepository.updateBalance(walletId, newBalance, tx);
    });
  }

  async debitWallet(walletId: string, amount: number): Promise<Wallet> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.walletRepository.findById(walletId, tx);

      if (!wallet) {
        throw new WalletNotFoundException();
      }

      const currentBalance = new Prisma.Decimal(wallet.balance);
      const debitAmount = new Prisma.Decimal(amount);

      if (currentBalance.lessThan(debitAmount)) {
        throw new InsufficientBalanceException(
          parseFloat(currentBalance.toString()),
          parseFloat(debitAmount.toString()),
        );
      }

      const newBalance = currentBalance.minus(debitAmount);

      return this.walletRepository.updateBalance(walletId, newBalance, tx);
    });
  }
}
