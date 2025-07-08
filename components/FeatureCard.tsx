import React from "react";
import styles from "./FeatureCard.module.css";

export interface FunctionInfo {
  name: string;
  level: "basic" | "advanced" | "premium";
  description: string;
  tip: string;
  Icon: React.ComponentType<any>;
}

const LEVEL_LABELS = {
  basic: "Alap szintű funkció",
  advanced: "Haladó szintű funkció",
  premium: "Prémium funkció",
};

const CARD_STYLE = {
  basic: `${styles.card} ${styles.basic}`,
  advanced: `${styles.card} ${styles.advanced}`,
  premium: `${styles.card} ${styles.premium}`,
};

const FeatureCard: React.FC<FunctionInfo> = ({
  Icon,
  name,
  level,
  description,
  tip,
}) => {
  return (
    <div className={CARD_STYLE[level]}>
      <div className={styles.infoWrap}>
        <Icon
          className={styles.icon}
          style={{ color: "var(--card-bg)", fill: "var(--card-bg)" }}
        />
        <div className={styles.textWrap}>
          <h3 className={styles.name}>{name}</h3>
          <div className={styles.level}>{LEVEL_LABELS[level]}</div>
        </div>
      </div>
      <div className={styles.descWrap}>
        <p className={styles.description}>{description}</p>
        <p className={styles.tip}>
          <strong>Indítási tipp:</strong> {tip}
        </p>
      </div>
    </div>
  );
};

export default FeatureCard;