// Cochin Shipyard Limited - Ship Theory Dictionary Data
window.DICTIONARY_DATA = [
  {
    id: "folder-1",
    number: "1",
    titleEn: "Shipbuilding Stages",
    titleMl: "കപ്പൽ നിർമ്മാണ ഘട്ടങ്ങൾ",
    desc: "From CAD lofting and CNC steel cutting to block erection, drydock keel laying, float-out launching, and open sea trials.",
    masterDiagramSvg: `
      <svg viewBox="0 0 880 220" width="100%" height="220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradStage" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#164375" />
            <stop offset="100%" stop-color="#10345c" />
          </linearGradient>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.15" />
          </filter>
        </defs>

        <rect x="20" y="10" width="840" height="200" rx="10" fill="#f5ede0" stroke="#ebd9ab" stroke-width="1.5"/>
        
        <!-- Connectors -->
        <path d="M 125 105 L 245 105" stroke="#900c3f" stroke-width="3" stroke-dasharray="6,4"/>
        <path d="M 270 105 L 390 105" stroke="#900c3f" stroke-width="3" stroke-dasharray="6,4"/>
        <path d="M 415 105 L 535 105" stroke="#900c3f" stroke-width="3" stroke-dasharray="6,4"/>
        <path d="M 560 105 L 680 105" stroke="#900c3f" stroke-width="3" stroke-dasharray="6,4"/>
        <path d="M 705 105 L 825 105" stroke="#900c3f" stroke-width="3" stroke-dasharray="6,4"/>

        <!-- 1: Design -->
        <g transform="translate(45, 45)" filter="url(#shadow)">
          <rect width="110" height="115" rx="8" fill="url(#gradStage)" stroke="#d4a34b" stroke-width="1.5"/>
          <circle cx="55" cy="35" r="18" fill="#fdf6e2"/>
          <path d="M 46 30 L 64 30 L 64 42 L 46 42 Z M 51 42 L 48 45 L 62 45 L 59 42" stroke="#10345c" stroke-width="1.8" fill="none"/>
          <text x="55" y="72" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle" font-family="Inter, sans-serif">1. DESIGN</text>
          <text x="55" y="86" fill="#ebd9ab" font-size="10" font-weight="600" text-anchor="middle">&amp; LOFTING</text>
          <text x="55" y="104" fill="#ffffff" font-size="8.5" text-anchor="middle" font-family="Manjari, sans-serif">ഡിസൈൻ &amp; പ്ലാൻ</text>
        </g>

        <!-- 2: Steel Cutting -->
        <g transform="translate(190, 45)" filter="url(#shadow)">
          <rect width="110" height="115" rx="8" fill="url(#gradStage)" stroke="#d4a34b" stroke-width="1.5"/>
          <circle cx="55" cy="35" r="18" fill="#fdf6e2"/>
          <line x1="48" y1="28" x2="62" y2="42" stroke="#900c3f" stroke-width="2.5"/>
          <line x1="48" y1="42" x2="62" y2="28" stroke="#900c3f" stroke-width="2.5"/>
          <text x="55" y="72" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle" font-family="Inter, sans-serif">2. CNC CUTTING</text>
          <text x="55" y="86" fill="#ebd9ab" font-size="10" font-weight="600" text-anchor="middle">&amp; MARKING</text>
          <text x="55" y="104" fill="#ffffff" font-size="8.5" text-anchor="middle" font-family="Manjari, sans-serif">സ്റ്റീൽ കട്ടിംഗ്</text>
        </g>

        <!-- 3: Block Assembly -->
        <g transform="translate(335, 45)" filter="url(#shadow)">
          <rect width="110" height="115" rx="8" fill="url(#gradStage)" stroke="#d4a34b" stroke-width="1.5"/>
          <circle cx="55" cy="35" r="18" fill="#fdf6e2"/>
          <polygon points="55,24 67,30 67,42 55,48 43,42 43,30" fill="none" stroke="#10345c" stroke-width="1.8"/>
          <text x="55" y="72" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle" font-family="Inter, sans-serif">3. BLOCK</text>
          <text x="55" y="86" fill="#ebd9ab" font-size="10" font-weight="600" text-anchor="middle">ASSEMBLY</text>
          <text x="55" y="104" fill="#ffffff" font-size="8.5" text-anchor="middle" font-family="Manjari, sans-serif">ബ്ലോക്ക് അസംബ്ലി</text>
        </g>

        <!-- 4: Keel Laying -->
        <g transform="translate(480, 45)" filter="url(#shadow)">
          <rect width="110" height="115" rx="8" fill="url(#gradStage)" stroke="#d4a34b" stroke-width="1.5"/>
          <circle cx="55" cy="35" r="18" fill="#fdf6e2"/>
          <rect x="45" y="38" width="20" height="6" fill="#900c3f"/>
          <line x1="55" y1="24" x2="55" y2="34" stroke="#10345c" stroke-width="2"/>
          <path d="M 50 34 C 50 38 60 38 60 34" stroke="#10345c" stroke-width="2" fill="none"/>
          <text x="55" y="72" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle" font-family="Inter, sans-serif">4. KEEL</text>
          <text x="55" y="86" fill="#ebd9ab" font-size="10" font-weight="600" text-anchor="middle">LAYING</text>
          <text x="55" y="104" fill="#ffffff" font-size="8.5" text-anchor="middle" font-family="Manjari, sans-serif">കീൽ ലേയിംഗ്</text>
        </g>

        <!-- 5: Launching -->
        <g transform="translate(625, 45)" filter="url(#shadow)">
          <rect width="110" height="115" rx="8" fill="url(#gradStage)" stroke="#d4a34b" stroke-width="1.5"/>
          <circle cx="55" cy="35" r="18" fill="#fdf6e2"/>
          <path d="M 44 32 L 66 32 L 62 40 L 48 40 Z" fill="#10345c"/>
          <path d="M 42 43 Q 48 41 55 43 T 68 43" stroke="#0c7c84" stroke-width="2" fill="none"/>
          <text x="55" y="72" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle" font-family="Inter, sans-serif">5. LAUNCHING</text>
          <text x="55" y="86" fill="#ebd9ab" font-size="10" font-weight="600" text-anchor="middle">&amp; FLOAT-OUT</text>
          <text x="55" y="104" fill="#ffffff" font-size="8.5" text-anchor="middle" font-family="Manjari, sans-serif">ലോഞ്ചിംഗ്</text>
        </g>

        <!-- 6: Sea Trials -->
        <g transform="translate(755, 45)" filter="url(#shadow)">
          <rect width="95" height="115" rx="8" fill="url(#gradStage)" stroke="#d4a34b" stroke-width="1.5"/>
          <circle cx="47.5" cy="35" r="18" fill="#fdf6e2"/>
          <circle cx="47.5" cy="35" r="8" fill="none" stroke="#900c3f" stroke-width="2"/>
          <circle cx="47.5" cy="35" r="3" fill="#900c3f"/>
          <text x="47.5" y="72" fill="#ffffff" font-size="10.5" font-weight="700" text-anchor="middle" font-family="Inter, sans-serif">6. SEA TRIALS</text>
          <text x="47.5" y="86" fill="#ebd9ab" font-size="9.5" font-weight="600" text-anchor="middle">&amp; DELIVERY</text>
          <text x="47.5" y="104" fill="#ffffff" font-size="8.5" text-anchor="middle" font-family="Manjari, sans-serif">കടൽ പരീക്ഷണം</text>
        </g>
      </svg>
    `,
    terms: [
      {
        id: "design-lofting",
        titleEn: "DESIGN & LOFTING",
        titleMl: "കമ്പ്യൂട്ടർ ഡിസൈനും ലോഫ്റ്റിംഗും",
        formula: "CAD/CAM Hull Surface Offset 3D Modeling",
        defEn: "The fundamental first engineering phase where naval architects produce 3D lines plans, structural general arrangement blueprints, and structural calculation models before cutting steel. Lofting involves mathematically fairing hull surfaces in CAD/CAM software (such as AVEVA Marine or NAPA), generating exact 2D flat plate expansions, frame bevel angles, and plate nesting programs for CNC cutting.",
        defMl: "കപ്പൽ നിർമ്മാണത്തിന്റെ ആദ്യ ഘട്ടമാണിത്. കപ്പലിന്റെ ലൈൻസ് പ്ലാൻ വരയ്ക്കുകയും, 3D കമ്പ്യൂട്ടർ മോഡലുകൾ (CAD/CAM) തയ്യാറാക്കുകയും ചെയ്യുന്നു. വലിയ സ്റ്റീൽ പ്ലേറ്റുകളിൽ നിന്ന് കുറഞ്ഞ വേസ്റ്റോടെ കൃത്യമായ അളവുകളിൽ പ്ലേറ്റുകൾ മുറിച്ചെടുക്കാനുള്ള നെസ്റ്റിംഗ് പ്ലാനുകളും ബെവലുകളും ഇവിടെ കണക്കുകൂട്ടുന്നു.",
        diagramSvg: `
          <svg viewBox="0 0 460 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="200" fill="#fcf9f2" rx="8"/>
            <line x1="40" y1="30" x2="420" y2="30" stroke="#ebd9ab" stroke-width="1"/>
            <line x1="40" y1="70" x2="420" y2="70" stroke="#ebd9ab" stroke-width="1"/>
            <line x1="40" y1="110" x2="420" y2="110" stroke="#ebd9ab" stroke-width="1"/>
            <line x1="40" y1="150" x2="420" y2="150" stroke="#ebd9ab" stroke-width="1"/>
            <path d="M 60 140 Q 140 135 240 100 T 400 50" fill="none" stroke="#10345c" stroke-width="3"/>
            <path d="M 60 145 Q 150 142 250 115 T 400 65" fill="none" stroke="#900c3f" stroke-width="2"/>
            <circle cx="240" cy="100" r="5" fill="#900c3f"/>
            <text x="250" y="98" fill="#1c3144" font-size="11" font-weight="700">Faired Hull Line (CAD)</text>
            <text x="70" y="45" fill="#48627a" font-size="11" font-family="JetBrains Mono, monospace">Offset Table Coordinates (X, Y, Z)</text>
            <text x="220" y="185" fill="#1c3144" font-size="12" font-weight="700" text-anchor="middle">Lines Plan &amp; 3D Lofting Development</text>
          </svg>
        `
      },
      {
        id: "steel-cutting",
        titleEn: "STEEL CUTTING & MARKING",
        titleMl: "സ്റ്റീൽ കട്ടിംഗും മാർക്കിംഗും",
        formula: "CNC Plasma / Oxy-Fuel Flame Cutting",
        defEn: "The automated processing of raw grade-A or high-tensile steel plates directly from the stockyard. High-precision multi-torch CNC underwater plasma cutters or oxy-fuel machines slice steel plates according to nested CAD profiles, while etching identifying markings (block number, frame station, weld bevels) onto each piece.",
        defMl: "ഡിസൈൻ പ്രകാരം വലിയ സ്റ്റീൽ പ്ലേറ്റുകൾ CNC മെഷീനുകൾ ഉപയോഗിച്ച് കൃത്യമായ അളവുകളിൽ മുറിച്ചെടുക്കുകയും വെൽഡിംഗിനായുള്ള ബെവലുകൾ തയ്യാറാക്കുകയും ചെയ്യുന്ന ഘട്ടം. ഓരോ പ്ലേറ്റിലും അത് ഏത് ബ്ലോക്കിലേതാണ് തുടങ്ങിയ വിവരങ്ങൾ രേഖപ്പെടുത്തുന്നു.",
        diagramSvg: `
          <svg viewBox="0 0 460 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="200" fill="#fcf9f2" rx="8"/>
            <rect x="50" y="40" width="360" height="110" rx="4" fill="#d1d8e0" stroke="#778ca3" stroke-width="2"/>
            <path d="M 80 60 L 220 60 L 200 120 L 80 120 Z" fill="#ffffff" stroke="#900c3f" stroke-width="2.5" stroke-dasharray="4,2"/>
            <rect x="235" y="20" width="30" height="50" rx="3" fill="#10345c"/>
            <circle cx="250" cy="85" r="6" fill="#900c3f"/>
            <text x="95" y="85" fill="#1c3144" font-size="10" font-weight="700" font-family="JetBrains Mono, monospace">BLK-204 / FR.72</text>
            <text x="230" y="180" fill="#1c3144" font-size="12" font-weight="700" text-anchor="middle">CNC Underwater Plasma Cutting Bed</text>
          </svg>
        `
      },
      {
        id: "sub-assembly",
        titleEn: "SUB-ASSEMBLY & FABRICATION",
        titleMl: "സബ്-അസംബ്ലി & ഫാബ്രിക്കേഷൻ",
        formula: "WPS / PQR Approved Automatic Welding",
        defEn: "The workshop fabrication phase where individual cut plates, web frames, face flats, and longitudinal stiffeners are joined by semi-automatic and robotic welding to construct smaller structural components such as built-up T-girders and floor plates.",
        defMl: "മുറിച്ചെടുത്ത ചെറിയ സ്റ്റീൽ പ്ലേറ്റുകൾ, ഫ്രെയിമുകൾ, വെബ്ബുകൾ എന്നിവ വെൽഡ് ചെയ്ത് ചെറിയ ഘടകങ്ങളാക്കി (സബ്-അസംബ്ലികൾ) മാറ്റുന്ന നിർമ്മാണ ഘട്ടം.",
        diagramSvg: `
          <svg viewBox="0 0 460 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="200" fill="#fcf9f2" rx="8"/>
            <rect x="60" y="130" width="340" height="16" fill="#8395a7" stroke="#1c3144" stroke-width="1.5"/>
            <rect x="150" y="60" width="14" height="70" fill="#576574" stroke="#1c3144" stroke-width="1.5"/>
            <rect x="290" y="60" width="14" height="70" fill="#576574" stroke="#1c3144" stroke-width="1.5"/>
            <rect x="130" y="50" width="54" height="12" fill="#8395a7" stroke="#1c3144" stroke-width="1.5"/>
            <rect x="270" y="50" width="54" height="12" fill="#8395a7" stroke="#1c3144" stroke-width="1.5"/>
            <text x="230" y="32" fill="#1c3144" font-size="11" font-weight="700" text-anchor="middle">Fabricated T-Bar Stiffener Assembly</text>
            <text x="230" y="185" fill="#1c3144" font-size="12" font-weight="700" text-anchor="middle">Sub-Assembly: Stiffened Hull Plating Panel</text>
          </svg>
        `
      },
      {
        id: "block-assembly",
        titleEn: "BLOCK ASSEMBLY & PRE-OUTFITTING",
        titleMl: "ബ്ലോക്ക് അസംബ്ലി & പ്രീ-ഔട്ട്ഫിറ്റിംഗ്",
        formula: "Grand Block Modular Construction (100t - 450t)",
        defEn: "Joining flat panels and sub-assemblies into colossal, rigid 3D volumetric hull blocks (weighing 100 to 450+ tonnes). Pre-outfitting is carried out: pipes, machinery beds, and cable trays are fitted before moving the block to the dry dock.",
        defMl: "സബ്-അസംബ്ലികളെ യോജിപ്പിച്ച് 100 മുതൽ 450 ടൺ വരെ ഭാരമുള്ള കൂറ്റൻ 3D ഹൾ ബ്ലോക്കുകൾ നിർമ്മിക്കുന്നു. പൈപ്പുകളും കേബിൾ ട്രേകളും ഇതോടൊപ്പം ഘടിപ്പിക്കുന്നു.",
        diagramSvg: `
          <svg viewBox="0 0 460 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="200" fill="#fcf9f2" rx="8"/>
            <polygon points="90,130 220,160 370,120 240,90" fill="#d1d8e0" stroke="#10345c" stroke-width="2"/>
            <polygon points="90,70 220,100 370,60 240,30" fill="#f1f2f6" stroke="#10345c" stroke-width="2"/>
            <polygon points="90,130 220,160 220,100 90,70" fill="#a4b0be" stroke="#10345c" stroke-width="2"/>
            <line x1="140" y1="125" x2="260" y2="95" stroke="#900c3f" stroke-width="4"/>
            <text x="230" y="185" fill="#1c3144" font-size="12" font-weight="700" text-anchor="middle">3D Double Bottom Mega Block</text>
          </svg>
        `
      },
      {
        id: "keel-laying",
        titleEn: "KEEL LAYING & DOCK ERECTION",
        titleMl: "കീൽ ലേയിംഗ് (കപ്പലിന്റെ തറക്കല്ലിടൽ)",
        formula: "Statutory Start of Vessel Construction (SOLAS / Class)",
        defEn: "The statutory and traditional milestone where the very first structural block is precisely lowered onto the dock keel blocks. In classification society terms, this date defines the formal build year and applicable safety conventions.",
        defMl: "ഡ്രൈ ഡോക്കിലോ സ്ലിപ്പ് വേയിലോ കപ്പലിന്റെ ഏറ്റവും ആദ്യത്തെ അടിത്തറ ബ്ലോക്ക് സ്ഥാപിക്കുന്ന ഔദ്യോഗിക ചടങ്ങ്. കപ്പലിന്റെ തറക്കല്ലിടൽ കർമ്മമാണിത്.",
        diagramSvg: `
          <svg viewBox="0 0 460 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="200" fill="#fcf9f2" rx="8"/>
            <rect x="40" y="150" width="380" height="25" fill="#a4b0be"/>
            <rect x="80" y="120" width="40" height="30" fill="#57606f" stroke="#2f3542"/>
            <rect x="160" y="120" width="40" height="30" fill="#57606f" stroke="#2f3542"/>
            <rect x="240" y="120" width="40" height="30" fill="#57606f" stroke="#2f3542"/>
            <rect x="320" y="120" width="40" height="30" fill="#57606f" stroke="#2f3542"/>
            <rect x="60" y="80" width="320" height="40" rx="2" fill="#10345c" stroke="#d4a34b" stroke-width="2"/>
            <text x="220" y="105" fill="#ffffff" font-size="12" font-weight="700" text-anchor="middle">FIRST KEEL HULL BLOCK</text>
            <text x="230" y="190" fill="#1c3144" font-size="12" font-weight="700" text-anchor="middle">Dock Keel Blocks &amp; First Block Placement</text>
          </svg>
        `
      },
      {
        id: "launching-outfitting",
        titleEn: "LAUNCHING & FLOAT-OUT",
        titleMl: "ലോഞ്ചിംഗും ഫ്ലോട്ട്-ഔട്ടും",
        formula: "Dock Sluice Flooding / Float-off",
        defEn: "The milestone where the completed water-tight hull meets the sea for the first time. In modern building docks like Cochin Shipyard, sluice valves are opened to flood the dock chamber until the hull floats off the keel blocks.",
        defMl: "ഡ്രൈ ഡോക്കിലേക്ക് കടൽവെള്ളം തുറന്നുവിട്ട് കപ്പലിനെ ആദ്യമായി വെള്ളത്തിൽ പൊന്തിച്ചുനിർത്തുന്ന (ഫ്ലോട്ട്-ഔട്ട്) സുപ്രധാന ഘട്ടം.",
        diagramSvg: `
          <svg viewBox="0 0 460 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="200" fill="#fcf9f2" rx="8"/>
            <rect x="40" y="110" width="380" height="65" fill="#1c528a" opacity="0.3"/>
            <path d="M 80 80 L 110 130 L 330 130 L 370 70 L 340 70 L 320 80 Z" fill="#10345c" stroke="#d4a34b" stroke-width="2"/>
            <rect x="260" y="45" width="55" height="35" fill="#ffffff" stroke="#10345c" stroke-width="1.5"/>
            <text x="230" y="190" fill="#1c3144" font-size="12" font-weight="700" text-anchor="middle">Dock Flooding &amp; Vessel Float-Out</text>
          </svg>
        `
      },
      {
        id: "sea-trials",
        titleEn: "SEA TRIALS & COMMISSIONING",
        titleMl: "കടൽ പരീക്ഷണവും കമ്മീഷനിംഗും",
        formula: "Full Power Speed & Crash Stop Endurance Testing",
        defEn: "Comprehensive testing in open ocean: full-speed endurance runs, crash-stop maneuvering, turning circle, and vibration tests before official delivery to the shipowner.",
        defMl: "കപ്പൽ പൂർണ്ണമായി നിർമ്മിച്ച് കഴിഞ്ഞ് ഉടമസ്ഥന് കൈമാറുന്നതിന് മുൻപായി ആഴക്കടലിൽ നടത്തുന്ന സമഗ്രമായ പരിശോധനകൾ.",
        diagramSvg: `
          <svg viewBox="0 0 460 200" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="460" height="200" fill="#fcf9f2" rx="8"/>
            <path d="M 40 125 Q 90 120 140 125 T 240 125 T 340 125 T 420 125" stroke="#1c528a" stroke-width="2.5" fill="none"/>
            <path d="M 120 85 L 145 130 L 330 130 L 375 75 L 340 75 Z" fill="#10345c" stroke="#d4a34b" stroke-width="2"/>
            <text x="230" y="190" fill="#1c3144" font-size="12" font-weight="700" text-anchor="middle">Open Ocean Sea Trials &amp; Turning Circle Test</text>
          </svg>
        `
      }
    ]
  },
  {
    id: "folder-2",
    number: "2",
    titleEn: "Principal Dimensions & Hull Geometry",
    titleMl: "പ്രധാന അളവുകളും കപ്പലിന്റെ ഘടനയും",
    desc: "Essential naval architecture geometry: LOA, LBP, LWL, Molded Beam, Draft, Depth, Freeboard, and Block Coefficient.",
    masterDiagramSvg: `
      <svg viewBox="0 0 880 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="10" width="850" height="210" rx="10" fill="#fdfaf3" stroke="#ebd9ab" stroke-width="1.5"/>
        <line x1="40" y1="130" x2="840" y2="130" stroke="#0c7c84" stroke-width="2.5" stroke-dasharray="10,4"/>
        <text x="815" y="125" fill="#0c7c84" font-size="11" font-weight="700">WL</text>
        <path d="M 70 80 L 100 160 L 730 160 L 790 90 L 805 130 L 795 160 L 730 160 Z" fill="#10345c" stroke="#10345c" stroke-width="2"/>
        <line x1="120" y1="20" x2="120" y2="185" stroke="#900c3f" stroke-width="1.5" stroke-dasharray="4,3"/>
        <text x="120" y="200" fill="#900c3f" font-size="11" font-weight="700" text-anchor="middle">AP</text>
        <line x1="790" y1="20" x2="790" y2="185" stroke="#900c3f" stroke-width="1.5" stroke-dasharray="4,3"/>
        <text x="790" y="200" fill="#900c3f" font-size="11" font-weight="700" text-anchor="middle">FP</text>
        <line x1="120" y1="190" x2="790" y2="190" stroke="#900c3f" stroke-width="2"/>
        <text x="455" y="185" fill="#900c3f" font-size="12" font-weight="800" text-anchor="middle">LBP (Length Between Perpendiculars)</text>
        <line x1="65" y1="15" x2="822" y2="15" stroke="#164375" stroke-width="2"/>
        <text x="440" y="12" fill="#164375" font-size="12" font-weight="800" text-anchor="middle">LOA (Length Overall)</text>
      </svg>
    `,
    terms: [
      {
        id: "loa",
        titleEn: "LENGTH OVERALL (LOA)",
        titleMl: "കപ്പലിന്റെ ആകെ നീളം (LOA)",
        formula: "LOA = Extreme Stern tip to extreme Bow/Bulb tip",
        defEn: "The extreme horizontal distance measured between the most forward point of the bow and the most aft point of the stern. Determines harbor navigation safety, lock clearance, and drydock sizing.",
        defMl: "കപ്പലിന്റെ ഏറ്റവും മുന്നറ്റം മുതൽ ഏറ്റവും പിന്നറ്റം വരെയുള്ള ആകെ നീളം. ബെർത്ത്, ഡ്രൈ ഡോക്ക് അളവുകൾക്ക് ഇത് അത്യാവശ്യമാണ്.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><path d="M 40 70 L 60 130 L 380 130 L 415 80 L 425 110 L 410 130 Z" fill="#10345c"/><line x1="38" y1="35" x2="425" y2="35" stroke="#900c3f" stroke-width="2.5"/><text x="230" y="28" fill="#900c3f" font-size="12" font-weight="800" text-anchor="middle">LENGTH OVERALL (LOA)</text></svg>`
      },
      {
        id: "lbp",
        titleEn: "LENGTH BETWEEN PERPENDICULARS (LBP)",
        titleMl: "പെർപെൻഡിക്കുലറുകൾക്കിടയിലെ നീളം (LBP)",
        formula: "LBP = Distance from AP (Rudder Stock) to FP (Summer Waterline)",
        defEn: "The standard design reference length measured between the Forward Perpendicular (FP) and After Perpendicular (AP). Used globally for all hydrostatic and resistance calculations.",
        defMl: "കപ്പലിന്റെ ഫോർവേഡ് പെർപെൻഡിക്കുലറും (FP), ആഫ്റ്റർ പെർപെൻഡിക്കുലറും (AP) തമ്മിലുള്ള നീളം. കണക്കുകൂട്ടലുകൾക്ക് ഇത് ഉപയോഗിക്കുന്നു.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><path d="M 50 70 L 70 130 L 370 130 L 410 70 Z" fill="#10345c"/><line x1="85" y1="40" x2="395" y2="40" stroke="#164375" stroke-width="2.5"/><text x="240" y="34" fill="#164375" font-size="12" font-weight="800" text-anchor="middle">LBP / LPP</text></svg>`
      },
      {
        id: "beam",
        titleEn: "BEAM / BREADTH (MOLDED)",
        titleMl: "കപ്പലിന്റെ വീതി (മോൾഡഡ് ബ്രെഡ്ത്ത്)",
        formula: "B = Maximum molded width inside shell plating",
        defEn: "The maximum width of the ship's hull measured transversely at the midship section. Governs vessel transverse stability (KM = KB + BM).",
        defMl: "കപ്പലിന്റെ മധ്യഭാഗത്ത് സ്റ്റീൽ പ്ലേറ്റുകൾക്കുള്ളിലെ പരമാവധി വീതി. കപ്പലിന്റെ ബാലൻസിന് വീതി നിർണ്ണായകമാണ്.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><path d="M 100 40 L 100 120 Q 100 150 140 150 L 320 150 Q 360 150 360 120 L 360 40 Z" fill="#d1d8e0" stroke="#10345c" stroke-width="2"/><line x1="100" y1="30" x2="360" y2="30" stroke="#900c3f" stroke-width="2.5"/><text x="230" y="24" fill="#900c3f" font-size="12" font-weight="800" text-anchor="middle">MOLDED BEAM (B)</text></svg>`
      },
      {
        id: "draft",
        titleEn: "MOLDED DRAFT / DRAUGHT (T)",
        titleMl: "ഡ്രാഫ്റ്റ് (കപ്പലിന്റെ ആഴം)",
        formula: "T = Vertical distance from Keel Baseline to Waterline",
        defEn: "The vertical depth of the submerged hull measured from the bottom of the keel baseline to the operating water surface.",
        defMl: "കപ്പലിന്റെ അടിത്തട്ട് (കീൽ) മുതൽ ജലനിരപ്പ് വരെയുള്ള ലംബമായ താഴ്ച.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><path d="M 120 40 L 120 120 Q 120 150 160 150 L 300 150 Q 340 150 340 120 L 340 40 Z" fill="#d1d8e0" stroke="#10345c" stroke-width="2"/><line x1="80" y1="90" x2="380" y2="90" stroke="#0c7c84" stroke-width="2.5" stroke-dasharray="6,3"/><line x1="360" y1="90" x2="360" y2="150" stroke="#900c3f" stroke-width="2.5"/><text x="375" y="125" fill="#900c3f" font-size="12" font-weight="800">Draft (T)</text></svg>`
      },
      {
        id: "freeboard",
        titleEn: "FREEBOARD (F)",
        titleMl: "ഫ്രീബോർഡ് (റിസർവ് ബോയൻസി)",
        formula: "F = Molded Depth (D) - Draft (T)",
        defEn: "The vertical distance from the water plane to the upper edge of the freeboard deck line. Mandated to provide reserve buoyancy.",
        defMl: "ജലനിരപ്പ് മുതൽ മെയിൻ ഡെക്ക് വരെയുള്ള ഉയരം. കപ്പലിന്റെ സുരക്ഷിത പ്ലവക്ഷമത ഉറപ്പാക്കാൻ ഇത് കൂടിയേ തീരൂ.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><path d="M 130 35 L 130 120 Q 130 150 170 150 L 290 150 Q 330 150 330 120 L 330 35 Z" fill="#d1d8e0" stroke="#10345c" stroke-width="2"/><line x1="350" y1="35" x2="350" y2="85" stroke="#900c3f" stroke-width="2.5"/><text x="365" y="65" fill="#900c3f" font-size="12" font-weight="800">Freeboard (F)</text></svg>`
      }
    ]
  },
  {
    id: "folder-3",
    number: "3",
    titleEn: "Hydrostatics & Stability",
    titleMl: "ഹൈഡ്രോസ്റ്റാറ്റിക്സും സ്ഥിരതയും",
    desc: "Equilibrium of ships at sea: Center of Buoyancy (B), Center of Gravity (G), Metacenter (M), Metacentric Height (GM), and Righting Lever (GZ).",
    masterDiagramSvg: `
      <svg viewBox="0 0 880 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="10" width="850" height="210" rx="10" fill="#fdfaf3" stroke="#ebd9ab" stroke-width="1.5"/>
        <g transform="translate(140, 20)">
          <text x="80" y="15" fill="#10345c" font-size="13" font-weight="800" text-anchor="middle">UPRIGHT CONDITION (θ = 0°)</text>
          <path d="M 0 50 L 0 120 Q 0 150 40 150 L 120 150 Q 160 150 160 120 L 160 50 Z" fill="#d1d8e0" stroke="#10345c" stroke-width="2"/>
          <circle cx="80" cy="150" r="4" fill="#1c3144"/><text x="90" y="154" fill="#1c3144" font-size="11" font-weight="700">K</text>
          <circle cx="80" cy="120" r="5" fill="#0c7c84"/><text x="92" y="123" fill="#0c7c84" font-size="11" font-weight="700">B</text>
          <circle cx="80" cy="85" r="5" fill="#900c3f"/><text x="92" y="88" fill="#900c3f" font-size="11" font-weight="700">G</text>
          <circle cx="80" cy="45" r="5" fill="#d4a34b"/><text x="92" y="48" fill="#a07823" font-size="11" font-weight="700">M</text>
        </g>
        <line x1="430" y1="25" x2="430" y2="200" stroke="#ebd9ab" stroke-width="1.5"/>
        <g transform="translate(560, 20)">
          <text x="90" y="15" fill="#900c3f" font-size="13" font-weight="800" text-anchor="middle">HEELED CONDITION (Righting Lever GZ)</text>
          <line x1="72" y1="84" x2="105" y2="84" stroke="#900c3f" stroke-width="3"/>
          <text x="85" y="78" fill="#900c3f" font-size="11" font-weight="900">GZ</text>
        </g>
      </svg>
    `,
    terms: [
      {
        id: "buoyancy",
        titleEn: "BUOYANCY & ARCHIMEDES' PRINCIPLE",
        titleMl: "പ്ലവക്ഷമത (ബോയൻസി തത്വം)",
        formula: "Buoyant Force (Δ) = ρ × g × ∇",
        defEn: "The upward vertical force exerted by seawater supporting the ship's entire displacement weight. In accordance with Archimedes' principle, a ship floats when buoyant force equals total gravity weight (W = Δ).",
        defMl: "കപ്പൽ വെള്ളത്തിൽ മുങ്ങുമ്പോൾ അത് ആദേശം ചെയ്യുന്ന വെള്ളത്തിന്റെ ഭാരത്തിന് തുല്യമായി മുകളിലേക്ക് അനുഭവപ്പെടുന്ന തള്ളൽ ബലം.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><line x1="40" y1="80" x2="420" y2="80" stroke="#0c7c84" stroke-width="2.5" stroke-dasharray="6,3"/><line x1="230" y1="70" x2="230" y2="105" stroke="#900c3f" stroke-width="3"/><line x1="230" y1="145" x2="230" y2="120" stroke="#0c7c84" stroke-width="3"/><text x="230" y="170" fill="#1c3144" font-size="12" font-weight="700" text-anchor="middle">Equilibrium: W = Δ</text></svg>`
      },
      {
        id: "metacenter",
        titleEn: "METACENTER & METACENTRIC HEIGHT (GM)",
        titleMl: "മെറ്റാസെന്ററും ജി-എം (GM) ഉയരവും",
        formula: "GM = KM - KG = (KB + BM) - KG",
        defEn: "The pivotal stability measure. The metacenter (M) is the intersection between the vertical buoyancy line and centerline at small heel angles. A positive GM (GM > 0) guarantees upright stability.",
        defMl: "കപ്പൽ ചായുമ്പോൾ ബോയൻസി ബലരേഖ മധ്യരേഖയുമായി സംഗമിക്കുന്ന ബിന്ദുവാണ് മെറ്റാസെന്റർ (M). GM പോസിറ്റീവ് ആണെങ്കിൽ മാത്രമേ കപ്പൽ സുരക്ഷിതമായി നിവർന്നുനിൽക്കൂ.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><circle cx="230" cy="35" r="5" fill="#d4a34b"/><circle cx="230" cy="75" r="5" fill="#900c3f"/><circle cx="230" cy="115" r="5" fill="#0c7c84"/><line x1="210" y1="35" x2="210" y2="75" stroke="#900c3f" stroke-width="2.5"/><text x="200" y="58" fill="#900c3f" font-size="12" font-weight="800" text-anchor="end">GM</text></svg>`
      },
      {
        id: "righting-lever",
        titleEn: "RIGHTING LEVER (GZ)",
        titleMl: "റൈറ്റിംഗ് ലിവർ (GZ)",
        formula: "Righting Moment = Displacement (Δ) × GZ",
        defEn: "The perpendicular horizontal distance from the center of gravity (G) to the upward line of buoyant action passing through B'. Creates the restoring moment returning the ship to upright.",
        defMl: "കപ്പൽ ചായുമ്പോൾ അതിനെ പൂർവ്വസ്ഥിതിയിലേക്ക് തിരിച്ചുകൊണ്ടുവരാൻ പ്രവർത്തിക്കുന്ന തിരിച്ചുകൊണ്ടുപോകുന്ന ലിവർ ദൂരം.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><line x1="220" y1="80" x2="270" y2="80" stroke="#900c3f" stroke-width="3"/><text x="245" y="72" fill="#900c3f" font-size="12" font-weight="800" text-anchor="middle">GZ</text></svg>`
      }
    ]
  },
  {
    id: "folder-4",
    number: "4",
    titleEn: "Structural Components & Framing",
    titleMl: "സ്ട്രക്ചറൽ ഘടകങ്ങൾ & ഫ്രെയിമിംഗ്",
    desc: "The steel anatomy of a ship: Flat Plate Keel, floors, longitudinal stiffeners, transverse web frames, watertight bulkheads, and double bottoms.",
    masterDiagramSvg: `
      <svg viewBox="0 0 880 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="10" width="850" height="210" rx="10" fill="#fdfaf3" stroke="#ebd9ab" stroke-width="1.5"/>
        <g transform="translate(160, 20)">
          <rect x="0" y="30" width="560" height="12" fill="#10345c"/>
          <rect x="0" y="30" width="14" height="135" fill="#10345c"/>
          <rect x="546" y="30" width="14" height="135" fill="#10345c"/>
          <rect x="40" y="130" width="480" height="10" fill="#2c3e50"/>
          <rect x="0" y="155" width="560" height="14" fill="#10345c"/>
          <rect x="250" y="153" width="60" height="18" fill="#900c3f" stroke="#d4a34b" stroke-width="1.5"/>
          <text x="280" y="166" fill="#ffffff" font-size="9" font-weight="800" text-anchor="middle">FLAT KEEL</text>
        </g>
      </svg>
    `,
    terms: [
      {
        id: "keel",
        titleEn: "FLAT PLATE KEEL (FK)",
        titleMl: "കീൽ (കപ്പലിന്റെ പ്രധാന നട്ടെല്ല്)",
        formula: "Rule Scantling: Keel plate thickness t_k ≥ t_bottom + 2.0 mm",
        defEn: "The central, thickest structural steel plate situated at the bottom of the hull along the centerline from stem to stern. Functioning as the primary structural spine, it withstands severe global longitudinal bending stresses.",
        defMl: "കപ്പലിന്റെ അടിത്തട്ടിൽ നടുവിലായി നീളത്തിൽ പോകുന്ന ഏറ്റവും കട്ടി കൂടിയ സ്റ്റീൽ പ്ലേറ്റ്. കപ്പലിന്റെ പ്രധാന നട്ടെല്ലായി ഇത് പ്രവർത്തിക്കുന്നു.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><rect x="40" y="110" width="380" height="14" fill="#a4b0be"/><rect x="180" y="107" width="100" height="20" fill="#900c3f" stroke="#d4a34b" stroke-width="2"/><text x="230" y="121" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">FLAT PLATE KEEL</text></svg>`
      },
      {
        id: "frames",
        titleEn: "TRANSVERSE FRAMES & WEBS",
        titleMl: "ഫ്രെയിമുകളും വെബ് ഫ്രെയിമുകളും",
        formula: "Frame Modulus Z ≥ c × s × l × h × k",
        defEn: "Transverse rib-like structural members welded to the outer shell plating at regular intervals to maintain the hull cross-sectional shape and resist crushing water pressure.",
        defMl: "കപ്പലിന്റെ വാരിയെല്ലുകൾ പോലെ വശങ്ങളിൽ താങ്ങ് നൽകുന്ന ലംബമായ സ്റ്റീൽ ഘടകങ്ങൾ.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><rect x="60" y="30" width="16" height="120" fill="#10345c"/><polygon points="76,40 160,60 160,120 76,140" fill="#900c3f"/><text x="120" y="95" fill="#ffffff" font-size="11" font-weight="800">WEB</text></svg>`
      },
      {
        id: "bulkheads",
        titleEn: "WATERTIGHT BULKHEADS",
        titleMl: "വാട്ടർടൈറ്റ് ബൾക്ക്ഹെഡുകൾ",
        formula: "SOLAS 1-Compartment / 2-Compartment Flood Subdivision",
        defEn: "Heavy transverse or longitudinal steel partitions extending vertically from the double bottom to the freeboard deck to restrict flooding and contain fire.",
        defMl: "കപ്പലിന്റെ ഉൾഭാഗത്തെ പ്രത്യേക അറകളായി തിരിക്കുന്ന കട്ടി കൂടിയ സ്റ്റീൽ ചുവരുകൾ.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><line x1="230" y1="20" x2="230" y2="150" stroke="#900c3f" stroke-width="6"/><text x="120" y="85" fill="#10345c" font-size="12" font-weight="700">Cargo Hold 1</text><text x="340" y="85" fill="#10345c" font-size="12" font-weight="700">Cargo Hold 2</text></svg>`
      }
    ]
  },
  {
    id: "folder-5",
    number: "5",
    titleEn: "Ship Resistance, Propulsion & Maneuvering",
    titleMl: "റെസിസ്റ്റൻസ്, പ്രൊപ്പൽഷൻ & കൺട്രോൾ",
    desc: "Hydrodynamic performance: Total Drag, Propeller Thrust, Rudder Steering, Trim, Bulbous Bow, and Bilge Keels.",
    masterDiagramSvg: `
      <svg viewBox="0 0 880 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="10" width="850" height="210" rx="10" fill="#fdfaf3" stroke="#ebd9ab" stroke-width="1.5"/>
        <g transform="translate(60, 20)">
          <path d="M 120 70 L 150 140 L 640 140 L 700 80 L 715 115 L 700 140 L 640 140 Z" fill="#10345c"/>
          <circle cx="130" cy="135" r="18" fill="#d4a34b" stroke="#900c3f" stroke-width="2"/>
          <line x1="130" y1="135" x2="200" y2="135" stroke="#900c3f" stroke-width="3.5"/>
          <text x="170" y="125" fill="#900c3f" font-size="11" font-weight="800">Thrust (T)</text>
          <path d="M 700 80 C 740 100 735 140 700 140" fill="#900c3f"/>
          <text x="715" y="60" fill="#900c3f" font-size="10.5" font-weight="800" text-anchor="middle">Bulbous Bow</text>
        </g>
      </svg>
    `,
    terms: [
      {
        id: "resistance",
        titleEn: "SHIP RESISTANCE (TOTAL DRAG)",
        titleMl: "റെസിസ്റ്റൻസ് (കപ്പലിന്റെ തടസ്സ ബലം)",
        formula: "Rt = Rf (Frictional) + Rw (Wave-making) + Rapp",
        defEn: "The total hydrodynamic force opposing the ship's forward progress through water, comprising skin friction in the boundary layer and wave-making drag.",
        defMl: "കപ്പൽ വെള്ളത്തിലൂടെ മുന്നോട്ട് പോകുമ്പോൾ അനുഭവപ്പെടുന്ന ആകെ തടസ്സ ബലം.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><path d="M 60 90 L 90 135 L 350 135 L 390 80 Z" fill="#10345c"/><line x1="410" y1="95" x2="350" y2="95" stroke="#900c3f" stroke-width="3"/><text x="385" y="88" fill="#900c3f" font-size="12" font-weight="800">Total Drag (Rt)</text></svg>`
      },
      {
        id: "propeller",
        titleEn: "PROPELLER & THRUST",
        titleMl: "പ്രൊപ്പല്ലറും ത്രസ്റ്റും",
        formula: "Thrust T = ṁ × (V_exit - V_inlet)",
        defEn: "Rotating hydrodynamic helical blades driven by the main engine shaft, creating axial thrust force pushing the vessel forward against hull drag.",
        defMl: "കപ്പലിന്റെ പ്രധാന എഞ്ചിൻ തിരിക്കുന്ന പങ്കായം; ഇത് കപ്പലിനെ മുന്നോട്ട് നയിക്കുന്ന ത്രസ്റ്റ് ഉണ്ടാക്കുന്നു.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><circle cx="160" cy="90" r="14" fill="#1c3144"/><ellipse cx="160" cy="55" rx="14" ry="24" fill="#d4a34b"/><line x1="210" y1="90" x2="290" y2="90" stroke="#900c3f" stroke-width="3.5"/><text x="250" y="78" fill="#900c3f" font-size="12" font-weight="800">Thrust (T)</text></svg>`
      },
      {
        id: "bulbous-bow",
        titleEn: "BULBOUS BOW",
        titleMl: "ബൾബസ് ബോ (കപ്പലിന്റെ മൂക്ക്)",
        formula: "Wave Interference Cancellation",
        defEn: "A protruding bulb placed low at the ship's bow below the waterline that creates its own wave system canceling out the hull's primary bow wave.",
        defMl: "കപ്പലിന്റെ മൂക്കിൻ താഴെയുള്ള ഉരുണ്ട ഭാഗം; തിരമാലകളെ വെട്ടിമാറ്റി കപ്പലിന്റെ വേഗത കൂട്ടാൻ സഹായിക്കുന്നു.",
        diagramSvg: `<svg viewBox="0 0 460 180" width="100%" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="460" height="180" fill="#fcf9f2" rx="8"/><path d="M 120 40 L 120 140 L 300 140 C 370 140 370 70 300 70 L 260 40 Z" fill="#10345c"/><circle cx="330" cy="105" r="28" fill="#900c3f" stroke="#d4a34b" stroke-width="2"/><text x="330" y="42" fill="#900c3f" font-size="11" font-weight="800" text-anchor="middle">Cancelling Wave</text></svg>`
      }
    ]
  }
];
