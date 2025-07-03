import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import SpiralLoader from '@/components/SpiralLoader';
import { ReflectaIcon } from '@/components/icons';
import { profileStyles } from '@/styles/profileStyles';
import { apiFetch } from '@/lib/api';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useUserContext } from '@/contexts/UserContext';
import { redirectToChat } from '@/lib/navigation';

export default function LoadingPage() {
  const router = useRouter();
  const { setProfile } = useProfileContext();
  const { userId, userInitialized, userError } = useUserContext();

  useEffect(() => {
    if (!router.isReady) return;
    if (!userId || !userInitialized) return;

    const check = async () => {
      try {
        const data = await apiFetch<{
          conversationId?: string;
          sessionId?: string;
          profile?: string;
          endedAt?: string | null;
        }>(`/api/last-session?userId=${encodeURIComponent(userId)}`, {
          method: 'GET',
        });
        if (data.conversationId && data.sessionId && !data.endedAt) {
          if (data.profile) setProfile(data.profile);
          redirectToChat(router, data.conversationId, data.sessionId);
        } else {
          router.replace('/select-profile');
        }
      } catch (err) {
        console.error('[last-session]', err);
        router.replace('/select-profile');
      }
    };

    check();
  }, [router, userId, userInitialized, setProfile]);

  if (userError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{userError}</p>
      </div>
    );
  }

  const style = profileStyles['Reflecta'] || {};
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.5rem',
        width: '100%',
      }}
    >
      <ReflectaIcon width={64} height={64} />
      <h1
        style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '2rem',
          fontWeight: 600,
          margin: '0.5rem 0',
        }}
      >
        Reflecta
      </h1>
      <p
        style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        Benned kezdődik.
      </p>
      <SpiralLoader
        userColor={style['--user-color'] || '#7A4DFF'}
        aiColor={style['--ai-color'] || '#FFB347'}
      />
    </div>
  );
}