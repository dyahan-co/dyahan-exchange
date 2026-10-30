import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { makeStore } from './store';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={makeStore()}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
