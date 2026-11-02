import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';
import { CurrentUser, Public } from './decorators';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Stricter limit on the endpoints that check passwords, to slow down guessing.
const AUTH_LIMIT = { default: { limit: 20, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  async me(@CurrentUser() { userId }: AuthUser) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('Account no longer exists');
    return user;
  }
}
