/**
 * Quick Time Set Utilities for CSL Attendance & Duty Punch
 * Supports fast 12-hour / 24-hour conversion, minute steppers (+/- 5m, 15m, 1h),
 * and CSL Shift preset helpers.
 */

// Format current time into CSL 12-hour format: '07:00 AM'
export const getNowTime12 = (): string => {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Convert '07:00 AM' or '01:40 PM' -> '07:00' or '13:40' for native HTML5 <input type="time">
export const to24HourTime = (time12: string): string => {
  if (!time12 || time12 === '—') return '07:00';
  const match = time12.trim().match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return '07:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Convert '13:40' -> '01:40 PM', '07:00' -> '07:00 AM'
export const to12HourTime = (time24: string): string => {
  if (!time24) return '07:00 AM';
  const parts = time24.split(':');
  if (parts.length < 2) return '07:00 AM';
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
};

// Add or subtract minutes from any 12-hour time string
export const adjustTimeString = (time12: string, deltaMinutes: number): string => {
  if (!time12 || time12 === '—') return getNowTime12();
  const match = time12.trim().match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return time12;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  let totalMinutes = (hours * 60 + minutes + deltaMinutes) % (24 * 60);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  
  let newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  const newPeriod = newHours >= 12 ? 'PM' : 'AM';
  newHours = newHours % 12;
  if (newHours === 0) newHours = 12;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;
};
