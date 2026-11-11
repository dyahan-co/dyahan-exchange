import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const disclaimer = 'Учебный проект. КУМ и д₽ — игровые единицы. Реальных платежей нет.';

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const market = pathname === '/' || pathname === '/market';
  const player = pathname === '/market' || pathname === '/profile' || pathname === '/intro' || pathname.startsWith('/guess');
  return (
    <div className={`prototype-shell ${market ? 'market-shell' : 'account-shell'}`}>
      <div className="design-frame shell-frame">
        <header className="site-header">
          <Link to="/" className="brand" aria-label="Дяхан Exchange — рынок">
            <img className="brand-logo" src={logo} alt="" />
            <span>Дяхан</span>
            <small>Exchange</small>
          </Link>
          <nav aria-label="Основная навигация">
            <Link className={market ? 'active' : ''} to={player ? '/market' : '/'}>
              Рынок
            </Link>
            <Link to={`${player ? '/market' : '/'}#games`}>Игры</Link>
            <Link to="/market#p2p">P2P</Link>
            <Link to="/market#chat">Чат</Link>
            <Link to="/market#bank">Банк</Link>
            <Link to="/market#community">Сообщество</Link>
          </nav>
          <Link className={`account-link ${player ? 'player-account' : ''}`} to={player ? ('/profile') : ('/login')}>
            {player ? (
              <>
                <span className="player-avatar">К</span>Контрагент_42 <small>⌄</small>
              </>
            ) : (
              'Войти / регистрация'
            )}
          </Link>
        </header>
        <div key={pathname} className="page-content">
          {children}
        </div>
        <footer className="site-footer">{disclaimer}</footer>
      </div>
    </div>
  );
}
