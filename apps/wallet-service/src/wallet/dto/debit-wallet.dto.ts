import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class DebitWalletDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  wallet_id!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount!: number;
}
