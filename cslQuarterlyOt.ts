/**
 * CSL (Cochin Shipyard Limited) Quarterly Overtime (OT) Cap Utility
 * 
 * Statutory / CSL Quarterly OT Cycle Rules:
 * Every 3 months (quarterly cycle):
 * - Cycle 1 (Q1): March, April, May (മാർച്ച് - ഏപ്രിൽ - മെയ്)
 * - Cycle 2 (Q2): June, July, August (ജൂൺ - ജൂലൈ - ആഗസ്റ്റ്)
 * - Cycle 3 (Q3): September, October, November (സെപ്റ്റംബർ - ഒക്ടോബർ - നവംബർ)
 * - Cycle 4 (Q4): December, January, February (ഡിസംബർ - ജനുവരി - ഫെബ്രുവരി)
 * 
 * Total OT Cap options:
 * - 75 Hours (75 മണിക്കൂർ - Standard Statutory Cap)
 * - 120 Hours (120 മണിക്കൂർ - Extended OT Cap)
 */

export type QuarterlyOtCap = 75 | 120;

export interface QuarterMonthInfo {
  monthIndex: number; // 0 to 11
  monthNameEn: string;
  monthNameMl: string;
  year: number;
  otHours: number;
  daysWithOt: number;
}

export interface QuarterlyOtCycle {
  id: string; // e.g. '2026-Q3'
  quarterNumber: 1 | 2 | 3 | 4;
  year: number;
  titleEn: string;
  titleMl: string;
  periodEn: string; // 'Sep – Oct – Nov 2026'
  periodMl: string; // 'സെപ്റ്റംബർ – ഒക്ടോബർ – നവംബർ 2026'
  months: QuarterMonthInfo[];
}

export interface QuarterlyOtSummary {
  cycle: QuarterlyOtCycle;
  cap: QuarterlyOtCap;
  totalOtUsed: number;
  remainingOt: number;
  overLimitHours: number;
  percentUsed: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
  statusTextEn: string;
  statusTextMl: string;
  monthlyBreakdown: QuarterMonthInfo[];
}

export const CSL_MONTHS_NAMES = [
  { en: 'January', ml: 'ജനുവരി' },
  { en: 'February', ml: 'ഫെബ്രുവരി' },
  { en: 'March', ml: 'മാർച്ച്' },
  { en: 'April', ml: 'ഏപ്രിൽ' },
  { en: 'May', ml: 'മേയ്' },
  { en: 'June', ml: 'ജൂൺ' },
  { en: 'July', ml: 'ജൂലൈ' },
  { en: 'August', ml: 'ഓഗസ്റ്റ്' },
  { en: 'September', ml: 'സെപ്റ്റംബർ' },
  { en: 'October', ml: 'ഒക്ടോബർ' },
  { en: 'November', ml: 'നവംബർ' },
  { en: 'December', ml: 'ഡിസംബർ' },
];

export const QUARTERLY_OT_CAP_KEY = 'csl_quarterly_ot_cap';
export const QUARTERLY_OT_CAP_UPDATED_EVENT = 'csl-quarterly-ot-cap-updated';

/**
 * Gets the stored Quarterly OT cap (default: 75 hours)
 */
export function getQuarterlyOtCap(): QuarterlyOtCap {
  try {
    const val = localStorage.getItem(QUARTERLY_OT_CAP_KEY);
    if (val === '120') return 120;
    return 75;
  } catch {
    return 75;
  }
}

/**
 * Updates and persists the Quarterly OT cap (75 or 120 hours)
 */
export function setQuarterlyOtCap(cap: QuarterlyOtCap): void {
  try {
    localStorage.setItem(QUARTERLY_OT_CAP_KEY, cap.toString());
    window.dispatchEvent(new CustomEvent(QUARTERLY_OT_CAP_UPDATED_EVENT, { detail: cap }));
  } catch {}
}

