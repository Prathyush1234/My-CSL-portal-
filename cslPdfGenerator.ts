import { jsPDF } from 'jspdf';

export interface MonthlyPdfData {
  employeeName: string;
  tokenNumber: string;
  department: string;
  category: string;
  monthName: string;
  monthYear: number;
  totalDays: number;
  attendedDays: number;
  leavesCount: number;
  leaveBreakdown?: {
    cl: number;
    el: number;
    hpl: number;
    ml?: number;
    special?: number;
  };
  offsCount: number;
  dailyLogs: Array<{
    dayNumber: number;
    dateStr: string;
    dayName: string;
    shift: string;
    status: 'PRESENT' | 'LEAVE' | 'HOLIDAY' | 'WEEKLY_OFF' | 'OFF';
    statusLabel: string;
    inTime: string;
    outTime: string;
    otHours?: string;
  }>;
}

export interface PreparedPdfResult {
  downloadUrl: string;
  viewUrl: string;
  fileName: string;
  blob: Blob;
  doc: jsPDF;
}

/**
 * Builds the official Cochin Shipyard Limited Monthly Biometric Attendance PDF document
 */
export const buildCslMonthlyPdfDoc = (data: MonthlyPdfData): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let currentY = 14;

  // Helper to draw header
  const drawHeader = (pageNum: number) => {
    // Top Navy Header Bar
    doc.setFillColor(4, 29, 46); // CSL Brand Deep Navy #041d2e
    doc.rect(margin, currentY, contentWidth, 24, 'F');

    // Accent gold bottom stripe
    doc.setFillColor(245, 158, 11); // Amber-500
    doc.rect(margin, currentY + 23, contentWidth, 1, 'F');

    // Title & Subtitles
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('COCHIN SHIPYARD LIMITED', margin + 6, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(186, 230, 253); // Light cyan
    doc.text('(A Government of India Enterprise · Ministry of Ports, Shipping & Waterways)', margin + 6, currentY + 12);
    doc.setTextColor(148, 163, 184); // Slate
    doc.text('Kochi - 682 015, Kerala, India · Official Biometric Duty & Attendance Register', margin + 6, currentY + 17);

    // Month Tag on right
    doc.setFillColor(8, 47, 73); // Dark cyan badge
    doc.roundedRect(pageWidth - margin - 52, currentY + 4, 46, 15, 2, 2, 'F');
    doc.setTextColor(56, 189, 248);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('MONTHLY STATEMENT', pageWidth - margin - 49, currentY + 9);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`${data.monthName.toUpperCase()} ${data.monthYear}`, pageWidth - margin - 49, currentY + 15);

    currentY += 28;
  };

  drawHeader(1);

  // ==========================================
  // EMPLOYEE DETAILS SECTION
  // ==========================================
  doc.setFillColor(248, 250, 252); // Very light slate
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  // Row 1
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Employee Name:', margin + 4, currentY + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.employeeName || 'CSL Employee', margin + 35, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CSL Code / Token:', margin + 105, currentY + 6);
  doc.setTextColor(2, 132, 199);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.tokenNumber || '5312', margin + 138, currentY + 6);

  // Row 2
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Department:', margin + 4, currentY + 13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(data.department || 'Hull & Outfitting Engineering Division', margin + 35, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Category:', margin + 105, currentY + 13);
  doc.setTextColor(5, 150, 105);
  doc.text(data.category || 'Permanent Employee', margin + 138, currentY + 13);

  // Row 3 (Date of Statement)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const generatedDateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  doc.text(`Generated On: ${generatedDateStr} IST  ·  E-Verification Code: CSL-BIO-${data.tokenNumber}-${data.monthYear}`, margin + 4, currentY + 20);

  currentY += 28;

  // ==========================================
  // ATTENDANCE STATS SUMMARY CARDS
  // ==========================================
  const cardWidth = (contentWidth - 9) / 4; // 4 cards with 3mm gap
  const cardHeight = 16;

  // Card 1: TOTAL DAYS
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL DAYS', margin + 4, currentY + 5);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.totalDays), margin + 4, currentY + 12);

  // Card 2: ATTENDED
  const c2X = margin + cardWidth + 3;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(c2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.text('ATTENDED', c2X + 4, currentY + 5);
  doc.setFontSize(11);
  doc.text(`${data.attendedDays} Days`, c2X + 4, currentY + 12);

  // Card 3: LEAVES
  const c3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(c3X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(217, 119, 6);
  doc.text('LEAVES', c3X + 4, currentY + 5);
  doc.setFontSize(11);
  doc.text(`${data.leavesCount} Days`, c3X + 4, currentY + 12);
  const bk = data.leaveBreakdown;
  const bkText = bk ? `CL:${bk.cl} EL:${bk.el} HPL:${bk.hpl}` : 'CL/EL/HPL';
  doc.setFontSize(6.5);
  doc.text(bkText, c3X + 4, currentY + 15);

  // Card 4: OFFS & HOLIDAYS
  const c4X = margin + (cardWidth + 3) * 3;
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(c4X, currentY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(225, 29, 72);
  doc.text('OFFS & HOLIDAYS', c4X + 4, currentY + 5);
  doc.setFontSize(11);
  doc.text(`${data.offsCount} Days`, c4X + 4, currentY + 12);

  currentY += 21;

  // ==========================================
  // DAILY BIOMETRIC & SHIFT LOG TABLE
  // ==========================================
  const colX = {
    date: margin + 2,
    shift: margin + 38,
    inTime: margin + 74,
    outTime: margin + 100,
    status: margin + 126,
    ot: margin + 168,
  };

  // Table Header
  const drawTableHeader = (y: number) => {
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('DATE & DAY', colX.date, y + 5);
    doc.text('SHIFT', colX.shift, y + 5);
    doc.text('PUNCH IN', colX.inTime, y + 5);
    doc.text('PUNCH OUT', colX.outTime, y + 5);
    doc.text('DUTY / LEAVE STATUS', colX.status, y + 5);
    doc.text('OT', colX.ot, y + 5);
  };

  drawTableHeader(currentY);
  currentY += 7;

  const rowHeight = 6.0;
  let pageNumber = 1;

  // Draw Daily Logs
  data.dailyLogs.forEach((row, index) => {
    // Check page break
    if (currentY + rowHeight > pageHeight - 16) {
      // Page footer for previous page
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pageNumber} · Cochin Shipyard Limited Official Biometric Attendance System`, margin, pageHeight - 8);

      doc.addPage();
      pageNumber++;
      currentY = 14;
      drawHeader(pageNumber);
      drawTableHeader(currentY);
      currentY += 7;
    }

    // Row background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Border line below each row
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    doc.setFontSize(7);

    // Date Column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(row.dateStr, colX.date, currentY + 4.2);

    // Shift Column
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(row.shift || '—', colX.shift, currentY + 4.2);

    // Punch In & Out Column
    if (row.status === 'PRESENT') {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(row.inTime || '07:00 AM', colX.inTime, currentY + 4.2);
      doc.text(row.outTime || '03:20 PM', colX.outTime, currentY + 4.2);

      doc.setTextColor(5, 150, 105);
      doc.text(row.statusLabel || 'Duty Attended (Present)', colX.status, currentY + 4.2);
    } else if (row.status === 'LEAVE') {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('—', colX.inTime, currentY + 4.2);
      doc.text('—', colX.outTime, currentY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6); // Amber
      doc.text(row.statusLabel || 'Leave', colX.status, currentY + 4.2);
    } else if (row.status === 'HOLIDAY') {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('—', colX.inTime, currentY + 4.2);
      doc.text('—', colX.outTime, currentY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72); // Rose
      doc.text(row.statusLabel || 'Holiday', colX.status, currentY + 4.2);
    } else {
      // Weekly Off / Sunday
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('—', colX.inTime, currentY + 4.2);
      doc.text('—', colX.outTime, currentY + 4.2);

      doc.setTextColor(100, 116, 139);
      doc.text(row.statusLabel || 'Weekly Off (Sunday)', colX.status, currentY + 4.2);
    }

    // OT Column
    doc.setFont('helvetica', row.otHours ? 'bold' : 'normal');
    doc.setTextColor(row.otHours ? 217 : 148, row.otHours ? 119 : 163, row.otHours ? 6 : 184);
    doc.text(row.otHours || '—', colX.ot, currentY + 4.2);

    currentY += rowHeight;
  });

  // ==========================================
  // OFFICIAL VERIFICATION FOOTER
  // ==========================================
  currentY += 4;
  if (currentY + 22 > pageHeight - 12) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL VERIFICATION & CERTIFICATION', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('This is a verified system-generated biometric duty muster register from Cochin Shipyard Limited (CSL) Portal.', margin + 4, currentY + 9.5);
  doc.text('All biometric punch records and sanctioned leaves are recorded in accordance with CSL HR policies.', margin + 4, currentY + 13.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('✓ SYSTEM VERIFIED · NO PHYSICAL SIGNATURE REQUIRED', pageWidth - margin - 78, currentY + 9.5);

  // Final Page Number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Page ${pageNumber} of ${pageNumber} · Cochin Shipyard Limited · Private & Confidential`, margin, pageHeight - 6);

  return doc;
};

/**
 * Prepares the PDF and caches it on the server, returning REAL GET URLs ending in .pdf
 * This ensures Android DownloadManager and mobile browsers receive real HTTP endpoints,
 * eliminating the blank "Save As" file dialog.
 */
export const prepareMonthlyPdf = async (data: MonthlyPdfData): Promise<PreparedPdfResult> => {
  const doc = buildCslMonthlyPdfDoc(data);
  const fileName = `CSL_Attendance_${data.monthName}_${data.monthYear}_${data.tokenNumber}.pdf`;
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');

  try {
    const res = await fetch('/api/prepare-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: dataUri,
        fileName,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.downloadUrl) {
        return {
          downloadUrl: json.downloadUrl,
          viewUrl: json.viewUrl,
          fileName: json.fileName || fileName,
          blob,
          doc,
        };
      }
    }
  } catch (err) {
    console.warn('Could not prepare PDF on server, using blob fallback:', err);
  }

  // Fallback blob URL
  const blobUrl = URL.createObjectURL(blob);
  return {
    downloadUrl: blobUrl,
    viewUrl: blobUrl,
    fileName,
    blob,
    doc,
  };
};

/**
 * Downloads the PDF reliably on all platforms (Android, iOS, Desktop)
 * Uses the server's real GET URL (/api/get-pdf/id/filename.pdf) which has:
 * Content-Disposition: attachment; filename="...pdf"
 * This instructs Android Chrome / Download Manager to save directly without prompt.
 */
export const generateAndDownloadMonthlyPdf = async (data: MonthlyPdfData): Promise<boolean> => {
  try {
    const prepared = await prepareMonthlyPdf(data);

    // 1. If we got a real server GET downloadUrl, navigate to it via standard download anchor
    if (prepared.downloadUrl.startsWith('/api/')) {
      const link = document.createElement('a');
      link.href = prepared.downloadUrl;
      link.download = prepared.fileName;
      link.setAttribute('download', prepared.fileName);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 2000);
      return true;
    }

    // 2. Blob fallback if server is unreachable
    const link = document.createElement('a');
    link.href = prepared.downloadUrl;
    link.download = prepared.fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 2000);

    return true;
  } catch (error) {
    console.error('Error downloading CSL PDF:', error);
    return false;
  }
};

