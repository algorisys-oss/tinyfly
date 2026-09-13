import type { CheckContext, Module } from '../types'
import { animates, custom } from '../checks'

/**
 * Module 8: motion that respects people and devices. Reduced motion is a real
 * mode built with `live.matchMedia`, checked by running the code again with the
 * preference emulated; keyboard users get the same feedback as the pointer; and
 * animations stay on transforms and opacity and stop when nobody can see them.
 */

const STYLE = `<style>
  .stage { position: relative; height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 14px; color: #f2efe9; font-family: system-ui, sans-serif; }
  .card { width: 70%; padding: 16px 18px; border-radius: 12px; background: #4a9eff; font-weight: 700; }
  .button { padding: 12px 24px; border-radius: 999px; background: #c6ff3d; color: #0b0b0c; font-weight: 700; border: 0; font: inherit; cursor: pointer; }
  .button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
  .track { position: relative; width: 80%; height: 48px; }
  .slider { position: absolute; left: 0; top: 0; width: 48px; height: 48px; border-radius: 10px; background: #ec4899; }
  .scroller { height: 220px; overflow-y: auto; border-radius: 10px; background: #0f0f12; color: #77777f; font-family: system-ui, sans-serif; }
  .spacer { height: 260px; display: grid; place-items: center; font-size: 13px; }
  canvas { display: block; margin: 0 auto; width: 240px; height: 120px; background: #111; border-radius: 10px; }
</style>`

const card = `${STYLE}<div class="stage"><div class="card">Welcome back</div></div>`
const button = `${STYLE}<div class="stage"><button class="button">Get started</button></div>`
const slider = `${STYLE}<div class="stage"><div class="track"><div class="slider"></div></div></div>`
const offscreenCanvas = `${STYLE}<div class="scroller"><div class="spacer">Scroll down ↓</div><canvas width="480" height="240"></canvas><div class="spacer">…and past it</div></div>`

const REVEAL = `live.from('.card', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' })`

const LAYOUT_PROPERTIES = ['left', 'top', 'right', 'bottom', 'width', 'height', 'margin', 'marginLeft', 'marginTop', 'padding']

/** Property names the code animated on `.card`, in a run. */
const cardProperties = (context: CheckContext) => new Set(context.tracks('.card').map((track) => track.property))

