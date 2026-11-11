import type { RouteObject } from 'react-router-dom';
import ProfilePage from '../../pages/ProfilePage';


export const routes: RouteObject[] = [
  { path: '/profile', element: <ProfilePage /> },
];
