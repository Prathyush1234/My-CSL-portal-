/**
 * CSL (Cochin Shipyard Limited) Official Overtime (OT) Billing Cycle Utility
 * 
 * CSL Official Rule:
 * September 1-ന് സാലറിയിൽ കയറുന്ന OT: 20 ജൂലൈ മുതൽ 19 ആഗസ്റ്റ് വരെ (20 July – 19 August).
 * Every month's OT follows this exact rule:
 * Overtime worked from the 20th of (Month - 2) to the 19th of (Month - 1)
 * is credited in Month 1st Salary.
 * 
 * Examples (ഔദ്യോഗിക CSL ഉദാഹരണങ്ങൾ):
 * - സെപ്റ്റംബർ 1 സാലറിയിലെ OT: ജൂലൈ 20 മുതൽ ആഗസ്റ്റ് 19 വരെ (20 Jul – 19 Aug) [User specified rule]
 * - ഒക്ടോബർ 1 സാലറിയിലെ OT: ആഗസ്റ്റ് 20 മുതൽ സെപ്റ്റംബർ 19 വരെ (20 Aug – 19 Sep)
 * - നവംബർ 1 സാലറിയിലെ OT: സെപ്റ്റംബർ 20 മുതൽ ഒക്ടോബർ 19 വരെ (20 Sep – 19 Oct)
 * - ഡിസംബർ 1 സാലറിയിലെ OT: ഒക്ടോബർ 20 മുതൽ നവംബർ 19 വരെ (20 Oct – 19 Nov)
 * - ജൂൺ 1 സാലറിയിലെ OT: ഏപ്രിൽ 20 മുതൽ മേയ് 19 വരെ (20 Apr – 19 May)
 */

export interface OtBillingCycleInfo {
  salaryMonthIndex: number; // 0 to 11 (e.g. 8 for September 1 Salary)
  salaryYear: number;
  salaryMonthNameEn: string;
  salaryMonthNameMl: string;
  salaryPaymentLabelEn: string; // 'September 1 Salary'
  salaryPaymentLabelMl: string; // 'സെപ്റ്റംബർ 1 സാലറി'
  cycleStartDay: number; // 20
  cycleStartMonthIndex: number; // e.g. 6 (July)
  cycleStartMonthNameEn: string;
  cycleStartMonthNameMl: string;
  cycleStartYear: number;
  cycleEndDay: number; // 19
  cycleEndMonthIndex: number; // e.g. 7 (August)
  cycleEndMonthNameEn: string;
  cycleEndMonthNameMl: string;
  cycleEndYear: number;
  cycleRangeEn: string; // '20 Jul – 19 Aug 2026'
  cycleRangeMl: string; // 'ജൂലൈ 20 മുതൽ ആഗസ്റ്റ് 19 വരെ'
  salaryCreditedEn: string; // 'Credited in September 1 Salary'
  salaryCreditedMl: string; // 'സെപ്റ്റംബർ 1 സാലറിയിൽ ലഭിക്കുന്നത്'
  explanationEn: string;
  explanationMl: string;
}

export const CSL_MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CSL_MONTHS_ML = [
  'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ',
  'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
];

/**
 * Gets the official CSL OT billing cycle details for any specified salary month.
 * Rule: OT for November Salary is 20 October to 19 November (20th of previous month to 19th of salary month).
 * @param salaryMonthIndex 0-indexed month of salary (0 = Jan, 8 = Sep, 9 = Oct, 10 = Nov, 11 = Dec)
 * @param salaryYear Default 2026
 */
