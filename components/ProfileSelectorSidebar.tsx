import React from 'react';
import { LucidePlusCircle } from 'lucide-react';

import SidebarProfileItem from './SidebarProfileItem';
import styles from './ProfileSelectorSidebar.module.css';
import { useProfileContext } from '@/contexts/ProfileContext';
import { profileStyles } from '@/styles/profileStyles';

const MAX_TEXT_LENGTH = 32;

function truncateWithEllipsis(text: string, maxLength: number = MAX_TEXT_LENGTH) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  const words = text.split(' ');
  let result = '';
  for (const word of words) {
    if (result.length === 0) {
      if (word.length > maxLength) {
        return word.slice(0, maxLength) + '...';
      }
      result = word;
      continue;
    }
    if (result.length + 1 + word.length > maxLength) break;
    result += ' ' + word;
  }
  return result + '...';
}

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
  const { profile: activeProfileId } = useProfileContext();

  const allProfiles = React.useMemo<Profile[]>(() => {
    const arr: Profile[] = [BLANK_PROFILE];
    if (userRole === 'premium' && customProfile) {
      arr.push(customProfile);
    }
    arr.push(...lastUsedProfiles, ...unusedProfiles);
    return arr;
}, [userRole, customProfile, lastUsedProfiles, unusedProfiles]);

  const activeProfile = React.useMemo(() => {
    if (!activeProfileId) return null;
    const found = allProfiles.find(
      (p) => p.id.toLowerCase() === activeProfileId.toLowerCase(),
    );
    if (found) return found;
    // fallback using style map when profile metadata is missing
    const style =
      profileStyles[activeProfileId] ||
      profileStyles[activeProfileId.toLowerCase()] ||
      {};
    const color = style['--user-color'] || '#7A4DFF';
    return {
      id: activeProfileId,
      name: activeProfileId,
      role: '',
      color,
    } as Profile;
  }, [allProfiles, activeProfileId]);

  const otherProfiles = React.useMemo< (Profile | null)[] >(() => {
    const arr: (Profile | null)[] = [];
    if (userRole === 'premium' && !customProfile) arr.push(null);
    const activeId = activeProfileId?.toLowerCase();
    allProfiles.forEach((p) => {
      if (p.id.toLowerCase() !== activeId) arr.push(p);
    });
    return arr;
  }, [allProfiles, activeProfileId, userRole, customProfile]);

  return (
    <aside className={styles.sidebar}>
      {activeProfile && (
        <SidebarProfileItem
          name={activeProfile.name}
          bottomText={activeProfile.role}
          iconName={activeProfile.iconName}
          color={activeProfile.color}
          isActive
        />
      )}
      {otherProfiles.map((p) => {
        if (!p) {
          return (
            <button
              key="create-custom"
              onClick={onCreateCustomProfile}
              className={`${styles.item} ${styles.create}`}
            >
              <div className={styles.icon}>
                <LucidePlusCircle className="w-6 h-6 stroke-gray-400" />
              </div>
              <span className="text-sm font-medium">
                Hozd létre a személyes napló profilodat!
              </span>
            </button>
          );
        }
        const list = entries[p.id] || [];
        const lastUser = [...list].reverse().find((e) => e.role === 'user');
        const bottomText = lastUser ? lastUser.content : p.role;
        const bottomClass = lastUser ? 'text-sm' : 'text-sm font-medium text-gray-600';
        return (
          <SidebarProfileItem
            key={p.id}
            onClick={() => onProfileSelect(p.id)}
            name={p.name}
            bottomText={bottomText}
            bottomClassName={bottomClass}
            iconName={p.iconName}
            color={p.color}
          />
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