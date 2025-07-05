import React from 'react';
import { ProfileIcon, iconMap } from './ProfileIcons';
import styles from './ProfileSelectorSidebar.module.css';

const MAX_TEXT_LENGTH = 32;

function truncate(text: string, maxLength: number = MAX_TEXT_LENGTH) {
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

export interface SidebarProfileItemProps {
  name: string;
  bottomText: string;
  color: string;
  iconName?: string;
  isActive?: boolean;
  bottomClassName?: string;
  onClick?: () => void;
  hoverBackground?: string;
  onEdit?: () => void;
}

export default function SidebarProfileItem({
  name,
  bottomText,
  color,
  iconName,
  isActive = false,
  bottomClassName = '',
  onClick,
  hoverBackground,
  onEdit,
}: SidebarProfileItemProps) {
  const IconComp = iconName && iconMap[iconName];
  const [isHovered, setIsHovered] = React.useState(false);

  const style: React.CSSProperties = { transition: 'background-color 0.2s ease' };
  if (isActive) {
    style.backgroundColor = color;
  } else if (isHovered && hoverBackground) {
    style.backgroundColor = hoverBackground;
  }
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`${styles.item} ${isActive ? styles.activeItem : ''}`}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.icon}>
        {IconComp ? (
          <ProfileIcon icon={IconComp} color={isActive ? 'white' : color} size={32} />
        ) : (
          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: isActive ? 'white' : color }} />
        )}
      </div>
      <div className={styles.textContainer}>
        <span className={styles.itemHeader}>{truncate(name)}</span>
        <span className={`${styles.itemSubtext} ${bottomClassName}`}>{truncate(bottomText)}</span>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={styles.editButton}
          aria-label="Profil szerkesztése"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </button>
      )}
    </div>
  );
}