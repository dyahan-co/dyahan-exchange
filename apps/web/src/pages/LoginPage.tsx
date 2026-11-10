import { Shell } from '../app/Shell';
import { LoginForm } from '../components/auth/LoginForm';
import hero from '../assets/u02-login-hero.jpg';
import { Link } from 'react-router-dom';
export function LoginPage() {
  return (
    <Shell>
      <main className="auth-content login-page">
        <div className="crumb-row">
          <span>
            АККАУНТ <b>/</b> ВХОД
          </span>
          <Link to="/">← Гостевой рынок</Link>
        </div>
        <h1>
          С возвращением<span className="accent-dot">.</span>
        </h1>
        <p className="auth-subtitle">Войди и продолжай менять правила рынка.</p>
        <section className="auth-card login-card">
          <div className="auth-intro">
            <h2>ДяханExchange</h2>
            <p>
              Игровая биржа с серьёзными правилами
              <br />и несерьёзной валютой.
            </p>
            <img src={hero} alt="Дяхан в автомобиле" />
            <b>Для входа не нужны кошелёк и реквизиты.</b>
            <p>Баланс и история сохраняются в аккаунте.</p>
          </div>
          <LoginForm />
        </section>
      </main>
    </Shell>
  );
}
