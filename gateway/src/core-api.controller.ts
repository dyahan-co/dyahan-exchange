import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CoreApiResult, CoreApiService } from './core-api.service.js';

@Controller('api/v1')
export class CoreApiController {
  constructor(private readonly coreApiService: CoreApiService) {}

  @Post('auth/register')
  async register(
    @Body() body: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      '/api/v1/auth/register',
      'POST',
      undefined,
      body,
    );

    this.send(response, result);
  }

  @Post('auth/login')
  async login(@Body() body: unknown, @Res() response: Response): Promise<void> {
    const result = await this.coreApiService.forward(
      '/api/v1/auth/login',
      'POST',
      undefined,
      body,
    );

    this.send(response, result);
  }

  @Post('auth/logout')
  async logout(
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      '/api/v1/auth/logout',
      'POST',
      authorization,
    );

    this.send(response, result);
  }

  @Get('auth/me')
  async me(
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      '/api/v1/auth/me',
      'GET',
      authorization,
    );

    this.send(response, result);
  }

  @Post('guess-rounds')
  async startGuessRound(
    @Headers('authorization') authorization: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      '/api/v1/guess-rounds',
      'POST',
      authorization,
    );

    this.send(response, result);
  }

  @Post('guess-rounds/:roundId/answers')
  async submitGuessAnswer(
    @Headers('authorization') authorization: string | undefined,
    @Param('roundId') roundId: string,
    @Body() body: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.coreApiService.forward(
      `/api/v1/guess-rounds/${encodeURIComponent(roundId)}/answers`,
      'POST',
      authorization,
      body,
    );

    this.send(response, result);
  }

  private send(response: Response, result: CoreApiResult): void {
    response.status(result.status);

    if (result.status === 204 || result.body === null) {
      response.end();
      return;
    }

    response.send(result.body);
  }
}
