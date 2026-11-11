import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

interface Props {
  rotation: number;
  pending: boolean;
  onFinished: () => void;
}

const CENTER = 200;
const SPEED = 720;

function normalize(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function point(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: CENTER + Math.cos(radians) * radius,
    y: CENTER + Math.sin(radians) * radius,
  };
}

export function RouletteWheel({ rotation, pending, onFinished }: Props) {
  const [angle, setAngle] = useState(0);

  const currentAngle = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    let frame = 0;

    const update = (value: number) => {
      currentAngle.current = value;
      setAngle(value);
    };

    // При открытии страницы уже завершённый раунд
    // показываем сразу, без повторного вращения.
    if (!initialized.current) {
      initialized.current = true;

      if (!pending) {
        update(normalize(rotation));
        onFinished();
        return;
      }
    }

    if (pending) {
      let previousTime: number | null = null;

      const spin = (time: number) => {
        if (previousTime !== null) {
          const elapsed = Math.min(time - previousTime, 50);

          update(currentAngle.current + (SPEED * elapsed) / 1000);
        }

        previousTime = time;
        frame = requestAnimationFrame(spin);
      };

      frame = requestAnimationFrame(spin);
    } else {
      const start = currentAngle.current;
      const target = normalize(rotation);

      // Дополнительные обороты и точная остановка
      // нужного сектора под верхним указателем.
      const distance = 720 + normalize(target - normalize(start));

      const end = start + distance;

      // Начальная скорость торможения совпадает
      // со скоростью непрерывного вращения.
      const duration = (3 * distance * 1000) / SPEED;

      let startedAt: number | null = null;

      const finish = (time: number) => {
        startedAt ??= time;

        const progress = Math.min((time - startedAt) / duration, 1);

        const eased = 1 - Math.pow(1 - progress, 3);

        update(start + distance * eased);

        if (progress < 1) {
          frame = requestAnimationFrame(finish);
        } else {
          update(normalize(end));
          onFinished();
        }
      };

      frame = requestAnimationFrame(finish);
    }

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [pending, rotation, onFinished]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 430,
        mx: 'auto',
      }}
    >
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label="Колесо рулетки: числа от 1 до 10"
        style={{
          display: 'block',
          width: '100%',
          overflow: 'visible',
        }}
      >
        <circle cx={CENTER} cy={CENTER} r="190" fill="#0A0A0A" stroke="#FFDD44" strokeWidth="3" />

        <circle cx={CENTER} cy={CENTER} r="185" fill="none" stroke="#A68D37" />

        <g transform={`rotate(${angle} ${CENTER} ${CENTER})`}>
          {Array.from({ length: 10 }, (_, index) => {
            const number = index + 1;
            const sectorCenter = -90 + index * 36;

            const start = point(sectorCenter - 18, 180);
            const end = point(sectorCenter + 18, 180);
            const label = point(sectorCenter, 153);

            const fill = number === 7 ? '#226B4A' : number % 2 === 1 ? '#B9363E' : '#111111';

            return (
              <g key={number}>
                <path
                  d={[
                    `M ${CENTER} ${CENTER}`,
                    `L ${start.x} ${start.y}`,
                    `A 180 180 0 0 1 ${end.x} ${end.y}`,
                    'Z',
                  ].join(' ')}
                  fill={fill}
                  stroke="#A68D37"
                  strokeWidth="1"
                />

                <text
                  x={label.x}
                  y={label.y}
                  transform={`rotate(${-angle} ${label.x} ${label.y})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFF7DE"
                  fontSize="21"
                  fontFamily="Georgia, serif"
                  fontWeight="bold"
                >
                  {number}
                </text>
              </g>
            );
          })}
        </g>

        <circle cx={CENTER} cy={CENTER} r="126" fill="#111111" stroke="#A68D37" strokeWidth="2" />

        <circle cx={CENTER} cy={CENTER} r="118" fill="none" stroke="#50451F" />

        <circle cx={CENTER} cy={CENTER} r="70" fill="#0A0A0A" stroke="#FFDD44" />

        <text
          x={CENTER}
          y="190"
          fill="#FFDD44"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="19"
        >
          ДЯХАН
        </text>

        <text x={CENTER} y="218" fill="#FFF7DE" textAnchor="middle" fontSize="12" letterSpacing="4">
          CASINO
        </text>

        <circle cx={CENTER} cy="247" r="6" fill="#FFDD44" />

        <path
          d="M 188 5 L 212 5 L 200 30 Z"
          fill="#FFDD44"
          stroke="#0A0A0A"
          strokeWidth="2"
          aria-hidden="true"
        />
      </svg>
    </Box>
  );
}
