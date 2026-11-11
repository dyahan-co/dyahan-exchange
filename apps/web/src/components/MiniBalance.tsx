import React from 'react';
import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import { useSelector } from 'react-redux';
import { session } from '../auth/session';
import type { RootState } from '../store';

interface MiniBalanceProps {
  kum?: number | string;
  dr?: number | string;
  sx?: SxProps<Theme>;
}

export function MiniBalance({ sx }: MiniBalanceProps) {
  const { available, availableDr } = useSelector((s: RootState) => s.balance);
  const user = session.getUser();

  return (
    <Box className="mini-balance" sx={sx} aria-label="Баланс игрока">
      <Typography color="text.secondary">
        {user ? `${available} КУМ / ${availableDr} д₽` : 'Гостевой доступ'}
      </Typography>
    </Box>
  );
}
