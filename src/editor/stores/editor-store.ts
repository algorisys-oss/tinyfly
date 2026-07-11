import { createSignal, createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Timeline, createTrack, serializeTimeline, deserializeTimeline } from '../../engine'
import type {
  Keyframe,
  AnimatableValue,
  TimelineConfig,
  TimelineDefinition,
  MotionPathTrack,
  EasingType,
} from '../../engine'
import { type AnimationPreset, resolvePresetKeyframe } from '../presets'
import type { SceneElement } from './scene-store'

/**
 * A full editor snapshot for undo/redo: the timeline AND the scene elements, so a
 * single undo reverses whichever changed (an element edit or a keyframe edit).
 */
export interface EditorSnapshot {
  timeline: TimelineDefinition | null
  elements: SceneElement[]
}

/** Hooks that let the editor snapshot/restore scene elements it doesn't own. */
export interface SceneHistoryHooks {
  getElements: () => SceneElement[]
  setElements: (elements: SceneElement[]) => void
}

/** A keyframe identified by its track and position. */
export interface KeyframeRef {
  trackId: string
  index: number
}

export interface EditorState {
  timeline: Timeline | null
  selectedTrackId: string | null
  selectedKeyframeIndex: number | null
  /** Multi-selection of keyframes (superset of the primary selection above). */
  selectedKeyframes: KeyframeRef[]
  zoom: number
  scrollPosition: number
}

const initialState: EditorState = {
  timeline: null,
  selectedTrackId: null,
  selectedKeyframeIndex: null,
  selectedKeyframes: [],
  zoom: 1,
  scrollPosition: 0,
}

/** A keyframe copied to the clipboard, retaining its source track. */
interface CopiedKeyframe {
  trackId: string
  time: number
  value: AnimatableValue
  easing?: EasingType
}

/**
 * Create the editor store for managing animation editor state.
 */
