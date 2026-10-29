import { Module } from '@nestjs/common';
import { GuessRoundsController } from './guess-rounds.controller';

@Module({ controllers: [GuessRoundsController] })
export class AppModule {}
