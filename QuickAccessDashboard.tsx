import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, Fingerprint, Clock, Calendar, 
  IndianRupee, ClipboardCheck, CheckCircle2, Download, ChevronRight, X, Sparkles, MapPin, ShieldCheck, Sliders,
  Timer, Zap, Calculator, MessageSquare, Wallet
} from 'lucide-react';
import { CslLogo } from './CslLogo';
import { CslTugBackground } from './CslTugBackground';
import { Language } from '../types';
import { translations } from '../data/translations';
import { 
  CSL_SHIFTS, CSL_SHIFT_CODES, CslShiftCode, DutyPunchData, 
  getShiftTimeWithOt, calculateDutyAndOT, formatCslTime, 
  inferCslShiftFromTimes, reconcileAttendanceDailyLogs, parseTimeToMinutes,
  isSundayDate, isCslHolidayDate, getRecommendedShiftForDate,
  getIstDate, MONTH_SHORT_NAMES, MONTH_FULL_NAMES, MONTH_NAMES_ML,
  getAttendanceLogsKey, ensureMonthlyRolloverAndArchive
} from '../data/cslShifts';
import { DutyPunchModal } from './DutyPunchModal';
import { HalfDayWhatsAppShareModal } from './HalfDayWhatsAppShareModal';
import { HalfDayPunchShareParams } from '../utils/whatsappShare';
import { WeeklyShiftRotationBanner } from './WeeklyShiftRotationBanner';
import { WeeklyShiftRotationModal } from './WeeklyShiftRotationModal';
import { getCurrentAndNextWeekShift, setCurrentWeekShift, getSyncedActiveShiftForToday, syncShiftFromCalendarEverywhere } from '../utils/shiftRotation';
import { QuarterlyOtTrackerBanner } from './QuarterlyOtTrackerBanner';
import { QuarterlyOtModal } from './QuarterlyOtModal';
import { generateAndDownloadMonthlyPdf, MonthlyPdfData } from '../utils/cslPdfGenerator';

interface QuickAccessDashboardProps {
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
  onBackToSignIn: () => void;
  onOpenCalendar?: () => void;
  onOpenSalary?: () => void;
  onOpenAttendance?: () => void;
  onOpenTax?: () => void;
  onOpenMoney?: () => void;
}

