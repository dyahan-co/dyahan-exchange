import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shell } from '../app/Shell';
import { getDemoLoan, startDemoLoan } from '../features/bank/demoLoan';
import { useWalletSnapshot } from '../features/bank/useWalletSnapshot';
import './bank-pages.css';

function formatKum(value: number) {
  return `${value.toLocaleString('ru-RU')} КУМ`;
}

export function BankConditionsPage() {
  const navigate = useNavigate();
  const { wallet, loading, error, refresh } = useWalletSnapshot();
  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);
  const activeLoan = getDemoLoan();
  const eligible = Boolean(wallet && wallet.available === 0 && wallet.held === 0 && !activeLoan);

  function takeLoan() {
    if (!accepted || !eligible || starting) return;
    setStarting(true);
    startDemoLoan();
    navigate('/bank/active');
  }

  return (
    <Shell>
      <main className="feature-page bank-page">
        <div className="bank-topline">
          <p className="feature-breadcrumb">
            БАНК <span>/</span> УСЛОВИЯ
          </p>
          <div className="bank-wallet-chip" aria-label="Доступный баланс">
            {loading
              ? 'Загружаем баланс…'
              : wallet
                ? `${formatKum(wallet.available)} · в резерве ${wallet.held}`
                : 'Баланс недоступен'}
          </div>
        </div>

        <div className="bank-title-row">
          <div>
            <p className="feature-eyebrow">ДЯХАН EXCHANGE · БАНК</p>
            <h1>ДяханБанк</h1>
          </div>
          <span className="bank-demo-tag">ДЕМО · КУМ</span>
        </div>

        {error && (
          <div className="bank-alert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void refresh()}>
              Повторить
            </button>
          </div>
        )}

        {activeLoan && (
          <div className="bank-alert" role="status">
            У вас уже есть активный демо-кредит.
            <Link to="/bank/active">Открыть кредит →</Link>
          </div>
        )}

        <div className="bank-layout">
          <section className="bank-offer-card" aria-labelledby="bank-offer-title">
            <p className="bank-card-eyebrow">ПОД ЧЕСТНОЕ СЛОВО</p>
            <h2 id="bank-offer-title">
              10 <span>КУМ</span>
            </h2>
            <p className="bank-offer-subtitle">
              24 реальных часа <i>·</i> 0% годовых
            </p>

            <div className="bank-terms-table">
              <div>
                <span>Получаете</span>
                <strong>10 КУМ</strong>
              </div>
              <div>
                <span>Возвращаете</span>
                <strong>10 КУМ</strong>
              </div>
              <div>
                <span>Комиссия</span>
                <strong>0 КУМ</strong>
              </div>
            </div>

            <div className="bank-eligibility" aria-live="polite">
              <p className={wallet?.available === 0 ? 'condition-met' : 'condition-unmet'}>
                <span aria-hidden="true">{wallet?.available === 0 ? '✓' : '•'}</span>
                {wallet
                  ? `Доступно ${formatKum(wallet.available)} · для выдачи нужен ноль`
                  : 'Проверяем доступный баланс…'}
              </p>
              <p className={wallet?.held === 0 ? 'condition-met' : 'condition-unmet'}>
                <span aria-hidden="true">{wallet?.held === 0 ? '✓' : '•'}</span>
                {wallet
                  ? `В резерве ${formatKum(wallet.held)} · для выдачи нужен ноль`
                  : 'Проверяем резервы…'}
              </p>
              <p className={!activeLoan ? 'condition-met' : 'condition-unmet'}>
                <span aria-hidden="true">{!activeLoan ? '✓' : '•'}</span>
                {activeLoan ? 'Сначала погасите активный кредит' : 'Нет активного кредита'}
              </p>
            </div>

            <label className="bank-consent">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                disabled={loading || Boolean(error) || Boolean(activeLoan)}
              />
              <span>Я прочитал условия и понимаю последствия.</span>
            </label>

            <button
              className="bank-action"
              type="button"
              onClick={takeLoan}
              disabled={!accepted || !eligible || loading || starting}
            >
              {starting ? 'Открываем демо-кредит…' : 'Взять 10 КУМ'}
            </button>
            <p className="bank-prototype-note">
              Выдача и погашение пока работают только в локальном демо: API кредита в бэкенде ещё
              нет.
            </p>
          </section>

          <aside className="bank-info" aria-labelledby="bank-info-title">
            <p className="feature-eyebrow">ПРАВИЛА СЕРВИСА</p>
            <h2 id="bank-info-title">Что нужно знать</h2>
            <section>
              <h3>Условия выдачи</h3>
              <p>Ноль доступных КУМ. Нет действующего долга и средств в резерве.</p>
            </section>
            <section>
              <h3>При просрочке</h3>
              <p>Статус SCAM и попадание на доску позора.</p>
            </section>
            <section>
              <h3>Что останется доступно</h3>
              <p>Вход, история и публичные разделы.</p>
            </section>
            <Link className="bank-preview-link" to="/bank/active?preview=1">
              Предпросмотр U017: активный кредит <span aria-hidden="true">↗</span>
            </Link>
            <strong className="bank-warning">Закрытие вкладки не останавливает срок.</strong>
          </aside>
        </div>
      </main>
    </Shell>
  );
}

export default BankConditionsPage;
