import { Container, Typography, Box } from '@mui/material';
import { Balance } from './components/Balance';
import { Header } from './components/Header';

export function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0A0A0A' }}>
      <Header />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom color="#FFFFFF">
          Дяхан Exchange
        </Typography>
        <Balance />
      </Container>
    </Box>
  );
}
