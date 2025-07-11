import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { supabase } from '@/lib/supabaseClient';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const {
    userId,
    setUserId,
    setUserRole,
    setUserEmail,
    setUserInitialized,
    setGuestSessionId,
  } = useUserContext();
  const { setProfile } = useProfileContext();

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If already logged in redirect to loading
  useEffect(() => {
    if (userId) router.replace('/loading');
  }, [userId, router]);

  // Finalize supabase session
  const finalize = async (session: any) => {
    const uid = session.user.id as string;
    const mail = session.user.email as string | null;
    const token = session.access_token as string;
    setUserId(uid);
    setUserInitialized(true);
    if (mail) {
      setUserEmail(mail);
      sessionStorage.setItem('reflecta_email', mail);
    }
    sessionStorage.setItem('reflecta_user_id', uid);
    sessionStorage.setItem('reflecta_token', token);
    try {
      const info = await apiFetch<{ role?: string }>(`/api/user/${uid}`);
      if (info?.role) {
        setUserRole(info.role);
        sessionStorage.setItem('reflecta_role', info.role);
      }
    } catch (err) {
      console.error('[login role]', err);
    }
    router.replace('/loading');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finalize(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session) finalize(session);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const handleGuest = () => {
    const id = `guest-${uuidv4()}`;
    const session = `guest-session-${uuidv4()}`;
    setUserId(id);
    setUserRole('guest');
    setUserInitialized(true);
    setGuestSessionId(session);
    setProfile('Reflecta');
    sessionStorage.setItem('reflecta_user_id', id);
    sessionStorage.setItem('reflecta_role', 'guest');
    sessionStorage.setItem('reflecta_guest_session_id', session);
    sessionStorage.setItem('reflecta_session_Reflecta', session);
    sessionStorage.setItem('reflecta_profile', 'Reflecta');
    router.replace('/loading');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (err) {
      setError(err.message);
    } else {
      setStatus('Ellenőrizd az emailed a belépési linkért.');
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 className="mb-4 text-xl font-semibold">Reflecta belépés</h1>
      {status ? (
        <p>{status}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="border p-2 mr-2"
          />
          <button type="submit" className="px-4 py-2 border rounded">
            Küldés
          </button>
        </form>
      )}
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <button onClick={handleGuest} className="underline">
        Folytatás vendégként
      </button>
    </div>
  );
}