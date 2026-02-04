import { createSignal, For, onCleanup, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { A } from '@solidjs/router'
import { deserializeTimeline } from '../engine'
import type { Timeline } from '../engine'
import { DOMAdapter } from '../adapters/dom'
import { CanvasAdapter } from '../adapters/canvas'
import { galleryExamples, type GalleryExample } from './gallery-examples'
import './gallery.css'

type RendererType = 'dom' | 'canvas'

interface ExampleCardProps {
  example: GalleryExample
}

const ExampleCard: Component<ExampleCardProps> = (props) => {
  let containerRef: HTMLDivElement | undefined
  let canvasRef: HTMLCanvasElement | undefined
  let animationFrameId: number | undefined

  const [isPlaying, setIsPlaying] = createSignal(false)
  const [renderer, setRenderer] = createSignal<RendererType>('dom')
  const [timeline, setTimeline] = createSignal<Timeline | null>(null)

  // Initialize timeline from example definition
  const initTimeline = () => {
    const tl = deserializeTimeline(props.example.timeline)
    setTimeline(tl)
    return tl
  }

  // DOM Adapter animation loop
  const runDomAnimation = (tl: Timeline) => {
    const adapter = new DOMAdapter()

    // Register all elements with data-tinyfly attribute
    if (containerRef) {
      const elements = containerRef.querySelectorAll('[data-tinyfly]')
      elements.forEach((el) => {
        const target = el.getAttribute('data-tinyfly')
        if (target) {
          adapter.registerTarget(target, el as HTMLElement)
        }
      })
    }

    const animate = () => {
      if (!isPlaying()) return

      tl.tick(16.67)
      const state = tl.getStateAtTime(tl.currentTime)
      adapter.applyState(state)

      animationFrameId = requestAnimationFrame(animate)
    }

    tl.play()
    setIsPlaying(true)
    animate()
  }

  // Canvas Adapter animation loop
  const runCanvasAnimation = (tl: Timeline) => {
    if (!canvasRef) return

    const ctx = canvasRef.getContext('2d')
    if (!ctx) return

    const adapter = new CanvasAdapter()

    // Register canvas targets from example
    const targets = props.example.canvasTargets || []
    targets.forEach((target) => {
      adapter.registerTarget(target.name, target)
    })

    const animate = () => {
      if (!isPlaying()) return

      tl.tick(16.67)
      const state = tl.getStateAtTime(tl.currentTime)

      // Clear and render
      ctx.clearRect(0, 0, canvasRef!.width, canvasRef!.height)

      // Fill background
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvasRef!.width, canvasRef!.height)

      adapter.applyState(state)
      adapter.render(ctx)

      animationFrameId = requestAnimationFrame(animate)
    }

    tl.play()
    setIsPlaying(true)
    animate()
  }

  const handlePlay = () => {
    if (isPlaying()) {
      // Stop animation
      setIsPlaying(false)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      const tl = timeline()
      if (tl) {
        tl.stop()
      }
    } else {
      // Start animation
      let tl = timeline()
      if (!tl) {
        tl = initTimeline()
      }
      tl.seek(0)

      if (renderer() === 'dom') {
        runDomAnimation(tl)
      } else {
        runCanvasAnimation(tl)
      }
    }
  }

  const handleRendererChange = (newRenderer: RendererType) => {
    // Stop current animation
    if (isPlaying()) {
      setIsPlaying(false)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
    const tl = timeline()
    if (tl) {
      tl.stop()
      tl.seek(0)
    }
    setRenderer(newRenderer)
  }

  onCleanup(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  })

  return (
    <div class="example-card">
      <div class="example-header">
        <h3>{props.example.name}</h3>
        <span class="example-category">{props.example.category}</span>
      </div>

      <p class="example-description">{props.example.description}</p>

      <div class="example-preview">
        <Show when={renderer() === 'dom'}>
          <div ref={containerRef} class="preview-container dom-preview" innerHTML={props.example.domHtml} />
        </Show>
        <Show when={renderer() === 'canvas'}>
          <canvas ref={canvasRef} class="preview-canvas" width={280} height={180} />
        </Show>
      </div>

      <div class="example-controls">
        <div class="renderer-toggle">
          <button
            class="renderer-btn"
            classList={{ active: renderer() === 'dom' }}
            onClick={() => handleRendererChange('dom')}
          >
            DOM
          </button>
          <button
            class="renderer-btn"
            classList={{ active: renderer() === 'canvas' }}
            onClick={() => handleRendererChange('canvas')}
          >
            Canvas
          </button>
        </div>

        <button class="play-btn" onClick={handlePlay}>
          {isPlaying() ? 'Stop' : 'Play'}
        </button>
      </div>

      <div class="example-tags">
        <For each={props.example.tags}>
          {(tag) => <span class="tag">{tag}</span>}
        </For>
      </div>
    </div>
  )
}

export const Gallery: Component = () => {
  const [selectedCategory, setSelectedCategory] = createSignal<string>('all')
  const [searchQuery, setSearchQuery] = createSignal('')

  const categories = () => {
    const cats = new Set<string>()
    galleryExamples.forEach((ex) => cats.add(ex.category))
    return ['all', ...Array.from(cats)]
  }

  const filteredExamples = () => {
    let examples = galleryExamples

    // Filter by category
    if (selectedCategory() !== 'all') {
      examples = examples.filter((ex) => ex.category === selectedCategory())
    }

    // Filter by search
    const query = searchQuery().toLowerCase()
    if (query) {
      examples = examples.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.description.toLowerCase().includes(query) ||
          ex.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    return examples
  }

  return (
    <div class="gallery-page">
      <header class="gallery-header">
        <div class="header-content">
          <div class="header-left">
            <A href="/" class="back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Editor
            </A>
            <h1>Animation Gallery</h1>
          </div>
          <p class="header-subtitle">Professional animation examples built with tinyfly</p>
        </div>
      </header>

      <div class="gallery-filters">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search animations..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>

        <div class="category-filters">
          <For each={categories()}>
            {(category) => (
              <button
                class="category-btn"
                classList={{ active: selectedCategory() === category }}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All' : category}
              </button>
            )}
          </For>
        </div>
      </div>

      <main class="gallery-grid">
        <For each={filteredExamples()}>
          {(example) => <ExampleCard example={example} />}
        </For>

        <Show when={filteredExamples().length === 0}>
          <div class="no-results">
            <p>No animations found matching your criteria</p>
          </div>
        </Show>
      </main>

      <footer class="gallery-footer">
        <p>
          Built with <strong>tinyfly</strong> - A lightweight, API-driven animation engine
        </p>
        <A href="/" class="cta-btn">
          Create Your Own Animation
        </A>
      </footer>
    </div>
  )
}

export default Gallery
