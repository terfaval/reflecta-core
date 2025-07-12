import React from 'react';
import styles from './ProfileSwitchSuggestion.module.css';

interface ProfileSwitchSuggestionProps {
  profileName: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ProfileSwitchSuggestion({
  profileName,
  onAccept,
  onDecline,
}: ProfileSwitchSuggestionProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>
        Ebben témában {profileName} lehet, hogy jobban tudna támogatni. Átváltasz rá?
      </p>
      <div className={styles.buttons}>
        <button className={styles.accept} onClick={onAccept}>
          Igen
        </button>
        <button className={styles.decline} onClick={onDecline}>
          Nem
        </button>
      </div>
    </div>
  );
}