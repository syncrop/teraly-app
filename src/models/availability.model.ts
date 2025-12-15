export interface TimeSlot {
  start: string;
  end: string;
}

export interface DaySchedule {
  day: string;
  dayName: string;
  enabled: boolean;
  slots: TimeSlot[];
  isExpanded: boolean;
}

export interface BlockedDate {
  startDate: string;
  endDate: string;
  reason: string;
  dateRange: string;
}
