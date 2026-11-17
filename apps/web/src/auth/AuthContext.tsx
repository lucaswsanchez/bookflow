import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { api, refreshSession, session, Tokens } from '../lib/api';
import type { CurrentUser } from '../lib/types';
import { AuthContext, Status } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const queryClient = useQueryClient();

  const reset = useCallback(() => {
    session.clear();
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();
  }, [queryClient]);

  // Restore the session on page load using the persisted refresh token.
  useEffect(() => {
    let cancelled = false;
    session.onExpired(reset);
    (async () => {
      if (await refreshSession()) {
        try {
          const me = await api<CurrentUser>('/auth/me');
          if (!cancelled) {
            setUser(me);
            setStatus('authenticated');
          }
          return;
        } catch {
          /* fall through */
        }
      }
      if (!cancelled) setStatus('anonymous');
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api<Tokens>('/auth/login', { method: 'POST', body: { email, password } });
    session.setTokens(tokens);
    const me = await api<CurrentUser>('/auth/me');
    setUser(me);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = session.refreshToken;
    if (refreshToken) {
      await api('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
    }
    reset();
  }, [reset]);

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
