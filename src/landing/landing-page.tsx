import { createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { A, Navigate, useSearchParams } from '@solidjs/router'
import { startLandingMotion } from './landing-motion'
import { createPlayground, DEFAULT_SNIPPET } from './playground'
import { hasSavedWork } from './saved-work'
import { copyText } from '../examples/copy-code-button'
import { BrandMark } from '../components/brand-mark'
import './landing-page.css'

/**
 * tinyfly.app's front page: what tinyfly is, shown with tinyfly. The editor lives
 * at /studio; this page only loads the live runtime, not the editor.
 */

const SCRIPT_TAG = `<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v${__APP_VERSION__}/cdn/tinyfly.iife.js"></script>`

const STEPS = [
  {
    title: 'A deterministic engine',
    body: 'Timelines, tracks and keyframes are plain JSON. The same input gives the same frame, in a browser, a worker or a video export.',
  },
  {
    title: 'A visual editor',
    body: 'Keyframes, springs, text effects, motion paths and shape morphs, with DOM, Canvas and SVG previews. No code needed.',
  },
  {
    title: 'A GSAP-style API',
    body: 'live.to(), timelines, scroll triggers with pinning, split text, drawSVG, Flip and springs, for sites that move like award winners.',
  },
  {
    title: 'Export anywhere',
    body: 'Embed the player, or export GIF, WebP, MP4, sprite sheets, Lottie and CSS. The animation is the data, so it travels.',
  },
]

const GALLERY = [
  { name: 'Agency Landing Page', href: '/showcase/agency-landing', tone: '#c6ff3d' },
  { name: 'Pinned horizontal scroll', href: '/examples/live-pinned-horizontal', tone: '#4a9eff' },
  { name: 'Line mask reveal', href: '/examples/live-line-mask-reveal', tone: '#f59e0b' },
  { name: 'Shared element gallery', href: '/examples/live-shared-element-gallery', tone: '#ec4899' },
  { name: 'Spring release', href: '/examples/live-spring-release', tone: '#8b5cf6' },
  { name: 'Shape morphing', href: '/examples/live-shape-morph', tone: '#10b981' },
  { name: 'Scramble text', href: '/examples/live-scramble-text', tone: '#ef4444' },
  { name: 'Flip layouts', href: '/examples/live-flip-shuffle', tone: '#0ea5e9' },
]

export const LandingPage: Component = () => {
  const [params] = useSearchParams<{ example?: string }>()
  const [savedWork, setSavedWork] = createSignal(false)
  const [copied, setCopied] = createSignal(false)
  const [code, setCode] = createSignal(DEFAULT_SNIPPET)
  const [json, setJson] = createSignal('')
  const [error, setError] = createSignal<string | undefined>()
  let page: HTMLDivElement | undefined
  let preview: HTMLDivElement | undefined

  onMount(() => {
    hasSavedWork().then(setSavedWork)
    if (!page || !preview) return

    const stopMotion = startLandingMotion(page)
    const playground = createPlayground(preview)
    let timer: number | undefined
    const run = (source: string) => {
      const result = playground.run(source)
      setJson(result.json)
      setError(result.error)
    }
    run(code())

    onCleanup(() => {
      window.clearTimeout(timer)
      playground.destroy()
      stopMotion()
    })

    // Re-run shortly after typing stops.
    editCode = (source: string) => {
      setCode(source)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => run(source), 350)
    }
  })

  let editCode = (source: string): void => {
    setCode(source)
  }

  const copyScriptTag = async () => {
    try {
      await copyText(SCRIPT_TAG)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Show
      // Old links to the editor were `/?example=…`; send them on.
      when={!params.example}
      fallback={<Navigate href={`/studio?example=${encodeURIComponent(params.example ?? '')}`} />}
    >
      <div class="lp" ref={page}>
        <nav class="lp-nav">
          <A href="/" class="lp-logo" aria-label="tinyfly home">
            <BrandMark size={30} />
          </A>
          <div class="lp-nav-links">
            <A href="/learn">Learn</A>
            <A href="/examples">Examples</A>
            <A href="/showcase/agency-landing">Showcase</A>
            <A href="/docs">Docs</A>
            <a href="https://github.com/algorisys-oss/tinyfly" target="_blank" rel="noopener">
              GitHub
            </a>
            <A href="/studio" class="lp-nav-cta">
              Open the editor
            </A>
          </div>
        </nav>

        <header class="lp-hero">
          <canvas class="lp-flies" aria-hidden="true" />
          <h1 class="lp-title">
            Motion, <em>as data.</em>
          </h1>
          <p class="lp-lede lp-hero-reveal">
            A tiny, deterministic animation engine with a visual editor and a GSAP-style API. Build it in the
            editor or in code; it plays the same everywhere.
          </p>
          <div class="lp-actions lp-hero-reveal">
            <Show
              when={savedWork()}
              fallback={
                <A href="/studio" class="lp-button lp-button-primary">
                  Open the editor
                </A>
              }
            >
              <A href="/studio" class="lp-button lp-button-primary">
                Continue where you left off
              </A>
            </Show>
            <A href="/examples" class="lp-button">
              Browse examples
            </A>
          </div>
          <button class="lp-script lp-hero-reveal" onClick={copyScriptTag} title="Copy the script tag">
            <code>{SCRIPT_TAG}</code>
            <span class="lp-script-copy">{copied() ? 'Copied' : 'Copy'}</span>
          </button>
        </header>

        <section class="lp-section lp-code" aria-labelledby="lp-code-title">
          <div class="lp-section-head" data-reveal>
            <span class="lp-kicker">Try it</span>
            <h2 id="lp-code-title">Code becomes motion, and motion is data.</h2>
            <p>Edit the code. The preview updates, and so does the JSON it compiles to.</p>
          </div>
          <div class="lp-code-grid" data-reveal>
            <label class="lp-editor">
              <span class="lp-pane-label">live.js</span>
              <textarea
                spellcheck={false}
                aria-label="Animation code"
                value={code()}
                onInput={(event) => editCode(event.currentTarget.value)}
              />
            </label>
            <div class="lp-preview-pane">
              <span class="lp-pane-label">Preview</span>
              <div class="lp-preview" ref={preview} aria-label="Animation preview" />
              <Show when={error()}>
                <p class="lp-error" role="status">
                  {error()}
                </p>
              </Show>
            </div>
            <div class="lp-json-pane">
              <span class="lp-pane-label">Compiled JSON</span>
              <pre class="lp-json">{json()}</pre>
            </div>
          </div>
        </section>

        <section class="lp-story" aria-label="What tinyfly is">
          <ol class="lp-steps">
            <For each={STEPS}>
              {(step, i) => (
                <li class="lp-step">
                  <span class="lp-step-number">0{i() + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              )}
            </For>
          </ol>
          <div class="lp-panels" aria-hidden="true">
            <div class="lp-panel lp-panel-engine">
              <pre>{`{
  "id": "hero",
  "tracks": [{
    "target": "title",
    "property": "y",
    "keyframes": [
      { "time": 0, "value": 40 },
      { "time": 800, "value": 0,
        "easing": "ease-out-cubic" }
    ]
  }]
}`}</pre>
              <div class="lp-track">
                <span class="lp-key" style={{ left: '0%' }} />
                <span class="lp-key" style={{ left: '55%' }} />
                <span class="lp-key" style={{ left: '100%' }} />
                <span class="lp-playhead" />
              </div>
            </div>
            <div class="lp-panel lp-panel-editor">
              <div class="lp-window">
                <div class="lp-window-bar">
                  <i />
                  <i />
                  <i />
                </div>
                <div class="lp-window-stage">
                  <span class="lp-ball" />
                </div>
                <div class="lp-window-tracks">
                  <For each={['x', 'y', 'scale']}>
                    {(name) => (
                      <div class="lp-row">
                        <span>{name}</span>
                        <i class="lp-chip" />
                        <i class="lp-chip" />
                        <i class="lp-chip" />
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
            <div class="lp-panel lp-panel-api">
              <For each={['live.to()', 'scrollTrigger', 'pin', 'splitText', 'drawSVG', 'spring', 'Flip', 'quickTo', 'matchMedia']}>
                {(name) => <span class="lp-chip lp-tag">{name}</span>}
              </For>
            </div>
            <div class="lp-panel lp-panel-export">
              <For each={['GIF', 'WebP', 'MP4', 'Lottie', 'CSS', 'Sprite sheet', 'JSON', 'Embed']}>
                {(name) => <span class="lp-chip lp-file">{name}</span>}
              </For>
            </div>
          </div>
        </section>

        <section class="lp-strip" aria-label="Examples">
          <div class="lp-section-head" data-reveal>
            <span class="lp-kicker">Gallery</span>
            <h2>Made with tinyfly.</h2>
          </div>
          <div class="lp-strip-viewport">
            <div class="lp-strip-track">
              <For each={[...GALLERY, ...GALLERY]}>
                {(item) => (
                  <A href={item.href} class="lp-card" style={{ '--tone': item.tone }}>
                    <span class="lp-card-art" />
                    <span class="lp-card-name">{item.name}</span>
                  </A>
                )}
              </For>
            </div>
          </div>
        </section>

        <section class="lp-numbers" aria-label="In numbers">
          <div data-reveal>
            <strong>
              <span data-count="16">16</span> KB
            </strong>
            <span>engine, gzipped</span>
          </div>
          <div data-reveal>
            <strong>
              <span data-count="0">0</span>
            </strong>
            <span>runtime dependencies</span>
          </div>
          <div data-reveal>
            <strong>
              <span data-count="3">3</span>
            </strong>
            <span>browser engines tested</span>
          </div>
          <div data-reveal>
            <strong>MIT</strong>
            <span>open source</span>
          </div>
        </section>

        <footer class="lp-closing">
          <h2 class="lp-closing-title">Start animating.</h2>
          <A href="/studio" class="lp-magnet">
            Open the editor
          </A>
          <div class="lp-footer-links">
            <A href="/learn">Learn</A>
            <A href="/examples">Examples</A>
            <A href="/docs">Docs</A>
            <A href="/docs/gsap-compat">GSAP-style API</A>
            <a href="https://github.com/algorisys-oss/tinyfly" target="_blank" rel="noopener">
              GitHub
            </a>
            <a href="/llms.txt">llms.txt</a>
            <span>v{__APP_VERSION__}</span>
          </div>
        </footer>
      </div>
    </Show>
  )
}

export default LandingPage
