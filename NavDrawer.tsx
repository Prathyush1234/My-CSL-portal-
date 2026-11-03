import React, { useState } from 'react';
import { X, User, Home, Calendar, Anchor, FileText, Phone, Shield, Globe, IndianRupee, ClipboardCheck, Calculator, RotateCw, RefreshCcw, Sparkles, LogOut, Wallet } from 'lucide-react';
import { CslLogo } from './CslLogo';
import { Language } from '../types';
import { translations } from '../data/translations';
import { forceClearCacheAndReload, signOutAndResetEmployeeData } from '../utils/cacheManager';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onNavigate: (view: 'front' | 'dashboard' | 'calendar' | 'salary' | 'attendance' | 'tax' | 'money') => void;
  currentView: 'front' | 'dashboard' | 'calendar' | 'salary' | 'attendance' | 'tax' | 'money';
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  language,
  onSelectLanguage,
  onNavigate,
  currentView,
}) => {
  const t = translations[language];

  const [logoClicks, setLogoClicks] = React.useState(0);
  const logoClicksRef = React.useRef(0);
  const handleLogoClick = () => {
    logoClicksRef.current += 1;
    const current = logoClicksRef.current;
    setLogoClicks(current);
    if (current >= 3) {
      logoClicksRef.current = 0;
      setLogoClicks(0);
      window.dispatchEvent(new CustomEvent('csl_open_admin_modal'));
      onClose();
      return;
    }
    setTimeout(() => {
      logoClicksRef.current = 0;
      setLogoClicks(0);
    }, 1800);
  };

  const [isClearing, setIsClearing] = useState(false);
  const handleClearCache = async () => {
    setIsClearing(true);
    await forceClearCacheAndReload();
  };

  const handleSignOut = () => {
    const msg = language === 'ml'
      ? 'നിലവിലെ ജീവനക്കാരന്റെ വിവരങ്ങൾ ഒഴിവാക്കി പുതിയ ജീവനക്കാരനായി ഫ്രഷ് ആയി ലോഗിൻ ചെയ്യണോ?'
      : 'Sign out and reset to a fresh employee account?';
    if (window.confirm(msg)) {
      signOutAndResetEmployeeData();
      onNavigate('front');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content panel */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-[#091a24] text-white h-full shadow-2xl flex flex-col z-10 border-r border-teal-900/60">
        {/* Drawer Header */}
        <div className="p-5 border-b border-teal-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogoClick}
              className="p-1 rounded-full bg-slate-900/80 border border-teal-600/40 hover:border-teal-400 transition-all cursor-pointer active:scale-95"
              title="CSL Logo"
            >
              <CslLogo size={36} />
            </button>
            <div>
              <div className="font-extrabold text-white text-base tracking-tight leading-none">
                {t.appTitle}
              </div>
              <div className="text-[10px] text-teal-400 uppercase tracking-widest mt-1">
                COCHIN SHIPYARD LIMITED
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Navigation Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 flex-1 overflow-y-auto space-y-1.5 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => {
              onNavigate('front');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-semibold transition-all cursor-pointer ${
              currentView === 'front'
                ? 'bg-[#005f73] text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 text-teal-400" />
            <span>Portal Front Page (Login)</span>
          </button>


          <button
            type="button"
            onClick={() => {
              onNavigate('dashboard');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-semibold transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-[#005f73] text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-teal-400" />
            <span>Quick Access Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('calendar');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-semibold transition-all cursor-pointer ${
              currentView === 'calendar'
                ? 'bg-[#005f73] text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>CSL Wall Calendar 2026</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('salary');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-semibold transition-all cursor-pointer ${
              currentView === 'salary'
                ? 'bg-[#005f73] text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <IndianRupee className="w-4 h-4 text-amber-400" />
            <span>CSL Salary Calculator & Payslip</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('tax');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-semibold transition-all cursor-pointer ${
              currentView === 'tax'
                ? 'bg-[#005f73] text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4 text-cyan-400" />
            <div className="flex-1 flex items-center justify-between">
              <span>{language === 'ml' ? 'ഇൻകം ടാക്സ് കാൽക്കുലേറ്റർ' : 'CSL Income Tax Calculator'}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-600/40 font-mono">
                FY 26-27
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('attendance');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-semibold transition-all cursor-pointer ${
              currentView === 'attendance'
                ? 'bg-[#005f73] text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>Biometric Attendance & Shift Register</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate('money');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-semibold transition-all cursor-pointer ${
              currentView === 'money'
                ? 'bg-[#005f73] text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-400" />
            <div className="flex-1 flex items-center justify-between">
              <span>{language === 'ml' ? 'മണി മാനേജ്‌മെന്റ്' : 'Money Management'}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/40 font-mono">
                NEW
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('csl-open-shift-rotation-modal'));
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left font-semibold text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <RotateCw className="w-4 h-4 text-cyan-400" />
              <span>{language === 'ml' ? 'എ ടു ⇄ ബി ടു ഷിഫ്റ്റ് റൊട്ടേഷൻ' : 'A2 ⇄ B2 Weekly Shift Rotation'}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Weekly
            </span>
          </button>

          {/* Clear Cache & Force Update Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleClearCache}
              disabled={isClearing}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-bold text-xs bg-[#0b2430] border border-cyan-500/40 text-cyan-300 hover:bg-[#0f3142] hover:border-cyan-400 transition-all cursor-pointer shadow-xs active:scale-98"
              title="Purges all stale CacheStorage, old service workers, and forces the newest application update"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCcw className={`w-4 h-4 text-cyan-400 ${isClearing ? 'animate-spin' : ''}`} />
                <div>
                  <div className="font-bold">
                    {language === 'ml' ? 'കാഷെ ക്ലിയർ ചെയ്തു പുതുക്കുക' : language === 'hi' ? 'कैश साफ़ करें और रीफ़्रेश करें' : 'Clear Cache & Update'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {language === 'ml' ? 'പഴയ പേജ് ഡിലീറ്റ് ചെയ്ത് പുതിയത് വരുത്തും' : 'Clears stale page cache & loads newest app'}
                  </div>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </button>
          </div>

          {/* Switch Employee / Sign Out Button */}
          <div className="pt-1.5">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left font-bold text-xs bg-[#240a12]/80 border border-rose-500/40 text-rose-300 hover:bg-rose-950 hover:border-rose-400 transition-all cursor-pointer shadow-xs active:scale-98"
              title="Sign out this employee and start freshly for another employee"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="font-bold">
                    {language === 'ml' ? 'പുതിയ ജീവനക്കാരൻ / ലോഗ് ഔട്ട്' : language === 'hi' ? 'नया कर्मचारी / लॉग आउट' : 'Switch Employee / Sign Out'}
                  </div>
                  <div className="text-[10px] text-rose-300/70 font-normal">
                    {language === 'ml' ? 'മറ്റൊരാൾക്കായി ആപ്പ് ഫ്രഷ് ആക്കുക' : 'Reset & sign in with a new employee'}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Language Selection Drawer Footer */}
        <div className="p-4 border-t border-teal-950/80 bg-[#07161f] space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Language / ഭാഷ:</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectLanguage('en')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-colors ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onSelectLanguage('ml')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-colors ${
                language === 'ml'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              മലയാളം
            </button>
            <button
              type="button"
              onClick={() => onSelectLanguage('hi')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-colors ${
                language === 'hi'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              हिन्दी
            </button>
          </div>

          <div className="text-[10px] text-slate-500 text-center pt-1 font-mono">
            CSL Security & Helpdesk: +91 484 2501200
          </div>
        </div>
      </div>
    </div>
  );
};
