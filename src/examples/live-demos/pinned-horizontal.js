const panels = ['Discover', 'Design', 'Animate', 'Ship']
  .map((word, i) => `<div class="ph-panel" style="--hue:${210 + i * 40}"><span>0${i + 1}</span><strong>${word}</strong></div>`)
  .join('')

export const html = `<style>
  .ph-scroller { width: 260px; height: 180px; overflow-y: auto; border-radius: 8px; background: #111; color: #fff; font: 600 13px system-ui, sans-serif; }
  .ph-note { height: 90px; display: grid; place-items: center; color: #777; }
  .ph-section { height: 180px; overflow: hidden; position: relative; background: #161616; }
  .ph-track { display: flex; gap: 12px; height: 100%; padding: 24px 16px; box-sizing: border-box; width: max-content; }
  .ph-panel { width: 150px; border-radius: 10px; padding: 12px; box-sizing: border-box; font-size: 18px; background: linear-gradient(135deg, hsl(var(--hue) 80% 55%), hsl(calc(var(--hue) + 40) 70% 40%)); }
  .ph-panel span { display: block; font-size: 11px; opacity: 0.7; margin-bottom: 60px; }
  .ph-panel strong { display: inline-block; font-weight: 600; }
  .ph-bar { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%; background: #fff; transform-origin: 0 50%; transform: scaleX(0); }
</style>
<div class="ph-scroller">
  <div class="ph-note">Scroll down ↓</div>
  <section class="ph-section">
    <div class="ph-track">${panels}</div>
    <div class="ph-bar"></div>
  </section>
  <div class="ph-note">…and out again</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const section = root.querySelector('.ph-section')
  const track = root.querySelector('.ph-track')
  // How far the row of panels has to travel to show its last panel — a
  // function, so a resize or rotation measures it again.
  const distance = () => Math.max(0, track.scrollWidth - section.clientWidth)

  // Pin the section while vertical scrolling moves the panels sideways: one
  // pixel of scroll is one pixel of travel. scrub: 0.3 smooths it slightly, and
  // snap settles on a whole panel once scrolling stops.
  const panels = root.querySelectorAll('.ph-panel')
  const row = live
    .timeline({
      scrollTrigger: {
        trigger: section,
        scroller: '.ph-scroller', // the page itself in most sites; a box in this card
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 0.3,
        pin: true,
        snap: 1 / (panels.length - 1),
        invalidateOnRefresh: true, // rebuild the tweens with the new distance on resize
      },
    })
    .to(track, { x: () => -distance(), ease: 'none', duration: 1 })
    .to('.ph-bar', { scaleX: 1, ease: 'none', duration: 1 }, 0)

  // Each panel's title rises in as the moving row carries the panel into view:
  // containerAnimation measures these triggers along the row's sideways travel.
  panels.forEach((panel) => {
    live.fromTo(panel.querySelector('strong'), { y: 16, opacity: 0 }, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: panel,
        scroller: '.ph-scroller',
        containerAnimation: row,
        start: 'left 85%',
        toggleActions: 'play none none reverse',
      },
    })
  })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const pinnedHorizontal = {
  id: 'live-pinned-horizontal',
  name: 'Pinned Horizontal Scroll',
  description: 'Scroll inside the card: the section pins while its panels slide sideways, titles rise in as each panel arrives (containerAnimation), and it snaps to whole panels.',
  tags: ['scroll', 'scrollTrigger', 'pin', 'snap', 'containerAnimation'],
  // Travel distance and pinning come from real layout.
  requiresLayout: true,
  html,
  run,
}
