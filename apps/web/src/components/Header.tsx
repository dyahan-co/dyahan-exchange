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
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary',
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
          sx={(theme) => ({
            fontFamily: theme.typography.h1.fontFamily,
            fontSize: 16,
            color: 'text.primary',
            whiteSpace: 'nowrap',
          })}
        >
          Дяхан
        </Typography>

        <Typography
          component="span"
          sx={(theme) => ({
            fontFamily: theme.typography.h1.fontFamily,
            fontSize: 16,
            color: 'text.secondary',
            whiteSpace: 'nowrap',
          })}
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
            sx={(theme) => ({
              position: 'relative',
              minWidth: 0,
              px: { xs: 0.75, md: 1.5 },
              borderRadius: 0,
              color: 'text.secondary',
              fontFamily: theme.typography.h1.fontFamily,
              fontSize: 11,
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: 'transparent',
                color: 'text.primary',
              },
            })}
          >
            {item}
          </Button>
        ))}
      </Box>

      <Link
        component={RouterLink}
        to="/"
        underline="none"
        sx={(theme) => ({
          ml: 2,
          flexShrink: 0,
          color: 'text.primary',
          fontFamily: theme.typography.h1.fontFamily,
          fontSize: 11,
          whiteSpace: 'nowrap',
          '&:hover': {
            color: 'primary.main',
          },
        })}
      >
        Войти / регистрация
      </Link>
    </Box>
  );
}
