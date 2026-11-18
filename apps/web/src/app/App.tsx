import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, useLocation, useRoutes, type RouteObject } from 'react-router-dom';
import { dyahanApi } from '../api/dyahanApi';
import { session } from '../auth/session';
import { balanceChanged } from '../store/balanceSlice';

type FeatureRoutes = { routes: RouteObject[] };

// Each feature branch contributes one route module. This keeps market, auth,
// and guess pages independently reviewable while sharing this route host.
const featureModules = import.meta.glob<FeatureRoutes>('./routes/*.tsx', {
  eager: true,
});

const featureRoutes = Object.values(featureModules).flatMap(({ routes }) => routes);

export function App() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  // Redux starts at zero after a full reload, so restore the saved wallet
  // from Core on app load and after navigating away from a game action.
  useEffect(() => {
    const token = session.getToken();
    if (!token) return;

    let active = true;

    void dyahanApi.wallet(token)
      .then((wallet) => {
        const available = Number(wallet.availableMinor);
        const reserved = Number(wallet.heldMinor);

        if (
          active &&
          wallet.currency === 'KUM' &&
          Number.isSafeInteger(available) &&
          Number.isSafeInteger(reserved)
        ) {
          dispatch(balanceChanged({ available, reserved }));
        }
      })
      .catch(() => {
        // Keep the current balance if the wallet service is temporarily unavailable.
      });

    return () => {
      active = false;
    };
  }, [dispatch, pathname]);

  return useRoutes([...featureRoutes, { path: '*', element: <Navigate to="/" replace /> }]);
}
