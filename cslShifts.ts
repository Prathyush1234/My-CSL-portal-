export type CslShiftCode = 'A2' | 'B2' | 'C2' | 'C1';

export interface CslShiftDefinition {
  code: CslShiftCode;
  name: string;
  nameMl: string;
  inTime: string; // The last/deadline punch-in time e.g. '07:00 AM'
  outTime: string; // Shift end e.g. '03:20 PM'
  earlyOutGraceTime: string; // 5 mins early punch-out grace e.g. '03:15 PM'
  duration: string; // e.g. '8h 20m'
  durationMinutes: number; // e.g. 500 minutes (8h 20m)
  punchStart: string; // 30 minutes before - സ്റ്റാർട്ട് ചെയ്യാൻ തുടങ്ങുന്ന സമയം
  punchDeadline: string; // CSL time - പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
  punchWindowStart: string; // Alias for compatibility
  graceDeadline: string; // +5 minutes grace time for Permanent Employees e.g. '07:05 AM'
  graceMinutes: number; // 5
  descriptionEn: string;
  descriptionMl: string;
}

export const CSL_SHIFTS: Record<CslShiftCode, CslShiftDefinition> = {
  A2: {
    code: 'A2',
    name: 'Shift A2',
    nameMl: 'ഷിഫ്റ്റ് A2',
    inTime: '07:00 AM', // പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
    outTime: '03:20 PM',
    earlyOutGraceTime: '03:15 PM', // ഔട്ട് പഞ്ച് ചെയ്യുമ്പോൾ 5 മിനിറ്റ് നേരത്തെ ഗ്രേസ്
    duration: '8h 20m',
    durationMinutes: 500, // 8h 20m
    punchStart: '06:30 AM', // സ്റ്റാർട്ട് ചെയ്യാൻ തുടങ്ങുന്ന സമയം (30 മിനിറ്റ് മുൻപ്)
    punchDeadline: '07:00 AM', // പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
    punchWindowStart: '06:30 AM',
    graceDeadline: '07:05 AM', // പെർമനന്റ് ജീവനക്കാർക്കുള്ള 5 മിനിറ്റ് ഗ്രേസ് ടൈം (വരവ്)
    graceMinutes: 5,
    descriptionEn: 'Morning Shift (Start: 06:30 AM · In Deadline: 07:00 AM [Grace: 07:05 AM] · Out: 03:20 PM [Early Grace: 03:15 PM])',
    descriptionMl: 'രാവിലെ ഷിഫ്റ്റ് (തുടങ്ങുന്നത്: 06:30 AM · ഇൻ സമയം: 07:00 AM [ഗ്രേസ്: 07:05 AM] · ഔട്ട്: 03:20 PM [നേരത്തെ ഗ്രേസ്: 03:15 PM])',
  },
  B2: {
    code: 'B2',
    name: 'Shift B2',
    nameMl: 'ഷിഫ്റ്റ് B2',
    inTime: '01:40 PM', // പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
    outTime: '10:00 PM',
    earlyOutGraceTime: '09:55 PM', // ഔട്ട് പഞ്ച് ചെയ്യുമ്പോൾ 5 മിനിറ്റ് നേരത്തെ ഗ്രേസ്
    duration: '8h 20m',
    durationMinutes: 500, // 8h 20m
    punchStart: '01:10 PM', // സ്റ്റാർട്ട് ചെയ്യാൻ തുടങ്ങുന്ന സമയം (30 മിനിറ്റ് മുൻപ്)
    punchDeadline: '01:40 PM', // പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
    punchWindowStart: '01:10 PM',
    graceDeadline: '01:45 PM', // പെർമനന്റ് ജീവനക്കാർക്കുള്ള 5 മിനിറ്റ് ഗ്രേസ് ടൈം (വരവ്)
    graceMinutes: 5,
    descriptionEn: 'Afternoon Shift (Start: 01:10 PM · In Deadline: 01:40 PM [Grace: 01:45 PM] · Out: 10:00 PM [Early Grace: 09:55 PM])',
    descriptionMl: 'ഉച്ചതിരിഞ്ഞുള്ള ഷിഫ്റ്റ് (തുടങ്ങുന്നത്: 01:10 PM · ഇൻ സമയം: 01:40 PM [ഗ്രേസ്: 01:45 PM] · ഔട്ട്: 10:00 PM [നേരത്തെ ഗ്രേസ്: 09:55 PM])',
  },
  C1: {
    code: 'C1',
    name: 'Shift C1',
    nameMl: 'ഷിഫ്റ്റ് C1',
    inTime: '08:00 AM', // പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
    outTime: '04:20 PM',
    earlyOutGraceTime: '04:15 PM', // ഔട്ട് പഞ്ച് ചെയ്യുമ്പോൾ 5 മിനിറ്റ് നേരത്തെ ഗ്രേസ്
    duration: '8h 20m',
    durationMinutes: 500, // 8h 20m
    punchStart: '07:30 AM', // സ്റ്റാർട്ട് ചെയ്യാൻ തുടങ്ങുന്ന സമയം (30 മിനിറ്റ് മുൻപ്)
    punchDeadline: '08:00 AM', // പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
    punchWindowStart: '07:30 AM',
    graceDeadline: '08:05 AM', // പെർമനന്റ് ജീവനക്കാർക്കുള്ള 5 മിനിറ്റ് ഗ്രേസ് ടൈം (വരവ്)
    graceMinutes: 5,
    descriptionEn: 'Day Shift (Start: 07:30 AM · In Deadline: 08:00 AM [Grace: 08:05 AM] · Out: 04:20 PM [Early Grace: 04:15 PM])',
    descriptionMl: 'ഡേ ഷിഫ്റ്റ് (തുടങ്ങുന്നത്: 07:30 AM · ഇൻ സമയം: 08:00 AM [ഗ്രേസ്: 08:05 AM] · ഔട്ട്: 04:20 PM [നേരത്തെ ഗ്രേസ്: 04:15 PM])',
  },
  C2: {
    code: 'C2',
    name: 'Shift C2',
    nameMl: 'ഷിഫ്റ്റ് C2',
    inTime: '06:00 AM', // പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
    outTime: '02:00 PM',
    earlyOutGraceTime: '01:55 PM', // ഔട്ട് പഞ്ച് ചെയ്യുമ്പോൾ 5 മിനിറ്റ് നേരത്തെ ഗ്രേസ്
    duration: '8h 00m',
    durationMinutes: 480, // 8h 00m
    punchStart: '05:30 AM', // സ്റ്റാർട്ട് ചെയ്യാൻ തുടങ്ങുന്ന സമയം (30 മിനിറ്റ് മുൻപ്)
    punchDeadline: '06:00 AM', // പഞ്ച് ചെയ്യേണ്ട അവസാന സമയം
    punchWindowStart: '05:30 AM',
    graceDeadline: '06:05 AM', // പെർമനന്റ് ജീവനക്കാർക്കുള്ള 5 മിനിറ്റ് ഗ്രേസ് ടൈം (വരവ്)
    graceMinutes: 5,
    descriptionEn: 'Early Morning Shift (Start: 05:30 AM · In Deadline: 06:00 AM [Grace: 06:05 AM] · Out: 02:00 PM [Early Grace: 01:55 PM])',
    descriptionMl: 'പുലർച്ചെ ഷിഫ്റ്റ് (തുടങ്ങുന്നത്: 05:30 AM · ഇൻ സമയം: 06:00 AM [ഗ്രേസ്: 06:05 AM] · ഔട്ട്: 02:00 PM [നേരത്തെ ഗ്രേസ്: 01:55 PM])',
  },
};

