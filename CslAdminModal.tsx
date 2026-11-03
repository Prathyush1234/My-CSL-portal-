import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, KeyRound, X, Check, RotateCcw, 
  Percent, IndianRupee, Eye, EyeOff, Save
} from 'lucide-react';
import { 
  AdminSalaryConfig, 
  getAdminSalaryConfig, 
  saveAdminSalaryConfig, 
  resetAdminSalaryConfig 
} from '../utils/adminSalaryConfig';
import { CslLogo } from './CslLogo';
import { Language } from '../types';

interface CslAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const CslAdminModal: React.FC<CslAdminModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
}) => {
  const isMl = language === 'ml';
  const isHi = language === 'hi';
  const isEn = language === 'en';

  const trSimple = (en: string, ml: string, hi: string) => {
    if (isEn) return en;
    if (isMl) return ml;
    if (isHi) return hi;
    return en;
  };

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);

  // Admin Config State
  const [config, setConfig] = useState<AdminSalaryConfig>(getAdminSalaryConfig());
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync config when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig(getAdminSalaryConfig());
      setPasswordInput('');
      setAuthError(null);
      setSaveSuccess(false);
    } else {
      setIsAuthenticated(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle password submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentConfig = getAdminSalaryConfig();
    const targetPass = currentConfig.adminPassword || '472544';

    if (passwordInput.trim() === targetPass || passwordInput.trim() === '472544') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setAuthError(
        trSimple(
          'Invalid password! Please enter the authorized admin password.',
          'തെറ്റായ പാസ്സ്‌വേർഡ്! ശരിയായ അഡ്മിൻ പാസ്സ്‌വേർഡ് നൽകുക.',
          'गलत पासवर्ड! कृपया सही एडमिन पासवर्ड दर्ज करें।'
        )
      );
    }
  };

  // Handle Saving Configuration
  const handleSave = () => {
    saveAdminSalaryConfig(config);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Handle Resetting to Factory Defaults
  const handleReset = () => {
    const res = resetAdminSalaryConfig();
    setConfig(res);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-2xl bg-[#0f1d2c] border border-cyan-500/40 rounded-3xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[92vh] ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Top Header */}
        <div className="bg-[#09131d] px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-full bg-cyan-950/80 border border-cyan-500/40">
              <CslLogo size={34} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded font-black tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  CSL ADMIN
                </span>
                <h3 className="text-sm sm:text-base font-black tracking-wide text-white">
                  {isAuthenticated 
                    ? trSimple('CSL Payroll Admin Panel', 'പേറോൾ അഡ്മിൻ കൺട്രോൾ പാനൽ (Admin Panel)', 'सीएसएल पेरोल एडमिन पैनल (Admin Panel)')
                    : trSimple('Admin Security Verification', 'അഡ്മിൻ സുരക്ഷാ പരിശോധന (Security Check)', 'एडमिन सुरक्षा सत्यापन (Security Check)')
                  }
                </h3>
              </div>
              <p className="text-[11px] text-slate-400">
                {isAuthenticated 
                  ? trSimple('Official CSL Payslip Formulas, Rates & Recovery Standards', 'ഔദ്യോഗിക പേറോൾ ഫോർമുലകളും സ്റ്റാൻഡേർഡ് നിരക്കുകളും', 'आधिकारिक सीएसएल पेरोल सूत्र, दरें और मानक')
                  : trSimple('Triple-click Secret Access (Password Protected)', 'മൂന്ന് ക്ലിക്ക് രഹസ്യ പ്രവേശനം (Password Protected)', 'ट्रिपल-क्लिक गुप्त पहुंच (Password Protected)')
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Admin Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!isAuthenticated ? (
            /* STEP 1: PASSWORD AUTHENTICATION (472544) */
            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md mx-auto py-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center shadow-lg shadow-cyan-950/50">
                  <Lock className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">
                  {trSimple('Enter Admin Password', 'അഡ്മിൻ പാസ്സ്‌വേർഡ് നൽകുക', 'एडमिन पासवर्ड दर्ज करें')}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {trSimple(
                    'Enter the admin password to configure official DA %, HRA %, OT divisor, and recovery standards.',
                    'സാലറി സ്ലിപ്പിലെ ഓട്ടോമാറ്റിക് നിരക്കുകൾ (DA, HRA, OT Divisor, Allowances) എഡിറ്റ് ചെയ്യാൻ പാസ്സ്‌വേർഡ് നൽകുക.',
                    'वेतन पर्ची में स्वतः गणना की जाने वाली दरों (DA, HRA, OT Divisor, Allowances) को संपादित करने के लिए पासवर्ड दर्ज करें।'
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  {trSimple('Admin Password', 'അഡ്മിൻ പാസ്സ്‌വേർഡ് (Admin Password)', 'एडमिन पासवर्ड')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="••••••"
                    autoFocus
                    className="w-full bg-[#08121a] border border-cyan-600/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-white font-mono font-bold text-lg px-4 py-3 rounded-xl outline-hidden pr-12 transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {authError && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-lg animate-fadeIn">
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-black text-sm tracking-wide uppercase bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-[#09131d] shadow-lg shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{trSimple('Unlock Admin Page', 'അൺലോക്ക് ചെയ്യുക (Unlock)', 'अनलॉक करें (Unlock)')}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl font-bold text-xs uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  {trSimple('Cancel', 'റദ്ദാക്കുക (Cancel)', 'रद्द करें (Cancel)')}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: ADMIN CONFIGURATION SETTINGS */
            <div className="space-y-6">
              {saveSuccess && (
                <div className="bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>
                      {trSimple(
                        'Admin settings saved successfully! All payslip calculations updated.',
                        'അഡ്മിൻ ക്രമീകരണങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു! പേസ്ലിപ്പ് കാൽക്കുലേറ്ററിൽ മാറ്റങ്ങൾ പ്രതിഫലിക്കും.',
                        'एडमिन सेटिंग्स सफलतापूर्वक सहेजी गईं! वेतन पर्ची गणना अपडेट की गई।'
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Instructions Callout */}
              <div className="bg-[#091b29] border border-cyan-800/60 rounded-2xl p-4 text-xs text-cyan-200/90 space-y-1">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>{trSimple('Automatic Payslip Calculation Formulas', 'ഓട്ടോമാറ്റിക് കാൽക്കുലേഷൻ നിയമങ്ങൾ', 'स्वचालित गणना सूत्र')}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {trSimple(
                    'When user types Basic Salary & OT Hours, the engine auto-computes all allowances, overtime rates, and deductions using the official parameters below.',
                    'ജീവനക്കാരൻ ബേസിക് സാലറിയും OT മണിക്കൂറുകളും ടൈപ്പ് ചെയ്യുമ്പോൾ താഴെ നൽകിയിരിക്കുന്ന ഫോർമുലകളും സ്റ്റാൻഡേർഡ് തുകകളും പ്രകാരമാണ് ആപ്പിൽ ബാക്കിയെല്ലാം തനിയെ കണക്കാക്കുന്നത്.',
                    'जब उपयोगकर्ता मूल वेतन और ओटी घंटे दर्ज करता है, तो नीचे दिए गए आधिकारिक मानकों के अनुसार सब कुछ स्वतः गणना हो जाता है।'
                  )}
                </p>
              </div>

              {/* Group 1: Percentages & Formulas (DA %, HRA %, EPF %, OT Divisor) */}
              <div className="bg-[#0b1622] rounded-2xl p-4 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5" />
                    <span>{trSimple('1. Rates & Formulas', '1. നിരക്കുകളും ഫോർമുലകളും (Rates & Formulas)', '1. दरें और सूत्र (Rates & Formulas)')}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    CSL June 2026 Payslip
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* DA % */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      DA % (VDA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={config.daPercent}
                        onChange={(e) => setConfig({ ...config, daPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#08121a] border border-slate-700 focus:border-cyan-400 text-white font-mono font-bold text-sm px-3 py-2 rounded-xl outline-hidden"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 mt-1 block">In Slip: 54.10%</span>
                  </div>

                  {/* HRA % */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      HRA % (Rent)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={config.hraPercent}
                        onChange={(e) => setConfig({ ...config, hraPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#08121a] border border-slate-700 focus:border-cyan-400 text-white font-mono font-bold text-sm px-3 py-2 rounded-xl outline-hidden"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">In Slip: 20.00%</span>
                  </div>

                  {/* EPF % */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      EPF % (PF)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={config.epfPercent}
                        onChange={(e) => setConfig({ ...config, epfPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#08121a] border border-slate-700 focus:border-cyan-400 text-white font-mono font-bold text-sm px-3 py-2 rounded-xl outline-hidden"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Statutory: 12%</span>
                  </div>

                  {/* OT Divisor */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      OT Divisor
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={config.otDivisor}
                        onChange={(e) => setConfig({ ...config, otDivisor: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#08121a] border border-slate-700 focus:border-cyan-400 text-white font-mono font-bold text-sm px-3 py-2 rounded-xl outline-hidden"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Factories Act: 198.2</span>
                  </div>
                </div>
              </div>

              {/* Group 2: Standard Payslip Earnings */}
              <div className="bg-[#0b1622] rounded-2xl p-4 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-teal-400" />
                    <span>{trSimple('2. Standard Payslip Earnings', '2. സ്റ്റാൻഡേർഡ് വേതനങ്ങൾ (Standard Earnings)', '2. मानक कमाई (Standard Earnings)')}</span>
                  </span>
                  <span className="text-[10px] text-teal-300 font-mono">Per Payslip</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">Work Dress Maint (₹)</label>
                    <input
                      type="number"
                      value={config.workDressMaint}
                      onChange={(e) => setConfig({ ...config, workDressMaint: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">TPA for Workmen (₹)</label>
                    <input
                      type="number"
                      value={config.tpaWorkmen}
                      onChange={(e) => setConfig({ ...config, tpaWorkmen: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">Special Meal Subsidy (₹)</label>
                    <input
                      type="number"
                      value={config.specialMealSubsidy}
                      onChange={(e) => setConfig({ ...config, specialMealSubsidy: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">Milk Allowance (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.milkAllowance}
                      onChange={(e) => setConfig({ ...config, milkAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">Leave Travel Allw (₹)</label>
                    <input
                      type="number"
                      value={config.leaveTravelAllw}
                      onChange={(e) => setConfig({ ...config, leaveTravelAllw: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">BF Milk Allow (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.bfMilkAllow}
                      onChange={(e) => setConfig({ ...config, bfMilkAllow: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Standard Payslip Deductions */}
              <div className="bg-[#0b1622] rounded-2xl p-4 border border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-rose-400" />
                    <span>{trSimple('3. Standard Payslip Deductions', '3. സ്റ്റാൻഡേർഡ് പിടുത്തങ്ങൾ (Standard Deductions)', '3. मानक कटौतियां (Standard Deductions)')}</span>
                  </span>
                  <span className="text-[10px] text-rose-300 font-mono">Deductions</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">LWF Deductions (₹)</label>
                    <input
                      type="number"
                      value={config.lwfDeductions}
                      onChange={(e) => setConfig({ ...config, lwfDeductions: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">SEPPY Scheme (₹)</label>
                    <input
                      type="number"
                      value={config.seppySchemeRec}
                      onChange={(e) => setConfig({ ...config, seppySchemeRec: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">Festival Adv Repay (₹)</label>
                    <input
                      type="number"
                      value={config.festivalAdvRepay}
                      onChange={(e) => setConfig({ ...config, festivalAdvRepay: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">Recoverable Adv (₹)</label>
                    <input
                      type="number"
                      value={config.recoverableAdvRec}
                      onChange={(e) => setConfig({ ...config, recoverableAdvRec: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">School Adv Recovery (₹)</label>
                    <input
                      type="number"
                      value={config.schoolAdvRecovery}
                      onChange={(e) => setConfig({ ...config, schoolAdvRecovery: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">Canteen Recovery (₹)</label>
                    <input
                      type="number"
                      value={config.canteenRecovery}
                      onChange={(e) => setConfig({ ...config, canteenRecovery: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">CSMPWT Recovery (₹)</label>
                    <input
                      type="number"
                      value={config.csmpwtRecovery}
                      onChange={(e) => setConfig({ ...config, csmpwtRecovery: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">Club-Charitable Fund (₹)</label>
                    <input
                      type="number"
                      value={config.clubCharitableFund}
                      onChange={(e) => setConfig({ ...config, clubCharitableFund: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-300 uppercase mb-1">LIC Premium 1 (₹)</label>
                    <input
                      type="number"
                      value={config.licPremium1}
                      onChange={(e) => setConfig({ ...config, licPremium1: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#08121a] border border-slate-700 text-white font-mono px-3 py-1.5 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Company On-Contract Employee PF Settings (Admin Solved Only) */}
              <div className="bg-[#0e2133] rounded-2xl p-4 sm:p-5 border border-amber-500/40 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5 flex-wrap gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>
                      {trSimple(
                        '4. Company On-Contract Employee PF Control (Admin Solved Only)',
                        '4. കമ്പനി ഓൺ കോൺട്രാക്ട് പി.എഫ് നിയന്ത്രണം (അഡ്മിൻ മാത്രം സോൾവ് ചെയ്യുന്നത്)',
                        '4. कंपनी ऑन-कॉन्ट्रैक्ट पीएफ नियंत्रण (केवल एडमिन द्वारा)'
                      )}
                    </span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    Admin Exclusive
                  </span>
                </div>

                <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-200/90 leading-relaxed">
                  {trSimple(
                    'Rules for On-Contract employees: Zero allowances (DA, HRA, etc. are completely disabled). The PF calculation formula will be provided later. Currently, PF deduction is strictly solved and configured here by Admin only.',
                    'കരാർ ജീവനക്കാരുടെ നിയമം: അലവൻസുകൾ (DA, HRA) പൂർണ്ണമായും ഒഴിവാക്കിയിരിക്കുന്നു (₹0.00). പി.എഫ് കട്ടിംഗ് കണക്കാക്കൽ സമവാക്യം പിന്നീട് നൽകുന്നത് വരെ തുക ഇവിടെ അഡ്മിൻ മാത്രം നിശ്ചയിക്കുന്നു (Admin Solved).',
                    'ऑन-कॉन्ट्रैक्ट कर्मचारियों के लिए नियम: कोई भत्ता (DA, HRA) लागू नहीं। पीएफ कटौती सूत्र बाद में उपलब्ध कराया जाएगा, वर्तमान में केवल एडमिन द्वारा निर्धारित किया जाता है।'
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-300 uppercase mb-1">
                      {trSimple('Contract PF Deduction (₹)', 'കരാർ ജീവനക്കാരുടെ പി.എഫ് തുക (₹)', 'कॉन्ट्रैक्ट पीएफ कटौती (₹)')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        value={config.contractPfAmount ?? 0}
                        onChange={(e) => setConfig({ ...config, contractPfAmount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full bg-[#08121a] border border-amber-600/60 focus:border-amber-400 text-white font-mono font-bold text-base px-3 py-2 rounded-xl outline-hidden pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-amber-400 font-bold font-mono">₹</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {trSimple('Solved by Admin (Default: ₹0.00)', 'അഡ്മിൻ സോൾവ് ചെയ്ത തുക (Default: ₹0.00)', 'एडमिन द्वारा निर्धारित')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      {trSimple('PF Status / Note', 'പി.എഫ് കുറിപ്പ് / സ്റ്റാറ്റസ്', 'पीएफ टिप्पणी')}
                    </label>
                    <input
                      type="text"
                      value={config.contractPfNote || ''}
                      onChange={(e) => setConfig({ ...config, contractPfNote: e.target.value })}
                      placeholder={trSimple('Admin Solved (Formula pending)', 'അഡ്മിൻ മാത്രം സോൾവ് ചെയ്തത്', 'एडमिन द्वारा हल')}
                      className="w-full bg-[#08121a] border border-slate-700 focus:border-amber-400 text-white font-sans text-xs px-3 py-2.5 rounded-xl outline-hidden"
                    />
                    <span className="text-[10px] text-amber-300/80 mt-1 block">
                      {trSimple('Visible on contract salary slip', 'കരാർ ജീവനക്കാരുടെ സാലറി പേജിൽ കാണിക്കും', 'वेतन पर्ची पर दिखाई देगा')}
                    </span>
                  </div>
                </div>

                {/* Contract OT Cash Rate (Different Model) */}
                <div className="pt-3 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-300 uppercase mb-1">
                      {trSimple('Contract OT Cash Rate Per Hour (₹)', 'കരാർ OT മണിക്കൂർ നിരക്ക് (₹/hr - വേറെ മോഡൽ)', 'कॉन्ट्रैक्ट ओटी प्रति घंटा दर (₹)')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={config.contractOtRatePerHour ?? 0}
                        onChange={(e) => setConfig({ ...config, contractOtRatePerHour: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full bg-[#08121a] border border-cyan-600/60 focus:border-cyan-400 text-white font-mono font-bold text-base px-3 py-2 rounded-xl outline-hidden pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-cyan-400 font-bold font-mono">₹</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {trSimple('If 0, calculates via Base ÷ 198 × 2 until custom formula is provided', '0 ആണെങ്കിൽ ഫോർമുല നൽകുന്നത് വരെ Base ÷ 198 × 2 കണക്കാക്കും', 'यदि 0 है, तो बेस फॉर्मूला लागू होगा')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      {trSimple('OT Model Note', 'OT മോഡൽ കുറിപ്പ്', 'ओटी मॉडल टिप्पणी')}
                    </label>
                    <input
                      type="text"
                      value={config.contractOtModelNote || ''}
                      onChange={(e) => setConfig({ ...config, contractOtModelNote: e.target.value })}
                      placeholder={trSimple('Distinct Contract OT Model', 'കരാർ ജീവനക്കാർക്ക് വേറെ മോഡൽ', 'अलग ओटी मॉडल')}
                      className="w-full bg-[#08121a] border border-slate-700 focus:border-cyan-400 text-white font-sans text-xs px-3 py-2.5 rounded-xl outline-hidden"
                    />
                    <span className="text-[10px] text-cyan-300/80 mt-1 block">
                      {trSimple('User will provide the exact calculation formula', 'താങ്കൾ ഫോർമുല തരുമ്പോൾ കൃത്യമായി ചേർക്കും', 'उपयोगकर्ता सटीक गणना फॉर्मूला प्रदान करेगा')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Save & Reset */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl font-black text-sm tracking-wide uppercase bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-[#09131d] shadow-lg shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{trSimple('Save Admin Settings', 'ക്രമീകരണങ്ങൾ സേവ് ചെയ്യുക (Save)', 'सेटिंग्स सहेजें (Save)')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs uppercase bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{trSimple('Reset Defaults', 'റീസെറ്റ് ചെയ്യുക (Reset Defaults)', 'रीसेट करें (Reset Defaults)')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#09131d] px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>CSL Payroll Admin System · Secure Access</span>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              {trSimple('Lock Admin', 'ലോഗ് ഔട്ട് (Lock)', 'लॉक करें (Lock)')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
