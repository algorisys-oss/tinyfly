import { createLive, Stage } from '../compat/gsap'

/**
 * All of the landing page's motion, built with tinyfly's own GSAP-style API, the
 * way a site using tinyfly would build it. It runs under `matchMedia`, so reduced
 * motion is a real mode, and everything is reverted when the page unmounts.
 *
 * Returns the cleanup.
 */
export function startLandingMotion(root: HTMLElement): () => void {
  const stage = new Stage({ root })
  const live = createLive(stage)
  const $ = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)
  const $$ = <T extends Element = HTMLElement>(selector: string) => [...root.querySelectorAll<T>(selector)]

  const mm = live.matchMedia()
  mm.add({ full: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
    const reduce = context.conditions.reduce
    const events = new AbortController()
    const on = (target: EventTarget, type: string, handler: (event: Event) => void) =>
      target.addEventListener(type, handler, { signal: events.signal })
    root.classList.toggle('lp-reduced', reduce)

    // ── Hero ───────────────────────────────────────────────────────────────
    let introPlayed = reduce
    live.splitText('.lp-title', {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => {
        if (introPlayed) return
        introPlayed = true
        return live.fromTo(self.lines, { y: 120, rotate: 3 }, { y: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 })
      },
    })
    if (!reduce) {
      live.fromTo(
        '.lp-hero-reveal',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.45, stagger: 0.1, ease: 'power3.out' }
      )
    }

    // Fireflies: a canvas drawn on the ticker, drifting toward the pointer. The
    // pointer is a plain object moved by quickTo; the ticker reads it each frame.
    const canvas = $<HTMLCanvasElement>('.lp-flies')
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      const attractor = { x: 0.7, y: 0.4 }
      const followX = live.quickTo(attractor, 'x', { duration: 1.6, ease: 'power3.out' })
      const followY = live.quickTo(attractor, 'y', { duration: 1.6, ease: 'power3.out' })
      const flies = Array.from({ length: 42 }, (_, i) => ({
        orbit: 0.04 + ((i * 37) % 100) / 100 * 0.32,
        speed: 0.15 + ((i * 53) % 100) / 100 * 0.5,
        phase: (i * 2.399) % (Math.PI * 2),
        size: 1 + ((i * 29) % 100) / 100 * 2.2,
      }))

      const size = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = canvas.clientWidth * ratio
        canvas.height = canvas.clientHeight * ratio
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        if (reduce) draw(0)
      }
      const draw = (time: number) => {
        const width = canvas.clientWidth
        const height = canvas.clientHeight
        ctx.clearRect(0, 0, width, height)
        for (const fly of flies) {
          const angle = fly.phase + time * fly.speed
          const reach = fly.orbit * Math.min(width, height)
          const x = attractor.x * width + Math.cos(angle) * reach * 1.6
          const y = attractor.y * height + Math.sin(angle * 1.3) * reach
          const glow = 0.45 + 0.55 * Math.sin(time * 2 + fly.phase)
          ctx.beginPath()
          ctx.arc(x, y, fly.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(198, 255, 61, ${0.25 + glow * 0.6})`
          ctx.shadowBlur = 12
          ctx.shadowColor = 'rgba(198, 255, 61, 0.8)'
          ctx.fill()
        }
      }
      size()
      on(window, 'resize', size)

      if (!reduce) {
        on($('.lp-hero')!, 'pointermove', (event) => {
          const box = canvas.getBoundingClientRect()
          const pointer = event as PointerEvent
          followX((pointer.clientX - box.left) / box.width)
          followY((pointer.clientY - box.top) / box.height)
        })
        const tick = (time: number) => draw(time)
        live.ticker.add(tick)
        live.scrollTrigger({
          trigger: '.lp-hero',
          start: 'top bottom',
          end: 'bottom top',
          onLeave: () => live.ticker.remove(tick),
          onEnterBack: () => live.ticker.add(tick),
        })
        live
          .timeline({ scrollTrigger: { trigger: '.lp-hero', start: 'top top', end: 'bottom top', scrub: 0.5 } })
          .to('.lp-title', { y: 120, opacity: 0.2, ease: 'none', duration: 1 })
          .to(canvas, { opacity: 0, ease: 'none', duration: 1 }, 0)
      }
    }

    // ── Nav: hides scrolling down, returns scrolling up ────────────────────
    let navHidden = false
    const navY = live.quickTo('.lp-nav', 'y', { duration: reduce ? 0.01 : 0.35, ease: 'power3.out' })
    live.scrollTrigger({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: ({ velocity, progress }) => {
        const hide = progress > 0.02 && (velocity > 0 ? true : velocity < 0 ? false : navHidden)
        if (hide === navHidden) return
        navHidden = hide
        navY(hide ? -96 : 0)
      },
    })

    // ── Section reveals ────────────────────────────────────────────────────
    if (!reduce) {
      for (const element of $$('[data-reveal]')) {
        live.fromTo(
          element,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 85%', once: true } }
        )
      }
    }

    // ── Story: pinned while four steps play through ────────────────────────
    const steps = $$('.lp-step')
    const panels = $$('.lp-panel')
    if (!reduce && steps.length) {
      const story = live.timeline({
        scrollTrigger: {
          trigger: '.lp-story',
          start: 'top top',
          end: () => `+=${window.innerHeight * 3}`,
          scrub: 0.4,
          pin: true,
          invalidateOnRefresh: true,
        },
      })
      // Inside the timeline, so the tweens below start from these values.
      story.set(panels.slice(1), { opacity: 0, y: 30 }, 0).set(steps.slice(1), { opacity: 0.35 }, 0)
      steps.forEach((_, i) => {
        if (i === 0) {
          story.to('.lp-playhead', { x: () => ($('.lp-track')?.clientWidth ?? 200) - 12, ease: 'none', duration: 1 })
          return
        }
        const at = `step${i}`
        story
          .addLabel(at)
          .to(panels[i - 1], { opacity: 0, y: -30, duration: 0.4 }, at)
          .to(steps[i - 1], { opacity: 0.35, duration: 0.4 }, at)
          .to(panels[i], { opacity: 1, y: 0, duration: 0.4 }, at)
          .to(steps[i], { opacity: 1, duration: 0.4 }, at)
          .fromTo(panels[i].querySelectorAll('.lp-chip'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out' }, `${at}+=0.2`)
          .to({}, { duration: 0.6 })
      })
    }

    // ── Gallery marquee: leans with scroll speed ───────────────────────────
    const strip = $('.lp-strip-track')
    if (strip && !reduce) {
      const loop = live.timeline({ repeat: -1 }).to(strip, { x: () => -strip.scrollWidth / 2, duration: 40, ease: 'none' })
      on(window, 'resize', () => loop.invalidate())
      const lean = live.quickTo(strip, 'skewX', { duration: 0.5, ease: 'power3.out' })
      live.scrollTrigger({
        trigger: '.lp-strip',
        onUpdate: ({ velocity }) => {
          loop.timeScale(1 + Math.min(Math.abs(velocity) / 250, 6))
          lean(Math.max(-10, Math.min(10, -velocity / 180)))
        },
      })
    }

    // ── Numbers count up from plain objects ────────────────────────────────
    for (const element of $$('[data-count]')) {
      const count = { value: 0 }
      const decimals = Number(element.dataset.decimals ?? 0)
      live.to(count, {
        value: Number(element.dataset.count),
        duration: reduce ? 0 : 1.6,
        ease: 'power3.out',
        onUpdate: () => (element.textContent = count.value.toFixed(decimals)),
        scrollTrigger: { trigger: element, start: 'top 90%', once: true },
      })
    }

    // ── Closing: letters spring in; the button is magnetic ─────────────────
    if (!reduce) {
      const big = live.splitText('.lp-closing-title', { type: 'chars' })
      live.fromTo(
        big.chars,
        { y: 140, rotate: 10 },
        { y: 0, rotate: 0, spring: 'bouncy', stagger: 0.035, scrollTrigger: { trigger: '.lp-closing', start: 'top 70%' } }
      )
      const magnet = $('.lp-magnet')
      if (magnet) {
        const pullX = live.quickTo(magnet, 'x', { spring: 'snappy' })
        const pullY = live.quickTo(magnet, 'y', { spring: 'snappy' })
        on(magnet, 'pointermove', (event) => {
          const pointer = event as PointerEvent
          const parent = (magnet.offsetParent ?? document.body).getBoundingClientRect()
          pullX((pointer.clientX - parent.left - (magnet.offsetLeft + magnet.offsetWidth / 2)) * 0.3)
          pullY((pointer.clientY - parent.top - (magnet.offsetTop + magnet.offsetHeight / 2)) * 0.3)
        })
        on(magnet, 'pointerleave', () => {
          pullX(0)
          pullY(0)
        })
      }
    }

    return () => {
      events.abort()
      root.classList.remove('lp-reduced')
    }
  })

  return () => {
    mm.revert()
    stage.destroy()
  }
}
