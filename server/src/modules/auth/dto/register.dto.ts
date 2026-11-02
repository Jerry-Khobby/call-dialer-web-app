import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsPhone } from '../../../common/phone';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  email: string;

  // bcrypt only uses the first 72 bytes of a password.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  /** The number other users dial to reach this account. */
  @IsPhone()
  phoneNumber: string;
}
