import { For, Show, createMemo, createSignal, createEffect, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { Track } from '../../engine'
import { isNumericTrack, paddedRange, sampleCurve, easingToBezierPoints } from '../utils/curve-math'
import type { CubicBezierPoints } from '../../engine'
import { TIME_SCALE, TimeRuler } from './timeline-view'
import './curve-view.css'

interface CurveViewProps {
  store: EditorStore
}

/** Height of one track's curve lane, in px. */
const LANE_HEIGHT = 84
/** Samples per keyframe segment when drawing the eased curve. */
const SAMPLES = 24

interface CurveDrag {
  trackId: string
  index: number
  startClientX: number
  startClientY: number
  startTime: number
  startValue: number
  curTime: number
  curValue: number
  /** Value range frozen at drag start so the point tracks the cursor 1:1. */
  vmin: number
  vmax: number
}

/** Dragging one of the two cubic-bezier easing handles of a segment. */
interface HandleDrag {
  trackId: string
  /** Index of the keyframe whose incoming easing is being edited. */
  index: number
  /** 1 = handle near the previous keyframe (cp1); 2 = handle near this one (cp2). */
  which: 1 | 2
  points: CubicBezierPoints
  a: number // previous keyframe time
  b: number // this keyframe time
  av: number // previous keyframe value
  bv: number // this keyframe value
  vmin: number
  vmax: number
  areaLeft: number
  areaTop: number
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/**
 * Curve (graph) editor — an alternate to the dope sheet. Each numeric track
 * becomes a value-over-time curve, normalized to its own value range, with the
 * real easing sampled between keyframes. Keyframe points drag in 2D (time +
 * value); double-clicking an empty lane adds a keyframe. Non-numeric tracks
 * (colour, motion path, arrays) can't be drawn as a single curve and are noted
 * at the bottom.
 */
export const CurveView: Component<CurveViewProps> = (props) => {
  const pixelsPerMs = createMemo(() => TIME_SCALE * props.store.state.zoom)
  const duration = createMemo(() => props.store.duration())
  const tracks = createMemo(() => props.store.tracks())
  const numericTracks = createMemo(() => tracks().filter(isNumericTrack))
  const skippedCount = createMemo(() => tracks().length - numericTracks().length)

  const scroll = () => props.store.state.scrollPosition
  const contentWidth = () => Math.max(duration(), 5000) * pixelsPerMs()
  const timeToX = (t: number) => t * pixelsPerMs()
  const xToTime = (x: number) => x / pixelsPerMs()

  const [drag, setDrag] = createSignal<CurveDrag | null>(null)
  const [hDrag, setHDrag] = createSignal<HandleDrag | null>(null)

  const handleRulerClick = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left + scroll()
    props.store.seek(Math.max(0, xToTime(x)))
  }

  // ---- Value range (per track), padded so the curve breathes ----
  const rangeOf = (track: Track) => paddedRange(track.keyframes)

  const valueToY = (v: number, vmin: number, vmax: number) => {
    const span = vmax - vmin || 1
    return LANE_HEIGHT - ((v - vmin) / span) * LANE_HEIGHT
  }

  // ---- Keyframes as displayed (accounts for an in-progress point/handle drag) ----
  const displayKeyframes = (track: Track) => {
    let kfs = track.keyframes
    const d = drag()
    if (d && d.trackId === track.id) {
      kfs = kfs.map((kf, i) => (i === d.index ? { ...kf, time: d.curTime, value: d.curValue } : kf))
    }
    const h = hDrag()
    if (h && h.trackId === track.id) {
      kfs = kfs.map((kf, i) =>
        i === h.index ? { ...kf, easing: { type: 'cubic-bezier' as const, points: h.points } } : kf
      )
    }
    return kfs
  }

  /** Build the SVG path for a track's eased value curve. */
  const curvePath = (track: Track, vmin: number, vmax: number): string => {
    const pts = sampleCurve(displayKeyframes(track), Math.max(duration(), 5000), SAMPLES)
    if (pts.length === 0) return ''
    return pts
      .map(
        (pt, i) =>
          `${i === 0 ? 'M' : 'L'} ${timeToX(pt.time).toFixed(1)} ${valueToY(pt.value, vmin, vmax).toFixed(1)}`
      )
      .join(' ')
  }

  // ---- Keyframe point dragging (time + value) ----
  const onPointDown = (track: Track, index: number, e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const kf = track.keyframes[index]
    if (!kf) return

    props.store.selectTrack(track.id)

    // Ctrl/Cmd-click toggles multi-selection (no drag), matching the dope sheet.
    if (e.ctrlKey || e.metaKey) {
      props.store.toggleKeyframeSelection(track.id, index)
      return
    }
    if (!props.store.isKeyframeSelected(track.id, index)) {
      props.store.selectKeyframe(track.id, index)
    }

    const { vmin, vmax } = rangeOf(track)
    setDrag({
      trackId: track.id,
      index,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startTime: kf.time,
      startValue: kf.value as number,
      curTime: kf.time,
      curValue: kf.value as number,
      vmin,
      vmax,
    })
  }

  const onMove = (e: MouseEvent) => {
    const d = drag()
    if (!d) return
    const track = tracks().find((t) => t.id === d.trackId)
    if (!track) return

    // Time from horizontal movement, clamped between neighbours so keyframes
    // keep their order (and index) during the drag.
    const neighbours = track.keyframes
    const prev = neighbours[d.index - 1]
    const next = neighbours[d.index + 1]
    let newTime = Math.max(0, d.startTime + xToTime(e.clientX - d.startClientX))
    if (prev) newTime = Math.max(newTime, prev.time + 1)
    if (next) newTime = Math.min(newTime, next.time - 1)

    // Value from vertical movement (up = larger), using the frozen range.
    const perPx = (d.vmax - d.vmin) / LANE_HEIGHT
    const newValue = d.startValue - (e.clientY - d.startClientY) * perPx

    setDrag({ ...d, curTime: newTime, curValue: newValue })
  }

  const onUp = () => {
    const d = drag()
    if (!d) return
    if (d.curTime !== d.startTime || d.curValue !== d.startValue) {
      props.store.updateKeyframe(d.trackId, d.index, {
        time: Math.round(d.curTime),
        value: Math.round(d.curValue * 1000) / 1000,
      })
    }
    setDrag(null)
  }

  // ---- Easing-handle dragging (edits the segment's cubic-bezier) ----
  const onHandleDown = (track: Track, index: number, which: 1 | 2, e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const a = track.keyframes[index - 1]
    const b = track.keyframes[index]
    if (!a || !b) return

    props.store.selectTrack(track.id)
    props.store.selectKeyframe(track.id, index)

    const { vmin, vmax } = rangeOf(track)
    const areaEl = (e.currentTarget as SVGElement).closest('.curve-lane-area') as HTMLElement
    const rect = areaEl.getBoundingClientRect()
    setHDrag({
      trackId: track.id,
      index,
      which,
      points: [...easingToBezierPoints(b.easing)] as CubicBezierPoints,
      a: a.time,
      b: b.time,
      av: a.value as number,
      bv: b.value as number,
      vmin,
      vmax,
      areaLeft: rect.left,
      areaTop: rect.top,
    })
  }

  const onHandleMove = (e: MouseEvent) => {
    const h = hDrag()
    if (!h) return

    const timeAtMouse = xToTime(e.clientX - h.areaLeft + scroll())
    const dt = h.b - h.a || 1
    const nx = clamp01((timeAtMouse - h.a) / dt)

    const valueAtMouse = h.vmin + (1 - (e.clientY - h.areaTop) / LANE_HEIGHT) * (h.vmax - h.vmin)
    const dv = h.bv - h.av
    const prev = h.which === 1 ? h.points[1] : h.points[3]
    const ny = dv !== 0 ? (valueAtMouse - h.av) / dv : prev

    const points: CubicBezierPoints =
      h.which === 1 ? [nx, ny, h.points[2], h.points[3]] : [h.points[0], h.points[1], nx, ny]
    setHDrag({ ...h, points })
  }

  const onHandleUp = () => {
    const h = hDrag()
    if (!h) return
    const round = (n: number) => Math.round(n * 1000) / 1000
    props.store.updateKeyframe(h.trackId, h.index, {
      easing: {
        type: 'cubic-bezier',
        points: h.points.map(round) as CubicBezierPoints,
      },
    })
    setHDrag(null)
  }

  // A single set of window listeners drives whichever drag is active.
  const anyMove = (e: MouseEvent) => {
    if (drag()) onMove(e)
    else if (hDrag()) onHandleMove(e)
  }
  const anyUp = () => {
    if (drag()) onUp()
    else if (hDrag()) onHandleUp()
  }
  createEffect(() => {
    if (drag() || hDrag()) {
      window.addEventListener('mousemove', anyMove)
      window.addEventListener('mouseup', anyUp)
    } else {
      window.removeEventListener('mousemove', anyMove)
      window.removeEventListener('mouseup', anyUp)
    }
  })
  onCleanup(() => {
    window.removeEventListener('mousemove', anyMove)
    window.removeEventListener('mouseup', anyUp)
  })

  // Double-click an empty lane → add a keyframe at that (time, value).
  const onLaneDblClick = (track: Track, e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left + scroll()
    const y = e.clientY - rect.top
    const time = Math.max(0, Math.round(xToTime(x)))
    const { vmin, vmax } = rangeOf(track)
    const value = vmin + (1 - y / LANE_HEIGHT) * (vmax - vmin)
    props.store.selectTrack(track.id)
    props.store.addKeyframe(time, Math.round(value * 1000) / 1000)
  }

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))

  return (
    <div class="curve-view">
      {/* Shared ruler + playhead (same store, so it stays in sync with the dope sheet) */}
      <div class="timeline-ruler" onClick={handleRulerClick}>
        <TimeRuler duration={duration()} pixelsPerMs={pixelsPerMs()} scrollPosition={scroll()} />
        <div
          class="timeline-playhead"
          style={{ left: `${timeToX(props.store.currentTime()) - scroll()}px` }}
        />
      </div>

      <div class="curve-tracks">
        <Show
          when={numericTracks().length > 0}
          fallback={<div class="curve-empty">No numeric tracks to graph. Animate a value like x, opacity, scale or rotate to see its curve here.</div>}
        >
          <For each={numericTracks()}>
            {(track) => {
              const range = createMemo(() => {
                const d = drag()
                // While dragging this track, keep the frozen range so the point
                // tracks the cursor; otherwise recompute from the keyframes.
                if (d && d.trackId === track.id) return { vmin: d.vmin, vmax: d.vmax }
                return rangeOf(track)
              })
              const selected = () => props.store.state.selectedTrackId === track.id
              return (
                <div class="curve-lane" classList={{ selected: selected() }}>
                  <div class="curve-lane-label" onClick={() => props.store.selectTrack(track.id)}>
                    <span class="curve-target">{track.target}</span>
                    <span class="curve-property">{track.property}</span>
                    <span class="curve-range">
                      {fmt(range().vmax)}
                      <br />
                      {fmt(range().vmin)}
                    </span>
                  </div>
                  <div
                    class="curve-lane-area"
                    style={{ height: `${LANE_HEIGHT}px` }}
                    onDblClick={(e) => onLaneDblClick(track, e)}
                  >
                    <svg
                      class="curve-svg"
                      style={{ left: `${-scroll()}px`, width: `${contentWidth()}px`, height: `${LANE_HEIGHT}px` }}
                      width={contentWidth()}
                      height={LANE_HEIGHT}
                    >
                      {/* mid gridline */}
                      <line x1="0" y1={LANE_HEIGHT / 2} x2={contentWidth()} y2={LANE_HEIGHT / 2} class="curve-grid" />
                      <path d={curvePath(track, range().vmin, range().vmax)} class="curve-path" />
                      <For each={displayKeyframes(track)}>
                        {(kf, i) => {
                          const idx = i()
                          const kfs = () => displayKeyframes(track)
                          const yFor = (v: number) => valueToY(v, range().vmin, range().vmax)
                          // Easing handles show on the selected keyframe's incoming
                          // segment (the one whose easing this keyframe carries).
                          const showHandles = () =>
                            props.store.isKeyframeSelected(track.id, idx) && idx > 0
                          return (
                            <g>
                              <Show when={showHandles()}>
                                {(() => {
                                  const a = () => kfs()[idx - 1]
                                  const b = () => kfs()[idx]
                                  const pts = () => easingToBezierPoints(b().easing)
                                  const spanT = () => b().time - a().time
                                  const spanV = () => (b().value as number) - (a().value as number)
                                  const h1x = () => timeToX(a().time + spanT() * pts()[0])
                                  const h1y = () => yFor((a().value as number) + spanV() * pts()[1])
                                  const h2x = () => timeToX(a().time + spanT() * pts()[2])
                                  const h2y = () => yFor((a().value as number) + spanV() * pts()[3])
                                  return (
                                    <>
                                      <line
                                        class="curve-handle-line"
                                        x1={timeToX(a().time)}
                                        y1={yFor(a().value as number)}
                                        x2={h1x()}
                                        y2={h1y()}
                                      />
                                      <line
                                        class="curve-handle-line"
                                        x1={timeToX(b().time)}
                                        y1={yFor(b().value as number)}
                                        x2={h2x()}
                                        y2={h2y()}
                                      />
                                      <circle
                                        class="curve-handle"
                                        cx={h1x()}
                                        cy={h1y()}
                                        r={4}
                                        onMouseDown={(e) => onHandleDown(track, idx, 1, e)}
                                      />
                                      <circle
                                        class="curve-handle"
                                        cx={h2x()}
                                        cy={h2y()}
                                        r={4}
                                        onMouseDown={(e) => onHandleDown(track, idx, 2, e)}
                                      />
                                    </>
                                  )
                                })()}
                              </Show>
                              <circle
                                class="curve-point"
                                classList={{ selected: props.store.isKeyframeSelected(track.id, idx) }}
                                cx={timeToX(kf.time)}
                                cy={yFor(kf.value as number)}
                                r={5}
                                onMouseDown={(e) => onPointDown(track, idx, e)}
                              />
                            </g>
                          )
                        }}
                      </For>
                    </svg>
                    {/* playhead line across the lane */}
                    <div
                      class="curve-lane-playhead"
                      style={{ left: `${timeToX(props.store.currentTime()) - scroll()}px` }}
                    />
                  </div>
                </div>
              )
            }}
          </For>
        </Show>

        <Show when={skippedCount() > 0}>
          <div class="curve-note">
            {skippedCount()} track{skippedCount() === 1 ? '' : 's'} not shown (colour, motion-path or array values can't be graphed as a single curve). Use the Dope Sheet to edit those.
          </div>
        </Show>
      </div>
    </div>
  )
}

export default CurveView
