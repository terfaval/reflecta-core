import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LucidePlusCircle } from 'lucide-react';
import { useUserContext } from '@/contexts/UserContext';
import { useProfileContext } from '@/contexts/ProfileContext';

const API_HOST =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_HOST ||
  '';

interface ProfileMeta {
  name: string;
  description: string;
  color: string;
  icon: string;
}

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

export default function ProfileSelectorSidebar() {
  const router = useRouter();
  const { userId } = useUserContext();
  const { setProfile } = useProfileContext();
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [personal, setPersonal] = useState<ProfileMeta | null>(null);
  const [role, setRole] = useState<string>('basic');

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        const names = DEFAULT_PROFILES.map(p => p.name);
        const res = await fetch(`${API_HOST}/profile-list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, names }),
        });
        const data = await res.json();
        if (res.ok) {
          const metaMap: Record<string, { description: string; color: string }> = {};
          (data.profiles || []).forEach((p: any) => {
            metaMap[p.name] = { description: p.description, color: p.color };
          });
          setProfiles(
            DEFAULT_PROFILES.map(p => ({
              ...p,
              description: metaMap[p.name]?.description || '',
              color: metaMap[p.name]?.color || '#000',
              icon: p.icon,
            }))
          );
          if (data.personalProfile) {
            const personalMeta = metaMap[data.personalProfile] || { description: '', color: '#000' };
            setPersonal({
              name: data.personalProfile,
              icon: '',
              description: personalMeta.description,
              color: personalMeta.color,
            });
          }
          setRole(data.role || 'basic');
        } else {
          console.error('[profile-list]', data.error);
        }
      } catch (err) {
        console.error('[profile-list] fetch error', err);
      }
    };
    load();
  }, [userId]);

  const goto = (name: string) => {
    setProfile(name);
    router.push('/chat');
  };

  return (
    <aside className="h-screen flex flex-col gap-2 w-[240px] flex-shrink-0 py-4 px-3 bg-white shadow-inner overflow-y-auto">
      {profiles.map(p => (
        <button
          key={p.name}
          onClick={() => goto(p.name)}
          className="group flex items-center gap-2 p-2 rounded transition-colors ease-in duration-200 text-black hover:text-white"
          style={{ backgroundColor: 'white' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = p.color)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
        >
          <img
            src={p.icon}
            alt=""
            className="w-6 h-6 filter grayscale brightness-0 group-hover:brightness-200 group-hover:invert"
          />
          <div className="flex flex-col items-start">
            <span>{p.name}</span>
            <span className="text-xs opacity-75 leading-tight">{p.description}</span>
          </div>
        </button>
      ))}

      {personal && (
        <button
          onClick={() => goto(personal.name)}
          className="group flex items-center gap-2 p-2 rounded transition-colors ease-in duration-200 text-black hover:text-white"
          style={{ backgroundColor: 'white' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = personal.color)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
        >
          <div className="w-6 h-6 bg-gray-300 rounded-full group-hover:bg-white" />
          <div className="flex flex-col items-start">
            <span>{personal.name}</span>
            <span className="text-xs opacity-75 leading-tight">{personal.description}</span>
          </div>
        </button>
      )}

      {!personal && role === 'premium' && (
        <button
          onClick={() => router.push('/profile-builder')}
          className="flex items-center gap-2 p-2 rounded text-black hover:text-white transition-colors ease-in duration-200 hover:bg-blue-500"
        >
          <LucidePlusCircle size={20} />
          <span>Új profil létrehozása</span>
        </button>
      )}
    </aside>
  );
}