import { createSignal, createEffect, Show, For } from 'solid-js'
import type { Component } from 'solid-js'
import type { TransitionType, SceneTransition } from '../../player/sequence-types'
import './transition-dialog.css'

interface TransitionDialogProps {
  isOpen: boolean
  sceneName: string
  transition: SceneTransition
  onApply: (transition: SceneTransition) => void
  onClose: () => void
}

const TRANSITION_OPTIONS: { value: TransitionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
]

export const TransitionDialog: Component<TransitionDialogProps> = (props) => {
  const [type, setType] = createSignal<TransitionType>('none')
  const [duration, setDuration] = createSignal(500)
  const [previewKey, setPreviewKey] = createSignal(0)

  // Sync from props when dialog opens
  createEffect(() => {
    if (props.isOpen) {
      setType(props.transition.type)
      setDuration(props.transition.duration || 500)
      setPreviewKey((k) => k + 1)
    }
  })

  function handleApply() {
    props.onApply({
      type: type(),
      duration: type() === 'none' ? 0 : duration(),
    })
  }

  function handlePreview() {
    setPreviewKey((k) => k + 1)
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  const previewClass = () => {
    const t = type()
    if (t === 'none') return ''
    return `transition-preview-${t}`
  }

  return (
    <Show when={props.isOpen}>
      <div class="transition-dialog-overlay" onClick={handleOverlayClick}>
        <div class="transition-dialog">
          <div class="transition-dialog-header">
            <h3>Scene Transition</h3>
            <span class="transition-scene-label">Entering: {props.sceneName}</span>
            <button class="transition-close-btn" onClick={props.onClose}>
              &times;
            </button>
          </div>

          <div class="transition-dialog-body">
            <div class="transition-field">
              <label>Transition Type</label>
              <select
                class="transition-select"
                value={type()}
                onChange={(e) => setType(e.currentTarget.value as TransitionType)}
              >
                <For each={TRANSITION_OPTIONS}>
                  {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
              </select>
            </div>

            <Show when={type() !== 'none'}>
              <div class="transition-field">
                <label>Duration (ms)</label>
                <input
                  type="number"
                  class="transition-input"
                  value={duration()}
                  min={100}
                  max={5000}
                  step={100}
                  onInput={(e) => setDuration(parseInt(e.currentTarget.value) || 500)}
                />
              </div>
            </Show>

            <Show when={type() !== 'none'}>
              <div class="transition-preview-section">
                <div class="transition-preview-label">
                  <span>Preview</span>
                  <button class="transition-preview-replay" onClick={handlePreview}>
                    Replay
                  </button>
                </div>
                <div class="transition-preview-container">
                  <div
                    class={`transition-preview-scene transition-preview-outgoing ${previewClass()}`}
                    style={{ 'animation-duration': `${duration()}ms` }}
                    data-key={previewKey()}
                  >
                    <span>A</span>
                  </div>
                  <div
                    class={`transition-preview-scene transition-preview-incoming ${previewClass()}`}
                    style={{ 'animation-duration': `${duration()}ms` }}
                    data-key={previewKey()}
                  >
                    <span>B</span>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          <div class="transition-dialog-footer">
            <button class="transition-btn" onClick={props.onClose}>
              Cancel
            </button>
            <button class="transition-btn transition-btn-primary" onClick={handleApply}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </Show>
  )
}
