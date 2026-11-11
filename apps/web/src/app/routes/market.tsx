import type { RouteObject } from 'react-router-dom';
import { GuestMarketPage } from '../../pages/GuestMarketPage';
import { PlayerMarketPage } from '../../pages/PlayerMarketPage';

export const routes: RouteObject[] = [
  { path: '/', element: <GuestMarketPage /> },
  { path: '/market', element: <PlayerMarketPage /> },
];
