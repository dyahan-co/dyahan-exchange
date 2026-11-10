import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Link,
  useTheme,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { Link as RouterLink } from 'react-router-dom';
import { MiniBalance } from '../components/MiniBalance';

interface Transaction {
  time: string;
  operation: string;
  change: string;
  changeColorKey?: 'primary' | 'success' | 'error' | 'text';
  status: string;
  category: 'games' | 'p2p' | 'credit';
}

const mockTransactions: Transaction[] = [
  {
    time: '12:42',
    operation: 'Угадайка · раунд #0042',
    change: '+1 КУМ',
    changeColorKey: 'success',
    status: 'Завершено',
    category: 'games',
  },
  {
    time: '12:30',
    operation: 'Блокировка 4 КУМ для продажи · #P42',
    change: '-4 КУМ',
    changeColorKey: 'error',
    status: 'Ждёт сделки',
    category: 'p2p',
  },
  {
    time: '12:00',
    operation: 'Начисление игрового баланса',
    change: '+31 КУМ',
    changeColorKey: 'success',
    status: 'Завершено',
    category: 'games',
  },
];

export default function ProfilePage() {
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const filteredTransactions = mockTransactions.filter((tx) => {
    if (tabIndex === 1) return tx.category === 'games';
    if (tabIndex === 2) return tx.category === 'p2p';
    if (tabIndex === 3) return tx.category === 'credit';
    return true;
  });

  const getChangeColor = (key?: string) => {
    switch (key) {
      case 'primary':
        return theme.palette.primary.main;
      case 'success':
        return theme.palette.success.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        pt: 4,
        pb: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Аккаунт / Профиль
          </Typography>
          <MiniBalance/>
        </Box>

        <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>
          Контрагент_42
        </Typography>
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500, mb: 5 }}>
          Игрок · аккаунт активен
        </Typography>

        <Grid2 container spacing={2} sx={{ mb: 3 }}>
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Можно потратить
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                28 КУМ
              </Typography>
            </Box>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Заблокировано в P2P
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                4 КУМ
              </Typography>
            </Box>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Демо-рубли
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                1 200 дР
              </Typography>
            </Box>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Кредит
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Нет долга
              </Typography>
            </Box>
          </Grid2>
        </Grid2>

        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            mb: 6,
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
            4 КУМ ждут продажи по заявке #P42
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Всего у вас 32 КУМ: 28 доступны, а 4 выставлены на продажу.<br />
            Отмените заявку — все 32 КУМ снова доступны. Продадите — 4 КУМ получит покупатель.
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ mb: 3 }}>
          История операций
        </Typography>

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            mb: 4,
            '& .MuiTab-root': {
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              '&.Mui-selected': { color: 'text.primary' },
            },
            '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
          }}
        >
          <Tab label="Все операции" />
          <Tab label="Игры" />
          <Tab label="P2P" />
          <Tab label="Кредит" />
        </Tabs>

        <Grid2 container sx={{ px: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: '0.85rem' }}>
          <Grid2 size={2}>ВРЕМЯ</Grid2>
          <Grid2 size={6}>ОПЕРАЦИЯ</Grid2>
          <Grid2 size={2}>Изменение доступного</Grid2>
          <Grid2 size={2} sx={{ textAlign: 'right' }}>СТАТУС</Grid2>
        </Grid2>

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {filteredTransactions.map((tx, idx) => (
            <Grid2
              key={idx}
              container
              alignItems="center"
              sx={{
                px: 2,
                py: 2.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontSize: '0.95rem',
              }}
            >
              <Grid2 size={2} sx={{ color: 'text.secondary' }}>
                {tx.time}
              </Grid2>
              <Grid2 size={6} sx={{ fontWeight: 500 }}>
                {tx.operation}
              </Grid2>
              <Grid2 size={2} sx={{ color: getChangeColor(tx.changeColorKey), fontWeight: 600 }}>
                {tx.change}
              </Grid2>
              <Grid2 size={2} sx={{ textAlign: 'right', color: 'text.secondary' }}>
                {tx.status}
              </Grid2>
            </Grid2>
          ))}
        </Box>

        <Box sx={{ mt: 5 }}>
          <Link
            component={RouterLink}
            to="/login"
            underline="none"
            sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.95rem', '&:hover': { opacity: 0.8 } }}
          >
            Выйти из аккаунта →
          </Link>
        </Box>
      </Container>

      <Container maxWidth="lg">
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, display: 'block', mt: 4 }}
        >
          Учебный проект. КУМ и дР — игровые единицы. Реальных платежей нет.
        </Typography>
      </Container>
    </Box>
  );
}