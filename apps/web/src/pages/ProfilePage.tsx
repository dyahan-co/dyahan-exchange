import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Shell } from '../app/Shell';
import { MiniBalance } from '../components/MiniBalance';
import { session } from '../auth/session';
import type { RootState } from '../store';
import './feature-pages.css';

const filters = [
  { id: 'all', label: 'Все операции' },
  { id: 'games', label: 'Игры' },
  { id: 'p2p', label: 'P2P' },
  { id: 'credit', label: 'Демо-баланс' },
] as const;

type Filter = (typeof filters)[number]['id'];

export function ProfilePage() {
  const navigate = useNavigate();
  const { available, availableDr, reserved } = useSelector((state: RootState) => state.balance);
  const [filter, setFilter] = useState<Filter>('all');
  const [loggingOut, setLoggingOut] = useState(false);
  const nickname = session.getUser()?.nickname ?? 'Игрок';

  async function logout() {
    setLoggingOut(true);
    try {
      await session.logout();
    } catch {
      // The local session is cleared by session.logout even if the server is unreachable.
    } finally {
      navigate('/login', { replace: true });
    }
  }

  const selectedFilter = filters.find((item) => item.id === filter)?.label;

  return (
    <Shell>
      <main className="feature-page profile-page">
        <div className="feature-kicker-row">
          <p className="feature-breadcrumb">
            АККАУНТ <span>/</span> ПРОФИЛЬ
          </p>
          <MiniBalance />
        </div>
        <section className="profile-heading" aria-labelledby="profile-title">
          <div className="profile-avatar" aria-hidden="true">
            {nickname.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="feature-eyebrow">ИГРОК · АККАУНТ АКТИВЕН</p>
            <h1 id="profile-title">{nickname}</h1>
            <p>Ваш игровой аккаунт Дяхан Exchange</p>
          </div>
          <Link className="profile-intro-link" to="/intro">
            Как устроена биржа? <span aria-hidden="true">↗</span>
          </Link>
        </section>
        <section className="balance-cards" aria-label="Сводка баланса">
          <article className="balance-card">
            <span>ДОСТУПНО</span>
            <strong className="balance-positive">
              {available} <small>КУМ</small>
            </strong>
            <p>Игровой баланс</p>
          </article>
          <article className="balance-card">
            <span>В РЕЗЕРВЕ</span>
            <strong>
              {reserved} <small>КУМ</small>
            </strong>
            <p>Зарезервировано</p>
          </article>
          <article className="balance-card">
            <span>ДЕМО-БАЛАНС</span>
            <strong>
              {availableDr.toLocaleString('ru-RU')} <small>д₽</small>
            </strong>
            <p>Демо-рубли</p>
          </article>
          <article className="balance-card credit-card">
            <span>КРЕДИТ</span>
            <strong>—</strong>
            <p>Нет данных о кредитных операциях</p>
          </article>
        </section>
        <p className="profile-data-note" role="note">
          Баланс пока отображает локальное состояние приложения. История и данные кошелька появятся
          после подключения API кошелька.
        </p>
        <section className="transactions-section" aria-labelledby="transactions-title">
          <div className="feature-section-heading">
            <div>
              <p className="feature-eyebrow">ВАША АКТИВНОСТЬ</p>
              <h2 id="transactions-title">История операций</h2>
            </div>
            <span>ПОСЛЕДНИЕ ОПЕРАЦИИ</span>
          </div>
          <div className="transaction-filters" role="group" aria-label="Фильтр операций">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                className={filter === item.id ? 'selected' : ''}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="transactions-empty" role="status">
            <span aria-hidden="true">↗</span>
            <h3>Операций пока нет</h3>
            <p>
              {filter === 'all'
                ? 'Когда появятся операции, здесь будет их история.'
                : `В разделе «${selectedFilter}» пока нет операций.`}
            </p>
            <Link to="/guess" className="feature-button secondary">
              Перейти к угадайке <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
        <div className="profile-bottom">
          <Link to="/market">← Вернуться на рынок</Link>
          <button type="button" onClick={logout} disabled={loggingOut}>
            {loggingOut ? 'Выходим…' : 'Выйти из аккаунта'}
          </button>
        </div>
      </main>
    </Shell>
  );
}

export default ProfilePage;
