import React, { useState, useEffect } from 'react';
import { 
  X, Zap, CheckCircle2, AlertTriangle, ShieldAlert,
  Calendar, Clock, ChevronRight, Sparkles, ChevronLeft,
  Download, MessageSquare, Image as ImageIcon
} from 'lucide-react';
import { 
  QuarterlyOtCap, getQuarterlyOtCap, setQuarterlyOtCap,
  calculateQuarterlyOtSummary, getAllQuarterlyCycles,
  getQuarterlyCycleForDate, QUARTERLY_OT_CAP_UPDATED_EVENT,
  buildUnifiedOtRegisterPdfData
} from '../utils/cslQuarterlyOt';
import { generateAndDownloadNextMonthOtPdf } from '../utils/cslPdfGenerator';
import { CslNextMonthOtViewerModal } from './CslNextMonthOtViewerModal';
import { Language } from '../types';

interface QuarterlyOtModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  dailyLogs?: any[];
}

export const QuarterlyOtModal: React.FC<QuarterlyOtModalProps> = ({
  isOpen,
  onClose,
  language = 'ml',
  dailyLogs = [],
}) => {
  const isMl = language === 'ml';

  const [cap, setCap] = useState<QuarterlyOtCap>(getQuarterlyOtCap());
  const [selectedCycleIndex, setSelectedCycleIndex] = useState<number>(2); // Default to Q3 (Sep-Nov)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setSyncTick] = useState(0);
  const [showOtSheetViewer, setShowOtSheetViewer] = useState(false);

  const allCycles = getAllQuarterlyCycles(2026);
  const activeCycle = allCycles[selectedCycleIndex] || allCycles[2];

  // Recalculate summary for the active cycle
  const targetDateForCycle = new Date(activeCycle.year, activeCycle.months[1].monthIndex, 15);
  const summary = calculateQuarterlyOtSummary(dailyLogs, cap, targetDateForCycle);
  const otPdfData = buildUnifiedOtRegisterPdfData(dailyLogs, targetDateForCycle);

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

  if (!isOpen) return null;

  const handleSelectCap = (newCap: QuarterlyOtCap) => {
    setCap(newCap);
    setQuarterlyOtCap(newCap);
    setToastMessage(
      isMl 
        ? `3 മാസത്തെ ടോട്ടൽ OT ലിമിറ്റ് ${newCap} മണിക്കൂറായി സെറ്റ് ചെയ്തു!`
        : `Quarterly OT Cap set to ${newCap} hours!`
    );
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getStatusColor = () => {
    switch (summary.status) {
      case 'exceeded':
        return 'text-rose-400 bg-rose-950/80 border-rose-500/50';
      case 'danger':
        return 'text-orange-400 bg-orange-950/80 border-orange-500/50';
      case 'warning':
        return 'text-amber-400 bg-amber-950/80 border-amber-500/50';
      case 'safe':
      default:
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50';
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md select-none overflow-hidden">
      <div className="bg-[#051824] rounded-3xl w-full max-w-lg shadow-2xl border border-[#0f354c] flex flex-col max-h-[92vh] overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-[#0e2c3e] flex items-center justify-between shrink-0 bg-[#041520]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                <span>{isMl ? '3 മാസത്തെ ടോട്ടൽ OT ലിമിറ്റ്' : 'Quarterly Overtime (OT) Cap'}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {cap}h Cap
                </span>
              </h3>
              <p className="text-[11px] text-cyan-300 font-medium">
                {isMl ? '3 മാസം കൂടുമ്പോൾ OT പരിധി: 75h അല്ലെങ്കിൽ 120h' : 'Every 3 months OT limit: 75h or 120h'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0a2738] hover:bg-[#0f3850] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#143e57]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Toast feedback */}
          {toastMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. Cap Selection: 75 Hours vs 120 Hours (The core requirement) */}
          <div className="p-3.5 rounded-2xl bg-[#041b2a] border-2 border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isMl ? 'നിങ്ങളുടെ OT ലിമിറ്റ് തിരഞ്ഞെടുക്കുക:' : 'Select Your Quarterly OT Cap:'}</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300">
                {isMl ? 'സെലക്റ്റ് ചെയ്തത്:' : 'Active:'} <strong className="text-white">{cap}h</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Option A: 75 Hours */}
              <button
                type="button"
                onClick={() => handleSelectCap(75)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                  cap === 75
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black border-amber-300 shadow-lg ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'bg-[#062133] hover:bg-[#0a2c42] text-slate-200 border-[#144260]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base sm:text-lg font-black font-mono">
                    75 {isMl ? 'മണിക്കൂർ' : 'Hours'}
                  </span>
                  {cap === 75 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
                  )}
                </div>
                <div className={`text-[10px] font-medium leading-tight ${cap === 75 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                  {isMl ? 'സ്റ്റാറ്റ്യൂട്ടറി നോർമൽ OT ക്വാട്ട' : 'Standard Statutory OT Cap'}
                </div>
                <div className={`text-[9px] mt-1 font-mono font-bold ${cap === 75 ? 'text-slate-950' : 'text-cyan-400'}`}>
                  {isMl ? '3 മാസത്തേക്ക് 75 മണിക്കൂർ' : '75 hrs per 3-month cycle'}
                </div>
              </button>

              {/* Option B: 120 Hours */}
              <button
                type="button"
                onClick={() => handleSelectCap(120)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                  cap === 120
                    ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-slate-950 font-black border-cyan-300 shadow-lg ring-2 ring-cyan-400/50 scale-[1.02]'
                    : 'bg-[#062133] hover:bg-[#0a2c42] text-slate-200 border-[#144260]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base sm:text-lg font-black font-mono">
                    120 {isMl ? 'മണിക്കൂർ' : 'Hours'}
                  </span>
                  {cap === 120 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
                  )}
                </div>
                <div className={`text-[10px] font-medium leading-tight ${cap === 120 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                  {isMl ? 'സ്പെഷ്യൽ / എക്സ്റ്റൻഡഡ് OT ക്വാട്ട' : 'Special / Extended OT Cap'}
                </div>
                <div className={`text-[9px] mt-1 font-mono font-bold ${cap === 120 ? 'text-slate-950' : 'text-cyan-400'}`}>
                  {isMl ? '3 മാസത്തേക്ക് 120 മണിക്കൂർ' : '120 hrs per 3-month cycle'}
                </div>
              </button>
            </div>
          </div>

          {/* 2. Quarter Cycle Selector Strip (March-May, June-Aug, Sep-Nov, Dec-Feb) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 text-xs">
                {isMl ? '3 മാസത്തെ സൈക്കിൾ തിരഞ്ഞെടുക്കുക:' : 'Select 3-Month Cycle:'}
              </label>
              <span className="text-[10px] text-cyan-300 font-mono">
                {isMl ? 'വർഷം 2026' : 'Year 2026'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {allCycles.map((c, idx) => {
                const isSelected = selectedCycleIndex === idx;
                const isCurrentQuarter = idx === 2; // Sep-Nov 2026 is current
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCycleIndex(idx)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0e3b56] border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-[#062030] hover:bg-[#0a2e45] text-slate-300 border-[#123b54]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <span className="font-extrabold text-[11px] text-cyan-300">Q{c.quarterNumber}</span>
                      {isCurrentQuarter && (
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-amber-400 text-slate-950">
                          {isMl ? 'ഇപ്പോൾ' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-white truncate">
                      {isMl ? c.periodMl.replace(` ${c.year}`, '') : c.periodEn.replace(` ${c.year}`, '')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Live Quarterly Progress Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#062235] via-[#072a42] to-[#041a29] border border-cyan-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#0f3c5a] flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                  {isMl ? activeCycle.titleMl : activeCycle.titleEn}
                </span>
                <span className="text-sm font-extrabold text-white">
                  {isMl ? activeCycle.periodMl : activeCycle.periodEn}
                </span>
              </div>
              <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${getStatusColor()}`}>
                {summary.status === 'exceeded' && <ShieldAlert className="w-3.5 h-3.5 shrink-0" />}
                {summary.status === 'danger' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                {summary.status === 'warning' && <Clock className="w-3.5 h-3.5 shrink-0" />}
                {summary.status === 'safe' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{isMl ? summary.statusTextMl : summary.statusTextEn}</span>
              </div>
            </div>

            {/* Large Stats Numbers */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#031724]/90 p-2.5 rounded-xl border border-[#0d344d]">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">
                  {isMl ? 'ചെയ്ത OT' : 'OT Used'}
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-amber-300 mt-0.5">
                  {summary.totalOtUsed} <span className="text-xs font-normal text-slate-400">hrs</span>
                </div>
              </div>

              <div className="bg-[#031724]/90 p-2.5 rounded-xl border border-[#0d344d]">
                <div className="text-[10px] text-cyan-300 font-semibold uppercase">
                  {isMl ? 'ടോട്ടൽ ലിമിറ്റ്' : 'Total Cap'}
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-cyan-300 mt-0.5">
                  {summary.cap} <span className="text-xs font-normal text-slate-400">hrs</span>
                </div>
              </div>

              <div className="bg-[#031724]/90 p-2.5 rounded-xl border border-emerald-500/40">
                <div className="text-[10px] text-emerald-300 font-semibold uppercase">
                  {isMl ? 'ബാക്കി ക്വാട്ട' : 'Remaining'}
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 mt-0.5">
                  {summary.remainingOt} <span className="text-xs font-normal text-slate-400">hrs</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300">
                  {isMl ? 'ഉപയോഗിച്ച ശതമാനം:' : 'Quota Progress:'} <strong className="text-white">{summary.percentUsed}%</strong>
                </span>
                <span className="text-slate-400">
                  {summary.totalOtUsed} / {summary.cap} hrs
                </span>
              </div>
              <div className="w-full h-3 bg-[#02131e] rounded-full overflow-hidden p-0.5 border border-[#103e5c]">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                  style={{ width: `${Math.min(100, (summary.totalOtUsed / summary.cap) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4. Month-by-Month Breakdown (3 Months in the cycle) */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-xs flex items-center justify-between">
              <span>{isMl ? '3 മാസത്തെ പ്രതിമാസ വിഭജനം (Monthly Breakdown):' : '3-Month Breakdown:'}</span>
              <span className="text-[10px] text-cyan-300 font-mono">
                {activeCycle.months.length} {isMl ? 'മാസങ്ങൾ' : 'Months'}
              </span>
            </h4>

            <div className="space-y-1.5">
              {summary.monthlyBreakdown.map((m, idx) => {
                const isCurrentMonth = m.monthIndex === new Date().getMonth();
                const monthContribution = summary.totalOtUsed > 0 
                  ? Math.round((m.otHours / summary.totalOtUsed) * 100) 
                  : 0;

                return (
                  <div 
                    key={m.monthIndex}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isCurrentMonth
                        ? 'bg-[#08293e] border-cyan-400/60 ring-1 ring-cyan-500/30'
                        : 'bg-[#041926] border-[#0f3954]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0a3048] border border-[#13486b] text-cyan-300 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        M{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{isMl ? m.monthNameMl : m.monthNameEn}</span>
                          {isCurrentMonth && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                              {isMl ? 'ഈ മാസം' : 'Current'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {m.daysWithOt > 0 ? (isMl ? `${m.daysWithOt} ദിവസങ്ങളിൽ OT` : `${m.daysWithOt} days OT`) : (isMl ? 'ഡ്യൂട്ടി രേഖപ്പെടുത്തി' : 'Duty recorded')}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-amber-300 text-sm">
                        {m.otHours} <span className="text-[10px] font-normal text-slate-400">hrs OT</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        {monthContribution}% of used
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Download & WhatsApp Share OT Register Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#07263b] via-[#09314b] to-[#062235] border border-amber-400/50 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-extrabold text-white text-xs">
                  {isMl ? 'OT ഷീറ്റ് ഡൗൺലോഡ് & വാട്സാപ്പ് ഷെയർ:' : 'OT Sheet Download & WhatsApp Share:'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300">
                {otPdfData.totalOtHours} hrs ({otPdfData.totalOtDays}d)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={async () => {
                  const ok = await generateAndDownloadNextMonthOtPdf(otPdfData);
                  if (ok) {
                    setToastMessage(isMl ? 'OT PDF ഡൗൺലോഡ് ചെയ്തു!' : 'OT PDF Downloaded!');
                    setTimeout(() => setToastMessage(null), 4000);
                  }
                }}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isMl ? 'ഡൗൺലോഡ് PDF' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOtSheetViewer(true)}
                className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>{isMl ? 'വാട്സാപ്പ് ഷെയർ (JPG)' : 'WhatsApp (JPG)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOtSheetViewer(true)}
                className="py-2 px-3 rounded-xl bg-[#0b3550] hover:bg-[#104668] text-cyan-200 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-cyan-300" />
                <span>{isMl ? 'OT ഷീറ്റ് കാണുക / സേവ്' : 'View / Save JPG'}</span>
              </button>
            </div>
          </div>

          {/* 6. CSL / Factories Act Statutory Rule Explanation */}
          <div className="p-3 rounded-2xl bg-[#031522] border border-[#0e354e] text-slate-300 space-y-1 leading-relaxed">
            <div className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
              <span>⚖️</span>
              <span>{isMl ? 'CSL ക്വാർട്ടർ OT നിയമങ്ങൾ:' : 'CSL Quarterly OT Rules:'}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isMl 
                ? 'ഫാക്ടറീസ് ആക്ട് അനുസരിച്ച് ഓരോ 3 മാസത്തിലും (മാർച്ച്-മെയ്, ജൂൺ-ആഗസ്റ്റ്, സെപ്റ്റംബർ-നവംബർ, ഡിസംബർ-ഫെബ്രുവരി) ഓവർടൈം നിശ്ചിത പരിധിയിൽ (75 മണിക്കൂർ അല്ലെങ്കിൽ പ്രത്യേക അനുമതിയോടെ 120 മണിക്കൂർ) കൂടുതൽ ആകാൻ പാടില്ല.'
                : 'Under the Factories Act and CSL rules, overtime in each 3-month cycle (Mar-May, Jun-Aug, Sep-Nov, Dec-Feb) has a statutory ceiling of 75 hours, or 120 hours with extended authorization.'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#0e2c3e] bg-[#03121c] flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-slate-400 font-mono">
            <span>{isMl ? 'ആക്ടീവ് ലിമിറ്റ്:' : 'Active Cap:'} <strong className="text-amber-400">{cap} hrs</strong> · {isMl ? 'ചെയ്തത്:' : 'Used:'} <strong className="text-emerald-400">{summary.totalOtUsed} hrs</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md"
          >
            {isMl ? 'പൂർത്തിയായി' : 'Done'}
          </button>
        </div>

      </div>

      {/* Embedded OT Sheet Viewer & Downloader Modal */}
      <CslNextMonthOtViewerModal
        isOpen={showOtSheetViewer}
        onClose={() => setShowOtSheetViewer(false)}
        data={otPdfData}
        language={language}
      />
    </div>
  );
};
