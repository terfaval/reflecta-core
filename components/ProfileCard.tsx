import React from 'react';
import styles from './ProfileCard.module.css';

export interface ProfileCardProps {
  name: string;
  description: string;
  icon: string;
  color: string;
  userColor: string;
  onSelect: () => void;
}

export default function ProfileCard({ name, description, icon, color, userColor, onSelect }: ProfileCardProps) {
  return (
    <div
      className={styles.card}
      style={{
        '--bg': color,
        '--user': userColor,
      } as React.CSSProperties}
      onClick={onSelect}
    >
      <div className={styles.iconWrap}>
        <img src={icon} alt="" className={styles.icon} />
      </div>
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.desc}>{description}</p>
    </div>
  );
}