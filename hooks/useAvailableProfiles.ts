import { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { apiFetch } from '@/lib/api';
import { profileStyles } from '@/styles/profileStyles';

export interface AvailableProfile {
  id: string;
  name: string;
  role: string;
  color: string;
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
  const { userId } = useUserContext();
  const [profiles, setProfiles] = useState<AvailableProfile[]>([]);
  const [personalNames, setPersonalNames] = useState<string[]>([]);
  const [role, setRole] = useState<'basic' | 'premium'>('basic');

  useEffect(() => {
    if (!userId) return;
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
                color: rec.color ||
                  profileStyles[n]?.['--user-color'] ||
                  profileStyles[n.toLowerCase()]?.['--user-color'] ||
                  '#7A4DFF',
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
                color: rec.color ||
                  profileStyles[pn]?.['--user-color'] ||
                  profileStyles[pn.toLowerCase()]?.['--user-color'] ||
                  '#7A4DFF',
                iconName: NAME_TO_ICON[pn],
              });
            }
          });
          setProfiles(items);
          setRole(data.role === 'premium' ? 'premium' : 'basic');
        } else if (data.error) {
          console.error('[profile-list]', data.error);
        }
      } catch (err) {
        console.error('[profile-list fetch]', err);
      }
    };
    load();
  }, [userId]);

  return { profiles, personalNames, role };
}