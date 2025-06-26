import React from 'react';
import { LucidePlusCircle } from 'lucide-react';
import { ProfileIcon, iconMap } from './ProfileIcons';
import styles from './ProfileSelectorSidebar.module.css';

export interface Profile {
  id: string;
  name: string;
  role: string;
  color: string;
  iconName?: string;
}

export interface Entry {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ProfileSelectorSidebarProps {
  userRole: 'basic' | 'premium';
  customProfile: Profile | null;
  lastUsedProfiles: Profile[];
  unusedProfiles: Profile[];
  entries: Record<string, Entry[]>;
  onProfileSelect: (profileId: string) => void;
  onCreateCustomProfile: () => void;
}
const BLANK_PROFILE: Profile = {
  id: 'reflecta-blank',
  name: 'Reflecta',
  role: '',
  color: '#7A4DFF',
  iconName: 'ReflectaIcon',
};

export default function ProfileSelectorSidebar({
  userRole,
  customProfile,
  lastUsedProfiles,
  unusedProfiles,
  entries,
  onProfileSelect,
  onCreateCustomProfile,
}: ProfileSelectorSidebarProps) {
  const profileItems = React.useMemo<(Profile | null)[]>(() => {
    const arr: (Profile | null)[] = [BLANK_PROFILE];
    if (userRole === 'premium') {
      arr.push(customProfile); // may be null for create button
    }
    arr.push(...lastUsedProfiles, ...unusedProfiles);
    return arr;
  }, [userRole, customProfile, lastUsedProfiles, unusedProfiles]);

  return (
    <aside className={styles.sidebar}>
      {profileItems.map((p, idx) => {
        if (!p) {
          return (
            <button
              key="create-custom"
              onClick={onCreateCustomProfile}
              className={`${styles.item} ${styles.create}`}
            >
              <LucidePlusCircle className="w-6 h-6 stroke-gray-400" />
              <span className="text-sm font-medium">
                Hozd létre a személyes napló profilodat!
              </span>
            </button>
          );
        }
        const last = entries[p.id]?.[entries[p.id].length - 1];
        const bottomText = last ? last.role : p.role;
        const bottomClass = last ? 'text-sm' : 'text-sm font-medium text-gray-600';
        const IconComp = p.iconName && iconMap[p.iconName];
        return (
          <button
            key={p.id}
            onClick={() => onProfileSelect(p.id)}
            className={styles.item}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {IconComp ? (
                <ProfileIcon icon={IconComp} color={p.color} size={24} />
              ) : (
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: p.color }} />
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold">{p.name}</span>
              <span className={bottomClass}>{bottomText}</span>
            </div>
          </button>
        );
      })}
    </aside>
  );
}

// Example usage with mock data
const mockProfiles: Profile[] = [
  { id: 'akasza', name: 'Akasza', role: 'Táncos mágus', color: '#E75735', iconName: 'AkaszaIcon' },
  { id: 'eana', name: 'Éana', role: 'Lágy segítő', color: '#F08230', iconName: 'EanaIcon' },
  { id: 'luma', name: 'Luma', role: 'Fénykereső', color: '#FBD96A', iconName: 'LumaIcon' },
];

const mockEntries: Record<string, Entry[]> = {
  akasza: [
    { id: '1', role: 'assistant', content: 'Szia', created_at: '2024-01-01' },
  ],
};

export function MockProfileSelectorSidebar() {
  return (
    <ProfileSelectorSidebar
      userRole="premium"
      customProfile={null}
      lastUsedProfiles={mockProfiles.slice(0, 2)}
      unusedProfiles={mockProfiles.slice(2)}
      entries={mockEntries}
      onProfileSelect={(id) => console.log('select', id)}
      onCreateCustomProfile={() => console.log('create custom')}
    />
  );
}