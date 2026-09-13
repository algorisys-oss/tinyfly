import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { A, useNavigate, useSearchParams } from '@solidjs/router'
import { deserializeTimeline } from '../engine'
import type { Timeline } from '../engine'
import { DOMAdapter } from '../adapters/dom'
import { CanvasAdapter } from '../adapters/canvas'
import { createLive, Stage } from '../compat/gsap'
import {
  examples,
  exampleCategories,
  exampleKindLabels,
  filterExamples,
  type CodeCatalogExample,
  type EditableExample,
  type Example,
  type LiveCatalogExample,
  type ExampleCategory,
  type ExampleKind,
} from './example-catalog'
import { buildSamplePreview } from './sample-preview'
import { CopyCodeButton } from './copy-code-button'
import { BrandMark } from '../components/brand-mark'
import { editableExamplePage, liveDemoPage, showcasePage, timelineExamplePage } from './standalone-page'
import { showcases } from './showcases'
import markupCss from './code-examples.css?raw'
import './code-examples.css'
import './examples-page.css'

/** Size of the preview area on a card (see `.example-preview`). */
const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = 180

/**
 * Drive a timeline from requestAnimationFrame, looping, until stopped.
 * Returns the stop function.
 */
function loopTimeline(timeline: Timeline, apply: (timeline: Timeline) => void): () => void {
  let frameId: number | null = null
  let last: number | null = null

  const frame = (now: number) => {
    if (last !== null) timeline.tick(now - last)
    last = now
    if (timeline.playbackState === 'idle') {
      timeline.stop()
      timeline.play()
    }
    apply(timeline)
    frameId = requestAnimationFrame(frame)
  }

  timeline.stop()
  timeline.play()
  frameId = requestAnimationFrame(frame)

  return () => {
    if (frameId !== null) cancelAnimationFrame(frameId)
    frameId = null
  }
}

const CardHeader: Component<{ example: Example }> = (props) => {
  const categoryLabel = () =>
    exampleCategories.find((c) => c.id === props.example.category)?.label ?? props.example.category
  return (
    <>
      <div class="example-header">
        <h3>
          <A href={`/examples/${props.example.id}`} class="example-title-link">
            {props.example.name}
          </A>
        </h3>
        <div class="example-badges">
          <span class="example-kind" classList={{ 'kind-code': props.example.kind === 'code' }}>
            {props.example.kind === 'code' ? 'Code' : 'Editable'}
          </span>
          <span class="example-category">{categoryLabel()}</span>
        </div>
      </div>
      <p class="example-description">{props.example.description}</p>
    </>
  )
}

/**
 * An example made in the editor. Shows a still frame; plays while hovered (or
 * after Play, for touch screens). "Open in editor" loads it into a new project.
 */
/** `single`: shown on its own page, so it plays straight away rather than on hover. */
interface CardProps {
  single?: boolean
}

