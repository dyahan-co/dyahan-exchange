import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dyahanApi } from '../api/dyahanApi';
import { session } from './session';

vi.mock('../api/dyahanApi', () => ({
  dyahanApi: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}));

const auth = {
  userId: 'u1',
  nickname: 'neo',
  role: 'PLAYER',
  sessionToken: 'token',
  sessionExpiresAt: '2030-01-01T00:00:00Z',
};

describe('session', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('persists login and registration results and exposes token and user', async () => {
    vi.mocked(dyahanApi.login).mockResolvedValue(auth);
    vi.mocked(dyahanApi.register).mockResolvedValue(auth);

    await expect(session.login('neo', 'secret')).resolves.toEqual({
      userId: 'u1',
      nickname: 'neo',
      role: 'PLAYER',
      status: 'ACTIVE',
    });
    expect(session.getToken()).toBe('token');
    expect(session.getUser()?.nickname).toBe('neo');
    await session.register('neo', 'secret');
    expect(dyahanApi.register).toHaveBeenCalledWith('neo', 'secret');
  });

  it('returns null without a saved token and clears malformed saved user JSON', async () => {
    await expect(session.restore()).resolves.toBeNull();
    localStorage.setItem('dyahan.sessionUser', '{bad json');
    expect(session.getUser()).toBeNull();
    expect(localStorage.getItem('dyahan.sessionUser')).toBeNull();
  });

  it('restores the current user or clears expired sessions', async () => {
    localStorage.setItem('dyahan.sessionToken', 'token');
    vi.mocked(dyahanApi.me).mockResolvedValue({
      userId: 'u2',
      nickname: 'morpheus',
      role: 'PLAYER',
      status: 'ACTIVE',
    });
    await expect(session.restore()).resolves.toMatchObject({ userId: 'u2' });
    expect(dyahanApi.me).toHaveBeenCalledWith('token');

    vi.mocked(dyahanApi.me).mockRejectedValueOnce(new Error('expired'));
    await expect(session.restore()).resolves.toBeNull();
    expect(session.getToken()).toBeNull();
    expect(session.getUser()).toBeNull();
  });

  it('clears local session after logout, even if the API call fails', async () => {
    localStorage.setItem('dyahan.sessionToken', 'token');
    localStorage.setItem('dyahan.sessionUser', JSON.stringify({ nickname: 'neo' }));
    vi.mocked(dyahanApi.logout).mockRejectedValueOnce(new Error('offline'));

    await expect(session.logout()).rejects.toThrow('offline');
    expect(session.getToken()).toBeNull();
    expect(session.getUser()).toBeNull();
  });
});