/**
 * Determines the 3-month cycle for any given date:
 * - March (2), April (3), May (4) -> Q1
 * - June (5), July (6), August (7) -> Q2
 * - September (8), October (9), November (10) -> Q3
 * - December (11), January (0), February (1) -> Q4
 */
export function getQuarterlyCycleForDate(date: Date = new Date()): QuarterlyOtCycle {
  const month = date.getMonth(); // 0-11
  const year = date.getFullYear();

  let quarterNumber: 1 | 2 | 3 | 4;
  let cycleYear = year;
  let monthIndices: { monthIndex: number; year: number }[] = [];

  if (month >= 2 && month <= 4) {
    // March, April, May
    quarterNumber = 1;
    monthIndices = [
      { monthIndex: 2, year },
      { monthIndex: 3, year },
      { monthIndex: 4, year }
    ];
  } else if (month >= 5 && month <= 7) {
    // June, July, August
    quarterNumber = 2;
    monthIndices = [
      { monthIndex: 5, year },
      { monthIndex: 6, year },
      { monthIndex: 7, year }
    ];
  } else if (month >= 8 && month <= 10) {
    // September, October, November
    quarterNumber = 3;
    monthIndices = [
      { monthIndex: 8, year },
      { monthIndex: 9, year },
      { monthIndex: 10, year }
    ];
  } else {
    // December, January, February
    quarterNumber = 4;
    if (month === 11) {
      // December of current year
      cycleYear = year;
      monthIndices = [
        { monthIndex: 11, year },
        { monthIndex: 0, year: year + 1 },
        { monthIndex: 1, year: year + 1 }
      ];
    } else {
      // January or February
      cycleYear = year - 1;
      monthIndices = [
        { monthIndex: 11, year: year - 1 },
        { monthIndex: 0, year },
        { monthIndex: 1, year }
      ];
    }
  }

  const months: QuarterMonthInfo[] = monthIndices.map(m => ({
    monthIndex: m.monthIndex,
    monthNameEn: CSL_MONTHS_NAMES[m.monthIndex].en,
    monthNameMl: CSL_MONTHS_NAMES[m.monthIndex].ml,
    year: m.year,
    otHours: 0,
    daysWithOt: 0,
  }));

  const titles: Record<number, { en: string; ml: string; periodEn: string; periodMl: string }> = {
    1: {
      en: 'Quarter 1 (March – April – May)',
      ml: 'ക്വാർട്ടർ 1 (മാർച്ച് – ഏപ്രിൽ – മെയ്)',
      periodEn: `March – May ${cycleYear}`,
      periodMl: `മാർച്ച് – മെയ് ${cycleYear}`
    },
    2: {
      en: 'Quarter 2 (June – July – August)',
      ml: 'ക്വാർട്ടർ 2 (ജൂൺ – ജൂലൈ – ആഗസ്റ്റ്)',
      periodEn: `June – August ${cycleYear}`,
      periodMl: `ജൂൺ – ആഗസ്റ്റ് ${cycleYear}`
    },
    3: {
      en: 'Quarter 3 (September – October – November)',
      ml: 'ക്വാർട്ടർ 3 (സെപ്റ്റംബർ – ഒക്ടോബർ – നവംബർ)',
      periodEn: `September – November ${cycleYear}`,
      periodMl: `സെപ്റ്റംബർ – നവംബർ ${cycleYear}`
    },
    4: {
      en: 'Quarter 4 (December – January – February)',
      ml: 'ക്വാർട്ടർ 4 (ഡിസംബർ – ജനുവരി – ഫെബ്രുവരി)',
      periodEn: `Dec ${cycleYear} – Feb ${cycleYear + 1}`,
      periodMl: `ഡിസംബർ ${cycleYear} – ഫെബ്രുവരി ${cycleYear + 1}`
    }
  };

  const meta = titles[quarterNumber];

  return {
    id: `${cycleYear}-Q${quarterNumber}`,
    quarterNumber,
    year: cycleYear,
    titleEn: meta.en,
    titleMl: meta.ml,
    periodEn: meta.periodEn,
    periodMl: meta.periodMl,
    months
  };
}

