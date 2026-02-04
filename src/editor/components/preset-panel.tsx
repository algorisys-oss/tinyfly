import { For, Show, createSignal } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import { presetsByCategory, type AnimationPreset } from '../presets'
import { HelpIcon } from './tooltip'
import './preset-panel.css'

interface PresetPanelProps {
  store: EditorStore
  sceneStore: SceneStore
}

type Category = 'entrance' | 'emphasis' | 'exit' | 'motion' | 'text'

const categoryLabels: Record<Category, string> = {
  entrance: 'Entrance',
  emphasis: 'Emphasis',
  exit: 'Exit',
  motion: 'Motion',
  text: 'Text',
}

export const PresetPanel: Component<PresetPanelProps> = (props) => {
  const [activeCategory, setActiveCategory] = createSignal<Category>('entrance')
  const [appliedMessage, setAppliedMessage] = createSignal<string | null>(null)

  const selectedElement = () => props.sceneStore.selectedElement()

  const handleApplyPreset = (preset: AnimationPreset) => {
    const element = selectedElement()
    if (!element) return

    // Apply preset to the selected element
    const trackIds = props.store.applyPreset(preset, element.name)

    if (trackIds.length > 0) {
      setAppliedMessage(`Applied "${preset.name}"`)
      setTimeout(() => setAppliedMessage(null), 2000)
    }
  }

  const categories: Category[] = ['entrance', 'emphasis', 'exit', 'motion', 'text']

  return (
    <div class="preset-panel">
      <div class="preset-panel-header">
        <h3>
          Animation Presets
          <HelpIcon
            content="Click a preset to instantly apply that animation to the selected element. Choose from entrance, emphasis, exit, motion, and text effects."
            position="left"
          />
        </h3>
      </div>

      <Show
        when={selectedElement()}
        fallback={
          <div class="preset-panel-empty">
            <p>Select an element to apply animation presets</p>
          </div>
        }
      >
        <div class="preset-panel-content">
          <div class="preset-target">
            <span class="preset-target-label">Target:</span>
            <span class="preset-target-name">{selectedElement()?.name}</span>
          </div>

          <div class="preset-categories">
            <For each={categories}>
              {(category) => (
                <button
                  class="preset-category-btn"
                  classList={{ active: activeCategory() === category }}
                  onClick={() => setActiveCategory(category)}
                >
                  {categoryLabels[category]}
                </button>
              )}
            </For>
          </div>

          <div class="preset-list">
            <For each={presetsByCategory[activeCategory()]}>
              {(preset) => (
                <button
                  class="preset-item"
                  onClick={() => handleApplyPreset(preset)}
                  title={preset.description}
                >
                  <span class="preset-item-name">{preset.name}</span>
                  <span class="preset-item-duration">{preset.duration}ms</span>
                </button>
              )}
            </For>
          </div>

          <Show when={appliedMessage()}>
            <div class="preset-applied-message">{appliedMessage()}</div>
          </Show>
        </div>
      </Show>
    </div>
  )
}

export default PresetPanel