export const CSL_SHIFT_CODES: CslShiftCode[] = ['A2', 'B2', 'C1', 'C2'];

export const getCslShiftInTime = (code: CslShiftCode): string => {
  return CSL_SHIFTS[code]?.inTime || '07:00 AM';
};

export const getCslShiftOutTime = (code: CslShiftCode): string => {
  return CSL_SHIFTS[code]?.outTime || '03:20 PM';
};

export const getCslEarlyOutGraceTime = (code: CslShiftCode): string => {
  return CSL_SHIFTS[code]?.earlyOutGraceTime || '03:15 PM';
};

export const getCslPunchWindowStart = (code: CslShiftCode): string => {
  return CSL_SHIFTS[code]?.punchWindowStart || '06:30 AM';
};

// Parse '07:00 AM', '01:40 PM', or '03:20:15 PM' into total minutes from midnight
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr || timeStr === '—') return 0;
  // Match HH:MM or HH:MM:SS with optional AM/PM
  const match = timeStr.trim().match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Formats a Date object or current time to clean 12-hour CSL format: '07:00 AM' or '03:25 PM'
export const formatCslTime = (date: Date = new Date()): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Automatically infers the correct CSL shift from punch times
// Shift A2: 07:00 AM - 03:20 PM (Punch starts 06:30 AM)
// Shift B2: 01:40 PM - 10:00 PM (Punch starts 01:10 PM)
// Shift C1: 08:00 AM - 04:20 PM (Punch starts 07:30 AM)
// Shift C2: 06:00 AM - 02:00 PM (Punch starts 05:30 AM)
export const inferCslShiftFromTimes = (
  inTimeStr: string,
  outTimeStr?: string,
  fallbackShift?: CslShiftCode
): CslShiftCode => {
  // If the user has explicitly selected or passed a shift, ALWAYS respect the user's selection!
  if (fallbackShift && (CSL_SHIFT_CODES as string[]).includes(fallbackShift)) {
    return fallbackShift;
  }

  const inM = parseTimeToMinutes(inTimeStr);
  const outM = outTimeStr ? parseTimeToMinutes(outTimeStr) : 0;

  // Afternoon punch-in: Between 12:00 PM (720m) and 04:30 PM (990m) -> Shift B2
  if (inM >= 12 * 60 && inM <= 16 * 60 + 30) {
    return 'B2';
  }
  // If punch out is late evening (around 09:30 PM to midnight) and inTime is afternoon
  if (outM >= 20 * 60 && inM >= 11 * 60) {
    return 'B2';
  }

  // Early morning: before 06:30 AM (e.g. 05:15 - 06:20) -> C2 (06:00 - 14:00)
  if (inM >= 5 * 60 && inM < 6 * 60 + 25) {
    if (outM > 0 && outM <= 14 * 60 + 30) return 'C2';
  }

  // Standard Morning Shift A2: ~06:25 AM to ~07:35 AM
  if (inM >= 6 * 60 + 20 && inM <= 7 * 60 + 35) {
    return 'A2';
  }

  // General Day Shift C1: ~07:35 AM to ~09:00 AM
  if (inM > 7 * 60 + 35 && inM <= 9 * 60) {
    return 'C1';
  }

  return 'A2';
};

