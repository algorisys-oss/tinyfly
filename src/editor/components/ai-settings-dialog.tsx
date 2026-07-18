import { createSignal, Show, For } from 'solid-js'
import type { Component } from 'solid-js'
import {
  loadAIConfig,
  setApiKey,
  setActiveProvider,
  setModel,
  getApiKey,
  PROVIDER_MODELS,
  PROVIDER_LABELS,
  type AIProvider,
} from '../ai/ai-settings'
import { useEscapeClose } from '../utils/use-escape-close'
import './ai-settings-dialog.css'

interface AISettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

const PROVIDERS: AIProvider[] = ['anthropic', 'openai', 'gemini']

const KEY_HINTS: Record<AIProvider, string> = {
  anthropic: 'sk-ant-…  ·  console.anthropic.com',
  openai: 'sk-…  ·  platform.openai.com',
  gemini: 'AIza…  ·  aistudio.google.com',
}

export const AISettingsDialog: Component<AISettingsDialogProps> = (props) => {
  useEscapeClose(() => props.isOpen, () => props.onClose())
  const [activeProvider, setActive] = createSignal<AIProvider>('anthropic')
  const [model, setModelSig] = createSignal('')
  const [key, setKey] = createSignal('')
  const [reveal, setReveal] = createSignal(false)

  // Load persisted config into the form whenever the dialog opens.
  const resetForm = () => {
    const config = loadAIConfig()
    setActive(config.activeProvider)
    setModelSig(config.providers[config.activeProvider].model)
    setKey(getApiKey(config.activeProvider))
  }

  const switchProvider = (provider: AIProvider) => {
    // Persist the current key before switching away.
    setApiKey(activeProvider(), key())
    setModel(activeProvider(), model())
    setActive(provider)
    const config = loadAIConfig()
    setModelSig(config.providers[provider].model)
    setKey(getApiKey(provider))
  }

  const handleSave = () => {
    setApiKey(activeProvider(), key().trim())
    setModel(activeProvider(), model())
    setActiveProvider(activeProvider())
    props.onClose()
  }

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) props.onClose()
  }

  return (
    <Show when={props.isOpen}>
      {(() => {
        resetForm()
        return (
          <div class="settings-dialog-overlay" onClick={handleOverlayClick}>
            <div class="settings-dialog ai-settings-dialog">
              <h2>AI Settings</h2>
              <p class="ai-settings-blurb">
                Generate animations from a prompt. Bring your own API key — it's stored only in this
                browser and sent directly to the provider you choose.
              </p>

              <div class="settings-section">
                <label class="settings-label">Provider</label>
                <div class="settings-presets">
                  <For each={PROVIDERS}>
                    {(provider) => (
                      <button
                        class="settings-preset-btn"
                        classList={{ active: activeProvider() === provider }}
                        onClick={() => switchProvider(provider)}
                      >
                        {PROVIDER_LABELS[provider]}
                      </button>
                    )}
                  </For>
                </div>
              </div>

              <div class="settings-section">
                <label class="settings-label">Model</label>
                <select
                  class="settings-input"
                  value={model()}
                  onChange={(e) => setModelSig(e.currentTarget.value)}
                >
                  <For each={PROVIDER_MODELS[activeProvider()]}>
                    {(m) => <option value={m.id}>{m.label}</option>}
                  </For>
                </select>
              </div>

              <div class="settings-section">
                <label class="settings-label">API Key</label>
                <div class="ai-key-row">
                  <input
                    type={reveal() ? 'text' : 'password'}
                    class="settings-input"
                    value={key()}
                    onInput={(e) => setKey(e.currentTarget.value)}
                    placeholder={KEY_HINTS[activeProvider()]}
                    autocomplete="off"
                    spellcheck={false}
                  />
                  <button
                    class="settings-preset-btn ai-reveal-btn"
                    onClick={() => setReveal((v) => !v)}
                    title={reveal() ? 'Hide' : 'Show'}
                  >
                    {reveal() ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span class="ai-key-hint">{KEY_HINTS[activeProvider()]}</span>
              </div>

              <div class="settings-actions">
                <button class="settings-btn settings-btn-primary" onClick={handleSave}>
                  Save
                </button>
                <button class="settings-btn" onClick={props.onClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </Show>
  )
}

export default AISettingsDialog
