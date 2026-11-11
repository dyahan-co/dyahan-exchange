import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0A0A0A',
      paper: '#141414',
    },
    primary: {
      main: '#FFD000',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A5A5A5',
    },
    divider: '#2A2A2A',
    success: {
      main: '#B7F34A',
    },
    error: {
      main: '#FF4D4F',
    },
  },

  typography: {
    fontFamily: '"Yeseva One", serif',

    button: {
      textTransform: 'none',
      fontWeight: 400,
    },
  },

  shape: {
    borderRadius: 8,
  },
});
