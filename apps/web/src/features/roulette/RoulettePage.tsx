import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { balanceChanged } from '../../store/balanceSlice';
import { ApiError, revealRound, startRound, syncRoulette, type Snapshot } from './api';
import { RouletteWheel } from './RouletteWheel';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Произошла ошибка. Попробуйте ещё раз.';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body2" textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

export function RoulettePage() {
  const dispatch = useDispatch();

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  const [finishedRoundId, setFinishedRoundId] = useState<string | null>(null);

  const startKey = useRef<string | null>(null);
  const requestInFlight = useRef(false);

  const round = snapshot?.round;
  const roundId = round?.id;
  const roundStatus = round?.status;
  const revealAt = round?.revealAt;

  const pending = roundStatus === 'pending';

  const result = round?.status === 'settled' ? round : null;

  const landing = result !== null && finishedRoundId !== result.id;

  const busy = sending || pending || landing;

  // Серверное число определяет конечное положение колеса.
  const rotation = result ? (360 - (result.number - 1) * 36) % 360 : 0;

  const applySnapshot = useCallback(
    (next: Snapshot) => {
      setSnapshot(next);

      dispatch(
        balanceChanged({
          available: next.available,
          reserved: next.reserved,
        }),
      );
    },
    [dispatch],
  );

  const onWheelFinished = useCallback(() => {
    setFinishedRoundId(roundId ?? null);
  }, [roundId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await syncRoulette();

      applySnapshot(next);
      setPolling(true);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!roundId || roundStatus !== 'pending' || !revealAt || !polling) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const next = await revealRound(roundId);

        if (cancelled) return;

        applySnapshot(next);

        if (next.round?.status === 'pending') {
          timer = setTimeout(() => void poll(), 500);
        }
      } catch (error) {
        if (cancelled) return;

        setError(`Не удалось получить результат: ${errorMessage(error)}`);
        setPolling(false);
      }
    };

    const delay = Math.max(0, new Date(revealAt).getTime() - Date.now());

    timer = setTimeout(() => void poll(), delay);

    return () => {
      cancelled = true;

      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [roundId, roundStatus, revealAt, polling, applySnapshot]);

  async function spin() {
    if (requestInFlight.current || busy || loading || !snapshot || snapshot.available < 2) {
      return;
    }

    requestInFlight.current = true;
    setSending(true);
    setError(null);

    // При потере ответа повторяем тот же запрос,
    // а не создаём новую ставку.
    startKey.current ??= crypto.randomUUID();

    try {
      const next = await startRound(startKey.current);

      applySnapshot(next);
      setPolling(true);
      startKey.current = null;
    } catch (error) {
      setError(errorMessage(error));

      // При явном отказе сервера новый раунд
      // не был принят. Сетевые ошибки сохраняют ключ.
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        startKey.current = null;
      }
    } finally {
      requestInFlight.current = false;
      setSending(false);
    }
  }

  const visibleResult = result && finishedRoundId === result.id && !sending ? result : null;

  return (
    <Container
      component="main"
      maxWidth="lg"
      sx={{
        py: { xs: 3, md: 5 },
        '& h1, & h2': {
          fontFamily: '"Yeseva One", Georgia, serif',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Игры / Мем-рулетка
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Доступно: {snapshot?.available ?? '—'} КУМ
          {' · '}В резерве: {snapshot?.reserved ?? '—'} КУМ
        </Typography>
      </Stack>

      <Typography component="h1" variant="h4">
        Казино-рулетка
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Красное. Чёрное. И одна зелёная семёрка.
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" disabled={loading || sending} onClick={() => void load()}>
              Обновить
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && !snapshot && (
        <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
          <CircularProgress />

          <Typography>Загружаем баланс…</Typography>
        </Stack>
      )}

      {snapshot && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr',
            },
            gap: { xs: 4, md: 7 },
          }}
        >
          <Box>
            <RouletteWheel rotation={rotation} pending={pending} onFinished={onWheelFinished} />

            <Typography
              textAlign="center"
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 2 }}
            >
              1–5: +2 КУМ · 6, 8, 9, 10: −2 КУМ
            </Typography>

            <Typography
              role="status"
              textAlign="center"
              color="primary.main"
              sx={{ mt: 2, minHeight: 24 }}
            >
              {sending
                ? 'Принимаем ставку…'
                : pending
                  ? polling
                    ? 'Колесо вращается…'
                    : 'Ожидаем получения результата'
                  : landing
                    ? 'Колесо останавливается…'
                    : ''}
            </Typography>
          </Box>

          <Stack spacing={3}>
            <Box>
              <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Перед запуском
              </Typography>

              <Stack spacing={1.5}>
                <Row label="Ставка" value="2 КУМ" />

                <Row label="Чистый выигрыш" value="+2 КУМ" />

                <Row label="Обычный проигрыш" value="−2 КУМ" />

                <Row label="Доступный баланс" value={`${snapshot.available} КУМ`} />

                <Row label="В резерве" value={`${snapshot.reserved} КУМ`} />
              </Stack>
            </Box>

            <Box
              sx={{
                p: 2.5,
                bgcolor: '#102319',
                border: '1px solid #31523A',
                borderRadius: 1,
              }}
            >
              <Typography component="h2" variant="h6">
                ⑦ Зелёная семёрка
              </Typography>

              <Typography
                sx={{
                  color: '#EF5350',
                  fontSize: 22,
                  mt: 1,
                }}
              >
                −100 КУМ с баланса
              </Typography>

              <Typography variant="body2" sx={{ mt: 1 }}>
                P2P-сделки заморожены на 24 часа.
              </Typography>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Если средств меньше 100 КУМ, баланс станет нулевым. Дополнительные 2 КУМ не
                списываются.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={loading || busy || snapshot.available < 2}
              onClick={() => void spin()}
              sx={{
                bgcolor: '#FFDD44',
                color: '#111111',
                borderRadius: 0.5,
                '&:hover': {
                  bgcolor: '#FFE878',
                },
              }}
            >
              {sending
                ? 'Принимаем ставку…'
                : pending || landing
                  ? 'Колесо вращается…'
                  : 'Крутить за 2 КУМ'}
            </Button>

            {snapshot.available < 2 && !busy && (
              <Alert severity="info">Для нового раунда нужно минимум 2 КУМ.</Alert>
            )}

            {pending && !polling && (
              <Button
                variant="outlined"
                onClick={() => {
                  setError(null);
                  setPolling(true);
                }}
              >
                Получить результат
              </Button>
            )}

            <Box aria-live="polite" aria-atomic="true">
              {visibleResult && (
                <Alert
                  severity={
                    visibleResult.outcome === 'win'
                      ? 'success'
                      : visibleResult.outcome === 'green'
                        ? 'warning'
                        : 'info'
                  }
                >
                  <Typography fontWeight="bold">Выпало {visibleResult.number}</Typography>

                  <Typography variant="body2">
                    Результат: {visibleResult.delta > 0 ? '+' : ''}
                    {visibleResult.delta} КУМ
                  </Typography>

                  <Typography variant="body2">
                    Баланс: {visibleResult.balanceBefore}
                    {' → '}
                    {visibleResult.balanceAfter} КУМ
                  </Typography>
                </Alert>
              )}
            </Box>

            {snapshot.p2pBlockedUntil && (
              <Alert severity="warning">
                P2P заблокирован до {new Date(snapshot.p2pBlockedUntil).toLocaleString('ru-RU')}.
              </Alert>
            )}

            <Typography variant="caption" color="text.secondary">
              Учебная демосессия. Реальных платежей нет. Результат определяет сервер.
            </Typography>
          </Stack>
        </Box>
      )}

      <Divider sx={{ mt: 5, mb: 2 }} />

      <Typography variant="caption" color="text.secondary">
        Учебный проект. КУМ и д₽ — игровые единицы. Реальных вложений нет.
      </Typography>
    </Container>
  );
}
