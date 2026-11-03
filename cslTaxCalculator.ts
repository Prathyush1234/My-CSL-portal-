/**
 * CSL Income Tax Calculator Engine (FY 2026-27 / AY 2027-28 & FY 2025-26)
 * Specifically modeled for Cochin Shipyard Limited & Indian PSU employees.
 */

export interface TaxInputData {
  financialYear: '2026-27' | '2025-26';
  ageGroup: 'regular' | 'senior' | 'superSenior'; // <60, 60-80, >80
  
  // Income from Salary (Annual)
  basicPayMonthly: number;
  monthsInService: number; // usually 12
  daPercent: number; // CSL IDA % e.g. 54.10%
  hraReceivedAnnual: number;
  rentPaidAnnual: number;
  isMetroCity: boolean; // false for Kochi (40% non-metro)
  perksAndAllowancesAnnual: number; // Cafeteria 35%, etc.
  overtimeAnnual: number; // OT earnings
  annualBonusPRP: number; // Performance Related Pay
  
  // Other Income
  incomeFromOtherSources: number; // Bank interest, dividends
  savingsInterest: number;
  incomeFromHouseProperty: number; // Rental income or negative for home loan
  
  // Deductions (Old Regime)
  sec80C: number; // EPF/VPF, PPF, ELSS, LIC, Home Loan Principal (Max 1.5L)
  sec80CCD1B: number; // Additional NPS (Max 50k)
  sec80CCD2: number; // Employer NPS Contribution (Allowed in New Regime too!)
  sec80D_Self: number; // Health Insurance Self & Family (Max 25k)
  sec80D_Parents: number; // Health Insurance Parents (Max 25k / 50k)
  parentsSeniorCitizen: boolean;
  sec24b_HomeLoanInterest: number; // Interest on housing loan (Max 2L)
  sec80G_Donations: number;
  otherDeductions: number; // 80E, 80U, 80GGC, etc.
}

export interface SlabBreakdown {
  slab: string;
  rate: string;
  taxableInSlab: number;
  taxAmount: number;
}

export interface RegimeTaxResult {
  regime: 'new' | 'old';
  grossTotalIncome: number;
  standardDeduction: number;
  hraExemption: number;
  totalChapterVIA_Deductions: number;
  netTaxableIncome: number;
  baseTax: number;
  rebate87A: number;
  taxAfterRebate: number;
  surcharge: number;
  healthAndEduCess: number;
  totalTaxLiability: number;
  monthlyTdsDeduction: number;
  effectiveTaxRate: number;
  slabs: SlabBreakdown[];
}

export interface TaxComparisonResult {
  newRegime: RegimeTaxResult;
  oldRegime: RegimeTaxResult;
  recommendedRegime: 'new' | 'old' | 'equal';
  taxDifference: number; // positive number of savings
  savingsSummaryEn: string;
  savingsSummaryMl: string;
}

export const CSL_PAY_SCALE_PRESETS = [
  { code: 'W1', name: 'Workman W1 (Semi-Skilled)', basic: 18500, category: 'workman' },
  { code: 'W3', name: 'Workman W3 (Skilled Gr. II)', basic: 20000, category: 'workman' },
  { code: 'W5', name: 'Workman W5 (Skilled Gr. I)', basic: 23500, category: 'workman' },
  { code: 'W8', name: 'Workman W8 (Special Grade)', basic: 28500, category: 'workman' },
  { code: 'S1', name: 'Supervisor S1 (Assistant)', basic: 31000, category: 'supervisor' },
  { code: 'S2', name: 'Supervisor S2 (Senior Asst.)', basic: 35000, category: 'supervisor' },
  { code: 'S3', name: 'Supervisor S3 (Superintendent)', basic: 40000, category: 'supervisor' },
  { code: 'E1', name: 'Executive E1 (Asst. Manager)', basic: 40000, category: 'executive' },
  { code: 'E2', name: 'Executive E2 (Deputy Manager)', basic: 50000, category: 'executive' },
  { code: 'E3', name: 'Executive E3 (Manager)', basic: 60000, category: 'executive' },
  { code: 'E4', name: 'Executive E4 (Senior Manager)', basic: 70000, category: 'executive' },
  { code: 'E5', name: 'Executive E5 (AGM)', basic: 80000, category: 'executive' },
];

