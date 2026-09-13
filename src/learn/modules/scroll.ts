import type { CheckContext, Module } from '../types'
import { custom, valueIs } from '../checks'

/**
 * Module 7: scroll. The preview is its own scrolling box, so every trigger passes
 * `scroller: '.scroller'`; on a real page you leave that out and the window
 * scrolls. Checks read the `scrollTrigger` options the code passed and the tracks
 * it built; the velocity step calls `onUpdate` as scrolling would.
 */

const STYLE = `<style>
  .scroller { height: 220px; overflow-y: auto; border-radius: 10px; background: #0f0f12; color: #f2efe9; font-family: system-ui, sans-serif; position: relative; }
  .spacer { height: 240px; display: grid; place-items: center; color: #77777f; font-size: 13px; }
  .card { margin: 0 auto 24px; width: 70%; height: 90px; border-radius: 12px; background: #4a9eff; display: grid; place-items: center; font-weight: 700; }
  .bar { position: sticky; top: 0; height: 5px; background: #c6ff3d; transform-origin: 0 50%; z-index: 2; }
  .content p { margin: 0 20px 18px; line-height: 1.6; color: #b9b9c0; }
  .panel { height: 220px; display: grid; place-items: center; background: #16161a; overflow: hidden; }
  .panel-inner { font-size: 30px; font-weight: 800; }
  .gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 0 20px 240px; }
  .gallery .card { width: auto; margin: 0; }
</style>`

const hint = (text: string) => `<div class="spacer">${text}</div>`
const oneCard = `${STYLE}<div class="scroller">${hint('Scroll down ↓')}<div class="card">Hello</div>${hint('')}</div>`
const threeCards = `${STYLE}<div class="scroller">${hint('Scroll down ↓')}<div class="card">One</div><div class="card">Two</div><div class="card">Three</div>${hint('')}</div>`
const article = `${STYLE}<div class="scroller"><div class="bar"></div><div class="content">${'<p>Scroll this article. The bar along the top shows how far through it you are, because its scaleX follows the scroll position exactly.</p>'.repeat(8)}</div></div>`
const pinned = `${STYLE}<div class="scroller">${hint('Scroll down ↓')}<section class="panel"><div class="panel-inner">Pinned</div></section>${hint('…and it lets go')}</div>`
const gallery = `${STYLE}<div class="scroller">${hint('Scroll fast ↓')}<div class="gallery">${'<div class="card">✦</div>'.repeat(8)}</div></div>`

type Vars = Record<string, unknown> & { scrollTrigger?: Record<string, unknown> }

/** The `scrollTrigger` of every tween and timeline the code created. */
function triggers(context: CheckContext): Record<string, unknown>[] {
  return context.calls().flatMap(({ method, args }) => {
    const vars = (method === 'fromTo' ? args[2] : method === 'timeline' ? args[0] : method === 'to' || method === 'from' ? args[1] : undefined) as Vars | undefined
    return vars?.scrollTrigger ? [vars.scrollTrigger] : []
  })
}

const inScroller = custom('Watches the preview’s scroller', (context) => {
  const all = triggers(context)
  return (all.length > 0 && all.every((trigger) => trigger.scroller === '.scroller')) || "Give each scrollTrigger `scroller: '.scroller'` (the preview scrolls, not the window)."
})

