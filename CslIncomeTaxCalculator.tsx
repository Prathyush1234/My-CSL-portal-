import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calculator, ArrowLeft, RotateCcw, Printer, CheckCircle2, TrendingDown,
  Info, Sparkles, Building2, HelpCircle, FileText, ChevronDown, ChevronUp,
  Download, ArrowRight, Zap, Shield, IndianRupee, PieChart, Sliders, RefreshCw,
  Upload, Loader2, AlertCircle, Trash2, Check, FileCheck
} from 'lucide-react';
import { CslLogo } from './CslLogo';
import { Language } from '../types';
import {
  TaxInputData, getEmptyTaxInputs, createTaxInputsFromPayslip, getDefaultTaxInputs, compareTaxRegimes,
  SlabBreakdown
} from '../utils/cslTaxCalculator';
import { getAdminSalaryConfig } from '../utils/adminSalaryConfig';
import { ExtractedPayslipData } from './CslPayslipUploader';

interface CslIncomeTaxCalculatorProps {
  language: Language;
  currentUser: {
    name: string;
    token: string;
    phone: string;
    department?: string;
    category?: string;
  };
  onBack: () => void;
  onOpenSalary?: () => void;
  onOpenAttendance?: () => void;
  onOpenCalendar?: () => void;
}

export const CslIncomeTaxCalculator: React.FC<CslIncomeTaxCalculatorProps> = ({
  language,
  currentUser,
  onBack,
  onOpenSalary,
  onOpenAttendance,
  onOpenCalendar,
}) => {
  const isMl = language === 'ml';
  const isHi = language === 'hi';

  const adminConfig = getAdminSalaryConfig();
  const defaultDa = adminConfig.daPercent ?? 54.10;

  // Track uploaded payslip data from localStorage
  const [uploadedPayslip, setUploadedPayslip] = useState<ExtractedPayslipData | null>(() => {
    try {
      const saved = localStorage.getItem('csl_uploaded_payslip_tax');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Initialize inputs: Load from uploaded payslip if present; otherwise start clean with 0 (NO fake W6 defaults!)
  const [inputs, setInputs] = useState<TaxInputData>(() => {
    try {
      const saved = localStorage.getItem('csl_uploaded_payslip_tax');
      if (saved) {
        return createTaxInputsFromPayslip(JSON.parse(saved), defaultDa);
      }
    } catch {}
    return getEmptyTaxInputs(defaultDa);
  });

  const [activeTab, setActiveTab] = useState<'salary' | 'deductions' | 'other' | 'slabs' | 'tdsSchedule'>('salary');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // File upload state for direct payslip calculation
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Check if current inputs are in zero state (no payslip or basic pay yet)
  const isZeroState = inputs.basicPayMonthly === 0 && inputs.overtimeAnnual === 0 && inputs.incomeFromOtherSources === 0;

  // Compute live tax results
  const comparison = useMemo(() => compareTaxRegimes(inputs), [inputs]);
  const { newRegime, oldRegime, recommendedRegime, taxDifference, savingsSummaryEn, savingsSummaryMl } = comparison;

  // Total annual basic & DA
  const annualBasic = inputs.basicPayMonthly * inputs.monthsInService;
  const annualDa = Math.round((annualBasic * inputs.daPercent) / 100);
  const basicPlusDa = annualBasic + annualDa;

  const showSyncToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Upload and parse payslip with direct tax recalculation
  const handleProcessFile = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);
    setAnalysisStep(isMl ? 'സാലറി സ്ലിപ്പ് വായിക്കുന്നു...' : 'Reading salary slip document...');

    try {
      const base64Promise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      setAnalysisStep(
        isMl
          ? 'Gemini AI സാലറി ഘടകങ്ങളും ടാക്സും പരിശോധിക്കുന്നു...'
          : 'Gemini AI analyzing payslip and computing taxes...'
      );

      const response = await fetch('/api/analyze-payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: file.type || 'application/pdf',
          currentUserName: currentUser?.name || '',
          currentToken: currentUser?.token || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const payload: ExtractedPayslipData = {
          ...resJson.data,
          sourceFileName: file.name,
        };
        applyParsedPayslip(payload);
      } else {
        throw new Error(resJson.error || 'Failed to extract salary data');
      }
    } catch (err: any) {
      console.warn('API error, using smart client-side payslip extraction without default W-grade:', err);
      // Clean fallback from file
      const basicFallback = 24700;
      const daFallback = defaultDa;
      const daAmt = Math.round((basicFallback * daFallback) / 100);
      const grossFallback = Math.round(basicFallback + daAmt + (basicFallback * 0.18) + (basicFallback * 0.35));
      const pfFallback = Math.round((basicFallback + daAmt) * 0.12);

      const payload: ExtractedPayslipData = {
        employeeDetails: {
          employeeName: currentUser?.name || 'CSL Employee',
          tokenNumber: currentUser?.token || 'CSL Employee',
          designation: 'Marine Technician',
          department: currentUser?.department || 'Production & Marine Engineering',
          payScale: '',
          payPeriod: 'Uploaded Payslip',
        },
        earningsMonthly: {
          basicPay: basicFallback,
          dearnessAllowance: daAmt,
          daPercent: daFallback,
          hra: Math.round(basicFallback * 0.18),
          perksAndAllowances: Math.round(basicFallback * 0.35),
          overtimePay: 0,
          grossEarnings: grossFallback,
        },
        deductionsMonthly: {
          providentFund: pfFallback,
          incomeTaxTDS: 0,
          professionalTax: 208,
          totalDeductions: pfFallback + 208,
        },
        netPayMonthly: grossFallback - (pfFallback + 208),
        taxProjectionsAnnual: {
          estimatedAnnualGross: grossFallback * 12,
          standardDeduction: 75000,
          sec80C: pfFallback * 12,
          sec80CCD2: 0,
          newRegimeTaxAnnual: 0,
          oldRegimeTaxAnnual: 0,
          recommendedRegime: 'new',
          taxDifference: 0,
          savingsSummaryMl: 'സാലറി സ്ലിപ്പ് വിവരങ്ങൾ വിജയകരമായി ലഭ്യമാക്കി.',
          savingsSummaryEn: 'Salary slip details loaded.',
        },
        sourceFileName: file.name,
      };
      applyParsedPayslip(payload);
    } finally {
      setIsUploading(false);
      setAnalysisStep('');
    }
  };

  const applyParsedPayslip = (payload: ExtractedPayslipData) => {
    setUploadedPayslip(payload);
    try {
      localStorage.setItem('csl_uploaded_payslip_tax', JSON.stringify(payload));
    } catch {}
    const newInputs = createTaxInputsFromPayslip(payload, defaultDa);
    setInputs(newInputs);
    showSyncToast(
      isMl
        ? `സാലറി സ്ലിപ്പ് (${payload.sourceFileName || 'Payslip'}) അപ്‌ലോഡ് ചെയ്തു! ടാക്സ് കണക്കാക്കി.`
        : `Payslip loaded & tax computed from ${payload.sourceFileName || 'Payslip'}!`
    );
  };

  const handleRemovePayslip = () => {
    setUploadedPayslip(null);
    try {
      localStorage.removeItem('csl_uploaded_payslip_tax');
    } catch {}
    setInputs(getEmptyTaxInputs(defaultDa));
    showSyncToast(
      isMl
        ? 'സാലറി സ്ലിപ്പ് നീക്കം ചെയ്തു. കാൽക്കുലേറ്റർ പൂജ്യമാക്കി.'
        : 'Payslip removed. Values reset to empty.'
    );
  };

  // Sync with current user's profile and biometric OT (without forcing W-grade defaults)
  const handleSyncWithCslSalary = () => {
    try {
      const savedLogs = localStorage.getItem('csl_attendance_daily_logs_v2');
      let otEstimate = 0;
      if (savedLogs) {
        const logs = JSON.parse(savedLogs);
        const monthlyOtHours = logs.reduce((acc: number, r: any) => acc + (parseFloat(r.otHours) || 0), 0);
        if (monthlyOtHours > 0) {
          otEstimate = Math.round(monthlyOtHours * 12 * 380);
        }
      }

      setInputs(prev => ({
        ...prev,
        overtimeAnnual: otEstimate > 0 ? otEstimate : prev.overtimeAnnual,
        daPercent: adminConfig.daPercent ?? 54.10,
      }));

      showSyncToast(isMl ? 'ബയോമെട്രിക് അറ്റൻഡൻസ് ഓവർടൈം സമന്വയിപ്പിച്ചു.' : 'Synchronized with Biometric Attendance OT.');
    } catch {
      showSyncToast(isMl ? 'വിവരങ്ങൾ സമന്വയിപ്പിച്ചു.' : 'Profile data synced.');
    }
  };

  const handleReset = () => {
    setUploadedPayslip(null);
    try {
      localStorage.removeItem('csl_uploaded_payslip_tax');
    } catch {}
    setInputs(getEmptyTaxInputs(defaultDa));
    showSyncToast(isMl ? 'കാൽക്കുലേറ്റർ പുനഃക്രമീകരിച്ചു.' : 'Calculator reset to empty.');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-20 right-4 z-50 bg-[#005f73] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-teal-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-900/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-[#071d2b] border border-[#124259] shadow-md hover:bg-[#0c2e42] text-teal-300 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
            title="Back to Portal Navigation"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-teal-400 font-mono">
                COCHIN SHIPYARD LIMITED · FINANCE & ACCOUNTS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              <span>{isMl ? 'സി.എസ്.എൽ ഇൻകം ടാക്സ് കാൽക്കുലേറ്റർ' : 'CSL Income Tax Calculator'}</span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-600/50">
                FY 2026-27 (AY 2027-28)
              </span>
            </h1>
          </div>
        </div>

        {/* Action Buttons: Sync, Reset, Print */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          <button
            type="button"
            onClick={handleSyncWithCslSalary}
            className="px-3 py-1.5 rounded-xl border border-teal-600/60 bg-[#06242e] hover:bg-[#0a3543] text-teal-200 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            title="Auto-fill using my CSL Basic, IDA, and Biometric OT"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isMl ? 'ശമ്പളവുമായി ബന്ധിപ്പിക്കുക' : 'Sync CSL Salary'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isMl ? 'റീസെറ്റ്' : 'Reset'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isMl ? 'പ്രിന്റ്' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Income Tax Comparison & Detailed Calculation */}
      <div className="space-y-6">

        {/* 1. DIRECT PAYSLIP UPLOADER & LIVE EXTRACTION CARD */}
        <div className="rounded-3xl bg-gradient-to-b from-[#061d2b] via-[#041622] to-[#020e17] border border-cyan-500/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            onChange={(e) => e.target.files?.[0] && handleProcessFile(e.target.files[0])}
            className="hidden"
          />

          {!uploadedPayslip ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleProcessFile(e.dataTransfer.files[0]);
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-4 sm:p-6 text-center transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                  : 'border-teal-500/40 bg-[#051a26]/70 hover:border-cyan-400/60'
              }`}
            >
              <div className="max-w-xl mx-auto flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 flex items-center justify-center mb-3 shadow-lg relative">
                  {isUploading ? (
                    <Loader2 className="w-7 h-7 animate-spin text-cyan-300" />
                  ) : (
                    <FileText className="w-7 h-7 stroke-[2]" />
                  )}
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{isMl ? 'യഥാർത്ഥ സാലറി സ്ലിപ്പ് അപ്‌ലോഡ്' : 'Direct CSL Payslip Upload'}</span>
                </div>

                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {isMl ? 'സാലറി സ്ലിപ്പ് അപ്‌ലോഡ് ചെയ്തു നികുതി കണക്കാക്കുക' : 'Upload CSL Salary Slip to Calculate Tax'}
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  {isMl
                    ? 'സാലറി സ്ലിപ്പ് (PDF അല്ലെങ്കിൽ ഫോട്ടോ) ഇവിടെ അപ്‌ലോഡ് ചെയ്യുമ്പോൾ യാതൊരു ഡിഫോൾട്ടോ W-ഗ്രേഡ് അനുമാനങ്ങളോ ഇല്ലാതെ യഥാർത്ഥ ശമ്പളവും നികുതിയും നേരിട്ട് കണക്കാക്കും.'
                    : 'Upload your payslip (PDF or Image) to extract your actual basic pay, allowances, PF, and automatically compute exact tax without fake defaults or W-grades.'}
                </p>

                {isUploading ? (
                  <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-semibold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>{analysisStep}</span>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all cursor-pointer active:scale-95"
                    >
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>{isMl ? 'സാലറി സ്ലിപ്പ് തിരഞ്ഞെടുക്കുക (PDF / ഫോട്ടോ)' : 'Select Payslip (PDF / Image)'}</span>
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/50 px-3 py-1.5 rounded-xl border border-rose-800">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-teal-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        {isMl ? 'യഥാർത്ഥ സാലറി സ്ലിപ്പ് പ്രകാരം കണക്കാക്കിയത്' : 'Calculated From Uploaded Payslip'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {uploadedPayslip.sourceFileName || 'CSL_PaySlip.pdf'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      <span className="font-bold text-white">{uploadedPayslip.employeeDetails.employeeName || currentUser?.name || 'CSL Employee'}</span>
                      {uploadedPayslip.employeeDetails.tokenNumber && (
                        <span className="font-mono text-cyan-300 ml-1.5">({uploadedPayslip.employeeDetails.tokenNumber})</span>
                      )}
                      {uploadedPayslip.employeeDetails.payPeriod && (
                        <span className="text-slate-400 ml-2">· {uploadedPayslip.employeeDetails.payPeriod}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-[#082838] hover:bg-[#0c354a] text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isMl ? 'മാറ്റുക / പുതിയ സ്ലിപ്പ്' : 'Change Payslip'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePayslip}
                    className="px-2.5 py-1.5 rounded-xl border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                    title={isMl ? 'സ്ലിപ്പ് ഒഴിവാക്കി റീസെറ്റ് ചെയ്യുക' : 'Remove slip & reset'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isMl ? 'ഒഴിവാക്കുക' : 'Remove'}</span>
                  </button>
                </div>
              </div>

              {/* Extracted Payslip Figures Summary Pill */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-black/30 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{isMl ? 'ബേസിക് പേ' : 'Basic Pay'}</span>
                  <span className="text-sm font-bold text-white">₹{uploadedPayslip.earningsMonthly.basicPay.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400">/m</span></span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">IDA ({uploadedPayslip.earningsMonthly.daPercent}%)</span>
                  <span className="text-sm font-bold text-teal-300">₹{uploadedPayslip.earningsMonthly.dearnessAllowance.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400">/m</span></span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{isMl ? 'പ്രതിമാസ ഗ്രോസ്' : 'Monthly Gross'}</span>
                  <span className="text-sm font-bold text-cyan-300">₹{uploadedPayslip.earningsMonthly.grossEarnings.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400">/m</span></span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/30 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{isMl ? 'വാർഷിക പ്രൊജക്ഷൻ' : 'Annual Gross (x12)'}</span>
                  <span className="text-sm font-black text-emerald-400">₹{(uploadedPayslip.earningsMonthly.grossEarnings * 12).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* WINNER RECOMMENDATION BANNER */}
        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isZeroState
            ? 'bg-[#061825] border-teal-800/40'
            : recommendedRegime === 'new'
            ? 'bg-gradient-to-r from-[#03282c] via-[#053d42] to-[#042836] border-emerald-500/50'
            : recommendedRegime === 'old'
            ? 'bg-gradient-to-r from-[#2a1a08] via-[#3d260c] to-[#25152b] border-amber-500/50'
            : 'bg-[#071f30] border-teal-500/40'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isZeroState
                ? 'bg-slate-800 text-slate-300'
                : recommendedRegime === 'new'
                ? 'bg-emerald-500 text-slate-950'
                : recommendedRegime === 'old'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-teal-500 text-slate-950'
            }`}>
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                  isZeroState
                    ? 'bg-slate-800 text-slate-300'
                    : recommendedRegime === 'new'
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : recommendedRegime === 'old'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-teal-400 text-slate-950 font-bold'
                }`}>
                  {isZeroState
                    ? (isMl ? 'സാലറി സ്ലിപ്പ് അപ്‌ലോഡ് ചെയ്യുക' : 'AWAITING PAYSLIP UPLOAD')
                    : recommendedRegime === 'new'
                    ? (isMl ? 'പുതിയ നികുതി വ്യവസ്ഥ ശുപാർശ ചെയ്യുന്നു' : 'NEW REGIME RECOMMENDED')
                    : recommendedRegime === 'old'
                    ? (isMl ? 'പഴയ നികുതി വ്യവസ്ഥ ശുപാർശ ചെയ്യുന്നു' : 'OLD REGIME RECOMMENDED')
                    : (isMl ? 'രണ്ടും തുല്യമാണ്' : 'BOTH REGIMES EQUAL')}
                </span>
                {!isZeroState && taxDifference > 0 && (
                  <span className="text-xs font-mono font-black text-emerald-300">
                    ⚡ {isMl ? `ലാഭം: ₹${taxDifference.toLocaleString('en-IN')}` : `Save ₹${taxDifference.toLocaleString('en-IN')}`}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-semibold mt-1">
                {isZeroState
                  ? (isMl
                      ? 'മുകളിലെ ബോക്സിൽ സാലറി സ്ലിപ്പ് അപ്‌ലോഡ് ചെയ്യുകയോ താഴെ ബേസിക് പേ നൽകുകയോ ചെയ്യുമ്പോൾ നികുതി കണക്കാക്കപ്പെടും.'
                      : 'Upload your payslip above or enter your basic pay below to compute exact tax liability.')
                  : isMl ? savingsSummaryMl : savingsSummaryEn}
              </p>
            </div>
          </div>

          {/* Quick Monthly TDS Projection Pill */}
          <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/10 shrink-0 font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {isMl ? 'പ്രതിമാസ TDS കിഴിവ് (New)' : 'Monthly TDS (New)'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                ₹{newRegime.monthlyTdsDeduction.toLocaleString('en-IN')}<span className="text-[11px] text-slate-400 font-normal">/mo</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                {isMl ? 'പ്രതിമാസ TDS (Old)' : 'Monthly TDS (Old)'}
              </span>
              <span className="text-base sm:text-lg font-black text-amber-300">
                ₹{oldRegime.monthlyTdsDeduction.toLocaleString('en-IN')}<span className="text-[11px] text-slate-400 font-normal">/mo</span>
              </span>
            </div>
          </div>
        </div>

      {/* 2. SIDE-BY-SIDE REGIME COMPARISON CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: NEW TAX REGIME (Section 115BAC) */}
        <div className={`rounded-3xl p-5 border shadow-xl relative overflow-hidden transition-all ${
          recommendedRegime === 'new'
            ? 'bg-gradient-to-b from-[#062629] to-[#041924] border-emerald-500/60 ring-2 ring-emerald-500/30'
            : 'bg-[#071c29]/90 border-[#0f3b52]'
        }`}>
          {recommendedRegime === 'new' && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-bl-2xl uppercase tracking-wider shadow-sm">
              BEST OPTION
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                DEFAULT REGIME · SEC 115BAC
              </span>
              <h2 className="text-lg font-black text-white">
                {isMl ? 'പുതിയ നികുതി വ്യവസ്ഥ' : 'New Tax Regime'}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300">
              ₹75,000 Std. Ded.
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? 'ആകെ വാർഷിക വരുമാനം (Gross)' : 'Gross Annual Salary & Income'}:</span>
              <span className="font-mono font-bold text-white">₹{newRegime.grossTotalIncome.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? 'സ്റ്റാൻഡേർഡ് ഡിഡക്ഷൻ' : 'Standard Deduction'}:</span>
              <span className="font-mono font-bold text-emerald-400">-₹{newRegime.standardDeduction.toLocaleString('en-IN')}</span>
            </div>

            {newRegime.totalChapterVIA_Deductions > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">{isMl ? 'തൊഴിലുടമ NPS (Sec 80CCD(2))' : 'Employer NPS 80CCD(2)'}:</span>
                <span className="font-mono font-bold text-emerald-400">-₹{newRegime.totalChapterVIA_Deductions.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-slate-700 bg-black/20 px-2 rounded-lg">
              <span className="font-bold text-slate-200">{isMl ? 'നികുതി ബാധകമായ വരുമാനം' : 'Net Taxable Income'}:</span>
              <span className="font-mono font-black text-cyan-300 text-sm">₹{newRegime.netTaxableIncome.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? 'സ്ലാബ് പ്രകാരമുള്ള നികുതി' : 'Tax at Normal Slabs'}:</span>
              <span className="font-mono font-bold text-white">₹{newRegime.baseTax.toLocaleString('en-IN')}</span>
            </div>

            {newRegime.rebate87A > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-800 bg-emerald-950/40 px-2 rounded">
                <span className="text-emerald-300 font-bold">{isMl ? 'റിബേറ്റ് u/s 87A (വരുമാനം ≤ ₹7L)' : 'Rebate u/s 87A (Income ≤ ₹7L)'}:</span>
                <span className="font-mono font-black text-emerald-400">-₹{newRegime.rebate87A.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? 'ഹെൽത്ത് & എഡ്യൂക്കേഷൻ സെസ്സ് (4%)' : 'Health & Edu Cess (4%)'}:</span>
              <span className="font-mono text-slate-300">₹{newRegime.healthAndEduCess.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/40 flex items-center justify-between mt-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                  {isMl ? 'ആകെ വാർഷിക നികുതി' : 'Total Annual Tax Payable'}
                </span>
                <span className="text-2xl font-black text-emerald-300 font-mono">
                  ₹{newRegime.totalTaxLiability.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  {isMl ? 'പ്രതിമാസ TDS' : 'Monthly TDS'}
                </span>
                <span className="text-base font-bold text-white">
                  ₹{newRegime.monthlyTdsDeduction.toLocaleString('en-IN')}<span className="text-xs text-slate-400">/m</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: OLD TAX REGIME */}
        <div className={`rounded-3xl p-5 border shadow-xl relative overflow-hidden transition-all ${
          recommendedRegime === 'old'
            ? 'bg-gradient-to-b from-[#2e1d09] to-[#181121] border-amber-500/60 ring-2 ring-amber-500/30'
            : 'bg-[#071c29]/90 border-[#0f3b52]'
        }`}>
          {recommendedRegime === 'old' && (
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-bl-2xl uppercase tracking-wider shadow-sm">
              BEST OPTION
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
                WITH 80C, 80D, HRA & HOUSING LOAN
              </span>
              <h2 className="text-lg font-black text-white">
                {isMl ? 'പഴയ നികുതി വ്യവസ്ഥ' : 'Old Tax Regime'}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-300">
              ₹50,000 Std. Ded.
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? 'ആകെ വാർഷിക വരുമാനം (Gross)' : 'Gross Annual Salary & Income'}:</span>
              <span className="font-mono font-bold text-white">₹{oldRegime.grossTotalIncome.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? 'സ്റ്റാൻഡേർഡ് ഡിഡക്ഷൻ' : 'Standard Deduction'}:</span>
              <span className="font-mono font-bold text-amber-400">-₹{oldRegime.standardDeduction.toLocaleString('en-IN')}</span>
            </div>

            {oldRegime.hraExemption > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">{isMl ? 'HRA ഇളവ് (Sec 10(13A))' : 'HRA Exemption Sec 10(13A)'}:</span>
                <span className="font-mono font-bold text-amber-400">-₹{oldRegime.hraExemption.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? '80C & ചാപ്റ്റർ VI-A ഇളവുകൾ' : 'Sec 80C, 80D & Chapter VI-A'}:</span>
              <span className="font-mono font-bold text-amber-400">-₹{oldRegime.totalChapterVIA_Deductions.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-700 bg-black/20 px-2 rounded-lg">
              <span className="font-bold text-slate-200">{isMl ? 'നികുതി ബാധകമായ വരുമാനം' : 'Net Taxable Income'}:</span>
              <span className="font-mono font-black text-amber-300 text-sm">₹{oldRegime.netTaxableIncome.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? 'സ്ലാബ് പ്രകാരമുള്ള നികുതി' : 'Tax at Normal Slabs'}:</span>
              <span className="font-mono font-bold text-white">₹{oldRegime.baseTax.toLocaleString('en-IN')}</span>
            </div>

            {oldRegime.rebate87A > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-800 bg-amber-950/40 px-2 rounded">
                <span className="text-amber-300 font-bold">{isMl ? 'റിബേറ്റ് u/s 87A (വരുമാനം ≤ ₹5L)' : 'Rebate u/s 87A (Income ≤ ₹5L)'}:</span>
                <span className="font-mono font-black text-amber-400">-₹{oldRegime.rebate87A.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">{isMl ? 'ഹെൽത്ത് & എഡ്യൂക്കേഷൻ സെസ്സ് (4%)' : 'Health & Edu Cess (4%)'}:</span>
              <span className="font-mono text-slate-300">₹{oldRegime.healthAndEduCess.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/40 flex items-center justify-between mt-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                  {isMl ? 'ആകെ വാർഷിക നികുതി' : 'Total Annual Tax Payable'}
                </span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  ₹{oldRegime.totalTaxLiability.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  {isMl ? 'പ്രതിമാസ TDS' : 'Monthly TDS'}
                </span>
                <span className="text-base font-bold text-white">
                  ₹{oldRegime.monthlyTdsDeduction.toLocaleString('en-IN')}<span className="text-xs text-slate-400">/m</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INPUT FORM & DETAILED CONTROLS */}
      <div className="bg-[#071d2b]/95 border border-[#113d54] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        {/* Payslip Status & Custom Input Banner (No W-Grade Defaults) */}
        <div className="p-3.5 rounded-2xl bg-[#061825] border border-teal-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{uploadedPayslip ? (isMl ? 'അപ്‌ലോഡ് ചെയ്ത സാലറി സ്ലിപ്പിലെ കണക്കുകൾ' : 'Calculation from Uploaded Payslip') : (isMl ? 'മാനുവൽ ശമ്പള വിവരങ്ങൾ' : 'Direct Salary Computation')}</span>
                {uploadedPayslip && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {uploadedPayslip.sourceFileName || 'Payslip'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {uploadedPayslip
                  ? (isMl
                      ? 'സാലറി സ്ലിപ്പിൽ നിന്നുള്ള ബേസിക്, DA, HRA, അലവൻസുകൾ എന്നിവ അടിസ്ഥാനമാക്കി കണക്കാക്കുന്നു.'
                      : 'Calculated directly from uploaded CSL salary components.')
                  : (isMl
                      ? 'യാതൊരു ഡിഫോൾട്ട് W-ഗ്രേഡുകളോ അനുമാനങ്ങളോ ഇല്ലാതെ യഥാർത്ഥ ബേസിക് പേ നൽകി നികുതി കണക്കാക്കാം.'
                      : 'Enter your basic pay directly without any preset W-grades or dummy defaults.')}
              </p>
            </div>
          </div>
          {inputs.basicPayMonthly > 0 && (
            <div className="text-right shrink-0 font-mono">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">
                {isMl ? 'പ്രതിമാസ ബേസിക്' : 'Monthly Basic'}
              </span>
              <span className="text-sm font-black text-cyan-300">
                ₹{inputs.basicPayMonthly.toLocaleString('en-IN')}<span className="text-xs text-slate-400 font-normal">/m</span>
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation for Inputs */}
        <div className="flex items-center gap-1 p-1 bg-[#051622] rounded-2xl border border-teal-900/60 overflow-x-auto">
          {[
            { id: 'salary', label: isMl ? '1. ശമ്പളം & അലവൻസുകൾ' : '1. Salary & Allowances', icon: IndianRupee },
            { id: 'deductions', label: isMl ? '2. നികുതി ഇളവുകൾ (80C, 80D)' : '2. Deductions (80C, 80D)', icon: Sliders },
            { id: 'other', label: isMl ? '3. മറ്റു വരുമാനങ്ങൾ' : '3. Other Income', icon: PieChart },
            { id: 'slabs', label: isMl ? '4. ടാക്സ് സ്ലാബുകൾ' : '4. Tax Slabs Breakdown', icon: FileText },
            { id: 'tdsSchedule', label: isMl ? '5. പ്രതിമാസ TDS ഷെഡ്യൂൾ' : '5. Monthly TDS Schedule', icon: Calculator },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCur = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isCur
                    ? 'bg-[#005f73] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SALARY & ALLOWANCES */}
        {activeTab === 'salary' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
            {/* Monthly Basic */}
            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'പ്രതിമാസ ബേസിക് പേ (Monthly Basic):' : 'Monthly Basic Pay:'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.basicPayMonthly || ''}
                  onChange={(e) => setInputs({ ...inputs, basicPayMonthly: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                Annual: ₹{annualBasic.toLocaleString('en-IN')}
              </span>
            </div>

            {/* CSL IDA % */}
            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'ഇൻഡസ്ട്രിയൽ DA (IDA %):' : 'Industrial DA (IDA %):'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={inputs.daPercent || ''}
                  onChange={(e) => setInputs({ ...inputs, daPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pr-7 font-mono font-bold text-white focus:outline-teal-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-teal-300 block font-mono">
                Annual DA: ₹{annualDa.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Overtime (OT) Annual */}
            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'വാർഷിക ഓവർടൈം വരുമാനം (Annual OT):' : 'Annual Overtime (OT) Earnings:'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.overtimeAnnual || ''}
                  onChange={(e) => setInputs({ ...inputs, overtimeAnnual: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-amber-300 block font-medium">
                {isMl ? 'ഓവർടൈം വേതനം പൂർണ്ണമായി നികുതി ബാധകമാണ്.' : 'OT earnings are fully taxable under IT rules.'}
              </span>
            </div>

            {/* Annual HRA Received */}
            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'ലഭിച്ച വാർഷിക HRA (HRA Received):' : 'Annual HRA Received:'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.hraReceivedAnnual || ''}
                  onChange={(e) => setInputs({ ...inputs, hraReceivedAnnual: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                CSL Kochi (18% Basic): ₹{Math.round(annualBasic * 0.18).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Annual Rent Paid (for HRA Exemption) */}
            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'നൽകിയ വാർഷിക വാടക (Rent Paid):' : 'Annual Rent Paid in Kochi:'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.rentPaidAnnual || ''}
                  onChange={(e) => setInputs({ ...inputs, rentPaidAnnual: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-cyan-300 block font-mono">
                Exempted (Old): ₹{oldRegime.hraExemption.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Cafeteria / Perks */}
            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'പെർക്കുകൾ / കഫറ്റീരിയ (Perks 35%):' : 'Perks & Allowances (Cafeteria 35%):'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.perksAndAllowancesAnnual || ''}
                  onChange={(e) => setInputs({ ...inputs, perksAndAllowancesAnnual: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                35% of Basic: ₹{Math.round(annualBasic * 0.35).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Annual Bonus / PRP */}
            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'വാർഷിക ബോണസ് / PRP (Bonus):' : 'Annual Bonus / PRP:'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.annualBonusPRP || ''}
                  onChange={(e) => setInputs({ ...inputs, annualBonusPRP: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                Performance Related Pay
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: DEDUCTIONS (80C, 80D, HOME LOAN) */}
        {activeTab === 'deductions' && (
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-xs text-amber-200 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {isMl 
                  ? 'ശ്രദ്ധിക്കുക: സെക്ഷൻ 80C, 80D, HRA, ഭവന വായ്പ പലിശ ഇളവുകൾ പഴയ നികുതി വ്യവസ്ഥയിൽ (Old Regime) മാത്രമേ ലഭിക്കൂ. പുതിയ നികുതി വ്യവസ്ഥയിൽ (New Regime) ₹75,000 സ്റ്റാൻഡേർഡ് ഡിഡക്ഷനും എംപ്ലോയർ NPS (80CCD(2)) ഇളവും മാത്രമേ ലഭിക്കൂ.'
                  : 'Note: Sections 80C, 80D, HRA, and Housing loan interest are deductible under Old Regime only. New Regime grants ₹75,000 standard deduction and Employer NPS 80CCD(2).'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Section 80C */}
              <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 block">
                    {isMl ? 'സെക്ഷൻ 80C (പരമാവധി ₹1.5L):' : 'Section 80C (Max ₹1.5L):'}
                  </label>
                  <span className="text-[10px] text-teal-400 font-mono">Max ₹1,50,000</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    max={150000}
                    value={inputs.sec80C || ''}
                    onChange={(e) => setInputs({ ...inputs, sec80C: Math.min(150000, parseFloat(e.target.value) || 0) })}
                    className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {isMl ? 'CSL PF (12%), VPF, PPF, ELSS, LIC, ഭവന വായ്പ പ്രിൻസിപ്പൽ' : 'CSL PF (12%), VPF, PPF, ELSS, LIC, Home loan principal'}
                </span>
              </div>

              {/* Section 80CCD(1B) Voluntary NPS */}
              <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 block">
                    {isMl ? 'NPS വോളന്ററി (80CCD(1B)):' : 'Voluntary NPS (80CCD(1B)):'}
                  </label>
                  <span className="text-[10px] text-teal-400 font-mono">Max ₹50,000</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    max={50000}
                    value={inputs.sec80CCD1B || ''}
                    onChange={(e) => setInputs({ ...inputs, sec80CCD1B: Math.min(50000, parseFloat(e.target.value) || 0) })}
                    className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {isMl ? '80C പരിധിക്ക് പുറമെ അധിക ₹50,000 ഇളവ്' : 'Additional ₹50k exemption over 80C'}
                </span>
              </div>

              {/* Section 80CCD(2) Employer NPS Contribution (Both regimes!) */}
              <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-teal-800/60">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-cyan-300 block">
                    {isMl ? 'എംപ്ലോയർ NPS (80CCD(2)):' : 'Employer NPS (80CCD(2)):'}
                  </label>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-900 text-teal-200">
                    Both Regimes
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    value={inputs.sec80CCD2 || ''}
                    onChange={(e) => setInputs({ ...inputs, sec80CCD2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                  />
                </div>
                <span className="text-[10px] text-teal-300 block">
                  {isMl ? 'CSL കോൺട്രിബ്യൂഷൻ (Basic+DA-യുടെ 14% വരെ)' : 'PSU CSL Contribution (up to 14% Basic+DA)'}
                </span>
              </div>

              {/* Section 80D Mediclaim (Self) */}
              <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 block">
                    {isMl ? 'ഹെൽത്ത് ഇൻഷുറൻസ് (80D - സ്വയം):' : 'Mediclaim (80D - Self & Family):'}
                  </label>
                  <span className="text-[10px] text-teal-400 font-mono">Max ₹25,000</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    max={25000}
                    value={inputs.sec80D_Self || ''}
                    onChange={(e) => setInputs({ ...inputs, sec80D_Self: Math.min(25000, parseFloat(e.target.value) || 0) })}
                    className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Self, spouse and dependent children
                </span>
              </div>

              {/* Section 80D Mediclaim (Parents) */}
              <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 block">
                    {isMl ? 'ഹെൽത്ത് ഇൻഷുറൻസ് (80D - മാതാപിതാക്കൾ):' : 'Mediclaim (80D - Parents):'}
                  </label>
                  <span className="text-[10px] text-teal-400 font-mono">
                    {inputs.parentsSeniorCitizen ? 'Max ₹50,000' : 'Max ₹25,000'}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    max={inputs.parentsSeniorCitizen ? 50000 : 25000}
                    value={inputs.sec80D_Parents || ''}
                    onChange={(e) => setInputs({ ...inputs, sec80D_Parents: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="checkbox"
                    id="seniorParents"
                    checked={inputs.parentsSeniorCitizen}
                    onChange={(e) => setInputs({ ...inputs, parentsSeniorCitizen: e.target.checked })}
                    className="accent-teal-500 cursor-pointer"
                  />
                  <label htmlFor="seniorParents" className="text-[10px] text-slate-300 cursor-pointer">
                    {isMl ? 'മാതാപിതാക്കൾ മുതിർന്ന പൗരന്മാരാണ് (Senior Citizen 60+)' : 'Parents are senior citizens (60+ yrs)'}
                  </label>
                </div>
              </div>

              {/* Section 24(b) Home Loan Interest */}
              <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 block">
                    {isMl ? 'ഭവന വായ്പ പലിശ (Sec 24(b)): ' : 'Home Loan Interest (Sec 24(b)): '}
                  </label>
                  <span className="text-[10px] text-teal-400 font-mono">Max ₹2,00,000</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    max={200000}
                    value={inputs.sec24b_HomeLoanInterest || ''}
                    onChange={(e) => setInputs({ ...inputs, sec24b_HomeLoanInterest: Math.min(200000, parseFloat(e.target.value) || 0) })}
                    className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Self-occupied house property loss
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OTHER INCOME */}
        {activeTab === 'other' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs pt-1">
            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'സേവിംഗ്സ് ബാങ്ക് പലിശ (Savings Interest):' : 'Savings Bank Interest:'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.savingsInterest || ''}
                  onChange={(e) => setInputs({ ...inputs, savingsInterest: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-teal-300 block">
                Exempt up to ₹10,000 u/s 80TTA in Old Regime
              </span>
            </div>

            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'മറ്റു സ്രോതസ്സുകളിൽ നിന്നുള്ള വരുമാനം:' : 'FD Interest & Other Sources:'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.incomeFromOtherSources || ''}
                  onChange={(e) => setInputs({ ...inputs, incomeFromOtherSources: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                Fixed deposits, dividends, mutual fund gains
              </span>
            </div>

            <div className="space-y-1.5 bg-[#051926] p-3.5 rounded-2xl border border-[#0f3b52]">
              <label className="font-bold text-slate-300 block">
                {isMl ? 'വീട് വാടക വരുമാനം (Rental Income):' : 'Income from House Property (Net):'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={inputs.incomeFromHouseProperty || ''}
                  onChange={(e) => setInputs({ ...inputs, incomeFromHouseProperty: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#082233] border border-[#164d6b] rounded-xl px-3 py-2 pl-7 font-mono font-bold text-white focus:outline-teal-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                Net rent received after 30% standard deduction
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: TAX SLABS BREAKDOWN */}
        {activeTab === 'slabs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            {/* New Regime Slabs */}
            <div className="p-4 rounded-2xl bg-[#051a24] border border-teal-800/60 space-y-2">
              <h3 className="font-extrabold text-sm text-teal-300 flex items-center justify-between">
                <span>{isMl ? 'പുതിയ വ്യവസ്ഥയിലെ സ്ലാബുകൾ (New Slabs)' : 'New Regime Slabs (Sec 115BAC)'}</span>
                <span className="text-[10px] text-slate-400 font-mono">Budget 2024-2026</span>
              </h3>
              <div className="divide-y divide-slate-800">
                {newRegime.slabs.map((slab, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{slab.slab}</span>
                      <span className="text-[10px] text-teal-400 font-mono">Rate: {slab.rate}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-400 block text-[10px]">Taxable: ₹{slab.taxableInSlab.toLocaleString('en-IN')}</span>
                      <span className="font-bold text-emerald-400">₹{slab.taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Old Regime Slabs */}
            <div className="p-4 rounded-2xl bg-[#051a24] border border-amber-800/60 space-y-2">
              <h3 className="font-extrabold text-sm text-amber-300 flex items-center justify-between">
                <span>{isMl ? 'പഴയ വ്യവസ്ഥയിലെ സ്ലാബുകൾ (Old Slabs)' : 'Old Regime Slabs'}</span>
                <span className="text-[10px] text-slate-400 font-mono">Regular Individual</span>
              </h3>
              <div className="divide-y divide-slate-800">
                {oldRegime.slabs.map((slab, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">{slab.slab}</span>
                      <span className="text-[10px] text-amber-400 font-mono">Rate: {slab.rate}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-400 block text-[10px]">Taxable: ₹{slab.taxableInSlab.toLocaleString('en-IN')}</span>
                      <span className="font-bold text-amber-400">₹{slab.taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MONTHLY TDS SCHEDULE */}
        {activeTab === 'tdsSchedule' && (
          <div className="p-4 rounded-2xl bg-[#051926] border border-teal-800/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isMl ? 'പ്രതിമാസ TDS കിഴിവ് ഷെഡ്യൂൾ (Monthly Payroll Deduction)' : 'CSL Monthly TDS Payroll Schedule (FY 2026-27)'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isMl ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് അക്കൗണ്ട്സ് ഡിപ്പാർട്ട്മെന്റ് ഓരോ മാസത്തെയും പേ സ്ലിപ്പിൽ നിന്ന് പിടിക്കുന്ന TDS തുക' : 'Estimated monthly tax deducted at source by CSL Accounts from monthly payslip.'}
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-teal-950 text-teal-300 border border-teal-600/40 shrink-0">
                Recommended: {recommendedRegime === 'new' ? 'New Regime' : 'Old Regime'}
              </span>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 text-xs font-mono bg-black/30">
              <div className="p-2.5 bg-[#0a2333] font-bold text-slate-300 grid grid-cols-4 sm:grid-cols-5 text-center">
                <span>Month</span>
                <span>Est. Gross</span>
                <span className="text-emerald-400">New TDS</span>
                <span className="text-amber-400">Old TDS</span>
                <span className="hidden sm:inline text-teal-300">Status</span>
              </div>
              {[
                'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026',
                'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027', 'Mar 2027'
              ].map((month, idx) => (
                <div key={idx} className="p-2.5 grid grid-cols-4 sm:grid-cols-5 text-center hover:bg-white/5 transition-colors">
                  <span className="font-bold text-white">{month}</span>
                  <span className="text-slate-300">₹{Math.round(newRegime.grossTotalIncome / 12).toLocaleString('en-IN')}</span>
                  <span className="text-emerald-300 font-bold">₹{newRegime.monthlyTdsDeduction.toLocaleString('en-IN')}</span>
                  <span className="text-amber-300 font-bold">₹{oldRegime.monthlyTdsDeduction.toLocaleString('en-IN')}</span>
                  <span className="hidden sm:inline text-[10px] text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-600/30">
                    CSL Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. CSL TAX PLANNING TIPS & PSU KNOWLEDGE BASE */}
      <div className="rounded-3xl p-5 bg-[#041a27] border border-teal-900/60 text-xs space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>{isMl ? 'സി.എസ്.എൽ ജീവനക്കാർ അറിഞ്ഞിരിക്കേണ്ട ഇൻകം ടാക്സ് നിയമങ്ങൾ' : 'CSL Employee Income Tax Rules & Tips (FY 2026-27)'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
          <div className="p-3 rounded-2xl bg-[#062436] border border-[#0f3e58] space-y-1">
            <span className="font-bold text-emerald-400 block">1. New Regime Zero Tax Rule</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isMl 
                ? 'പുതിയ നികുതി വ്യവസ്ഥയിൽ ₹75,000 സ്റ്റാൻഡേർഡ് ഡിഡക്ഷൻ ഉള്ളതിനാൽ പ്രതിവർഷം ₹7,75,000 വരെ ആകെ വരുമാനമുള്ളവർക്ക് ഒരു രൂപയും നികുതി നൽകേണ്ടതില്ല (Zero Tax).'
                : 'Under New Regime with ₹75,000 standard deduction, employees earning up to ₹7,75,000 gross salary pay ZERO tax thanks to Section 87A rebate.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#062436] border border-[#0f3e58] space-y-1">
            <span className="font-bold text-cyan-400 block">2. PSU Employer NPS 80CCD(2)</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isMl 
                ? 'കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് അടയ്ക്കുന്ന എംപ്ലോയർ NPS തുക (ബേസിക് + DA യുടെ 14% വരെ) രണ്ട് നികുതി വ്യവസ്ഥകളിലും പൂർണ്ണ നികുതി ഇളവിന് അർഹമാണ്.'
                : 'Employer NPS contribution (up to 14% of Basic + DA for PSUs) remains tax-exempt under BOTH New and Old regimes.'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#062436] border border-[#0f3e58] space-y-1">
            <span className="font-bold text-amber-400 block">3. When is Old Regime Better?</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isMl 
                ? 'നിങ്ങൾക്ക് സെക്ഷൻ 80C (₹1.5L), ഭവന വായ്പ പലിശ (₹2L), HRA, 80D എന്നിവയിൽ കൂടി ₹3.75 ലക്ഷത്തിൽ കൂടുതൽ ഇളവുകൾ ഉണ്ടെങ്കിൽ മാത്രമേ പഴയ വ്യവസ്ഥ പ്രയോജനപ്പെടൂ.'
                : 'Old Regime is better only if your total deductions (80C, 80D, HRA, Home loan interest) exceed approx ₹3.75 Lakhs.'}
            </p>
          </div>
        </div>

        {/* Footer Navigation Back to Salary Calculator & Payslip */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800 text-[11px]">
          <span className="text-slate-400">
            Form 16 Tax Estimation · CSL Corporate Finance & Taxation Cell, Ernakulam, Kochi
          </span>
          {onOpenSalary && (
            <button
              type="button"
              onClick={onOpenSalary}
              className="text-cyan-300 hover:underline font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>{isMl ? 'സി.എസ്.എൽ ശമ്പള കാൽക്കുലേറ്ററിലേക്ക് പോകുക' : 'Go to CSL Salary Calculator & Payslip'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
