// The agent (#/agent/): files Captures, answers from the vault, and commits on its own, following
// meta/conventions.md. Needs the sealed OpenAI key and a backend that can write.
import type { Extension } from '../../core/extension.ts';
import { Agent } from './Agent.tsx';

export const agent: Extension = {
  id: 'agent',
  page: (path) => (path === '/agent/' ? { title: 'Agent', body: <Agent /> } : null),
  nav: [
    {
      label: 'Agent',
      href: '/agent/',
      order: 70,
      summary: 'File, ask, sign off',
      when: (h) => !!h.secrets,
    },
  ],
};
