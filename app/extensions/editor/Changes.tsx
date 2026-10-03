// Staged edits: each file's diff, what the check says about them, and the commit.
import { Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { structuredPatch } from 'diff';
import { hrefForId } from '../../../core/paths.ts';
import { applyOverlay, newProblems } from '../../core/writer.ts';
import { CheckFailed, Conflict } from '../../core/backend.ts';
import { useWriter } from '../../core/host.tsx';
import { link } from '../../core/route.ts';
import './editor.css';
import { later } from '../../core/later.ts';

function Diff({ before, after }: { before: string; after: string }) {
  const p = structuredPatch('a', 'b', before, after, '', '', { context: 2 });
  return (
    <pre class="diff">
      {p.hunks.map((h) => (
        <Fragment key={`${h.oldStart},${h.newStart}`}>
          <span class="hunk">
            @@ -{h.oldStart},{h.oldLines} +{h.newStart},{h.newLines} @@\n
          </span>
          {h.lines.map((l, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a diff line is its position in the hunk; the same text can recur
            <span key={i} class={l[0] === '+' ? 'add' : l[0] === '-' ? 'del' : ''}>
              {l}
              \n
            </span>
          ))}
        </Fragment>
      ))}
    </pre>
  );
}

export function Changes() {
  const w = useWriter();
  const staged = Object.entries(w.overlay?.files ?? {});
  const [problems, setProblems] = useState<string[] | null>(null);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<{ busy?: boolean; error?: string; done?: string }>({});
  useEffect(() => {
    setProblems(null);
    if (!w.overlay) return;
    let live = true;
    later(newProblems(w.base, applyOverlay(w.base, w.overlay)).then((p) => live && setProblems(p)));
    return () => {
      live = false;
    };
  }, [w.overlay, w.base]);

  const commit = async () => {
    setState({ busy: true });
    try {
      const sha = await w.commit!(
        message || `vault: ${staged.map(([p]) => p.replace(/\.mdx?$/, '')).join(', ')}`,
      );
      setMessage('');
      setState({ done: sha });
    } catch (e) {
      setState({
        error:
          e instanceof CheckFailed
            ? 'The check fails; nothing was committed.'
            : e instanceof Conflict
              ? `Changed on main meanwhile: ${e.paths.join(', ')}. Reload the file and stage it again.`
              : (e as Error).message,
      });
    }
  };

  if (!staged.length)
    return (
      <div class="v-changes">
        <h1>Changes</h1>
        {state.done ? (
          <p class="lede">
            Committed <code>{state.done.slice(0, 7)}</code>. See{' '}
            <a href={link('/history/')}>History</a>.
          </p>
        ) : (
          <p class="lede">Nothing staged. Edit a note from its page.</p>
        )}
      </div>
    );
  return (
    <div class="v-changes">
      <h1>
        Changes <span class="n">{staged.length}</span>
      </h1>
      {staged.map(([path, text]) => {
        const before = w.base.find((f) => f.path === path)?.text ?? '';
        return (
          <section key={path} class="file">
            <h2>
              <a href={link(hrefForId(path.replace(/\.mdx?$/, '')))}>{path}</a>
              <small>{text === null ? 'deleted' : before ? 'edited' : 'new'}</small>
              <a class="act" href={link(`/edit/${encodeURIComponent(path)}/`)}>
                edit
              </a>
              <button type="button" class="act" onClick={() => w.unstage(path)}>
                unstage
              </button>
            </h2>
            <Diff before={before} after={text ?? ''} />
          </section>
        );
      })}
      <section class="commit">
        {problems === null ? (
          <p class="hint">Checking…</p>
        ) : problems.length ? (
          <>
            <p class="app-error">
              The check finds {problems.length} new {problems.length === 1 ? 'problem' : 'problems'}
              :
            </p>
            <ul class="problems">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        ) : (
          <p class="ok">The check passes.</p>
        )}
        {w.commit ? (
          <>
            <input
              type="text"
              placeholder="Commit message"
              value={message}
              onInput={(e) => setMessage(e.currentTarget.value)}
            />
            <div class="bar">
              <button
                type="button"
                class="primary"
                disabled={state.busy || problems === null || problems.length > 0}
                onClick={commit}
              >
                {state.busy ? 'Committing…' : 'Commit to main'}
              </button>
              <button
                type="button"
                class="danger"
                onClick={() => confirm('Discard every staged edit?') && w.discard()}
              >
                Discard all
              </button>
            </div>
          </>
        ) : (
          <p class="hint">In dev the files are the working tree: commit with git.</p>
        )}
        {!!state.error && <p class="app-error">{state.error}</p>}
      </section>
    </div>
  );
}
