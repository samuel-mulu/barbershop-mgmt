"use client";
import { formatEthiopianDate, formatEthiopianDateTime } from '@/utils/ethiopianCalendar';

interface EthiopianDateProps {
  dateString: string;
  showTime?: boolean;
  showWeekday?: boolean;
  className?: string;
}

export default function EthiopianDate({ 
  dateString, 
  showTime = false, 
  showWeekday = true,
  className = "" 
}: EthiopianDateProps) {
  const formatDate = showTime ? formatEthiopianDateTime : formatEthiopianDate;
  
  return (
    <span className={className}>
      {formatDate(dateString, showWeekday)}
    </span>
  );
} 