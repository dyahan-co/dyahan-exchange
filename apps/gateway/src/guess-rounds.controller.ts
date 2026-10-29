import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

// ЗАГЛУШКА. Настоящая логика (fuzzy match, ledger, баланс) живёт в Spring Core.
const ROUND_TTL_MS = 60_000;
const CORRECT_TITLE = 'Кот в космосе';
const HINT = 'далеко от дома';

type AnswerResult = {
  correct: boolean;
  correctTitle: string; // уходит клиенту только ПОСЛЕ ответа
  reward: number;
  balanceBefore: number;
  balanceAfter: number;
};
type StoredRound = { number: number; expiresAt: number; result?: AnswerResult };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^a-zа-я0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isCorrect = (answer: string) => {
  const n = normalize(answer);
  return n.includes('кот') && n.includes('космос');
};

@Controller()
export class GuessRoundsController {
  private readonly rounds = new Map<string, StoredRound>();
  private counter = 41; // первый раунд = #0042, как в макете U05

  // Ответ и словарь синонимов клиенту не отдаём (data-flow.md).
  @Post('guess-rounds')
  create() {
    const roundId = randomUUID();
    const number = ++this.counter;
    const expiresAt = Date.now() + ROUND_TTL_MS;
    this.rounds.set(roundId, { number, expiresAt });
    return {
      roundId,
      number,
      imageUrl: '/guess-placeholder.svg',
      expiresAt: new Date(expiresAt).toISOString(),
      hint: HINT,
    };
  }

  // Идемпотентно: повторная отправка возвращает прежний результат без второй награды.
  @Post('guess-rounds/:id/answers')
  answer(@Param('id') id: string, @Body() body: { answer?: string }) {
    const round = this.rounds.get(id);
    if (!round) throw new NotFoundException('Раунд не найден');
    if (round.result) return round.result;
    if (Date.now() > round.expiresAt) {
      throw new HttpException('Время раунда истекло', HttpStatus.GONE);
    }
    const correct = isCorrect(body?.answer ?? '');
    round.result = {
      correct,
      correctTitle: CORRECT_TITLE,
      reward: correct ? 1 : 0,
      balanceBefore: 28,
      balanceAfter: correct ? 29 : 28,
    };
    return round.result;
  }
}
