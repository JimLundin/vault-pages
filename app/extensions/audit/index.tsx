// The audit (#/audit/): what the weekly sweep must judge, and the agent's `audit` tool for running the sweep.
// Both need a backend that can say what changed since a day.
import type { Extension } from '../../core/extension.ts';
import { Audit } from './Audit.tsx';

export const audit: Extension = {
  id: 'audit',
  page: (path) => (path === '/audit/' ? { title: 'Audit', body: <Audit /> } : null),
  nav: [
    {
      label: 'Audit',
      href: '/audit/',
      order: 65,
      summary: 'What the weekly sweep must judge',
      when: (h) => !!h.since,
    },
  ],
  tools: async (ctx) => (await import('./tool.ts')).auditTools(ctx),
};
