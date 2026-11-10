import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CoreApiController } from './core-api.controller.js';
import { CoreApiService } from './core-api.service.js';

@Module({
  imports: [],
  controllers: [AppController, CoreApiController],
  providers: [AppService, CoreApiService],
})
export class AppModule {}