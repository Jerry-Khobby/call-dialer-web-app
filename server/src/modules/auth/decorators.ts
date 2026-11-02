import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { AuthUser } from './auth.types';

export const IS_PUBLIC = 'isPublic';

/** Opts a route out of the global JWT guard (register, login, health). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The signed-in user on an authenticated route. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