/**
 * Returns all 4 quarterly cycles for a given reference year
 */
export function getAllQuarterlyCycles(year: number = 2026): QuarterlyOtCycle[] {
  return [
    getQuarterlyCycleForDate(new Date(year, 3, 1)), // Q1: Mar-May
    getQuarterlyCycleForDate(new Date(year, 6, 1)), // Q2: Jun-Aug
    getQuarterlyCycleForDate(new Date(year, 9, 1)), // Q3: Sep-Nov
    getQuarterlyCycleForDate(new Date(year, 11, 1)), // Q4: Dec-Feb
  ];
}

/**
 * Helper to parse OT hours from any log entry format (number or "02:00" or "2.5")
 */
export function parseOtHoursValue(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const hrs = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      return hrs + (mins >= 30 ? 0.5 : 0);
    }
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Infers the 0-indexed month (0-11) for a daily log row
 */
export function inferLogMonthIndex(row: any, fallbackMonth?: number): number | undefined {
  if (typeof row?.month === 'number' && row.month >= 0 && row.month <= 11) {
    return row.month;
  }
  const dateStr = String(row?.dateStr || row?.date || '').toLowerCase();
  if (dateStr) {
    const shortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    for (let m = 0; m < 12; m++) {
      if (dateStr.includes(shortNames[m])) return m;
    }
    const isoMatch = dateStr.match(/\d{4}-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const parsedM = parseInt(isoMatch[1], 10) - 1;
      if (parsedM >= 0 && parsedM <= 11) return parsedM;
    }
  }
  return fallbackMonth;
}

/**
 * Loads and merges all attendance logs across localStorage and any passed dailyLogs array,
 * deduplicating by (year, monthIndex, dayNum) and preferring entries with higher OT or userEdited.
 */
