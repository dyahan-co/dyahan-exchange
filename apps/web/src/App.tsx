import { Button, Container, Typography } from '@mui/material';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Balance } from './components/Balance';
import { GuessPage } from './features/guess/GuessPage';

function Home() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Дяхан Exchange
      </Typography>
      <Balance />
      <Button component={Link} to="/guess" sx={{ mt: 2 }}>
        Слоп-угадайка
      </Button>
    </Container>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/guess" element={<GuessPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
