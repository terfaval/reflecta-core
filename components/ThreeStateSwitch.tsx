// components/ThreeStateSwitch.tsx
import React from 'react';

interface ThreeStateSwitchProps {
  value: 'left' | 'right' | null;
  onChange: (val: 'left' | 'right' | null) => void;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  leftLabel: string;
  rightLabel: string;
  styleVars: Record<string, string>; // expects --bg-color, --ai-color, --user-color
}

export function ThreeStateSwitch({
  value,
  onChange,
  leftIcon,
  rightIcon,
  leftLabel,
  rightLabel,
  styleVars
}: ThreeStateSwitchProps) {
  const active = value !== null;
  const isLeft = value === 'left';
  const isRight = value === 'right';

  return (
    <div
      className="three-state-toggle flex items-center rounded-full px-1 py-1 gap-1"
      style={{
        backgroundColor: active ? styleVars['--user-color'] : styleVars['--ai-color'],
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* LEFT ICON */}
      <div
        onClick={() => onChange(isLeft ? null : 'left')}
        className="cursor-pointer relative flex items-center justify-center"
        style={{ color: styleVars['--user-color'] }}
      >
        {leftIcon}
        {isLeft && (
          <div className="absolute -bottom-5 text-xs rounded px-2 py-0.5"
            style={{ color: styleVars['--bg-color'] }}
          >{leftLabel}</div>
        )}
      </div>

      {/* TOGGLE DOT */}
      <div
        className="rounded-full transition-all duration-300"
        style={{
          backgroundColor: styleVars['--bg-color'],
          width: 22,
          height: 22,
          transform: isLeft ? 'translateX(-1.5rem)' : isRight ? 'translateX(1.5rem)' : 'translateX(0)',
        }}
      />

      {/* RIGHT ICON */}
      <div
        onClick={() => onChange(isRight ? null : 'right')}
        className="cursor-pointer relative flex items-center justify-center"
        style={{ color: styleVars['--user-color'] }}
      >
        {rightIcon}
        {isRight && (
          <div className="absolute -bottom-5 text-xs rounded px-2 py-0.5"
            style={{ color: styleVars['--bg-color'] }}
          >{rightLabel}</div>
        )}
      </div>
    </div>
  );
}
