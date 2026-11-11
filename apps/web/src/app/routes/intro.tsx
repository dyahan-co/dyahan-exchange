import type { RouteObject } from 'react-router-dom';
import { RequireAuth } from '../RequireAuth';
import IntroPage from '../../pages/IntroPage';

export const routes: RouteObject[] = [
  {
    path: '/intro',
    element: (
      <RequireAuth>
        <IntroPage />
      </RequireAuth>
    ),
  },
];
