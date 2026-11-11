import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/dyahanApi';
import { session } from '../../auth/session';

export function RegisterForm({ onNickname }: { onNickname?: (nickname: string) => void }) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [ack, setAck] = useState(false);
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rules = [password.length >= 8, /[A-ZА-Я]/.test(password), /[0-9]/.test(password)];
  const strength = password.length ? rules.filter(Boolean).length : 0;
  const label = ['Добавь пароль', 'Слабый', 'Неплохой', 'Надёжный'][strength];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const cleanNickname = nickname.trim();
    if (cleanNickname.length < 3 || cleanNickname.length > 24) {
      setMessage('Ник должен содержать от 3 до 24 символов.');
      return;
    }
    if (password.length < 8) {
      setMessage('Пароль должен содержать не менее 8 символов.');
      return;
    }
    if (!ack) {
      setMessage('Подтвердите, что понимаете игровой характер валюты.');
      return;
    }

    setSubmitting(true);
    try {
      await session.register(cleanNickname, password);
      navigate('/intro', { replace: true });
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : 'Не удалось создать аккаунт. Попробуйте ещё раз.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form register-form" onSubmit={submit}>
      <h2>Ваш игровой аккаунт</h2>
      <p>Ник появится в чате, заявках и рейтингах.</p>

      <label>
        Ник · 3–24 символа
        <input
          autoComplete="username"
          minLength={3}
          maxLength={24}
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            onNickname?.(event.target.value);
          }}
          placeholder="Придумайте ник"
          disabled={submitting}
        />
      </label>

      <label>
        Пароль · от 8 символов
        <div className="password-field">
          <input
            autoComplete="new-password"
            minLength={8}
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Придумайте пароль"
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => setShow((visible) => !visible)}
            disabled={submitting}
          >
            {show ? 'СКРЫТЬ' : 'ПОКАЗАТЬ'}
          </button>
        </div>
      </label>

      <div className="password-strength" aria-live="polite">
        <div className="strength-top">
          <span>НАДЁЖНОСТЬ ПАРОЛЯ</span>
          <b>{label}</b>
        </div>
        <div className="strength-bars">
          {[1, 2, 3].map((number) => (
            <i key={number} className={number <= strength ? `filled strength-${strength}` : ''} />
          ))}
        </div>
        <div className="password-rules">
          {['8+ символов', 'Заглавная буква', 'Цифра'].map((rule, index) => (
            <span key={rule} className={rules[index] ? 'passed' : ''}>
              {rules[index] ? '✓' : '○'} {rule}
            </span>
          ))}
        </div>
      </div>

      <label className="check-label">
        <input
          type="checkbox"
          checked={ack}
          onChange={(event) => setAck(event.target.checked)}
          disabled={submitting}
        />
        Я понимаю, что КУМ и д₽ не являются деньгами.
      </label>

      <button className="button primary full" type="submit" disabled={submitting}>
        {submitting ? 'Создаём аккаунт…' : 'Создать аккаунт'}
      </button>

      <p className="form-switch">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>

      {message && (
        <p className="form-message" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
