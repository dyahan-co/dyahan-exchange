import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../app/Shell';
import { MiniBalance } from '../components/MiniBalance';
import { session } from '../auth/session';
import './feature-pages.css';

interface P2POrder {
  counterparty: string;
  stats: string;
  rate: string;
  volume: string;
  total: string;
}

const mockOrders: P2POrder[] = [
  {
    counterparty: 'Пельмень_228',
    stats: '12 сделок · 98% / Контрагент на связи',
    rate: '41,00 дР',
    volume: '5 КУМ',
    total: '205,00 дР',
  },
  {
    counterparty: 'Кот_на_ликвидности',
    stats: '31 сделка · 96% / Торг небазарный',
    rate: '42,00 дР',
    volume: '10 КУМ',
    total: '420,00 дР',
  },
  {
    counterparty: 'Ордерович',
    stats: '8 сделок · 100% / Претензий нет',
    rate: '43,00 дР',
    volume: '20 КУМ',
    total: '860,00 дР',
  },
];

export default function P2POrderBookPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [quantity, setQuantity] = useState('От 1 КУМ');
  const [price, setPrice] = useState('Любая');

  return (
    <Shell>
      <main className="feature-page p2p-page">
        <div className="crumb-row">
          <span>Торговля / P2P</span>
          <span>{session.getToken() ? <MiniBalance /> : 'Гостевой доступ'}</span>
        </div>

        <div className="p2p-heading">
          <div>
            <p className="feature-eyebrow">ОТКРЫТЫЙ РЫНОК</p>
            <h1>Стакан P2P</h1>
            <p className="feature-lead">Заявки игроков на обмен игровых КУМ и дР.</p>
          </div>
          <Link className="feature-button primary" to="/p2p/create">
            Создать заявку <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="p2p-tabs" role="group" aria-label="Направление сделки">
          <button
            type="button"
            className={tabIndex === 0 ? 'selected' : ''}
            aria-pressed={tabIndex === 0}
            onClick={() => setTabIndex(0)}
          >
            Купить КУМ
          </button>
          <button
            type="button"
            className={tabIndex === 1 ? 'selected' : ''}
            aria-pressed={tabIndex === 1}
            onClick={() => setTabIndex(1)}
          >
            Продать КУМ
          </button>
        </div>

        <form className="p2p-filters" onSubmit={(event) => event.preventDefault()}>
          <label>
            Количество
            <input value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label>
            Цена за КУМ
            <input value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
          <button className="feature-button secondary" type="submit">
            Применить фильтры
          </button>
          <p className="p2p-sort">Цена: по возрастанию ↓</p>
        </form>

        <section className="p2p-orders" aria-label="Список заявок">
          <div className="p2p-order-head" aria-hidden="true">
            <span>КОНТРАГЕНТ</span>
            <span>КУРС</span>
            <span>ОБЪЁМ</span>
            <span>ВСЕГО</span>
          </div>
          {mockOrders.map((order) => (
            <article className="p2p-order-row" key={order.counterparty}>
              <div className="p2p-counterparty">
                <strong>{order.counterparty}</strong>
                <small>{order.stats}</small>
              </div>
              <strong className="p2p-rate">{order.rate}</strong>
              <span className="p2p-volume">{order.volume}</span>
              <div className="p2p-order-total">
                <strong>{order.total}</strong>
                <button className="feature-button primary" type="button">
                  Купить
                </button>
              </div>
            </article>
          ))}
        </section>

        <p className="feature-note">
          Заявки исполняются целиком. Только игровые расчёты, без банковских переводов.
        </p>
      </main>
    </Shell>
  );
}
