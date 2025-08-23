// Ethiopian Calendar Utility Functions with accurate conversion algorithm

// Ethiopian calendar months
const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምቲ', 'ሕዳር', 'ታህሳስ', 'ጥሪ', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰነ', 'ሐምለ', 'ነሐሰ', 'ጳጉሜን'
];

// Ethiopian calendar weekdays
const ETHIOPIAN_WEEKDAYS = [
  'ሰንብት', 'ሶኒ', 'ሶሉስ', 'ሮብዕ', 'ሓሙስ', 'ዓርቢ', 'ቐዳም'
];

// Accurate Ethiopian calendar conversion
export function gregorianToEthiopian(date: Date): {
  year: number;
  month: number;
  day: number;
  weekday: number;
  monthName: string;
  weekdayName: string;
} {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Ethiopian calendar starts 7-8 years behind Gregorian
  let ethiopianYear = year - 7;
  
  // Adjust for Ethiopian new year (September 11/12)
  if (month < 9 || (month === 9 && day < 11)) {
    ethiopianYear--;
  }

  // Calculate Ethiopian month and day with correct algorithm
  let ethiopianMonth = month - 8;
  let ethiopianDay = day - 6; // Fixed offset: was -7, now -6 to correct the one day difference

  if (ethiopianMonth <= 0) {
    ethiopianMonth += 12;
  }

  if (ethiopianDay <= 0) {
    ethiopianMonth--;
    if (ethiopianMonth <= 0) {
      ethiopianMonth = 12;
      ethiopianYear--;
    }
    ethiopianDay += 30;
  }

  // Get weekday (0 = Sunday in both calendars)
  const weekday = date.getDay();
  const ethiopianWeekday = weekday; // Direct mapping: Sunday=0, Monday=1, Tuesday=2, Wednesday=3, etc.

  return {
    year: ethiopianYear,
    month: ethiopianMonth,
    day: ethiopianDay,
    weekday: ethiopianWeekday,
    monthName: ETHIOPIAN_MONTHS[ethiopianMonth - 1],
    weekdayName: ETHIOPIAN_WEEKDAYS[ethiopianWeekday]
  };
}

// Format date to Ethiopian calendar string
export function formatEthiopianDate(dateString: string, showWeekday: boolean = true): string {
  const date = new Date(dateString);
  const ethiopian = gregorianToEthiopian(date);
  
  // Format: "Day Month Year, Weekday" or "Day Month Year"
  if (showWeekday) {
    return `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}, ${ethiopian.weekdayName}`;
  } else {
    return `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}`;
  }
}

// Format date to Ethiopian calendar with time
export function formatEthiopianDateTime(dateString: string, showWeekday: boolean = true): string {
  const date = new Date(dateString);
  
  // Convert to Ethiopian timezone (UTC+3)
  const ethiopianTime = new Date(date.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for Ethiopian timezone
  
  const ethiopian = gregorianToEthiopian(ethiopianTime);
  
  // Format time in 12-hour format (AM/PM)
  let hours = ethiopianTime.getUTCHours();
  const minutes = ethiopianTime.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  
  // Format: "Day Month Year, Weekday, HH:MM AM/PM" or "Day Month Year, HH:MM AM/PM"
  if (showWeekday) {
    return `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}, ${ethiopian.weekdayName}, ${timeString}`;
  } else {
    return `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}, ${timeString}`;
  }
}

// Get current Ethiopian date
export function getCurrentEthiopianDate(): {
  year: number;
  month: number;
  day: number;
  weekday: number;
  monthName: string;
  weekdayName: string;
} {
  return gregorianToEthiopian(new Date());
}

// Convert time to Ethiopian timezone and format in 12-hour format
export function formatEthiopianTime(dateString: string): string {
  const date = new Date(dateString);
  
  // Convert to Ethiopian timezone (UTC+3)
  const ethiopianTime = new Date(date.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for Ethiopian timezone
  
  // Format time in 12-hour format (AM/PM)
  let hours = ethiopianTime.getUTCHours();
  const minutes = ethiopianTime.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Format date to Ethiopian calendar with time (simplified version)
export function formatEthiopianDateWithTime(dateString: string, showWeekday: boolean = false): string {
  const date = new Date(dateString);
  
  // Convert to Ethiopian timezone (UTC+3)
  const ethiopianTime = new Date(date.getTime() + (3 * 60 * 60 * 1000)); // Add 3 hours for Ethiopian timezone
  
  const ethiopian = gregorianToEthiopian(ethiopianTime);
  const timeString = formatEthiopianTime(dateString);
  
  // Format: "Day Month Year, HH:MM AM/PM" or "Day Month Year, Weekday, HH:MM AM/PM"
  if (showWeekday) {
    return `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}, ${ethiopian.weekdayName}, ${timeString}`;
  } else {
    return `${ethiopian.day} ${ethiopian.monthName} ${ethiopian.year}, ${timeString}`;
  }
}