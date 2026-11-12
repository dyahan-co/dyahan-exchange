import type { RouteObject } from 'react-router-dom';
import { RequireAuth } from '../RequireAuth';
import BankConditionsPage from '../../pages/BankConditionsPage';
import BankActiveLoanPage from '../../pages/BankActiveLoanPage';

export const routes: RouteObject[] = [
  {
    path: '/bank',
    element: (
      <RequireAuth>
        <BankConditionsPage />
      </RequireAuth>
    ),
  },
  {
    path: '/bank/active',
    element: (
      <RequireAuth>
        <BankActiveLoanPage />
      </RequireAuth>
    ),
  },
];
