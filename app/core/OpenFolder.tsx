// The vault folder on this device (backends/folder.ts): picked once, reopened with a click.
import { useState } from 'preact/hooks';

export function OpenFolder({
  saved,
  open,
}: {
  saved: string | null;
  open: (pick: boolean) => Promise<void>;
}) {
  const [error, setError] = useState('');
  const go = (pick: boolean) =>
    open(pick).catch((e) => {
      if (e.name !== 'AbortError') setError(e.message);
    });
  return (
    <div class="unlock">
      <h1>Vault</h1>
      {!!saved && (
        <button type="button" onClick={() => go(false)}>
          Reopen {saved}
        </button>
      )}
      <button type="button" class={saved ? 'quiet' : ''} onClick={() => go(!!saved)}>
        {saved ? 'Open another folder' : 'Open the vault folder'}
      </button>
      {!!error && <p class="app-error">{error}</p>}
      <p class="lede">
        The vault's root on this device: notes are read and written there. Chromium browsers only.
      </p>
    </div>
  );
}