export const QuickAccessDashboard: React.FC<QuickAccessDashboardProps> = ({
  language,
  currentUser,
  onBackToSignIn,
  onOpenCalendar,
  onOpenSalary,
  onOpenAttendance,
  onOpenTax,
  onOpenMoney,
}) => {
  const t = translations[language];
  const isMl = language === 'ml';
  const isContract = currentUser?.category === 'contract' || 
    (typeof window !== 'undefined' && localStorage.getItem('csl_employee_category') === 'contract');

  // Active shift selection (Rule 1: Every Sunday work is C1 Shift!)
  const isTodaySunday = getIstDate().getDay() === 0;
  const todayHolidayInfo = isCslHolidayDate(getIstDate(), getIstDate().getMonth(), getIstDate().getFullYear());

  const [selectedShift, setSelectedShift] = useState<CslShiftCode>(() => {
    ensureMonthlyRolloverAndArchive();
    const today = getIstDate();
    if (today.getDay() === 0) {
      return 'C1';
    }
    return getSyncedActiveShiftForToday(today);
  });

  const handleSelectShift = (shift: CslShiftCode) => {
    setSelectedShift(shift);
    syncShiftFromCalendarEverywhere(shift, getIstDate(), true);
  };
  const [isRotationModalOpen, setIsRotationModalOpen] = useState(false);
  const [isQuarterlyOtModalOpen, setIsQuarterlyOtModalOpen] = useState(false);
  
  // Modals
  const [activeModal, setActiveModal] = useState<'punch' | 'calendar' | 'salary' | 'attendance' | null>(null);
  const [punchState, setPunchState] = useState<'in' | 'out'>(() => {
    try {
      const today = getIstDate();
      const todayDay = today.getDate();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      const hasPunchedToday = localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === todayKey;
      if (!hasPunchedToday) return 'out';
      const saved = localStorage.getItem('csl_punch_state');
      if (saved === 'in' || saved === 'out') return saved;
    } catch {}
    return 'out';
  });
  const [lastPunchTime, setLastPunchTime] = useState(() => {
    try {
      const today = getIstDate();
      const todayDay = today.getDate();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      const hasPunchedToday = localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === todayKey;
      if (!hasPunchedToday) return '—';
      const saved = localStorage.getItem('csl_last_punch_time');
      if (saved) return saved;
    } catch {}
    return '—';
  });
  const [showCheckOutToast, setShowCheckOutToast] = useState(false);
  const [checkOutToastMsg, setCheckOutToastMsg] = useState('');

  // Duty & WhatsApp Share Modal state (Full Day + OT, Half Day, Full Day)
  const [isHalfDayShareModalOpen, setIsHalfDayShareModalOpen] = useState(false);
  const [halfDayShareDefaults, setHalfDayShareDefaults] = useState<{
    punchType: 'IN' | 'OUT';
    dutyCategory?: 'half_day' | 'full_day_ot';
    otHours?: number | string;
    time?: string;
    session?: 'First Half' | 'Second Half';
  }>({
    punchType: 'IN',
    dutyCategory: 'half_day',
    session: 'First Half',
  });

  // Dynamic daily attendance logs for the dashboard table (for current IST month)
  const [dashboardLogs, setDashboardLogs] = useState<any[] | null>(() => {
    try {
      ensureMonthlyRolloverAndArchive();
      const today = getIstDate();
      const logsKey = getAttendanceLogsKey(today.getFullYear(), today.getMonth());
      const saved = localStorage.getItem(logsKey);
      if (saved) {
        const { logs, modified } = reconcileAttendanceDailyLogs(JSON.parse(saved), today.getMonth());
        if (modified) {
          localStorage.setItem(logsKey, JSON.stringify(logs));
          localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(logs));
        }
        return logs;
      }
    } catch {}
    return null;
  });

  // Live Duty Timer Counter while on duty
  const [punchInTs, setPunchInTs] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('csl_punch_in_ts');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return Date.now();
  });
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);

  // Completed duty summary banner state (automatically disabled if duty not started or day has passed)
  const [completedDutySummary, setCompletedDutySummary] = useState<any>(() => {
    try {
      const today = getIstDate();
      const todayDay = today.getDate();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      const hasPunchedToday = localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === todayKey;
      const punchState = localStorage.getItem('csl_punch_state');
      const punchOutTime = localStorage.getItem('csl_today_punch_out_time');

      if (!hasPunchedToday || punchState !== 'out' || !punchOutTime) {
        localStorage.removeItem('csl_completed_duty_summary');
        return null;
      }

      const saved = localStorage.getItem('csl_completed_duty_summary');
      if (saved) {
        const sum = JSON.parse(saved);
        if (sum.dateKey && sum.dateKey !== todayKey) {
          localStorage.removeItem('csl_completed_duty_summary');
          return null;
        }
        return sum;
      }
    } catch {}
    return null;
  });

  // Live Leave Balances synced from Sign In & Calendar
  const [leaveBalances, setLeaveBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('csl_leave_balances_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      cl: 12,
      clTotal: 12,
      el: 30,
      elTotal: 30,
      hpl: 20,
      hplTotal: 20,
      specialLeave: 15,
      specialLeaveTotal: 15,
      rh: 2,
      rhTotal: 2,
    };
  });

  useEffect(() => {
    const handleLeaveSync = (e?: any) => {
      try {
        if (e?.detail) {
          setLeaveBalances(e.detail);
          return;
        }
        const saved = localStorage.getItem('csl_leave_balances_v2');
        if (saved) setLeaveBalances(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('csl-leave-balances-updated', handleLeaveSync);
    window.addEventListener('storage', handleLeaveSync);

  return () => {
      window.removeEventListener('csl-leave-balances-updated', handleLeaveSync);
      window.removeEventListener('storage', handleLeaveSync);
    };
  }, []);

  // Live Current Clock for Punch Button
  const [currentTime, setCurrentTime] = useState(() => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date());
  });

  useEffect(() => {
    const tick = () => {
      // Update live clock
      setCurrentTime(new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(new Date()));

      // Update elapsed duty timer if on duty
      if (punchState === 'in') {
        setElapsedSecs(Math.max(0, Math.floor((Date.now() - punchInTs) / 1000)));
      } else {
        setElapsedSecs(0);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [punchState, punchInTs]);

  // Real-time synchronization when punch status changes across tabs/components
  useEffect(() => {
    const handleSync = () => {
      try {
        ensureMonthlyRolloverAndArchive();
        const today = getIstDate();
        const curMonth = today.getMonth();
        const curYear = today.getFullYear();
        const todayDay = today.getDate();
        const todayKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
        const hasPunchedToday = localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === todayKey;
        if (!hasPunchedToday) {
          setPunchState('out');
          setLastPunchTime('—');
          setElapsedSecs(0);
        } else {
          const st = localStorage.getItem('csl_punch_state');
          if (st === 'in' || st === 'out') setPunchState(st);
          const pt = localStorage.getItem('csl_last_punch_time');
          if (pt) setLastPunchTime(pt);
          const pts = localStorage.getItem('csl_punch_in_ts');
          if (pts) setPunchInTs(parseInt(pts, 10));
        }

        const logsKey = getAttendanceLogsKey(curYear, curMonth);
        const savedLogs = localStorage.getItem(logsKey);
        if (savedLogs) {
          const { logs, modified } = reconcileAttendanceDailyLogs(JSON.parse(savedLogs), curMonth);
          if (modified) {
            localStorage.setItem(logsKey, JSON.stringify(logs));
            localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(logs));
          }
          setDashboardLogs(logs);
        }

        setSelectedShift(getSyncedActiveShiftForToday(today));

        const savedSummary = localStorage.getItem('csl_completed_duty_summary');
        if (savedSummary) {
          try {
            const sum = JSON.parse(savedSummary);
            if (sum.dateKey && sum.dateKey !== todayKey) {
              setCompletedDutySummary(null);
            } else {
              setCompletedDutySummary(sum);
            }
          } catch {
            setCompletedDutySummary(null);
          }
        } else {
          setCompletedDutySummary(null);
        }
      } catch {}
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('csl-attendance-updated', handleSync);
    window.addEventListener('csl-shift-rotation-changed', handleSync);
    window.addEventListener('csl-shift-changed', handleSync);
    window.addEventListener('csl-calendar-shifts-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('csl-attendance-updated', handleSync);
      window.removeEventListener('csl-shift-rotation-changed', handleSync);
      window.removeEventListener('csl-shift-changed', handleSync);
      window.removeEventListener('csl-calendar-shifts-updated', handleSync);
    };
  }, []);

  const handleQuickCheckIn = (shift?: CslShiftCode, customIn?: string) => {
    const inT = customIn || formatCslTime();
    const today = getIstDate();
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const todayDay = today.getDate();
    const todayKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    const isSun = today.getDay() === 0;
    const holInfo = isCslHolidayDate(today, curMonth, curYear);
    const isHolDuty = isSun || holInfo.isHoliday;

    // Rule 1: Every Sunday work is C1 Shift!
    const s = isSun ? 'C1' : (shift || selectedShift);
    const def = CSL_SHIFTS[s];
    const nowTs = Date.now();
    const mShort = MONTH_SHORT_NAMES[curMonth] || 'Nov';
    const logsKey = getAttendanceLogsKey(curYear, curMonth);
    const presKey = `csl_calendar_present_days_${curYear}_${curMonth}`;

    setSelectedShift(s);
    setLastPunchTime(inT);
    setPunchState('in');
    setPunchInTs(nowTs);
    setCompletedDutySummary(null);
    try {
      localStorage.setItem('csl_active_shift', s);
      localStorage.setItem('csl_last_punch_time', inT);
      localStorage.setItem('csl_today_punch_in_time', inT);
      localStorage.removeItem('csl_today_punch_out_time');
      localStorage.removeItem('csl_completed_duty_summary');
      localStorage.setItem('csl_punch_state', 'in');
      localStorage.setItem('csl_today_punched_date', todayKey);
      localStorage.setItem('csl_actual_punched_today', 'true');
      localStorage.setItem('csl_punch_in_ts', nowTs.toString());

      // Immediately mark today as Present in CSL Calendar
      const saved = localStorage.getItem(presKey);
      let presentList: number[] = saved ? JSON.parse(saved) : [];
      if (!presentList.includes(todayDay)) {
        presentList.push(todayDay);
        presentList.sort((a, b) => a - b);
      }
      localStorage.setItem(presKey, JSON.stringify(presentList));

      // Update daily logs
      const savedLogs = localStorage.getItem(logsKey);
      let logs = savedLogs ? JSON.parse(savedLogs) : [];
      const newEntry = {
        id: `d-${todayDay}`,
        dateStr: `${todayDay} ${mShort} ${curYear}`,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()],
        dayNum: todayDay,
        shift: isSun ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` : `${s} (${def.inTime.replace(' ', '')} - ${def.outTime.replace(' ', '')})`,
        shiftCode: s,
        inTime: inT,
        outTime: 'On Duty',
        workHours: 'Live',
        otHours: 0,
        terminal: 'Turnstile #02',
        status: isHolDuty ? 'Holiday Duty' : 'On Duty',
        notes: isSun 
          ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)' 
          : (holInfo.isHoliday ? `${holInfo.holidayNameMl} ഹോളിഡേ ഡ്യൂട്ടി (Holiday Duty · സ്പെഷ്യൽ OT)` : (language === 'ml' ? 'ഡ്യൂട്ടിയിലാണ്' : 'Live on duty'))
      };
      const exists = logs.some((r: any) => r.dayNum === todayDay);
      const updatedLogs = exists ? logs.map((r: any) => r.dayNum === todayDay ? newEntry : r) : [newEntry, ...logs];
      setDashboardLogs(updatedLogs);
      localStorage.setItem(logsKey, JSON.stringify(updatedLogs));
      localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(updatedLogs));

      window.dispatchEvent(new CustomEvent('csl-attendance-updated', { 
        detail: { day: todayDay, present: true, punchInTime: inT, punchState: 'in' } 
      }));
    } catch {}
  };

  const handleQuickCheckOut = (shift?: CslShiftCode, customOtHours: number = 0, explicitOutTime?: string) => {
    const today = getIstDate();
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const todayDay = today.getDate();
    const todayKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    const isSun = today.getDay() === 0;
    const holInfo = isCslHolidayDate(today, curMonth, curYear);
    const isHolDuty = isSun || holInfo.isHoliday;

    const initialShift = isSun ? 'C1' : (shift || selectedShift);
    const outT = explicitOutTime || (customOtHours > 0 ? getShiftTimeWithOt(initialShift, customOtHours) : formatCslTime());
    const rawInT = localStorage.getItem('csl_today_punch_in_time') || (lastPunchTime && lastPunchTime !== '—' && lastPunchTime !== 'On Duty' ? lastPunchTime : CSL_SHIFTS[initialShift].inTime);
    const s = initialShift;
    const def = CSL_SHIFTS[s];
    const inT = rawInT;

    const calc = calculateDutyAndOT(inT, outT, s, true, today);
    const finalOt = Math.floor(customOtHours > 0 ? customOtHours : calc.otHours);
    const mShort = MONTH_SHORT_NAMES[curMonth] || 'Nov';
    const logsKey = getAttendanceLogsKey(curYear, curMonth);
    const presKey = `csl_calendar_present_days_${curYear}_${curMonth}`;

    setSelectedShift(s);
    setLastPunchTime(outT);
    setPunchState('out');
    try {
      localStorage.setItem('csl_active_shift', s);
      localStorage.setItem('csl_last_punch_time', outT);
      localStorage.setItem('csl_today_punch_out_time', outT);
      localStorage.setItem('csl_today_punched_date', todayKey);
      localStorage.setItem('csl_actual_punched_today', 'true');
      localStorage.setItem('csl_punch_state', 'out');

      // Update completed duty summary
      const summaryData = {
        dateKey: todayKey,
        shift: s,
        inTime: inT,
        outTime: outT,
        totalHours: calc.workHours,
        regularHours: def.duration,
        otHours: finalOt,
        graceApplied: calc.graceApplied,
        inGraceApplied: calc.inGraceApplied,
        outGraceApplied: calc.outGraceApplied,
        graceNote: calc.graceNote,
        recordedAt: outT,
      };
      setCompletedDutySummary(summaryData);
      localStorage.setItem('csl_completed_duty_summary', JSON.stringify(summaryData));

      // Update calendar present days
      const saved = localStorage.getItem(presKey);
      let presentList: number[] = saved ? JSON.parse(saved) : [];
      if (!presentList.includes(todayDay)) presentList.push(todayDay);
      presentList.sort((a, b) => a - b);
      localStorage.setItem(presKey, JSON.stringify(presentList));

      // Update dailyLogs in localStorage so attendance tab and dashboard has this record
      const savedLogs = localStorage.getItem(logsKey);
      let logs = savedLogs ? JSON.parse(savedLogs) : [];
      const noteStr = isHolDuty
        ? (isSun ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)' : `${holInfo.holidayNameMl} ഹോളിഡേ ഡ്യൂട്ടി · മുഴുവൻ സമയവും സ്പെഷ്യൽ OT`)
        : (finalOt > 0 
            ? `${finalOt} hrs Overtime (OT)` 
            : (calc.graceNote ? calc.graceNote : 'Duty Completed (പൂർത്തിയായി)'));

      const entry = {
        id: `d-${todayDay}`,
        dateStr: `${todayDay} ${mShort} ${curYear}`,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()],
        dayNum: todayDay,
        shift: isSun ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` : `${s} (${def.inTime.replace(' ', '')} - ${def.outTime.replace(' ', '')})`,
        shiftCode: s,
        inTime: inT,
        outTime: outT,
        workHours: calc.workHours,
        otHours: finalOt,
        terminal: 'Turnstile #02',
        status: isHolDuty ? 'Holiday Duty' : 'Present',
        notes: noteStr,
      };

      const exists = logs.some((r: any) => r.dayNum === todayDay);
      const updatedLogs = exists ? logs.map((row: any) => row.dayNum === todayDay ? entry : row) : [entry, ...logs];
      setDashboardLogs(updatedLogs);
      localStorage.setItem(logsKey, JSON.stringify(updatedLogs));
      localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(updatedLogs));

      window.dispatchEvent(new CustomEvent('csl-attendance-updated', { 
        detail: { day: todayDay, present: true, punchOutTime: outT, punchInTime: inT, punchState: 'out' } 
      }));
    } catch {}

    setCheckOutToastMsg(
      customOtHours > 0 
        ? `പഞ്ച് ഔട്ട്: ${outT} · ${customOtHours} മണിക്കൂർ ഓവർടൈം (OT) ആഡ് ചെയ്തു!`
        : `പഞ്ച് ഔട്ട് രേഖപ്പെടുത്തി: ${outT} (${def.name}) · 5 മിനിറ്റ് ഗ്രേസ് ടൈം ഉൾപ്പെടെ`
    );
    setShowCheckOutToast(true);
    setTimeout(() => setShowCheckOutToast(false), 4000);
  };

  const handleHalfDayPunchRecorded = (params: HalfDayPunchShareParams) => {
    const isPunchIn = params.punchType === 'IN';
    const punchT = params.time;
    const isFullDayOt = params.dutyCategory === 'full_day_ot';
    const isFullDay = params.dutyCategory === 'full_day' || isFullDayOt;
    const otVal = isFullDayOt ? Math.max(1, Number(params.otHours) || 1) : 0;

    setLastPunchTime(punchT);
    setPunchState(isPunchIn ? 'in' : 'out');
    if (isPunchIn) {
      setPunchInTs(Date.now());
      try {
        localStorage.setItem('csl_punch_in_ts', Date.now().toString());
      } catch {}
    }
    const today = getIstDate();
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const todayDay = today.getDate();
    const todayKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    const mShort = MONTH_SHORT_NAMES[curMonth] || 'Nov';
    const logsKey = getAttendanceLogsKey(curYear, curMonth);
    const presKey = `csl_calendar_present_days_${curYear}_${curMonth}`;
    
    try {
      localStorage.setItem('csl_today_punched_date', todayKey);
      localStorage.setItem('csl_actual_punched_today', 'true');
      localStorage.setItem('csl_punch_state', isPunchIn ? 'in' : 'out');
      localStorage.setItem('csl_last_punch_time', punchT);
      if (isPunchIn) {
        localStorage.setItem('csl_today_punch_in_time', punchT);
      } else {
        localStorage.setItem('csl_today_punch_out_time', punchT);
      }
      
      const savedLogs = localStorage.getItem(logsKey);
      let logs = savedLogs ? JSON.parse(savedLogs) : [];
      const entryDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
      const sessionLabel = params.session || 'First Half';
      const noteText = isFullDayOt
        ? `${otVal} hrs Overtime (OT) · ${params.shiftCode || selectedShift} Shift (${punchT})`
        : isFullDay
        ? `ഫുൾ ഡേ ${isPunchIn ? 'ഇൻ' : 'ഔട്ട്'} പഞ്ച് · ${punchT}`
        : `ഹാഫ് ഡേ ${isPunchIn ? 'ഇൻ' : 'ഔട്ട്'} പഞ്ച് (${sessionLabel}) · ${punchT}`;

      const existingIndex = logs.findIndex((r: any) => r.dayNum === todayDay);
      if (existingIndex >= 0) {
        logs[existingIndex] = {
          ...logs[existingIndex],
          inTime: isPunchIn ? punchT : (logs[existingIndex].inTime || punchT),
          outTime: !isPunchIn ? punchT : (logs[existingIndex].outTime || '—'),
          workHours: isFullDayOt ? `${8 + otVal}h 20m` : isFullDay ? '8h 20m' : '4h 10m',
          otHours: isFullDayOt ? otVal : (logs[existingIndex].otHours || 0),
          notes: noteText,
          halfDay: isFullDay ? 'No' : (sessionLabel === 'First Half' ? 'Yes (First Half)' : 'Yes (Second Half)'),
          status: isFullDay ? 'Present' : 'Casual Leave (Half Day)',
          userEdited: true,
        };
      } else {
        logs.unshift({
          id: `d-${todayDay}`,
          dateStr: `${todayDay} ${mShort} ${curYear}`,
          dayName: entryDayName,
          dayNum: todayDay,
          shift: `${params.shiftCode || selectedShift}`,
          shiftCode: params.shiftCode || selectedShift,
          inTime: isPunchIn ? punchT : '—',
          outTime: !isPunchIn ? punchT : '—',
          workHours: isFullDayOt ? `${8 + otVal}h 20m` : isFullDay ? '8h 20m' : '4h 10m',
          otHours: otVal,
          terminal: 'Gate 4 Turnstile #02',
          status: isFullDay ? 'Present' : 'Casual Leave (Half Day)',
          notes: noteText,
          halfDay: isFullDay ? 'No' : (sessionLabel === 'First Half' ? 'Yes (First Half)' : 'Yes (Second Half)'),
          userEdited: true,
        });
      }
      localStorage.setItem(logsKey, JSON.stringify(logs));
      localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(logs));
      setDashboardLogs(logs);

      const savedPres = localStorage.getItem(presKey);
      let presentList: number[] = savedPres ? JSON.parse(savedPres) : [];
      if (!presentList.includes(todayDay)) presentList.push(todayDay);
      presentList.sort((a, b) => a - b);
      localStorage.setItem(presKey, JSON.stringify(presentList));

      window.dispatchEvent(new CustomEvent('csl-attendance-updated', { detail: { day: todayDay, present: true, otHours: otVal } }));
    } catch {}

    setCheckOutToastMsg(
      isFullDayOt
        ? `ഫുൾ ഡേ + ${otVal}h OT പഞ്ച് രേഖപ്പെടുത്തി: ${punchT} · വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം`
        : isPunchIn 
        ? `ഹാഫ് ഡേ ഇൻ പഞ്ച് രേഖപ്പെടുത്തി: ${punchT} · വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം`
        : `ഹാഫ് ഡേ ഔട്ട് പഞ്ച് രേഖപ്പെടുത്തി: ${punchT} · വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം`
    );
    setShowCheckOutToast(true);
    setTimeout(() => setShowCheckOutToast(false), 4000);
  };

  const getFirstLetter = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || 'P';
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

  const handleDownloadReportPdf = async () => {
    try {
      let storedLogs: any[] = [];
      try {
        const saved = localStorage.getItem('csl_attendance_daily_logs_v2');
        if (saved) storedLogs = JSON.parse(saved);
      } catch {}

      let leaveRecords: Record<string, any> = {};
      try {
        const lSaved = localStorage.getItem('csl_calendar_leave_records_2026_9');
        if (lSaved) leaveRecords = JSON.parse(lSaved);
      } catch {}

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const pdfDailyLogs: MonthlyPdfData['dailyLogs'] = [];

      for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(2026, 9, d);
        const dayName = dayNames[dateObj.getDay()];
        const dateStr = `${String(d).padStart(2, '0')} Oct 2026 (${dayName})`;
        const isSun = dateObj.getDay() === 0;
        const holInfo = isCslHolidayDate(dateObj);
        const leave = leaveRecords[d];
        const matched = storedLogs.find((l: any) => l.dayNum === d);

        if (leave) {
          pdfDailyLogs.push({
            dayNumber: d,
            dateStr,
            dayName,
            shift: `${leave.type} Leave`,
            status: 'LEAVE' as const,
            statusLabel: `${leave.type} · ${leave.duration || 'Full Day'} (${leave.reason || 'Leave'})`,
            inTime: '—',
            outTime: '—',
          });
        } else if (matched && matched.status !== 'Leave' && matched.inTime !== '—') {
          pdfDailyLogs.push({
            dayNumber: d,
            dateStr,
            dayName,
            shift: matched.shiftCode || (isSun ? 'C1' : 'A2'),
            status: 'PRESENT' as const,
            statusLabel: matched.status || 'Duty Attended (Present)',
            inTime: matched.inTime,
            outTime: matched.outTime,
            otHours: matched.otHours ? `${matched.otHours} hrs` : undefined,
          });
        } else if (holInfo.isHoliday) {
          pdfDailyLogs.push({
            dayNumber: d,
            dateStr,
            dayName,
            shift: 'OFF',
            status: 'HOLIDAY' as const,
            statusLabel: `${holInfo.holidayName || 'Holiday'} (Holiday)`,
            inTime: '—',
            outTime: '—',
          });
        } else if (isSun) {
          pdfDailyLogs.push({
            dayNumber: d,
            dateStr,
            dayName,
            shift: 'OFF',
            status: 'WEEKLY_OFF' as const,
            statusLabel: 'Weekly Off (Sunday)',
            inTime: '—',
            outTime: '—',
          });
        } else {
          pdfDailyLogs.push({
            dayNumber: d,
            dateStr,
            dayName,
            shift: matched?.shiftCode || 'A2',
            status: 'OFF' as const,
            statusLabel: 'Off Duty',
            inTime: '—',
            outTime: '—',
          });
        }
      }

      const attendedCount = storedLogs.filter((l: any) => l.inTime !== '—' && !l.status.toLowerCase().includes('leave')).length;
      const leavesCount = Object.keys(leaveRecords).length;

      const pdfData: MonthlyPdfData = {
        employeeName: currentUser?.name || 'Prathyush Mohan K',
        tokenNumber: currentUser?.token || '5312',
        department: currentUser?.department || 'Hull Errection',
        category: isContract ? 'Company on Contract Employee (CSL)' : 'Permanent Employee (CSL)',
        monthName: 'October',
        monthYear: 2026,
        totalDays: 31,
        attendedDays: attendedCount,
        leavesCount: leavesCount,
        offsCount: 9,
        dailyLogs: pdfDailyLogs,
      };

      await generateAndDownloadMonthlyPdf(pdfData);
    } catch (e) {
      console.error('Error generating PDF from QuickAccess:', e);
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col justify-start overflow-hidden bg-radial from-[#041d2e] via-[#03131f] to-[#010911] text-white">
      {/* Background Tugboat & Shipyard maritime atmosphere matching Screenshot 1 */}
      <CslTugBackground />

      {/* Main Foreground Container */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-5 sm:py-7 flex flex-col justify-start">
        {/* Top Brand Header with CSL Emblem & Back Pill Button (Matching Screenshot 1) */}
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleLogoClick}
              className="cursor-pointer active:scale-95 transition-transform shrink-0"
              title="CSL Emblem"
              aria-label="CSL Crest"
            >
              <div className="p-0.5 rounded-full ring-2 ring-amber-500/70 bg-[#061522] shadow-[0_0_14px_rgba(245,158,11,0.25)]">
                <CslLogo size={44} />
              </div>
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate leading-snug">
                Cochin Shipyard Limited
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-300/80 tracking-wider uppercase truncate mt-0.5">
                A GOVERNMENT OF INDIA UNDERTAKING
              </p>
            </div>
          </div>

          {/* Top Right Action Group: Quick Check-Out & Cyan Pill Back Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleQuickCheckOut()}
              className="px-3 py-1.5 rounded-full bg-[#06242e]/90 border border-teal-500/50 hover:bg-[#0a3543] text-teal-200 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Fingerprint className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span className="hidden sm:inline">Quick</span> Check-Out
            </button>

            {/* Back button matching Screenshot 1 */}
            <button
              type="button"
              onClick={onBackToSignIn}
              className="px-3.5 py-1.5 rounded-full bg-[#092a3a]/80 border border-cyan-500/60 text-white hover:bg-cyan-900/40 text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              title="Back to Sign In"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Section Kicker with Amber Bar & Token Row */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-[3px] bg-amber-500 rounded-full shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase">
              {isContract
                ? (isMl ? 'കമ്പനി ഓൺ കോൺട്രാക്ട് എംപ്ലോയി' : 'COMPANY ON CONTRACT EMPLOYEE')
                : (isMl ? 'പെർമനന്റ് എംപ്ലോയി' : 'PERMANENT EMPLOYEE')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span>{currentUser.token}</span>
            <span>·</span>
            <button
              type="button"
              onClick={onBackToSignIn}
              className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>

        {/* Dark Glassmorphic User Profile Badge Card (Matching Screenshot 1) */}
        <div className="bg-[#061825]/90 rounded-2xl p-3.5 sm:p-4 border border-[#0f354c] shadow-xl flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
              {getFirstLetter(currentUser.name)}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-white text-base sm:text-lg truncate">
                {currentUser.name}
              </div>
              <div className="text-xs text-cyan-200/80 font-mono mt-0.5 truncate">
                {language === 'ml' ? 'കോഡ് നമ്പർ' : 'Code No'}: {currentUser.token || 'CSL'} · {currentUser.phone}
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

          <div className="shrink-0">
            <span className="px-3 py-1 rounded-full bg-[#082a36] text-cyan-300 text-[11px] font-bold uppercase tracking-wider border border-cyan-500/40 shadow-xs">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Hero Heading: QuickAccess. */}
        <div className="mb-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-1 font-display">
            QuickAccess.
          </h2>
          <p className="text-slate-300/80 text-sm font-normal">
            {language === 'ml' ? 'തുടരുന്നതിനായി ഒരു സേവനം തിരഞ്ഞെടുക്കുക.' : 'Choose a service to continue.'}
          </p>
        </div>

        {/* CSL Active Shift Selector Widget (Conditional A2/B2 Rotation or C1 Fixed General Shift) */}
        <div className="mb-3 bg-[#061825]/90 rounded-2xl p-3.5 sm:p-4 border border-[#0f354c] shadow-xl text-white">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-tight">
                  {language === 'ml' ? 'ഡ്യൂട്ടി ഷിഫ്റ്റ്' : 'CSL Duty Shift'}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {selectedShift === 'A2' || selectedShift === 'B2'
                    ? (language === 'ml' ? 'A2 ⇄ B2 പ്രതിവാര റൊട്ടേഷൻ ആക്റ്റീവ്' : 'A2 ⇄ B2 Weekly Rotation Active')
                    : (language === 'ml' ? 'C1 ജനറൽ ഷിഫ്റ്റ് · റൊട്ടേഷൻ ഇല്ല' : 'C1 Fixed Shift · No Rotation')}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <span className={`px-2.5 py-1 rounded-full border font-mono font-black text-xs inline-flex items-center gap-1 shadow-sm ${
                selectedShift === 'A2' || selectedShift === 'B2'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                  : 'bg-cyan-950/80 border-cyan-400/50 text-cyan-300'
              }`}>
                <span>{selectedShift}</span>
                <span className="text-[10px] text-slate-300 font-sans font-medium">({CSL_SHIFTS[selectedShift].inTime.replace(' ', '')} - {CSL_SHIFTS[selectedShift].outTime.replace(' ', '')})</span>
              </span>
            </div>
          </div>

          {/* Direct Shift Selector Buttons: C1, A2, B2, C2 */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2">
            {CSL_SHIFT_CODES.map((code) => {
              const def = CSL_SHIFTS[code];
              const isSelected = selectedShift === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectShift(code)}
                  className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#00a8cc] to-[#007799] text-white border-cyan-300 font-black shadow-lg shadow-cyan-900/40 ring-1 ring-cyan-300'
                      : 'bg-[#082235]/70 hover:bg-[#0c2f49] text-slate-300 border-[#0f354c]'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-black font-mono leading-tight">
                    {code}
                  </span>
                  <span className="text-[9px] sm:text-[10px] opacity-90 truncate leading-tight mt-0.5">
                    {code === 'C1' ? (language === 'ml' ? 'ഡേ / ജനറൽ' : 'Day / Gen')
                      : code === 'A2' ? (language === 'ml' ? 'മോണിംഗ്' : 'Morning')
                      : code === 'B2' ? (language === 'ml' ? 'ഈവനിംഗ്' : 'Evening')
                      : (language === 'ml' ? 'നൈറ്റ്' : 'Night')}
                  </span>
                  <span className="text-[8px] font-mono opacity-75 truncate mt-0.5">
                    {def.inTime.replace(':00', '').replace(' ', '')}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Subtext info & Optional Rotation Modal Trigger */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#0e2c3e]">
            <span className="truncate">
              {selectedShift === 'A2' || selectedShift === 'B2'
                ? (language === 'ml'
                    ? 'A2 ⇄ B2 റൊട്ടേഷൻ: കലണ്ടറിൽ അഡ്വാൻസായി രേഖപ്പെടുത്തിയിരിക്കുന്നു'
                    : 'A2 ⇄ B2 Rotation: Marked in advance in Calendar')
                : (language === 'ml'
                    ? 'C1 ജനറൽ ഷിഫ്റ്റ്: കലണ്ടറിൽ ഷിഫ്റ്റുകൾ ഒഴിവാക്കിയിരിക്കുന്നു'
                    : 'C1 Fixed: Shift tags hidden from calendar')}
            </span>
            <button
              type="button"
              onClick={() => setIsRotationModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 hover:underline shrink-0 ml-2 font-semibold"
            >
              {language === 'ml' ? 'റൊട്ടേഷൻ ക്രമീകരണം' : 'Weekly Rotation'}
            </button>
          </div>
        </div>

        {/* 3-Month Quarterly OT Cap Tracker (75h or 120h) */}
        <div className="mb-3.5">
          <QuarterlyOtTrackerBanner
            compact
            language={language}
            dailyLogs={dashboardLogs || []}
            onOpenDetails={() => setIsQuarterlyOtModalOpen(true)}
          />
        </div>



        {/* The 3 Detailed Service Cards List (Dark Glassmorphic matching Screenshot 1 inputs) */}
        <div className="space-y-3 mb-5">
          {/* Card 1: Calendar */}
          <div
            onClick={() => {
              if (onOpenCalendar) {
                onOpenCalendar();
              } else {
                setActiveModal('calendar');
              }
            }}
            className="bg-[#061825]/90 rounded-2xl p-4 sm:p-5 border border-[#0f354c] hover:border-cyan-400/70 hover:bg-[#082030] shadow-xl transition-all cursor-pointer select-none flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-white text-base sm:text-lg">
                  Calendar
                </div>
                <div className="text-xs text-slate-300/80 mt-0.5 flex items-center gap-1.5 truncate">
                  <span>🏅</span>
                  <span>12 CSL Holidays · 2nd & 4th Sat Off</span>
                </div>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#0a2333] border border-[#144254] text-slate-300 group-hover:text-cyan-300 group-hover:border-cyan-400/60 flex items-center justify-center shrink-0 transition-all">
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>

          {/* Card 2: Salary */}
          <div
            onClick={() => {
              if (onOpenSalary) {
                onOpenSalary();
              } else {
                setActiveModal('salary');
              }
            }}
            className="bg-[#061825]/90 rounded-2xl p-4 sm:p-5 border border-[#0f354c] hover:border-teal-400/70 hover:bg-[#082030] shadow-xl transition-all cursor-pointer select-none flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">
                <IndianRupee className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-white text-base sm:text-lg">
                  Salary
                </div>
                <div className="text-xs text-slate-300/80 mt-0.5 truncate">
                  Pay Slip, Maritime Allowance, PF & Deductions
                </div>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#0a2333] border border-[#144254] text-slate-300 group-hover:text-teal-300 group-hover:border-teal-400/60 flex items-center justify-center shrink-0 transition-all">
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>

          {/* Card 3: Attendance */}
          <div
            onClick={() => {
              if (onOpenAttendance) {
                onOpenAttendance();
              } else {
                setActiveModal('attendance');
              }
            }}
            className="bg-[#061825]/90 rounded-2xl p-4 sm:p-5 border border-[#0f354c] hover:border-emerald-400/70 hover:bg-[#082030] shadow-xl transition-all cursor-pointer select-none flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                  <span>Attendance</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    punchState === 'in' 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                      : (localStorage.getItem('csl_today_punched_date') === `${getIstDate().getFullYear()}-${String(getIstDate().getMonth() + 1).padStart(2, '0')}-${String(getIstDate().getDate()).padStart(2, '0')}`)
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {punchState === 'in' 
                      ? `● Shift ${selectedShift} (On Duty)` 
                      : (localStorage.getItem('csl_today_punched_date') === `${getIstDate().getFullYear()}-${String(getIstDate().getMonth() + 1).padStart(2, '0')}-${String(getIstDate().getDate()).padStart(2, '0')}`)
                      ? `Shift ${selectedShift} · Present`
                      : `Shift ${selectedShift} · Not Punched`}
                  </span>
                </div>
                <div className="text-xs text-slate-300/80 mt-0.5 truncate flex items-center gap-2">
                  <span className="font-mono font-medium text-cyan-300">Shift {selectedShift}</span>
                  <span>·</span>
                  <span>In: {CSL_SHIFTS[selectedShift].inTime}</span>
                  <span>·</span>
                  <span>Out: {CSL_SHIFTS[selectedShift].outTime}</span>
                </div>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#0a2333] border border-[#144254] text-slate-300 group-hover:text-emerald-300 group-hover:border-emerald-400/60 flex items-center justify-center shrink-0 transition-all">
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>

          {/* Card 4: Money Management (മണി മാനേജ്‌മെന്റ്) */}
          <div
            onClick={() => {
              if (onOpenMoney) {
                onOpenMoney();
              } else {
                window.dispatchEvent(new CustomEvent('csl-navigate-to-money'));
              }
            }}
            className="bg-[#061825]/90 rounded-2xl p-4 sm:p-5 border border-[#0f354c] hover:border-amber-400/70 hover:bg-[#082030] shadow-xl transition-all cursor-pointer select-none flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                  <span>{language === 'ml' ? 'മണി മാനേജ്‌മെന്റ്' : 'Money Management'}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/40">
                    NEW
                  </span>
                </div>
                <div className="text-xs text-slate-300/80 mt-0.5 truncate">
                  {language === 'ml' 
                    ? 'പ്രതിമാസ ബഡ്ജറ്റ്, ചെലവുകൾ, സൊസൈറ്റി ലോൺ & സമ്പാദ്യം'
                    : 'Budget, Daily Expenses, Society Loan EMI & Savings'}
                </div>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#0a2333] border border-[#144254] text-slate-300 group-hover:text-amber-300 group-hover:border-amber-400/60 flex items-center justify-center shrink-0 transition-all">
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
        </div>

      </div>

      {/* Floating Check-Out Success Toast */}
      {showCheckOutToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#042833] text-white px-5 py-3 rounded-2xl shadow-xl border border-teal-500/50 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold">{checkOutToastMsg || 'Biometric Check-Out Recorded!'}</div>
            <div className="text-teal-200">Logged at {lastPunchTime} · Shift {selectedShift}</div>
          </div>
        </div>
      )}

      {/* MODAL 1: Duty Punch Modal matching screenshots 1:1 */}
      <DutyPunchModal
        isOpen={activeModal === 'punch'}
        onClose={() => setActiveModal(null)}
        initialDate={`${getIstDate().getFullYear()}-${String(getIstDate().getMonth() + 1).padStart(2, '0')}-${String(getIstDate().getDate()).padStart(2, '0')}`}
        initialShift={selectedShift}
        initialInTime={localStorage.getItem('csl_today_punch_in_time') || CSL_SHIFTS[selectedShift].inTime}
        initialOutTime={localStorage.getItem('csl_today_punch_out_time') || CSL_SHIFTS[selectedShift].outTime}
        onSave={(data) => {
          setSelectedShift(data.shift);
          const inT = data.inTime || CSL_SHIFTS[data.shift].inTime;
          const outT = data.outTime || CSL_SHIFTS[data.shift].outTime;
          const isPunchedOut = Boolean(outT && outT !== '—' && outT !== 'On Duty');
          setLastPunchTime(isPunchedOut ? outT : inT);
          setPunchState(isPunchedOut ? 'out' : 'in');
          setShowCheckOutToast(true);
          setTimeout(() => setShowCheckOutToast(false), 3500);
          try {
            const today = getIstDate();
            const curMonth = today.getMonth();
            const curYear = today.getFullYear();
            const todayDay = today.getDate();
            const todayKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
            const isSun = today.getDay() === 0;
            const holInfo = isCslHolidayDate(today, curMonth, curYear);
            const isHolDuty = isSun || holInfo.isHoliday;
            const finalShift: CslShiftCode = isSun ? 'C1' : data.shift;
            const finalDef = CSL_SHIFTS[finalShift] || CSL_SHIFTS['A2'];
            const mShort = MONTH_SHORT_NAMES[curMonth] || 'Nov';
            const logsKey = getAttendanceLogsKey(curYear, curMonth);
            const presKey = `csl_calendar_present_days_${curYear}_${curMonth}`;
            const shiftsKey = `csl_calendar_day_shifts_${curYear}_${curMonth}`;

            let otNum = 0;
            if (data.ot) {
              const parts = data.ot.split(':');
              otNum = parts.length === 2 ? parseInt(parts[0], 10) : Math.floor(parseFloat(data.ot) || 0);
            }

            const calc = calculateDutyAndOT(inT, outT, finalShift, true, todayKey);
            const finalOt = otNum > 0 ? otNum : calc.otHours;

            localStorage.setItem('csl_last_duty_punch', JSON.stringify(data));
            localStorage.setItem('csl_today_punched_date', todayKey);
            localStorage.setItem('csl_actual_punched_today', data.leave === 'None' ? 'true' : 'false');
            localStorage.setItem('csl_today_punch_in_time', inT);
            localStorage.setItem('csl_today_punch_out_time', outT);
            localStorage.setItem('csl_punch_state', isPunchedOut ? 'out' : 'in');
            localStorage.setItem('csl_last_punch_time', isPunchedOut ? outT : inT);

            if (isPunchedOut && data.leave === 'None') {
              const summaryData = {
                dateKey: todayKey,
                shift: finalShift,
                inTime: inT,
                outTime: outT,
                totalHours: calc.workHours,
                regularHours: finalDef.duration,
                otHours: finalOt,
                graceApplied: calc.graceApplied,
                inGraceApplied: calc.inGraceApplied,
                outGraceApplied: calc.outGraceApplied,
                graceNote: calc.graceNote,
                recordedAt: outT,
              };
              setCompletedDutySummary(summaryData);
              localStorage.setItem('csl_completed_duty_summary', JSON.stringify(summaryData));
            } else {
              setCompletedDutySummary(null);
              localStorage.removeItem('csl_completed_duty_summary');
            }

            // Update dailyLogs
            const savedLogs = localStorage.getItem(logsKey);
            let logs: any[] = savedLogs ? JSON.parse(savedLogs) : [];
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const entry = {
              id: `d-${todayDay}`,
              dateStr: `${todayDay} ${mShort} ${curYear}`,
              dayName: dayNames[today.getDay()],
              dayNum: todayDay,
              shift: isSun ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` : `${finalShift} (${finalDef.inTime.replace(' ', '')} - ${finalDef.outTime.replace(' ', '')})`,
              shiftCode: finalShift,
              inTime: data.leave !== 'None' ? '—' : inT,
              outTime: data.leave !== 'None' ? '—' : outT,
              workHours: data.leave !== 'None' ? '0h' : calc.workHours,
              otHours: finalOt,
              terminal: 'Turnstile #02',
              status: isHolDuty ? 'Holiday Duty' : (data.leave !== 'None' ? 'Casual Leave' : 'Present'),
              notes: data.notes || (finalOt > 0 ? `${finalOt} hrs Overtime (OT)` : 'Duty Completed (പൂർത്തിയായി)'),
              userEdited: true,
            };
            const exists = logs.some((r: any) => r.dayNum === todayDay);
            const updatedLogs = exists ? logs.map((row: any) => row.dayNum === todayDay ? entry : row) : [entry, ...logs];
            updatedLogs.sort((a: any, b: any) => b.dayNum - a.dayNum);
            setDashboardLogs(updatedLogs);
            localStorage.setItem(logsKey, JSON.stringify(updatedLogs));
            localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(updatedLogs));

            // Update calendar present days
            const saved = localStorage.getItem(presKey);
            let presentList: number[] = saved ? JSON.parse(saved) : [];
            if (data.leave === 'None') {
              if (!presentList.includes(todayDay)) presentList.push(todayDay);
            } else {
              presentList = presentList.filter(d => d !== todayDay);
            }
            presentList.sort((a, b) => a - b);
            localStorage.setItem(presKey, JSON.stringify(presentList));

            // Update day shifts
            const savedShifts = localStorage.getItem(shiftsKey);
            const parsedShifts = savedShifts ? JSON.parse(savedShifts) : {};
            parsedShifts[todayDay] = finalShift;
            localStorage.setItem(shiftsKey, JSON.stringify(parsedShifts));

            window.dispatchEvent(new CustomEvent('csl-attendance-updated', {
              detail: {
                day: todayDay,
                present: data.leave === 'None',
                punchInTime: inT,
                punchOutTime: outT,
                shift: finalShift,
                otHours: finalOt,
                totalHours: calc.workHours
              }
            }));
          } catch {}
        }}
        currentUser={currentUser}
        language={language}
      />

      {/* Duty & WhatsApp Share Modal (Full Day + OT, Half Day, Full Day) */}
      <HalfDayWhatsAppShareModal
        isOpen={isHalfDayShareModalOpen}
        onClose={() => setIsHalfDayShareModalOpen(false)}
        language={language}
        defaultDutyCategory={halfDayShareDefaults.dutyCategory}
        defaultOtHours={halfDayShareDefaults.otHours}
        defaultPunchType={halfDayShareDefaults.punchType}
        defaultTime={halfDayShareDefaults.time}
        defaultDate={`${getIstDate().getFullYear()}-${String(getIstDate().getMonth() + 1).padStart(2, '0')}-${String(getIstDate().getDate()).padStart(2, '0')}`}
        defaultShift={selectedShift}
        defaultSession={halfDayShareDefaults.session}
        currentUser={currentUser}
        onPunchRecorded={handleHalfDayPunchRecorded}
      />

      {/* MODAL: Quarterly OT Cap (75h or 120h) */}
      <QuarterlyOtModal
        isOpen={isQuarterlyOtModalOpen}
        onClose={() => setIsQuarterlyOtModalOpen(false)}
        language={language}
        dailyLogs={dashboardLogs || []}
      />

      {/* MODAL 2: Calendar & CSL Holidays Modal */}
      {activeModal === 'calendar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#061825] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#0f354c] max-h-[85vh] flex flex-col text-white">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#0e2c3e] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-white">CSL Official Calendar 2026</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-[#0a2738] border border-[#143e57] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
              {[
                { date: '26 Jan 2026', day: 'Monday', name: 'Republic Day (റിപ്പബ്ലിക് ദിനം - National)' },
                { date: '21 Mar 2026', day: 'Saturday', name: 'Id-ul-Fitr / Ramzan (ഈദുൽ ഫിത്ർ - CSL Gazetted)' },
                { date: '03 Apr 2026', day: 'Friday', name: 'Good Friday (ദുഃഖവെള്ളി - CSL Gazetted)' },
                { date: '14 Apr 2026', day: 'Tuesday', name: 'Dr. B.R. Ambedkar Jayanthi / Vishu (വിഷു - CSL Gazetted)' },
                { date: '01 May 2026', day: 'Friday', name: 'May Day (തൊഴിലാളി ദിനം - National)' },
                { date: '27 May 2026', day: 'Wednesday', name: 'Bakrid / Id-ul-Zuha (ബക്രീദ് - CSL Gazetted)' },
                { date: '26 Jul 2026', day: 'Sunday', name: 'Muharram (മുഹറം - CSL Gazetted)' },
                { date: '15 Aug 2026', day: 'Saturday', name: 'Independence Day (സ്വാതന്ത്ര്യദിനം - National)' },
                { date: '27 Aug 2026', day: 'Thursday', name: 'Thiruvonam (തിരുവോണം - CSL Gazetted)' },
                { date: '04 Sep 2026', day: 'Friday', name: 'Sree Narayana Guru Jayanthi (ഗുരു ജയന്തി - CSL Gazetted)' },
                { date: '02 Oct 2026', day: 'Friday', name: 'Gandhi Jayanthi (ഗാന്ധി ജയന്തി - National)' },
                { date: '21 Oct 2026', day: 'Wednesday', name: 'Vijayadasami (വിജയദശമി - CSL Gazetted)' },
                { date: 'Every 2nd & 4th Sat', day: 'Monthly', name: 'CSL Scheduled Yard Weekend Off (രണ്ടാം & നാലാം ശനി)' },
              ].map((item, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#071d2b] border border-[#123950] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400">{item.day}</div>
                  </div>
                  <span className="font-mono text-cyan-300 font-bold text-[11px] bg-[#0a2738] border border-cyan-500/30 px-2 py-1 rounded">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Salary Calculator & Pay Breakdown */}
      {activeModal === 'salary' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#061825] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#0f354c] text-white">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#0e2c3e] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-white">CSL Pay Scale Calculator</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-[#0a2738] border border-[#143e57] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs mb-4">
              <div className="p-3 rounded-2xl bg-[#093542] border border-teal-500/40 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-teal-300 uppercase font-semibold">
                    {isContract ? 'Contract Base Pay (Take-Home)' : 'Net Monthly Take-Home'}
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    {isContract ? '₹ 25,340' : '₹ 78,450'}
                  </div>
                </div>
                <span className="text-[10px] bg-teal-800/80 border border-teal-500/40 px-2 py-1 rounded-md text-emerald-300 font-bold">
                  {isContract ? 'ON CONTRACT' : 'GRADE E-3'}
                </span>
              </div>

              {isContract ? (
                <div className="p-3 rounded-xl bg-[#071d2b] border border-[#123950] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Basic / Consolidated Pay:</span>
                    <span className="font-bold text-white font-mono">₹ 25,340</span>
                  </div>

                  <div className="pt-1.5 border-t border-[#0e2c3e] flex justify-between text-amber-300 font-medium">
                    <span>PF Deduction:</span>
                    <span className="font-mono font-bold">Admin Solved Only</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#071d2b] border border-[#123950] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Basic Pay:</span>
                    <span className="font-bold text-white font-mono">₹ 60,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Industrial DA (43.8%):</span>
                    <span className="font-bold text-white font-mono">₹ 26,280</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">HRA (Kochi 18%):</span>
                    <span className="font-bold text-white font-mono">₹ 10,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maritime Shipbuilding Allowance:</span>
                    <span className="font-bold text-white font-mono">₹ 7,200</span>
                  </div>
                  <div className="pt-1.5 border-t border-[#0e2c3e] flex justify-between text-rose-400 font-medium">
                    <span>Deductions (PF + NPS + Income Tax):</span>
                    <span className="font-mono font-bold">- ₹ 25,830</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  if (onOpenSalary) onOpenSalary();
                }}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#1ac5eb] hover:to-[#008cc0] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-98"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Full CSL Calculator & Official Payslip →</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2 rounded-xl bg-[#0a2738] hover:bg-[#0e354c] text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-[#143e57]"
              >
                Close Quick Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Complete Interactive Attendance & Biometric Duty Management */}
      {activeModal === 'attendance' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#061825] rounded-3xl p-5 sm:p-6 w-full max-w-xl shadow-2xl border border-[#0f354c] my-auto max-h-[92vh] flex flex-col text-white">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#0e2c3e] mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0 shadow-2xs">
                  <ClipboardCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white leading-snug">
                    Biometric Attendance & Shift Register
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {MONTH_FULL_NAMES[getIstDate().getMonth()]} {getIstDate().getFullYear()} · Cochin Shipyard Official Duty Log
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-9 h-9 rounded-full bg-[#0a2738] border border-[#143e57] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              
              {/* 1. Live Terminal Card with Instant Punch Action */}
              <div className="rounded-2xl p-4 bg-linear-to-r from-[#005f73] to-[#0a4654] text-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                      Live Biometric Station
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold bg-white/15 px-2.5 py-0.5 rounded-full font-mono">
                    Shift {selectedShift}: {CSL_SHIFTS[selectedShift].inTime} – {CSL_SHIFTS[selectedShift].outTime}
                  </span>
                </div>

                {/* CSL Shift Selector Pills */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {CSL_SHIFT_CODES.map((code) => {
                    const def = CSL_SHIFTS[code];
                    const isSelected = selectedShift === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleSelectShift(code)}
                        className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs scale-[1.02]'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                        }`}
                      >
                        <span className="block font-black">{code}</span>
                        <span className="text-[9px] block font-mono opacity-85 truncate">{def.inTime.replace(' ', '')}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Shift Timing Details: 30-Min Start vs Official Deadline */}
                <div className="p-2.5 rounded-xl bg-black/25 border border-white/10 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-teal-200">
                      ആരംഭം (30m മുൻപ്): <strong className="text-emerald-300 font-bold">{CSL_SHIFTS[selectedShift].punchStart}</strong>
                    </span>
                    <span className="text-amber-300">
                      അവസാന സമയം: <strong className="text-white font-bold">{CSL_SHIFTS[selectedShift].inTime}</strong>
                    </span>
                  </div>
                  <div className="text-[10px] text-teal-100 flex items-center justify-between">
                    <span>{CSL_SHIFTS[selectedShift].name} ({CSL_SHIFTS[selectedShift].duration} ഡ്യൂട്ടി)</span>
                    <span className="text-rose-200">പഞ്ച്-ഔട്ട്: {CSL_SHIFTS[selectedShift].outTime}</span>
                  </div>
                </div>

                {/* Live Running Duty Timer Counter when on duty */}
                {punchState === 'in' && (
                  <div className="p-3 rounded-xl bg-black/35 border border-emerald-400/30 text-white space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <Timer className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>ഡ്യൂട്ടി ചെയ്തുകൊണ്ടിരിക്കുന്നത് (Live Duty):</span>
                      </span>
                      <span className="text-[10px] font-mono text-teal-200">
                        In: {lastPunchTime}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-mono font-black text-2xl text-amber-300 tracking-wider">
                        {Math.floor(elapsedSecs / 3600).toString().padStart(2, '0')}:
                        {Math.floor((elapsedSecs % 3600) / 60).toString().padStart(2, '0')}:
                        {(elapsedSecs % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-[11px] text-emerald-200 font-medium">
                        <strong className="text-white font-bold">{Math.floor(elapsedSecs / 3600)}</strong> മണിക്കൂർ{' '}
                        <strong className="text-white font-bold">{Math.floor((elapsedSecs % 3600) / 60)}</strong> മിനിറ്റ്
                      </div>
                    </div>

                    {elapsedSecs >= CSL_SHIFTS[selectedShift].durationMinutes * 60 && (
                      <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>ഓവർടൈം ഓൺ ഡ്യൂട്ടി (+{Math.round(((elapsedSecs - CSL_SHIFTS[selectedShift].durationMinutes * 60) / 3600) * 10) / 10} hrs OT)</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-white/10">
                  <div>
                    <div className="text-xl sm:text-2xl font-black tracking-tight">
                      {punchState === 'in' 
                        ? `● ON DUTY · Shift ${selectedShift}` 
                        : (localStorage.getItem('csl_today_punched_date') === `${getIstDate().getFullYear()}-${String(getIstDate().getMonth() + 1).padStart(2, '0')}-${String(getIstDate().getDate()).padStart(2, '0')}`)
                        ? `CHECKED OUT · Shift ${selectedShift} (Present)`
                        : `NOT PUNCHED · Shift ${selectedShift}`}
                    </div>
                    <div className="text-xs text-teal-100 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-teal-300" />
                      <span>{lastPunchTime !== '—' ? `Last Punch: ${lastPunchTime}` : `Scheduled: ${CSL_SHIFTS[selectedShift].inTime}`} · {CSL_SHIFTS[selectedShift].duration}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {punchState === 'out' ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleQuickCheckIn(selectedShift, currentTime)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Fingerprint className="w-4 h-4 stroke-[2.2]" />
                          <span>പഞ്ച്-ഇൻ</span>
                          <span className="font-mono text-xs bg-black/25 px-2 py-0.5 rounded-md border border-white/20">
                            {currentTime}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const defaultOtTime = getShiftTimeWithOt(selectedShift, 1);
                            setHalfDayShareDefaults({
                              punchType: 'OUT',
                              dutyCategory: 'full_day_ot',
                              otHours: 1,
                              time: defaultOtTime,
                            });
                            setIsHalfDayShareModalOpen(true);
                          }}
                          className="px-3.5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-300"
                          title="OT സമയം വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ഷെയർ ചെയ്യാം"
                        >
                          <MessageSquare className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                          <span>{isMl ? '⚡ OT ഔട്ട് & വാട്സ്ആപ്പ്' : '⚡ OT OUT & WhatsApp'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setHalfDayShareDefaults({
                              punchType: 'IN',
                              dutyCategory: 'half_day',
                              time: currentTime,
                              session: 'First Half'
                            });
                            setIsHalfDayShareModalOpen(true);
                          }}
                          className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-[#093542] hover:bg-[#0d4557] text-emerald-300 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-400/50"
                          title="ഹാഫ് ഡേ ഇൻ പഞ്ച് ചെയ്ത് വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ സമയം ഷെയർ ചെയ്യാം"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>ഹാഫ് ഡേ ഇൻ & വാട്സ്ആപ്പ്</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleQuickCheckOut(selectedShift, 0, CSL_SHIFTS[selectedShift].earlyOutGraceTime)}
                          className="px-2.5 py-2.5 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1 border border-teal-400/40"
                          title={`Permanent Employee 5-minute Early Out Grace: ${CSL_SHIFTS[selectedShift].earlyOutGraceTime}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                          <span>5m ഗ്രേസ് ({CSL_SHIFTS[selectedShift].earlyOutGraceTime})</span>
                        </button>
                        {(() => {
                          const def = CSL_SHIFTS[selectedShift];
                          const inT = localStorage.getItem('csl_today_punch_in_time') || (lastPunchTime && lastPunchTime !== '—' && lastPunchTime !== 'On Duty' ? lastPunchTime : def.inTime);
                          const liveCalc = calculateDutyAndOT(inT, currentTime, selectedShift, true);
                          const autoOt = liveCalc.otHours;

                          return (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckOut(selectedShift, autoOt)}
                              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                              title={autoOt > 0 ? `Auto-calculated ${autoOt} hrs Overtime after regular shift` : 'Record Live Punch Out'}
                            >
                              <Fingerprint className="w-4 h-4 stroke-[2.2]" />
                              <span>പഞ്ച് ഔട്ട്</span>
                              {autoOt > 0 && (
                                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-xs animate-pulse">
                                  +{autoOt}h OT
                                </span>
                              )}
                              <span className="font-mono text-[10px] bg-black/25 px-1.5 py-0.5 rounded border border-white/20">
                                {currentTime}
                              </span>
                            </button>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => {
                            const def = CSL_SHIFTS[selectedShift];
                            const inT = localStorage.getItem('csl_today_punch_in_time') || (lastPunchTime && lastPunchTime !== '—' && lastPunchTime !== 'On Duty' ? lastPunchTime : def.inTime);
                            const liveCalc = calculateDutyAndOT(inT, currentTime, selectedShift, true);
                            const otToUse = liveCalc.otHours > 0 ? liveCalc.otHours : 1.0;
                            setHalfDayShareDefaults({
                              punchType: 'OUT',
                              dutyCategory: 'full_day_ot',
                              otHours: otToUse,
                              time: currentTime,
                            });
                            setIsHalfDayShareModalOpen(true);
                          }}
                          className="px-3 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-300"
                          title="OT സമയം വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ഷെയർ ചെയ്യാം"
                        >
                          <MessageSquare className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                          <span>{isMl ? '⚡ OT ഔട്ട് & വാട്സ്ആപ്പ്' : '⚡ OT OUT & WhatsApp'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setHalfDayShareDefaults({
                              punchType: 'OUT',
                              dutyCategory: 'half_day',
                              time: currentTime,
                              session: 'First Half'
                            });
                            setIsHalfDayShareModalOpen(true);
                          }}
                          className="px-3 py-2.5 rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-400/40"
                          title="ഹാഫ് ഡേ ഔട്ട് പഞ്ച് ചെയ്ത് വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ സമയം ഷെയർ ചെയ്യാം"
                        >
                          <MessageSquare className="w-4 h-4 text-amber-400" />
                          <span>ഹാഫ് ഡേ ഔട്ട് & വാട്സ്ആപ്പ്</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickCheckOut(selectedShift, 1.0)}
                          className="px-2 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                          title="Record 1 Hour Overtime (OT)"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>+1h OT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickCheckOut(selectedShift, 2.0)}
                          className="px-2 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                          title="Record 2 Hours Overtime (OT)"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>+2h OT</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Monthly Summary KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-[#06292b] border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">
                    Present
                  </div>
                  <div className="text-xl font-black text-emerald-100 mt-0.5">
                    {(dashboardLogs || []).filter((r: any) => r.status === 'Present' || r.status === 'On Duty' || r.status === 'Holiday Duty').length} <span className="text-xs font-semibold text-emerald-400">/ 26 d</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#072436] border border-sky-500/40">
                  <div className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wider">
                    OT Hours
                  </div>
                  <div className="text-xl font-black text-sky-100 mt-0.5">
                    +{(dashboardLogs || []).reduce((acc: number, r: any) => acc + (Number(r.otHours) || 0), 0)} <span className="text-xs font-semibold text-sky-400">hrs</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#2a1e0b] border border-amber-500/40">
                  <div className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                    Holidays / Off
                  </div>
                  <div className="text-xl font-black text-amber-100 mt-0.5">
                    4 <span className="text-xs font-semibold text-amber-400">days</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#251533] border border-purple-500/40">
                  <div className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider">
                    Leaves Used
                  </div>
                  <div className="text-xl font-black text-purple-100 mt-0.5">
                    1 <span className="text-xs font-semibold text-purple-400">CL</span>
                  </div>
                </div>
              </div>

              {/* 3. Daily Attendance Duty Logs Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>{MONTH_FULL_NAMES[getIstDate().getMonth()]} {getIstDate().getFullYear()} Daily Duty Log</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Biometric Verified
                  </span>
                </div>

                <div className="border border-[#0f354c] rounded-2xl overflow-hidden divide-y divide-[#0e2c3e] bg-[#071d2b]/60 text-xs">
                  {dashboardLogs && dashboardLogs.length > 0 ? (
                    dashboardLogs.slice(0, 7).map((row: any, idx: number) => (
                      <div key={idx} className="p-2.5 sm:p-3 flex items-center justify-between gap-2 hover:bg-[#0a2738] transition-colors">
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs flex items-center gap-2">
                            <span>{row.dateStr || row.date}</span>
                            <span className="text-[10px] font-normal text-slate-300 bg-[#0a2536] border border-[#144254] px-1.5 py-0.5 rounded">
                              {row.shift}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>IN: <strong className="text-slate-200">{row.inTime || row.in}</strong></span>
                            <span>·</span>
                            <span>
                              OUT: <strong className={row.outTime === 'On Duty' ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-200 font-bold'}>
                                {row.outTime || row.out}
                              </strong>
                            </span>
                            {row.otHours > 0 && <span className="text-teal-300 font-bold">(+{row.otHours}h OT)</span>}
                            {row.notes && (
                              <span className="text-[10px] text-emerald-400 font-normal bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                {row.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'Present'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : row.status === 'On Duty'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : row.status === 'Holiday Duty'
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                              : row.status === 'CSL Holiday'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {row.status}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {row.workHours || row.hrs}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 space-y-2">
                      <ClipboardCheck className="w-8 h-8 text-cyan-400/50 mx-auto" />
                      <div className="font-bold text-white text-xs sm:text-sm">
                        {language === 'ml' ? 'ഇതുവരെ ഹാജർ രേഖപ്പെടുത്തിയിട്ടില്ല' : 'No Attendance Records Yet'}
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        {language === 'ml'
                          ? 'നിങ്ങൾ ഡ്യൂട്ടി പഞ്ച് ചെയ്യുമ്പോൾ ഹാജർ വിവരങ്ങൾ ഇവിടെ തത്സമയം രേഖപ്പെടുത്തപ്പെടും.'
                          : 'Your daily attendance and shift records will be listed here once you punch in for duty.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Action Banner to Open Full CSL Wall Calendar & Register */}
              <div
                onClick={() => {
                  setActiveModal(null);
                  if (onOpenCalendar) onOpenCalendar();
                }}
                className="rounded-2xl p-3.5 bg-[#06242e] border border-[#0f4b55] flex items-center justify-between gap-3 hover:bg-[#093542] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-teal-300 shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-white">
                      Open Official CSL Wall Calendar & Full Shift Register
                    </div>
                    <div className="text-[11px] text-teal-200/80">
                      View complete monthly grid with holidays, shift changes & leave balances
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-300 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 mt-3 border-t border-[#0e2c3e] flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadReportPdf}
                className="px-3.5 py-2 rounded-xl bg-[#0a2738] hover:bg-[#0e354c] text-teal-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-cyan-500/40 shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'PDF ഡൗൺലോഡ്' : 'Download PDF Report'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-linear-to-r from-[#00b4d8] to-[#0077b6] hover:from-[#1ac5eb] hover:to-[#008cc0] text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Weekly Shift Rotation Modal (A2 ⇄ B2 Alternate Every Week) */}
      <WeeklyShiftRotationModal
        isOpen={isRotationModalOpen}
        onClose={() => setIsRotationModalOpen(false)}
        language={language}
        onApplied={() => {
          setIsRotationModalOpen(false);
          const currentWeeklyShift = getCurrentAndNextWeekShift().thisWeekShift;
          setSelectedShift(currentWeeklyShift);
        }}
      />
    </div>
  );
};
