import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Check, X, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { to24HourTime, to12HourTime, adjustTimeString } from '../utils/timeQuickSet';

interface VisualClockPickerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTime?: string; // e.g. "01:40 PM", "10:00 PM"
  onSelectTime: (formattedTime: string) => void;
  title?: string;
  language?: Language;
  presetTimes?: string[];
}

export const VisualClockPicker: React.FC<VisualClockPickerProps> = ({
  isOpen,
  onClose,
  initialTime = '08:00 AM',
  onSelectTime,
  title,
  language = 'en',
  presetTimes,
}) => {
  const isMl = language === 'ml';

  // Parse initialTime
  const parseTimeString = (timeStr: string) => {
    let hour = 8;
    let minute = 0;
    let period: 'AM' | 'PM' = 'AM';

    if (timeStr) {
      const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match) {
        hour = parseInt(match[1], 10);
        minute = parseInt(match[2], 10);
        if (hour === 0) hour = 12;
        if (hour > 12) {
          hour = hour % 12 || 12;
          period = 'PM';
        }
        if (match[3]) {
          period = match[3].toUpperCase() as 'AM' | 'PM';
        }
      }
    }
    return { hour, minute, period };
  };

  const parsed = useMemo(() => parseTimeString(initialTime), [initialTime]);
  const [selectedHour, setSelectedHour] = useState<number>(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsed.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(parsed.period);
  const [pickerMode, setPickerMode] = useState<'hours' | 'minutes'>('hours');

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      const p = parseTimeString(initialTime);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setPeriod(p.period);
      setPickerMode('hours');
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const formattedResult = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${period}`;

  const handleHourClick = (h: number) => {
    setSelectedHour(h);
    // Smoothly progress to minutes
    setPickerMode('minutes');
  };

  const handleMinuteClick = (m: number) => {
    setSelectedMinute(m);
  };

  const handleConfirm = () => {
    onSelectTime(formattedResult);
    onClose();
  };

  const handleSetNow = () => {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    setSelectedHour(h);
    setSelectedMinute(m);
    setPeriod(p);
  };

  const handleSelectPreset = (preset: string) => {
    const p = parseTimeString(preset);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setPeriod(p.period);
  };

  // Clock Geometry (Radius: 100px, center 120, 120)
  const CLOCK_RADIUS = 100;
  const CENTER_X = 120;
  const CENTER_Y = 120;

  // Calculate coordinates for hours 1-12
  const hourPositions = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
    const angleRad = (h * 30 - 90) * (Math.PI / 180);
    const x = CENTER_X + CLOCK_RADIUS * Math.cos(angleRad);
    const y = CENTER_Y + CLOCK_RADIUS * Math.sin(angleRad);
    return { h, x, y };
  });

  // Calculate coordinates for minutes (00, 05, 10... 55)
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const minutePositions = minuteNumbers.map((m) => {
    const angleRad = (m * 6 - 90) * (Math.PI / 180);
    const x = CENTER_X + CLOCK_RADIUS * Math.cos(angleRad);
    const y = CENTER_Y + CLOCK_RADIUS * Math.sin(angleRad);
    return { m, x, y };
  });

  // Calculate angle for clock hand
  const currentAngle = pickerMode === 'hours'
    ? (selectedHour % 12) * 30
    : selectedMinute * 6;

  const handRad = (currentAngle - 90) * (Math.PI / 180);
  const handEndX = CENTER_X + (CLOCK_RADIUS - 12) * Math.cos(handRad);
  const handEndY = CENTER_Y + (CLOCK_RADIUS - 12) * Math.sin(handRad);

  // Default CSL Presets with deduplication
  const defaultPresets = useMemo(() => {
    const raw = presetTimes || [
      '06:00 AM',
      '06:30 AM',
      '07:00 AM',
      '07:05 AM',
      '08:00 AM',
      '01:40 PM',
      '01:45 PM',
      '03:15 PM',
      '03:20 PM',
      '04:20 PM',
      '09:55 PM',
      '10:00 PM',
      '11:00 PM',
    ];
    return Array.from(new Set(raw.filter(Boolean)));
  }, [presetTimes]);

  const handleApplyDelta = (deltaMin: number) => {
    const current = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${period}`;
    const next = adjustTimeString(current, deltaMin);
    const p = parseTimeString(next);
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setPeriod(p.period);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-[360px] shadow-2xl border border-slate-200 flex flex-col items-center animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                {title || (isMl ? 'സമയം തിരഞ്ഞെടുക്കുക (Clock)' : 'Select Time')}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {isMl ? 'ക്ലോക്കിൽ തൊട്ടോ ബട്ടണുകൾ ഉപയോഗിച്ചോ മാറ്റാം' : 'Tap on clock dial or use quick steppers'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Digital Time & AM/PM Display */}
        <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-2 shadow-inner">
          <div className="flex items-center justify-between">
            {/* Hour & Minute Segment Display */}
            <div className="flex items-center gap-1.5 font-mono">
              <button
                type="button"
                onClick={() => setPickerMode('hours')}
                className={`px-3 py-1.5 rounded-xl font-black text-2xl transition-all cursor-pointer ${
                  pickerMode === 'hours'
                    ? 'bg-teal-700 text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {String(selectedHour).padStart(2, '0')}
              </button>
              <span className="font-black text-2xl text-slate-400">:</span>
              <button
                type="button"
                onClick={() => setPickerMode('minutes')}
                className={`px-3 py-1.5 rounded-xl font-black text-2xl transition-all cursor-pointer ${
                  pickerMode === 'minutes'
                    ? 'bg-teal-700 text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {String(selectedMinute).padStart(2, '0')}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Native Mobile Time Picker Icon */}
              <div className="relative w-8 h-8 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-teal-700 cursor-pointer overflow-hidden shadow-2xs" title={isMl ? 'സിസ്റ്റം ടൈം പിക്കർ' : 'Device Time Picker'}>
                <Clock className="w-4 h-4 pointer-events-none" />
                <input
                  type="time"
                  value={to24HourTime(formattedResult)}
                  onChange={(e) => {
                    if (e.target.value) handleSelectPreset(to12HourTime(e.target.value));
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              {/* AM / PM Selector */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setPeriod('AM')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    period === 'AM'
                      ? 'bg-[#1b4965] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('PM')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    period === 'PM'
                      ? 'bg-[#1b4965] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Quick Steppers: -15m, -5m, +5m, +15m, +1h */}
          <div className="flex items-center justify-between gap-1 pt-2 mt-2 border-t border-slate-200 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => handleApplyDelta(-60)}
              className="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 cursor-pointer"
            >
              -1h
            </button>
            <button
              type="button"
              onClick={() => handleApplyDelta(-15)}
              className="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 cursor-pointer"
            >
              -15m
            </button>
            <button
              type="button"
              onClick={() => handleApplyDelta(-5)}
              className="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 cursor-pointer"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => handleApplyDelta(5)}
              className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 cursor-pointer"
            >
              +5m
            </button>
            <button
              type="button"
              onClick={() => handleApplyDelta(15)}
              className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200 cursor-pointer"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => handleApplyDelta(60)}
              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 cursor-pointer"
            >
              +1h
            </button>
          </div>
        </div>

        {/* Mode Indicator & Switcher */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setPickerMode('hours')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              pickerMode === 'hours'
                ? 'bg-teal-100 text-teal-800 border border-teal-300'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isMl ? 'മണിക്കൂർ (Hour)' : 'Hours (1-12)'}
          </button>
          <span className="text-slate-300">·</span>
          <button
            type="button"
            onClick={() => setPickerMode('minutes')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              pickerMode === 'minutes'
                ? 'bg-teal-100 text-teal-800 border border-teal-300'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isMl ? 'മിനിറ്റ് (Minute)' : 'Minutes (00-59)'}
          </button>
        </div>

        {/* Interactive Visual Clock Dial (SVG) */}
        <div className="relative w-[240px] h-[240px] rounded-full bg-slate-100 border-4 border-slate-300 shadow-md flex items-center justify-center p-2 mb-3 select-none">
          <svg className="w-full h-full" viewBox="0 0 240 240">
            {/* Clock Background Ring */}
            <circle cx="120" cy="120" r="115" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
            
            {/* Hour tick marks */}
            {Array.from({ length: 60 }).map((_, i) => {
              const isMajor = i % 5 === 0;
              const angle = (i * 6 - 90) * (Math.PI / 180);
              const r1 = 112;
              const r2 = isMajor ? 104 : 108;
              return (
                <line
                  key={`tick-${i}`}
                  x1={120 + r1 * Math.cos(angle)}
                  y1={120 + r1 * Math.sin(angle)}
                  x2={120 + r2 * Math.cos(angle)}
                  y2={120 + r2 * Math.sin(angle)}
                  stroke={isMajor ? '#94a3b8' : '#cbd5e1'}
                  strokeWidth={isMajor ? 2 : 1}
                />
              );
            })}

            {/* Clock Hand Line */}
            <line
              x1="120"
              y1="120"
              x2={handEndX}
              y2={handEndY}
              stroke="#0f766e"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Hand End Knob */}
            <circle
              cx={handEndX}
              cy={handEndY}
              r="16"
              fill="#0f766e"
              className="drop-shadow-sm opacity-90"
            />

            {/* Center Pivot Pin */}
            <circle cx="120" cy="120" r="5" fill="#0f766e" stroke="#ffffff" strokeWidth="2" />
          </svg>

          {/* Numbers positioned on top of the dial */}
          {pickerMode === 'hours' ? (
            // Hours (1 - 12)
            hourPositions.map(({ h, x, y }) => {
              const isSelected = selectedHour === h;
              return (
                <button
                  key={`hour-${h}`}
                  type="button"
                  onClick={() => handleHourClick(h)}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-transform active:scale-90 ${
                    isSelected
                      ? 'text-white font-black z-10'
                      : 'text-slate-700 hover:bg-teal-100 hover:text-teal-900 z-10'
                  }`}
                >
                  {h}
                </button>
              );
            })
          ) : (
            // Minutes (00, 05, 10, ... 55)
            minutePositions.map(({ m, x, y }) => {
              const isSelected = selectedMinute === m;
              return (
                <button
                  key={`min-${m}`}
                  type="button"
                  onClick={() => handleMinuteClick(m)}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer transition-transform active:scale-90 ${
                    isSelected
                      ? 'text-white font-black z-10'
                      : 'text-slate-700 hover:bg-teal-100 hover:text-teal-900 z-10'
                  }`}
                >
                  {String(m).padStart(2, '0')}
                </button>
              );
            })
          )}
        </div>

        {/* Fine-tuning for exact minutes */}
        {pickerMode === 'minutes' && (
          <div className="w-full flex items-center justify-between gap-2 px-2 mb-3">
            <span className="text-[11px] font-bold text-slate-500">
              {isMl ? 'വ്യക്തമായ മിനിറ്റ്:' : 'Exact Minute:'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedMinute((prev) => (prev > 0 ? prev - 1 : 59))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer"
                title="-1 min"
              >
                -
              </button>
              <span className="w-10 text-center font-mono font-bold text-sm text-slate-900">
                :{String(selectedMinute).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMinute((prev) => (prev < 59 ? prev + 1 : 0))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer"
                title="+1 min"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Quick Shift Presets */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isMl ? 'CSL ഷിഫ്റ്റ് സമയങ്ങൾ' : 'CSL Quick Presets'}
            </span>
            <button
              type="button"
              onClick={handleSetNow}
              className="text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
            >
              {isMl ? 'ഇപ്പോൾ (Now)' : 'Current Time'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {defaultPresets.map((preset, idx) => (
              <button
                key={`${preset}-${idx}`}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold shrink-0 border transition-all cursor-pointer ${
                  formattedResult === preset
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Cancel & Done */}
        <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-center"
          >
            {isMl ? 'റദ്ദാക്കുക' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="py-2.5 px-4 rounded-xl text-xs font-black text-white bg-teal-700 hover:bg-teal-800 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isMl ? 'സെറ്റ് ചെയ്യുക' : 'Set Time'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
