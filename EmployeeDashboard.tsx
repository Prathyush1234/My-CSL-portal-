import React from 'react';
import { 
  ArrowLeft, Sparkles, ShieldCheck, QrCode, HardHat, Anchor, 
  Clock, MapPin, Calendar, FileText, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { CslLogo } from './CslLogo';
import { EmployeeCategory, Language } from '../types';
import { translations } from '../data/translations';

interface EmployeeDashboardProps {
  language: Language;
  selectedCategory: EmployeeCategory;
  currentUser?: { name: string; token: string; phone: string; department?: string };
  onBackToLogin: () => void;
  onOpenDrawingTool: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  language,
  selectedCategory,
  currentUser,
  onBackToLogin,
  onOpenDrawingTool,
}) => {
  const t = translations[language];
  const empDisplayName = currentUser?.name || t.empName;
  const empToken = currentUser?.token ? `CSL/EMP/${currentUser.token}` : t.employeeId;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb & Return to Login Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#005f73] hover:text-[#004250] bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToFrontPage}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Shift: General (08:00 - 17:00)</span>
        </div>
      </div>

      {/* Hero Welcome Card */}
      <div className="bg-[#0b2432] text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-teal-900/60 relative overflow-hidden">
        {/* Background blueprint grid watermark */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <CslLogo size={280} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-1 bg-amber-500 rounded-full inline-block" />
            <span className="text-xs font-bold tracking-widest text-teal-300 uppercase">
              {t.locationKicker}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Namaskaram, {empDisplayName}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed mb-6">
            Welcome to your Cochin Shipyard Limited workstation. Access technical structural tools, yard schedules, and safety permits.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenDrawingTool}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Launch Drawing AI Extractor</span>
            </button>

            <span className="text-xs text-teal-300 font-mono px-3 py-1.5 rounded-lg bg-teal-950/60 border border-teal-700/40">
              Staff ID: {empToken}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Digital ID Pass + Yard Berths Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Digital Identity Pass (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden">
          {/* Top Pass Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const now = Date.now();
                  const last = (window as unknown as { _cslLogoLast?: number })._cslLogoLast || 0;
                  const count = (window as unknown as { _cslLogoCount?: number })._cslLogoCount || 0;
                  if (now - last < 1800) {
                    const next = count + 1;
                    (window as unknown as { _cslLogoCount?: number })._cslLogoCount = next;
                    if (next >= 3) {
                      (window as unknown as { _cslLogoCount?: number })._cslLogoCount = 0;
                      window.dispatchEvent(new CustomEvent('csl_open_admin_modal'));
                    }
                  } else {
                    (window as unknown as { _cslLogoCount?: number })._cslLogoCount = 1;
                  }
                  (window as unknown as { _cslLogoLast?: number })._cslLogoLast = now;
                }}
                className="cursor-pointer active:scale-95 transition-transform"
                title="CSL Logo"
              >
                <CslLogo size={34} />
              </button>
              <div>
                <div className="font-bold text-slate-900 text-xs">COCHIN SHIPYARD</div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">DIGITAL PASS</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              ACTIVE
            </span>
          </div>

          {/* User Details */}
          <div className="space-y-3 text-xs mb-5">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Employee Name</div>
              <div className="text-base font-extrabold text-slate-900">{empDisplayName}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Designation</div>
              <div className="font-bold text-teal-800">{t.empRole}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Division</div>
              <div className="text-slate-700">{currentUser?.department || t.department}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Safety Status</div>
              <div className="text-emerald-700 font-semibold flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.safetyStatus}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Authorized Zones</div>
              <div className="text-slate-600 text-[11px] mt-0.5">{t.yardLocations}</div>
            </div>
          </div>

          {/* Pass Footer with QR simulation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="font-mono text-[11px] text-slate-500">
              <div>{empToken}</div>
              <div className="text-[10px] text-slate-400">{t.validUntil}</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center p-1.5">
              <QrCode className="w-full h-full text-white" />
            </div>
          </div>
        </div>

        {/* Quick Yard Work Tools & Dock Berths (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          {/* Quick Tools */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-[#005f73]" />
              <span>Technical Engineering Services</span>
            </h3>

            <div className="space-y-2.5">
              <div
                onClick={onOpenDrawingTool}
                className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#005f73] text-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      AI Drawing & Structural Component Extractor
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Upload ship plans & extract plates, stiffeners, weld specs (Gemini Pro)
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Anchor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      Dockyard Berths & Drydock Schedule
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Drydock 1 (Naval Refit) • Drydock 2 (55K DWT Bulk Carrier Block Assembly)
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ON SCHEDULE
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      Hot Work & Confined Space Safety Permits
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Gas-free certification for Block B-04 & Welders 6G qualification check
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  2 APPROVED
                </span>
              </div>
            </div>
          </div>

          {/* Current Yard Status Box */}
          <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>Location: Ship Building Directorate, Kochi - 682015</span>
            </div>
            <span className="font-mono text-slate-500">Weather: 29°C Fair • High Tide 14:20</span>
          </div>
        </div>
      </div>
    </div>
  );
};
