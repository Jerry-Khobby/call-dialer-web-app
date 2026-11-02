import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CallsModule } from '../calls/calls.module';
import { UsersModule } from '../users/users.module';
import { CallsGateway } from './calls.gateway';

@Module({
  imports: [AuthModule, UsersModule, CallsModule],
  providers: [CallsGateway],
})
export class SignalingModule {}
