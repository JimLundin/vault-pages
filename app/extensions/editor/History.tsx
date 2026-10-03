// Commits made from the app (by hand or by the agent), newest first: what each changed, and a revert.
import { Fragment } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useWriter } from '../../core/host.tsx';
import { Conflict, CheckFailed } from '../../core/backend.ts';
import './editor.css';

export function History() {
  const w = useWriter();
  const [list, setList] = useState<{ sha: string; message: string; date: string }[] | null>(null);
  const [open, setOpen] = useState<Record<string, { filename: string; patch?: string }[]>>({});
  const [note, setNote] = useState('');
  const load = () => w.history?.().then(setList, (e) => setNote(String(e)));
  // biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount; load is a fresh closure every render
  useEffect(() => {
    load();
  }, []);
  if (!w.history)
    return (
      <div class="v-changes">
        <h1>History</h1>
        <p class="lede">
          In dev, see <code>git log</code>.
        </p>
      </div>
    );

  const show = async (sha: string) =>
    setOpen({ ...open, [sha]: open[sha] ? undefined! : await w.patch!(sha) });
  const revert = async (c: { sha: string; message: string }) => {
    if (!confirm(`Revert "${c.message.split('\n')[0]}"? This makes a new commit.`)) return;
    try {
      const sha = await w.revert!(c.sha);
      setNote(`Reverted in ${sha.slice(0, 7)}.`);
      load();
    } catch (e) {
      setNote(
        e instanceof Conflict
          ? `Can't revert: ${e.paths.join(', ')} changed since.`
          : e instanceof CheckFailed
            ? "Can't revert: the check would fail."
            : (e as Error).message,
      );
    }
  };
  return (
    <div class="v-changes">
      <h1>History</h1>
      <p class="lede">Commits made from this app, newest first.</p>
      {!!note && <p class="hint">{note}</p>}
      {list === null ? (
        <p class="hint">Loading…</p>
      ) : !list.length ? (
        <p class="hint">None yet.</p>
      ) : (
        list.map((c) => (
          <section key={c.sha} class="file">
            <h2>
              <span>{c.message.split('\n')[0]}</span>
              <small>
                {new Date(c.date).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                · <code>{c.sha.slice(0, 7)}</code>
              </small>
              <button type="button" class="act" onClick={() => show(c.sha)}>
                {open[c.sha] ? 'hide' : 'changes'}
              </button>
              <button type="button" class="act" onClick={() => revert(c)}>
                revert
              </button>
            </h2>
            {open[c.sha]?.map((f) => (
              <Fragment key={f.filename}>
                <h3>{f.filename}</h3>
                <pre class="diff">
                  {(f.patch ?? '').split('\n').map((l, i) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: a patch line is its position; the same text can recur
                      key={i}
                      class={
                        l[0] === '+'
                          ? 'add'
                          : l[0] === '-'
                            ? 'del'
                            : l.startsWith('@@')
                              ? 'hunk'
                              : ''
                      }
                    >
                      {l}
                      \n
                    </span>
                  ))}
                </pre>
              </Fragment>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
