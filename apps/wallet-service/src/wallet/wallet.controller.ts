import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { IGetWalletRequest } from './interfaces/wallet-grpc.interface';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @GrpcMethod('WalletService', 'CreateWallet')
  createWallet(dto: CreateWalletDto): Promise<WalletResponseDto> {
    return this.walletService.createWallet(dto);
  }

  @GrpcMethod('WalletService', 'GetWallet')
  getWallet(data: IGetWalletRequest): Promise<WalletResponseDto> {
    return this.walletService.getWallet(data);
  }

  @GrpcMethod('WalletService', 'CreditWallet')
  creditWallet(dto: CreditWalletDto): Promise<WalletResponseDto> {
    return this.walletService.creditWallet(dto);
  }

  @GrpcMethod('WalletService', 'DebitWallet')
  debitWallet(dto: DebitWalletDto): Promise<WalletResponseDto> {
    return this.walletService.debitWallet(dto);
  }
}
