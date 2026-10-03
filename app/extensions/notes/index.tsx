// Notes: every note's page (the fallback route), what a note states about itself, the components notes
// use in MDX, and the notes in search.
import type { Extension } from '../../core/extension.ts';
import { titleOf, excerptOf, hrefOf, kind, asList, topicsOf } from '../../../core/note-fields.ts';
import { NotePage } from './NotePage.tsx';
import { OpenQuestions, FollowUps, Connections, LinkedFrom } from './sections.tsx';
import { NoteList } from './NoteList.tsx';
import { Timeline } from './Timeline.tsx';
import { Chart } from './Chart.tsx';
import './components.css';

export const notes: Extension = {
  id: 'notes',
  page(path, { vault }) {
    const note = vault.byHref.get(path);
    return note ? { title: titleOf(note), body: <NotePage key={note.id} note={note} /> } : null;
  },
  noteSections: [
    { order: 10, view: OpenQuestions },
    { order: 20, view: FollowUps },
    { order: 40, view: Connections },
    { order: 80, view: LinkedFrom },
  ],
  mdx: { NoteList, Timeline, Chart },
  search: (v) =>
    v.notes.map((n) => ({
      href: hrefOf(n),
      t: titleOf(n),
      e: excerptOf(n),
      a: asList(n.data.aliases),
      k: kind(n.id),
      g: kind(n.id) === 'note' ? topicsOf(n) : [],
    })),
};
