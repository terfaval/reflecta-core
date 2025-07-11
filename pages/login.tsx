import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ReflectaIcon } from '@/components/icons';
import ReflectaMandala from '@/public/ReflectaMandala.svg';
import { apiFetch } from '@/lib/api';
import PopupDialog from '@/components/PopupDialog';
import { useToast } from '@/hooks/useToast';
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
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  
  // If already logged in redirect to loading
  useEffect(() => {
    if (userId) router.replace('/loading');
  }, [userId, router]);

  // Handle magic link redirect
  useEffect(() => {
    if (!router.isReady) return;
    const token = router.query.token as string | undefined;
    if (!token || userId) return;
    const verify = async () => {
      try {
        const data = await apiFetch<{ supabaseToken?: string; user: { id: string; email: string; role?: string } }>(
          `/api/login-token/validate?token=${encodeURIComponent(token)}`,
        );
        const { user, supabaseToken } = data;
        setUserId(user.id);
        setUserEmail(user.email);
        sessionStorage.setItem('reflecta_user_id', user.id);
        sessionStorage.setItem('reflecta_email', user.email);
        if (supabaseToken) sessionStorage.setItem('reflecta_token', supabaseToken);
        if (user.role) {
          setUserRole(user.role);
          sessionStorage.setItem('reflecta_role', user.role);
        }
        setUserInitialized(true);
        router.replace('/loading');
      } catch (err) {
        console.error('[magic-link]', err);
        setError('Hibás vagy lejárt bejelentkezési link.');
      }
    };
    verify();
  }, [router, userId, setUserId, setUserEmail, setUserRole, setUserInitialized]);

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
    setMessage(null);
    try {
      const res = await fetch('/api/login-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404) {
          setShowRegisterPrompt(true);
        } else {
          setError(data.detail || 'Nem sikerült elküldeni a belépési linket.');
        }
        return;
      }
      setMessage(data.message || 'Login link sent successfully.');
    } catch (err) {
      console.error('[login-token]', err);
      setError('Nem sikerült elküldeni a belépési linket.');
    }
  };

  const handleRegister = async () => {
    try {
      const res = await fetch('/api/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Nem sikerült regisztrálni a felhasználót.');
      } else {
        toast('Registration successful. Please enter your email again to log in.');
      }
    } catch (err) {
      console.error('[register-user]', err);
      setError('Nem sikerült regisztrálni a felhasználót.');
    } finally {
      setShowRegisterPrompt(false);
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
      <PopupDialog
        open={showRegisterPrompt}
        message="Nincs felhasználó ezzel az e-mail címmel. Szeretnél regisztrálni?"
        cancelLabel="Mégsem"
        confirmLabel="Igen"
        onCancel={() => setShowRegisterPrompt(false)}
        onConfirm={handleRegister}
      />
      {/* Mandala background */}
      <ReflectaMandala
        className={styles.mandala}
        width={400}
        height={400}
        style={{ color: '#fff', fill: 'currentColor' }}
      />
      <div className={styles.content}>
        <div
          className={styles.box}
          style={{ borderColor: 'var(--user-color, #7D9EDF)' }}
        >
          <div className={styles.iconRow}>
            <ReflectaIcon
              width={54}
              height={54}
              style={{ color: 'var(--user-color, #7D9EDF)', fill: 'currentColor' }}
            />
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
            {message && <p className={styles.info}>{message}</p>}
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              className={styles.submitButton}
            >
              Belépési link küldése
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
