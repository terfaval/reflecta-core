// components/PreferencesPanel.tsx
import React from 'react';
import React, { useState, useRef, useEffect } from 'react';
import type { UserPreferences } from '@/lib/types';

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
    const mapped =
      value === 2
        ? undefined
        : key === 'answer_length'
        ? value < 2
          ? 'short'
          : 'long'
        : key === 'style_mode'
        ? value < 2
          ? 'simple'
          : 'symbolic'
        : key === 'guidance_mode'
        ? value < 2
          ? 'free'
          : 'guided'
        : undefined;
    setPreferences({ ...preferences, [key]: mapped });
  };

  const getSliderValue = (key: keyof UserPreferences) => {
    const val = preferences[key];
    if (key === 'answer_length') return val === 'short' ? 0 : val === 'long' ? 4 : 2;
    if (key === 'style_mode') return val === 'simple' ? 0 : val === 'symbolic' ? 4 : 2;
    if (key === 'guidance_mode') return val === 'free' ? 0 : val === 'guided' ? 4 : 2;
    return 2;
  };

  const toneOptions: { key: string; icon: JSX.Element; value: UserPreferences['tone_preference'] }[] = [
    {
      key: 'supportive',
      icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42
            4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09
            3.81 14.76 3 16.5 3 19.58 3 22 5.42 22
            8.5c0 3.78-3.4 6.86-8.55
            11.54L12 21.35z" />
        </svg>
      ),
      value: 'supportive',
    },
    {
      key: 'confronting',
      icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2l-1 7h2l-1-7zm1.31 9l5.3
            5.29a1 1 0 0 1-1.42 1.42L13 12.41l-5.18
            5.3a1 1 0 1 1-1.42-1.42l5.3-5.29-5.3-5.3a1 1 0 1
            1 1.42-1.42L13 9.59l5.18-5.3a1 1 0 1 1
            1.42 1.42L14.41 11z" />
        </svg>
      ),
      value: 'confronting',
    },
    {
      key: 'soothing',
      icon: (
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM10
            17.5l-4.5-4.5 1.4-1.4L10 14.7l7.1-7.1
            1.4 1.4L10 17.5z" />
        </svg>
      ),
      value: 'soothing',
    },
  ];

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-20 left-4 bg-white rounded-xl shadow-xl px-5 py-4 z-50 w-[280px]"
      style={{
        border: `1px solid ${styleVars['--user-color']}`,
        color: styleVars['--user-color'],
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold text-sm">Válasz finomhangolása</span>
        <button
          onClick={onClose}
          className="text-sm rounded hover:opacity-70"
          style={{ background: 'transparent', color: styleVars['--user-color'] }}
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Válasz hossza', key: 'answer_length', min: 'Rövidebb', max: 'Hosszabb' },
          { label: 'Nyelvi stílus', key: 'style_mode', min: 'Egyszerűbb', max: 'Szimbolikusabb' },
          { label: 'Vezetés', key: 'guidance_mode', min: 'Szabadabb', max: 'Irányítottabb' },
        ].map(({ label, key, min, max }) => (
          <div key={key} className="text-xs">
            <div className="mb-1 font-medium text-[13px]">{label}</div>
            <div className="flex justify-between mb-1">
              <span>{min}</span>
              <span>{max}</span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={getSliderValue(key as keyof UserPreferences)}
              onChange={(e) => updateSlider(key as keyof UserPreferences, Number(e.target.value))}
              className="w-full accent-[var(--user-color)]"
            />
          </div>
        ))}

        <div className="flex gap-2 items-center justify-start pt-1">
          {toneOptions.map((opt) => {
            const isActive = preferences.tone_preference === opt.value;
            return (
              <button
                key={opt.key}
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    tone_preference: isActive ? undefined : opt.value,
                  })
                }
                className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-all
                  ${isActive ? 'bg-[var(--user-color)] text-[var(--bg-color)]' : 'bg-transparent text-[var(--user-color)] hover:bg-[var(--user-color)] hover:text-[var(--bg-color)]'}`}
              >
                {opt.icon}
                {isActive && <span className="text-xs">{opt.key}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={() => setPreferences({})}
            className="text-xs underline hover:opacity-80"
            style={{ color: styleVars['--user-color'] }}
          >
            Beállítások visszaállítása
          </button>
        </div>
      </div>
    </div>
  );
}
