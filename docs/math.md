# Maths Animations

`@algorisys/tinyfly/math` draws maths the way teaching videos and explorable
lessons show it: a coordinate plane whose grid a matrix warps, vectors, function
plots, shaded areas, and equations typeset from TeX that rewrite themselves one
step at a time.

The same figure plays in three places:

| Where | How |
|---|---|
| **Lesson pages** | A `<figure data-tinyfly-math>` with the figure and a timeline as JSON, stepped with the embed controls (next, back, captions, questions) |
| **Short videos** | A scene for `tinyfly video`, any size: 1080×1920 for 9:16, 1920×1080 for 16:9 |
| **Explorables** | `mathExplorable()`: the reader drags vectors or matrix columns and moves sliders |

All three run the same layout: one pure function turns the figure and its
current values into shapes, which are drawn on a canvas or written as SVG. The
same values always give the same picture, in a browser, a Web Worker or Node.

## A figure is JSON

```js
import { mathFigure } from '@algorisys/tinyfly/math'

const figure = mathFigure({
  width: 600, height: 600,          // px
  x: [-5, 5],                       // world units across (y follows, square)
  theme: 'dark',                    // dark (default) | light | chalk
  values: { M: [1, 0, 0, 1], k: 1 },
  items: [
    { id: 'grid', kind: 'grid', transform: 'M', ghost: true },
    { id: 'basis', kind: 'basis', transform: 'M' },
    { id: 'wave', kind: 'function', expr: 'sin(k x)', color: 'blue' },
    { id: 'eq', kind: 'label', tex: '\\begin{bmatrix} \\val{M.a} & \\val{M.b} \\\\ \\val{M.c} & \\val{M.d} \\end{bmatrix}', at: [30, 60], screen: true, align: 'left' },
  ],
})
```

`mathFigure()` checks the figure and throws a message that says how to fix it:
unknown kinds and themes with the name probably meant, duplicate ids, values of
the wrong shape, expressions that do not parse or read a missing parameter, TeX
mistakes with their position.

### Values

Everything that moves is a **value**: a number (`k`), a vector `[x, y]` or a
matrix `[a, b, c, d]`, written row by row:

    | a  b |
    | c  d |

The first column `[a, c]` is where î lands and the second `[b, d]` is where ĵ
lands. Items name the values they use (`transform: 'M'`, `to: 'v'`), and number
values are the parameters of functions (`sin(k x)`). TeX shows values live with
`\val{name}` (`\val{name:1}` for one decimal). Matrices also give
`M.a M.b M.c M.d M.det`, and vectors give `v.x v.y v.length`.

Some names are reserved, because a track on them would move the whole figure:
`x`, `y`, `opacity`, `scale`, `rotate` and the other canvas properties, and `t`.

### Items

| Kind | Options |
|---|---|
| `grid` | `step?`, `transform?` (a matrix value), `ghost?` (the original grid, faintly underneath) |
| `axes` | `ticks?` (0 for none), `labels?` |
| `vector` | `to`, `from?`, `transform?`, `label?` (TeX), `labelAt?: 'tip' \| 'middle'`, `width?` |
| `basis` | `transform?`, `labels?`: î and ĵ |
| `point` | `at`, `transform?`, `label?`, `radius?` |
| `function` | `expr` in `x`, `domain?`, `width?` |
| `parametric` | `x` and `y` in `t`, `t?` range, `transform?` |
| `polygon` | `points?` (default the unit square), `transform?`, `fillOpacity?`, `label?` |
| `line` | `along` (a span) or `eigen` (a matrix value: one line per real eigenvector), `dashed?` |
| `label` | `tex`, `at`, `screen?` (px instead of world units), `size?`, `align?`, `backdrop?` |
| `equation` | `steps` (TeX, one per step), `at`, `screen?`, `size?`, `align?`, `backdrop?` |
| `tangent` | `expr`, `at`, `h?` (a secant through `at` and `at + h`), `length?`, `points?`, `label?` |
| `riemann` | `expr`, `from`, `to`, `n` (pieces), `rule?: 'left' \| 'right' \| 'midpoint' \| 'trapezoid'`, `fillOpacity?` |
| `area` | `expr`, `from`, `to`, `lower?` (another function), `negativeColor?`, `fillOpacity?` |
| `taylor` | `expr`, `at`, `order` (0–20; a fractional order grows the next term in), `domain?` |

`point` also rides a curve: `{ on: 'sin(x)', x: 'p' }` is the point (p, sin p), and
`hollow: true` draws an open circle for a hole or a limit. `function` takes
`derivative: n` to plot f′, f″ … and `dashed: true`.

Fields such as `at`, `from`, `to`, `n`, `h` and `order` take a number or the
name of a number value, so a timeline can slide the point, shrink the secant,
add rectangles or Taylor terms.

