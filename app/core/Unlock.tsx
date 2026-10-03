// The password, once per device per 30 days (unlock.ts).
import { useId, useState } from 'preact/hooks';

export function Unlock({ unlock }: { unlock: (password: string) => Promise<void> }) {
  const [pw, setPw] = useState('');
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  const submit = async (e: Event) => {
    e.preventDefault();
    setBusy(true);
    setWrong(false);
    try {
      await unlock(pw);
    } catch {
      setWrong(true);
      setBusy(false);
    }
  };
  return (
    <form class="unlock" onSubmit={submit}>
      <h1>Vault</h1>
      <label for={id}>Password</label>
      <input
        id={id}
        type="password"
        autocomplete="current-password"
        autofocus={true}
        value={pw}
        disabled={busy}
        onInput={(e) => setPw(e.currentTarget.value)}
      />
      <button type="submit" disabled={busy || !pw}>
        {busy ? 'Opening…' : 'Open'}
      </button>
      {wrong ? <p class="app-error">That isn't the password.</p> : null}
      <p class="lede">This device remembers it for 30 days.</p>
    </form>
  );
}
