import { createSignal, createEffect, createMemo, onMount, onCleanup, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import { TimelineView, TIME_SCALE } from './timeline-view'
import { CurveView } from './curve-view'
import './timeline-panel.css'

interface TimelinePanelProps {
  store: EditorStore
}

type ViewMode = 'dope' | 'curves'

/** Width of the fixed track-label column (matches both views' CSS). */
const LABEL_W = 120
/** The ruler/tracks always span at least this many ms. */
const MIN_DURATION = 5000

/**
 * Timeline container with a Dope Sheet / Curves view switcher and shared
 * horizontal zoom + scroll.
 *
 * Both views read the same editor store (tracks, playhead, zoom, scroll,
 * selection), so the zoom controls and scrollbar here drive both — the dope
 * sheet is for timing, the curve editor for the shape of the motion (easing).
 */
export const TimelinePanel: Component<TimelinePanelProps> = (props) => {
  const [mode, setMode] = createSignal<ViewMode>('dope')

  let bodyRef: HTMLDivElement | undefined
  const [bodyWidth, setBodyWidth] = createSignal(800)

  onMount(() => {
    if (!bodyRef) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setBodyWidth(e.contentRect.width)
    })
    ro.observe(bodyRef)
    setBodyWidth(bodyRef.clientWidth)
    onCleanup(() => ro.disconnect())
  })

  const zoom = () => props.store.state.zoom
  const scroll = () => props.store.state.scrollPosition
  const duration = () => props.store.duration()
  const pixelsPerMs = () => TIME_SCALE * zoom()
  const contentWidth = () => Math.max(duration(), MIN_DURATION) * pixelsPerMs()
  /** Visible width of the scrollable track area (excludes the label column). */
  const viewportW = () => Math.max(0, bodyWidth() - LABEL_W)
  const maxScroll = () => Math.max(0, contentWidth() - viewportW())

  // Keep scroll within bounds when zoom / duration / width change.
  createEffect(() => {
    const clamped = Math.min(scroll(), maxScroll())
    if (clamped !== scroll()) props.store.setScrollPosition(clamped)
  })

  /** Zoom by a factor, keeping the time under `anchorClientX` fixed on screen. */
  const zoomBy = (factor: number, anchorClientX?: number) => {
    const trackLeft = (bodyRef?.getBoundingClientRect().left ?? 0) + LABEL_W
    const anchorX =
      anchorClientX !== undefined ? anchorClientX - trackLeft : viewportW() / 2
    const timeAtAnchor = (scroll() + anchorX) / pixelsPerMs()

    const nextZoom = Math.max(0.1, Math.min(10, zoom() * factor))
    props.store.setZoom(nextZoom)

    const nextPpm = TIME_SCALE * nextZoom
    props.store.setScrollPosition(timeAtAnchor * nextPpm - anchorX)
  }

  const fit = () => {
    props.store.setZoom(1)
    props.store.setScrollPosition(0)
  }

  const onWheel = (e: WheelEvent) => {
    // Ctrl/⌘ + wheel → zoom toward the cursor. Shift + wheel or a horizontal
    // wheel → pan. Plain vertical wheel is left to scroll the track list.
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      zoomBy(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX)
    } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (maxScroll() <= 0) return
      e.preventDefault()
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
      props.store.setScrollPosition(Math.min(maxScroll(), Math.max(0, scroll() + delta)))
    }
  }

  // ---- Horizontal scrollbar ----
  const hasScroll = () => maxScroll() > 0.5
  const thumb = createMemo(() => {
    const trackW = viewportW()
    const frac = Math.min(1, trackW / Math.max(1, contentWidth()))
    const width = Math.max(28, trackW * frac)
    const left = maxScroll() > 0 ? (scroll() / maxScroll()) * (trackW - width) : 0
    return { width, left, trackW }
  })

  const onThumbDown = (e: PointerEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startScroll = scroll()
    const { width, trackW } = thumb()
    const usable = trackW - width
    const onMove = (ev: PointerEvent) => {
      if (usable <= 0) return
      const deltaPx = ev.clientX - startX
      const deltaScroll = (deltaPx / usable) * maxScroll()
      props.store.setScrollPosition(Math.min(maxScroll(), Math.max(0, startScroll + deltaScroll)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const zoomPct = () => `${Math.round(zoom() * 100)}%`

  return (
    <div class="timeline-panel">
      <div class="timeline-panel-header">
        <div class="timeline-view-switch" role="tablist" aria-label="Timeline view">
          <button
            class="timeline-view-tab"
            classList={{ active: mode() === 'dope' }}
            onClick={() => setMode('dope')}
            role="tab"
            aria-selected={mode() === 'dope'}
            title="Dope sheet — keyframes and timing"
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor" />
            </svg>
            Dope Sheet
          </button>
          <button
            class="timeline-view-tab"
            classList={{ active: mode() === 'curves' }}
            onClick={() => setMode('curves')}
            role="tab"
            aria-selected={mode() === 'curves'}
            title="Curve editor — value over time and easing"
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path
                d="M3 20c6-1 5-14 11-14 3 0 4 3 7 3"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            Curves
          </button>
        </div>

        <div class="timeline-zoom" title="Zoom (Ctrl/⌘ + scroll)">
          <button class="timeline-zoom-btn" onClick={() => zoomBy(1 / 1.25)} title="Zoom out" aria-label="Zoom out">
            −
          </button>
          <button class="timeline-zoom-label" onClick={fit} title="Reset zoom & scroll">
            {zoomPct()}
          </button>
          <button class="timeline-zoom-btn" onClick={() => zoomBy(1.25)} title="Zoom in" aria-label="Zoom in">
            +
          </button>
        </div>
      </div>

      <div class="timeline-panel-body" ref={bodyRef} onWheel={onWheel}>
        <Show when={mode() === 'dope'} fallback={<CurveView store={props.store} />}>
          <TimelineView store={props.store} />
        </Show>
      </div>

      <Show when={hasScroll()}>
        <div class="timeline-scrollbar" style={{ 'padding-left': `${LABEL_W}px` }}>
          <div class="timeline-scrollbar-track">
            <div
              class="timeline-scrollbar-thumb"
              style={{ width: `${thumb().width}px`, left: `${thumb().left}px` }}
              onPointerDown={onThumbDown}
            />
          </div>
        </div>
      </Show>
    </div>
  )
}

export default TimelinePanel
