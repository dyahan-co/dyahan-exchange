import React from 'react';
import { Box, Typography, TextField, TextFieldProps } from '@mui/material';

interface InputFieldProps extends Omit<TextFieldProps, 'variant'> {
  label: string;
}

export function InputField({ label, ...props }: InputFieldProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {label}
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        {...props}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper' // Slightly darker background inside the input
          },
          ...props.sx,
        }}
      />
    </Box>
  );
}