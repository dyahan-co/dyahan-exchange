import { Controller, Headers, Param, Post } from '@nestjs/common';
import { RouletteService } from './roulette.service';

@Controller('api/v1/roulette')
export class RouletteController {
  constructor(private readonly roulette: RouletteService) {}

  private token(authorization?: string): string {
    return authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  }

  @Post('demo')
  createDemo() {
    return this.roulette.createDemo();
  }

  @Post('sync')
  sync(@Headers('authorization') authorization?: string) {
    return this.roulette.sync(this.token(authorization));
  }

  @Post('rounds')
  start(
    @Headers('authorization') authorization?: string,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.roulette.start(this.token(authorization), key ?? '');
  }

  @Post('rounds/:id/reveal')
  reveal(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    return this.roulette.reveal(this.token(authorization), id);
  }
}
