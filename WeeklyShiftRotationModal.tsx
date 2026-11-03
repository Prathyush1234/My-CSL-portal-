import React, { useState, useEffect } from 'react';
import {
  X, RotateCw, Calendar, Clock, CheckCircle2, ArrowRight,
  Sparkles, AlertCircle, ArrowLeftRight, Check, ChevronRight,
  ShieldCheck, HelpCircle, Layers, CalendarDays
} from 'lucide-react';
import { Language } from '../types';
import { CSL_SHIFTS, CslShiftCode } from '../data/cslShifts';
import {
  getCurrentAndNextWeekShift,
  setCurrentWeekShift,
  getUpcomingWeeksRotation,
  getWeeklyShiftForDate,
  formatDateKey,
  saveShiftOverride,
  applyWeeklyRotationToMonth,
  WeekRotationScheduleItem
} from '../utils/shiftRotation';

interface WeeklyShiftRotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onApplied?: () => void;
}

export const WeeklyShiftRotationModal: React.FC<WeeklyShiftRotationModalProps> = ({
  isOpen,
  onClose,
  language,
  onApplied,
}) => {
  const isMl = language === 'ml';

  // Rotation overview state
  const [rotationData, setRotationData] = useState(() => getCurrentAndNextWeekShift());
  const [upcomingWeeks, setUpcomingWeeks] = useState<WeekRotationScheduleItem[]>(() => getUpcomingWeeksRotation(8));

  // Date Checker Tool state
  const [checkDateStr, setCheckDateStr] = useState<string>(() => formatDateKey(new Date()));
  const [checkedDateInfo, setCheckedDateInfo] = useState(() => getWeeklyShiftForDate(new Date()));

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync state on open and on rotation events
  const refreshState = () => {
    const data = getCurrentAndNextWeekShift();
    setRotationData(data);
    setUpcomingWeeks(getUpcomingWeeksRotation(8, data.config));
    setCheckedDateInfo(getWeeklyShiftForDate(checkDateStr, data.config));
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleRotationEvent = () => {
      refreshState();
    };
    window.addEventListener('csl-shift-rotation-changed', handleRotationEvent);
    return () => {
      window.removeEventListener('csl-shift-rotation-changed', handleRotationEvent);
    };
  }, [checkDateStr]);

  // Update check date result when input changes
  const handleDateChange = (newDateStr: string) => {
    setCheckDateStr(newDateStr);
    setCheckedDateInfo(getWeeklyShiftForDate(newDateStr));
  };

  // Toggle this week's shift between A2 and B2
  const handleToggleCurrentWeekShift = () => {
    const nextShift: 'A2' | 'B2' = rotationData.thisWeekShift === 'A2' ? 'B2' : 'A2';
    setCurrentWeekShift(nextShift);
    refreshState();
    showToast(
      isMl
        ? `ഈ ആഴ്ചത്തെ ഷിഫ്റ്റ് ${nextShift === 'A2' ? 'ഷിഫ്റ്റ് A2 (രാവിലെ)' : 'ഷിഫ്റ്റ് B2 (ഉച്ചതിരിഞ്ഞ്)'} ആക്കി മാറ്റി. അടുത്ത ആഴ്ച സ്വയം ${nextShift === 'A2' ? 'B2' : 'A2'} ആകും.`
        : `This week's shift set to ${nextShift}. Next week will automatically be ${nextShift === 'A2' ? 'B2' : 'A2'}.`
    );
  };

  // One-click apply rotation to October 2026 calendar & attendance
  const handleApplyToCalendar = () => {
    applyWeeklyRotationToMonth(9, 2026); // October
    applyWeeklyRotationToMonth(10, 2026); // November
    if (onApplied) onApplied();
    showToast(
      isMl
        ? 'പ്രതിവാര A2 ↔ B2 റൊട്ടേഷൻ കലണ്ടറിലേക്കും ഡ്യൂട്ടി പട്ടികയിലേക്കും വിജയകരമായി പ്രയോഗിച്ചു!'
        : 'Weekly A2 ↔ B2 rotation successfully applied to calendar and attendance logs!'
    );
  };

  // Override / swap single date shift
  const handleOverrideDateShift = (shift: CslShiftCode) => {
    saveShiftOverride(checkDateStr, shift);
    refreshState();
    showToast(
      isMl
        ? `${checkDateStr} തീയതിയിൽ ${shift} ഡ്യൂട്ടി നിശ്ചയിച്ചു (സ്വാപ്പ് ചെയ്തത്).`
        : `Shift ${shift} assigned for ${checkDateStr} (Single-day swap).`
    );
  };

  const handleClearOverride = () => {
    saveShiftOverride(checkDateStr, null);
    refreshState();
    showToast(
      isMl
        ? `${checkDateStr} തീയതിയിലെ മാറ്റം ഒഴിവാക്കി വീക്കിലി റൊട്ടേഷനിലേക്ക് തിരികെ മാറ്റി.`
        : `Reset ${checkDateStr} back to standard weekly rotation.`
    );
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  if (!isOpen) return null;

  const thisShiftDef = CSL_SHIFTS[rotationData.thisWeekShift];
  const nextShiftDef = CSL_SHIFTS[rotationData.nextWeekShift];

  // Helper to format date display
  const parsedCheckDate = new Date(checkDateStr + 'T00:00:00');
  const isSunday = parsedCheckDate.getDay() === 0;
  const isSaturday = parsedCheckDate.getDay() === 6;
  const dayNum = parsedCheckDate.getDate();
  const isSecondOrFourthSat = isSaturday && ((dayNum >= 8 && dayNum <= 14) || (dayNum >= 22 && dayNum <= 28));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#091f2e] via-[#041422] to-[#020b13] border border-cyan-800/60 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0d2a3d] to-[#061824] border-b border-cyan-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <RotateCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  {isMl ? 'എ ടു ⇄ ബി ടു പ്രതിവാര ഷിഫ്റ്റ് റൊട്ടേഷൻ' : 'Weekly Shift Rotation (A2 ⇄ B2)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  CSL Yard Auto-Cycle
                </span>
              </div>
              <p className="text-xs text-cyan-200/70">
                {isMl
                  ? 'എ ടു ഷിപ്റ്റും ബി ടു ഷിപ്റ്റും ഓരോ വീക്കിനും മാറിക്കൊണ്ടിരിക്കും'
                  : 'A2 and B2 shifts alternate every week automatically'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-xs flex items-center gap-2 animate-bounce-short">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-sm">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-950/50 via-cyan-950/40 to-slate-900/60 border border-teal-800/50 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-teal-200">
                {isMl ? 'ഷിഫ്റ്റ് റൊട്ടേഷൻ നിയമം (Rotation Rule):' : 'Weekly Rotation Logic:'}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {isMl
                  ? 'ഇപ്പോൾ ഈ ആഴ്ച Shift A2 ആണെങ്കിൽ അടുത്ത ആഴ്ച സ്വയം Shift B2 ആയി മാറും. അതിനടുത്ത ആഴ്ച വീണ്ടും Shift A2 ആകും. ഓരോ തിങ്കളാഴ്ചയും ഷിഫ്റ്റ് അടുത്ത സൈക്കിളിലേക്ക് സ്വമേധയാ മാറുന്നു.'
                  : 'If this week is Shift A2, next week automatically becomes Shift B2. The following week switches back to Shift A2, alternating week-by-week on Mondays.'}
              </p>
            </div>
          </div>

          {/* Current vs Next Week Interactive Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* This Week Card */}
            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
              rotationData.thisWeekShift === 'A2'
                ? 'bg-gradient-to-br from-teal-950/70 via-[#03242b] to-[#011419] border-teal-500/60 shadow-lg shadow-teal-950/40'
                : 'bg-gradient-to-br from-amber-950/70 via-[#2a1a06] to-[#140b02] border-amber-500/60 shadow-lg shadow-amber-950/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/10 text-white border border-white/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  {isMl ? 'ഈ ആഴ്ച (നിലവിലെ)' : 'THIS WEEK (CURRENT)'}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">
                  {isMl ? `ആഴ്ച ${rotationData.weekNumber}` : `Week ${rotationData.weekNumber}`}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <div className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
                    {thisShiftDef.name}
                    <span className="text-xs px-2 py-0.5 rounded font-normal bg-cyan-900/60 text-cyan-200 border border-cyan-700/50">
                      {isMl ? thisShiftDef.nameMl : (rotationData.thisWeekShift === 'A2' ? 'Morning Shift' : 'Afternoon Shift')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-white">{thisShiftDef.inTime} – {thisShiftDef.outTime}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isMl ? 'പഞ്ച് വിൻഡോ:' : 'Punch Start:'}</span>
                  <span className="text-teal-300 font-medium">{thisShiftDef.punchWindowStart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isMl ? 'ഇൻ ഗ്രേസ് (+5 മിനിറ്റ്):' : 'In Grace (+5m):'}</span>
                  <span className="text-amber-300 font-medium">{thisShiftDef.graceDeadline}</span>
                </div>
              </div>

              {/* Quick switch button */}
              <button
                type="button"
                onClick={handleToggleCurrentWeekShift}
                className="mt-3.5 w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-300" />
                <span>
                  {isMl
                    ? `ഈ ആഴ്ച ${rotationData.thisWeekShift === 'A2' ? 'Shift B2' : 'Shift A2'} ആക്കി മാറ്റുക`
                    : `Switch This Week to ${rotationData.thisWeekShift === 'A2' ? 'Shift B2' : 'Shift A2'}`}
                </span>
              </button>
            </div>

            {/* Next Week Card */}
            <div className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
              rotationData.nextWeekShift === 'A2'
                ? 'bg-gradient-to-br from-teal-950/40 via-[#031d23] to-[#011419] border-teal-600/40'
                : 'bg-gradient-to-br from-amber-950/40 via-[#211404] to-[#140b02] border-amber-600/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/5 text-slate-300 border border-white/10">
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  {isMl ? 'അടുത്ത ആഴ്ച (ഓട്ടോമാറ്റിക്)' : 'NEXT WEEK (AUTOMATIC)'}
                </span>
                <span className="text-[11px] text-cyan-300 font-medium">
                  {isMl ? `ആഴ്ച ${rotationData.weekNumber + 1}` : `Week ${rotationData.weekNumber + 1}`}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <div className="text-2xl font-black text-white tracking-wide flex items-center gap-2">
                    {nextShiftDef.name}
                    <span className="text-xs px-2 py-0.5 rounded font-normal bg-slate-800 text-slate-300 border border-slate-700">
                      {isMl ? nextShiftDef.nameMl : (rotationData.nextWeekShift === 'A2' ? 'Morning Shift' : 'Afternoon Shift')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-white">{nextShiftDef.inTime} – {nextShiftDef.outTime}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isMl ? 'പഞ്ച് വിൻഡോ:' : 'Punch Start:'}</span>
                  <span className="text-teal-300 font-medium">{nextShiftDef.punchWindowStart}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isMl ? 'ഇൻ ഗ്രേസ് (+5 മിനിറ്റ്):' : 'In Grace (+5m):'}</span>
                  <span className="text-amber-300 font-medium">{nextShiftDef.graceDeadline}</span>
                </div>
              </div>

              <div className="mt-3.5 p-2 rounded-lg bg-black/40 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  {isMl
                    ? `അടുത്ത തിങ്കളാഴ്ച ഷിഫ്റ്റ് സ്വയം ${nextShiftDef.name} ആയി മാറും.`
                    : `Next Monday automatically transitions to ${nextShiftDef.name}.`}
                </span>
              </div>
            </div>
          </div>

          {/* Date Checker: "Check Shift for Any Date" */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label htmlFor="shift-date-picker" className="text-xs font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-cyan-400" />
                <span>
                  {isMl
                    ? 'ഏതെങ്കിലും തീയതിയിലെ ഷിഫ്റ്റ് അറിയുക (Date Shift Checker):'
                    : 'Check Shift for Any Date:'}
                </span>
              </label>
              <input
                id="shift-date-picker"
                type="date"
                value={checkDateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-slate-950 border border-cyan-800/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Date Result Box */}
            <div className="p-3.5 rounded-lg bg-[#041624] border border-cyan-900/60 flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-white font-medium">
                    {parsedCheckDate.toLocaleDateString(isMl ? 'ml-IN' : 'en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  {checkedDateInfo.isCurrentWeek && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                      {isMl ? 'ഈ ആഴ്ച' : 'This Week'}
                    </span>
                  )}
                  {checkedDateInfo.isNextWeek && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      {isMl ? 'അടുത്ത ആഴ്ച' : 'Next Week'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isSunday ? (
                    <span className="text-red-400 font-bold text-base flex items-center gap-1.5">
                      {isMl ? 'ഞായറാഴ്ച (വീക്കിലി ഓഫ്)' : 'Sunday (Weekly Off)'}
                    </span>
                  ) : isSecondOrFourthSat ? (
                    <span className="text-amber-400 font-bold text-base flex items-center gap-1.5">
                      {isMl ? 'ശനിയാഴ്ച ഓഫ് (2nd/4th Saturday Off)' : 'Saturday Off (2nd/4th Saturday)'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">
                        {checkedDateInfo.actualShiftCode} — {checkedDateInfo.shiftDef.name}
                      </span>
                      <span className="text-xs text-cyan-300">
                        ({checkedDateInfo.shiftDef.inTime} - {checkedDateInfo.shiftDef.outTime})
                      </span>
                      {checkedDateInfo.isOverridden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {isMl ? 'ഡ്യൂട്ടി മാറ്റം (Swapped)' : 'Swapped'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Day Swap / Override Buttons */}
              {!isSunday && !isSecondOrFourthSat && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] mr-1">{isMl ? 'മാറ്റം:' : 'Swap:'}</span>
                  <button
                    type="button"
                    onClick={() => handleOverrideDateShift('A2')}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      checkedDateInfo.actualShiftCode === 'A2'
                        ? 'bg-teal-600 text-white border-teal-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    A2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOverrideDateShift('B2')}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      checkedDateInfo.actualShiftCode === 'B2'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    B2
                  </button>
                  {checkedDateInfo.isOverridden && (
                    <button
                      type="button"
                      onClick={handleClearOverride}
                      className="px-2 py-1 rounded text-[10px] text-slate-400 hover:text-white bg-slate-800 border border-slate-700 cursor-pointer"
                    >
                      {isMl ? 'റദ്ദാക്കുക' : 'Reset'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming 8 Weeks Alternating Rotation Timeline */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isMl
                    ? 'വരാനിരിക്കുന്ന ആഴ്ചകളിലെ റൊട്ടേഷൻ ഷെഡ്യൂൾ (Upcoming Weeks Schedule):'
                    : 'Upcoming Weeks Rotation Schedule:'}
                </span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {isMl ? 'തുടർച്ചയായി A2 ⇄ B2 മാറുന്നു' : 'Alternating A2 ⇄ B2 continuously'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {upcomingWeeks.map((item) => {
                const isA2 = item.shift === 'A2';
                return (
                  <div
                    key={item.weekIndex}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                      item.isCurrentWeek
                        ? 'bg-teal-950/60 border-teal-500/80 shadow-md ring-1 ring-teal-500/30'
                        : item.isNextWeek
                        ? 'bg-cyan-950/40 border-cyan-600/50'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-8 h-8 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${
                          isA2
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {item.shift}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <span>{isMl ? item.labelMl : item.labelEn}</span>
                          {item.isCurrentWeek && (
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.startDateFormatted} – {item.endDateFormatted}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isA2
                            ? 'bg-teal-900/50 text-teal-200 border border-teal-700/50'
                            : 'bg-amber-900/50 text-amber-200 border border-amber-700/50'
                        }`}
                      >
                        {isA2 ? (isMl ? 'രാവിലെ' : '07:00-15:20') : (isMl ? 'ഉച്ചതിരിഞ്ഞ്' : '13:40-22:00')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer with One-Click Apply */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#061724] to-[#030e17] border-t border-cyan-900/50 flex items-center justify-between flex-wrap gap-2">
          <div className="text-[11px] text-slate-400">
            {isMl
              ? 'ഓരോ ആഴ്ചയും ഷിഫ്റ്റ് സ്വയമേവ അപ്‌ഡേറ്റ് ചെയ്യപ്പെടും.'
              : 'Shifts automatically alternate weekly.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyToCalendar}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-teal-950/50 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {isMl
                  ? 'കലണ്ടറിലേക്കും ഡ്യൂട്ടിയിലേക്കും പ്രയോഗിക്കുക'
                  : 'Apply to Calendar & Logs'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              {isMl ? 'അടയ്ക്കുക' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
