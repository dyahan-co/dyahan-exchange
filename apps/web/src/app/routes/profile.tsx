import type { RouteObject } from 'react-router-dom';
import { RequireAuth } from '../RequireAuth';
import ProfilePage from '../../pages/ProfilePage';

export const routes: RouteObject[] = [
  {
    path: '/profile',
    element: (
      <RequireAuth>
        <ProfilePage />
      </RequireAuth>
    ),
  },
];
