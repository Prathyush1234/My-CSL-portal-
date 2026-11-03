import React, { useState } from 'react';
import { 
  ArrowLeft, ArrowRight, User, Hash, Phone, Building2, 
  CheckCircle2, ChevronDown, ChevronUp, CalendarDays, Clock 
} from 'lucide-react';
import { CslLogo } from './CslLogo';
import { CslTugBackground } from './CslTugBackground';
import { EmployeeCategory, Language } from '../types';
import { translations } from '../data/translations';

const PROFILE_STORAGE_KEY = 'csl_employee_profile';

interface PermanentEmployeeSignInProps {
  language: Language;
  category?: EmployeeCategory;
  currentUser?: {
    name: string;
    token: string;
    phone: string;
    department: string;
    joiningDate?: string;
    finishDate?: string;
    contractFinishDate?: string;
  };
  onBack: () => void;
  onSignInSuccess: (userData: { 
    name: string; 
    token: string; 
    phone: string; 
    department: string;
    category?: EmployeeCategory;
    joiningDate?: string;
    finishDate?: string;
    contractFinishDate?: string;
    leaves: { 
      cl: number; 
      clTotal?: number;
      el: number; 
      elTotal?: number;
      hpl?: number;
      hplTotal?: number;
      ml?: number;
      specialLeave?: number;
      specialLeaveTotal?: number;
      rh?: number;
      rhTotal?: number;
      [key: string]: any;
    };
  }) => void;
}

