import { dyahanApi, type AuthResponse, type MeResponse } from '../api/dyahanApi';

const SESSION_TOKEN_KEY = 'dyahan.sessionToken';
const SESSION_USER_KEY = 'dyahan.sessionUser';

export interface SessionUser {
  userId: string;
  nickname: string;
  role: string;
  status: string;
}

function saveSession(auth: AuthResponse): SessionUser {
  const user: SessionUser = {
    userId: auth.userId,
    nickname: auth.nickname,
    role: auth.role,
    status: 'ACTIVE',
  };

  localStorage.setItem(SESSION_TOKEN_KEY, auth.sessionToken);
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));

  return user;
}

function readSavedUser(): SessionUser | null {
  const value = localStorage.getItem(SESSION_USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as SessionUser;
  } catch {
    localStorage.removeItem(SESSION_USER_KEY);
    return null;
  }
}

export const session = {
  getToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  },

  getUser(): SessionUser | null {
    return readSavedUser();
  },

  async login(nickname: string, password: string): Promise<SessionUser> {
    const auth = await dyahanApi.login(nickname, password);
    return saveSession(auth);
  },

  async register(nickname: string, password: string): Promise<SessionUser> {
    const auth = await dyahanApi.register(nickname, password);
    return saveSession(auth);
  },

  async restore(): Promise<SessionUser | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const user: MeResponse = await dyahanApi.me(token);
      const restoredUser: SessionUser = {
        userId: user.userId,
        nickname: user.nickname,
        role: user.role,
        status: user.status,
      };

      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(restoredUser));
      return restoredUser;
    } catch {
      this.clear();
      return null;
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();

    try {
      if (token) await dyahanApi.logout(token);
    } finally {
      this.clear();
    }
  },

  clear(): void {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
  },
};