/**
 * CSL Official Payslip & Payroll Admin Configuration
 * Stores exact CSL Payslip earnings, deductions, and formula settings.
 */

export interface AdminSalaryConfig {
  // Rates & Formulas
  daPercent: number; // Current CSL DA % (Default 54.10% per June 2026 Payslip)
  hraPercent: number; // House Rent Allow % (Default 20.00% = ₹5,068 on ₹25,340)
  epfPercent: number; // PF Contribution % on (Basic + VDA) (Default 12.00%)
  otDivisor: number; // Factories Act hourly divisor (Default 198.2)

  // Standard Earnings (June 2026 Payslip)
  workDressMaint: number; // WORK DRESS MAINT ALL (₹500.00)
  tpaWorkmen: number; // TPA FOR WORKMEN (₹2,400.00)
  specialMealSubsidy: number; // SPECIAL MEAL SUBSIDY (₹220.00)
  milkAllowance: number; // MILK ALLOWANCE (₹107.25)
  leaveTravelAllw: number; // LEAVE TRAVEL ALLW (₹13,335.00)
  bfMilkAllow: number; // BF MILK ALLOW (₹41.25)

  // Standard Deductions (June 2026 Payslip)
  lwfDeductions: number; // LWF DEDUCTIONS (₹45.00)
  seppySchemeRec: number; // SEPPY SCHEME REC (₹600.00)
  festivalAdvRepay: number; // FESTIVAL ADV REPAY (₹1,500.00)
  recoverableAdvRec: number; // RECOVERABLE ADV REC (₹3,000.00)
  schoolAdvRecovery: number; // SCHOOL ADV RECOVERY (₹1,500.00)
  canteenRecovery: number; // CANTEEN RECOVERY (₹150.00)
  csmpwtRecovery: number; // CSMPWT RECOVERY (₹100.00)
  clubCharitableFund: number; // CLUB-CHARITABLE FUND (₹50.00)
  licPremium1: number; // LIC PREMIUM 1 (₹1,499.00)

  // Legacy compatibility keys
  tpfWorkStandard?: number;
  mealsSubsidyStandard?: number;
  canteenCuttingStandard?: number;
  profTaxStandard?: number;
  includePerks?: boolean;
  perksPercent?: number;

  // Company On-Contract Employee Settings (Admin Solved Only)
  contractPfAmount: number; // Exact PF deduction amount solved and set by Admin for On-Contract employees
  contractPfActive: boolean; // Whether custom PF deduction is active
  contractPfNote?: string; // Admin note regarding pending PF formula
  contractOtRatePerHour?: number; // Custom OT Cash Rate per hour for contract employees (different model)
  contractOtModelNote?: string; // Note explaining custom OT cash calculation model

  adminPassword: string; // Default: '472544'
  lastUpdated: string;
}

export const DEFAULT_ADMIN_CONFIG: AdminSalaryConfig = {
  daPercent: 54.10, // Exact from CSL Payslip: 54.10%
  hraPercent: 20.00, // Exact from CSL Payslip: 20.00%
  epfPercent: 12.00, // PF Contribution: 12.00% of (Basic + VDA)
  otDivisor: 198.0, // Factories Act Single Rate divisor (198 produces exact ₹394.43 rate)

  // Company On-Contract defaults (Zero allowances; PF solved by Admin; distinct OT Cash model)
  contractPfAmount: 0.00,
  contractPfActive: true,
  contractPfNote: 'Admin Solved (Pending exact formula from management)',
  contractOtRatePerHour: 0.00,
  contractOtModelNote: 'Custom contract OT cash calculation model',

  workDressMaint: 500.00,
  tpaWorkmen: 2400.00,
  specialMealSubsidy: 220.00,
  milkAllowance: 107.25,
  leaveTravelAllw: 13335.00,
  bfMilkAllow: 41.25,

  lwfDeductions: 45.00,
  seppySchemeRec: 600.00,
  festivalAdvRepay: 1500.00,
  recoverableAdvRec: 3000.00,
  schoolAdvRecovery: 1500.00,
  canteenRecovery: 150.00,
  csmpwtRecovery: 100.00,
  clubCharitableFund: 50.00,
  licPremium1: 1499.00,

  adminPassword: '472544',
  lastUpdated: new Date().toISOString(),
};

const STORAGE_KEY = 'csl_payroll_admin_config_v2';
export const ADMIN_CONFIG_UPDATED_EVENT = 'csl_admin_config_updated';

export function getAdminSalaryConfig(): AdminSalaryConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_ADMIN_CONFIG;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ADMIN_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ADMIN_CONFIG,
      ...parsed,
      contractPfAmount: typeof parsed.contractPfAmount === 'number' ? parsed.contractPfAmount : 0.00,
      contractPfActive: parsed.contractPfActive !== undefined ? Boolean(parsed.contractPfActive) : true,
      contractPfNote: parsed.contractPfNote || DEFAULT_ADMIN_CONFIG.contractPfNote,
      contractOtRatePerHour: typeof parsed.contractOtRatePerHour === 'number' ? parsed.contractOtRatePerHour : 0.00,
      contractOtModelNote: parsed.contractOtModelNote || DEFAULT_ADMIN_CONFIG.contractOtModelNote,
      adminPassword: parsed.adminPassword || '472544',
    };
  } catch {
    return DEFAULT_ADMIN_CONFIG;
  }
}

export function saveAdminSalaryConfig(config: AdminSalaryConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = {
      ...config,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(ADMIN_CONFIG_UPDATED_EVENT, { detail: updated }));
  } catch (e) {
    console.error('Failed to save CSL admin config to localStorage:', e);
  }
}

export function resetAdminSalaryConfig(): AdminSalaryConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(ADMIN_CONFIG_UPDATED_EVENT, { detail: DEFAULT_ADMIN_CONFIG }));
    } catch (e) {
      console.error('Failed to reset CSL admin config:', e);
    }
  }
  return DEFAULT_ADMIN_CONFIG;
}
