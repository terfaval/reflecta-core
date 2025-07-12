import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { ReflectaIcon } from '@/components/icons';
import ReflectaMandala from '@/public/ReflectaMandala.svg';
import { apiFetch } from '@/lib/api';
import PopupDialog from '@/components/PopupDialog';
import { useToast } from '@/hooks/useToast';
import { useErrorToast } from '@/hooks/useErrorToast';
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
  const errorToast = useErrorToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  
  // If already logged in redirect to loading
  useEffect(() => {
    if (userId) router.replace('/loading');
  }, [userId, router]);

  
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
    
    try {
      const data = await apiFetch<{ user: { id: string; email: string; role?: string } }>('/api/login-user', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const { user } = data;
      setUserId(user.id);
      setUserEmail(user.email);
      if (user.role) setUserRole(user.role);
      setUserInitialized(true);
      sessionStorage.setItem('reflecta_user_id', user.id);
      sessionStorage.setItem('reflecta_email', user.email);
      if (user.role) sessionStorage.setItem('reflecta_role', user.role);
      router.replace('/loading');
    } catch (err: any) {
      console.error('[login-user]', err);
      setError('Nem sikerült bejelentkezni.');
      errorToast({ message: 'Nem sikerült bejelentkezni.', type: 'auth' });
    }
  };

  const handleRegister = async () => {
    try {
      const data = await apiFetch<{ user: { id: string; email: string; role?: string } }>('/api/register-user', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const { user } = data;
      setUserId(user.id);
      setUserEmail(user.email);
      if (user.role) setUserRole(user.role);
      setUserInitialized(true);
      sessionStorage.setItem('reflecta_user_id', user.id);
      sessionStorage.setItem('reflecta_email', user.email);
      if (user.role) sessionStorage.setItem('reflecta_role', user.role);
      toast('Sikeres regisztráció!');
      router.replace('/loading');
    } catch (err) {
      console.error('[register-user]', err);
      setError('Nem sikerült regisztrálni a felhasználót.');
      errorToast({ message: 'Nem sikerült regisztrálni a felhasználót.', type: 'network' });
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
      <div className={styles.mandalaContainer}>
        <ReflectaMandala
          className={styles.mandala}
          width={400}
          height={400}
          style={{ color: '#fff', fill: 'currentColor' }}
        />
      </div>
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
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="submit"
              className={styles.submitButton}
            >
              Belépés
            </button>
          </form>
        </div>
        <button onClick={handleGuest} className={styles.guestButton}>
          Folytatás vendégként
        </button>
      </div>
    </div>
  );
}
