import React, { useState, useEffect } from 'react';
import { Zap, ChevronRight, CheckCircle2, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { 
  QuarterlyOtCap, getQuarterlyOtCap, setQuarterlyOtCap,
  calculateQuarterlyOtSummary, QUARTERLY_OT_CAP_UPDATED_EVENT 
} from '../utils/cslQuarterlyOt';
import { Language } from '../types';

interface QuarterlyOtTrackerBannerProps {
  language?: Language;
  dailyLogs?: any[];
  onOpenDetails?: () => void;
  compact?: boolean;
}

export const QuarterlyOtTrackerBanner: React.FC<QuarterlyOtTrackerBannerProps> = ({
  language = 'ml',
  dailyLogs = [],
  onOpenDetails,
  compact = false,
}) => {
  const isMl = language === 'ml';

  const [cap, setCap] = useState<QuarterlyOtCap>(getQuarterlyOtCap());
  const [, setSyncTick] = useState(0);

  useEffect(() => {
    const handleCapChange = (e: Event) => {
      const customEvent = e as CustomEvent<QuarterlyOtCap>;
      if (customEvent.detail) {
        setCap(customEvent.detail);
      }
    };
    const handleAttendanceSync = () => {
      setSyncTick((t) => t + 1);
    };
    window.addEventListener(QUARTERLY_OT_CAP_UPDATED_EVENT, handleCapChange);
    window.addEventListener('csl-attendance-updated', handleAttendanceSync);
    window.addEventListener('storage', handleAttendanceSync);
    return () => {
      window.removeEventListener(QUARTERLY_OT_CAP_UPDATED_EVENT, handleCapChange);
      window.removeEventListener('csl-attendance-updated', handleAttendanceSync);
      window.removeEventListener('storage', handleAttendanceSync);
    };
  }, []);

  const summary = calculateQuarterlyOtSummary(dailyLogs, cap);

  const handleToggleCap = (newCap: QuarterlyOtCap) => {
    setCap(newCap);
    setQuarterlyOtCap(newCap);
  };

  const getProgressBarColor = () => {
    switch (summary.status) {
      case 'exceeded':
        return 'bg-gradient-to-r from-orange-500 to-rose-600';
      case 'danger':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500';
      case 'safe':
      default:
        return 'bg-gradient-to-r from-teal-400 to-emerald-500';
    }
  };

  if (compact) {
    return (
      <div 
        onClick={onOpenDetails}
        className="p-2.5 rounded-xl bg-[#061e2f]/90 border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer flex items-center justify-between gap-2.5 text-white shadow-md group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-white truncate">
                {isMl ? '3 മാസ OT ക്വാട്ട' : 'Quarterly OT Cap'}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                {cap}h
              </span>
            </div>
            <div className="text-[10px] text-cyan-200/80 font-mono truncate">
              {summary.cycle.periodMl.replace(` ${summary.cycle.year}`, '')}: <strong className="text-amber-300 font-bold">{summary.totalOtUsed}h</strong> / {cap}h ({isMl ? `ബാക്കി ${summary.remainingOt}h` : `Bal ${summary.remainingOt}h`})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-2 bg-[#02131e] rounded-full overflow-hidden border border-[#0d344d]">
            <div 
              className={`h-full rounded-full ${getProgressBarColor()}`} 
              style={{ width: `${Math.min(100, (summary.totalOtUsed / cap) * 100)}%` }}
            />
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-[#061e2f]/95 via-[#08293d]/95 to-[#051c2c]/95 border-2 border-cyan-500/40 shadow-xl text-white space-y-2.5">
      
      {/* Top Row: Title, Period, and 75h / 120h Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight">
                {isMl ? '3 മാസത്തെ ടോട്ടൽ OT ക്വാട്ട' : 'Quarterly Overtime (OT) Cap'}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Q{summary.cycle.quarterNumber}
              </span>
            </div>
            <div className="text-[10px] text-cyan-300 font-medium">
              {isMl ? summary.cycle.periodMl : summary.cycle.periodEn} (3 {isMl ? 'മാസ സൈക്കിൾ' : 'months'})
            </div>
          </div>
        </div>

        {/* 75h vs 120h Switcher Buttons */}
        <div className="flex items-center gap-1 bg-[#031522] p-1 rounded-xl border border-[#0f354c] shrink-0">
          <button
            type="button"
            onClick={() => handleToggleCap(75)}
            className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono transition-all cursor-pointer ${
              cap === 75
                ? 'bg-amber-400 text-slate-950 shadow-sm scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Set Quarterly OT limit to 75 hours (Standard)"
          >
            75h OT
          </button>
          <button
            type="button"
            onClick={() => handleToggleCap(120)}
            className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono transition-all cursor-pointer ${
              cap === 120
                ? 'bg-cyan-400 text-slate-950 shadow-sm scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Set Quarterly OT limit to 120 hours (Extended)"
          >
            120h OT
          </button>
        </div>
      </div>

      {/* Progress & Stat Row */}
      <div className="bg-[#031522]/90 rounded-xl p-2.5 border border-[#0e2c3e] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300">{isMl ? 'ചെയ്തത്:' : 'Used:'}</span>
            <span className="font-black text-amber-300 text-sm">{summary.totalOtUsed} hrs</span>
            <span className="text-slate-500">/</span>
            <span className="font-bold text-cyan-300">{cap} hrs</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-300">{isMl ? 'ബാക്കി ക്വാട്ട:' : 'Remaining:'}</span>
            <span className="font-black text-emerald-400 text-sm">{summary.remainingOt} hrs</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-[#010b12] rounded-full overflow-hidden p-0.5 border border-[#0e354e]">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(100, (summary.totalOtUsed / cap) * 100)}%` }}
          />
        </div>

        {/* 3 Months Quick Chips */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center font-mono">
          {summary.monthlyBreakdown.map((m) => (
            <div key={m.monthIndex} className="p-1 rounded-lg bg-[#061e2f] border border-[#0f3852] text-[10px]">
              <span className="text-slate-400 block truncate">{isMl ? m.monthNameMl : m.monthNameEn}</span>
              <strong className="text-amber-300 font-bold block">{m.otHours}h OT</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Footer details trigger */}
      {onOpenDetails && (
        <button
          type="button"
          onClick={onOpenDetails}
          className="w-full py-1.5 px-3 rounded-xl bg-[#072438] hover:bg-[#0b314a] text-cyan-300 hover:text-white border border-[#114260] text-xs font-bold flex items-center justify-between transition-all cursor-pointer active:scale-98"
        >
          <span>{isMl ? '3 മാസ OT വിശദാംശങ്ങളും സൈക്കിളുകളും കാണുക' : 'View 3-Month Breakdown & All Cycles'}</span>
          <ChevronRight className="w-4 h-4 text-cyan-400" />
        </button>
      )}

    </div>
  );
};
