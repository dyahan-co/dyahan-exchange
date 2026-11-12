import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ApiError, dyahanApi, type WalletSnapshot } from '../../api/dyahanApi';
import { session } from '../../auth/session';
import { balanceChanged } from '../../store/balanceSlice';

export interface BankWallet {
  balance: number;
  available: number;
  held: number;
}

function toSafeAmount(value: string): number {
  if (!/^\d+$/.test(value)) throw new Error('Сервер вернул некорректный баланс.');
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) throw new Error('Баланс превышает поддерживаемый диапазон.');
  return amount;
}

function mapWallet(snapshot: WalletSnapshot): BankWallet {
  if (snapshot.currency !== 'KUM') throw new Error('Сервер вернул кошелёк в неизвестной валюте.');
  return {
    balance: toSafeAmount(snapshot.balanceMinor),
    available: toSafeAmount(snapshot.availableMinor),
    held: toSafeAmount(snapshot.heldMinor),
  };
}

export function useWalletSnapshot() {
  const dispatch = useDispatch();
  const [wallet, setWallet] = useState<BankWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const token = session.getToken();
    if (!token) {
      setError('Войдите в аккаунт, чтобы открыть ДяханБанк.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const snapshot = mapWallet(await dyahanApi.wallet(token));
      setWallet(snapshot);
      dispatch(balanceChanged({ available: snapshot.available, reserved: snapshot.held }));
    } catch (requestError) {
      setError(
        requestError instanceof ApiError || requestError instanceof Error
          ? requestError.message
          : 'Не удалось загрузить кошелёк. Попробуйте ещё раз.',
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { wallet, loading, error, refresh };
}
