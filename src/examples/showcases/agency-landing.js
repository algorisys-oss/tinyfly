const work = [
  ['Tidal', 'Brand system & launch film', '#1f6feb', '#0ea5e9'],
  ['Orchard', 'E-commerce, 3D product views', '#f97316', '#facc15'],
  ['Lumen', 'Data storytelling microsite', '#8b5cf6', '#ec4899'],
  ['Basalt', 'Architecture portfolio', '#10b981', '#0f766e'],
]

const stats = [
  ['48', '', 'launches shipped'],
  ['12', 'M', 'monthly viewers'],
  ['97', '%', 'lighthouse, median'],
]

const services = [
  ['Motion systems', 'Timing, easing and choreography rules your whole product can share.', '<circle cx="24" cy="24" r="18"/><path d="M24 12 V24 L32 30"/>'],
  ['Interactive sites', 'Scroll stories, pinned sequences and layouts that rearrange with intent.', '<rect x="8" y="10" width="32" height="26" rx="3"/><path d="M8 18 H40 M16 42 H32"/>'],
  ['Brand in motion', 'Logos, type and illustration that move the way the brand speaks.', '<path d="M8 36 C 14 10, 34 10, 40 36"/><path d="M16 36 L24 20 L32 36"/>'],
]

const photos = [
  ['Studio', '#334155', '#64748b'],
  ['Workshop', '#7c2d12', '#ea580c'],
  ['Sketches', '#365314', '#84cc16'],
  ['Offsite', '#1e3a8a', '#60a5fa'],
  ['Launch night', '#581c87', '#d946ef'],
  ['Team', '#134e4a', '#2dd4bf'],
]

const words = ['Motion', 'Interaction', 'Scroll', 'Type', 'Brand', 'Craft']
const marqueeRun = words.map((w) => `<span>${w}</span><i>✦</i>`).join('')

