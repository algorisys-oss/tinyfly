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

| `histogram` | `distribution`, `count` (samples so far), `bins?: [from, to, n]`, `scale?: 'density' \| 'count'`, `curve?`, `seed?` |
| `distribution` | `distribution`, `shade?: [a, b]` (P(a ≤ X ≤ b)), `domain?` |
| `galton` | `rows?`, `balls` (fractional: the next ball on its way), `spacing?`, `top?`, `seed?` |
| `scatter` | `points: { kind: 'uniform', x, y }` or `{ kind: 'linear', slope, intercept, noise, x }`, `count`, `inside?` (an expression in x and y, true when ≤ 0), `fit?`, `seed?` |
| `bayes` | `prior`, `truePositive`, `falsePositive`, `at?`, `size?`, `labels?` |
| `graph` | `nodes: [{ id, at?, label? }]`, `edges` (`[from, to, weight?]` or objects), `directed?`, `tree?: { root, spacing?, at? }`, `search?: { kind: 'bfs' \| 'dfs' \| 'dijkstra', start }`, `step?`, `frontier?` (screen px), `weights?`, `radius?` |
| `venn` | `sets` (two or three `{ id, label?, color? }`), `highlight?` (a set expression), `highlightColor?`, `at?`, `radius?`, `universe?` |
| `clock` | `modulus`, `value`, `at?`, `radius?` |
| `network` | `layers` (`[3, 5, 4, 2]`), `activation?: 'sigmoid' \| 'tanh' \| 'relu'`, `inputs?`, `flow?`, `seed?`, `at?`, `size?`, `labels?: { inputs?, outputs? }`, `radius?` |
| `heatmap` | `cells` (rows, top first; `softmax?` per row) or `expr` in x and y with `region?`, `resolution?`; `range?`, `colormap?: 'viridis' \| 'heat' \| 'diverging'`, `rowLabels?`, `colLabels?`, `values?`, `at?`, `size?` |
| `contours` | `expr` in x and y, `levels?` (a count or the levels), `region?`, `resolution?`, `colormap?` |
| `descent` | `expr` in x and y, `start`, `rate`, `steps`, `momentum?` |
| `classifier` | `epochs`, `centres?`, `count?`, `spread?`, `rate?`, `start?: [w₁, w₂, b]`, `probability?`, `seed?` |
| `kmeans` | `centres` (the true clusters), `iteration`, `k?`, `count?`, `spread?`, `seed?` |

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
| `histogram` | `ID.count`, `ID.mean`, `ID.sd` (of the samples so far) |
| `distribution` | `ID.p` (the shaded probability), `ID.mean`, `ID.sd` |
| `galton` | `ID.landed` |
| `scatter` | `ID.count`, `ID.inside`, `ID.ratio`, `ID.slope`, `ID.intercept`, `ID.r` |
| `bayes` | `ID.prior`, `ID.posterior`, `ID.positive`, `ID.truePositive`, `ID.falsePositive` |
| `graph` with a search | `ID.visited`, `ID.steps`, and for Dijkstra `ID.d.NODE` (∞ until known) |
| `clock` | `ID.hour` (value mod modulus), `ID.turns` |
| `network` | `ID.out0`, `ID.out1` … (the outputs) |
| `descent` | `ID.x`, `ID.y`, `ID.loss`, `ID.step` |
| `classifier` | `ID.accuracy`, `ID.loss`, `ID.epoch` |
| `kmeans` | `ID.inertia`, `ID.iteration`, `ID.iterations` |

### Machine learning

Everything is seeded and worked out exactly, so a figure trains the same way
every time:

- **Networks** draw seeded weights: blue edges add, red ones subtract, and
  thicker edges count more. `flow` moves activations layer by layer, with
  pulses on the edges being fed.
- **Descent** takes exact partial derivatives of its expression, so the path
  follows the true gradient. A step size that diverges stops cleanly.
- **Classifiers** train logistic regression by full-batch gradient descent,
  starting from a deliberately wrong line that visibly turns into place.
- **k-means** runs Lloyd's algorithm from the points nearest the middle of the
  data, so the centroids travel; a fractional `iteration` glides them.
- **Heatmaps and contours** colour through a colormap. Dimmed cells are
  pre-mixed with the background, so neighbours never leave seams. Contours are
  traced by marching squares and joined into whole curves.

#### A loss surface in 3D

