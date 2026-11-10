import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import { Link as RouterLink } from 'react-router-dom';
import { ActionButton } from '../components/ActionButton';
import { MiniBalance } from '../components/MiniBalance';
import chips from '../assets/chips.png';

export default function IntroPage() {
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
            Аккаунт / Первое знакомство
          </Typography>
          <MiniBalance/>
        </Box>

        <Typography variant="h1" sx={{ fontSize: '3rem', mb: 2 }}>
          Добро пожаловать
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
          Сначала попробуйте угадайку. Она бесплатная — даже при нулевом балансе.
        </Typography>

        <Grid2 container spacing={8} alignItems="center">
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 6 }}>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', borderBottom: '1px solid', borderColor: 'divider', pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '24px', pt: 0.5 }}>
                  01
                </Typography>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Посмотрите картинку
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Назовите, что на ней происходит. На ответ — 60 секунд.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', borderBottom: '1px solid', borderColor: 'divider', pb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '24px', pt: 0.5 }}>
                  02
                </Typography>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Отправьте один ответ
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Сервер проверит название и близкие формулировки.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '24px', pt: 0.5 }}>
                  03
                </Typography>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Получите +1 КУМ
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Потратьте игровую валюту на дуэль, рулетку или P2P.
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <ActionButton component={RouterLink} to="/">
                  Начать угадайку
                </ActionButton>
              </Box>
              <Box sx={{ flex: 1, minWidth: '200px' }}>
                <Button
                  component={RouterLink}
                  to="/"
                  fullWidth
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'divider',
                    color: 'text.primary',
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  Перейти в терминал
                </Button>
              </Box>
            </Box>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src={chips}
              alt="Dyahan Exchange Casino Chips Stack"
              sx={{
                width: '100%',
                maxWidth: '480px',
                display: 'block',
                mx: 'auto',
                objectFit: 'contain',
              }}
            />
          </Grid2>
        </Grid2>
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