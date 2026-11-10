import React from 'react';
import { Button, ButtonProps } from '@mui/material';

// Extend ButtonProps so it properly accepts router props when using `component`
export function ActionButton<C extends React.ElementType = 'button'>(
  props: ButtonProps<C, { component?: C }>
) {
  const { children, sx, ...rest } = props;
  
  return (
    <Button
      type="submit"
      fullWidth
      variant="contained"
      size="large"
      sx={{
        bgcolor: 'primary.main',
        color: '#0A0A0A',
        fontWeight: 600,
        py: 1.5,
        '&:hover': {
          bgcolor: '#e6bc00',
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Button>
  );
}