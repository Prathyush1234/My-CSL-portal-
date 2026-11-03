import React, { useState } from 'react';
import { Clock, Send, Copy, Check, X, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { 
  formatHalfDayPunchWhatsAppMessage, 
  getWhatsAppShareUrl, 
  shareHalfDayPunchToWhatsApp, 
  HalfDayPunchShareParams 
} from '../utils/whatsappShare';
import { CSL_SHIFTS, CSL_SHIFT_CODES, CslShiftCode } from '../data/cslShifts';
import { Language } from '../types';

interface HalfDayWhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  defaultDutyCategory?: 'half_day' | 'full_day_ot';
  defaultOtHours?: number | string;
  defaultPunchType?: 'IN' | 'OUT';
  defaultTime?: string;
  defaultDate?: string;
  defaultShift?: CslShiftCode;
  defaultSession?: 'First Half' | 'Second Half';
  currentUser?: {
    name: string;
    token: string;
    phone?: string;
    department?: string;
  };
  onPunchRecorded?: (params: HalfDayPunchShareParams) => void;
}

export const HalfDayWhatsAppShareModal: React.FC<HalfDayWhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  language = 'ml',
  defaultDutyCategory = 'half_day',
  defaultOtHours = 1,
  defaultPunchType = 'IN',
  defaultTime,
  defaultDate,
  defaultShift = 'A2',
  defaultSession = 'First Half',
  currentUser,
  onPunchRecorded,
}) => {
  const isMl = language === 'ml';

  // Get current 12-hour formatted time (e.g., "12:30 PM")
  const getCurrentFormattedTime = () => {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const [dutyCategory, setDutyCategory] = useState<'half_day' | 'full_day_ot'>(defaultDutyCategory);
  const [otHours, setOtHours] = useState<number | string>(defaultOtHours || 1);
  const [punchType, setPunchType] = useState<'IN' | 'OUT'>(defaultPunchType);
  const [time, setTime] = useState<string>(defaultTime || getCurrentFormattedTime());
  const [session, setSession] = useState<'First Half' | 'Second Half'>(defaultSession);
  const [shiftCode, setShiftCode] = useState<CslShiftCode>(
    (CSL_SHIFT_CODES as string[]).includes(defaultShift as any) ? (defaultShift as CslShiftCode) : 'A2'
  );
  const [customNote, setCustomNote] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  // Sync state if props change when opening
  React.useEffect(() => {
    if (isOpen) {
      setDutyCategory(defaultDutyCategory);
      setOtHours(defaultOtHours || 1);
      setPunchType(defaultPunchType);
      setTime(defaultTime || getCurrentFormattedTime());
      setSession(defaultSession);
      const validShift: CslShiftCode = (CSL_SHIFT_CODES as string[]).includes(defaultShift as any) ? (defaultShift as CslShiftCode) : 'A2';
      setShiftCode(validShift);
      setCopied(false);
      setShareStatus(null);
    }
  }, [isOpen, defaultDutyCategory, defaultOtHours, defaultPunchType, defaultTime, defaultSession, defaultShift]);

  if (!isOpen) return null;

  const shareParams: HalfDayPunchShareParams = {
    punchType,
    dutyCategory,
    otHours: dutyCategory === 'full_day_ot' ? otHours : undefined,
    time,
    dateStr: defaultDate,
    shiftCode,
    session: dutyCategory === 'half_day' ? session : undefined,
    employeeName: currentUser?.name,
    token: currentUser?.token,
    department: currentUser?.department,
    notes: customNote.trim() || undefined,
  };

  const messageText = formatHalfDayPunchWhatsAppMessage(shareParams);
  const whatsappUrl = getWhatsAppShareUrl(messageText);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(messageText);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {}
  };

  const handleShare = async () => {
    if (onPunchRecorded) {
      onPunchRecorded(shareParams);
    }
    const res = await shareHalfDayPunchToWhatsApp(shareParams);
    if (res.success) {
      setShareStatus(isMl ? 'വാട്സ്ആപ്പിലേക്ക് ഷെയർ ചെയ്യുന്നു (ടെക്സ്റ്റ് കോപ്പി ചെയ്തിട്ടുമുണ്ട്)' : 'Opening WhatsApp (Text also copied to clipboard)');
      setTimeout(() => {
        setShareStatus(null);
      }, 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs select-none overflow-y-auto">
      <div 
        className="bg-[#041624] text-white rounded-3xl w-full max-w-lg shadow-2xl border border-emerald-500/40 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#0f354c] bg-gradient-to-r from-[#031d2f] to-[#062c45] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              dutyCategory === 'full_day_ot'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-xs'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-1.5">
                <span>
                  {dutyCategory === 'full_day_ot'
                    ? (isMl ? '⚡ OT ഔട്ട് പഞ്ച് വാട്സ്ആപ്പ് ഷെയർ' : '⚡ OT OUT Punch WhatsApp Share')
                    : (isMl ? '🟢 ഹാഫ് ഡേ പഞ്ച് വാട്സ്ആപ്പ് ഷെയർ' : '🟢 Half Day Punch WhatsApp Share')}
                </span>
              </h3>
              <span className="text-[11px] text-teal-300 font-medium">
                {isMl ? 'പഞ്ച് ചെയ്ത സമയം വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ അയക്കാം' : 'Share exact punch time to your WhatsApp group'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          {/* Duty Category Selection: Only Half Day and OT OUT Punch */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {isMl ? 'ഡ്യൂട്ടി വിഭാഗം തിരഞ്ഞെടുക്കുക:' : 'Select Duty Category:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDutyCategory('half_day')}
                className={`py-2.5 px-3 rounded-xl font-black text-xs text-center transition-all cursor-pointer border ${
                  dutyCategory === 'half_day'
                    ? 'bg-emerald-500 text-slate-950 font-black border-emerald-300 shadow-md ring-2 ring-emerald-400/50 scale-[1.02]'
                    : 'bg-[#072438] text-slate-300 hover:bg-[#0c314b] border-[#143e5c]'
                }`}
              >
                <span className="block text-xs sm:text-sm">🟢 ഹാഫ് ഡേ</span>
                <span className="text-[10px] font-normal opacity-90 block mt-0.5">Half Day</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDutyCategory('full_day_ot');
                  setPunchType('OUT'); // Overtime is recorded on punch-out
                }}
                className={`py-2.5 px-3 rounded-xl font-black text-xs text-center transition-all cursor-pointer border ${
                  dutyCategory === 'full_day_ot'
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'bg-[#072438] text-slate-300 hover:bg-[#0c314b] border-[#143e5c]'
                }`}
              >
                <span className="block text-xs sm:text-sm">⚡ OT ഔട്ട് പഞ്ച്</span>
                <span className="text-[10px] font-normal opacity-90 block mt-0.5">OT OUT Punch</span>
              </button>
            </div>
          </div>

          {/* Overtime (OT) Controls if full_day_ot is selected */}
          {dutyCategory === 'full_day_ot' && (
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{isMl ? 'ഓവർടൈം സമയം (Overtime Hours):' : 'Overtime Hours (OT):'}</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-200 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-500/40">
                  +{otHours} hrs OT
                </span>
              </div>

              {/* Quick OT Selection Chips (Strictly whole hours only - CSL Rule) */}
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 8].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setOtHours(hrs)}
                    className={`py-1.5 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      Number(otHours) === hrs
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                        : 'bg-[#061e2f] text-amber-200 border-amber-500/30 hover:bg-[#0a2f4a]'
                    }`}
                  >
                    +{hrs}h OT
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-300 shrink-0">
                  {isMl ? 'കസ്റ്റം OT (മണിക്കൂർ):' : 'Custom OT (hrs):'}
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="12"
                  value={otHours}
                  onChange={(e) => setOtHours(Math.max(1, Math.floor(parseInt(e.target.value, 10) || 1)))}
                  className="w-24 bg-[#072033] border border-amber-500/40 rounded-xl px-2.5 py-1 text-center font-mono text-amber-300 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-slate-400">
                  {isMl ? '(ഔട്ട് പഞ്ചിനൊപ്പം കൂട്ടിച്ചേർക്കും)' : '(appended to out punch)'}
                </span>
              </div>
            </div>
          )}

          {/* 1. Punch Type Toggle (IN vs OUT) */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {isMl ? 'പഞ്ച് തരം തിരഞ്ഞെടുക്കുക:' : 'Select Punch Type:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPunchType('IN')}
                className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  punchType === 'IN'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400'
                    : 'bg-[#072438] text-slate-300 hover:bg-[#0c314b] border border-[#143e5c]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {dutyCategory === 'full_day_ot'
                    ? (isMl ? '🟢 ഫുൾ ഡേ ഇൻ (IN Punch)' : '🟢 Full Day IN Punch')
                    : (isMl ? '🟢 ഹാഫ് ഡേ ഇൻ (IN Punch)' : '🟢 Half Day IN Punch')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPunchType('OUT')}
                className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  punchType === 'OUT'
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 ring-2 ring-amber-300'
                    : 'bg-[#072438] text-slate-300 hover:bg-[#0c314b] border border-[#143e5c]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  {dutyCategory === 'full_day_ot'
                    ? (isMl ? `⚡ ${Math.floor(Number(otHours))}h OT ഔട്ട് (OUT Punch)` : `⚡ ${Math.floor(Number(otHours))}h OT OUT Punch`)
                    : (isMl ? '🟠 ഹാഫ് ഡേ ഔട്ട് (OUT Punch)' : '🟠 Half Day OUT Punch')}
                </span>
              </button>
            </div>
          </div>

          {/* 2. Session & Shift Selection */}
          <div className={`grid grid-cols-1 ${dutyCategory === 'half_day' ? 'sm:grid-cols-2' : ''} gap-3`}>
            {dutyCategory === 'half_day' && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {isMl ? 'ഹാഫ് ഡേ സെഷൻ:' : 'Half Day Session:'}
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as any)}
                  className="w-full bg-[#072033] border border-[#154668] rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="First Half">ഫസ്റ്റ് ഹാഫ് (First Half - 1st Session)</option>
                  <option value="Second Half">സെക്കൻഡ് ഹാഫ് (Second Half - 2nd Session)</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {isMl ? 'CSL ഷിഫ്റ്റ് (Shift & Timings):' : 'CSL Shift & Timings:'}
              </label>
              <select
                value={shiftCode}
                onChange={(e) => setShiftCode(e.target.value as CslShiftCode)}
                className="w-full bg-[#072033] border border-[#154668] rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {CSL_SHIFT_CODES.map((code) => {
                  const s = CSL_SHIFTS[code];
                  return (
                    <option key={code} value={code}>
                      {code} ({isMl ? s.nameMl : s.name} · {s.inTime} - {s.outTime})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* CSL Official Shift Quick Selection Pills */}
          <div>
            <div className="text-[11px] font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{isMl ? 'CSL ഷിഫ്റ്റ് തിരഞ്ഞെടുക്കുക:' : 'Select CSL Shift:'}</span>
              <span className="text-[10px] text-amber-300 font-mono">
                {shiftCode}: {CSL_SHIFTS[shiftCode]?.inTime} – {CSL_SHIFTS[shiftCode]?.outTime}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {CSL_SHIFT_CODES.map((code) => {
                const s = CSL_SHIFTS[code];
                const isSelected = shiftCode === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setShiftCode(code)}
                    className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md scale-[1.02]'
                        : 'bg-[#072236] text-slate-300 border-[#144260] hover:bg-[#0c314b]'
                    }`}
                  >
                    <span className="block text-xs font-black">{code}</span>
                    <span className="text-[9px] block font-mono opacity-90 truncate mt-0.5">{s.inTime}</span>
                    <span className="text-[9px] block font-mono opacity-75 truncate">{s.outTime}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-2 rounded-xl bg-[#031d2e] border border-cyan-500/30 text-[11px] text-cyan-200 flex items-center justify-between mt-1.5 font-mono">
              <span className="font-bold text-white">
                {shiftCode} · {isMl ? CSL_SHIFTS[shiftCode]?.nameMl : CSL_SHIFTS[shiftCode]?.name}
              </span>
              <span>{CSL_SHIFTS[shiftCode]?.inTime} – {CSL_SHIFTS[shiftCode]?.outTime} ({CSL_SHIFTS[shiftCode]?.duration})</span>
            </div>
          </div>

          {/* 3. Time input & Quick preset buttons matching selected CSL shift */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>{isMl ? 'പഞ്ച് സമയം (Punch Time):' : 'Punch Time:'}</span>
              </label>
              <button
                type="button"
                onClick={() => setTime(getCurrentFormattedTime())}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isMl ? 'ഇപ്പോഴത്തെ സമയം (Now)' : 'Set Current Time'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="12:30 PM"
                className="flex-1 bg-[#072033] border border-[#154668] rounded-xl px-3.5 py-2 font-mono text-amber-300 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick time chips tailored to the selected CSL shift */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] text-slate-400 mr-1">{isMl ? 'പെട്ടെന്നുള്ള സമയം:' : 'Presets:'}</span>
              {(() => {
                const cur = CSL_SHIFTS[shiftCode];
                const shiftPresets = shiftCode === 'A2'
                  ? [cur.inTime, '11:10 AM', '11:30 AM', cur.earlyOutGraceTime, cur.outTime]
                  : shiftCode === 'B2'
                  ? [cur.inTime, '05:40 PM', '06:00 PM', cur.earlyOutGraceTime, cur.outTime]
                  : shiftCode === 'C1'
                  ? [cur.inTime, '12:10 PM', '12:30 PM', cur.earlyOutGraceTime, cur.outTime]
                  : [cur.inTime, '10:00 AM', '10:30 AM', cur.earlyOutGraceTime, cur.outTime];

                return shiftPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTime(preset)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      time === preset
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs'
                        : 'bg-[#09253b] text-cyan-200 border-[#154668] hover:bg-[#0e3552]'
                    }`}
                  >
                    {preset}
                  </button>
                ));
              })()}
            </div>
          </div>

          {/* 4. Optional Custom Note */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {isMl ? 'കുറിപ്പ് / കാരണം (Note / Reason - Optional):' : 'Optional Remarks:'}
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={isMl ? 'ഉദാ: പെർസണൽ വർക്ക് / ഡോക്ടർ അപ്പോയിന്റ്മെന്റ്' : 'e.g., Doctor appointment / Personal work'}
              className="w-full bg-[#072033] border border-[#154668] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 5. Live Message Review Box formatted for WhatsApp matching 1:1 format */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isMl ? 'വാട്സ്ആപ്പ് മെസ്സേജ് റിവ്യൂ (Message Review):' : 'WhatsApp Message Review:'}</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer bg-[#08283e] px-2.5 py-1 rounded-md border border-[#13496e] transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isMl ? 'കോപ്പി ചെയ്തു!' : 'Copied!') : (isMl ? 'കോപ്പി ചെയ്യുക' : 'Copy')}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#02131e] border-2 border-emerald-400/80 text-sm sm:text-base font-mono text-emerald-300 font-extrabold tracking-wide flex items-center justify-between shadow-inner">
              <span className="select-all break-all">{messageText}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 ml-2">
                Exact Format
              </span>
            </div>
          </div>

          {shareStatus && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
              <span>{shareStatus}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#0f354c] bg-[#031b2e] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#092b43] hover:bg-[#0e3b5c] text-cyan-200 font-bold text-xs flex items-center justify-center gap-2 border border-[#144a70] cursor-pointer transition-all active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (isMl ? 'മെസ്സേജ് കോപ്പിയായി!' : 'Message Copied!') : (isMl ? 'മെസ്സേജ് കോപ്പി ചെയ്യുക' : 'Copy Text')}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleShare}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>{isMl ? 'വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ഷെയർ ചെയ്യുക' : 'Share to WhatsApp Group'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
