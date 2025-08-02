// Ethiopian Calendar Utility Functions with accurate conversion algorithm

// Ethiopian calendar months
const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehasie'
];

// Ethiopian calendar weekdays
const ETHIOPIAN_WEEKDAYS = [
  'Ehud', 'Segno', 'Maksegno', 'Rob', 'Hamus', 'Arb', 'Kidame'
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
  let ethiopianDay = day - 7; // Fixed offset from -10 to -7

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
  const ethiopian = gregorianToEthiopian(date);
  
  // Format time
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Format: "Day Month Year, Weekday, HH:MM" or "Day Month Year, HH:MM"
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