`lossSurface3D({ expr, start, rate, momentum?, steps?, region?, height?, orbit? })`
builds f(x, y) as a 3D scene for `@algorisys/tinyfly/scene-3d`. You get a mesh
coloured by height, a ball rolling down the exact-gradient path, the path
appearing behind it, and a slow camera orbit. It returns plain data:
`{ scene, tracks, duration, path, losses }`. The maths module does not import
scene-3d.

```js
import { lossSurface3D } from '@algorisys/tinyfly/math'
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'
import { deserializeTimeline } from '@algorisys/tinyfly'

const loss = lossSurface3D({ expr: '(x^2 + 4 y^2) / 4 + sin(1.5 x) / 2', start: [-2.6, 2.2], rate: 0.18, momentum: 0.6 })
const scene = loadScene3D(loss.scene)
const timeline = deserializeTimeline({ id: 'loss', config: { duration: loss.duration }, tracks: loss.tracks })
// each frame: drawScene3D(ctx, scene, timeline.getStateAtTime(t).values, { width, height })
```

The pieces are also available on their own: `seededNetwork`, `forward`,
`descentPath`, `trainLogistic`, `kmeansHistory`, `contourLines`, `colorAt`.

### Graphs, searches and sets

A search is shown step by step: `step` counts the nodes finished, and its
fractional part draws the edge the search is crossing to the next one. Finished
nodes are yellow; nodes waiting in the queue (breadth first), the stack (depth
first) or the open set (Dijkstra) are blue; yellow edges are how each node was
reached. Neighbours are taken in the order the nodes are listed, so a search
always tells the same story (`searchEvents` returns it as data). A tree lays
itself out from its root when nodes have no `at` (`treeLayout`), which is how
`recursionTreeFigure` draws the calls a recursive function makes.

Venn regions are set expressions: `A | B`, `A & B`, `A - B`, `A ^ B`, `A'` (or
`!A`), with brackets; `∪ ∩ ∖ △ ¬` work too. Each cell of the region is drawn as
the universe clipped inside and outside the circles, the same in canvas and SVG.

### Distributions and randomness

A distribution is data: `{ kind: 'normal', mean, sd }`, `uniform` (`min`,
`max`), `exponential` (`rate`), `binomial` (`n`, `p`), `poisson` (`rate`),
`dice` (`count`, `sides`), or `{ kind: 'mean', of, count }`, the average of
`count` draws (what the central limit theorem is about). Any of its numbers
may be a value name, so a slider moves the mean or n. `density`, `meanOf`,
`sdOf`, `sample` and `samples` work on them directly.

Every sample comes from a seed (the item id unless `seed` is given), through
the engine's `createRandom`, `randomNormal` and `shuffled`. A histogram that
grows from 10 to 1000 samples keeps its first 10, and every render, video and
reader sees the same draws.

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

<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.121.0/cdn/tinyfly-math.iife.js" data-tinyfly-auto></script>
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

## Presenting with characters

`mathSurface(figure, { x, y })` makes a figure a **surface**, the way a code
panel, a whiteboard or a chart is one. Its places have names, so a character's
beats can aim at them as plain data. Its edits change the figure when a beat
says so, recorded on the figure's own props:

```js
import { linearMapFigure, mathSurface } from '@algorisys/tinyfly/math'
import { surfaceScript } from '@algorisys/tinyfly/characters'

const fig = mathSurface(linearMapFigure({ width: 400, height: 400 }), { x: 20, y: 20 })
const on = (anchor) => ({ surface: 'fig', anchor })
const result = surfaceScript('teacher', { fig }, [
  { do: 'walk', to: 560 },
  { do: 'point', target: on('tip:basis.j'), say: 'Now slide it over…',
    then: { surface: 'fig', edit: 'set', anchor: 'value:M', value: [1, 1, 0, 1] } },
  { do: 'point', target: on('item:square'), say: 'A shear: the area stays 1.' },
], { from: 740, ground: 420, height: 190 })
// result.tracks: the figure's and the teacher's tracks; draw fig.target with its props
```

| Anchor | Names |
|---|---|
| `box` | the whole figure |
| `item:ID` | everything an item draws |
| `tip:ID` | the tip of a vector (`tip:basis.i`, `tip:basis.j` for î and ĵ) |
| `point:ID` | a point, including one riding a curve |
| `node:GRAPH:NODE` | a node of a graph |
| `term:ID:TEXT` | glyphs of an equation or label by their text (`term:eq:2x`; `term:eq#2:x` for the second) |
| `value:NAME` | a value, for `set` (its box is the whole figure) |

