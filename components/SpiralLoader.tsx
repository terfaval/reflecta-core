import React from 'react';
import './SpiralLoader.css';

interface SpiralLoaderProps {
  userColor: string;
  aiColor: string;
}

const SpiralLoader: React.FC<SpiralLoaderProps> = ({ userColor, aiColor }) => (
  <div className="spiral-loader">
    <svg viewBox="0 0 100 100" className="spiral-svg" aria-label="Töltés…">
      {/* Háttérkör – AI színnel */}
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke={aiColor}
        strokeWidth="4"
      />
      {/* Előtér-spirál – USER színnel */}
      <path
        d="M50,50 m0,-40 a40,40 0 1,1 -0.01,0"
        fill="none"
        stroke={userColor}
        strokeWidth="4"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="1.2s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  </div>
);

export default SpiralLoader;
