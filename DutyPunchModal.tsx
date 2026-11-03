import React, { useState, useEffect } from 'react';
import { Clock, Zap, CheckCircle2, X, Calendar, Sparkles } from 'lucide-react';
import {
  CSL_SHIFTS,
  CSL_SHIFT_CODES,
  CslShiftCode,
  DutyPunchData,
  calculateAutomaticOTFromOutTime,
  getShiftTimeWithOt,
  isSundayDate,
  isCslHolidayDate,
  getRecommendedShiftForDate,
} from '../data/cslShifts';
import { Language } from '../types';
import { VisualClockPicker } from './VisualClockPicker';
import { getNowTime12, to24HourTime, to12HourTime, adjustTimeString } from '../utils/timeQuickSet';
import { shareHalfDayPunchToWhatsApp, getWhatsAppShareUrl } from '../utils/whatsappShare';

interface DutyPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DutyPunchData) => void;
  initialDate?: string; // '2026-10-15'
  initialShift?: CslShiftCode;
  initialInTime?: string;
  initialOutTime?: string;
  initialOt?: string;
  leave?: DutyPunchData['leave'];
  initialHalfDay?: DutyPunchData['halfDay'];
  initialLeave?: DutyPunchData['leave'];
  initialNotes?: string;
  language?: Language;
  currentUser?: {
    name: string;
    token: string;
    phone?: string;
    department?: string;
  };
}

