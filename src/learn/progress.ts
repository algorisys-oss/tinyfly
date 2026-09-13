/**
 * Course progress and drafts, kept in this browser. Storage can be unavailable
 * (private windows, blocked site data); the course still works, it just forgets.
 */

const COMPLETED_KEY = 'tinyfly-learn-completed'
const DRAFTS_KEY = 'tinyfly-learn-drafts'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Not saved; nothing else to do.
  }
}

export function completedSteps(): Set<string> {
  return new Set(read<string[]>(COMPLETED_KEY, []))
}

export function markCompleted(key: string): void {
  const done = completedSteps()
  if (done.has(key)) return
  done.add(key)
  write(COMPLETED_KEY, [...done])
}

export function draftFor(key: string): string | undefined {
  return read<Record<string, string>>(DRAFTS_KEY, {})[key]
}

export function saveDraft(key: string, code: string | undefined): void {
  const drafts = read<Record<string, string>>(DRAFTS_KEY, {})
  if (code === undefined) delete drafts[key]
  else drafts[key] = code
  write(DRAFTS_KEY, drafts)
}

export function resetProgress(): void {
  write(COMPLETED_KEY, [])
  write(DRAFTS_KEY, {})
}
