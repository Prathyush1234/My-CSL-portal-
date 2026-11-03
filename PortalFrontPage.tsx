import React, { useState } from 'react';
import { Check, ArrowRight, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { CslLogo } from './CslLogo';
import { CslTugBackground } from './CslTugBackground';
import { EmployeeCategory, Language } from '../types';
import { translations } from '../data/translations';

interface PortalFrontPageProps {
  language: Language;
  selectedCategory: EmployeeCategory;
  onSelectCategory: (category: EmployeeCategory) => void;
  onContinue: () => void;
  onSelectPermanent?: () => void;
  onSelectContract?: () => void;
  currentUser?: {
    name: string;
    token: string;
    phone: string;
    department: string;
  };
}

export const PortalFrontPage: React.FC<PortalFrontPageProps> = ({
  language,
  selectedCategory,
  onSelectCategory,
  onContinue,
  onSelectPermanent,
  onSelectContract,
  currentUser,
}) => {
  const t = translations[language];
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Retrieve saved profile name if available
  const displayName = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('csl_employee_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name?.trim()) return parsed.name.trim();
      }
    } catch {}
    return currentUser?.name?.trim() || '';
  }, [currentUser]);

  // Direct navigation to sign in page when pressing the Permanent Employee card/button
  const handlePermanentSelect = () => {
    onSelectCategory('permanent');
    try {
      localStorage.setItem('csl_employee_category', 'permanent');
    } catch {}
    if (onSelectPermanent) {
      onSelectPermanent();
    } else {
      onContinue();
    }
  };

  const handleContractSelect = () => {
    onSelectCategory('contract');
    try {
      localStorage.setItem('csl_employee_category', 'contract');
    } catch {}
    if (onSelectContract) {
      onSelectContract();
    } else {
      onContinue();
    }
  };

  const handleApprenticeSelect = () => {
    onSelectCategory('apprentice');
    onContinue();
  };

  const handleVendorSelect = () => {
    onSelectCategory('vendor');
    onContinue();
  };

  const [logoClicks, setLogoClicks] = useState(0);
  const logoClicksRef = React.useRef(0);
  const handleLogoClick = () => {
    logoClicksRef.current += 1;
    const current = logoClicksRef.current;
    setLogoClicks(current);
    if (current >= 3) {
      logoClicksRef.current = 0;
      setLogoClicks(0);
      window.dispatchEvent(new CustomEvent('csl_open_admin_modal'));
      return;
    }
    setTimeout(() => {
      logoClicksRef.current = 0;
      setLogoClicks(0);
    }, 1800);
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col justify-between overflow-hidden bg-radial from-[#041d2e] via-[#03131f] to-[#010911] text-white">
      
      {/* =========================================================================
          BACKGROUND TUG BOAT & MARITIME ATMOSPHERE
          Authentic Cochin Shipyard Tugboat at sea at twilight
          ========================================================================= */}
      <CslTugBackground />

      {/* =========================================================================
          FOREGROUND CONTENT CONTAINER
          1:1 Visual Match to Screenshot 1791825269669.png
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-5 sm:py-7 flex flex-col justify-start">
        
        {/* 1. Brand Lockup: CSL Crest & Government Undertaking */}
        <div className="flex items-center gap-3.5 mb-6 sm:mb-7">
          <button
            type="button"
            onClick={handleLogoClick}
            className="cursor-pointer active:scale-95 transition-transform shrink-0"
            title="CSL Emblem"
            aria-label="CSL Official Crest"
          >
            <div className="p-0.5 rounded-full ring-2 ring-amber-500/70 bg-[#061522] shadow-[0_0_14px_rgba(245,158,11,0.25)]">
              <CslLogo size={46} />
            </div>
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
              {t.companyName}
            </h1>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-300/80 tracking-wider uppercase mt-0.5">
              {t.companySubtitle}
            </p>
          </div>
        </div>

        {/* 2. Location Kicker with Amber Bar: "— COCHIN SHIPYARD • KOCHI, INDIA" */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="w-6 h-[3px] bg-amber-500 rounded-full shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
            {t.locationKicker}
          </span>
        </div>

        {/* 3. Main Welcome Hero Header */}
        <div className="mb-6 sm:mb-7">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.16] mb-2 font-display">
            {t.welcomeTitle}
          </h2>
          <p className="text-slate-300/80 text-sm sm:text-base font-normal">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* 4. The Central Glassmorphic Category Card (Exact layout as in screenshot) */}
        <div className="rounded-[28px] bg-[#061825]/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl border border-[#0f354c] mb-6">
          
          {/* Card Header Row: "SELECT YOUR CATEGORY" & "01 — 01" */}
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-extrabold tracking-widest text-[#5e8b9f] uppercase text-[10px]">
              {t.selectCategory}
            </span>
            <span className="font-mono text-[#5e8b9f] text-[11px] font-semibold tracking-wider">
              01 — 01
            </span>
          </div>

          {/* Association Question */}
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 tracking-tight">
            {t.categoryQuestion}
          </h3>

          {/* Option List */}
          <div className="space-y-3 mb-3">
            
            {/* Option 01: Permanent Employee (Direct navigation on touch/click) */}
            <div
              onClick={handlePermanentSelect}
              className={`rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all cursor-pointer select-none active:scale-[0.98] ${
                selectedCategory === 'permanent'
                  ? 'border-2 border-[#16b8d8] bg-[#092a3a]/90 shadow-[0_0_20px_rgba(22,184,216,0.35)]'
                  : 'border border-[#0e2c3e] bg-[#071825]/80 hover:border-[#164057]'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePermanentSelect();
                }
              }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#0e3c54] border border-[#16b8d8]/80 text-cyan-300 shadow-inner">
                  <Check className="w-5 h-5 stroke-[3] text-cyan-300" />
                </div>

                <div className="min-w-0">
                  <div className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
                    {t.permanentEmp}
                  </div>
                  <div className="text-xs text-cyan-300 font-medium mt-0.5 truncate">
                    {displayName ? `Signed in as ${displayName}` : t.permanentDesc}
                  </div>
                </div>
              </div>

              {/* Glowing Cyan Action Button: Direct navigation on press */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#16b8d8] text-[#031724] shadow-[0_0_12px_rgba(22,184,216,0.5)] active:scale-95 transition-all">
                <ArrowRight className="w-5 h-5 stroke-[2.8]" />
              </div>
            </div>

            {/* Option 02: Company on Contract Employees */}
            <div
              onClick={handleContractSelect}
              className={`rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all cursor-pointer select-none active:scale-[0.98] ${
                selectedCategory === 'contract'
                  ? 'border-2 border-[#16b8d8] bg-[#092a3a]/90 shadow-[0_0_18px_rgba(22,184,216,0.3)]'
                  : 'border border-[#0e2c3e] bg-[#071825]/80 hover:border-[#164057]'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleContractSelect();
              }}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#0a2030] text-slate-400 font-bold text-sm">
                  <span>02</span>
                </div>

                <div className="min-w-0">
                  <div className="font-bold text-slate-200 text-sm sm:text-base tracking-tight truncate">
                    {t.contractEmp}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {t.contractDesc}
                  </div>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-700/60 text-slate-400 bg-slate-800/40">
                <ArrowRight className="w-4 h-4 stroke-[2]" />
              </div>
            </div>

            {/* Expandable Categories: Apprentice & Vendor (Requested by user) */}
            {showAllCategories && (
              <>
                {/* Option 03: Apprentice & Trainee */}
                <div
                  onClick={handleApprenticeSelect}
                  className="rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all cursor-pointer select-none border border-[#0e2c3e] bg-[#071825]/80 hover:border-[#164057] active:scale-[0.98]"
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#0a2030] text-slate-400 font-bold text-sm">
                      <span>03</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-200 text-sm sm:text-base tracking-tight truncate">
                        {t.apprenticeEmp}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {t.apprenticeDesc}
                      </div>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-700/60 text-slate-400 bg-slate-800/40">
                    <ArrowRight className="w-4 h-4 stroke-[2]" />
                  </div>
                </div>

                {/* Option 04: Vendor & Contractor */}
                <div
                  onClick={handleVendorSelect}
                  className="rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all cursor-pointer select-none border border-[#0e2c3e] bg-[#071825]/80 hover:border-[#164057] active:scale-[0.98]"
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#0a2030] text-slate-400 font-bold text-sm">
                      <span>04</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-200 text-sm sm:text-base tracking-tight truncate">
                        {t.vendorEmp}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {t.vendorDesc}
                      </div>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-700/60 text-slate-400 bg-slate-800/40">
                    <ArrowRight className="w-4 h-4 stroke-[2]" />
                  </div>
                </div>
              </>
            )}

            {/* Toggle show more categories (Apprentice / Vendor) as in screenshot */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-xs text-[#5e8b9f] hover:text-cyan-300 font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>{showAllCategories ? 'Fewer categories ∧' : 'More categories (Apprentice / Vendor)'}</span>
                {showAllCategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

          </div>

          {/* Bottom selection status row inside the card matching screenshot */}
          <div className="pt-3 border-t border-[#0d2f44] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf] animate-pulse" />
              <span>Selected: Permanent Employee</span>
            </div>
            <button
              type="button"
              onClick={handlePermanentSelect}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

        </div>

        {/* 5. Trust Footnote: Shield + Official staff notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300/80 font-medium py-1">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-center">{t.securityFooter}</span>
        </div>

      </div>

    </div>
  );
};
