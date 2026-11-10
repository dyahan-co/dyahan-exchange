import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shell } from '../app/Shell';

const DEMO_ROUND_SECONDS = 42;

export function GuessRoundPage() {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(DEMO_ROUND_SECONDS);
  const [answer, setAnswer] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (seconds === 0) {
      navigate('/guess/result?status=expired', { replace: true });
      return;
    }

    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [navigate, seconds]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAnswer = answer.trim();
    if (!normalizedAnswer || submitting) return;

    setSubmitting(true);
    // The local prototype records only the submitted text. It must not decide
    // whether it matches or modify the player's balance; the API owns that.
    navigate(`/guess/result?status=demo&answer=${encodeURIComponent(normalizedAnswer)}`);
  }

  const progress = (seconds / DEMO_ROUND_SECONDS) * 100;

  return (
    <Shell>
      <main className="guess-page">
        <div className="crumb-row">
          <span>
            Игры <b>/</b> Слоп-угадайка
          </span>
          <Link to="/market">← К рынку</Link>
        </div>

        <div className="guess-heading">
          <div>
            <span className="eyebrow">Раунд #0042 · демо</span>
            <h1>
              Слоп-угадайка<span className="accent-dot">.</span>
            </h1>
          </div>
          <div className={`timer-badge ${seconds <= 10 ? 'urgent' : ''}`} aria-live="off">
            <span>ОСТАЛОСЬ</span>
            <b>00:{String(seconds).padStart(2, '0')}</b>
          </div>
        </div>

        <div
          className="timer-track"
          role="progressbar"
          aria-label="Время на ответ"
          aria-valuemin={0}
          aria-valuemax={DEMO_ROUND_SECONDS}
          aria-valuenow={seconds}
        >
          <i style={{ width: `${progress}%` }} />
        </div>

        <section className="guess-layout">
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

          <form className="answer-panel" onSubmit={submit}>
            <span className="eyebrow">РАУНД #0042</span>
            <h2>Что здесь изображено?</h2>
            <p>Назовите картинку или придумайте промпт.</p>

            <label className="guess-answer-label" htmlFor="guess-answer">
              Ваш ответ
            </label>
            <input
              id="guess-answer"
              className="guess-answer-input"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Введите свой вариант"
              maxLength={500}
              autoComplete="off"
              disabled={submitting}
            />
            <button
              className="button primary full submit-answer"
              type="submit"
              disabled={!answer.trim() || submitting}
            >
              {submitting ? 'Отправляем…' : 'Ответить'}
            </button>

            <div className="guess-rules" aria-label="Правила раунда">
              <b>Один ответ закрывает раунд.</b>
              <span>Верный ответ: +1 КУМ.</span>
              <span>Ошибка не уменьшит баланс.</span>
            </div>

            <button
              className="hint-button"
              type="button"
              aria-expanded={hintVisible}
              onClick={() => setHintVisible((visible) => !visible)}
            >
              <span>{hintVisible ? 'Скрыть подсказку' : 'Подсказка: далеко от дома.'}</span>
              <b>{hintVisible ? '−' : '+'}</b>
            </button>
            {hintVisible && (
              <p className="guess-hint">
                В этом раунде мы ищем необычную сцену, связанную с космосом.
              </p>
            )}
            <small className="demo-note">ДЕМО-РАУНД · РЕЗУЛЬТАТ И БАЛАНС ОПРЕДЕЛЯЕТ СЕРВЕР</small>
          </form>
        </section>
      </main>
    </Shell>
  );
}
