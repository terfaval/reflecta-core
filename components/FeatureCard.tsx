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

const DOT_STYLE = {
  basic: `${styles.dot} ${styles.dotBasic}`,
  advanced: `${styles.dot} ${styles.dotAdvanced}`,
  premium: `${styles.dot} ${styles.dotPremium}`,
};

const FeatureCard: React.FC<FunctionInfo> = ({ Icon, name, level, description, tip }) => {
  return (
    <div className={CARD_STYLE[level]}>
      <Icon className={styles.icon} />
      <h3 className="text-lg font-semibold text-center">{name}</h3>
      <div className="flex items-center gap-1 text-sm text-gray-700">
        <span className={DOT_STYLE[level]}></span>
        <span>{LEVEL_LABELS[level]}</span>
      </div>
      <p className="text-sm text-center">{description}</p>
      <p className="text-sm">
        <strong>Indítási tipp:</strong> {tip}
      </p>
    </div>
  );
};

export default FeatureCard;