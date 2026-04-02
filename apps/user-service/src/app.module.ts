import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { UserModule } from './user/user.module';

@Module({
  imports: [LoggerModule.forRoot(), UserModule],
})
export class AppModule {}