export const getEmptyTaxInputs = (daPercent: number = 54.10): TaxInputData => {
  return {
    financialYear: '2026-27',
    ageGroup: 'regular',
    basicPayMonthly: 0,
    monthsInService: 12,
    daPercent: daPercent,
    hraReceivedAnnual: 0,
    rentPaidAnnual: 0,
    isMetroCity: false,
    perksAndAllowancesAnnual: 0,
    overtimeAnnual: 0,
    annualBonusPRP: 0,
    incomeFromOtherSources: 0,
    savingsInterest: 0,
    incomeFromHouseProperty: 0,
    sec80C: 0,
    sec80CCD1B: 0,
    sec80CCD2: 0,
    sec80D_Self: 0,
    sec80D_Parents: 0,
    parentsSeniorCitizen: false,
    sec24b_HomeLoanInterest: 0,
    sec80G_Donations: 0,
    otherDeductions: 0,
  };
};

export const createTaxInputsFromPayslip = (payslip: any, fallbackDa: number = 54.10): TaxInputData => {
  const earnings = payslip?.earningsMonthly || {};
  const deductions = payslip?.deductionsMonthly || {};

  const basicMonthly = Number(earnings.basicPay) || 0;
  const daPct = Number(earnings.daPercent) || fallbackDa;
  const annualBasic = basicMonthly * 12;
  const annualDa = Math.round((annualBasic * daPct) / 100);

  const annualHra = earnings.hra ? Math.round(Number(earnings.hra) * 12) : Math.round(annualBasic * 0.18);
  const annualPerks = earnings.perksAndAllowances ? Math.round(Number(earnings.perksAndAllowances) * 12) : Math.round(annualBasic * 0.35);
  const annualOt = earnings.overtimePay ? Math.round(Number(earnings.overtimePay) * 12) : 0;

  // Annual PF deduction from payslip (auto-fills 80C)
  const annualPf = deductions.providentFund ? Math.round(Number(deductions.providentFund) * 12) : Math.round((annualBasic + annualDa) * 0.12);
  const annualNpsEmployer = deductions.npsEmployer ? Math.round(Number(deductions.npsEmployer) * 12) : 0;
  const annualNpsEmployee = deductions.npsEmployee ? Math.round(Number(deductions.npsEmployee) * 12) : 0;

  return {
    financialYear: '2026-27',
    ageGroup: 'regular',
    basicPayMonthly: basicMonthly,
    monthsInService: 12,
    daPercent: daPct,
    hraReceivedAnnual: annualHra,
    rentPaidAnnual: 0,
    isMetroCity: false,
    perksAndAllowancesAnnual: annualPerks,
    overtimeAnnual: annualOt,
    annualBonusPRP: 0,
    incomeFromOtherSources: 0,
    savingsInterest: 0,
    incomeFromHouseProperty: 0,
    sec80C: Math.min(150000, annualPf),
    sec80CCD1B: Math.min(50000, annualNpsEmployee),
    sec80CCD2: annualNpsEmployer,
    sec80D_Self: 0,
    sec80D_Parents: 0,
    parentsSeniorCitizen: false,
    sec24b_HomeLoanInterest: 0,
    sec80G_Donations: 0,
    otherDeductions: 0,
  };
};

