import { useEffect, useState } from 'react';

export function MarketChart() {
  const [range, setRange] = useState('1 д');
  const [tick, setTick] = useState(0);
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => (value + 1) % 30), 2200);
    return () => window.clearInterval(interval);
  }, []);
  const values = [
    44, 40, 45, 37, 33, 38, 26, 30, 22, 25, 17, 20, 13, 16, 22, 18, 12, 16, 24, 19, 15, 22, 27, 20,
    24, 28, 33,
  ];
  const multiplier = range === '1 ч' ? 3 : range === '6 ч' ? 2 : range === '1 н' ? 0.7 : 1;
  const candles = values.map((value, index) =>
    Math.max(8, Math.round(value * multiplier + Math.sin((index + tick) * 0.7) * 5)),
  );
  return (
    <div className="chart-card">
      <div className="chart-topline">
        <span>
          <i className="live-dot" /> РЫНОК В РЕАЛЬНОМ ВРЕМЕНИ
        </span>
        <span>
          ДЕМО ДАННЫЕ <b>●</b>
        </span>
      </div>
      <div className="chart-heading">
        <div>
          <span className="muted">КУМ / д₽</span>
          <div className="quote">
            {(42 + Math.sin(tick / 4) * 0.18).toFixed(2).replace('.', ',')} <small>д₽</small>
            <b>+10,53% за 24 ч</b>
          </div>
        </div>
        <div className="range-tabs" aria-label="Период графика">
          {['1 ч', '6 ч', '1 д', '1 н'].map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={range === item ? 'selected' : ''}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-plot" onMouseLeave={() => setHoveredCandle(null)}>
        <div className="grid-lines">
          <span>46,00</span>
          <span>44,00</span>
          <span>42,00</span>
          <span>40,00</span>
          <span>38,00</span>
        </div>
        {hoveredCandle !== null && (
          <div
            className="chart-tooltip"
            style={{ left: `${8 + (hoveredCandle / (candles.length - 1)) * 82}%` }}
          >
            <b>
              {(39.1 + ((hoveredCandle * 13 + tick) % 28) / 10).toFixed(2).replace('.', ',')} д₽
            </b>
            <span>
              {12 + Math.floor(hoveredCandle / 3)}:
              {String((hoveredCandle * 5) % 60).padStart(2, '0')} · демо
            </span>
          </div>
        )}
        <div className="candles" aria-label={`Демо-график КУМ за ${range}`}>
          {candles.map((height, index) => (
            <i
              key={index}
              onMouseEnter={() => setHoveredCandle(index)}
              className={(index + tick) % 3 === 1 ? 'down' : 'up'}
              style={{
                height: `${height + ((index * 7 + tick * 3) % 12)}px`,
                transform: `translateY(${((index * 5 + tick) % 9) - 4}px)`,
              }}
            />
          ))}
        </div>
        <div className="time-labels">
          <span>12:00</span>
          <span>12:15</span>
          <span>12:30</span>
          <span>12:45</span>
          <span>13:00</span>
        </div>
      </div>
    </div>
  );
}
