import { MonitoringErrorBoundary } from './monitoring';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Box, Button, CssBaseline, ThemeProvider, Typography } from '@mui/material';
import { makeStore } from './store';
import { App } from './App';
import { theme } from './theme';
import './index.css';

function ErrorFallback() {
  return (
    <Box
      component="main"
      role="alert"
      sx={{
        maxWidth: 600,
        mx: 'auto',
        px: 3,
        py: 8,
      }}
    >
      <Typography component="h1" variant="h4" gutterBottom>
        Не удалось отобразить страницу
      </Typography>

      <Typography sx={{ mb: 3 }}>Попробуйте перезагрузить приложение.</Typography>

      <Button variant="contained" onClick={() => window.location.reload()}>
        Перезагрузить
      </Button>
    </Box>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={makeStore()}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          <MonitoringErrorBoundary FallbackComponent={ErrorFallback}>
            <App />
          </MonitoringErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
