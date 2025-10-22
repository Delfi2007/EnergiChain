/**
 * Date and Time Utilities
 * Advanced date manipulation, timezone handling, and formatting
 */

class DateTimeUtils {
  /**
   * Format date with custom pattern
   */
  static formatDate(date, pattern = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const milliseconds = String(d.getMilliseconds()).padStart(3, '0');

    return pattern
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
      .replace('SSS', milliseconds);
  }

  /**
   * Parse date string
   */
  static parseDate(dateString, format = 'YYYY-MM-DD') {
    const parts = dateString.split(/[-\/\s:]/);
    const formatParts = format.split(/[-\/\s:]/);
    
    let year, month, day, hours = 0, minutes = 0, seconds = 0;

    formatParts.forEach((part, i) => {
      switch(part) {
        case 'YYYY': year = parseInt(parts[i]); break;
        case 'MM': month = parseInt(parts[i]) - 1; break;
        case 'DD': day = parseInt(parts[i]); break;
        case 'HH': hours = parseInt(parts[i]); break;
        case 'mm': minutes = parseInt(parts[i]); break;
        case 'ss': seconds = parseInt(parts[i]); break;
      }
    });

    return new Date(year, month, day, hours, minutes, seconds);
  }

  /**
   * Add days to date
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add months to date
   */
  static addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Add years to date
   */
  static addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  /**
   * Difference between dates in days
   */
  static daysDiff(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2 - d1) / oneDay);
  }

  /**
   * Difference between dates in hours
   */
  static hoursDiff(date1, date2) {
    const oneHour = 60 * 60 * 1000;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2 - d1) / oneHour);
  }

  /**
   * Difference between dates in minutes
   */
  static minutesDiff(date1, date2) {
    const oneMinute = 60 * 1000;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2 - d1) / oneMinute);
  }

  /**
   * Get start of day
   */
  static startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day
   */
  static endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get start of week
   */
  static startOfWeek(date, startDay = 0) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = (day < startDay ? 7 : 0) + day - startDay;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of week
   */
  static endOfWeek(date, startDay = 0) {
    const result = this.startOfWeek(date, startDay);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get start of month
   */
  static startOfMonth(date) {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of month
   */
  static endOfMonth(date) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Is leap year
   */
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Get days in month
   */
  static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Get week number
   */
  static getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Is weekend
   */
  static isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  }

  /**
   * Is today
   */
  static isToday(date) {
    const today = new Date();
    const d = new Date(date);
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  /**
   * Is yesterday
   */
  static isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const d = new Date(date);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  }

  /**
   * Is tomorrow
   */
  static isTomorrow(date) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const d = new Date(date);
    return d.getDate() === tomorrow.getDate() &&
           d.getMonth() === tomorrow.getMonth() &&
           d.getFullYear() === tomorrow.getFullYear();
  }

  /**
   * Get relative time
   */
  static getRelativeTime(date) {
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }

  /**
   * Format duration
   */
  static formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Convert to timezone
   */
  static toTimezone(date, timezone) {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  }

  /**
   * Get timezone offset
   */
  static getTimezoneOffset(timezone) {
    const now = new Date();
    const tzString = now.toLocaleString('en-US', { timeZone: timezone });
    const offset = (now - new Date(tzString)) / 60000;
    return offset;
  }

  /**
   * Get business days between dates
   */
  static getBusinessDays(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Add business days
   */
  static addBusinessDays(date, days) {
    const result = new Date(date);
    let remaining = Math.abs(days);
    const direction = days < 0 ? -1 : 1;

    while (remaining > 0) {
      result.setDate(result.getDate() + direction);
      if (!this.isWeekend(result)) remaining--;
    }

    return result;
  }

  /**
   * Get quarter
   */
  static getQuarter(date) {
    return Math.floor((new Date(date).getMonth() + 3) / 3);
  }

  /**
   * Get quarter start
   */
  static getQuarterStart(date) {
    const quarter = this.getQuarter(date);
    const year = new Date(date).getFullYear();
    return new Date(year, (quarter - 1) * 3, 1);
  }

  /**
   * Get quarter end
   */
  static getQuarterEnd(date) {
    const quarter = this.getQuarter(date);
    const year = new Date(date).getFullYear();
    return new Date(year, quarter * 3, 0, 23, 59, 59, 999);
  }

  /**
   * Get age from birthdate
   */
  static getAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Is valid date
   */
  static isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Get day name
   */
  static getDayName(date, locale = 'en-US') {
    return new Date(date).toLocaleDateString(locale, { weekday: 'long' });
  }

  /**
   * Get month name
   */
  static getMonthName(date, locale = 'en-US') {
    return new Date(date).toLocaleDateString(locale, { month: 'long' });
  }

  /**
   * Get ISO week
   */
  static getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  /**
   * Get Unix timestamp
   */
  static toUnixTimestamp(date) {
    return Math.floor(new Date(date).getTime() / 1000);
  }

  /**
   * From Unix timestamp
   */
  static fromUnixTimestamp(timestamp) {
    return new Date(timestamp * 1000);
  }

  /**
   * Get time ago in words
   */
  static timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [name, secondsInInterval] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInInterval);
      if (interval >= 1) {
        return `${interval} ${name}${interval !== 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }

  /**
   * Format time range
   */
  static formatTimeRange(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    
    const sameDay = s.toDateString() === e.toDateString();
    
    if (sameDay) {
      return `${this.formatDate(s, 'YYYY-MM-DD HH:mm')} - ${this.formatDate(e, 'HH:mm')}`;
    } else {
      return `${this.formatDate(s, 'YYYY-MM-DD HH:mm')} - ${this.formatDate(e, 'YYYY-MM-DD HH:mm')}`;
    }
  }

  /**
   * Get calendar weeks in month
   */
  static getCalendarWeeks(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startWeek = this.getWeekNumber(firstDay);
    const endWeek = this.getWeekNumber(lastDay);
    
    return endWeek - startWeek + 1;
  }

  /**
   * Is date in range
   */
  static isDateInRange(date, start, end) {
    const d = new Date(date);
    const s = new Date(start);
    const e = new Date(end);
    return d >= s && d <= e;
  }

  /**
   * Get overlapping period
   */
  static getOverlap(start1, end1, start2, end2) {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    
    const latestStart = s1 > s2 ? s1 : s2;
    const earliestEnd = e1 < e2 ? e1 : e2;
    
    if (latestStart > earliestEnd) return null;
    
    return {
      start: latestStart,
      end: earliestEnd,
      days: this.daysDiff(latestStart, earliestEnd)
    };
  }
}

/**
 * Countdown Timer
 */
class CountdownTimer {
  constructor(targetDate) {
    this.targetDate = new Date(targetDate);
    this.callbacks = [];
    this.interval = null;
  }

  /**
   * Start countdown
   */
  start() {
    this.interval = setInterval(() => {
      const now = new Date();
      const diff = this.targetDate - now;

      if (diff <= 0) {
        this.stop();
        this.trigger({ days: 0, hours: 0, minutes: 0, seconds: 0, finished: true });
        return;
      }

      const time = {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        finished: false
      };

      this.trigger(time);
    }, 1000);
  }

  /**
   * Stop countdown
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Add callback
   */
  onTick(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Trigger callbacks
   */
  trigger(time) {
    this.callbacks.forEach(callback => callback(time));
  }
}

/**
 * Stopwatch
 */
class Stopwatch {
  constructor() {
    this.startTime = null;
    this.elapsedTime = 0;
    this.running = false;
    this.interval = null;
    this.callbacks = [];
  }

  /**
   * Start stopwatch
   */
  start() {
    if (this.running) return;
    
    this.running = true;
    this.startTime = Date.now() - this.elapsedTime;
    
    this.interval = setInterval(() => {
      this.elapsedTime = Date.now() - this.startTime;
      this.trigger(this.elapsedTime);
    }, 10);
  }

  /**
   * Stop stopwatch
   */
  stop() {
    if (!this.running) return;
    
    this.running = false;
    clearInterval(this.interval);
  }

  /**
   * Reset stopwatch
   */
  reset() {
    this.stop();
    this.elapsedTime = 0;
    this.trigger(0);
  }

  /**
   * Get elapsed time
   */
  getTime() {
    return this.elapsedTime;
  }

  /**
   * Add callback
   */
  onTick(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Trigger callbacks
   */
  trigger(time) {
    this.callbacks.forEach(callback => callback(time));
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DateTimeUtils,
    CountdownTimer,
    Stopwatch
  };
}
