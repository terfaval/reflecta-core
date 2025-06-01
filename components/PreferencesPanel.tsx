// components/PreferencesPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { UserPreferences } from '@/lib/types';
import type { JSX } from 'react';
import styles from './PreferencesPanel.module.css';

interface PreferencesPanelProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  styleVars: Record<string, string>;
  userId: string;
}

export function PreferencesPanel({
  open,
  onClose,
  preferences,
  setPreferences,
  styleVars,
  userId
}: PreferencesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const updateSlider = (key: keyof UserPreferences, value: number) => {
    const mapped = value === 2 ? undefined :
      key === 'answer_length' ? (value < 2 ? 'short' : 'long') :
      key === 'style_mode' ? (value < 2 ? 'simple' : 'symbolic') :
      key === 'guidance_mode' ? (value < 2 ? 'free' : 'guided') : undefined;
    setPreferences({ ...preferences, [key]: mapped });
  };

  const getSliderValue = (key: keyof UserPreferences) => {
    const val = preferences[key];
    if (key === 'answer_length') return val === 'short' ? 0 : val === 'long' ? 4 : 2;
    if (key === 'style_mode') return val === 'simple' ? 0 : val === 'symbolic' ? 4 : 2;
    if (key === 'guidance_mode') return val === 'free' ? 0 : val === 'guided' ? 4 : 2;
    return 2;
  };

  const toneOptions: { key: string; label: string; value: UserPreferences['tone_preference']; icon: React.ReactElement }[] = [
    {
      key: 'supportive',
      label: 'Támogató',
      value: 'supportive',
      icon: <span className={styles['tone-icon']}>❤️</span>
    },
    {
      key: 'confronting',
      label: 'Konfrontáló',
      value: 'confronting',
      icon: <span className={styles['tone-icon']}>⚡</span>
    },
    {
      key: 'soothing',
      label: 'Csendesítő',
      value: 'soothing',
      icon: <span className={styles['tone-icon']}>🌸</span>
    },
  ];

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={styles['preferencesPanel']}
      style={{ borderColor: styleVars['--user-color'], color: styleVars['--user-color'] }}
    >
      <div className={styles['panelHeader']}>
        <span className={styles['panelTitle']}>Válasz finomhangolása</span>
        <button
          className={styles['closeButton']}
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <div className={styles['panelBody']}>
        <div className={styles['sliderGroup']}>
          <label className={styles['sliderLabel']}>Válasz hossza</label>
          <div className={styles['sliderRange']}>
            <span>Rövidebb</span>
            <span>Hosszabb</span>
          </div>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={getSliderValue('answer_length')}
            onChange={(e) => updateSlider('answer_length', Number(e.target.value))}
            className={styles['slider']}
          />
        </div>

        <div className={styles['sliderGroup']}>
          <label className={styles['sliderLabel']}>Nyelvi stílus</label>
          <div className={styles['sliderRange']}>
            <span>Egyszerűbb</span>
            <span>Szimbolikusabb</span>
          </div>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={getSliderValue('style_mode')}
            onChange={(e) => updateSlider('style_mode', Number(e.target.value))}
            className={styles['slider']}
          />
        </div>

        <div className={styles['sliderGroup']}>
          <label className={styles['sliderLabel']}>Vezetés</label>
          <div className={styles['sliderRange']}>
            <span>Szabadabb</span>
            <span>Irányítottabb</span>
          </div>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={getSliderValue('guidance_mode')}
            onChange={(e) => updateSlider('guidance_mode', Number(e.target.value))}
            className={styles['slider']}
          />
        </div>

        <div className={styles['toneButtons']}>
          {toneOptions.map((opt) => {
            const isActive = preferences.tone_preference === opt.value;
            return (
              <button
                key={opt.key}
                onClick={() => setPreferences({ ...preferences, tone_preference: isActive ? undefined : opt.value })}
                className={`${styles['toneButton']} ${isActive ? styles['toneActive'] : ''}`}
                title={opt.label}
              >
                {opt.icon}
                {isActive && <span className={styles['toneLabel']}>{opt.label}</span>}
              </button>
            );
          })}
        </div>

        <div className={styles['resetRow']}>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/preferences/reset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: userId }),
                });
                if (res.ok) {
                  setPreferences({});
                } else {
                  console.error('[Reset] Hiba a válaszban:', await res.json());
                }
              } catch (err) {
                console.error('[Reset] Kivétel:', err);
              }
            }}
            className={styles['resetButton']}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 1 2.13 3.13" />
            </svg>
            Visszaállítás
          </button>
        </div>
      </div>
    </div>
  );
}
