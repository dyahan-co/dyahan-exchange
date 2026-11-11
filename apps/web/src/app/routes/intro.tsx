import type { RouteObject } from 'react-router-dom';
import IntroPage from '../../pages/IntroPage';


export const routes: RouteObject[] = [
  { path: '/intro', element: <IntroPage /> },
];
