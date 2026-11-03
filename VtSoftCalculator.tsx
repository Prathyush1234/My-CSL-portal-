import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, Clock, IndianRupee, TrendingUp, Award,
  Calendar, Info, ChevronDown, CheckCircle2, ChevronRight, Sparkles,
  ShieldCheck, Sliders, Target, Plus, Minus
} from 'lucide-react';
import { getAdminSalaryConfig, ADMIN_CONFIG_UPDATED_EVENT, AdminSalaryConfig } from '../utils/adminSalaryConfig';
import { 
  getCslOtBillingCycle, CSL_MONTHS_EN, CSL_MONTHS_ML, 
  getAll12MonthsOtCycles, calculateOtHoursForSalaryCycle 
} from '../utils/cslOtCycle';
import { CslLogo } from './CslLogo';
import { Language } from '../types';
import { QuarterlyOtTrackerBanner } from './QuarterlyOtTrackerBanner';
import { QuarterlyOtModal } from './QuarterlyOtModal';
import { CslEarningsTrendD3Chart } from './CslEarningsTrendD3Chart';

interface VtSoftCalculatorProps {
  language?: Language;
  isContract?: boolean;
  onOpenAdmin?: () => void;
}

export const VtSoftCalculator: React.FC<VtSoftCalculatorProps> = ({
  language = 'en',
  isContract,
  onOpenAdmin,
}) => {
  const isContractEmp = isContract ?? (
    typeof window !== 'undefined' && localStorage.getItem('csl_employee_category') === 'contract'
  );
  const isMl = language === 'ml';
  const isHi = language === 'hi';
  const isEn = language === 'en';

  const trSimple = (en: string, ml: string, hi: string) => {
    if (isEn) return en;
    if (isMl) return ml;
    if (isHi) return hi;
    return en;
  };

  // Load Admin configuration
  const [adminConfig, setAdminConfig] = useState<AdminSalaryConfig>(getAdminSalaryConfig());

  // User inputs: start clean (empty) so it shows 0.00 exactly like the screenshot
  const [basicSalary, setBasicSalary] = useState<string>('');
  const [otHours, setOtHours] = useState<string>('');

  // Monthly OT Target Hours (persisted in localStorage)
  const [monthlyOtTarget, setMonthlyOtTarget] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('csl_monthly_ot_target_hours');
      if (saved !== null && saved.trim() !== '') {
        return saved;
      }
    } catch {}
    return '25';
  });

  const handleUpdateMonthlyOtTarget = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '');
    setMonthlyOtTarget(cleaned);
    try {
      localStorage.setItem('csl_monthly_ot_target_hours', cleaned);
    } catch {}
  };

  // CSL 20-to-19 OT Billing Cycle: default November Salary (index 10) — 20 October to 19 November
  const [selectedCycleMonth, setSelectedCycleMonth] = useState<number>(10);
  const [showAllCyclesTable, setShowAllCyclesTable] = useState<boolean>(false);
  const [isQuarterlyOtModalOpen, setIsQuarterlyOtModalOpen] = useState<boolean>(false);

  // Triple-click tracking on CSL Logo for Admin access (password: 472544)
  const clickCountRef = React.useRef<number>(0);
  const lastClickTimeRef = React.useRef<number>(0);

  // Current Cycle info
  const cycleInfo = getCslOtBillingCycle(selectedCycleMonth, 2026);
  const allCycles = useMemo(() => getAll12MonthsOtCycles(2026), []);

  const [otSyncTick, setOtSyncTick] = useState(0);

  // Compute verified OT from Attendance daily logs for this cycle (20 Oct to 19 Nov for November Salary)
  const verifiedCycleOt = useMemo(() => {
    try {
      return calculateOtHoursForSalaryCycle([], selectedCycleMonth);
    } catch {}
    return {
      currentCycleOtHours: 0,
      nextCycleOtHours: 0,
      currentCycleDaysCount: 0,
      nextCycleDaysCount: 0,
      currentCycleDates: cycleInfo.cycleRangeMl,
      nextCycleDates: 'നവംബർ 20 മുതൽ ഡിസംബർ 19 വരെ',
    };
  }, [selectedCycleMonth, cycleInfo.cycleRangeMl, otSyncTick]);

  // Listen to admin config updates and attendance OT updates
  useEffect(() => {
    const handleConfigChange = (e: Event) => {
      const customEvent = e as CustomEvent<AdminSalaryConfig>;
      if (customEvent.detail) {
        setAdminConfig(customEvent.detail);
      } else {
        setAdminConfig(getAdminSalaryConfig());
      }
    };
    const handleAttendanceUpdate = () => {
      setOtSyncTick((t) => t + 1);
    };

    window.addEventListener(ADMIN_CONFIG_UPDATED_EVENT, handleConfigChange);
    window.addEventListener('csl-attendance-updated', handleAttendanceUpdate);
    window.addEventListener('storage', handleAttendanceUpdate);
    return () => {
      window.removeEventListener(ADMIN_CONFIG_UPDATED_EVENT, handleConfigChange);
      window.removeEventListener('csl-attendance-updated', handleAttendanceUpdate);
      window.removeEventListener('storage', handleAttendanceUpdate);
    };
  }, []);

  // Compute calculated values based on user input and Admin settings
  const bp = parseFloat(basicSalary) || 0;
  const hours = parseFloat(otHours) || 0;
  const divisor = adminConfig.otDivisor || 198.0;

  // 1. DA Amount (Computed automatically via Admin DA %)
  // User Rule: On-Contract employee has NO allowances (DA = 0)
  const daPct = adminConfig.daPercent ?? 54.10;
  const daAmount = (!isContractEmp && bp > 0) ? Number(((bp * daPct) / 100).toFixed(2)) : 0;

  // 2. Overtime Rate Per Hour (Factories Act standard divisor from Admin: 198)
  // For contract, with no allowances, totalBase is simply Basic Pay (bp)
  const totalBase = isContractEmp ? bp : (bp + daAmount);
  const singleRate = totalBase > 0 ? totalBase / divisor : 0;
  
  // Custom OT cash rate for contract employees (വേറെ മോഡൽ):
  const contractCustomRate = (isContractEmp && adminConfig.contractOtRatePerHour && adminConfig.contractOtRatePerHour > 0)
    ? adminConfig.contractOtRatePerHour
    : null;
  const otRatePerHour = contractCustomRate !== null
    ? contractCustomRate
    : Number((singleRate * 2).toFixed(2));

  // 3. Overtime Pay
  const otPay = Number((otRatePerHour * hours).toFixed(2));

  // 4. E/L Encashment Amount ((Basic + DA) ÷ 30) - Only for permanent (contract has CL & ML only)
  const elEncashment = (!isContractEmp && totalBase > 0) ? Number((totalBase / 30).toFixed(2)) : 0;

  // 5. HRA (Computed automatically via Admin HRA %)
  // User Rule: On-Contract employee has NO allowances (HRA = 0)
  const hraAmount = (!isContractEmp && bp > 0) ? Number(((bp * (adminConfig.hraPercent || 20.00)) / 100).toFixed(2)) : 0;

  // 6. PF Cutting:
  // For permanent employees: 12% of (Basic + VDA)
  // For on-contract employees: User rule - "പി എഫ് കട്ടിങ്ങിന്റെ കാൽക്കുലേഷൻ ഞാൻ പിന്നെ പറഞ്ഞു തരേണ്ട അത് അഡ്മിൻ മാത്രം സോള്‍വ്"
  // PF cutting is strictly solved by Admin only (adminConfig.contractPfAmount)
  const pfWages = bp + daAmount;
  const pfRate = adminConfig.epfPercent || 12.00;
  const pfCutting = isContractEmp
    ? (bp > 0 ? Number((adminConfig.contractPfAmount ?? 0).toFixed(2)) : 0)
    : (pfWages > 0 ? Number(((pfWages * pfRate) / 100).toFixed(2)) : 0);

  // 7. Next Basic Pay (Annual increment of ₹770) - Permanent scale
  const nextBasicPay = bp > 0 ? bp + 770 : 0;

  // 8. If Grade Changes (Promotion to W7 Scale) - Permanent scale
  const ifGradeChanges = bp > 0 ? (bp >= 25340 ? 26900.00 : Number((bp * 1.06).toFixed(2))) : 0;

  // Total Estimated Pay calculation
  // For contract: No allowances, so Gross = Basic + OT Pay
  // For permanent: Basic + DA + HRA + OT Pay
  const totalGrossEstimate = (bp > 0 || otPay > 0)
    ? Number((isContractEmp ? (bp + otPay) : (bp + daAmount + hraAmount + otPay)).toFixed(2))
    : 0;
  const netEstimatedPay = (bp > 0 || otPay > 0)
    ? Number(Math.max(0, totalGrossEstimate - pfCutting).toFixed(2))
    : 0;

  // Monthly OT Target & Progress Calculations
  const targetOtHours = Math.max(0, parseFloat(monthlyOtTarget) || 0);
  const activeOtHoursForTarget = hours > 0 ? hours : verifiedCycleOt.currentCycleOtHours;
  const otTargetProgressRaw = targetOtHours > 0 ? (activeOtHoursForTarget / targetOtHours) * 100 : 0;
  const otTargetProgressPct = Math.min(100, Math.max(0, Number(otTargetProgressRaw.toFixed(1))));
  const otTargetDisplayPct = Number(otTargetProgressRaw.toFixed(1));
  const remainingTargetHours = Math.max(0, Number((targetOtHours - activeOtHoursForTarget).toFixed(1)));
  const extraTargetHours = Math.max(0, Number((activeOtHoursForTarget - targetOtHours).toFixed(1)));
  const targetOtPayEstimate = Number((otRatePerHour * targetOtHours).toFixed(2));
  const activeOtPayForTarget = Number((otRatePerHour * activeOtHoursForTarget).toFixed(2));

  const getMonthlyTargetBarColor = () => {
    if (otTargetDisplayPct >= 100) {
      return 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400';
    }
    if (otTargetDisplayPct >= 60) {
      return 'bg-gradient-to-r from-amber-400 via-amber-500 to-teal-400';
    }
    return 'bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400';
  };

  const handleStepMonthlyTarget = (delta: number) => {
    const nextVal = Math.max(1, Number(((parseFloat(monthlyOtTarget) || 0) + delta).toFixed(1)));
    handleUpdateMonthlyOtTarget(String(nextVal));
  };

  const handleClearAll = () => {
    setBasicSalary('');
    setOtHours('');
  };

  // Triple click handler on CSL Logo for Admin
  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 1800) {
      clickCountRef.current += 1;
      if (clickCountRef.current >= 3) {
        clickCountRef.current = 0;
        if (onOpenAdmin) {
          onOpenAdmin();
        } else {
          window.dispatchEvent(new CustomEvent('csl_open_admin_modal'));
        }
      }
    } else {
      clickCountRef.current = 1;
    }
    lastClickTimeRef.current = now;
  };

  const fmt = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="w-full space-y-4">
      
      {/* 1. Main Clean Input Card */}
      <div className="rounded-3xl bg-[#061825]/95 text-white p-5 sm:p-6 shadow-2xl border border-[#0f354c] relative overflow-hidden backdrop-blur-md">
        {/* Watermark Crest */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-6 opacity-5 pointer-events-none">
          <CslLogo size={240} />
        </div>

        {/* Header inside Input Box */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#0f354c] pb-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogoClick}
              title="CSL Emblem"
              className="p-1 rounded-2xl bg-[#03131c] border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer shadow-md active:scale-90"
              aria-label="CSL Crest"
            >
              <CslLogo size={38} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase font-mono">
                  COCHIN SHIPYARD LIMITED
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                {isContractEmp
                  ? trSimple('Company On-Contract Salary & Overtime', 'കമ്പനി ഓൺ കോൺട്രാക്ട് ശമ്പളവും ഓവർടൈമും', 'कंपनी ऑन-कॉन्ट्रैक्ट वेतन एवं ओवरटाइम')
                  : trSimple('Salary & Overtime Calculator', 'ശമ്പളവും ഓവർടൈമും', 'वेतन एवं ओवरटाइम')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-black tracking-wide flex items-center gap-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {trSimple(
                  'Upcoming Monthly Salary: November 2026',
                  'ഇനി വരാൻ പോകുന്ന പ്രതിമാസ ശമ്പളം: നവംബർ 2026',
                  'आगामी मासिक वेतन: नवंबर 2026'
                )}
              </span>
            </span>

            {(basicSalary || otHours) ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-rose-300 hover:text-rose-100 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800/50 hover:bg-rose-900 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{trSimple('Clear', 'മായ്ക്കുക', 'साफ़ करें')}</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* 2 Clean Inputs: Basic Pay & Overtime Hours */}
        <div className="relative z-10 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Basic Salary Input */}
            <div className="bg-[#03131c]/90 rounded-2xl p-4 border border-[#0f354c] focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all shadow-inner">
              <label className="block text-xs font-black uppercase tracking-wider text-cyan-300 mb-1.5">
                {isContractEmp
                  ? trSimple('Consolidated Base Pay (₹)', 'കരാർ അടിസ്ഥാന ശമ്പളം (Consolidated Pay ₹)', 'समेकित मूल वेतन (₹)')
                  : trSimple('Basic Salary (₹)', 'ബേസിക് സാലറി (Basic Salary ₹)', 'मूल वेतन (Basic Salary ₹)')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value.replace(/[^0-9.]/g, ''))}
                  onFocus={(e) => e.target.select()}
                  placeholder={isContractEmp
                    ? trSimple('Type Base Salary (e.g. 25340)', 'ബേസിക് സാലറി നൽകുക (25340)', 'मूल वेतन दर्ज करें (25340)')
                    : trSimple('Type Basic Pay (e.g. 25340)', 'ബേസിക് സാലറി ടൈപ്പ് ചെയ്യുക (25340)', 'मूल वेतन दर्ज करें (25340)')}
                  className="w-full bg-transparent text-2xl sm:text-3xl font-black font-mono text-white outline-hidden placeholder:text-slate-600 placeholder:text-base sm:placeholder:text-lg"
                />
                <span className="absolute right-0 top-1 text-sm font-bold font-mono text-cyan-400">
                  ₹
                </span>
              </div>
            </div>

            {/* 2. Overtime Hours Input */}
            <div className="bg-[#03131c]/90 rounded-2xl p-4 border border-[#0f354c] focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all shadow-inner">
              <label className="block text-xs font-black uppercase tracking-wider text-cyan-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{trSimple('Overtime Hours (OT)', 'ഓവർടൈം സമയം (OT Hours)', 'ओवरटाइम घंटे (OT Hours)')}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={otHours}
                  onChange={(e) => setOtHours(e.target.value.replace(/[^0-9.]/g, ''))}
                  onFocus={(e) => e.target.select()}
                  placeholder={trSimple('Type Hours (e.g. 10)', 'മണിക്കൂറുകൾ ടൈപ്പ് ചെയ്യുക (10)', 'घंटे दर्ज करें (10)')}
                  className="w-full bg-transparent text-2xl sm:text-3xl font-black font-mono text-amber-300 outline-hidden placeholder:text-slate-600 placeholder:text-base sm:placeholder:text-lg"
                />
                <span className="absolute right-0 top-1 text-sm font-bold font-mono text-amber-400">
                  Hrs
                </span>
              </div>
            </div>

          </div>

          {/* Monthly OT Hours Target & Progress Bar Card */}
          <div className="mt-4 rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-[#041824] via-[#062233] to-[#041520] border border-teal-500/40 shadow-lg space-y-3">
            {/* Top Row: Title + Status Badge + Target Input Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight">
                      {trSimple(
                        'Monthly OT Hours Target & Progress',
                        'പ്രതിമാസ OT മണിക്കൂർ ലക്ഷ്യവും പുരോഗതിയും',
                        'मासिक ओटी घंटे का लक्ष्य और प्रगति'
                      )}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        otTargetDisplayPct >= 100
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : otTargetDisplayPct >= 50
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      {otTargetDisplayPct >= 100
                        ? trSimple('Target Achieved!', 'ലക്ഷ്യം കൈവരിച്ചു!', 'लक्ष्य पूरा हुआ!')
                        : `${otTargetDisplayPct}% ${trSimple('Complete', 'പൂർത്തിയായി', 'पूर्ण')}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-200/80 mt-0.5">
                    {trSimple(
                      `Track your ${cycleInfo.salaryPaymentLabelEn} OT goal (${cycleInfo.cycleRangeEn})`,
                      `${cycleInfo.salaryPaymentLabelMl}യിലെ OT ലക്ഷ്യം ട്രാക്ക് ചെയ്യുക (${cycleInfo.cycleRangeMl})`,
                      `${cycleInfo.salaryPaymentLabelEn} ओटी लक्ष्य ट्रैक करें`
                    )}
                  </p>
                </div>
              </div>

              {/* Target Hours Input & Stepper */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#021019] p-1.5 rounded-xl border border-cyan-500/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 px-1.5">
                  {trSimple('Target:', 'ലക്ഷ്യം:', 'लक्ष्य:')}
                </span>
                <button
                  type="button"
                  onClick={() => handleStepMonthlyTarget(-1)}
                  className="w-6 h-6 rounded-lg bg-[#08263a] hover:bg-[#0d3854] text-cyan-300 flex items-center justify-center border border-cyan-500/30 transition-colors cursor-pointer active:scale-95"
                  title={trSimple('Decrease target by 1 hour', 'ലക്ഷ്യം 1 മണിക്കൂർ കുറയ്ക്കുക', 'लक्ष्य 1 घंटा कम करें')}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={monthlyOtTarget}
                    onChange={(e) => handleUpdateMonthlyOtTarget(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    aria-label="Monthly OT Hours Target"
                    placeholder="25"
                    className="w-14 bg-[#041c2c] text-center font-mono font-black text-sm text-amber-300 py-0.5 px-1.5 rounded-lg border border-amber-400/40 focus:border-amber-400 outline-hidden"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-400 ml-1 mr-0.5">
                    h
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepMonthlyTarget(1)}
                  className="w-6 h-6 rounded-lg bg-[#08263a] hover:bg-[#0d3854] text-cyan-300 flex items-center justify-center border border-cyan-500/30 transition-colors cursor-pointer active:scale-95"
                  title={trSimple('Increase target by 1 hour', 'ലക്ഷ്യം 1 മണിക്കൂർ കൂട്ടുക', 'लक्ष्य 1 घंटा बढ़ाएं')}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Preset Target Chips */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
                  {trSimple('Quick Set:', 'വേഗത്തിൽ സെറ്റ് ചെയ്യാം:', 'त्वरित लक्ष्य:')}
                </span>
                {[15, 20, 25, 30, 40, 50].map((preset) => {
                  const isActivePreset = targetOtHours === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleUpdateMonthlyOtTarget(String(preset))}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        isActivePreset
                          ? 'bg-teal-400 text-slate-950 font-black shadow-xs scale-105'
                          : 'bg-[#03131d] text-cyan-300 border border-[#0e334a] hover:border-cyan-400/60 hover:text-white'
                      }`}
                    >
                      {preset}h
                    </button>
                  );
                })}
              </div>

              {hours === 0 && verifiedCycleOt.currentCycleOtHours > 0 && (
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {trSimple(
                    `Using Attendance OT: ${verifiedCycleOt.currentCycleOtHours}h`,
                    `അറ്റൻഡൻസ് OT ഉപയോഗിക്കുന്നു: ${verifiedCycleOt.currentCycleOtHours}h`,
                    `उपस्थिति ओटी: ${verifiedCycleOt.currentCycleOtHours}h`
                  )}
                </span>
              )}
            </div>

            {/* Progress Bar Container & Stats */}
            <div className="bg-[#021019]/90 rounded-xl p-3 border border-[#0d2e42] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">
                    {trSimple('Completed OT:', 'പൂർത്തിയായ OT:', 'पूर्ण ओटी:')}
                  </span>
                  <span className="font-black text-amber-300 text-sm">
                    {activeOtHoursForTarget} hrs
                  </span>
                  <span className="text-slate-500">/</span>
                  <span className="font-bold text-teal-300">
                    {targetOtHours} hrs {trSimple('Target', 'ലക്ഷ്യം', 'लक्ष्य')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {targetOtHours > 0 && activeOtHoursForTarget < targetOtHours ? (
                    <>
                      <span className="text-slate-300">
                        {trSimple('Remaining to Goal:', 'ലക്ഷ്യത്തിലേക്ക് ബാക്കി:', 'लक्ष्य के लिए शेष:')}
                      </span>
                      <span className="font-black text-cyan-300 text-sm">
                        {remainingTargetHours} hrs
                      </span>
                    </>
                  ) : targetOtHours > 0 ? (
                    <span className="font-black text-emerald-400 text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {extraTargetHours > 0
                          ? trSimple(
                              `Goal Reached (+${extraTargetHours} hrs extra!)`,
                              `ലക്ഷ്യം മറികടന്നു (+${extraTargetHours} മണിക്കൂർ അധികം!)`,
                              `लक्ष्य पूरा (+${extraTargetHours} घंटे अतिरिक्त!)`
                            )
                          : trSimple('Monthly Goal Achieved!', 'പ്രതിമാസ ലക്ഷ്യം കൈവരിച്ചു!', 'मासिक लक्ष्य पूरा हुआ!')}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      {trSimple('Enter a target > 0 hrs', 'ലക്ഷ്യം മണിക്കൂറിൽ നൽകുക', 'लक्ष्य दर्ज करें')}
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Progress Bar with Milestone Ticks */}
              <div className="relative w-full h-3.5 bg-[#010a10] rounded-full overflow-hidden p-0.5 border border-[#0f3852] shadow-inner">
                {/* 25%, 50%, 75% Milestone Guides */}
                <div className="absolute inset-y-0 left-1/4 w-px bg-white/10 z-10 pointer-events-none" />
                <div className="absolute inset-y-0 left-2/4 w-px bg-white/15 z-10 pointer-events-none" />
                <div className="absolute inset-y-0 left-3/4 w-px bg-white/10 z-10 pointer-events-none" />

                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getMonthlyTargetBarColor()}`}
                  style={{ width: `${otTargetProgressPct}%` }}
                  role="progressbar"
                  aria-valuenow={activeOtHoursForTarget}
                  aria-valuemin={0}
                  aria-valuemax={targetOtHours || 100}
                />
              </div>

              {/* Scale & Estimated Target Earnings Row */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span>0h (0%)</span>
                  <span>{Number((targetOtHours * 0.5).toFixed(1))}h (50%)</span>
                  <span className="text-teal-300 font-bold">{targetOtHours}h (100%)</span>
                </div>

                {otRatePerHour > 0 && targetOtHours > 0 && (
                  <div className="text-[11px] font-mono text-cyan-200 flex items-center gap-1.5">
                    <span>{trSimple('Target OT Pay:', 'ലക്ഷ്യമിട്ട OT വേതനം:', 'लक्ष्य ओटी वेतन:')}</span>
                    <strong className="text-amber-300 font-black">₹{fmt(targetOtPayEstimate)}</strong>
                    <span className="text-slate-500">·</span>
                    <span className="text-emerald-300">
                      {trSimple('Current:', 'ഇപ്പോൾ:', 'वर्तमान:')} ₹{fmt(activeOtPayForTarget)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CSL Quarterly OT Cap Tracker & 20-to-19 Billing Cycle (For both Permanent & Contract Employees) */}
          {/* CSL Quarterly OT Cap Tracker (75h or 120h per 3-month cycle) */}
          <div className="mt-4">
            <QuarterlyOtTrackerBanner
              language={language}
              onOpenDetails={() => setIsQuarterlyOtModalOpen(true)}
            />
          </div>

              {/* CSL Official 20-to-19 OT Billing Cycle Section */}
              <div className="mt-4 pt-3.5 border-t border-[#0f354c]/80">
                <div className="bg-[#04121b] rounded-2xl p-3 sm:p-4 border border-cyan-500/30 shadow-inner">
                  
                  {/* Header with Title & All-Months Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#0e2c3e]">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-black text-amber-300">
                            {trSimple(
                              'CSL Overtime Billing Cycle (Official 20-to-19 Rule)',
                              'സി.എസ്.എൽ ഔദ്യോഗിക OT ബില്ലിംഗ് സൈക്കിൾ (20 to 19)',
                              'सीएसएल आधिकारिक ओवरटाइम बिलिंग चक्र (20 से 19)'
                            )}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                            Official CSL Rule
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          {trSimple(
                            'Upcoming November Salary OT = 20 October to 19 November (20-to-19 rule across all 12 months).',
                            'ഇനി വരാൻ പോകുന്ന നവംബർ സാലറിയിലെ OT 20 ഒക്ടോബർ മുതൽ 19 നവംബർ വരെയാണ് (എല്ലാ മാസവും 20 മുതൽ 19 വരെ).',
                            'आगामी नवंबर वेतन में ओटी 20 अक्टूबर से 19 नवंबर तक का होता है (सभी 12 महीनों के लिए 20 से 19 नियम)।'
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAllCyclesTable(!showAllCyclesTable)}
                      className="self-start sm:self-auto px-2.5 py-1 rounded-xl bg-[#082235] hover:bg-[#0c314b] text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        {showAllCyclesTable
                          ? trSimple('Hide 12 Months', '12 മാസ ലിസ്റ്റ് മറയ്ക്കുക', '12 महीने छुपाएं')
                          : trSimple('All 12 Months Reference', '12 മാസത്തെയും OT ലിസ്റ്റ്', 'सभी 12 महीने देखें')}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllCyclesTable ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* 12-Month Selector Strip */}
                  <div className="pt-2.5 pb-2">
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-cyan-300/80 font-bold uppercase tracking-wider">
                      <span>{trSimple('Select Salary Month:', 'ശമ്പള മാസം തിരഞ്ഞെടുക്കുക:', 'वेतन माह चुनें:')}</span>
                      <span className="text-amber-400 font-mono">
                        {trSimple('Upcoming Nov Salary OT = 20 Oct – 19 Nov', 'നവംബർ സാലറി OT = 20 ഒക്ടോബർ – 19 നവംബർ', 'नवंबर वेतन ओटी = 20 अक्टूबर – 19 नवंबर')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {CSL_MONTHS_EN.map((mEn, idx) => {
                        const mMl = CSL_MONTHS_ML[idx];
                        const isSelected = selectedCycleMonth === idx;
                        const isSep = idx === 8;
                        const isNov = idx === 10;
                        return (
                          <button
                            key={mEn}
                            type="button"
                            onClick={() => setSelectedCycleMonth(idx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md scale-105 ring-2 ring-amber-300'
                                : isNov
                                ? 'bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-500/50'
                                : isSep
                                ? 'bg-[#0a273b] hover:bg-[#0f3752] text-cyan-200 border border-cyan-500/40'
                                : 'bg-[#071c2a] hover:bg-[#0a273b] text-cyan-300 border border-[#0f354c]'
                            }`}
                          >
                            <span>{isMl ? mMl : mEn.slice(0, 3)}</span>
                            {isNov && !isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Upcoming Monthly Salary: November (20 Oct - 19 Nov)" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Cycle Highlights & 1-Tap Load Button */}
                  <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-[#031b2b] to-[#04253a] border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {isMl 
                            ? `${cycleInfo.salaryPaymentLabelMl}യിൽ കയറുന്ന OT:` 
                            : `OT Credited in ${cycleInfo.salaryPaymentLabelEn}:`}
                        </span>
                        <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded border border-cyan-500/30">
                          {isMl ? cycleInfo.cycleRangeMl : cycleInfo.cycleRangeEn}
                        </span>
                      </div>
                      <p className="text-[10px] text-cyan-200/90 font-medium">
                        {isMl ? cycleInfo.explanationMl : cycleInfo.explanationEn}
                      </p>
                    </div>

                    {/* 1-Tap Load Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setOtHours(verifiedCycleOt.currentCycleOtHours.toString());
                      }}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                      title="Click to automatically fill verified OT hours"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-950" />
                      <span>
                        {isMl
                          ? `${cycleInfo.salaryPaymentLabelMl} OT ലോഡ് ചെയ്യുക (${verifiedCycleOt.currentCycleOtHours} Hrs)`
                          : `Load ${cycleInfo.salaryPaymentLabelEn} OT (${verifiedCycleOt.currentCycleOtHours} Hrs)`}
                      </span>
                    </button>
                  </div>

                  {/* Expandable 12-Month Full Reference Table */}
                  {showAllCyclesTable && (
                    <div className="mt-3 pt-3 border-t border-[#0e2c3e] animate-in fade-in duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                          {trSimple('Official CSL 12-Month OT Billing Cycle Table', '12 മാസത്തെയും ഔദ്യോഗിക OT ബില്ലിംഗ് പട്ടിക', '12 महीने का आधिकारिक ओटी बिलिंग चार्ट')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {trSimple('Rule: 20th to 19th -> Paid in Next Month 1st Salary', 'റൂൾ: 20 മുതൽ 19 വരെയുള്ള OT അടുത്ത മാസം 1-ന് ലഭിക്കുന്നു', 'नियम: 20 से 19 तक')}
                        </span>
                      </div>

                      <div className="max-h-60 overflow-y-auto rounded-xl border border-[#0f354c] divide-y divide-[#0f354c]">
                        {allCycles.map((cyc) => {
                          const isRowSelected = selectedCycleMonth === cyc.salaryMonthIndex;
                          const isSepRow = cyc.salaryMonthIndex === 8;
                          return (
                            <div
                              key={cyc.salaryMonthIndex}
                              onClick={() => setSelectedCycleMonth(cyc.salaryMonthIndex)}
                              className={`p-2 sm:p-2.5 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                                isRowSelected
                                  ? 'bg-cyan-950/80 text-white font-bold'
                                  : isSepRow
                                  ? 'bg-amber-950/30 hover:bg-[#0a293e]'
                                  : 'hover:bg-[#072030]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isRowSelected ? 'bg-amber-400' : 'bg-cyan-600'}`} />
                                <span className="font-bold text-cyan-200 w-24 sm:w-28">
                                  {isMl ? cyc.salaryPaymentLabelMl : cyc.salaryPaymentLabelEn}
                                </span>
                                <span className="font-mono text-[11px] text-white">
                                  {isMl ? cyc.cycleRangeMl : cyc.cycleRangeEn}
                                </span>
                                {isSepRow && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    {trSimple('User Rule', 'സി.എസ്.എൽ റൂൾ', 'सीएसएल नियम')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                                  {isMl ? cyc.salaryCreditedMl : cyc.salaryCreditedEn}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCycleMonth(cyc.salaryMonthIndex);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                    isRowSelected
                                      ? 'bg-amber-400 text-slate-950 font-black'
                                      : 'bg-[#082235] text-cyan-300 border border-cyan-700/50 hover:bg-cyan-900'
                                  }`}
                                >
                                  {isRowSelected
                                    ? (isMl ? 'തിരഞ്ഞെടുത്തു' : 'Selected')
                                    : (isMl ? 'പ്രയോഗിക്കുക' : 'Select')}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
        </div>
      </div>

      {/* 2. EXACT Calculator Summary matching User's Screenshot */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-200 space-y-4">
        
        {/* Top 2 Primary Highlight Cards (TOTAL OVERTIME PAY & NET ESTIMATED MONTHLY PAY) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: TOTAL OVERTIME PAY */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#052b3b] to-[#0a3e54] text-white border border-teal-500/40 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                {trSimple('TOTAL OVERTIME PAY', 'ആകെ ഓവർടൈം വേതനം', 'कुल ओवरटाइम वेतन')}
              </span>
              <div className="flex items-center gap-1.5">
                {isContractEmp && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    {trSimple('Separate Model', 'വേറെ മോഡൽ', 'अलग मॉडल')}
                  </span>
                )}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold">
                  {hours} {trSimple('Hrs', 'Hrs', 'घंटे')}
                </span>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-1 my-1">
              <span className="text-cyan-300 text-2xl sm:text-3xl">₹</span>
              <span>{fmt(otPay)}</span>
            </div>
            <div className="text-xs text-teal-200/90 mt-2 flex items-center justify-between pt-2 border-t border-teal-600/30 font-medium">
              <span>{trSimple('OT Rate Per Hour:', 'ഒരു മണിക്കൂർ നിരക്ക്:', 'प्रति घंटे दर:')}</span>
              <span className="font-mono font-bold text-white">
                ₹{fmt(otRatePerHour)} / hr
                {isContractEmp ? (contractCustomRate ? '' : ' (Base ÷ 198 × 2)') : ''}
              </span>
            </div>
            {targetOtHours > 0 && (
              <div className="mt-2.5 pt-2 border-t border-teal-600/30 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-teal-200 flex items-center gap-1">
                    <Target className="w-3 h-3 text-amber-300" />
                    <span>{trSimple('Monthly Target:', 'പ്രതിമാസ ലക്ഷ്യം:', 'मासिक लक्ष्य:')}</span>
                  </span>
                  <span className="font-bold text-white">
                    {activeOtHoursForTarget}h / {targetOtHours}h ({otTargetDisplayPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#031b26] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getMonthlyTargetBarColor()}`}
                    style={{ width: `${otTargetProgressPct}%` }}
                  />
                </div>
              </div>
            )}
            {isContractEmp && (
              <p className="text-[10px] text-cyan-300/80 mt-1.5 pt-1.5 border-t border-teal-600/20 leading-snug">
                {trSimple(
                  'CSL On-Contract: Follows the standard 3-month OT tracker & 20-to-19 monthly billing cycle.',
                  'കരാർ ജീവനക്കാർക്ക് 3 മാസത്തെ OT ട്രാക്കറും 20 മുതൽ 19 വരെയുള്ള ബില്ലിംഗ് സൈക്കിളും അടിസ്ഥാനമാക്കിയുള്ള ഓവർടൈം കണക്കുകൾ.',
                  'ऑन-कॉन्ट्रैक्ट: 3 महीने का ओटी ट्रैकर और 20 से 19 बिलिंग चक्र।'
                )}
              </p>
            )}
          </div>

          {/* Card 2: NET ESTIMATED MONTHLY PAY */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#063327] to-[#0d4e3c] text-white border border-emerald-500/40 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                {trSimple('NET ESTIMATED MONTHLY PAY', 'പ്രതിമാസ ശമ്പളം', 'अनुमानित मासिक वेतन')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
                Take-Home
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-1 my-1">
              <span className="text-emerald-300 text-2xl sm:text-3xl">₹</span>
              <span>{fmt(netEstimatedPay)}</span>
            </div>
            <div className="text-xs text-emerald-200/90 mt-2 flex items-center justify-between pt-2 border-t border-emerald-600/30 font-medium">
              <span>{trSimple('Total Earnings:', 'ആകെ വരുമാനം:', 'कुल आय:')}</span>
              <span className="font-mono font-bold text-white">
                ₹{fmt(totalGrossEstimate)}
                {isContractEmp ? ' (Base + OT)' : ''}
              </span>
            </div>
          </div>

        </div>

        {/* The Summary Cards: On-Contract (Admin Solved PF & Separate OT Model) vs Permanent (Standard Full PSU Slip) */}
        {isContractEmp ? (
          /* COMPANY ON-CONTRACT EMPLOYEE CARDS */
          <div className="space-y-2.5 sm:space-y-3">
            
            {/* Card 1: CONSOLIDATED BASE SALARY */}
            <div className="bg-cyan-50/60 hover:bg-cyan-50 p-4 rounded-2xl border border-cyan-200/90 transition-colors">
              <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider block mb-1">
                {trSimple('CONSOLIDATED BASE PAY', 'കരാർ അടിസ്ഥാന ശമ്പളം (BASE PAY)', 'समेकित मूल वेतन')}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-cyan-950">₹ {fmt(bp)}</span>
                <span className="text-xs text-cyan-700 font-medium">
                  {trSimple('Monthly Consolidated Pay', 'പ്രതിമാസ കരാർ വേതനം', 'मासिक समेकित वेतन')}
                </span>
              </div>
            </div>

            {/* Card 2: OVERTIME (OT) EARNINGS */}
            <div className="bg-amber-50/70 hover:bg-amber-50 p-4 rounded-2xl border border-amber-200/90 transition-colors">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{trSimple('OVERTIME (OT) EARNINGS', 'ഓവർടൈം വേതനം (OT EARNINGS)', 'ओवरटाइम कमाई (OT EARNINGS)')}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-400 font-mono">
                  {trSimple('Overtime Pay', 'ഓവർടൈം വേതനം', 'ओटी वेतन')}
                </span>
              </div>
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-950">₹ {fmt(otPay)}</span>
                  <span className="text-xs text-amber-800 font-mono font-bold">(@ ₹{fmt(otRatePerHour)}/hr)</span>
                </div>
                <span className="text-xs text-amber-800 font-medium font-mono">
                  {hours} {trSimple('Hrs Claimed', 'മണിക്കൂർ OT', 'घंटे')}
                </span>
              </div>
              <div className="text-[11px] text-amber-800 mt-1.5 pt-1.5 border-t border-amber-200/60 font-medium">
                {trSimple(
                  'Monthly Overtime earnings calculated as per CSL duty hours & rate.',
                  'സി.എസ്.എൽ ഡ്യൂട്ടി മണിക്കൂറുകളും നിരക്കും അടിസ്ഥാനമാക്കിയുള്ള പ്രതിമാസ ഓവർടൈം വരുമാനം.',
                  'मासिक ओवरटाइम कमाई CSL ड्यूटी घंटों और दर के अनुसार।'
                )}
              </div>
            </div>

            {/* Card 3: PROVIDENT FUND (PF DEDUCTION) */}
            <div className="bg-rose-50/70 hover:bg-rose-50 p-4 rounded-2xl border border-rose-200/90 transition-colors">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                  {trSimple('PROVIDENT FUND (PF DEDUCTION)', 'പ്രൊവിഡന്റ് ഫണ്ട് (PF DEDUCTION)', 'भविष्य निधि (PF DEDUCTION)')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-mono">
                  {trSimple('Statutory Deduction', 'നിയമാനുസൃത വിഹിതം', 'सांविधिक कटौती')}
                </span>
              </div>
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <span className="text-xl sm:text-2xl font-black font-mono text-rose-950">₹ {fmt(pfCutting)}</span>
                <span className="text-xs text-rose-700 font-medium">
                  {trSimple('Monthly EPF Share', 'പ്രതിമാസ ഇ.പി.എഫ് വിഹിതം', 'मासिक ईपीएफ हिस्सा')}
                </span>
              </div>
              <div className="text-[11px] text-rose-700/90 mt-1.5 pt-1.5 border-t border-rose-200/60 font-medium">
                {trSimple(
                  'Statutory Employee Provident Fund (EPF) monthly deduction.',
                  'എംപ്ലോയീസ് പ്രൊവിഡന്റ് ഫണ്ട് (EPF) പ്രതിമാസ വിഹിതം.',
                  'कर्मचारी भविष्य निधि (EPF) मासिक कटौती।'
                )}
              </div>
            </div>

          </div>
        ) : (
          /* The 6 Summary Cards matching User's Screenshot for Permanent Employees */
          <div className="space-y-2.5 sm:space-y-3">
            
            {/* Card 3: DA AMOUNT (VDA) */}
            <div className="bg-slate-50/90 hover:bg-slate-100/90 p-4 rounded-2xl border border-slate-200/90 transition-colors">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {trSimple('DA AMOUNT (VDA)', 'ഡി.എ തുക (DA AMOUNT)', 'डीए राशि (VDA)')}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">₹ {fmt(daAmount)}</span>
              </div>
            </div>

            {/* Card 4: E/L ENCASHMENT AMOUNT */}
            <div className="bg-slate-50/90 hover:bg-slate-100/90 p-4 rounded-2xl border border-slate-200/90 transition-colors">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {trSimple('E/L ENCASHMENT AMOUNT', 'ഇ.എൽ എൻകാഷ്മെന്റ് തുക', 'ई/एल नकदीकरण राशि')}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">₹ {fmt(elEncashment)}</span>
              </div>
            </div>

            {/* Card 5: HOUSE RENT ALLOW (HRA) */}
            <div className="bg-slate-50/90 hover:bg-slate-100/90 p-4 rounded-2xl border border-slate-200/90 transition-colors">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {trSimple('HOUSE RENT ALLOW (HRA)', 'വീട്ടുവാടക അലവൻസ് (HRA)', 'मकान किराया भत्ता (HRA)')}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">₹ {fmt(hraAmount)}</span>
              </div>
            </div>

            {/* Card 6: PF DEDUCTION */}
            <div className="bg-rose-50/60 hover:bg-rose-50 p-4 rounded-2xl border border-rose-200/90 transition-colors">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-1">
                {trSimple('PF DEDUCTION', 'പി.എഫ് കട്ടിംഗ് (PF DEDUCTION)', 'पीएफ कटौती (PF DEDUCTION)')}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-rose-950">₹ {fmt(pfCutting)}</span>
              </div>
            </div>

            {/* Card 7: NEXT BASIC PAY */}
            <div className="bg-indigo-50/60 hover:bg-indigo-50 p-4 rounded-2xl border border-indigo-200/90 transition-colors">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>{trSimple('NEXT BASIC PAY', 'അടുത്ത ബേസിക് പേ (NEXT BASIC PAY)', 'अगला मूल वेतन')}</span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-indigo-950">₹ {fmt(nextBasicPay)}</span>
              </div>
            </div>

            {/* Card 8: IF GRADE CHANGES */}
            <div className="bg-amber-50/60 hover:bg-amber-50 p-4 rounded-2xl border border-amber-200/90 transition-colors">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-700" />
                <span>{trSimple('IF GRADE CHANGES', 'ഗ്രേഡ് മാറിയാൽ (IF GRADE CHANGES)', 'यदि ग्रेड बदलता है')}</span>
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-950">₹ {fmt(ifGradeChanges)}</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 6-Month Earnings Trend D3 Combined Bar Chart (Net Fixed Pay & Net OT) */}
      <CslEarningsTrendD3Chart
        language={language}
        isContract={isContractEmp}
        liveNetFixedPay={bp > 0 ? Math.max(0, netEstimatedPay - otPay) : undefined}
        liveNetOt={hours > 0 || otPay > 0 ? otPay : undefined}
        liveOtHours={hours > 0 ? hours : undefined}
        selectedCycleMonth={selectedCycleMonth}
      />

      {/* Quarterly OT Cap Modal (75h or 120h per 3-month cycle) */}
      <QuarterlyOtModal
        isOpen={isQuarterlyOtModalOpen}
        onClose={() => setIsQuarterlyOtModalOpen(false)}
        language={language}
      />

    </div>
  );
};
