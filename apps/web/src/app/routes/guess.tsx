import type { RouteObject } from 'react-router-dom';
import { GuessRoundPage } from '../../pages/GuessRoundPage';
import { GuessResultPage } from '../../pages/GuessResultPage';

export const routes: RouteObject[] = [
  { path: '/guess', element: <GuessRoundPage /> },
  { path: '/guess/result', element: <GuessResultPage /> },
];
