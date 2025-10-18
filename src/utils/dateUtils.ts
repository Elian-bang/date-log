import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { DATE_FORMATS } from './constants';

/**
 * Date Utility Functions
 */

/**
 * Format date to storage format (YYYY-MM-DD)
 */
export const formatDateForStorage = (date: Date): string => {
  return format(date, DATE_FORMATS.storage);
};

/**
 * Format date to display format (YYYY.MM.DD)
 */
export const formatDateForDisplay = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseStorageDate(date) : date;
  return format(dateObj, DATE_FORMATS.display);
};

/**
 * Format month/year for calendar header (YYYY년 MM월)
 */
export const formatMonthYear = (date: Date): string => {
  return format(date, DATE_FORMATS.monthYear);
};

/**
 * Parse storage date string to Date object
 */
export const parseStorageDate = (dateString: string): Date => {
  return parse(dateString, DATE_FORMATS.storage, new Date());
};

/**
 * Get all days in a month
 */
export const getDaysInMonth = (date: Date): Date[] => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end });
};

/**
 * Navigate to previous month
 */
export const getPreviousMonth = (date: Date): Date => {
  return subMonths(date, 1);
};

/**
 * Navigate to next month
 */
export const getNextMonth = (date: Date): Date => {
  return addMonths(date, 1);
};

/**
 * Check if date has log data
 */
export const hasLogData = (date: Date, dateLogData: Record<string, unknown>): boolean => {
  const dateKey = formatDateForStorage(date);
  return dateKey in dateLogData;
};

/**
 * Get today's date as storage format string
 */
export const getTodayStorageFormat = (): string => {
  return formatDateForStorage(new Date());
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateForStorage(date1) === formatDateForStorage(date2);
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};
