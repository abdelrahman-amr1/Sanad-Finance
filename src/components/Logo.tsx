import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  dark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, dark = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} dir="rtl">
      {/* Emblem Graphic: Egyptian Flag Styled Shield */}
      <div className="relative flex-shrink-0 w-12 h-12 drop-shadow-md">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shield Outline with Golden/Bronze Border */}
          <path 
            d="M50 5C75 5 88 15 90 45C90 70 70 88 50 95C30 88 10 70 10 45C12 15 25 5 50 5Z" 
            fill="url(#shieldBg)" 
            stroke="#C5A880" 
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          
          {/* Egyptian Flag Horizontal Bands (Masked inside the shield) */}
          <g mask="url(#shieldMask)">
            {/* Top Red Band */}
            <path d="M0 0 H100 V35 H0 Z" fill="#CE1126" />
            {/* Middle White Band */}
            <path d="M0 35 H100 V65 H0 Z" fill="#FFFFFF" />
            {/* Bottom Black Band */}
            <path d="M0 65 H100 V100 H0 Z" fill="#000000" />
            
            {/* Golden Eagle of Saladin in the Middle White Band */}
            {/* Detailed Eagle path scaled to fit the center */}
            <path 
              d="M50 38 C49.5 38 49 39 48.5 40 L47.5 42 L48 44 L47 47 L48 49 L49 48.5 L50 51 L51 48.5 L52 49 L53 47 L52 44 L52.5 42 L51.5 40 C51 39 50.5 38 50 38 Z"
              fill="#C0930C"
            />
            {/* Left Wing */}
            <path 
              d="M48 40 C43 41 40 43 38 48 C37.5 49.5 38 51 40 51.5 C42 52 44 49 47 47 L48.2 43 Z"
              fill="#C0930C"
            />
            {/* Right Wing */}
            <path 
              d="M52 40 C57 41 60 43 62 48 C62.5 49.5 62 51 60 51.5 C58 52 56 49 53 47 L51.8 43 Z"
              fill="#C0930C"
            />
            {/* Eagle Shield Emblem & Feet */}
            <path 
              d="M47.5 47 H52.5 L52 56 L50 58 L48 56 Z" 
              fill="#C0930C" 
              stroke="#FFFFFF" 
              strokeWidth="0.5" 
            />
            <path 
              d="M45 57 H55 V59 H45 Z" 
              fill="#C0930C" 
            />
          </g>
          
          {/* Inner Decorative Golden Shield Ring */}
          <path 
            d="M50 10 C70 10 80 18 82 43C82 64 66 79 50 85C34 79 18 64 18 43C20 18 30 10 50 10Z" 
            stroke="#C5A880" 
            strokeWidth="1.2"
            strokeDasharray="3 2"
            fill="none"
          />

          {/* Definitions */}
          <defs>
            {/* Mask to keep colors inside the shield */}
            <mask id="shieldMask">
              <path d="M50 5C75 5 88 15 90 45C90 70 70 88 50 95C30 88 10 70 10 45C12 15 25 5 50 5Z" fill="#FFFFFF" />
            </mask>
            <radialGradient id="shieldBg" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </radialGradient>
          </defs>
        </svg>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-brand-gold/10 blur-md -z-10 animate-pulse" />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`text-lg font-black tracking-wide ${dark ? 'text-white' : 'text-slate-900'}`}>
            سَنَد
          </span>
          <span className={`text-[10px] font-bold tracking-wider flex items-center gap-1 ${dark ? 'text-brand-gold' : 'text-slate-600'}`}>
            <span className="inline-block w-1 h-1 rounded-full bg-egypt-red" />
            للمحاسبة والاستشارات
            <span className="inline-block w-1 h-1 rounded-full bg-egypt-black" />
          </span>
        </div>
      )}
    </div>
  );
};
