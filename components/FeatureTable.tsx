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
          <th>Alap</th>
          <th>Prémium</th>
        </tr>
      </thead>
      <tbody>
        {access.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td className="text-center">
              {row.basic ? <span className={styles.check}>✓</span> : ''}
            </td>
            <td className="text-center">
              {row.premium ? <span className={styles.check}>✓</span> : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}