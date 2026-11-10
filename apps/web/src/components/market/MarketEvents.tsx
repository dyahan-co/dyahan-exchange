import { useState } from 'react';

const events = [
  { who: 'Кит_404', action: 'скупил запас', amount: '+240 КУМ', time: 'только что', tone: 'buy' },
  {
    who: 'Бабушка_с_плечом',
    action: 'поймала фитиль',
    amount: '42,08 д₽',
    time: '1 мин назад',
    tone: 'sell',
  },
  {
    who: 'Контрагент_42',
    action: 'зашёл на рынок',
    amount: 'новый игрок',
    time: '3 мин назад',
    tone: 'neutral',
  },
];
export function MarketEvents({ player = false }: { player?: boolean }) {
  const [offset, setOffset] = useState(0);
  const event = events[offset % events.length];
  return (
    <div className="last-event">
      <div className="event-heading">
        <small>{player ? 'ПОСЛЕДНЕЕ СОБЫТИЕ' : 'ЛЕНТА РЫНКА · ДЕМО'}</small>
        {!player && (
          <button aria-label="Следующее событие" onClick={() => setOffset((v) => v + 1)}>
            ↻
          </button>
        )}
      </div>
      <div className="event-detail">
        <span className={`event-icon ${event.tone}`}>
          {event.tone === 'buy' ? '↗' : event.tone === 'sell' ? '↘' : '✦'}
        </span>
        <div>
          <b>{player ? 'Рынок КУМcoin' : event.who}</b>
          <span>{player ? 'Кит продал запас КУМ.' : event.action}</span>
        </div>
        <strong>{player ? '12:48' : event.amount}</strong>
      </div>
      <span className="event-time">
        {player ? 'внутреннее событие рынка' : `${event.time} · внутренняя симуляция рынка`}
      </span>
    </div>
  );
}
