// The calendar: every `dates` entry (#/calendar/), and a note's own dates under it.
import type { Extension } from '../../core/extension.ts';
import { Calendar, NoteDates } from './Calendar.tsx';

export const calendar: Extension = {
  id: 'calendar',
  page: (path) => (path === '/calendar/' ? { title: 'Calendar', body: <Calendar /> } : null),
  nav: [
    {
      label: 'Calendar',
      href: '/calendar/',
      order: 10,
      summary: 'Every dated entry across the vault',
    },
  ],
  noteSections: [{ order: 50, view: NoteDates }],
};
