import { createSignal, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'

type CopyState = 'idle' | 'copied' | 'failed'

/** Put text on the clipboard, falling back to a hidden textarea where the async API is unavailable (e.g. plain http). */
async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  textarea.remove()
  if (!ok) throw new Error('copy failed')
}

/**
 * Copies a complete, standalone HTML page for an example. The page is built on
 * click rather than up front, since most cards are never copied.
 */
export const CopyCodeButton: Component<{ getCode: () => string }> = (props) => {
  const [state, setState] = createSignal<CopyState>('idle')
  let resetTimer: number | undefined

  const copy = async (event: MouseEvent) => {
    // Cards react to hover and clicks; copying should not start or stop a preview.
    event.stopPropagation()
    try {
      await copyText(props.getCode())
      setState('copied')
    } catch {
      setState('failed')
    }
    window.clearTimeout(resetTimer)
    resetTimer = window.setTimeout(() => setState('idle'), 1800)
  }

  onCleanup(() => window.clearTimeout(resetTimer))

  const label = () => (state() === 'copied' ? 'Copied!' : state() === 'failed' ? 'Copy failed' : 'Copy code')

  return (
    <button
      class="copy-code-btn"
      classList={{ copied: state() === 'copied', failed: state() === 'failed' }}
      onClick={copy}
      title="Copy a complete HTML page for this example — save it as a file and open it"
      aria-live="polite"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        {state() === 'copied' ? (
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor" />
        ) : (
          <path
            d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"
            fill="currentColor"
          />
        )}
      </svg>
      <span>{label()}</span>
    </button>
  )
}
