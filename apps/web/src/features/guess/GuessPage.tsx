import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, sendAnswer, startRound, type AnswerResult, type Round } from './api';
import './GuessPage.css';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'round'; round: Round }
  | { phase: 'submitting'; round: Round }
  | { phase: 'result'; round: Round; result: AnswerResult };

export const formatTime = (ms: number): string => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const roundLabel = (n: number) => `Раунд #${String(n).padStart(4, '0')}`;

export function GuessPage() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [answer, setAnswer] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const load = useCallback(async () => {
    setState({ phase: 'loading' });
    setAnswer('');
    setNotice(null);
    setRemaining(null);
    try {
      setState({ phase: 'round', round: await startRound() });
    } catch {
      setState({ phase: 'error', message: 'Не удалось загрузить раунд. Проверьте сеть и повторите.' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeRound = state.phase === 'round' || state.phase === 'submitting' ? state.round : null;

  useEffect(() => {
    if (!activeRound) return;
    const tick = () => setRemaining(new Date(activeRound.expiresAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [activeRound]);

  const expired = remaining !== null && remaining <= 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state.phase !== 'round' || !answer.trim() || expired) return;
    const { round } = state;
    setState({ phase: 'submitting', round });
    setNotice(null);
    try {
      const result = await sendAnswer(round.roundId, answer.trim());
      setState({ phase: 'result', round, result });
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        setNotice('Время вышло. Начните новый раунд.');
        setRemaining(0);
      } else {
        setNotice('Ответ не отправился. Попробуйте ещё раз.');
      }
      setState({ phase: 'round', round });
    }
  };

  const disclaimer = (
    <p className="guess__disclaimer">Учебный проект. КУМ и д₽ — игровые единицы. Реальных платежей нет.</p>
  );

  if (state.phase === 'loading') {
    return (
      <main className="guess">
        <p role="status">Загружаем раунд…</p>
      </main>
    );
  }

  if (state.phase === 'error') {
    return (
      <main className="guess">
        <p role="alert">{state.message}</p>
        <button type="button" onClick={() => void load()}>
          Повторить
        </button>
      </main>
    );
  }

  if (state.phase === 'result') {
    const { round, result } = state;
    return (
      <main className="guess">
        <h1>Раунд завершён</h1>
        {disclaimer}
        <p className="guess__meta">
          {roundLabel(round.number)} · Ответ закрыт
        </p>
        <section aria-live="polite">
          <h2>{result.correct ? 'Ответ засчитан' : 'Ответ не засчитан'}</h2>
          <p>Верное название: «{result.correctTitle}».</p>
          <p data-testid="reward" className="guess__reward">
            +{result.reward} КУМ
          </p>
          <dl>
            <dt>Баланс до</dt>
            <dd data-testid="balance-before">{result.balanceBefore} КУМ</dd>
            <dt>Баланс после</dt>
            <dd data-testid="balance-after">{result.balanceAfter} КУМ</dd>
          </dl>
        </section>
        <button type="button" onClick={() => void load()}>
          Следующий раунд
        </button>
      </main>
    );
  }

  const { round } = state;
  const submitting = state.phase === 'submitting';

  return (
    <main className="guess">
      <h1>Слоп-угадайка</h1>
      {disclaimer}
      <p className="guess__meta">
        {roundLabel(round.number)} · Осталось{' '}
        <span data-testid="timer">{formatTime(remaining ?? 0)}</span>
      </p>
      <img className="guess__image" src={round.imageUrl} alt="Картинка раунда" />
      <h2>Что здесь изображено?</h2>
      <p>Назовите картинку или придумайте промпт.</p>

      {expired ? (
        <>
          <p role="alert">Время вышло.</p>
          <button type="button" onClick={() => void load()}>
            Следующий раунд
          </button>
        </>
      ) : (
        <form onSubmit={(e) => void submit(e)}>
          <label htmlFor="guess-answer">Ваш ответ</label>
          <input
            id="guess-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Введите свой вариант"
            disabled={submitting}
            autoComplete="off"
          />
          <button type="submit" disabled={submitting || !answer.trim()}>
            Ответить
          </button>
        </form>
      )}

      {notice && <p role="alert">{notice}</p>}
      <ul className="guess__rules">
        <li>Один ответ закрывает раунд.</li>
        <li>Верный ответ: +1 КУМ.</li>
        <li>Ошибка не уменьшит баланс.</li>
      </ul>
      <p>Подсказка: {round.hint}.</p>
    </main>
  );
}
