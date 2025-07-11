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
import { supabase } from '@/lib/supabaseClient';

interface UserContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  userRole: string | null;
  setUserRole: (r: string | null) => void;
  guestSessionId: string | null;
  setGuestSessionId: (id: string | null) => void;
  userInitialized: boolean;
  setUserInitialized: (v: boolean) => void;
  userError: string | null;
  setUserError: (err: string | null) => void;
  wpEmbed: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);
  const [userInitialized, setUserInitialized] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [wpEmbed, setWpEmbed] = useState(false);

  const router = useRouter();
  const { setProfile } = useProfileContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setWpEmbed(params.get('wp_embed') === 'true');
  }, []);

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
        try {
          const info = await apiFetch<{ role?: string }>(`/api/user/${data.user_id}`);
          if (info?.role) {
            setUserRole(info.role);
            sessionStorage.setItem('reflecta_role', info.role);
          }
        } catch (err) {
          console.error('[init_user] fetch role', err);
        }
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

  const handleSupabaseSession = async (session: any) => {
    if (!session?.user) return;
    const uid = session.user.id as string;
    const email = session.user.email as string | null;
    const token = session.access_token as string;
    setUserId(uid);
    if (email) setUserEmail(email);
    setUserInitialized(true);
    sessionStorage.setItem('reflecta_user_id', uid);
    if (email) sessionStorage.setItem('reflecta_email', email);
    sessionStorage.setItem('reflecta_token', token);
    try {
      const info = await apiFetch<{ role?: string }>(`/api/user/${uid}`);
      if (info?.role) {
        setUserRole(info.role);
        sessionStorage.setItem('reflecta_role', info.role);
      }
    } catch (err) {
      console.error('[supabase role]', err);
    }
  };

// Restore any stored credentials
useEffect(() => {
  const storedId = sessionStorage.getItem('reflecta_user_id');
  const storedEmail = sessionStorage.getItem('reflecta_email');
  const storedRole = sessionStorage.getItem('reflecta_role');
  const storedGuestSession = sessionStorage.getItem('reflecta_guest_session_id');
  if (storedId) {
    setUserId(storedId);
    setUserInitialized(true);
    if (storedEmail) setUserEmail(storedEmail);
    if (storedRole) setUserRole(storedRole);
    if (storedGuestSession) setGuestSessionId(storedGuestSession);
    // eslint-disable-next-line no-console
    console.log('[init_user] restored', storedId, storedEmail);
  }
  }, []);

  // In WordPress embed mode listen for user info via postMessage
  useEffect(() => {
    if (!wpEmbed) return;

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
  }, [wpEmbed]);

  // In standalone mode check Supabase auth state
  useEffect(() => {
    if (wpEmbed) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !userInitialized) handleSupabaseSession(data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) handleSupabaseSession(session);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [wpEmbed, userInitialized]);

useEffect(() => {
  if (!wpEmbed || userInitialized) return;
  const params = new URLSearchParams(window.location.search);
  const wpUserId = params.get('user_id');
  const email = params.get('email');
  const token = params.get('token');
  if (wpUserId && email) {
    // eslint-disable-next-line no-console
    console.log('[init_user] from query', wpUserId, email);
    processUserInit(wpUserId, email, undefined, token || undefined);
  }
}, [userInitialized, wpEmbed]);

useEffect(() => {
    if (!wpEmbed || userInitialized || userError) return;
    const id = setTimeout(() => {
      if (!userInitialized && !userError) {
        setUserError('Nem érkezett bejelentkezési adat a WordPress oldalról. Kérlek frissítsd az oldalt vagy próbáld újra.');
      }
    }, 5000);
    return () => clearTimeout(id);
  }, [userInitialized, userError, wpEmbed]);

  useEffect(() => {
    if (guestSessionId) {
      sessionStorage.setItem('reflecta_guest_session_id', guestSessionId);
    }
  }, [guestSessionId]);

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        userEmail,
        setUserEmail,
        userRole,
        setUserRole,
        guestSessionId,
        setGuestSessionId,
        userInitialized,
        setUserInitialized,
        userError,
        setUserError,
        wpEmbed,
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