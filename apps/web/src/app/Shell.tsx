import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import { session, type SessionUser } from '../auth/session';

const disclaimer = 'Учебный проект. КУМ и д₽ — игровые единицы. Реальных платежей нет.';

function readUser(): SessionUser | null {
  return session.getToken() ? session.getUser() : null;
}

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [user, setUser] = useState<SessionUser | null>(readUser);

  const market = pathname === '/' || pathname === '/market';
  const games = pathname.startsWith('/guess') || pathname.startsWith('/roulette');
  const p2p = pathname.startsWith('/p2p');

  useEffect(() => {
    function updateUser() {
      setUser(readUser());
    }

    updateUser();
    window.addEventListener('storage', updateUser);
    window.addEventListener('focus', updateUser);

    return () => {
      window.removeEventListener('storage', updateUser);
      window.removeEventListener('focus', updateUser);
    };
  }, [pathname]);

  const marketPath = user ? '/market' : '/';
  const avatar = user ? Array.from(user.nickname.trim())[0]?.toLocaleUpperCase('ru-RU') || 'И' : '';

  return (
    <div className={`prototype-shell ${market ? 'market-shell' : 'account-shell'}`}>
      <div className="design-frame shell-frame">
        <header className="site-header">
          <Link to={marketPath} className="brand" aria-label="Дяхан Exchange — рынок">
            <img className="brand-logo" src={logo} alt="" />
            <span>Дяхан</span>
            <small>Exchange</small>
          </Link>

          <nav aria-label="Основная навигация">
            <Link className={market ? 'active' : ''} to={marketPath}>
              Рынок
            </Link>
            <Link className={games ? 'active' : ''} to={`${marketPath}#games`}>
              Игры
            </Link>
            <Link className={p2p ? 'active' : ''} to="/p2p">
              P2P
            </Link>
            <Link to="/market#chat">Чат</Link>
            <Link to="/market#bank">Банк</Link>
            <Link to="/market#community">Сообщество</Link>
          </nav>

          {user ? (
            <Link
              className="account-link player-account"
              to="/profile"
              title={`Вы вошли как ${user.nickname}`}
            >
              <span className="player-avatar" aria-hidden="true">
                {avatar}
              </span>
              {user.nickname} <small>⌄</small>
            </Link>
          ) : (
            <Link className="account-link" to="/login">
              Войти / регистрация
            </Link>
          )}
        </header>

        <div key={pathname} className="page-content">
          {children}
        </div>

        <footer className="site-footer">{disclaimer}</footer>
      </div>
    </div>
  );
}
