import { Module } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { resolve } from 'node:path';
import { RouletteController } from './roulette.controller';
import { ROULETTE_DRAW, ROULETTE_FILE, RouletteService } from './roulette.service';

@Module({
  controllers: [RouletteController],
  providers: [
    RouletteService,
    {
      provide: ROULETTE_FILE,
      useFactory: () => resolve(process.env.ROULETTE_DATA_FILE ?? '.data/roulette.json'),
    },
    {
      provide: ROULETTE_DRAW,
      useValue: () => randomInt(1, 11),
    },
  ],
})
export class RouletteModule {}
