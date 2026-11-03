export interface SampleDrawing {
  id: string;
  title: string;
  drawingNo: string;
  project: string;
  block: string;
  classification: string;
  description: string;
  svgMarkup: string;
}

export const sampleDrawings: SampleDrawing[] = [
  {
    id: 'csl-yd024-midship',
    title: 'Midship Section Scantlings & Double Bottom Framing',
    drawingNo: 'CSL/NA/YD-024/DWG-204-REV-C',
    project: 'CSL Yard 024 • 55,000 DWT Handymax Bulk Carrier',
    block: 'Block B-04 (Cargo Hold No. 3)',
    classification: 'IRS (Indian Register of Shipping) / DNV-GL',
    description: 'Detailed structural scantlings showing bottom shell plating (t=18.5mm DH36), inner bottom plating (t=17.0mm Grade A), solid floor plates, side longitudinal frames (HP 240x12), and bilge keel brackets.',
    svgMarkup: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style="background:#0a1926; font-family: monospace;">
      <!-- Grid -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e374d" stroke-width="0.8"/>
        </pattern>
      </defs>
      <rect width="800" height="500" fill="url(#grid)" />

      <!-- Title Block -->
      <rect x="520" y="380" width="260" height="100" fill="#0c2333" stroke="#0284c7" stroke-width="1.5" />
      <text x="530" y="400" fill="#38bdf8" font-size="11" font-weight="bold">COCHIN SHIPYARD LIMITED - KOCHI</text>
      <text x="530" y="416" fill="#94a3b8" font-size="9">DWG: CSL/NA/YD-024/DWG-204-REV-C</text>
      <text x="530" y="430" fill="#f8fafc" font-size="10">TITLE: MIDSHIP SECTION SCANTLINGS</text>
      <text x="530" y="445" fill="#f59e0b" font-size="9">VESSEL: 55,000 DWT BULK CARRIER (YD-024)</text>
      <text x="530" y="460" fill="#38bdf8" font-size="9">CLASS: IRS / DNV-GL • SCALE: 1:50</text>
      <text x="530" y="473" fill="#cbd5e1" font-size="8">APPROVED: CHIEF NAVAL ARCHITECT & HULL DIV</text>

      <!-- Centerline -->
      <line x1="400" y1="40" x2="400" y2="440" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="8 4 2 4" />
      <text x="405" y="55" fill="#f43f5e" font-size="10">CL (CENTER LINE)</text>

      <!-- Outer Bottom Shell Plating -->
      <path d="M 80 120 L 80 360 Q 90 410 140 420 L 400 420" fill="none" stroke="#38bdf8" stroke-width="4" />
      <text x="210" y="438" fill="#38bdf8" font-size="10" font-weight="bold">BOTTOM SHELL PLT: t=18.5mm (STEEL: DH36)</text>
      <text x="20" y="240" fill="#38bdf8" font-size="10" font-weight="bold" transform="rotate(-90 20 240)">SIDE SHELL PLT: t=16.0mm (GR-A)</text>

      <!-- Inner Bottom Plating (Tanktop) -->
      <line x1="140" y1="350" x2="400" y2="350" stroke="#38bdf8" stroke-width="3.5" />
      <text x="220" y="342" fill="#38bdf8" font-size="10" font-weight="bold">INNER BOTTOM (TANKTOP): t=17.0mm (GR-DH36)</text>

      <!-- Center Girder (Double Bottom) -->
      <rect x="395" y="350" width="10" height="70" fill="#0284c7" opacity="0.6" stroke="#38bdf8" stroke-width="2" />
      <text x="415" y="385" fill="#e2e8f0" font-size="9">CENTER GIRDER t=15.0mm (DH36)</text>

      <!-- Side Girders -->
      <line x1="280" y1="350" x2="280" y2="420" stroke="#38bdf8" stroke-width="2.5" />
      <text x="290" y="390" fill="#94a3b8" font-size="8">SIDE GIRDER t=12.5mm</text>
      <line x1="190" y1="350" x2="190" y2="405" stroke="#38bdf8" stroke-width="2.5" />

      <!-- Solid Floors with Lightening Holes -->
      <circle cx="340" cy="385" r="16" fill="none" stroke="#f59e0b" stroke-width="1.8" />
      <circle cx="235" cy="385" r="14" fill="none" stroke="#f59e0b" stroke-width="1.8" />
      <text x="315" y="388" fill="#f59e0b" font-size="7">MANHOLE 600x400</text>

      <!-- Upper Deck & Hatch Coaming -->
      <line x1="80" y1="120" x2="260" y2="120" stroke="#38bdf8" stroke-width="4" />
      <line x1="260" y1="120" x2="260" y2="70" stroke="#38bdf8" stroke-width="3.5" />
      <text x="95" y="110" fill="#38bdf8" font-size="10">UPPER DECK PLT: t=22.0mm (EH36)</text>
      <text x="270" y="85" fill="#f59e0b" font-size="9">HATCH COAMING t=16.0mm</text>

      <!-- Side Longitudinal Frames (HP Bulbs) -->
      <g stroke="#22d3ee" stroke-width="2">
        <line x1="80" y1="160" x2="120" y2="160" />
        <line x1="80" y1="200" x2="120" y2="200" />
        <line x1="80" y1="240" x2="120" y2="240" />
        <line x1="80" y1="280" x2="120" y2="280" />
        <line x1="80" y1="320" x2="120" y2="320" />
      </g>
      <text x="130" y="244" fill="#22d3ee" font-size="9">SIDE FRAMES: HP 240x12 (DH36)</text>

      <!-- Bilge Keel Bracket -->
      <line x1="110" y1="395" x2="70" y2="435" stroke="#f97316" stroke-width="3" />
      <text x="40" y="455" fill="#f97316" font-size="9">BILGE KEEL: 300x12 FB</text>

      <!-- Weld callouts -->
      <circle cx="260" cy="120" r="4" fill="#e11d48" />
      <text x="270" y="135" fill="#f43f5e" font-size="8">WELD W-14: FULL PEN BUTT (100% UT)</text>
    </svg>`,
  },
  {
    id: 'csl-yd112-bulkhead',
    title: 'Watertight Transverse Bulkhead & Stiffener Table',
    drawingNo: 'CSL/NAV/ASW-112/DWG-BHD-04',
    project: 'CSL Yard 112 • ASW SWC (Anti-Submarine Corvette)',
    block: 'Block Hull-03 (Frame 48 WT Bulkhead)',
    classification: 'IRS Naval Rules / Indian Navy Directorate of Naval Design (DND)',
    description: 'Watertight subdivision bulkhead with high-tensile steel DMR-249A plates (t=10.0mm & 8.0mm), vertical stiffeners (T-Bar 150x75x6/9), watertight door penetration sleeve, and boundary welds.',
    svgMarkup: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style="background:#0c1e2b; font-family: monospace;">
      <defs>
        <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#123b53" stroke-width="0.8"/>
        </pattern>
      </defs>
      <rect width="800" height="500" fill="url(#grid2)" />

      <!-- Title Block -->
      <rect x="510" y="370" width="270" height="110" fill="#0b2436" stroke="#06b6d4" stroke-width="1.5" />
      <text x="520" y="390" fill="#22d3ee" font-size="11" font-weight="bold">COCHIN SHIPYARD LIMITED - ASW YARD</text>
      <text x="520" y="406" fill="#94a3b8" font-size="9">DWG: CSL/NAV/ASW-112/DWG-BHD-04</text>
      <text x="520" y="420" fill="#ffffff" font-size="10">WT TRANSVERSE BULKHEAD (FR 48)</text>
      <text x="520" y="435" fill="#f59e0b" font-size="9">VESSEL: ASW SWC CORVETTE (INDIAN NAVY)</text>
      <text x="520" y="450" fill="#38bdf8" font-size="9">STEEL: DMR-249A / HIGH TENSILE</text>
      <text x="520" y="465" fill="#93c5fd" font-size="8">NDT: 100% MT ON BOUNDARY, 20% RT ON BUTTS</text>

      <!-- Bulkhead Contour -->
      <polygon points="120,100 680,100 660,340 400,430 140,340" fill="#0f2b3c" stroke="#38bdf8" stroke-width="3" />

      <!-- Horizontal Seams / Plate Strakes -->
      <line x1="130" y1="180" x2="670" y2="180" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3" />
      <text x="340" y="145" fill="#38bdf8" font-size="9">STRAKE 1: PLT t=8.0mm (DMR-249A)</text>

      <line x1="140" y1="270" x2="660" y2="270" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 3" />
      <text x="340" y="235" fill="#38bdf8" font-size="9">STRAKE 2: PLT t=9.5mm (DMR-249A)</text>
      <text x="340" y="325" fill="#38bdf8" font-size="9">STRAKE 3: PLT t=11.0mm (DMR-249A)</text>

      <!-- Vertical Stiffeners -->
      <g stroke="#34d399" stroke-width="2.5">
        <line x1="240" y1="100" x2="240" y2="380" />
        <line x1="320" y1="100" x2="320" y2="405" />
        <line x1="400" y1="100" x2="400" y2="425" />
        <line x1="480" y1="100" x2="480" y2="405" />
        <line x1="560" y1="100" x2="560" y2="380" />
      </g>
      <text x="410" y="290" fill="#34d399" font-size="9">STIFFENERS: T-BAR 150x75x6/9mm @ 800 SPACING</text>

      <!-- Watertight Door Penetration -->
      <rect x="270" y="200" width="70" height="120" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="2.5" />
      <text x="275" y="260" fill="#f59e0b" font-size="8">WT DOOR 1600x700</text>
      <text x="275" y="275" fill="#f59e0b" font-size="7">COLLAR t=14mm</text>

      <!-- Pipe Penetration Spool -->
      <circle cx="510" cy="240" r="14" fill="#0f172a" stroke="#ec4899" stroke-width="2" />
      <text x="530" y="245" fill="#ec4899" font-size="8">FIRE MAIN PENETRATION Ø150mm</text>
    </svg>`,
  },
  {
    id: 'csl-yd305-rudder',
    title: 'Rudder Trunk & Stern Frame Casting Assembly',
    drawingNo: 'CSL/ELEC/YD-305/STR-12',
    project: 'CSL Yard 305 • Kochi Green Water Metro Hybrid Ferry',
    block: 'Aft Peak Block AP-01',
    classification: 'IRS Inland Vessels Rules / Class Survey 2026',
    description: 'Stern structural arrangement including rudder trunk forged steel tube (Grade 450N), rudder stock bearing housing, skeg sole piece, transom floor brackets, and vibration damping pads.',
    svgMarkup: `<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style="background:#091a24; font-family: monospace;">
      <defs>
        <pattern id="grid3" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f3b4c" stroke-width="0.8"/>
        </pattern>
      </defs>
      <rect width="800" height="500" fill="url(#grid3)" />

      <!-- Title Block -->
      <rect x="510" y="370" width="270" height="110" fill="#092230" stroke="#10b981" stroke-width="1.5" />
      <text x="520" y="390" fill="#34d399" font-size="11" font-weight="bold">COCHIN SHIPYARD LIMITED</text>
      <text x="520" y="406" fill="#94a3b8" font-size="9">DWG: CSL/ELEC/YD-305/STR-12</text>
      <text x="520" y="420" fill="#ffffff" font-size="10">RUDDER TRUNK & STERN FRAME</text>
      <text x="520" y="435" fill="#f59e0b" font-size="9">VESSEL: GREEN HYBRID WATER METRO (YD-305)</text>
      <text x="520" y="450" fill="#38bdf8" font-size="9">ALUMINUM 5083-H116 / CAST STEEL</text>
      <text x="520" y="465" fill="#93c5fd" font-size="8">PROPULSION: DUAL POD ELECTRIC AZIMUTH</text>

      <!-- Transom Stern Contour -->
      <path d="M 160 120 L 580 120 L 640 280 L 560 380 L 320 380 L 260 280 Z" fill="#0d2938" stroke="#38bdf8" stroke-width="3" />

      <!-- Rudder Trunk Column -->
      <rect x="420" y="160" width="50" height="180" fill="#1e3a4b" stroke="#f59e0b" stroke-width="2.5" />
      <text x="480" y="240" fill="#f59e0b" font-size="9">RUDDER TRUNK TUBE Ø280x25mm (FORGED)</text>

      <!-- Bearing Housing -->
      <rect x="405" y="140" width="80" height="30" rx="4" fill="#047857" stroke="#34d399" stroke-width="2" />
      <text x="495" y="158" fill="#34d399" font-size="8">NECK BEARING HOUSING (SYNTHETIC VESCONITE)</text>

      <!-- Skeg & Sole Piece -->
      <path d="M 400 380 L 490 380 L 460 450 L 430 450 Z" fill="#0f766e" stroke="#2dd4bf" stroke-width="2.5" />
      <text x="480" y="440" fill="#2dd4bf" font-size="9">SKEG SOLE PIECE t=32mm</text>

      <!-- Transom Stiffeners -->
      <line x1="280" y1="120" x2="330" y2="380" stroke="#60a5fa" stroke-width="2" />
      <line x1="360" y1="120" x2="380" y2="380" stroke="#60a5fa" stroke-width="2" />
      <line x1="510" y1="120" x2="500" y2="380" stroke="#60a5fa" stroke-width="2" />
      <text x="220" y="210" fill="#60a5fa" font-size="8">TRANSOM STIFFENERS L 100x75x7</text>
    </svg>`,
  },
];