// 12 Official CSL Gazetted Holidays 2026 Map
export const CSL_GAZETTED_HOLIDAYS_MAP: Record<string, { nameEn: string; nameMl: string }> = {
  '01-26': { nameEn: 'Republic Day', nameMl: 'റിപ്പബ്ലിക് ദിനം' },
  '03-21': { nameEn: 'Id-ul-Fitr (Ramzan)', nameMl: 'ഈദുൽ ഫിത്ർ' },
  '04-03': { nameEn: 'Good Friday', nameMl: 'ദുഃഖവെള്ളി' },
  '04-14': { nameEn: 'Dr. B.R. Ambedkar Jayanthi / Vishu', nameMl: 'അംബേദ്കർ ജയന്തി / വിഷു' },
  '05-01': { nameEn: 'May Day (Labour Day)', nameMl: 'മെയ് ദിനം (തൊഴിലാളി ദിനം)' },
  '05-27': { nameEn: 'Bakrid / Id-ul-Zuha', nameMl: 'ബക്രീദ് (ബലിപെരുന്നാൾ)' },
  '07-26': { nameEn: 'Muharram', nameMl: 'മുഹറം' },
  '08-15': { nameEn: 'Independence Day', nameMl: 'സ്വാതന്ത്ര്യദിനം' },
  '08-27': { nameEn: 'Thiruvonam', nameMl: 'തിരുവോണം' },
  '09-04': { nameEn: 'Sree Narayana Guru Jayanthi', nameMl: 'ശ്രീ നാരായണ ഗുരു ജയന്തി' },
  '10-02': { nameEn: 'Gandhi Jayanthi', nameMl: 'ഗാന്ധി ജയന്തി' },
  '10-21': { nameEn: 'Vijayadasami', nameMl: 'വിജയദശമി' },
  '12-25': { nameEn: 'Christmas', nameMl: 'ക്രിസ്മസ്' },
};

/**
 * Checks if a given date is a Sunday.
 * Rule: എല്ലാ ഞായറാഴ്ചയും വർക്ക് ഉണ്ടെങ്കിൽ സി വൺ (C1) ഷിഫ്റ്റ് ആയിരിക്കും.
 */
export const MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
export const MONTH_FULL_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
export const MONTH_NAMES_ML = ['ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മെയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'] as const;

/**
 * Returns the current Date in Indian Standard Time (IST / Asia/Kolkata).
 * Ensures that when October 31 ends in India, the app immediately rolls over to November 1!
 */
