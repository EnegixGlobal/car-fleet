import { format, parseISO } from 'date-fns';

/**
 * Convert a UTC date string to IST Date object
 * IST is UTC+5:30, so we add 5.5 hours to get IST time
 */
const toISTDate = (dateString: string | Date | undefined | null): Date | null => {
  if (!dateString) return null;
  
  const date = typeof dateString === 'string' 
    ? (dateString.trim() ? parseISO(dateString) : null)
    : dateString;
    
  if (!date || isNaN(date.getTime())) return null;
  
  // Add IST offset (5.5 hours) to get IST time
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(date.getTime() + istOffset);
};

/**
 * Format date in IST timezone
 */
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  const istDate = toISTDate(dateString);
  if (!istDate) return '—';
  return format(istDate, 'MMM d, yyyy');
};

/**
 * Format date and time in IST timezone
 */
export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  const istDate = toISTDate(dateString);
  if (!istDate) return '—';
  return format(istDate, 'MMM d, yyyy h:mm a');
};

/**
 * Format time in IST timezone
 */
export const formatTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  const istDate = toISTDate(dateString);
  if (!istDate) return '—';
  return format(istDate, 'h:mm a');
};

/**
 * Format date with full format (e.g., "January 1, 2025")
 */
export const formatDateFull = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  const istDate = toISTDate(dateString);
  if (!istDate) return '—';
  return format(istDate, 'PPP');
};

/**
 * Format date and time with full format (e.g., "January 1, 2025 at 5:00 AM")
 */
export const formatDateTimeFull = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  const istDate = toISTDate(dateString);
  if (!istDate) return '—';
  return format(istDate, 'PPP p');
};

/**
 * Format date to locale string in IST
 */
export const formatDateLocale = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return '—';
  const istDate = toISTDate(dateString);
  if (!istDate) return '—';
  // Use UTC methods to format since we've already adjusted for IST
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date and time to locale string in IST
 */
export const formatDateTimeLocale = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return '—';
  const istDate = toISTDate(dateString);
  if (!istDate) return '—';
  // Format as: "MM/DD/YYYY, HH:MM:SS AM/PM"
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${month}/${day}/${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
};

/**
 * Convert a date string (ISO or date-only) to IST date string (YYYY-MM-DD)
 * IST is UTC+5:30, so we need to adjust for timezone when comparing dates
 */
export const getISTDateString = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  
  // If it's already a date-only string (YYYY-MM-DD), return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Parse the ISO string and convert to IST
  const date = parseISO(dateString);
  if (isNaN(date.getTime())) return '';
  
  // IST is UTC+5:30, so we add 5 hours and 30 minutes to get IST time
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  
  // Return date in YYYY-MM-DD format
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a booking date (in ISO format) falls on a given date (YYYY-MM-DD) in IST
 */
export const isDateInIST = (bookingDateISO: string, filterDate: string): boolean => {
  if (!bookingDateISO || !filterDate) return false;
  const bookingISTDate = getISTDateString(bookingDateISO);
  return bookingISTDate === filterDate;
};