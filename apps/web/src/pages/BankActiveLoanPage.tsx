import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shell } from '../app/Shell';
import { getDemoLoan, repayDemoLoan, type DemoLoan } from '../features/bank/demoLoan';
import { useWalletSnapshot } from '../features/bank/useWalletSnapshot';
import './bank-pages.css';

function formatKum(value: number) {
  return `${value.toLocaleString('ru-RU')} КУМ`;
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${hours} ч ${String(minutes).padStart(2, '0')} мин ${String(remainder).padStart(2, '0')} сек`;
}

export function BankActiveLoanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preview = searchParams.get('preview') === '1';
  const { wallet, loading, error, refresh } = useWalletSnapshot();
  const [loan] = useState<DemoLoan | null>(() => {
    const storedLoan = getDemoLoan();
    if (storedLoan) return storedLoan;
    return preview
      ? {
          id: 'L42',
          amount: 10,
          dueAt: new Date(Date.now() + 23 * 60 * 60 * 1000 + 42 * 60 * 1000).toISOString(),
        }
      : null;
  });
  const [now, setNow] = useState(Date.now());
  const [repaying, setRepaying] = useState(false);
  const [message, setMessage] = useState('');
  const remaining = loan ? new Date(loan.dueAt).getTime() - now : 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function repay() {
    if (!loan || repaying) return;
    setRepaying(true);
    if (!preview) repayDemoLoan();
    setMessage('Демо-погашение завершено. Серверный баланс не менялся.');
    window.setTimeout(() => navigate('/bank'), 900);
  }

  return (
    <Shell>
      <main className="feature-page bank-page">
        <div className="bank-topline">
          <p className="feature-breadcrumb">
            БАНК <span>/</span> АКТИВНЫЙ КРЕДИТ
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

        {!loan ? (
          <section className="bank-empty-state">
            <span className="bank-empty-icon" aria-hidden="true">
              —
            </span>
            <h2>Активного кредита нет</h2>
            <p>Когда появится кредит, здесь будут сумма, срок и кнопка погашения.</p>
            <Link className="bank-action bank-action-link" to="/bank">
              Посмотреть условия
            </Link>
          </section>
        ) : (
          <div className="bank-layout">
            <section className="bank-offer-card bank-loan-card" aria-labelledby="active-loan-title">
              <p className="bank-card-eyebrow">КРЕДИТ #{loan.id}</p>
              <h2 id="active-loan-title">
                {loan.amount} <span>КУМ</span>
              </h2>
              <p className={`bank-countdown ${remaining <= 0 ? 'overdue' : ''}`} aria-live="polite">
                {remaining > 0 ? `До возврата: ${formatTime(remaining)}` : 'Срок возврата истёк'}
              </p>

              <div className="bank-terms-table">
                <div>
                  <span>Получили</span>
                  <strong>{formatKum(loan.amount)}</strong>
                </div>
                <div>
                  <span>Возвращаете</span>
                  <strong>{formatKum(loan.amount)}</strong>
                </div>
                <div>
                  <span>На балансе после выдачи · демо</span>
                  <strong>{formatKum((wallet?.available ?? 0) + loan.amount)}</strong>
                </div>
              </div>

              <p className="bank-repay-note">
                В реальном сценарии погашение спишет 10 КУМ с доступного баланса. Сейчас действие
                демонстрационное.
              </p>
              <button className="bank-action" type="button" onClick={repay} disabled={repaying}>
                {repaying ? 'Погашаем демо-кредит…' : 'Погасить кредит'}
              </button>
              {message && (
                <p className="bank-success" role="status">
                  {message}
                </p>
              )}
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
              <strong className="bank-warning">Закрытие вкладки не останавливает срок.</strong>
            </aside>
          </div>
        )}
      </main>
    </Shell>
  );
}

export default BankActiveLoanPage;
