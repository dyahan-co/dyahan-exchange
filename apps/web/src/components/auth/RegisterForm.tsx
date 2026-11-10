import { useState, type FormEvent } from 'react';
export function RegisterForm({ onNickname }: { onNickname?: (nickname: string) => void }) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [ack, setAck] = useState(false);
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const rules = [password.length >= 8, /[A-ZА-Я]/.test(password), /[0-9]/.test(password)];
  const strength = password.length ? rules.filter(Boolean).length : 0;
  const label = ['Добавь пароль', 'Слабый', 'Неплохой', 'Надёжный'][strength];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nickname.trim().length < 3 || nickname.trim().length > 24) {
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
    setMessage('Регистрация появится после подключения backend. Данные не отправлялись.');
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
          onChange={(e) => {
            setNickname(e.target.value);
            onNickname?.(e.target.value);
          }}
          placeholder="Придумайте ник"
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
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Придумайте пароль"
          />
          <button type="button" onClick={() => setShow((v) => !v)}>
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
          {[1, 2, 3].map((n) => (
            <i key={n} className={n <= strength ? `filled strength-${strength}` : ''} />
          ))}
        </div>
        <div className="password-rules">
          {['8+ символов', 'Заглавная буква', 'Цифра'].map((rule, i) => (
            <span key={rule} className={rules[i] ? 'passed' : ''}>
              {rules[i] ? '✓' : '○'} {rule}
            </span>
          ))}
        </div>
      </div>
      <label className="check-label">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />Я понимаю,
        что КУМ и д₽ не являются деньгами.
      </label>
      <button className="button primary full" type="submit">
        Создать аккаунт
      </button>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
