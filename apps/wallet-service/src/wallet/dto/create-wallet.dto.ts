import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId!: string;
}
