import React, { useState } from 'react';
import { X, Download, Printer, Share2, MessageSquare, Check, ExternalLink, ShieldCheck, FileText } from 'lucide-react';
import { MonthlyPdfData, buildCslMonthlyPdfDoc, generateAndDownloadMonthlyPdf } from '../utils/cslPdfGenerator';
import { Language } from '../types';

interface CslMonthlyPdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyPdfData;
  language: Language;
}

export const CslMonthlyPdfViewerModal: React.FC<CslMonthlyPdfViewerModalProps> = ({
  isOpen,
  onClose,
  data,
  language,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const isMl = language === 'ml';

  if (!isOpen) return null;

  // Direct download handler leveraging server-assisted valid PDF stream
  const handleDownload = async () => {
    try {
      await generateAndDownloadMonthlyPdf(data);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 8000);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  // WhatsApp share handler
  const handleWhatsAppShare = () => {
    try {
      const text = `*COCHIN SHIPYARD LIMITED*\n*Official Biometric Duty & Attendance Register*\n\n` +
        `👤 *Employee:* ${data.employeeName} (${data.tokenNumber})\n` +
        `🏢 *Department:* ${data.department}\n` +
        `📅 *Month:* ${data.monthName} ${data.monthYear}\n\n` +
        `📊 *Summary:*\n` +
        `• Total Days: ${data.totalDays}\n` +
        `• Attended (Present): ${data.attendedDays} Days\n` +
        `• Sanctioned Leaves: ${data.leavesCount} Days (CL:${data.leaveBreakdown?.cl || 0}, EL:${data.leaveBreakdown?.el || 0}, HPL:${data.leaveBreakdown?.hpl || 0})\n` +
        `• Weekly Offs & Holidays: ${data.offsCount} Days\n\n` +
        `✓ System Verified CSL Attendance Portal`;

      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error('WhatsApp share error:', e);
    }
  };

  // Native share handler
  const handleNativeShare = async () => {
    try {
      const doc = buildCslMonthlyPdfDoc(data);
      const fileName = `CSL_Attendance_${data.monthName}_${data.monthYear}_${data.tokenNumber}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `CSL Biometric Attendance - ${data.monthName} ${data.monthYear}`,
          text: `Cochin Shipyard Limited Duty Register for ${data.employeeName} (${data.tokenNumber})`,
          files: [pdfFile],
        });
      } else {
        handleWhatsAppShare();
      }
    } catch (e) {
      console.warn('Native share error, falling back to WhatsApp:', e);
      handleWhatsAppShare();
    }
  };

  // Print handler (Triggers Android Print Spooler -> Save as PDF)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-[#041624] border border-[#0f3b59] rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl text-white overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-4 py-3 bg-[#061d30] border-b border-[#0f3b59] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                {isMl ? 'CSL ബയോമെട്രിക് ഹാജർ പുസ്തകം' : 'CSL Biometric Attendance Register'}
              </h3>
              <p className="text-[10px] text-cyan-300 font-mono">
                {data.monthName.toUpperCase()} {data.monthYear} · Token: {data.tokenNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#08243b] hover:bg-[#0c3352] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="px-4 py-2.5 bg-[#072136] border-b border-[#0f3b59] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {downloadSuccess ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadSuccess ? (isMl ? 'ഡൗൺലോഡ് ആയി!' : 'Downloaded!') : (isMl ? 'ഡൗൺലോഡ്' : 'Download PDF')}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isMl ? 'WhatsApp' : 'WhatsApp'}</span>
            </button>

            {/* Native Share Button */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isMl ? 'ഷെയർ' : 'Share'}</span>
            </button>

            {/* Print / Save as PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-[#0f3b59] hover:bg-[#154e75] text-cyan-200 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer border border-[#1a5b8a]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isMl ? 'പ്രിന്റ് / സേവ്' : 'Print'}</span>
            </button>
          </div>

          <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isMl ? 'സിസ്റ്റം വെരിഫൈഡ്' : 'System Verified'}</span>
          </div>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between">
            <span>
              {isMl
                ? '✅ PDF ഡൗൺലോഡ് ആയിട്ടുണ്ട്! ഫോണിലെ "Files / Downloads" ഫോൾഡറിൽ കാണാം.'
                : '✅ PDF downloaded! Check your device "Downloads" folder.'}
            </span>
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="underline font-bold text-emerald-300 hover:text-white cursor-pointer ml-2"
            >
              {isMl ? 'WhatsApp-ൽ അയക്കാം' : 'Share on WhatsApp'}
            </button>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 print:p-0 print:overflow-visible">
          
          {/* Printable Container Styling */}
          <div className="bg-white text-slate-900 rounded-xl p-4 sm:p-6 shadow-xl border border-slate-300 print:border-none print:shadow-none print:p-0">
            
            {/* CSL Formal Letterhead */}
            <div className="border-b-2 border-[#041d2e] pb-3 mb-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-base sm:text-lg font-black text-[#041d2e] tracking-tight uppercase">
                  Cochin Shipyard Limited
                </h1>
                <p className="text-[10px] text-slate-600 font-medium">
                  (A Government of India Enterprise · Ministry of Ports, Shipping & Waterways)
                </p>
                <p className="text-[9px] text-slate-500">
                  Kochi - 682 015, Kerala, India · Biometric Duty & Attendance Register
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block bg-[#041d2e] text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded">
                  {data.monthName.toUpperCase()} {data.monthYear}
                </span>
                <p className="text-[9px] text-slate-500 mt-1 font-mono">
                  REF: CSL-BIO-{data.tokenNumber}-{data.monthYear}
                </p>
              </div>
            </div>

            {/* Employee Particulars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs mb-4">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Employee Name</span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{data.employeeName}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">CSL Token / Code</span>
                <span className="font-mono font-extrabold text-cyan-800 text-xs sm:text-sm">{data.tokenNumber}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Department</span>
                <span className="font-semibold text-slate-800 text-xs">{data.department}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Category</span>
                <span className="font-bold text-emerald-800 text-xs">{data.category}</span>
              </div>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-4 gap-2 text-center mb-4">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[9px] text-slate-500 font-bold uppercase">Total Days</div>
                <div className="text-base font-black text-slate-900">{data.totalDays}</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-[9px] text-emerald-700 font-bold uppercase">Attended</div>
                <div className="text-base font-black text-emerald-700">{data.attendedDays} Days</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-[9px] text-amber-700 font-bold uppercase">Leaves</div>
                <div className="text-base font-black text-amber-700">{data.leavesCount} Days</div>
                <div className="text-[8px] text-slate-600 font-mono mt-0.5">
                  CL:{data.leaveBreakdown?.cl || 0} EL:{data.leaveBreakdown?.el || 0} HPL:{data.leaveBreakdown?.hpl || 0}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                <div className="text-[9px] text-rose-700 font-bold uppercase">Offs / Hol</div>
                <div className="text-base font-black text-rose-700">{data.offsCount} Days</div>
              </div>
            </div>

            {/* Complete 31-Day Muster Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#041d2e] text-white font-bold text-[9px] uppercase">
                    <th className="py-1.5 px-2">Date & Day</th>
                    <th className="py-1.5 px-2">Shift</th>
                    <th className="py-1.5 px-2">Punch In</th>
                    <th className="py-1.5 px-2">Punch Out</th>
                    <th className="py-1.5 px-2">Status</th>
                    <th className="py-1.5 px-2 text-right">OT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.dailyLogs.map((row, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr key={row.dayNumber} className={isEven ? 'bg-white' : 'bg-slate-50'}>
                        <td className="py-1 px-2 font-bold text-slate-800 whitespace-nowrap">{row.dateStr}</td>
                        <td className="py-1 px-2 font-mono text-slate-600">{row.shift}</td>
                        <td className="py-1 px-2 font-mono font-semibold text-emerald-700">{row.inTime}</td>
                        <td className="py-1 px-2 font-mono font-semibold text-emerald-700">{row.outTime}</td>
                        <td className="py-1 px-2">
                          <span
                            className={`font-semibold ${
                              row.status === 'PRESENT'
                                ? 'text-emerald-700'
                                : row.status === 'LEAVE'
                                ? 'text-amber-700 font-bold'
                                : row.status === 'HOLIDAY'
                                ? 'text-rose-700 font-bold'
                                : 'text-slate-500'
                            }`}
                          >
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-right font-mono text-amber-700 font-bold">{row.otHours || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Official Certification Stamp */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Official Cochin Shipyard Limited Biometric Verification</p>
                <p>Generated electronically from CSL portal. Valid for administrative & muster verification.</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ VERIFIED BIOMETRIC RECORD
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 py-3 bg-[#061d30] border-t border-[#0f3b59] flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-400">
            {isMl ? '💡 WhatsApp-ൽ അയക്കാനോ പ്രിന്റ് ചെയ്യാനോ മുകളിലെ ബട്ടണുകൾ ഉപയോഗിക്കുക' : '💡 Use WhatsApp or Print buttons to save/share'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all active:scale-95"
          >
            {isMl ? 'അടയ്ക്കുക' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
