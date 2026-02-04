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
import { createHistoryStore } from './history-store'
import { type AnimationPreset, resolvePresetKeyframe } from '../presets'

export interface EditorState {
  timeline: Timeline | null
  selectedTrackId: string | null
  selectedKeyframeIndex: number | null
  zoom: number
  scrollPosition: number
}

const initialState: EditorState = {
  timeline: null,
  selectedTrackId: null,
  selectedKeyframeIndex: null,
  zoom: 1,
  scrollPosition: 0,
}

/**
 * Create the editor store for managing animation editor state.
 */
export function createEditorStore() {
  const [state, setState] = createStore<EditorState>(initialState)
  const [currentTime, setCurrentTime] = createSignal(0)
  const [isPlaying, setIsPlaying] = createSignal(false)
  // Version counter to force reactivity on timeline mutations
  const [timelineVersion, setTimelineVersion] = createSignal(0)

  // History for undo/redo
  const history = createHistoryStore<TimelineDefinition>()

  // Bump version to trigger reactivity
  function bumpVersion() {
    setTimelineVersion((v) => v + 1)
  }

  // Snapshot current timeline state to history
  function pushHistory() {
    if (!state.timeline) return
    history.push(serializeTimeline(state.timeline))
  }

  // Restore timeline from a snapshot
  function restoreFromSnapshot(snapshot: TimelineDefinition) {
    const timeline = deserializeTimeline(snapshot)
    setState('timeline', timeline)
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
    const snapshot = history.undo()
    if (snapshot) {
      restoreFromSnapshot(snapshot)
    }
  }

  // Redo last undone action
  function redo() {
    const snapshot = history.redo()
    if (snapshot) {
      restoreFromSnapshot(snapshot)
    }
  }

  // Clear undo history
  function clearHistory() {
    history.clear()
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
  const canUndo = () => history.canUndo()
  const canRedo = () => history.canRedo()

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
    createMotionPathAnimation,

    // Keyframe actions
    selectKeyframe,
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

    // Import/Export actions
    exportJSON,
    exportToFile,
    importJSON,
    importFromFile,
  }
}

export type EditorStore = ReturnType<typeof createEditorStore>
