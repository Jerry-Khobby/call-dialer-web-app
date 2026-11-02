import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators';

@Controller()
export class AppController {
  /** Liveness check: GET /api/health */
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
