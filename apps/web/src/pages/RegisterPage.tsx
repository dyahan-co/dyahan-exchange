import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../app/Shell';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ProfilePreview } from '../components/auth/ProfilePreview';
export function RegisterPage() {
  const [nickname, setNickname] = useState('');
  return (
    <Shell>
      <main className="auth-content register-page">
        <div className="crumb-row">
          <span>
            АККАУНТ <b>/</b> РЕГИСТРАЦИЯ
          </span>
          <Link to="/">← Гостевой рынок</Link>
        </div>
        <h1>
          Создай своего игрока<span className="accent-dot">.</span>
        </h1>
        <p className="auth-subtitle">Входной билет в самую серьёзную несерьёзную экономику.</p>
        <section className="auth-card register-card">
          <RegisterForm onNickname={setNickname} />
          <aside className="register-aside">
            <h2>После регистрации</h2>
            <ol>
              <li>
                <span>01</span>Узнайте правила
              </li>
              <li>
                <span>02</span>Получите первый КУМ в угадайке
              </li>
              <li>
                <span>03</span>Откройте рынок и игры
              </li>
            </ol>
            <ProfilePreview nickname={nickname} />
          </aside>
        </section>
      </main>
    </Shell>
  );
}
