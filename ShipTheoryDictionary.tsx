import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, BookOpen, Compass, Bookmark,
  Check, Copy, Volume2, X, Ship, FileText, Layers, CheckCircle2,
  Sparkles, Eye
} from 'lucide-react';
import { Language } from '../types';
import { 
  SHIP_DICTIONARY_DATA, 
  SHIP_PRACTICAL_CATEGORIES, 
  ShipTerm 
} from '../data/shipTheoryDictionaryData';
import { CslLogo } from './CslLogo';
import { CslTugBackground } from './CslTugBackground';

interface ShipTheoryDictionaryProps {
  language: Language;
  onBack: () => void;
  onNavigateView?: (view: string) => void;
}

export const ShipTheoryDictionary: React.FC<ShipTheoryDictionaryProps> = ({
  language,
  onBack,
}) => {
  const isMl = language === 'ml';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ship_parts' | 'drawing_terms'>('all');
  const [activeTab, setActiveTab] = useState<'dictionary' | 'visual_guide'>('dictionary');
  const [selectedTerm, setSelectedTerm] = useState<ShipTerm | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('csl_simple_dict_favorites');
      return saved ? JSON.parse(saved) : ['bow', 'port-side', 'fr-frame-number', 'ga-plan'];
    } catch {
      return ['bow', 'fr-frame-number'];
    }
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(updated);
    try {
      localStorage.setItem('csl_simple_dict_favorites', JSON.stringify(updated));
    } catch {}
  };

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return SHIP_DICTIONARY_DATA.filter(item => {
      if (showOnlyFavorites && !favorites.includes(item.id)) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        item.term.toLowerCase().includes(q) ||
        item.termMl.toLowerCase().includes(q) ||
        (item.abbreviation && item.abbreviation.toLowerCase().includes(q)) ||
        item.meaning.en.toLowerCase().includes(q) ||
        item.meaning.ml.toLowerCase().includes(q) ||
        item.locationOrContext.en.toLowerCase().includes(q) ||
        item.locationOrContext.ml.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory, showOnlyFavorites, favorites]);

  // Copy
  const handleCopy = (term: ShipTerm, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const textToCopy = `${term.term} (${term.termMl})\n\n📍 ${term.locationOrContext.en} / ${term.locationOrContext.ml}\n\n📖 Meaning: ${term.meaning.en}\n\nമലയാളം: ${term.meaning.ml}\n\n💡 Example: ${term.simpleExample.ml}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text to speech
  const handleSpeak = (term: ShipTerm, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speakingId === term.id) {
      setSpeakingId(null);
      return;
    }
    const utter = new SpeechSynthesisUtterance(`${term.term}. ${term.meaning.en}`);
    utter.rate = 0.95;
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    setSpeakingId(term.id);
    window.speechSynthesis.speak(utter);
  };

  // Category counts
  const shipPartsCount = SHIP_DICTIONARY_DATA.filter(t => t.category === 'ship_parts').length;
  const drawingTermsCount = SHIP_DICTIONARY_DATA.filter(t => t.category === 'drawing_terms').length;

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col justify-start overflow-hidden bg-radial from-[#041d2e] via-[#03131f] to-[#010911] text-white">
      {/* Shipyard background */}
      <CslTugBackground />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-5 sm:py-6 flex flex-col justify-start">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1 rounded-full ring-2 ring-amber-500/70 bg-[#061522] shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
              <CslLogo size={40} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug">
                  {isMl ? 'കപ്പൽ & ഡ്രോയിംഗ് പദാവലി നിഘണ്ടു' : 'Ship & Drawing Words Dictionary'}
                </h1>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-500/40 uppercase tracking-widest font-mono">
                  CSL PRACTICAL GUIDE
                </span>
              </div>
              <p className="text-[11px] font-semibold text-teal-300/90 tracking-wider uppercase truncate">
                {isMl 
                  ? 'കപ്പലിലും ഷിപ്പ് ഡ്രോയിംഗുകളിലും ഉപയോഗിക്കുന്ന വാക്കുകളും അർത്ഥങ്ങളും' 
                  : 'Practical Everyday Words Used on Ships & Engineering Blueprints'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-full bg-[#092a3a]/90 border border-cyan-500/60 text-white hover:bg-cyan-900/40 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{isMl ? 'മടങ്ങുക' : 'Back'}</span>
          </button>
        </div>

        {/* Section Notice Banner */}
        <div className="p-3 rounded-2xl bg-[#06242a]/80 border border-[#0f4b55] text-xs text-slate-200 flex items-center justify-between gap-3 mb-4 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-400/50 flex items-center justify-center shrink-0 text-teal-300">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <p className="text-slate-300 leading-snug truncate">
              {isMl 
                ? 'കപ്പലിലെ പ്രധാന ഭാഗങ്ങളും, ബ്ലൂപ്രിന്റിലെ ഫ്രെയിം, വെൽഡ്, ചിഹ്നങ്ങൾ തുടങ്ങിയവയും ലളിതമായി മനസ്സിലാക്കാം.' 
                : 'Simple definitions for shipboard parts, plus blueprint marks like FR, Centerline, WT, Weld symbols & BOM.'}
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-900 text-teal-200 whitespace-nowrap">
            {SHIP_DICTIONARY_DATA.length} {isMl ? 'വാക്കുകൾ' : 'Words'}
          </span>
        </div>

        {/* Top Main Tab Toggle: List of Words vs Visual Illustrated Guide */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#061825]/90 border border-[#0f354c] shadow-lg mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('dictionary')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dictionary'
                ? 'bg-linear-to-r from-[#00b4d8] to-[#0077b6] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>{isMl ? 'വാക്കുകളുടെ പട്ടിക (A-Z Words)' : 'Words & Meanings (A-Z)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visual_guide')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'visual_guide'
                ? 'bg-linear-to-r from-[#00b4d8] to-[#0077b6] text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Eye className="w-4 h-4 text-emerald-300" />
            <span>{isMl ? 'കപ്പലിന്റെ & ഡ്രോയിംഗിന്റെ പടം (Visual Map)' : 'Visual Ship & Drawing Map'}</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: WORDS & MEANINGS LIST                             */}
        {/* ======================================================== */}
        {activeTab === 'dictionary' && (
          <div className="space-y-4">
            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isMl ? 'ഏതെങ്കിലും വാക്ക് തിരയുക (उदा: Bow, Stern, Port, FR, Keel, WT, വെൽഡ്, മാൻഹോൾ)...' : 'Search ship or drawing words (e.g. Bow, Stern, Port, Frame, Weld, MH, Keel)...'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#061825]/95 border border-[#0f354c] focus:border-cyan-400 focus:outline-hidden text-sm text-white placeholder-slate-400 shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer ${
                  showOnlyFavorites
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-[#061825] border-[#0f354c] text-slate-300 hover:bg-[#0a2333]'
                }`}
                title="Show bookmarked words"
              >
                <Bookmark className={`w-4 h-4 ${showOnlyFavorites ? 'fill-slate-950' : 'text-amber-400'}`} />
                <span>{isMl ? 'പ്രിയപ്പെട്ടവ' : 'Saved'} ({favorites.length})</span>
              </button>
            </div>

            {/* Two Primary Category Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm font-black'
                    : 'bg-[#071c2b] border-[#10374f] text-slate-300 hover:bg-[#0c293d]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isMl ? 'എല്ലാ വാക്കുകളും' : 'All Words'}</span>
                <span className="text-[10px] opacity-80 font-mono">({SHIP_DICTIONARY_DATA.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('ship_parts')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedCategory === 'ship_parts'
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm font-black'
                    : 'bg-[#071c2b] border-[#10374f] text-slate-300 hover:bg-[#0c293d]'
                }`}
              >
                <Ship className="w-3.5 h-3.5 text-cyan-300" />
                <span>{isMl ? 'കപ്പലിലെ വാക്കുകൾ' : 'Ship Parts'}</span>
                <span className="text-[10px] opacity-80 font-mono">({shipPartsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('drawing_terms')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedCategory === 'drawing_terms'
                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm font-black'
                    : 'bg-[#071c2b] border-[#10374f] text-slate-300 hover:bg-[#0c293d]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>{isMl ? 'ഡ്രോയിംഗ് വാക്കുകൾ' : 'Drawing Terms'}</span>
                <span className="text-[10px] opacity-80 font-mono">({drawingTermsCount})</span>
              </button>
            </div>

            {/* List of Simple Cards */}
            <div className="space-y-3">
              {filteredTerms.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#061825]/90 border border-[#0f354c] space-y-2">
                  <Search className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="font-bold text-white text-base">
                    {isMl ? 'വാക്കുകളൊന്നും കണ്ടെത്തിയില്ല' : 'No words found'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setShowOnlyFavorites(false);
                    }}
                    className="mt-2 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {isMl ? 'എല്ലാ വാക്കുകളും കാണിക്കുക' : 'Show All'}
                  </button>
                </div>
              ) : (
                filteredTerms.map(term => {
                  const isFav = favorites.includes(term.id);
                  const isCopied = copiedId === term.id;
                  const isSpeaking = speakingId === term.id;
                  const isDrawing = term.category === 'drawing_terms';

                  return (
                    <div
                      key={term.id}
                      onClick={() => setSelectedTerm(term)}
                      className="p-4 sm:p-4.5 rounded-2xl bg-[#061825]/95 border border-[#0f354c] hover:border-cyan-400/70 hover:bg-[#082133] shadow-md transition-all cursor-pointer select-none space-y-2.5"
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-white">
                              {term.term}
                            </span>
                            <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 rounded-full">
                              {term.termMl}
                            </span>
                            {term.badge && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                                isDrawing 
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40' 
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                              }`}>
                                {term.badge}
                              </span>
                            )}
                          </div>

                          {/* Where is it? Location context */}
                          <div className="text-[11px] text-teal-300 flex items-center gap-1 mt-1 font-medium">
                            <span className="text-slate-400">📍 {isMl ? 'എവിടെ കാണാം:' : 'Location:'}</span>
                            <span>{isMl ? term.locationOrContext.ml : term.locationOrContext.en}</span>
                          </div>
                        </div>

                        {/* Top action buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleSpeak(term, e)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSpeaking ? 'bg-cyan-500 text-slate-950' : 'bg-[#0a2333] text-slate-400 hover:text-white'
                            }`}
                            title="Pronounce"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopy(term, e)}
                            className="p-1.5 rounded-lg bg-[#0a2333] text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                            title="Copy"
                          >
                            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(term.id, e)}
                            className="p-1.5 rounded-lg bg-[#0a2333] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                            title="Bookmark"
                          >
                            <Bookmark className={`w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Malayalam & English Meaning (Direct, crystal clear) */}
                      <div className="p-3 rounded-xl bg-[#03131f] border border-[#0d2a3d] space-y-1">
                        <div className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                          <span className="font-bold text-teal-300 mr-1.5">{isMl ? 'അർത്ഥം:' : 'Meaning:'}</span>
                          {term.meaning.ml}
                        </div>
                        <div className="text-[11px] text-slate-400 italic">
                          {term.meaning.en}
                        </div>
                      </div>

                      {/* Practical Shipyard Example */}
                      <div className="flex items-start gap-1.5 text-xs text-slate-300 pt-0.5">
                        <span className="text-amber-400 font-bold shrink-0">💡 {isMl ? 'ഉദാഹരണം:' : 'Example:'}</span>
                        <span className="leading-snug">{isMl ? term.simpleExample.ml : term.simpleExample.en}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: VISUAL SHIP & DRAWING MAP                         */}
        {/* ======================================================== */}
        {activeTab === 'visual_guide' && (
          <div className="space-y-5">
            {/* 1. VISUAL SHIP MAP */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#061825]/95 border border-[#0f354c] shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#0e2c3e] pb-2.5">
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-extrabold text-base text-white">
                    {isMl ? '1. കപ്പലിലെ പ്രധാന ഭാഗങ്ങൾ (Ship Parts Map)' : '1. Shipboard Parts & Locations'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  PROFILE & PLAN
                </span>
              </div>

              <div className="bg-[#020d18] rounded-xl p-3 border border-[#0c2a3e] overflow-x-auto flex justify-center">
                <svg viewBox="0 0 700 240" className="w-full max-w-2xl h-auto select-none">
                  {/* Water line */}
                  <line x1="20" y1="140" x2="680" y2="140" stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,4" />
                  <text x="30" y="132" fill="#06b6d4" fontSize="11" fontWeight="bold">Waterline (ജലനിരപ്പ്)</text>

                  {/* Hull */}
                  <path
                    d="M 60,110 L 90,110 L 100,190 Q 130,205 180,205 L 530,205 Q 590,205 630,150 Q 660,120 670,85 L 640,85 Q 620,110 590,125 L 180,125 Q 110,125 90,110 Z"
                    fill="#0369a1"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />

                  {/* Bulbous bow */}
                  <circle cx="635" cy="165" r="16" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  <text x="615" y="195" fill="#38bdf8" fontSize="10" fontWeight="bold">Bulbous Bow</text>

                  {/* Bridge */}
                  <rect x="170" y="55" width="85" height="55" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  <text x="180" y="85" fill="#fff" fontSize="12" fontWeight="black">Bridge (ബ്രിഡ്ജ്)</text>
                  <text x="178" y="100" fill="#94a3b8" fontSize="9">Wheelhouse</text>

                  {/* Mast / Radar */}
                  <line x1="212" y1="55" x2="212" y2="30" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="212" cy="27" r="3" fill="#f59e0b" />

                  {/* Propeller & Rudder */}
                  <rect x="65" y="175" width="10" height="30" fill="#94a3b8" />
                  <text x="40" y="220" fill="#94a3b8" fontSize="11" fontWeight="bold">Rudder (റഡ്ഡർ)</text>

                  <path d="M 85,185 L 75,200 L 80,205 Z" fill="#f59e0b" />
                  <text x="80" y="220" fill="#f59e0b" fontSize="11" fontWeight="bold">Propeller</text>

                  {/* Keel */}
                  <line x1="100" y1="205" x2="560" y2="205" stroke="#f59e0b" strokeWidth="5" />
                  <text x="300" y="225" fill="#f59e0b" fontSize="12" fontWeight="black">Keel (കീൽ - അടിത്തട്ട്)</text>

                  {/* Bow marker */}
                  <text x="620" y="70" fill="#34d399" fontSize="14" fontWeight="black">BOW (ബോ - മുൻഭാഗം) ➔</text>

                  {/* Stern marker */}
                  <text x="40" y="70" fill="#f43f5e" fontSize="14" fontWeight="black">⬅ STERN (സ്റ്റേൺ - പിൻഭാഗം)</text>

                  {/* Cargo Holds / Main Deck */}
                  <rect x="300" y="105" width="100" height="20" fill="#0f2b3e" stroke="#38bdf8" />
                  <text x="310" y="120" fill="#fff" fontSize="10" fontWeight="bold">Hatch Cover (ഹാച്ച്)</text>
                  <line x1="100" y1="125" x2="590" y2="125" stroke="#fff" strokeWidth="2" />
                  <text x="440" y="118" fill="#fff" fontSize="11" fontWeight="bold">Main Deck (ഡെക്ക്)</text>

                  {/* Bulkhead vertical line */}
                  <line x1="480" y1="125" x2="480" y2="205" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="3,3" />
                  <text x="485" y="160" fill="#f43f5e" fontSize="10" fontWeight="bold">Bulkhead (ഭിത്തി)</text>

                  {/* Ballast Tank bottom */}
                  <rect x="250" y="175" width="180" height="28" fill="#0284c7" opacity="0.4" stroke="#06b6d4" />
                  <text x="270" y="193" fill="#67e8f9" fontSize="10" fontWeight="bold">Double Bottom Ballast Tank</text>
                </svg>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#071c2b] border border-[#10374f]">
                  <span className="font-bold text-rose-400 block">Port Side (ഇടത്)</span>
                  <span className="text-[11px] text-slate-300">ചുവപ്പ് നാവിഗേഷൻ ലൈറ്റ് (Red Light)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#071c2b] border border-[#10374f]">
                  <span className="font-bold text-emerald-400 block">Starboard (വലത്)</span>
                  <span className="text-[11px] text-slate-300">പച്ച നാവിഗേഷൻ ലൈറ്റ് (Green Light)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#071c2b] border border-[#10374f]">
                  <span className="font-bold text-amber-400 block">Bow (ബോ)</span>
                  <span className="text-[11px] text-slate-300">കപ്പലിന്റെ ഏറ്റവും മുൻഭാഗം (Forward)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#071c2b] border border-[#10374f]">
                  <span className="font-bold text-sky-400 block">Stern (സ്റ്റേൺ)</span>
                  <span className="text-[11px] text-slate-300">കപ്പലിന്റെ ഏറ്റവും പിൻഭാഗം (Aft)</span>
                </div>
              </div>
            </div>

            {/* 2. VISUAL SHIP DRAWING / BLUEPRINT MAP */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#061825]/95 border border-[#0f354c] shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#0e2c3e] pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-base text-white">
                    {isMl ? '2. ഡ്രോയിംഗുകളിൽ കാണുന്ന പ്രധാന കാര്യങ്ങൾ (Drawing Sheet Anatomy)' : '2. How to Read a Ship Blueprint'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                  BLUEPRINT SHEET
                </span>
              </div>

              <div className="bg-[#020d18] rounded-xl p-3 border border-[#0c2a3e] overflow-x-auto flex justify-center">
                <svg viewBox="0 0 700 320" className="w-full max-w-2xl h-auto select-none font-sans">
                  {/* Blueprint border */}
                  <rect x="10" y="10" width="680" height="300" fill="#041829" stroke="#0ea5e9" strokeWidth="2" />
                  <rect x="18" y="18" width="664" height="284" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="4,2" />

                  {/* Title Block (Bottom Right) */}
                  <rect x="460" y="210" width="220" height="90" fill="#08283d" stroke="#38bdf8" strokeWidth="2" />
                  <text x="470" y="230" fill="#38bdf8" fontSize="12" fontWeight="black">COCHIN SHIPYARD LIMITED</text>
                  <text x="470" y="248" fill="#fff" fontSize="10" fontWeight="bold">DWG NO: CSL-HULL-B45-001</text>
                  <text x="470" y="265" fill="#f59e0b" fontSize="10" fontWeight="bold">SCALE: 1:50 | REV: B</text>
                  <text x="470" y="282" fill="#94a3b8" fontSize="9">CLASS: IRS / DNV APPROVED</text>

                  {/* BOM Table (Top Right) */}
                  <rect x="460" y="20" width="220" height="110" fill="#08283d" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="470" y="38" fill="#f59e0b" fontSize="11" fontWeight="bold">BILL OF MATERIALS (BOM)</text>
                  <line x1="460" y1="44" x2="680" y2="44" stroke="#0284c7" />
                  <text x="470" y="60" fill="#fff" fontSize="9">Item 01: PL 16 Thk - AH36 (450 kg)</text>
                  <text x="470" y="75" fill="#fff" fontSize="9">Item 02: Deck Longi L 100x75x8</text>
                  <text x="470" y="90" fill="#fff" fontSize="9">Item 03: Web Frame Bracket BKT-4</text>
                  <text x="470" y="105" fill="#fff" fontSize="9">Item 04: Manhole MH 600x400 O.T.</text>

                  {/* Centerline CL symbol */}
                  <line x1="30" y1="160" x2="430" y2="160" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="8,3,2,3" />
                  <text x="40" y="152" fill="#f43f5e" fontSize="12" fontWeight="black">℄ CENTERLINE (CL)</text>

                  {/* Frame Stations */}
                  <line x1="120" y1="70" x2="120" y2="250" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="110" y="265" fill="#94a3b8" fontSize="10" fontWeight="bold">FR 40</text>

                  <line x1="220" y1="70" x2="220" y2="250" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="210" y="265" fill="#94a3b8" fontSize="10" fontWeight="bold">FR 50</text>

                  <line x1="320" y1="70" x2="320" y2="250" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="310" y="265" fill="#94a3b8" fontSize="10" fontWeight="bold">FR 60</text>

                  {/* Steel Plate callout */}
                  <rect x="140" y="90" width="160" height="50" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
                  <text x="160" y="115" fill="#fff" fontSize="11" fontWeight="bold">PL 16 Thk (16mm കനം)</text>
                  <text x="160" y="130" fill="#a5f3fc" fontSize="9">Steel Grade: AH36</text>

                  {/* Manhole Cutout */}
                  <ellipse cx="260" cy="185" rx="20" ry="12" fill="#08283d" stroke="#f59e0b" strokeWidth="2" />
                  <text x="290" y="190" fill="#f59e0b" fontSize="10" fontWeight="bold">MH (മാൻഹോൾ)</text>

                  {/* Welding Symbol callout */}
                  <line x1="140" y1="90" x2="80" y2="50" stroke="#34d399" strokeWidth="2" />
                  <line x1="80" y1="50" x2="40" y2="50" stroke="#34d399" strokeWidth="2" />
                  <polygon points="65,50 75,50 75,40" fill="#34d399" />
                  <text x="45" y="44" fill="#34d399" fontSize="10" fontWeight="bold">Fillet 6</text>
                  <text x="45" y="64" fill="#34d399" fontSize="9">Weld Symbol</text>

                  {/* Watertight Bulkhead note */}
                  <text x="225" y="85" fill="#f87171" fontSize="10" fontWeight="bold">W.T. BHD (വാട്ടർടൈറ്റ്)</text>
                </svg>
              </div>

              <div className="p-3 rounded-xl bg-[#071c2b] border border-[#10374f] text-xs text-slate-300 space-y-1">
                <span className="font-bold text-amber-400">ഡ്രോയിംഗ് വായിക്കുമ്പോൾ ശ്രദ്ധിക്കേണ്ട 4 കാര്യങ്ങൾ:</span>
                <p>1. <strong>FR (ഫ്രെയിം നമ്പർ):</strong> കപ്പലിന്റെ നീളത്തിൽ ഏത് ഭാഗമാണെന്ന് കണ്ടുപിടിക്കാൻ ഫ്രെയിം നമ്പർ നോക്കുക.</p>
                <p>2. <strong>PL & Thk:</strong> പ്ലേറ്റിന്റെ നമ്പറും കനവും മില്ലിമീറ്ററിൽ (mm) രേഖപ്പെടുത്തിയിരിക്കും (ഉദാ: PL 16 Thk = 16 mm).</p>
                <p>3. <strong>CL & BL:</strong> ഉയരങ്ങൾ അളക്കുന്നത് അടിയിലെ Baseline (BL) മുതലും, വീതി അളക്കുന്നത് മധ്യരേഖയായ Centerline (CL) മുതലുമാണ്.</p>
                <p>4. <strong>W.T. / N.W.T.:</strong> W.T. എന്ന് കണ്ടാൽ അത് പൂർണ്ണമായും വാട്ടർടൈറ്റ് വെൽഡിംഗ് ആയിരിക്കണം.</p>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SINGLE TERM POPUP */}
        {selectedTerm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#061825] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-[#0f354c] my-auto flex flex-col text-white">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#0e2c3e] mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-lg text-white">
                      {selectedTerm.term}
                    </h3>
                    <span className="text-xs font-bold text-amber-400 bg-amber-950/90 border border-amber-600/40 px-2.5 py-0.5 rounded-full">
                      {selectedTerm.termMl}
                    </span>
                  </div>
                  {selectedTerm.abbreviation && (
                    <span className="text-[11px] font-mono text-cyan-300 font-bold mt-1 inline-block">
                      Short Form: {selectedTerm.abbreviation}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTerm(null)}
                  className="w-8 h-8 rounded-full bg-[#0a2738] flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-[#092231] border border-teal-600/40">
                  <span className="text-[11px] font-bold text-teal-300 uppercase block mb-0.5">
                    📍 {isMl ? 'കപ്പലിൽ / ഡ്രോയിംഗിൽ എവിടെയാണ്:' : 'Location in Ship / Drawing:'}
                  </span>
                  <div className="text-white font-medium">
                    {isMl ? selectedTerm.locationOrContext.ml : selectedTerm.locationOrContext.en}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#071c2b] border border-[#123950] space-y-1.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    📖 {isMl ? 'ലളിതമായ അർത്ഥവും വിവരണവും:' : 'Simple Meaning & Explanation:'}
                  </span>
                  <p className="text-white text-sm leading-relaxed font-sans">
                    {selectedTerm.meaning.ml}
                  </p>
                  <p className="text-slate-400 text-xs italic pt-1 border-t border-[#0e2c3e]">
                    {selectedTerm.meaning.en}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#031524] border border-cyan-800/50 space-y-1">
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                    <span>💡 {isMl ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡിലെ ഉപയോഗം / ഉദാഹരണം:' : 'Shipyard Practical Example:'}</span>
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {isMl ? selectedTerm.simpleExample.ml : selectedTerm.simpleExample.en}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#0e2c3e] flex items-center justify-between gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedTerm.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    favorites.includes(selectedTerm.id)
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-[#0a2738] text-slate-300 hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${favorites.includes(selectedTerm.id) ? 'fill-slate-950' : ''}`} />
                  <span>{favorites.includes(selectedTerm.id) ? 'Saved' : 'Save Word'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedTerm)}
                    className="px-3 py-1.5 rounded-xl bg-[#0a2738] text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedId === selectedTerm.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTerm(null)}
                    className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
