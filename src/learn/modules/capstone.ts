import type { CheckContext, Module } from '../types'
import { custom, valueIs } from '../checks'

/**
 * Module 9, the capstone: the Agency Landing Page showcase, rebuilt one section at
 * a time. Each step is that section on its own, in a small scrolling preview
 * (`scroller: '.scroller'`), with the showcase's class names so the finished page
 * reads the same. The last step points at the whole page and its Copy code.
 */

const STYLE = `<style>
  .scroller { position: relative; height: 240px; overflow-y: auto; overflow-x: hidden; border-radius: 10px; background: #0b0b0c; color: #f2efe9; font-family: system-ui, sans-serif; }
  .spacer { height: 240px; display: grid; place-items: center; color: #6b6b73; font-size: 13px; }
  .ag-hero { position: relative; height: 240px; display: flex; align-items: flex-end; padding: 0 18px 22px; }
  .ag-title { margin: 0; font-size: 34px; line-height: 0.95; letter-spacing: -0.04em; font-weight: 800; max-width: 11ch; }
  .ag-title em { font-style: italic; font-weight: 300; color: #c6ff3d; }
  .ag-marquee { border-block: 1px solid #262626; padding: 14px 0; overflow: hidden; white-space: nowrap; }
  .ag-marquee-track { display: inline-flex; gap: 22px; padding-right: 22px; font-size: 30px; font-weight: 700; }
  .ag-marquee-track i { font-style: normal; color: #c6ff3d; font-size: 0.5em; align-self: center; }
  .ag-manifesto { padding: 30px 18px; }
  .ag-manifesto-text { margin: 0; font-size: 22px; line-height: 1.2; font-weight: 600; }
  .ag-work { height: 240px; overflow: hidden; padding: 16px 0 0; }
  .ag-work h2 { margin: 0 18px 12px; font-size: 16px; }
  .ag-work-track { display: flex; gap: 14px; padding: 0 18px; width: max-content; }
  .ag-card { width: 170px; }
  .ag-card-img { height: 120px; border-radius: 10px; }
  .ag-card h3 { margin: 8px 0 0; font-size: 14px; }
  .ag-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 20px 18px; }
  .ag-stat-value { font-size: 36px; font-weight: 800; letter-spacing: -0.04em; }
  .ag-stat-label { font-size: 12px; color: #8a877f; }
  .ag-service { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-top: 1px solid #262626; }
  .ag-icon { width: 40px; height: 40px; fill: none; stroke: #c6ff3d; stroke-width: 2; stroke-linecap: round; flex: none; }
  .ag-service-body h3 { margin: 0; font-size: 16px; }
  .ag-service-body p { margin: 4px 0 0; font-size: 12px; color: #8a877f; }
  .ag-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 18px; }
  .ag-tile { height: 70px; border-radius: 8px; display: grid; place-items: center; font-size: 12px; font-weight: 700; cursor: pointer; }
  .ag-lightbox { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0, 0, 0, 0.8); }
  .ag-lightbox[hidden] { display: none; }
  .ag-lightbox-img { width: 200px; height: 140px; border-radius: 12px; }
  .ag-contact { padding: 30px 18px; display: flex; flex-direction: column; gap: 18px; align-items: flex-start; }
  .ag-big { margin: 0; font-size: 56px; font-weight: 800; letter-spacing: -0.05em; line-height: 0.9; }
  .ag-magnet { display: inline-block; background: #c6ff3d; color: #0b0b0c; border-radius: 999px; padding: 14px 24px; font-weight: 700; text-decoration: none; }
</style>`

const scroller = (inner: string, before = 'Scroll down ↓') => `${STYLE}<div class="scroller">${before ? `<div class="spacer">${before}</div>` : ''}${inner}<div class="spacer"></div></div>`

