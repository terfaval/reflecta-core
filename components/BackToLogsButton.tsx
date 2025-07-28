import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useUserContext } from '@/contexts/UserContext';
import styles from './BackToLogsButton.module.css';

export default function BackToLogsButton() {
  const { userRole } = useUserContext();
  const href = userRole === 'guest' ? '/guest-chat' : '/chat';

  return (
    <Link href={href} className={styles.link}>
      <ArrowLeft size={24} />
      <span>Vissza a naplókhoz</span>
    </Link>
  );
}