import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreditWalletDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  wallet_id!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount!: number;
}