export const scrollModule: Module = {
  id: 'scroll',
  title: 'Scroll',
  summary: 'Reveals as things scroll into view, scroll-scrubbed progress, pinned sections and effects driven by scroll speed.',
  lessons: [
    {
      id: 'reveals',
      title: 'Reveals',
      summary: 'Play an animation when an element scrolls into view.',
      steps: [
        {
          id: 'reveal',
          title: 'Reveal on scroll',
          body: `Add \`scrollTrigger\` to a tween and it waits for scrolling instead of playing at once. \`start: 'top 80%'\` means "when the element's **top** reaches **80%** down the viewport".

This preview is its own scrolling box, so pass \`scroller: '.scroller'\`. On a real page, leave it out and the window is used.

**Your turn:** reveal \`.card\` from \`y: 60\` and \`opacity: 0\` when its top reaches 80% of the scroller. Then scroll the preview.`,
          markup: oneCard,
          starter: `live.from('.card', {\n  y: 60,\n  opacity: 0,\n  duration: 0.8,\n  ease: 'power3.out',\n})`,
          solution: `live.from('.card', {\n  y: 60,\n  opacity: 0,\n  duration: 0.8,\n  ease: 'power3.out',\n  scrollTrigger: { trigger: '.card', scroller: '.scroller', start: 'top 80%' },\n})`,
          checks: [
            valueIs('.card', 'opacity', 0, 0),
            valueIs('.card', 'y', 0),
            inScroller,
            custom("Starts at `'top 80%'`", (context) => triggers(context)[0]?.start === 'top 80%' || "Set `start: 'top 80%'`."),
          ],
          hints: ["Add `scrollTrigger: { trigger: '.card', scroller: '.scroller', start: 'top 80%' }` to the vars."],
        },
        {
          id: 'toggle-actions',
          title: 'Hide it again on the way back',
          body: `\`toggleActions\` says what happens at the four moments a range is crossed: **enter**, **leave**, **enter back** (scrolling up into it) and **leave back** (scrolling up past its start). The default is \`'play none none none'\`, so a reveal plays once and stays.

**Your turn:** make the card \`reverse\` when you scroll back above the start: \`'play none none reverse'\`.`,
          markup: oneCard,
          starter: `live.from('.card', {\n  y: 60,\n  opacity: 0,\n  duration: 0.8,\n  ease: 'power3.out',\n  scrollTrigger: { trigger: '.card', scroller: '.scroller', start: 'top 80%' },\n})`,
          solution: `live.from('.card', {\n  y: 60,\n  opacity: 0,\n  duration: 0.8,\n  ease: 'power3.out',\n  scrollTrigger: { trigger: '.card', scroller: '.scroller', start: 'top 80%', toggleActions: 'play none none reverse' },\n})`,
          checks: [
            inScroller,
            custom('Reverses when scrolling back above it', (context) => {
              const actions = String(triggers(context)[0]?.toggleActions ?? 'play none none none').trim().split(/\s+/)
              return (actions[0] === 'play' && actions[3] === 'reverse') || `toggleActions is '${actions.join(' ')}': the fourth action (leave back) should be reverse.`
            }),
          ],
          hints: ["`toggleActions: 'play none none reverse'`"],
        },
        {
          id: 'each-card',
          title: 'A trigger for each card',
          body: `One tween on \`'.card'\` gives all the cards **one** trigger — the first card's — so they all reveal together. For cards that reveal as each arrives, give each its own tween and trigger.

**Your turn:** loop over the cards and reveal each one when **its** top reaches 85%.`,
          markup: threeCards,
          starter: `live.from('.card', {\n  y: 60,\n  opacity: 0,\n  duration: 0.8,\n  scrollTrigger: { trigger: '.card', scroller: '.scroller', start: 'top 85%' },\n})`,
          solution: `root.querySelectorAll('.card').forEach((card) => {\n  live.from(card, {\n    y: 60,\n    opacity: 0,\n    duration: 0.8,\n    scrollTrigger: { trigger: card, scroller: '.scroller', start: 'top 85%' },\n  })\n})`,
          checks: [
            inScroller,
            custom('Each card has its own trigger', (context) => {
              const cards = [...context.root.querySelectorAll('.card')]
              const triggered = new Set(triggers(context).map((trigger) => trigger.trigger))
              return cards.every((card) => triggered.has(card)) || `${triggered.size} trigger(s) for ${cards.length} cards: use \`trigger: card\` inside a loop.`
            }),
            valueIs('.card:nth-of-type(3)', 'opacity', 0, 0),
          ],
          hints: ["`root.querySelectorAll('.card').forEach((card) => { live.from(card, { …, scrollTrigger: { trigger: card, … } }) })`"],
        },
      ],
    },
    {
      id: 'scrub',
      title: 'Scrub',
      summary: 'Tie an animation’s progress to the scroll position.',
      steps: [
        {
          id: 'progress-bar',
          title: 'Scroll is the playhead',
          body: `With \`scrub: true\` there is no playing: the scroll position **is** the animation's progress. Scroll halfway through the range and the animation is halfway through. Use \`ease: 'none'\` so progress and scroll match evenly.

The range here is the whole article: from its top at the scroller's top (\`'top top'\`) to its bottom at the scroller's bottom (\`'bottom bottom'\`).

**Your turn:** scrub \`.bar\` from \`scaleX: 0\` to \`1\` across \`.content\`.`,
          markup: article,
          starter: `live.fromTo('.bar', { scaleX: 0 }, {\n  scaleX: 1,\n  ease: 'none',\n})`,
          solution: `live.fromTo('.bar', { scaleX: 0 }, {\n  scaleX: 1,\n  ease: 'none',\n  scrollTrigger: { trigger: '.content', scroller: '.scroller', start: 'top top', end: 'bottom bottom', scrub: true },\n})`,
          checks: [
            valueIs('.bar', 'scaleX', 0, 0),
            valueIs('.bar', 'scaleX', 0.5, 0.25),
            inScroller,
            custom('Scrubbed by scroll', (context) => triggers(context)[0]?.scrub === true || 'Add `scrub: true`.'),
            custom('Across the whole article', (context) => {
              const trigger = triggers(context)[0]
              return (trigger?.trigger === '.content' && trigger.start === 'top top' && trigger.end === 'bottom bottom') || "Use `trigger: '.content', start: 'top top', end: 'bottom bottom'`."
            }),
          ],
          hints: ["`scrollTrigger: { trigger: '.content', scroller: '.scroller', start: 'top top', end: 'bottom bottom', scrub: true }`"],
        },
        {
          id: 'smoothed',
          title: 'Smoothed scrub',
          body: `\`scrub: true\` follows every wheel tick exactly, which can look steppy. A **number** smooths it: the animation catches up with the scroll position over that many seconds, like a camera on a dolly.

Keep it short — \`0.3\` to \`1\`. Longer feels laggy.

**Your turn:** smooth the bar with \`scrub: 0.5\`.`,
          markup: article,
          starter: `live.fromTo('.bar', { scaleX: 0 }, {\n  scaleX: 1,\n  ease: 'none',\n  scrollTrigger: { trigger: '.content', scroller: '.scroller', start: 'top top', end: 'bottom bottom', scrub: true },\n})`,
          solution: `live.fromTo('.bar', { scaleX: 0 }, {\n  scaleX: 1,\n  ease: 'none',\n  scrollTrigger: { trigger: '.content', scroller: '.scroller', start: 'top top', end: 'bottom bottom', scrub: 0.5 },\n})`,
          checks: [
            inScroller,
            custom('Smoothed over 0.5s', (context) => triggers(context)[0]?.scrub === 0.5 || `scrub is ${JSON.stringify(triggers(context)[0]?.scrub)}; make it 0.5.`),
          ],
          hints: ['Replace `scrub: true` with `scrub: 0.5`.'],
        },
      ],
    },
    {
      id: 'pin-velocity',
      title: 'Pinning and speed',
      summary: 'Hold a section in place while it animates, and react to how fast people scroll.',
      steps: [
        {
          id: 'pin',
          title: 'Pin a section',
          body: `\`pin: true\` holds the trigger in place while scrolling passes through the range, and pushes the content after it down so nothing overlaps. Put the section's animation on a scrubbed timeline and it plays while the section is held.

\`end: '+=400'\` makes the range **400px of scrolling** after the start.

**Your turn:** pin \`.panel\` from \`'top top'\` for \`400\`px, scrubbed, while \`.panel-inner\` scales from \`0.6\` to \`1.4\` and turns to \`rotate: 8\`.`,
          markup: pinned,
          starter: `live.timeline()\n  .fromTo('.panel-inner', { scale: 0.6 }, { scale: 1.4, rotate: 8, ease: 'none' })`,
          solution: `live.timeline({\n  scrollTrigger: { trigger: '.panel', scroller: '.scroller', start: 'top top', end: '+=400', scrub: true, pin: true },\n})\n  .fromTo('.panel-inner', { scale: 0.6 }, { scale: 1.4, rotate: 8, ease: 'none' })`,
          checks: [
            valueIs('.panel-inner', 'scale', 0.6, 0),
            valueIs('.panel-inner', 'rotate', 8),
            inScroller,
            custom('Pins the panel', (context) => {
              const trigger = triggers(context)[0]
              return (trigger?.trigger === '.panel' && trigger.pin === true) || "On the timeline: `scrollTrigger: { trigger: '.panel', pin: true, … }`."
            }),
            custom('For 400px of scrolling, scrubbed', (context) => {
              const trigger = triggers(context)[0]
              return (trigger?.start === 'top top' && trigger.end === '+=400' && !!trigger.scrub) || "Use `start: 'top top', end: '+=400', scrub: true`."
            }),
          ],
          hints: ['The scrollTrigger goes in `live.timeline({ scrollTrigger: { … } })`, not on the tween.'],
        },
        {
          id: 'velocity',
          title: 'React to scroll speed',
          body: `\`live.scrollTrigger({ … })\` watches scrolling with no animation of its own. Its \`onUpdate\` receives \`{ progress, velocity, direction }\`, with velocity in pixels per second, back to \`0\` when scrolling stops.

Skewing by speed makes a gallery feel like it has weight: fast scrolling leans the cards, and they settle when you stop. A \`quickTo\` setter keeps it to one tween.

**Your turn:** in \`onUpdate\`, set \`skewY\` to \`velocity / -300\` on \`.gallery\` with the \`skew\` setter.`,
          markup: gallery,
          starter: `const skew = live.quickTo('.gallery', 'skewY', { duration: 0.4, ease: 'power3.out' })\n\nlive.scrollTrigger({\n  trigger: '.gallery',\n  scroller: '.scroller',\n})`,
          solution: `const skew = live.quickTo('.gallery', 'skewY', { duration: 0.4, ease: 'power3.out' })\n\nlive.scrollTrigger({\n  trigger: '.gallery',\n  scroller: '.scroller',\n  onUpdate: ({ velocity }) => skew(velocity / -300),\n})`,
          checks: [
            custom('Watches the gallery in the scroller', (context) => {
              const vars = context.calls('scrollTrigger')[0]?.args[0] as Record<string, unknown> | undefined
              return (vars?.trigger === '.gallery' && vars.scroller === '.scroller') || "Call `live.scrollTrigger({ trigger: '.gallery', scroller: '.scroller', … })`."
            }),
            custom('Fast scrolling leans the cards', (context) => {
              const vars = context.calls('scrollTrigger')[0]?.args[0] as { onUpdate?: (self: object) => void } | undefined
              if (typeof vars?.onUpdate !== 'function') return 'Add an `onUpdate` callback.'
              vars.onUpdate({ progress: 0.5, velocity: 1500, direction: 1 })
              const skew = context.valueAt('.gallery', 'skewY', 60)
              return (typeof skew === 'number' && Math.abs(skew + 5) < 0.01) || `Scrolling at 1500px/s should skew to -5 (it is ${skew}).`
            }),
          ],
          hints: ['`onUpdate: ({ velocity }) => skew(velocity / -300)`'],
        },
      ],
    },
  ],
}
