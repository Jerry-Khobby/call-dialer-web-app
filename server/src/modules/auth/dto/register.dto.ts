import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsPhone } from '../../../common/phone';
import { Trim } from '../../../common/validation';

export class RegisterDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @Trim()
  @IsEmail()
  email: string;

  // bcrypt only uses the first 72 bytes of a password. Not trimmed: spaces may be intended.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  /** The number other users dial to reach this account. */
  @Trim()
  @IsPhone()
  phoneNumber: string;
}
