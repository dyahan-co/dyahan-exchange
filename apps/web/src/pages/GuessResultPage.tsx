import { Link, useSearchParams } from 'react-router-dom';
import { Shell } from '../app/Shell';

type RoundStatus = 'demo' | 'correct' | 'incorrect' | 'expired' | 'unavailable';

function readStatus(value: string | null): RoundStatus {
  if (value === 'demo' || value === 'correct' || value === 'incorrect' || value === 'expired') {
    return value;
  }
  return 'unavailable';
}

export function GuessResultPage() {
  const [params] = useSearchParams();
  const status = readStatus(params.get('status'));
  const submittedAnswer = params.get('answer')?.slice(0, 500) ?? '';
  const expired = status === 'expired';
  const settled = status === 'correct' || status === 'incorrect';
  const correct = status === 'correct';

  return (
    <Shell>
      <main className="guess-result-page">
        <div className="crumb-row">
          <span>
            Игры <b>/</b> Слоп-угадайка
          </span>
          <span>28 КУМ / 1 200 д₽</span>
        </div>

        <h1>
          Раунд завершён<span className="accent-dot">.</span>
        </h1>
        <div className="guess-result-meta">
          <span>Раунд #0042</span>
          <span>
            {expired ? 'Время вышло' : settled ? 'Ответ закрыт' : 'Ожидает проверки сервером'}
          </span>
        </div>

        <section className="guess-result-layout">
          <figure className="guess-art">
            <div
              className="guess-art-image"
              role="img"
              aria-label="Иллюстрация раунда: Дяхан и КУМ на фоне биржевого графика"
            >
              <div className="guess-art-coin">К</div>
              <div className="guess-art-brand">
                ДЯХАН
                <br />
                <span>Exchange</span>
              </div>
            </div>
            <figcaption>
              Условная картинка для макета. В продукте — подготовленный нейрослоп.
            </figcaption>
          </figure>

          <div className={`guess-settlement ${correct ? 'is-correct' : ''}`}>
            <h2>
              {correct
                ? 'Ответ засчитан'
                : expired
                  ? 'Раунд завершён'
                  : settled
                    ? 'Ответ не совпал'
                    : status === 'demo'
                      ? 'Ответ отправлен'
                      : 'Результат появится после проверки'}
            </h2>

            {settled ? (
              <>
                <p>
                  {correct
                    ? 'Верное название: «Кот в космосе».'
                    : 'Попробуйте сформулировать ответ иначе в следующем раунде.'}
                </p>
                <strong className="guess-reward">{correct ? '+1 КУМ' : '0 КУМ'}</strong>
                <dl className="guess-balance-diff">
                  <div>
                    <dt>Баланс до</dt>
                    <dd>28 КУМ</dd>
                  </div>
                  <div>
                    <dt>Баланс после</dt>
                    <dd>{correct ? '29 КУМ' : '28 КУМ'}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                {submittedAnswer && (
                  <p className="submitted-answer">
                    <span>Ваш ответ</span>
                    <b>{submittedAnswer}</b>
                  </p>
                )}
                <p>
                  {expired
                    ? 'Не успели отправить ответ. Баланс не изменился.'
                    : status === 'demo'
                      ? 'Это локальный демо-режим. Проверка ответа и начисление награды появятся после подключения API.'
                      : 'Откройте раунд и отправьте ответ, чтобы получить результат.'}
                </p>
                <strong className="guess-reward pending">
                  {expired ? '0 КУМ' : 'Проверка на сервере'}
                </strong>
              </>
            )}

            <div className="guess-result-actions">
              <Link className="button primary full" to="/guess">
                Следующий раунд
              </Link>
              <Link className="button full guess-market-button" to="/market">
                Рынок
              </Link>
            </div>
            {!settled && (
              <small className="demo-note">
                БАЛАНС НЕ ИЗМЕНЁН · ИТОГОВЫЕ ДАННЫЕ ПРИХОДЯТ ОТ СЕРВЕРА
              </small>
            )}
          </div>
        </section>
      </main>
    </Shell>
  );
}
