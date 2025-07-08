import React from 'react';
import FeatureCard, { FunctionInfo } from './FeatureCard';
import styles from './FeatureGrid.module.css';

interface FeatureGridProps {
  functions: FunctionInfo[];
}

export default function FeatureGrid({ functions }: FeatureGridProps) {
  return (
    <div className={styles.grid}>
      {functions.map((f) => (
        <FeatureCard key={f.name} {...f} />
      ))}
    </div>
  );
}