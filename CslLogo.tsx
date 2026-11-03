import React from 'react';

interface CslLogoProps {
  size?: number;
  className?: string;
}

export const CslLogo: React.FC<CslLogoProps> = ({ size = 48, className = '' }) => {
  // Generate gear teeth positions around the upper circumference (approx 19 teeth)
  // Angular range: from 145 degrees to 395 degrees (skipping the bottom arc 40 to 140 deg for text)
  const totalTeeth = 18;
  const startAngle = 148;
  const endAngle = 392;
  const angleStep = (endAngle - startAngle) / (totalTeeth - 1);

  const teethAngles = Array.from({ length: totalTeeth }).map((_, i) => startAngle + i * angleStep);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Official MY CSL Emblem - Cochin Shipyard Limited"
    >
      <defs>
        {/* Arc path for Sanskrit Motto: कर्मयोगो विशिष्यते */}
        <path
          id="cslMottoArc"
          d="M 100 310 A 160 160 0 0 0 300 310"
          fill="none"
        />

        {/* Arc path for bottom title: MY CSL ✦ */}
        <path
          id="cslTitleArc"
          d="M 68 340 A 185 185 0 0 0 332 340"
          fill="none"
        />

        {/* Filter for crisp rendering */}
        <clipPath id="innerCircleClip">
          <circle cx="200" cy="200" r="162" />
        </clipPath>
      </defs>

      {/* Outer Black Canvas Circle */}
      <circle cx="200" cy="200" r="198" fill="#000000" />

      {/* Main Outer Blue Gear Ring & Bottom Arc Banner */}
      {/* 1. Base inner circular track of the gear */}
      <circle
        cx="200"
        cy="200"
        r="168"
        stroke="#1c92d2"
        strokeWidth="11"
        fill="none"
      />

      {/* 2. Rectangular gear teeth along upper and side rim */}
      {teethAngles.map((angle, idx) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 200 + 180 * Math.cos(rad);
        const cy = 200 + 180 * Math.sin(rad);
        const rot = angle + 90;
        return (
          <rect
            key={idx}
            x={cx - 10}
            y={cy - 12}
            width="20"
            height="24"
            fill="#1c92d2"
            transform={`rotate(${rot} ${cx} ${cy})`}
            rx="1.5"
          />
        );
      })}

      {/* Solid Black Inner Circular Field */}
      <circle cx="200" cy="200" r="162" fill="#000000" />

      {/* Content inside inner circle */}
      <g clipPath="url(#innerCircleClip)">
        {/* 1. RED SHIPYARD INDUSTRIAL BACKGROUND STRUCTURES */}
        <g stroke="#d9383a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Left: A-Frame Shipyard Slipway Derrick / Crane */}
          <line x1="86" y1="172" x2="128" y2="76" strokeWidth="3.6" />
          <line x1="172" y1="172" x2="128" y2="76" strokeWidth="3.6" />
          <line x1="128" y1="76" x2="128" y2="172" strokeWidth="2" strokeDasharray="3 3" />
          {/* Derrick crossbars */}
          <line x1="102" y1="135" x2="155" y2="135" strokeWidth="2.4" />
          <line x1="114" y1="108" x2="142" y2="108" strokeWidth="2.2" />
          <line x1="128" y1="76" x2="128" y2="60" strokeWidth="3" />

          {/* Center-Top: Heavy Level-Luffing Shipyard Jib Crane */}
          {/* Vertical lattice tower */}
          <line x1="214" y1="175" x2="216" y2="128" strokeWidth="3" />
          <line x1="233" y1="175" x2="231" y2="128" strokeWidth="3" />
          {/* Lattice cross struts */}
          <line x1="214" y1="172" x2="233" y2="156" strokeWidth="1.8" />
          <line x1="233" y1="172" x2="214" y2="156" strokeWidth="1.8" />
          <line x1="214" y1="156" x2="233" y2="140" strokeWidth="1.8" />
          <line x1="233" y1="156" x2="214" y2="140" strokeWidth="1.8" />
          <line x1="214" y1="140" x2="231" y2="128" strokeWidth="1.8" />
          <line x1="231" y1="140" x2="216" y2="128" strokeWidth="1.8" />
          {/* Crane machinery cabin */}
          <polygon points="210,128 248,128 248,114 210,114" fill="#a82325" stroke="#d9383a" strokeWidth="2" />
          {/* Crane horizontal luffing boom pointing left over ship */}
          <line x1="248" y1="118" x2="160" y2="105" strokeWidth="3.6" />
          <line x1="210" y1="128" x2="160" y2="105" strokeWidth="2.2" />
          {/* Hoist cable & hook hanging over ship */}
          <line x1="162" y1="105" x2="162" y2="122" strokeWidth="1.6" />
          <path d="M 160 122 C 160 127, 166 127, 164 122" strokeWidth="2.2" />

          {/* Right: Radar / Floodlight Lattice Tower */}
          <line x1="312" y1="185" x2="315" y2="114" strokeWidth="2.8" />
          <line x1="328" y1="185" x2="325" y2="114" strokeWidth="2.8" />
          {/* Internal diagonal lattice */}
          <line x1="312" y1="180" x2="328" y2="164" strokeWidth="1.6" />
          <line x1="328" y1="180" x2="312" y2="164" strokeWidth="1.6" />
          <line x1="312" y1="164" x2="328" y2="148" strokeWidth="1.6" />
          <line x1="328" y1="164" x2="312" y2="148" strokeWidth="1.6" />
          <line x1="312" y1="148" x2="325" y2="132" strokeWidth="1.6" />
          <line x1="325" y1="148" x2="315" y2="132" strokeWidth="1.6" />
          <line x1="315" y1="132" x2="325" y2="116" strokeWidth="1.6" />
          {/* Platform atop tower & beacon mast */}
          <line x1="308" y1="114" x2="332" y2="114" strokeWidth="3.2" />
          <polygon points="310,114 330,114 326,105 314,105" fill="#a82325" stroke="#d9383a" strokeWidth="1.8" />
          <line x1="320" y1="105" x2="320" y2="92" strokeWidth="3" />

          {/* Right Aft Deckhouse / Wheelhouse Structure */}
          <g>
            <rect x="272" y="172" width="38" height="15" fill="#000000" stroke="#d9383a" strokeWidth="1.8" />
            <line x1="272" y1="179" x2="310" y2="179" strokeWidth="1.2" />
            <line x1="281" y1="172" x2="281" y2="187" strokeWidth="1.2" />
            <line x1="291" y1="172" x2="291" y2="187" strokeWidth="1.2" />
            <line x1="301" y1="172" x2="301" y2="187" strokeWidth="1.2" />
            {/* Upper radar mast frame */}
            <line x1="281" y1="172" x2="281" y2="155" strokeWidth="2" />
            <line x1="297" y1="172" x2="297" y2="155" strokeWidth="2" />
            <line x1="281" y1="155" x2="297" y2="155" strokeWidth="2" />
          </g>

          {/* Horizontal Pier / Jetty Railing on Left and Right sides */}
          {/* Left pier railing */}
          <line x1="32" y1="185" x2="88" y2="185" strokeWidth="2.5" />
          <line x1="32" y1="197" x2="88" y2="197" strokeWidth="2.5" />
          <line x1="42" y1="185" x2="42" y2="197" strokeWidth="1.8" />
          <line x1="52" y1="185" x2="52" y2="197" strokeWidth="1.8" />
          <line x1="62" y1="185" x2="62" y2="197" strokeWidth="1.8" />
          <line x1="72" y1="185" x2="72" y2="197" strokeWidth="1.8" />
          <line x1="82" y1="185" x2="82" y2="197" strokeWidth="1.8" />

          {/* Right pier railing */}
          <line x1="310" y1="185" x2="368" y2="185" strokeWidth="2.5" />
          <line x1="310" y1="197" x2="368" y2="197" strokeWidth="2.5" />
          <line x1="320" y1="185" x2="320" y2="197" strokeWidth="1.8" />
          <line x1="330" y1="185" x2="330" y2="197" strokeWidth="1.8" />
          <line x1="340" y1="185" x2="340" y2="197" strokeWidth="1.8" />
          <line x1="350" y1="185" x2="350" y2="197" strokeWidth="1.8" />
          <line x1="360" y1="185" x2="360" y2="197" strokeWidth="1.8" />
        </g>

        {/* 2. BLUE OCEAN WATER RIPPLE DASHES */}
        <g stroke="#1c92d2" strokeWidth="2.2" strokeLinecap="round">
          {/* Row 1 (y=202) */}
          <line x1="55" y1="202" x2="70" y2="202" />
          <line x1="80" y1="202" x2="98" y2="202" />
          <line x1="305" y1="202" x2="318" y2="202" />
          <line x1="328" y1="202" x2="345" y2="202" />

          {/* Row 2 (y=210) */}
          <line x1="45" y1="210" x2="65" y2="210" />
          <line x1="75" y1="210" x2="95" y2="210" />
          <line x1="105" y1="210" x2="115" y2="210" />
          <line x1="298" y1="210" x2="310" y2="210" />
          <line x1="320" y1="210" x2="335" y2="210" />
          <line x1="342" y1="210" x2="355" y2="210" />

          {/* Row 3 (y=218) */}
          <line x1="50" y1="218" x2="72" y2="218" />
          <line x1="82" y1="218" x2="105" y2="218" />
          <line x1="115" y1="218" x2="130" y2="218" />
          <line x1="312" y1="218" x2="328" y2="218" />
          <line x1="335" y1="218" x2="352" y2="218" />

          {/* Row 4 (y=226) */}
          <line x1="60" y1="226" x2="80" y2="226" />
          <line x1="90" y1="226" x2="112" y2="226" />
          <line x1="120" y1="226" x2="138" y2="226" />
          <line x1="322" y1="226" x2="340" y2="226" />

          {/* Row 5 (y=234) */}
          <line x1="68" y1="234" x2="88" y2="234" />
          <line x1="98" y1="234" x2="120" y2="234" />
          <line x1="128" y1="234" x2="148" y2="234" />
          <line x1="315" y1="234" x2="330" y2="234" />

          {/* Row 6 (y=242) */}
          <line x1="75" y1="242" x2="95" y2="242" />
          <line x1="102" y1="242" x2="125" y2="242" />
          <line x1="132" y1="242" x2="152" y2="242" />
          <line x1="305" y1="242" x2="320" y2="242" />

          {/* Row 7 - Under hull keel (y=250) */}
          <line x1="82" y1="250" x2="105" y2="250" />
          <line x1="115" y1="250" x2="140" y2="250" />
          <line x1="150" y1="250" x2="175" y2="250" />
          <line x1="185" y1="250" x2="210" y2="250" />
          <line x1="220" y1="250" x2="245" y2="250" />
          <line x1="255" y1="250" x2="280" y2="250" />
          <line x1="290" y1="250" x2="315" y2="250" />

          {/* Row 8 (y=258) */}
          <line x1="88" y1="258" x2="115" y2="258" />
          <line x1="125" y1="258" x2="155" y2="258" />
          <line x1="165" y1="258" x2="195" y2="258" />
          <line x1="205" y1="258" x2="235" y2="258" />
          <line x1="245" y1="258" x2="275" y2="258" />
          <line x1="285" y1="258" x2="310" y2="258" />

          {/* Row 9 (y=266) */}
          <line x1="95" y1="266" x2="125" y2="266" />
          <line x1="135" y1="266" x2="165" y2="266" />
          <line x1="175" y1="266" x2="205" y2="266" />
          <line x1="215" y1="266" x2="245" y2="266" />
          <line x1="255" y1="266" x2="285" y2="266" />
          <line x1="295" y1="266" x2="315" y2="266" />

          {/* Row 10 (y=274) */}
          <line x1="102" y1="274" x2="135" y2="274" />
          <line x1="145" y1="274" x2="178" y2="274" />
          <line x1="188" y1="274" x2="220" y2="274" />
          <line x1="230" y1="274" x2="262" y2="274" />
          <line x1="272" y1="274" x2="302" y2="274" />

          {/* Row 11 (y=282) */}
          <line x1="110" y1="282" x2="145" y2="282" />
          <line x1="155" y1="282" x2="190" y2="282" />
          <line x1="200" y1="282" x2="235" y2="282" />
          <line x1="245" y1="282" x2="278" y2="282" />

          {/* Row 12 (y=290) */}
          <line x1="120" y1="290" x2="158" y2="290" />
          <line x1="168" y1="290" x2="205" y2="290" />
          <line x1="215" y1="290" x2="252" y2="290" />
          <line x1="262" y1="290" x2="290" y2="290" />

          {/* Row 13 (y=298) */}
          <line x1="130" y1="298" x2="175" y2="298" />
          <line x1="185" y1="298" x2="228" y2="298" />
          <line x1="238" y1="298" x2="275" y2="298" />

          {/* Row 14 (y=306) */}
          <line x1="145" y1="306" x2="190" y2="306" />
          <line x1="200" y1="306" x2="248" y2="306" />

          {/* Row 15 (y=314) */}
          <line x1="165" y1="314" x2="225" y2="314" />
        </g>

        {/* 3. ICONIC GOLDEN SHIP HULL FORMED BY "CSL" */}
        <g fill="#f59e0b">
          {/* 'C' - Forms Bow and Fore-ship Hull */}
          <path
            d="M 70 152 
               L 182 174 
               C 182 174 186 182 186 247
               L 142 247
               C 130 247 122 225 118 200
               C 114 175 102 165 70 152 Z"
            fill="#f59e0b"
          />
          {/* Main Bow wedge & Cutout of 'C' */}
          <path
            d="M 70 152 
               L 186 174 
               L 186 186 
               C 168 186 158 194 158 204
               C 158 214 168 222 186 222
               L 186 247
               L 142 247
               C 126 247 116 230 110 208
               L 70 152 Z"
            fill="#f59e0b"
          />
          {/* Sharp curved cutout inside C */}
          <path
            d="M 186 188
               C 162 188 152 196 152 206
               C 152 216 162 224 186 224
               Z"
            fill="#000000"
          />

          {/* 'S' - Midship Bulk Cargo Hull Section */}
          <path
            d="M 192 176
               L 272 180
               C 276 180 276 200 252 204
               L 224 209
               C 214 211 210 216 210 221
               C 210 227 216 232 230 232
               L 276 232
               L 276 247
               L 220 247
               C 192 247 192 225 212 219
               L 242 214
               C 254 212 258 207 258 202
               C 258 196 250 192 236 192
               L 192 192
               Z"
            fill="#f59e0b"
          />

          {/* 'L' - Aft Stern Hull & Bulbous Skeg / Propeller Boss */}
          <path
            d="M 279 181
               L 297 181
               L 297 228
               C 305 228 316 226 324 231
               C 334 237 334 246 324 247
               L 279 247
               Z"
            fill="#f59e0b"
          />
          {/* Bulbous stern horn extension curve of 'L' */}
          <path
            d="M 297 228
               C 310 228 322 224 330 232
               C 338 240 330 247 318 247
               L 297 247
               Z"
            fill="#f59e0b"
          />
        </g>
      </g>

      {/* SANSKRIT MOTTO (कर्मयोगो विशिष्यते) in Red */}
      <text fill="#d9383a" fontSize="15" fontWeight="bold" fontFamily="'Plus Jakarta Sans', sans-serif">
        <textPath href="#cslMottoArc" startOffset="50%" textAnchor="middle">
          कर्मयोगो विशिष्यते
        </textPath>
      </text>

      {/* BOTTOM "MY CSL ✦" in Electric Blue */}
      <text
        fill="#1c92d2"
        fontSize="29"
        fontWeight="900"
        fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
        letterSpacing="2.5px"
      >
        <textPath href="#cslTitleArc" startOffset="50%" textAnchor="middle">
          MY CSL ✦
        </textPath>
      </text>
    </svg>
  );
};
