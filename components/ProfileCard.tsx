import React from 'react';
import styles from '../styles/ProfileCard.module.css';

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
      <img src={icon} alt="" className={styles.icon} />
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.desc}>{description}</p>
    </div>
  );
}