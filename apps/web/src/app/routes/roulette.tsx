import type { RouteObject } from 'react-router-dom';
import { Shell } from '../Shell';
import { RoulettePage } from '../../features/roulette/RoulettePage';

export const routes: RouteObject[] = [
  {
    path: '/roulette',
    element: (
      <Shell>
        <RoulettePage />
      </Shell>
    ),
  },
];
