import type { Wallet } from '@prisma/client';

export class WalletResponseDto {
  constructor(
    public readonly id: string,
    public readonly user_id: string,
    public readonly balance: number,
    public readonly created_at: string,
    public readonly updated_at: string,
  ) {}

  static fromPrisma(wallet: Wallet): WalletResponseDto {
    return new WalletResponseDto(
      wallet.id,
      wallet.userId,
      wallet.balance,
      wallet.createdAt.toISOString(),
      wallet.updatedAt.toISOString(),
    );
  }
}
