import React from 'react';
import styles from './ProfileCard.module.css';
import { iconMap, ProfileIcon } from './ProfileIcons';

export interface ProfileCardProps {
  name: string;
  role: string;
  description: string;
  iconName?: string | null;
  color: string;
  userColor: string;
  bgColor: string;
  onSelect: () => void;
  personal?: boolean;
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ProfileCard({ name, role, description, iconName, color, userColor, bgColor, onSelect, personal }: ProfileCardProps) {
  const glow = hexToRgba(userColor, 0.4);
  return (
    <div
      className={styles.card}
      style={{
        '--bg-color': bgColor,
        '--user-color': userColor,
        '--glow-color': glow,
      } as React.CSSProperties}
      onClick={onSelect}
    >
      {personal && <span className={styles.personalBadge}>Személyes</span>}
      <div className={styles.iconWrap}>
        {iconName && iconMap[iconName] && (
          <ProfileIcon icon={iconMap[iconName]} color={userColor} />
        )}
      </div>
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.role}>{role}</p>
      <p className={styles.desc}>{description}</p>
    </div>
  );
}