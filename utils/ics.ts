import { Course } from '../types';

// Helper to format date for ICS (YYYYMMDDTHHMMSS)
const formatDate = (date: Date): string => {
  const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
};

const parseTime = (timeStr: string): { h: number, m: number } => {
  if (!timeStr) return { h: 8, m: 0 };
  const [h, m] = timeStr.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
};

// Helper to parse week string (e.g., "1-16", "3-8", "1-17单")
// Returns: startWeek offset, count, interval
const parseWeekConfig = (weekStr: string): { startWeek: number, count: number, interval: number } => {
  let start = 1;
  let end = 16;
  let interval = 1;

  if (!weekStr) return { startWeek: 1, count: 16, interval: 1 };

  // Check for Odd/Even (单/双)
  const isOdd = weekStr.includes('单');
  const isEven = weekStr.includes('双');
  if (isOdd || isEven) {
    interval = 2;
  }

  // Extract numbers
  const match = weekStr.match(/(\d+)-(\d+)/);
  if (match) {
    start = parseInt(match[1]);
    end = parseInt(match[2]);
  } else {
      // Maybe just a single number or "1,2,3"? 
      // Fallback: try to find the first number
      const firstNum = weekStr.match(/(\d+)/);
      if (firstNum) start = parseInt(firstNum[1]);
  }

  // Adjustment for Odd/Even start date
  // If "1-16双" (Even), start should effectively be week 2
  if (isEven && start % 2 !== 0) {
      start++; 
  }
  // If "2-16单" (Odd), start should effectively be week 3 (next odd after 2) or stay 2? 
  // Usually "2-16单" is a contradiction or means starting from week 3? 
  // Let's assume if user says Odd, they want odd weeks >= start.
  if (isOdd && start % 2 === 0) {
      start++;
  }

  // Calculate count
  // Total span = end - start + 1
  // If interval is 2, count = ceil(span / 2)
  let span = end - start + 1;
  if (span < 1) span = 1;
  
  const count = interval === 1 ? span : Math.ceil(span / 2);

  return { startWeek: start, count, interval };
};

// Calculate the actual start date of the first event instance
const getFirstEventDate = (semesterStart: Date, dayOfWeek: number, startWeek: number): Date => {
  // 1. Get the Monday of the semester start week
  const semesterStartMonday = new Date(semesterStart);
  const startDay = semesterStartMonday.getDay(); // 0=Sun, 1=Mon...
  
  // Adjust to Monday of that week. 
  // If starts on Tuesday, Monday is day-1. If Sunday (0), Monday is day-6.
  const diffToMonday = startDay === 0 ? -6 : 1 - startDay;
  semesterStartMonday.setDate(semesterStartMonday.getDate() + diffToMonday);

  // 2. Add (startWeek - 1) weeks
  const targetWeekMonday = new Date(semesterStartMonday);
  targetWeekMonday.setDate(targetWeekMonday.getDate() + (startWeek - 1) * 7);

  // 3. Move to the target day of week (1=Mon ... 7=Sun)
  // targetWeekMonday is Monday (1). 
  const result = new Date(targetWeekMonday);
  result.setDate(result.getDate() + (dayOfWeek - 1));

  return result;
};

export const generateICS = (courses: Course[], semesterStartDate: Date): string => {
  const now = new Date();
  const dtStamp = formatDate(now);
  
  let eventBlock = '';

  courses.forEach(course => {
    if (!course.startTime || !course.endTime) return;

    const { h: startH, m: startM } = parseTime(course.startTime);
    const { h: endH, m: endM } = parseTime(course.endTime);
    
    // Parse week configuration
    const { startWeek, count, interval } = parseWeekConfig(course.weeks);

    // Calculate the first event date based on Start Week
    const firstDate = getFirstEventDate(semesterStartDate, course.dayOfWeek, startWeek);
    
    // Set start datetime
    const startDt = new Date(firstDate);
    startDt.setHours(startH, startM, 0, 0);

    // Set end datetime
    const endDt = new Date(firstDate);
    endDt.setHours(endH, endM, 0, 0);

    // Create unique ID
    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@course2cal`;

    eventBlock += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStamp}
DTSTART:${formatDate(startDt)}
DTEND:${formatDate(endDt)}
SUMMARY:${course.name}
LOCATION:${course.location || ''}
DESCRIPTION:教师: ${course.teacher || '未知'}\\n周次: ${course.weeks || '1-16'}
RRULE:FREQ=WEEKLY;COUNT=${count};INTERVAL=${interval}
END:VEVENT
`;
  });

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Course2Cal//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${eventBlock}END:VCALENDAR`;
};