export function createEditorStore() {
  // Clone the defaults so each store instance owns its state — createStore writes
  // through to the object it is given, and `initialState` is a shared constant.
  const [state, setState] = createStore<EditorState>({ ...initialState })
  const [currentTime, setCurrentTime] = createSignal(0)
  const [isPlaying, setIsPlaying] = createSignal(false)
  // Version counter to force reactivity on timeline mutations
  const [timelineVersion, setTimelineVersion] = createSignal(0)

  // Unified undo/redo history: each entry is a full { timeline, elements }
  // snapshot, so one Ctrl+Z reverses whatever changed last — a keyframe edit or
  // an element edit. Scene elements are read/written through injected hooks.
  const HISTORY_LIMIT = 100
  const [undoStack, setUndoStack] = createSignal<EditorSnapshot[]>([])
  const [redoStack, setRedoStack] = createSignal<EditorSnapshot[]>([])
  let sceneHooks: SceneHistoryHooks | null = null

  /** Wire in the scene store so element state participates in undo/redo. */
  function attachScene(hooks: SceneHistoryHooks) {
    sceneHooks = hooks
  }

  const deepCopy = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

  function captureSnapshot(): EditorSnapshot {
    return {
      timeline: state.timeline ? serializeTimeline(state.timeline) : null,
      elements: sceneHooks ? deepCopy(sceneHooks.getElements()) : [],
    }
  }

  // Clipboard for keyframe copy/paste (kept out of the reactive store)
  const [keyframeClipboard, setKeyframeClipboard] = createSignal<CopiedKeyframe[]>([])

  // Bump version to trigger reactivity
  function bumpVersion() {
    setTimelineVersion((v) => v + 1)
  }

  // Record the current state before a mutation, and clear the redo stack.
  function pushHistory() {
    setUndoStack((s) => {
      const next = [...s, captureSnapshot()]
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next
    })
    setRedoStack([])
  }

  // Restore a full snapshot (timeline + elements).
  function restoreFromSnapshot(snapshot: EditorSnapshot) {
    if (snapshot.timeline) {
      setState('timeline', deserializeTimeline(snapshot.timeline))
    } else {
      setState('timeline', null)
    }
    sceneHooks?.setElements(deepCopy(snapshot.elements))
    setState('selectedTrackId', null)
    setState('selectedKeyframeIndex', null)
    bumpVersion()
  }

  // Create a new empty timeline
  function createNewTimeline(id: string, name?: string, config?: TimelineConfig) {
    const timeline = new Timeline({ id, name, config })
    setState('timeline', timeline)
    setState('selectedTrackId', null)
    setState('selectedKeyframeIndex', null)
    bumpVersion()
    return timeline
  }

  // Load an existing timeline
  function loadTimeline(timeline: Timeline) {
    setState('timeline', timeline)
    setState('selectedTrackId', null)
    setState('selectedKeyframeIndex', null)
    bumpVersion()
  }

  // Add a new track to the timeline
  function addTrack(options: {
    id: string
    target: string
    property: string
    keyframes?: Keyframe[]
  }) {
    if (!state.timeline) return

    pushHistory()

    const track = createTrack({
      id: options.id,
      target: options.target,
      property: options.property,
      keyframes: options.keyframes ?? [],
    })

    state.timeline.addTrack(track)
    bumpVersion()
  }

  // Remove a track
  function removeTrack(trackId: string) {
    if (!state.timeline) return

    pushHistory()

    state.timeline.removeTrack(trackId)
    bumpVersion()

    if (state.selectedTrackId === trackId) {
      setState('selectedTrackId', null)
      setState('selectedKeyframeIndex', null)
    }
    if (state.selectedKeyframes.some((k) => k.trackId === trackId)) {
      setState('selectedKeyframes', state.selectedKeyframes.filter((k) => k.trackId !== trackId))
    }
  }

  // Apply an animation preset to a target element
  function applyPreset(
    preset: AnimationPreset,
    targetName: string,
    options?: { startTime?: number; duration?: number }
  ): string[] {
    if (!state.timeline) return []

    pushHistory()

    const startTime = options?.startTime ?? 0
    const duration = options?.duration ?? preset.duration
    const createdTrackIds: string[] = []

    for (const presetTrack of preset.tracks) {
      const trackId = `${targetName}-${presetTrack.property}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`

      const keyframes: Keyframe[] = presetTrack.keyframes.map((kf) => {
        const resolved = resolvePresetKeyframe(kf, duration, 0)
        return {
          ...resolved,
          time: resolved.time + startTime,
        }
      })

      const track = createTrack({
        id: trackId,
        target: targetName,
        property: presetTrack.property,
        keyframes,
      })

      state.timeline.addTrack(track)
      createdTrackIds.push(trackId)
    }

    bumpVersion()
    return createdTrackIds
  }

  // Add several tracks in one history step. Returns the created track ids.
  // Used by higher-level builders (e.g. typewriter) that emit a batch of tracks.
  function addTracks(
    inputs: Array<{ target: string; property: string; keyframes: Keyframe[] }>
  ): string[] {
    if (!state.timeline || inputs.length === 0) return []

    pushHistory()

    const stamp = Date.now()
    const ids: string[] = []
    inputs.forEach((input, i) => {
      const id = `${input.target}-${input.property}-${stamp}-${i}-${Math.random().toString(36).slice(2, 5)}`
      state.timeline!.addTrack(
        createTrack({ id, target: input.target, property: input.property, keyframes: input.keyframes })
      )
      ids.push(id)
    })

    bumpVersion()
    return ids
  }

  // Set (or extend) the timeline's explicit duration in ms.
  function setDuration(duration: number | undefined) {
    if (!state.timeline) return
    state.timeline.setDuration(duration)
    bumpVersion()
  }

  // Apply a preset across many targets with a per-target time offset.
  // This is the primitive behind staggered text (letter-by-letter) animation:
  // the same preset is fanned out over an ordered list of targets, each starting
  // `staggerMs` later than the previous one. The stagger is pure data — every
  // resulting track is an ordinary keyframe track, fully serializable to JSON.
  function applyPresetStaggered(
    preset: AnimationPreset,
    targetNames: string[],
    options?: { startTime?: number; duration?: number; staggerMs?: number }
  ): string[] {
    if (!state.timeline || targetNames.length === 0) return []

    pushHistory()

    const startTime = options?.startTime ?? 0
    const duration = options?.duration ?? preset.duration
    const staggerMs = options?.staggerMs ?? 60
    const createdTrackIds: string[] = []

    targetNames.forEach((targetName, targetIndex) => {
      const targetStart = startTime + targetIndex * staggerMs

      for (const presetTrack of preset.tracks) {
        const trackId = `${targetName}-${presetTrack.property}-${Date.now()}-${targetIndex}-${Math.random().toString(36).slice(2, 5)}`

        const keyframes: Keyframe[] = presetTrack.keyframes.map((kf) => {
          const resolved = resolvePresetKeyframe(kf, duration, 0)
          return {
            ...resolved,
            time: resolved.time + targetStart,
          }
        })

        const track = createTrack({
          id: trackId,
          target: targetName,
          property: presetTrack.property,
          keyframes,
        })

        state.timeline!.addTrack(track)
        createdTrackIds.push(trackId)
      }
    })

    bumpVersion()
    return createdTrackIds
  }

  // Create a motion path animation for a target
  function createMotionPathAnimation(
    targetName: string,
    pathData: string,
    options?: {
      duration?: number
      autoRotate?: boolean
      rotateOffset?: number
      startTime?: number
      easing?: EasingType
    }
  ): string {
    if (!state.timeline) return ''

    pushHistory()

    const trackId = `${targetName}-motionPath-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    const duration = options?.duration ?? 2000
    const startTime = options?.startTime ?? 0

    const motionPathTrack: MotionPathTrack = {
      id: trackId,
      target: targetName,
      property: 'motionPath',
      motionPathConfig: {
        pathData,
        autoRotate: options?.autoRotate ?? false,
        rotateOffset: options?.rotateOffset ?? 0,
      },
      keyframes: [
        { time: startTime, value: 0 },
        { time: startTime + duration, value: 1, easing: options?.easing ?? 'ease-in-out' },
      ],
    }

    state.timeline.addTrack(motionPathTrack)
    bumpVersion()

    return trackId
  }

  // Select a track
  function selectTrack(trackId: string | null) {
    setState('selectedTrackId', trackId)
    setState('selectedKeyframeIndex', null)
  }

  // Select a keyframe
  function selectKeyframe(trackId: string, keyframeIndex: number | null) {
    setState('selectedTrackId', trackId)
    setState('selectedKeyframeIndex', keyframeIndex)
    setState('selectedKeyframes', keyframeIndex === null ? [] : [{ trackId, index: keyframeIndex }])
  }

  // Toggle a keyframe in the multi-selection (Ctrl/Cmd-click).
  function toggleKeyframeSelection(trackId: string, keyframeIndex: number) {
    const existing = state.selectedKeyframes
    const at = existing.findIndex((k) => k.trackId === trackId && k.index === keyframeIndex)
    if (at === -1) {
      setState('selectedKeyframes', [...existing, { trackId, index: keyframeIndex }])
      setState('selectedTrackId', trackId)
      setState('selectedKeyframeIndex', keyframeIndex)
    } else {
      const next = existing.filter((_, i) => i !== at)
      setState('selectedKeyframes', next)
      const last = next[next.length - 1] ?? null
      setState('selectedTrackId', last?.trackId ?? null)
      setState('selectedKeyframeIndex', last?.index ?? null)
    }
  }

  // Replace the multi-selection (e.g. after a box/rubber-band select).
  function selectKeyframes(refs: KeyframeRef[]) {
    setState('selectedKeyframes', [...refs])
    const last = refs[refs.length - 1] ?? null
    setState('selectedTrackId', last?.trackId ?? null)
    setState('selectedKeyframeIndex', last?.index ?? null)
  }

  function isKeyframeSelected(trackId: string, keyframeIndex: number): boolean {
    return state.selectedKeyframes.some((k) => k.trackId === trackId && k.index === keyframeIndex)
  }

  function clearKeyframeSelection() {
    setState('selectedKeyframes', [])
    setState('selectedKeyframeIndex', null)
  }

  // Copy the currently selected keyframes to the clipboard.
  function copySelectedKeyframes(): number {
    if (!state.timeline) return 0
    const tracks = state.timeline.tracks
    const copied: CopiedKeyframe[] = []
    for (const ref of state.selectedKeyframes) {
      const track = tracks.find((t) => t.id === ref.trackId)
      const kf = track?.keyframes[ref.index]
      if (track && kf) {
        copied.push({ trackId: track.id, time: kf.time, value: kf.value, ...(kf.easing && { easing: kf.easing }) })
      }
    }
    setKeyframeClipboard(copied)
    return copied.length
  }

  function hasKeyframeClipboard(): boolean {
    return keyframeClipboard().length > 0
  }

  // Paste clipboard keyframes back onto their source tracks, shifted so the
  // earliest one lands at `atTime` (defaults to the current playhead).
  function pasteKeyframes(atTime?: number): number {
    if (!state.timeline) return 0
    const clip = keyframeClipboard()
    if (clip.length === 0) return 0

    const earliest = Math.min(...clip.map((k) => k.time))
    const offset = (atTime ?? currentTime()) - earliest

    // Group new keyframes by their target track.
    const byTrack = new Map<string, Keyframe[]>()
    for (const k of clip) {
      const list = byTrack.get(k.trackId) ?? []
      list.push({ time: Math.max(0, Math.round(k.time + offset)), value: k.value, ...(k.easing && { easing: k.easing }) })
      byTrack.set(k.trackId, list)
    }

    pushHistory()

    const newSelection: KeyframeRef[] = []
    for (const [trackId, additions] of byTrack) {
      const track = state.timeline.tracks.find((t) => t.id === trackId)
      if (!track) continue
      const merged = [...track.keyframes, ...additions].sort((a, b) => a.time - b.time)
      state.timeline.removeTrack(track.id)
      state.timeline.addTrack(createTrack({ ...track, keyframes: merged }))
      // Select the pasted keyframes by locating them post-sort.
      for (const added of additions) {
        const idx = merged.findIndex((kf) => kf === added)
        if (idx !== -1) newSelection.push({ trackId, index: idx })
      }
    }

    bumpVersion()
    selectKeyframes(newSelection)
    return clip.length
  }

  // Delete every keyframe in the multi-selection.
  function deleteSelectedKeyframes(): number {
    if (!state.timeline || state.selectedKeyframes.length === 0) return 0

    // Group indices to remove per track.
    const byTrack = new Map<string, Set<number>>()
    for (const ref of state.selectedKeyframes) {
      const set = byTrack.get(ref.trackId) ?? new Set<number>()
      set.add(ref.index)
      byTrack.set(ref.trackId, set)
    }

    pushHistory()

    let removed = 0
    for (const [trackId, indices] of byTrack) {
      const track = state.timeline.tracks.find((t) => t.id === trackId)
      if (!track) continue
      const kept = track.keyframes.filter((_, i) => !indices.has(i))
      removed += track.keyframes.length - kept.length
      state.timeline.removeTrack(track.id)
      state.timeline.addTrack(createTrack({ ...track, keyframes: kept }))
    }

    bumpVersion()
    clearKeyframeSelection()
    return removed
  }

  // Add keyframe to selected track
  function addKeyframe(time: number, value: AnimatableValue) {
    if (!state.timeline || !state.selectedTrackId) return

    const tracks = state.timeline.tracks
    const trackIndex = tracks.findIndex((t) => t.id === state.selectedTrackId)
    if (trackIndex === -1) return

    pushHistory()

    const track = tracks[trackIndex]
    const newKeyframes = [...track.keyframes, { time, value }].sort(
      (a, b) => a.time - b.time
    )

    // Remove and re-add track with updated keyframes
    state.timeline.removeTrack(track.id)
    state.timeline.addTrack(
      createTrack({
        ...track,
        keyframes: newKeyframes,
      })
    )

    bumpVersion()
  }

  // Update a keyframe
  function updateKeyframe(
    trackId: string,
    keyframeIndex: number,
    updates: Partial<Keyframe>
  ) {
    if (!state.timeline) return

    const tracks = state.timeline.tracks
    const track = tracks.find((t) => t.id === trackId)
    if (!track || keyframeIndex < 0 || keyframeIndex >= track.keyframes.length) return

    pushHistory()

    const newKeyframes = track.keyframes.map((kf, i) =>
      i === keyframeIndex ? { ...kf, ...updates } : kf
    )

    // Sort by time if time was updated
    if (updates.time !== undefined) {
      newKeyframes.sort((a, b) => a.time - b.time)
    }

    state.timeline.removeTrack(track.id)
    state.timeline.addTrack(
      createTrack({
        ...track,
        keyframes: newKeyframes,
      })
    )

    bumpVersion()
  }

  // Remove a keyframe
  function removeKeyframe(trackId: string, keyframeIndex: number) {
    if (!state.timeline) return

    const tracks = state.timeline.tracks
    const track = tracks.find((t) => t.id === trackId)
    if (!track) return

    pushHistory()

    const newKeyframes = track.keyframes.filter((_, i) => i !== keyframeIndex)

    state.timeline.removeTrack(track.id)
    state.timeline.addTrack(
      createTrack({
        ...track,
        keyframes: newKeyframes,
      })
    )

    bumpVersion()

    if (state.selectedKeyframeIndex === keyframeIndex) {
      setState('selectedKeyframeIndex', null)
    }
    // Indices shift on removal — drop the multi-selection to avoid stale refs.
    if (state.selectedKeyframes.length > 0) {
      setState('selectedKeyframes', [])
    }
  }

  // Playback controls
  function play() {
    if (!state.timeline) return
    state.timeline.play()
    setIsPlaying(true)
  }

  function pause() {
    if (!state.timeline) return
    state.timeline.pause()
    setIsPlaying(false)
  }

  function stop() {
    if (!state.timeline) return
    state.timeline.stop()
    setIsPlaying(false)
    setCurrentTime(0)
  }

  function seek(time: number) {
    if (!state.timeline) return
    state.timeline.seek(time)
    setCurrentTime(time)
  }

  // Tick the timeline (call from animation loop)
  function tick(delta: number) {
    if (!state.timeline) return
    state.timeline.tick(delta)
    setCurrentTime(state.timeline.currentTime)

    // Sync isPlaying with timeline's actual state (handles animation end)
    if (state.timeline.playbackState !== 'playing' && isPlaying()) {
      setIsPlaying(false)
    }
  }

  // Zoom controls
  function setZoom(zoom: number) {
    setState('zoom', Math.max(0.1, Math.min(10, zoom)))
  }

  function setScrollPosition(position: number) {
    setState('scrollPosition', Math.max(0, position))
  }

  // Undo last action
  function undo() {
    const stack = undoStack()
    if (stack.length === 0) return
    setRedoStack((r) => [...r, captureSnapshot()])
    const prev = stack[stack.length - 1]
    setUndoStack(stack.slice(0, -1))
    restoreFromSnapshot(prev)
  }

  // Redo last undone action
  function redo() {
    const stack = redoStack()
    if (stack.length === 0) return
    setUndoStack((u) => [...u, captureSnapshot()])
    const next = stack[stack.length - 1]
    setRedoStack(stack.slice(0, -1))
    restoreFromSnapshot(next)
  }

  // Clear undo history
  function clearHistory() {
    setUndoStack([])
    setRedoStack([])
  }

  // Export timeline as JSON string
  function exportJSON(): string | null {
    if (!state.timeline) return null
    return JSON.stringify(serializeTimeline(state.timeline), null, 2)
  }

  // Export and download as file
  function exportToFile(filename?: string) {
    const json = exportJSON()
    if (!json) return

    const name = filename || `${state.timeline?.name || 'animation'}.json`
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()

    URL.revokeObjectURL(url)
  }

  // Import timeline from JSON string
  function importJSON(json: string): boolean {
    try {
      const definition = JSON.parse(json) as TimelineDefinition
      const timeline = deserializeTimeline(definition)
      setState('timeline', timeline)
      setState('selectedTrackId', null)
      setState('selectedKeyframeIndex', null)
      clearHistory()
      bumpVersion()
      return true
    } catch {
      return false
    }
  }

  // Import from File object
  async function importFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text()
      return importJSON(text)
    } catch {
      return false
    }
  }

  // Computed values (timelineVersion triggers reactivity on mutations)
  const duration = createMemo(() => {
    timelineVersion()
    return state.timeline?.duration ?? 0
  })
  const tracks = createMemo(() => {
    timelineVersion()
    return state.timeline?.tracks ?? []
  })
  const selectedTrack = createMemo(() => {
    timelineVersion()
    return tracks().find((t) => t.id === state.selectedTrackId) ?? null
  })
  const canUndo = () => undoStack().length > 0
  const canRedo = () => redoStack().length > 0

  return {
    // State
    state,
    currentTime,
    isPlaying,

    // Computed
    duration,
    tracks,
    selectedTrack,

    // Timeline actions
    createNewTimeline,
    loadTimeline,

    // Track actions
    addTrack,
    removeTrack,
    selectTrack,
    applyPreset,
    applyPresetStaggered,
    addTracks,
    setDuration,
    createMotionPathAnimation,

    // Keyframe actions
    selectKeyframe,
    toggleKeyframeSelection,
    selectKeyframes,
    isKeyframeSelected,
    clearKeyframeSelection,
    copySelectedKeyframes,
    hasKeyframeClipboard,
    pasteKeyframes,
    deleteSelectedKeyframes,
    addKeyframe,
    updateKeyframe,
    removeKeyframe,

    // Playback actions
    play,
    pause,
    stop,
    seek,
    tick,

    // View actions
    setZoom,
    setScrollPosition,

    // History actions
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    pushHistory,
    attachScene,

    // Import/Export actions
    exportJSON,
    exportToFile,
    importJSON,
    importFromFile,
  }
}

export type EditorStore = ReturnType<typeof createEditorStore>
