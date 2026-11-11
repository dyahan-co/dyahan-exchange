import { Link } from 'react-router-dom';
import { MarketChart } from './MarketChart';
import { MarketAside } from './MarketAside';
import { GameCards } from './GameCards';
import { Shell } from '../../app/Shell';
import { MiniBalance } from '../MiniBalance';

export function MarketTerminal({ player = false }: { player?: boolean }) {
  return (
    <Shell>
      <main className="market-content">
        <div className="crumb-row">
          <span>Обзор / Рынок</span>
          <span>{player ? <MiniBalance/> : 'Гостевой доступ'}</span>
        </div>
        <h1>Рынок КУМcoin</h1>
        <section className="market-grid">
          <MarketChart />
          <MarketAside player={player} />
        </section>
        <GameCards />
        {player && (
          <Link className="market-shortcut" to="/guess">
            Вернуться к угадайке →
          </Link>
        )}
      </main>
    </Shell>
  );
}
