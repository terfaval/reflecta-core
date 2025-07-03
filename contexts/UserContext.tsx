import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react';

import { useRouter } from 'next/router';

import { apiFetch } from 'lib/api';
import { redirectToChat } from 'lib/navigation';
import { useProfileContext } from '@/contexts/ProfileContext';

interface UserContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  userInitialized: boolean;
  setUserInitialized: (v: boolean) => void;
  userError: string | null;
  setUserError: (err: string | null) => void;
  checkingSession: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitialized, setUserInitialized] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(
    typeof window === 'undefined'
      ? false
      : window.location.pathname === '/' ||
        window.location.pathname === '/select-profile' ||
        window.location.pathname === '/loading',
  );

  const router = useRouter();
  const { setProfile } = useProfileContext();
  const redirectDone = useRef(false);

  const processUserInit = async (
    wp_user_id: string,
    email: string,
    origin?: string,
    token?: string,
  ) => {
    try {
      const data = await apiFetch<{ user_id?: string }>('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wp_user_id, email }),
      });
      if (data?.user_id) {
        setUserId(data.user_id);
        setUserEmail(email);
        setUserInitialized(true);
        sessionStorage.setItem('reflecta_user_id', data.user_id);
        sessionStorage.setItem('reflecta_email', email);
        if (token) {
          sessionStorage.setItem('reflecta_token', token);
        }
        // eslint-disable-next-line no-console
        console.log('[init_user] stored', data.user_id, email);
        if (origin) {
          window.parent.postMessage({ status: 'user_received' }, origin);
        }
      } else {
        console.error('[init_user]', data);
        setUserError(
          'Hiba a beléptetés során. Kérlek frissítsd az oldalt vagy próbáld újra.',
        );
      }
    } catch (err) {
      console.error(err);
      setUserError(
        'Hiba a beléptetés során. Kérlek frissítsd az oldalt vagy próbáld újra.',
      );
    }
  };

  useEffect(() => {
    const storedId = sessionStorage.getItem('reflecta_user_id');
    const storedEmail = sessionStorage.getItem('reflecta_email');
    if (storedId) {
      setUserId(storedId);
      setUserInitialized(true);
      if (storedEmail) setUserEmail(storedEmail);
      // eslint-disable-next-line no-console
      console.log('[init_user] restored', storedId, storedEmail);
    }

    // WordPress sends postMessage from the parent iframe. Default to the
    // production WP origin when the env variable is not provided so that
    // origin checks do not silently fail during local development.
    const rawOrigin =
      process.env.NEXT_PUBLIC_WP_ORIGIN || 'https://beenook.hu/reflecta';
    const WP_ORIGIN = (() => {
      try {
        return new URL(rawOrigin).origin;
      } catch {
        return rawOrigin.replace(/\/+$/, '');
      }
    })();

    const handleInitUser = async (event: MessageEvent) => {
      if (event.origin !== WP_ORIGIN) return;
      if (event.data?.type === 'init_user' || event.data?.type === 'wp_user') {
        const { wp_user_id, email, token } = event.data;
        processUserInit(wp_user_id, email, event.origin, token);
      }
    };

    // Temporary debug block to trace incoming postMessage events.
    const debugMessage = (event: MessageEvent) => {
      // eslint-disable-next-line no-console
      console.log('[postMessage]', event.origin, event.data);
    };

    window.addEventListener('message', handleInitUser);
    window.addEventListener('message', debugMessage);
    return () => {
      window.removeEventListener('message', handleInitUser);
      window.removeEventListener('message', debugMessage);
    };
  }, []);

  useEffect(() => {
    if (userInitialized) return;
    const params = new URLSearchParams(window.location.search);
    const wpUserId = params.get('user_id');
    const email = params.get('email');
    const token = params.get('token');
    if (wpUserId && email) {
      // eslint-disable-next-line no-console
      console.log('[init_user] from query', wpUserId, email);
      processUserInit(wpUserId, email, undefined, token || undefined);
    }
  }, [userInitialized]);

  useEffect(() => {
    if (userInitialized || userError) return;
    const id = setTimeout(() => {
      if (!userInitialized && !userError) {
        setUserError('Nem érkezett bejelentkezési adat a WordPress oldalról. Kérlek frissítsd az oldalt vagy próbáld újra.');
      }
    }, 5000);
    return () => clearTimeout(id);
  }, [userInitialized, userError]);

  useEffect(() => {
    if (redirectDone.current) return;
    if (!userId || !userInitialized) return;
    if (!router.isReady) return;
    if (
      router.pathname !== '/' &&
      router.pathname !== '/select-profile' &&
      router.pathname !== '/loading'
    ) {
      redirectDone.current = true;
      setCheckingSession(false);
      return;
    }

    const check = async () => {
      setCheckingSession(true);
      try {
        const data = await apiFetch<{
          conversationId?: string;
          sessionId?: string;
          profile?: string;
          endedAt?: string | null;
        }>(`/api/last-session?userId=${encodeURIComponent(userId)}`, { method: 'GET' });
        if (data.conversationId && data.sessionId && !data.endedAt) {
          if (data.profile) setProfile(data.profile);
          console.log('[Bridge] \uD83D\uDD04 Redirecting to chat with existing session');
          redirectToChat(router, data.conversationId, data.sessionId);
        } else if (router.pathname === '/' || router.pathname === '/loading') {
          router.push('/select-profile');
        }
      } catch (err) {
        console.error('[last-session]', err);
        if (router.pathname === '/' || router.pathname === '/loading')
          router.push('/select-profile');
      } finally {
        redirectDone.current = true;
        setCheckingSession(false);
      }
    };

    check();
  }, [userId, userInitialized, router, setProfile]);

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        userEmail,
        setUserEmail,
        userInitialized,
        setUserInitialized,
        userError,
        setUserError,
        checkingSession,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUserContext must be used within UserProvider');
  return context;
};