### Derived numbers

Items work out numbers that TeX can show with `\val{…}`:

| Item | Numbers |
|---|---|
| `tangent` | `ID.slope` (exact, or rise over run for a secant), `ID.x`, `ID.y` |
| `riemann` | `ID.sum`, `ID.exact` (the integral), `ID.n` |
| `area` | `ID.value` (the signed integral) |
| `point` on a curve | `ID.x`, `ID.y` |
| `taylor` | `ID.order`, `ID.degree` (its whole part) |

Slopes, derivative plots and Taylor coefficients come from symbolic
differentiation of the expression (`differentiate`, `compileDerivative`), so
they are exact, not finite differences. Integrals use Simpson's rule
(`integrate`). Calculus items need functions with derivatives; `floor`,
`ceil` and `round` have none and are refused with a message.

Every item has an `id` and may set `color` (a theme colour: `blue`, `green`,
`red`, `yellow`, `purple`, `orange`, `teal`, `pink`, `ink`, `grey`; or any CSS
colour), `draw` and `opacity`. Items draw in order, later ones on top.

Function plots break at gaps and asymptotes (`tan(x)`, `1/x`, `sqrt(x)` below
0) instead of joining across them.

### Expressions

Functions and curves are written as text, parsed by a small safe parser (never
`eval`): `+ - * / ^`, brackets, implicit multiplication (`2x`, `3(x + 1)`),
`pi`, `e`, `tau`, and these functions: `sin cos tan asin acos atan atan2 sinh
cosh tanh exp ln log log2 sqrt abs floor ceil round sign min max sigmoid relu`.

## What a timeline animates

A figure's target takes ordinary tracks:

| Property | Animates |
|---|---|
| a value's name (`M`, `k`, `v`) | the value; a matrix keyed from `[1, 0, 0, 1]` to `[1, 1, 0, 1]` shears the plane, every point moving in a straight line |
| `ITEM.draw` | 0..1, draws the item on like a pen |
| `ITEM.opacity` | 0..1 |
| `ITEM.step` | an equation's step; in between, terms glide |

`mathSteps()` writes these as lesson steps on a `lesson()` builder from
`@algorisys/tinyfly/teach`:

```js
import { lesson } from '@algorisys/tinyfly/teach'
import { determinantFigure, mathSteps } from '@algorisys/tinyfly/math'

const figure = determinantFigure({ theme: 'light' })
const l = lesson({ id: 'determinant' })
const m = mathSteps(l, 'fig', figure, { hidden: ['square'] })
l.marker('start', { label: 'î and ĵ span the unit square' })
m.drawOn('square')
l.marker('square', { label: 'Its area is 1', pause: true })
m.applyMatrix([2, 0, 0, 1])
l.marker('stretch', { label: 'Stretch î by 2: the area doubles', pause: true })
m.applyMatrix([2, 1, 2, 1])
l.marker('flat', { label: 'ĵ lies on î’s line', pause: true, question: 'What is the area now?' })
const timeline = l.definition()   // plain JSON
```

`mathSteps` helpers: `toValue(name, value)`, `applyMatrix(m, { name? })`,
`drawOn(id)`, `fadeIn(id)`, `fadeOut(id)`, `showStep(id, step)`. Each takes the
lesson's step options (`duration`, `easing`, `delay`).

## In a lesson page

```html
<figure data-tinyfly-math data-options='{"stepMode": true}'>
  <script type="application/json" data-tinyfly-figure>{ …the figure… }</script>
  <script type="application/json" data-tinyfly-timeline>{ …the timeline… }</script>
  <figcaption>The determinant is the area of the unit square after the map.</figcaption>
</figure>

<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.116.0/cdn/tinyfly-math.iife.js" data-tinyfly-auto></script>
```

The figure draws itself into an SVG and redraws from the timeline whenever the
player moves: playing, stepping, seeking, or showing the last frame under
reduced motion. Everything else is the ordinary embed (see
[Teaching Animations](teaching.md)): markers, captions in several languages,
questions, scenarios, pausing off screen. Tracks target `fig` unless the figure
says `data-target="…"`.

`tinyfly-math.iife.js` (about 40 KB gzipped) works on its own: it carries the
embed player and controls, `lesson()` and everything in the maths module. A figure
with no timeline is drawn as a still. Without `data-tinyfly-auto`, call
`tinyfly.mountAllMath()`.

`mathFigureToSvg(figure, values, { title })` writes a standalone SVG of a figure
at some values, for static pages, RSS, email and print.

## Explorables

