import { Container, Typography } from '@mui/material';
import { Balance } from './components/Balance';

export function App() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Дяхан Exchange
      </Typography>
      <Balance />
    </Container>
  );
}
const unusedVariable = 1;
