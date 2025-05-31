// components/PreferenceToggleGroup.tsx
import React from 'react';

interface Option<T extends string> {
  label: string;
  value?: T;
}

interface PreferenceToggleGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  value?: T;
  onChange: (newValue?: T) => void;
}

export function PreferenceToggleGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: PreferenceToggleGroupProps<T>) {
  return (
    <div className="flex flex-col items-start gap-1 min-w-[140px]">
      <span className="text-xs text-muted-foreground font-medium mb-1" title={`Beállítás: ${label}`}>
        {label}
      </span>
      <div className="flex gap-1">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(isActive ? undefined : opt.value)}
              className={`px-2 py-1 text-xs rounded border transition-colors
                ${isActive
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30'}
              `}
              title={
                opt.label === 'Alap'
                  ? `${label} alapértelmezés visszaállítása`
                  : `${label} beállítása: ${opt.label}`
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