| Edit | Does |
|---|---|
| `drawOn`, `erase` | draws an item on, or off (`item:ID`) |
| `show`, `hide` | fades an item in or out |
| `step` | moves an equation to step `to`, terms gliding |
| `set` | tweens a value to `value`: a number, `[x, y]` or `[a, b, c, d]` |

Anchors are worked out from the figure as it is at that moment, so after a
`set` warps the plane, `tip:basis.i` is where î has gone. Parts of a figure do
not come loose: `piece`, `fling`, `follow` and `move` explain that edits are
the way to change it.

## Equations

Equations are typeset by a built-in TeX subset, with no KaTeX or MathJax:

- `^` and `_`, `\frac`, `\sqrt`, `\vec`, `\hat`, `\bar`
- `\sum`, `\prod` and `\int`, with limits above and below in display style
- Named operators: `\sin \cos \tan \log \ln \exp \det \lim \max \min` …
- Greek letters
- Symbols: `\cdot \times \pm \le \ge \ne \approx \to \infty \partial \nabla \in \cup \cap \triangle \varnothing` …
- Matrices: `\begin{pmatrix|bmatrix|vmatrix|matrix} … \end{…}`
- `\binom{n}{k}`, `\text{…}`, `\color{name}{…}`, and spacing `\, \; \quad`
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
| `normalFigure({ mean, sd, shade })` | The normal curve with P(a ≤ X ≤ b) shaded (`mu`, `sigma`, `a`, `b`) |
| `binomialFigure({ n, p })` | Binomial bars |
| `cltFigure({ of, k, samples })` | Means of `k` draws piling into a normal curve |
| `galtonFigure({ rows, balls })` | A Galton board |
| `monteCarloPiFigure({ count })` | Points in a square; the share inside the circle ≈ π/4 |
| `regressionFigure({ slope, intercept, noise, count })` | Noisy points and the least-squares line |
| `bayesFigure({ prior, sensitivity, falsePositive })` | A medical test as areas: P(condition given a positive) |
| `graphSearchFigure({ search, start })` | Breadth- or depth-first search on a sample graph, with its queue or stack (`step`) |
| `shortestPathFigure({ start, target })` | Dijkstra on the weighted sample graph, distances shown (`step`) |
| `recursionTreeFigure({ n })` | The call tree of naive recursive Fibonacci, in call order (`step`) |
| `vennFigure({ sets, highlight, label })` | Two or three sets with a region shaded |
| `clockFigure({ modulus, value })` | Clock arithmetic (`value`) |
| `neuralNetworkFigure({ layers, activation, inputs })` | A forward pass (`flow`, inputs `in0` …) |
| `gradientDescentFigure({ expr, start, rate, momentum })` | Descent on a narrow valley over its contours (`steps`, `rate`, `momentum`) |
| `attentionFigure({ tokens, scores })` | Attention weights, softmaxed per row, with token labels |
| `decisionBoundaryFigure({ rate, spread })` | Logistic regression finding the line between two clusters (`epochs`) |
| `kmeansFigure({ centres, k })` | k-means finding clusters (`iteration`) |
| `activationFigure()` | Sigmoid, tanh and ReLU |

Each returns a plain figure to change or extend. In each, `M` starts at the
identity unless `matrix` is given.

## Examples

- Gallery: **Linear Map**, **Eigenvectors**, **Equation Steps**, **Matrix Lesson**,
  **Derivative**, **Riemann Sums**, **Taylor Series**, **Galton Board**, **Central Limit
  Theorem**, **Monte Carlo π**, **Bayes: a Positive Test**, **Graph Search**, **Recursion
  Tree**, **Set Operations**, **Clock Arithmetic**, **Neural Network**, **Gradient Descent**,
  **Decision Boundary**, **K-Means**, **Attention Weights**, **Maths Presenter** and
  **Loss Surface in 3D**.
- Videos: `linear-map-short.mjs`, `riemann-short.mjs`, `galton-short.mjs`,
  `graph-search-short.mjs` and `gradient-descent-short.mjs` (9:16); `eigen-explainer.mjs`,
  `taylor-explainer.mjs`, `clt-explainer.mjs`, `de-morgan-explainer.mjs` and
  `neural-network-explainer.mjs` (16:9); `loss-surface-3d.mjs` (16:9, with scene-3d), in
  `examples/headless-video/`.

## Next

See `todo.md` for what is planned next.
See `todo.md` for their status.
