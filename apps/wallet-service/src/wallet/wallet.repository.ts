import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, type Wallet } from '@prisma/client';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(
    id: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<Wallet | null> {
    return executor.wallet.findUnique({
      where: { id },
    });
  }

  async findByUserId(
    userId: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<Wallet | null> {
    return executor.wallet.findUnique({
      where: { userId },
    });
  }

  async create(
    data: { userId: string },
    executor: PrismaExecutor = this.prisma,
  ): Promise<Wallet> {
    return executor.wallet.create({
      data,
    });
  }

  async updateBalance(
    id: string,
    balance: number,
    executor: PrismaExecutor = this.prisma,
  ): Promise<Wallet> {
    return executor.wallet.update({
      where: { id },
      data: { balance },
    });
  }
}
