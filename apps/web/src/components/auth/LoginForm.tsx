import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/dyahanApi';
import { session } from '../../auth/session';

export function LoginForm() {
  const navigate = useNavigate();

  const [remember, setRemember] = useState(
    () => window.localStorage.getItem('dyahan.rememberNickname') === 'true',
  );

  const [nickname, setNickname] = useState(() => {
    if (window.localStorage.getItem('dyahan.rememberNickname') === 'true') {
      return window.localStorage.getItem('dyahan.nickname') ?? '';
    }

    return '';
  });

  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const cleanNickname = nickname.trim();

    if (!cleanNickname || !password) {
      setMessage('Введите игровой ник и пароль.');
      return;
    }

    if (remember) {
      window.localStorage.setItem('dyahan.rememberNickname', 'true');
      window.localStorage.setItem('dyahan.nickname', cleanNickname);
    } else {
      window.localStorage.removeItem('dyahan.rememberNickname');
      window.localStorage.removeItem('dyahan.nickname');
    }

    setSubmitting(true);

    try {
      await session.login(cleanNickname, password);
      navigate('/guess', { replace: true });
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : 'Не удалось войти. Попробуйте ещё раз.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <span className="eyebrow">ЛИЧНЫЙ КАБИНЕТ</span>
      <h2>Войти в аккаунт</h2>
      <p className="form-lead">Твои сделки, баланс и игровые достижения ждут.</p>

      <label>
        Игровой ник
        <input
          autoComplete="username"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Например, Контрагент_42"
          disabled={submitting}
        />
      </label>

      <label>
        Пароль
        <div className="password-field">
          <input
            autoComplete="current-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
            placeholder="Не менее 8 символов"
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={submitting}
          >
            {showPassword ? 'СКРЫТЬ' : 'ПОКАЗАТЬ'}
          </button>
        </div>
      </label>

      {capsLock && (
        <p className="caps-warning" role="status">
          Caps Lock включён
        </p>
      )}

      <label className="remember-label">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          disabled={submitting}
        />
        Запомнить ник на этом устройстве
      </label>

      <button className="button primary full" type="submit" disabled={submitting}>
        {submitting ? 'Входим…' : 'Войти в ДяханExchange'} <b>→</b>
      </button>

      <p className="form-switch">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>

      {message && (
        <p className="form-message" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
