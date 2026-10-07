import { For, Show, createSignal } from 'solid-js'
import type { Keyframe, Track } from '../../engine/types'
import { ACTING_STYLES, GAGS, GAITS, HUMAN_REST, characterPoseTracks, gagDuration, lipSyncOver, speechDuration, type ActingStyleName, type CharacterPose, type GagName, type GaitName } from '../../characters'
import type { EditorStore } from '../stores/editor-store'
import type { CharacterElement, SceneStore } from '../stores/scene-store'
import { actingTracks, characterGagKeys, characterWalk, keyPosesOf, spliceKeys, upsertKey, withRemovals, type CharacterActing } from '../utils/character-acting'
import { mergeKeyframes, type PropertyKeyframes } from '../utils/character-dance'
import { isCharacterField } from '../utils/character-element'

/**
 * The Character element's Acting section: act the keyed poses in a style,
 * drop in gags, walk in a gait, say a line (lip-sync), and set the drawing
 * rate. Everything is written as ordinary keyframes.
 */

interface ActingPanelProps {
  element: CharacterElement
  store: EditorStore
  sceneStore: SceneStore
}

const STYLE_LABELS: Record<ActingStyleName, string> = {
  none: 'None (as keyed)',
  limited: 'Limited (TV, Pencilmation)',
  full: 'Full (feature animation)',
  snappy: 'Snappy (theatrical cartoon)',
}

const GAG_LABELS: Record<GagName, string> = {
  take: 'Take (shoot up, land)',
  doubleTake: 'Double take',
  windUp: 'Wind-up',
  land: 'Land',
  tremble: 'Tremble',
  deflate: 'Deflate (sigh)',
}

const GAIT_LABELS: Record<GaitName, string> = {
  walk: 'Walk',
  bouncy: 'Bouncy',
  doubleBounce: 'Double bounce',
  sneak: 'Sneak (tiptoe)',
  strut: 'Strut',
  tired: 'Tired',
  run: 'Run',
  shove: 'Shove (steady arms)',
}

/** The character's own pose: rest, then its element pose. */
const restOf = (element: CharacterElement): CharacterPose => ({ ...HUMAN_REST, ...element.pose })

/**
 * Re-act a character with its key poses (and lines) changed: its tracks are
 * generated again, and fields acting no longer animates are removed.
 */
export function writeActing(store: EditorStore, sceneStore: SceneStore, element: CharacterElement, acting: CharacterActing, extra: PropertyKeyframes[] = []): void {
  const existing = store.state.timeline?.tracks ?? []
  const fresh = actingTracks(element.name, acting, restOf(element))
  // One undo step: the element update takes the snapshot, the tracks follow it.
  sceneStore.updateElement(element.id, { acting })
  store.replaceTracks(element.name, [...withRemovals(existing, element.name, fresh), ...extra], false)
}

/** With acting on, keying a pose at the playhead adds (or replaces) a key pose and re-acts. */
export function keyActedPose(store: EditorStore, sceneStore: SceneStore, element: CharacterElement, pose: CharacterPose): void {
  if (!element.acting) return
  const time = Math.round(store.currentTime())
  writeActing(store, sceneStore, element, { ...element.acting, keys: upsertKey(element.acting.keys, time, pose) })
}

