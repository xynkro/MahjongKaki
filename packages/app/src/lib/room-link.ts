const KEY = 'mk_room';

// A shared invite link: ?room=ABCD. Read once at load and cleaned from the URL, so a refresh
// doesn't rejoin. Render-safe to peek: React may run initialisers twice.
let linked: string | null = (() => {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('room');
    if (!code) return null;
    url.searchParams.delete('room');
    window.history.replaceState(null, '', url);
    return code.trim().toUpperCase();
  } catch {
    return null;
  }
})();

export function peekLinkedRoom(): string | null {
  return linked;
}

export function consumeLinkedRoom() {
  linked = null;
}

export function roomLink(code: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?room=${code}`;
}

export function savedRoom(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function saveRoom(code: string | null) {
  try {
    if (code) localStorage.setItem(KEY, code);
    else localStorage.removeItem(KEY);
  } catch { /* the room still works; it just won't offer a way back after a restart */ }
}