const EditableExampleCard: Component<{ example: EditableExample } & CardProps> = (props) => {
  const navigate = useNavigate()
  let stageRef: HTMLDivElement | undefined
  let adapter: DOMAdapter | undefined
  let stopLoop: (() => void) | null = null

  const preview = buildSamplePreview(props.example.sample)
  const scale = Math.min(PREVIEW_WIDTH / preview.width, PREVIEW_HEIGHT / preview.height)
  const [isPlaying, setIsPlaying] = createSignal(false)

  /** A mid-animation frame reads better as a still than frame 0, which is often empty. */
  const showPoster = () => {
    if (!adapter) return
    const { timeline } = preview
    timeline.stop()
    timeline.seek(timeline.duration / 2)
    adapter.applyState(timeline.getStateAtTime(timeline.currentTime))
  }

  const play = () => {
    if (!adapter || stopLoop) return
    const target = adapter
    stopLoop = loopTimeline(preview.timeline, (tl) => target.applyState(tl.getStateAtTime(tl.currentTime)))
    setIsPlaying(true)
  }

  const stop = () => {
    stopLoop?.()
    stopLoop = null
    setIsPlaying(false)
    showPoster()
  }

  onMount(() => {
    if (!stageRef) return
    adapter = new DOMAdapter()
    stageRef.querySelectorAll('[data-tinyfly]').forEach((node) => {
      const name = node.getAttribute('data-tinyfly')
      if (name) adapter!.registerTarget(name, node as HTMLElement)
    })
    showPoster()
    if (props.single) play()
  })

  onCleanup(() => stopLoop?.())

  return (
    <div class="example-card" onMouseEnter={play} onMouseLeave={() => !props.single && stop()}>
      <CardHeader example={props.example} />

      <div class="example-preview">
        <div class="sample-stage-frame">
          <div
            class="sample-stage-clip"
            style={{ width: `${preview.width * scale}px`, height: `${preview.height * scale}px` }}
          >
            <div
              ref={stageRef}
              class="sample-stage"
              style={{
                width: `${preview.width}px`,
                height: `${preview.height}px`,
                transform: `scale(${scale})`,
              }}
              innerHTML={preview.html}
            />
          </div>
        </div>
        <Show when={!isPlaying()}>
          <span class="preview-hint">hover to play</span>
        </Show>
      </div>

      <div class="example-controls">
        <button class="secondary-btn" onClick={() => (isPlaying() ? stop() : play())}>
          {isPlaying() ? 'Stop' : 'Play'}
        </button>
        <div class="example-controls-right">
          <CopyCodeButton getCode={() => editableExamplePage(props.example.sample)} />
          <button class="open-btn" onClick={() => navigate(`/studio?example=${encodeURIComponent(props.example.id)}`)}>
            Open in editor
          </button>
        </div>
      </div>
    </div>
  )
}

type RendererType = 'dom' | 'canvas'

/**
 * An example for your own page: a timeline plus the markup it animates. Plays
 * on DOM or Canvas, and shows the JSON and HTML to copy.
 */
const CodeExampleCard: Component<{ example: CodeCatalogExample } & CardProps> = (props) => {
  const code = props.example.code
  let containerRef: HTMLDivElement | undefined
  let canvasRef: HTMLCanvasElement | undefined
  let stopLoop: (() => void) | null = null

  const [renderer, setRenderer] = createSignal<RendererType>('dom')
  const [isPlaying, setIsPlaying] = createSignal(false)
  const timeline = deserializeTimeline(code.timeline)
  const timelineJson = JSON.stringify(code.timeline, null, 2)

  const playDom = () => {
    const adapter = new DOMAdapter()
    containerRef?.querySelectorAll('[data-tinyfly]').forEach((el) => {
      const target = el.getAttribute('data-tinyfly')
      if (target) adapter.registerTarget(target, el as HTMLElement)
    })
    return loopTimeline(timeline, (tl) => adapter.applyState(tl.getStateAtTime(tl.currentTime)))
  }

  const playCanvas = () => {
    const ctx = canvasRef?.getContext('2d')
    if (!canvasRef || !ctx) return () => {}
    const canvas = canvasRef
    const adapter = new CanvasAdapter()
    for (const target of code.canvasTargets ?? []) adapter.registerTarget(target.name, target)

    return loopTimeline(timeline, (tl) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      adapter.applyState(tl.getStateAtTime(tl.currentTime))
      adapter.render(ctx)
    })
  }

  const stop = () => {
    stopLoop?.()
    stopLoop = null
    timeline.stop()
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (isPlaying()) return stop()
    stopLoop = renderer() === 'dom' ? playDom() : playCanvas()
    setIsPlaying(true)
  }

  const switchRenderer = (next: RendererType) => {
    stop()
    setRenderer(next)
  }

  onMount(() => props.single && togglePlay())
  onCleanup(() => stopLoop?.())

  return (
    <div class="example-card">
      <CardHeader example={props.example} />

      <div class="example-preview">
        <Show when={renderer() === 'dom'}>
          <div ref={containerRef} class="preview-container dom-preview" innerHTML={code.domHtml} />
        </Show>
        <Show when={renderer() === 'canvas'}>
          <canvas ref={canvasRef} class="preview-canvas" width={280} height={180} />
        </Show>
      </div>

      <div class="example-controls">
        <div class="renderer-toggle">
          <button class="renderer-btn" classList={{ active: renderer() === 'dom' }} onClick={() => switchRenderer('dom')}>
            DOM
          </button>
          <button
            class="renderer-btn"
            classList={{ active: renderer() === 'canvas' }}
            onClick={() => switchRenderer('canvas')}
          >
            Canvas
          </button>
        </div>
        <div class="example-controls-right">
          <CopyCodeButton getCode={() => timelineExamplePage(code, markupCss)} />
          <button class="play-btn" onClick={togglePlay}>
            {isPlaying() ? 'Stop' : 'Play'}
          </button>
        </div>
      </div>

      <div class="example-tags">
        <For each={code.tags}>{(tag) => <span class="tag">{tag}</span>}</For>
      </div>

      <details class="example-code">
        <summary>View code</summary>
        <h4>Timeline JSON</h4>
        <pre>{timelineJson}</pre>
        <h4>HTML</h4>
        <pre>{code.domHtml.trim()}</pre>
      </details>

      {/* Scroll examples loop here because a card is too small to scroll in.
          The snippet is how you drive the same timeline from scroll position. */}
      <Show when={code.driverSnippet}>
        <details class="example-driver">
          <summary>Drive it from scroll</summary>
          <pre>{code.driverSnippet}</pre>
        </details>
      </Show>
    </div>
  )
}

