import { useState } from 'react';
import { Link } from 'react-router-dom';
export function GameCards() {
  const [preview, setPreview] = useState(false);
  return (
    <section className="games" id="games">
      <div className="section-title">
        <div>
          <span className="eyebrow">АРЕНА ИГР</span>
          <h2>Выбери свой способ заработать</h2>
        </div>
        <span className="section-caption">3 режима · демо-сценарии</span>
      </div>
      <div className="game-list">
        <article>
          <span className="game-index">01 / БЕЗ РИСКА</span>
          <h3>Слоп-угадайка</h3>
          <p>Бесплатно · награда +1 КУМ</p>
          <Link className="game-action" to="/guess">
            Играть в угадайку <b>↗</b>
          </Link>
          <button className="game-action preview-trigger" onClick={() => setPreview((v) => !v)}>
            Быстрый preview <b>⌄</b>
          </button>
        </article>
        <article id="p2p">
          <span className="game-index">02 / УДАЧА</span>
          <h3>Мем-рулетка</h3>
          <p>Ставка 2 КУМ · случайный исход</p>
          <Link to="/login">
            Открыть рулетку <b>↗</b>
          </Link>
        </article>
        <article>
          <span className="game-index">03 / СОПЕРНИКИ</span>
          <h3>Слоп-дуэль</h3>
          <p>Взнос 5 КУМ · банк 10 КУМ</p>
          <Link to="/login">
            Найти соперника <b>↗</b>
          </Link>
        </article>
      </div>
      {preview && (
        <div className="game-preview">
          <div>
            <span className="eyebrow">МИНИ-РАУНД · ДЕМО</span>
            <h3>Что происходит на картинке?</h3>
            <p>Дяхан заметил, что рынок снова пошёл вверх. Как он реагирует?</p>
          </div>
          <div className="preview-actions">
            <button onClick={() => setPreview(false)}>Паникует</button>
            <button className="correct-answer" onClick={() => setPreview(false)}>
              Покупает ещё КУМ <b>+1 КУМ</b>
            </button>
            <button onClick={() => setPreview(false)}>Уходит в отпуск</button>
          </div>
          <small>Демо-вопрос. Серверная проверка будет подключена отдельно.</small>
        </div>
      )}
    </section>
  );
}
