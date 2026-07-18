import { onCleanup, onMount } from 'solid-js'

/**
 * Close a dialog/overlay when Escape is pressed, from anywhere on the page.
 *
 * Overlays aren't focusable, so a JSX `onKeyDown` on the overlay div only fires
 * when focus happens to sit inside it — unreliable. Instead we attach a single
 * document-level listener for the component's lifetime and act only while
 * `isOpen()` is true.
 *
 * The listener runs in the CAPTURE phase and stops propagation when it closes,
 * so dialog-dismissal takes precedence over the editor's other Escape handlers
 * (exit-maximized-preview, deselect-all, cancel-rename) — pressing Esc on an
 * open dialog closes just the dialog, nothing else.
 */
export function useEscapeClose(isOpen: () => boolean, onClose: () => void): void {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !isOpen()) return
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }
  onMount(() => document.addEventListener('keydown', handler, true))
  onCleanup(() => document.removeEventListener('keydown', handler, true))
}