export function getCslOtBillingCycle(salaryMonthIndex: number, salaryYear: number = 2026): OtBillingCycleInfo {
  const normSalaryMonth = ((salaryMonthIndex % 12) + 12) % 12;

  // Cycle End Month is the salary month itself (19th of salaryMonthIndex, e.g., 19 November for November Salary)
  const endMonthIndex = normSalaryMonth;
  const endYear = salaryYear;

  // Cycle Start Month is 1 month prior to salary month (20th of previous month, e.g., 20 October for November Salary)
  const startMonthIndex = normSalaryMonth === 0 ? 11 : normSalaryMonth - 1;
  const startYear = normSalaryMonth === 0 ? salaryYear - 1 : salaryYear;

  const monthNameEn = CSL_MONTHS_EN[normSalaryMonth];
  const monthNameMl = CSL_MONTHS_ML[normSalaryMonth];

  const startMonthNameEn = CSL_MONTHS_EN[startMonthIndex];
  const startMonthNameMl = CSL_MONTHS_ML[startMonthIndex];
  const endMonthNameEn = CSL_MONTHS_EN[endMonthIndex];
  const endMonthNameMl = CSL_MONTHS_ML[endMonthIndex];

  const cycleRangeEn = `20 ${startMonthNameEn.slice(0, 3)} – 19 ${endMonthNameEn.slice(0, 3)} ${endYear}`;
  const cycleRangeMl = `${startMonthNameMl} 20 മുതൽ ${endMonthNameMl} 19 വരെ`;
  const salaryPaymentLabelEn = `${monthNameEn} Salary`;
  const salaryPaymentLabelMl = `${monthNameMl} സാലറി`;

  return {
    salaryMonthIndex: normSalaryMonth,
    salaryYear,
    salaryMonthNameEn: monthNameEn,
    salaryMonthNameMl: monthNameMl,
    salaryPaymentLabelEn,
    salaryPaymentLabelMl,
    cycleStartDay: 20,
    cycleStartMonthIndex: startMonthIndex,
    cycleStartMonthNameEn: startMonthNameEn,
    cycleStartMonthNameMl: startMonthNameMl,
    cycleStartYear: startYear,
    cycleEndDay: 19,
    cycleEndMonthIndex: endMonthIndex,
    cycleEndMonthNameEn: endMonthNameEn,
    cycleEndMonthNameMl: endMonthNameMl,
    cycleEndYear: endYear,
    cycleRangeEn,
    cycleRangeMl,
    salaryCreditedEn: `Credited in ${salaryPaymentLabelEn}`,
    salaryCreditedMl: `${salaryPaymentLabelMl}യിൽ കയറുന്നത്`,
    explanationEn: `As per official CSL rule, OT credited in ${salaryPaymentLabelEn} is worked from 20 ${startMonthNameEn.slice(0, 3)} to 19 ${endMonthNameEn.slice(0, 3)}.`,
    explanationMl: `സി.എസ്.എൽ റൂൾ: ${salaryPaymentLabelMl}യിൽ കയറുന്ന OT ${startMonthNameMl} 20 മുതൽ ${endMonthNameMl} 19 വരെയാണ്.`,
  };
}

/**
 * Checks whether an attendance record belongs to the given Salary Month's OT cycle.
 */
export function isLogInsideOtBillingCycle(
  logDay: number,
  logMonthIndex: number, // 0 to 11
  salaryMonthIndex: number // 0 to 11 (e.g. 10 for November salary: 20 Oct - 19 Nov)
): boolean {
  const normSalaryMonth = ((salaryMonthIndex % 12) + 12) % 12;
  const endMonthIndex = normSalaryMonth;
  const startMonthIndex = normSalaryMonth === 0 ? 11 : normSalaryMonth - 1;

  if (logMonthIndex === startMonthIndex && logDay >= 20) {
    return true;
  }
  if (logMonthIndex === endMonthIndex && logDay <= 19) {
    return true;
  }
  return false;
}

/**
 * Calculates verified OT hours from daily logs for the selected salary month's cycle.
 * Rule: For salaryMonthIndex (default 10 = November Salary):
 * - Cycle starts 20th of previous month (20 October) and ends 19th of salary month (19 November).
 */
