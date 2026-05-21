import { compressImageForStorage } from './imageCompression';

export const HISTORY_MAX_ITEMS = 3;
const HISTORY_STORAGE_KEY = 'studio_enhancer_recent_history';

export interface HistoryEntry {
  id: string;
  imageUrl: string;
  savedAt: string;
}

export type SaveHistoryResult =
  | { ok: true; entries: HistoryEntry[] }
  | { ok: false; reason: 'quota' | 'compress_failed'; entries: HistoryEntry[] };

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is HistoryEntry =>
          typeof e === 'object' &&
          e !== null &&
          typeof (e as HistoryEntry).id === 'string' &&
          typeof (e as HistoryEntry).imageUrl === 'string'
      )
      .slice(0, HISTORY_MAX_ITEMS);
  } catch {
    return [];
  }
}

function persistHistory(entries: HistoryEntry[]): void {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, HISTORY_MAX_ITEMS)));
}

function isQuotaExceededError(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  return (
    err.name === 'QuotaExceededError' ||
    err.code === 22 ||
    err.code === 1014
  );
}

export async function addToHistory(enhancedDataUrl: string): Promise<SaveHistoryResult> {
  const existing = loadHistory();

  let compressed: string;
  try {
    compressed = await compressImageForStorage(enhancedDataUrl);
  } catch {
    return { ok: false, reason: 'compress_failed', entries: existing };
  }

  const entry: HistoryEntry = {
    id: `hist_${Date.now()}`,
    imageUrl: compressed,
    savedAt: new Date().toISOString(),
  };

  const updated = [entry, ...existing].slice(0, HISTORY_MAX_ITEMS);

  try {
    persistHistory(updated);
    return { ok: true, entries: updated };
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      return { ok: false, reason: 'quota', entries: existing };
    }
    throw err;
  }
}
