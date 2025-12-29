export interface Course {
  id: string;
  name: string;
  teacher: string;
  location: string;
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
  weeks: string;     // e.g. "1-16", "1-17单", "2-10"
}

export interface ParseResult {
  courses: Course[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW = 'REVIEW',
  EXPORT_SUCCESS = 'EXPORT_SUCCESS',
}

export const WEEK_DAYS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
];