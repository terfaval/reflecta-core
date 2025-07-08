import React from 'react';
import styles from './FeatureTable.module.css';

interface AccessRow {
  name: string;
  basic: boolean;
  premium: boolean;
}

interface FeatureTableProps {
  access: AccessRow[];
}

export default function FeatureTable({ access }: FeatureTableProps) {
  return (
    <table className={styles.accessTable}>
      <thead>
        <tr>
          <th>Funkció</th>
          <th className={styles.levelCol}>Alap</th>
          <th className={styles.levelCol}>Prémium</th>
        </tr>
      </thead>
      <tbody>
        {access.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td className={`${styles.levelCol} text-center`}>
              {row.basic ? <span className={styles.check}>✓</span> : ''}
            </td>
            <td className={`${styles.levelCol} text-center`}>
              {row.premium ? <span className={styles.check}>✓</span> : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}