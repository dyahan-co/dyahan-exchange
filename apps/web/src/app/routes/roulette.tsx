import { Box } from '@mui/material';
import type { RouteObject } from 'react-router-dom';
import { Header } from '../../components/Header';
import { RoulettePage } from '../../features/roulette/RoulettePage';

export const routes: RouteObject[] = [
  {
    path: '/roulette',
    element: (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Header />
        <RoulettePage />
      </Box>
    ),
  },
];
