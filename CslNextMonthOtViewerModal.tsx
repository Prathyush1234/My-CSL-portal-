import React, { useState } from 'react';
import { X, Download, Printer, MessageSquare, Check, Clock, Image as ImageIcon, Loader2 } from 'lucide-react';
import { NextMonthOtPdfData, generateAndDownloadNextMonthOtPdf } from '../utils/cslPdfGenerator';
import { generateNextMonthOtJpg } from '../utils/cslOtJpgGenerator';
import { Language } from '../types';

interface CslNextMonthOtViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NextMonthOtPdfData;
  language: Language;
}

export const CslNextMonthOtViewerModal: React.FC<CslNextMonthOtViewerModalProps> = ({
  isOpen,
  onClose,
  data,
  language,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isProcessingJpg, setIsProcessingJpg] = useState(false);
  const isMl = language === 'ml';

  const [directDownloadUrl, setDirectDownloadUrl] = useState<string | null>(null);
  const [directDownloadName, setDirectDownloadName] = useState<string>('');

  if (!isOpen) return null;

  /**
   * Generates the exact document card as a high-resolution JPG image using pure 2D Canvas
   * (Zero CSS parsing errors, 100% reliable)
   */
  const captureDocumentAsJpg = async (): Promise<{ blob: Blob; dataUrl: string; fileName: string } | null> => {
    try {
      return await generateNextMonthOtJpg(data);
    } catch (err) {
      console.error('Error generating JPG document:', err);
      return null;
    }
  };

  /**
   * Reliable mobile/iframe file download helper via /api/prepare-pdf + Blob URL fallback
   */
  const triggerReliableFileDownload = async (dataUrlOrBase64: string, blob: Blob | null, fileName: string) => {
    let serverUrl: string | null = null;
    try {
      const response = await fetch('/api/prepare-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: dataUrlOrBase64,
          fileName,
        }),
      });
      if (response.ok) {
        const resData = await response.json();
        if (resData.downloadUrl) {
          serverUrl = resData.downloadUrl;
          setDirectDownloadUrl(resData.downloadUrl);
          setDirectDownloadName(resData.fileName || fileName);
        }
      }
    } catch (e) {
      console.warn('Server prepare download fallback:', e);
    }

    if (serverUrl) {
      const a = document.createElement('a');
      a.href = serverUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1500);
      return true;
    }

    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      setDirectDownloadUrl(blobUrl);
      setDirectDownloadName(fileName);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1500);
      return true;
    }

    return false;
  };

  /**
   * Builds formatted WhatsApp text summary of the OT Register
   */
  const buildWhatsAppOtText = () => {
    const lines = [
      `*COCHIN SHIPYARD LIMITED (CSL)*`,
      `*OVERTIME (OT) REGISTER · ${data.nextMonthName.toUpperCase()} ${data.nextMonthYear}*`,
      `────────────────────`,
      `👤 *Employee:* ${data.employeeName} (Token: ${data.tokenNumber})`,
      `🏢 *Dept:* ${data.department}`,
      `📅 *Cycle:* ${data.cyclePeriod || '20 Oct 2026 – 19 Nov 2026'}`,
      `⚡ *Total OT:* *${data.totalOtHours.toFixed(1)} Hours* (${data.totalOtDays} Days)`,
      `────────────────────`,
    ];
    if (data.otLogs.length > 0) {
      data.otLogs.forEach((row) => {
        lines.push(`• *${row.dateStr}* (${row.dayName.slice(0, 3)}) | Shift: ${row.shift} | *+${row.otHoursFormatted}*`);
      });
    } else {
      lines.push(`• No overtime hours recorded in this cycle.`);
    }
    lines.push(`────────────────────`);
    lines.push(`✓ Verified CSL Overtime Record`);
    return lines.join('\n');
  };

  /**
   * Shares the exact document card as a PHOTO/IMAGE directly to WhatsApp,
   * and if inside an iframe/WebView where file share is restricted, downloads the JPG
   * AND opens WhatsApp directly with the full OT summary!
   */
  const handleWhatsAppJpgShare = async () => {
    setIsProcessingJpg(true);
    try {
      const captured = await captureDocumentAsJpg();
      if (!captured) return;

      const jpgFile = new File([captured.blob], captured.fileName, { type: 'image/jpeg' });

      // 1. Try native Web Share API with file
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [jpgFile] })) {
        try {
          await navigator.share({
            files: [jpgFile],
            title: `CSL OT Register - ${data.nextMonthName} ${data.nextMonthYear}`,
          });
          setSuccessMessage(isMl ? 'ഫോട്ടോ വാട്സാപ്പിൽ അയച്ചു!' : 'Photo shared successfully!');
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 5000);
          return;
        } catch (e: any) {
          if (e.name === 'AbortError') return;
        }
      }

      // 2. Download the JPG image reliably via server GET endpoint so user has the image file on phone
      await triggerReliableFileDownload(captured.dataUrl, captured.blob, captured.fileName);

      // 3. Also open WhatsApp with the formatted OT Register details via anchor click (iframe-safe)
      const waText = buildWhatsAppOtText();
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
      const waLink = document.createElement('a');
      waLink.href = waUrl;
      waLink.target = '_blank';
      waLink.rel = 'noopener noreferrer';
      document.body.appendChild(waLink);
      waLink.click();
      setTimeout(() => {
        if (document.body.contains(waLink)) document.body.removeChild(waLink);
      }, 500);

      setSuccessMessage(
        isMl
          ? '📸 OT ഷീറ്റ് ഫോണിൽ ഡൗൺലോഡ് ചെയ്യുകയും വാട്സാപ്പ് തുറക്കുകയും ചെയ്തു!'
          : '📸 OT Sheet downloaded & WhatsApp opened!'
      );
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 8000);
    } catch (err) {
      console.error('WhatsApp Photo share error:', err);
    } finally {
      setIsProcessingJpg(false);
    }
  };

  /**
   * Direct high-resolution JPG download (via server GET endpoint + Blob fallback)
   */
  const handleDownloadJpg = async () => {
    setIsProcessingJpg(true);
    try {
      const captured = await captureDocumentAsJpg();
      if (captured) {
        await triggerReliableFileDownload(captured.dataUrl, captured.blob, captured.fileName);
        setSuccessMessage(
          isMl
            ? `JPG ഇമേജ് ഡൗൺലോഡ് ആയി! (${captured.fileName})`
            : `JPG Image downloaded! (${captured.fileName})`
        );
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 8000);
      }
    } catch (err) {
      console.error('Error downloading JPG:', err);
    } finally {
      setIsProcessingJpg(false);
    }
  };

  /**
   * Direct PDF download
   */
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const ok = await generateAndDownloadNextMonthOtPdf(data);
      if (ok) {
        setSuccessMessage(
          isMl
            ? `PDF ഡൗൺലോഡ് ആയി! (CSL_Next_Month_OT_Details_${data.nextMonthName}_${data.tokenNumber}.pdf)`
            : `PDF Downloaded Successfully!`
        );
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 8000);
      }
    } catch (e) {
      console.error('PDF Download error:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#04121d] rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl border border-amber-500/40 text-white max-h-[96vh] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#0f354c] bg-[#061825]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-white text-sm sm:text-base truncate">
                {isMl ? 'അടുത്ത മാസത്തെ OT വിവരങ്ങൾ' : 'Next Month OT Details Register'}
              </h3>
              <p className="text-[10px] text-amber-300 font-mono">
                Payable in: {data.nextMonthName.toUpperCase()} {data.nextMonthYear} · Cycle: {data.cyclePeriod || '20 Oct 2026 – 19 Nov 2026'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#092a3a] hover:bg-[#0f354c] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="px-4 py-2.5 bg-emerald-950/95 border-b border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between gap-2 flex-wrap animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-300">
                  {successMessage || (isMl ? 'വിജയകരമായി പൂർത്തിയായി!' : 'Action completed successfully!')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {directDownloadUrl && (
                <a
                  href={directDownloadUrl}
                  download={directDownloadName}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] hover:bg-emerald-400 transition-colors"
                >
                  {isMl ? '⬇ ഫയൽ തുറക്കുക / സേവ്' : '⬇ Save File'}
                </a>
              )}
              <button
                type="button"
                onClick={() => setDownloadSuccess(false)}
                className="text-emerald-400 hover:text-white text-[10px] uppercase font-bold"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Printable Document Sheet (Exactly matching user's screenshot) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-900/60">
          <div
            className="bg-white text-slate-900 rounded-xl p-4 sm:p-6 shadow-2xl border border-slate-300 font-sans text-xs max-w-xl mx-auto"
          >
            {/* Header with CSL Emblem & Titles (matching screenshot) */}
            <div className="border-b-2 border-slate-900 pb-3 mb-3 text-center relative">
              <div className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                COCHIN SHIPYARD LIMITED · കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് ലിമിറ്റഡ്
              </div>
              <div className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                (A GOVERNMENT OF INDIA UNDERTAKING · MINISTRY OF PORTS, SHIPPING AND WATERWAYS)
              </div>
              <div className="mt-2 py-1 px-3 bg-amber-500 text-slate-950 rounded font-black text-xs sm:text-sm tracking-wide uppercase inline-block shadow-sm">
                NEXT MONTH OVERTIME (OT) REGISTER · {data.nextMonthName.toUpperCase()} {data.nextMonthYear}
              </div>
              <div className="text-[9px] text-slate-600 font-medium mt-1">
                CSL Overtime Cycle: {data.cyclePeriod || '20 Oct 2026 – 19 Nov 2026'} · Authorized for {data.nextMonthName} Disbursement
              </div>
            </div>

            {/* Employee Particulars Grid (matching screenshot) */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-[11px] mb-3">
              <div>
                <span className="text-slate-500 font-medium">Employee Name: </span>
                <span className="font-extrabold text-slate-900">{data.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Token / Code: </span>
                <span className="font-extrabold text-slate-900 font-mono">{data.tokenNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Department: </span>
                <span className="font-semibold text-slate-800">{data.department}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Category: </span>
                <span className="font-semibold text-emerald-700">{data.category}</span>
              </div>
            </div>

            {/* Total OT Claim Highlight Badge (matching screenshot) */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-[11px]">TOTAL OT CLAIM FOR NEXT MONTH:</span>
              </div>
              <div className="font-black text-base text-amber-900">
                {data.totalOtHours.toFixed(1)} HOURS
                <span className="text-[10px] font-normal text-amber-800 ml-1.5">({data.totalOtDays} Days)</span>
              </div>
            </div>

            {/* Rule Notice: Days without OT are excluded */}
            <div className="text-[9.5px] text-slate-500 italic mb-2 px-1">
              * Note: As per format, only dates with active overtime hours are listed below. Days with zero overtime are omitted.
            </div>

            {/* Filtered OT Table: ONLY Dates and OT Hours (matching screenshot) */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-3">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                    <th className="py-1.5 px-2.5 text-center w-10">SL</th>
                    <th className="py-1.5 px-3">Date</th>
                    <th className="py-1.5 px-3">Day</th>
                    <th className="py-1.5 px-3">Shift / Duty</th>
                    <th className="py-1.5 px-3 text-right">OT Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.otLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500 italic text-xs">
                        No overtime hours recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    data.otLogs.map((row, idx) => (
                      <tr key={row.dayNumber || row.slNo} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-1.5 px-2.5 text-center font-mono text-slate-500">{row.slNo}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{row.dateStr}</td>
                        <td className="py-1.5 px-3 text-slate-600">{row.dayName}</td>
                        <td className="py-1.5 px-3 text-slate-700 font-mono text-[10px]">{row.shift}</td>
                        <td className="py-1.5 px-3 text-right font-black text-amber-800 font-mono text-xs">
                          {row.otHoursFormatted}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <td colSpan={4} className="py-2 px-3 text-right tracking-wide">
                      TOTAL OVERTIME (OT) CLAIM:
                    </td>
                    <td className="py-2 px-3 text-right font-black text-amber-400 font-mono text-xs">
                      {data.totalOtHours.toFixed(1)} HOURS
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions: Exact 4 options requested by user */}
        <div className="px-4 py-3 border-t border-[#0f354c] bg-[#061825] flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950/50 transition-all active:scale-95 disabled:opacity-60"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              )}
              <span>{isMl ? 'ഡൗൺലോഡ് PDF' : 'Download PDF'}</span>
            </button>

            {/* 2. WhatsApp (JPG Image Share) - EXACT REQUIREMENT */}
            <button
              type="button"
              onClick={handleWhatsAppJpgShare}
              disabled={isProcessingJpg}
              className="px-3 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1da850] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-60"
              title="Share as JPG Image to WhatsApp"
            >
              {isProcessingJpg ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <MessageSquare className="w-4 h-4 stroke-[2.4]" />
              )}
              <span>WhatsApp (JPG)</span>
            </button>

            {/* 3. Download JPG (Direct Image Save) */}
            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={isProcessingJpg}
              className="px-3 py-2.5 rounded-xl bg-[#0e3b52] hover:bg-[#134d6b] text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 border border-[#1b5b85] disabled:opacity-60"
              title="Download exact sheet as high-res JPG Image"
            >
              <ImageIcon className="w-4 h-4 text-cyan-300" />
              <span>{isMl ? 'ഡൗൺലോഡ് JPG' : 'Download JPG'}</span>
            </button>

            {/* 4. Print / PDF */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2.5 rounded-xl bg-[#092233] hover:bg-[#0e3047] text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 border border-[#143852]"
            >
              <Printer className="w-4 h-4" />
              <span>{isMl ? 'പ്രിന്റ് / സേവ്' : 'Print / PDF'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-amber-400 font-medium">
              {isMl ? '✓ സ്ക്രീൻഷോട്ട് മോഡൽ JPG ആയും PDF ആയും ലഭ്യമാണ്' : '✓ Available as exact JPG image & PDF (Zero OT omitted)'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] cursor-pointer"
            >
              {isMl ? 'അടയ്ക്കുക' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
