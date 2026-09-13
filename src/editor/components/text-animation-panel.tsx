import { createSignal, For, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { TextElement } from '../stores/scene-store'
import type { BuiltInEasingType, TextChars, TextMode, TextTrack } from '../../engine'

/**
 * Editing text tracks in the Properties panel.
 *
 * A text track's keyframes are only progress (0 → 1), so the keyframe row is not
 * where it is authored. `TextAnimationCreator` adds one to a selected text
 * element; `TextTrackInspector` edits a selected text track's words, mode,
 * scramble options and timing. All changes go through the editor store, which
 * keeps undo and the scene length right.
 */

const CHAR_SETS: Array<{ value: string; label: string }> = [
  { value: 'upperCase', label: 'A–Z' },
  { value: 'lowerCase', label: 'a–z' },
  { value: 'upperAndLowerCase', label: 'A–z' },
  { value: 'numbers', label: '0–9' },
]

const EASINGS: BuiltInEasingType[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'ease-out-cubic']

const isNamedSet = (chars: string | undefined) => CHAR_SETS.some((set) => set.value === (chars ?? 'upperCase'))

/** A seed that differs per click, so "New scramble" visibly changes the sequence. */
const freshSeed = () => Math.floor(Math.random() * 1_000_000)

interface CreatorProps {
  store: EditorStore
  element: TextElement
}

/** "Text animation" for a selected text element: type or scramble to new words. */
export const TextAnimationCreator: Component<CreatorProps> = (props) => {
  const [mode, setMode] = createSignal<TextMode>('scramble')
  const [newText, setNewText] = createSignal('')
  const [durationMs, setDurationMs] = createSignal(1200)

  const create = () => {
    const to = newText().trim() || props.element.text
    const track = props.store.addTextTrack({
      target: props.element.name,
      textConfig: {
        from: mode() === 'type' ? '' : props.element.text,
        to,
        mode: mode(),
        ...(mode() === 'scramble' && { seed: freshSeed() }),
      },
      startMs: props.store.currentTime(),
      durationMs: durationMs(),
      easing: mode() === 'type' ? 'linear' : 'ease-out',
    })
    if (track) props.store.selectTrack(track.id)
    setNewText('')
  }

  return (
    <div class="property-section">
      <h4>🔤 Text Animation</h4>
      <div class="property-row">
        <label>Effect</label>
        <select value={mode()} onChange={(e) => setMode(e.currentTarget.value as TextMode)}>
          <option value="scramble">Scramble</option>
          <option value="type">Type on</option>
        </select>
      </div>
      <div class="property-row">
        <label>{mode() === 'type' ? 'Text' : 'Becomes'}</label>
        <input
          type="text"
          placeholder={props.element.text}
          value={newText()}
          onInput={(e) => setNewText(e.currentTarget.value)}
        />
      </div>
      <div class="property-row">
        <label>Duration (ms)</label>
        <input
          type="number"
          min="50"
          step="50"
          value={durationMs()}
          onInput={(e) => setDurationMs(Math.max(50, Number(e.currentTarget.value)))}
        />
      </div>
      <div class="property-actions">
        <button type="button" class="secondary-button" onClick={create}>
          Add text animation →
        </button>
      </div>
      <p class="property-hint">
        {mode() === 'type'
          ? 'Types the text on, starting at the playhead.'
          : 'Scrambles from the current text into the new words, starting at the playhead.'}
      </p>
    </div>
  )
}

interface InspectorProps {
  store: EditorStore
  track: TextTrack
}

/** The inspector for a selected text track. */
export const TextTrackInspector: Component<InspectorProps> = (props) => {
  const config = () => props.track.textConfig
  const first = () => props.track.keyframes[0]
  const last = () => props.track.keyframes[props.track.keyframes.length - 1]
  const update = (changes: Parameters<EditorStore['updateTextTrack']>[1]) =>
    props.store.updateTextTrack(props.track.id, changes)

  const scramble = () => config().mode === 'scramble'
  const [customChars, setCustomChars] = createSignal(!isNamedSet(config().chars))

  return (
    <>
      <div class="property-section">
        <h4>Text Track</h4>
        <div class="property-row">
          <label>Target</label>
          <span class="property-value">{props.track.target}</span>
        </div>
        <div class="property-row">
          <label>Effect</label>
          <select value={config().mode} onChange={(e) => update({ mode: e.currentTarget.value as TextMode })}>
            <option value="scramble">Scramble</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      <div class="property-section">
        <h4>Words</h4>
        <div class="property-row">
          <label>From</label>
          <input type="text" value={config().from ?? ''} onChange={(e) => update({ from: e.currentTarget.value })} />
        </div>
        <div class="property-row">
          <label>To</label>
          <input type="text" value={config().to} onChange={(e) => update({ to: e.currentTarget.value })} />
        </div>
        <div class="property-row">
          <label title="Reveal or type from the end of the text">Right to left</label>
          <input
            type="checkbox"
            checked={config().rightToLeft ?? false}
            onChange={(e) => update({ rightToLeft: e.currentTarget.checked })}
          />
        </div>
        <p class="property-hint">
          While this track exists it decides the element's text: before it starts, the
          element shows <em>From</em>. The element's own Content shows again if you remove it.
        </p>
      </div>

      <Show when={scramble()}>
        <div class="property-section">
          <h4>Scramble</h4>
          <div class="property-row">
            <label>Characters</label>
            <select
              value={customChars() ? 'custom' : config().chars ?? 'upperCase'}
              onChange={(e) => {
                const value = e.currentTarget.value
                if (value === 'custom') {
                  setCustomChars(true)
                } else {
                  setCustomChars(false)
                  update({ chars: value as TextChars })
                }
              }}
            >
              <For each={CHAR_SETS}>{(set) => <option value={set.value}>{set.label}</option>}</For>
              <option value="custom">Custom…</option>
            </select>
          </div>
          <Show when={customChars()}>
            <div class="property-row">
              <label>Use</label>
              <input
                type="text"
                placeholder="e.g. 01 or ░▒▓"
                value={isNamedSet(config().chars) ? '' : config().chars ?? ''}
                onChange={(e) => e.currentTarget.value && update({ chars: e.currentTarget.value })}
              />
            </div>
          </Show>
          <div class="property-row">
            <label title="How often random characters change">Refresh /s</label>
            <input
              type="range"
              min="2"
              max="60"
              step="1"
              value={config().refreshRate ?? 20}
              onInput={(e) => update({ refreshRate: Number(e.currentTarget.value) })}
            />
            <span class="property-value num">{config().refreshRate ?? 20}</span>
          </div>
          <div class="property-row">
            <label title="Part of the tween spent scrambling before characters settle">Reveal delay</label>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={Math.round((config().revealDelay ?? 0) * 100)}
              onInput={(e) => update({ revealDelay: Number(e.currentTarget.value) / 100 })}
            />
            <span class="property-value num">{Math.round((config().revealDelay ?? 0) * 100)}%</span>
          </div>
          <div class="property-row">
            <label title="Grow or shrink from the old length to the new one">Tween length</label>
            <input
              type="checkbox"
              checked={config().tweenLength ?? true}
              onChange={(e) => update({ tweenLength: e.currentTarget.checked })}
            />
          </div>
          <div class="property-actions">
            <button type="button" class="secondary-button" onClick={() => update({ seed: freshSeed() })}>
              New scramble
            </button>
          </div>
          <p class="property-hint">
            The scramble is seeded: it plays back identically every time, in previews and
            exports. "New scramble" picks a different sequence.
          </p>
        </div>
      </Show>

      <div class="property-section">
        <h4>Timing</h4>
        <div class="property-row">
          <label>Start (ms)</label>
          <input
            type="number"
            min="0"
            step="50"
            value={first().time}
            onChange={(e) => update({ startMs: Math.max(0, Number(e.currentTarget.value)) })}
          />
        </div>
        <div class="property-row">
          <label>Duration (ms)</label>
          <input
            type="number"
            min="50"
            step="50"
            value={last().time - first().time}
            onChange={(e) => update({ durationMs: Math.max(50, Number(e.currentTarget.value)) })}
          />
        </div>
        <div class="property-row">
          <label>Easing</label>
          <select
            value={typeof last().easing === 'string' ? (last().easing as string) : 'linear'}
            onChange={(e) => update({ easing: e.currentTarget.value as BuiltInEasingType })}
          >
            <For each={EASINGS}>{(easing) => <option value={easing}>{easing}</option>}</For>
          </select>
        </div>
      </div>
    </>
  )
}
