import React from 'react';

/**
 * Authentic Photographic Cochin Shipyard Vessel Background
 * Displays the real photographic vessel exactly as shown in screenshot 1791825269669.png
 * Feathered and blended with dark blue ocean aesthetic, ambient lighting, and mist.
 */
export const CslTugBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      
      {/* 1. Deep Oceanic Twilight Atmosphere Gradient */}
      <div className="absolute inset-0 bg-radial from-[#041d2e] via-[#03131f] to-[#010911]" />

      {/* 2. Soft Ambient Cyan/Teal Backlighting */}
      <div className="absolute top-10 right-0 w-[550px] h-[550px] bg-cyan-500/18 rounded-full blur-3xl transform translate-x-1/4" />
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl transform -translate-x-1/3" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl" />

      {/* 3. The Real Photographic Vessel (Matching Image 2 / 1791825269669.png) */}
      <div className="absolute right-0 top-10 sm:top-12 w-[85%] sm:w-[70%] max-w-[620px] h-[340px] sm:h-[400px] overflow-hidden">
        {/* Real photo with radial feather mask and twilight color grading */}
        <div
          className="relative w-full h-full"
          style={{
            maskImage: 'radial-gradient(ellipse 95% 85% at 78% 38%, black 45%, transparent 92%)',
            WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at 78% 38%, black 45%, transparent 92%)',
          }}
        >
          {/* Photographic Vessel Image */}
          <img
            src="/osv_ship.jpg"
            alt="Cochin Shipyard Offshore Vessel"
            className="w-full h-full object-cover object-[78%_40%] opacity-85 contrast-125 brightness-90 saturate-110"
            onError={(e) => {
              // Fallback to secondary vessel image if needed
              const target = e.target as HTMLImageElement;
              if (target.src.indexOf('kl_saltfjord') === -1) {
                target.src = '/kl_saltfjord.jpg';
              }
            }}
          />

          {/* Deep Navy Twilight Tonal Tint Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-[#020d18] via-[#04192b]/30 to-[#03111f]/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-linear-to-r from-[#020d18] via-transparent to-[#020d18]/50" />

          {/* Soft Bridge Navigation Glow Highlight */}
          <div className="absolute top-[28%] right-[32%] w-16 h-6 bg-cyan-400/30 rounded-full blur-md mix-blend-screen" />
          
          {/* Masthead Red Beacon Light */}
          <div className="absolute top-[12%] right-[38%] w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_#f43f5e] animate-pulse" />
        </div>
      </div>

      {/* 4. Distant Shipyard Cranes & Ocean Horizon Line */}
      <div className="absolute right-0 top-16 sm:top-20 w-[480px] pointer-events-none opacity-40">
        <svg viewBox="0 0 500 200" fill="none" className="w-full h-full">
          <line x1="10" y1="185" x2="490" y2="185" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
          <line x1="80" y1="195" x2="450" y2="195" stroke="#38bdf8" strokeWidth="0.5" opacity="0.4" strokeDasharray="6 4" />
        </svg>
      </div>

      {/* 5. Digital Wave Mesh & Glowing 4-Point Diamond Star (Bottom-Right, as in screenshot) */}
      <div className="absolute bottom-6 right-2 sm:right-6 w-56 h-56 pointer-events-none opacity-50">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="meshGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 10 190 Q 60 140 130 150 T 195 90" stroke="url(#meshGradient)" strokeWidth="0.9" fill="none" />
          <path d="M 25 195 Q 75 145 145 155 T 195 105" stroke="url(#meshGradient)" strokeWidth="0.9" fill="none" />
          <path d="M 40 200 Q 90 150 160 160 T 195 120" stroke="url(#meshGradient)" strokeWidth="0.9" fill="none" />
          <path d="M 55 205 Q 105 155 175 165 T 195 135" stroke="url(#meshGradient)" strokeWidth="0.9" fill="none" />
          <path d="M 70 210 Q 120 160 190 170 T 195 150" stroke="url(#meshGradient)" strokeWidth="0.9" fill="none" />

          {/* Luminous 4-Point Diamond Star */}
          <g transform="translate(145, 120)">
            <path
              d="M 0 -18 Q 1 -2 18 0 Q 1 2 0 18 Q -1 2 -18 0 Q -1 -2 0 -18 Z"
              fill="url(#meshGradient)"
              opacity="0.95"
            />
            <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
          </g>
        </svg>
      </div>

    </div>
  );
};
