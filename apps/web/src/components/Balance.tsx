import { Card, CardContent, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export function Balance() {
  const { available, reserved } = useSelector((s: RootState) => s.balance);
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="overline">Баланс</Typography>
        <Typography variant="h4" data-testid="balance-available">
          {available} КУМ
        </Typography>
        <Typography variant="body2" color="text.secondary" data-testid="balance-reserved">
          В резерве: {reserved}
        </Typography>
      </CardContent>
    </Card>
  );
}