const hero = `${STYLE}<div class="scroller"><header class="ag-hero"><h1 class="ag-title">We make brands move with <em>intent</em></h1></header><div class="spacer">Scroll ↓</div><div class="spacer"></div></div>`
const words = ['Motion', 'Interaction', 'Scroll', 'Type']
const marqueeRun = words.map((word) => `<span>${word}</span><i>✦</i>`).join('')
const marquee = scroller(`<div class="ag-marquee"><div class="ag-marquee-track">${marqueeRun}${marqueeRun}</div></div>`, 'Scroll fast ↓')
const manifesto = scroller(`<section class="ag-manifesto"><p class="ag-manifesto-text">Great motion isn't decoration. It shows people where to look, then gets out of the way.</p></section>`)
const work = scroller(
  `<section class="ag-work"><h2>Selected work</h2><div class="ag-work-track">${[
    ['Tidal', '#1f6feb', '#0ea5e9'],
    ['Orchard', '#f97316', '#facc15'],
    ['Lumen', '#8b5cf6', '#ec4899'],
    ['Basalt', '#10b981', '#0f766e'],
  ]
    .map(([name, a, b]) => `<article class="ag-card"><div class="ag-card-img" style="background: linear-gradient(135deg, ${a}, ${b})"></div><h3>${name}</h3></article>`)
    .join('')}</div></section>`
)
const STATS = [
  ['48', '', 'launches'],
  ['12', 'M', 'viewers'],
  ['97', '%', 'lighthouse'],
]
const stats = scroller(
  `<section class="ag-stats">${STATS.map(([value, suffix, label]) => `<div><div class="ag-stat-value" data-value="${value}" data-suffix="${suffix}">0${suffix}</div><div class="ag-stat-label">${label}</div></div>`).join('')}</section>`
)
const services = scroller(
  [
    ['Motion systems', 'Timing and easing rules.', '<circle cx="24" cy="24" r="18"/><path d="M24 12 V24 L32 30"/>'],
    ['Interactive sites', 'Scroll stories and pins.', '<rect x="8" y="10" width="32" height="26" rx="3"/><path d="M8 18 H40 M16 42 H32"/>'],
  ]
    .map(([title, body, icon]) => `<div class="ag-service"><svg class="ag-icon" viewBox="0 0 48 48">${icon}</svg><div class="ag-service-body"><h3>${title}</h3><p>${body}</p></div></div>`)
    .join('')
)
const gallery = `${STYLE}<div class="scroller"><div class="ag-tiles">${[
  ['Studio', '#334155', '#64748b'],
  ['Workshop', '#7c2d12', '#ea580c'],
  ['Sketches', '#365314', '#84cc16'],
  ['Offsite', '#1e3a8a', '#60a5fa'],
  ['Launch', '#581c87', '#d946ef'],
  ['Team', '#134e4a', '#2dd4bf'],
]
  .map(([name, a, b], i) => `<div class="ag-tile" data-flip-id="photo-${i}" style="background: linear-gradient(135deg, ${a}, ${b})">${name}</div>`)
  .join('')}</div><div class="ag-lightbox" hidden><div class="ag-lightbox-img"></div></div></div>`
const contact = scroller(`<footer class="ag-contact"><h2 class="ag-big">Let's talk</h2><a class="ag-magnet" href="#contact">hello@example.com</a></footer>`)

type Vars = Record<string, unknown> & { scrollTrigger?: Record<string, unknown> }

/** The `scrollTrigger` of every tween and timeline the code created, in order. */
function triggers(context: CheckContext): Record<string, unknown>[] {
  return context.calls().flatMap(({ method, args }) => {
    const vars = (method === 'fromTo' ? args[2] : method === 'timeline' ? args[0] : method === 'to' || method === 'from' ? args[1] : method === 'scrollTrigger' ? { scrollTrigger: args[0] } : undefined) as Vars | undefined
    return vars?.scrollTrigger ? [vars.scrollTrigger] : []
  })
}

/** Options passed to `live.splitText`, if it was called. */
const splitOptions = (context: CheckContext) => context.calls('splitText')[0]?.args[1] as Record<string, unknown> | undefined

/** Options passed to `live.timeline`, the first call that had any. */
const timelineOptions = (context: CheckContext) => context.calls('timeline').map((call) => call.args[0] as Record<string, unknown> | undefined).find(Boolean)

