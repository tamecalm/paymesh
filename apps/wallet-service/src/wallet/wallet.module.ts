import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { USER_SERVICE_CLIENT_MODULE } from '../grpc-clients/user-service.client';
import { WalletController } from './wallet.controller';
import { WalletCreditDebitService } from './wallet.credit-debit.service';
import { WalletRepository } from './wallet.repository';
import { WalletService } from './wallet.service';

@Module({
  imports: [USER_SERVICE_CLIENT_MODULE],
  controllers: [WalletController],
  providers: [WalletService, WalletCreditDebitService, WalletRepository, PrismaClient],
})
export class WalletModule {}
