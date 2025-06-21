import React from 'react';
import styles from './ProfileCard.module.css';

export interface ProfileCardProps {
  name: string;
  role: string;
  description: string;
  icon: string;
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

export default function ProfileCard({ name, role, description, icon, color, userColor, bgColor, onSelect, personal }: ProfileCardProps) {
  const glow = hexToRgba(userColor, 0.4);
  return (
    <div
      className={styles.card}
      style={{
        '--bg-color': bgColor,
        '--user-color': userColor,
        '--glow-color': glow,
        '--icon-url': `url(${icon})`,
      } as React.CSSProperties}
      onClick={onSelect}
    >
      {personal && <span className={styles.personalBadge}>Saját</span>}
      <div className={styles.iconWrap}>
        <div className={styles.icon} />
      </div>
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.role}>{role}</p>
      <p className={styles.desc}>{description}</p>
    </div>
  );
}