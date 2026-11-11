import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type { GuessRound, GuessSubmissionResult } from '../api/dyahanApi';
import { Shell } from '../app/Shell';

interface GuessResultState {
  round?: GuessRound;
  answer?: string;
  result?: GuessSubmissionResult | null;
}

export function GuessResultPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const state = (location.state ?? {}) as GuessResultState;
  const { round, answer = '', result } = state;

  const expired = params.get('status') === 'expired' || result?.status === 'EXPIRED';
  const correct = result?.correct === true;
  const hasResult = result != null;

  return (
    <Shell>
      <main className="guess-result-page">
        <div className="crumb-row">
          <span>
            Игры <b>/</b> Слоп-угадайка
          </span>
          <span>{expired ? 'Раунд истёк' : 'Результат раунда'}</span>
        </div>

        <h1>
          Раунд завершён<span className="accent-dot">.</span>
        </h1>

        <div className="guess-result-meta">
          <span>Раунд {round ? `#${round.roundId}` : ''}</span>
          <span>{expired ? 'Время вышло' : hasResult ? 'Ответ проверен сервером' : ''}</span>
        </div>

        <section className="guess-result-layout">
          {round && (
            <figure className="guess-art">
              <img
                className="guess-art-image"
                src={round.imageUrl}
                alt="Картинка раунда угадайки"
              />
              <figcaption>Изображение раунда</figcaption>
            </figure>
          )}

          <div className={`guess-settlement ${correct ? 'is-correct' : ''}`}>
            <h2>
              {correct
                ? 'Ответ засчитан'
                : expired
                  ? 'Время вышло'
                  : hasResult
                    ? 'Ответ не совпал'
                    : 'Результат недоступен'}
            </h2>

            {answer && (
              <p className="submitted-answer">
                <span>Ваш ответ</span>
                <b>{answer}</b>
              </p>
            )}

            {hasResult ? (
              <>
                <p>
                  {correct
                    ? 'Сервер подтвердил правильный ответ.'
                    : expired
                      ? 'Время на ответ закончилось.'
                      : 'Сервер проверил ответ. Попробуйте ещё раз в следующем раунде.'}
                </p>
                <strong className="guess-reward">
                  {correct ? `+${result.score} КУМ` : '0 КУМ'}
                </strong>
              </>
            ) : (
              <>
                <p>
                  {expired
                    ? 'Раунд завершился по таймеру. Награда за этот раунд не начислена.'
                    : 'Данные раунда не найдены. Вернитесь и запустите новый раунд.'}
                </p>
                <strong className="guess-reward pending">0 КУМ</strong>
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
          </div>
        </section>
      </main>
    </Shell>
  );
}
