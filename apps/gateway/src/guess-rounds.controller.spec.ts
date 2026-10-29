import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';

describe('GuessRoundsController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  const server = () => app.getHttpServer();
  const startRound = async () => (await request(server()).post('/guess-rounds').expect(201)).body;

  it('создаёт раунд и не отдаёт скрытый ответ', async () => {
    const round = await startRound();
    expect(round).toEqual({
      roundId: expect.any(String),
      number: 42,
      imageUrl: '/guess-placeholder.svg',
      expiresAt: expect.any(String),
      hint: 'далеко от дома',
    });
    expect(JSON.stringify(round)).not.toContain('космосе');
  });

  it('верный ответ даёт +1 КУМ', async () => {
    const { roundId } = await startRound();
    const res = await request(server())
      .post(`/guess-rounds/${roundId}/answers`)
      .send({ answer: 'Кот в космосе' })
      .expect(201);
    expect(res.body).toMatchObject({ correct: true, reward: 1, balanceAfter: 29 });
  });

  it('неверный и пустой ответ не меняют баланс', async () => {
    const { roundId } = await startRound();
    const wrong = await request(server())
      .post(`/guess-rounds/${roundId}/answers`)
      .send({ answer: 'Собака на пляже' })
      .expect(201);
    expect(wrong.body).toMatchObject({ correct: false, reward: 0, balanceAfter: 28 });

    const second = await startRound();
    const empty = await request(server())
      .post(`/guess-rounds/${second.roundId}/answers`)
      .send({})
      .expect(201);
    expect(empty.body.correct).toBe(false);
  });

  it('повторная отправка возвращает прежний результат без второй награды', async () => {
    const { roundId } = await startRound();
    const url = `/guess-rounds/${roundId}/answers`;
    const first = await request(server()).post(url).send({ answer: 'Кот в космосе' });
    const again = await request(server()).post(url).send({ answer: 'что-то другое' });
    expect(again.body).toEqual(first.body);
  });

  it('неизвестный раунд даёт 404', async () => {
    await request(server()).post('/guess-rounds/unknown/answers').send({ answer: 'x' }).expect(404);
  });

  it('просроченный раунд даёт 410', async () => {
    const { roundId } = await startRound();
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(now + 61_000);
    await request(server())
      .post(`/guess-rounds/${roundId}/answers`)
      .send({ answer: 'x' })
      .expect(410);
  });
});