export const getDefaultTaxInputs = (
  monthlyBasic: number = 23500,
  daPercent: number = 54.10,
  annualOt: number = 36000
): TaxInputData => {
  const annualBasic = monthlyBasic * 12;
  const annualDa = (annualBasic * daPercent) / 100;
  const baseSalary = annualBasic + annualDa;
  
  // Standard CSL HRA (18% in Kochi Class Y city)
  const annualHra = Math.round(annualBasic * 0.18);
  // CSL Cafeteria allowances (35% of Basic)
  const annualPerks = Math.round(annualBasic * 0.35);
  // Annual CSL PF deduction (12% of Basic + DA)
  const annualEpf = Math.round(baseSalary * 0.12);

  return {
    financialYear: '2026-27',
    ageGroup: 'regular',
    basicPayMonthly: monthlyBasic,
    monthsInService: 12,
    daPercent: daPercent,
    hraReceivedAnnual: annualHra,
    rentPaidAnnual: annualHra > 0 ? annualHra + 24000 : 0, // typical rental in Kochi
    isMetroCity: false, // Kochi is non-metro (40% limit)
    perksAndAllowancesAnnual: annualPerks,
    overtimeAnnual: annualOt,
    annualBonusPRP: 45000,
    incomeFromOtherSources: 12000,
    savingsInterest: 8000,
    incomeFromHouseProperty: 0,
    sec80C: Math.min(150000, annualEpf + 30000), // EPF + LIC/PPF
    sec80CCD1B: 25000, // Voluntary NPS
    sec80CCD2: Math.round(baseSalary * 0.10), // Employer NPS
    sec80D_Self: 15000, // Health insurance
    sec80D_Parents: 20000,
    parentsSeniorCitizen: true,
    sec24b_HomeLoanInterest: 0,
    sec80G_Donations: 5000,
    otherDeductions: 0,
  };
};

/**
 * Calculate HRA exemption under Section 10(13A) (Old Regime only)
 */
export const calculateHraExemption = (
  basicAndDaAnnual: number,
  hraReceivedAnnual: number,
  rentPaidAnnual: number,
  isMetro: boolean = false
): number => {
  if (hraReceivedAnnual <= 0 || rentPaidAnnual <= 0) return 0;
  const limit1 = hraReceivedAnnual;
  const limit2 = Math.max(0, rentPaidAnnual - (basicAndDaAnnual * 0.10));
  const limit3 = isMetro ? basicAndDaAnnual * 0.50 : basicAndDaAnnual * 0.40;
  return Math.max(0, Math.min(limit1, limit2, limit3));
};

/**
 * Calculate Income Tax under New Tax Regime (Section 115BAC)
 * Budget update: Standard deduction ₹75,000. Rebate u/s 87A up to ₹7,00,000 (Effective 0 tax up to ₹7.75L).
 */
