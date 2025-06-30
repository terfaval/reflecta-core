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
}

export default function SidebarProfileItem({
  name,
  bottomText,
  color,
  iconName,
  isActive = false,
  bottomClassName = '',
  onClick,
}: SidebarProfileItemProps) {
  const IconComp = iconName && iconMap[iconName];
  const Container = onClick ? 'button' : 'div';
  return (
    <Container
      onClick={onClick}
      className={`${styles.item} ${isActive ? styles.activeItem : ''}`}
      style={isActive ? { backgroundColor: color } : undefined}
    >
      <div className={styles.icon}>
        {IconComp ? (
          <ProfileIcon icon={IconComp} color={isActive ? 'white' : color} size={24} />
        ) : (
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: isActive ? 'white' : color }} />
        )}
      </div>
      <div className={styles.textContainer}>
        <span className={styles.itemHeader}>{truncate(name)}</span>
        <span className={`${styles.itemSubtext} ${bottomClassName}`}>{truncate(bottomText)}</span>
      </div>
    </Container>
  );
}