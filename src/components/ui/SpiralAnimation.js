import React from 'react';

const SpiralAnimation = () => {
  return (
    <div className="spiral-animation-container">
      <svg
        className="spiral-svg"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="spiralGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#5B5FCF', stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 0.1 }} />
          </linearGradient>
          <linearGradient id="spiralGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#764ba2', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: '#5B5FCF', stopOpacity: 0.05 }} />
          </linearGradient>
        </defs>

        {/* Outer Spiral */}
        <path
          className="spiral-path spiral-path-1"
          d="M 500 500 
             Q 650 500 700 600
             T 700 800
             Q 700 900 600 950
             T 400 950
             Q 200 950 100 800
             T 100 500
             Q 100 200 300 100
             T 700 100
             Q 900 100 950 300"
          fill="none"
          stroke="url(#spiralGradient1)"
          strokeWidth="2"
        />

        {/* Middle Spiral */}
        <path
          className="spiral-path spiral-path-2"
          d="M 500 500 
             Q 600 500 650 550
             T 650 700
             Q 650 800 550 850
             T 350 850
             Q 200 850 150 700
             T 150 500
             Q 150 300 300 200
             T 650 200"
          fill="none"
          stroke="url(#spiralGradient2)"
          strokeWidth="1.5"
        />

        {/* Inner Spiral */}
        <path
          className="spiral-path spiral-path-3"
          d="M 500 500 
             Q 550 500 575 525
             T 575 600
             Q 575 650 525 675
             T 425 675
             Q 350 675 325 600
             T 325 500
             Q 325 400 400 350
             T 575 350"
          fill="none"
          stroke="url(#spiralGradient1)"
          strokeWidth="1"
        />

        {/* Center Dot */}
        <circle
          className="spiral-center"
          cx="500"
          cy="500"
          r="3"
          fill="#5B5FCF"
          opacity="0.5"
        />
      </svg>
    </div>
  );
};

export default SpiralAnimation;