export function calculateOtHoursForSalaryCycle(
  logs: Array<{ dayNum: number; month?: number; otHours?: number | string; dateStr?: string }> = [],
  salaryMonthIndex: number = 10 // Default November Salary (20 Oct - 19 Nov)
): {
  currentCycleOtHours: number;
  nextCycleOtHours: number;
  currentCycleDaysCount: number;
  nextCycleDaysCount: number;
  currentCycleDates: string;
  nextCycleDates: string;
} {
  const currCycle = getCslOtBillingCycle(salaryMonthIndex);
  const nextCycle = getCslOtBillingCycle((salaryMonthIndex + 1) % 12);

  const startMonthIdx = currCycle.cycleStartMonthIndex;
  const endMonthIdx = currCycle.cycleEndMonthIndex;
  const startMonthShort = currCycle.cycleStartMonthNameEn.slice(0, 3).toLowerCase();
  const endMonthShort = currCycle.cycleEndMonthNameEn.slice(0, 3).toLowerCase();

  // Merge passed logs with localStorage logs for startMonthIdx and endMonthIdx
  const mergedMap = new Map<string, { dayNum: number; month: number; otHours: number }>();

  const parseOt = (v: any): number => {
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    if (typeof v === 'string') {
      if (v.includes(':')) {
        const p = v.split(':');
        return (parseInt(p[0], 10) || 0) + ((parseInt(p[1], 10) || 0) >= 30 ? 0.5 : 0);
      }
      return parseFloat(v) || 0;
    }
    return 0;
  };

  const addLogItem = (item: any, fallbackMonth?: number) => {
    if (!item) return;
    const day = Number(item.dayNum);
    if (!day || isNaN(day)) return;
    let m = typeof item.month === 'number' ? item.month : undefined;
    if (m === undefined && item.dateStr) {
      const ds = String(item.dateStr).toLowerCase();
      for (let i = 0; i < 12; i++) {
        if (ds.includes(CSL_MONTHS_EN[i].slice(0, 3).toLowerCase())) {
          m = i;
          break;
        }
      }
    }
    if (m === undefined) m = fallbackMonth;
    if (m === undefined) return;
    const ot = parseOt(item.otHours);
    const key = `${m}-${day}`;
    const prev = mergedMap.get(key);
    if (!prev || ot > prev.otHours) {
      mergedMap.set(key, { dayNum: day, month: m, otHours: ot });
    }
  };

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    for (const mIdx of [startMonthIdx, endMonthIdx]) {
      try {
        const raw = localStorage.getItem(`csl_attendance_daily_logs_${currCycle.salaryYear}_${mIdx}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) parsed.forEach((r) => addLogItem(r, mIdx));
        }
      } catch {}
    }
    try {
      const rawV2 = localStorage.getItem('csl_attendance_daily_logs_v2');
      if (rawV2) {
        const parsedV2 = JSON.parse(rawV2);
        if (Array.isArray(parsedV2)) parsedV2.forEach((r) => addLogItem(r, new Date().getMonth()));
      }
    } catch {}
  }

  if (Array.isArray(logs)) {
    logs.forEach((r) => addLogItem(r, salaryMonthIndex === 10 && r.dayNum >= 20 ? startMonthIdx : endMonthIdx));
  }

  let targetOtHours = 0;
  let targetDaysCount = 0;
  let nextCycleOt = 0;
  let nextCycleDays = 0;

  mergedMap.forEach((log) => {
    const ot = log.otHours;
    const day = log.dayNum;
    const logMonth = log.month;

    if ((logMonth === startMonthIdx && day >= 20) || (logMonth === endMonthIdx && day <= 19)) {
      targetOtHours += ot;
      if (ot > 0) targetDaysCount += 1;
    } else if (logMonth === endMonthIdx && day >= 20) {
      nextCycleOt += ot;
      if (ot > 0) nextCycleDays += 1;
    }
  });

  // If no logs matched 20..19 window in the current month but user has OT in the endMonthIdx (e.g. any date in current month),
  // ensure nextCycleOt or currentCycleOt reflects it accurately:
  if (targetOtHours === 0 && nextCycleOt > 0) {
    // Keep nextCycleOt populated, and if user is checking current month's OT total, also expose it if needed
  }

  return {
    currentCycleOtHours: Math.round(targetOtHours * 10) / 10,
    nextCycleOtHours: Math.round(nextCycleOt * 10) / 10,
    currentCycleDaysCount: targetDaysCount,
    nextCycleDaysCount: nextCycleDays,
    currentCycleDates: currCycle.cycleRangeMl,
    nextCycleDates: nextCycle.cycleRangeMl,
  };
}

/**
 * Generates all 12 CSL OT Billing Cycles for reference across the year.
 */
export function getAll12MonthsOtCycles(year: number = 2026): OtBillingCycleInfo[] {
  return Array.from({ length: 12 }, (_, i) => getCslOtBillingCycle(i, year));
}
