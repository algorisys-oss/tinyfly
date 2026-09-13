import type { Module } from '../types'
import { custom } from '../checks'

/**
 * Module 6: interaction. Motion that answers the pointer: hover states, a
 * magnetic pull with quickTo, dragging and throwing, Flip layout changes, and a
 * canvas drawn from a tweened object on the ticker. Checks fire the events a
 * person would, then look at what the code built in response.
 */

const STYLE = `<style>
  .stage { position: relative; height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 14px; color: #f2efe9; font-family: system-ui, sans-serif; }
  .button { padding: 12px 24px; border-radius: 999px; background: #c6ff3d; color: #0b0b0c; font-weight: 700; cursor: pointer; }
  .area { position: relative; width: 240px; height: 150px; border-radius: 12px; background: #16161a; display: grid; place-items: center; }
  .card { width: 70px; height: 70px; border-radius: 14px; background: #4a9eff; cursor: grab; touch-action: none; }
  .grid { display: grid; grid-template-columns: repeat(3, 40px); gap: 8px; }
  .grid.wide { grid-template-columns: repeat(6, 40px); }
  .tile { height: 40px; border-radius: 8px; background: #8b5cf6; }
  .toggle { padding: 6px 12px; border-radius: 6px; background: #26262b; color: #ddd; font-size: 13px; cursor: pointer; }
  canvas { width: 240px; height: 120px; background: #111; border-radius: 10px; }
</style>`

const oneButton = `${STYLE}<div class="stage"><div class="button">Hover me</div></div>`
const magnetArea = `${STYLE}<div class="stage"><div class="area"><div class="button magnet">Pull</div></div></div>`
const dragArea = `${STYLE}<div class="stage"><div class="area"><div class="card"></div></div></div>`
const grid = `${STYLE}<div class="stage"><div class="toggle">Toggle layout</div><div class="grid">${'<div class="tile"></div>'.repeat(6)}</div></div>`
const canvas = `${STYLE}<div class="stage"><canvas width="480" height="240"></canvas></div>`

/** The last value a property reaches, across everything built so far. */
const endValue = (context: Parameters<Parameters<typeof custom>[1]>[0], selector: string, property: string) =>
  context.valueAt(selector, property, 60)