export const DutyPunchModal: React.FC<DutyPunchModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate = new Date().toISOString().slice(0, 10),
  initialShift = 'A2',
  initialInTime,
  initialOutTime,
  initialOt = '',
  initialLeave = 'None',
  initialHalfDay = 'No',
  initialNotes = '',
  language = 'en',
  currentUser,
}) => {
  const isMl = language === 'ml';
  const isContract = (currentUser as any)?.category === 'contract' || 
    (typeof window !== 'undefined' && localStorage.getItem('csl_employee_category') === 'contract');
  const isSunday = isSundayDate(initialDate);
  const holidayInfo = isCslHolidayDate(initialDate);
  const isHolidayDuty = isSunday || holidayInfo.isHoliday;

  // Rule 1: Every Sunday, if there is work, the shift is C1 (08:00 AM - 04:20 PM)
  const defaultShift: CslShiftCode = isSunday ? 'C1' : initialShift;

  const [shift, setShift] = useState<CslShiftCode>(defaultShift);
  const [inTime, setInTime] = useState<string>(initialInTime || CSL_SHIFTS[defaultShift].inTime);
  const [outTime, setOutTime] = useState<string>(initialOutTime || CSL_SHIFTS[defaultShift].outTime);
  const [ot, setOt] = useState<string>(initialOt);
  const [leave, setLeave] = useState<DutyPunchData['leave']>(initialLeave);
  const [halfDay, setHalfDay] = useState<DutyPunchData['halfDay']>(initialHalfDay);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [clockPickerTarget, setClockPickerTarget] = useState<'in' | 'out' | null>(null);
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  // When initialShift or isOpen changes, sync state
  useEffect(() => {
    if (isOpen) {
      const isSun = isSundayDate(initialDate);
      const hInfo = isCslHolidayDate(initialDate);
      const isHol = isSun || hInfo.isHoliday;

      // Rule 1: Every Sunday, work defaults to Shift C1!
      const targetShift: CslShiftCode = isSun ? 'C1' : initialShift;
      setShift(targetShift);

      const initIn = initialInTime || CSL_SHIFTS[targetShift].inTime;
      const initOut = initialOutTime || CSL_SHIFTS[targetShift].outTime;
      setInTime(initIn);
      setOutTime(initOut);

      // Auto-compute OT from out time (on Sunday / Holiday, full worked time counts as OT!)
      const autoOt = calculateAutomaticOTFromOutTime(targetShift, initOut, initIn, initialDate);
      setOt(initialOt || autoOt.otStr);
      setLeave(initialLeave || 'None');
      setHalfDay(initialHalfDay || 'No');

      if (initialNotes) {
        setNotes(initialNotes);
      } else if (isSun) {
        setNotes('ഞായറാഴ്ച ഡ്യൂട്ടി (Sunday C1 Shift · Holiday OT)');
      } else if (hInfo.isHoliday) {
        setNotes(`${hInfo.holidayNameMl || hInfo.holidayName} ഹോളിഡേ ഡ്യൂട്ടി (Holiday Duty · Special OT)`);
      } else {
        setNotes('');
      }
    }
  }, [isOpen, initialDate, initialShift, initialInTime, initialOutTime, initialOt, initialLeave, initialHalfDay, initialNotes]);

  // When user switches shift, auto-populate In and Out matching CSL official timings
  const handleShiftChange = (newShift: CslShiftCode) => {
    setShift(newShift);
    const def = CSL_SHIFTS[newShift];
    setInTime(def.inTime);
    setOutTime(def.outTime);
    // Recalculate OT
    const autoOt = calculateAutomaticOTFromOutTime(newShift, def.outTime, def.inTime, initialDate);
    setOt(autoOt.otStr);
  };

  // Helper when outTime is updated to automatically recalculate OT
  const handleOutTimeChange = (newOutTime: string) => {
    setOutTime(newOutTime);
    const autoOt = calculateAutomaticOTFromOutTime(shift, newOutTime, inTime, initialDate);
    setOt(autoOt.otStr);
  };

  const autoOtInfo = calculateAutomaticOTFromOutTime(shift, outTime, inTime, initialDate);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      dateStr: initialDate,
      shift,
      inTime,
      outTime,
      ot: ot || autoOtInfo.otStr,
      leave,
      halfDay,
      autoCalculatedOt: autoOtInfo.isOvertime,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs select-none overflow-hidden">
      <div 
        className="bg-white rounded-3xl w-full max-w-[450px] max-h-[92vh] sm:max-h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duty-punch-title"
      >
        {/* Header - Sticky at top */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-slate-200 shrink-0 bg-slate-50/80">
          <div>
            <h3 id="duty-punch-title" className="font-extrabold text-base sm:text-lg text-[#1a365d] tracking-tight">
              Duty Punch: {initialDate}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {isMl ? 'റെഗുലർ സമയം കഴിഞ്ഞാൽ ഓവർടൈം ഓട്ടോമാറ്റിക്' : 'Automatic Overtime after regular shift hours'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#005f73]">
              CSL Roster
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form id="duty-punch-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-sm overscroll-contain">
          {/* Sunday / Holiday Duty Alert Banner */}
          {isSunday && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-2 border-amber-500/60 shadow-xs space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="font-extrabold text-xs text-amber-950 flex items-center gap-1">
                  ⚡ {isMl ? 'ഞായറാഴ്ച വർക്ക്: ഷിഫ്റ്റ് C1 (08:00 AM - 04:20 PM)' : 'Sunday Work: Shift C1 (08:00 AM - 04:20 PM)'}
                </span>
              </div>
              <p className="text-[11px] text-amber-900 leading-snug font-medium">
                {isMl 
                  ? 'എല്ലാ ഞായറാഴ്ചയും വർക്ക് ഉണ്ടെങ്കിൽ സി വൺ (C1) ഷിഫ്റ്റ് ആയിരിക്കും. കൂടാതെ ഞായറാഴ്ച ജോലി ചെയ്താൽ മുഴുവൻ സമയവും ഓവർടൈം (Holiday OT) ആയി കണക്കാക്കും.' 
                  : 'Every Sunday work is automatically Shift C1 (08:00 AM - 04:20 PM). All hours worked are calculated as Overtime (Holiday OT).'}
              </p>
            </div>
          )}

          {holidayInfo.isHoliday && !isSunday && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-orange-500/15 border-2 border-rose-500/60 shadow-xs space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-extrabold text-xs text-rose-950 flex items-center gap-1">
                  🏖️ {holidayInfo.holidayNameMl || holidayInfo.holidayName} · {isMl ? 'CSL ഗസറ്റഡ് ഹോളിഡേ ഡ്യൂട്ടി' : 'CSL Gazetted Holiday Duty'}
                </span>
              </div>
              <p className="text-[11px] text-rose-900 leading-snug font-medium">
                {isMl 
                  ? 'ഹോളിഡേയിൽ വർക്ക് ചെയ്താൽ മുഴുവൻ സമയവും ഓവർടൈം (Holiday Duty OT) ആയി കണക്കാക്കും.' 
                  : 'CSL Rule: Working on a closed holiday is credited fully as Overtime (Holiday Duty OT).'}
              </p>
            </div>
          )}

          {/* Quick Shift Selection Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {isMl ? 'CSL ഷിഫ്റ്റ് തിരഞ്ഞെടുക്കുക:' : 'Select CSL Shift:'}
              </label>
              {isSunday && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  ⚡ Sunday = C1
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {CSL_SHIFT_CODES.map((code) => {
                const def = CSL_SHIFTS[code];
                const isSelected = shift === code;
                const isSundayC1 = isSunday && code === 'C1';
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleShiftChange(code)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border relative ${
                      isSelected
                        ? (isSundayC1 ? 'bg-amber-600 text-white border-amber-700 shadow-sm' : 'bg-[#1b4965] text-white border-[#1b4965] shadow-xs')
                        : (isSundayC1 ? 'bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-100 font-extrabold ring-1 ring-amber-400' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100')
                    }`}
                    title={`${isMl ? def.nameMl : def.name}: ${def.inTime} - ${def.outTime}`}
                  >
                    <span className="block flex items-center justify-center gap-0.5">
                      <span>{code}</span>
                      {isSundayC1 && <span className="text-[9px]">⭐</span>}
                    </span>
                    <span className="text-[9px] block opacity-85 font-mono truncate">{def.inTime.replace(' ', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Row 1: Shift */}
          <div className="flex items-center justify-between gap-3">
            <label className="w-20 font-bold text-slate-800 shrink-0">
              {isMl ? 'ഷിഫ്റ്റ്:' : 'Shift:'}
            </label>
            <div className="flex-1 relative">
              <select
                value={shift}
                onChange={(e) => handleShiftChange(e.target.value as CslShiftCode)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent cursor-pointer shadow-2xs"
              >
                <option value="A2">A2 (07:00 AM - 03:20 PM) · {isMl ? 'രാവിലെ ഷിഫ്റ്റ്' : 'Morning Shift'}</option>
                <option value="B2">B2 (01:40 PM - 10:00 PM) · {isMl ? 'ഉച്ചതിരിഞ്ഞുള്ള ഷിഫ്റ്റ്' : 'Afternoon Shift'}</option>
                <option value="C1">C1 (08:00 AM - 04:20 PM) · {isMl ? 'ഡേ ഷിഫ്റ്റ്' : 'Day Shift'}</option>
                <option value="C2">C2 (06:00 AM - 02:00 PM) · {isMl ? 'പുലർച്ചെ ഷിഫ്റ്റ്' : 'Early Morning Shift'}</option>
              </select>
            </div>
          </div>

          {/* Row 2: In */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label className="w-20 font-bold text-slate-800 shrink-0">
                {isMl ? 'ഇൻ (In):' : 'In:'}
              </label>
              <div className="flex-1 relative flex items-center gap-1.5">
                <input
                  type="text"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  placeholder="HH : MM AM/PM"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 pr-20 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent shadow-2xs text-sm"
                />

                {/* Quick Steppers: -5m, +5m inside input */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setInTime(adjustTimeString(inTime, -5))}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="-5 mins"
                  >
                    -5m
                  </button>
                  <button
                    type="button"
                    onClick={() => setInTime(adjustTimeString(inTime, 5))}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="+5 mins"
                  >
                    +5m
                  </button>
                </div>

                {/* Native Device Time Input trigger */}
                <div className="relative w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 flex items-center justify-center text-teal-700 cursor-pointer overflow-hidden shrink-0 shadow-xs" title={isMl ? 'ഫോൺ ക്ലോക്ക് / ടൈം പിക്കർ' : 'Native Device Time Picker'}>
                  <Clock className="w-4 h-4 pointer-events-none" />
                  <input
                    type="time"
                    value={to24HourTime(inTime)}
                    onChange={(e) => {
                      if (e.target.value) setInTime(to12HourTime(e.target.value));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title={isMl ? 'സമയം തിരഞ്ഞെടുക്കുക' : 'Pick Time'}
                  />
                </div>

                {/* Visual Clock Dial button */}
                <button
                  type="button"
                  onClick={() => setClockPickerTarget('in')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 active:scale-90 transition-all cursor-pointer shadow-xs shrink-0"
                  title={isMl ? 'ക്ലോക്ക് ഡയൽ തുറക്കുക' : 'Open Visual Clock Dial'}
                  aria-label="Open Visual Clock Dial for In Time"
                >
                  <span className="text-xs font-black">🕒</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click In Times & Steppers */}
            <div className="ml-0 sm:ml-23 flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setInTime(getNowTime12())}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer"
                title="Current IST Time"
              >
                ⚡ {isMl ? 'ഇപ്പോൾ (Now)' : 'Now'}
              </button>
              <button
                type="button"
                onClick={() => setInTime(CSL_SHIFTS[shift].inTime)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  inTime === CSL_SHIFTS[shift].inTime
                    ? 'bg-[#1b4965] text-white border-[#1b4965]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
                title={`Exact Shift In (${CSL_SHIFTS[shift].inTime})`}
              >
                🕒 {isMl ? 'ഷിഫ്റ്റ് ഇൻ' : 'Shift In'} ({CSL_SHIFTS[shift].inTime})
              </button>
              <button
                type="button"
                onClick={() => setInTime(CSL_SHIFTS[shift].punchStart)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  inTime === CSL_SHIFTS[shift].punchStart
                    ? 'bg-cyan-700 text-white border-cyan-700'
                    : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                }`}
                title="30 mins early punch window start"
              >
                ⏱️ -30m ({CSL_SHIFTS[shift].punchStart})
              </button>
              <button
                type="button"
                onClick={() => setInTime(CSL_SHIFTS[shift].graceDeadline)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  inTime === CSL_SHIFTS[shift].graceDeadline
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title="5 mins late grace deadline"
              >
                +5m {isMl ? 'ഗ്രേസ്' : 'Grace'} ({CSL_SHIFTS[shift].graceDeadline})
              </button>
              {/* Extra Stepper buttons */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setInTime(adjustTimeString(inTime, -15))}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 cursor-pointer"
                  title="-15 mins"
                >
                  -15m
                </button>
                <button
                  type="button"
                  onClick={() => setInTime(adjustTimeString(inTime, 15))}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 cursor-pointer"
                  title="+15 mins"
                >
                  +15m
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Out */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <label className="w-20 font-bold text-slate-800 shrink-0">
                {isMl ? 'ഔട്ട് (Out):' : 'Out:'}
              </label>
              <div className="flex-1 relative flex items-center gap-1.5">
                <input
                  type="text"
                  value={outTime}
                  onChange={(e) => handleOutTimeChange(e.target.value)}
                  placeholder="HH : MM AM/PM"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 pr-20 text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent shadow-2xs text-sm"
                />

                {/* Quick Steppers: -5m, +5m inside input */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleOutTimeChange(adjustTimeString(outTime, -5))}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="-5 mins"
                  >
                    -5m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOutTimeChange(adjustTimeString(outTime, 5))}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="+5 mins"
                  >
                    +5m
                  </button>
                </div>

                {/* Native Device Time Input trigger */}
                <div className="relative w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 flex items-center justify-center text-teal-700 cursor-pointer overflow-hidden shrink-0 shadow-xs" title={isMl ? 'ഫോൺ ക്ലോക്ക് / ടൈം പിക്കർ' : 'Native Device Time Picker'}>
                  <Clock className="w-4 h-4 pointer-events-none" />
                  <input
                    type="time"
                    value={to24HourTime(outTime)}
                    onChange={(e) => {
                      if (e.target.value) handleOutTimeChange(to12HourTime(e.target.value));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title={isMl ? 'സമയം തിരഞ്ഞെടുക്കുക' : 'Pick Time'}
                  />
                </div>

                {/* Visual Clock Dial button */}
                <button
                  type="button"
                  onClick={() => setClockPickerTarget('out')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 active:scale-90 transition-all cursor-pointer shadow-xs shrink-0"
                  title={isMl ? 'ക്ലോക്ക് ഡയൽ തുറക്കുക' : 'Open Visual Clock Dial'}
                  aria-label="Open Visual Clock Dial for Out Time"
                >
                  <span className="text-xs font-black">🕒</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Out Times: Now, Regular, Grace, and Overtime Hours */}
            <div className="ml-0 sm:ml-23 flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleOutTimeChange(getNowTime12())}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer"
                title="Current IST Time"
              >
                ⚡ {isMl ? 'ഇപ്പോൾ (Now)' : 'Now'}
              </button>
              <button
                type="button"
                onClick={() => handleOutTimeChange(CSL_SHIFTS[shift].outTime)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  outTime === CSL_SHIFTS[shift].outTime
                    ? 'bg-[#1b4965] text-white border-[#1b4965]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
                title="Regular shift end time (0 hours OT)"
              >
                {isMl ? 'റഗുലർ' : 'Regular'} ({CSL_SHIFTS[shift].outTime})
              </button>
              <button
                type="button"
                onClick={() => handleOutTimeChange(CSL_SHIFTS[shift].earlyOutGraceTime)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  outTime === CSL_SHIFTS[shift].earlyOutGraceTime
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100'
                }`}
                title="5 minutes early out grace for Permanent Employees"
              >
                ⚡ {isMl ? '5m ഗ്രേസ്' : '5m Grace'} ({CSL_SHIFTS[shift].earlyOutGraceTime})
              </button>

              {/* Overtime Shortcut buttons: +1h, +2h, +3h, +4h past regular shift */}
              {[1, 2, 3, 4].map((h) => {
                const targetTime = getShiftTimeWithOt(shift, h);
                const isSelected = outTime === targetTime;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleOutTimeChange(targetTime)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-0.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                    title={`Punch Out at ${targetTime} (${h} hour${h > 1 ? 's' : ''} Overtime)`}
                  >
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                    <span>+{h}h OT</span>
                    <span className="text-[9px] opacity-75">({targetTime})</span>
                  </button>
                );
              })}

              {/* Minute & Hour Steppers */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => handleOutTimeChange(adjustTimeString(outTime, -15))}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 cursor-pointer"
                  title="-15 mins"
                >
                  -15m
                </button>
                <button
                  type="button"
                  onClick={() => handleOutTimeChange(adjustTimeString(outTime, 15))}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 cursor-pointer"
                  title="+15 mins"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => handleOutTimeChange(adjustTimeString(outTime, 60))}
                  className="px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold border border-amber-300 cursor-pointer"
                  title="+1 hour"
                >
                  +1h
                </button>
              </div>
            </div>
          </div>

          {/* Row 4: OT (AUTOMATICALLY CALCULATED) */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <label className="w-20 font-bold text-slate-800 shrink-0 mt-2">
              {isMl ? 'ഓവർടൈം:' : 'Overtime:'}
            </label>
            <div className="flex-1 space-y-1.5">
              <div className="relative">
                <input
                  type="text"
                  value={ot}
                  onChange={(e) => setOt(e.target.value)}
                  placeholder="HH:MM (e.g. 01:00, 02:00)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-mono font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent shadow-2xs"
                />
                {autoOtInfo.isOvertime && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                    {autoOtInfo.otHours}h OT
                  </span>
                )}
              </div>

              {/* Automatic Calculation Banner & CSL Rule Note */}
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                autoOtInfo.isOvertime
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                {autoOtInfo.isOvertime ? (
                  <>
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                    <div>
                      <span className="font-extrabold block text-amber-950">
                        ⚡ {isMl ? `ഓട്ടോമാറ്റിക് ഓവർടൈം: ${autoOtInfo.otHours} മണിക്കൂർ (${autoOtInfo.otStr})` : `Automatic Overtime: ${autoOtInfo.otHours} hr(s) (${autoOtInfo.otStr})`}
                      </span>
                      <span className="text-[11px] text-amber-800">
                        {isMl ? autoOtInfo.explanationMl : autoOtInfo.explanationEn}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px]">
                      {isMl ? `റെഗുലർ ഡ്യൂട്ടി സമയം (${autoOtInfo.regularOutTime}). ഓവർടൈം ഇല്ല.` : `Regular shift time (${autoOtInfo.regularOutTime}). No overtime.`}
                    </span>
                  </>
                )}
              </div>

              {/* Full Day + OT WhatsApp Share Option */}
              {(autoOtInfo.isOvertime || (ot && parseFloat(ot) > 0)) && (() => {
                const displayOtHours = autoOtInfo.isOvertime 
                  ? autoOtInfo.otHours 
                  : (typeof ot === 'string' && ot.includes(':') 
                      ? (parseInt(ot.split(':')[0], 10) || 1) 
                      : (Math.floor(Number(ot)) || 1));

                return (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border-2 border-amber-400/90 shadow-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-950">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>{isMl ? 'ഫുൾ ഡേ + OT വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം:' : 'Share Full Day + OT on WhatsApp:'}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded border border-amber-400">
                        +{displayOtHours}h OT
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await shareHalfDayPunchToWhatsApp({
                            punchType: 'OUT',
                            dutyCategory: 'full_day_ot',
                            otHours: displayOtHours,
                            time: outTime,
                            dateStr: initialDate,
                            shiftCode: shift,
                            employeeName: currentUser?.name,
                            token: currentUser?.token,
                            department: currentUser?.department,
                            notes: notes || undefined,
                          });
                          if (res.success) {
                            setWhatsappToast(isMl ? `ഫുൾ ഡേ + ${displayOtHours}h OT (${outTime}) വാട്സ്ആപ്പിലേക്ക് ഷെയർ ചെയ്യുന്നു!` : `Sharing Full Day + ${displayOtHours}h OT (${outTime}) to WhatsApp!`);
                            setTimeout(() => setWhatsappToast(null), 3500);
                          }
                        }}
                        className="flex-1 p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-between shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">⚡</span>
                          <span>{isMl ? `${displayOtHours}h OT ഔട്ട് പഞ്ച് ഷെയർ` : `Share ${displayOtHours}h OT OUT`}</span>
                        </div>
                        <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          {outTime}
                        </span>
                      </button>
                    </div>

                    {/* Message Review */}
                    <div className="p-2 rounded-xl bg-white/90 border border-amber-300 text-[11px] font-mono flex items-center justify-between shadow-2xs">
                      <span className="font-bold text-amber-950 select-all">
                        {displayOtHours}h ot out punch @ {outTime}
                      </span>
                      <span className="text-[9px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-900 font-bold shrink-0 ml-1">
                        Exact Format
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Row 5: Leave */}
          <div className="flex items-start justify-between gap-3">
            <label className="w-20 font-bold text-slate-800 shrink-0 mt-2">
              {isMl ? 'അവധി (Leave):' : 'Leave:'}
            </label>
            <div className="flex-1 space-y-1.5">
              <select
                value={leave}
                onChange={(e) => setLeave(e.target.value as DutyPunchData['leave'])}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent cursor-pointer shadow-2xs"
              >
                <option value="None">None</option>
                <option value="Casual Leave (CL)">Casual Leave (CL) · കാഷ്വൽ ലീവ്</option>
                {isContract ? (
                  <option value="Medical Leave (ML)">Medical Leave (ML) · മെഡിക്കൽ ലീവ്</option>
                ) : (
                  <>
                    <option value="Half Pay Leave (HPL)">Half Pay Leave (HPL) · എച്ച്.പി.എൽ (20 Days)</option>
                    <option value="Earned Leave (EL)">Earned Leave (EL) · ഏൺഡ് ലീവ് (30 Days)</option>
                    <option value="Special Leave (SPL)">Special Leave (SPL / SCL) · സ്പെഷ്യൽ ലീവ് (15 Days)</option>
                    <option value="Medical Leave (ML)">Medical Leave (ML) · മെഡിക്കൽ ലീവ് (Deducted from EL)</option>
                    <option value="Restricted Holiday (RH)">Restricted Holiday (RH)</option>
                    <option value="Compensatory Off (CO)">Compensatory Off (CO)</option>
                  </>
                )}
              </select>

              {leave === 'Medical Leave (ML)' && (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-semibold flex items-start gap-1.5 animate-fadeIn">
                  <span className="text-amber-600 font-bold shrink-0">ℹ️</span>
                  <span>
                    {isContract
                      ? (isMl 
                          ? 'മെഡിക്കൽ സർട്ടിഫിക്കറ്റ് സഹിതം സമർപ്പിക്കേണ്ട മെഡിക്കൽ അവധി (Medical Leave).' 
                          : 'Medical Leave (ML) to be availed against valid Medical Certificate.')
                      : (isMl 
                          ? 'CSL ചട്ടം: മെഡിക്കൽ ലീവ് (ML) അനുവദിക്കുമ്പോൾ അത് Earned Leave (EL) ബാലൻസിൽ നിന്നാണ് കിഴിവ് ചെയ്യുന്നത്.' 
                          : 'CSL Rule: Medical Leave (ML) is directly deducted from your Earned Leave (EL) quota.')
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Row 6: Half Day */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="w-20 font-bold text-slate-800 shrink-0">
                {isMl ? 'ഹാഫ് ഡേ:' : 'Half Day:'}
              </label>
              <div className="flex-1">
                <select
                  value={halfDay}
                  onChange={(e) => {
                    const val = e.target.value as DutyPunchData['halfDay'];
                    setHalfDay(val);
                    if (val === 'Yes (First Half)') {
                      setInTime(CSL_SHIFTS[shift].inTime);
                      setOutTime('12:30 PM');
                    } else if (val === 'Yes (Second Half)') {
                      setInTime('12:30 PM');
                      setOutTime(CSL_SHIFTS[shift].outTime);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent cursor-pointer shadow-2xs"
                >
                  <option value="No">No</option>
                  <option value="Yes (First Half)">Yes (First Half - ഒന്നാം പകുതി)</option>
                  <option value="Yes (Second Half)">Yes (Second Half - രണ്ടാം പകുതി)</option>
                </select>
              </div>
            </div>

            {/* Dedicated Half Day WhatsApp Sharing Box */}
            {halfDay !== 'No' && (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-400/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      📲
                    </span>
                    <span className="font-extrabold text-xs text-emerald-950">
                      {isMl ? 'വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ഹാഫ് ഡേ സമയം ഷെയർ ചെയ്യാം:' : 'Share Half Day Time to WhatsApp Group:'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/90 text-emerald-900 border border-emerald-400">
                    {halfDay === 'Yes (First Half)' ? 'First Half' : 'Second Half'}
                  </span>
                </div>

                <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                  {isMl 
                    ? 'ഹാഫ് ഡേ ഇൻ / ഔട്ട് പഞ്ച് ചെയ്യുമ്പോൾ ആ സമയം നിങ്ങളുടെ CSL ടീം വാട്സ്ആപ്പ് ഗ്രൂപ്പിലേക്ക് അയക്കാൻ താഴെ ക്ലിക്ക് ചെയ്യുക:' 
                    : 'Click below to share your exact Half Day IN or OUT punch time to your WhatsApp group:'}
                </p>

                {/* 2 WhatsApp Share Buttons: IN vs OUT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await shareHalfDayPunchToWhatsApp({
                        punchType: 'IN',
                        time: inTime,
                        dateStr: initialDate,
                        shiftCode: shift,
                        session: halfDay === 'Yes (First Half)' ? 'First Half' : 'Second Half',
                        employeeName: currentUser?.name,
                        token: currentUser?.token,
                        department: currentUser?.department,
                        notes: notes || undefined,
                      });
                      if (res.success) {
                        setWhatsappToast(isMl ? `ഹാഫ് ഡേ ഇൻ (${inTime}) വാട്സ്ആപ്പിലേക്ക് ഷെയർ ചെയ്യുന്നു!` : `Sharing Half Day IN (${inTime}) to WhatsApp!`);
                        setTimeout(() => setWhatsappToast(null), 3500);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between gap-2 shadow-sm active:scale-95 transition-all cursor-pointer group"
                    title="Share Half Day IN punch to WhatsApp group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                      <span>{isMl ? 'ഹാഫ് ഡേ ഇൻ ഷെയർ' : 'Share Half Day IN'}</span>
                    </div>
                    <span className="font-mono bg-black/25 px-1.5 py-0.5 rounded text-[10px] text-emerald-100 font-bold">
                      {inTime}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const res = await shareHalfDayPunchToWhatsApp({
                        punchType: 'OUT',
                        time: outTime,
                        dateStr: initialDate,
                        shiftCode: shift,
                        session: halfDay === 'Yes (First Half)' ? 'First Half' : 'Second Half',
                        employeeName: currentUser?.name,
                        token: currentUser?.token,
                        department: currentUser?.department,
                        notes: notes || undefined,
                      });
                      if (res.success) {
                        setWhatsappToast(isMl ? `ഹാഫ് ഡേ ഔട്ട് (${outTime}) വാട്സ്ആപ്പിലേക്ക് ഷെയർ ചെയ്യുന്നു!` : `Sharing Half Day OUT (${outTime}) to WhatsApp!`);
                        setTimeout(() => setWhatsappToast(null), 3500);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-between gap-2 shadow-sm active:scale-95 transition-all cursor-pointer group"
                    title="Share Half Day OUT punch to WhatsApp group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                      <span>{isMl ? 'ഹാഫ് ഡേ ഔട്ട് ഷെയർ' : 'Share Half Day OUT'}</span>
                    </div>
                    <span className="font-mono bg-black/25 px-1.5 py-0.5 rounded text-[10px] text-teal-100 font-bold">
                      {outTime}
                    </span>
                  </button>
                </div>

                {/* Live Message Review matching user requested format */}
                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-300 text-[11px] font-mono space-y-1.5 shadow-2xs">
                  <div className="text-[10px] text-emerald-800 font-sans font-bold flex items-center justify-between">
                    <span>{isMl ? 'വാട്സ്ആപ്പ് മെസ്സേജ് റിവ്യൂ (Message Review):' : 'WhatsApp Message Review:'}</span>
                    <span className="text-[9px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">1:1 Format</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 bg-emerald-100/70 p-2 rounded-lg border border-emerald-300 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>half day in punch @ {inTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-teal-950 bg-teal-100/70 p-2 rounded-lg border border-teal-300 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    <span>half day out punch @ {outTime}</span>
                  </div>
                </div>

                {whatsappToast && (
                  <div className="p-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold text-center animate-fadeIn shadow-xs">
                    {whatsappToast}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shift Details Helper Banner */}
          <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/60 text-[11px] text-[#005f73] font-semibold flex items-center justify-between">
            <span>{isMl ? CSL_SHIFTS[shift].nameMl : CSL_SHIFTS[shift].name}:</span>
            <span className="font-mono">{CSL_SHIFTS[shift].inTime} – {CSL_SHIFTS[shift].outTime} ({CSL_SHIFTS[shift].duration})</span>
          </div>

          {/* Permanent Employee 5-Minute Grace Banner (Both In & Out) */}
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300/80 text-[11px] text-emerald-950 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>{isMl ? 'പെർമനന്റ് ജീവനക്കാരുടെ 5 മിനിറ്റ് ഗ്രേസ് ടൈം:' : 'Permanent Employee 5-Minute Grace Time:'}</span>
              </div>
              <span className="font-mono font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300 text-[10px]">
                ±5m CSL Rule
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-emerald-900 font-mono">
              <span>{isMl ? 'ഇൻ ഗ്രേസ്:' : 'In Grace:'} <strong>{CSL_SHIFTS[shift].graceDeadline}</strong> {isMl ? 'വരെ (+5m)' : 'Deadline (+5m)'}</span>
              <span>·</span>
              <span>{isMl ? 'ഔട്ട് ഗ്രേസ്:' : 'Early Out:'} <strong>{CSL_SHIFTS[shift].earlyOutGraceTime}</strong> {isMl ? 'മുതൽ (-5m)' : 'Permitted (-5m)'}</span>
            </div>
          </div>

          {/* Notes & Remarks (കുറിപ്പ് / ഡ്യൂട്ടി നോട്ട്) */}
          <div className="flex items-start justify-between gap-3">
            <label className="w-20 font-bold text-slate-800 shrink-0 mt-2">
              {isMl ? 'കുറിപ്പ് (Note):' : 'Remarks / Note:'}
            </label>
            <div className="flex-1 space-y-1.5">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isMl ? 'ഹോളിഡേ ഡ്യൂട്ടി / സ്പെഷ്യൽ വർക്ക് കുറിപ്പ്...' : 'Holiday duty or special remarks...'}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent shadow-2xs"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  ...(isSunday ? [{ label: isMl ? 'ഞായറാഴ്ച C1 ഡ്യൂട്ടി' : 'Sunday C1 Duty', val: 'ഞായറാഴ്ച ഡ്യൂട്ടി (Sunday C1 Shift · Holiday OT)' }] : []),
                  { label: isMl ? 'ഹോളിഡേ ഡ്യൂട്ടി' : 'Holiday Duty', val: 'ഹോളിഡേ ഡ്യൂട്ടി (Holiday Duty · സ്പെഷ്യൽ OT അർഹതയുണ്ട്)' },
                  { label: isMl ? 'സ്പെഷ്യൽ ഡ്യൂട്ടി' : 'Special Duty', val: 'സ്പെഷ്യൽ ഡ്യൂട്ടി (Special Yard Duty)' },
                  { label: isMl ? 'ഓവർടൈം' : 'Overtime', val: 'ഓവർടൈം ജോലി (Overtime Work)' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setNotes(chip.val)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 transition-colors cursor-pointer"
                  >
                    + {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </form>

        {/* Sticky Action Footer - Always visible & accessible without scrolling */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/95 shrink-0 flex items-center gap-2.5">
          <button
            type="submit"
            form="duty-punch-form"
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#1b4965] to-[#13384f] hover:from-[#13384f] hover:to-[#0f2c3e] text-white font-extrabold text-sm shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>{isMl ? 'ഡ്യൂട്ടി പഞ്ച് സേവ് ചെയ്യുക' : 'Save Duty Punch'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm transition-all cursor-pointer active:scale-95"
          >
            {isMl ? 'ക്ലോസ്' : 'Close'}
          </button>
        </div>
      </div>

      {/* Visual Clock Dial Picker Dialog */}
      <VisualClockPicker
        isOpen={clockPickerTarget !== null}
        onClose={() => setClockPickerTarget(null)}
        initialTime={clockPickerTarget === 'in' ? inTime : outTime}
        title={
          clockPickerTarget === 'in'
            ? (isMl ? 'ഇൻ സമയം തിരഞ്ഞെടുക്കുക (In Time)' : 'Select In Time (Clock)')
            : (isMl ? 'ഔട്ട് സമയം തിരഞ്ഞെടുക്കുക (Out Time)' : 'Select Out Time (Clock)')
        }
        language={language}
        presetTimes={
          clockPickerTarget === 'in'
            ? Array.from(new Set([
                CSL_SHIFTS[shift].inTime,
                '06:00 AM',
                '07:00 AM',
                '08:00 AM',
                '01:40 PM',
              ]))
            : Array.from(new Set([
                CSL_SHIFTS[shift].outTime,
                CSL_SHIFTS[shift].earlyOutGraceTime,
                getShiftTimeWithOt(shift, 1),
                getShiftTimeWithOt(shift, 2),
                getShiftTimeWithOt(shift, 3),
                getShiftTimeWithOt(shift, 4),
              ]))
        }
        onSelectTime={(newTime) => {
          if (clockPickerTarget === 'in') {
            setInTime(newTime);
          } else if (clockPickerTarget === 'out') {
            handleOutTimeChange(newTime);
          }
        }}
      />
    </div>
  );
};
