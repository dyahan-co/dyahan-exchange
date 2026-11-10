import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MarketEvents } from './MarketEvents';

export function MarketAside({ player = false }: { player?: boolean }) {
  const [history, setHistory] = useState(false);
  return (
    <aside className={`guest-card ${player ? 'player-balance' : ''}`}>
      {player ? (
        <>
          <h2>Ваш баланс</h2>
          <strong>28,00 КУМ</strong>
          <p>Доступно для игр и сделок</p>
          <div className="guest-balance">
            <span>В резерве</span>
            <b>4,00 КУМ</b>
            <span>Демо-рубли</span>
            <b>1 200,00 д₽</b>
          </div>
          <button className="button history-button full" onClick={() => setHistory((v) => !v)}>
            ▤ История операций
          </button>
          {history && (
            <div className="history-panel">
              <div>
                <span className="history-type reward">+1</span>
                <b>Награда за угадайку</b>
                <small>Сегодня, 12:42</small>
                <strong>+1 КУМ</strong>
              </div>
              <div>
                <span className="history-type hold">−2</span>
                <b>Резерв для сделки</b>
                <small>Сегодня, 12:18</small>
                <strong>2 КУМ</strong>
              </div>
              <div>
                <span className="history-type demo">₽</span>
                <b>Стартовый демо-баланс</b>
                <small>Сегодня, 11:50</small>
                <strong>+1 200 д₽</strong>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <h2>Попробовать бесплатно</h2>
          <strong>Начните с угадайки</strong>
          <p>Один верный ответ — один КУМ.</p>
          <div className="guest-balance">
            <span>В резерве</span>
            <b>—</b>
            <span>Демо-рубли</span>
            <b>—</b>
          </div>
          <Link to="/register" className="button primary full">
            Создать аккаунт
          </Link>
        </>
      )}
      <MarketEvents player={player} />
    </aside>
  );
}
