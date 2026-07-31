import { For, Show, createSignal } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { SceneStore } from '../stores/scene-store'
import type { TextElement, PathElement } from '../stores/scene-store'
import { presetsByCategory, type AnimationPreset } from '../presets'
import { buildTypewriter, type TypewriterLetter, type TypewriterCursor } from '../utils/build-typewriter'
import { getPathLength } from '../../engine/path'
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
  const [staggerEnabled, setStaggerEnabled] = createSignal(false)
  const [staggerMs, setStaggerMs] = createSignal(60)
  const [typeDelay, setTypeDelay] = createSignal(90)
  const [cursorEnabled, setCursorEnabled] = createSignal(true)

  const selectedElement = () => props.sceneStore.selectedElement()

  // The typewriter effect operates on a single text element.
  const canTypewriter = () => {
    const el = selectedElement()
    return !!el && el.type === 'text' && props.sceneStore.selectedElementIds().length <= 1
  }

  const handleTypewriter = () => {
    const element = selectedElement()
    if (!element || element.type !== 'text') return

    // Capture what we need before the source element is replaced by its letters.
    const source = element as TextElement
    const fill = source.fill

    const result = props.sceneStore.splitTextElement(source.id)
    if (!result || result.letterIds.length === 0) return

    const elements = props.sceneStore.elements()
    const letterEls = result.letterIds
      .map((id) => elements.find((e) => e.id === id) as TextElement | undefined)
      .filter((e): e is TextElement => !!e)

    const letters: TypewriterLetter[] = letterEls.map((el) => ({
      target: el.id,
      x: el.x,
      width: el.width,
    }))

    let cursor: TypewriterCursor | undefined
    if (cursorEnabled() && letterEls.length > 0) {
      const first = letterEls[0]
      const cursorEl = props.sceneStore.addElement('rect', {
        name: `${source.name} Cursor`,
        x: first.x,
        y: first.y,
        width: 2,
        height: first.height,
        fill,
        stroke: 'transparent',
        strokeWidth: 0,
        borderRadius: 0,
      })
      cursor = { target: cursorEl.id, baseX: first.x, blink: true }
    }

    const { tracks } = buildTypewriter(letters, {
      charDelay: typeDelay(),
      cursor,
    })

    // addTracks grows the scene duration to cover the new keyframes.
    props.store.addTracks(tracks)

    setAppliedMessage(`Typewriter applied to ${letters.length} letters`)
    setTimeout(() => setAppliedMessage(null), 2000)
  }

  // Write-on (stroke draw) operates on a single path element.
  const canWriteOn = () => {
    const el = selectedElement()
    return !!el && el.type === 'path' && props.sceneStore.selectedElementIds().length <= 1
  }

  const [writeOnMs, setWriteOnMs] = createSignal(900)

  const handleWriteOn = () => {
    const element = selectedElement()
    if (!element || element.type !== 'path') return
    const path = element as PathElement
    const length = Math.max(1, Math.round(getPathLength(path.d)))
    const duration = writeOnMs()

    // stroke-dasharray = full length; stroke-dashoffset animates length -> 0 so
    // the stroke "draws" itself on. The DOM/SVG renderers both honour these.
    props.store.addTracks([
      {
        target: element.name,
        property: 'strokeDasharray',
        keyframes: [{ time: 0, value: length }],
      },
      {
        target: element.name,
        property: 'strokeDashoffset',
        keyframes: [
          { time: 0, value: length },
          { time: duration, value: 0, easing: 'ease-out' },
        ],
      },
    ])

    setAppliedMessage('Write-on applied')
    setTimeout(() => setAppliedMessage(null), 2000)
  }

  // Stagger is offered when there is a single text element to split into letters,
  // or when several elements are selected to fan the animation across.
  const canStagger = () => {
    const el = selectedElement()
    if (!el) return false
    return el.type === 'text' || props.sceneStore.selectedElementIds().length > 1
  }

  const handleApplyPreset = (preset: AnimationPreset) => {
    const element = selectedElement()
    if (!element) return

    // Staggered application: fan the preset across many targets with a delay.
    if (staggerEnabled() && canStagger()) {
      const selectedIds = props.sceneStore.selectedElementIds()
      let targets: string[]
      let label: string

      if (selectedIds.length > 1) {
        // Fan across the currently selected elements, in selection order.
        targets = selectedIds
        label = `Applied "${preset.name}" to ${targets.length} elements`
      } else if (element.type === 'text') {
        // Break the text into per-letter elements, then fan across them.
        const result = props.sceneStore.splitTextElement(element.id)
        targets = result?.letterIds ?? [element.id]
        label = `Applied "${preset.name}" across ${targets.length} letters`
      } else {
        targets = [element.id]
        label = `Applied "${preset.name}"`
      }

      const trackIds = props.store.applyPresetStaggered(preset, targets, {
        staggerMs: staggerMs(),
      })

      if (trackIds.length > 0) {
        setAppliedMessage(label)
        setTimeout(() => setAppliedMessage(null), 2000)
      }
      return
    }

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

          <Show when={canStagger()}>
            <div class="preset-stagger">
              <label class="preset-stagger-toggle">
                <input
                  type="checkbox"
                  checked={staggerEnabled()}
                  onChange={(e) => setStaggerEnabled(e.currentTarget.checked)}
                />
                <span>Per-letter stagger</span>
                <HelpIcon
                  content="Splits the text into individual letters (or uses your multi-selection) and fans the animation across them, each starting a little later. This is how Animate-style drop, cascade and wave text effects are built."
                  position="left"
                />
              </label>
              <Show when={staggerEnabled()}>
                <div class="preset-stagger-amount">
                  <span>Delay</span>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="5"
                    value={staggerMs()}
                    onInput={(e) => setStaggerMs(Math.max(0, Number(e.currentTarget.value) || 0))}
                  />
                  <span class="preset-stagger-unit">ms / letter</span>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={canTypewriter()}>
            <div class="preset-typewriter">
              <div class="preset-typewriter-title">
                <span>Typewriter</span>
                <HelpIcon
                  content="Reveals the text one character at a time, like it's being typed. Splits the text into letters and optionally adds a blinking cursor that steps along. The timeline extends automatically to fit."
                  position="left"
                />
              </div>
              <div class="preset-typewriter-controls">
                <label class="preset-typewriter-speed">
                  <span>Speed</span>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="10"
                    value={typeDelay()}
                    onInput={(e) => setTypeDelay(Math.max(10, Number(e.currentTarget.value) || 0))}
                  />
                  <span class="preset-stagger-unit">ms / char</span>
                </label>
                <label class="preset-typewriter-cursor">
                  <input
                    type="checkbox"
                    checked={cursorEnabled()}
                    onChange={(e) => setCursorEnabled(e.currentTarget.checked)}
                  />
                  <span>Blinking cursor</span>
                </label>
              </div>
              <button class="preset-typewriter-btn" onClick={handleTypewriter}>
                Apply Typewriter
              </button>
            </div>
          </Show>

          <Show when={canWriteOn()}>
            <div class="preset-typewriter">
              <div class="preset-typewriter-title">
                <span>Write On</span>
                <HelpIcon
                  content="Draws the path's stroke on, as if hand-drawn, by animating stroke-dashoffset from the full length to zero. Works on the DOM and SVG renderers; the timeline extends to fit."
                  position="left"
                />
              </div>
              <div class="preset-typewriter-controls">
                <label class="preset-typewriter-speed">
                  <span>Duration</span>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    step="50"
                    value={writeOnMs()}
                    onInput={(e) => setWriteOnMs(Math.max(100, Number(e.currentTarget.value) || 0))}
                  />
                  <span class="preset-stagger-unit">ms</span>
                </label>
              </div>
              <button class="preset-typewriter-btn" onClick={handleWriteOn}>
                Apply Write-On
              </button>
            </div>
          </Show>

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
