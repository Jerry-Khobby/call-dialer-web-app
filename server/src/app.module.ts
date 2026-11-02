import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { Env, validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { HttpThrottlerGuard, JwtAuthGuard } from './modules/auth/guards';
import { CallsModule } from './modules/calls/calls.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { SignalingModule } from './modules/signaling/signaling.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('MONGODB_URI', { infer: true }),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    UsersModule,
    AuthModule,
    ContactsModule,
    CallsModule,
    SignalingModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: HttpThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