export const accessibilityPerformanceModule: Module = {
  id: 'accessibility-performance',
  title: 'Accessibility and performance',
  summary: 'A real reduced-motion mode, keyboard parity, and animations that stay smooth and stop when nobody is looking.',
  lessons: [
    {
      id: 'reduced-motion',
      title: 'Reduced motion',
      summary: 'Respect `prefers-reduced-motion` with a mode of its own.',
      steps: [
        {
          id: 'match-media',
          title: 'Two modes with matchMedia',
          body: `Some people set **reduce motion** in their system settings, because large movement makes them unwell or distracts them. Respecting it is not optional polish.

\`live.matchMedia()\` runs a setup while a media query matches, and undoes it when it stops matching. Give it both preferences, so exactly one setup always runs:

\`\`\`js
const mm = live.matchMedia()
mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
  if (ctx.conditions.reduce) return   // …no movement
  // …the full animation
})
\`\`\`

**Your turn:** wrap the reveal so it only plays when motion is allowed. With reduced motion, the card is simply there.`,
          markup: card,
          starter: `${REVEAL}\n`,
          solution: `const mm = live.matchMedia()\n\nmm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {\n  if (ctx.conditions.reduce) return\n  ${REVEAL}\n})`,
          checks: [
            custom('With motion allowed, the card reveals', (context) => {
              const motion = context.rerun({ reducedMotion: false })
              return cardProperties(motion).has('y') || 'With no preference, the card should still rise in.'
            }),
            custom('With reduced motion, nothing moves', (context) => {
              const reduced = context.rerun({ reducedMotion: true })
              const moved = [...cardProperties(reduced)]
              return moved.length === 0 || `With reduce motion on, the card still animates ${moved.join(', ')}.`
            }),
          ],
          hints: ['Put the reveal inside the setup, after `if (ctx.conditions.reduce) return`.'],
        },
        {
          id: 'fade-not-move',
          title: 'Reduce, don’t remove',
          body: `Reduced motion means less **movement**, not no feedback. A gentle fade tells people something changed without anything travelling across the screen.

**Your turn:** in the reduced branch, fade the card in from \`opacity: 0\` over \`0.4\`s — no \`y\`. Keep the full reveal for everyone else.`,
          markup: card,
          starter: `const mm = live.matchMedia()\n\nmm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {\n  if (ctx.conditions.reduce) return\n  ${REVEAL}\n})`,
          solution: `const mm = live.matchMedia()\n\nmm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {\n  if (ctx.conditions.reduce) {\n    live.from('.card', { opacity: 0, duration: 0.4 })\n    return\n  }\n  ${REVEAL}\n})`,
          checks: [
            custom('With reduced motion, it fades', (context) => cardProperties(context.rerun({ reducedMotion: true })).has('opacity') || 'In the reduced branch, animate `opacity` from 0.'),
            custom('…without moving', (context) => {
              const moved = [...cardProperties(context.rerun({ reducedMotion: true }))].filter((property) => property !== 'opacity')
              return moved.length === 0 || `The reduced branch still animates ${moved.join(', ')}.`
            }),
            custom('Everyone else still gets the full reveal', (context) => cardProperties(context.rerun({ reducedMotion: false })).has('y') || 'Keep the `y` reveal when motion is allowed.'),
          ],
          hints: ["`if (ctx.conditions.reduce) { live.from('.card', { opacity: 0, duration: 0.4 }); return }`"],
        },
      ],
    },
    {
      id: 'keyboard',
      title: 'Keyboard parity',
      summary: 'Feedback that only a mouse can trigger leaves people out.',
      steps: [
        {
          id: 'focus',
          title: 'Focus gets the hover too',
          body: `A hover effect is feedback: "this is the thing you're about to press". Keyboard users move with **Tab**, which fires \`focus\` and \`blur\`, not pointer events. Give them the same feedback.

**Your turn:** also grow the button on \`focus\` and shrink it on \`blur\`. Then press Tab in the preview.`,
          markup: button,
          starter: `const button = root.querySelector('.button')\nconst grow = () => live.to(button, { scale: 1.08, duration: 0.2, ease: 'power2.out' })\nconst shrink = () => live.to(button, { scale: 1, duration: 0.2, ease: 'power2.out' })\n\nbutton.addEventListener('pointerenter', grow)\nbutton.addEventListener('pointerleave', shrink)\n`,
          solution: `const button = root.querySelector('.button')\nconst grow = () => live.to(button, { scale: 1.08, duration: 0.2, ease: 'power2.out' })\nconst shrink = () => live.to(button, { scale: 1, duration: 0.2, ease: 'power2.out' })\n\nbutton.addEventListener('pointerenter', grow)\nbutton.addEventListener('pointerleave', shrink)\nbutton.addEventListener('focus', grow)\nbutton.addEventListener('blur', shrink)`,
          checks: [
            custom('Focusing grows it', (context) => {
              context.fire('.button', 'focus')
              const scale = context.valueAt('.button', 'scale', 60)
              return (typeof scale === 'number' && Math.abs(scale - 1.08) < 0.001) || 'On `focus`, grow the button like on hover.'
            }),
            custom('Blurring shrinks it back', (context) => {
              context.fire('.button', 'focus')
              context.fire('.button', 'blur')
              const scale = context.valueAt('.button', 'scale', 60)
              return (typeof scale === 'number' && Math.abs(scale - 1) < 0.001) || 'On `blur`, shrink it back to 1.'
            }),
          ],
          hints: ["`button.addEventListener('focus', grow)` and `button.addEventListener('blur', shrink)`."],
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      summary: 'Animate what the compositor can move cheaply, and stop work nobody can see.',
      steps: [
        {
          id: 'transforms',
          title: 'Transforms, not layout',
          body: `Animating \`left\`, \`top\`, \`width\` or \`height\` makes the browser recalculate layout every frame — on a slow phone that stutters. **Transforms** (\`x\`, \`y\`, \`scale\`, \`rotate\`) and \`opacity\` move pixels that are already painted, often on the GPU.

**Your turn:** slide \`.slider\` 200px with \`x\` instead of \`left\`, and stretch it with \`scaleX: 1.5\` instead of \`width: 72\`.`,
          markup: slider,
          starter: `live.to('.slider', { left: 200, width: 72, duration: 1, ease: 'power2.inOut' })`,
          solution: `live.to('.slider', { x: 200, scaleX: 1.5, duration: 1, ease: 'power2.inOut' })`,
          checks: [
            animates('.slider', 'x'),
            animates('.slider', 'scaleX'),
            custom('No layout properties', (context) => {
              const layout = context.tracks('.slider').map((track) => track.property).filter((property) => LAYOUT_PROPERTIES.includes(property))
              return layout.length === 0 || `Still animating ${layout.join(', ')}: use transforms instead.`
            }),
          ],
          hints: ['`left` becomes `x`, and `width: 72` (1.5 × 48) becomes `scaleX: 1.5`.'],
        },
        {
          id: 'pause-offscreen',
          title: 'Stop when nobody can see it',
          body: `A canvas redrawn every frame costs battery even when it has scrolled away. A scroll trigger with no animation can switch the work on and off: \`onEnter\` / \`onEnterBack\` when it comes into view, \`onLeave\` / \`onLeaveBack\` when it goes.

**Your turn:** add \`draw\` to the ticker only while the canvas is on screen, and remove it when it leaves — in both scroll directions.`,
          markup: offscreenCanvas,
          starter: `const canvas = root.querySelector('canvas')\nconst ctx = canvas.getContext('2d')\nlet angle = 0\n\nfunction draw() {\n  if (!ctx) return\n  angle += 0.05\n  ctx.clearRect(0, 0, canvas.width, canvas.height)\n  ctx.fillStyle = '#c6ff3d'\n  ctx.fillRect(240 + Math.cos(angle) * 160 - 20, 100, 40, 40)\n}\n\nlive.ticker.add(draw)\n`,
          solution: `const canvas = root.querySelector('canvas')\nconst ctx = canvas.getContext('2d')\nlet angle = 0\n\nfunction draw() {\n  if (!ctx) return\n  angle += 0.05\n  ctx.clearRect(0, 0, canvas.width, canvas.height)\n  ctx.fillStyle = '#c6ff3d'\n  ctx.fillRect(240 + Math.cos(angle) * 160 - 20, 100, 40, 40)\n}\n\nconst start = () => live.ticker.add(draw)\nconst stop = () => live.ticker.remove(draw)\n\nlive.scrollTrigger({\n  trigger: canvas,\n  scroller: '.scroller',\n  onEnter: start,\n  onEnterBack: start,\n  onLeave: stop,\n  onLeaveBack: stop,\n})`,
          checks: [
            custom('Doesn’t draw before it is on screen', (context) => {
              // Only a trigger's edge callbacks may start drawing, so nothing is added before the trigger exists.
              const methods = context.calls().map((call) => call.method)
              const trigger = methods.indexOf('scrollTrigger')
              const firstAdd = methods.indexOf('ticker.add')
              return firstAdd === -1 || (trigger !== -1 && firstAdd > trigger) || 'Don’t add `draw` straight away: wait for `onEnter`.'
            }),
            custom('Starts drawing when it scrolls into view, either way', (context) => {
              const vars = context.calls('scrollTrigger')[0]?.args[0] as Record<string, (() => void) | undefined> | undefined
              if (!vars) return "Watch the canvas with `live.scrollTrigger({ trigger: canvas, scroller: '.scroller', … })`."
              for (const edge of ['onEnter', 'onEnterBack'] as const) {
                const before = context.calls('ticker.add').length
                vars[edge]?.()
                if (context.calls('ticker.add').length === before) return `\`${edge}\` should add \`draw\` to the ticker.`
              }
              return true
            }),
            custom('Stops when it scrolls away, either way', (context) => {
              const vars = context.calls('scrollTrigger')[0]?.args[0] as Record<string, (() => void) | undefined> | undefined
              if (!vars) return 'Add a scroll trigger for the canvas.'
              for (const edge of ['onLeave', 'onLeaveBack'] as const) {
                const before = context.calls('ticker.remove').length
                vars[edge]?.()
                if (context.calls('ticker.remove').length === before) return `\`${edge}\` should remove \`draw\` from the ticker.`
              }
              return true
            }),
          ],
          hints: ['`const start = () => live.ticker.add(draw)` and `const stop = () => live.ticker.remove(draw)`.', 'Pass `onEnter: start, onEnterBack: start, onLeave: stop, onLeaveBack: stop`.'],
        },
      ],
    },
  ],
}
