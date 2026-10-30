import { Box, Button, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import logo from '../assets/logo.png';

const navigationItems = ['Рынок', 'Игры', 'P2P', 'Чат', 'Банк', 'Сообщество'];

export function Header() {
  return (
    <Box
      component="header"
      sx={{
        height: 58,
        px: { xs: 2, md: 4 },
        display: 'flex',
        alignItems: 'center',
        bgcolor: '#141414',
        borderBottom: '1px solid #2A2A2A',
        color: '#FFFFFF',
        boxSizing: 'border-box',
      }}
    >
      <Box
        component={RouterLink}
        to="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          flexShrink: 0,
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Логотип Дяхан"
          sx={{
            width: 34,
            height: 34,
            objectFit: 'contain',
            borderRadius: '50%',
          }}
        />

        <Typography
          component="span"
          sx={{
            fontFamily: '"Yeseva One", serif',
            fontSize: 16,
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
          }}
        >
          Дяхан
        </Typography>

        <Typography
          component="span"
          sx={{
            fontFamily: '"Yeseva One", serif',
            fontSize: 16,
            color: '#A5A5A5',
            whiteSpace: 'nowrap',
          }}
        >
          Exchange
        </Typography>
      </Box>

      <Box
        component="nav"
        aria-label="Основная навигация"
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          alignSelf: 'stretch',
          gap: { xs: 0, md: 1 },
          ml: { xs: 2, md: 7 },
          flex: 1,
          minWidth: 0,
        }}
      >
        {navigationItems.map((item) => (
          <Button
            key={item}
            component={RouterLink}
            to="/"
            color="inherit"
            disableRipple
            sx={{
              position: 'relative',
              minWidth: 0,
              px: { xs: 0.75, md: 1.5 },
              borderRadius: 0,
              color: '#B8B8B8',
              fontFamily: '"Yeseva One", serif',
              fontSize: 11,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: 'transparent',
                color: '#FFFFFF',
              },
            }}
          >
            {item}
          </Button>
        ))}
      </Box>

      <Link
        component={RouterLink}
        to="/"
        underline="none"
        sx={{
          ml: 2,
          flexShrink: 0,
          color: '#FFFFFF',
          fontFamily: '"Yeseva One", serif',
          fontSize: 11,
          whiteSpace: 'nowrap',
          '&:hover': {
            color: '#FFD000',
          },
        }}
      >
        Войти / регистрация
      </Link>
    </Box>
  );
}
