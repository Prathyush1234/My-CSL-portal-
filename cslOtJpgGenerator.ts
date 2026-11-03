import { NextMonthOtPdfData } from './cslPdfGenerator';

/**
 * Helper to draw rounded rectangle on 2D canvas with cross-browser compatibility
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | { tl?: number; tr?: number; br?: number; bl?: number }
) {
  let tl = 0, tr = 0, br = 0, bl = 0;
  if (typeof radius === 'number') {
    tl = tr = br = bl = radius;
  } else {
    tl = radius.tl || 0;
    tr = radius.tr || 0;
    br = radius.br || 0;
    bl = radius.bl || 0;
  }

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + width - tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
  ctx.lineTo(x + width, y + height - br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
  ctx.lineTo(x + bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

/**
 * Pure 2D Canvas JPG Generator
 * Guarantees ZERO CSS parsing errors (no "oklch" issues) and pixel-perfect rendering
 * matching Screenshot_20261028_203629_2_6cedb3bc.jpg!
 */
export const generateNextMonthOtJpg = async (
  data: NextMonthOtPdfData
): Promise<{ blob: Blob; dataUrl: string; fileName: string }> => {
  const width = 1000; // Crisp width
  const margin = 28;
  const innerX = margin;
  const innerW = width - margin * 2;

  const headerH = 210;
  const empCardH = 80;
  const claimBoxH = 58;
  const noteH = 26;
  const tableHeaderH = 44;
  const rowH = 48;
  const rowCount = Math.max(data.otLogs.length, 1);
  const rowsH = rowCount * rowH;
  const tableFooterH = 48;
  const bottomPad = 32;

  const height = margin + headerH + empCardH + 18 + claimBoxH + 22 + noteH + 14 + tableHeaderH + rowsH + tableFooterH + bottomPad;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 1. Pristine White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  let currentY = margin + 18;

  // 2. Header Titles (Centered, matching screenshot)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#334155'; // Slate-700
  ctx.fillText('COCHIN SHIPYARD LIMITED · കൊച്ചിൻ ഷിപ്പ്‌യാർഡ് ലിമിറ്റഡ്', width / 2, currentY);

  currentY += 24;
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#64748b'; // Slate-500
  ctx.fillText('(A GOVERNMENT OF INDIA UNDERTAKING · MINISTRY OF PORTS, SHIPPING AND WATERWAYS)', width / 2, currentY);

  currentY += 18;

  // 3. Orange/Amber Banner Badge (matching screenshot)
  const bannerW = 680;
  const bannerH = 40;
  const bannerX = (width - bannerW) / 2;
  ctx.fillStyle = '#f59e0b'; // Amber-500
  drawRoundRect(ctx, bannerX, currentY, bannerW, bannerH, 8);
  ctx.fill();

  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#0f172a'; // Dark slate
  ctx.fillText(`NEXT MONTH OVERTIME (OT) REGISTER · ${data.nextMonthName.toUpperCase()} ${data.nextMonthYear}`, width / 2, currentY + 26);

  currentY += bannerH + 24;

  // 4. Subtitle
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  const cycleText = data.cyclePeriod
    ? `CSL Overtime Cycle: ${data.cyclePeriod} · Authorized for ${data.nextMonthName} Disbursement`
    : `Overtime Claim: 20 October 2026 – 19 November 2026 · Authorized for ${data.nextMonthName} Disbursement`;
  ctx.fillText(cycleText, width / 2, currentY);

  currentY += 20;

  // 5. Divider Line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(innerX, currentY);
  ctx.lineTo(innerX + innerW, currentY);
  ctx.stroke();

  currentY += 16;

  // 6. Employee Particulars Card (Light Slate-100 with border, matching screenshot)
  ctx.fillStyle = '#f1f5f9';
  drawRoundRect(ctx, innerX, currentY, innerW, empCardH, 10);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Row 1
  ctx.textAlign = 'left';
  const c1LabelX = innerX + 18;
  const c1ValX = innerX + 155;
  const c2LabelX = innerX + innerW / 2 + 18;
  const c2ValX = innerX + innerW / 2 + 130;

  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Employee Name:', c1LabelX, currentY + 32);
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(data.employeeName, c1ValX, currentY + 32);

  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Token / Code:', c2LabelX, currentY + 32);
  ctx.font = 'bold 16px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(data.tokenNumber, c2ValX, currentY + 32);

  // Row 2
  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Department:', c1LabelX, currentY + 62);
  ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(data.department, c1ValX, currentY + 62);

  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Category:', c2LabelX, currentY + 62);
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#047857'; // Emerald-700
  ctx.fillText(data.category, c2ValX, currentY + 62);

  currentY += empCardH + 18;

  // 7. Total OT Claim Highlight Box (matching screenshot: amber-50 background, border amber-300)
  ctx.fillStyle = '#fffbeb'; // Amber-50
  drawRoundRect(ctx, innerX, currentY, innerW, claimBoxH, 10);
  ctx.fill();
  ctx.strokeStyle = '#fcd34d'; // Amber-300
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Clock symbol + label
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#78350f'; // Amber-900
  ctx.fillText('🕒  TOTAL OT CLAIM FOR NEXT MONTH:', innerX + 18, currentY + 36);

  // Claim Hours (Bold Amber, right aligned)
  ctx.textAlign = 'right';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#9a3412'; // Amber-800
  ctx.fillText(`${data.totalOtHours.toFixed(1)} HOURS`, innerX + innerW - 90, currentY + 37);

  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#9a3412';
  ctx.fillText(`(${data.totalOtDays} Days)`, innerX + innerW - 18, currentY + 36);

  currentY += claimBoxH + 22;

  // 8. Note text (matching screenshot)
  ctx.textAlign = 'left';
  ctx.font = 'italic 13.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('* Note: As per format, only dates with active overtime hours are listed below. Days with zero overtime are omitted.', innerX, currentY);

  currentY += noteH - 12;

  // 9. Table Header (Dark Navy #0f172a, top rounded corners)
  ctx.fillStyle = '#0f172a';
  drawRoundRect(ctx, innerX, currentY, innerW, tableHeaderH, { tl: 8, tr: 8, br: 0, bl: 0 });
  ctx.fill();

  const colSlX = innerX + 36;
  const colDateX = innerX + 90;
  const colDayX = innerX + 280;
  const colShiftX = innerX + 460;
  const colOtX = innerX + innerW - 28;

  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';

  ctx.textAlign = 'center';
  ctx.fillText('SL', colSlX, currentY + 27);

  ctx.textAlign = 'left';
  ctx.fillText('DATE', colDateX, currentY + 27);
  ctx.fillText('DAY', colDayX, currentY + 27);
  ctx.fillText('SHIFT / DUTY', colShiftX, currentY + 27);

  ctx.textAlign = 'right';
  ctx.fillText('OT HOURS', colOtX, currentY + 27);

  currentY += tableHeaderH;

  // 10. Table Rows
  if (data.otLogs.length === 0) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(innerX, currentY, innerW, rowH);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(innerX, currentY, innerW, rowH);

    ctx.textAlign = 'center';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('No overtime hours recorded for this period.', width / 2, currentY + 30);
    currentY += rowH;
  } else {
    data.otLogs.forEach((row, idx) => {
      // Alternate row backgrounds
      ctx.fillStyle = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
      ctx.fillRect(innerX, currentY, innerW, rowH);

      // Border line below
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(innerX, currentY + rowH);
      ctx.lineTo(innerX + innerW, currentY + rowH);
      ctx.stroke();

      // SL No (Centered)
      ctx.textAlign = 'center';
      ctx.font = '500 14px "SF Mono", Menlo, Consolas, monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(String(row.slNo), colSlX, currentY + 30);

      // Date (Bold)
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(row.dateStr, colDateX, currentY + 30);

      // Day
      ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(row.dayName, colDayX, currentY + 30);

      // Shift & Duty
      ctx.font = '500 14px "SF Mono", Menlo, Consolas, monospace';
      ctx.fillStyle = '#334155';
      ctx.fillText(row.shift || 'C1 (08:00 - 16:20)', colShiftX, currentY + 30);

      // OT Hours (Bold Amber, Right aligned)
      ctx.textAlign = 'right';
      ctx.font = 'bold 17px "SF Mono", Menlo, Consolas, monospace';
      ctx.fillStyle = '#9a3412'; // Amber-800
      ctx.fillText(row.otHoursFormatted, colOtX, currentY + 30);

      currentY += rowH;
    });
  }

  // 11. Table Total Row (Dark Navy #0f172a with Amber text, bottom rounded corners, matching screenshot)
  ctx.fillStyle = '#0f172a';
  drawRoundRect(ctx, innerX, currentY, innerW, tableFooterH, { tl: 0, tr: 0, br: 8, bl: 8 });
  ctx.fill();

  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText('TOTAL OVERTIME (OT) CLAIM:', colShiftX + 60, currentY + 29);

  ctx.font = 'bold 19px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#fcd34d'; // Amber-300
  ctx.fillText(`${data.totalOtHours.toFixed(1)} HOURS`, colOtX, currentY + 30);

  // Notice: NO footer certification line at bottom (as requested by user)!

  const fileName = `CSL_Next_Month_OT_Details_${data.nextMonthName}_${data.tokenNumber}.jpg`;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate JPG blob'));
        return;
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      resolve({ blob, dataUrl, fileName });
    }, 'image/jpeg', 0.95);
  });
};
