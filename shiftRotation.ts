/**
 * Cochin Shipyard Limited (CSL) - Weekly Shift Rotation Engine
 * എ ടു (A2) ഷിഫ്റ്റും ബി ടു (B2) ഷിഫ്റ്റും ഓരോ ആഴ്ചയിലും മാറി മാറി വരുന്നു
 * (A2 Shift and B2 Shift alternate every week)
 */

import { CslShiftCode, CSL_SHIFTS } from '../data/cslShifts';

export interface ShiftRotationConfig {
  anchorDate: string; // 'YYYY-MM-DD' - Monday of the reference week
  anchorShift: 'A2' | 'B2'; // Shift for the reference week
  weekStartsOn: 1 | 0; // 1 = Monday, 0 = Sunday (default 1)
  autoRotate: boolean;
}

const STORAGE_KEY = 'csl_shift_rotation_config';
const SWAPS_STORAGE_KEY = 'csl_shift_swaps_overrides';

// Default configuration: Reference week starting Oct 12, 2026 is Shift A2
// Therefore Oct 12 - 18 = Shift A2, Oct 19 - 25 = Shift B2, Oct 26 - Nov 1 = Shift A2...
export const DEFAULT_ROTATION_CONFIG: ShiftRotationConfig = {
  anchorDate: '2026-10-12', // Monday of current mid-October 2026 week
  anchorShift: 'A2',
  weekStartsOn: 1, // Monday
  autoRotate: true,
};

export const getRotationConfig = (): ShiftRotationConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.anchorDate && (parsed.anchorShift === 'A2' || parsed.anchorShift === 'B2')) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_ROTATION_CONFIG;
};

export const saveRotationConfig = (config: ShiftRotationConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('csl-shift-rotation-changed', { detail: config }));
  } catch {}
};

// Get the Monday (or configured start day) for a given date
export const getWeekStartDate = (date: Date, weekStartsOn: number = 1): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sun, 1 = Mon ...
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Formats a date to YYYY-MM-DD in local time
export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Parse 'YYYY-MM-DD' string safely
export const parseDateKey = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date();
};

// Helper: Calculate week difference in integer weeks between two dates
export const getWeekDiff = (d1: Date, d2: Date, weekStartsOn: number = 1): number => {
  const start1 = getWeekStartDate(d1, weekStartsOn);
  const start2 = getWeekStartDate(d2, weekStartsOn);
  const diffMs = start1.getTime() - start2.getTime();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  return Math.round(diffMs / oneWeekMs);
};

