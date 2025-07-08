import React from 'react';
import styles from './FeatureCard.module.css';

export interface FunctionInfo {
  name: string;
  level: 'basic' | 'advanced' | 'premium';
  description: string;
  tip: string;
  Icon: React.ComponentType<any>;
}

const LEVEL_LABELS = {
  basic: 'Alap szintű funkció',
  advanced: 'Haladó szintű funkció',
  premium: 'Prémium funkció',
};

const CARD_STYLE = {
  basic: `${styles.card} ${styles.basic}`,
  advanced: `${styles.card} ${styles.advanced}`,
  premium: `${styles.card} ${styles.premium}`,
};

const FeatureCard: React.FC<FunctionInfo> = ({ Icon, name, level, description, tip }) => {
  return (
    <div className={CARD_STYLE[level]}>
      <Icon className={styles.icon} />
      <h3 className="text-xl font-bold text-center">{name}</h3>
      <div className="text-xs italic text-gray-700">{LEVEL_LABELS[level]}</div>
      <p className="text-sm text-center">{description}</p>
      <p className="text-sm">
        <strong>Indítási tipp:</strong> {tip}
      </p>
    </div>
  );
};

export default FeatureCard;