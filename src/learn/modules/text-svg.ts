import type { Module } from '../types'
import { animates, custom, valueIs } from '../checks'

/**
 * Module 5: text and SVG. Splitting text into words and lines, scrambling it, and
 * the three SVG staples: drawing a stroke, morphing a shape, following a path.
 */

const STYLE = `<style>
  .stage { height: 190px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; padding: 0 20px; color: #f2efe9; font-family: system-ui, sans-serif; }
  .headline { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; text-align: center; max-width: 16ch; line-height: 1.1; }
  .code { font: 700 22px ui-monospace, SFMono-Regular, Menlo, monospace; color: #c6ff3d; }
  svg { overflow: visible; }
  .stroke { fill: none; stroke: #c6ff3d; stroke-width: 4; stroke-linecap: round; }
  .shape { fill: #4a9eff; }
  .dot { fill: #ec4899; }
  .route { fill: none; stroke: #333; stroke-width: 2; stroke-dasharray: 4 6; }
</style>`

const headline = `${STYLE}<div class="stage"><h2 class="headline">Motion that reads like editorial type</h2></div>`
const code = `${STYLE}<div class="stage"><div class="code">LOADING</div></div>`
const drawing = `${STYLE}<div class="stage"><svg width="240" height="120" viewBox="0 0 240 120"><path class="stroke" d="M10 100 C 60 10, 120 10, 130 60 S 200 110, 230 20" /></svg></div>`
const STAR = 'M60 5 L74 42 L114 44 L83 68 L94 106 L60 84 L26 106 L37 68 L6 44 L46 42 Z'
const morphing = `${STYLE}<div class="stage"><svg width="120" height="120" viewBox="0 0 120 120"><path class="shape" id="blob" d="M60 10 C 88 10 110 32 110 60 C 110 88 88 110 60 110 C 32 110 10 88 10 60 C 10 32 32 10 60 10 Z" /><path id="star" d="${STAR}" style="display:none" /></svg></div>`
const ROUTE = 'M10 90 C 70 0, 130 140, 230 40'
const following = `${STYLE}<div class="stage"><svg width="240" height="130" viewBox="0 0 240 130"><path class="route" d="${ROUTE}" /><circle class="dot" cx="0" cy="0" r="8" /></svg></div>`

