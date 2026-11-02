import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DIALABLE } from '../../../common/phone';
import { Optional, Trim } from '../../../common/validation';
import { CALL_TYPES, type CallType } from '../schemas/call.schema';

export class CreateCallDto {
  // Anything dialable, including service codes like *123#.
  @Trim()
  @IsString()
  @Matches(DIALABLE, {
    message: 'phoneNumber contains characters that cannot be dialed',
  })
  @MaxLength(30)
  phoneNumber: string;

  @IsIn(CALL_TYPES)
  callType: CallType;

  @Optional()
  @IsInt()
  @Min(0)
  duration?: number;

  @Optional()
  @IsDateString()
  calledAt?: string;

  @Optional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contactName?: string;
}

export class ListCallsQuery {
  @IsOptional()
  @IsIn(CALL_TYPES)
  type?: CallType;

  /** Only calls with this number, in any formatting (the contact detail page). */
  @IsOptional()
  @Trim()
  @Matches(DIALABLE, {
    message: 'phone contains characters that cannot be dialed',
  })
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

/** A grouped Recents row ("Daniel White (3)") is several calls deleted together. */
export class DeleteCallsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsMongoId({ each: true })
  ids: string[];
}