/**
 * A GSAP-style example: real `live` code running on the card. It starts when
 * the pointer enters (or on Play) and is torn down completely when it leaves —
 * the stage destroyed and the markup reset — so every run starts clean.
 */
const LiveExampleCard: Component<{ example: LiveCatalogExample } & CardProps> = (props) => {
  const demo = props.example.demo
  let stageRef: HTMLDivElement | undefined
  let teardown: (() => void) | null = null
  const [isRunning, setIsRunning] = createSignal(false)

  const start = () => {
    if (!stageRef || teardown) return
    const root = stageRef
    // A stage scoped to this card: selectors in the demo match only in here.
    const stage = new Stage({ root })
    const cleanup = demo.run(createLive(stage), root)
    teardown = () => {
      cleanup?.()
      stage.destroy()
      root.innerHTML = demo.html
    }
    setIsRunning(true)
  }

  const stop = () => {
    teardown?.()
    teardown = null
    setIsRunning(false)
  }

  onMount(() => props.single && start())
  onCleanup(() => teardown?.())

  return (
    <div class="example-card" onMouseEnter={start} onMouseLeave={() => !props.single && stop()}>
      <CardHeader example={props.example} />

      <div class="example-preview">
        <div ref={stageRef} class="live-demo-stage" innerHTML={demo.html} />
        <Show when={!isRunning()}>
          <span class="preview-hint">hover to run</span>
        </Show>
      </div>

      <div class="example-controls">
        <button class="secondary-btn" onClick={() => (isRunning() ? stop() : start())}>
          {isRunning() ? 'Stop' : 'Run'}
        </button>
        <CopyCodeButton getCode={() => liveDemoPage(demo)} />
      </div>

      <div class="example-tags">
        <For each={demo.tags}>{(tag) => <span class="tag">{tag}</span>}</For>
      </div>

      <details class="example-code" open>
        <summary>Code</summary>
        <p class="example-code-note">
          <code>live</code> is <code>import {'{ live }'} from 'tinyfly/gsap-compat'</code>, or the{' '}
          <code>tinyfly</code> global from the script bundle (<code>tinyfly.to</code>, <code>tinyfly.timeline</code>).
        </p>
        <pre>{demo.code}</pre>
        <h4>HTML</h4>
        <pre>{demo.html.trim()}</pre>
      </details>
    </div>
  )
}

/** The right card for an example's kind. */
export const ExampleCard: Component<{ example: Example } & CardProps> = (props) => {
  const example = props.example
  return example.kind === 'editable' ? (
    <EditableExampleCard example={example} single={props.single} />
  ) : example.format === 'live' ? (
    <LiveExampleCard example={example} single={props.single} />
  ) : (
    <CodeExampleCard example={example} single={props.single} />
  )
}

