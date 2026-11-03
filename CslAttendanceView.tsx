import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Fingerprint, Clock, Calendar, CheckCircle2, 
  MapPin, ShieldCheck, Download, Printer, Filter, 
  Plus, Check, X, AlertCircle, ChevronRight, IndianRupee,
  FileText, User, RefreshCw, Send, Sliders, Edit3, Zap, TrendingUp, Timer, Flame,
  Pencil, Sparkles, Trash2, ClipboardCheck, MessageSquare
} from 'lucide-react';
import { CslLogo } from './CslLogo';
import { CslTugBackground } from './CslTugBackground';
import { Language } from '../types';
import { 
  CSL_SHIFTS, CSL_SHIFT_CODES, CslShiftCode, DutyPunchData,
  calculateDutyAndOT, getCslPunchWindowStart, parseTimeToMinutes,
  getShiftTimeWithOt, formatCslTime, getCslEarlyOutGraceTime,
  inferCslShiftFromTimes, reconcileAttendanceDailyLogs,
  isSundayDate, isCslHolidayDate, getRecommendedShiftForDate,
  getIstDate, MONTH_SHORT_NAMES, MONTH_FULL_NAMES, MONTH_NAMES_ML,
  getAttendanceLogsKey, ensureMonthlyRolloverAndArchive
} from '../data/cslShifts';
import { DutyPunchModal } from './DutyPunchModal';
import { generateAndDownloadMonthlyPdf, MonthlyPdfData } from '../utils/cslPdfGenerator';
import { CSL_LEAVE_TYPES_MAP, CslLeaveType, DayLeaveDetails } from './CslCalendarView';
import { getCurrentAndNextWeekShift, getEffectiveShiftForDate, getSyncedActiveShiftForToday, syncShiftFromCalendarEverywhere } from '../utils/shiftRotation';
import { getNowTime12, to24HourTime, to12HourTime, adjustTimeString } from '../utils/timeQuickSet';
import { HalfDayWhatsAppShareModal } from './HalfDayWhatsAppShareModal';
import { HalfDayPunchShareParams } from '../utils/whatsappShare';
import { QuarterlyOtTrackerBanner } from './QuarterlyOtTrackerBanner';
import { QuarterlyOtModal } from './QuarterlyOtModal';
import { CslNextMonthOtViewerModal } from './CslNextMonthOtViewerModal';
import { buildUnifiedOtRegisterPdfData, calculateQuarterlyOtSummary } from '../utils/cslQuarterlyOt';

interface CslAttendanceViewProps {
  language: Language;
  currentUser: {
    name: string;
    token: string;
    phone: string;
    department?: string;
    category?: string;
  };
  onBackToQuickAccess: () => void;
  onOpenSalary?: () => void;
  onOpenCalendar?: () => void;
}

interface DailyAttendanceRecord {
  id: string;
  dateStr: string; // '14 Oct 2026'
  dayName: string; // 'Wednesday'
  dayNum: number;
  shift: string; // 'A2 (07:00 - 15:20)'
  shiftCode: CslShiftCode | 'GEN' | 'OFF' | 'HLD';
  inTime: string;
  outTime: string;
  workHours: string;
  otHours: number;
  terminal: string;
  status: 'Present' | 'Weekly Off' | 'CSL Holiday' | 'Casual Leave' | 'Earned Leave' | 'Medical Leave' | 'Half Pay Leave' | 'Special Leave' | 'On Duty' | string;
  notes?: string;
  work?: string;
  userEdited?: boolean;
}

const isGenericAutoNote = (str?: string): boolean => {
  if (!str) return true;
  const s = str.trim().toLowerCase();
  if (
    s === 'duty completed (പൂർത്തിയായി)' ||
    s === 'duty completed' ||
    s === 'ഡ്യൂട്ടി പൂർത്തിയായി' ||
    s === 'duty present' ||
    s === 'ഡ്യൂട്ടി പ്രസന്റ്' ||
    s === 'biometric duty in recorded' ||
    s === 'ഡ്യൂട്ടിയിലാണ്' ||
    s === 'duty punch saved' ||
    s === 'ഡ്യൂട്ടി സേവ് ചെയ്തു' ||
    s === 'on duty' ||
    s.includes('ഗ്രേസ് ടൈം') ||
    s.includes('grace applied') ||
    s.includes('ഗ്രേസ് അനുവദിച്ചു')
  ) {
    return true;
  }
  return false;
};