const inScroller = custom('Watches the preview’s scroller', (context) => {
  const all = triggers(context)
  return (all.length > 0 && all.every((trigger) => trigger.scroller === '.scroller')) || "Give each scrollTrigger `scroller: '.scroller'`."
})

const HERO_REVEAL = `const title = live.splitText('.ag-title', { type: 'lines', mask: 'lines' })\nlive.fromTo(title.lines, { y: 140, rotate: 4 }, { y: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 })`

export const capstoneModule: Module = {
  id: 'capstone',
  title: 'Capstone: an award-style landing page',
  summary: 'Rebuild the Agency Landing Page showcase section by section, using everything from the course.',
  lessons: [
    {
      id: 'hero',
      title: 'Hero',
      summary: 'A headline that rises from behind its lines, and drifts away as you scroll.',
      steps: [
        {
          id: 'headline',
          title: 'The headline reveal',
          body: `This module rebuilds the **[Agency Landing Page](/showcase/agency-landing)**, one section per step. Open it in another tab to see where you're going.

The page opens with its headline rising line by line, each from behind its own edge, with a slight tilt that straightens as it lands.

**Your turn:** split \`.ag-title\` into masked lines, and bring each from \`y: 140, rotate: 4\` to \`y: 0, rotate: 0\` over \`1.2\`s with \`expo.out\`, \`0.12\`s apart.`,
          markup: hero,
          starter: `const title = live.splitText('.ag-title', { type: 'lines', mask: 'lines' })\n// bring title.lines up into place\n`,
          solution: HERO_REVEAL,
          checks: [
            custom('Masked lines', (context) => {
              const options = splitOptions(context)
              return (options?.type === 'lines' && options.mask === 'lines') || "Split with `{ type: 'lines', mask: 'lines' }`."
            }),
            valueIs('.ag-title .line', 'y', 140, 0),
            valueIs('.ag-title .line', 'rotate', 4, 0),
            valueIs('.ag-title .line', 'y', 0),
            custom('Lands with expo.out, 0.12s apart', (context) => {
              const call = context.calls('fromTo')[0]
              const vars = call?.args[2] as Record<string, unknown> | undefined
              return (vars?.ease === 'expo.out' && vars.stagger === 0.12 && vars.duration === 1.2) || "Use `duration: 1.2, ease: 'expo.out', stagger: 0.12`."
            }),
          ],
          hints: ["`live.fromTo(title.lines, { y: 140, rotate: 4 }, { y: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 })`"],
        },
        {
          id: 'drift',
          title: 'Drift away on scroll',
          body: `As you scroll past the hero, the headline sinks, shrinks and fades — scrubbed, so it follows the scroll, and smoothed a little.

**Your turn:** add a timeline scrubbed with \`0.6\` over the hero (\`'top top'\` to \`'bottom top'\`) that moves \`.ag-title\` to \`y: 180, scale: 0.9, opacity: 0.15\` with \`ease: 'none'\`.`,
          markup: hero,
          starter: `${HERO_REVEAL}\n\n// scrub the headline away as the hero scrolls out\n`,
          solution: `${HERO_REVEAL}\n\nlive\n  .timeline({ scrollTrigger: { trigger: '.ag-hero', scroller: '.scroller', start: 'top top', end: 'bottom top', scrub: 0.6 } })\n  .to('.ag-title', { y: 180, scale: 0.9, opacity: 0.15, ease: 'none', duration: 1 })`,
          checks: [
            inScroller,
            custom('Scrubbed across the hero', (context) => {
              const trigger = triggers(context)[0]
              return (trigger?.trigger === '.ag-hero' && trigger.start === 'top top' && trigger.end === 'bottom top' && trigger.scrub === 0.6) || "Use `trigger: '.ag-hero', start: 'top top', end: 'bottom top', scrub: 0.6`."
            }),
            valueIs('.ag-title', 'y', 180),
            valueIs('.ag-title', 'opacity', 0.15),
          ],
          hints: ["`live.timeline({ scrollTrigger: { … } }).to('.ag-title', { y: 180, scale: 0.9, opacity: 0.15, ease: 'none' })`"],
        },
      ],
    },
    {
      id: 'marquee-manifesto',
      title: 'Marquee and manifesto',
      summary: 'An endless strip that reacts to scroll speed, and words that light up as you read.',
      steps: [
        {
          id: 'marquee',
          title: 'An endless marquee',
          body: `The track holds the words **twice**. Sliding it left by exactly half its width puts the second copy where the first started, so a repeating tween loops with no seam.

The half-width depends on the font size, so pass a **function** and rebuild on resize with \`invalidate()\`.

**Your turn:** loop \`.ag-marquee-track\` to \`x: () => -track.scrollWidth / 2\` over \`12\`s, \`ease: 'none'\`, forever.`,
          markup: marquee,
          starter: `const track = root.querySelector('.ag-marquee-track')\n`,
          solution: `const track = root.querySelector('.ag-marquee-track')\nconst marquee = live\n  .timeline({ repeat: -1 })\n  .to(track, { x: () => -track.scrollWidth / 2, duration: 12, ease: 'none' })\n\nwindow.addEventListener('resize', () => marquee.invalidate())`,
          checks: [
            custom('Repeats forever', (context) => timelineOptions(context)?.repeat === -1 || 'Use `live.timeline({ repeat: -1 })`.'),
            custom('Slides the track at a steady speed', (context) => {
              const [track] = context.tracks('.ag-marquee-track', 'x')
              if (!track || !('keyframes' in track)) return 'Tween the track’s `x`.'
              const easing = track.keyframes[track.keyframes.length - 1].easing
              return ((easing === undefined || easing === 'linear') && context.duration() === Infinity) || "Use `ease: 'none'` so the loop doesn’t slow at the seam."
            }),
            custom('Measures half the track', (context) => {
              const track = context.root.querySelector('.ag-marquee-track') as HTMLElement
              const [xTrack] = context.tracks('.ag-marquee-track', 'x')
              const last = xTrack && 'keyframes' in xTrack ? xTrack.keyframes[xTrack.keyframes.length - 1].value : undefined
              return (typeof last === 'number' && Math.abs(last + track.scrollWidth / 2) < 1) || 'Slide to `-track.scrollWidth / 2`.'
            }),
          ],
          hints: ['`live.timeline({ repeat: -1 }).to(track, { x: () => -track.scrollWidth / 2, duration: 12, ease: \'none\' })`'],
        },
        {
          id: 'lean',
          title: 'Lean with scroll speed',
          body: `Scroll fast and the marquee **leans** into it and settles when you stop. \`onUpdate\` gives the velocity; a \`quickTo\` setter re-aims one tween, and a clamp keeps the lean tasteful.

**Your turn:** on every update of a trigger on \`.ag-marquee\`, lean the track's \`skewX\` to \`-velocity / 150\`, clamped between \`-10\` and \`10\`.`,
          markup: marquee,
          starter: `const track = root.querySelector('.ag-marquee-track')\nconst lean = live.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' })\n\nlive.scrollTrigger({\n  trigger: '.ag-marquee',\n  scroller: '.scroller',\n})`,
          solution: `const track = root.querySelector('.ag-marquee-track')\nconst lean = live.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' })\n\nlive.scrollTrigger({\n  trigger: '.ag-marquee',\n  scroller: '.scroller',\n  onUpdate: ({ velocity }) => lean(Math.max(-10, Math.min(10, -velocity / 150))),\n})`,
          checks: [
            inScroller,
            custom('Leans against gentle scrolling', (context) => {
              const onUpdate = triggers(context)[0]?.onUpdate as ((self: object) => void) | undefined
              if (typeof onUpdate !== 'function') return 'Add `onUpdate`.'
              onUpdate({ progress: 0.5, velocity: 600, direction: 1 })
              const skew = context.valueAt('.ag-marquee-track', 'skewX', 60)
              return (typeof skew === 'number' && Math.abs(skew + 4) < 0.01) || `At 600px/s it should lean to -4 (it is ${skew}).`
            }),
            custom('…but never more than 10°', (context) => {
              const onUpdate = triggers(context)[0]?.onUpdate as ((self: object) => void) | undefined
              if (typeof onUpdate !== 'function') return 'Add `onUpdate`.'
              onUpdate({ progress: 0.5, velocity: -6000, direction: -1 })
              const skew = context.valueAt('.ag-marquee-track', 'skewX', 60)
              return (typeof skew === 'number' && Math.abs(skew - 10) < 0.01) || `At -6000px/s it should stop at 10 (it is ${skew}).`
            }),
          ],
          hints: ['`onUpdate: ({ velocity }) => lean(Math.max(-10, Math.min(10, -velocity / 150)))`'],
        },
        {
          id: 'manifesto',
          title: 'Words that light up',
          body: `The manifesto starts dim, and each word brightens as scrolling reaches it — reading pace set by the reader.

**Your turn:** split \`.ag-manifesto-text\` into words, and on a timeline scrubbed from \`'top 70%'\` to \`'bottom 55%'\` of \`.ag-manifesto\`, bring the words from \`opacity: 0.12\` to \`1\`, \`0.1\` apart, \`ease: 'none'\`.`,
          markup: manifesto,
          starter: `const manifesto = live.splitText('.ag-manifesto-text', { type: 'words' })\n`,
          solution: `const manifesto = live.splitText('.ag-manifesto-text', { type: 'words' })\n\nlive\n  .timeline({ scrollTrigger: { trigger: '.ag-manifesto', scroller: '.scroller', start: 'top 70%', end: 'bottom 55%', scrub: true } })\n  .fromTo(manifesto.words, { opacity: 0.12 }, { opacity: 1, duration: 0.3, stagger: 0.1, ease: 'none' })`,
          checks: [
            inScroller,
            custom('Scrubbed from top 70% to bottom 55%', (context) => {
              const trigger = triggers(context)[0]
              return (trigger?.start === 'top 70%' && trigger.end === 'bottom 55%' && trigger.scrub === true) || "Use `start: 'top 70%', end: 'bottom 55%', scrub: true`."
            }),
            valueIs('.ag-manifesto-text .word', 'opacity', 0.12, 0),
            custom('Words brighten one after another', (context) => {
              const first = context.valueAt('.ag-manifesto-text .word', 'opacity', 0.3)
              const last = context.valueAt('.ag-manifesto-text .word:last-of-type', 'opacity', 0.3)
              return (typeof first === 'number' && typeof last === 'number' && first > last) || 'Stagger the words `0.1` apart.'
            }),
          ],
          hints: ["`.fromTo(manifesto.words, { opacity: 0.12 }, { opacity: 1, duration: 0.3, stagger: 0.1, ease: 'none' })`"],
        },
      ],
    },
    {
      id: 'work-stats',
      title: 'Work and stats',
      summary: 'A pinned section scrolled sideways, and numbers that count up.',
      steps: [
        {
          id: 'pinned-work',
          title: 'Pinned horizontal work',
          body: `The signature move: the work section **pins**, and scrolling down slides the cards **sideways**. The scroll distance equals how far the row has to travel, measured by a function so a resize re-measures it (\`invalidateOnRefresh: true\`).

**Your turn:** pin \`.ag-work\` from \`'top top'\` for \`+=\${travel()}\` pixels, scrubbed with \`0.5\`, while \`.ag-work-track\` moves to \`x: () => -travel()\`.`,
          markup: work,
          starter: `const section = root.querySelector('.ag-work')\nconst track = root.querySelector('.ag-work-track')\nconst travel = () => Math.max(0, track.scrollWidth - section.clientWidth)\n`,
          solution: `const section = root.querySelector('.ag-work')\nconst track = root.querySelector('.ag-work-track')\nconst travel = () => Math.max(0, track.scrollWidth - section.clientWidth)\n\nlive\n  .timeline({\n    scrollTrigger: { trigger: section, scroller: '.scroller', start: 'top top', end: () => \`+=\${travel()}\`, scrub: 0.5, pin: true, invalidateOnRefresh: true },\n  })\n  .to(track, { x: () => -travel(), ease: 'none', duration: 1 })`,
          checks: [
            inScroller,
            custom('Pins the section, scrubbed', (context) => {
              const trigger = triggers(context)[0]
              return (trigger?.pin === true && trigger.scrub === 0.5 && trigger.start === 'top top') || "Use `start: 'top top', scrub: 0.5, pin: true`."
            }),
            custom('Measures the travel again on refresh', (context) => {
              const trigger = triggers(context)[0]
              return (typeof trigger?.end === 'function' && trigger.invalidateOnRefresh === true) || 'Pass `end` as a function and `invalidateOnRefresh: true`.'
            }),
            custom('Slides the row', (context) => context.tracks('.ag-work-track', 'x').length > 0 || 'Tween `.ag-work-track` to `x: () => -travel()`.'),
          ],
          hints: ['Pass `end` as a function returning `"+=" + travel()`.', "Then `.to(track, { x: () => -travel(), ease: 'none' })`."],
        },
        {
          id: 'count-up',
          title: 'Count up',
          body: `Numbers can't be tweened as text, but a **plain object** can: tween \`count.value\`, and write it into the element in \`onUpdate\`. \`once: true\` counts up the first time only.

**Your turn:** for each \`.ag-stat-value\`, count from \`0\` to its \`data-value\` over \`1.8\`s when its top reaches 85%, once, writing \`Math.round(count.value)\` plus its \`data-suffix\`.`,
          markup: stats,
          starter: `root.querySelectorAll('.ag-stat-value').forEach((element) => {\n  const count = { value: 0 }\n  // tween count.value to Number(element.dataset.value)\n})`,
          solution: `root.querySelectorAll('.ag-stat-value').forEach((element) => {\n  const count = { value: 0 }\n  live.to(count, {\n    value: Number(element.dataset.value),\n    duration: 1.8,\n    ease: 'power3.out',\n    onUpdate: () => (element.textContent = \`\${Math.round(count.value)}\${element.dataset.suffix}\`),\n    scrollTrigger: { trigger: element, scroller: '.scroller', start: 'top 85%', once: true },\n  })\n})`,
          checks: [
            inScroller,
            custom('Counts to each number', (context) => {
              const ends = context
                .tracks()
                .filter((track) => track.property === 'value' && track.target.startsWith('obj-') && 'keyframes' in track)
                .map((track) => ('keyframes' in track ? track.keyframes[track.keyframes.length - 1].value : undefined))
              return JSON.stringify(ends) === JSON.stringify(STATS.map(([value]) => Number(value))) || `The counts end at ${JSON.stringify(ends)}, not 48, 12 and 97.`
            }),
            custom('Once each, when it comes into view', (context) => {
              const all = triggers(context)
              const elements = [...context.root.querySelectorAll('.ag-stat-value')]
              return (all.length === 3 && all.every((trigger, i) => trigger.once === true && trigger.start === 'top 85%' && trigger.trigger === elements[i])) || "Each tween: `scrollTrigger: { trigger: element, start: 'top 85%', once: true }`."
            }),
            custom('Writes the number into the page', (context) => {
              const vars = context.calls('to')[0]?.args[1] as { onUpdate?: () => void; value?: number } | undefined
              const target = context.calls('to')[0]?.args[0] as { value: number } | undefined
              if (typeof vars?.onUpdate !== 'function' || !target) return 'Add `onUpdate` to write the number.'
              target.value = 47.6
              vars.onUpdate()
              const text = context.root.querySelector('.ag-stat-value')?.textContent
              return text === '48' || `With count.value at 47.6 the element reads ${JSON.stringify(text)}, not "48".`
            }),
          ],
          hints: ['`onUpdate: () => (element.textContent = `${Math.round(count.value)}${element.dataset.suffix}`)`'],
        },
      ],
    },
    {
      id: 'details',
      title: 'Details',
      summary: 'Icons that draw in, a lightbox that grows from its tile, and a springy sign-off.',
      steps: [
        {
          id: 'services',
          title: 'Icons draw in',
          body: `Each service row draws its icon as it arrives, and undraws if you scroll back above it.

**Your turn:** for each \`.ag-service\`, on a timeline triggered at \`'top 80%'\` with \`toggleActions: 'play none none reverse'\`, draw its icon's shapes from \`drawSVG: 0\` to \`true\` over \`1\`s, \`0.15\` apart.`,
          markup: services,
          starter: `root.querySelectorAll('.ag-service').forEach((item) => {\n  // draw item's icon in\n})`,
          solution: `root.querySelectorAll('.ag-service').forEach((item) => {\n  live\n    .timeline({ scrollTrigger: { trigger: item, scroller: '.scroller', start: 'top 80%', toggleActions: 'play none none reverse' } })\n    .fromTo(item.querySelectorAll('.ag-icon *'), { drawSVG: 0 }, { drawSVG: true, duration: 1, ease: 'power2.inOut', stagger: 0.15 })\n})`,
          checks: [
            inScroller,
            custom('A trigger per row that reverses', (context) => {
              const all = triggers(context)
              const rows = [...context.root.querySelectorAll('.ag-service')]
              return (all.length === rows.length && all.every((trigger, i) => trigger.trigger === rows[i] && trigger.toggleActions === 'play none none reverse')) || "One timeline per row, with `trigger: item` and `toggleActions: 'play none none reverse'`."
            }),
            custom('The icons draw in', (context) => {
              const start = context.valueAt('.ag-icon circle', 'strokeDasharray', 0)
              const end = context.valueAt('.ag-icon circle', 'strokeDasharray', 1)
              return (Array.isArray(start) && Array.isArray(end) && start[0] < 1 && end[0] > 1) || "Draw `item.querySelectorAll('.ag-icon *')` from `drawSVG: 0` to `drawSVG: true`."
            }),
            custom('Shapes follow one another', (context) => {
              const first = context.valueAt('.ag-icon circle', 'strokeDasharray', 0.1)
              const second = context.valueAt('.ag-icon path', 'strokeDasharray', 0.1)
              return (Array.isArray(first) && Array.isArray(second) && first[0] > second[0]) || 'Stagger the shapes `0.15` apart.'
            }),
          ],
          hints: ["`.fromTo(item.querySelectorAll('.ag-icon *'), { drawSVG: 0 }, { drawSVG: true, duration: 1, stagger: 0.15 })`"],
        },
        {
          id: 'lightbox',
          title: 'A lightbox that grows from its tile',
          body: `Clicking a tile opens a lightbox whose image **grows out of the tile** — two different elements. \`live.getFlipState(tile)\` records where the tile is; after showing the lightbox, \`live.flipFrom(state, { targets: image })\` animates the image from there.

**Your turn:** on click, record the tile, fill and show the lightbox, then flip the image from the tile's state over \`0.7\`s with \`fade: true\`.`,
          markup: gallery,
          starter: `const lightbox = root.querySelector('.ag-lightbox')\nconst image = root.querySelector('.ag-lightbox-img')\n\nroot.querySelectorAll('.ag-tile').forEach((tile) => {\n  tile.addEventListener('click', () => {\n    image.style.background = tile.style.background\n    lightbox.hidden = false\n  })\n})\n\nlightbox.addEventListener('click', () => (lightbox.hidden = true))`,
          solution: `const lightbox = root.querySelector('.ag-lightbox')\nconst image = root.querySelector('.ag-lightbox-img')\n\nroot.querySelectorAll('.ag-tile').forEach((tile) => {\n  tile.addEventListener('click', () => {\n    const state = live.getFlipState(tile)\n    image.style.background = tile.style.background\n    lightbox.hidden = false\n    live.flipFrom(state, { targets: image, fade: true, duration: 0.7, ease: 'power3.inOut' })\n  })\n})\n\nlightbox.addEventListener('click', () => (lightbox.hidden = true))`,
          checks: [
            custom('Clicking a tile opens the lightbox', (context) => {
              const isHidden = () => context.root.querySelector<HTMLElement>('.ag-lightbox')?.hidden
              if (!isHidden()) return 'The lightbox should stay hidden until a tile is clicked.'
              context.fire('.ag-tile', 'click')
              return isHidden() === false || 'Clicking a tile should show `.ag-lightbox`.'
            }),
            custom('The tile is recorded before the change', (context) => {
              if (context.calls('getFlipState').length === 0) context.fire('.ag-tile', 'click')
              const state = context.calls('getFlipState')[0]
              return (!!state && (state.args[0] as Element)?.classList?.contains('ag-tile')) || 'Call `live.getFlipState(tile)` first.'
            }),
            custom('The image grows from the tile', (context) => {
              if (context.calls('flipFrom').length === 0) context.fire('.ag-tile', 'click')
              const call = context.calls('flipFrom')[0]
              const vars = call?.args[1] as { targets?: unknown; fade?: boolean } | undefined
              return (vars?.targets === context.root.querySelector('.ag-lightbox-img') && vars.fade === true) || 'Call `live.flipFrom(state, { targets: image, fade: true, … })` after showing the lightbox.'
            }),
          ],
          hints: ['`const state = live.getFlipState(tile)` before changing anything.', "`live.flipFrom(state, { targets: image, fade: true, duration: 0.7 })` after `lightbox.hidden = false`."],
        },
        {
          id: 'contact',
          title: 'A springy sign-off',
          body: `The page signs off with big letters bouncing into place on **springs** when the footer arrives. A spring has no fixed duration: it settles when physics says so.

When you finish this step, open the **[whole page](/showcase/agency-landing)**: every section you built, wrapped in \`live.matchMedia\` for a real reduced-motion mode. **Copy code** there gives you a standalone HTML file to make your own.

**Your turn:** split \`.ag-big\` into chars, and bring them from \`y: 160, rotate: 14\` on \`spring: 'bouncy'\`, \`0.04\` apart, when \`.ag-contact\` reaches \`'top 65%'\`.`,
          markup: contact,
          starter: `const big = live.splitText('.ag-big', { type: 'chars' })\n`,
          solution: `const big = live.splitText('.ag-big', { type: 'chars' })\n\nlive.fromTo(\n  big.chars,\n  { y: 160, rotate: 14 },\n  { y: 0, rotate: 0, spring: 'bouncy', stagger: 0.04, scrollTrigger: { trigger: '.ag-contact', scroller: '.scroller', start: 'top 65%' } }\n)`,
          checks: [
            inScroller,
            valueIs('.ag-big .char', 'y', 160, 0),
            custom('Lands on a bouncy spring', (context) => {
              const vars = context.calls('fromTo')[0]?.args[2] as Record<string, unknown> | undefined
              return vars?.spring === 'bouncy' || "Use `spring: 'bouncy'`."
            }),
            custom('Letters overshoot and settle', (context) => {
              const samples = Array.from({ length: 80 }, (_, i) => context.valueAt('.ag-big .char', 'y', i * 0.05)).filter((value): value is number => typeof value === 'number')
              return (samples.some((value) => value < -1) && Math.abs(samples[samples.length - 1]) < 1) || 'The letters should overshoot above 0, then settle at 0.'
            }),
            custom('When the footer arrives', (context) => {
              const trigger = triggers(context)[0]
              return (trigger?.trigger === '.ag-contact' && trigger.start === 'top 65%') || "`scrollTrigger: { trigger: '.ag-contact', start: 'top 65%' }`"
            }),
          ],
          hints: ["`live.fromTo(big.chars, { y: 160, rotate: 14 }, { y: 0, rotate: 0, spring: 'bouncy', stagger: 0.04, scrollTrigger: { … } })`"],
        },
      ],
    },
  ],
}