// Get specific day shift swaps / overrides
export const getShiftOverrides = (): Record<string, CslShiftCode> => {
  try {
    const saved = localStorage.getItem(SWAPS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
};

export const saveShiftOverride = (dateKey: string, shift: CslShiftCode | null): void => {
  try {
    const current = getShiftOverrides();
    if (shift === null) {
      delete current[dateKey];
    } else {
      current[dateKey] = shift;
    }
    localStorage.setItem(SWAPS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('csl-shift-rotation-changed', { detail: { dateKey, shift } }));
  } catch {}
};

/**
 * Calculates the exact shift for any given date based on the weekly A2 ↔ B2 rotation
 */
export const getWeeklyShiftForDate = (
  targetDate: Date | string,
  customConfig?: ShiftRotationConfig
): {
  shiftCode: 'A2' | 'B2';
  isOverridden: boolean;
  actualShiftCode: CslShiftCode;
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  isCurrentWeek: boolean;
  isNextWeek: boolean;
  shiftDef: typeof CSL_SHIFTS['A2'];
} => {
  const date = typeof targetDate === 'string' ? parseDateKey(targetDate) : new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const config = customConfig || getRotationConfig();
  const anchorDate = parseDateKey(config.anchorDate);

  const weekStart = getWeekStartDate(date, config.weekStartsOn);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const diffWeeks = getWeekDiff(date, anchorDate, config.weekStartsOn);
  // If even number of weeks difference -> same as anchorShift
  // If odd number of weeks difference -> alternate shift
  const isOpposite = Math.abs(diffWeeks) % 2 === 1;
  const standardShift: 'A2' | 'B2' = isOpposite
    ? config.anchorShift === 'A2' ? 'B2' : 'A2'
    : config.anchorShift;

  // Check if there is an explicit day override
  const dateKey = formatDateKey(date);
  const overrides = getShiftOverrides();
  const overrideShift = overrides[dateKey];
  const actualShiftCode = overrideShift || standardShift;

  const today = new Date();
  const currentWeekStart = getWeekStartDate(today, config.weekStartsOn);
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const isNextWeek = weekStart.getTime() === nextWeekStart.getTime();

  // Simple ISO-ish week number
  const tempDate = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  tempDate.setDate(tempDate.getDate() - dayNr + 3);
  const firstThursday = tempDate.valueOf();
  tempDate.setMonth(0, 1);
  if (tempDate.getDay() !== 4) {
    tempDate.setMonth(0, 1 + ((4 - tempDate.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - tempDate.valueOf()) / 604800000);

  return {
    shiftCode: standardShift,
    isOverridden: !!overrideShift,
    actualShiftCode,
    weekStart,
    weekEnd,
    weekNumber: Math.max(1, weekNumber),
    isCurrentWeek,
    isNextWeek,
    shiftDef: CSL_SHIFTS[actualShiftCode],
  };
};

/**
 * Returns current week and next week's shift summary
 */
export const getCurrentAndNextWeekShift = (customConfig?: ShiftRotationConfig) => {
  const today = new Date();
  const config = customConfig || getRotationConfig();

  const current = getWeeklyShiftForDate(today, config);
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + 7);
  const next = getWeeklyShiftForDate(nextDate, config);

  const prevDate = new Date(today);
  prevDate.setDate(prevDate.getDate() - 7);
  const prev = getWeeklyShiftForDate(prevDate, config);

  // Calculate days remaining in the current shift week (until Sunday)
  const currentWeekEnd = current.weekEnd;
  const diffDays = Math.max(0, Math.ceil((currentWeekEnd.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));

  return {
    thisWeekShift: current.shiftCode,
    nextWeekShift: next.shiftCode,
    prevWeekShift: prev.shiftCode,
    currentWeekStart: current.weekStart,
    currentWeekEnd: current.weekEnd,
    daysRemainingInWeek: diffDays,
    weekNumber: current.weekNumber,
    config,
  };
};

/**
 * Switch or set current week's shift (e.g. to 'A2' or 'B2')
 * Adjusts anchorDate to current week's Monday and anchorShift to chosen shift.
 */
export const setCurrentWeekShift = (shift: 'A2' | 'B2'): void => {
  const today = new Date();
  const currentConfig = getRotationConfig();
  const weekStart = getWeekStartDate(today, currentConfig.weekStartsOn);

  const updatedConfig: ShiftRotationConfig = {
    ...currentConfig,
    anchorDate: formatDateKey(weekStart),
    anchorShift: shift,
  };

  saveRotationConfig(updatedConfig);
  // Also update active shift in localStorage
  try {
    localStorage.setItem('csl_active_shift', shift);
    window.dispatchEvent(new CustomEvent('csl-attendance-updated', { detail: { activeShift: shift } }));
  } catch {}
};

/**
 * Generates an alternating weekly rotation timeline for N weeks into the future
 */
export interface WeekRotationScheduleItem {
  weekIndex: number;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  shift: 'A2' | 'B2';
  isCurrentWeek: boolean;
  isNextWeek: boolean;
  labelEn: string;
  labelMl: string;
}

export const getUpcomingWeeksRotation = (
  weekCount: number = 10,
  customConfig?: ShiftRotationConfig
): WeekRotationScheduleItem[] => {
  const today = new Date();
  const config = customConfig || getRotationConfig();
  const currentWeekStart = getWeekStartDate(today, config.weekStartsOn);

  const items: WeekRotationScheduleItem[] = [];

  for (let i = 0; i < weekCount; i++) {
    const wStart = new Date(currentWeekStart);
    wStart.setDate(wStart.getDate() + i * 7);

    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 6);

    const info = getWeeklyShiftForDate(wStart, config);

    const startStr = wStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const endStr = wEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    let labelEn = `Week ${info.weekNumber}`;
    let labelMl = `ആഴ്ച ${info.weekNumber}`;
    if (i === 0) {
      labelEn = 'This Week (Current)';
      labelMl = 'ഈ ആഴ്ച (നിലവിലെ)';
    } else if (i === 1) {
      labelEn = 'Next Week';
      labelMl = 'അടുത്ത ആഴ്ച';
    }

    items.push({
      weekIndex: i,
      weekNumber: info.weekNumber,
      startDate: wStart,
      endDate: wEnd,
      startDateFormatted: startStr,
      endDateFormatted: endStr,
      shift: info.shiftCode,
      isCurrentWeek: i === 0,
      isNextWeek: i === 1,
      labelEn,
      labelMl,
    });
  }

  return items;
};

/**
 * Automatically applies the weekly A2 ↔ B2 rotation to all working days of a specific month.
 * Populates day shifts in localStorage ('csl_calendar_day_shifts_{year}_{month}')
 */
export const applyWeeklyRotationToMonth = (
  monthIndex: number, // 0-indexed (e.g. 9 = October)
  year: number = 2026,
  customConfig?: ShiftRotationConfig
): Record<number, CslShiftCode> => {
  const config = customConfig || getRotationConfig();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const resultShifts: Record<number, CslShiftCode> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const dayOfWeek = d.getDay();

    // Check if Sunday (0) -> Off Day
    if (dayOfWeek === 0) continue;

    // Check if 2nd or 4th Saturday -> Off Day
    if (dayOfWeek === 6) {
      const isSecondOrFourthSaturday = (day >= 8 && day <= 14) || (day >= 22 && day <= 28);
      if (isSecondOrFourthSaturday) continue;
    }

    // Check official gazetted holidays for October 2026 (e.g. Oct 2 Gandhi Jayanti, Oct 21 Pooja/Vijayadasami)
    if (monthIndex === 9 && (day === 2 || day === 21)) continue;

    // Determine weekly shift for this date
    const shiftInfo = getWeeklyShiftForDate(d, config);
    resultShifts[day] = shiftInfo.actualShiftCode;
  }

  try {
    const key = `csl_calendar_day_shifts_${year}_${monthIndex}`;
    localStorage.setItem(key, JSON.stringify(resultShifts));
    window.dispatchEvent(new CustomEvent('csl-calendar-shifts-updated', { detail: { monthIndex, year, shifts: resultShifts } }));
  } catch {}

  return resultShifts;
};

/**
 * Authoritative shift resolver for any given date across Calendar, CSL Duty Shift, and Attendance.
 * Ensures that if the Calendar shows B2 (or A2/C1/C2), every module shows the exact same shift.
 */
export const getEffectiveShiftForDate = (
  date: Date,
  explicitDayShift?: CslShiftCode
): CslShiftCode => {
  // Rule 1: Every Sunday duty is always C1 (08:00 AM - 04:20 PM)
  if (date.getDay() === 0) {
    return 'C1';
  }

  const dateKey = formatDateKey(date);
  const overrides = getShiftOverrides();
  if (overrides[dateKey] && ['C1', 'C2', 'A2', 'B2'].includes(overrides[dateKey])) {
    return overrides[dateKey];
  }

  // If an explicit C1 or C2 shift was set for this day in dayShifts map, honor it
  if (explicitDayShift === 'C1' || explicitDayShift === 'C2') {
    return explicitDayShift;
  }

  // Check saved calendar day shift in localStorage if explicitDayShift wasn't passed
  if (!explicitDayShift) {
    try {
      const key = `csl_calendar_day_shifts_${date.getFullYear()}_${date.getMonth()}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const dayVal = parsed?.[date.getDate()] as CslShiftCode | undefined;
        if (dayVal === 'C1' || dayVal === 'C2') {
          return dayVal;
        }
      }
    } catch {}
  }

  // Otherwise, use the Calendar's weekly rotation shift (which also checks overrides)
  const weeklyInfo = getWeeklyShiftForDate(date);
  return weeklyInfo.actualShiftCode;
};

/**
 * Returns today's active shift synchronized with the Calendar's current shift.
 * Automatically updates 'csl_active_shift' when a new week starts (e.g. A2 -> B2 on Monday)
 * so CSL Duty Shift and Attendance never lag behind Calendar.
 */
export const getSyncedActiveShiftForToday = (todayDate?: Date): CslShiftCode => {
  const today = todayDate || new Date();
  const todayKey = formatDateKey(today);

  // Check if there is an explicit override for today in Calendar
  const overrides = getShiftOverrides();
  if (overrides[todayKey] && ['C1', 'C2', 'A2', 'B2'].includes(overrides[todayKey])) {
    try {
      localStorage.setItem('csl_active_shift', overrides[todayKey]);
    } catch {}
    return overrides[todayKey];
  }

  // Check if user explicitly selected C1 or C2 today
  try {
    const savedActive = localStorage.getItem('csl_active_shift') as CslShiftCode | null;
    const customDate = localStorage.getItem('csl_active_shift_custom_date');
    if ((savedActive === 'C1' || savedActive === 'C2') && customDate === todayKey) {
      return savedActive;
    }
  } catch {}

  const calendarShift = getWeeklyShiftForDate(today).actualShiftCode;
  try {
    localStorage.setItem('csl_active_shift', calendarShift);
    const key = `csl_calendar_day_shifts_${today.getFullYear()}_${today.getMonth()}`;
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    if (today.getDay() !== 0 && parsed[today.getDate()] !== calendarShift) {
      parsed[today.getDate()] = calendarShift;
      localStorage.setItem(key, JSON.stringify(parsed));
    }
  } catch {}

  return calendarShift;
};

/**
 * Synchronizes a shift change made in Calendar (or Duty Shift / Attendance) across ALL modules:
 * 1. Weekly rotation config (if A2/B2) + daily override for targetDate
 * 2. csl_calendar_day_shifts_{year}_{month}
 * 3. csl_active_shift (for CSL Duty Shift & Attendance header)
 * 4. Existing attendance logs in csl_attendance_daily_logs_{year}_{month} and csl_attendance_daily_logs_v2
 */
export const syncShiftFromCalendarEverywhere = (
  newShift: CslShiftCode,
  targetDate?: Date,
  updateEntireWeekIfA2B2: boolean = true
): void => {
  const refDate = targetDate || new Date();
  const isSun = refDate.getDay() === 0;
  const effectiveShift: CslShiftCode = isSun ? 'C1' : newShift;
  const dateKey = formatDateKey(refDate);
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const dayNum = refDate.getDate();

  try {
    // 1. If A2 or B2 and updateEntireWeekIfA2B2 is true, align the weekly rotation anchor so the whole week in Calendar matches
    if ((effectiveShift === 'A2' || effectiveShift === 'B2') && updateEntireWeekIfA2B2) {
      const currentConfig = getRotationConfig();
      const targetWeekStart = getWeekStartDate(refDate, currentConfig.weekStartsOn);
      const anchorKey = formatDateKey(targetWeekStart);

      // Clear any stale A2/B2 overrides in this target week so the week cleanly shows effectiveShift
      const overrides = getShiftOverrides();
      for (let i = 0; i < 7; i++) {
        const d = new Date(targetWeekStart);
        d.setDate(d.getDate() + i);
        const k = formatDateKey(d);
        if (overrides[k] === 'A2' || overrides[k] === 'B2') {
          delete overrides[k];
        }
      }
      localStorage.setItem(SWAPS_STORAGE_KEY, JSON.stringify(overrides));

      saveRotationConfig({
        ...currentConfig,
        anchorDate: anchorKey,
        anchorShift: effectiveShift,
        autoRotate: true,
      });
    } else {
      // Save daily override for this specific date
      saveShiftOverride(dateKey, effectiveShift);
    }

    // 2. Update csl_calendar_day_shifts_{year}_{month}
    const shiftsKey = `csl_calendar_day_shifts_${year}_${month}`;
    const rawShifts = localStorage.getItem(shiftsKey);
    const parsedShifts: Record<number, CslShiftCode> = rawShifts ? JSON.parse(rawShifts) : {};

    if ((effectiveShift === 'A2' || effectiveShift === 'B2') && updateEntireWeekIfA2B2) {
      const cfg = getRotationConfig();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(year, month, d);
        if (dt.getDay() === 0) {
          parsedShifts[d] = 'C1';
        } else {
          const existing = parsedShifts[d];
          if (!existing || existing === 'A2' || existing === 'B2') {
            parsedShifts[d] = getWeeklyShiftForDate(dt, cfg).actualShiftCode;
          }
        }
      }
    }
    parsedShifts[dayNum] = effectiveShift;
    localStorage.setItem(shiftsKey, JSON.stringify(parsedShifts));

    // 3. Update active shift so CSL Duty Shift (QuickAccessDashboard) & Attendance header match immediately
    localStorage.setItem('csl_active_shift', effectiveShift);
    if (effectiveShift === 'C1' || effectiveShift === 'C2') {
      localStorage.setItem('csl_active_shift_custom_date', dateKey);
    } else {
      localStorage.removeItem('csl_active_shift_custom_date');
    }

    // 4. Update existing attendance log for targetDate (and all non-custom A2/B2 logs in that week) so Attendance table matches Calendar
    const shiftDef = CSL_SHIFTS[effectiveShift] || CSL_SHIFTS['A2'];
    const shiftLabel = isSun
      ? `C1 (08:00 - 16:20) · ഞായറാഴ്ച C1`
      : `${effectiveShift} (${shiftDef.inTime.replace(' ', '')} - ${shiftDef.outTime.replace(' ', '')})`;

    const updateLogsArray = (logs: any[]): { updatedLogs: any[]; changed: boolean } => {
      let changed = false;
      const updatedLogs = logs.map((row: any) => {
        if (!row || typeof row.dayNum !== 'number') return row;
        const rowDate = new Date(year, month, row.dayNum);
        const rowIsSun = rowDate.getDay() === 0;

        if (row.dayNum === dayNum) {
          changed = true;
          const oldShiftDef = row.shiftCode ? CSL_SHIFTS[row.shiftCode as CslShiftCode] : null;
          const shouldUpdateInTime =
            !row.inTime ||
            row.inTime === '—' ||
            (oldShiftDef && row.inTime === oldShiftDef.inTime) ||
            row.inTime === '07:00 AM' ||
            row.inTime === '01:40 PM' ||
            row.inTime === '08:00 AM' ||
            row.inTime === '08:45 AM';
          const shouldUpdateOutTime =
            !row.outTime ||
            row.outTime === '—' ||
            (oldShiftDef && row.outTime === oldShiftDef.outTime) ||
            row.outTime === '03:20 PM' ||
            row.outTime === '10:00 PM' ||
            row.outTime === '04:20 PM' ||
            row.outTime === '05:00 PM';

          return {
            ...row,
            shiftCode: effectiveShift,
            shift: shiftLabel,
            inTime: shouldUpdateInTime ? shiftDef.inTime : row.inTime,
            outTime: shouldUpdateOutTime && row.outTime !== 'On Duty' && row.outTime !== '—' ? shiftDef.outTime : row.outTime,
          };
        }

        // Also align other days in the month if weekly A2/B2 rotation was updated and the row wasn't manually locked to C1/C2
        if (!rowIsSun && (effectiveShift === 'A2' || effectiveShift === 'B2') && updateEntireWeekIfA2B2) {
          const expectedDayShift = parsedShifts[row.dayNum];
          if (
            expectedDayShift &&
            (expectedDayShift === 'A2' || expectedDayShift === 'B2') &&
            (row.shiftCode === 'A2' || row.shiftCode === 'B2') &&
            row.shiftCode !== expectedDayShift
          ) {
            changed = true;
            const expDef = CSL_SHIFTS[expectedDayShift];
            const oldDef = CSL_SHIFTS[row.shiftCode as CslShiftCode];
            return {
              ...row,
              shiftCode: expectedDayShift,
              shift: `${expectedDayShift} (${expDef.inTime.replace(' ', '')} - ${expDef.outTime.replace(' ', '')})`,
              inTime: !row.inTime || row.inTime === oldDef?.inTime ? expDef.inTime : row.inTime,
              outTime:
                row.outTime && row.outTime !== '—' && row.outTime !== 'On Duty' && row.outTime === oldDef?.outTime
                  ? expDef.outTime
                  : row.outTime,
            };
          }
        }
        return row;
      });
      return { updatedLogs, changed };
    };

    const monthLogsKey = `csl_attendance_daily_logs_${year}_${month}`;
    const rawMonthLogs = localStorage.getItem(monthLogsKey);
    if (rawMonthLogs) {
      const parsedLogs = JSON.parse(rawMonthLogs);
      if (Array.isArray(parsedLogs)) {
        const { updatedLogs, changed } = updateLogsArray(parsedLogs);
        if (changed) {
          localStorage.setItem(monthLogsKey, JSON.stringify(updatedLogs));
        }
      }
    }

    const rawV2Logs = localStorage.getItem('csl_attendance_daily_logs_v2');
    if (rawV2Logs) {
      const parsedV2 = JSON.parse(rawV2Logs);
      if (Array.isArray(parsedV2)) {
        const { updatedLogs, changed } = updateLogsArray(parsedV2);
        if (changed) {
          localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(updatedLogs));
        }
      }
    }

    // Update completed duty summary if it matches targetDate
    const rawSummary = localStorage.getItem('csl_completed_duty_summary');
    if (rawSummary) {
      const summary = JSON.parse(rawSummary);
      if (summary && summary.dateKey === dateKey) {
        summary.shift = effectiveShift;
        localStorage.setItem('csl_completed_duty_summary', JSON.stringify(summary));
      }
    }

    // Dispatch events to update QuickAccessDashboard, CslAttendanceView, and CslCalendarView immediately
    window.dispatchEvent(new CustomEvent('csl-shift-changed', { detail: { shift: effectiveShift, dateKey } }));
    window.dispatchEvent(
      new CustomEvent('csl-calendar-shifts-updated', { detail: { monthIndex: month, year, shifts: parsedShifts } })
    );
    window.dispatchEvent(
      new CustomEvent('csl-attendance-updated', {
        detail: { day: dayNum, shift: effectiveShift },
      })
    );
  } catch {}
};

