import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { Timeline, Clock } from '../engine'
import { DOMAdapter } from '../adapters/dom/dom-adapter'
import './splash.css'

interface SplashProps {
  duration?: number
  onComplete?: () => void
}

export function Splash(props: SplashProps) {
  const [visible, setVisible] = createSignal(true)
  const [exiting, setExiting] = createSignal(false)

  const duration = props.duration ?? 3000

  let containerRef: HTMLDivElement | undefined
  let logoRef: HTMLDivElement | undefined
  let taglineRef: HTMLDivElement | undefined
  let fly1Ref: HTMLDivElement | undefined
  let fly2Ref: HTMLDivElement | undefined
  let fly3Ref: HTMLDivElement | undefined
  let hintRef: HTMLDivElement | undefined

  let clock: Clock | undefined
  let timeline: Timeline | undefined
  let exitTimeline: Timeline | undefined
  let exitClock: Clock | undefined
  let dismissTimeout: ReturnType<typeof setTimeout> | undefined

  const dismiss = () => {
    if (exiting()) return
    setExiting(true)

    if (dismissTimeout) clearTimeout(dismissTimeout)
    if (clock) clock.stop()

    // Create exit animation
    const adapter = new DOMAdapter()
    if (containerRef) adapter.registerTarget('container', containerRef)

    exitTimeline = new Timeline({
      id: 'exit',
      tracks: [
        {
          id: 'fade-out',
          target: 'container',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 1 },
            { time: 400, value: 0, easing: 'ease-out' }
          ]
        }
      ]
    })

    exitTimeline.onUpdate = (state) => adapter.applyState(state)
    exitTimeline.onComplete = () => {
      setVisible(false)
      props.onComplete?.()
    }

    exitClock = new Clock()
    exitClock.onTick = (delta) => exitTimeline?.tick(delta)
    exitTimeline.play()
    exitClock.start()
  }

  onMount(() => {
    const adapter = new DOMAdapter()

    // Register all animated elements
    if (logoRef) adapter.registerTarget('logo', logoRef)
    if (taglineRef) adapter.registerTarget('tagline', taglineRef)
    if (fly1Ref) adapter.registerTarget('fly1', fly1Ref)
    if (fly2Ref) adapter.registerTarget('fly2', fly2Ref)
    if (fly3Ref) adapter.registerTarget('fly3', fly3Ref)
    if (hintRef) adapter.registerTarget('hint', hintRef)

    // Create entrance animation timeline
    timeline = new Timeline({
      id: 'splash-entrance',
      tracks: [
        // Logo animation - scale up and fade in
        {
          id: 'logo-scale',
          target: 'logo',
          property: 'scale',
          keyframes: [
            { time: 0, value: 0.3 },
            { time: 600, value: 1.05, easing: 'ease-out' },
            { time: 800, value: 1, easing: 'ease-in-out' }
          ]
        },
        {
          id: 'logo-opacity',
          target: 'logo',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 400, value: 1, easing: 'ease-out' }
          ]
        },
        {
          id: 'logo-y',
          target: 'logo',
          property: 'y',
          keyframes: [
            { time: 0, value: 30 },
            { time: 600, value: 0, easing: 'ease-out' }
          ]
        },

        // Tagline animation - slide up and fade in
        {
          id: 'tagline-opacity',
          target: 'tagline',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 400, value: 0 },
            { time: 800, value: 1, easing: 'ease-out' }
          ]
        },
        {
          id: 'tagline-y',
          target: 'tagline',
          property: 'y',
          keyframes: [
            { time: 0, value: 20 },
            { time: 400, value: 20 },
            { time: 800, value: 0, easing: 'ease-out' }
          ]
        },

        // Flying particles - staggered orbital animation
        {
          id: 'fly1-opacity',
          target: 'fly1',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 300, value: 0 },
            { time: 500, value: 1, easing: 'ease-out' }
          ]
        },
        {
          id: 'fly1-x',
          target: 'fly1',
          property: 'x',
          keyframes: [
            { time: 300, value: -80 },
            { time: 1500, value: 80, easing: 'ease-in-out' },
            { time: 2700, value: -80, easing: 'ease-in-out' }
          ]
        },
        {
          id: 'fly1-y',
          target: 'fly1',
          property: 'y',
          keyframes: [
            { time: 300, value: 0 },
            { time: 900, value: -40, easing: 'ease-in-out' },
            { time: 1500, value: 0, easing: 'ease-in-out' },
            { time: 2100, value: 40, easing: 'ease-in-out' },
            { time: 2700, value: 0, easing: 'ease-in-out' }
          ]
        },

        {
          id: 'fly2-opacity',
          target: 'fly2',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 400, value: 0 },
            { time: 600, value: 1, easing: 'ease-out' }
          ]
        },
        {
          id: 'fly2-x',
          target: 'fly2',
          property: 'x',
          keyframes: [
            { time: 400, value: 60 },
            { time: 1400, value: -60, easing: 'ease-in-out' },
            { time: 2400, value: 60, easing: 'ease-in-out' }
          ]
        },
        {
          id: 'fly2-y',
          target: 'fly2',
          property: 'y',
          keyframes: [
            { time: 400, value: -30 },
            { time: 1000, value: 30, easing: 'ease-in-out' },
            { time: 1600, value: -30, easing: 'ease-in-out' },
            { time: 2200, value: 30, easing: 'ease-in-out' }
          ]
        },

        {
          id: 'fly3-opacity',
          target: 'fly3',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 500, value: 0 },
            { time: 700, value: 1, easing: 'ease-out' }
          ]
        },
        {
          id: 'fly3-x',
          target: 'fly3',
          property: 'x',
          keyframes: [
            { time: 500, value: 0 },
            { time: 1300, value: 70, easing: 'ease-in-out' },
            { time: 2100, value: -70, easing: 'ease-in-out' },
            { time: 2900, value: 0, easing: 'ease-in-out' }
          ]
        },
        {
          id: 'fly3-y',
          target: 'fly3',
          property: 'y',
          keyframes: [
            { time: 500, value: 50 },
            { time: 1100, value: -20, easing: 'ease-in-out' },
            { time: 1700, value: 50, easing: 'ease-in-out' },
            { time: 2300, value: -20, easing: 'ease-in-out' }
          ]
        },

        // Hint text animation
        {
          id: 'hint-opacity',
          target: 'hint',
          property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 1200, value: 0 },
            { time: 1600, value: 0.6, easing: 'ease-out' }
          ]
        }
      ],
      config: {
        loop: -1 // Infinite loop for particle animation
      }
    })

    timeline.onUpdate = (state) => adapter.applyState(state)

    // Start the animation
    clock = new Clock()
    clock.onTick = (delta) => timeline?.tick(delta)
    timeline.play()
    clock.start()

    // Auto-dismiss after duration
    dismissTimeout = setTimeout(dismiss, duration)
  })

  onCleanup(() => {
    if (clock) clock.stop()
    if (exitClock) exitClock.stop()
    if (dismissTimeout) clearTimeout(dismissTimeout)
  })

  return (
    <Show when={visible()}>
      <div
        ref={containerRef}
        class="splash-container"
        onClick={dismiss}
      >
        <div class="splash-content">
          {/* Animated flying particles */}
          <div ref={fly1Ref} class="splash-fly splash-fly-1" />
          <div ref={fly2Ref} class="splash-fly splash-fly-2" />
          <div ref={fly3Ref} class="splash-fly splash-fly-3" />

          {/* Logo */}
          <div ref={logoRef} class="splash-logo">
            <span class="splash-logo-tiny">tiny</span>
            <span class="splash-logo-fly">fly</span>
          </div>

          {/* Tagline */}
          <div ref={taglineRef} class="splash-tagline">
            Lightweight Animation Engine
          </div>
        </div>

        {/* Click hint */}
        <div ref={hintRef} class="splash-hint">
          Click anywhere to continue
        </div>

        {/* Status bar */}
        <div class="splash-status-bar">
          <div class="splash-status-left">
            <span class="splash-version">v{__APP_VERSION__}</span>
          </div>
          <div class="splash-status-right">
            Developed with <span class="splash-heart">&#9829;</span> by{' '}
            <a
              href="https://github.com/algorisys-oss/tinyfly"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Algorisys OSS Team
            </a>
          </div>
        </div>
      </div>
    </Show>
  )
}
