import { status } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserNotFoundException } from '../common/exceptions/user-not-found.exception'; 
import { WalletNotFoundException } from '../common/exceptions/wallet-not-found.exception'; 
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { IUserServiceGrpcClient } from './interfaces/user-service-grpc.interface';
import { WalletCreditDebitService } from './wallet.credit-debit.service';
import { WalletRepository } from './wallet.repository';

@Injectable()
export class WalletService implements OnModuleInit {
  private userServiceClient!: IUserServiceGrpcClient;

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly walletCreditDebitService: WalletCreditDebitService,
    @Inject('USER_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.userServiceClient =
      this.client.getService<IUserServiceGrpcClient>('UserService');
  }

  async createWallet(dto: CreateWalletDto): Promise<WalletResponseDto> {
    try {
      await firstValueFrom(this.userServiceClient.getUserById({ id: dto.userId }));
    } catch {
      throw new UserNotFoundException();
    }

    const existingWallet = await this.walletRepository.findByUserId(dto.userId);

    if (existingWallet) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'Wallet already exists for this user',
      });
    }

    const wallet = await this.walletRepository.create({ userId: dto.userId });

    return WalletResponseDto.fromPrisma(wallet);
  }

  async getWallet(data: { id: string }): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findById(data.id);

    if (!wallet) {
      throw new WalletNotFoundException();
    }

    return WalletResponseDto.fromPrisma(wallet);
  }

  async creditWallet(data: {
    walletId: string;
    amount: number;
  }): Promise<WalletResponseDto> {
    const wallet = await this.walletCreditDebitService.creditWallet(
      data.walletId,
      data.amount,
    );

    return WalletResponseDto.fromPrisma(wallet);
  }

  async debitWallet(data: {
    walletId: string;
    amount: number;
  }): Promise<WalletResponseDto> {
    const wallet = await this.walletCreditDebitService.debitWallet(
      data.walletId,
      data.amount,
    );

    return WalletResponseDto.fromPrisma(wallet);
  }
}
