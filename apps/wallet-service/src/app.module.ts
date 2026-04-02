import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { GrpcExceptionFilter } from './common/filters/grpc-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [LoggerModule.forRoot(), WalletModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
