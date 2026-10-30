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
  },

  typography: {
    fontFamily: 'Arial, sans-serif',

    h1: {
      fontFamily: '"Yeseva One", serif',
      fontWeight: 400,
    },

    h2: {
      fontFamily: '"Yeseva One", serif',
      fontWeight: 400,
    },

    button: {
      textTransform: 'none',
      fontWeight: 400,
    },
  },

  shape: {
    borderRadius: 8,
  },
});