export const calculateNewRegimeTax = (
  grossSalary: number,
  otherIncome: number,
  employerNps80CCD2: number,
  fy: '2026-27' | '2025-26' = '2026-27'
): RegimeTaxResult => {
  const standardDeduction = 75000;
  const grossTotalIncome = Math.max(0, grossSalary + otherIncome);
  
  // Section 80CCD(2) employer NPS contribution is allowed in New Regime up to 14% of Basic + DA for PSUs!
  const netTaxableIncome = Math.max(0, grossTotalIncome - standardDeduction - employerNps80CCD2);

  // New Tax Regime Slabs (Section 115BAC)
  // 0 - 3,00,000: 0%
  // 3,00,001 - 7,00,000: 5% (max 20,000)
  // 7,00,001 - 10,00,000: 10% (max 30,000)
  // 10,00,001 - 12,00,000: 15% (max 30,000)
  // 12,00,001 - 15,00,000: 20% (max 60,000)
  // Above 15,00,000: 30%
  const slabs: SlabBreakdown[] = [];
  let baseTax = 0;
  let remaining = netTaxableIncome;

  // Slab 1: Up to 3,00,000
  const slab1Amt = Math.min(remaining, 300000);
  slabs.push({ slab: '₹0 – ₹3,00,000', rate: '0% (Nil)', taxableInSlab: slab1Amt, taxAmount: 0 });
  remaining = Math.max(0, remaining - 300000);

  // Slab 2: 3,00,001 – 7,00,000 (4,00,000 bracket)
  const slab2Amt = Math.min(remaining, 400000);
  const slab2Tax = slab2Amt * 0.05;
  baseTax += slab2Tax;
  slabs.push({ slab: '₹3,00,001 – ₹7,00,000', rate: '5%', taxableInSlab: slab2Amt, taxAmount: slab2Tax });
  remaining = Math.max(0, remaining - 400000);

  // Slab 3: 7,00,001 – 10,00,000 (3,00,000 bracket)
  const slab3Amt = Math.min(remaining, 300000);
  const slab3Tax = slab3Amt * 0.10;
  baseTax += slab3Tax;
  slabs.push({ slab: '₹7,00,001 – ₹10,00,000', rate: '10%', taxableInSlab: slab3Amt, taxAmount: slab3Tax });
  remaining = Math.max(0, remaining - 300000);

  // Slab 4: 10,00,001 – 12,00,000 (2,00,000 bracket)
  const slab4Amt = Math.min(remaining, 200000);
  const slab4Tax = slab4Amt * 0.15;
  baseTax += slab4Tax;
  slabs.push({ slab: '₹10,00,001 – ₹12,00,000', rate: '15%', taxableInSlab: slab4Amt, taxAmount: slab4Tax });
  remaining = Math.max(0, remaining - 200000);

  // Slab 5: 12,00,001 – 15,00,000 (3,00,000 bracket)
  const slab5Amt = Math.min(remaining, 300000);
  const slab5Tax = slab5Amt * 0.20;
  baseTax += slab5Tax;
  slabs.push({ slab: '₹12,00,001 – ₹15,00,000', rate: '20%', taxableInSlab: slab5Amt, taxAmount: slab5Tax });
  remaining = Math.max(0, remaining - 300000);

  // Slab 6: Above 15,00,000
  if (remaining > 0) {
    const slab6Tax = remaining * 0.30;
    baseTax += slab6Tax;
    slabs.push({ slab: 'Above ₹15,00,000', rate: '30%', taxableInSlab: remaining, taxAmount: slab6Tax });
  }

  // Rebate u/s 87A under New Regime: If taxable income <= 7,00,000, 100% rebate (max 25,000)!
  let rebate87A = 0;
  if (netTaxableIncome <= 700000) {
    rebate87A = baseTax;
  } else if (netTaxableIncome > 700000 && netTaxableIncome <= 727777) {
    // Marginal relief under Section 87A: Tax payable cannot exceed income exceeding ₹7 Lakhs
    const excessIncome = netTaxableIncome - 700000;
    if (baseTax > excessIncome) {
      rebate87A = baseTax - excessIncome;
    }
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const surcharge = 0; // for income > 50L, standard calculation
  const healthAndEduCess = Math.round(taxAfterRebate * 0.04);
  const totalTaxLiability = taxAfterRebate + healthAndEduCess;
  const monthlyTdsDeduction = Math.round(totalTaxLiability / 12);
  const effectiveTaxRate = grossTotalIncome > 0 ? Number(((totalTaxLiability / grossTotalIncome) * 100).toFixed(2)) : 0;

  return {
    regime: 'new',
    grossTotalIncome,
    standardDeduction,
    hraExemption: 0,
    totalChapterVIA_Deductions: employerNps80CCD2,
    netTaxableIncome,
    baseTax,
    rebate87A,
    taxAfterRebate,
    surcharge,
    healthAndEduCess,
    totalTaxLiability,
    monthlyTdsDeduction,
    effectiveTaxRate,
    slabs,
  };
};

/**
 * Calculate Income Tax under Old Tax Regime
 */
export const calculateOldRegimeTax = (
  input: TaxInputData,
  grossSalary: number,
  otherIncome: number,
  basicAndDaAnnual: number
): RegimeTaxResult => {
  const standardDeduction = 50000;
  const hraExemption = calculateHraExemption(
    basicAndDaAnnual,
    input.hraReceivedAnnual,
    input.rentPaidAnnual,
    input.isMetroCity
  );

  // Chapter VI-A Deductions
  const sec80C = Math.min(150000, Math.max(0, input.sec80C));
  const sec80CCD1B = Math.min(50000, Math.max(0, input.sec80CCD1B));
  const sec80CCD2 = Math.max(0, input.sec80CCD2);
  
  // Section 80D: Self & Family (Max 25k) + Parents (Max 25k or 50k for senior)
  const maxParents = input.parentsSeniorCitizen ? 50000 : 25000;
  const sec80D = Math.min(25000, Math.max(0, input.sec80D_Self)) + Math.min(maxParents, Math.max(0, input.sec80D_Parents));
  
  // Section 24(b): Home Loan Interest on Self-Occupied House (Max 2,00,000 loss)
  const homeLoanDeduction = Math.min(200000, Math.max(0, input.sec24b_HomeLoanInterest));
  
  // Savings bank interest deduction u/s 80TTA (Max 10,000)
  const sec80TTA = Math.min(10000, Math.max(0, input.savingsInterest));
  const sec80G = Math.max(0, input.sec80G_Donations);
  const otherDeductions = Math.max(0, input.otherDeductions);

  const totalChapterVIA_Deductions = sec80C + sec80CCD1B + sec80CCD2 + sec80D + homeLoanDeduction + sec80TTA + sec80G + otherDeductions;
  const grossTotalIncome = Math.max(0, grossSalary + otherIncome + input.incomeFromHouseProperty);

  const netTaxableIncome = Math.max(0, grossTotalIncome - standardDeduction - hraExemption - totalChapterVIA_Deductions);

  // Old Regime Slabs (Regular Individual <60)
  // Up to 2,50,000: 0%
  // 2,50,001 - 5,00,000: 5% (Max 12,500)
  // 5,00,001 - 10,00,000: 20% (Max 1,00,000)
  // Above 10,00,000: 30%
  const slabs: SlabBreakdown[] = [];
  let baseTax = 0;
  let remaining = netTaxableIncome;

  const basicExemption = input.ageGroup === 'superSenior' ? 500000 : input.ageGroup === 'senior' ? 300000 : 250000;

  // Slab 1: Up to basic exemption
  const slab1Amt = Math.min(remaining, basicExemption);
  slabs.push({ slab: `₹0 – ₹${basicExemption.toLocaleString('en-IN')}`, rate: '0% (Nil)', taxableInSlab: slab1Amt, taxAmount: 0 });
  remaining = Math.max(0, remaining - basicExemption);

  // Slab 2: Next up to ₹5,00,000
  const slab2Range = 500000 - basicExemption;
  if (slab2Range > 0) {
    const slab2Amt = Math.min(remaining, slab2Range);
    const slab2Tax = slab2Amt * 0.05;
    baseTax += slab2Tax;
    slabs.push({ slab: `₹${basicExemption.toLocaleString('en-IN')} – ₹5,00,000`, rate: '5%', taxableInSlab: slab2Amt, taxAmount: slab2Tax });
    remaining = Math.max(0, remaining - slab2Range);
  }

  // Slab 3: ₹5,00,001 – ₹10,00,000 (5,00,000 bracket @ 20%)
  const slab3Amt = Math.min(remaining, 500000);
  const slab3Tax = slab3Amt * 0.20;
  baseTax += slab3Tax;
  slabs.push({ slab: '₹5,00,001 – ₹10,00,000', rate: '20%', taxableInSlab: slab3Amt, taxAmount: slab3Tax });
  remaining = Math.max(0, remaining - 500000);

  // Slab 4: Above ₹10,00,000 @ 30%
  if (remaining > 0) {
    const slab4Tax = remaining * 0.30;
    baseTax += slab4Tax;
    slabs.push({ slab: 'Above ₹10,00,000', rate: '30%', taxableInSlab: remaining, taxAmount: slab4Tax });
  }

  // Rebate u/s 87A under Old Regime: If taxable income <= 5,00,000, rebate up to ₹12,500
  let rebate87A = 0;
  if (netTaxableIncome <= 500000) {
    rebate87A = Math.min(baseTax, 12500);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const surcharge = 0;
  const healthAndEduCess = Math.round(taxAfterRebate * 0.04);
  const totalTaxLiability = taxAfterRebate + healthAndEduCess;
  const monthlyTdsDeduction = Math.round(totalTaxLiability / 12);
  const effectiveTaxRate = grossTotalIncome > 0 ? Number(((totalTaxLiability / grossTotalIncome) * 100).toFixed(2)) : 0;

  return {
    regime: 'old',
    grossTotalIncome,
    standardDeduction,
    hraExemption,
    totalChapterVIA_Deductions,
    netTaxableIncome,
    baseTax,
    rebate87A,
    taxAfterRebate,
    surcharge,
    healthAndEduCess,
    totalTaxLiability,
    monthlyTdsDeduction,
    effectiveTaxRate,
    slabs,
  };
};

/**
 * Full Comparison calculation between New and Old Regimes
 */
export const compareTaxRegimes = (input: TaxInputData): TaxComparisonResult => {
  const annualBasic = input.basicPayMonthly * input.monthsInService;
  const annualDa = Math.round((annualBasic * input.daPercent) / 100);
  const basicAndDaAnnual = annualBasic + annualDa;

  // Gross Salary = Basic + DA + HRA + Perks + OT + Bonus/PRP
  const grossSalary = basicAndDaAnnual + input.hraReceivedAnnual + input.perksAndAllowancesAnnual + input.overtimeAnnual + input.annualBonusPRP;
  const otherIncome = input.incomeFromOtherSources + input.savingsInterest;

  const newRegime = calculateNewRegimeTax(grossSalary, otherIncome, input.sec80CCD2, input.financialYear);
  const oldRegime = calculateOldRegimeTax(input, grossSalary, otherIncome, basicAndDaAnnual);

  let recommendedRegime: 'new' | 'old' | 'equal' = 'equal';
  let taxDifference = 0;
  let savingsSummaryEn = '';
  let savingsSummaryMl = '';

  const diff = oldRegime.totalTaxLiability - newRegime.totalTaxLiability;
  if (diff > 0) {
    recommendedRegime = 'new';
    taxDifference = diff;
    savingsSummaryEn = `New Tax Regime saves ₹${diff.toLocaleString('en-IN')} annually (Monthly TDS saves ₹${Math.round(diff / 12).toLocaleString('en-IN')})`;
    savingsSummaryMl = `പുതിയ നികുതി വ്യവസ്ഥ (New Tax Regime) വഴി പ്രതിവർഷം ₹${diff.toLocaleString('en-IN')} ലാഭിക്കാം (പ്രതിമാസം ₹${Math.round(diff / 12).toLocaleString('en-IN')})`;
  } else if (diff < 0) {
    recommendedRegime = 'old';
    taxDifference = Math.abs(diff);
    savingsSummaryEn = `Old Tax Regime saves ₹${Math.abs(diff).toLocaleString('en-IN')} annually due to high Section 80C & Home Loan deductions.`;
    savingsSummaryMl = `80C, ഭവന വായ്പ ഇളവുകൾ ഉള്ളതിനാൽ പഴയ നികുതി വ്യവസ്ഥ (Old Regime) വഴി പ്രതിവർഷം ₹${Math.abs(diff).toLocaleString('en-IN')} ലാഭിക്കാം.`;
  } else {
    recommendedRegime = 'equal';
    taxDifference = 0;
    savingsSummaryEn = 'Both New and Old Tax Regimes result in the exact same tax liability.';
    savingsSummaryMl = 'പുതിയതും പഴയതുമായ രണ്ട് വ്യവസ്ഥകളിലും നികുതി തുല്യമാണ്.';
  }

  return {
    newRegime,
    oldRegime,
    recommendedRegime,
    taxDifference,
    savingsSummaryEn,
    savingsSummaryMl,
  };
};
