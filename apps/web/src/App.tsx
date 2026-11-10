import { Box, Button, Container, Typography } from '@mui/material';
import { Link, Route, Routes } from 'react-router-dom';
import { Balance } from './components/Balance';
import { Header } from './components/Header';
import { RoulettePage } from './features/roulette/RoulettePage';

function Home() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Дяхан Exchange
      </Typography>

      <Balance />

      <Button component={Link} to="/roulette" variant="contained" sx={{ mt: 3 }}>
        Мем-рулетка
      </Button>
    </Container>
  );
}

export function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />

      <Routes>
        <Route path="/roulette" element={<RoulettePage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Box>
  );
}
