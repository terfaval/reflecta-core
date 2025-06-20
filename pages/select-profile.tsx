import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ProfileCarousel, { ProfileCard } from '@/components/ProfileCarousel';
import SpiralLoader from '@/components/SpiralLoader';
import { profileStyles } from '../styles/profileStyles';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';

interface Meta extends ProfileCard {}

const DEFAULT_PROFILES: { name: string; icon: string }[] = [
  { name: 'Reflecta', icon: 'https://beenook.hu/wp-content/uploads/2025/05/00_reflecta.svg' },
  { name: 'Akasza', icon: 'https://beenook.hu/wp-content/uploads/2025/05/01_akasza.svg' },
  { name: 'Éana', icon: 'https://beenook.hu/wp-content/uploads/2025/05/02_eana.svg' },
  { name: 'Luma', icon: 'https://beenook.hu/wp-content/uploads/2025/05/03_luma.svg' },
  { name: 'Sylva', icon: 'https://beenook.hu/wp-content/uploads/2025/05/04_sylva.svg' },
  { name: 'Zentó', icon: 'https://beenook.hu/wp-content/uploads/2025/05/05_zento.svg' },
  { name: 'Oneiros', icon: 'https://beenook.hu/wp-content/uploads/2025/05/09_oneiros.svg' },
  { name: 'Kairos', icon: 'https://beenook.hu/wp-content/uploads/2025/05/06_kairos.svg' },
  { name: 'Noe', icon: 'https://beenook.hu/wp-content/uploads/2025/05/07_noe.svg' },
];

export default function ProfileSelectorPage() {
  const router = useRouter();
  const { userId, userInitialized } = useUserContext();
  const { setProfile } = useProfileContext();
  const [profiles, setProfiles] = useState<Meta[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const res = await fetch('/has-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (res.ok && data.hasHistory) {
          if (data.profile) setProfile(data.profile);
          router.replace('/chat');
          return;
        }
      } catch (err) {
        console.error('[has-history]', err);
      }

      try {
        const names = DEFAULT_PROFILES.map(p => p.name);
        const resp = await fetch('/profile-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, names }),
        });
        const meta = await resp.json();
        if (resp.ok) {
          const map: Record<string, { description: string; color: string }> = {};
          (meta.profiles || []).forEach((p: any) => {
            map[p.name] = { description: p.description, color: p.color };
          });
          setProfiles(
            DEFAULT_PROFILES.map(p => ({
              ...p,
              description: map[p.name]?.description || '',
              color: map[p.name]?.color || '#fff',
              userColor: (profileStyles[p.name] || {})['--user-color'] || '#000',
            }))
          );
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

  if (!userInitialized)
    return <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />;

  const handleSelect = (p: Meta) => {
    setProfile(p.name);
    router.push('/chat');
  };

 if (!loaded)
    return <SpiralLoader userColor="#7A4DFF" aiColor="#FFB347" />;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <ProfileCarousel profiles={profiles} onSelect={handleSelect} />
    </div>
  );
}