export const html = `<style>
  .ag { --ink: #f2efe9; --muted: #8a877f; --bg: #0b0b0c; --line: #262626; --accent: #c6ff3d;
    background: var(--bg); color: var(--ink); font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; overflow-x: clip; }
  .ag * { box-sizing: border-box; }
  .ag h1, .ag h2, .ag p { margin: 0; }
  .ag a { color: inherit; }

  .ag-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center;
    padding: 18px clamp(16px, 4vw, 48px); mix-blend-mode: difference; }
  .ag-logo { font-weight: 800; letter-spacing: -0.02em; }
  .ag-nav-cta { text-decoration: none; border: 1px solid currentColor; border-radius: 999px; padding: 8px 16px; font-size: 14px; }

  .ag-hero { position: relative; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; gap: 28px;
    padding: 120px clamp(16px, 4vw, 48px) 48px; overflow: hidden; }
  .ag-blobs { position: absolute; inset: 0; width: 100%; height: 100%; }
  .ag-title { position: relative; font-size: clamp(44px, 9vw, 150px); line-height: 0.95; letter-spacing: -0.045em; font-weight: 800; max-width: 12ch; }
  .ag-title em { font-style: italic; font-weight: 300; color: var(--accent); }
  .ag-title .line-mask { padding-bottom: 0.08em; margin-bottom: -0.08em; }
  .ag-hero-foot { position: relative; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
  .ag-sub { max-width: 34ch; color: var(--muted); font-size: clamp(15px, 1.4vw, 19px); line-height: 1.5; }
  .ag-scroll { width: 22px; height: 64px; fill: none; stroke: var(--ink); stroke-width: 1.5; stroke-linecap: round; flex: none; }

  .ag-marquee { border-block: 1px solid var(--line); padding: 22px 0; overflow: hidden; white-space: nowrap; }
  .ag-marquee-track { display: inline-flex; align-items: center; gap: 36px; padding-right: 36px; font-size: clamp(32px, 5vw, 72px); font-weight: 700; letter-spacing: -0.03em; }
  .ag-marquee-track i { font-style: normal; color: var(--accent); font-size: 0.5em; }

  .ag-manifesto { padding: clamp(96px, 16vw, 200px) clamp(16px, 4vw, 48px); }
  .ag-manifesto-text { font-size: clamp(28px, 4.2vw, 64px); line-height: 1.15; letter-spacing: -0.03em; max-width: 22ch; font-weight: 600; }

  .ag-work { height: 100vh; overflow: hidden; display: flex; flex-direction: column; justify-content: center; gap: 28px; background: #111; }
  .ag-work-head { display: flex; justify-content: space-between; align-items: baseline; padding: 0 clamp(16px, 4vw, 48px); }
  .ag-work-head h2 { font-size: clamp(28px, 3.5vw, 48px); letter-spacing: -0.03em; }
  .ag-counter { font-variant-numeric: tabular-nums; color: var(--muted); }
  .ag-work-track { display: flex; gap: clamp(16px, 2vw, 28px); padding: 0 clamp(16px, 4vw, 48px); width: max-content; }
  .ag-card { width: min(78vw, 520px); flex: none; }
  .ag-card-frame { height: min(56vh, 380px); border-radius: 14px; overflow: hidden; }
  .ag-card-img { width: 100%; height: 100%; }
  .ag-card h3 { margin: 14px 0 4px; font-size: 22px; letter-spacing: -0.02em; }
  .ag-card p { color: var(--muted); }

  .ag-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; padding: clamp(80px, 12vw, 160px) clamp(16px, 4vw, 48px); border-bottom: 1px solid var(--line); }
  .ag-stat-value { font-size: clamp(56px, 8vw, 120px); font-weight: 800; letter-spacing: -0.05em; font-variant-numeric: tabular-nums; }
  .ag-stat-label { color: var(--muted); }

  .ag-services { padding: clamp(80px, 12vw, 160px) clamp(16px, 4vw, 48px); }
  .ag-services h2, .ag-gallery h2 { font-size: clamp(28px, 3.5vw, 48px); letter-spacing: -0.03em; margin-bottom: 40px; }
  .ag-service { display: grid; grid-template-columns: 56px 1fr 32px; gap: 24px; align-items: center; padding: 28px 0; border-top: 1px solid var(--line); cursor: default; }
  .ag-icon { width: 48px; height: 48px; fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .ag-service h3 { margin: 0 0 6px; font-size: clamp(22px, 2.4vw, 32px); letter-spacing: -0.02em; }
  .ag-service p { color: var(--muted); max-width: 52ch; }
  .ag-service-arrow { font-size: 28px; }

  .ag-gallery { padding: 0 clamp(16px, 4vw, 48px) clamp(80px, 12vw, 160px); }
  .ag-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap: 16px; }
  .ag-tile { aspect-ratio: 4 / 3; border-radius: 12px; cursor: zoom-in; display: flex; align-items: flex-end; padding: 14px; font-weight: 600; }
  .ag-lightbox { position: fixed; inset: 0; z-index: 30; background: rgba(8, 8, 9, 0.92); display: grid; place-items: center; padding: 24px; cursor: zoom-out; }
  .ag-lightbox[hidden] { display: none; }
  .ag-lightbox-inner { width: min(900px, 100%); }
  .ag-lightbox-img { aspect-ratio: 16 / 9; border-radius: 16px; }
  .ag-lightbox-caption { margin-top: 14px; font-size: 22px; font-weight: 600; }

  /* Reduced motion: no pinning; the work row scrolls sideways by hand. */
  .ag-reduced .ag-work { height: auto; padding-block: 80px; }
  .ag-reduced .ag-work-track { width: auto; overflow-x: auto; scroll-snap-type: x mandatory; }
  .ag-reduced .ag-card { scroll-snap-align: start; }

  .ag-contact { min-height: 90vh; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 32px; padding: 0 clamp(16px, 4vw, 48px); border-top: 1px solid var(--line); }
  .ag-big { font-size: clamp(64px, 16vw, 260px); font-weight: 800; letter-spacing: -0.06em; line-height: 0.9; }
  .ag .ag-magnet { display: inline-block; text-decoration: none; background: var(--accent); color: #0b0b0c; border-radius: 999px; padding: 22px 36px; font-size: clamp(16px, 2vw, 22px); font-weight: 700; }
</style>
<div class="ag">
  <nav class="ag-nav"><span class="ag-logo">north/studio</span><a class="ag-nav-cta" href="#contact">Start a project</a></nav>

  <header class="ag-hero">
    <canvas class="ag-blobs"></canvas>
    <h1 class="ag-title">We make brands move with <em>intent</em></h1>
    <div class="ag-hero-foot">
      <p class="ag-sub">An independent motion and interaction studio. We design how products feel the moment they move.</p>
      <svg class="ag-scroll" viewBox="0 0 22 64" aria-hidden="true"><path d="M11 2 V58 M4 51 L11 58 L18 51"/></svg>
    </div>
  </header>

  <div class="ag-marquee" aria-hidden="true"><div class="ag-marquee-track">${marqueeRun}${marqueeRun}</div></div>

  <section class="ag-manifesto">
    <p class="ag-manifesto-text">Great motion isn't decoration. It shows people where to look, what just changed and what they can do next — then gets out of the way.</p>
  </section>

  <section class="ag-work">
    <div class="ag-work-head"><h2>Selected work</h2><span class="ag-counter">01 / 0${work.length}</span></div>
    <div class="ag-work-track">${work
      .map(([name, what, a, b]) => `<article class="ag-card"><div class="ag-card-frame"><div class="ag-card-img" style="background: linear-gradient(135deg, ${a}, ${b})"></div></div><h3>${name}</h3><p>${what}</p></article>`)
      .join('')}</div>
  </section>

  <section class="ag-stats">${stats
    .map(([value, suffix, label]) => `<div><div class="ag-stat-value" data-value="${value}" data-suffix="${suffix}">0${suffix}</div><div class="ag-stat-label">${label}</div></div>`)
    .join('')}</section>

  <section class="ag-services">
    <h2 data-speed="0.85">What we do</h2>
    ${services
      .map(([title, body, icon]) => `<div class="ag-service"><svg class="ag-icon" viewBox="0 0 48 48" aria-hidden="true">${icon}</svg><div class="ag-service-body"><h3>${title}</h3><p>${body}</p></div><span class="ag-service-arrow" aria-hidden="true">→</span></div>`)
      .join('')}
  </section>

  <section class="ag-gallery">
    <h2 data-speed="0.8">Inside the studio</h2>
    <div class="ag-tiles">${photos
      .map(([name, a, b], i) => `<div class="ag-tile" data-flip-id="photo-${i}"${i % 3 === 1 ? ' data-lag="0.25"' : ''} style="background: linear-gradient(135deg, ${a}, ${b})">${name}</div>`)
      .join('')}</div>
    <div class="ag-lightbox" hidden><div class="ag-lightbox-inner"><div class="ag-lightbox-img"></div><div class="ag-lightbox-caption"></div></div></div>
  </section>

  <footer class="ag-contact" id="contact">
    <h2 class="ag-big">Let's talk</h2>
    <a class="ag-magnet" href="mailto:hello@example.com">hello@example.com</a>
  </footer>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const $ = (selector) => root.querySelector(selector)
  const $$ = (selector) => [...root.querySelectorAll(selector)]

  // Everything is set up per motion preference. When the preference changes,
  // matchMedia reverts the old setup (tweens, pins, split text, listeners) and
  // runs this again, so reduced motion is a real mode, not an afterthought.
  const mm = live.matchMedia()
  mm.add({ full: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
    const reduce = context.conditions.reduce
    const events = new AbortController() // removes every listener on revert
    const on = (target, type, handler) => target.addEventListener(type, handler, { signal: events.signal })
    root.classList.toggle('ag-reduced', reduce)

    // ── Smooth wheel scrolling, with parallax layers (data-speed / data-lag) ─
    // The page's real scroll position still moves, so every trigger and pin
    // below works unchanged. Touch, keys and the scrollbar stay native.
    if (!reduce) live.smoothScroll({ smooth: 0.9, effects: true })

    // ── Hero: headline lines rise from behind their own edge ───────────────
    // autoSplit re-measures the lines when the width changes. The intro plays
    // once; a later re-split just shows the new lines in place.
    let introPlayed = reduce
    live.splitText('.ag-title', {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => {
        if (introPlayed) return
        introPlayed = true
        return live.fromTo(self.lines, { y: 140, rotate: 4 }, { y: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 })
      },
    })

    const arrowLoop = live
      .timeline({ repeat: -1, repeatDelay: 0.3, paused: true })
      .fromTo('.ag-scroll path', { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 0.7, ease: 'power2.inOut' })
      .to('.ag-scroll path', { drawSVG: '100% 100%', duration: 0.7, ease: 'power2.inOut' })
    if (reduce) {
      live.set('.ag-scroll path', { drawSVG: true })
    } else {
      live.set('.ag-scroll path', { drawSVG: 0 })
      live.fromTo('.ag-sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, delay: 0.5, ease: 'power3.out', onComplete: () => arrowLoop.play() })

      // Scrolling away, the headline drifts down and fades: scrubbed, slightly smoothed.
      live
        .timeline({ scrollTrigger: { trigger: '.ag-hero', start: 'top top', end: 'bottom top', scrub: 0.6 } })
        .to('.ag-title', { y: 180, scale: 0.9, opacity: 0.15, ease: 'none', duration: 1 })
        .to('.ag-blobs', { opacity: 0, ease: 'none', duration: 1 }, 0)
    }

    // ── Hero background: a canvas drawn on the ticker, following the pointer
    const canvas = $('.ag-blobs')
    const ctx = canvas.getContext('2d')
    const pointer = { x: 0.7, y: 0.35 }
    const target = { x: 0.7, y: 0.35 }
    const drawBlobs = (time, deltaTime) => {
      if (!ctx) return
      // Ease toward the pointer by elapsed time, so it feels the same at any frame rate.
      const follow = 1 - Math.exp(-deltaTime / 350)
      pointer.x += (target.x - pointer.x) * follow
      pointer.y += (target.y - pointer.y) * follow

      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      const blobs = [
        [pointer.x, pointer.y, 0.42, 'rgba(198, 255, 61, 0.22)'],
        [0.25 + Math.sin(time * 0.4) * 0.08, 0.3 + Math.cos(time * 0.3) * 0.08, 0.5, 'rgba(99, 102, 241, 0.25)'],
        [0.8 + Math.cos(time * 0.35) * 0.06, 0.8, 0.45, 'rgba(236, 72, 153, 0.18)'],
      ]
      for (const [bx, by, radius, colour] of blobs) {
        const r = radius * Math.max(width, height)
        const gradient = ctx.createRadialGradient(bx * width, by * height, 0, bx * width, by * height, r)
        gradient.addColorStop(0, colour)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      }
    }
    // Size the canvas on resize, not every frame, so drawing never forces layout.
    const sizeCanvas = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      if (reduce) drawBlobs(0, 1000) // one still frame
    }
    sizeCanvas()
    on(window, 'resize', sizeCanvas)

    if (!reduce) {
      on(root, 'pointermove', (event) => {
        const box = canvas.getBoundingClientRect()
        target.x = (event.clientX - box.left) / box.width
        target.y = (event.clientY - box.top) / box.height
      })
      // Only draw while the hero is on screen.
      live.ticker.add(drawBlobs)
      live.scrollTrigger({
        trigger: '.ag-hero',
        start: 'top bottom',
        end: 'bottom top',
        onLeave: () => live.ticker.remove(drawBlobs),
        onEnterBack: () => live.ticker.add(drawBlobs),
      })
    }

    // ── Nav: hides scrolling down, returns scrolling up ────────────────────
    let navHidden = false
    live.scrollTrigger({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: ({ velocity }) => {
        const hide = velocity > 0 ? true : velocity < 0 ? false : navHidden
        if (hide === navHidden) return
        navHidden = hide
        context.add(() => live.to('.ag-nav', { y: hide ? -90 : 0, duration: reduce ? 0 : 0.4, ease: 'power3.out' }))
      },
    })

    // ── Marquee: loops, speeds up and leans with scroll velocity ───────────
    if (!reduce) {
      const marqueeTrack = $('.ag-marquee-track')
      const marquee = live
        .timeline({ repeat: -1 })
        .to(marqueeTrack, { x: () => -marqueeTrack.scrollWidth / 2, duration: 22, ease: 'none' })
      // Its distance depends on the font size, which follows the viewport width.
      on(window, 'resize', () => marquee.invalidate())
      // One reusable tween for the lean, re-targeted on every scroll update.
      const lean = live.quickTo(marqueeTrack, 'skewX', { duration: 0.5, ease: 'power3.out' })
      live.scrollTrigger({
        trigger: '.ag-marquee',
        onUpdate: ({ velocity }) => {
          marquee.timeScale(1 + Math.min(Math.abs(velocity) / 300, 8))
          lean(Math.max(-14, Math.min(14, -velocity / 150)))
        },
      })
    }

    // ── Manifesto: each word lights up as it scrolls through ───────────────
    if (!reduce) {
      const manifesto = live.splitText('.ag-manifesto-text', { type: 'words' })
      live
        .timeline({ scrollTrigger: { trigger: '.ag-manifesto', start: 'top 70%', end: 'bottom 55%', scrub: true } })
        .fromTo(manifesto.words, { opacity: 0.12 }, { opacity: 1, duration: 0.3, stagger: 0.1, ease: 'none' })
    }

    // ── Work: pinned while vertical scroll slides the cards sideways ───────
    // With reduced motion the row simply scrolls sideways (see .ag-reduced).
    if (!reduce) {
      const workSection = $('.ag-work')
      const workTrack = $('.ag-work-track')
      const cards = $$('.ag-card')
      const counter = $('.ag-counter')
      // A function, so a resize or rotation measures the new distance.
      const travel = () => Math.max(0, workTrack.scrollWidth - workSection.clientWidth)
      live
        .timeline({
          scrollTrigger: {
            trigger: workSection,
            start: 'top top',
            end: () => `+=${travel()}`,
            scrub: 0.5,
            pin: true,
            invalidateOnRefresh: true,
            onUpdate: ({ progress }) => {
              const index = Math.min(cards.length, 1 + Math.floor(progress * cards.length))
              counter.textContent = `0${index} / 0${cards.length}`
            },
          },
        })
        .to(workTrack, { x: () => -travel(), ease: 'none', duration: 1 })
        .fromTo($$('.ag-card-img'), { scale: 1.3 }, { scale: 1, ease: 'none', duration: 1 }, 0)
    }

    // ── Stats: plain objects count up once they come into view ─────────────
    $$('.ag-stat-value').forEach((element) => {
      const count = { value: 0 }
      live.to(count, {
        value: Number(element.dataset.value),
        duration: reduce ? 0 : 1.8,
        ease: 'power3.out',
        onUpdate: () => (element.textContent = `${Math.round(count.value)}${element.dataset.suffix}`),
        scrollTrigger: { trigger: element, start: 'top 85%', once: true },
      })
    })

    // ── Services: icons draw in, arrows spring on hover ────────────────────
    $$('.ag-service').forEach((item) => {
      if (reduce) return
      live
        .timeline({ scrollTrigger: { trigger: item, start: 'top 80%', toggleActions: 'play none none reverse' } })
        .fromTo(item.querySelectorAll('.ag-icon *'), { drawSVG: 0 }, { drawSVG: true, duration: 1, ease: 'power2.inOut', stagger: 0.15 })
        .fromTo(item.querySelector('.ag-service-body'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, 0.1)

      const arrow = item.querySelector('.ag-service-arrow')
      on(item, 'pointerenter', () => context.add(() => live.to(arrow, { x: 14, rotate: -45, spring: 'bouncy' })))
      on(item, 'pointerleave', () => context.add(() => live.to(arrow, { x: 0, rotate: 0, spring: 'snappy' })))
    })

    // ── Gallery: a tile grows into the lightbox (a different element) ──────
    const lightbox = $('.ag-lightbox')
    const lightboxImage = $('.ag-lightbox-img')
    const lightboxCaption = $('.ag-lightbox-caption')
    const flipDuration = reduce ? 0 : 0.7
    let openTile = null

    $$('.ag-tile').forEach((tile) => {
      on(tile, 'click', () => {
        if (openTile) return
        openTile = tile
        const state = live.getFlipState(tile)
        lightboxImage.dataset.flipId = tile.dataset.flipId
        lightboxImage.style.background = tile.style.background
        lightboxCaption.textContent = tile.textContent
        lightbox.hidden = false
        live.flipFrom(state, { targets: lightboxImage, fade: true, duration: flipDuration, ease: 'power3.inOut' })
      })
    })

    const closeLightbox = () => {
      if (!openTile) return
      const tile = openTile
      openTile = null
      const state = live.getFlipState(lightboxImage)
      lightbox.hidden = true
      live.flipFrom(state, { targets: tile, fade: true, duration: flipDuration * 0.8, ease: 'power3.inOut' })
    }
    on(lightbox, 'click', closeLightbox)
    on(window, 'keydown', (event) => event.key === 'Escape' && closeLightbox())

    // ── Contact: letters bounce in on springs; the button is magnetic ──────
    if (!reduce) {
      const big = live.splitText('.ag-big', { type: 'chars' })
      live.fromTo(
        big.chars,
        { y: 160, rotate: 14 },
        { y: 0, rotate: 0, spring: 'bouncy', stagger: 0.04, scrollTrigger: { trigger: '.ag-contact', start: 'top 65%' } }
      )

      // Springs that re-target on every move and keep their momentum.
      const magnet = $('.ag-magnet')
      const magnetX = live.quickTo(magnet, 'x', { spring: 'snappy' })
      const magnetY = live.quickTo(magnet, 'y', { spring: 'snappy' })
      on(magnet, 'pointermove', (event) => {
        // Measured from the layout box (offset*), so the pull does not feed back on itself.
        const centreX = magnet.offsetLeft + magnet.offsetWidth / 2
        const centreY = magnet.offsetTop + magnet.offsetHeight / 2
        const box = magnet.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 }
        magnetX((event.clientX - box.left - centreX) * 0.35)
        magnetY((event.clientY - box.top - centreY) * 0.35)
      })
      on(magnet, 'pointerleave', () => {
        magnetX(0)
        magnetY(0)
      })
    }

    return () => {
      events.abort()
      root.classList.remove('ag-reduced')
    }
  })
  // #endregion code

  return () => mm.revert()
}

/** @type {import('../live-demos/types').LiveDemo} */
export const agencyLanding = {
  id: 'agency-landing',
  name: 'Agency Landing Page',
  description:
    'A full-page, award-site-style landing: smooth scrolling with parallax, masked headline reveal, pointer-lit canvas, velocity marquee, scroll-lit manifesto, pinned horizontal work that survives resizes, count-ups, drawn icons, a shared-element lightbox and springy type — with a real reduced-motion mode.',
  tags: ['smoothScroll', 'scrollTrigger', 'pin', 'splitText', 'drawSVG', 'spring', 'flip', 'ticker', 'matchMedia', 'invalidateOnRefresh'],
  html,
  run,
}
