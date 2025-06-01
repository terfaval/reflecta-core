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
  const isLeft = value === 'left';
  const isRight = value === 'right';
  const isNeutral = value === null;

  const handleToggle = (side: 'left' | 'right') => {
    onChange(value === side ? null : side);
  };

  return (
    <div
      className="relative flex items-center justify-between w-[96px] h-[36px] px-1 py-1 rounded-full"
      style={{
        backgroundColor: value ? styleVars['--user-color'] : styleVars['--ai-color'],
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* DOT */}
      <div
        className="absolute top-1 left-1 w-6 h-6 rounded-full z-0 transition-all duration-300"
        style={{
          backgroundColor: styleVars['--bg-color'],
          transform: isLeft
            ? 'translateX(0)' // left side
            : isRight
            ? 'translateX(60px)' // right side
            : 'translateX(30px)', // center
        }}
      />

      {/* LEFT ICON */}
      <button
        onClick={() => handleToggle('left')}
        className="relative z-10 flex flex-col items-center justify-center w-6 h-6 cursor-pointer"
        style={{ color: styleVars['--user-color'], background: 'transparent' }}
      >
        {leftIcon}
        {isLeft && (
          <span
            className="absolute top-[36px] text-[10px] font-medium"
            style={{ color: styleVars['--bg-color'] }}
          >
            {leftLabel}
          </span>
        )}
      </button>

      {/* RIGHT ICON */}
      <button
        onClick={() => handleToggle('right')}
        className="relative z-10 flex flex-col items-center justify-center w-6 h-6 cursor-pointer"
        style={{ color: styleVars['--user-color'], background: 'transparent' }}
      >
        {rightIcon}
        {isRight && (
          <span
            className="absolute top-[36px] text-[10px] font-medium"
            style={{ color: styleVars['--bg-color'] }}
          >
            {rightLabel}
          </span>
        )}
      </button>
    </div>
  );
}
