import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProfileCarousel, { ProfileCard } from '@/components/ProfileCarousel';
import SpiralLoader from '@/components/SpiralLoader';
import UserErrorDisplay from '@/components/UserErrorDisplay';
import { profileStyles } from '../styles/profileStyles';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';

import { apiFetch } from '@/lib/api';

interface Meta extends ProfileCard {}

const DEFAULT_PROFILES: { name: string; iconName?: string }[] = [
  { name: 'Reflecta', iconName: 'ReflectaIcon' },
  { name: 'Akasza', iconName: 'AkaszaIcon' },
  { name: 'Éana', iconName: 'EanaIcon' },
  { name: 'Luma', iconName: 'LumaIcon' },
  { name: 'Sylva', iconName: 'SylvaIcon' },
  { name: 'Zentó', iconName: 'ZentoIcon' },
  { name: 'Oneiros', iconName: 'OneirosIcon' },
  { name: 'Kairos', iconName: 'KairosIcon' },
  { name: 'Noe', iconName: 'NoeIcon' },
  { name: 'Solun', iconName: 'SolunIcon' },
];

export default function ProfileSelectorPage() {
  const router = useRouter();
  const { userId, userInitialized, userError } = useUserContext();
  const { setProfile } = useProfileContext();
  const [profiles, setProfiles] = useState<Meta[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const data = await apiFetch<{ hasHistory: boolean; profile?: string }>(
          '/api/has-history',
          {
            method: 'POST',
            body: JSON.stringify({ userId }),
          }
        );
        if (data.hasHistory) {
          if (data.profile) setProfile(data.profile);
          router.replace('/chat');
          return;
        }
      } catch (err) {
        console.error('[has-history]', err);
      }

      try {
        const names = DEFAULT_PROFILES.map(p => p.name);
        const meta = await apiFetch<{
          profiles: any[];
          personalProfile?: string | null;
          role?: string;
          error?: string;
        }>(
          '/api/profile-list',
          {
            method: 'POST',
            body: JSON.stringify({ userId, names }),
          }
        );
        if (meta.profiles) {
          const map: Record<string, { description: string; color: string; role?: string }> = {};
          (meta.profiles || []).forEach((p: any) => {
            map[p.name] = { description: p.description, color: p.color, role: p.role };
          });
          const defaults = DEFAULT_PROFILES.map(p => {
            const style =
              profileStyles[p.name] ?? {
                '--user-color': '#000',
                '--bg-color': '#fff',
              };
            return {
              ...p,
              description: map[p.name]?.description || '',
              color: map[p.name]?.color || '#fff',
              role: map[p.name]?.role || '',
              userColor: style['--user-color'],
              bgColor: style['--bg-color'],
            };
          });

          let personalProfile: Meta | null = null;
          if (meta.personalProfile) {
            const pm = map[meta.personalProfile] || { description: '', color: '#fff' };
            const style = profileStyles[meta.personalProfile] ?? { '--user-color': '#000', '--bg-color': '#fff' };
            personalProfile = {
              name: meta.personalProfile,
              iconName: null,
              description: pm.description,
              color: pm.color,
              role: '',
              userColor: style['--user-color'],
              bgColor: style['--bg-color'],
              personal: true,
            };
          }

          const blankProfile = defaults[0];
          let coreProfiles = defaults.slice(1);
          if (personalProfile) {
            coreProfiles = coreProfiles.filter(p => p.name !== personalProfile.name);
          }
          const list = [
            blankProfile,
            ...(personalProfile ? [personalProfile] : []),
            ...coreProfiles,
          ];
          setProfiles(list);
        } else {
          console.error('[profile-list]', meta.error);
        }
      } catch (err) {
        console.error('[profile-list fetch]', err);
      }
      setLoaded(true);
    };
    load();
  }, [userId, router, setProfile]);

  if (userError)
    return (
      <UserErrorDisplay
        message={userError}
        onRetry={() => window.location.reload()}
      />
    );

  if (!userInitialized)
    return <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />;

  const handleSelect = (p: Meta) => {
    setProfile(p.name);
    router.push('/chat');
  };

 if (!loaded)
    return <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />;

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <ProfileCarousel profiles={profiles} onSelect={handleSelect} />
    </div>
  );
}