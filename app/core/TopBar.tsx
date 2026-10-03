// The top bar: home, the extensions' links, the sync state, and search ("/" focuses it; arrows, Enter
// and Escape work in it).
import { useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import { search, type Entry } from '../../core/search.ts';
import { useHost, navOf } from './host.tsx';
import { link } from './route.ts';
import type { Status } from './session.ts';

const time = (t: number) =>
  new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const label = (s: Status) =>
  s.kind === 'syncing'
    ? 'syncing…'
    : s.kind === 'synced'
      ? `synced ${time(s.at)}`
      : s.kind === 'offline'
        ? 'offline'
        : s.kind === 'error'
          ? 'sync failed'
          : '';

export function TopBar({
  status,
  signOut,
  index,
}: {
  status: Status;
  signOut: (() => Promise<void>) | null;
  index: Map<string, Entry>;
}) {
  const host = useHost();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const hits = useMemo(() => search(index, q), [index, q]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== input.current) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    const click = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.search')) setOpen(false);
    };
    addEventListener('keydown', key);
    addEventListener('click', click);
    return () => {
      removeEventListener('keydown', key);
      removeEventListener('click', click);
    };
  }, []);

  const go = (href: string) => {
    location.hash = link(href);
    setOpen(false);
    setQ('');
    input.current?.blur();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (hits.length) setSel((sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length);
    } else if (e.key === 'Enter' && hits[sel]) go(hits[sel].entry.href);
    else if (e.key === 'Escape') {
      setOpen(false);
      input.current?.blur();
    }
  };

  return (
    <header class="top">
      <a class="brand" href={link('/')}>
        Vault
      </a>
      {navOf(host).map((n) => {
        const badge = n.badge?.(host);
        return badge === 0 ? null : (
          <a key={n.href} class={`navl${badge ? ' staged' : ''}`} href={link(n.href)}>
            {n.label}
            {badge ? (
              <>
                {' '}
                <b>{badge}</b>
              </>
            ) : null}
          </a>
        );
      })}
      <span
        class={`sync s-${status.kind}`}
        title={status.kind === 'error' ? status.message : undefined}
      >
        {label(status)}
      </span>
      {!!signOut && (
        <button type="button" class="navl signout" onClick={signOut}>
          Sign out
        </button>
      )}
      <div class="search">
        <input
          ref={input}
          id={id}
          type="search"
          placeholder="Find a note or topic…"
          autocomplete="off"
          aria-label="Find a note or topic"
          value={q}
          onInput={(e) => {
            setQ(e.currentTarget.value);
            setSel(0);
            setOpen(true);
          }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKey}
        />
        {open && !!q && (
          // biome-ignore lint/correctness/useUniqueElementIds: the one search box's results, styled as #results in base.css
          <ul id="results">
            {hits.length ? (
              hits.map((h, i) => (
                <li key={h.entry.href}>
                  <a
                    href={link(h.entry.href)}
                    class={`${i === sel ? 'on ' : ''}${h.entry.k === 'topic' ? 'topic' : ''}`}
                    onClick={() => go(h.entry.href)}
                  >
                    {h.entry.k === 'topic' ? (
                      <>
                        <i>#</i>
                        {h.entry.t.replace(/-/g, ' ')}
                      </>
                    ) : (
                      h.entry.t
                    )}
                    {!!h.why && <small>{h.why}</small>}
                  </a>
                </li>
              ))
            ) : (
              <li>
                <span class="none">No match</span>
              </li>
            )}
          </ul>
        )}
      </div>
    </header>
  );
}
