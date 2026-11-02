import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { isDuplicateKeyError } from '../../common/mongo';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;

export type AuthSession = { accessToken: string; user: UserDocument };

@Injectable()
export class AuthService {
  /** Compared against when the email is unknown; same cost factor as real hashes. */
  private readonly dummyHash = bcrypt.hash('no-such-account', BCRYPT_ROUNDS);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.users.create({ ...dto, password });
      return this.session(user);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const field =
          error.keyPattern && 'phoneDigits' in error.keyPattern
            ? 'phone number'
            : 'email';
        throw new ConflictException(
          `An account with this ${field} already exists`,
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    // Always run a bcrypt comparison, so an unknown email takes as long as a wrong
    // password; otherwise response times would reveal which emails have accounts.
    const valid = await bcrypt.compare(
      dto.password,
      user?.password ?? (await this.dummyHash),
    );
    if (!user || !valid)
      throw new UnauthorizedException('Invalid email or password');
    return this.session(user);
  }

  private session(user: UserDocument): AuthSession {
    const payload: JwtPayload = { sub: user._id.toString() };
    return { accessToken: this.jwt.sign(payload), user };
  }
}
