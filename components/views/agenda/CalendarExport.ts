/**
 * CalendarExport — Pure utility functions, no React, no state.
 * Generates Google Calendar URLs and ICS file URIs for booked sessions.
 */

export const getGoogleCalendarUrl = (
  sessionDate: Date,
  sessionTime: string,
  isRecurring = false
): string => {
  const [hour, minute] = sessionTime.split(':');
  const start = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate(),
    parseInt(hour),
    parseInt(minute)
  );
  const end = new Date(start);
  end.setHours(start.getHours() + 1);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const title = encodeURIComponent('Sesión de Entrenamiento Tommybox');
  const description = encodeURIComponent('Sesión de entrenamiento personal agendada.');

  let url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${description}`;
  if (isRecurring) url += `&recur=RRULE:FREQ=WEEKLY`;
  return url;
};

export const getIcsDataUri = (
  sessionDate: Date,
  sessionTime: string,
  isRecurring = false
): string => {
  const [hour, minute] = sessionTime.split(':');
  const start = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate(),
    parseInt(hour),
    parseInt(minute)
  );
  const end = new Date(start);
  end.setHours(start.getHours() + 1);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');

  let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Tommybox//NONSGML v1.0//ES\nBEGIN:VEVENT\nUID:${Date.now()}@tommybox.com\nDTSTAMP:${fmt(new Date())}\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nSUMMARY:Sesión de Entrenamiento Tommybox\nDESCRIPTION:Sesión de entrenamiento personal agendada.`;
  if (isRecurring) ics += `\nRRULE:FREQ=WEEKLY`;
  ics += `\nEND:VEVENT\nEND:VCALENDAR`;

  return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
};
