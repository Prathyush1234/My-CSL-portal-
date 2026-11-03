export interface ShipTerm {
  id: string;
  term: string;
  termMl: string;
  category: 'ship_parts' | 'drawing_terms';
  categoryLabel: { en: string; ml: string };
  locationOrContext: { en: string; ml: string }; // e.g. "Front of ship", "Bottom right of drawing"
  meaning: { en: string; ml: string };
  simpleExample: { en: string; ml: string };
  abbreviation?: string;
  badge?: string;
}

export const SHIP_PRACTICAL_CATEGORIES = [
  { id: 'all', labelEn: 'All Terms', labelMl: 'എല്ലാം' },
  { id: 'ship_parts', labelEn: '🚢 Words Used on Ships (കപ്പലിലെ വാക്കുകൾ)', labelMl: '🚢 കപ്പലിലെ വാക്കുകൾ' },
  { id: 'drawing_terms', labelEn: '📐 Words in Ship Drawings (ഡ്രോയിംഗ് വാക്കുകൾ)', labelMl: '📐 ഡ്രോയിംഗ് വാക്കുകൾ' },
] as const;

export const SHIP_DICTIONARY_DATA: ShipTerm[] = [
  // ==========================================
  // SECTION 1: WORDS USED ON SHIPS (കപ്പലിൽ ഉപയോഗിക്കുന്ന വാക്കുകൾ)
  // ==========================================
  {
    id: 'bow',
    term: 'Bow',
    termMl: 'ബോ (മുൻഭാഗം)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Front-most part of the ship', ml: 'കപ്പലിന്റെ ഏറ്റവും മുൻഭാഗം' },
    meaning: {
      en: 'The forward part of the hull of a ship that cuts through the water as the vessel moves forward.',
      ml: 'കപ്പൽ മുന്നോട്ട് നീങ്ങുമ്പോൾ വെള്ളം കീറിമുറിച്ചു പോകുന്ന കപ്പലിന്റെ ഏറ്റവും മുൻഭാഗം.'
    },
    simpleExample: {
      en: 'The anchor and mooring winches are installed on the bow deck.',
      ml: 'കപ്പലിന്റെ നങ്കൂരവും വിഞ്ചുകളും ഉറപ്പിച്ചിരിക്കുന്നത് ബോ ഭാഗത്താണ്.'
    },
    badge: 'HULL'
  },
  {
    id: 'stern',
    term: 'Stern',
    termMl: 'സ്റ്റേൺ (പിൻഭാഗം)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Back-most part of the ship', ml: 'കപ്പലിന്റെ ഏറ്റവും പിൻഭാഗം' },
    meaning: {
      en: 'The aftermost or rear part of the ship where the propeller and rudder are located.',
      ml: 'കപ്പലിന്റെ ഏറ്റവും പിൻഭാഗം. ഇവിടെയാണ് പ്രൊപ്പല്ലറും റഡ്ഡറും (തിരിക്കാനുള്ള പങ്കായം) ഘടിപ്പിച്ചിരിക്കുന്നത്.'
    },
    simpleExample: {
      en: 'The propeller pushes water behind the stern to drive the ship forward.',
      ml: 'പ്രൊപ്പല്ലർ കറങ്ങി കപ്പലിനെ മുന്നോട്ട് തള്ളുന്നത് സ്റ്റേൺ ഭാഗത്ത് നിന്നാണ്.'
    },
    badge: 'HULL'
  },
  {
    id: 'port-side',
    term: 'Port Side',
    termMl: 'പോർട്ട് സൈഡ് (ഇടത് വശം - ചുവപ്പ്)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Left side when facing the bow', ml: 'കപ്പലിന്റെ മുൻഭാഗത്തേക്ക് നോക്കുമ്പോൾ ഇടത് വശം' },
    meaning: {
      en: 'The entire left-hand side of the vessel when facing forward towards the bow. Marked with a Red navigation light at night.',
      ml: 'കപ്പലിന്റെ മുൻവശത്തേക്ക് നോക്കി നിൽക്കുമ്പോൾ കാണുന്ന ഇടത് വശം. രാത്രിയിൽ ഇവിടെ ചുവപ്പ് നിറത്തിലുള്ള നാവിഗേഷൻ ലൈറ്റ് കത്തും.'
    },
    simpleExample: {
      en: 'Always remember: Port is Left and has a Red light.',
      ml: 'പോർട്ട് എന്നാൽ ഇടത് വശം; രാത്രി ചുവപ്പ് ലൈറ്റാണ് ഇതിന്റെ അടയാളം.'
    },
    badge: 'DIRECTION'
  },
  {
    id: 'starboard-side',
    term: 'Starboard Side',
    termMl: 'സ്റ്റാർബോർഡ് സൈഡ് (വലത് വശം - പച്ച)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Right side when facing the bow', ml: 'കപ്പലിന്റെ മുൻഭാഗത്തേക്ക് നോക്കുമ്പോൾ വലത് വശം' },
    meaning: {
      en: 'The entire right-hand side of the vessel when facing forward. Marked with a Green navigation light at night.',
      ml: 'കപ്പലിന്റെ മുൻവശത്തേക്ക് നോക്കി നിൽക്കുമ്പോൾ കാണുന്ന വലത് വശം. രാത്രിയിൽ ഇവിടെ പച്ച നിറത്തിലുള്ള നാവിഗേഷൻ ലൈറ്റ് കത്തും.'
    },
    simpleExample: {
      en: 'Starboard side pilot ladder is rigged for the Cochin port pilot.',
      ml: 'കൊച്ചി പോർട്ട് പൈലറ്റിന് കയറാൻ സ്റ്റാർബോർഡ് (വലത്) വശത്ത് ഗോവണി തയ്യാറാക്കുന്നു.'
    },
    badge: 'DIRECTION'
  },
  {
    id: 'bridge',
    term: 'Bridge / Wheelhouse',
    termMl: 'ബ്രിഡ്ജ് / വീൽഹൗസ് (നിയന്ത്രണ മുറി)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Topmost command room with 360° windows', ml: 'കപ്പലിന്റെ മുകൾത്തട്ടിലുള്ള കൺട്രോൾ റൂം' },
    meaning: {
      en: 'The room from which the ship is commanded and steered. Contains radar, gyro compass, engine controls, and navigation consoles.',
      ml: 'ക്യാപ്റ്റനും ഓഫീസർമാരും കപ്പൽ നിയന്ത്രിക്കുന്ന പ്രധാന മുറി. റഡാർ, കപ്പൽ തിരിക്കാനുള്ള വീൽ, സ്പീഡ് കൺട്രോൾ എന്നിവ ഇവിടെയാണ്.'
    },
    simpleExample: {
      en: 'The duty officer monitors ship speed and radar from the navigation bridge.',
      ml: 'ഡ്യൂട്ടി ഓഫീസർ ബ്രിഡ്ജിൽ ഇരുന്നാണ് മറ്റ് കപ്പലുകളെ നിരീക്ഷിക്കുന്നതും വേഗത നിയന്ത്രിക്കുന്നതും.'
    },
    badge: 'NAVIGATION'
  },
  {
    id: 'keel',
    term: 'Keel',
    termMl: 'കീൽ (കപ്പലിന്റെ നട്ടെല്ല്)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Centerline at the very bottom of the hull', ml: 'കപ്പലിന്റെ അടിത്തട്ടിന്റെ നടുഭാഗം' },
    meaning: {
      en: 'The central longitudinal beam or heavy steel plate along the bottom of the ship, acting like the backbone of the vessel.',
      ml: 'കപ്പലിന്റെ അടിത്തട്ടിൽ നീളത്തിൽ നടുവിലായി നിർമ്മിക്കുന്ന ഏറ്റവും പ്രധാനപ്പെട്ട സ്റ്റീൽ അടിത്തറ (നട്ടെല്ല്).'
    },
    simpleExample: {
      en: 'Shipbuilding formally begins with the Keel Laying ceremony in CSL drydock.',
      ml: 'CSL ഡ്രൈഡോക്കിൽ ആദ്യത്തെ കീൽ പ്ലേറ്റ് ഉറപ്പിച്ചാണ് കപ്പൽ നിർമ്മാണം തുടങ്ങുന്നത് (Keel Laying).'
    },
    badge: 'STRUCTURE'
  },
  {
    id: 'hull',
    term: 'Hull',
    termMl: 'ഹൾ (കപ്പലിന്റെ പുറംതോട്)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Main floating body of the ship', ml: 'കപ്പലിന്റെ പ്രധാന സ്റ്റീൽ ബോഡി' },
    meaning: {
      en: 'The watertight outer body and shell of the ship that floats in the water, excluding masts, deckhouses, and engines.',
      ml: 'വെള്ളത്തിൽ പൊങ്ങിനിൽക്കുന്ന കപ്പലിന്റെ പ്രധാന സ്റ്റീൽ പുറംതോട്. ഇതിനുള്ളിലാണ് കാർഗോ അറകളും യന്ത്രങ്ങളും ഉള്ളത്.'
    },
    simpleExample: {
      en: 'Workers in CSL Drydock 1 are cleaning and painting the outer hull.',
      ml: 'CSL ഡോക്കിൽ തൊഴിലാളികൾ ഹൾ പെയിന്റ് ചെയ്ത് മിനുസപ്പെടുത്തുന്നു.'
    },
    badge: 'HULL'
  },
  {
    id: 'deck',
    term: 'Deck',
    termMl: 'ഡെക്ക് (തട്ട് / നില)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Horizontal floors across the ship', ml: 'കപ്പലിലെ ഓരോ നിലകൾ' },
    meaning: {
      en: 'A permanent horizontal covering or floor over the ship’s hull or compartment (e.g., Main Deck, Upper Deck, Engine Room Floor).',
      ml: 'കെട്ടിടങ്ങളിലെ നിലകൾ പോലെ കപ്പലിലുള്ള സ്റ്റീൽ തട്ടുകൾ (ഉദാഹരണത്തിന്: മെയിൻ ഡെക്ക്, കാർഗോ ഡെക്ക്).'
    },
    simpleExample: {
      en: 'Wear safety helmet and boots when working on the open main deck.',
      ml: 'മെയിൻ ഡെക്കിൽ ജോലി ചെയ്യുമ്പോൾ ഹെൽമെറ്റും സേഫ്റ്റി ബൂട്ടും നിർബന്ധമാണ്.'
    },
    badge: 'STRUCTURE'
  },
  {
    id: 'bulkhead',
    term: 'Bulkhead',
    termMl: 'ബൾക്ക്ഹെഡ് (ഭിത്തി / വേർതിരിവ്)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Vertical walls dividing ship compartments', ml: 'കപ്പലിന്റെ അറകൾ തമ്മിൽ വേർതിരിക്കുന്ന സ്റ്റീൽ ഭിത്തി' },
    meaning: {
      en: 'An upright vertical steel partition wall separating compartments, tanks, and cabins. Watertight bulkheads prevent floodwater from spreading.',
      ml: 'കപ്പലിനകത്തെ മുറികളും അറകളും തമ്മിൽ തിരിക്കുന്ന ബലമുള്ള സ്റ്റീൽ ഭിത്തികൾ. കപ്പലിൽ ഒരിടത്ത് തുളവീണാൽ വെള്ളം മറ്റുള്ളിടത്തേക്ക് പോകാതിരിക്കാൻ ഇത് സഹായിക്കുന്നു.'
    },
    simpleExample: {
      en: 'The collision bulkhead at the forward end protects the ship in head-on accidents.',
      ml: 'മുൻഭാഗത്തെ കൊളീഷൻ ബൾക്ക്ഹെഡ് കപ്പൽ എവിടെയെങ്കിലും ഇടിച്ചാലും വെള്ളം കയറാതെ സംരക്ഷിക്കുന്നു.'
    },
    badge: 'STRUCTURE'
  },
  {
    id: 'ballast-tank',
    term: 'Ballast Tank',
    termMl: 'ബാലസ്റ്റ് ടാങ്ക് (വെള്ളം നിറയ്ക്കുന്ന അറ)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Double bottom and side wing compartments', ml: 'കപ്പലിന്റെ അടിത്തട്ടിലും വശങ്ങളിലുമുള്ള ടാങ്കുകൾ' },
    meaning: {
      en: 'Tanks filled with sea water to give the empty ship weight, stability, and proper immersion when carrying no cargo.',
      ml: 'ചരക്കില്ലാതെ കപ്പൽ പോകുമ്പോൾ മറിഞ്ഞുപോകാതിരിക്കാനും ബാലൻസ് കിട്ടാനും കടൽവെള്ളം നിറച്ചുവെക്കുന്ന പ്രത്യേക ടാങ്കുകൾ.'
    },
    simpleExample: {
      en: 'Pumping ballast water out lowers the draft when entering shallow berths.',
      ml: 'ആഴം കുറഞ്ഞ ബെർത്തിലേക്ക് കയറുമ്പോൾ ബാലസ്റ്റ് വെള്ളം പമ്പ് ചെയ്ത് കളയുന്നു.'
    },
    badge: 'SAFETY'
  },
  {
    id: 'bilge',
    term: 'Bilge',
    termMl: 'ബിൽജ് (അടിത്തട്ടിലെ അഴുക്കുവെള്ളം)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Lowest internal section of the ship hull', ml: 'എൻജിൻ റൂമിന്റെ ഏറ്റവും അടിത്തട്ട്' },
    meaning: {
      en: 'The lowest inner part of the ship where leaked water, oil, and condensation collect before being pumped to a bilge water separator.',
      ml: 'കപ്പലിന്റെ അടിഭാഗത്ത് ചോരുന്ന വെള്ളവും ഓയിലും വന്നുചേരുന്ന ഏറ്റവും താഴ്ന്ന ഇടം. ഇവിടുത്തെ വെള്ളം ശുദ്ധീകരിച്ചേ കടലിലേക്ക് ഒഴുക്കാവൂ.'
    },
    simpleExample: {
      en: 'Bilge wells in the engine room must be kept clean and monitored for oil leaks.',
      ml: 'എൻജിൻ റൂമിലെ ബിൽജ് വെല്ലുകളിൽ ഓയിൽ ലീക്കുണ്ടോ എന്ന് ദിവസവും പരിശോധിക്കുന്നു.'
    },
    badge: 'ENGINE'
  },
  {
    id: 'propeller',
    term: 'Propeller / Screw',
    termMl: 'പ്രൊപ്പല്ലർ (കപ്പലിന്റെ ഫാൻ / പങ്കായം)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Underwater at the stern', ml: 'പിൻഭാഗത്ത് വെള്ളത്തിനടിയിൽ' },
    meaning: {
      en: 'A rotating fan with curved bronze blades driven by the main engine shaft to push water backwards and propel the vessel forward.',
      ml: 'എൻജിൻ കറക്കുമ്പോൾ വെള്ളം പിന്നിലേക്ക് തള്ളി കപ്പലിനെ മുന്നോട്ട് പായിക്കുന്ന വലിയ വെങ്കല ഫാൻ.'
    },
    simpleExample: {
      en: 'CSL fitted a 5-bladed controllable pitch propeller on the new tugboat.',
      ml: 'പുതിയ ടഗ് ബോട്ടിനായി 5 ബ്ലേഡുകളുള്ള പ്രൊപ്പല്ലറാണ് CSL ഘടിപ്പിച്ചത്.'
    },
    badge: 'PROPULSION'
  },
  {
    id: 'rudder',
    term: 'Rudder',
    termMl: 'റഡ്ഡർ (ദിശ തിരിക്കുന്ന പങ്കായം)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Directly behind the propeller at the stern', ml: 'പ്രൊപ്പല്ലറിന് തൊട്ടുപിന്നിൽ' },
    meaning: {
      en: 'A flat vertical metal blade at the stern turned left or right to steer the ship in water.',
      ml: 'കപ്പലിന്റെ ദിശ ഇടത്തോട്ടും വലത്തോട്ടും മാറ്റാൻ തിരിക്കുന്ന പരന്ന സ്റ്റീൽ പങ്കായം.'
    },
    simpleExample: {
      en: 'Turning the steering wheel in the bridge turns the rudder at the stern.',
      ml: 'ബ്രിഡ്ജിലെ സ്റ്റിയറിംഗ് തിരിക്കുമ്പോൾ അടിയിലെ റഡ്ഡർ തിരിഞ്ഞ് കപ്പലിന്റെ ദിശ മാറുന്നു.'
    },
    badge: 'PROPULSION'
  },
  {
    id: 'anchor-windlass',
    term: 'Anchor & Windlass',
    termMl: 'ആങ്കറും വിൻഡ്ലാസ്സും (നങ്കൂരവും വിഞ്ചും)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Forecastle deck at the bow', ml: 'മുൻഭാഗത്തെ ഫോർകാസിൽ ഡെക്കിൽ' },
    meaning: {
      en: 'The heavy steel anchor dropped to sea floor to hold the ship in position, and the motorized windlass winch that lowers/lifts the chain.',
      ml: 'കപ്പൽ കടലിൽ ഒരിടത്ത് ഉറപ്പിച്ചു നിർത്താൻ താഴേക്ക് ഇടുന്ന ഭാരമേറിയ നങ്കൂരവും, അതിന്റെ ചങ്ങല വലിച്ചുകയറ്റുന്ന വിഞ്ചും.'
    },
    simpleExample: {
      en: 'Drop the port anchor in Kochi outer anchorage while waiting for drydock berth.',
      ml: 'ഡ്രൈഡോക്ക് ഒഴിയുന്നത് വരെ കൊച്ചി പുറംകടലിൽ കപ്പൽ നങ്കൂരമിട്ട് കിടക്കുന്നു.'
    },
    badge: 'DECK'
  },
  {
    id: 'bollard',
    term: 'Bollard & Mooring Lines',
    termMl: 'ബൊള്ളാർഡ് (കയർ കെട്ടുന്ന സ്റ്റീൽ പോസ്റ്റ്)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Along ship deck edges and shipyard quays', ml: 'കപ്പലിന്റെ വശങ്ങളിലും വാർഫിലും' },
    meaning: {
      en: 'Short, thick steel posts on deck and jetty to which thick mooring ropes are secured to tie the ship safely to the dock.',
      ml: 'കപ്പൽ കരയിലോ ജെട്ടിയിലോ അനങ്ങാതെ കെട്ടിയിടാൻ വടം ചുറ്റി ഉറപ്പിക്കുന്ന തടിച്ച സ്റ്റീൽ കുറ്റികൾ.'
    },
    simpleExample: {
      en: 'Secure the forward spring line tightly onto the quay bollard.',
      ml: 'ജെട്ടിയിലെ ബൊള്ളാർഡിലേക്ക് കയർ വലിച്ച് മുറുക്കി കെട്ടുക.'
    },
    badge: 'DECK'
  },
  {
    id: 'cofferdam',
    term: 'Cofferdam',
    termMl: 'കോഫർഡാം (സുരക്ഷാ വിടവ് / വേർതിരിവ്)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Between fuel tanks and freshwater or cargo tanks', ml: 'ഓയിൽ ടാങ്കിനും ശുദ്ധജല ടാങ്കിനും ഇടയിൽ' },
    meaning: {
      en: 'A narrow empty isolating void space between two bulkheads to prevent fuel or waste from leaking into cargo or drinking water.',
      ml: 'രണ്ട് ടാങ്കുകൾക്കിടയിൽ ഓയിലോ അഴുക്കോ കുടിവെള്ളത്തിലോ ചരക്കിലോ കലരാതിരിക്കാൻ നൽകുന്ന ഇടുങ്ങിയ ഒഴിഞ്ഞ സുരക്ഷാ വിടവ്.'
    },
    simpleExample: {
      en: 'Never enter a cofferdam without gas-free check and oxygen level testing.',
      ml: 'ഓക്സിജൻ അളവ് പരിശോധിക്കാതെയും ഗ്യാസ് ഇല്ലെന്ന് ഉറപ്പാക്കാതെയും കോഫർഡാമിൽ ഇറങ്ങരുത്.'
    },
    badge: 'SAFETY'
  },
  {
    id: 'scupper',
    term: 'Scupper',
    termMl: 'സ്കപ്പർ (ഡെക്കിലെ ഡ്രെയിനേജ് ദ്വാരം)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'At deck corners and edges near the bulwark', ml: 'ഡെക്കിന്റെ വശങ്ങളിൽ താഴെയായി' },
    meaning: {
      en: 'An opening or drain pipe on the deck edge allowing rainwater and green seawater to wash off overboard quickly.',
      ml: 'ഡെക്കിൽ മഴവെള്ളമോ തിരമാലകളോ വീണാൽ അത് ഉടൻ തന്നെ കടലിലേക്ക് ഒഴുകിപ്പോകാൻ വശങ്ങളിൽ നൽകിയിട്ടുള്ള ഡ്രെയിനേജ് ദ്വാരം.'
    },
    simpleExample: {
      en: 'Keep deck scuppers free from debris to prevent water accumulation.',
      ml: 'ഡെക്കിൽ വെള്ളം കെട്ടിനിൽക്കാതിരിക്കാൻ സ്കപ്പർ ദ്വാരങ്ങളിൽ അഴുക്ക് അടിഞ്ഞുകൂടാതെ സൂക്ഷിക്കുക.'
    },
    badge: 'DECK'
  },
  {
    id: 'hatch-cover',
    term: 'Cargo Hatch & Hatch Cover',
    termMl: 'കാർഗോ ഹാച്ച് & അടപ്പ് (Hatch Cover)',
    category: 'ship_parts',
    categoryLabel: { en: 'Ship Parts', ml: 'കപ്പലിലെ ഭാഗങ്ങൾ' },
    locationOrContext: { en: 'Openings on the main deck above cargo holds', ml: 'കാർഗോ അറകൾക്ക് മുകളിൽ ഡെക്കിൽ' },
    meaning: {
      en: 'Large rectangular openings through which cargo is loaded into holds, sealed by heavy watertight steel hatch covers.',
      ml: 'ചരക്കുകൾ അടിത്തട്ടിലേക്ക് ഇറക്കാൻ ഡെക്കിൽ നൽകുന്ന വലിയ വാതിലും, കടൽവെള്ളം ഉള്ളിലേക്ക് കയറാതെ അടയ്ക്കുന്ന ബലമുള്ള സ്റ്റീൽ അടപ്പുകളും.'
    },
    simpleExample: {
      en: 'Hatch covers are hydraulically closed before sailing into rough seas.',
      ml: 'കടലിലേക്ക് പുറപ്പെടുന്നതിന് മുൻപ് ഹൈഡ്രോളിക് സിസ്റ്റം വഴി ഹാച്ച് കവറുകൾ ഭദ്രമായി അടയ്ക്കുന്നു.'
    },
    badge: 'CARGO'
  },

  // ==========================================
  // SECTION 2: WORDS USED IN SHIP DRAWINGS & BLUEPRINTS (ഡ്രോയിംഗുകളിൽ ഉപയോഗിക്കുന്ന വാക്കുകൾ)
  // ==========================================
  {
    id: 'ga-plan',
    term: 'GA Plan (General Arrangement)',
    termMl: 'GA പ്ലാൻ (ജനറൽ അറേഞ്ച്‌മെന്റ് പ്ലാൻ)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Master drawing sheet of the entire vessel', ml: 'കപ്പലിന്റെ സമ്പൂർണ്ണ മാസ്റ്റർ പ്ലാൻ' },
    meaning: {
      en: 'The complete master blueprint showing all decks, compartments, cabins, cargo spaces, lifeboats, and equipment layout of the whole ship.',
      ml: 'കപ്പലിന്റെ എല്ലാ ഡെക്കുകളും, മുറികളും, എൻജിൻ റൂമും, കാർഗോ അറകളും എവിടെയൊക്കെയാണെന്ന് കാണിക്കുന്ന സമ്പൂർണ്ണ മാസ്റ്റർ പ്ലാൻ.'
    },
    simpleExample: {
      en: 'Check the GA Plan to locate the paint locker and battery room.',
      ml: 'പെയിന്റ് റൂമും ബാറ്ററി റൂമും എവിടെയാണെന്ന് കണ്ടെത്താൻ GA പ്ലാൻ നോക്കുക.'
    },
    abbreviation: 'GA',
    badge: 'BLUEPRINT'
  },
  {
    id: 'fr-frame-number',
    term: 'Frame Number (FR)',
    termMl: 'ഫ്രെയിം നമ്പർ (FR No.)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Vertical numbered lines along ship length', ml: 'ഡ്രോയിംഗിൽ നീളത്തിൽ നൽകിയിട്ടുള്ള അക്കങ്ങൾ' },
    meaning: {
      en: 'Numbered vertical rib stations along the ship starting from Aft (0) to Forward (e.g., FR 45, FR 120). Tells you the exact longitudinal location of any item.',
      ml: 'കപ്പലിന്റെ പിൻഭാഗം മുതൽ മുൻഭാഗം വരെ നിശ്ചിത അകലത്തിൽ നൽകിയിട്ടുള്ള അക്കങ്ങൾ (ഉദാ: FR 45, FR 90). കപ്പലിലെ ഏതൊരു വസ്തുവിന്റെയും കൃത്യമായ സ്ഥാനം അറിയാൻ ഈ നമ്പർ സഹായിക്കുന്നു.'
    },
    simpleExample: {
      en: 'Welding work is between FR 62 and FR 68 on the starboard side.',
      ml: 'ഫ്രെയിം നമ്പർ 62 മുതൽ 68 വരെയുള്ള ഭാഗത്താണ് വെൽഡിംഗ് ജോലി നടക്കുന്നത്.'
    },
    abbreviation: 'FR / Fr No.',
    badge: 'LOCATION'
  },
  {
    id: 'cl-centerline',
    term: 'Centerline (CL / ℄)',
    termMl: 'സെന്റർലൈൻ (CL - മധ്യരേഖ)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Center axis line splitting port and starboard', ml: 'കപ്പലിന്റെ കൃത്യം നടുവിലൂടെ പോകുന്ന രേഖ' },
    meaning: {
      en: 'The imaginary longitudinal reference line running from bow to stern that divides the vessel into symmetrical Port and Starboard halves.',
      ml: 'കപ്പലിനെ ഇടത് വശമെന്നും (Port) വലത് വശമെന്നും (Starboard) രണ്ടായി തുല്യമായി പകുക്കുന്ന മധ്യരേഖ.'
    },
    simpleExample: {
      en: 'Main engine crankshaft is mounted exactly 0 mm off Centerline (CL).',
      ml: 'മെയിൻ എൻജിൻ കൃത്യമായി സെന്റർലൈനിലാണ് (CL) ഉറപ്പിച്ചിരിക്കുന്നത്.'
    },
    abbreviation: 'CL / ℄',
    badge: 'REFERENCE'
  },
  {
    id: 'bl-baseline',
    term: 'Baseline (BL)',
    termMl: 'ബേസ്‌ലൈൻ (BL - അടിത്തറ റഫറൻസ്)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Bottom-most flat keel datum line', ml: 'കപ്പലിന്റെ ഏറ്റവും അടിത്തട്ടിലെ അടിസ്ഥാന വര' },
    meaning: {
      en: 'The horizontal datum line at the top surface of the flat keel from which all vertical heights in the ship drawing are measured.',
      ml: 'കപ്പലിലെ എല്ലാ ഭാഗങ്ങളുടെയും ഉയരം അളക്കാൻ ഡ്രോയിംഗിൽ ഉപയോഗിക്കുന്ന ഏറ്റവും അടിയിലെ അടിസ്ഥാന വര.'
    },
    simpleExample: {
      en: 'Double bottom tank top is 1600 mm Above Baseline (ABL).',
      ml: 'ഡബിൾ ബോട്ടം ടാങ്കിന്റെ മുകൾഭാഗം ബേസ്‌ലൈനിൽ നിന്നും 1600 mm മുകളിലാണ്.'
    },
    abbreviation: 'BL / ABL',
    badge: 'REFERENCE'
  },
  {
    id: 'thickness-t',
    term: 'Thickness (t / Thk)',
    termMl: 'പ്ലേറ്റ് കനം (Thickness / Thk)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Written next to steel plates: PL 12 Thk', ml: 'സ്റ്റീൽ പ്ലേറ്റുകളുടെ അളവിൽ: PL 16 Thk' },
    meaning: {
      en: 'The thickness of steel plates or web profiles, always specified in millimeters (mm) on shipbuilding drawings.',
      ml: 'കപ്പൽ നിർമ്മാണത്തിൽ ഉപയോഗിക്കുന്ന സ്റ്റീൽ പ്ലേറ്റുകളുടെ കനം (മില്ലിമീറ്ററിൽ - mm). ഉദാ: 12 Thk എന്നാൽ 12 മില്ലിമീറ്റർ കനം.'
    },
    simpleExample: {
      en: 'Bottom shell plating is PL 18 Thk Grade AH36 steel.',
      ml: 'അടിത്തട്ടിലെ പ്ലേറ്റിന് 18 മില്ലിമീറ്റർ കനമുണ്ട് (PL 18 Thk).'
    },
    abbreviation: 't / Thk',
    badge: 'STEEL'
  },
  {
    id: 'stiffener',
    term: 'Stiffener / Longi (L)',
    termMl: 'സ്റ്റിഫ്നർ / ലോഞ്ചിറ്റ്യൂഡിനൽ ബാർ',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Steel angle / bulb flat bars welded on plates', ml: 'പ്ലേറ്റ് വളഞ്ഞുപോകാതിരിക്കാൻ വെൽഡ് ചെയ്യുന്ന ബാർ' },
    meaning: {
      en: 'Secondary steel profiles (flat bars, angles, or bulb flats) welded onto flat steel plates to prevent them from bending or buckling under sea pressure.',
      ml: 'സ്റ്റീൽ പ്ലേറ്റുകൾ കടൽ തിരമാലകളുടെ മർദ്ദത്തിൽ വളഞ്ഞുപോകാതിരിക്കാൻ പ്ലേറ്റിൽ വെൽഡ് ചെയ്തു പിടിപ്പിക്കുന്ന ആംഗിളുകൾ അല്ലെങ്കിൽ ഫ്ലാറ്റ് ബാറുകൾ.'
    },
    simpleExample: {
      en: 'Drawing note: "Deck Longi: L 120x80x8 @ 600mm spacing".',
      ml: 'ഡ്രോയിംഗിൽ: ഡെക്ക് സ്റ്റിഫ്നർ 600 mm അകലത്തിൽ വെൽഡ് ചെയ്യണം എന്ന് രേഖപ്പെടുത്തിയിരിക്കുന്നു.'
    },
    abbreviation: 'STIFF / LONGI',
    badge: 'STEEL'
  },
  {
    id: 'bracket',
    term: 'Bracket (Bkt)',
    termMl: 'ബ്രാക്കറ്റ് (ത്രികോണ സ്റ്റീൽ കഷണം)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'At corners where beams meet bulkheads', ml: 'ബീമും ഭിത്തിയും ചേരുന്ന മൂലകളിൽ' },
    meaning: {
      en: 'A triangular steel plate welded at structural intersections (e.g., where a deck beam meets a vertical frame) to stiffen the joint.',
      ml: 'രണ്ട് സ്റ്റീൽ ബീമുകൾ ചേരുന്ന മൂലകളിൽ ബലം കൂട്ടാൻ വെൽഡ് ചെയ്യുന്ന ത്രികോണ ആകൃതിയിലുള്ള സ്റ്റീൽ കഷണം.'
    },
    simpleExample: {
      en: 'Weld triangular beam brackets with 6 mm continuous fillet welds.',
      ml: 'ഫ്രെയിമുകളുടെ മൂലകളിൽ ബ്രാക്കറ്റുകൾ വെൽഡ് ചെയ്തു ബലപ്പെടുത്തുക.'
    },
    abbreviation: 'BKT',
    badge: 'STEEL'
  },
  {
    id: 'manhole',
    term: 'Manhole (MH)',
    termMl: 'മാൻഹോൾ (ആൾക്ക് ഇറങ്ങാനുള്ള അടപ്പുള്ള ദ്വാരം)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'On tank top plates and double bottom tanks', ml: 'ടാങ്കുകളുടെ മുകളിൽ പ്ലേറ്റിൽ' },
    meaning: {
      en: 'An oval or round access opening (usually 600 x 400 mm) cut into tank plating with a bolted watertight gasketed cover, allowing workers to enter for inspection.',
      ml: 'ടാങ്കുകൾക്കകത്തിറങ്ങി പരിശോധന നടത്താൻ പ്ലേറ്റിൽ വെട്ടുന്ന ഓവൽ ആകൃതിയിലുള്ള ദ്വാരവും ബോൾട്ട് ഇട്ട് മുറുക്കുന്ന അടപ്പും.'
    },
    simpleExample: {
      en: 'Open MH-03 to vent the ballast tank before surveyor inspection.',
      ml: 'സർവേയർ പരിശോധനയ്ക്ക് മുൻപായി മാൻഹോൾ 3 തുറന്ന് വായുസഞ്ചാരം ഉറപ്പാക്കുക.'
    },
    abbreviation: 'MH',
    badge: 'ACCESS'
  },
  {
    id: 'lightening-hole',
    term: 'Lightening Hole',
    termMl: 'ലൈറ്റനിംഗ് ഹോൾ (ഭാരം കുറയ്ക്കാനുള്ള ദ്വാരം)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Cut in internal web frames and floor plates', ml: 'ഫ്രെയിമുകളിലും അടിത്തട്ടിലെ പ്ലേറ്റുകളിലും' },
    meaning: {
      en: 'Large circular or oval cutouts made in non-watertight internal steel webs to reduce the ship’s dead steel weight without reducing strength.',
      ml: 'കപ്പലിന്റെ ബലത്തെ ബാധിക്കാതെ അനാവശ്യ ഭാരം കുറയ്ക്കാനായി ഉൾവശത്തെ സ്റ്റീൽ പ്ലേറ്റുകളിൽ വെട്ടുന്ന വലിയ വൃത്താകൃതിയിലുള്ള ദ്വാരങ്ങൾ.'
    },
    simpleExample: {
      en: 'Pipes pass through the lightening holes of the double bottom floors.',
      ml: 'ഡബിൾ ബോട്ടത്തിലെ ലൈറ്റനിംഗ് ഹോളുകൾ വഴിയാണ് പൈപ്പുകൾ കടത്തിവിടുന്നത്.'
    },
    abbreviation: 'LH',
    badge: 'STRUCTURE'
  },
  {
    id: 'drain-air-hole',
    term: 'Drain & Air Hole (Limber Hole)',
    termMl: 'ഡ്രെയിൻ ഹോൾ & എയർ ഹോൾ',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Bottom and top corners of stiffeners and floors', ml: 'സ്റ്റിഫ്നറുകളുടെ താഴെയും മുകളിലുമുള്ള ചെറിയ ദ്വാരങ്ങൾ' },
    meaning: {
      en: 'Small semicircular cutouts at the bottom corner of frames (drain hole) for water/oil drainage, and at the top corner (air hole) for air escape.',
      ml: 'വെള്ളം എളുപ്പത്തിൽ ഒഴുകിപ്പോകാൻ ഫ്രെയിമുകളുടെ താഴെ വെട്ടുന്ന ചെറിയ ഡ്രെയിൻ ദ്വാരവും, വായു തങ്ങിനിൽക്കാതിരിക്കാൻ മുകളിൽ വെട്ടുന്ന എയർ ഹോളും.'
    },
    simpleExample: {
      en: 'Ensure drain holes are not choked with welding slag or rust.',
      ml: 'ഡ്രെയിൻ ഹോളുകളിൽ വെൽഡിംഗ് വേസ്റ്റോ തുരുമ്പോ അടിഞ്ഞു ബ്ലോക്കാവാതെ നോക്കുക.'
    },
    abbreviation: 'DH / AH',
    badge: 'STRUCTURE'
  },
  {
    id: 'penetration',
    term: 'Penetration / Collar Plate',
    termMl: 'പെനട്രേഷൻ (പൈപ്പ് / കേബിൾ കടന്നുപോകുന്ന ദ്വാരം)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Bulkhead holes for pipes and electrical cables', ml: 'ഭിത്തിയിലൂടെ പൈപ്പുകൾ പോകുന്ന ഭാഗം' },
    meaning: {
      en: 'A hole cut in a bulkhead or deck to pass a pipe or electrical cable, reinforced by a welded collar plate or transit frame to preserve watertightness.',
      ml: 'കപ്പലിലെ ഭിത്തി തുരന്ന് പൈപ്പോ കേബിളോ കൊണ്ടുപോകുന്ന ദ്വാരങ്ങളും, ചോർച്ച തടയാൻ ചുറ്റും വെൽഡ് ചെയ്യുന്ന കോളർ പ്ലേറ്റും.'
    },
    simpleExample: {
      en: 'All cable penetrations in the fire bulkhead must be sealed with approved marine putty.',
      ml: 'ഫയർ ഭിത്തിയിലെ കേബിൾ തുളകൾ പ്രത്യേക മരൈൻ സീലന്റ് വെച്ച് അടയ്ക്കണം.'
    },
    abbreviation: 'PEN / COL',
    badge: 'OUTFITTING'
  },
  {
    id: 'watertight-nwt',
    term: 'WT vs NWT (Watertight / Non-Watertight)',
    termMl: 'WT vs NWT (വെള്ളം കടക്കാത്തത് vs സാധാരണ)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Marked on bulkheads: W.T. BHD / N.W.T. BHD', ml: 'ഡ്രോയിംഗിൽ ഭിത്തികളുടെ പേരിൽ' },
    meaning: {
      en: 'WT (Watertight) means water cannot pass through even under high water pressure. NWT (Non-Watertight) means a normal interior dividing wall.',
      ml: 'WT എന്നാൽ കപ്പലിൽ വെള്ളം ഉയർന്നാലും ഒരു തുള്ളി പോലും മറുപുറത്തേക്ക് കടക്കാത്ത അതിശക്തമായ ഭിത്തി. NWT എന്നാൽ സാധാരണ അകത്തെ ഭിത്തി.'
    },
    simpleExample: {
      en: 'Drawing indicates: "W.T. BHD at FR 75 from Keel to Main Deck".',
      ml: 'ഫ്രെയിം 75-ലെ ഭിത്തി വാട്ടർടൈറ്റ് (WT) ആയിരിക്കണമെന്ന് ഡ്രോയിംഗിൽ നിർദ്ദേശിക്കുന്നു.'
    },
    abbreviation: 'W.T. / N.W.T.',
    badge: 'CLASSIFICATION'
  },
  {
    id: 'weld-symbols',
    term: 'Welding Symbols (Fillet & Butt)',
    termMl: 'വെൽഡിംഗ് ചിഹ്നങ്ങൾ (ഫില്ലറ്റ് & ബട്ട് വെൽഡ്)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Arrows with triangles or parallel lines on joints', ml: 'ഡ്രോയിംഗിലെ ജോയിന്റുകളിലേക്ക് ചൂണ്ടുന്ന അമ്പടയാളങ്ങൾ' },
    meaning: {
      en: 'Standard symbols showing welders what kind of weld is needed: Triangle symbol = Fillet weld (corner joint); Two parallel lines = Butt weld (edge-to-edge).',
      ml: 'ഡ്രോയിംഗിൽ ഏതുതരം വെൽഡിംഗ് ചെയ്യണമെന്ന് കാണിക്കുന്ന ചിഹ്നങ്ങൾ: ത്രികോണ ചിഹ്നം എന്നാൽ ഫില്ലറ്റ് വെൽഡ് (മൂലകൾ); രണ്ട് സമാന്തര വരകൾ എന്നാൽ ബട്ട് വെൽഡ്.'
    },
    simpleExample: {
      en: 'Symbol with "6" next to triangle means a 6 mm leg length fillet weld.',
      ml: 'ത്രികോണത്തിന് അടുത്തുള്ള 6 എന്നാൽ 6 mm കനത്തിൽ വെൽഡ് ചെയ്യണം എന്നർത്ഥം.'
    },
    abbreviation: 'WELD SYM',
    badge: 'FABRICATION'
  },
  {
    id: 'ndt-testing',
    term: 'NDT (Non-Destructive Testing)',
    termMl: 'NDT പരിശോധന (വെൽഡിംഗ് ക്വാളിറ്റി ടെസ്റ്റ്)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Inspection notes: 100% RT on hull butt joints', ml: 'ഡ്രോയിംഗിലെ ക്വാളിറ്റി നോട്ട്സിൽ' },
    meaning: {
      en: 'Testing welded joints without damaging them. Includes RT (X-Ray Radiography), UT (Ultrasonic sound waves), and DPT (Dye Penetrant leak check).',
      ml: 'വെൽഡ് ചെയ്ത ഭാഗങ്ങൾ പൊളിക്കാതെ തന്നെ എക്സ്-റേ (RT), അൾട്രാസോണിക് (UT) എന്നിവ ഉപയോഗിച്ച് ഉള്ളിൽ വിള്ളലുണ്ടോ എന്ന് കണ്ടെത്തുന്ന പരിശോധന.'
    },
    simpleExample: {
      en: 'All shell butt welds in CSL drydock undergo 100% Ultrasonic Testing (UT).',
      ml: 'CSL-ൽ കപ്പലിന്റെ പുറംതോട് വെൽഡിംഗ് 100% അൾട്രാസോണിക് NDT ടെസ്റ്റിന് വിധേയമാക്കുന്നു.'
    },
    abbreviation: 'NDT / RT / UT / DPT',
    badge: 'QUALITY'
  },
  {
    id: 'scale',
    term: 'Drawing Scale',
    termMl: 'ഡ്രോയിംഗ് സ്കെയിൽ (Scale 1:50, 1:100)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Title block at the bottom-right corner', ml: 'ഡ്രോയിംഗിന്റെ താഴെ വലതുവശത്തെ ടൈറ്റിൽ ബോക്സിൽ' },
    meaning: {
      en: 'The ratio between the drawing size on paper and the actual ship size. For example, 1:50 means 1 cm on paper equals 50 cm (0.5 meter) on the actual ship.',
      ml: 'കടലാസിലെ വരയുടെ നീളവും കപ്പലിന്റെ യഥാർത്ഥ വലിപ്പവും തമ്മിലുള്ള അനുപാതം. 1:100 എന്നാൽ ഡ്രോയിംഗിലെ 1 സെന്റീമീറ്റർ യഥാർത്ഥത്തിൽ 1 മീറ്ററാണ്.'
    },
    simpleExample: {
      en: 'Check the Title Block to verify scale before taking scale-rule measurements.',
      ml: 'അളവുകൾ എടുക്കുന്നതിന് മുൻപ് ടൈറ്റിൽ ബോക്സിലെ സ്കെയിൽ എത്രയാണെന്ന് നോക്കുക.'
    },
    abbreviation: 'SCALE',
    badge: 'BLUEPRINT'
  },
  {
    id: 'revision-rev',
    term: 'Revision (Rev 0, Rev A)',
    termMl: 'റിവിഷൻ (ഡ്രോയിംഗിലെ തിരുത്തലുകൾ)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Revision table in title block', ml: 'ഡ്രോയിംഗ് ടൈറ്റിൽ ബോക്സിൽ' },
    meaning: {
      en: 'Tracks changes made by naval architects to the drawing. Always use the latest approved revision (e.g., Rev B supersedes Rev A) for fabrication.',
      ml: 'എൻജിനീയർമാർ ഡ്രോയിംഗിൽ വരുത്തിയ ഏറ്റവും പുതിയ മാറ്റങ്ങൾ സൂചിപ്പിക്കുന്ന നമ്പർ. എപ്പോഴും ഏറ്റവും പുതിയ റിവിഷൻ നോക്കി വേണം പണി ചെയ്യാൻ.'
    },
    simpleExample: {
      en: 'Ensure your fabrication shop drawing is Rev C (Latest Class Approved).',
      ml: 'നിങ്ങളുടെ കൈവശമുള്ള ഡ്രോയിംഗ് ഏറ്റവും പുതിയ റിവിഷനാണെന്ന് ഉറപ്പുവരുത്തുക.'
    },
    abbreviation: 'REV',
    badge: 'BLUEPRINT'
  },
  {
    id: 'bom-bill-of-materials',
    term: 'BOM (Bill of Materials / Part List)',
    termMl: 'BOM (മെറ്റീരിയൽ ലിസ്റ്റ് / പാർട്ട് ലിസ്റ്റ്)',
    category: 'drawing_terms',
    categoryLabel: { en: 'Drawing & Blueprint Terms', ml: 'ഡ്രോയിംഗ് പദങ്ങൾ' },
    locationOrContext: { en: 'Table on the top or right side of blueprint', ml: 'ഡ്രോയിംഗിന്റെ വശത്തുള്ള പട്ടിക' },
    meaning: {
      en: 'A table listing every steel plate, beam, pipe, bracket, part number, grade, thickness, quantity, and weight needed to build that block.',
      ml: 'ഡ്രോയിംഗിലുള്ള കപ്പൽ ഭാഗം നിർമ്മിക്കാൻ ആവശ്യമായ സ്റ്റീൽ പ്ലേറ്റുകളുടെ നമ്പർ, കനം, അളവുകൾ, ഭാരം, എണ്ണം എന്നിവ കാണിക്കുന്ന പട്ടിക.'
    },
    simpleExample: {
      en: 'The CSL store keeper issues steel plates based on the drawing BOM part numbers.',
      ml: 'BOM ലിസ്റ്റിലെ പാർട്ട് നമ്പർ നോക്കിയാണ് സ്റ്റോറിൽ നിന്ന് പ്ലേറ്റുകൾ അനുവദിക്കുന്നത്.'
    },
    abbreviation: 'BOM',
    badge: 'PRODUCTION'
  }
];