const KIND_OPTIONS: (ExampleKind | 'all')[] = ['all', 'editable', 'code']

export const ExamplesPage: Component = () => {
  // Filters live in the URL, so a filtered view can be linked to.
  const [params, setParams] = useSearchParams<{ category?: string; kind?: string; q?: string }>()

  const category = () => (params.category as ExampleCategory | undefined) ?? 'all'
  const kind = () => (params.kind as ExampleKind | undefined) ?? 'all'
  const query = () => params.q ?? ''

  const byKind = createMemo(() => filterExamples(examples, { kind: kind(), query: query() }))
  const visible = createMemo(() => filterExamples(byKind(), { category: category() }))

  /** Only categories with something in them for the current kind and search. */
  const categories = createMemo(() =>
    exampleCategories.filter((c) => byKind().some((example) => example.category === c.id))
  )

  const countFor = (value: ExampleKind | 'all') => filterExamples(examples, { kind: value, query: query() }).length

  return (
    <div class="examples-page">
      <header class="examples-header">
        <div class="header-content">
          <div class="header-left">
            <A href="/" class="examples-brand" title="tinyfly home">
              <BrandMark size={28} wordmark={<span class="examples-wordmark">tinyfly</span>} />
            </A>
            <A href="/studio" class="back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Editor
            </A>
            <h1>Examples</h1>
          </div>
          <p class="header-subtitle">
            Open an example in the editor to change it, or copy the code into your own page.
          </p>
        </div>
      </header>

      <div class="examples-filters">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search examples..."
            value={query()}
            onInput={(e) => setParams({ q: e.currentTarget.value || undefined }, { replace: true })}
          />
        </div>

        <div class="kind-filters" role="group" aria-label="Example type">
          <For each={KIND_OPTIONS}>
            {(option) => (
              <button
                class="kind-btn"
                classList={{ active: kind() === option }}
                aria-pressed={kind() === option}
                onClick={() => setParams({ kind: option === 'all' ? undefined : option, category: undefined })}
              >
                {option === 'all' ? 'All' : exampleKindLabels[option]}
                <span class="kind-count">{countFor(option)}</span>
              </button>
            )}
          </For>
        </div>

        <div class="category-filters">
          <button
            class="category-btn"
            classList={{ active: category() === 'all' }}
            onClick={() => setParams({ category: undefined })}
          >
            All
          </button>
          <For each={categories()}>
            {(option) => (
              <button
                class="category-btn"
                classList={{ active: category() === option.id }}
                onClick={() => setParams({ category: option.id })}
              >
                {option.label}
              </button>
            )}
          </For>
        </div>
      </div>

      <Show when={!query() && category() === 'all' && kind() !== 'editable'}>
        <section class="showcase-band" aria-label="Full-page showcases">
          <For each={showcases}>
            {(showcase) => (
              <div class="showcase-card">
                <div class="showcase-card-text">
                  <span class="showcase-card-label">Full-page showcase</span>
                  <h2>{showcase.name}</h2>
                  <p>{showcase.description}</p>
                  <div class="example-tags">
                    <For each={showcase.tags}>{(tag) => <span class="tag">{tag}</span>}</For>
                  </div>
                </div>
                <div class="showcase-card-actions">
                  <A href={`/showcase/${showcase.id}`} class="cta-btn">
                    Open the page
                  </A>
                  <CopyCodeButton getCode={() => showcasePage(showcase)} />
                </div>
              </div>
            )}
          </For>
        </section>
      </Show>

      <main class="examples-grid">
        <For each={visible()}>
          {(example) => <ExampleCard example={example} />}
        </For>

        <Show when={visible().length === 0}>
          <div class="no-results">
            <p>No examples match these filters</p>
          </div>
        </Show>
      </main>

      <footer class="examples-footer">
        <p>
          Built with <strong>tinyfly</strong> - A lightweight, API-driven animation engine
        </p>
        <A href="/studio" class="cta-btn">
          Create Your Own Animation
        </A>
      </footer>
    </div>
  )
}

export default ExamplesPage