export const PermanentEmployeeSignIn: React.FC<PermanentEmployeeSignInProps> = ({
  language,
  category,
  currentUser,
  onBack,
  onSignInSuccess,
}) => {
  const t = translations[language];

  const isContract = category === 'contract' || (() => {
    try {
      return localStorage.getItem('csl_employee_category') === 'contract';
    } catch {
      return false;
    }
  })();

  // Load saved profile from localStorage if available, or fallback to currentUser
  const getSavedProfile = () => {
    try {
      const data = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return null;
  };

  const getSavedBalances = () => {
    try {
      const data = localStorage.getItem('csl_leave_balances_v2');
      if (data) return JSON.parse(data);
    } catch {}
    return null;
  };

  const saved = getSavedProfile();
  const savedBalances = getSavedBalances();

  const [fullName, setFullName] = useState<string>(saved?.name ?? currentUser?.name ?? '');
  const [tokenNumber, setTokenNumber] = useState<string>(saved?.token ?? currentUser?.token ?? '');
  
  const initialDoj = saved?.joiningDate ?? currentUser?.joiningDate ?? '';
  const initialParts = initialDoj ? initialDoj.split('-') : [];
  const [joinDay, setJoinDay] = useState<string>(initialParts.length === 3 ? initialParts[2] : '');
  const [joinMonth, setJoinMonth] = useState<string>(initialParts.length === 3 ? initialParts[1] : '');
  const [joinYear, setJoinYear] = useState<string>(initialParts.length === 3 ? initialParts[0] : new Date().getFullYear().toString());
  const [joiningDate, setJoiningDate] = useState<string>(() => initialDoj);

  const updateJoiningDate = (d: string, m: string, y: string) => {
    setJoinDay(d);
    setJoinMonth(m);
    setJoinYear(y);
    if (d && m && y) {
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      setJoiningDate(iso);
    } else {
      setJoiningDate('');
    }
  };

  const [phoneNumber, setPhoneNumber] = useState<string>(saved?.phone ?? currentUser?.phone ?? '');
  const [department, setDepartment] = useState<string>(saved?.department ?? currentUser?.department ?? (isContract ? 'Contract & Hull Fabrication Division' : ''));

  // Calculate 1 Year Finish Date automatically when joiningDate changes (1 year minus 1 day official tenure)
  const calculateOneYearFinishDate = (dojStr: string) => {
    if (!dojStr || !dojStr.trim()) {
      return { iso: '', formattedDmy: '', formattedEn: '', formattedMl: '', daysRemaining: null as number | null };
    }
    try {
      const parts = dojStr.trim().split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const start = new Date(y, m, d);
        if (!isNaN(start.getTime())) {
          // Contract 1 year finish date (1 year minus 1 day: e.g. 15-05-2025 to 14-05-2026)
          const finish = new Date(y + 1, m, d - 1);
          const fy = finish.getFullYear();
          const fm = String(finish.getMonth() + 1).padStart(2, '0');
          const fd = String(finish.getDate()).padStart(2, '0');
          const iso = `${fy}-${fm}-${fd}`;
          const formattedDmy = `${fd} / ${fm} / ${fy}`;

          const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthsMl = ['ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ആഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'];
          
          const formattedEn = `${fd} ${monthsEn[finish.getMonth()]} ${fy}`;
          const formattedMl = `${fd} ${monthsMl[finish.getMonth()]} ${fy}`;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const finishMid = new Date(fy, finish.getMonth(), finish.getDate());
          const diffMs = finishMid.getTime() - today.getTime();
          const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          return { iso, formattedDmy, formattedEn, formattedMl, daysRemaining };
        }
      }
    } catch {}
    return { iso: '', formattedDmy: '', formattedEn: '', formattedMl: '', daysRemaining: null };
  };

  const finishInfo = calculateOneYearFinishDate(joiningDate);
  
  // CSL Leave Quotas & Entitlements Initial States (Matching Screenshot 213907)
  // Strictly independent states so Phase 1 and Phase 2 never auto-equalize
  const [isQuotasOpen, setIsQuotasOpen] = useState<boolean>(true);
  const [clPhase1, setClPhase1] = useState<string>(() => {
    if (savedBalances?.clPhase1Total !== undefined) return String(savedBalances.clPhase1Total);
    if (savedBalances?.clPhase1 !== undefined) return String(savedBalances.clPhase1);
    if (isContract) return '12';
    return '6';
  });
  const [clPhase2, setClPhase2] = useState<string>(() => {
    if (isContract) return '0';
    if (savedBalances?.clPhase2Total !== undefined) return String(savedBalances.clPhase2Total);
    if (savedBalances?.clPhase2 !== undefined) return String(savedBalances.clPhase2);
    return '6';
  });
  const [hplQuota, setHplQuota] = useState<string>(() => {
    if (savedBalances?.hplTotal !== undefined) return String(savedBalances.hplTotal);
    if (savedBalances?.hpl !== undefined) return String(savedBalances.hpl);
    return isContract ? '0' : '20';
  });
  const [elQuota, setElQuota] = useState<string>(() => {
    if (savedBalances?.elTotal !== undefined) return String(savedBalances.elTotal);
    if (savedBalances?.el !== undefined) return String(savedBalances.el);
    return isContract ? '0' : '30';
  });
  const [specialLeaveQuota, setSpecialLeaveQuota] = useState<string>(() => {
    if (savedBalances?.specialLeaveTotal !== undefined) return String(savedBalances.specialLeaveTotal);
    if (savedBalances?.specialLeave !== undefined) return String(savedBalances.specialLeave);
    return isContract ? '0' : '15';
  });

  const p1Val = Math.max(0, parseFloat(clPhase1) || 0);
  const p2Val = isContract ? 0 : Math.max(0, parseFloat(clPhase2) || 0);
  const totalCl = isContract ? p1Val : Math.round((p1Val + p2Val) * 10) / 10;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !tokenNumber.trim() || !phoneNumber.trim()) {
      return;
    }

    // Official CSL Quotas: User-configured Phase 1 & Phase 2 (Never auto-equalized, supports .5 half leaves!)
    // For Contract Employees: Only single CL quota, Phase 2 is 0.
    const p1Num = Math.max(0, parseFloat(clPhase1) || 0);
    const p2Num = isContract ? 0 : Math.max(0, parseFloat(clPhase2) || 0);
    const totalClNum = isContract ? p1Num : Math.round((p1Num + p2Num) * 10) / 10;
    const hplNum = isContract ? 0 : Math.max(0, parseFloat(hplQuota) || 0);
    const elNum = isContract ? 0 : Math.max(0, parseFloat(elQuota) || 0);
    const sclNum = isContract ? 0 : Math.max(0, parseFloat(specialLeaveQuota) || 0);

    const initialBalances = {
      cl: totalClNum,
      clTotal: totalClNum,
      clPhase1: p1Num,
      clPhase1Total: p1Num,
      clPhase2: p2Num,
      clPhase2Total: p2Num,
      el: elNum,
      elTotal: elNum,
      hpl: hplNum,
      hplTotal: hplNum,
      specialLeave: sclNum,
      specialLeaveTotal: sclNum,
      special: sclNum,
      rh: isContract ? 0 : 2,
      rhTotal: isContract ? 0 : 2,
      co: isContract ? 0 : 3,
      coTotal: isContract ? 0 : 10,
    };

    const savedProfile = {
      name: fullName.trim(),
      token: tokenNumber.trim(),
      joiningDate: joiningDate.trim(),
      finishDate: finishInfo.iso || finishInfo.formattedEn,
      contractFinishDate: finishInfo.iso || finishInfo.formattedEn,
      phone: phoneNumber.trim(),
      department: department.trim() || (isContract ? 'Contract & Hull Fabrication Division' : 'Hull & Outfitting Engineering Division'),
      category: (isContract ? 'contract' : 'permanent') as EmployeeCategory,
      initialLeaves: {
        cl: totalClNum,
        clPhase1: p1Num,
        clPhase2: p2Num,
        el: elNum,
        hpl: hplNum,
        specialLeave: sclNum,
      },
    };

    try {
      // If switching to a new employee token, clear previous user's attendance records so the new person gets a clean slate
      if (saved?.token && saved.token !== tokenNumber.trim()) {
        localStorage.removeItem('csl_calendar_present_days_2026_9');
        localStorage.removeItem('csl_calendar_day_shifts_2026_9');
        localStorage.removeItem('csl_attendance_daily_logs_v2');
        localStorage.removeItem('csl_attendance_daily_logs_2026_9');
        localStorage.removeItem('csl_calendar_leave_records_2026_9');
        localStorage.removeItem('csl_calendar_leave_days_2026_9');
        localStorage.removeItem('csl_calendar_day_notes_2026');
        localStorage.removeItem('csl_today_punched_date');
        localStorage.removeItem('csl_actual_punched_today');
        localStorage.removeItem('csl_punch_state');
        localStorage.removeItem('csl_last_punch_time');
        localStorage.removeItem('csl_today_punch_in_time');
        localStorage.removeItem('csl_today_punch_out_time');
        localStorage.removeItem('csl_completed_duty_summary');
      }

      localStorage.setItem('csl_employee_category', isContract ? 'contract' : 'permanent');
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfile));
      localStorage.setItem('csl_employee_signed_in', 'true');
      localStorage.setItem('csl_leave_balances_v2', JSON.stringify(initialBalances));
      window.dispatchEvent(new CustomEvent('csl-leave-balances-updated', { detail: initialBalances }));
    } catch (err) {
      console.error('Error saving profile and leaves:', err);
    }

    onSignInSuccess({
      ...savedProfile,
      joiningDate: joiningDate.trim(),
      finishDate: finishInfo.iso || finishInfo.formattedEn,
      contractFinishDate: finishInfo.iso || finishInfo.formattedEn,
      leaves: initialBalances,
    });
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
          Exact match to screenshot 1791825366011.png
          ========================================================================= */}
      <CslTugBackground />

      {/* =========================================================================
          FOREGROUND FORM CONTAINER
          ========================================================================= */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-5 sm:py-7 flex flex-col justify-start">
        
        {/* Top Brand Header with Back Button */}
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-7">
          <div className="flex items-center gap-3">
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

          {/* Cyan Pill Back Button (as in screenshot 1791825366011.png) */}
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1.5 rounded-full bg-[#092a3a]/80 border border-cyan-500/60 text-white hover:bg-cyan-900/40 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back</span>
          </button>
        </div>

        {/* Section Kicker with Amber Bar */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="w-6 h-[3px] bg-amber-500 rounded-full shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
            {isContract 
              ? (language === 'ml' ? 'കരാർ കമ്പനി ജീവനക്കാരുടെ പോർട്ടൽ' : 'COMPANY ON CONTRACT EMPLOYEE PORTAL') 
              : 'PERMANENT EMPLOYEE PORTAL'}
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="mb-6 sm:mb-7">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.16] mb-2 font-display">
            {isContract 
              ? (language === 'ml' ? 'കരാർ ജീവനക്കാരുടെ ലോഗിൻ' : 'Contract Employee Sign In') 
              : 'Employee Sign In'}
          </h2>
          <p className="text-slate-300/80 text-sm sm:text-base font-normal">
            {isContract 
              ? (language === 'ml' 
                  ? 'കരാർ കമ്പനി ജീവനക്കാരുടെ പേര്, കോഡ് നമ്പർ, വിവരങ്ങൾ നൽകി ലോഗിൻ ചെയ്യുക.' 
                  : 'Please enter your name, code number, and details to access your portal.') 
              : 'Please enter your name, CSL code number, and registered mobile number to access your portal.'}
          </p>
        </div>

        {/* Sign In Form (Dark Glassmorphic Inputs matching screenshot) */}
        <form onSubmit={handleSignIn} className="space-y-3.5 mb-6">
          
          {/* Field 1: FULL NAME */}
          <div className="bg-[#061825]/90 rounded-2xl p-4 border border-[#0f354c] shadow-xl focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="full-name-input" className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>FULL NAME</span>
              </label>
              <span className="text-rose-500 font-bold">*</span>
            </div>
            <input
              id="full-name-input"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full text-base sm:text-lg font-bold text-white placeholder:text-slate-500 focus:outline-none bg-transparent"
            />
          </div>

          {/* Field 2: CSL CODE NUMBER */}
          <div className="bg-[#061825]/90 rounded-2xl p-4 border border-[#0f354c] shadow-xl focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="token-input" className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>CSL CODE NUMBER</span>
              </label>
              <span className="text-rose-500 font-bold">*</span>
            </div>
            <input
              id="token-input"
              type="text"
              required
              value={tokenNumber}
              onChange={(e) => setTokenNumber(e.target.value)}
              placeholder="Enter CSL code number"
              className="w-full text-base sm:text-lg font-bold text-white placeholder:text-slate-500 focus:outline-none bg-transparent"
            />
          </div>

          {/* Field: JOINING DATE & 1-YEAR COMPLETION FINISH DATE (Directly above Phone Number - ONLY FOR COMPANY ON-CONTRACT EMPLOYEES) */}
          {isContract && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
              
              {/* Left Box: JOINING DATE (Date / Month / Year - ഡേറ്റ്, മന്ത്, ഇയർ) */}
              <div className="bg-[#061825]/90 rounded-2xl p-2.5 sm:p-4 border border-[#0f354c] shadow-xl focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300 text-[10px] sm:text-[11px] truncate">
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{language === 'ml' ? 'ജോയിനിംഗ് (DD/MM/YYYY)' : 'JOINING DATE'}</span>
                  </div>
                  <span className="text-cyan-400 font-bold text-[9px] sm:text-[10px] font-mono shrink-0">DOJ</span>
                </div>

                {/* 3 Selectors: Date (DD) · Month (MM) · Year (YYYY) */}
                <div className="grid grid-cols-3 gap-1 my-1">
                  {/* Date / Day */}
                  <div>
                    <label className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase font-mono mb-0.5 truncate text-center">
                      {language === 'ml' ? 'ഡേറ്റ്' : 'Date'}
                    </label>
                    <select
                      value={joinDay}
                      onChange={(e) => updateJoiningDate(e.target.value, joinMonth, joinYear)}
                      className="w-full bg-[#04121b] border border-[#144254] text-white font-mono font-bold text-xs sm:text-sm rounded-lg px-0.5 sm:px-1 py-1 sm:py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer text-center"
                    >
                      <option value="" className="bg-[#061825] text-slate-400">DD</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                        <option key={d} value={d} className="bg-[#061825] text-white">{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month */}
                  <div>
                    <label className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase font-mono mb-0.5 truncate text-center">
                      {language === 'ml' ? 'മന്ത്' : 'Month'}
                    </label>
                    <select
                      value={joinMonth}
                      onChange={(e) => updateJoiningDate(joinDay, e.target.value, joinYear)}
                      className="w-full bg-[#04121b] border border-[#144254] text-white font-mono font-bold text-xs sm:text-sm rounded-lg px-0.5 sm:px-1 py-1 sm:py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer text-center"
                    >
                      <option value="" className="bg-[#061825] text-slate-400">MM</option>
                      {[
                        { val: '01', name: '01' },
                        { val: '02', name: '02' },
                        { val: '03', name: '03' },
                        { val: '04', name: '04' },
                        { val: '05', name: '05' },
                        { val: '06', name: '06' },
                        { val: '07', name: '07' },
                        { val: '08', name: '08' },
                        { val: '09', name: '09' },
                        { val: '10', name: '10' },
                        { val: '11', name: '11' },
                        { val: '12', name: '12' },
                      ].map((m) => (
                        <option key={m.val} value={m.val} className="bg-[#061825] text-white">{m.val}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase font-mono mb-0.5 truncate text-center">
                      {language === 'ml' ? 'ഇയർ' : 'Year'}
                    </label>
                    <select
                      value={joinYear}
                      onChange={(e) => updateJoiningDate(joinDay, joinMonth, e.target.value)}
                      className="w-full bg-[#04121b] border border-[#144254] text-white font-mono font-bold text-xs sm:text-sm rounded-lg px-0.5 sm:px-1 py-1 sm:py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer text-center"
                    >
                      <option value="" className="bg-[#061825] text-slate-400">YYYY</option>
                      {['2027', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'].map((y) => (
                        <option key={y} value={y} className="bg-[#061825] text-white">{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Formatted Date Display */}
                <div className="text-[10px] sm:text-xs font-mono font-bold text-cyan-300 mt-1 truncate">
                  {joinDay && joinMonth && joinYear ? (
                    <span>{joinDay} / {joinMonth} / {joinYear}</span>
                  ) : (
                    <span className="text-slate-500 font-sans text-[10px]">
                      {language === 'ml' ? 'ഡേറ്റ് · മന്ത് തിരഞ്ഞെടുക്കുക' : 'Select DD / MM / YYYY'}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Box (തൊട്ടപ്പുറത്ത് തന്നെ വലതുവശത്ത്): 1 YEAR FINISH DATE (Auto Calculated) */}
              <div className="bg-[#061825]/90 rounded-2xl p-2.5 sm:p-4 border border-amber-500/30 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-300 text-[10px] sm:text-[11px] truncate">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{language === 'ml' ? '1 വർഷം തികയുന്നത്' : '1 YEAR FINISH'}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                    {language === 'ml' ? 'ഓട്ടോ' : 'AUTO'}
                  </span>
                </div>
                
                <div className="my-auto py-1">
                  {finishInfo.formattedDmy ? (
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-base font-black font-mono text-amber-300 tracking-tight">
                        {finishInfo.formattedDmy}
                      </span>
                      <span className="text-[10px] text-amber-400/80 font-sans font-medium truncate mt-0.5">
                        {finishInfo.formattedEn}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[10px] sm:text-xs font-normal font-sans italic">
                      {language === 'ml' ? 'ഡേറ്റ്, മന്ത് നൽകുമ്പോൾ വരും' : 'Auto updates on date select'}
                    </span>
                  )}
                </div>

                <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
                  {finishInfo.formattedDmy ? (language === 'ml' ? '1 വർഷ കാലാവധി' : '1-Year Tenure End') : '—'}
                </div>
              </div>

            </div>
          )}

          {/* Field 3: PHONE NUMBER */}
          <div className="bg-[#061825]/90 rounded-2xl p-4 border border-[#0f354c] shadow-xl focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="phone-input" className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>PHONE NUMBER</span>
              </label>
              <span className="text-rose-500 font-bold">*</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#0a2333] border border-[#144254] text-slate-300 font-bold text-xs tracking-wide select-none">
                +91
              </span>
              <input
                id="phone-input"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Mobile number"
                className="w-full text-base sm:text-lg font-bold text-white placeholder:text-slate-500 focus:outline-none bg-transparent tracking-wide"
              />
            </div>
          </div>

          {/* Field 4: DEPARTMENT */}
          <div className="bg-[#061825]/90 rounded-2xl p-4 border border-[#0f354c] shadow-xl focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="department-input" className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>DEPARTMENT</span>
              </label>
              <span className="text-rose-500 font-bold">*</span>
            </div>
            <input
              id="department-input"
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Enter your department"
              className="w-full text-base sm:text-lg font-bold text-white placeholder:text-slate-500 focus:outline-none bg-transparent"
            />
          </div>

          {/* =========================================================================
              CSL LEAVE QUOTAS & ENTITLEMENTS CARD (Exact match to Screenshot 213907)
              Independent Phase 1 & Phase 2 configuration (No auto-equalizing!)
              ========================================================================= */}
          <div className="bg-[#061825]/90 rounded-2xl p-4 border border-[#0f354c] shadow-xl transition-all">
            {/* Header with Title, Badge, and Hide/Show toggle */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    CSL Leave Quotas & Entitlements
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    CSL QUOTA SETUP
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isContract
                    ? (language === 'ml' 
                        ? 'കരാർ ജീവനക്കാരുടെ കാഷ്വൽ ലീവ് (CL) പ്രാരംഭ ക്വാട്ട നൽകുക.' 
                        : 'Configure your opening quota for Casual Leave (CL).')
                    : (language === 'ml' 
                        ? 'കാഷ്വൽ ലീവ് (CL), ഹാഫ് പേ ലീവ് (HPL), ഏൺഡ് ലീവ് (EL), സ്പെഷ്യൽ ലീവ് എന്നിവയുടെ പ്രാരംഭ ക്വാട്ട നൽകുക.' 
                        : 'Configure your opening quotas for Casual Leave (CL), Half Pay Leave (HPL), Earned Leave (EL), and Special Leave.')}
                </p>
              </div>

              {/* Cyan Pill Collapse / Expand Button */}
              <button
                type="button"
                onClick={() => setIsQuotasOpen(!isQuotasOpen)}
                className="px-3 py-1 rounded-full bg-[#092a3a] border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/50 text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <span>{isQuotasOpen ? 'Hide' : 'Show'}</span>
                {isQuotasOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isQuotasOpen && (
              <div className="space-y-4 pt-2">
                
                {/* 1. CASUAL LEAVE (CL) SECTION */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs sm:text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span>
                        {language === 'ml' 
                          ? `CSL കാഷ്വൽ ലീവ് ക്വാട്ട (CL – ${totalCl} എണ്ണം)` 
                          : `CSL Casual Leave Quota (CL – ${totalCl} Days)`}
                      </span>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs tracking-tight shrink-0">
                      {language === 'ml' ? `ആകെ CL: ${totalCl} Days` : `Total CL: ${totalCl} Days`}
                    </div>
                  </div>

                  {isContract ? (
                    /* Contract Employee: ONLY single CL Quota input, NO Phase 2! */
                    <div className="bg-[#04121b] rounded-xl p-3.5 border border-amber-500/40 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
                          {language === 'ml' ? 'കാഷ്വൽ ലീവ് (CL) ക്വാട്ട' : 'CASUAL LEAVE (CL) QUOTA'}
                        </div>
                        <span className="text-[10px] font-bold text-amber-300/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                          {language === 'ml' ? 'കോൺട്രാക്ട്' : 'Contract'}
                        </span>
                      </div>
                      <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1.5 px-3 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition-all">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="30"
                          value={clPhase1}
                          onChange={(e) => setClPhase1(e.target.value)}
                          className="w-full text-center text-xl sm:text-2xl font-black font-mono text-amber-300 bg-transparent focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                          Days
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1.5">
                        {language === 'ml' ? `കമ്പനി ഓൺ കോൺട്രാക്ട് CL അർഹത: ${clPhase1 || 0} ദിവസങ്ങൾ` : `Company on Contract CL Entitlement: ${clPhase1 || 0} Days`}
                      </div>
                    </div>
                  ) : (
                    /* Permanent Employee: Phase 1 & Phase 2 Independent Inputs */
                    <div className="space-y-2.5">
                      {/* Phase 1 */}
                      <div className="bg-[#04121b] rounded-xl p-3 border border-[#0f354c] shadow-sm">
                        <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider mb-1.5">
                          {language === 'ml' ? 'CL PHASE 1 (JAN – JUN) · ഫേസ് 1' : 'CL PHASE 1 (JAN – JUN)'}
                        </div>
                        <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition-all">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="30"
                            value={clPhase1}
                            onChange={(e) => {
                              setClPhase1(e.target.value);
                            }}
                            className="w-full text-center text-xl sm:text-2xl font-black font-mono text-amber-300 bg-transparent focus:outline-none"
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                            Days
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {language === 'ml' ? `CSL ഒന്നാം ഘട്ടം: ${clPhase1 || 0} ലീവുകൾ` : `CSL Phase 1: ${clPhase1 || 0} Leaves`}
                        </div>
                      </div>

                      {/* Phase 2 */}
                      <div className="bg-[#04121b] rounded-xl p-3 border border-[#0f354c] shadow-sm">
                        <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider mb-1.5">
                          {language === 'ml' ? 'CL PHASE 2 (JUL – DEC) · ഫേസ് 2' : 'CL PHASE 2 (JUL – DEC)'}
                        </div>
                        <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition-all">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="30"
                            value={clPhase2}
                            onChange={(e) => {
                              setClPhase2(e.target.value);
                            }}
                            className="w-full text-center text-xl sm:text-2xl font-black font-mono text-amber-300 bg-transparent focus:outline-none"
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                            Days
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {language === 'ml' ? `CSL രണ്ടാം ഘട്ടം: ${clPhase2 || 0} ലീവുകൾ` : `CSL Phase 2: ${clPhase2 || 0} Leaves`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. HPL & EL SECTION - ONLY for Permanent Employees */}
                {!isContract && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs sm:text-sm">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        <span>
                          {language === 'ml' 
                            ? 'HPL (ഹാഫ് പേ ലീവ്) & EL (ഏൺഡ് ലീവ്)' 
                            : 'HPL & EL Quotas'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Official Quotas
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* HPL */}
                      <div className="bg-[#04121b] rounded-xl p-3 border border-[#0f354c] shadow-sm">
                        <div className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider mb-1.5">
                          {language === 'ml' ? 'HPL (HALF PAY LEAVE) · എച്ച്.പി.എൽ' : 'HPL (HALF PAY LEAVE)'}
                        </div>
                        <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/30 transition-all">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="90"
                            value={hplQuota}
                            onChange={(e) => setHplQuota(e.target.value)}
                            className="w-full text-center text-xl sm:text-2xl font-black font-mono text-cyan-300 bg-transparent focus:outline-none"
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                            Days
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {language === 'ml' ? 'ഹാഫ് പേ ലീവ് (വർഷം 20 Days)' : 'Half Pay Leave (20 Days/Year)'}
                        </div>
                      </div>

                      {/* EL */}
                      <div className="bg-[#04121b] rounded-xl p-3 border border-[#0f354c] shadow-sm">
                        <div className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider mb-1.5">
                          {language === 'ml' ? 'EL (EARNED LEAVE) · ഏൺഡ് ലീവ്' : 'EL (EARNED LEAVE)'}
                        </div>
                        <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400/30 transition-all">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="120"
                            value={elQuota}
                            onChange={(e) => setElQuota(e.target.value)}
                            className="w-full text-center text-xl sm:text-2xl font-black font-mono text-teal-300 bg-transparent focus:outline-none"
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                            Days
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {language === 'ml' ? 'ഏൺഡ് ലീവ് / പ്രിവിലേജ് ലീവ് (വർഷം 30 Days)' : 'Earned Leave / Privilege Leave (30 Days/Year)'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SPECIAL LEAVE SECTION - ONLY for Permanent Employees */}
                {!isContract && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-purple-400 text-xs sm:text-sm">
                        <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                        <span>
                          {language === 'ml' 
                            ? 'SPECIAL LEAVE · സ്പെഷ്യൽ ലീവ് (SCL / SPL)' 
                            : 'SPECIAL LEAVE (SCL / SPL)'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                        Sanctioned Quota
                      </span>
                    </div>

                    <div className="bg-[#04121b] rounded-xl p-3 border border-[#0f354c] shadow-sm">
                      <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/30 transition-all">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="60"
                          value={specialLeaveQuota}
                          onChange={(e) => setSpecialLeaveQuota(e.target.value)}
                          className="w-full text-center text-xl sm:text-2xl font-black font-mono text-purple-300 bg-transparent focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                          Days
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {language === 'ml' 
                          ? 'രക്തദാനം, ഔദ്യോഗിക സ്പോർട്സ്, പിതൃത്വ അവധി (15 Days)' 
                          : 'Blood donation, official sports, paternity leave (15 Days)'}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Primary Sign In Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-full font-bold text-base sm:text-lg tracking-wide text-white bg-linear-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#1ac5eb] hover:to-[#008cc0] shadow-[0_4px_24px_rgba(0,180,216,0.38)] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5 stroke-[2.8]" />
          </button>
        </form>

        {/* Bottom Green Notice Box matching screenshot */}
        <div className="bg-[#06242a]/80 border border-[#0f4b55] rounded-2xl p-4 text-xs text-slate-200 flex items-center gap-3 relative overflow-hidden shadow-lg mb-6">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          </div>
          <div className="pr-8 text-slate-300 font-medium leading-relaxed">
            Once signed in, the Home (Quick Access) screen will automatically open whenever you launch the app.
          </div>
          
          {/* Subtle glowing star in corner */}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 pointer-events-none opacity-40">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <path d="M 50 0 Q 52 48 100 50 Q 52 52 50 100 Q 48 52 0 50 Q 48 48 50 0 Z" fill="#38bdf8" />
            </svg>
          </div>
        </div>

      </div>

    </div>
  );
};
