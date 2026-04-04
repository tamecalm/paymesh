import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreditWalletDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  walletId!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount!: number;
}
