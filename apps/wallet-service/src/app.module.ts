import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [LoggerModule.forRoot(), WalletModule],
})
export class AppModule {}
