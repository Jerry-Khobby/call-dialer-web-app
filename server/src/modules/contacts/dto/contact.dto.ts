import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsPhone } from '../../../common/phone';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsPhone()
  phoneNumber: string;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;
}

/** Any subset of the fields, e.g. { favorite: true } to star a contact. */
export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsPhone()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;
}