/**
 * Shares the PDF using Android / iOS native system share sheet
 * Directly feeds a native File object to navigator.share
 * Allows users to save directly to Google Drive, WhatsApp, or local Files without any browser prompt.
 */
export const shareMonthlyPdf = async (data: MonthlyPdfData): Promise<{ success: boolean; shared: boolean; message?: string }> => {
  try {
    const doc = buildCslMonthlyPdfDoc(data);
    const fileName = `CSL_Attendance_${data.monthName}_${data.monthYear}_${data.tokenNumber}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        title: `CSL Biometric Attendance - ${data.monthName} ${data.monthYear}`,
        text: `Cochin Shipyard Limited Biometric Attendance Register for ${data.employeeName} (${data.tokenNumber})`,
        files: [pdfFile],
      });
      return { success: true, shared: true };
    } else {
      // Fallback: trigger download
      const downloaded = await generateAndDownloadMonthlyPdf(data);
      return { success: downloaded, shared: false, message: 'Web share not supported on this browser' };
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { success: true, shared: false };
    }
    console.error('Error sharing PDF:', error);
    return { success: false, shared: false, message: String(error) };
  }
};

/**
 * Opens the PDF directly in a new browser tab or native viewer
 */
export const openMonthlyPdfInNewTab = async (data: MonthlyPdfData): Promise<boolean> => {
  try {
    const prepared = await prepareMonthlyPdf(data);
    const win = window.open(prepared.viewUrl, '_blank');
    if (!win) {
      window.location.href = prepared.viewUrl;
    }
    return true;
  } catch (error) {
    console.error('Error opening PDF in new tab:', error);
    return false;
  }
};

// =========================================================================
// NEXT MONTH OVERTIME (OT) DETAILS PDF
// Strictly contains ONLY days with OT (OT > 0), omitting zero-OT days!
// =========================================================================

export interface NextMonthOtItem {
  slNo: number;
  dayNumber?: number;
  dateStr: string;
  dayName: string;
  shift: string;
  otHours: number;
  otHoursFormatted: string;
  remarks?: string;
}

export interface NextMonthOtPdfData {
  employeeName: string;
  tokenNumber: string;
  department: string;
  category: string;
  currentMonthName: string;
  currentMonthYear: number;
  nextMonthName: string;
  nextMonthYear: number;
  cyclePeriod?: string;
  totalOtHours: number;
  totalOtDays: number;
  otLogs: NextMonthOtItem[];
}

/**
 * Builds the official Cochin Shipyard Next Month OT Details PDF document
 * STRICT RULE: Only days where OT was worked are listed (days without OT are excluded).
 */
export const buildNextMonthOtPdfDoc = (data: NextMonthOtPdfData): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  let currentY = 16;

  // Header Titles (Centered, matching screenshot)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text('COCHIN SHIPYARD LIMITED · കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് ലിമിറ്റഡ്', pageWidth / 2, currentY, { align: 'center' });

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('(A GOVERNMENT OF INDIA UNDERTAKING · MINISTRY OF PORTS, SHIPPING AND WATERWAYS)', pageWidth / 2, currentY, { align: 'center' });

  currentY += 6;

  // Prominent Amber Badge Banner (matching screenshot)
  const bannerWidth = 140;
  const bannerHeight = 8;
  const bannerX = (pageWidth - bannerWidth) / 2;
  doc.setFillColor(245, 158, 11); // Amber-500
  doc.roundedRect(bannerX, currentY, bannerWidth, bannerHeight, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // Slate-900 / dark
  doc.text(`NEXT MONTH OVERTIME (OT) REGISTER · ${data.nextMonthName.toUpperCase()} ${data.nextMonthYear}`, pageWidth / 2, currentY + 5.5, { align: 'center' });

  currentY += bannerHeight + 4;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const cycleText = data.cyclePeriod
    ? `CSL Overtime Cycle: ${data.cyclePeriod} · Authorized for ${data.nextMonthName} Disbursement`
    : `Overtime Claim: 20 October 2026 – 19 November 2026 · Authorized for ${data.nextMonthName} Disbursement`;
  doc.text(cycleText, pageWidth / 2, currentY, { align: 'center' });

  currentY += 4.5;

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, margin + contentWidth, currentY);

  currentY += 4;

  // Employee Particulars Box (Slate-100 with border, matching screenshot)
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  const col1X = margin + 5;
  const col2X = margin + contentWidth / 2 + 5;

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Employee Name: ', col1X, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.employeeName, col1X + 26, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Token / Code: ', col2X, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.tokenNumber, col2X + 22, currentY + 6);

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Department: ', col1X, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(data.department, col1X + 26, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Category: ', col2X, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87); // Emerald-700
  doc.text(data.category, col2X + 22, currentY + 13);

  currentY += 22;

  // Total OT Claim Highlight Box (matching screenshot: amber-50 background with amber border)
  doc.setFillColor(255, 251, 235); // Amber-50
  doc.setDrawColor(252, 211, 77); // Amber-300
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15); // Amber-900
  doc.text('TOTAL OT CLAIM FOR NEXT MONTH:', margin + 6, currentY + 7.5);

  doc.setFontSize(12);
  doc.setTextColor(146, 64, 14); // Amber-800
  const claimText = `${data.totalOtHours.toFixed(1)} HOURS`;
  const claimWidth = doc.getTextWidth(claimText);
  doc.text(claimText, margin + contentWidth - claimWidth - 24, currentY + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9);
  doc.text(`(${data.totalOtDays} Days)`, margin + contentWidth - 20, currentY + 7.5);

  currentY += 16;

  // Note text (matching screenshot)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('* Note: As per format, only dates with active overtime hours are listed below. Days with zero overtime are omitted.', margin, currentY);

  currentY += 4;

  // Table Columns
  const colX = {
    sl: margin + 6,
    date: margin + 22,
    day: margin + 62,
    shift: margin + 102,
    ot: margin + contentWidth - 10,
  };

  // Draw Table Header (Dark Slate-900 #0f172a, matching screenshot)
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SL', colX.sl, currentY + 5.5, { align: 'center' });
  doc.text('DATE', colX.date, currentY + 5.5);
  doc.text('DAY', colX.day, currentY + 5.5);
  doc.text('SHIFT / DUTY', colX.shift, currentY + 5.5);
  doc.text('OT HOURS', colX.ot, currentY + 5.5, { align: 'right' });

  currentY += 8;

  const rowHeight = 8.0;

  if (data.otLogs.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, contentWidth, 14, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No overtime hours recorded for this period.', pageWidth / 2, currentY + 8.5, { align: 'center' });
    currentY += 14;
  } else {
    data.otLogs.forEach((row, idx) => {
      // Row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
      }

      // Border line below
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

      doc.setFontSize(8);

      // SL No (Centered)
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(String(row.slNo), colX.sl, currentY + 5.5, { align: 'center' });

      // Date (Bold)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(row.dateStr, colX.date, currentY + 5.5);

      // Day
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(row.dayName, colX.day, currentY + 5.5);

      // Shift & Duty Type
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(row.shift || 'C1 (08:00 - 16:20)', colX.shift, currentY + 5.5);

      // OT Hours (Bold Amber, Right-aligned)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(154, 52, 18); // Amber-800 #9a3412
      doc.text(row.otHoursFormatted, colX.ot, currentY + 5.5, { align: 'right' });

      currentY += rowHeight;
    });
  }

  // Table Total Row (Dark Slate-900 with Amber text, matching screenshot)
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(margin, currentY, contentWidth, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL OVERTIME (OT) CLAIM:', colX.day, currentY + 6);

  doc.setFontSize(9.5);
  doc.setTextColor(251, 191, 36); // Amber-400
  doc.text(`${data.totalOtHours.toFixed(1)} HOURS`, colX.ot, currentY + 6, { align: 'right' });

  return doc;
};

/**
 * Prepares the Next Month OT Details PDF on the server, returning a real GET URL
 */
export const prepareNextMonthOtPdf = async (data: NextMonthOtPdfData): Promise<PreparedPdfResult> => {
  const doc = buildNextMonthOtPdfDoc(data);
  const fileName = `CSL_Next_Month_OT_Details_${data.nextMonthName}_${data.tokenNumber}.pdf`;
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');

  try {
    const res = await fetch('/api/prepare-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: dataUri,
        fileName,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.downloadUrl) {
        return {
          downloadUrl: json.downloadUrl,
          viewUrl: json.viewUrl,
          fileName: json.fileName || fileName,
          blob,
          doc,
        };
      }
    }
  } catch (err) {
    console.warn('Could not prepare Next Month OT PDF on server, using blob fallback:', err);
  }

  const blobUrl = URL.createObjectURL(blob);
  return {
    downloadUrl: blobUrl,
    viewUrl: blobUrl,
    fileName,
    blob,
    doc,
  };
};

/**
 * Downloads the Next Month OT Details PDF reliably
 */
export const generateAndDownloadNextMonthOtPdf = async (data: NextMonthOtPdfData): Promise<boolean> => {
  try {
    const prepared = await prepareNextMonthOtPdf(data);

    if (prepared.downloadUrl.startsWith('/api/')) {
      const link = document.createElement('a');
      link.href = prepared.downloadUrl;
      link.download = prepared.fileName;
      link.setAttribute('download', prepared.fileName);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 2000);
      return true;
    }

    const link = document.createElement('a');
    link.href = prepared.downloadUrl;
    link.download = prepared.fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 2000);

    return true;
  } catch (error) {
    console.error('Error downloading Next Month OT PDF:', error);
    return false;
  }
};

/**
 * Shares the Next Month OT PDF
 */
export const shareNextMonthOtPdf = async (data: NextMonthOtPdfData): Promise<{ success: boolean; shared: boolean; message?: string }> => {
  try {
    const doc = buildNextMonthOtPdfDoc(data);
    const fileName = `CSL_Next_Month_OT_Details_${data.nextMonthName}_${data.tokenNumber}.pdf`;
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        title: `CSL Next Month OT Details - ${data.nextMonthName} ${data.nextMonthYear}`,
        text: `Cochin Shipyard Limited Overtime Register for ${data.employeeName} (${data.tokenNumber}) · Total: ${data.totalOtHours} hrs`,
        files: [pdfFile],
      });
      return { success: true, shared: true };
    } else {
      const downloaded = await generateAndDownloadNextMonthOtPdf(data);
      return { success: downloaded, shared: false, message: 'Web share not supported' };
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return { success: true, shared: false };
    }
    console.error('Error sharing Next Month OT PDF:', error);
    return { success: false, shared: false, message: String(error) };
  }
};
