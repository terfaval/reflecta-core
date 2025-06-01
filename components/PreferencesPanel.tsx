// components/PreferencesPanel.tsx
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

  const toneOptions: { key: string; icon: string; value: UserPreferences['tone_preference'] }[] = [
    { key: 'supportive', icon: '❤️', value: 'supportive' },
    { key: 'confronting', icon: '⚡', value: 'confronting' },
    { key: 'soothing', icon: '🌿', value: 'soothing' },
  ];

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-20 left-4 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[240px]"
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
        <div>
          <label className="text-xs">Válasz hossza</label>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={getSliderValue('answer_length')}
            onChange={(e) => updateSlider('answer_length', Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs">Nyelvi stílus</label>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={getSliderValue('style_mode')}
            onChange={(e) => updateSlider('style_mode', Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs">Vezetés</label>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={getSliderValue('guidance_mode')}
            onChange={(e) => updateSlider('guidance_mode', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2 items-center justify-start pt-2">
          {toneOptions.map((opt) => {
            const isActive = preferences.tone_preference === opt.value;
            return (
              <button
                key={opt.key}
                onClick={() => setPreferences({ ...preferences, tone_preference: isActive ? undefined : opt.value })}
                className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-all ${isActive ? 'bg-[var(--user-color)] text-white' : 'bg-transparent'}`}
              >
                <span>{opt.icon}</span>
                {isActive && <span className="text-xs">{opt.key}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={() => setPreferences({})}
            className="text-xs underline"
            style={{ color: styleVars['--user-color'] }}
          >
            Beállítások visszaállítása
          </button>
        </div>
      </div>
    </div>
  );
}
