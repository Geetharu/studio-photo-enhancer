export const FREE_CREDITS_MAX = 3;
const CREDITS_STORAGE_KEY = 'studio_enhancer_credits';

export function getCreditsRemaining(): number {
  try {
    const raw = localStorage.getItem(CREDITS_STORAGE_KEY);
    if (raw === null) {
      localStorage.setItem(CREDITS_STORAGE_KEY, String(FREE_CREDITS_MAX));
      return FREE_CREDITS_MAX;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      localStorage.setItem(CREDITS_STORAGE_KEY, String(FREE_CREDITS_MAX));
      return FREE_CREDITS_MAX;
    }
    return Math.min(parsed, FREE_CREDITS_MAX);
  } catch {
    return FREE_CREDITS_MAX;
  }
}

export function deductCredit(): number {
  try {
    const current = getCreditsRemaining();
    const next = Math.max(0, current - 1);
    localStorage.setItem(CREDITS_STORAGE_KEY, String(next));
    return next;
  } catch {
    return getCreditsRemaining();
  }
}

export function hasCredits(): boolean {
  return getCreditsRemaining() > 0;
}
