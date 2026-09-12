import { createSignal, createEffect, onCleanup, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import { ScrollDriver } from '../../drivers'
import './scroll-preview.css'

/**
 * Scroll-scrub preview.
 *
 * Attaches a real `ScrollDriver` to the editor's timeline and gives it a real
 * scrollable strip to measure against. That matters: the preview is not a
 * simulation of scroll behaviour, it is the shipped driver running against the
 * shipped geometry, so what an author tunes here is what runs on their page.
 *
 * While it is on, normal playback is paused — scroll position is the only thing
 * moving the playhead, exactly as it would be in production.
 */

interface ScrollPreviewProps {
  store: EditorStore
}

/** Trigger positions offered in the dropdowns, matching the driver's grammar. */
const START_PRESETS = ['top bottom', 'top center', 'top top', 'center bottom', 'center center']
const END_PRESETS = ['bottom top', 'center top', 'bottom bottom', 'top top+=500', 'top top+=1000']

export const ScrollPreview: Component<ScrollPreviewProps> = (props) => {
  let scrollerRef: HTMLDivElement | undefined
  let triggerRef: HTMLDivElement | undefined

  const [start, setStart] = createSignal(START_PRESETS[0])
  const [end, setEnd] = createSignal(END_PRESETS[0])
  const [smoothing, setSmoothing] = createSignal(0)
  const [progress, setProgress] = createSignal(0)
  /** How much room above and below the trigger, as a multiple of the strip height. */
  const [runway, setRunway] = createSignal(1.5)

  // Rebuild the driver whenever a setting that it reads at construction changes.
  createEffect(() => {
    const timeline = props.store.state.timeline
    if (!timeline || !scrollerRef || !triggerRef) return

    // Read the settings so this effect re-runs when they change.
    const config = { start: start(), end: end(), scrub: smoothing() > 0 ? smoothing() : true }
    runway() // relayout changes geometry, so re-measure too

    const driver = new ScrollDriver({
      timeline,
      trigger: triggerRef,
      scroller: scrollerRef,
      start: config.start,
      end: config.end,
      scrub: config.scrub,
      onUpdate: (value) => {
        setProgress(value)
        // The driver seeks the timeline itself; the editor's readouts follow a
        // signal, so mirror it across.
        props.store.syncPlayheadFromTimeline()
      },
    })

    driver.start()
    onCleanup(() => driver.destroy())
  })

  const percent = () => `${Math.round(progress() * 100)}%`

  /** Jump the strip to a fraction of its scrollable height. */
  const scrollTo = (fraction: number) => {
    if (!scrollerRef) return
    const max = scrollerRef.scrollHeight - scrollerRef.clientHeight
    scrollerRef.scrollTop = max * fraction
  }

  return (
    <div class="scroll-preview">
      <div class="scroll-preview-controls">
        <label>
          <span>Start</span>
          <select value={start()} onChange={(e) => setStart(e.currentTarget.value)}>
            {START_PRESETS.map((preset) => (
              <option value={preset}>{preset}</option>
            ))}
          </select>
        </label>

        <label>
          <span>End</span>
          <select value={end()} onChange={(e) => setEnd(e.currentTarget.value)}>
            {END_PRESETS.map((preset) => (
              <option value={preset}>{preset}</option>
            ))}
          </select>
        </label>

        <label title="0 tracks scroll exactly; higher values ease the playhead toward it">
          <span>Scrub</span>
          <select value={String(smoothing())} onChange={(e) => setSmoothing(Number(e.currentTarget.value))}>
            <option value="0">exact</option>
            <option value="0.2">0.2s</option>
            <option value="0.5">0.5s</option>
            <option value="1">1s</option>
          </select>
        </label>

        <label title="Space above and below the trigger, as a multiple of the strip height">
          <span>Runway</span>
          <select value={String(runway())} onChange={(e) => setRunway(Number(e.currentTarget.value))}>
            <option value="0.5">short</option>
            <option value="1.5">medium</option>
            <option value="3">long</option>
          </select>
        </label>

        <span class="scroll-progress" title="Scroll progress through the active range">
          {percent()}
        </span>
      </div>

      <div class="scroll-preview-body">
        <div class="scroll-strip" ref={scrollerRef}>
          <div class="scroll-runway" style={{ height: `${runway() * 100}%` }} />
          <div class="scroll-trigger" ref={triggerRef}>
            <span>trigger</span>
          </div>
          <div class="scroll-runway" style={{ height: `${runway() * 100}%` }} />
        </div>

        <div class="scroll-preview-hints">
          <p>
            Scroll the strip to scrub. This runs the same <code>ScrollDriver</code> your
            page would, so the start/end triggers behave identically.
          </p>
          <div class="scroll-jumps">
            <button onClick={() => scrollTo(0)}>Top</button>
            <button onClick={() => scrollTo(0.5)}>Middle</button>
            <button onClick={() => scrollTo(1)}>Bottom</button>
          </div>
          <Show when={props.store.duration() === 0}>
            <p class="scroll-warn">This scene has no duration yet, so there is nothing to scrub.</p>
          </Show>
          <pre class="scroll-snippet">{`new ScrollDriver({
  timeline,
  trigger,
  start: '${start()}',
  end: '${end()}',
  scrub: ${smoothing() > 0 ? smoothing() : true},
}).start()`}</pre>
        </div>
      </div>
    </div>
  )
}
