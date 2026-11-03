/**
 * Cochin Shipyard Limited (CSL) - Official Employee Leave Scheme
 * പെർമനന്റ് & കോൺട്രാക്ട് ജീവനക്കാർക്കുള്ള വിവിധ തരം ലീവുകൾ
 */

export type CslLeaveCode = 'CL' | 'EL' | 'HPL' | 'RH' | 'CO' | 'CL_HALF1' | 'CL_HALF2' | 'SPECIAL';

export interface CslLeaveTypeDefinition {
  code: CslLeaveCode;
  shortLabel: string;
  name: string;
  nameMl: string;
  category: 'Casual' | 'Earned' | 'Half Pay' | 'Medical' | 'Restricted' | 'Compensatory' | 'Special';
  defaultBalance: number;
  totalPerYear: number;
  unit: string;
  deductionDays: number;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
  descriptionMl: string;
  descriptionEn: string;
  rules: string[];
}

export const CSL_LEAVE_TYPES: Record<CslLeaveCode, CslLeaveTypeDefinition> = {
  CL: {
    code: 'CL',
    shortLabel: 'CL',
    name: 'Casual Leave (CL)',
    nameMl: 'കാഷ്വൽ ലീവ് (CL)',
    category: 'Casual',
    defaultBalance: 8,
    totalPerYear: 12,
    unit: 'Days',
    deductionDays: 1.0,
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    borderCol: 'border-amber-500/50',
    descriptionMl: 'വ്യക്തിപരമായ ആവശ്യങ്ങൾക്കും അത്യാഹിതങ്ങൾക്കും. വർഷത്തിൽ 12 ദിവസം അനുവദനീയം. (നിലവിലെ ബാലൻസ്: 8 ദിവസം).',
    descriptionEn: 'For unforeseen personal works and family affairs. 12 days credited annually (Current Balance: 8 Days).',
    rules: [
      'Cannot be combined with Earned Leave (EL) or Half Pay Leave (HPL).',
      'Maximum 3 consecutive days at a time without prior HOD sanction.',
      'Lapses on December 31st each calendar year (no carry-forward).'
    ],
  },
  EL: {
    code: 'EL',
    shortLabel: 'EL',
    name: 'Earned Leave (EL / Privilege)',
    nameMl: 'ഏൺഡ് ലീവ് (EL / പ്രിവിലേജ്)',
    category: 'Earned',
    defaultBalance: 24,
    totalPerYear: 30,
    unit: 'Days',
    deductionDays: 1.0,
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    borderCol: 'border-purple-500/50',
    descriptionMl: 'ഡ്യൂട്ടി ചെയ്തതിന്റെ അടിസ്ഥാനത്തിൽ ലഭിക്കുന്ന ലീവ്. വർഷത്തിൽ 30 ദിവസം ക്രെഡിറ്റ്. 300 ദിവസം വരെ കൂട്ടിവെക്കാം / എൻകാഷ് ചെയ്യാം.',
    descriptionEn: 'Earned by duty service (30 days/year credited in Jan & Jul). Can accumulate up to 300 days / encashable.',
    rules: [
      '30 days credited per year (15 on Jan 1, 15 on Jul 1).',
      'Can be encashed as per CSL Leave Encashment Rules.',
      'Requires prior approval from Division Head.'
    ],
  },
  HPL: {
    code: 'HPL',
    shortLabel: 'HPL',
    name: 'Half Pay Leave (HPL)',
    nameMl: 'ഹാഫ് പേ ലീവ് (HPL)',
    category: 'Half Pay',
    defaultBalance: 16,
    totalPerYear: 20,
    unit: 'Days',
    deductionDays: 1.0,
    badgeBg: 'bg-indigo-950/80',
    badgeText: 'text-indigo-300',
    borderCol: 'border-indigo-500/50',
    descriptionMl: 'അർദ്ധവേതന അവധി (Half Pay Leave). വർഷത്തിൽ 20 ദിവസം ക്രെഡിറ്റ് ചെയ്യപ്പെടുന്നു.',
    descriptionEn: 'Half Pay Leave (20 half-pay days credited per completed year of service).',
    rules: [
      '20 days credited per completed year of service.',
      'Accumulation without limit throughout service.',
      'Can be availed as Half Pay Leave.'
    ],
  },
  RH: {
    code: 'RH',
    shortLabel: 'RH',
    name: 'Restricted Holiday (RH)',
    nameMl: 'റസ്ട്രിക്റ്റഡ് ഹോളിഡേ (RH)',
    category: 'Restricted',
    defaultBalance: 2,
    totalPerYear: 2,
    unit: 'Days',
    deductionDays: 1.0,
    badgeBg: 'bg-indigo-950/80',
    badgeText: 'text-indigo-300',
    borderCol: 'border-indigo-500/50',
    descriptionMl: 'പ്രത്യേക ഉത്സവങ്ങൾക്കും ആചാരങ്ങൾക്കും CSL അനുവദിച്ചിട്ടുള്ള 7 ദിവസങ്ങളിൽ നിന്ന് തിരഞ്ഞെടുക്കാവുന്ന 2 അവധികൾ.',
    descriptionEn: 'Optional holiday for festive / cultural observances from CSL official RH list (2 days per calendar year).',
    rules: [
      'Any 2 days can be availed from the CSL Gazetted Restricted Holidays list.',
      'Lapses on December 31st if unavailed.',
      'Prior intimation required to shift supervisor.'
    ],
  },
  CO: {
    code: 'CO',
    shortLabel: 'CO',
    name: 'Compensatory Off (CO / Comp-Off)',
    nameMl: 'കോമ്പൻസേറ്ററി ഓഫ് (CO)',
    category: 'Compensatory',
    defaultBalance: 3,
    totalPerYear: 10,
    unit: 'Days',
    deductionDays: 1.0,
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-300',
    borderCol: 'border-blue-500/50',
    descriptionMl: 'ഞായറാഴ്ചകളിലോ അവധി ദിവസങ്ങളിലോ ചെയ്ത അധിക ഷിപ്പ് റിപ്പയർ / എമർജൻസി ഡ്യൂട്ടിക്ക് പകരമായി ലഭിക്കുന്ന ലീവ്.',
    descriptionEn: 'Compensatory rest for emergency ship repairs / trial duty executed on Sundays or yard closed holidays.',
    rules: [
      'Earned by working full shift on a recognized weekly off or holiday.',
      'Must be availed within 30 days of earning.',
      'Subject to departmental clearance.'
    ],
  },
  CL_HALF1: {
    code: 'CL_HALF1',
    shortLabel: '0.5 CL (1st Half)',
    name: 'Casual Leave - First Half (0.5 CL)',
    nameMl: 'അരദിവസത്തെ CL (ആദ്യ പകുതി)',
    category: 'Casual',
    defaultBalance: 8,
    totalPerYear: 12,
    unit: 'Half Day',
    deductionDays: 0.5,
    badgeBg: 'bg-amber-950/70',
    badgeText: 'text-amber-200',
    borderCol: 'border-amber-400/40',
    descriptionMl: 'ഷിഫ്റ്റിന്റെ ആദ്യ പകുതിയിൽ (രാവിലെ) അവധി, രണ്ടാം പകുതിയിൽ ഡ്യൂട്ടി.',
    descriptionEn: 'Half-day Casual Leave during 1st half of shift (0.5 day CL deducted).',
    rules: [
      'Deduction: 0.5 days from Casual Leave balance.',
      'Punch in for second half mandatory.'
    ],
  },
  CL_HALF2: {
    code: 'CL_HALF2',
    shortLabel: '0.5 CL (2nd Half)',
    name: 'Casual Leave - Second Half (0.5 CL)',
    nameMl: 'അരദിവസത്തെ CL (രണ്ടാം പകുതി)',
    category: 'Casual',
    defaultBalance: 8,
    totalPerYear: 12,
    unit: 'Half Day',
    deductionDays: 0.5,
    badgeBg: 'bg-amber-950/70',
    badgeText: 'text-amber-200',
    borderCol: 'border-amber-400/40',
    descriptionMl: 'ഷിഫ്റ്റിന്റെ ആദ്യ പകുതിയിൽ ഡ്യൂട്ടി പൂർത്തിയാക്കി രണ്ടാം പകുതിയിൽ അവധി.',
    descriptionEn: 'Half-day Casual Leave during 2nd half of shift (0.5 day CL deducted).',
    rules: [
      'Deduction: 0.5 days from Casual Leave balance.',
      'Punch out after completing first half mandatory.'
    ],
  },
  SPECIAL: {
    code: 'SPECIAL',
    shortLabel: 'Special',
    name: 'Special / Paternity / Blood Donation Leave',
    nameMl: 'പ്രത്യേക ലീവ് (സ്പെഷ്യൽ ലീവ്)',
    category: 'Special',
    defaultBalance: 1,
    totalPerYear: 5,
    unit: 'Days',
    deductionDays: 1.0,
    badgeBg: 'bg-teal-950/80',
    badgeText: 'text-teal-300',
    borderCol: 'border-teal-500/50',
    descriptionMl: 'രക്തദാനം, യൂണിയൻ പ്രതിനിധ്യം, ഔദ്യോഗിക കായിക മത്സരങ്ങൾ, പിതൃത്വ അവധി (15 ദിവസം) എന്നിവയ്ക്കുള്ള സ്പെഷ്യൽ ലീവ്.',
    descriptionEn: 'Special Casual Leave for blood donation, official sports, or paternity leave.',
    rules: [
      'Blood donation in CSL hospital: 1 day Special CL.',
      'Paternity leave: 15 days on full pay.',
      'Maternity leave: 180 days on full pay.'
    ],
  },
};

export const CSL_LEAVE_CODES: CslLeaveCode[] = ['CL', 'EL', 'HPL', 'RH', 'CO', 'CL_HALF1', 'CL_HALF2', 'SPECIAL'];

export interface CslLeaveBalances {
  cl: number;
  el: number;
  hpl: number;
  rh: number;
  co: number;
  special: number;
}

export const DEFAULT_LEAVE_BALANCES: CslLeaveBalances = {
  cl: 8,
  el: 24,
  hpl: 16,
  rh: 2,
  co: 3,
  special: 1,
};

export const getLeaveBalances = (): CslLeaveBalances => {
  try {
    const saved = localStorage.getItem('csl_leave_balances_v2');
    if (saved) return { ...DEFAULT_LEAVE_BALANCES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_LEAVE_BALANCES;
};

export const saveLeaveBalances = (balances: CslLeaveBalances) => {
  try {
    localStorage.setItem('csl_leave_balances_v2', JSON.stringify(balances));
    window.dispatchEvent(new CustomEvent('csl-leave-balances-updated', { detail: balances }));
  } catch {}
};
