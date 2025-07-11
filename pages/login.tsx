import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ReflectaIcon } from '@/components/icons';
import { supabase } from '@/lib/supabaseClient';
import { apiFetch } from '@/lib/api';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const {
    userId,
    wpEmbed,
    setUserId,
    setUserRole,
    setUserEmail,
    setUserInitialized,
    setGuestSessionId,
  } = useUserContext();
  const { setProfile } = useProfileContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unknownEmail, setUnknownEmail] = useState(false);

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
        setUnknownEmail(false);
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (err) {
      if (err.message && err.message.toLowerCase().includes('invalid')) {
        setUnknownEmail(true);
      } else {
        setError(err.message);
      }
      return;
    }
    if (data.session) {
      if (!remember) {
        const match = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
          /https?:\/\/(.*?)\.supabase\.co/,
        );
        if (match) {
          localStorage.removeItem(`sb-${match[1]}-auth-token`);
        }
      }
      finalize(data.session);
    }
  };

  if (wpEmbed) {
    return (
      <div className={styles.loadingContainer}>
        <p>Bejelentkezés…</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Image
        src="/ReflectaLoginBackground.png"
        alt="background"
        fill
        className={styles.background}
      />
      <div className={styles.content}>
        <div
          className={styles.box}
          style={{ borderColor: 'var(--user-color, #7D9EDF)' }}
        >
          <div className={styles.iconRow}>
            <ReflectaIcon width={48} height={48} />
            <h1 className={styles.title}>Reflecta</h1>
          </div>
          <h2 className={styles.subtitle}>Benned kezdődik</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className={styles.input}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Jelszó"
              required
              className={styles.input}
            />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Emlékezz rám!
            </label>
            {unknownEmail && (
              <p className={styles.error}>
                A megadott e‑mail nem található.{' '}
                <Link href="/register" className={styles.registerLink}>
                  Regisztráció
                </Link>
              </p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              className={styles.submitButton}
            >
              Login
            </button>
            <Link href="/register" className={styles.registerLink}>
              Regisztráció
            </Link>
          </form>
        </div>
        <button onClick={handleGuest} className={styles.guestButton}>
          Folytatás vendégként
        </button>
      </div>
    </div>
  );
}
