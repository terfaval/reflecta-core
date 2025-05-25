import React from 'react';
import './SpiralLoader.css';

const SpiralLoader = () => (
  <div className="spiral-loader">
    <svg viewBox="0 0 100 100" className="spiral-svg" aria-label="Töltés…">
      <path
        d="M50,50 m0,-40 a40,40 0 1,1 -0.01,0"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 50 50"
          to="360 50 50"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  </div>
);

export default SpiralLoader;