export const textSvgModule: Module = {
  id: 'text-svg',
  title: 'Text and SVG',
  summary: 'Reveal text word by word and line by line, scramble it, draw strokes, morph shapes and follow paths.',
  lessons: [
    {
      id: 'text',
      title: 'Text',
      summary: 'Split text into pieces you can animate, and scramble it into place.',
      steps: [
        {
          id: 'words',
          title: 'Split into words',
          body: `To animate text word by word, first **split** it. \`live.splitText(target, { type: 'words' })\` wraps each word in a span and returns them as \`split.words\` — then they animate like any elements.

**Your turn:** split the headline into words and bring them in from \`y: 20\`, \`opacity: 0\`, \`0.08\`s apart.`,
          markup: headline,
          starter: `const split = live.splitText('.headline', { type: 'words' })\n// animate split.words\n`,
          solution: `const split = live.splitText('.headline', { type: 'words' })\nlive.from(split.words, { y: 20, opacity: 0, duration: 0.5, stagger: 0.08 })`,
          checks: [
            custom('The headline is split into words', (context) => context.root.querySelectorAll('.headline .word').length === 6 || 'Call `live.splitText(\'.headline\', { type: \'words\' })`.'),
            valueIs('.headline .word', 'opacity', 0, 0),
            valueIs('.headline .word:last-of-type', 'opacity', 1),
            custom('Words arrive one after another', (context) => {
              const first = context.valueAt('.headline .word', 'opacity', 0.3)
              const last = context.valueAt('.headline .word:last-of-type', 'opacity', 0.3)
              return (typeof first === 'number' && typeof last === 'number' && first > last) || 'Add `stagger: 0.08` so later words start later.'
            }),
          ],
          hints: ['`live.from(split.words, { y: 20, opacity: 0, stagger: 0.08 })`'],
        },
        {
          id: 'lines',
          title: 'Lines behind a mask',
          body: `\`type: 'lines'\` groups words into the lines the browser actually wrapped, and \`mask: 'lines'\` wraps each line in a clipping box — so a line can rise **from behind its own edge**, the classic editorial reveal.

**Your turn:** split into lines with a mask, and move each line up from \`y: 40\`, \`0.12\`s apart.`,
          markup: headline,
          starter: `const split = live.splitText('.headline', { type: 'words' })\nlive.from(split.words, { y: 20, opacity: 0, stagger: 0.08 })`,
          solution: `const split = live.splitText('.headline', { type: 'lines', mask: 'lines' })\nlive.from(split.lines, { y: 40, duration: 0.8, ease: 'power3.out', stagger: 0.12 })`,
          checks: [
            custom('Lines are split and masked', (context) =>
              (context.root.querySelectorAll('.headline .line').length > 0 && context.root.querySelectorAll('.headline .line-mask').length > 0) ||
              "Use `{ type: 'lines', mask: 'lines' }`."
            ),
            valueIs('.headline .line', 'y', 40, 0),
            valueIs('.headline .line', 'y', 0),
          ],
          hints: ["`live.from(split.lines, { y: 40, stagger: 0.12 })` after splitting with `{ type: 'lines', mask: 'lines' }`."],
        },
        {
          id: 'scramble',
          title: 'Scramble into place',
          body: `\`scrambleText\` swaps the text through random characters and resolves it left to right. It is seeded, so it replays identically.

**Your turn:** scramble \`.code\` into \`'ACCESS GRANTED'\` over \`1.2\`s.`,
          markup: code,
          starter: `live.to('.code', {  })`,
          solution: `live.to('.code', { scrambleText: 'ACCESS GRANTED', duration: 1.2 })`,
          checks: [
            animates('.code', 'text'),
            custom('It ends reading ACCESS GRANTED', (context) => {
              const text = context.valueAt('.code', 'text', 1.2)
              return text === 'ACCESS GRANTED' || `It ends as ${JSON.stringify(text)}.`
            }),
            custom('It is scrambled on the way', (context) => {
              const middle = context.valueAt('.code', 'text', 0.4)
              return (typeof middle === 'string' && middle !== 'ACCESS GRANTED' && middle !== 'LOADING') || 'Part-way through, the text should be a mix of scrambled characters.'
            }),
          ],
          hints: ["`live.to('.code', { scrambleText: 'ACCESS GRANTED', duration: 1.2 })`"],
        },
      ],
    },
    {
      id: 'svg',
      title: 'SVG',
      summary: 'Draw a stroke, morph one shape into another, and move along a path.',
      steps: [
        {
          id: 'draw',
          title: 'Draw a stroke',
          body: `\`drawSVG\` animates how much of a stroke is drawn: \`0\` is none, \`true\` is all of it, and \`'20% 80%'\` is a segment. tinyfly measures the path's length for you.

**Your turn:** draw the line in from nothing over \`1.5\`s.`,
          markup: drawing,
          starter: `live.from('.stroke', {  })`,
          solution: `live.from('.stroke', { drawSVG: 0, duration: 1.5, ease: 'power2.inOut' })`,
          checks: [
            animates('.stroke', 'strokeDashoffset'),
            custom('Nothing is drawn at the start', (context) => {
              const dashes = context.valueAt('.stroke', 'strokeDasharray', 0)
              return (Array.isArray(dashes) && dashes[0] < 1) || 'At the start the visible dash should be 0 long: use `drawSVG: 0` with `from`.'
            }),
            custom('All of it is drawn at the end', (context) => {
              const start = context.valueAt('.stroke', 'strokeDasharray', 0)
              const end = context.valueAt('.stroke', 'strokeDasharray', 1.5)
              return (Array.isArray(end) && Array.isArray(start) && end[0] > 0 && Math.abs(end[0] - end[1]) < 1) || 'By the end the whole stroke should be drawn.'
            }),
          ],
          hints: ["`live.from('.stroke', { drawSVG: 0, duration: 1.5 })`"],
        },
        {
          id: 'morph',
          title: 'Morph a shape',
          body: `\`morphSVG\` turns one path into another — here the circle into the (hidden) star. Pass the target shape as a selector; tinyfly pairs the points and keeps corners sharp.

**Your turn:** morph \`#blob\` into \`#star\` over \`1\`s.`,
          markup: morphing,
          starter: `live.to('#blob', {  })`,
          solution: `live.to('#blob', { morphSVG: '#star', duration: 1, ease: 'power2.inOut' })`,
          checks: [
            animates('#blob', 'd'),
            custom('It ends as the star', (context) => {
              const [track] = context.tracks('#blob', 'd')
              const last = track && 'keyframes' in track ? String(track.keyframes[track.keyframes.length - 1].value) : ''
              const normalise = (path: string) => path.replace(/\s+/g, ' ').trim()
              return normalise(last) === normalise(STAR) || 'The final shape should be `#star`.'
            }),
          ],
          hints: ["`live.to('#blob', { morphSVG: '#star', duration: 1 })`"],
        },
        {
          id: 'follow',
          title: 'Follow a path',
          body: `\`motionPath\` moves an element along a curve instead of a straight line. Give it path data, and \`autoRotate: true\` if it should face the way it is going.

**Your turn:** move the \`.dot\` along the dashed route — path \`'${ROUTE}'\` — over \`2\`s.`,
          markup: following,
          starter: `live.to('.dot', {  })`,
          solution: `live.to('.dot', { motionPath: { path: '${ROUTE}' }, duration: 2, ease: 'power1.inOut' })`,
          checks: [
            animates('.dot', 'motionPath'),
            custom('It ends at the end of the route', (context) => {
              const x = context.valueAt('.dot', 'motionPathX', 2)
              const y = context.valueAt('.dot', 'motionPathY', 2)
              return (typeof x === 'number' && typeof y === 'number' && Math.abs(x - 230) < 1 && Math.abs(y - 40) < 1) || 'It should finish at the end of the path (230, 40).'
            }),
            custom('It curves rather than going straight', (context) => {
              const y = context.valueAt('.dot', 'motionPathY', 1)
              return (typeof y === 'number' && Math.abs(y - 65) > 2) || 'Half-way it should be off the straight line between the ends.'
            }),
          ],
          hints: [`\`motionPath: { path: '${ROUTE}' }\``],
        },
      ],
    },
  ],
}
