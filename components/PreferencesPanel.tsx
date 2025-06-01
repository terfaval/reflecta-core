// components/PreferencesPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { UserPreferences } from '@/lib/types';

interface PreferencesPanelProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  styleVars: Record<string, string>;
  userId: string; // ← új mező
}


export function PreferencesPanel({
  open,
  onClose,
  preferences,
  setPreferences,
  styleVars
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

  const toneOptions = [
    {
      key: 'supportive',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11 3 12 4 12 4C12 4 13 3 14.5 3C17.5 3 20 5.5 20 8.5C20 13.5 12 21 12 21Z" />
        </svg>
      ),
      value: 'supportive'
    },
    {
      key: 'confronting',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2l.018.001.016.001.083.005.011.002h.011l.038.009.052.008.016.006.011.001.029.011.052.014.019.009.015.004.028.014.04.017.021.012.022.01.023.015.031.017.034.024.018.011.013.012.024.017.038.034.022.017.008.01.014.012.036.041.026.027.006.009c.12.147.196.322.218.513l.001.012.002.041.004.064v6h5a1 1 0 0 1 .868 1.497l-.06.091-8 11c-.568.783-1.808.38-1.808-.588v-6h-5a1 1 0 0 1-.868-1.497l.06-.091 8-11 .01-.013.018-.024.033-.038.018-.022.009-.008.013-.014.04-.036.028-.026.008-.006a1 1 0 0 1 .402-.199l.011-.001.027-.005.074-.013.011-.001.041-.002z" />
        </svg>
      ),
      value: 'confronting'
    },
    {
      key: 'soothing',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />
          <path d="M12 7.5V9" /><path d="M7.5 12H9" /><path d="M16.5 12H15" /><path d="M12 16.5V15" />
          <path d="m8 8 1.88 1.88" /><path d="M14.12 9.88 16 8" /><path d="m8 16 1.88-1.88" /><path d="M14.12 14.12 16 16" />
        </svg>
      ),
      value: 'soothing'
    }
  ];

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bottom-[100px] left-[20px] bg-white rounded-lg shadow-xl p-4 z-[999] w-[280px]"
      style={{ border: `1px solid ${styleVars['--user-color']}`, color: styleVars['--user-color'] }}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-sm">Válasz finomhangolása</span>
        <button
          className="text-sm px-2 py-0.5 rounded"
          onClick={onClose}
          style={{ background: 'transparent', color: styleVars['--user-color'] }}
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {['answer_length', 'style_mode', 'guidance_mode'].map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium">
              {key === 'answer_length' ? 'Válasz hossza' : key === 'style_mode' ? 'Nyelvi stílus' : 'Vezetés'}
            </label>
            <div className="flex items-center justify-between text-xs text-[var(--user-color)]">
              <span>{key === 'answer_length' ? 'Rövidebb' : key === 'style_mode' ? 'Egyszerűbb' : 'Szabadabb'}</span>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={getSliderValue(key as keyof UserPreferences)}
                onChange={(e) => updateSlider(key as keyof UserPreferences, Number(e.target.value))}
                className="mx-2 w-full accent-[var(--user-color)]"
              />
              <span>{key === 'answer_length' ? 'Hosszabb' : key === 'style_mode' ? 'Szimbolikusabb' : 'Vezetettebb'}</span>
            </div>
          </div>
        ))}

        <div className="flex gap-2 items-center justify-start pt-2">
          {toneOptions.map((opt) => {
            const isActive = preferences.tone_preference === opt.value;
            return (
              <button
                key={opt.key}
                onClick={() => setPreferences({ ...preferences, tone_preference: isActive ? undefined : opt.value })}
                className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-all ${isActive ? 'bg-[var(--user-color)] text-[var(--bg-color)]' : 'bg-transparent text-[var(--user-color)]'}`}
              >
                {opt.icon}
                {isActive && <span className="text-xs capitalize">{opt.key}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-3">
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
    className="text-xs underline flex items-center gap-1"
    style={{ color: styleVars['--user-color'] }}
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
    Alaphelyzet
  </button>
</div>

      </div>
    </div>
  );
}
