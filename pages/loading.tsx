import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import SpiralLoader from '@/components/SpiralLoader';
import { ReflectaIcon } from '@/components/icons';
import { apiFetch } from '@/lib/api';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useUserContext } from '@/contexts/UserContext';
import { useSessionContext } from '@/contexts/SessionContext';
import { redirectToChat } from '@/lib/navigation';
import { useErrorToast } from '@/hooks/useErrorToast';

export default function LoadingPage() {
  const router = useRouter();
  const { setProfile } = useProfileContext();
  const { userId, userInitialized, userError, userRole, wpEmbed } = useUserContext();
  const { setSessionMap } = useSessionContext();
  const errorToast = useErrorToast();

  useEffect(() => {
    if (!router.isReady) return;
    if (!wpEmbed && !userId && !userInitialized) {
      router.replace('/login');
      return;
    }
    if (!userId || !userInitialized) return;

    if (userRole === 'guest') {
      router.replace('/guest-chat');
      return;
    }

    const check = async () => {
      try {
        const start = Date.now();
        const data = await apiFetch<{
          conversationId?: string;
          sessionId?: string;
          profile?: string;
          endedAt?: string | null;
        }>(`/api/last-session?userId=${encodeURIComponent(userId)}`, {
          method: 'GET',
        });

        try {
          const list = await apiFetch<
            {
              profile: string;
              conversation_id: string;
              session: { id: string; started_at: string; ended_at: string | null } | null;
            }[]
          >(`/api/conversations/last-sessions?userId=${encodeURIComponent(userId)}`);
          list.forEach((item) => {
            if (item.conversation_id) {
              sessionStorage.setItem(`reflecta_conversation_${item.profile}`, item.conversation_id);
            }
            if (item.session?.id) {
              sessionStorage.setItem(`reflecta_session_${item.profile}`, item.session.id);
            }
          });
        } catch (err) {
          console.error('[conversations/last-sessions]', err);
        }

        try {
          const all = await apiFetch<
            {
              conversation_id: string;
              profile: string;
              title: string | null;
              started_at: string;
              sessions: { id: string; started_at: string; ended_at: string | null }[];
            }[]
          >(`/api/conversations/list?userId=${encodeURIComponent(userId)}`);

          const map: Record<string, any[]> = {};
          all.forEach((conv) => {
            const arr = map[conv.profile] || [];
            arr.push({ ...conv, updatedAt: Date.now() });
            map[conv.profile] = arr;
          });
          sessionStorage.setItem('reflecta_session_map', JSON.stringify(map));
          setSessionMap(map);
        } catch (err) {
          console.error('[conversations/list]', err);
        }
        
        const navigate = () => {
          if (data.conversationId && data.sessionId && !data.endedAt) {
            if (data.profile) setProfile(data.profile);
            redirectToChat(router, data.conversationId, data.sessionId, true);
          } else {
            router.replace('/select-profile');
          }
        };

        const elapsed = Date.now() - start;
        const MIN_DELAY = 5000;
        if (elapsed < MIN_DELAY) {
          setTimeout(navigate, MIN_DELAY - elapsed);
        } else {
          navigate();
        }
      } catch (err) {
        console.error('[last-session]', err);
        setTimeout(() => router.replace('/select-profile'), 500);
        errorToast({ message: 'Nem sikerült betölteni az előző munkamenetet.', type: 'network', retry: check });
      }
    };

    check();
  }, [router, userId, userInitialized, userRole, wpEmbed, setProfile]);

  if (userError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{userError}</p>
      </div>
    );
  }

  const style = {
    '--bg-color': '#ffffff',
    '--user-color': '#7D9EDF',
    '--ai-color': '#C5DAF1',
  } as Record<string, string>;
  return (
    <div
      style={{
        ...style,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.5rem',
        width: '100%',
        color: style['--user-color'],
      }}
    >
      <ReflectaIcon
        width={64}
        height={64}
        style={{ color: style['--user-color'], fill: 'currentColor' }}
      />
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
        userColor={style['--user-color']}
        aiColor={style['--ai-color']}
        fullScreen={false}
      />
    </div>
  );
}