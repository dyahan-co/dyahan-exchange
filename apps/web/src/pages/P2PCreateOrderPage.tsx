import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../app/Shell';
import { MiniBalance } from '../components/MiniBalance';
import { session } from '../auth/session';
import './feature-pages.css';

export default function P2PCreateOrderPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [quantity, setQuantity] = useState('10');
  const [price, setPrice] = useState('42,00');
  const [condition, setCondition] = useState('Контрагент на связи. Без третьих лиц.');

  const qtyNum = parseFloat(quantity.replace(',', '.')) || 0;
  const priceNum = parseFloat(price.replace(',', '.')) || 0;
  const total = (qtyNum * priceNum).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log({ quantity, price, condition });
  }

  return (
    <Shell>
      <main className="feature-page p2p-page">
        <div className="crumb-row">
          <span>Торговля / P2P / Создание заявки</span>
          <span>{session.getToken() ? <MiniBalance /> : 'Гостевой доступ'}</span>
        </div>

        <div className="p2p-heading">
          <div>
            <p className="feature-eyebrow">НОВАЯ СДЕЛКА</p>
            <h1>Создать заявку</h1>
            <p className="feature-lead">Укажите условия обмена и проверьте сумму сделки.</p>
          </div>
        </div>

        <div className="p2p-create-layout">
          <section className="p2p-create-form-panel" aria-label="Условия заявки">
            <div className="p2p-tabs" role="group" aria-label="Тип заявки">
              <button
                type="button"
                className={tabIndex === 0 ? 'selected' : ''}
                aria-pressed={tabIndex === 0}
                onClick={() => setTabIndex(0)}
              >
                Продать КУМ
              </button>
              <button
                type="button"
                className={tabIndex === 1 ? 'selected' : ''}
                aria-pressed={tabIndex === 1}
                onClick={() => setTabIndex(1)}
              >
                Купить КУМ
              </button>
            </div>

            <form className="p2p-order-form" onSubmit={submit}>
              <label>
                Количество КУМ
                <input
                  inputMode="decimal"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                />
              </label>
              <label>
                Цена за 1 КУМ, дР
                <input
                  inputMode="decimal"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </label>
              <label>
                Условия заявки
                <textarea
                  rows={4}
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                />
              </label>
              <button className="feature-button primary" type="submit">
                Опубликовать заявку <span aria-hidden="true">↗</span>
              </button>
            </form>
          </section>

          <aside className="p2p-summary" aria-labelledby="p2p-summary-title">
            <p className="feature-eyebrow">ПРОВЕРЬТЕ ПЕРЕД ПУБЛИКАЦИЕЙ</p>
            <h2 id="p2p-summary-title">Итого</h2>
            <strong className="p2p-total">
              {total} <small>дР</small>
            </strong>

            <div className="p2p-summary-row">
              <span>В резерве до сделки</span>
              <strong>{qtyNum} КУМ</strong>
            </div>
            <div className="p2p-summary-row">
              <span>Срок заявки</span>
              <strong>24 часа</strong>
            </div>

            <p className="p2p-summary-note">
              Резерв нельзя потратить в игре. После отмены он снова доступен.
            </p>
            <Link className="feature-button secondary" to="/p2p">
              Отменить
            </Link>
          </aside>
        </div>
      </main>
    </Shell>
  );
}