```js
import { linearMapFigure, mathExplorable } from '@algorisys/tinyfly/math'

const explorable = mathExplorable(element, linearMapFigure(), {
  drag: [{ matrix: 'M', column: 0 }, { matrix: 'M', column: 1 }],   // drag î and ĵ
  sliders: [],                                                        // { value, min, max, step?, label? }
  snap: 0.1,                                                          // world units (0 for none)
  onChange: (values) => console.log(values.M),
})
explorable.set('M', [0, -1, 1, 0])
```

Drag handles take a vector value (`{ vector: 'v' }`) or a matrix column. Sliders
take number values. Every change re-lays the figure out from its values, so the
reader sees exactly what the same values give in a video.

## In a video

```js
// examples/headless-video/linear-map-short.mjs (abridged)
import { linearMapFigure, mathTarget, mathSteps } from '@algorisys/tinyfly/math'
import { lesson } from '@algorisys/tinyfly/teach'

const figure = linearMapFigure({ width: 1080, height: 1920, x: [-4, 4] })
const l = lesson({ id: 'short' })
mathSteps(l, 'fig', figure).applyMatrix([1, 1, 0, 1])
export default { width: 1080, height: 1920, fps: 30, targets: { fig: mathTarget(figure) }, timeline: l.definition() }
```

```bash
npx tinyfly video examples/headless-video/linear-map-short.mjs
```

Line widths and text sizes are given for a 600 px figure and scale with the
figure's smaller side, so a figure reads the same as a 600 px card and as a
1080×1920 short. `mathTarget()` is a canvas custom target: register it on any
`CanvasAdapter` too, and `describeTarget` / `checkTracks` know its props.

## Equations

Equations are typeset by a built-in TeX subset, with no KaTeX or MathJax:

- `^` and `_`, `\frac`, `\sqrt`, `\vec`, `\hat`, `\bar`
- `\sum`, `\prod` and `\int`, with limits above and below in display style
- Named operators: `\sin \cos \tan \log \ln \exp \det \lim \max \min` …
- Greek letters
- Symbols: `\cdot \times \pm \le \ge \ne \approx \to \infty \partial \nabla \in` …
- Matrices: `\begin{pmatrix|bmatrix|vmatrix|matrix} … \end{…}`
- `\text{…}`, `\color{name}{…}`, and spacing `\, \; \quad`
- `\left( … \right)`, with delimiters at their natural size
- `\id{name}{…}`, which names a term
- `\val{name}` and `\val{name:digits}` for live values

Layout uses fixed glyph metrics, never a font's measurements, so an equation
lands in the same place everywhere. The glyphs are drawn in a serif maths face
(`MATH_FONT`: Latin Modern Math, STIX Two Math, Cambria Math, then Times-like
fallbacks).

An `equation` item steps between lines of TeX. Terms pair up by their text and
order (`x#1`, `=#1`, `2#2`), so `2x + 3 = 7` → `2x = 4` keeps `2`, `x` and `=`,
fades `+ 3` and `7`, and fades in `4`. Name a term with `\id{lhs}{…}` to carry it
when its text changes. `layoutTex()` and `morphEquation()` are available on
their own.

## Ready figures

| Preset | Shows |
|---|---|
| `linearMapFigure()` | The grid, î, ĵ and the unit square carried by `M`, with the matrix in TeX |
| `determinantFigure()` | The same, with the square's area labelled `det = …` |
| `eigenFigure({ matrix })` | The eigenlines of `matrix` (value `A`) while `M` animates toward it |
| `vectorSumFigure({ u, v })` | u + v tip to tail |
| `spanFigure({ u, v? })` | Vectors and the lines they span |
| `tangentFigure({ expr, at })` | The tangent at `a`, with its slope |
| `secantFigure({ expr, at, h })` | The secant through `a` and `a + h`; key `h` to 0 |
| `riemannFigure({ expr, from, to, n, rule })` | `n` rectangles, the sum and the exact integral |
| `areaFigure({ expr, from, to })` | The area up to `b`, its value shown |
| `taylorFigure({ expr, at, order })` | Taylor polynomials of degree `order` |
| `limitFigure({ expr, at, limit })` | A point `p` sliding toward a hole |

Each returns a plain figure to change or extend. In each, `M` starts at the
identity unless `matrix` is given.

## Examples

- Gallery: **Linear Map**, **Eigenvectors**, **Equation Steps**, **Matrix Lesson**,
  **Derivative**, **Riemann Sums** and **Taylor Series**.
- Videos: `linear-map-short.mjs` and `riemann-short.mjs` (9:16), `eigen-explainer.mjs`
  and `taylor-explainer.mjs` (16:9), in `examples/headless-video/`.

## Next

Probability and statistics (sampling, histograms, the Galton board), discrete
maths (graphs, trees, sets) and AI/ML (networks, gradient descent on a loss
surface) build on the same figure model.
See `todo.md` for their status.
