import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, dyahanApi, type GuessRound } from '../api/dyahanApi';
import { Shell } from '../app/Shell';
import { session } from '../auth/session';

const ROUND_DURATION_SECONDS = 120;

export function GuessRoundPage() {
  const navigate = useNavigate();
  const [round, setRound] = useState<GuessRound | null>(null);
  const [seconds, setSeconds] = useState(ROUND_DURATION_SECONDS);
  const [answer, setAnswer] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadRound() {
      const token = session.getToken();

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const newRound = await dyahanApi.startGuessRound(token);
        if (!cancelled) {
          setRound(newRound);
          setSeconds(
            Math.max(0, Math.ceil((new Date(newRound.expiresAt).getTime() - Date.now()) / 1000)),
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : 'Не удалось загрузить раунд. Попробуйте ещё раз.',
          );
        }
      }
    }

    void loadRound();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!round) return;

    const timerId = window.setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(round.expiresAt).getTime() - Date.now()) / 1000),
      );

      setSeconds(remaining);

      if (remaining === 0) {
        window.clearInterval(timerId);
        navigate('/guess/result?status=expired', {
          replace: true,
          state: { round, answer: '', result: null },
        });
      }
    }, 250);

    return () => window.clearInterval(timerId);
  }, [navigate, round]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanAnswer = answer.trim();
    const token = session.getToken();

    if (!round || !token || !cleanAnswer || submitting || seconds === 0) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await dyahanApi.submitGuessAnswer(token, round.roundId, cleanAnswer);

      navigate('/guess/result', {
        replace: true,
        state: { round, answer: cleanAnswer, result },
      });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Не удалось отправить ответ. Попробуйте ещё раз.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const progress = Math.min(100, (seconds / ROUND_DURATION_SECONDS) * 100);

  return (
    <Shell>
      <main className="guess-page">
        <div className="crumb-row">
          <span>
            Игры <b>/</b> Слоп-угадайка
          </span>
          <Link to="/market">← К рынку</Link>
        </div>

        {error && !round ? (
          <section className="answer-panel" role="alert">
            <h1>Не удалось открыть раунд</h1>
            <p>{error}</p>
            <button
              className="button primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Попробовать ещё раз
            </button>
          </section>
        ) : !round ? (
          <section className="answer-panel" aria-live="polite">
            Загружаем раунд…
          </section>
        ) : (
          <>
            <div className="guess-heading">
              <div>
                <span className="eyebrow">Раунд · {round.roundId}</span>
                <h1>
                  Слоп-угадайка<span className="accent-dot">.</span>
                </h1>
              </div>

              <div className={`timer-badge ${seconds <= 10 ? 'urgent' : ''}`} aria-live="off">
                <span>ОСТАЛОСЬ</span>
                <b>
                  {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                  {String(seconds % 60).padStart(2, '0')}
                </b>
              </div>
            </div>

            <div
              className="timer-track"
              role="progressbar"
              aria-label="Время на ответ"
              aria-valuemin={0}
              aria-valuemax={ROUND_DURATION_SECONDS}
              aria-valuenow={seconds}
            >
              <i style={{ width: `${progress}%` }} />
            </div>

            <section className="guess-layout">
              <figure className="guess-art">
                <img
                  className="guess-art-image"
                  src={round.imageUrl}
                  alt="Картинка для раунда угадайки"
                />
                <figcaption>Изображение раунда</figcaption>
              </figure>

              <form className="answer-panel" onSubmit={submit}>
                <span className="eyebrow">УГАДАЙКА</span>
                <h2>Что здесь изображено?</h2>
                <p>Назовите изображённое на картинке.</p>

                <label className="guess-answer-label" htmlFor="guess-answer">
                  Ваш ответ
                </label>
                <input
                  id="guess-answer"
                  className="guess-answer-input"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Введите свой вариант"
                  maxLength={240}
                  autoComplete="off"
                  disabled={submitting || seconds === 0}
                />

                <button
                  className="button primary full submit-answer"
                  type="submit"
                  disabled={!answer.trim() || submitting || seconds === 0}
                >
                  {submitting ? 'Проверяем…' : 'Ответить'}
                </button>

                <div className="guess-rules" aria-label="Правила раунда">
                  <b>Один ответ закрывает раунд.</b>
                  <span>Верный ответ принесёт награду.</span>
                </div>

                <button
                  className="hint-button"
                  type="button"
                  aria-expanded={hintVisible}
                  onClick={() => setHintVisible((visible) => !visible)}
                >
                  <span>{hintVisible ? 'Скрыть подсказку' : 'Показать подсказку'}</span>
                  <b>{hintVisible ? '−' : '+'}</b>
                </button>

                {hintVisible && <p className="guess-hint">{round.hint}</p>}

                {error && (
                  <p className="form-message" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </section>
          </>
        )}
      </main>
    </Shell>
  );
}
