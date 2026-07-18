import { createSignal, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { ProjectStore } from '../stores/project-store'
import { generateAnimation } from '../ai/animation-generator'
import { hasAnyApiKey } from '../ai/ai-settings'
import './ai-prompt-bar.css'

interface AIPromptBarProps {
  store: EditorStore
  sceneStore: SceneStore
  projectStore: ProjectStore
  /** Open the AI Settings dialog (to add an API key / pick a model). */
  onOpenSettings: () => void
}

const EXAMPLES = [
  'A logo that fades up and gets a shine sweep',
  'Three cards sliding in one after another',
  'A bouncing ball crossing the screen',
  'Kinetic title: “Ship it” pops in word by word',
]

export const AIPromptBar: Component<AIPromptBarProps> = (props) => {
  const [prompt, setPrompt] = createSignal('')
  const [busy, setBusy] = createSignal(false)
  const [message, setMessage] = createSignal<{ kind: 'error' | 'ok'; text: string } | null>(null)

  const run = async () => {
    if (busy() || !prompt().trim()) return
    setMessage(null)

    if (!hasAnyApiKey()) {
      setMessage({ kind: 'error', text: 'Add an API key in AI Settings first.' })
      props.onOpenSettings()
      return
    }

    setBusy(true)
    const result = await generateAnimation(prompt(), {
      store: props.store,
      sceneStore: props.sceneStore,
      projectStore: props.projectStore,
    })
    setBusy(false)

    if (result.ok) {
      setMessage({ kind: 'ok', text: `Generated “${result.animation?.name}” — edit away.` })
    } else {
      setMessage({ kind: 'error', text: result.error || 'Generation failed.' })
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      run()
    }
  }

  const useExample = () => {
    const pick = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]
    setPrompt(pick)
  }

  return (
    <div class="ai-prompt-bar">
      <span class="ai-prompt-spark" aria-hidden="true">
        ✦
      </span>
      <input
        class="ai-prompt-input"
        type="text"
        value={prompt()}
        placeholder="Describe an animation… e.g. “a title that fades up with a shine”"
        onInput={(e) => setPrompt(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        disabled={busy()}
      />
      <Show when={!prompt() && !busy()}>
        <button class="ai-prompt-example" onClick={useExample} title="Insert an example prompt">
          Try an example
        </button>
      </Show>
      <button class="ai-prompt-generate" onClick={run} disabled={busy() || !prompt().trim()}>
        {busy() ? 'Generating…' : 'Generate'}
      </button>
      <button
        class="ai-prompt-settings"
        onClick={props.onOpenSettings}
        title="AI Settings (API key & model)"
      >
        ⚙
      </button>
      <Show when={message()}>
        {(m) => (
          <span class="ai-prompt-message" classList={{ error: m().kind === 'error', ok: m().kind === 'ok' }}>
            {m().text}
          </span>
        )}
      </Show>
    </div>
  )
}

export default AIPromptBar
