import { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { apiFetch } from '@/lib/api';

export interface AvailableProfile {
  id: string;
  name: string;
  role: string;
  bg_color: string;
  user_color: string;
  ai_color: string;
  iconName?: string;
}

const PROFILE_ORDER = [
  'Reflecta',
  'Akasza',
  'Éana',
  'Luma',
  'Sylva',
  'Zentó',
  'Oneiros',
  'Kairos',
  'Noe',
];

const NAME_TO_ICON: Record<string, string | undefined> = {
  Reflecta: 'ReflectaIcon',
  Akasza: 'AkaszaIcon',
  'Éana': 'EanaIcon',
  Luma: 'LumaIcon',
  Sylva: 'SylvaIcon',
  'Zentó': 'ZentoIcon',
  Oneiros: 'OneirosIcon',
  Kairos: 'KairosIcon',
  Noe: 'NoeIcon',
  Solun: 'SolunIcon',
  Preceptor: 'PreceptorIcon',
};

export function useAvailableProfiles() {
  const { userId, userRole } = useUserContext();
  const [profiles, setProfiles] = useState<AvailableProfile[]>([]);
  const [personalNames, setPersonalNames] = useState<string[]>([]);
  const [role, setRole] = useState<'basic' | 'premium' | 'admin'>('basic');

  useEffect(() => {
    if (!userId || userRole === 'guest') return;
    const load = async () => {
      try {
        const data = await apiFetch<{
          profiles?: any[];
          personalProfiles?: string[];
          role?: string;
          error?: string;
        }>('/api/profile-list', {
          method: 'POST',
          body: JSON.stringify({ userId, names: PROFILE_ORDER }),
        });
        if (data.profiles) {
          const map: Record<string, any> = {};
          (data.profiles || []).forEach((p: any) => {
            map[p.name] = p;
          });
          const personals = data.personalProfiles || [];
          setPersonalNames(personals);
          const items: AvailableProfile[] = [];
          PROFILE_ORDER.forEach((n) => {
            const rec = map[n];
            if (rec) {
              items.push({
                id: n,
                name: n,
                role: rec.role || '',
                bg_color: rec.bg_color,
                user_color: rec.user_color,
                ai_color: rec.ai_color,
                iconName: NAME_TO_ICON[n],
              });
            }
          });
          personals.forEach((pn) => {
            if (!PROFILE_ORDER.includes(pn) && map[pn]) {
              const rec = map[pn];
              items.push({
                id: pn,
                name: pn,
                role: rec.role || '',
                bg_color: rec.bg_color,
                user_color: rec.user_color,
                ai_color: rec.ai_color,
                iconName: NAME_TO_ICON[pn],
              });
            }
          });
          // Include all additional profiles for admin users
          if (data.role === 'admin') {
            Object.keys(map).forEach((name) => {
              if (
                !items.find((i) => i.id.toLowerCase() === name.toLowerCase())
              ) {
                const rec = map[name];
                items.push({
                  id: name,
                  name,
                  role: rec.role || '',
                  bg_color: rec.bg_color,
                  user_color: rec.user_color,
                  ai_color: rec.ai_color,
                  iconName: NAME_TO_ICON[name],
                });
              }
            });
          }
          setProfiles(items);
          if (data.role === 'admin') {
            setRole('admin');
          } else if (data.role === 'premium') {
            setRole('premium');
          } else {
            setRole('basic');
          }
        } else if (data.error) {
          console.error('[profile-list]', data.error);
        }
      } catch (err) {
        console.error('[profile-list fetch]', err);
      }
    };
    load();
  }, [userId, userRole]);

  return { profiles, personalNames, role };
}