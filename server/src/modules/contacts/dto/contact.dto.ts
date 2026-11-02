import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsPhone } from '../../../common/phone';
import { Optional, Trim } from '../../../common/validation';

export class CreateContactDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @Optional()
  @Trim()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @Trim()
  @IsPhone()
  phoneNumber: string;

  @Optional()
  @IsBoolean()
  favorite?: boolean;
}

/** Any subset of the fields, e.g. { favorite: true } to star a contact. */
export class UpdateContactDto {
  @Optional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName?: string;

  @Optional()
  @Trim()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @Optional()
  @Trim()
  @IsPhone()
  phoneNumber?: string;

  @Optional()
  @IsBoolean()
  favorite?: boolean;
}