export function getMergedAttendanceLogsForMonths(
  months: Array<{ monthIndex: number; year: number }>,
  passedLogs: any[] = []
): Array<any> {
  const map = new Map<string, any>();

  const upsertRow = (row: any, defaultMonth?: number, defaultYear: number = 2026) => {
    if (!row) return;
    let dayNum = typeof row.dayNum === 'number' ? row.dayNum : parseInt(String(row.dayNum || ''), 10);
    if (isNaN(dayNum) && row.dateStr) {
      const iso = String(row.dateStr).match(/\d{4}-(\d{1,2})-(\d{1,2})/);
      const lead = String(row.dateStr).match(/^(\d{1,2})/);
      if (iso) dayNum = parseInt(iso[2], 10);
      else if (lead) dayNum = parseInt(lead[1], 10);
    }
    if (!dayNum || isNaN(dayNum)) return;

    const mIdx = inferLogMonthIndex(row, defaultMonth);
    if (mIdx === undefined) return;

    const yr = row.year || defaultYear;
    const key = `${yr}-${mIdx}-${dayNum}`;
    const ot = parseOtHoursValue(row.otHours);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...row, dayNum, month: mIdx, year: yr, otHours: ot });
    } else {
      const existingOt = parseOtHoursValue(existing.otHours);
      if (ot > existingOt || (row.userEdited && !existing.userEdited && ot >= existingOt)) {
        map.set(key, { ...existing, ...row, dayNum, month: mIdx, year: yr, otHours: Math.max(ot, existingOt) });
      }
    }
  };

  // 1. Read from localStorage per-month keys for all requested months
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    for (const m of months) {
      try {
        const raw = localStorage.getItem(`csl_attendance_daily_logs_${m.year}_${m.monthIndex}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((r) => upsertRow(r, m.monthIndex, m.year));
          }
        }
      } catch {}
    }

    // 2. Also check csl_attendance_daily_logs_v2 (active month fallback)
    try {
      const rawV2 = localStorage.getItem('csl_attendance_daily_logs_v2');
      if (rawV2) {
        const parsedV2 = JSON.parse(rawV2);
        if (Array.isArray(parsedV2)) {
          parsedV2.forEach((r) => upsertRow(r, new Date().getMonth(), new Date().getFullYear()));
        }
      }
    } catch {}

    // 3. Also check csl_completed_duty_summary for today's live completed duty OT
    try {
      const rawSummary = localStorage.getItem('csl_completed_duty_summary');
      if (rawSummary) {
        const summary = JSON.parse(rawSummary);
        if (summary && summary.dateKey && parseOtHoursValue(summary.otHours) > 0) {
          const parts = String(summary.dateKey).split('-');
          if (parts.length === 3) {
            const yr = parseInt(parts[0], 10);
            const mIdx = parseInt(parts[1], 10) - 1;
            const dNum = parseInt(parts[2], 10);
            const shortM = CSL_MONTHS_NAMES[mIdx]?.en.slice(0, 3) || 'Nov';
            upsertRow(
              {
                dayNum: dNum,
                month: mIdx,
                year: yr,
                dateStr: `${dNum} ${shortM} ${yr}`,
                shift: summary.shift || 'A2',
                shiftCode: summary.shift || 'A2',
                inTime: summary.inTime || '07:00 AM',
                outTime: summary.outTime || '03:20 PM',
                otHours: parseOtHoursValue(summary.otHours),
                status: 'Present',
                userEdited: true,
              },
              mIdx,
              yr
            );
          }
        }
      }
    } catch {}
  }

  // 4. Merge passed dailyLogs prop (highest priority if passed directly from active state)
  if (Array.isArray(passedLogs)) {
    passedLogs.forEach((r) => upsertRow(r, undefined, 2026));
  }

  return Array.from(map.values());
}

/**
 * Calculates the complete Quarterly OT Summary based on attendance records across localStorage + passed logs
 */
export function calculateQuarterlyOtSummary(
  dailyLogs: any[] = [],
  cap: QuarterlyOtCap = getQuarterlyOtCap(),
  targetDate: Date = new Date()
): QuarterlyOtSummary {
  const cycle = getQuarterlyCycleForDate(targetDate);

  // Merge logs from all 3 months of this cycle from localStorage + passed dailyLogs
  const mergedLogs = getMergedAttendanceLogsForMonths(
    cycle.months.map((m) => ({ monthIndex: m.monthIndex, year: m.year })),
    dailyLogs
  );

  // Populate monthly breakdown for all 3 months in the selected quarter (works for Q1, Q2, Q3, Q4)
  const monthlyBreakdown = cycle.months.map((m) => {
    let ot = 0;
    let days = 0;

    mergedLogs.forEach((row) => {
      if (row.month === m.monthIndex) {
        const rowOt = parseOtHoursValue(row.otHours);
        if (rowOt > 0) {
          ot += rowOt;
          days += 1;
        }
      }
    });

    return {
      ...m,
      otHours: Math.round(ot * 10) / 10,
      daysWithOt: days,
    };
  });

  const totalOtUsed = Math.round(monthlyBreakdown.reduce((sum, m) => sum + m.otHours, 0) * 10) / 10;
  const remainingOt = Math.max(0, Math.round((cap - totalOtUsed) * 10) / 10);
  const overLimitHours = totalOtUsed > cap ? Math.round((totalOtUsed - cap) * 10) / 10 : 0;
  const percentUsed = Math.min(100, Math.round((totalOtUsed / cap) * 100));

  let status: 'safe' | 'warning' | 'danger' | 'exceeded' = 'safe';
  let statusTextEn = 'Within Limit';
  let statusTextMl = 'പരിധിക്കുള്ളിൽ (സുരക്ഷിതം)';

  if (totalOtUsed > cap) {
    status = 'exceeded';
    statusTextEn = `Cap Exceeded by ${overLimitHours}h!`;
    statusTextMl = `പരിധി കഴിഞ്ഞു (+${overLimitHours}h അധികം)!`;
  } else if (percentUsed >= 90) {
    status = 'danger';
    statusTextEn = 'Limit Reaching Alert (>90%)';
    statusTextMl = 'പരിധി അടുക്കുന്നു (>90%)';
  } else if (percentUsed >= 70) {
    status = 'warning';
    statusTextEn = 'Approaching Cap (>70%)';
    statusTextMl = 'ശ്രദ്ധിക്കുക (>70% കഴിഞ്ഞു)';
  }

  return {
    cycle,
    cap,
    totalOtUsed,
    remainingOt,
    overLimitHours,
    percentUsed,
    status,
    statusTextEn,
    statusTextMl,
    monthlyBreakdown,
  };
}

/**
 * Builds NextMonthOtPdfData from all verified OT logs in the current quarter/cycle
 * so any screen (Attendance, Quarterly OT Modal, Calendar) can open the OT Viewer Modal,
 * download PDF/JPG, or share to WhatsApp with 100% of recorded OT included.
 */
export function buildUnifiedOtRegisterPdfData(
  dailyLogs: any[] = [],
  targetDate: Date = new Date(),
  userOverride?: { name?: string; token?: string; department?: string; isContract?: boolean }
) {
  const cycle = getQuarterlyCycleForDate(targetDate);
  const mergedLogs = getMergedAttendanceLogsForMonths(
    cycle.months.map((m) => ({ monthIndex: m.monthIndex, year: m.year })),
    dailyLogs
  );

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'];
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const otRows = mergedLogs
    .filter((r) => parseOtHoursValue(r.otHours) > 0)
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.dayNum - b.dayNum;
    });

  const otLogs = otRows.map((r, idx) => {
    const mIdx = typeof r.month === 'number' ? r.month : targetDate.getMonth();
    const yr = r.year || targetDate.getFullYear();
    const mShort = CSL_MONTHS_NAMES[mIdx]?.en.slice(0, 3) || 'Nov';
    const dObj = new Date(yr, mIdx, r.dayNum);
    const dayName = r.dayName || fullDayNames[dObj.getDay()] || 'Monday';
    const otVal = parseOtHoursValue(r.otHours);
    return {
      slNo: idx + 1,
      dayNumber: r.dayNum,
      dateStr: `${String(r.dayNum).padStart(2, '0')} ${mShort} ${yr}`,
      dayName,
      shift: r.shiftCode || r.shift || 'A2',
      otHours: otVal,
      otHoursFormatted: `${otVal.toFixed(1)} hrs`,
      remarks: r.notes || `${r.shiftCode || 'Duty'} Overtime`,
    };
  });

  const totalOtHours = Math.round(otLogs.reduce((acc, item) => acc + item.otHours, 0) * 10) / 10;

  let savedName = 'Prathyush Mohan K';
  let savedToken = '5312';
  let savedDept = 'Hull Errection';
  let isContract = false;
  try {
    const empCat = localStorage.getItem('csl_employee_category');
    if (empCat === 'contract') isContract = true;
  } catch {}

  return {
    employeeName: userOverride?.name || savedName,
    tokenNumber: userOverride?.token || savedToken,
    department: userOverride?.department || savedDept,
    category: (userOverride?.isContract ?? isContract)
      ? 'Company on Contract Employee (CSL)'
      : 'Permanent Employee (CSL)',
    currentMonthName: CSL_MONTHS_NAMES[targetDate.getMonth()]?.en || 'November',
    currentMonthYear: targetDate.getFullYear(),
    nextMonthName: CSL_MONTHS_NAMES[targetDate.getMonth()]?.en || 'November',
    nextMonthYear: targetDate.getFullYear(),
    cyclePeriod: `${cycle.periodEn} (${cycle.id})`,
    totalOtHours,
    totalOtDays: otLogs.length,
    otLogs,
  };
}

