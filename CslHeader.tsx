import React from 'react';
import { Menu, Globe, Smartphone, Monitor } from 'lucide-react';
import { CslLogo } from './CslLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { Language } from '../types';

interface CslHeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onToggleMenu: () => void;
  isMobileFrame: boolean;
  onToggleFrame?: () => void;
  onAvatarClick?: () => void;
  onOpenAdmin?: () => void;
  appTitle?: string;
}

export const CslHeader: React.FC<CslHeaderProps> = ({
  language,
  onLanguageChange,
  onToggleMenu,
  isMobileFrame,
  onToggleFrame,
  onAvatarClick,
  onOpenAdmin,
  appTitle = 'My CSL',
}) => {
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);
  const clickCountRef = React.useRef(0);
  const clickTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const handleCslLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clickCountRef.current += 1;
    const current = clickCountRef.current;
    setClickCount(current);

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    if (current >= 3) {
      clickCountRef.current = 0;
      setClickCount(0);
      if (onOpenAdmin) {
        onOpenAdmin();
      } else {
        window.dispatchEvent(new CustomEvent('csl_open_admin_modal'));
      }
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
      setClickCount(0);
    }, 1500);
  };

  const handleSelectLanguage = (lang: Language) => {
    setLangMenuOpen(false);
    onLanguageChange(lang);
  };

  const langLabels: Record<Language, { code: string; label: string; native: string }> = {
    en: { code: 'EN', label: 'English', native: 'English' },
    ml: { code: 'ML', label: 'Malayalam', native: 'മലയാളം' },
    hi: { code: 'HI', label: 'Hindi', native: 'हिन्दी' },
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a1820] text-white border-b border-teal-950/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left: Hamburger menu trigger with teal border */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMenu}
            className="w-10 h-10 rounded-xl bg-[#09262e] border border-teal-600/50 flex items-center justify-center text-teal-300 hover:bg-[#0c333e] hover:text-teal-200 transition-colors cursor-pointer active:scale-95"
            aria-label="Open CSL Navigation Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Title: "My CSL" */}
          <button
            type="button"
            onClick={onAvatarClick}
            className="flex items-center gap-2 cursor-pointer text-left focus:outline-hidden"
            title="Go to Quick Access Dashboard"
          >
            <span className="text-xl font-bold tracking-tight text-white select-none hover:text-teal-300 transition-colors">
              {appTitle}
            </span>
          </button>
        </div>

        {/* Right action group */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Desktop/Mobile preview toggle (visible on md/lg screens) */}
          {onToggleFrame && (
            <button
              type="button"
              onClick={onToggleFrame}
              title={isMobileFrame ? 'Expand to Desktop View' : 'Switch to Mobile App View'}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {isMobileFrame ? (
                <>
                  <Monitor className="w-3.5 h-3.5 text-teal-400" />
                  <span>Desktop View</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Mobile View</span>
                </>
              )}
            </button>
          )}

          {/* In-app PWA install button (offline capable) */}
          <PWAInstallButton />

          {/* Language selector button [ 🌐 EN ] */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d2a33] border border-teal-600/60 text-teal-200 hover:bg-[#113540] text-xs font-semibold tracking-wider transition-colors active:scale-95 cursor-pointer"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>{langLabels[language]?.code || 'EN'}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-[#0f232c] border border-teal-700/50 rounded-xl shadow-xl py-1 z-50 text-xs">
                {(['en', 'ml', 'hi'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-teal-900/40 transition-colors cursor-pointer ${
                      language === lang ? 'text-teal-300 font-bold bg-teal-950/60' : 'text-slate-300'
                    }`}
                  >
                    <span>{langLabels[lang].native}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{lang}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Official CSL User Avatar / Crest (Triple click triggers Admin Modal) */}
          <button
            type="button"
            onClick={handleCslLogoClick}
            className="w-10 h-10 rounded-full ring-2 ring-teal-500/40 p-0.5 bg-[#081a22] flex items-center justify-center hover:ring-teal-400 transition-all cursor-pointer active:scale-95 relative"
            title="CSL Emblem"
            aria-label="CSL Emblem"
          >
            <CslLogo size={36} />
            {clickCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 text-[#09131d] rounded-full text-[9px] font-black flex items-center justify-center animate-bounce shadow-md">
                {clickCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
