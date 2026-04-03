import type { Wallet } from '@prisma/client';

export class WalletResponseDto {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly balance: number,
    public readonly createdAt: string,
    public readonly updatedAt: string,
  ) {}

  static fromPrisma(wallet: Wallet): WalletResponseDto {
    return new WalletResponseDto(
      wallet.id,
      wallet.userId,
      parseFloat(wallet.balance.toString()),
      wallet.createdAt.toISOString(),
      wallet.updatedAt.toISOString(),
    );
  }
}
