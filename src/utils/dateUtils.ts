/**
 * Date formatting and manipulation utilities
 */

/**
 * Formats a date string to a localized date string
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string => {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString(undefined, options);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Formats a date string to a localized date and time string
 * @param dateString - ISO date string or Date object
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string | Date | undefined | null): string => {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Formats a date string to a short date format (YYYY-MM-DD)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatDateShort = (dateString: string | Date | undefined | null): string => {
  if (!dateString) {
    return '';
  }
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Gets relative time string (e.g., "2 hours ago", "in 3 days")
 * @param dateString - ISO date string or Date object
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string | Date | undefined | null): string => {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
      if (count >= 1) {
        const plural = count !== 1 ? 's' : '';
        return diffInSeconds < 0
          ? `in ${count} ${interval.label}${plural}`
          : `${count} ${interval.label}${plural} ago`;
      }
    }
    
    return 'just now';
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Checks if a date is in the past
 * @param dateString - ISO date string or Date object
 * @returns True if date is in the past
 */
export const isPastDate = (dateString: string | Date | undefined | null): boolean => {
  if (!dateString) {
    return false;
  }
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return !isNaN(date.getTime()) && date < new Date();
  } catch {
    return false;
  }
};

/**
 * Checks if a date is in the future
 * @param dateString - ISO date string or Date object
 * @returns True if date is in the future
 */
export const isFutureDate = (dateString: string | Date | undefined | null): boolean => {
  if (!dateString) {
    return false;
  }
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return !isNaN(date.getTime()) && date > new Date();
  } catch {
    return false;
  }
};