export const CslAttendanceView: React.FC<CslAttendanceViewProps> = ({
  language,
  currentUser,
  onBackToQuickAccess,
  onOpenSalary,
  onOpenCalendar,
}) => {
  const isMl = language === 'ml';
  const isContract = currentUser?.category === 'contract' || 
    (typeof window !== 'undefined' && localStorage.getItem('csl_employee_category') === 'contract');

  // Live Current Time in IST
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

  return () => clearInterval(timer);
  }, []);

  // Quick Punch Time override state (allows 1-click setting of shift in/out, grace, or adjusted time)
  const [customPunchTime, setCustomPunchTime] = useState<string | null>(null);

  // Active CSL Shift (A2: 07:00-15:20, B2: 13:40-22:00, C2: 06:00-14:00, C1: 08:00-16:20)
  const [activeShift, setActiveShift] = useState<CslShiftCode>(() => {
    const today = getIstDate();
    if (today.getDay() === 0) return 'C1';
    return getSyncedActiveShiftForToday(today);
  });

  // Sync active shift across components in real time
  useEffect(() => {
    const handleShiftSync = (e?: any) => {
      const explicitShift = typeof e?.detail === 'string' ? e.detail : e?.detail?.shift;
      if (explicitShift && (CSL_SHIFT_CODES as string[]).includes(explicitShift)) {
        setActiveShift(explicitShift as CslShiftCode);
        return;
      }
      setActiveShift(getSyncedActiveShiftForToday(getIstDate()));
    };
    window.addEventListener('csl-shift-changed', handleShiftSync);
    window.addEventListener('csl-shift-rotation-changed', handleShiftSync);
    window.addEventListener('csl-calendar-shifts-updated', handleShiftSync);
    window.addEventListener('storage', handleShiftSync);
    return () => {
      window.removeEventListener('csl-shift-changed', handleShiftSync);
      window.removeEventListener('csl-shift-rotation-changed', handleShiftSync);
      window.removeEventListener('csl-calendar-shifts-updated', handleShiftSync);
      window.removeEventListener('storage', handleShiftSync);
    };
  }, []);

  const [selectedLogMonth, setSelectedLogMonth] = useState<number>(() => {
    ensureMonthlyRolloverAndArchive();
    return getIstDate().getMonth();
  });
  const selectedLogYear = 2026;

  // Biometric Punch State
  // CRITICAL: Off-Duty / Not Punched by default until user actually punches in for today
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

  const [lastPunchTime, setLastPunchTime] = useState<string>(() => {
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

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Duty Punch Modal State (Matching User's screenshots 1:1)
  const [isDutyPunchModalOpen, setIsDutyPunchModalOpen] = useState(false);
  const [activePunchDate, setActivePunchDate] = useState(() => {
    const t = getIstDate();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });
  const [activePunchShift, setActivePunchShift] = useState<CslShiftCode>('A2');
  const [activePunchIn, setActivePunchIn] = useState('');
  const [activePunchOut, setActivePunchOut] = useState('');
  const [activePunchOt, setActivePunchOt] = useState('');
  const [activePunchLeave, setActivePunchLeave] = useState<DutyPunchData['leave']>('None');
  const [activePunchHalfDay, setActivePunchHalfDay] = useState<DutyPunchData['halfDay']>('No');
  const [activePunchNotes, setActivePunchNotes] = useState('');

  // Half Day WhatsApp Share State
  const [isHalfDayModalOpen, setIsHalfDayModalOpen] = useState(false);
  const [halfDayModalParams, setHalfDayModalParams] = useState<Partial<HalfDayPunchShareParams>>({
    punchType: 'IN',
    session: 'First Half'
  });

  // Quarterly OT Cap Modal State (75h vs 120h per 3-month cycle)
  const [isQuarterlyOtModalOpen, setIsQuarterlyOtModalOpen] = useState(false);

  // Filter for Daily Logs
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PRESENT' | 'OT' | 'LEAVE' | 'HOLIDAY'>('ALL');

  // Leave Management State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'CL' | 'EL' | 'HPL' | 'ML' | 'RH' | 'SPL'>('CL');
  const [leaveDate, setLeaveDate] = useState(() => {
    const t = getIstDate();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('Personal work / Family emergency');
  const [leaveSuccessNotice, setLeaveSuccessNotice] = useState<string | null>(null);

  const [leaveBalances, setLeaveBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('csl_leave_balances_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      cl: 8,
      clTotal: 12,
      el: 24,
      elTotal: 30,
      hpl: 16,
      hplTotal: 20,
      specialLeave: 15,
      specialLeaveTotal: 15,
      rh: 2,
      rhTotal: 2,
    };
  });

  // Leave Quotas Setup Modal State (Independent Phase 1 & Phase 2, no auto-equalizing)
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [editP1, setEditP1] = useState('6');
  const [editP2, setEditP2] = useState('6');
  const [editHpl, setEditHpl] = useState('20');
  const [editEl, setEditEl] = useState('30');
  const [editScl, setEditScl] = useState('15');

  useEffect(() => {
    if (isQuotaModalOpen) {
      setEditP1(String(leaveBalances.clPhase1Total !== undefined ? leaveBalances.clPhase1Total : (leaveBalances.clPhase1 ?? 6)));
      setEditP2(String(leaveBalances.clPhase2Total !== undefined ? leaveBalances.clPhase2Total : (leaveBalances.clPhase2 ?? 6)));
      setEditHpl(String(leaveBalances.hplTotal !== undefined ? leaveBalances.hplTotal : (isContract ? 0 : 20)));
      setEditEl(String(leaveBalances.elTotal !== undefined ? leaveBalances.elTotal : (isContract ? 0 : 30)));
      setEditScl(String(leaveBalances.specialLeaveTotal !== undefined ? leaveBalances.specialLeaveTotal : (isContract ? 0 : 15)));
    }
  }, [isQuotaModalOpen, leaveBalances, isContract]);

  // Sync leave balances whenever updated
  useEffect(() => {
    const syncBalances = (e?: any) => {
      try {
        if (e?.detail) {
          setLeaveBalances(e.detail);
          return;
        }
        const saved = localStorage.getItem('csl_leave_balances_v2');
        if (saved) setLeaveBalances(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('csl-leave-balances-updated', syncBalances);
    window.addEventListener('storage', syncBalances);
    return () => {
      window.removeEventListener('csl-leave-balances-updated', syncBalances);
      window.removeEventListener('storage', syncBalances);
    };
  }, []);

  // Selected Day for Attendance & Shift Duty Card (matching Screenshot 143241)
  const [selectedDayNum, setSelectedDayNum] = useState<number>(() => {
    const today = getIstDate();
    return today.getDate();
  });

  // Synced Leave records (Record<number, DayLeaveDetails>) for selectedLogMonth
  const [attendanceLeaveRecords, setAttendanceLeaveRecords] = useState<Record<number, DayLeaveDetails>>(() => {
    try {
      const m = getIstDate().getMonth();
      const saved = localStorage.getItem(`csl_calendar_leave_records_${selectedLogYear}_${m}`);
      let parsed: Record<number, DayLeaveDetails> = saved ? JSON.parse(saved) : {};

      // Ensure October 20 Medical Leave (ML) entered by user is preserved and restored in October
      if (m === 9 && !parsed[20] && (parsed[19]?.type === 'ML' || localStorage.getItem('csl_oct_20_ml_entered') === 'true')) {
        parsed[20] = {
          type: 'ML',
          duration: 'Full Day',
          reason: 'Medical Leave with Doctor Certificate (മെഡിക്കൽ അവധി)',
          appliedDate: '2026-10-20',
          medicalCert: true,
        };
        try {
          localStorage.setItem('csl_calendar_leave_records_2026_9', JSON.stringify(parsed));
          localStorage.setItem('csl_oct_20_ml_entered', 'true');
        } catch {}
      }

      return parsed;
    } catch {}
    return {};
  });

  // Synced Day Notes
  const [dayNotes, setDayNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('csl_calendar_day_notes_2026');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Synced Day Works (replacing memo with work)
  const [dayWorks, setDayWorks] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('csl_calendar_day_works_2026');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [workDraft, setWorkDraft] = useState<string>('');

  // Update noteDraft and workDraft whenever selectedDayNum, selectedLogMonth, dayNotes, or dayWorks change
  useEffect(() => {
    const noteKey = `${selectedLogYear}-${selectedLogMonth}-${selectedDayNum}`;
    const altNoteKey = `${selectedLogYear}-${selectedLogMonth + 1}-${selectedDayNum}`;
    setNoteDraft(dayNotes[noteKey] || dayNotes[altNoteKey] || '');
    setWorkDraft(dayWorks[noteKey] || dayWorks[altNoteKey] || '');
  }, [selectedDayNum, selectedLogMonth, dayNotes, dayWorks]);

  // Sync leave records, notes, and works from external changes or month switch
  useEffect(() => {
    const syncRecords = (e?: any) => {
      try {
        const saved = localStorage.getItem(`csl_calendar_leave_records_${selectedLogYear}_${selectedLogMonth}`);
        if (saved) {
          setAttendanceLeaveRecords(JSON.parse(saved));
        } else {
          setAttendanceLeaveRecords({});
        }
        const savedNotes = localStorage.getItem('csl_calendar_day_notes_2026');
        if (savedNotes) setDayNotes(JSON.parse(savedNotes));
        const savedWorks = localStorage.getItem('csl_calendar_day_works_2026');
        if (savedWorks) setDayWorks(JSON.parse(savedWorks));
      } catch {}
    };
    syncRecords();
    window.addEventListener('storage', syncRecords);
    window.addEventListener('csl-calendar-leaves-updated', syncRecords);
    return () => {
      window.removeEventListener('storage', syncRecords);
      window.removeEventListener('csl-calendar-leaves-updated', syncRecords);
    };
  }, [selectedLogMonth]);

  // Synchronize attendanceLeaveRecords with dailyLogs in real time
  useEffect(() => {
    setDailyLogs((prev) => {
      let changed = false;
      const dayNums = new Set(prev.map(r => r.dayNum));
      const mShort = MONTH_SHORT_NAMES[selectedLogMonth] || 'Nov';
      const logsKey = getAttendanceLogsKey(selectedLogYear, selectedLogMonth);

      let updated = prev.map((row) => {
        const leave = attendanceLeaveRecords[row.dayNum];
        if (leave) {
          const leaveStatus = leave.type === 'ML' 
            ? 'Medical Leave' 
            : leave.type === 'CL' 
            ? 'Casual Leave' 
            : leave.type === 'EL' 
            ? 'Earned Leave' 
            : leave.type === 'HPL' 
            ? 'Half Pay Leave' 
            : 'Special Leave';
          const leaveNote = leave.type === 'ML'
            ? (isMl ? 'മെഡിക്കൽ ലീവ് (ML) · EL ക്വാട്ടയിൽ നിന്ന് കുറച്ചു' : 'Medical Leave (ML) · Deducted from EL')
            : `${leave.type} Leave Recorded`;
          const leaveShift = `${leave.type} Leave (${leave.duration || 'Full Day'})`;

          if (row.status !== leaveStatus || row.inTime !== '—') {
            changed = true;
            return {
              ...row,
              shift: leaveShift,
              inTime: '—',
              outTime: '—',
              workHours: '0h',
              otHours: 0,
              status: leaveStatus as any,
              notes: leaveNote,
            };
          }
        }
        return row;
      });

      // Also ensure any day in attendanceLeaveRecords exists in dailyLogs
      Object.entries(attendanceLeaveRecords).forEach(([dKey, leave]) => {
        const d = parseInt(dKey, 10);
        if (!dayNums.has(d)) {
          changed = true;
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(selectedLogYear, selectedLogMonth, d).getDay()];
          const leaveStatus = leave.type === 'ML' 
            ? 'Medical Leave' 
            : leave.type === 'CL' 
            ? 'Casual Leave' 
            : leave.type === 'EL' 
            ? 'Earned Leave' 
            : leave.type === 'HPL' 
            ? 'Half Pay Leave' 
            : 'Special Leave';
          const leaveNote = leave.type === 'ML'
            ? (isMl ? 'മെഡിക്കൽ ലീവ് (ML) · EL ക്വാട്ടയിൽ നിന്ന് കുറച്ചു' : 'Medical Leave (ML) · Deducted from EL')
            : `${leave.type} Leave Recorded`;

          updated.push({
            id: `d-${d}`,
            dateStr: `${d} ${mShort} ${selectedLogYear}`,
            dayName,
            dayNum: d,
            shift: `${leave.type} Leave (${leave.duration || 'Full Day'})`,
            shiftCode: 'GEN',
            inTime: '—',
            outTime: '—',
            workHours: '0h',
            otHours: 0,
            terminal: 'CSL HR Portal',
            status: leaveStatus as any,
            notes: leaveNote,
          });
        }
      });

      if (changed) {
        updated.sort((a, b) => b.dayNum - a.dayNum);
        try {
          localStorage.setItem(logsKey, JSON.stringify(updated));
          if (selectedLogMonth === getIstDate().getMonth()) {
            localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(updated));
          }
        } catch {}
        return updated;
      }
      return prev;
    });
  }, [attendanceLeaveRecords, isMl, selectedLogMonth]);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Duty Duration Timer State (Calculating hours, minutes, and seconds on duty until punch out)
  const [punchInTimestamp, setPunchInTimestamp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('csl_punch_in_ts');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return Date.now();
  });

  const [elapsedDutySeconds, setElapsedDutySeconds] = useState<number>(0);

  useEffect(() => {
    const updateElapsed = () => {
      if (punchState === 'in') {
        const diff = Math.max(0, Math.floor((Date.now() - punchInTimestamp) / 1000));
        setElapsedDutySeconds(diff);
      } else {
        setElapsedDutySeconds(0);
      }
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [punchState, punchInTimestamp]);

  // Synchronize biometric punch state and daily logs in real time across components and tabs
  useEffect(() => {
    const handleSync = () => {
      try {
        ensureMonthlyRolloverAndArchive();
        const today = getIstDate();
        const todayDay = today.getDate();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
        const hasPunchedToday = localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === todayKey;

        if (!hasPunchedToday) {
          setPunchState('out');
          setLastPunchTime('—');
          setElapsedDutySeconds(0);
          setCompletedDutySummary(null);
          localStorage.removeItem('csl_completed_duty_summary');
        } else {
          const st = localStorage.getItem('csl_punch_state');
          if (st === 'in' || st === 'out') setPunchState(st);
          const pt = localStorage.getItem('csl_last_punch_time');
          if (pt) setLastPunchTime(pt);
          const pts = localStorage.getItem('csl_punch_in_ts');
          if (pts) setPunchInTimestamp(parseInt(pts, 10));

          // Sync completed duty summary: ONLY show if punched out today and day has not passed
          const outTime = localStorage.getItem('csl_today_punch_out_time');
          const sumRaw = localStorage.getItem('csl_completed_duty_summary');
          if (st === 'out' && outTime && sumRaw) {
            const sum = JSON.parse(sumRaw);
            if (sum.dateKey && sum.dateKey !== todayKey) {
              setCompletedDutySummary(null);
              localStorage.removeItem('csl_completed_duty_summary');
            } else {
              setCompletedDutySummary(sum);
            }
          } else {
            setCompletedDutySummary(null);
          }
        }

        const logsKey = getAttendanceLogsKey(selectedLogYear, selectedLogMonth);
        const mShort = MONTH_SHORT_NAMES[selectedLogMonth] || 'Nov';

        // Always reload saved logs for selectedLogMonth and auto-reconcile with calendar present days
        const savedLogs = localStorage.getItem(logsKey) || (selectedLogMonth === 9 ? localStorage.getItem('csl_attendance_daily_logs_2026_9') : null);
        let currentLogs: DailyAttendanceRecord[] = savedLogs ? JSON.parse(savedLogs) : [];
        const { logs: reconciled, modified } = reconcileAttendanceDailyLogs(currentLogs, selectedLogMonth);
        currentLogs = reconciled;
        let storageUpdated = modified;

        // Auto-reconcile any days marked present on the calendar and align existing logs with Calendar shift
        let savedShifts: Record<number, CslShiftCode> = {};
        try {
          const rawS = localStorage.getItem(`csl_calendar_day_shifts_${selectedLogYear}_${selectedLogMonth}`);
          if (rawS) savedShifts = JSON.parse(rawS);
        } catch {}

        // Align existing logs with the Calendar's shift so if Calendar is B2, Attendance is also B2
        currentLogs = currentLogs.map((row) => {
          if (!row || typeof row.dayNum !== 'number') return row;
          const rowDate = new Date(selectedLogYear, selectedLogMonth, row.dayNum);
          const isSun = rowDate.getDay() === 0;
          if (isSun || row.status === 'Casual Leave' || row.status === 'Earned Leave' || row.status === 'CSL Holiday') {
            return row;
          }
          const calShift = getEffectiveShiftForDate(rowDate, savedShifts[row.dayNum]);
          if (row.shiftCode !== calShift && (row.shiftCode === 'A2' || row.shiftCode === 'B2' || !row.userEdited)) {
            storageUpdated = true;
            const newDef = CSL_SHIFTS[calShift] || CSL_SHIFTS['A2'];
            const oldDef = row.shiftCode ? CSL_SHIFTS[row.shiftCode as CslShiftCode] : null;
            return {
              ...row,
              shiftCode: calShift,
              shift: `${calShift} (${newDef.inTime.replace(' ', '')} - ${newDef.outTime.replace(' ', '')})`,
              inTime: !row.inTime || row.inTime === '—' || row.inTime === oldDef?.inTime ? newDef.inTime : row.inTime,
              outTime:
                row.outTime && row.outTime !== '—' && row.outTime !== 'On Duty' && row.outTime === oldDef?.outTime
                  ? newDef.outTime
                  : row.outTime,
            };
          }
          return row;
        });

        const savedPres = localStorage.getItem(`csl_calendar_present_days_${selectedLogYear}_${selectedLogMonth}`);
        if (savedPres) {
          try {
            const presentList: number[] = JSON.parse(savedPres);
            if (Array.isArray(presentList) && presentList.length > 0) {
              const existingDayNums = new Set(currentLogs.map(r => r.dayNum));
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

              presentList.forEach((d) => {
                if (!existingDayNums.has(d)) {
                  storageUpdated = true;
                  const isSun = isSundayDate(d, selectedLogMonth, selectedLogYear);
                  const hInfo = isCslHolidayDate(d, selectedLogMonth, selectedLogYear);
                  const isHol = isSun || hInfo.isHoliday;
                  const shiftCode: CslShiftCode = getEffectiveShiftForDate(new Date(selectedLogYear, selectedLogMonth, d), savedShifts[d]);
                  const sDef = CSL_SHIFTS[shiftCode] || CSL_SHIFTS['A2'];
                  const shiftDisplay = isSun 
                    ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` 
                    : (isHol ? `${shiftCode} · ഹോളിഡേ ഡ്യൂട്ടി` : `${shiftCode} (${sDef.inTime.replace(' ', '')} - ${sDef.outTime.replace(' ', '')})`);
                  const noteText = isHol 
                    ? (isSun ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)' : `${hInfo.holidayNameMl || 'ഹോളിഡേ'} ഡ്യൂട്ടി · മുഴുവൻ സമയവും സ്പെഷ്യൽ OT`)
                    : (isMl ? 'ഡ്യൂട്ടി ഹാജർ രേഖപ്പെടുത്തി' : 'Duty Attended & Verified');

                  currentLogs.push({
                    id: `d-${d}`,
                    dateStr: `${d} ${mShort} ${selectedLogYear}`,
                    dayName: dayNames[new Date(selectedLogYear, selectedLogMonth, d).getDay()],
                    dayNum: d,
                    shift: shiftDisplay,
                    shiftCode,
                    inTime: sDef.inTime,
                    outTime: sDef.outTime,
                    workHours: '8h 20m',
                    otHours: isHol ? 8 : 0,
                    terminal: 'Gate 4 Turnstile #02',
                    status: isHol ? 'Holiday Duty' : 'Present',
                    notes: noteText,
                  });
                }
              });
            }
          } catch {}
        }

        if (storageUpdated) {
          currentLogs.sort((a, b) => b.dayNum - a.dayNum);
          try {
            localStorage.setItem(logsKey, JSON.stringify(currentLogs));
            if (selectedLogMonth === today.getMonth()) {
              localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(currentLogs));
            }
          } catch {}
        }

        // Keep today's log intact if present or edited
        setDailyLogs(currentLogs);
        setActiveShift(getSyncedActiveShiftForToday(today));

        // Sync completedDutySummary with zero mismatch
        const savedSummary = localStorage.getItem('csl_completed_duty_summary');
        if (savedSummary) {
          try {
            const sum = JSON.parse(savedSummary);
            if (sum.dateKey && sum.dateKey !== todayKey) {
              setCompletedDutySummary(null);
            } else {
              setCompletedDutySummary(sum);
            }
          } catch {}
        } else {
          setCompletedDutySummary(null);
        }

        const pState = localStorage.getItem('csl_punch_state');
        if (pState === 'in' || pState === 'out') {
          setPunchState(pState);
        }
        const lastP = localStorage.getItem('csl_last_punch_time');
        if (lastP) {
          setLastPunchTime(lastP);
        }
      } catch {}
    };
    handleSync();
    window.addEventListener('storage', handleSync);
    window.addEventListener('csl-attendance-updated', handleSync);
    window.addEventListener('csl-shift-changed', handleSync);
    window.addEventListener('csl-shift-rotation-changed', handleSync);
    window.addEventListener('csl-calendar-shifts-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('csl-attendance-updated', handleSync);
      window.removeEventListener('csl-shift-changed', handleSync);
      window.removeEventListener('csl-shift-rotation-changed', handleSync);
      window.removeEventListener('csl-calendar-shifts-updated', handleSync);
    };
  }, [isMl, selectedLogMonth]);

  // Punch Out & Overtime Calculation Modal State
  const [isPunchOutModalOpen, setIsPunchOutModalOpen] = useState(false);
  const [selectedPunchOutTime, setSelectedPunchOutTime] = useState<string>('');
  const [selectedOtHours, setSelectedOtHours] = useState<number>(0);

  // Completed Duty Summary state (shows duty duration, regular hours, and overtime hours worked upon punch-out)
  // Automatically disabled if duty hasn't started today or when that day has passed!
  const [completedDutySummary, setCompletedDutySummary] = useState<{
    dateKey?: string;
    shift: CslShiftCode;
    inTime: string;
    outTime: string;
    totalHours: string;
    regularHours: string;
    otHours: number;
    recordedAt: string;
  } | null>(() => {
    try {
      const today = getIstDate();
      const todayDay = today.getDate();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
      const hasPunchedToday = localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === todayKey;
      const punchState = localStorage.getItem('csl_punch_state');
      const punchOutTime = localStorage.getItem('csl_today_punch_out_time');

      // If duty has not been started/completed today, or day has passed, do NOT show the summary!
      if (!hasPunchedToday || punchState !== 'out' || !punchOutTime) {
        localStorage.removeItem('csl_completed_duty_summary');
        return null;
      }

      const saved = localStorage.getItem('csl_completed_duty_summary');
      if (saved) {
        const sum = JSON.parse(saved);
        // Automatically disable once that day has passed!
        if (sum.dateKey && sum.dateKey !== todayKey) {
          localStorage.removeItem('csl_completed_duty_summary');
          return null;
        }
        return sum;
      }
    } catch {}
    return null;
  });

  const handleShiftSelect = (s: CslShiftCode) => {
    setActiveShift(s);
    syncShiftFromCalendarEverywhere(s, getIstDate(), true);
    const def = CSL_SHIFTS[s];
    showToast(isMl ? `ഷിഫ്റ്റ് തിരഞ്ഞെടുത്തു: ${def.nameMl} (${def.inTime} – ${def.outTime}) · കലണ്ടർ, ഡ്യൂട്ടി ഷിഫ്റ്റ്, ഹാജർ എല്ലാം ഒന്നാക്കി!` : `Selected: ${def.name} (${def.inTime} - ${def.outTime}) · Synced across Calendar, Duty Shift & Attendance!`);
  };

  const handlePunchIn = (shiftCode?: CslShiftCode, customInTime?: string) => {
    const inT = customInTime || formatCslTime();
    const today = getIstDate();
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const todayDay = today.getDate();
    const todayKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    const isSun = today.getDay() === 0;
    const holInfo = isCslHolidayDate(today, curMonth, curYear);
    const isHolDuty = isSun || holInfo.isHoliday;

    // Rule 1: Every Sunday, if there is work, the shift is C1 (08:00 AM - 04:20 PM)
    const s = isSun ? 'C1' : (shiftCode || activeShift);
    const def = CSL_SHIFTS[s];
    const nowTs = Date.now();

    setPunchState('in');
    setLastPunchTime(inT);
    setActiveShift(s);
    setPunchInTimestamp(nowTs);
    setCompletedDutySummary(null);
    setSelectedLogMonth(curMonth);
    try {
      localStorage.setItem('csl_punch_state', 'in');
      localStorage.setItem('csl_today_punched_date', todayKey);
      localStorage.setItem('csl_actual_punched_today', 'true');
      localStorage.setItem('csl_today_punch_in_time', inT);
      localStorage.removeItem('csl_today_punch_out_time');
      localStorage.setItem('csl_last_punch_time', inT);
      localStorage.setItem('csl_active_shift', s);
      localStorage.setItem('csl_punch_in_ts', nowTs.toString());
      localStorage.removeItem('csl_completed_duty_summary');

      const presKey = `csl_calendar_present_days_${curYear}_${curMonth}`;
      const saved = localStorage.getItem(presKey);
      let presentList: number[] = saved ? JSON.parse(saved) : [];
      if (!presentList.includes(todayDay)) presentList.push(todayDay);
      presentList.sort((a, b) => a - b);
      localStorage.setItem(presKey, JSON.stringify(presentList));
      window.dispatchEvent(new CustomEvent('csl-attendance-updated', { detail: { day: todayDay, present: true, punchState: 'in', punchInTime: inT } }));
      window.dispatchEvent(new CustomEvent('csl-shift-changed', { detail: s }));
    } catch {}

    const mShort = MONTH_SHORT_NAMES[curMonth] || 'Nov';
    const todayDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(curYear, curMonth, todayDay).getDay()];
    const inRecord: DailyAttendanceRecord = {
      id: `d-${todayDay}`,
      dateStr: `${todayDay} ${mShort} ${curYear}`,
      dayName: todayDayName,
      dayNum: todayDay,
      shift: isSun ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` : `${s} (${def.inTime.replace(' ', '')} - ${def.outTime.replace(' ', '')})`,
      shiftCode: s,
      inTime: inT,
      outTime: 'On Duty',
      workHours: 'Live',
      otHours: 0.0,
      terminal: 'Gate 4 Turnstile #02',
      status: isHolDuty ? 'Holiday Duty' : 'On Duty',
      notes: isSun 
        ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)' 
        : (holInfo.isHoliday ? `${holInfo.holidayNameMl} ഹോളിഡേ ഡ്യൂട്ടി (Holiday Duty · സ്പെഷ്യൽ OT)` : undefined)
    };

    const logsKey = getAttendanceLogsKey(curYear, curMonth);
    setDailyLogs(prev => {
      const exists = prev.some(r => r.dayNum === todayDay);
      const nextLogs = exists 
        ? prev.map(row => row.dayNum === todayDay ? inRecord : row)
        : [inRecord, ...prev].sort((a, b) => b.dayNum - a.dayNum);
      try {
        localStorage.setItem(logsKey, JSON.stringify(nextLogs));
        localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(nextLogs));
      } catch {}
      return nextLogs;
    });
    showToast(isMl ? `ഡ്യൂട്ടി ഇൻ രേഖപ്പെടുത്തി: ${inT} (${isSun ? 'ഞായറാഴ്ച C1 ഷിഫ്റ്റ്' : def.nameMl})` : `Duty In Recorded: ${inT} (${isSun ? 'Sunday C1 Shift' : def.name})`);
  };

  // Instant direct punch out without asking questions:
  // Rule 2: On Sunday or CSL Holiday, all worked hours count as Overtime (Holiday OT)!
  const handleDirectPunchOut = (customTime?: string) => {
    const outT = customTime || formatCslTime();
    const today = getIstDate();
    const isSun = today.getDay() === 0;
    const holInfo = isCslHolidayDate(today, today.getMonth(), today.getFullYear());
    const isHolDuty = isSun || holInfo.isHoliday;
    const rawInT = localStorage.getItem('csl_today_punch_in_time') || (lastPunchTime && lastPunchTime !== '—' && lastPunchTime !== 'On Duty' ? lastPunchTime : (isSun ? CSL_SHIFTS['C1'].inTime : CSL_SHIFTS[activeShift].inTime));
    const s = isSun ? 'C1' : activeShift;
    const inT = rawInT;
    
    // Automatically calculate duty and overtime
    const calc = calculateDutyAndOT(inT, outT, s, true, today);
    const autoOt = calc.otHours;

    handleConfirmPunchOut(outT, autoOt, s);

    if (autoOt > 0) {
      showToast(
        isMl
          ? `പഞ്ച് ഔട്ട് രേഖപ്പെടുത്തി (${outT}). ${isHolDuty ? 'ഹോളിഡേ/ഞായറാഴ്ച ഡ്യൂട്ടി: മുഴുവൻ സമയവും' : 'റെഗുലർ സമയം കഴിഞ്ഞ്'} ${autoOt} മണിക്കൂർ ഓവർടൈം (OT) രേഖപ്പെടുത്തി!`
          : `Punch Out Recorded (${outT}). ${isHolDuty ? 'Holiday/Sunday duty: full' : 'Auto-calculated'} ${autoOt} hrs Overtime credited!`
      );
    } else {
      showToast(
        isMl
          ? `പഞ്ച് ഔട്ട് രേഖപ്പെടുത്തി (${outT}). ${calc.graceNote || 'റെഗുലർ ഡ്യൂട്ടി പൂർത്തിയായി.'}`
          : `Punch Out Recorded (${outT}). ${calc.graceNote || 'Regular duty completed.'}`
      );
    }
  };

  const handleOpenPunchOutModal = () => {
    const nowTimeStr = formatCslTime();
    const today = getIstDate();
    const isSun = today.getDay() === 0;
    const rawInT = localStorage.getItem('csl_today_punch_in_time') || (lastPunchTime && lastPunchTime !== '—' && lastPunchTime !== 'On Duty' ? lastPunchTime : (isSun ? CSL_SHIFTS['C1'].inTime : CSL_SHIFTS[activeShift].inTime));
    const s = isSun ? 'C1' : activeShift;
    setSelectedPunchOutTime(nowTimeStr);
    
    // Auto-calculate OT
    const calc = calculateDutyAndOT(rawInT, nowTimeStr, s, true, today);
    setSelectedOtHours(calc.otHours);
    setIsPunchOutModalOpen(true);
  };

  const handleConfirmPunchOut = (customOutTime?: string, customOtHours?: number, explicitShift?: CslShiftCode) => {
    const today = getIstDate();
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const todayDay = today.getDate();
    const todayKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    const isSun = today.getDay() === 0;
    const holInfo = isCslHolidayDate(today, curMonth, curYear);
    const isHolDuty = isSun || holInfo.isHoliday;

    const rawInT = localStorage.getItem('csl_today_punch_in_time') || (lastPunchTime && lastPunchTime !== '—' && lastPunchTime !== 'On Duty' ? lastPunchTime : (isSun ? CSL_SHIFTS['C1'].inTime : CSL_SHIFTS[activeShift].inTime));
    const outT = customOutTime || selectedPunchOutTime || formatCslTime();
    const s = isSun ? 'C1' : (explicitShift || activeShift);
    const def = CSL_SHIFTS[s];
    const inT = rawInT;

    const calc = calculateDutyAndOT(inT, outT, s, true, today);
    const finalOt = Math.floor(customOtHours !== undefined ? customOtHours : (selectedOtHours > 0 ? selectedOtHours : calc.otHours));
    const totalHours = calc.workHours;

    setActiveShift(s);
    setPunchState('out');
    setLastPunchTime(outT);
    setSelectedLogMonth(curMonth);
    try {
      localStorage.setItem('csl_active_shift', s);
      localStorage.setItem('csl_punch_state', 'out');
      localStorage.setItem('csl_last_punch_time', outT);
      localStorage.setItem('csl_today_punch_out_time', outT);
      localStorage.setItem('csl_today_punched_date', todayKey);
      localStorage.setItem('csl_actual_punched_today', 'true');
    } catch {}

    const summaryData = {
      dateKey: todayKey,
      shift: s,
      inTime: inT,
      outTime: outT,
      totalHours,
      regularHours: def.duration,
      otHours: finalOt,
      graceApplied: calc.graceApplied,
      recordedAt: outT,
    };
    setCompletedDutySummary(summaryData);
    try {
      localStorage.setItem('csl_completed_duty_summary', JSON.stringify(summaryData));
    } catch {}

    const noteText = isHolDuty
      ? (isSun ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)' : `${holInfo.holidayNameMl || 'ഹോളിഡേ'} ഡ്യൂട്ടി · മുഴുവൻ സമയവും സ്പെഷ്യൽ OT`)
      : (finalOt > 0 
          ? `${finalOt} hrs Overtime (OT)` 
          : (calc.graceNote ? calc.graceNote : (isMl ? 'ഡ്യൂട്ടി പൂർത്തിയായി' : 'Duty Completed')));

    const mShort = MONTH_SHORT_NAMES[curMonth] || 'Nov';
    const outDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(curYear, curMonth, todayDay).getDay()];
    const updatedRecord: DailyAttendanceRecord = {
      id: `d-${todayDay}`,
      dateStr: `${todayDay} ${mShort} ${curYear}`,
      dayName: outDayName,
      dayNum: todayDay,
      shift: isSun ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` : `${s} (${def.inTime.replace(' ', '')} - ${def.outTime.replace(' ', '')})`,
      shiftCode: s,
      inTime: inT,
      outTime: outT,
      workHours: totalHours,
      otHours: finalOt,
      terminal: 'Gate 4 Turnstile #02',
      status: isHolDuty ? 'Holiday Duty' : 'Present',
      notes: noteText
    };

    const logsKey = getAttendanceLogsKey(curYear, curMonth);
    setDailyLogs(prev => {
      const exists = prev.some(r => r.dayNum === todayDay);
      const nextLogs = exists 
        ? prev.map(row => row.dayNum === todayDay ? updatedRecord : row) 
        : [updatedRecord, ...prev].sort((a, b) => b.dayNum - a.dayNum);
      try {
        localStorage.setItem(logsKey, JSON.stringify(nextLogs));
        localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(nextLogs));
      } catch {}
      return nextLogs;
    });

    window.dispatchEvent(new CustomEvent('csl-attendance-updated', { 
      detail: { day: todayDay, present: true, punchOutTime: outT, punchInTime: inT, punchState: 'out' } 
    }));

    setIsPunchOutModalOpen(false);
    showToast(
      isMl 
        ? `പഞ്ച്-ഔട്ട് രേഖപ്പെടുത്തി: ${outT} · ആകെ ഡ്യൂട്ടി: ${totalHours} ${isHolDuty ? '(ഹോളിഡേ OT അനുവദിച്ചു)' : (calc.graceApplied ? '(5 മിനിറ്റ് ഗ്രേസ് ടൈം ഉൾപ്പെടുത്തി)' : '')}` 
        : `Checked Out: ${outT} · Total: ${totalHours} ${isHolDuty ? '(Holiday OT Credited)' : (calc.graceApplied ? '(5m Grace Applied)' : '')}`
    );
  };

  const handlePunchToggle = () => {
    if (punchState === 'in') {
      handleDirectPunchOut();
    } else {
      handlePunchIn(activeShift);
    }
  };

  // Monthly Attendance Log (Defaults to current IST month e.g. November 2026, while keeping October 2026 archived)
  const [dailyLogs, setDailyLogs] = useState<DailyAttendanceRecord[]>(() => {
    ensureMonthlyRolloverAndArchive();
    const today = getIstDate();
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    const todayDay = today.getDate();
    const todayKey = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    const hasPunchedToday = localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === todayKey;

    try {
      const logsKey = getAttendanceLogsKey(curYear, curMonth);
      const mShort = MONTH_SHORT_NAMES[curMonth] || 'Nov';
      const saved = localStorage.getItem(logsKey);
      let logs: DailyAttendanceRecord[] = saved ? JSON.parse(saved) : [];
      const { logs: reconciled, modified } = reconcileAttendanceDailyLogs(logs, curMonth);
      logs = reconciled;
      let storageUpdated = modified;

      // Reconcile with calendar present days so any day marked Present on calendar is visible and editable
      const savedPres = localStorage.getItem(`csl_calendar_present_days_${curYear}_${curMonth}`);
      if (savedPres) {
        try {
          const presentList: number[] = JSON.parse(savedPres);
          if (Array.isArray(presentList) && presentList.length > 0) {
            const existingDayNums = new Set(logs.map(r => r.dayNum));
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            let savedShifts: Record<number, CslShiftCode> = {};
            try {
              const rawS = localStorage.getItem(`csl_calendar_day_shifts_${curYear}_${curMonth}`);
              if (rawS) savedShifts = JSON.parse(rawS);
            } catch {}

            presentList.forEach((d) => {
              if (!existingDayNums.has(d)) {
                storageUpdated = true;
                const isSun = isSundayDate(d, curMonth, curYear);
                const hInfo = isCslHolidayDate(d, curMonth, curYear);
                const isHol = isSun || hInfo.isHoliday;
                const shiftCode: CslShiftCode = getEffectiveShiftForDate(new Date(curYear, curMonth, d), savedShifts[d]);
                const sDef = CSL_SHIFTS[shiftCode] || CSL_SHIFTS['A2'];
                const shiftDisplay = isSun 
                  ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` 
                  : (isHol ? `${shiftCode} · HoliDay Duty` : `${shiftCode} (${sDef.inTime.replace(' ', '')} - ${sDef.outTime.replace(' ', '')})`);
                const noteText = isHol 
                  ? (isSun ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)' : `${hInfo.holidayNameMl || 'ഹോളിഡേ'} ഡ്യൂട്ടി · മുഴുവൻ സമയവും സ്പെഷ്യൽ OT`)
                  : 'ഡ്യൂട്ടി ഹാജർ രേഖപ്പെടുത്തി (Duty Attended)';

                logs.push({
                  id: `d-${d}`,
                  dateStr: `${d} ${mShort} ${curYear}`,
                  dayName: dayNames[new Date(curYear, curMonth, d).getDay()],
                  dayNum: d,
                  shift: shiftDisplay,
                  shiftCode,
                  inTime: sDef.inTime,
                  outTime: sDef.outTime,
                  workHours: '8h 20m',
                  otHours: isHol ? 8 : 0,
                  terminal: 'Gate 4 Turnstile #02',
                  status: isHol ? 'Holiday Duty' : 'Present',
                  notes: noteText,
                });
              }
            });
          }
        } catch {}
      }

      if (storageUpdated) {
        logs.sort((a, b) => b.dayNum - a.dayNum);
        try {
          localStorage.setItem(logsKey, JSON.stringify(logs));
          localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(logs));
        } catch {}
      }

      if (!hasPunchedToday) {
        logs = logs.filter(r => r.dayNum !== todayDay || r.userEdited || (Number(r.otHours) || 0) > 0 || r.status === 'Present' || r.status === 'Holiday Duty');
      }
      return logs;
    } catch {}
    return [];
  });

  const [isOtSheetModalOpen, setIsOtSheetModalOpen] = useState(false);

  const filteredLogs = dailyLogs.filter((log) => {
    if (activeFilter === 'PRESENT') return log.status === 'Present' || log.status === 'On Duty';
    if (activeFilter === 'OT') return log.otHours > 0;
    if (activeFilter === 'LEAVE') return log.status === 'Casual Leave' || log.status === 'Earned Leave';
    if (activeFilter === 'HOLIDAY') return log.status === 'CSL Holiday' || log.status === 'Weekly Off';
    return true;
  });


  // Handler to open DutyPunchModal from a table row or card
  const handleOpenDutyPunch = (dateStr: string, shiftCode?: string, inT?: string, outT?: string, otH?: number, leaveVal?: string, initialNotes?: string) => {
    setActivePunchDate(dateStr);
    const validShift: CslShiftCode = (CSL_SHIFT_CODES as string[]).includes(shiftCode as any) ? (shiftCode as CslShiftCode) : activeShift;
    setActivePunchShift(validShift);
    setActivePunchIn(inT && inT !== '—' ? inT : CSL_SHIFTS[validShift].inTime);
    setActivePunchOut(outT && outT !== '—' && outT !== 'On Duty' ? outT : CSL_SHIFTS[validShift].outTime);
    setActivePunchOt(otH && otH > 0 ? `0${otH}:00`.slice(-5) : '');
    setActivePunchLeave(leaveVal?.includes('Casual') ? 'Casual Leave (CL)' : leaveVal?.includes('Earned') ? 'Earned Leave (EL)' : 'None');
    setActivePunchHalfDay('No');
    setActivePunchNotes(initialNotes || '');
    setIsDutyPunchModalOpen(true);
  };

  const handleSaveDutyPunch = (data: DutyPunchData) => {
    const isLeave = data.leave !== 'None';
    let dayNumber = getIstDate().getDate();
    let targetMonth = selectedLogMonth;
    const isoMatch = data.dateStr ? data.dateStr.match(/\d{4}-(\d{1,2})-(\d{1,2})/) : null;
    const startMatch = data.dateStr ? data.dateStr.match(/^(\d{1,2})/) : null;
    if (isoMatch) {
      targetMonth = parseInt(isoMatch[1], 10) - 1;
      dayNumber = parseInt(isoMatch[2], 10);
    } else if (startMatch) {
      dayNumber = parseInt(startMatch[1], 10);
    }

    const isSun = isSundayDate(data.dateStr, targetMonth, selectedLogYear) || isSundayDate(dayNumber, targetMonth, selectedLogYear);
    const hInfo = isCslHolidayDate(data.dateStr, targetMonth, selectedLogYear) || isCslHolidayDate(dayNumber, targetMonth, selectedLogYear);
    const isHolidayDay = isSun || hInfo.isHoliday;

    // Rule 1: Every Sunday work MUST be Shift C1!
    const finalShift: CslShiftCode = isSun ? 'C1' : data.shift;
    const finalShiftDef = CSL_SHIFTS[finalShift] || CSL_SHIFTS['C1'];

    const newStatus: DailyAttendanceRecord['status'] = isLeave 
      ? (data.leave.includes('Casual') ? 'Casual Leave' : 'Earned Leave') 
      : (isHolidayDay && data.inTime && data.inTime !== '—' ? 'Holiday Duty' : 'Present');

    let otNum = 0;
    if (!isLeave && data.ot) {
      const parts = data.ot.split(':');
      if (parts.length === 2) {
        otNum = parseInt(parts[0], 10) || 0;
      } else {
        otNum = Math.floor(parseFloat(data.ot) || 0);
      }
    }

    if (isHolidayDay && !isLeave && data.inTime && data.inTime !== '—') {
      if (otNum <= 0) {
        const calc = calculateDutyAndOT(data.inTime, data.outTime, finalShift, true, data.dateStr);
        otNum = calc.otHours > 0 ? Math.floor(calc.otHours) : 8;
      }
    }

    const defaultHolidayDutyNote = isSun
      ? 'ഞായറാഴ്ച ഡ്യൂട്ടി: C1 ഷിഫ്റ്റ് (08:00 - 16:20) · മുഴുവൻ സമയവും ഹോളിഡേ OT (Sunday C1 Duty OT)'
      : `${hInfo.holidayNameMl || 'ഹോളിഡേ'} ഡ്യൂട്ടി (Holiday Duty · മുഴുവൻ സമയവും സ്പെഷ്യൽ OT അർഹതയുണ്ട്)`;

    const noteText = data.notes 
      ? data.notes 
      : (isHolidayDay && !isLeave && data.inTime && data.inTime !== '—'
          ? defaultHolidayDutyNote
          : (otNum > 0 ? `${otNum} hrs Overtime (OT)` : (data.graceApplied ? (isMl ? '5m ഗ്രേസ് ടൈം' : '5m Grace Applied') : (isMl ? 'ഡ്യൂട്ടി സേവ് ചെയ്തു' : 'Duty Punch Saved'))));

    // Also sync to dayNotes if custom note was provided
    if (data.notes) {
      const noteKey = `${selectedLogYear}-${targetMonth}-${dayNumber}`;
      const nextNotes = { ...dayNotes, [noteKey]: data.notes };
      setDayNotes(nextNotes);
      try {
        localStorage.setItem('csl_calendar_day_notes_2026', JSON.stringify(nextNotes));
      } catch {}
    }

    const calc = (!isLeave && data.inTime && data.inTime !== '—' && data.outTime && data.outTime !== '—' && data.outTime !== 'On Duty')
      ? calculateDutyAndOT(data.inTime, data.outTime, finalShift, true, data.dateStr)
      : null;

    const workHoursDisplay = isLeave 
      ? '0h' 
      : (calc ? calc.workHours : (data.outTime && data.outTime !== '—' && data.outTime !== 'On Duty' ? '8h 20m' : 'On Duty'));

    const mShort = MONTH_SHORT_NAMES[targetMonth] || 'Nov';
    const logsKey = getAttendanceLogsKey(selectedLogYear, targetMonth);

    const exists = dailyLogs.some(row => row.dateStr === data.dateStr || row.dayNum === dayNumber);
    let updated: DailyAttendanceRecord[];

    const shiftDisplay = isSun 
      ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1` 
      : (isHolidayDay ? `${finalShift} · ഹോളിഡേ ഡ്യൂട്ടി` : `${finalShift} (${finalShiftDef.inTime.replace(' ', '')} - ${finalShiftDef.outTime.replace(' ', '')})`);

    if (exists) {
      updated = dailyLogs.map(row => {
        if (row.dateStr === data.dateStr || row.dayNum === dayNumber) {
          return {
            ...row,
            shift: shiftDisplay,
            shiftCode: finalShift,
            inTime: isLeave ? '—' : data.inTime,
            outTime: isLeave ? '—' : data.outTime,
            workHours: workHoursDisplay,
            otHours: otNum,
            status: newStatus,
            notes: noteText,
            userEdited: true,
          };
        }
        return row;
      });
    } else {
      const entryDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(selectedLogYear, targetMonth, dayNumber).getDay()];
      const newEntry: DailyAttendanceRecord = {
        id: `d-${dayNumber}`,
        dateStr: `${dayNumber} ${mShort} ${selectedLogYear}`,
        dayName: entryDayName,
        dayNum: dayNumber,
        shift: shiftDisplay,
        shiftCode: finalShift,
        inTime: isLeave ? '—' : data.inTime,
        outTime: isLeave ? '—' : data.outTime,
        workHours: workHoursDisplay,
        otHours: otNum,
        terminal: 'Gate 4 Turnstile #02',
        status: newStatus,
        notes: noteText,
        userEdited: true,
      };
      updated = [newEntry, ...dailyLogs].sort((a, b) => b.dayNum - a.dayNum);
    }

    setDailyLogs(updated);
    try {
      localStorage.setItem(logsKey, JSON.stringify(updated));
      if (targetMonth === getIstDate().getMonth()) {
        localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(updated));
      }
    } catch {}
    
    // Sync to Calendar present days and day shifts
    const today = getIstDate();
    const todayDay = today.getDate();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
    
    try {
      const presKey = `csl_calendar_present_days_${selectedLogYear}_${targetMonth}`;
      const saved = localStorage.getItem(presKey);
      let presentList: number[] = saved ? JSON.parse(saved) : [];
      if (!isLeave) {
        if (!presentList.includes(dayNumber) && !(targetMonth === 9 && (dayNumber === 21 || dayNumber === 2))) {
          presentList.push(dayNumber);
        }
      } else {
        presentList = presentList.filter(d => d !== dayNumber);
      }
      presentList.sort((a, b) => a - b);
      localStorage.setItem(presKey, JSON.stringify(presentList));

      // Sync shift for this day
      const shiftsKey = `csl_calendar_day_shifts_${selectedLogYear}_${targetMonth}`;
      const savedShifts = localStorage.getItem(shiftsKey);
      const parsedShifts = savedShifts ? JSON.parse(savedShifts) : {};
      parsedShifts[dayNumber] = finalShift;
      localStorage.setItem(shiftsKey, JSON.stringify(parsedShifts));

      // If today, also update live punch tracker states AND completedDutySummary
      if (targetMonth === today.getMonth() && (data.dateStr === todayKey || dayNumber === todayDay)) {
        setActiveShift(data.shift);
        const isPunchedOut = Boolean(data.outTime && data.outTime !== '—' && data.outTime !== 'On Duty');
        setLastPunchTime(isPunchedOut ? data.outTime : data.inTime);
        setPunchState(isPunchedOut ? 'out' : 'in');
        localStorage.setItem('csl_today_punched_date', todayKey);
        localStorage.setItem('csl_actual_punched_today', !isLeave ? 'true' : 'false');
        localStorage.setItem('csl_today_punch_in_time', data.inTime);
        localStorage.setItem('csl_today_punch_out_time', data.outTime);
        localStorage.setItem('csl_punch_state', isPunchedOut ? 'out' : 'in');
        localStorage.setItem('csl_last_punch_time', isPunchedOut ? data.outTime : data.inTime);

        if (isPunchedOut && !isLeave) {
          const summaryData = {
            dateKey: todayKey,
            shift: finalShift,
            inTime: data.inTime,
            outTime: data.outTime,
            totalHours: workHoursDisplay,
            regularHours: finalShiftDef.duration,
            otHours: otNum,
            graceApplied: calc?.graceApplied || false,
            inGraceApplied: calc?.inGraceApplied || false,
            outGraceApplied: calc?.outGraceApplied || false,
            graceNote: calc?.graceNote,
            recordedAt: data.outTime,
          };
          setCompletedDutySummary(summaryData);
          localStorage.setItem('csl_completed_duty_summary', JSON.stringify(summaryData));
        } else {
          setCompletedDutySummary(null);
          localStorage.removeItem('csl_completed_duty_summary');
        }
      }

      // Notify Calendar, QuickAccess, and other views
      window.dispatchEvent(new CustomEvent('csl-attendance-updated', { 
        detail: { 
          day: dayNumber, 
          present: !isLeave, 
          punchInTime: data.inTime, 
          punchOutTime: data.outTime,
          shift: finalShift,
          otHours: otNum,
          totalHours: workHoursDisplay
        } 
      }));
    } catch {}

    showToast(isMl ? `ഡ്യൂട്ടി പഞ്ച് സേവ് ചെയ്തു: ${dayNumber} ${mShort} ${selectedLogYear} (${CSL_SHIFTS[data.shift]?.nameMl || data.shift})` : `Duty Punch Saved: ${dayNumber} ${mShort} ${selectedLogYear} (${CSL_SHIFTS[data.shift]?.name || data.shift})`);
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
      setPunchInTimestamp(Date.now());
      try {
        localStorage.setItem('csl_punch_in_ts', Date.now().toString());
      } catch {}
    }
    const today = getIstDate();
    let targetMonth = today.getMonth();
    let targetYear = today.getFullYear();
    let targetDay = today.getDate();

    if (params.dateStr) {
      const isoMatch = params.dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      const leadMatch = params.dateStr.match(/^(\d{1,2})/);
      if (isoMatch) {
        targetYear = parseInt(isoMatch[1], 10);
        targetMonth = parseInt(isoMatch[2], 10) - 1;
        targetDay = parseInt(isoMatch[3], 10);
      } else if (leadMatch) {
        targetDay = parseInt(leadMatch[1], 10);
        targetMonth = selectedLogMonth;
        targetYear = selectedLogYear;
      }
    }

    const todayKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
    const mShort = MONTH_SHORT_NAMES[targetMonth] || 'Nov';
    const logsKey = getAttendanceLogsKey(targetYear, targetMonth);
    const chosenShift: CslShiftCode = (params.shiftCode && params.shiftCode in CSL_SHIFTS) ? (params.shiftCode as CslShiftCode) : activeShift;
    const shiftDef = CSL_SHIFTS[chosenShift] || CSL_SHIFTS['A2'];

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

      const entryDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(targetYear, targetMonth, targetDay).getDay()];
      const sessionLabel = params.session || 'First Half';
      const noteText = isFullDayOt
        ? `${otVal} hrs Overtime (OT) · ${chosenShift} Shift (${punchT})`
        : isFullDay
        ? `ഫുൾ ഡേ ${isPunchIn ? 'ഇൻ' : 'ഔട്ട്'} പഞ്ച് · ${punchT}`
        : `ഹാഫ് ഡേ ${isPunchIn ? 'ഇൻ' : 'ഔട്ട്'} പഞ്ച് (${sessionLabel}) · ${punchT}`;

      const existingIndex = dailyLogs.findIndex(r => r.dayNum === targetDay);
      let updated: DailyAttendanceRecord[];
      if (existingIndex >= 0) {
        updated = dailyLogs.map(r => r.dayNum === targetDay ? {
          ...r,
          shift: `${chosenShift} (${shiftDef.inTime.replace(' ', '')} - ${shiftDef.outTime.replace(' ', '')})`,
          shiftCode: chosenShift,
          inTime: isPunchIn ? punchT : (r.inTime && r.inTime !== '—' ? r.inTime : shiftDef.inTime),
          outTime: !isPunchIn ? punchT : (r.outTime || '—'),
          workHours: isFullDayOt ? `${8 + otVal}h 20m` : isFullDay ? '8h 20m' : '4h 10m',
          otHours: isFullDayOt ? otVal : (r.otHours || 0),
          notes: noteText,
          status: isFullDay ? 'Present' : 'Casual Leave',
          userEdited: true,
        } : r);
      } else {
        const newEntry: DailyAttendanceRecord = {
          id: `d-${targetDay}`,
          dateStr: `${targetDay} ${mShort} ${targetYear}`,
          dayName: entryDayName,
          dayNum: targetDay,
          shift: `${chosenShift} (${shiftDef.inTime.replace(' ', '')} - ${shiftDef.outTime.replace(' ', '')})`,
          shiftCode: chosenShift,
          inTime: isPunchIn ? punchT : shiftDef.inTime,
          outTime: !isPunchIn ? punchT : '—',
          workHours: isFullDayOt ? `${8 + otVal}h 20m` : isFullDay ? '8h 20m' : '4h 10m',
          otHours: otVal,
          terminal: 'Gate 4 Turnstile #02',
          status: isFullDay ? 'Present' : 'Casual Leave',
          notes: noteText,
          userEdited: true,
        };
        updated = [newEntry, ...dailyLogs].sort((a, b) => b.dayNum - a.dayNum);
      }
      setDailyLogs(updated);
      localStorage.setItem(logsKey, JSON.stringify(updated));
      localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(updated));

      if (isFullDayOt) {
        const summaryData = {
          dateKey: todayKey,
          shift: chosenShift,
          inTime: shiftDef.inTime,
          outTime: punchT,
          totalHours: `${8 + otVal}h 20m`,
          regularHours: shiftDef.duration,
          otHours: otVal,
          graceApplied: false,
          recordedAt: punchT,
        };
        setCompletedDutySummary(summaryData);
        localStorage.setItem('csl_completed_duty_summary', JSON.stringify(summaryData));
      }

      const presKey = `csl_calendar_present_days_${targetYear}_${targetMonth}`;
      const savedPres = localStorage.getItem(presKey);
      let presentList: number[] = savedPres ? JSON.parse(savedPres) : [];
      if (!presentList.includes(targetDay)) presentList.push(targetDay);
      presentList.sort((a, b) => a - b);
      localStorage.setItem(presKey, JSON.stringify(presentList));

      window.dispatchEvent(new CustomEvent('csl-attendance-updated', {
        detail: { day: targetDay, present: true, otHours: otVal, shift: chosenShift }
      }));
    } catch {}

    setToastMessage(
      isFullDayOt
        ? (isMl ? `ഫുൾ ഡേ + ${otVal}h OT (${punchT}) സേവ് ചെയ്തു! വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം` : `Full Day + ${otVal}h OT (${punchT}) saved!`)
        : isPunchIn 
        ? (isMl ? `ഹാഫ് ഡേ ഇൻ (${punchT}) പഞ്ച് ചെയ്തു! വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം` : `Half Day IN (${punchT}) logged! Shareable to WhatsApp`)
        : (isMl ? `ഹാഫ് ഡേ ഔട്ട് (${punchT}) പഞ്ച് ചെയ്തു! വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം` : `Half Day OUT (${punchT}) logged! Shareable to WhatsApp`)
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sequential CL Phase 1 -> Phase 2 deduction helper:
  // For Contract Employees: Single pool of CL, Phase 2 is 0.
  // For Permanent Employees: Phase 1 decreases first from clPhase1Total down to 0, then Phase 2 decreases.
  const updateClPhases = (balances: any) => {
    if (isContract) {
      const tot = balances.clTotal !== undefined ? balances.clTotal : (balances.clPhase1Total !== undefined ? balances.clPhase1Total : 12);
      const cur = balances.cl !== undefined ? balances.cl : tot;
      return {
        ...balances,
        clTotal: tot,
        clPhase1Total: tot,
        clPhase2Total: 0,
        cl: cur,
        clPhase1: cur,
        clPhase2: 0,
      };
    }

    const p1Total = balances.clPhase1Total !== undefined ? balances.clPhase1Total : (balances.clPhase1 !== undefined ? balances.clPhase1 : 6);
    const p2Total = balances.clPhase2Total !== undefined ? balances.clPhase2Total : (balances.clPhase2 !== undefined ? balances.clPhase2 : 6);
    const clTotal = balances.clTotal ?? (p1Total + p2Total);
    const clCurrent = balances.cl !== undefined ? balances.cl : clTotal;
    const clTaken = Math.max(0, Math.round((clTotal - clCurrent) * 10) / 10);
    const p1Remaining = Math.max(0, Math.round((p1Total - clTaken) * 10) / 10);
    const p2Taken = Math.max(0, Math.round((clTaken - p1Total) * 10) / 10);
    const p2Remaining = Math.max(0, Math.round((p2Total - p2Taken) * 10) / 10);
    return {
      ...balances,
      clTotal,
      clPhase1Total: p1Total,
      clPhase2Total: p2Total,
      cl: Math.round((p1Remaining + p2Remaining) * 10) / 10,
      clPhase1: p1Remaining,
      clPhase2: p2Remaining,
    };
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const daysNum = parseFloat(leaveDays) || 1;
    let nextBalances = { ...leaveBalances };

    if (leaveType === 'CL') {
      const p1Total = nextBalances.clPhase1Total !== undefined ? nextBalances.clPhase1Total : (nextBalances.clPhase1 !== undefined ? nextBalances.clPhase1 : 6);
      const p2Total = nextBalances.clPhase2Total !== undefined ? nextBalances.clPhase2Total : (nextBalances.clPhase2 !== undefined ? nextBalances.clPhase2 : 6);
      let p1 = nextBalances.clPhase1 !== undefined ? nextBalances.clPhase1 : p1Total;
      let p2 = nextBalances.clPhase2 !== undefined ? nextBalances.clPhase2 : p2Total;

      // Sequential: Deduct from Phase 1 first down to 0, then from Phase 2
      if (p1 > 0) {
        const deductP1 = Math.min(p1, daysNum);
        p1 = Math.round((p1 - deductP1) * 10) / 10;
        const remDeduct = Math.round((daysNum - deductP1) * 10) / 10;
        if (remDeduct > 0) {
          p2 = Math.max(0, Math.round((p2 - remDeduct) * 10) / 10);
        }
      } else {
        p2 = Math.max(0, Math.round((p2 - daysNum) * 10) / 10);
      }

      nextBalances.clPhase1 = p1;
      nextBalances.clPhase1Total = p1Total;
      nextBalances.clPhase2 = p2;
      nextBalances.clPhase2Total = p2Total;
      nextBalances.cl = Math.round((p1 + p2) * 10) / 10;
      nextBalances.clTotal = Math.round((p1Total + p2Total) * 10) / 10;
    } else if (leaveType === 'EL') {
      nextBalances.el = Math.max(0, Math.round((nextBalances.el - daysNum) * 10) / 10);
    } else if (leaveType === 'HPL') {
      nextBalances.hpl = Math.max(0, Math.round((nextBalances.hpl - daysNum) * 10) / 10);
    } else if (leaveType === 'SPL') {
      nextBalances.specialLeave = Math.max(0, Math.round(((nextBalances.specialLeave ?? 10) - daysNum) * 10) / 10);
    } else if (leaveType === 'ML') {
      // CSL Rule: Medical Leave directly deducts from Earned Leave (EL) quota!
      nextBalances.el = Math.max(0, Math.round((nextBalances.el - daysNum) * 10) / 10);
    } else if (leaveType === 'RH') {
      nextBalances.rh = Math.max(0, Math.round((nextBalances.rh - daysNum) * 10) / 10);
    }

    setLeaveBalances(nextBalances);
    try {
      localStorage.setItem('csl_leave_balances_v2', JSON.stringify(nextBalances));
      window.dispatchEvent(new CustomEvent('csl-leave-balances-updated', { detail: nextBalances }));
    } catch {}

    const typeDesc = leaveType === 'ML' 
      ? (isMl ? 'മെഡിക്കൽ ലീവ് (ML - EL-ൽ നിന്ന് കുറച്ചു)' : 'Medical Leave (ML - Deducted from EL)')
      : leaveType === 'SPL'
      ? (isMl ? 'സ്പെഷ്യൽ ലീവ് (Special Leave)' : 'Special Leave')
      : leaveType;

    setLeaveSuccessNotice(
      isMl 
        ? `അവധി അപേക്ഷ സമർപ്പിച്ചു: ${leaveDate}-ൽ ${daysNum} ദിവസം (${typeDesc}). സൂപ്പർവൈസർക്ക് ഫോർവേഡ് ചെയ്തു.`
        : `Leave application submitted for ${leaveDate} (${daysNum} day - ${typeDesc}). Forwarded to Department HOD.`
    );
    setTimeout(() => {
      setLeaveSuccessNotice(null);
      setIsLeaveModalOpen(false);
    }, 2500);
  };

  const handleSaveQuotas = (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = Math.max(0, parseFloat(editP1) || 0);
    const p2 = isContract ? 0 : Math.max(0, parseFloat(editP2) || 0);
    const totalCl = isContract ? p1 : Math.round((p1 + p2) * 10) / 10;
    const hplVal = isContract ? 0 : Math.max(0, parseFloat(editHpl) || 0);
    const elVal = isContract ? 0 : Math.max(0, parseFloat(editEl) || 0);
    const sclVal = isContract ? 0 : Math.max(0, parseFloat(editScl) || 0);

    // Calculate actual CL taken from recorded leave records in calendar
    const clTakenInCalendar = Object.values(attendanceLeaveRecords).reduce((acc, r) => {
      if (r.type === 'CL') {
        return acc + (r.duration && r.duration.startsWith('Half Day') ? 0.5 : 1);
      }
      return acc;
    }, 0);

    // For contract employees: single pool of CL
    // For permanent employees: Phase 1 decreases first down to 0, then Phase 2 decreases
    const p1Remaining = Math.max(0, Math.round((p1 - clTakenInCalendar) * 10) / 10);
    const p2Taken = isContract ? 0 : Math.max(0, Math.round((clTakenInCalendar - p1) * 10) / 10);
    const p2Remaining = isContract ? 0 : Math.max(0, Math.round((p2 - p2Taken) * 10) / 10);

    const next = {
      ...leaveBalances,
      cl: isContract ? p1Remaining : Math.round((p1Remaining + p2Remaining) * 10) / 10,
      clTotal: totalCl,
      clPhase1: p1Remaining,
      clPhase1Total: p1,
      clPhase2: isContract ? 0 : p2Remaining,
      clPhase2Total: isContract ? 0 : p2,
      hpl: isContract ? 0 : Math.min(hplVal, leaveBalances.hpl ?? hplVal),
      hplTotal: isContract ? 0 : hplVal,
      el: isContract ? 0 : Math.min(elVal, leaveBalances.el ?? elVal),
      elTotal: isContract ? 0 : elVal,
      specialLeave: isContract ? 0 : Math.min(sclVal, leaveBalances.specialLeave ?? sclVal),
      specialLeaveTotal: isContract ? 0 : sclVal,
    };

    setLeaveBalances(next);
    try {
      localStorage.setItem('csl_leave_balances_v2', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('csl-leave-balances-updated', { detail: next }));
    } catch {}
    setIsQuotaModalOpen(false);
    showToast(isMl ? 'ലീവ് ക്വാട്ടകൾ ക്രമീകരിച്ചു' : 'Leave quotas updated successfully');
  };

  // Handlers for Attendance & Shift Duty Card (matching Screenshot 143241)
  const handleApplyLeaveTypeForDay = (day: number, newType: CslLeaveType) => {
    const prevRecord = attendanceLeaveRecords[day];
    let nextBalances = { ...leaveBalances };

    const p1Total = nextBalances.clPhase1Total !== undefined ? nextBalances.clPhase1Total : (nextBalances.clPhase1 !== undefined ? nextBalances.clPhase1 : 6);
    const p2Total = nextBalances.clPhase2Total !== undefined ? nextBalances.clPhase2Total : (nextBalances.clPhase2 !== undefined ? nextBalances.clPhase2 : 6);
    let p1 = nextBalances.clPhase1 !== undefined ? nextBalances.clPhase1 : p1Total;
    let p2 = nextBalances.clPhase2 !== undefined ? nextBalances.clPhase2 : p2Total;

    // Restore previous deduction if any
    if (prevRecord) {
      if (prevRecord.type === 'CL') {
        const dur = (prevRecord.duration && prevRecord.duration.startsWith('Half Day')) ? 0.5 : 1;
        // Restore to Phase 2 first (up to Phase 2 total), then to Phase 1
        if (p2 < p2Total) {
          const restoreP2 = Math.min(p2Total - p2, dur);
          p2 = Math.round((p2 + restoreP2) * 10) / 10;
          const rem = Math.round((dur - restoreP2) * 10) / 10;
          if (rem > 0) p1 = Math.min(p1Total, Math.round((p1 + rem) * 10) / 10);
        } else {
          p1 = Math.min(p1Total, Math.round((p1 + dur) * 10) / 10);
        }
      }
      else if (prevRecord.type === 'EL' || prevRecord.type === 'ML') nextBalances.el = Math.min(nextBalances.elTotal || 30, (nextBalances.el || 0) + 1);
      else if (prevRecord.type === 'HPL') nextBalances.hpl = Math.min(nextBalances.hplTotal || 20, (nextBalances.hpl || 0) + 1);
      else if (prevRecord.type === 'RH') nextBalances.rh = Math.min(nextBalances.rhTotal || 2, (nextBalances.rh || 0) + 1);
    }

    // Apply new deduction (ML deducts directly from EL!)
    if (newType === 'CL') {
      if (p1 > 0) {
        const deductP1 = Math.min(p1, 1);
        p1 = Math.round((p1 - deductP1) * 10) / 10;
        const remDeduct = Math.round((1 - deductP1) * 10) / 10;
        if (remDeduct > 0) {
          p2 = Math.max(0, Math.round((p2 - remDeduct) * 10) / 10);
        }
      } else {
        p2 = Math.max(0, Math.round((p2 - 1) * 10) / 10);
      }
    }
    else if (newType === 'EL' || newType === 'ML') nextBalances.el = Math.max(0, (nextBalances.el || 0) - 1);
    else if (newType === 'HPL') nextBalances.hpl = Math.max(0, (nextBalances.hpl || 0) - 1);
    else if (newType === 'RH') nextBalances.rh = Math.max(0, (nextBalances.rh || 0) - 1);

    nextBalances.clPhase1 = p1;
    nextBalances.clPhase1Total = p1Total;
    nextBalances.clPhase2 = p2;
    nextBalances.clPhase2Total = p2Total;
    nextBalances.cl = Math.round((p1 + p2) * 10) / 10;
    nextBalances.clTotal = Math.round((p1Total + p2Total) * 10) / 10;

    setLeaveBalances(nextBalances);
    try {
      localStorage.setItem('csl_leave_balances_v2', JSON.stringify(nextBalances));
      window.dispatchEvent(new CustomEvent('csl-leave-balances-updated', { detail: nextBalances }));
    } catch {}

    const updatedRecords: Record<number, DayLeaveDetails> = {
      ...attendanceLeaveRecords,
      [day]: {
        type: newType,
        duration: 'Full Day',
        reason: newType === 'ML' ? 'Medical Leave (മെഡിക്കൽ അവധി - EL-ൽ നിന്ന് കുറയ്ക്കുന്നു)' : newType === 'CL' ? 'Casual Leave (ആകസ്മിക അവധി)' : newType === 'HPL' ? 'Half Pay Leave (ഹാഫ് പേ ലീവ്)' : 'Earned Leave (പ്രിവിലേജ് അവധി)',
        appliedDate: `${selectedLogYear}-${String(selectedLogMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        medicalCert: newType === 'ML',
      }
    };
    setAttendanceLeaveRecords(updatedRecords);
    try {
      localStorage.setItem(`csl_calendar_leave_records_${selectedLogYear}_${selectedLogMonth}`, JSON.stringify(updatedRecords));
      const days = Object.keys(updatedRecords).map(Number).sort((a, b) => a - b);
      localStorage.setItem(`csl_calendar_leave_days_${selectedLogYear}_${selectedLogMonth}`, JSON.stringify(days));
      if (selectedLogMonth === 9 && updatedRecords[20]?.type === 'ML') {
        localStorage.setItem('csl_oct_20_ml_entered', 'true');
      }
      window.dispatchEvent(new CustomEvent('csl-calendar-leaves-updated', { detail: { records: updatedRecords, days } }));
    } catch {}

    const leaveStatus = newType === 'ML' 
      ? 'Medical Leave' 
      : newType === 'CL' 
      ? 'Casual Leave' 
      : newType === 'EL' 
      ? 'Earned Leave' 
      : newType === 'HPL' 
      ? 'Half Pay Leave' 
      : 'Special Leave';
    const leaveNote = newType === 'ML' 
      ? (isMl ? 'മെഡിക്കൽ ലീവ് (ML) · EL ക്വാട്ടയിൽ നിന്ന് കുറച്ചു' : 'Medical Leave (ML) · Deducted from EL')
      : `${newType} Leave Recorded`;

    const mShort = MONTH_SHORT_NAMES[selectedLogMonth] || 'Nov';
    const mNameMl = MONTH_NAMES_ML[selectedLogMonth] || 'നവംബർ';
    const logsKey = getAttendanceLogsKey(selectedLogYear, selectedLogMonth);

    // Also update daily log status for this day and persist
    setDailyLogs(prev => {
      const exists = prev.some(r => r.dayNum === day);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(selectedLogYear, selectedLogMonth, day).getDay()];
      let nextLogs: DailyAttendanceRecord[];
      if (exists) {
        nextLogs = prev.map(row => {
          if (row.dayNum === day) {
            return {
              ...row,
              shift: `${newType} Leave (Full Day)`,
              inTime: '—',
              outTime: '—',
              workHours: '0h',
              otHours: 0,
              status: leaveStatus as any,
              notes: leaveNote
            };
          }
          return row;
        });
      } else {
        const newRow: DailyAttendanceRecord = {
          id: `d-${day}`,
          dateStr: `${day} ${mShort} ${selectedLogYear}`,
          dayName,
          dayNum: day,
          shift: `${newType} Leave (Full Day)`,
          shiftCode: 'GEN',
          inTime: '—',
          outTime: '—',
          workHours: '0h',
          otHours: 0,
          terminal: 'CSL HR Portal',
          status: leaveStatus as any,
          notes: leaveNote
        };
        nextLogs = [newRow, ...prev].sort((a, b) => b.dayNum - a.dayNum);
      }
      try {
        localStorage.setItem(logsKey, JSON.stringify(nextLogs));
        if (selectedLogMonth === getIstDate().getMonth()) {
          localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(nextLogs));
        }
      } catch {}
      return nextLogs;
    });

    showToast(newType === 'ML' 
      ? (isMl ? `${mNameMl} ${day}: മെഡിക്കൽ ലീവ് രേഖപ്പെടുത്തി (EL ക്വാട്ടയിൽ നിന്ന് കുറച്ചു)` : `${mShort} ${day}: Medical Leave (ML) recorded - Deducted from EL`)
      : (isMl ? `${mNameMl} ${day}: ${newType} അവധി രേഖപ്പെടുത്തി` : `${mShort} ${day}: ${newType} Leave recorded`));
  };

  const handleCancelLeaveForDay = (day: number) => {
    const prevRecord = attendanceLeaveRecords[day];
    if (prevRecord) {
      let nextBalances = { ...leaveBalances };
      if (prevRecord.type === 'CL') nextBalances.cl = Math.min(nextBalances.clTotal || 12, (nextBalances.cl || 0) + 1);
      else if (prevRecord.type === 'EL' || prevRecord.type === 'ML') nextBalances.el = Math.min(nextBalances.elTotal || 30, (nextBalances.el || 0) + 1);
      else if (prevRecord.type === 'HPL') nextBalances.hpl = Math.min(nextBalances.hplTotal || 20, (nextBalances.hpl || 0) + 1);
      else if (prevRecord.type === 'RH') nextBalances.rh = Math.min(nextBalances.rhTotal || 2, (nextBalances.rh || 0) + 1);

      setLeaveBalances(nextBalances);
      try {
        localStorage.setItem('csl_leave_balances_v2', JSON.stringify(nextBalances));
        window.dispatchEvent(new CustomEvent('csl-leave-balances-updated', { detail: nextBalances }));
      } catch {}
    }

    const nextRecords = { ...attendanceLeaveRecords };
    delete nextRecords[day];
    setAttendanceLeaveRecords(nextRecords);
    try {
      localStorage.setItem(`csl_calendar_leave_records_${selectedLogYear}_${selectedLogMonth}`, JSON.stringify(nextRecords));
      const days = Object.keys(nextRecords).map(Number).sort((a, b) => a - b);
      localStorage.setItem(`csl_calendar_leave_days_${selectedLogYear}_${selectedLogMonth}`, JSON.stringify(days));
      if (selectedLogMonth === 9 && day === 20) {
        localStorage.removeItem('csl_oct_20_ml_entered');
      }
      window.dispatchEvent(new CustomEvent('csl-calendar-leaves-updated', { detail: { records: nextRecords, days } }));
    } catch {}

    const logsKey = getAttendanceLogsKey(selectedLogYear, selectedLogMonth);
    const mShort = MONTH_SHORT_NAMES[selectedLogMonth] || 'Nov';
    const mNameMl = MONTH_NAMES_ML[selectedLogMonth] || 'നവംബർ';

    // Restore daily log status to Present and persist
    setDailyLogs(prev => {
      const nextLogs = prev.map(row => {
        if (row.dayNum === day) {
          const def = CSL_SHIFTS[row.shiftCode as CslShiftCode || 'A2'] || CSL_SHIFTS.A2;
          return {
            ...row,
            shift: `${row.shiftCode || 'A2'} (${def.inTime.replace(' ', '')} - ${def.outTime.replace(' ', '')})`,
            inTime: def.inTime,
            outTime: def.outTime,
            workHours: '8h 20m',
            otHours: 0,
            status: 'Present',
            notes: undefined
          };
        }
        return row;
      });
      try {
        localStorage.setItem(logsKey, JSON.stringify(nextLogs));
        if (selectedLogMonth === getIstDate().getMonth()) {
          localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(nextLogs));
        }
      } catch {}
      return nextLogs;
    });

    showToast(isMl ? `${mNameMl} ${day}: അവധി ഒഴിവാക്കി` : `${mShort} ${day}: Leave Cancelled`);
  };

  const handleSaveNoteForDay = () => {
    const key = `${selectedLogYear}-${selectedLogMonth}-${selectedDayNum}`;
    const altKey = `${selectedLogYear}-${selectedLogMonth + 1}-${selectedDayNum}`;
    const logsKey = getAttendanceLogsKey(selectedLogYear, selectedLogMonth);

    // 1. Save Note
    const nextNotes = { ...dayNotes };
    const textNote = noteDraft.trim();
    if (textNote) {
      nextNotes[key] = textNote;
      nextNotes[altKey] = textNote;
    } else {
      delete nextNotes[key];
      delete nextNotes[altKey];
    }
    setDayNotes(nextNotes);
    try {
      localStorage.setItem('csl_calendar_day_notes_2026', JSON.stringify(nextNotes));
    } catch {}

    // 2. Save Work
    const nextWorks = { ...dayWorks };
    const textWork = workDraft.trim();
    if (textWork) {
      nextWorks[key] = textWork;
      nextWorks[altKey] = textWork;
    } else {
      delete nextWorks[key];
      delete nextWorks[altKey];
    }
    setDayWorks(nextWorks);
    try {
      localStorage.setItem('csl_calendar_day_works_2026', JSON.stringify(nextWorks));
    } catch {}

    // 3. Update row in dailyLogs
    setDailyLogs((prev) => {
      const nextLogs = prev.map((row) => {
        if (row.dayNum === selectedDayNum) {
          return {
            ...row,
            notes: textNote || undefined,
            work: textWork || undefined,
          };
        }
        return row;
      });
      try {
        localStorage.setItem(logsKey, JSON.stringify(nextLogs));
        if (selectedLogMonth === getIstDate().getMonth()) {
          localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(nextLogs));
        }
      } catch {}
      return nextLogs;
    });

    setIsEditingNote(false);
    showToast(isMl ? 'നോട്ടും വർക്കും സേവ് ചെയ്തു' : 'Note & Work saved');
  };

  const handleDeleteNoteForDay = () => {
    const key = `${selectedLogYear}-${selectedLogMonth}-${selectedDayNum}`;
    const altKey = `${selectedLogYear}-${selectedLogMonth + 1}-${selectedDayNum}`;
    const logsKey = getAttendanceLogsKey(selectedLogYear, selectedLogMonth);

    const nextNotes = { ...dayNotes };
    delete nextNotes[key];
    delete nextNotes[altKey];
    setDayNotes(nextNotes);
    setNoteDraft('');
    try {
      localStorage.setItem('csl_calendar_day_notes_2026', JSON.stringify(nextNotes));
    } catch {}

    const nextWorks = { ...dayWorks };
    delete nextWorks[key];
    delete nextWorks[altKey];
    setDayWorks(nextWorks);
    setWorkDraft('');
    try {
      localStorage.setItem('csl_calendar_day_works_2026', JSON.stringify(nextWorks));
    } catch {}

    setDailyLogs((prev) => {
      const nextLogs = prev.map((row) => {
        if (row.dayNum === selectedDayNum) {
          return {
            ...row,
            notes: undefined,
            work: undefined,
          };
        }
        return row;
      });
      try {
        localStorage.setItem(logsKey, JSON.stringify(nextLogs));
        if (selectedLogMonth === getIstDate().getMonth()) {
          localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(nextLogs));
        }
      } catch {}
      return nextLogs;
    });

    setIsEditingNote(false);
    showToast(isMl ? 'കുറിപ്പ് നീക്കം ചെയ്തു' : 'Note & Work removed');
  };

  const p1TotalDays = leaveBalances.clPhase1Total !== undefined ? leaveBalances.clPhase1Total : (leaveBalances.clPhase1 !== undefined ? leaveBalances.clPhase1 : 6);
  const p2TotalDays = leaveBalances.clPhase2Total !== undefined ? leaveBalances.clPhase2Total : (leaveBalances.clPhase2 !== undefined ? leaveBalances.clPhase2 : 6);
  const clOverallTotal = leaveBalances.clTotal !== undefined ? leaveBalances.clTotal : (p1TotalDays + p2TotalDays);
  const p1RemainingDisplay = leaveBalances.clPhase1 !== undefined ? leaveBalances.clPhase1 : p1TotalDays;
  const p2RemainingDisplay = leaveBalances.clPhase2 !== undefined ? leaveBalances.clPhase2 : p2TotalDays;

  const handleDownloadAttendancePdf = async () => {
    try {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Friday', 'Sat'];
      const pdfDailyLogs: MonthlyPdfData['dailyLogs'] = [];
      const mShort = MONTH_SHORT_NAMES[selectedLogMonth] || 'Nov';
      const mFull = MONTH_FULL_NAMES[selectedLogMonth] || 'November';
      const totalDaysInMonth = new Date(selectedLogYear, selectedLogMonth + 1, 0).getDate();

      for (let d = 1; d <= totalDaysInMonth; d++) {
        const dateObj = new Date(selectedLogYear, selectedLogMonth, d);
        const dayName = dayNames[dateObj.getDay()];
        const dateStr = `${String(d).padStart(2, '0')} ${mShort} ${selectedLogYear} (${dayName})`;
        const isSun = dateObj.getDay() === 0;
        const holInfo = isCslHolidayDate(dateObj, selectedLogMonth, selectedLogYear);
        const leave = attendanceLeaveRecords[d];
        const matched = dailyLogs.find((l: any) => l.dayNum === d);

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

      const attendedCount = dailyLogs.filter((l: any) => l.inTime !== '—' && !l.status.toLowerCase().includes('leave')).length;
      const leavesCount = Object.keys(attendanceLeaveRecords).length;

      const pdfData: MonthlyPdfData = {
        employeeName: currentUser?.name || 'Prathyush Mohan K',
        tokenNumber: currentUser?.token || '5312',
        department: currentUser?.department || 'Hull Errection',
        category: isContract ? 'Company on Contract Employee (CSL)' : 'Permanent Employee (CSL)',
        monthName: mFull,
        monthYear: selectedLogYear,
        totalDays: totalDaysInMonth,
        attendedDays: attendedCount,
        leavesCount: leavesCount,
        leaveBreakdown: {
          cl: leaveBalances.clPhase1 || 0,
          el: leaveBalances.el || 0,
          hpl: leaveBalances.hpl || 0,
          ml: selectedLogMonth === 9 ? 1 : 0,
          special: leaveBalances.specialLeave || 0,
        },
        offsCount: selectedLogMonth === 9 ? 9 : 7,
        dailyLogs: pdfDailyLogs,
      };

      await generateAndDownloadMonthlyPdf(pdfData);
      setToastMessage(isMl ? 'CSL പ്രതിമാസ ഡ്യൂട്ടി രേഖ PDF ഡൗൺലോഡ് ചെയ്തു!' : 'CSL Monthly Duty Register PDF Downloaded!');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e) {
      console.error('Error generating PDF from attendance view:', e);
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] flex flex-col justify-start overflow-hidden bg-radial from-[#041d2e] via-[#03131f] to-[#010911] text-white">
      {/* Authentic Photographic Cochin Shipyard Vessel Background matching Previous Page */}
      <CslTugBackground />

      {/* Main Foreground Container - Compact max-w-lg matching Previous Page */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-3.5 sm:px-4 py-3.5 sm:py-5 flex flex-col justify-start space-y-2.5">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-4 z-50 bg-[#062438] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-cyan-400/80 flex items-center gap-2.5 animate-fade-in text-xs backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Top Brand Header with CSL Emblem & Back Pill Button (Matching Previous Page) */}
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBackToQuickAccess}
              className="cursor-pointer active:scale-95 transition-transform shrink-0"
              title="Cochin Shipyard Limited"
            >
              <CslLogo size={32} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  COCHIN SHIPYARD LIMITED
                </span>
                <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-teal-950/90 text-teal-300 border border-teal-500/40">
                  Live
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                {isMl ? 'ബയോമെട്രിക് അറ്റൻഡൻസ്' : 'Biometric Attendance & Shifts'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="w-7 h-7 rounded-lg border border-cyan-500/40 bg-[#072030] hover:bg-[#0a2e45] text-cyan-200 flex items-center justify-center transition-colors cursor-pointer"
                title={isMl ? 'കലണ്ടർ' : 'Calendar'}
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadAttendancePdf}
              className="w-7 h-7 rounded-lg border border-cyan-500/40 bg-[#072030] hover:bg-[#0a2e45] text-teal-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm active:scale-95"
              title={isMl ? 'PDF ഡൗൺലോഡ് ചെയ്യുക' : 'Download PDF Register'}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            {/* Back Pill Button exactly matching Previous Page */}
            <button
              type="button"
              onClick={onBackToQuickAccess}
              className="px-2.5 py-1 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isMl ? 'ഡാഷ്‌ബോർഡ്' : 'Dashboard'}</span>
            </button>
          </div>
        </div>

        {/* Employee Context Pill Bar - Compact Size */}
        <div className="rounded-xl p-2 sm:p-2.5 bg-[#061825]/95 text-white shadow-md border border-[#0f354c] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs shrink-0">
              {currentUser.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  {currentUser.name || (isContract ? (isMl ? 'കമ്പനി ഓൺ കോൺട്രാക്ട് ജീവനക്കാരൻ' : 'Company on Contract Employee') : (isMl ? 'പെർമനന്റ് ജീവനക്കാരൻ' : 'Permanent Employee'))}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-teal-950/90 text-teal-300 text-[8px] font-bold tracking-wider uppercase border border-teal-500/40">
                  {isContract ? 'ON CONTRACT' : 'PERMANENT'}
                </span>
              </div>
              <div className="text-[10px] text-cyan-300/80 font-mono flex items-center gap-1 truncate">
                <span>{isMl ? 'കോഡ്:' : 'Code:'} <strong className="text-white">{currentUser.token || 'CSL'}</strong></span>
                <span>·</span>
                <span className="truncate">{currentUser.department || 'Hull & Shipbuilding'}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-tight leading-none">
              {currentTime}
            </div>
            <div className="text-[9px] text-emerald-300 flex items-center justify-end gap-1 font-semibold mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Inside Yard</span>
            </div>
          </div>
        </div>


      {/* Live Biometric Punch In / Punch Out Station */}
      <div className={`rounded-2xl p-3.5 sm:p-4 shadow-xl border text-white transition-all relative overflow-hidden ${
        punchState === 'in'
          ? 'bg-gradient-to-r from-[#032a2f] via-[#053d3b] to-[#032029] border-emerald-400/60 ring-2 ring-emerald-500/20'
          : 'bg-gradient-to-r from-[#061e2f] via-[#08293d] to-[#051c2c] border-cyan-500/40'
      }`}>
        {/* Top Row: Station Label, Shift Indicator, Live IST Clock */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${punchState === 'in' ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
            <span className="text-[11px] font-black tracking-wider uppercase text-cyan-300 font-mono">
              {isMl ? 'ലൈവ് ബയോമെട്രിക് പഞ്ച് സ്റ്റേഷൻ' : 'LIVE BIOMETRIC PUNCH'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {customPunchTime ? (
              <div className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-500/40 px-2.5 py-0.5 rounded-md text-amber-300 text-xs font-mono font-bold">
                <span>{isMl ? 'സെറ്റ് ചെയ്ത സമയം:' : 'Custom Time:'} <strong className="text-white">{customPunchTime}</strong></span>
                <button
                  type="button"
                  onClick={() => setCustomPunchTime(null)}
                  className="px-1.5 py-0.2 rounded bg-amber-900/80 hover:bg-amber-800 text-white text-[10px] cursor-pointer"
                  title="Reset to live ticking clock"
                >
                  ⚡ {isMl ? 'ലൈവ്' : 'Live'}
                </button>
              </div>
            ) : (
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-black/40 border border-white/15 text-amber-300">
                {currentTime}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                const t = getIstDate();
                setActivePunchDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`);
                setActivePunchShift(activeShift);
                setIsDutyPunchModalOpen(true);
              }}
              className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-200 text-[10px] font-bold border border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Duty Punch Details"
            >
              <Clock className="w-3 h-3 text-amber-300" />
              <span>{isMl ? 'കസ്റ്റം പഞ്ച്' : 'Duty Punch'}</span>
            </button>
          </div>
        </div>

        {/* Middle Row: Active Shift & Live Status */}
        <div className="py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-white tracking-tight">
                Shift {activeShift} · {CSL_SHIFTS[activeShift]?.name || activeShift}
              </span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                punchState === 'in'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              }`}>
                {punchState === 'in' ? (isMl ? 'ഡ്യൂട്ടിയിൽ (ON DUTY)' : 'ON DUTY') : (isMl ? 'പഞ്ച് ചെയ്തിട്ടില്ല' : 'OFF DUTY')}
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono mt-0.5 flex flex-wrap items-center gap-2">
              <span>{CSL_SHIFTS[activeShift]?.inTime} – {CSL_SHIFTS[activeShift]?.outTime} ({CSL_SHIFTS[activeShift]?.duration})</span>
              {lastPunchTime !== '—' && (
                <span className="text-cyan-300">· {isMl ? 'അവസാന പഞ്ച്:' : 'Last:'} {lastPunchTime}</span>
              )}
            </div>
          </div>

          {/* Live Running Duty Timer if On Duty */}
          {punchState === 'in' && (
            <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-emerald-400/30 font-mono text-left sm:text-right shrink-0">
              <span className="text-[10px] text-emerald-300 uppercase block font-bold">
                {isMl ? 'ഡ്യൂട്ടി സമയം (Live)' : 'Duty Elapsed'}
              </span>
              <span className="text-lg font-black text-amber-300">
                {Math.floor(elapsedDutySeconds / 3600).toString().padStart(2, '0')}:
                {Math.floor((elapsedDutySeconds % 3600) / 60).toString().padStart(2, '0')}:
                {(elapsedDutySeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Quick Time Preset Bar (Fast 1-tap time setting) */}
        <div className="pt-2 pb-1.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-0.5">
              {isMl ? 'സമയം പെട്ടെന്ന് സെറ്റ് ചെയ്യാം:' : 'Quick Time:'}
            </span>

            {/* Live Now */}
            <button
              type="button"
              onClick={() => setCustomPunchTime(null)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                !customPunchTime
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'bg-black/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/60'
              }`}
            >
              ⚡ {isMl ? 'തത്സമയം' : 'Live'}
            </button>

            {/* Shift In preset */}
            <button
              type="button"
              onClick={() => setCustomPunchTime(CSL_SHIFTS[activeShift]?.inTime || '07:00 AM')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                customPunchTime === CSL_SHIFTS[activeShift]?.inTime
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-black/30 text-slate-300 border border-white/15 hover:bg-white/10'
              }`}
            >
              🕒 {isMl ? 'ഷിഫ്റ്റ് ഇൻ' : 'Shift In'} ({CSL_SHIFTS[activeShift]?.inTime})
            </button>

            {/* Shift Out preset */}
            <button
              type="button"
              onClick={() => setCustomPunchTime(CSL_SHIFTS[activeShift]?.outTime || '03:20 PM')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                customPunchTime === CSL_SHIFTS[activeShift]?.outTime
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-black/30 text-slate-300 border border-white/15 hover:bg-white/10'
              }`}
            >
              🕒 {isMl ? 'ഷിഫ്റ്റ് ഔട്ട്' : 'Shift Out'} ({CSL_SHIFTS[activeShift]?.outTime})
            </button>

            {/* 5m Grace preset */}
            <button
              type="button"
              onClick={() => setCustomPunchTime(CSL_SHIFTS[activeShift]?.earlyOutGraceTime || '03:15 PM')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                customPunchTime === CSL_SHIFTS[activeShift]?.earlyOutGraceTime
                  ? 'bg-teal-400 text-slate-950 font-black shadow-xs'
                  : 'bg-black/30 text-teal-300 border border-teal-500/30 hover:bg-teal-950/60'
              }`}
            >
              ⚡ 5m {isMl ? 'ഗ്രേസ്' : 'Grace'} ({CSL_SHIFTS[activeShift]?.earlyOutGraceTime})
            </button>

            {/* +1h OT preset */}
            <button
              type="button"
              onClick={() => setCustomPunchTime(getShiftTimeWithOt(activeShift, 1))}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                customPunchTime === getShiftTimeWithOt(activeShift, 1)
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-black/30 text-amber-300 border border-amber-500/30 hover:bg-amber-950/60'
              }`}
            >
              ⚡ +1h OT ({getShiftTimeWithOt(activeShift, 1)})
            </button>

            {/* +2h OT preset */}
            <button
              type="button"
              onClick={() => setCustomPunchTime(getShiftTimeWithOt(activeShift, 2))}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                customPunchTime === getShiftTimeWithOt(activeShift, 2)
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-black/30 text-amber-300 border border-amber-500/30 hover:bg-amber-950/60'
              }`}
            >
              ⚡ +2h OT ({getShiftTimeWithOt(activeShift, 2)})
            </button>
          </div>
        </div>

        {/* Bottom Action Row: BIG Punch Buttons */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          {/* Shift Selector Pills */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Shift:</span>
            {CSL_SHIFT_CODES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleShiftSelect(s)}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeShift === s
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'bg-black/30 border border-white/10 text-cyan-300 hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Big Action Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {punchState === 'out' ? (
              <>
                <button
                  type="button"
                  onClick={() => handlePunchIn(activeShift, customPunchTime || currentTime)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
                >
                  <Fingerprint className="w-5 h-5 stroke-[2.5]" />
                  <span>{isMl ? 'ലൈവ് പഞ്ച്-ഇൻ' : 'Live Punch In'}</span>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                    customPunchTime ? 'bg-amber-300 text-slate-950 font-black shadow-xs ring-1 ring-amber-500' : 'bg-slate-950/20 text-slate-950 font-extrabold'
                  }`}>
                    {customPunchTime || currentTime}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultOtTime = getShiftTimeWithOt(activeShift, 1);
                    setHalfDayModalParams({
                      punchType: 'OUT',
                      dutyCategory: 'full_day_ot',
                      otHours: 1,
                      time: customPunchTime || defaultOtTime,
                      shiftCode: activeShift
                    });
                    setIsHalfDayModalOpen(true);
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
                    setHalfDayModalParams({
                      punchType: 'IN',
                      dutyCategory: 'half_day',
                      time: customPunchTime || currentTime,
                      session: 'First Half',
                      shiftCode: activeShift
                    });
                    setIsHalfDayModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-[#093542] hover:bg-[#0e4859] text-emerald-300 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-400/50"
                  title="ഹാഫ് ഡേ ഇൻ പഞ്ച് ചെയ്ത് വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ സമയം ഷെയർ ചെയ്യാം"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>{isMl ? 'ഹാഫ് ഡേ ഇൻ & വാട്സ്ആപ്പ്' : 'Half Day IN & WhatsApp'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleDirectPunchOut(CSL_SHIFTS[activeShift]?.earlyOutGraceTime)}
                  className="px-2.5 py-2 rounded-xl bg-teal-800/80 hover:bg-teal-700 text-teal-200 text-xs font-bold border border-teal-500/40 transition-all cursor-pointer"
                  title="5-minute Early Out Grace Time"
                >
                  <span>5m ഗ്രേസ് ({CSL_SHIFTS[activeShift]?.earlyOutGraceTime})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectPunchOut(customPunchTime || currentTime)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 active:scale-95 transition-all cursor-pointer"
                >
                  <Fingerprint className="w-5 h-5 stroke-[2.5]" />
                  <span>{isMl ? 'പഞ്ച്-ഔട്ട്' : 'Punch Out'}</span>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                    customPunchTime ? 'bg-amber-400 text-slate-950 font-black' : 'bg-black/30 text-white'
                  }`}>
                    {customPunchTime || currentTime}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const inT = localStorage.getItem('csl_today_punch_in_time') || (lastPunchTime && lastPunchTime !== '—' && lastPunchTime !== 'On Duty' ? lastPunchTime : CSL_SHIFTS[activeShift].inTime);
                    const liveCalc = calculateDutyAndOT(inT, customPunchTime || currentTime, activeShift, true);
                    const otToUse = liveCalc.otHours > 0 ? liveCalc.otHours : 1.0;
                    setHalfDayModalParams({
                      punchType: 'OUT',
                      dutyCategory: 'full_day_ot',
                      otHours: otToUse,
                      time: customPunchTime || currentTime,
                      shiftCode: activeShift
                    });
                    setIsHalfDayModalOpen(true);
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
                    setHalfDayModalParams({
                      punchType: 'OUT',
                      dutyCategory: 'half_day',
                      time: customPunchTime || currentTime,
                      session: 'First Half',
                      shiftCode: activeShift
                    });
                    setIsHalfDayModalOpen(true);
                  }}
                  className="px-3 py-2.5 rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-400/40"
                  title="ഹാഫ് ഡേ ഔട്ട് പഞ്ച് ചെയ്ത് വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ സമയം ഷെയർ ചെയ്യാം"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>{isMl ? 'ഹാഫ് ഡേ ഔട്ട് & വാട്സ്ആപ്പ്' : 'Half Day OUT & WhatsApp'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Duty Completed Successfully Banner - Only show if duty was actually completed today and day has not passed */}
      {completedDutySummary && punchState === 'out' && (() => {
        const today = getIstDate();
        const todayDay = today.getDate();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
        const hasPunchedToday = localStorage.getItem('csl_actual_punched_today') === 'true' && localStorage.getItem('csl_today_punched_date') === todayKey;
        const punchOutRecorded = localStorage.getItem('csl_today_punch_out_time');

        // Automatically disable if duty hasn't started today or when that day has passed!
        if (!hasPunchedToday || !punchOutRecorded || (completedDutySummary.dateKey && completedDutySummary.dateKey !== todayKey)) {
          return null;
        }

        return (
          <div className="rounded-xl p-3.5 sm:p-4 bg-gradient-to-r from-[#032a38] via-[#05374a] to-[#042633] border border-emerald-400/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-white animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm font-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm sm:text-base">
                    {isMl ? 'ഇന്നത്തെ ഡ്യൂട്ടി വിജയകരമായി പൂർത്തിയായി!' : 'Duty Completed Successfully!'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold font-mono">
                    {completedDutySummary.recordedAt}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-200/90 mt-0.5 flex flex-wrap items-center gap-2 font-mono">
                  <span className="font-bold text-amber-300">{CSL_SHIFTS[completedDutySummary.shift as CslShiftCode]?.name || completedDutySummary.shift}</span>
                  <span>·</span>
                  <span>In: <strong>{completedDutySummary.inTime}</strong></span>
                  <span>·</span>
                  <span>Out: <strong>{completedDutySummary.outTime}</strong></span>
                  <span>·</span>
                  <span>{isMl ? 'ആകെ ഡ്യൂട്ടി:' : 'Total:'} <strong className="text-white font-bold bg-black/40 px-1.5 py-0.2 rounded border border-white/20">{completedDutySummary.totalHours}</strong></span>
                  {completedDutySummary.otHours > 0 && (
                    <>
                      <span>·</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-950/90 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>+{completedDutySummary.otHours}h OT</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const otVal = completedDutySummary.otHours > 0 ? completedDutySummary.otHours : 1;
                  setHalfDayModalParams({
                    punchType: 'OUT',
                    dutyCategory: 'full_day_ot',
                    otHours: otVal,
                    time: completedDutySummary.outTime || (customPunchTime || currentTime),
                    shiftCode: (completedDutySummary.shift in CSL_SHIFTS) ? completedDutySummary.shift : activeShift
                  });
                  setIsHalfDayModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                title="ഫുൾ ഡേ + OT സമയം വാട്സ്ആപ്പ് ഗ്രൂപ്പിൽ ഷെയർ ചെയ്യാം"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span>{isMl ? '⚡ ഫുൾ ഡേ + OT ഷെയർ' : '⚡ Full Day + OT Share'}</span>
              </button>

              {onOpenSalary && (
                <button
                  type="button"
                  onClick={onOpenSalary}
                  className="px-3 py-1.5 rounded-full bg-[#00a8cc] hover:bg-[#00b4d8] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <IndianRupee className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isMl ? 'ശമ്പളം പരിശോധിക്കുക' : 'View in Salary'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCompletedDutySummary(null);
                  try {
                    localStorage.removeItem('csl_completed_duty_summary');
                  } catch {}
                }}
                className="p-1.5 rounded-lg bg-[#072030] hover:bg-[#0a2e45] text-slate-400 hover:text-white border border-[#0f354c] transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* CSL Quarterly OT Cap (75h or 120h per 3-month cycle: Mar-May, Jun-Aug, Sep-Nov, Dec-Feb) */}
      <QuarterlyOtTrackerBanner
        language={language}
        dailyLogs={dailyLogs}
        onOpenDetails={() => setIsQuarterlyOtModalOpen(true)}
      />

      {/* CSL Permanent Employee Official Leave Balances Strip (CL, EL, HPL, Special Leave) */}
      <div className="bg-[#061825]/95 rounded-xl p-3 border border-[#0f354c] shadow-lg text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold text-xs text-white">
              {isContract
                ? (isMl ? 'CSL കരാർ ജീവനക്കാരുടെ അവധി ക്വാട്ട (CL & ML)' : 'CSL On Contract Employee Leave Quota (CL & ML)')
                : (isMl ? 'CSL സ്ഥിരം ജീവനക്കാരുടെ അവധി ക്വാട്ട (CL, EL, HPL, സ്പെഷ്യൽ ലീവ്)' : 'CSL Permanent Employee Official Leave Balances')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsQuotaModalOpen(true)}
              className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              title="Leave Quotas Setup"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>{isMl ? 'ക്വാട്ട' : 'Quotas'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Send className="w-3 h-3" />
              <span>{isMl ? 'അവധി അപേക്ഷ' : 'Apply Leave'}</span>
            </button>
          </div>
        </div>

        {isContract ? (
          <div className="grid grid-cols-2 gap-2">
            {/* 1. CL */}
            <div 
              onClick={() => {
                setLeaveType('CL');
                setIsLeaveModalOpen(true);
              }}
              className="p-2.5 rounded-lg bg-[#041622] border border-amber-500/35 hover:border-amber-400/70 transition-all cursor-pointer"
              title={`Casual Leave quota: ${clOverallTotal} days`}
            >
              <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold mb-0.5">
                <span>{isMl ? 'കാഷ്വൽ ലീവ് (CL)' : 'Casual Leave (CL)'}</span>
                <span className="text-[10px] text-slate-400">{clOverallTotal}d</span>
              </div>
              <div className="text-base font-black font-mono text-amber-300">
                {leaveBalances.cl} <span className="text-[10px] font-normal text-slate-400">/ {clOverallTotal} d</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                {isContract 
                  ? (isMl ? `ആകെ ലഭ്യം: ${leaveBalances.cl}d` : `Total Available: ${leaveBalances.cl}d`) 
                  : (isMl ? `ഫേസ് 1: ${p1RemainingDisplay}/${p1TotalDays}d · ഫേസ് 2: ${p2RemainingDisplay}/${p2TotalDays}d` : `Phase 1: ${p1RemainingDisplay}/${p1TotalDays}d · Phase 2: ${p2RemainingDisplay}/${p2TotalDays}d`)}
              </div>
            </div>

            {/* 2. ML */}
            <div 
              onClick={() => {
                setLeaveType('ML');
                setIsLeaveModalOpen(true);
              }}
              className="p-2.5 rounded-lg bg-[#041622] border border-rose-500/35 hover:border-rose-400/70 transition-all cursor-pointer"
              title="Medical Leave"
            >
              <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold mb-0.5">
                <span>{isMl ? 'മെഡിക്കൽ ലീവ് (ML)' : 'Medical Leave (ML)'}</span>
                <span className="text-[10px] text-rose-300 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/30">Medical</span>
              </div>
              <div className="text-base font-black font-mono text-rose-300">
                {isMl ? 'മെഡിക്കൽ ലീവ്' : 'Medical Leave'}
              </div>
              <div className="text-[10px] text-rose-300/80 font-medium truncate">
                {isMl ? 'ഡോക്ടർ സർട്ടിഫിക്കറ്റ് സഹിതം' : 'Against Medical Certificate'}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. CL */}
            <div 
              onClick={() => {
                setLeaveType('CL');
                setIsLeaveModalOpen(true);
              }}
              className="p-2 rounded-lg bg-[#041622] border border-amber-500/35 hover:border-amber-400/70 transition-all cursor-pointer"
              title={`Casual Leave quota: ${clOverallTotal} days`}
            >
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-0.5">
                <span>{isMl ? 'കാഷ്വൽ ലീവ് (CL)' : 'Casual Leave (CL)'}</span>
                <span className="text-[9px] text-slate-400">{clOverallTotal}d</span>
              </div>
              <div className="text-base font-black font-mono text-amber-300">
                {leaveBalances.cl} <span className="text-[10px] font-normal text-slate-400">/ {clOverallTotal} d</span>
              </div>
              <div className="text-[9px] text-emerald-400 font-medium">
                {isMl ? `ഫേസ് 1: ${p1RemainingDisplay}/${p1TotalDays}d · ഫേസ് 2: ${p2RemainingDisplay}/${p2TotalDays}d` : `Phase 1: ${p1RemainingDisplay}/${p1TotalDays}d · Phase 2: ${p2RemainingDisplay}/${p2TotalDays}d`}
              </div>
            </div>

            {/* 2. EL */}
            <div 
              onClick={() => {
                setLeaveType('EL');
                setIsLeaveModalOpen(true);
              }}
              className="p-2 rounded-lg bg-[#041622] border border-teal-500/35 hover:border-teal-400/70 transition-all cursor-pointer"
              title="Earned Leave quota: 30 days"
            >
              <div className="flex items-center justify-between text-[10px] text-teal-400 font-bold mb-0.5">
                <span>{isMl ? 'ഏൺഡ് ലീവ് (EL)' : 'Earned Leave (EL)'}</span>
                <span className="text-[9px] text-slate-400">30d</span>
              </div>
              <div className="text-base font-black font-mono text-teal-300">
                {leaveBalances.el ?? 24} <span className="text-[10px] font-normal text-slate-400">/ {leaveBalances.elTotal ?? 30} d</span>
              </div>
              <div className="text-[9px] text-teal-300/80 font-medium">
                {isMl ? 'പ്രിവിലേജ് ലീവ് (എൻകാഷബിൾ)' : 'Privilege Leave (Encashable)'}
              </div>
            </div>

            {/* 3. HPL */}
            <div 
              onClick={() => {
                setLeaveType('HPL');
                setIsLeaveModalOpen(true);
              }}
              className="p-2 rounded-lg bg-[#041622] border border-indigo-500/35 hover:border-indigo-400/70 transition-all cursor-pointer"
              title="Half Pay Leave quota: 20 days"
            >
              <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold mb-0.5">
                <span>{isMl ? 'ഹാഫ് പേ ലീവ് (HPL)' : 'Half Pay Leave (HPL)'}</span>
                <span className="text-[9px] text-slate-400">20d</span>
              </div>
              <div className="text-base font-black font-mono text-indigo-300">
                {leaveBalances.hpl ?? 16} <span className="text-[10px] font-normal text-slate-400">/ {leaveBalances.hplTotal ?? 20} d</span>
              </div>
              <div className="text-[9px] text-indigo-300/80 font-medium">
                {isMl ? 'അർദ്ധവേതന അവധി (20 d)' : 'Half Pay Quota (20 d)'}
              </div>
            </div>

            {/* 4. Special Leave */}
            <div 
              onClick={() => {
                setLeaveType('SPL');
                setIsLeaveModalOpen(true);
              }}
              className="p-2 rounded-lg bg-[#041622] border border-purple-500/35 hover:border-purple-400/70 transition-all cursor-pointer"
              title="Special Leave quota: 15 days"
            >
              <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold mb-0.5">
                <span>{isMl ? 'സ്പെഷ്യൽ ലീവ് (Special)' : 'Special Leave (SPL)'}</span>
                <span className="text-[9px] text-slate-400">15d</span>
              </div>
              <div className="text-base font-black font-mono text-purple-300">
                {(leaveBalances.specialLeave ?? (leaveBalances as any).special) ?? 15} <span className="text-[10px] font-normal text-slate-400">/ {leaveBalances.specialLeaveTotal ?? 15} d</span>
              </div>
              <div className="text-[9px] text-purple-300/80 font-medium">
                {isMl ? 'SCL / SPL സ്പെഷ്യൽ ക്വാട്ട' : 'Special Casual Leave Quota'}
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Daily Attendance & Duty Log Section (Dark Glassmorphic matching Dashboard) */}
      <div className="bg-[#061825]/95 rounded-xl p-3 sm:p-4 border border-[#0f354c] shadow-xl text-white space-y-3">
        
        {/* Table Header with Month Switcher (November 2026 Active + Saved October 2026) & Filter Tabs */}
        <div className="flex flex-col gap-2.5 pb-2.5 border-b border-[#0e2c3e]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>
                  {isMl
                    ? `${MONTH_NAMES_ML[selectedLogMonth]} ${selectedLogYear} - പ്രതിദിന ഹാജർ വിവരങ്ങൾ`
                    : `${MONTH_FULL_NAMES[selectedLogMonth]} ${selectedLogYear} Daily Duty & Punch Logs`}
                </span>
                {selectedLogMonth === 9 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    ✓ Saved
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-cyan-300/80 font-mono mt-0.5">
                {selectedLogMonth === 10
                  ? (isMl ? 'പുതിയ മാസം (നവംബർ 2026) ആരംഭിച്ചു · ഒക്ടോബർ വിവരങ്ങൾ സേവ് ചെയ്തിട്ടുണ്ട്' : 'New Month (November 2026) Active · October 2026 is safely archived')
                  : (isMl ? 'ഒക്ടോബർ 2026 സേവ് ചെയ്ത ഹാജർ & ഓവർടൈം വിവരങ്ങൾ' : 'Archived October 2026 Biometric Duty & Overtime Records')}
              </p>
            </div>

            {/* Month Switcher Pill Bar: November 2026 (New Month) vs October 2026 (Saved) */}
            <div className="flex items-center gap-1.5 bg-[#04121b] p-1 rounded-xl border border-[#143e57] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedLogMonth(10)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedLogMonth === 10
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-xs'
                    : 'text-cyan-300 hover:bg-[#0a2536]'
                }`}
              >
                <span>{isMl ? 'നവംബർ 2026 (പുതിയ മാസം)' : 'Nov 2026 (Current)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedLogMonth(9)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedLogMonth === 9
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-amber-300/90 hover:bg-[#0a2536]'
                }`}
              >
                <span>{isMl ? 'ഒക്ടോബർ 2026 (Saved ✓)' : 'Oct 2026 (Saved ✓)'}</span>
              </button>
            </div>
          </div>

          {/* Filter Pills + Direct OT Register PDF/JPG/WhatsApp Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
            <div className="flex flex-wrap items-center gap-1">
              {(['ALL', 'PRESENT', 'OT', 'LEAVE', 'HOLIDAY'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeFilter === f
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-[#071d2b] border border-[#143e57] text-cyan-300 hover:bg-[#0d2a3c]'
                  }`}
                >
                  {f === 'ALL' && (isMl ? `എല്ലാം (${dailyLogs.length})` : `All (${dailyLogs.length})`)}
                  {f === 'PRESENT' && (isMl ? 'ഹാജർ' : 'Present')}
                  {f === 'OT' && (isMl ? `ഓവർടൈം (${dailyLogs.reduce((acc, r) => acc + (Number(r.otHours) || 0), 0)}h)` : `Overtime (${dailyLogs.reduce((acc, r) => acc + (Number(r.otHours) || 0), 0)}h)`)}
                  {f === 'LEAVE' && (isMl ? 'അവധി' : 'Leaves')}
                  {f === 'HOLIDAY' && (isMl ? 'അവധി ദിനങ്ങൾ' : 'Holidays')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsOtSheetModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="Download OT Sheet as PDF/JPG or Share on WhatsApp"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isMl ? 'OT ഷീറ്റ് ഡൗൺലോഡ് & വാട്സാപ്പ് ഷെയർ' : 'OT Sheet Download & WhatsApp'}</span>
            </button>
          </div>
        </div>


        {/* Daily Rows Table */}
        <div className="divide-y divide-[#0f354c] border border-[#0f354c] rounded-xl overflow-hidden">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((row) => {
              const isSelected = selectedDayNum === row.dayNum;
              return (
                <div
                  key={row.id}
                  onClick={() => {
                    setSelectedDayNum(row.dayNum);
                    handleOpenDutyPunch(row.dateStr, row.shiftCode, row.inTime, row.outTime, row.otHours, row.status, row.notes);
                  }}
                  className={`p-2.5 sm:p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#082a3e] border-l-4 border-cyan-400 shadow-sm'
                      : 'bg-[#041622]/90 hover:bg-[#072030]'
                  }`}
                  title={isMl ? `${row.dateStr} ഡ്യൂട്ടി വിശദാംശങ്ങൾ കാണാനും തിരുത്താനും ക്ലിക്ക് ചെയ്യുക` : `Click to view and edit details for ${row.dateStr}`}
                >
                {/* Date & Shift Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 border ${
                    row.status === 'On Duty'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                      : row.status === 'Present'
                      ? 'bg-[#072232] text-cyan-300 border-cyan-500/40'
                      : row.status === 'Holiday Duty'
                      ? 'bg-purple-950 text-purple-300 border-purple-500/50 shadow-xs'
                      : row.status === 'CSL Holiday'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-black/40 text-slate-400 border-slate-800'
                  }`}>
                    <span className="text-[9px] uppercase font-bold leading-none">{row.dayName.slice(0, 3)}</span>
                    <span className="text-sm font-black leading-none mt-0.5">{row.dayNum}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm">{row.dateStr}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-[#071d2b] text-cyan-300 border border-[#143e57] font-semibold">
                        {row.shift}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                      <span>IN: <strong className="text-cyan-300 font-bold">{row.inTime}</strong></span>
                      <span>·</span>
                      <span>OUT: <strong className="text-amber-300 font-bold">{row.outTime}</strong></span>
                    </div>

                    {/* Daily Duty Punch Log Badges: Note, Holiday, Leave, and Work */}
                    {(() => {
                      const noteKey = `${selectedLogYear}-${selectedLogMonth}-${row.dayNum}`;
                      const altNoteKey = `${selectedLogYear}-${selectedLogMonth + 1}-${row.dayNum}`;
                      const userDayNote = dayNotes[noteKey] || dayNotes[altNoteKey];
                      const userDayWork = dayWorks[noteKey] || dayWorks[altNoteKey] || row.work;

                      // Filter out auto-generated system strings from note
                      const rawNote = userDayNote || (!isGenericAutoNote(row.notes) ? row.notes : undefined);
                      const holidayDutyNote = (selectedLogMonth === 9 && row.dayNum === 21 && (row.inTime !== '—' || row.status === 'Holiday Duty'))
                        ? (isMl ? 'വിജയദശമി ഹോളിഡേ ഡ്യൂട്ടി (CO / സ്പെഷ്യൽ OT അർഹതയുണ്ട്)' : 'Holiday Duty: Vijayadasami Worked (CO / Special OT Eligible)')
                        : undefined;
                      const activeNote = rawNote || holidayDutyNote;

                      // Holiday check (month-aware)
                      const isHoliday = row.status === 'CSL Holiday' || row.status === 'Weekly Off' || row.status === 'Holiday Duty' || (selectedLogMonth === 9 && (row.dayNum === 21 || row.dayNum === 2)) || row.dayName === 'Sunday';
                      const holidayLabel = (selectedLogMonth === 9 && row.dayNum === 21)
                        ? (isMl ? 'വിജയദശമി (CSL ക്ലോസ്ഡ് അവധി)' : 'Vijayadasami (CSL Holiday)')
                        : (selectedLogMonth === 9 && row.dayNum === 2)
                        ? (isMl ? 'ഗാന്ധി ജയന്തി' : 'Gandhi Jayanti')
                        : row.dayName === 'Sunday'
                        ? (isMl ? 'സൺഡേ വീക്ക്‌ലി ഓഫ്' : 'Sunday Weekly Off')
                        : (isMl ? 'CSL അവധി (Holiday)' : 'CSL Holiday');

                      // Leave check
                      const leaveRecord = attendanceLeaveRecords[row.dayNum];
                      const isLeave = !!leaveRecord || (typeof row.status === 'string' && (row.status.includes('Leave') || row.status.includes('ലീവ്')));
                      const leaveLabel = leaveRecord 
                        ? `${leaveRecord.type} (${leaveRecord.duration || 'Full Day'})`
                        : row.status;

                      const hasAnyBadge = isHoliday || isLeave || !!activeNote || !!userDayWork;
                      if (!hasAnyBadge) return null;

                      return (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {/* 1. Holy Day Badge */}
                          {isHoliday && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-200 border border-purple-500/40 shadow-xs">
                              <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                              <strong className="text-purple-300 font-bold">{isMl ? 'ഹോളിഡേ:' : 'Holiday:'}</strong>
                              <span>{holidayLabel}</span>
                            </span>
                          )}

                          {/* 2. Leave Badge */}
                          {isLeave && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-200 border border-rose-500/40 shadow-xs">
                              <ClipboardCheck className="w-3 h-3 text-rose-400 shrink-0" />
                              <strong className="text-rose-300 font-bold">{isMl ? 'ലീവ്:' : 'Leave:'}</strong>
                              <span>{leaveLabel}</span>
                            </span>
                          )}

                          {/* 3. Note Badge */}
                          {activeNote && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-200 border border-amber-500/40 shadow-xs">
                              <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                              <strong className="text-amber-300 font-bold">{isMl ? 'നോട്ട്:' : 'Note:'}</strong>
                              <span className="max-w-[260px] sm:max-w-md truncate">{activeNote}</span>
                            </span>
                          )}

                          {/* 4. Work Badge (replacing memo) */}
                          {userDayWork && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-950/80 text-teal-200 border border-teal-500/40 shadow-xs">
                              <Pencil className="w-3 h-3 text-teal-400 shrink-0" />
                              <strong className="text-teal-300 font-bold">{isMl ? 'വർക്ക്:' : 'Work:'}</strong>
                              <span className="max-w-[260px] sm:max-w-md truncate">{userDayWork}</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Working Hours, OT & Status */}
                <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0 pt-1.5 md:pt-0 border-t md:border-t-0 border-[#0f354c]">
                  {row.otHours > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold font-mono">
                          +{row.otHours} hrs OT
                        </span>
                        <span className="text-[9px] font-bold font-mono text-amber-300/90">
                          {row.dayNum <= 19
                            ? (isMl ? 'നവംബർ 1 സാലറിയിൽ' : 'In Nov 1 Salary')
                            : (isMl ? 'ഡിസംബർ 1 സാലറിയിൽ' : 'In Dec 1 Salary')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHalfDayModalParams({
                            punchType: 'OUT',
                            dutyCategory: 'full_day_ot',
                            otHours: row.otHours,
                            time: row.outTime !== '—' && row.outTime !== 'On Duty' ? row.outTime : (CSL_SHIFTS[row.shiftCode as CslShiftCode]?.outTime || '05:20 PM'),
                            shiftCode: (row.shiftCode && row.shiftCode in CSL_SHIFTS) ? (row.shiftCode as CslShiftCode) : activeShift,
                            dateStr: row.dateStr,
                          });
                          setIsHalfDayModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-[10px] font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer active:scale-95"
                        title={isMl ? `ഫുൾ ഡേ + ${row.otHours}h OT വാട്സ്ആപ്പിൽ ഷെയർ ചെയ്യാം` : `Share Full Day + ${row.otHours}h OT on WhatsApp`}
                      >
                        <MessageSquare className="w-3 h-3 text-amber-400" />
                        <span>{isMl ? 'വാട്സ്ആപ്പ്' : 'Share'}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* Prominent Add/Edit Note & Work Button */}
                    {(() => {
                      const noteKey = `${selectedLogYear}-${selectedLogMonth}-${row.dayNum}`;
                      const altNoteKey = `${selectedLogYear}-${selectedLogMonth + 1}-${row.dayNum}`;
                      const hasExistingNote = !!(dayNotes[noteKey] || dayNotes[altNoteKey] || (!isGenericAutoNote(row.notes) ? row.notes : ''));
                      const hasExistingWork = !!(dayWorks[noteKey] || dayWorks[altNoteKey] || row.work);
                      const hasAny = hasExistingNote || hasExistingWork;

                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayNum(row.dayNum);
                            const curNote = dayNotes[noteKey] || dayNotes[altNoteKey] || (!isGenericAutoNote(row.notes) ? row.notes : '') || '';
                            const curWork = dayWorks[noteKey] || dayWorks[altNoteKey] || row.work || '';
                            setNoteDraft(curNote);
                            setWorkDraft(curWork);
                            setIsEditingNote(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#072030] hover:bg-[#0c3148] text-cyan-300 hover:text-white border border-[#0f354c] hover:border-cyan-500/50 transition-all cursor-pointer flex items-center gap-1.5 text-[11px] font-bold shadow-xs shrink-0"
                          title={isMl ? 'നോട്ട് / വർക്ക് ചേർക്കുക അല്ലെങ്കിൽ തിരുത്തുക' : 'Add / Edit Note & Work'}
                        >
                          <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{hasAny ? (isMl ? 'നോട്ട് / വർക്ക്' : 'Note/Work') : (isMl ? '+ നോട്ട് / വർക്ക്' : '+ Note / Work')}</span>
                        </button>
                      );
                    })()}

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        row.status === 'On Duty'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 animate-pulse'
                          : row.status === 'Present'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : row.status === 'Holiday Duty'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                          : row.status === 'CSL Holiday'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-900/80 text-slate-400 border border-slate-700/60'
                      }`}>
                        {row.status === 'On Duty' ? (isMl ? 'ഡ്യൂട്ടിയിൽ' : '● On Duty') : row.status}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {row.workHours}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-2 bg-[#041622]/90">
              <ClipboardCheck className="w-10 h-10 text-cyan-400/40 mx-auto" />
              <div className="font-bold text-white text-sm">
                {isMl ? 'ഈ മാസത്തിൽ ഇതുവരെ ഹാജർ രേഖപ്പെടുത്തിയിട്ടില്ല' : 'No Attendance Records Found'}
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isMl
                  ? 'നിങ്ങൾ ഡ്യൂട്ടി പഞ്ച് ചെയ്യുമ്പോഴോ ഹാജർ രേഖപ്പെടുത്തുമ്പോഴോ ഈ ലിസ്റ്റിൽ തത്സമയം ചേർക്കപ്പെടും.'
                  : 'Punch in for your daily shift or record attendance to see verified logs here.'}
              </p>
            </div>
          )}
        </div>

        {/* Link / CTA to open CslSalaryCalculator with this month's OT */}
        {onOpenSalary && (
          <div className="pt-1">
            <div
              onClick={onOpenSalary}
              className="rounded-xl p-3 bg-gradient-to-r from-[#032938] via-[#05374a] to-[#042633] border border-cyan-500/40 flex items-center justify-between gap-3 hover:border-cyan-400 transition-all cursor-pointer group shadow-sm text-white"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-cyan-200">
                    {(() => {
                      const monthOtTotal = dailyLogs.reduce((acc, r) => acc + (Number(r.otHours) || 0), 0);
                      const quarterOtTotal = calculateQuarterlyOtSummary(dailyLogs).totalOtUsed;
                      const displayOt = monthOtTotal > 0 ? monthOtTotal : quarterOtTotal;
                      const presentDaysCount = dailyLogs.filter(r => r.status === 'Present' || r.status === 'On Duty' || r.status === 'Holiday Duty').length;
                      return isMl
                        ? `ഈ മാസത്തെ ${displayOt} മണിക്കൂർ OT അടിസ്ഥാനമാക്കി ശമ്പളം കണക്കാക്കുക →`
                        : `Calculate Salary with ${presentDaysCount} Days & ${displayOt} OT Hours →`;
                    })()}
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    {isMl ? 'സി.എസ്.എൽ ഔദ്യോഗിക പേ-സ്കെയിൽ കാൽക്കുലേറ്ററിലേക്ക് നേരിട്ട് പോകുക' : 'Open official CSL Salary & OT Calculator with verified attendance hours'}
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#072030] border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Leave Application & Regularization Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#061825] rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-[#0f354c] text-white my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#0e2c3e] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#072030] text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {isMl ? 'അവധി / റെഗുലറൈസേഷൻ അപേക്ഷ' : 'Apply Leave / Shift Regularization'}
                  </h3>
                  <p className="text-[10px] text-cyan-300/80 font-mono">
                    Cochin Shipyard HR Portal · Online Form
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#072030] hover:bg-[#0a2e45] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border border-[#0f354c]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {leaveSuccessNotice ? (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{leaveSuccessNotice}</span>
              </div>
            ) : (
              <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
                {/* Leave Type Selector with Quota Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-300 text-[11px]">
                      {isMl ? 'അവധി വിഭാഗം തിരഞ്ഞെടുക്കുക (Leave Category):' : 'Select Leave Category:'}
                    </label>
                    <span className="text-[10px] font-mono text-cyan-300">
                      {isContract ? (
                        leaveType === 'CL' 
                          ? (isMl ? 'ബാക്കി: ' + leaveBalances.cl + ' d' : 'Bal: ' + leaveBalances.cl + ' d')
                          : (isMl ? 'മെഡിക്കൽ സർട്ടിഫിക്കറ്റ്' : 'Medical Certificate')
                      ) : (
                        leaveType === 'CL' 
                          ? (isMl ? 'ബാക്കി: ' + leaveBalances.cl + ' d' : 'Bal: ' + leaveBalances.cl + ' d')
                          : leaveType === 'EL'
                          ? (isMl ? 'ബാക്കി: ' + (leaveBalances.el ?? 24) + ' d' : 'Bal: ' + (leaveBalances.el ?? 24) + ' d')
                          : leaveType === 'HPL'
                          ? (isMl ? 'ബാക്കി: ' + (leaveBalances.hpl ?? 16) + ' d' : 'Bal: ' + (leaveBalances.hpl ?? 16) + ' d')
                          : leaveType === 'SPL'
                          ? (isMl ? 'ബാക്കി: ' + ((leaveBalances.specialLeave ?? (leaveBalances as any).special) ?? 15) + ' d' : 'Bal: ' + ((leaveBalances.specialLeave ?? (leaveBalances as any).special) ?? 15) + ' d')
                          : (isMl ? 'EL-ൽ നിന്ന് കുറയ്ക്കും' : 'Debited from EL')
                      )}
                    </span>
                  </div>

                  {/* Leave Type Selector Pills */}
                  {isContract ? (
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {/* CL */}
                      <button
                        type="button"
                        onClick={() => setLeaveType('CL')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          leaveType === 'CL'
                            ? 'bg-amber-950/80 border-amber-400 ring-1 ring-amber-400/50'
                            : 'bg-[#041622] border-[#0f354c] hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
                          <span>CL</span>
                          <span className="text-[9px] text-slate-400">{clOverallTotal}d</span>
                        </div>
                        <div className="text-sm font-black font-mono text-white mt-0.5">
                          {leaveBalances.cl} <span className="text-[9px] font-normal text-slate-400">/ {clOverallTotal}</span>
                        </div>
                        <div className="text-[9px] text-amber-400/80 truncate">
                          {isMl ? 'കാഷ്വൽ ലീവ്' : 'Casual Leave'}
                        </div>
                      </button>

                      {/* ML */}
                      <button
                        type="button"
                        onClick={() => setLeaveType('ML')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          leaveType === 'ML'
                            ? 'bg-rose-950/80 border-rose-400 ring-1 ring-rose-400/50'
                            : 'bg-[#041622] border-[#0f354c] hover:border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-rose-300">
                          <span>ML</span>
                          <span className="text-[9px] text-rose-300 bg-rose-950 px-1 py-0.5 rounded border border-rose-500/30">Medical</span>
                        </div>
                        <div className="text-sm font-black font-mono text-white mt-0.5">
                          {isMl ? 'മെഡിക്കൽ' : 'Medical'}
                        </div>
                        <div className="text-[9px] text-rose-300/80 truncate">
                          {isMl ? 'ഡോക്ടർ സർട്ടിഫിക്കറ്റ്' : 'Doctor Certificate'}
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                      {/* CL */}
                      <button
                        type="button"
                        onClick={() => setLeaveType('CL')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          leaveType === 'CL'
                            ? 'bg-amber-950/80 border-amber-400 ring-1 ring-amber-400/50'
                            : 'bg-[#041622] border-[#0f354c] hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
                          <span>CL</span>
                          <span className="text-[9px] text-slate-400">12d</span>
                        </div>
                        <div className="text-sm font-black font-mono text-white mt-0.5">
                          {leaveBalances.cl} <span className="text-[9px] font-normal text-slate-400">/ 12</span>
                        </div>
                        <div className="text-[9px] text-amber-400/80 truncate">
                          {isMl ? 'കാഷ്വൽ' : 'Casual'}
                        </div>
                      </button>

                      {/* EL */}
                      <button
                        type="button"
                        onClick={() => setLeaveType('EL')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          leaveType === 'EL'
                            ? 'bg-teal-950/80 border-teal-400 ring-1 ring-teal-400/50'
                            : 'bg-[#041622] border-[#0f354c] hover:border-teal-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-teal-300">
                          <span>EL / PL</span>
                          <span className="text-[9px] text-slate-400">30d</span>
                        </div>
                        <div className="text-sm font-black font-mono text-white mt-0.5">
                          {leaveBalances.el ?? 24} <span className="text-[9px] font-normal text-slate-400">/ 30</span>
                        </div>
                        <div className="text-[9px] text-teal-400/80 truncate">
                          {isMl ? 'ഏൺഡ്' : 'Earned'}
                        </div>
                      </button>

                      {/* HPL */}
                      <button
                        type="button"
                        onClick={() => setLeaveType('HPL')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          leaveType === 'HPL'
                            ? 'bg-indigo-950/80 border-indigo-400 ring-1 ring-indigo-400/50'
                            : 'bg-[#041622] border-[#0f354c] hover:border-indigo-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-indigo-300">
                          <span>HPL</span>
                          <span className="text-[9px] text-slate-400">20d</span>
                        </div>
                        <div className="text-sm font-black font-mono text-white mt-0.5">
                          {leaveBalances.hpl ?? 16} <span className="text-[9px] font-normal text-slate-400">/ 20</span>
                        </div>
                        <div className="text-[9px] text-indigo-400/80 truncate">
                          {isMl ? 'ഹാഫ് പേ' : 'Half Pay'}
                        </div>
                      </button>

                      {/* Special Leave (SPL) */}
                      <button
                        type="button"
                        onClick={() => setLeaveType('SPL')}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          leaveType === 'SPL'
                            ? 'bg-purple-950/80 border-purple-400 ring-1 ring-purple-400/50'
                            : 'bg-[#041622] border-[#0f354c] hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-purple-300">
                          <span>SPL</span>
                          <span className="text-[9px] text-slate-400">15d</span>
                        </div>
                        <div className="text-sm font-black font-mono text-white mt-0.5">
                          {(leaveBalances.specialLeave ?? (leaveBalances as any).special) ?? 15} <span className="text-[9px] font-normal text-slate-400">/ 15</span>
                        </div>
                        <div className="text-[9px] text-purple-400/80 truncate">
                          {isMl ? 'സ്പെഷ്യൽ' : 'Special'}
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Dropdown for fine selection including ML & RH */}
                  <div className="flex items-center gap-2">
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-[#041622] border border-[#0f354c] rounded-xl font-medium text-xs text-white focus:border-cyan-400 focus:outline-hidden cursor-pointer"
                    >
                      {isContract ? (
                        <>
                          <option value="CL">Casual Leave (CL) · കാഷ്വൽ ലീവ് ({leaveBalances.cl} / 12 Days remaining)</option>
                          <option value="ML">Medical Leave (ML) · മെഡിക്കൽ ലീവ് (Doctor Certificate)</option>
                        </>
                      ) : (
                        <>
                          <option value="CL">Casual Leave (CL) · കാഷ്വൽ ലീവ് ({leaveBalances.cl} / 12 Days remaining)</option>
                          <option value="EL">Earned Leave (EL / PL) · ഏൺഡ് ലീവ് ({leaveBalances.el ?? 24} / 30 Days remaining)</option>
                          <option value="HPL">Half Pay Leave (HPL) · ഹാഫ് പേ ലീവ് ({leaveBalances.hpl ?? 16} / 20 Days remaining)</option>
                          <option value="SPL">Special Leave (SPL / SCL) · സ്പെഷ്യൽ ലീവ് ({(leaveBalances.specialLeave ?? (leaveBalances as any).special) ?? 15} / 15 Days remaining)</option>
                          <option value="ML">Medical Leave (ML) · മെഡിക്കൽ ലീവ് (Debited from EL balance)</option>
                          <option value="RH">Restricted Holiday (RH) · നിയന്ത്രിത അവധി ({leaveBalances.rh ?? 2} Days remaining)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Date & Number of Days */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1 text-[11px]">
                      {isMl ? 'തീയതി (Date):' : 'From Date:'}
                    </label>
                    <input
                      type="date"
                      value={leaveDate}
                      onChange={(e) => setLeaveDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#041622] border border-[#0f354c] rounded-xl font-mono text-xs text-white focus:border-cyan-400 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1 text-[11px]">
                      {isMl ? 'ദിവസങ്ങളുടെ എണ്ണം:' : 'No. of Days:'}
                    </label>
                    <select
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#041622] border border-[#0f354c] rounded-xl font-medium text-xs text-white focus:border-cyan-400 focus:outline-hidden cursor-pointer"
                    >
                      <option value="0.5">0.5 Day (Half Day · അര ലീവ്)</option>
                      <option value="1">1.0 Day (Full Day · ഒരു ലീവ്)</option>
                      <option value="1.5">1.5 Days (ഒന്നര ലീവ്)</option>
                      <option value="2">2.0 Days (രണ്ട് ലീവ്)</option>
                      <option value="2.5">2.5 Days (രണ്ടര ലീവ്)</option>
                      <option value="3">3.0 Days</option>
                      <option value="5">5.0 Days</option>
                    </select>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block font-bold text-slate-300 mb-1 text-[11px]">
                    {isMl ? 'കാരണം (Reason for Leave):' : 'Reason / Remarks:'}
                  </label>
                  <textarea
                    rows={2}
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Enter reason for leave..."
                    className="w-full px-3 py-2 bg-[#041622] border border-[#0f354c] rounded-xl font-medium text-xs text-white focus:border-cyan-400 focus:outline-hidden"
                    required
                  />
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLeaveModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#072030] hover:bg-[#0a2e45] text-slate-300 font-bold transition-colors cursor-pointer border border-[#0f354c]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#00a8cc] hover:bg-[#00b4d8] text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isMl ? 'അപേക്ഷ സമർപ്പിക്കുക' : 'Submit Application'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Leave Quotas Setup Modal (Matching Screenshot 213907) */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#061825] rounded-2xl p-4 sm:p-5 w-full max-w-lg shadow-2xl border border-[#0f354c] text-white my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#0e2c3e] mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    CSL Leave Quotas & Entitlements
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    CSL QUOTA SETUP
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isContract
                    ? (isMl 
                        ? 'കരാർ ജീവനക്കാരുടെ കാഷ്വൽ ലീവ് (CL) പ്രാരംഭ ക്വാട്ട നൽകുക.' 
                        : 'Configure your opening quota for Casual Leave (CL).')
                    : (isMl 
                        ? 'കാഷ്വൽ ലീവ് (CL), ഹാഫ് പേ ലീവ് (HPL), ഏൺഡ് ലീവ് (EL), സ്പെഷ്യൽ ലീവ് എന്നിവയുടെ പ്രാരംഭ ക്വാട്ട നൽകുക.' 
                        : 'Configure your opening quotas for Casual Leave (CL), Half Pay Leave (HPL), Earned Leave (EL), and Special Leave.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuotaModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#072030] hover:bg-[#0a2e45] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border border-[#0f354c] shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotas} className="space-y-4">
              {/* 1. CASUAL LEAVE (CL) SECTION */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs sm:text-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span>
                      {isMl 
                        ? `CSL കാഷ്വൽ ലീവ് ക്വാട്ട (CL – ${Math.round(((Math.max(0, parseFloat(editP1) || 0)) + (isContract ? 0 : (Math.max(0, parseFloat(editP2) || 0)))) * 10) / 10} എണ്ണം)` 
                        : `CSL Casual Leave Quota (CL – ${Math.round(((Math.max(0, parseFloat(editP1) || 0)) + (isContract ? 0 : (Math.max(0, parseFloat(editP2) || 0)))) * 10) / 10} Days)`}
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs tracking-tight shrink-0">
                    {isMl ? `ആകെ CL: ${Math.round(((Math.max(0, parseFloat(editP1) || 0)) + (isContract ? 0 : (Math.max(0, parseFloat(editP2) || 0)))) * 10) / 10} Days` : `Total CL: ${Math.round(((Math.max(0, parseFloat(editP1) || 0)) + (isContract ? 0 : (Math.max(0, parseFloat(editP2) || 0)))) * 10) / 10} Days`}
                  </div>
                </div>

                {isContract ? (
                  /* Contract Employee: ONLY single CL Quota input, NO Phase 2! */
                  <div className="bg-[#04121b] rounded-xl p-3.5 border border-amber-500/40 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
                        {isMl ? 'കാഷ്വൽ ലീവ് (CL) ക്വാട്ട' : 'CASUAL LEAVE (CL) QUOTA'}
                      </div>
                      <span className="text-[10px] font-bold text-amber-300/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        {isMl ? 'കോൺട്രാക്ട്' : 'Contract'}
                      </span>
                    </div>
                    <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1.5 px-3 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition-all">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="30"
                        value={editP1}
                        onChange={(e) => setEditP1(e.target.value)}
                        className="w-full text-center text-xl sm:text-2xl font-black font-mono text-amber-300 bg-transparent focus:outline-none"
                      />
                      <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                        Days
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1.5">
                      {isMl ? `കമ്പനി ഓൺ കോൺട്രാക്ട് CL അർഹത: ${editP1 || 0} ദിവസങ്ങൾ` : `Company on Contract CL Entitlement: ${editP1 || 0} Days`}
                    </div>
                  </div>
                ) : (
                  /* Permanent Employee: Phase 1 & Phase 2 Independent Inputs */
                  <div className="space-y-2.5">
                    {/* Phase 1 */}
                    <div className="bg-[#04121b] rounded-xl p-3 border border-[#0f354c] shadow-sm">
                      <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider mb-1.5">
                        {isMl ? 'CL PHASE 1 (JAN – JUN) · ഫേസ് 1' : 'CL PHASE 1 (JAN – JUN)'}
                      </div>
                      <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition-all">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="30"
                          value={editP1}
                          onChange={(e) => setEditP1(e.target.value)}
                          className="w-full text-center text-xl sm:text-2xl font-black font-mono text-amber-300 bg-transparent focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                          Days
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {isMl ? `CSL ഒന്നാം ഘട്ടം: ${editP1 || 0} ലീവുകൾ` : `CSL Phase 1: ${editP1 || 0} Leaves`}
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="bg-[#04121b] rounded-xl p-3 border border-[#0f354c] shadow-sm">
                      <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider mb-1.5">
                        {isMl ? 'CL PHASE 2 (JUL – DEC) · ഫേസ് 2' : 'CL PHASE 2 (JUL – DEC)'}
                      </div>
                      <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/30 transition-all">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="30"
                          value={editP2}
                          onChange={(e) => setEditP2(e.target.value)}
                          className="w-full text-center text-xl sm:text-2xl font-black font-mono text-amber-300 bg-transparent focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                          Days
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {isMl ? `CSL രണ്ടാം ഘട്ടം: ${editP2 || 0} ലീവുകൾ` : `CSL Phase 2: ${editP2 || 0} Leaves`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. HPL & EL SECTION - Permanent Only */}
              {!isContract && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs sm:text-sm">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <span>
                        {isMl ? 'HPL (ഹാഫ് പേ ലീവ്) & EL (ഏൺഡ് ലീവ്)' : 'HPL & EL Quotas'}
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
                        {isMl ? 'HPL (HALF PAY LEAVE) · എച്ച്.പി.എൽ' : 'HPL (HALF PAY LEAVE)'}
                      </div>
                      <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/30 transition-all">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="90"
                          value={editHpl}
                          onChange={(e) => setEditHpl(e.target.value)}
                          className="w-full text-center text-xl sm:text-2xl font-black font-mono text-cyan-300 bg-transparent focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                          Days
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {isMl ? 'ഹാഫ് പേ ലീവ് (വർഷം 20 Days)' : 'Half Pay Leave (20 Days/Year)'}
                      </div>
                    </div>

                    {/* EL */}
                    <div className="bg-[#04121b] rounded-xl p-3 border border-[#0f354c] shadow-sm">
                      <div className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider mb-1.5">
                        {isMl ? 'EL (EARNED LEAVE) · ഏൺഡ് ലീവ്' : 'EL (EARNED LEAVE)'}
                      </div>
                      <div className="relative flex items-center justify-center bg-[#020b12] rounded-lg border border-[#144254] py-1 px-3 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400/30 transition-all">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="120"
                          value={editEl}
                          onChange={(e) => setEditEl(e.target.value)}
                          className="w-full text-center text-xl sm:text-2xl font-black font-mono text-teal-300 bg-transparent focus:outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                          Days
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {isMl ? 'ഏൺഡ് ലീവ് / പ്രിവിലേജ് ലീവ് (വർഷം 30 Days)' : 'Earned Leave / Privilege Leave (30 Days/Year)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SPECIAL LEAVE SECTION - Permanent Only */}
              {!isContract && (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-purple-400 text-xs sm:text-sm">
                      <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                      <span>
                        {isMl ? 'SPECIAL LEAVE · സ്പെഷ്യൽ ലീവ് (SCL / SPL)' : 'SPECIAL LEAVE (SCL / SPL)'}
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
                        value={editScl}
                        onChange={(e) => setEditScl(e.target.value)}
                        className="w-full text-center text-xl sm:text-2xl font-black font-mono text-purple-300 bg-transparent focus:outline-none"
                      />
                      <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">
                        Days
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {isMl 
                        ? 'രക്തദാനം, ഔദ്യോഗിക സ്പോർട്സ്, പിതൃത്വ അവധി (15 Days)' 
                        : 'Blood donation, official sports, paternity leave (15 Days)'}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#0e2c3e]">
                <button
                  type="button"
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#072030] hover:bg-[#0a2e45] text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-[#0f354c]"
                >
                  {isMl ? 'റദ്ദാക്കുക' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#00a8cc] hover:bg-[#00b4d8] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>{isMl ? 'ക്വാട്ട സേവ് ചെയ്യുക' : 'Save Quotas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Punch Out & Overtime Calculation Modal */}
      {isPunchOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#061825] rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-[#0f354c] text-white my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#0e2c3e] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>{isMl ? 'പഞ്ച്-ഔട്ട് & ഓവർടൈം (OT)' : 'Punch Out & Overtime (OT)'}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-950/90 text-teal-300 border border-teal-500/40">
                      {CSL_SHIFTS[activeShift].name}
                    </span>
                  </h3>
                  <p className="text-[10px] text-cyan-300/80 font-mono">
                    {isMl ? 'ഡ്യൂട്ടി സമയം കണക്കുകൂട്ടി രേഖപ്പെടുത്തുക' : 'Calculate duty hours & log into CSL attendance'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPunchOutModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#072030] hover:bg-[#0a2e45] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border border-[#0f354c]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Selected Shift Information Banner */}
              <div className="p-2.5 rounded-xl bg-[#041622] border border-[#0f354c] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <div className="font-bold text-white text-xs">
                    {CSL_SHIFTS[activeShift].name} · {isMl ? CSL_SHIFTS[activeShift].nameMl : CSL_SHIFTS[activeShift].descriptionEn}
                  </div>
                  <div className="text-slate-400 mt-0.5 font-mono text-[10px]">
                    {CSL_SHIFTS[activeShift].inTime} – {CSL_SHIFTS[activeShift].outTime} ({CSL_SHIFTS[activeShift].duration})
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[9px] uppercase font-bold text-slate-400">
                    {isMl ? 'പഞ്ച്-ഇൻ ചെയ്ത സമയം' : 'Punched In At'}
                  </div>
                  <div className="font-mono font-black text-amber-300 text-xs">
                    {lastPunchTime}
                  </div>
                </div>
              </div>

              {/* Permanent Employee 5-Minute Grace Time Banner */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#032a38] via-[#05374a] to-[#042633] border border-cyan-500/40 text-xs text-white space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="font-bold text-white text-xs">
                      {isMl ? 'പെർമനന്റ് ഗ്രേസ് ടൈം (Permanent Grace):' : 'Permanent Employee 5-Min Grace:'}
                    </span>
                  </div>
                  <span className="px-2 py-0.2 rounded-md font-mono font-bold text-cyan-200 bg-cyan-950/80 border border-cyan-500/40 text-[10px]">
                    ±5 Mins CSL Rule
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 font-medium text-[10px] text-cyan-200 font-mono">
                  <div className="bg-[#041622] p-1.5 rounded-lg border border-[#0f354c] flex items-center justify-between">
                    <span>{isMl ? 'ഇൻ ഗ്രേസ്:' : 'In-Grace:'}</span>
                    <strong className="text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      {CSL_SHIFTS[activeShift].graceDeadline}
                    </strong>
                  </div>
                  <div className="bg-[#041622] p-1.5 rounded-lg border border-[#0f354c] flex items-center justify-between">
                    <span>{isMl ? 'ഔട്ട് ഗ്രേസ്:' : 'Out-Grace:'}</span>
                    <strong className="text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/30">
                      {getCslEarlyOutGraceTime(activeShift)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Punch Out Time Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300 text-[11px]">
                    {isMl ? 'പഞ്ച്-ഔട്ട് സമയം തിരഞ്ഞെടുക്കുക:' : 'Select Punch-Out Time:'}
                  </label>
                  <span className="text-[10px] font-bold text-cyan-300 font-mono">
                    {selectedPunchOutTime}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { label: isMl ? '5m ഗ്രേസ്' : '5m Early Grace', time: getCslEarlyOutGraceTime(activeShift), ot: 0, tag: 'Grace' },
                    { label: isMl ? 'റഗുലർ' : 'Regular End', time: CSL_SHIFTS[activeShift].outTime, ot: 0, tag: 'Official' },
                    { label: isMl ? 'തത്സമയം' : 'Live (Now)', time: currentTime, ot: 0, tag: 'Live' },
                    { label: isMl ? '+1h OT' : '+1h OT', time: getShiftTimeWithOt(activeShift, 1.0), ot: 1.0, tag: '1.0h OT' },
                    { label: isMl ? '+2h OT' : '+2h OT', time: getShiftTimeWithOt(activeShift, 2.0), ot: 2.0, tag: '2.0h OT' },
                  ].map((preset) => {
                    const isSelected = selectedPunchOutTime === preset.time;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setSelectedPunchOutTime(preset.time);
                          setSelectedOtHours(preset.ot);
                        }}
                        className={`p-1.5 sm:p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs scale-[1.02]'
                            : 'bg-[#071d2b] border border-[#143e57] text-cyan-300 hover:bg-[#0d2a3c]'
                        }`}
                      >
                        <div className="font-bold text-[10px] truncate">{preset.label}</div>
                        <div className={`font-mono font-black text-[11px] mt-0.5 ${isSelected ? 'text-slate-950 font-black' : 'text-white'}`}>
                          {preset.time}
                        </div>
                        <div className={`text-[8px] font-semibold mt-0.5 ${isSelected ? 'text-slate-900' : 'text-cyan-400'}`}>
                          {preset.tag}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Time or Live IST option */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <input
                  type="text"
                  value={selectedPunchOutTime}
                  onChange={(e) => setSelectedPunchOutTime(e.target.value)}
                  placeholder="HH : MM AM/PM"
                  className="flex-1 px-2.5 py-1.5 bg-[#041622] border border-[#0f354c] rounded-xl font-mono font-semibold text-white focus:border-cyan-400 text-xs focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPunchOutTime(currentTime);
                    const schedSec = CSL_SHIFTS[activeShift].durationMinutes * 60;
                    if (elapsedDutySeconds > schedSec) {
                      const extraSec = elapsedDutySeconds - schedSec;
                      // CSL Rule: No half-hour OT. Strictly whole hours (>= 50 mins = 1h, etc.)
                      const wholeOt = extraSec >= 3000 ? Math.floor((extraSec + 600) / 3600) : 0;
                      setSelectedOtHours(wholeOt);
                    } else {
                      setSelectedOtHours(0);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#072030] hover:bg-[#0a2e45] text-cyan-300 font-bold text-xs transition-colors cursor-pointer border border-[#0f354c]"
                >
                  {isMl ? `തത്സമയം (${currentTime})` : `Live (${currentTime})`}
                </button>
              </div>

              {/* Overtime (OT) Auto-Calculated Display */}
              {(() => {
                const def = CSL_SHIFTS[activeShift];
                const inT = localStorage.getItem('csl_today_punch_in_time') || (lastPunchTime && lastPunchTime !== '—' && lastPunchTime !== 'On Duty' ? lastPunchTime : def.inTime);
                const calc = calculateDutyAndOT(inT, selectedPunchOutTime, activeShift, true);
                const autoOt = calc.otHours;

                return (
                  <div className="p-2.5 rounded-xl bg-[#03231f] border border-emerald-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-xs text-white">
                          {isMl ? 'ഓട്ടോമാറ്റിക് ഓവർടൈം (OT):' : 'Automatic Overtime:'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border ${
                        autoOt > 0 
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-black' 
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {autoOt > 0 ? `+${autoOt} hrs OT` : (isMl ? '0 OT (റെഗുലർ)' : '0 OT')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Live Duty Calculation Summary Breakdown Card */}
              <div className="p-3 rounded-xl bg-[#041622] border border-[#0f354c] text-white space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  {isMl ? 'ഡ്യൂട്ടി & ഓവർടൈം സംഗ്രഹം:' : 'Duty & OT Breakdown:'}
                </div>
                
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#0e2c3e] text-center font-mono">
                  <div className="bg-[#071d2b] p-1.5 rounded-lg border border-[#143e57]">
                    <div className="text-[9px] text-slate-400 uppercase">
                      {isMl ? 'റെഗുലർ' : 'Regular'}
                    </div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {CSL_SHIFTS[activeShift].duration}
                    </div>
                  </div>

                  <div className="bg-[#071d2b] p-1.5 rounded-lg border border-[#143e57]">
                    <div className="text-[9px] text-cyan-400 uppercase">
                      {isMl ? 'ഓവർടൈം' : 'Overtime'}
                    </div>
                    <div className="text-xs font-black text-amber-300 mt-0.5">
                      {selectedOtHours > 0 ? `+${selectedOtHours}h` : '0h'}
                    </div>
                  </div>

                  <div className="bg-[#071d2b] p-1.5 rounded-lg border border-emerald-500/40">
                    <div className="text-[9px] text-emerald-300 uppercase">
                      {isMl ? 'ആകെ' : 'Total'}
                    </div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">
                      {(() => {
                        const totMin = CSL_SHIFTS[activeShift].durationMinutes + Math.round(selectedOtHours * 60);
                        return `${Math.floor(totMin / 60)}h ${(totMin % 60).toString().padStart(2, '0')}m`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Confirm & Cancel */}
              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPunchOutModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#072030] hover:bg-[#0a2e45] text-slate-300 font-bold transition-colors cursor-pointer border border-[#0f354c]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmPunchOut(selectedPunchOutTime, selectedOtHours)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 text-xs"
                >
                  <Fingerprint className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{isMl ? 'പഞ്ച്-ഔട്ട് രേഖപ്പെടുത്തുക' : 'Confirm Punch Out'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Day Note & Work Editor Modal (Supporting Note, Holiday duty notes, and Work details) */}
      {isEditingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#061825] rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-[#0f354c] text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#0e2c3e] mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-950/80 text-teal-300 border border-teal-500/40 flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {isMl ? `${MONTH_NAMES_ML[selectedLogMonth]} ${selectedDayNum}: നോട്ട് & വർക്ക് വിവരങ്ങൾ` : `${MONTH_SHORT_NAMES[selectedLogMonth]} ${selectedDayNum}: Note & Work Details`}
                  </h3>
                  <p className="text-[10px] text-cyan-300/80 font-mono">
                    {isMl ? 'ഡെയിലി ഡ്യൂട്ടി ലോഗിലും കലണ്ടറിലും കാണിക്കുന്ന വിവരങ്ങൾ' : 'Displayed in Daily Punch Logs & Calendar'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                className="w-7 h-7 rounded-full bg-[#072030] hover:bg-[#0a2e45] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border border-[#0f354c]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Field 1: Custom Note (എന്തെങ്കിലും Note add ചെയ്യാം) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isMl ? 'ഡ്യൂട്ടി കുറിപ്പ് / നോട്ട് (Note):' : 'Duty Note / Remarks:'}</span>
                  </label>
                  {noteDraft && (
                    <button
                      type="button"
                      onClick={() => setNoteDraft('')}
                      className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder={isMl ? 'എന്തെങ്കിലും നോട്ട് ഇവിടെ ടൈപ്പ് ചെയ്യുക (ഉദാ: വിജയദശമി ഹോളിഡേ ഡ്യൂട്ടി · CO / സ്പെഷ്യൽ OT അർഹതയുണ്ട്)...' : 'Type any custom note here (e.g. Holiday Duty Worked · CO Eligible)...'}
                  className="w-full p-2.5 bg-[#041622] border border-[#0f354c] rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-hidden"
                />
                {/* Quick Note Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {[
                    { label: isMl ? 'ഹോളിഡേ ഡ്യൂട്ടി' : 'Holiday Duty', text: isMl ? 'വിജയദശമി ഹോളിഡേ ഡ്യൂട്ടി (CO / സ്പെഷ്യൽ OT അർഹതയുണ്ട്)' : 'Holiday Duty Worked (CO / Special OT Eligible)' },
                    { label: isMl ? 'സ്പെഷ്യൽ ഡ്യൂട്ടി' : 'Special Duty', text: isMl ? 'സ്പെഷ്യൽ യാർഡ് ഡ്യൂട്ടി (Special Yard Duty)' : 'Special Yard Duty' },
                    { label: isMl ? 'ഓവർടൈം വർക്ക്' : 'Overtime', text: isMl ? 'അധിക ഓവർടൈം ജോലി (Overtime Work)' : 'Overtime Duty Work' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setNoteDraft(chip.text)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#072030] hover:bg-[#0c3148] text-amber-200 border border-amber-500/30 cursor-pointer transition-colors"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Work Details (formerly memo) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isMl ? 'വർക്ക് വിവരങ്ങൾ (Work Details):' : 'Work Description (Work):'}</span>
                  </label>
                  {workDraft && (
                    <button
                      type="button"
                      onClick={() => setWorkDraft('')}
                      className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={workDraft}
                  onChange={(e) => setWorkDraft(e.target.value)}
                  placeholder={isMl ? 'അന്നത്തെ ജോലി / വർക്ക് വിവരങ്ങൾ ടൈപ്പ് ചെയ്യുക (ഉദാ: ബിൽഡിംഗ് ഡോക്ക് യാർഡ് വർക്ക്)...' : 'Enter work details (e.g. Building Dock Yard Work, Hull Fabrication)...'}
                  className="w-full p-2.5 bg-[#041622] border border-[#0f354c] rounded-xl text-xs text-white placeholder-slate-500 focus:border-teal-400 focus:outline-hidden"
                />
                {/* Quick Work Preset Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {[
                    { label: isMl ? 'യാർഡ് വർക്ക്' : 'Yard Work', text: isMl ? 'ബിൽഡിംഗ് ഡോക്ക് യാർഡ് വർക്ക് (Building Dock Yard Work)' : 'Building Dock Yard Work' },
                    { label: isMl ? 'ഫാബ്രിക്കേഷൻ' : 'Fabrication', text: isMl ? 'ഷിപ്പ് റിപ്പയർ ഫാബ്രിക്കേഷൻ (Ship Repair Fabrication)' : 'Ship Repair Fabrication' },
                    { label: isMl ? 'ഹൾ ഇൻസ്പെക്ഷൻ' : 'Hull Inspection', text: isMl ? 'ഡ്രൈ ഡോക്ക് ഹൾ ഇൻസ്പെക്ഷൻ (Dry Dock Hull Inspection)' : 'Dry Dock Hull Inspection' },
                    { label: isMl ? 'മെയിന്റനൻസ്' : 'Maintenance', text: isMl ? 'ഇലക്ട്രിക്കൽ / മെക്കാനിക്കൽ മെയിന്റനൻസ്' : 'Electrical & Mechanical Maintenance' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setWorkDraft(chip.text)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#072030] hover:bg-[#0c3148] text-teal-200 border border-teal-500/30 cursor-pointer transition-colors"
                    >
                      + {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Delete, Cancel, Save */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#0e2c3e]">
                <button
                  type="button"
                  onClick={handleDeleteNoteForDay}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-500/40 cursor-pointer transition-colors"
                >
                  {isMl ? 'രണ്ടും ഒഴിവാക്കുക' : 'Clear All'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#072030] hover:bg-[#0a2e45] text-slate-300 text-xs font-bold border border-[#0f354c] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNoteForDay}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {isMl ? 'സേവ് ചെയ്യുക' : 'Save Note & Work'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duty Punch Modal (Matching User's Screenshots 1:1) */}
      <DutyPunchModal
        isOpen={isDutyPunchModalOpen}
        onClose={() => setIsDutyPunchModalOpen(false)}
        onSave={handleSaveDutyPunch}
        initialDate={activePunchDate}
        initialShift={activePunchShift}
        initialInTime={activePunchIn}
        initialOutTime={activePunchOut}
        initialOt={activePunchOt}
        initialLeave={activePunchLeave}
        initialHalfDay={activePunchHalfDay}
        initialNotes={activePunchNotes}
        language={language}
        currentUser={currentUser}
      />

      {/* Duty & WhatsApp Share Modal (Full Day + OT, Half Day, Full Day) */}
      <HalfDayWhatsAppShareModal
        isOpen={isHalfDayModalOpen}
        onClose={() => setIsHalfDayModalOpen(false)}
        language={language}
        defaultDutyCategory={halfDayModalParams.dutyCategory === 'full_day_ot' ? 'full_day_ot' : 'half_day'}
        defaultOtHours={halfDayModalParams.otHours || 1}
        defaultPunchType={halfDayModalParams.punchType || 'IN'}
        defaultTime={halfDayModalParams.time}
        defaultDate={halfDayModalParams.dateStr || `${getIstDate().getFullYear()}-${String(getIstDate().getMonth() + 1).padStart(2, '0')}-${String(getIstDate().getDate()).padStart(2, '0')}`}
        defaultShift={halfDayModalParams.shiftCode || activeShift}
        defaultSession={halfDayModalParams.session === 'Second Half' ? 'Second Half' : 'First Half'}
        currentUser={currentUser}
        onPunchRecorded={handleHalfDayPunchRecorded}
      />

      {/* Quarterly OT Cap Modal (75h vs 120h per 3-month cycle) */}
      <QuarterlyOtModal
        isOpen={isQuarterlyOtModalOpen}
        onClose={() => setIsQuarterlyOtModalOpen(false)}
        language={language}
        dailyLogs={dailyLogs}
      />

      {/* OT Sheet PDF / JPG / WhatsApp Share Modal */}
      <CslNextMonthOtViewerModal
        isOpen={isOtSheetModalOpen}
        onClose={() => setIsOtSheetModalOpen(false)}
        data={buildUnifiedOtRegisterPdfData(dailyLogs, new Date(selectedLogYear, selectedLogMonth, 15), {
          name: currentUser.name,
          token: currentUser.token,
          department: currentUser.department,
          isContract,
        })}
        language={language}
      />

      </div>
    </div>
  );
};
