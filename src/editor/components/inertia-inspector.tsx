import { createMemo, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import { inertiaDuration, inertiaRest, naturalRest, type InertiaTrack } from '../../engine'

/**
 * The Properties inspector for an inertia track: a throw authored as release
 * velocity, friction, bounds and snapping rather than keyframes. Like springs,
 * the engine derives the motion, and the scene grows to fit it.
 */

interface Props {
  store: EditorStore
  track: InertiaTrack
}

/** Parse a snapping field: blank → none, one number → grid, a list → values. */
function parseEnd(text: string): InertiaTrack['inertia']['end'] | null {
  const numbers = text
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite)
  if (numbers.length === 0) return null
  return numbers.length === 1 ? numbers[0] : numbers
}

const formatEnd = (end: InertiaTrack['inertia']['end']) =>
  end === undefined ? '' : Array.isArray(end) ? end.join(', ') : String(end)

const optionalNumber = (text: string): number | null => (text.trim() === '' ? null : Number(text))

export const InertiaInspector: Component<Props> = (props) => {
  const config = () => props.track.inertia
  const update = (changes: Parameters<EditorStore['updateInertia']>[1]) => props.store.updateInertia(props.track.id, changes)

  const summary = createMemo(() => {
    props.store.timelineVersion()
    const c = config()
    return {
      natural: Math.round(naturalRest(c) * 100) / 100,
      rest: Math.round(inertiaRest(c) * 100) / 100,
      settleMs: Math.round(inertiaDuration(c)),
    }
  })

  return (
    <>
      <div class="property-section">
        <h4>Inertia Track</h4>
        <div class="property-row">
          <label>Target</label>
          <span class="property-value">{props.track.target}</span>
        </div>
        <div class="property-row">
          <label>Property</label>
          <span class="property-value">{props.track.property}</span>
        </div>
        <div class="property-row">
          <label>Comes to rest</label>
          <span class="property-value">
            {summary().rest}
            <Show when={summary().rest !== summary().natural}>
              <span class="spring-flag" title={`A free throw would stop at ${summary().natural}`}>snapped</span>
            </Show>
          </span>
        </div>
        <div class="property-row">
          <label>Settles in</label>
          <span class="property-value">{summary().settleMs} ms</span>
        </div>
      </div>

      <div class="property-section">
        <h4>Throw</h4>
        <div class="property-row">
          <label>From</label>
          <input type="number" step="1" value={config().from} onChange={(e) => update({ from: Number(e.currentTarget.value) })} />
        </div>
        <div class="property-row">
          <label title="Speed at release, in units per second">Velocity</label>
          <input type="number" step="50" value={config().velocity} onChange={(e) => update({ velocity: Number(e.currentTarget.value) })} />
        </div>
        <div class="property-row">
          <label title="Higher stops sooner and travels less">Friction</label>
          <input
            type="range"
            min="0.5"
            max="20"
            step="0.5"
            value={config().friction ?? 4}
            onInput={(e) => update({ friction: Number(e.currentTarget.value) })}
          />
          <span class="property-value num">{config().friction ?? 4}</span>
        </div>
        <div class="property-row">
          <label>Delay (ms)</label>
          <input
            type="number"
            min="0"
            step="10"
            value={props.track.delay ?? 0}
            onChange={(e) => update({ delay: Math.max(0, Number(e.currentTarget.value)) })}
          />
        </div>
      </div>

      <div class="property-section">
        <h4>Landing</h4>
        <div class="property-row">
          <label>Min</label>
          <input type="number" placeholder="none" value={config().min ?? ''} onChange={(e) => update({ min: optionalNumber(e.currentTarget.value) })} />
        </div>
        <div class="property-row">
          <label>Max</label>
          <input type="number" placeholder="none" value={config().max ?? ''} onChange={(e) => update({ max: optionalNumber(e.currentTarget.value) })} />
        </div>
        <div class="property-row">
          <label title="One number snaps to a grid of that size; a list snaps to the nearest value">Snap to</label>
          <input
            type="text"
            placeholder="e.g. 50  or  0, 120, 300"
            value={formatEnd(config().end)}
            onChange={(e) => update({ end: parseEnd(e.currentTarget.value) })}
          />
        </div>
        <p class="property-hint">
          Snapping keeps the throw's deceleration and aims it so it lands exactly on the
          snap point. The scene extends automatically to fit the settle time.
        </p>
      </div>
    </>
  )
}
