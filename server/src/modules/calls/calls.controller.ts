import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParseObjectIdPipe } from '../../common/parse-object-id.pipe';
import { Env } from '../../config/env.validation';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators';
import { CallsService } from './calls.service';
import { CreateCallDto, ListCallsQuery } from './dto/call.dto';
import { iceServers } from './ice-servers';

@Controller('calls')
export class CallsController {
  constructor(
    private readonly calls: CallsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Recent calls: GET /api/calls?type=missed&limit=50 */
  @Get()
  list(@CurrentUser() { userId }: AuthUser, @Query() query: ListCallsQuery) {
    return this.calls.list(userId, query);
  }

  /** STUN/TURN servers for setting up an in-app (WebRTC) call. */
  @Get('ice-servers')
  iceServers() {
    return iceServers({
      TURN_URL: this.config.get('TURN_URL', { infer: true }),
      TURN_USERNAME: this.config.get('TURN_USERNAME', { infer: true }),
      TURN_CREDENTIAL: this.config.get('TURN_CREDENTIAL', { infer: true }),
    });
  }

  /** Log a call the server didn't see, e.g. one handed off to the phone's dialer. */
  @Post()
  record(@CurrentUser() { userId }: AuthUser, @Body() dto: CreateCallDto) {
    return this.calls.record(userId, dto);
  }

  @Delete()
  @HttpCode(204)
  clear(@CurrentUser() { userId }: AuthUser) {
    return this.calls.clear(userId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() { userId }: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.calls.remove(userId, id);
  }
}
