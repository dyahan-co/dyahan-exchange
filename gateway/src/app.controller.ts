import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Post('auth/demo')
  demoLogin(@Body() body: { name?: string }): {
    accessToken: string;
    user: { id: string; name: string };
  } {
    const name = body.name?.trim() || 'Демо-пользователь';

    return {
      accessToken: 'demo-token',
      user: { id: 'demo-user', name },
    };
  }

  @Get('me')
  getMe(): { id: string; name: string } {
    return { id: 'demo-user', name: 'Демо-пользователь' };
  }
}
