/**
 * Utility for sharing CSL Half Day In / Out punch times and attendance logs to WhatsApp groups
 */

import { CslShiftCode } from '../data/cslShifts';

export interface DutyPunchShareParams {
  punchType: 'IN' | 'OUT';
  dutyCategory?: 'half_day' | 'full_day' | 'full_day_ot';
  time: string; // e.g. "01:15 PM" or "12:30 PM"
  otHours?: number | string; // e.g. 1, 2, "02:00"
  dateStr?: string; // e.g. "24 Oct 2026" or "2026-10-24"
  shiftCode?: CslShiftCode; // 'A2' | 'B2' | 'C1' | 'C2'
  session?: 'First Half' | 'Second Half' | 'Half Day';
  employeeName?: string;
  token?: string;
  department?: string;
  notes?: string;
}

export type HalfDayPunchShareParams = DutyPunchShareParams;

export function getStoredEmployeeProfile(): { name: string; token: string; phone: string; department: string } {
  try {
    const raw = localStorage.getItem('csl_employee_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || 'CSL Employee',
        token: parsed.token || 'CSL',
        phone: parsed.phone || '',
        department: parsed.department || 'Hull & Shipbuilding'
      };
    }
  } catch {}
  return {
    name: 'CSL Employee',
    token: 'CSL',
    phone: '',
    department: 'Hull & Shipbuilding'
  };
}

/**
 * Format exact WhatsApp message as specified by the user:
 * - Half Day In punch:         half day in punch @ <live time>
 * - Half Day Out punch:        half day out punch @ <live time>
 * - Full Day In punch:         full day in punch @ <live time>
 * - Full Day Out punch:        full day out punch @ <live time>
 * - Full Day Out + OT:         full day out punch + <X>h ot @ <live time>
 */
export function formatDutyPunchWhatsAppMessage(params: DutyPunchShareParams): string {
  const isPunchIn = params.punchType === 'IN';
  const timeStr = params.time || 'live time';

  // Check if this is Full Day + OT
  const hasOt = params.dutyCategory === 'full_day_ot' || (params.otHours && (typeof params.otHours === 'number' ? params.otHours > 0 : parseFloat(params.otHours) > 0));
  const isFullDay = params.dutyCategory === 'full_day' || hasOt;

  if (hasOt && !isPunchIn) {
    let otNum: number = 1;
    if (typeof params.otHours === 'string') {
      if (params.otHours.includes(':')) {
        const parts = params.otHours.split(':');
        otNum = parseInt(parts[0], 10) || 1;
      } else {
        otNum = Math.floor(parseFloat(params.otHours)) || 1;
      }
    } else if (typeof params.otHours === 'number') {
      otNum = Math.floor(params.otHours) || 1;
    }
    const otDisplay = otNum;
    return `${otDisplay}h ot out punch @ ${timeStr}`;
  }

  if (isFullDay) {
    return isPunchIn 
      ? `full day in punch @ ${timeStr}`
      : `full day out punch @ ${timeStr}`;
  }

  // Default: Half Day
  return isPunchIn 
    ? `half day in punch @ ${timeStr}`
    : `half day out punch @ ${timeStr}`;
}

export const formatHalfDayPunchWhatsAppMessage = formatDutyPunchWhatsAppMessage;

/**
 * Generates direct WhatsApp click-to-chat URL
 */
export function getWhatsAppShareUrl(message: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Robustly shares to WhatsApp or native share sheet, with clipboard fallback.
 */
export async function shareHalfDayPunchToWhatsApp(
  params: HalfDayPunchShareParams
): Promise<{ success: boolean; method: 'native' | 'whatsapp_link' | 'clipboard'; message: string }> {
  const message = formatHalfDayPunchWhatsAppMessage(params);
  const waUrl = getWhatsAppShareUrl(message);

  // 1. Always copy text to clipboard first as a guaranteed backup
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(message);
    }
  } catch {}

  // 2. If navigator.share is available (Mobile Android/iOS), trigger native share sheet
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `CSL Half Day ${params.punchType} Punch - ${params.time}`,
        text: message
      });
      return { success: true, method: 'native', message };
    } catch (e: any) {
      // User cancelled native share or platform failed, fallback to direct WhatsApp URL
      if (e?.name === 'AbortError') {
        return { success: false, method: 'native', message };
      }
    }
  }

  // 3. Fallback to anchor click for WhatsApp
  try {
    const link = document.createElement('a');
    link.href = waUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, method: 'whatsapp_link', message };
  } catch {
    return { success: true, method: 'clipboard', message };
  }
}
