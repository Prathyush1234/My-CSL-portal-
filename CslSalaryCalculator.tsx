import React from 'react';
import { 
  ArrowLeft, Calendar, ClipboardCheck, Printer,
  Receipt
} from 'lucide-react';
import { VtSoftCalculator } from './VtSoftCalculator';
import { CslLogo } from './CslLogo';
import { Language } from '../types';

interface CslSalaryCalculatorProps {
  language: Language;
  currentUser: {
    name: string;
    token: string;
    phone: string;
    department?: string;
    category?: string;
    joiningDate?: string;
    finishDate?: string;
    contractFinishDate?: string;
  };
  onBack: () => void;
  onOpenAttendance?: () => void;
  onOpenCalendar?: () => void;
  onOpenTax?: () => void;
}

export const CslSalaryCalculator: React.FC<CslSalaryCalculatorProps> = ({
  language,
  currentUser,
  onBack,
  onOpenAttendance,
  onOpenCalendar,
  onOpenTax,
}) => {
  const isMl = language === 'ml';
  const isContract = currentUser?.category === 'contract' || 
    (typeof window !== 'undefined' && localStorage.getItem('csl_employee_category') === 'contract');

  const getFirstLetter = (name?: string) => {
    if (!name || !name.trim()) return 'C';
    return name.trim().charAt(0).toUpperCase();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#030c14] text-white font-sans selection:bg-cyan-500 selection:text-white pb-16">
      <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-5">
        
        {/* 1. Top Action Row with Back Navigation & Brand (Matching QuickAccessDashboard) */}
        <div className="flex items-center justify-between pb-3 border-b border-[#0f354c] flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <CslLogo size={36} />
            <div>
              <div className="text-[10px] tracking-widest text-cyan-300 font-extrabold uppercase font-mono">
                COCHIN SHIPYARD LIMITED
              </div>
              <div className="text-xs text-slate-300 font-bold">
                {isMl ? 'ഫിനാൻസ് & ശമ്പള വിഭാഗം' : 'Finance & Payroll Directorate'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-full bg-[#092a3a]/80 border border-cyan-500/60 text-white hover:bg-cyan-900/40 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              title={isMl ? 'ഡാഷ്‌ബോർഡിലേക്ക് മടങ്ങുക' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>{isMl ? 'ഡാഷ്‌ബോർഡ്' : 'Dashboard'}</span>
            </button>
          </div>
        </div>

        {/* 2. Section Kicker with Amber Bar & Action Shortcuts */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-[3px] bg-amber-500 rounded-full shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
              {isContract
                ? (isMl ? 'കമ്പനി ഓൺ കോൺട്രാക്ട് എംപ്ലോയി ശമ്പള പോർട്ടൽ' : 'COMPANY ON-CONTRACT EMPLOYEE · PAYROLL')
                : (isMl ? 'പെർമനന്റ് എംപ്ലോയി ശമ്പള പോർട്ടൽ' : 'PERMANENT EMPLOYEE · PAYROLL')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="px-2.5 py-1 rounded-lg bg-[#071f2c] border border-[#113a52] text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isMl ? 'കലണ്ടർ' : 'Calendar'}</span>
              </button>
            )}

            {onOpenAttendance && (
              <button
                type="button"
                onClick={onOpenAttendance}
                className="px-2.5 py-1 rounded-lg bg-[#07241d] border border-[#104838] text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isMl ? 'അറ്റൻഡൻസ്' : 'Attendance'}</span>
              </button>
            )}

            {onOpenTax && (
              <button
                type="button"
                onClick={onOpenTax}
                className="px-2.5 py-1 rounded-lg bg-[#1f1704] border border-[#483307] text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isMl ? 'ടാക്സ്' : 'Income Tax'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-[#0a2738] border border-[#143e57] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Dark Glassmorphic User Profile Badge Card (Matching QuickAccessDashboard) */}
        <div className="bg-[#061825]/90 rounded-2xl p-3.5 sm:p-4 border border-[#0f354c] shadow-xl flex items-center justify-between gap-3 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
              {getFirstLetter(currentUser.name)}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-white text-base sm:text-lg truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-cyan-200/80 font-mono mt-0.5 truncate flex items-center gap-2">
                <span>{isMl ? 'കോഡ് നമ്പർ' : 'Code No'}: {currentUser.token || 'CSL'}</span>
                <span>·</span>
                <span>{currentUser.department || 'Shipbuilding & Production'}</span>
              </div>
              {isContract && (currentUser.joiningDate || currentUser.finishDate || currentUser.contractFinishDate) && (
                <div className="text-[11px] text-amber-300 font-mono mt-0.5 truncate flex items-center gap-1.5">
                  {currentUser.joiningDate && <span>{isMl ? 'ജോയിനിംഗ്' : 'DOJ'}: {currentUser.joiningDate}</span>}
                  {(currentUser.finishDate || currentUser.contractFinishDate) && (
                    <>
                      <span>·</span>
                      <span>{isMl ? '1 വർഷ കാലാവധി' : '1-Yr Finish'}: {currentUser.finishDate || currentUser.contractFinishDate}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black uppercase tracking-wider border border-amber-400/50 shadow-xs">
              {isMl ? 'ഇനി വരാൻ പോകുന്ന സാലറി: നവംബർ 2026' : 'UPCOMING SALARY · NOVEMBER 2026'}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#082a36] text-cyan-300 text-[11px] font-bold uppercase tracking-wider border border-cyan-500/40 shadow-xs">
              {isContract ? 'ON CONTRACT · NOV 2026 PAYROLL' : 'PERMANENT · NOV 2026 PAYROLL'}
            </span>
          </div>
        </div>

        {/* 4. Hero Heading (Clean without calculations badges at top) */}
        <div className="pb-1">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-display">
              {isMl ? 'ശമ്പളവും ഓവർടൈമും.' : 'Salary & Overtime.'}
            </h2>
            <span className="px-2.5 py-1 rounded-xl bg-teal-950/90 border border-teal-500/50 text-teal-300 text-xs font-extrabold tracking-wide">
              {isMl ? 'നവംബർ മാസത്തെ പ്രതിമാസ ശമ്പളം (November 2026)' : 'November 2026 Monthly Salary'}
            </span>
          </div>
          <p className="text-slate-300/80 text-sm font-normal">
            {isMl 
              ? (isContract
                  ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് കമ്പനി ഓൺ കോൺട്രാക്ട് ജീവനക്കാരുടെ നവംബർ മാസത്തെ ശമ്പള വിവരങ്ങൾ (അലവൻസുകൾ ബാധകമല്ല · പി.എഫ് അഡ്മിൻ സോൾവ്).'
                  : 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് പെർമനന്റ് എംപ്ലോയി നവംബർ മാസത്തെ പ്രതിമാസ ശമ്പള വിവരങ്ങൾ.')
              : (isContract
                  ? 'Cochin Shipyard On Contract Employee November Monthly Payroll (Zero Allowances · PF Solved by Admin).'
                  : 'Cochin Shipyard Permanent Employee Upcoming November Monthly Payroll.')}
          </p>
        </div>

        {/* 5. Clean Salary & OT Inputs with Calculator Summary matching screenshot */}
        <VtSoftCalculator 
          language={language}
          isContract={isContract}
          onOpenAdmin={() => window.dispatchEvent(new CustomEvent('csl_open_admin_modal'))}
        />

      </div>
    </div>
  );
};
