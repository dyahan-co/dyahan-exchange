import {
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CoreApiService } from './core-api.service.js';
import type { CoreApiResult } from './core-api.service.js';

@Controller('api/v1')
export class RouletteApiController {
  constructor(private readonly coreApiService: CoreApiService) {}

  @Post('roulette-rounds')
  async createRound(
    @Headers('authorization') authorization: string | undefined,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      '/api/v1/roulette-rounds',
      'POST',
      authorization,
      undefined,
      idempotencyKey,
    );

    this.send(response, result);
  }

  @Get('roulette-rounds/active')
  async activeRound(
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      '/api/v1/roulette-rounds/active',
      'GET',
      authorization,
    );

    this.send(response, result);
  }

  @Get('roulette-rounds/:roundId/reveal')
  async reveal(
    @Headers('authorization') authorization: string | undefined,
    @Param('roundId') roundId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      `/api/v1/roulette-rounds/${encodeURIComponent(roundId)}/reveal`,
      'GET',
      authorization,
    );

    this.send(response, result);
  }

  @Get('roulette-rounds/:roundId')
  async getRound(
    @Headers('authorization') authorization: string | undefined,
    @Param('roundId') roundId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      `/api/v1/roulette-rounds/${encodeURIComponent(roundId)}`,
      'GET',
      authorization,
    );

    this.send(response, result);
  }

  @Get('wallet')
  async wallet(
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      '/api/v1/wallet',
      'GET',
      authorization,
    );

    this.send(response, result);
  }

  private send(response: Response, result: CoreApiResult): void {
    // Ответы содержат личный баланс и состояние раунда.
    response.setHeader('Cache-Control', 'no-store');
    response.status(result.status);

    if (result.status === 204 || result.body === null) {
      response.end();
      return;
    }

    response.send(result.body);
  }
}
