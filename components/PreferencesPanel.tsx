import React, { useRef, useEffect, useState } from 'react';
import type { UserPreferences } from '@/lib/types';
import styles from './PreferencesPanel.module.css';
import { saveUserPreferences } from '@/lib/saveUserPreferences';
import { useUserContext } from '@/contexts/UserContext';

interface PreferencesPanelProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  styleVars: Record<string, string>;
}

export function PreferencesPanel({
  open,
  onClose,
  preferences,
  setPreferences,
  styleVars,
}: PreferencesPanelProps) {
  const { userId } = useUserContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const sliderRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [sliderWidth, setSliderWidth] = useState<Record<string, number>>({});
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);
  const hasInteracted = useRef(false);
  const [fetchedOnce, setFetchedOnce] = useState(false);


  const huLabelMap: Record<string, string> = {
    'very short': 'rövidebb',
    'short': 'rövid',
    'medium': 'közepes',
    'long': 'hosszú',
    'very long': 'hosszabb',
    'minimal': 'minimál',
    'simple': 'egyszerű',
    'symbolic': 'szimbolikus',
    'mythic': 'mitikus',
    'open': 'nyitott',
    'free': 'szabad',
    'guided': 'vezetett',
    'directed': 'irányított',
    undefined: 'alap',
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  useEffect(() => {
  const fetchPreferences = async () => {
    if (!userId || fetchedOnce) return;
    try {
      const res = await fetch(`/api/preferences/get?user_id=${userId}`);
      const data = await res.json();
      if (!hasInteracted.current && data) {
        setPreferences(data);
        setLocalPrefs(data);
      }
      setFetchedOnce(true);
    } catch (err) {
      console.error('[fetchPreferences] Hiba:', err);
    }
  };
  if (open) fetchPreferences();
}, [open, userId, fetchedOnce, setPreferences]);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  useEffect(() => {
    const widths: Record<string, number> = {};
    Object.entries(sliderRefs.current).forEach(([key, el]) => {
      if (el) widths[key] = el.offsetWidth;
    });
    setSliderWidth(widths);
  }, [open]);

  const mapSliderValue = (key: keyof UserPreferences, value: number): UserPreferences[typeof key] | undefined => {
    const map = {
      answer_length: ['very short', 'short', undefined, 'long', 'very long'],
      style_mode: ['minimal', 'simple', undefined, 'symbolic', 'mythic'],
      guidance_mode: ['open', 'free', undefined, 'guided', 'directed'],
    }[key];
    return map?.[value] as any;
  };

  const getSliderValue = (key: keyof UserPreferences, prefs: UserPreferences) => {
    const val = prefs[key];
    const options = {
      answer_length: ['very short', 'short', undefined, 'long', 'very long'],
      style_mode: ['minimal', 'simple', undefined, 'symbolic', 'mythic'],
      guidance_mode: ['open', 'free', undefined, 'guided', 'directed'],
    }[key];
    return options?.findIndex((o) => o === val) ?? 2;
  };

  const updateSlider = async (key: keyof UserPreferences, value: number) => {
    hasInteracted.current = true;
    const mapped = mapSliderValue(key, value);
    if (localPrefs[key] === mapped) return;
    const updated = { ...localPrefs, [key]: mapped };
    setPreferences(updated);
    setLocalPrefs(updated);
    await saveUserPreferences(userId, updated);
  };

  const handleToneClick = async (tone: 'supportive' | 'confronting' | 'soothing') => {
    hasInteracted.current = true;
    const updatedTone = localPrefs.tone_preference === tone ? undefined : tone;
    if (localPrefs.tone_preference === updatedTone) return;
    const updated = { ...localPrefs, tone_preference: updatedTone };
    setPreferences(updated);
    setLocalPrefs(updated);
    await saveUserPreferences(userId, updated);
  };

  const handleReset = async () => {
    hasInteracted.current = true;
    const defaultPrefs: UserPreferences = {
      answer_length: undefined,
      style_mode: undefined,
      guidance_mode: undefined,
      tone_preference: undefined,
    };
    setPreferences(defaultPrefs);
    setLocalPrefs(defaultPrefs);
    await saveUserPreferences(userId, defaultPrefs);

    try {
      const res = await fetch('/api/preferences/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        console.error('[Reset] Hiba a válaszban:', await res.json());
      }
    } catch (err) {
      console.error('[Reset] Kivétel:', err);
    }
  };

  const toneOptions = [
    {
      key: 'supportive',
      label: 'Támogató',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      key: 'confronting',
      label: 'Konfrontáló',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M13 2l8 11h-6l2 9-8-11h6l-2-9z" />
        </svg>
      ),
    },
    {
      key: 'soothing',
      label: 'Csendesítő',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />
          <path d="M12 7.5V9" /><path d="M7.5 12H9" /><path d="M16.5 12H15" /><path d="M12 16.5V15" />
          <path d="m8 8 1.88 1.88" /><path d="M14.12 9.88 16 8" /><path d="m8 16 1.88-1.88" /><path d="M14.12 14.12 16 16" />
        </svg>
      ),
    },
  ];

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={styles.preferencesPanel}
      style={{ borderColor: styleVars['--user-color'], color: styleVars['--user-color'] }}
    >
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Válasz finomhangolása</span>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div className={styles.panelBody}>
        {[{ key: 'answer_length', label: 'Válasz hossza' }, { key: 'style_mode', label: 'Nyelvi stílus' }, { key: 'guidance_mode', label: 'Vezetés' }].map(({ key, label }) => (
          <div key={key} className={styles.sliderGroup}>
            <label className={styles.sliderLabel}>{label}</label>
            <div className={styles.sliderRow}>
              <div className={styles.sliderTrackWrapper}>
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={1}
                  value={getSliderValue(key as keyof UserPreferences, localPrefs)}
                  onChange={(e) => updateSlider(key as keyof UserPreferences, Number(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderTicks}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} data-pos={i} />
                  ))}
                </div>
              </div>
              <div className={styles.sliderValueWrapper}>
                <span className={styles.sliderValue}>
                  {huLabelMap[localPrefs[key as keyof UserPreferences] as string] ?? 'alap'}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className={styles.toneButtons}>
          {toneOptions.map((opt) => {
            const isActive = localPrefs.tone_preference === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleToneClick(opt.key as any)}
                className={`${styles.toneButton} ${isActive ? styles.toneActive : ''}`}
                title={opt.label}
                aria-label={opt.label}
              >
                {opt.icon}
                <span className={styles.toneLabel}>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.resetRow}>
          <button onClick={handleReset} className={styles.resetButton}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
