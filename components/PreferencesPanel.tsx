// components/PreferencesPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { UserPreferences } from '@/lib/types';

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

  const toneOptions: { key: string; label: string; value: UserPreferences['tone_preference']; icon: JSX.Element }[] = [
    {
      key: 'supportive',
      label: 'Támogató',
      value: 'supportive',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )
    },
    {
      key: 'confronting',
      label: 'Konfrontáló',
      value: 'confronting',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 2l8 11h-6l2 9-8-11h6l-2-9z" />
        </svg>
      )
    },
    {
      key: 'soothing',
      label: 'Csendesítő',
      value: 'soothing',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />
          <path d="M12 7.5V9" /><path d="M7.5 12H9" /><path d="M16.5 12H15" /><path d="M12 16.5V15" />
          <path d="m8 8 1.88 1.88" /><path d="M14.12 9.88 16 8" /><path d="m8 16 1.88-1.88" /><path d="M14.12 14.12 16 16" />
        </svg>
      )
    },
  ];

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="preferences-panel-container fixed bottom-24 left-4 bg-white rounded-xl shadow-2xl p-4 z-[1000] w-[280px] border"
      style={{ borderColor: styleVars['--user-color'], color: styleVars['--user-color'] }}
    >
      <div className="preferences-panel-header flex justify-between items-center mb-3">
        <span className="font-semibold text-sm">Válasz finomhangolása</span>
        <button
          className="preferences-close-button text-sm px-2 py-0.5 rounded"
          onClick={onClose}
          style={{ background: 'transparent', color: styleVars['--user-color'] }}
        >
          ✕
        </button>
      </div>

      <div className="preferences-body space-y-5">
        <div className="slider-group">
          <label className="text-xs block mb-1">Válasz hossza</label>
          <div className="flex items-center justify-between text-[11px] mb-0.5 px-1">
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
            className="w-full accent-current"
          />
        </div>
        <div className="slider-group">
          <label className="text-xs block mb-1">Nyelvi stílus</label>
          <div className="flex items-center justify-between text-[11px] mb-0.5 px-1">
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
            className="w-full accent-current"
          />
        </div>
        <div className="slider-group">
          <label className="text-xs block mb-1">Vezetés</label>
          <div className="flex items-center justify-between text-[11px] mb-0.5 px-1">
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
            className="w-full accent-current"
          />
        </div>

        <div className="tone-buttons flex gap-2 items-center justify-start pt-2">
          {toneOptions.map((opt) => {
            const isActive = preferences.tone_preference === opt.value;
            return (
              <button
                key={opt.key}
                onClick={() =>
                  setPreferences({ ...preferences, tone_preference: isActive ? undefined : opt.value })
                }
                className={`tone-button px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-all ${
                  isActive ? 'bg-[var(--user-color)] text-[var(--bg-color)]' : 'bg-transparent'
                }`}
                title={opt.label}
              >
                {opt.icon}
                {isActive && <span className="text-xs">{opt.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="preferences-reset flex justify-end pt-3">
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
