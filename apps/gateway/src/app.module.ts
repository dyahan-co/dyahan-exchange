import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { GuessRoundsController } from './guess-rounds.controller';

@Module({ controllers: [HealthController, GuessRoundsController] })
export class AppModule {}
