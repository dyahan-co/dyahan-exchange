import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export function LoginForm() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(
    () => window.localStorage.getItem('dyahan.rememberNickname') === 'true',
  );
  const [capsLock, setCapsLock] = useState(false);
  useEffect(() => {
    if (remember) setNickname(window.localStorage.getItem('dyahan.nickname') ?? '');
  }, [remember]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nickname.trim() || !password) {
      setMessage('Введите игровой ник и пароль.');
      return;
    }
    if (remember) {
      window.localStorage.setItem('dyahan.rememberNickname', 'true');
      window.localStorage.setItem('dyahan.nickname', nickname.trim());
    } else {
      window.localStorage.removeItem('dyahan.rememberNickname');
      window.localStorage.removeItem('dyahan.nickname');
    }
    setMessage('Авторизация появится после подключения backend. Данные не отправлялись.');
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
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Например, Контрагент_42"
        />
      </label>
      <label>
        Пароль
        <div className="password-field">
          <input
            autoComplete="current-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
            placeholder="Не менее 8 символов"
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)}>
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
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Запомнить ник на этом устройстве
      </label>
      <button className="button primary full" type="submit">
        Войти в ДяханExchange <b>→</b>
      </button>
      <p className="form-switch">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