export const interactionModule: Module = {
  id: 'interaction',
  title: 'Interaction',
  summary: 'Hover states, magnetic pulls, dragging and throwing, Flip layout changes, and canvas drawn on the ticker.',
  lessons: [
    {
      id: 'pointer',
      title: 'Pointer',
      summary: 'Respond to hovering, and follow the pointer smoothly.',
      steps: [
        {
          id: 'hover',
          title: 'Hover in, hover out',
          body: `Interaction is ordinary event handling that starts tweens. Each new tween starts from where the property is **now**, so rapid in-and-out stays smooth.

**Your turn:** when the pointer enters \`.button\`, scale it to \`1.08\` over \`0.2\`s; when it leaves, scale it back to \`1\`.`,
          markup: oneButton,
          starter: `const button = root.querySelector('.button')\n\nbutton.addEventListener('pointerenter', () => {\n  // grow\n})\n`,
          solution: `const button = root.querySelector('.button')\n\nbutton.addEventListener('pointerenter', () => {\n  live.to(button, { scale: 1.08, duration: 0.2, ease: 'power2.out' })\n})\nbutton.addEventListener('pointerleave', () => {\n  live.to(button, { scale: 1, duration: 0.2, ease: 'power2.out' })\n})`,
          checks: [
            custom('Hovering grows it to 1.08', (context) => {
              context.fire('.button', 'pointerenter')
              const scale = endValue(context, '.button', 'scale')
              return (typeof scale === 'number' && Math.abs(scale - 1.08) < 0.001) || 'On `pointerenter`, tween `scale` to 1.08.'
            }),
            custom('Leaving shrinks it back to 1', (context) => {
              context.fire('.button', 'pointerenter')
              context.fire('.button', 'pointerleave')
              const scale = endValue(context, '.button', 'scale')
              return (typeof scale === 'number' && Math.abs(scale - 1) < 0.001) || 'On `pointerleave`, tween `scale` back to 1.'
            }),
          ],
          hints: ["`root` is the preview; `root.querySelector('.button')` finds the button.", 'Add a second listener for `pointerleave`.'],
        },
        {
          id: 'magnetic',
          title: 'A magnetic pull with quickTo',
          body: `A pointer fires dozens of events a second. Starting a tween for each works, but \`live.quickTo(target, property)\` is made for this: it returns a function that re-aims **one** tween, from wherever the value is.

**Your turn:** make \`.magnet\` lean toward the pointer while it moves over \`.area\` — \`x\` and \`y\` a third of the distance from the area's centre.`,
          markup: magnetArea,
          starter: `const area = root.querySelector('.area')\nconst magnet = root.querySelector('.magnet')\n\narea.addEventListener('pointermove', (event) => {\n  const box = area.getBoundingClientRect()\n  const dx = event.clientX - (box.left + box.width / 2)\n  const dy = event.clientY - (box.top + box.height / 2)\n  // move the magnet toward the pointer\n})\n`,
          solution: `const area = root.querySelector('.area')\nconst magnet = root.querySelector('.magnet')\nconst moveX = live.quickTo(magnet, 'x', { duration: 0.4, ease: 'power3.out' })\nconst moveY = live.quickTo(magnet, 'y', { duration: 0.4, ease: 'power3.out' })\n\narea.addEventListener('pointermove', (event) => {\n  const box = area.getBoundingClientRect()\n  const dx = event.clientX - (box.left + box.width / 2)\n  const dy = event.clientY - (box.top + box.height / 2)\n  moveX(dx / 3)\n  moveY(dy / 3)\n})`,
          checks: [
            custom('Uses quickTo for x and y', (context) => {
              const properties = context.calls('quickTo').map((call) => call.args[1])
              return (properties.includes('x') && properties.includes('y')) || "Create `live.quickTo(magnet, 'x')` and `live.quickTo(magnet, 'y')`."
            }),
            custom('Moving the pointer pulls it along', (context) => {
              const box = context.root.querySelector('.area')!.getBoundingClientRect()
              const cx = box.left + box.width / 2
              const cy = box.top + box.height / 2
              context.fire('.area', 'pointermove', { clientX: cx + 90, clientY: cy - 30 })
              const x = endValue(context, '.magnet', 'x')
              const y = endValue(context, '.magnet', 'y')
              return (typeof x === 'number' && typeof y === 'number' && Math.abs(x - 30) < 1 && Math.abs(y + 10) < 1) || `Moving 90px right and 30px up should pull it to x: 30, y: -10 (it went to ${x}, ${y}).`
            }),
          ],
          hints: ["Create the setters once, outside the listener: `const moveX = live.quickTo(magnet, 'x')`.", 'Inside the listener call `moveX(dx / 3)` and `moveY(dy / 3)`.'],
        },
      ],
    },
    {
      id: 'drag',
      title: 'Drag and throw',
      summary: 'Make an element draggable, then let it fly on release.',
      steps: [
        {
          id: 'draggable',
          title: 'Make it draggable',
          body: `\`live.draggable(target, options)\` makes an element follow the pointer while pressed. \`bounds\` keeps it inside another element.

**Your turn:** make \`.card\` draggable, kept inside \`.area\`. Then try dragging it in the preview.`,
          markup: dragArea,
          starter: `// make .card draggable inside .area\n`,
          solution: `live.draggable('.card', { bounds: '.area' })`,
          checks: [
            custom('`.card` is draggable', (context) => context.calls('draggable').some((call) => call.args[0] === '.card' || (call.args[0] as Element)?.classList?.contains('card')) || "Call `live.draggable('.card', …)`."),
            custom('It stays inside `.area`', (context) => {
              const options = context.calls('draggable')[0]?.args[1] as { bounds?: unknown } | undefined
              return options?.bounds === '.area' || "Pass `{ bounds: '.area' }`."
            }),
          ],
          hints: ["`live.draggable('.card', { bounds: '.area' })`"],
        },
        {
          id: 'throw',
          title: 'Throw it',
          body: `With \`inertia: true\` the card keeps moving when you let go, at the speed you released it, and slows to a stop — a throw. Inertia is deterministic data too, like every other track.

**Your turn:** add \`inertia: true\` and throw the card around the area.`,
          markup: dragArea,
          starter: `live.draggable('.card', { bounds: '.area' })`,
          solution: `live.draggable('.card', { bounds: '.area', inertia: true })`,
          checks: [
            custom('Throws on release', (context) => {
              const options = context.calls('draggable')[0]?.args[1] as { inertia?: unknown; bounds?: unknown } | undefined
              return (options?.inertia === true || typeof options?.inertia === 'object') || 'Add `inertia: true`.'
            }),
            custom('Still bounded by `.area`', (context) => {
              const options = context.calls('draggable')[0]?.args[1] as { bounds?: unknown } | undefined
              return options?.bounds === '.area' || "Keep `bounds: '.area'`."
            }),
          ],
          hints: ["`live.draggable('.card', { bounds: '.area', inertia: true })`"],
        },
      ],
    },
    {
      id: 'layout-canvas',
      title: 'Layout and canvas',
      summary: 'Animate a layout change with Flip, and drive a canvas from a tweened object.',
      steps: [
        {
          id: 'flip',
          title: 'Animate a layout change',
          body: `Changing a class that rearranges a grid makes elements **jump**. \`live.flip(targets, change)\` records where they are, runs your change, and animates each one from its old place to its new one.

**Your turn:** when \`.toggle\` is clicked, toggle the \`wide\` class on \`.grid\` inside \`live.flip('.tile', …)\`.`,
          markup: grid,
          starter: `const grid = root.querySelector('.grid')\n\nroot.querySelector('.toggle').addEventListener('click', () => {\n  grid.classList.toggle('wide')\n})\n`,
          solution: `const grid = root.querySelector('.grid')\n\nroot.querySelector('.toggle').addEventListener('click', () => {\n  live.flip('.tile', () => grid.classList.toggle('wide'), { duration: 0.6, ease: 'power2.inOut', stagger: 0.03 })\n})`,
          checks: [
            custom('Clicking toggles the layout', (context) => {
              const grid = context.root.querySelector('.grid')!
              const before = grid.classList.contains('wide')
              context.fire('.toggle', 'click')
              return grid.classList.contains('wide') !== before || 'Clicking `.toggle` should toggle `wide` on `.grid`.'
            }),
            custom('The change runs inside live.flip', (context) => {
              const calls = context.calls('flip').length
              if (calls === 0) context.fire('.toggle', 'click')
              return context.calls('flip').length > 0 || "Wrap the class change: `live.flip('.tile', () => grid.classList.toggle('wide'))`."
            }),
          ],
          hints: ["`live.flip('.tile', () => grid.classList.toggle('wide'))` inside the click handler."],
        },
        {
          id: 'canvas',
          title: 'Canvas from a tweened object',
          body: `tinyfly can tween a **plain object** — useful for canvas, WebGL or anything that isn't a DOM element. Draw it every frame with \`live.ticker.add\`, which runs after each frame's values are applied.

**Your turn:** tween \`ball.x\` from \`20\` to \`220\` over \`1\`s (repeating, yoyo), and draw the ball on the ticker.`,
          markup: canvas,
          starter: `const canvas = root.querySelector('canvas')\nconst ctx = canvas.getContext('2d')\nconst ball = { x: 20 }\n\nfunction draw() {\n  if (!ctx) return\n  ctx.clearRect(0, 0, canvas.width, canvas.height)\n  ctx.beginPath()\n  ctx.arc(ball.x * 2, 120, 24, 0, Math.PI * 2)\n  ctx.fillStyle = '#c6ff3d'\n  ctx.fill()\n}\n`,
          solution: `const canvas = root.querySelector('canvas')\nconst ctx = canvas.getContext('2d')\nconst ball = { x: 20 }\n\nfunction draw() {\n  if (!ctx) return\n  ctx.clearRect(0, 0, canvas.width, canvas.height)\n  ctx.beginPath()\n  ctx.arc(ball.x * 2, 120, 24, 0, Math.PI * 2)\n  ctx.fillStyle = '#c6ff3d'\n  ctx.fill()\n}\n\nlive.to(ball, { x: 220, duration: 1, ease: 'power2.inOut', repeat: -1, yoyo: true })\nlive.ticker.add(draw)`,
          checks: [
            custom('Tweens the object', (context) => {
              const track = context.tracks().find((candidate) => candidate.property === 'x' && candidate.target.startsWith('obj-'))
              if (!track || !('keyframes' in track)) return 'Tween the `ball` object: `live.to(ball, { x: 220 })`.'
              const last = track.keyframes[track.keyframes.length - 1].value
              return last === 220 || `ball.x goes to ${last}, not 220.`
            }),
            custom('Draws on the ticker', (context) => context.calls('ticker.add').length > 0 || 'Add `live.ticker.add(draw)`.'),
          ],
          hints: ['`live.to(ball, { x: 220, duration: 1, repeat: -1, yoyo: true })`', 'Then `live.ticker.add(draw)`.'],
        },
      ],
    },
  ],
}
