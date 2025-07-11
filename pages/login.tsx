import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ReflectaIcon } from '@/components/icons';
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
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // If already logged in redirect to loading
  useEffect(() => {
    if (userId) router.replace('/loading');
  }, [userId, router]);

  // Handle magic link redirect
  useEffect(() => {
    if (!router.isReady) return;
    const token = router.query.token as string | undefined;
    const mail = router.query.email as string | undefined;
    if (!token || !mail || userId) return;
    const verify = async () => {
      try {
        const data = await apiFetch<{ user_id: string; role?: string }>(
          `/api/login-token?email=${encodeURIComponent(mail)}&token=${encodeURIComponent(token)}`,
        );
        setUserId(data.user_id);
        setUserEmail(mail);
        sessionStorage.setItem('reflecta_user_id', data.user_id);
        sessionStorage.setItem('reflecta_email', mail);
        sessionStorage.setItem('reflecta_token', token);
        if (data.role) {
          setUserRole(data.role);
          sessionStorage.setItem('reflecta_role', data.role);
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
        setSent(false);
    try {
      await apiFetch('/api/login-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      console.error('[login-token]', err);
      setError('Nem sikerült elküldeni a belépési linket.');
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
      {/* Background image removed, using ai-color instead */}
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
            {sent && (
              <p className={styles.info}>E-mailes belépési link elküldve.</p>
            )}
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
