import { Link } from 'react-router-dom';
import { Shell } from '../app/Shell';
import { MiniBalance } from '../components/MiniBalance';
import './feature-pages.css';

const steps = [
  {
    number: '01',
    title: 'Посмотрите на картинку',
    description: 'В каждом раунде — новый сюжет и ограниченное время на ответ.',
  },
  {
    number: '02',
    title: 'Отправьте свой вариант',
    description: 'Можно ответить своими словами. Раунд закрывается после первой попытки.',
  },
  {
    number: '03',
    title: 'Получите награду',
    description: 'За верный ответ начисляется 1 КУМ — игровая единица проекта.',
  },
];

export function IntroPage() {
  return (
    <Shell>
      <main className="feature-page intro-page">
        <div className="feature-kicker-row">
          <p className="feature-breadcrumb">
            АККАУНТ <span>/</span> ПЕРВОЕ ЗНАКОМСТВО
          </p>
          <MiniBalance />
        </div>
        <section className="intro-hero">
          <div className="intro-copy">
            <p className="feature-eyebrow">ВАШ ПЕРВЫЙ ШАГ</p>
            <h1>
              Добро пожаловать
              <br />
              на биржу Дяхана<span>.</span>
            </h1>
            <p className="feature-lead">
              Начните с бесплатной угадайки, познакомьтесь с игровыми КУМ и посмотрите, как устроен
              рынок. Никаких реальных платежей — только учебные сценарии.
            </p>
            <div className="feature-actions">
              <Link className="feature-button primary" to="/guess">
                Начать угадайку <span aria-hidden="true">↗</span>
              </Link>
              <Link className="feature-button secondary" to="/market">
                Открыть рынок
              </Link>
            </div>
          </div>
          <div className="intro-art" aria-label="Три шага для знакомства с игрой">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-coin">КУМ</div>
            <span className="art-label label-top">01 · УГАДАЙ</span>
            <span className="art-label label-right">02 · ОТВЕТЬ</span>
            <span className="art-label label-bottom">03 · ПОЛУЧИ НАГРАДУ</span>
          </div>
        </section>
        <section className="intro-steps" aria-labelledby="intro-steps-title">
          <div className="feature-section-heading">
            <div>
              <p className="feature-eyebrow">БЫСТРЫЙ СТАРТ</p>
              <h2 id="intro-steps-title">Три шага — и вы в игре</h2>
            </div>
            <span>БЕЗ СТАВОК И РИСКА</span>
          </div>
          <div className="intro-step-grid">
            {steps.map((step) => (
              <article className="intro-step" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Shell>
  );
}

export default IntroPage;
