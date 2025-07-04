import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './BackToLogsButton.module.css';

export default function BackToLogsButton() {
  return (
    <Link href="/select-profile" className={styles.link}>
      <ArrowLeft size={24} />
      <span>Vissza a naplókhoz</span>
    </Link>
  );
}