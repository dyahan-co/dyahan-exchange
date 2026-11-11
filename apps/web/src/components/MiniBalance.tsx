import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface MiniBalanceProps {
  kum?: number | string;
  dr?: number | string;
  sx?: SxProps<Theme>;
}

export function MiniBalance({ sx }: MiniBalanceProps) {
    const { available, availableDr } = useSelector((s: RootState) => s.balance);
    const { isLoggedIn } = useSelector((s: RootState) => s.user);
    let content;
    if (isLoggedIn){
        content = (<Typography color='text.secondary'>
        {available} КУМ / {availableDr} дР
      </Typography>);
    }
    else{
        content = (<Typography color="text.secondary">
            Гостевой доступ
          </Typography>);
    }
  return (
    <Box
      sx={{...sx}}
    >
      {content}
    </Box>
  );
}