export const getIstDate = (): Date => {
  try {
    const now = new Date();
    const istStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const parsed = new Date(istStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {}
  return new Date();
};

export const getAttendanceLogsKey = (year: number, monthIndex: number): string => {
  return `csl_attendance_daily_logs_${year}_${monthIndex}`;
};

/**
 * Safely archives October 2026 data into `csl_attendance_daily_logs_2026_9`
 * and ensures that when a new month (e.g. November 2026) begins, the active
 * `csl_attendance_daily_logs_v2` reflects the new month's logs without losing October's saved logs.
 */
export const ensureMonthlyRolloverAndArchive = (): void => {
  try {
    const istNow = getIstDate();
    const curYear = istNow.getFullYear();
    const curMonth = istNow.getMonth(); // 10 for November
    const octKey = getAttendanceLogsKey(2026, 9);
    const curKey = getAttendanceLogsKey(curYear, curMonth);

    const rawV2 = localStorage.getItem('csl_attendance_daily_logs_v2');
    const v2Logs: any[] = rawV2 ? JSON.parse(rawV2) : [];

    // 1. Archive any October logs from v2 into csl_attendance_daily_logs_2026_9
    if (Array.isArray(v2Logs) && v2Logs.length > 0) {
      const octLogsFromV2 = v2Logs.filter((r) => {
        if (!r || typeof r !== 'object') return false;
        if (!r.dateStr) return true;
        return /\bOct\b/i.test(r.dateStr) || /2026-10-/.test(r.dateStr);
      });

      if (octLogsFromV2.length > 0) {
        const existingOctRaw = localStorage.getItem(octKey);
        const existingOct: any[] = existingOctRaw ? JSON.parse(existingOctRaw) : [];
        // Merge by dayNum preferring user-edited or newer entries from octLogsFromV2
        const mergedMap = new Map<number, any>();
        if (Array.isArray(existingOct)) {
          existingOct.forEach((item) => {
            if (item && typeof item.dayNum === 'number') {
              mergedMap.set(item.dayNum, item);
            }
          });
        }
        octLogsFromV2.forEach((item) => {
          if (item && typeof item.dayNum === 'number') {
            mergedMap.set(item.dayNum, item);
          }
        });
        const mergedOct = Array.from(mergedMap.values()).sort((a, b) => b.dayNum - a.dayNum);
        localStorage.setItem(octKey, JSON.stringify(mergedOct));
      }
    }

    // 2. If current IST month is November (or any month other than October), ensure v2 only holds current month logs
    if (curMonth !== 9 || curYear !== 2026) {
      const curMonthShort = MONTH_SHORT_NAMES[curMonth];
      const curMonthIsoPrefix = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-`;

      const existingCurRaw = localStorage.getItem(curKey);
      const existingCur: any[] = existingCurRaw ? JSON.parse(existingCurRaw) : [];

      const curLogsFromV2 = Array.isArray(v2Logs)
        ? v2Logs.filter((r) => {
            if (!r || typeof r !== 'object' || !r.dateStr) return false;
            return (
              new RegExp(`\\b${curMonthShort}\\b`, 'i').test(r.dateStr) ||
              r.dateStr.startsWith(curMonthIsoPrefix)
            );
          })
        : [];

      const mergedCurMap = new Map<number, any>();
      if (Array.isArray(existingCur)) {
        existingCur.forEach((item) => {
          if (item && typeof item.dayNum === 'number') {
            mergedCurMap.set(item.dayNum, item);
          }
        });
      }
      curLogsFromV2.forEach((item) => {
        if (item && typeof item.dayNum === 'number') {
          mergedCurMap.set(item.dayNum, item);
        }
      });

      const finalCurLogs = Array.from(mergedCurMap.values()).sort((a, b) => b.dayNum - a.dayNum);
      localStorage.setItem(curKey, JSON.stringify(finalCurLogs));

      // Keep v2 synced to current month if v2 still had old October records
      const hasOldOctInV2 = Array.isArray(v2Logs) && v2Logs.some((r) => r && (!r.dateStr || /\bOct\b/i.test(r.dateStr)));
      if (hasOldOctInV2) {
        localStorage.setItem('csl_attendance_daily_logs_v2', JSON.stringify(finalCurLogs));
      }
    }
  } catch {}
};

export const isSundayDate = (
  dateInput?: Date | string | number | null,
  monthIndex?: number,
  year?: number
): boolean => {
  if (dateInput === null || dateInput === undefined) return false;
  const fallbackDate = getIstDate();
  const targetMonth = typeof monthIndex === 'number' ? monthIndex : fallbackDate.getMonth();
  const targetYear = typeof year === 'number' ? year : fallbackDate.getFullYear();

  if (typeof dateInput === 'number') {
    const d = new Date(targetYear, targetMonth, dateInput);
    return d.getDay() === 0;
  }
  if (dateInput instanceof Date) {
    return dateInput.getDay() === 0;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.getDay() === 0;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.getDay() === 0;
    }
    const match = trimmed.match(/^(\d{1,2})/);
    if (match) {
      const dayNum = parseInt(match[1], 10);
      const d = new Date(targetYear, targetMonth, dayNum);
      return d.getDay() === 0;
    }
  }
  return false;
};

/**
 * Checks if a given date is an official CSL Gazetted Holiday.
 * Rule: ഹോളിഡേ വർക്ക് ചെയ്താൽ OT ആയിരിക്കും.
 */
export const isCslHolidayDate = (
  dateInput?: Date | string | number | null,
  monthIndex?: number,
  _year?: number
): { isHoliday: boolean; holidayName?: string; holidayNameMl?: string } => {
  if (dateInput === null || dateInput === undefined) return { isHoliday: false };
  const fallbackMonth = typeof monthIndex === 'number' ? monthIndex + 1 : getIstDate().getMonth() + 1;
  let month = fallbackMonth;
  let day = 1;

  if (typeof dateInput === 'number') {
    month = fallbackMonth;
    day = dateInput;
  } else if (dateInput instanceof Date) {
    month = dateInput.getMonth() + 1;
    day = dateInput.getDate();
  } else if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split('-');
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        month = parsed.getMonth() + 1;
        day = parsed.getDate();
      } else {
        const match = trimmed.match(/^(\d{1,2})/);
        if (match) {
          day = parseInt(match[1], 10);
          month = fallbackMonth;
        }
      }
    }
  }

  const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const h = CSL_GAZETTED_HOLIDAYS_MAP[key];
  if (h) {
    return { isHoliday: true, holidayName: h.nameEn, holidayNameMl: h.nameMl };
  }
  return { isHoliday: false };
};

/**
 * Returns recommended shift for date:
 * Rule 1: "എല്ലാ ഞായറാഴ്ചയും വർക്ക് ഉണ്ടെങ്കിൽ സി വൺ (C1) ഷിഫ്റ്റ് ആയിരിക്കും"
 */
export const getRecommendedShiftForDate = (
  dateInput?: Date | string | number | null,
  fallbackShift?: CslShiftCode
): CslShiftCode => {
  if (isSundayDate(dateInput)) {
    return 'C1';
  }
  return fallbackShift && (CSL_SHIFT_CODES as string[]).includes(fallbackShift) ? fallbackShift : 'A2';
};

// Calculate net worked hours and extra hours for Overtime (OT)
// Rule 1: Every Sunday, if there is work, the shift is C1 (08:00 AM - 04:20 PM).
// Rule 2: If worked on a Sunday or CSL Holiday, all hours worked count as Overtime (OT)!
// Includes 5-minute Grace Time rule for Permanent Employees (പെർമനന്റ് ജീവനക്കാർക്കുള്ള 5 മിനിറ്റ് ഇൻ & ഔട്ട് ഗ്രേസ് ടൈം)
export const calculateDutyAndOT = (
  inTimeStr: string,
  outTimeStr: string,
  shiftCode: CslShiftCode,
  isPermanentGrace: boolean = true,
  dateInput?: Date | string | number | null
): { 
  workHours: string; 
  otHours: number; 
  totalMinutes: number; 
  graceApplied: boolean;
  inGraceApplied: boolean;
  outGraceApplied: boolean;
  graceNote: string;
  resolvedShiftCode: CslShiftCode;
  isHolidayDuty: boolean;
  holidayNote?: string;
} => {
  let inM = parseTimeToMinutes(inTimeStr);
  let outM = parseTimeToMinutes(outTimeStr);

  // If cross midnight (e.g. out time next day)
  if (outM < inM && outM > 0) {
    outM += 24 * 60;
  }

  const isSunday = isSundayDate(dateInput);
  const holidayInfo = isCslHolidayDate(dateInput);
  const isHolidayDuty = isSunday || holidayInfo.isHoliday;

  // Rule 1: Every Sunday, work MUST be Shift C1!
  let resolvedShiftCode: CslShiftCode = shiftCode;
  if (isSunday) {
    resolvedShiftCode = 'C1';
  } else if (shiftCode && (CSL_SHIFT_CODES as string[]).includes(shiftCode)) {
    resolvedShiftCode = shiftCode;
  } else {
    resolvedShiftCode = 'A2';
  }

  const shift = CSL_SHIFTS[resolvedShiftCode] || CSL_SHIFTS['C1'];
  const scheduledMinutes = shift ? shift.durationMinutes : 500;
  const shiftInMinutes = shift ? parseTimeToMinutes(shift.inTime) : 480;
  const shiftOutMinutes = shift ? parseTimeToMinutes(shift.outTime) : 980;

  let inGraceApplied = false;
  let outGraceApplied = false;

  // 1. CSL Permanent Employee In-Grace: Punch-in within +5 minutes grace period
  if (isPermanentGrace && inM > shiftInMinutes && inM <= shiftInMinutes + (shift?.graceMinutes || 5)) {
    inM = shiftInMinutes;
    inGraceApplied = true;
  }

  // 2. CSL Permanent Employee Out-Grace: Punch-out up to 5 minutes early before shift end
  if (isPermanentGrace && outM >= shiftOutMinutes - (shift?.graceMinutes || 5) && outM < shiftOutMinutes) {
    outM = shiftOutMinutes;
    outGraceApplied = true;
  }

  const graceApplied = inGraceApplied || outGraceApplied;
  let graceNote = '';
  if (inGraceApplied && outGraceApplied) {
    graceNote = 'ഇൻ (+5m) & ഔട്ട് (-5m) പെർമനന്റ് ഗ്രേസ് അനുവദിച്ചു (In & Out 5m Grace)';
  } else if (inGraceApplied) {
    graceNote = 'ഇൻ ഗ്രേസ് അനുവദിച്ചു (+5m Grace - On Time)';
  } else if (outGraceApplied) {
    graceNote = '5 മിനിറ്റ് നേരത്തെ ഔട്ട് ഗ്രേസ് അനുവദിച്ചു (5m Early Out Grace)';
  }

  const totalMinutes = Math.max(0, outM - inM);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const workHours = `${hours}h ${mins.toString().padStart(2, '0')}m`;

  let otHours = 0;
  let holidayNote = '';

  // Rule: "അരമണിക്കൂർ OT ഉണ്ടാവില്ല" (No half-hour OT).
  // Overtime is strictly whole hours (1h, 2h, 3h, 4h, etc.).
  if (isHolidayDuty && totalMinutes > 0) {
    // Full holiday duty shift (500m / 8h 20m) = 8 hours OT (not 8.3h or half-hours)!
    otHours = Math.max(1, Math.floor((totalMinutes + 10) / 60));
    if (isSunday) {
      holidayNote = `ഞായറാഴ്ച C1 ഷിഫ്റ്റ് ഡ്യൂട്ടി · മുഴുവൻ സമയവും ${otHours}h ഹോളിഡേ OT (Sunday C1 Duty OT)`;
      graceNote = graceNote ? `${holidayNote} · ${graceNote}` : holidayNote;
    } else {
      const hName = holidayInfo.holidayNameMl || holidayInfo.holidayName || 'ഹോളിഡേ';
      holidayNote = `${hName} ഡ്യൂട്ടി · മുഴുവൻ സമയവും ${otHours}h സ്പെഷ്യൽ OT (Holiday Duty OT)`;
      graceNote = graceNote ? `${holidayNote} · ${graceNote}` : holidayNote;
    }
  } else {
    // Normal Working Day: OT is calculated in full completed hours only (അരമണിക്കൂർ OT ഉണ്ടാവില്ല).
    // Less than 50 minutes past regular shift = 0h OT (no half-hour OT).
    // 50+ minutes = 1h OT, 110+ minutes = 2h OT, 170+ minutes = 3h OT, etc.
    let extraMinutesPastRegular = 0;
    if (outM > shiftOutMinutes) {
      extraMinutesPastRegular = outM - shiftOutMinutes;
    } else if (totalMinutes > scheduledMinutes) {
      extraMinutesPastRegular = totalMinutes - scheduledMinutes;
    }

    if (extraMinutesPastRegular >= 50) {
      otHours = Math.floor((extraMinutesPastRegular + 10) / 60);
    }
  }

  return { 
    workHours, 
    otHours, 
    totalMinutes, 
    graceApplied, 
    inGraceApplied, 
    outGraceApplied, 
    graceNote, 
    resolvedShiftCode, 
    isHolidayDuty,
    holidayNote 
  };
};

// Calculate out time formatted string with additional OT hours (e.g. +1h, +2h)
export const getShiftTimeWithOt = (shiftCode: CslShiftCode, otHours: number): string => {
  const outTime = CSL_SHIFTS[shiftCode]?.outTime || '03:20 PM';
  if (otHours <= 0) return outTime;
  const outMinutes = parseTimeToMinutes(outTime);
  const totalMinutes = (outMinutes + Math.round(otHours * 60)) % (24 * 60);

  let hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
};

// Automatically calculate overtime (OT) for each hour worked past regular shift end time
// Rule 1: Every Sunday, work MUST be Shift C1!
// Rule 2: "മാത്രമല്ല ഹോളിഡേ വർക്ക് ചെയ്താൽ OT ആയിരിക്കും" -> On Sunday or CSL Holiday, all worked hours are Overtime (Holiday OT)!
export const calculateAutomaticOTFromOutTime = (
  shiftCode: CslShiftCode,
  outTimeStr: string,
  inTimeStr?: string,
  dateInput?: Date | string | number | null
): {
  otHours: number;
  otStr: string;
  extraMinutes: number;
  isOvertime: boolean;
  regularOutTime: string;
  explanationMl: string;
  explanationEn: string;
  isHolidayDuty?: boolean;
} => {
  const isSunday = isSundayDate(dateInput);
  const holidayInfo = isCslHolidayDate(dateInput);
  const isHolidayDuty = isSunday || holidayInfo.isHoliday;

  let resolvedShiftCode = shiftCode;
  if (isSunday) {
    resolvedShiftCode = 'C1';
  } else if (inTimeStr) {
    resolvedShiftCode = inferCslShiftFromTimes(inTimeStr, outTimeStr, shiftCode);
  } else {
    const outM = parseTimeToMinutes(outTimeStr);
    if (outM >= 20 * 60 && shiftCode === 'A2') {
      resolvedShiftCode = 'B2';
    }
  }

  const shift = CSL_SHIFTS[resolvedShiftCode] || CSL_SHIFTS['C1'];
  const regularOutTime = shift?.outTime || '04:20 PM';
  const regularOutM = parseTimeToMinutes(regularOutTime);
  let outM = parseTimeToMinutes(outTimeStr);

  if (outM <= 0 || !outTimeStr || outTimeStr === '—' || outTimeStr === 'On Duty') {
    return {
      otHours: 0,
      otStr: '',
      extraMinutes: 0,
      isOvertime: false,
      regularOutTime,
      explanationMl: 'റെഗുലർ സമയം',
      explanationEn: 'Regular Shift Time',
      isHolidayDuty,
    };
  }

  // Handle true midnight wrap
  if (regularOutM >= 18 * 60 && outM < 10 * 60 && outM >= 0) {
    outM += 24 * 60;
  }

  // Rule 2: If working on Sunday or CSL Holiday, all duty hours worked count as Overtime!
  if (isHolidayDuty) {
    const defaultInTime = shift.inTime;
    const inM = inTimeStr ? parseTimeToMinutes(inTimeStr) : parseTimeToMinutes(defaultInTime);
    let netM = Math.max(0, outM - inM);
    // If netM is 0 (or outTime <= inTime), assume standard full shift 500 mins
    if (netM <= 0) netM = shift.durationMinutes || 500;
    
    // CSL Rule: "അരമണിക്കൂർ OT ഉണ്ടാവില്ല" (No half-hour OT) - Whole hours only!
    // Standard full day shift (500m / 8h 20m) = 8h OT!
    const otHours = Math.max(1, Math.floor((netM + 10) / 60));
    const otFormattedHours = otHours;
    const otStr = `${String(otFormattedHours).padStart(2, '0')}:00`;

    const holidayNameMl = isSunday ? 'ഞായറാഴ്ച' : (holidayInfo.holidayNameMl || holidayInfo.holidayName || 'ഹോളിഡേ');
    const holidayNameEn = isSunday ? 'Sunday' : (holidayInfo.holidayName || 'Holiday');

    return {
      otHours,
      otStr,
      extraMinutes: netM,
      isOvertime: true,
      regularOutTime,
      explanationMl: isSunday
        ? `ഞായറാഴ്ച ഡ്യൂട്ടി (C1 ഷിഫ്റ്റ്): സി.എസ്.എൽ ചട്ടപ്രകാരം ജോലി ചെയ്ത ${otHours} മണിക്കൂറും ഓവർടൈം (Holiday OT) ആണ് (അരമണിക്കൂർ OT ഇല്ല).`
        : `${holidayNameMl} ഡ്യൂട്ടി: സി.എസ്.എൽ ചട്ടപ്രകാരം ജോലി ചെയ്ത ${otHours} മണിക്കൂറും ഓവർടൈം (Holiday OT) ആണ് (അരമണിക്കൂർ OT ഇല്ല).`,
      explanationEn: `${holidayNameEn} Duty: All ${otHours} hours credited as Overtime (Holiday OT) - whole hours only.`,
      isHolidayDuty: true,
    };
  }

  const extraMinutes = Math.max(0, outM - regularOutM);

  // CSL Rule: "അരമണിക്കൂർ OT ഉണ്ടാവില്ല" (No half-hour OT).
  // Less than 50 minutes past regular shift end = 0 OT.
  if (extraMinutes < 50) {
    return {
      otHours: 0,
      otStr: '',
      extraMinutes: 0,
      isOvertime: false,
      regularOutTime,
      explanationMl: `റെഗുലർ സമയം (${regularOutTime}) · അരമണിക്കൂർ OT ഇല്ല`,
      explanationEn: `Regular Shift (${regularOutTime}) · No half-hour OT`,
      isHolidayDuty: false,
    };
  }

  // Calculate whole hours past regular shift only (1h, 2h, 3h, 4h... അരമണിക്കൂർ OT ഉണ്ടാവില്ല)
  const otHours = Math.floor((extraMinutes + 10) / 60);
  const otFormattedHours = otHours;
  const otStr = otHours > 0 ? `${String(otFormattedHours).padStart(2, '0')}:00` : '';

  return {
    otHours,
    otStr,
    extraMinutes,
    isOvertime: otHours > 0,
    regularOutTime,
    explanationMl: `റെഗുലർ സമയം (${regularOutTime}) കഴിഞ്ഞ് ${otHours} മണിക്കൂർ ഓവർടൈം (പൂർണ്ണ മണിക്കൂർ)`,
    explanationEn: `${otHours} hr(s) Overtime after regular shift (${regularOutTime})`,
  };
};

export interface DutyPunchData {
  dateStr: string; // '2026-10-15'
  shift: CslShiftCode;
  inTime: string;
  outTime: string;
  ot: string; // 'HH:MM'
  leave: 'None' | 'Casual Leave (CL)' | 'Earned Leave (EL)' | 'Half Pay Leave (HPL)' | 'Medical Leave (ML)' | 'Special Leave (SPL)' | 'Restricted Holiday (RH)' | 'Compensatory Off (CO)';
  halfDay: 'No' | 'Yes (First Half)' | 'Yes (Second Half)';
  graceApplied?: boolean; // 5-minute grace time for permanent employees
  autoCalculatedOt?: boolean;
  notes?: string;
}

/**
 * Automatically reconciles and corrects attendance logs where shift and punch times mismatch.
 * Month-aware: Only applies October-specific Vijayadasami rules when targetMonthIndex === 9 (October).
 */
export const reconcileAttendanceDailyLogs = (
  logs: any[],
  targetMonthIndex?: number
): { logs: any[]; modified: boolean } => {
  if (!Array.isArray(logs)) return { logs: [], modified: false };
  let modified = false;
  const effectiveMonth = typeof targetMonthIndex === 'number' ? targetMonthIndex : getIstDate().getMonth();

  const corrected = logs.map((log) => {
    if (!log || typeof log !== 'object') return log;

    // USER RULE: "പിന്നെ ഓട്ടോമാറ്റിക് ആയിട്ട് ഒന്നും മാറാനും പാടില്ല"
    // Never overwrite or mutate any entry that has been user edited or has user-entered punch times!
    if (log.userEdited) return log;

    const isOctLog = effectiveMonth === 9 || (log.dateStr && /\bOct\b/i.test(log.dateStr));

    // Day 21 Oct 2026 is Vijayadasami (വിജയദശമി) - Official CSL Gazetted Closed Holiday
    if (isOctLog && log.dayNum === 21) {
      // Check if employee punched or worked on Day 21
      const hasPunchTimes = log.inTime && log.inTime !== '—' && log.outTime && log.outTime !== '—';
      const closedHolidayNote = 'CSL Gazetted Closed Holiday · വിജയദശമി (അന്ന് വർക്ക് ചെയ്തവർക്ക് ഹോളിഡേ ഡ്യൂട്ടി നോട്ട് ബാധകം)';

      if (hasPunchTimes) {
        return log;
      } else {
        if (log.status !== 'CSL Holiday' || !log.notes?.includes('അന്ന് വർക്ക് ചെയ്തവർക്ക്')) {
          modified = true;
          return {
            ...log,
            shift: 'CSL Gazetted Holiday (വിജയദശമി)',
            shiftCode: 'HLD',
            inTime: '—',
            outTime: '—',
            workHours: 'Holiday (അവധി)',
            otHours: 0,
            terminal: 'Shipyard Closed',
            status: 'CSL Holiday',
            notes: log.notes && log.notes.length > 5 ? log.notes : closedHolidayNote,
          };
        }
      }
      return log;
    }

    // Day 2 Oct 2026 is Gandhi Jayanti - Official National Closed Holiday
    if (isOctLog && log.dayNum === 2) {
      return log;
    }

    // Christmas 25 Dec 2026 - Official CSL Gazetted Closed Holiday
    const isChristmas = (log.dayNum === 25 && log.dateStr && /dec/i.test(log.dateStr)) || 
      (log.dateStr && /2026-12-25/i.test(log.dateStr));
    if (isChristmas) {
      const hasPunchTimes = log.inTime && log.inTime !== '—' && log.outTime && log.outTime !== '—';
      if (hasPunchTimes) {
        return log;
      } else {
        if (log.status !== 'CSL Holiday') {
          modified = true;
          return {
            ...log,
            shift: 'CSL Gazetted Holiday (ക്രിസ്മസ് / Christmas)',
            shiftCode: 'HLD',
            inTime: '—',
            outTime: '—',
            workHours: 'Holiday (അവധി)',
            otHours: 0,
            terminal: 'Shipyard Closed',
            status: 'CSL Holiday',
            notes: 'Christmas (ക്രിസ്മസ്) · CSL Gazetted Closed Holiday',
          };
        }
      }
      return log;
    }

    // Sundays in the target month:
    if (isSundayDate(log.dateStr || log.dayNum, effectiveMonth, 2026)) {
      return log;
    }

    return log;
  });

  // Ensure Day 21 (Vijayadasami Holiday) is present ONLY in October (monthIndex === 9) logs
  if (effectiveMonth === 9) {
    const hasDay21 = corrected.some((r) => r && r.dayNum === 21);
    if (!hasDay21) {
      modified = true;
      corrected.push({
        id: 'd-21',
        dateStr: '21 Oct 2026',
        dayName: 'Wednesday',
        dayNum: 21,
        shift: 'CSL Gazetted Holiday (വിജയദശമി)',
        shiftCode: 'HLD',
        inTime: '—',
        outTime: '—',
        workHours: 'Holiday (അവധി)',
        otHours: 0,
        terminal: 'Shipyard Closed',
        status: 'CSL Holiday',
        notes: 'Vijayadasami (വിജയദശമി) · CSL Gazetted Closed Holiday',
      });
      corrected.sort((a, b) => b.dayNum - a.dayNum);
    }
  }

  // Also sanitize October calendar present days to ensure Holiday Day 21 and Day 2 are never marked Present
  try {
    const savedPresent = localStorage.getItem('csl_calendar_present_days_2026_9');
    if (savedPresent) {
      const pList: number[] = JSON.parse(savedPresent);
      if (pList.includes(21) || pList.includes(2)) {
        const cleaned = pList.filter((d) => d !== 21 && d !== 2);
        localStorage.setItem('csl_calendar_present_days_2026_9', JSON.stringify(cleaned));
      }
    }
  } catch {}

  return { logs: corrected, modified };
};



