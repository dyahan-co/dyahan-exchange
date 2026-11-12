import type { RouteObject } from 'react-router-dom';
import P2PCreateOrderPage from '../../pages/P2PCreateOrderPage';
import P2POrderBookPage from '../../pages/P2POrderBookPage';

export const routes: RouteObject[] = [
  { path: '/p2p', element: <P2POrderBookPage /> },
  { path: '/p2p/create', element: <P2PCreateOrderPage /> },
];
