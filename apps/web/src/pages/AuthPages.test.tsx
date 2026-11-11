import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../app/App';
import { session } from '../auth/session';

vi.mock('../auth/session', () => ({
  session: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

const mockUser = {
  userId: 'test-user-id',
  nickname: 'TestPlayer',
  role: 'PLAYER',
  status: 'ACTIVE',
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function pressCapsLock(input: HTMLElement, enabled: boolean) {
  fireEvent.keyUp(input, {
    key: 'CapsLock',
    modifierCapsLock: enabled,
  } as KeyboardEventInit & { modifierCapsLock: boolean });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(session.login).mockResolvedValue(mockUser);
  vi.mocked(session.register).mockResolvedValue(mockUser);
});

describe('LoginPage and LoginForm', () => {
  it('validates inputs, toggles password visibility, warns about Caps Lock and remembers the nickname', async () => {
    window.localStorage.clear();
    renderAt('/login');

    expect(screen.getByRole('heading', { name: /С возвращением/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Дяхан в автомобиле' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Войти в аккаунт' })).toBeInTheDocument();

    const nickname = screen.getByLabelText('Игровой ник');
    const password = screen.getByLabelText('Пароль');
    const form = screen.getByRole('button', { name: /Войти в ДяханExchange/ }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form as HTMLFormElement);
    expect(screen.getByRole('alert')).toHaveTextContent('Введите игровой ник и пароль.');

    fireEvent.change(nickname, { target: { value: 'Контрагент_42' } });
    fireEvent.submit(form as HTMLFormElement);
    expect(screen.getByRole('alert')).toHaveTextContent('Введите игровой ник и пароль.');

    fireEvent.change(password, { target: { value: 'strong-pass-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'ПОКАЗАТЬ' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'СКРЫТЬ' }));
    expect(password).toHaveAttribute('type', 'password');

    pressCapsLock(password, true);
    expect(screen.getByText('Caps Lock включён')).toBeInTheDocument();

    pressCapsLock(password, false);
    expect(screen.queryByText('Caps Lock включён')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Запомнить ник на этом устройстве' }));
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(session.login).toHaveBeenCalledWith('Контрагент_42', 'strong-pass-1');
    });

    expect(window.localStorage.getItem('dyahan.rememberNickname')).toBe('true');
    expect(window.localStorage.getItem('dyahan.nickname')).toBe('Контрагент_42');
  });

  it('loads a remembered nickname and clears it when remember is unchecked', async () => {
    window.localStorage.setItem('dyahan.rememberNickname', 'true');
    window.localStorage.setItem('dyahan.nickname', 'SavedPlayer');
    renderAt('/login');

    const nickname = screen.getByLabelText('Игровой ник');
    expect(nickname).toHaveValue('SavedPlayer');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Запомнить ник на этом устройстве' }));
    fireEvent.change(nickname, { target: { value: 'NewPlayer' } });
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'strong-pass-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Войти в ДяханExchange/ }));

    await waitFor(() => {
      expect(session.login).toHaveBeenCalledWith('NewPlayer', 'strong-pass-1');
    });

    expect(window.localStorage.getItem('dyahan.rememberNickname')).toBeNull();
    expect(window.localStorage.getItem('dyahan.nickname')).toBeNull();
  });
});

describe('RegisterPage and RegisterForm', () => {
  it('validates nickname, password and acknowledgement, then submits registration', async () => {
    renderAt('/register');

    expect(screen.getByRole('heading', { name: /Создай своего игрока/ })).toBeInTheDocument();
    expect(screen.getByText('Твой никнейм')).toBeInTheDocument();
    expect(screen.getByText('Д')).toBeInTheDocument();

    const nickname = screen.getByLabelText(/Ник · 3–24 символа/);
    const password = screen.getByLabelText(/Пароль · от 8 символов/);
    const form = screen.getByRole('button', { name: 'Создать аккаунт' }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.change(nickname, { target: { value: 'ab' } });
    expect(screen.getByText('A')).toBeInTheDocument();
    fireEvent.submit(form as HTMLFormElement);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ник должен содержать от 3 до 24 символов.',
    );

    fireEvent.change(nickname, { target: { value: 'a'.repeat(25) } });
    fireEvent.submit(form as HTMLFormElement);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ник должен содержать от 3 до 24 символов.',
    );

    fireEvent.change(nickname, { target: { value: 'Daniil' } });
    fireEvent.change(password, { target: { value: 'short' } });
    fireEvent.submit(form as HTMLFormElement);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Пароль должен содержать не менее 8 символов.',
    );

    fireEvent.change(password, { target: { value: 'abcdefgh' } });
    expect(screen.getByText('Слабый')).toBeInTheDocument();

    fireEvent.change(password, { target: { value: 'Abcdefgh' } });
    expect(screen.getByText('Неплохой')).toBeInTheDocument();
    expect(screen.getByText('Daniil')).toBeInTheDocument();

    fireEvent.submit(form as HTMLFormElement);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Подтвердите, что понимаете игровой характер валюты.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'ПОКАЗАТЬ' }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'СКРЫТЬ' }));
    expect(password).toHaveAttribute('type', 'password');

    fireEvent.change(password, { target: { value: 'Abcdefg1' } });
    expect(screen.getByText('Надёжный')).toBeInTheDocument();
    expect(screen.getByText(/Заглавная буква/)).toHaveClass('passed');
    expect(screen.getByText(/Цифра/)).toHaveClass('passed');

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /Я понимаю, что КУМ и д₽ не являются деньгами/,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(session.register).toHaveBeenCalledWith('Daniil', 'Abcdefg1');
    });
  });
});
