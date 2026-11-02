import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { Error as MongooseError } from 'mongoose';

/**
 * Safety net: a value the DTOs let through but the schema rejects is the client's fault,
 * so it is a 400 in the usual error shape, not a 500.
 */
@Catch(MongooseError.ValidationError, MongooseError.CastError)
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(
    exception: MongooseError.ValidationError | MongooseError.CastError,
    host: ArgumentsHost,
  ) {
    if (host.getType() !== 'http') return; // The calls gateway handles its own errors
    const message =
      exception instanceof MongooseError.ValidationError
        ? Object.values(exception.errors).map((error) => error.message)
        : [`${exception.path} has an invalid value`];
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(400)
      .json({ statusCode: 400, message, error: 'Bad Request' });
  }
}
