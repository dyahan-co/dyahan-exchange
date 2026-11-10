import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';

interface MiniBalanceProps {
  kum?: number | string;
  dr?: number | string;
  sx?: SxProps<Theme>;
}

export function MiniBalance({ kum = 28, dr = 1200, sx }: MiniBalanceProps) {
  return (
    <Box
      sx={{...sx}}
    >
      <Typography variant="body2" color='text.secondary'>
        {kum} КУМ / {dr} дР
      </Typography>
    </Box>
  );
}