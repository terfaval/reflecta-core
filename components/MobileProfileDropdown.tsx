import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useAvailableProfiles } from '@/hooks/useAvailableProfiles';
import { ProfileIcon, iconMap } from './ProfileIcons';
import type { Profile } from './ProfileSelectorSidebar';
import styles from './MobileProfileDropdown.module.css';

interface MobileProfileDropdownProps {
  onProfileSelect: (profile: Profile) => void;
}

export default function MobileProfileDropdown({ onProfileSelect }: MobileProfileDropdownProps) {
  const { profile: activeProfileId } = useProfileContext();
  const { profiles } = useAvailableProfiles();
  const [open, setOpen] = React.useState(false);

  const activeProfile = profiles.find(
    (p) => p.id.toLowerCase() === (activeProfileId || '').toLowerCase(),
  );

  return (
    <div className={styles.dropdownWrapper}>
      <button
        className={styles.toggleButton}
        onClick={() => setOpen(!open)}
        aria-label="Profil választó"
      >
        {activeProfile && (
          <span className={styles.profileInfo}>
            {activeProfile.iconName && iconMap[activeProfile.iconName] ? (
              <ProfileIcon
                icon={iconMap[activeProfile.iconName]}
                color={activeProfile.user_color}
                size={24}
              />
            ) : (
              <span
                className={styles.iconPlaceholder}
                style={{ backgroundColor: activeProfile.user_color }}
              />
            )}
            <span className={styles.profileName}>{activeProfile.name}</span>
          </span>
        )}
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {open && (
        <div className={styles.list}>
          {profiles.map((p) => (
            <button
              key={p.id}
              className={styles.item}
              onClick={() => {
                onProfileSelect(p);
                setOpen(false);
              }}
            >
              {p.iconName && iconMap[p.iconName] ? (
                <ProfileIcon icon={iconMap[p.iconName]} color={p.user_color} size={24} />
              ) : (
                <span
                  className={styles.iconPlaceholder}
                  style={{ backgroundColor: p.user_color }}
                />
              )}
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
