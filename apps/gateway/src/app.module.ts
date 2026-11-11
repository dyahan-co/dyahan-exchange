import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RouletteModule } from './roulette/roulette.module';

@Module({
  imports: [RouletteModule],
  controllers: [HealthController],
})
export class AppModule {}