export function CharacterActingPanel(props: ActingPanelProps) {
  const [style, setStyle] = createSignal<ActingStyleName>(props.element.acting?.style ?? 'snappy')
  const [gagName, setGagName] = createSignal<GagName>('take')
  const [gait, setGait] = createSignal<GaitName>('walk')
  const [distance, setDistance] = createSignal(240)
  const [line, setLine] = createSignal('')
  const [message, setMessage] = createSignal('')

  const name = () => props.element.name
  const tracks = () => props.store.state.timeline?.tracks ?? []
  const playhead = () => Math.round(props.store.currentTime())
  const valuesAt = (time: number) => props.store.state.timeline?.getStateAtTime(time)?.values.get(name())
  /** The character's whole pose at a time: its own pose, then its animated fields. */
  const poseAt = (time: number): CharacterPose => {
    const pose = restOf(props.element)
    for (const [field, value] of valuesAt(time) ?? []) if (typeof value === 'number' && isCharacterField(field)) pose[field] = value
    return pose
  }
  const xAt = (time: number) => {
    const x = valuesAt(time)?.get('x')
    return typeof x === 'number' ? x : 0
  }

  /** Plain keys (acting off) merged into the character's tracks, keeping keys before and after them. */
  const mergePlain = (keys: Parameters<typeof characterPoseTracks>[1], extra: PropertyKeyframes[] = []) => {
    const added = characterPoseTracks(name(), keys, restOf(props.element)).map((t) => ({ property: t.property, keyframes: t.keyframes as Keyframe[] }))
    props.store.replaceTracks(name(), mergeKeyframes(tracks(), name(), [...added, ...extra]))
  }

  const act = () => {
    const acting = props.element.acting
    const keys = acting?.keys ?? keyPosesOf(tracks(), name(), restOf(props.element))
    if (keys.length < 2) {
      setMessage('Key at least two poses first (◆ Keyframe pose at playhead).')
      return
    }
    setMessage('')
    writeActing(props.store, props.sceneStore, props.element, { style: style(), keys, lines: acting?.lines })
  }

  const pickStyle = (next: ActingStyleName) => {
    setStyle(next)
    // Acting already on: re-act in the new style straight away.
    if (props.element.acting) writeActing(props.store, props.sceneStore, props.element, { ...props.element.acting, style: next })
  }

  const removeActing = () => {
    const acting = props.element.acting
    if (!acting) return
    // Back to the plain key poses (the lines stay lip-synced).
    const plain = actingTracks(name(), { ...acting, style: 'none' }, restOf(props.element))
    const write = withRemovals(tracks(), name(), plain)
    props.sceneStore.updateElement(props.element.id, { acting: undefined })
    props.store.replaceTracks(name(), write, false)
  }

  const addGag = () => {
    const start = playhead()
    const pose = poseAt(start)
    const keys = characterGagKeys(gagName(), { start, pose })
    const acting = props.element.acting
    if (acting) writeActing(props.store, props.sceneStore, props.element, { ...acting, keys: spliceKeys(acting.keys, keys) })
    else mergePlain(keys)
  }

  const walk = (direction: 1 | -1) => {
    const start = playhead()
    const { keys, x } = characterWalk(gait(), {
      start,
      distance: direction * Math.abs(distance()),
      height: props.element.height,
      pose: poseAt(start),
      x: xAt(start),
    })
    const moved = mergeKeyframes(tracks(), name(), [{ property: 'x', keyframes: x }])
    const acting = props.element.acting
    if (acting) writeActing(props.store, props.sceneStore, props.element, { ...acting, keys: spliceKeys(acting.keys, keys) }, moved)
    else mergePlain(keys, [{ property: 'x', keyframes: x }])
  }

  const say = () => {
    const text = line().trim()
    if (!text) return
    const start = playhead()
    const spoken = { text, start, end: start + speechDuration(text) }
    const acting = props.element.acting
    if (acting) {
      // A new line replaces any it overlaps.
      const lines = [...(acting.lines ?? []).filter((l) => l.end < spoken.start || l.start > spoken.end), spoken].sort((a, b) => a.start - b.start)
      writeActing(props.store, props.sceneStore, props.element, { ...acting, lines })
      return
    }
    const own = tracks().filter((t) => t.target === name() && isCharacterField(t.property)) as Track[]
    const mouth = lipSyncOver(name(), own, [spoken], { rest: restOf(props.element) }).filter((t) => t.property === 'mouth' || t.property === 'mouthWidth')
    props.store.replaceTracks(name(), mouth.map((t) => ({ property: t.property, keyframes: t.keyframes as Keyframe[] })))
  }

  const drawingRate = () => props.store.state.timeline?.drawingRate ?? 0

  return (
    <div class="property-section">
      <h4>Acting</h4>
      <div class="property-row">
        <label>Style</label>
        <select value={style()} onChange={(e) => pickStyle((e.target as HTMLSelectElement).value as ActingStyleName)}>
          <For each={Object.keys(ACTING_STYLES) as ActingStyleName[]}>{(s) => <option value={s}>{STYLE_LABELS[s]}</option>}</For>
        </select>
      </div>
      <div class="property-row">
        <label></label>
        <Show
          when={props.element.acting}
          fallback={<button class="character-key-btn" onClick={act}>🎭 Act the keyed poses</button>}
        >
          {(acting) => (
            <button class="character-key-btn" onClick={removeActing}>
              Acting on: {acting().keys.length} key poses · turn off
            </button>
          )}
        </Show>
      </div>
      <Show when={message()}>
        <p class="property-hint">{message()}</p>
      </Show>

      <div class="property-row">
        <label>Gag</label>
        <select value={gagName()} onChange={(e) => setGagName((e.target as HTMLSelectElement).value as GagName)}>
          <For each={Object.keys(GAGS) as GagName[]}>{(g) => <option value={g}>{GAG_LABELS[g]}</option>}</For>
        </select>
      </div>
      <div class="property-row">
        <label></label>
        <button class="character-key-btn" onClick={addGag}>
          💥 Gag at playhead ({(gagDuration(gagName()) / 1000).toFixed(1)} s)
        </button>
      </div>

      <div class="property-row">
        <label>Gait</label>
        <select value={gait()} onChange={(e) => setGait((e.target as HTMLSelectElement).value as GaitName)}>
          <For each={Object.keys(GAITS) as GaitName[]}>{(g) => <option value={g}>{GAIT_LABELS[g]}</option>}</For>
        </select>
      </div>
      <div class="property-row">
        <label>Distance</label>
        <input type="number" min="20" max="4000" value={distance()} onInput={(e) => setDistance(parseFloat((e.target as HTMLInputElement).value) || 240)} />
      </div>
      <div class="property-row">
        <label></label>
        <button class="character-key-btn" onClick={() => walk(-1)}>← Walk left</button>
        <button class="character-key-btn" onClick={() => walk(1)}>Walk right →</button>
      </div>

      <div class="property-row">
        <label>Say</label>
        <input type="text" placeholder="What it says" value={line()} onInput={(e) => setLine((e.target as HTMLInputElement).value)} />
      </div>
      <div class="property-row">
        <label></label>
        <button class="character-key-btn" disabled={!line().trim()} onClick={say}>
          💬 Say at playhead ({(speechDuration(line().trim() || ' ') / 1000).toFixed(1)} s)
        </button>
      </div>

      <div class="property-row">
        <label>Drawing</label>
        <select value={String(drawingRate())} onChange={(e) => props.store.setDrawingRate(Number((e.target as HTMLSelectElement).value))}>
          <option value="0">Every frame</option>
          <option value="12">On twos (12/s)</option>
          <option value="8">On threes (8/s)</option>
        </select>
      </div>
      <p class="property-hint">
        Key two or more poses, then act them: the character winds up before each move, overshoots and settles, its limbs
        overlap, and its eyes lead and blink. With acting on, keying another pose, a gag, a walk or a line re-acts the whole
        performance. Turning acting off puts the plain poses back. Gags and walks start from the pose at the playhead;
        lines are lip-synced (English or Hindi). Dances and flips write keys as they are, and turn acting off. Drawing on
        twos holds each pose for two frames, as hand-drawn animation does. It applies to the whole timeline.
      </p>
    </div>
  )
}
