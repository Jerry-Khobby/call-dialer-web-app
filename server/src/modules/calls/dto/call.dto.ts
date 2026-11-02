import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Optional, Trim } from '../../../common/validation';
import { CALL_TYPES, type CallType } from '../schemas/call.schema';

export class CreateCallDto {
  // Anything dialable, including service codes like *123#.
  @Trim()
  @IsString()
  @Matches(/^[0-9+*#\s().-]+$/, {
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
