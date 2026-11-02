import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Liveness check: GET /api/health */
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
