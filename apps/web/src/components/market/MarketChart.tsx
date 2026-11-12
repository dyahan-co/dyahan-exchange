import { useEffect, useMemo, useState } from 'react';

type Candle = { open: number; high: number; low: number; close: number; volume: number };

const ranges = [
  { label: '1 ч', count: 24, step: 0.18, interval: '2 мин' },
  { label: '6 ч', count: 36, step: 0.31, interval: '10 мин' },
  { label: '1 д', count: 42, step: 0.43, interval: '30 мин' },
  { label: '1 н', count: 48, step: 0.67, interval: '4 ч' },
];

function makeCandles(count: number, step: number, tick: number): Candle[] {
  let previous = 38.6;
  return Array.from({ length: count }, (_, index) => {
    const open = previous;
    const drift = Math.sin(index * 0.63) * step * 0.72 + Math.cos(index * 0.19) * step * 0.38;
    const pulse = index === count - 1 ? Math.sin(tick * 0.42) * 0.09 : 0;
    const close = Math.max(35.4, Math.min(44.8, open + drift + pulse));
    const wick = 0.12 + ((index * 17) % 9) / 100;
    const high = Math.max(open, close) + wick + ((index * 7) % 5) / 100;
    const low = Math.min(open, close) - wick - ((index * 11) % 4) / 100;
    const volume = 16 + ((index * 37 + Math.floor(Math.abs(drift) * 100)) % 84);
    previous = close;
    return { open, high, low, close, volume };
  });
}

const price = (value: number) => value.toFixed(2).replace('.', ',');

export function MarketChart() {
  const [range, setRange] = useState('1 д');
  const [tick, setTick] = useState(0);
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 2200);
    return () => window.clearInterval(interval);
  }, []);

  const selectedRange = ranges.find((item) => item.label === range) ?? ranges[2];
  const candles = useMemo(
    () => makeCandles(selectedRange.count, selectedRange.step, tick),
    [selectedRange, tick],
  );
  const minPrice = Math.floor(Math.min(...candles.map((candle) => candle.low)) * 2) / 2 - 0.25;
  const maxPrice = Math.ceil(Math.max(...candles.map((candle) => candle.high)) * 2) / 2 + 0.25;
  const priceSpan = maxPrice - minPrice;
  const latest = candles[candles.length - 1];
  const previous = candles[Math.max(0, candles.length - 2)].close;
  const change = ((latest.close - previous) / previous) * 100;
  const activeCandle = hoveredCandle === null ? null : candles[hoveredCandle];
  const axisPrices = Array.from({ length: 5 }, (_, index) => maxPrice - (priceSpan * index) / 4);

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
            {price(latest.close)} <small>д₽</small>
            <b className={change >= 0 ? 'market-positive' : 'market-negative'}>
              {change >= 0 ? '+' : ''}
              {price(change)}% за период
            </b>
          </div>
        </div>
        <div className="range-tabs" aria-label="Период графика">
          {ranges.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setRange(item.label);
                setHoveredCandle(null);
              }}
              className={range === item.label ? 'selected' : ''}
              aria-pressed={range === item.label}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-plot" onMouseLeave={() => setHoveredCandle(null)}>
        <div className="grid-lines" aria-hidden="true">
          {axisPrices.map((value) => (
            <span key={value}>
              <b>{price(value)}</b>
            </span>
          ))}
        </div>
        {activeCandle && hoveredCandle !== null && (
          <div
            className="chart-tooltip"
            style={{ left: `${8 + (hoveredCandle / (candles.length - 1)) * 80}%` }}
          >
            <b>{price(activeCandle.close)} д₽</b>
            <span>
              О {price(activeCandle.open)} · В {price(activeCandle.high)}
            </span>
            <span>
              Н {price(activeCandle.low)} · З {price(activeCandle.close)}
            </span>
            <span>{selectedRange.interval} · демо</span>
          </div>
        )}
        <div className="candles" aria-label={`Демо-график КУМ за ${range}`}>
          {candles.map((candle, index) => {
            const rising = candle.close >= candle.open;
            const top = ((maxPrice - candle.high) / priceSpan) * 100;
            const bottom = ((maxPrice - candle.low) / priceSpan) * 100;
            const bodyTop = ((maxPrice - Math.max(candle.open, candle.close)) / priceSpan) * 100;
            const bodyBottom = ((maxPrice - Math.min(candle.open, candle.close)) / priceSpan) * 100;
            return (
              <i
                key={index}
                onMouseEnter={() => setHoveredCandle(index)}
                className={rising ? 'up' : 'down'}
                style={{
                  left: `${(index / candles.length) * 100}%`,
                  width: `calc(100% / ${candles.length} * 0.58)`,
                  top: `${top}%`,
                  height: `${Math.max(1, bottom - top)}%`,
                }}
                aria-label={`Свеча ${index + 1}: ${rising ? 'рост' : 'снижение'}, закрытие ${price(candle.close)} д₽`}
              >
                <b
                  style={{
                    top: `${((bodyTop - top) / Math.max(0.01, bottom - top)) * 100}%`,
                    height: `${Math.max(3, ((bodyBottom - bodyTop) / Math.max(0.01, bottom - top)) * 100)}%`,
                  }}
                />
              </i>
            );
          })}
        </div>
        <div className="volume-bars" aria-label="Объём торгов">
          {candles.map((candle, index) => (
            <i
              key={index}
              className={candle.close >= candle.open ? 'up' : 'down'}
              style={{
                left: `${(index / candles.length) * 100}%`,
                width: `calc(100% / ${candles.length} * 0.58)`,
                height: `${candle.volume}%`,
              }}
            />
          ))}
        </div>
        <div className="time-labels">
          <span>
            −
            {range === '1 ч'
              ? '60 мин'
              : range === '6 ч'
                ? '6 ч'
                : range === '1 д'
                  ? '24 ч'
                  : '7 д'}
          </span>
          <span>−75%</span>
          <span>−50%</span>
          <span>−25%</span>
          <span>Сейчас</span>
        </div>
      </div>
    </div>
  );
}
