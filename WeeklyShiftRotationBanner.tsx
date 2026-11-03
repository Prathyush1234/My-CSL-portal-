import React, { useState, useEffect } from 'react';
import {
  RotateCw, ArrowRight, Clock, ArrowLeftRight, Calendar,
  Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Language } from '../types';
import { CSL_SHIFTS } from '../data/cslShifts';
import {
  getCurrentAndNextWeekShift,
  setCurrentWeekShift,
} from '../utils/shiftRotation';

interface WeeklyShiftRotationBannerProps {
  language: Language;
  onOpenRotationModal: () => void;
  compact?: boolean;
}

export const WeeklyShiftRotationBanner: React.FC<WeeklyShiftRotationBannerProps> = ({
  language,
  onOpenRotationModal,
  compact = false,
}) => {
  const isMl = language === 'ml';
  const [data, setData] = useState(() => getCurrentAndNextWeekShift());

  useEffect(() => {
    const handleUpdate = () => {
      setData(getCurrentAndNextWeekShift());
    };
    window.addEventListener('csl-shift-rotation-changed', handleUpdate);
    window.addEventListener('csl-attendance-updated', handleUpdate);
    return () => {
      window.removeEventListener('csl-shift-rotation-changed', handleUpdate);
      window.removeEventListener('csl-attendance-updated', handleUpdate);
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = data.thisWeekShift === 'A2' ? 'B2' : 'A2';
    setCurrentWeekShift(next);
    setData(getCurrentAndNextWeekShift());
  };

  const thisShift = CSL_SHIFTS[data.thisWeekShift];
  const nextShift = CSL_SHIFTS[data.nextWeekShift];

  if (compact) {
    return (
      <div
        onClick={onOpenRotationModal}
        className="group px-3 py-2 rounded-xl bg-gradient-to-r from-[#062438] via-[#051c2c] to-[#02101b] border border-cyan-800/60 hover:border-cyan-500/80 transition-all cursor-pointer flex items-center justify-between text-xs shadow-md"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300 font-medium">
              {isMl ? 'ഈ ആഴ്ച:' : 'This Week:'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              data.thisWeekShift === 'A2'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {thisShift.name} ({thisShift.inTime})
            </span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] text-slate-400">
              {isMl ? 'അടുത്ത ആഴ്ച:' : 'Next:'}
            </span>
            <span className="font-semibold text-white text-[11px]">
              {nextShift.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-semibold">
          <span>{isMl ? 'വിശദാംശങ്ങൾ' : 'Schedule'}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-[#072538] via-[#041c2c] to-[#02111d] border border-cyan-700/50 shadow-md relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Left Title & Status */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <RotateCw className="w-3 h-3 text-cyan-300 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-xs font-bold text-white tracking-wide flex items-center gap-1">
                {isMl ? 'A2 ⇄ B2 പ്രതിവാര ഷിഫ്റ്റ് റൊട്ടേഷൻ' : 'A2 ⇄ B2 Weekly Shift Rotation'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {isMl ? 'സജീവം' : 'Active Cycle'}
              </span>
            </div>
            <p className="text-[9.5px] text-cyan-200/75 line-clamp-1">
              {isMl
                ? 'ഓരോ ആഴ്ചയും ഷിഫ്റ്റ് മാറും: ഈ ആഴ്ച A2, അടുത്ത ആഴ്ച B2.'
                : 'Alternates weekly: If this week is A2, next week automatically rotates to B2.'}
            </p>
          </div>
        </div>

        {/* Center / Right: Shift Comparison & Switch Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* This Week Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-cyan-900/80 flex items-center gap-1.5">
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase font-semibold leading-none">
                {isMl ? 'ഈ ആഴ്ച' : 'This Week'}
              </div>
              <div className="text-[11px] font-bold text-teal-300 flex items-center gap-1 mt-0.5">
                <span>{thisShift.name}</span>
                <span className="text-[9px] text-slate-400 font-normal">({thisShift.inTime})</span>
              </div>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          </div>

          {/* Next Week Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-black/30 border border-slate-800 flex items-center gap-1.5">
            <div className="text-right">
              <div className="text-[9px] text-slate-400 uppercase font-semibold leading-none">
                {isMl ? 'അടുത്ത ആഴ്ച' : 'Next Week'}
              </div>
              <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                <span>{nextShift.name}</span>
                <span className="text-[9px] text-slate-400 font-normal">({nextShift.inTime})</span>
              </div>
            </div>
          </div>

          {/* Quick Toggle Button */}
          <button
            type="button"
            onClick={handleToggle}
            title={isMl ? 'ഈ ആഴ്ചത്തെ ഷിഫ്റ്റ് മാറ്റുക' : 'Switch this week shift'}
            className="p-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-700/60 text-cyan-200 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
          >
            <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">
              {isMl ? 'മാറ്റുക' : 'Flip'}
            </span>
          </button>

          {/* Open Full Planner Button */}
          <button
            type="button"
            onClick={onOpenRotationModal}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          >
            <Calendar className="w-3 h-3" />
            <span>{isMl ? 'ഷെഡ്യൂൾ' : 'Schedule Planner'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
