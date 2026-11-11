import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { session, type SessionUser } from '../auth/session';

type AuthState = 'loading' | 'authenticated' | 'anonymous';

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    let active = true;
    session.restore().then((user: SessionUser | null) => {
      if (active) setAuthState(user ? 'authenticated' : 'anonymous');
    });

    return () => {
      active = false;
    };
  }, []);

  if (authState === 'loading') {
    return (
      <p role="status" className="auth-route-loading">
        Проверяем сессию…
      </p>
    );
  }

  if (authState === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
