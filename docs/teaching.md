# Teaching animations

Explanatory figures inside tutorials show how a slice grows, how a value moves
through a channel, or how a request passes through middleware. They differ from
marketing motion: readers step through them, each **state** is the message, they
carry captions in several languages, and there are many on one page. tinyfly has a
path for all of that:

| Piece | What it gives you |
|---|---|
| **Markers** in the JSON | Named steps: step through them, stop at them, caption them |
| **The player** | Shows a frame on load; steps between markers; respects reduced motion; pauses off screen |
| **`@algorisys/tinyfly/embed`** | Step controls with captions and questions, and one-script declarative mounting for CMS pages |
| **Scenarios** | Several timelines on one figure, and the reader chooses: options, a stepped slider, or clickable parts of the SVG |
| **`@algorisys/tinyfly/teach`** | A `lesson()` step builder, and diagram primitives (cells, pointer, stack, queue, table, pipeline) |
| **The `tinyfly` command** | `validate` for build pipelines; `render` a frame to static SVG for RSS, email and print |

## Quick start: one script, declarative figures

```html
<figure data-tinyfly-embed data-alt="Appending to a full slice">
  <svg viewBox="0 0 720 200">…<rect data-tinyfly="cell-3" …/>…</svg>
  <script type="application/json" data-tinyfly-timeline>{ …timeline JSON… }</script>
  <figcaption>Appending to a full slice allocates a new array.</figcaption>
</figure>

<!-- once, anywhere on the page (a site-wide footer is fine) -->
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.70.1/cdn/tinyfly-embed.iife.js" data-tinyfly-auto></script>
```

Every `[data-tinyfly-embed]` mounts when the page is ready, with no per-post
JavaScript, so optimisation plugins that defer or strip inline scripts don't break
it. Without `data-tinyfly-auto`, call `tinyfly.mountAll()` yourself.

**Which script:**

| Script | Use it when |
|---|---|
| `tinyfly.iife.js` (~53 kB gzipped) | The site also animates with code (`tinyfly.to`, scroll triggers, …). It includes the embeds too; `data-tinyfly-auto` works the same |
| `tinyfly-embed.iife.js` (~19 kB gzipped) | The page only shows teaching figures |

Loading more than one is safe: they add to the same `tinyfly` global.

| Attribute | Meaning |
|---|---|
| `data-options` | Player options as JSON, e.g. `'{"stepMode": true, "autoplay": true}'` |
| `data-src` | Load the timeline from a URL instead of an inline script |
| `data-controls="false"` | No controls (a looping illustration) |
| `data-labels` | Control labels as JSON: `'{"play": "Reproducir", "next": "Siguiente"}'` |
| `data-markers` | Steps by time for a timeline without markers: `"0,2300,3800"` (ids `step-1`, `step-2`, …) |
| `data-alt` | The figure's accessible name (otherwise its `<figcaption>`) |
| `<script type="application/json" data-tinyfly-captions>` | Translated captions for this figure |

**Embed defaults:**

- **Frame on load:** the first frame shows as soon as the figure mounts.
- **Off screen:** playback pauses while the figure is off screen or the tab is hidden.
- **Accessibility:** the SVG becomes `role="img"` with an accessible name, and step
  captions are announced politely.

For a pinned version, lock the file with its SRI hash from the CDN's `cdn/README.md`.

## Markers: the steps

```json
{
  "formatVersion": 1,
  "id": "append",
  "config": {
    "duration": 3200,
    "markers": [
      { "id": "before", "time": 0, "label": "len 3, cap 4" },
      { "id": "full", "time": 1400, "label": "cap is full", "pause": true, "question": "What happens on the next append?" },
      { "id": "grown", "time": 3200, "label": "new array, cap 8" }
    ]
  },
  "captions": {
    "es": { "before": "len 3, cap 4", "full": "la capacidad está llena", "grown": "arreglo nuevo, cap 8" },
    "zh-CN": { "full": "容量已满" }
  },
  "tracks": [ … ]
}
```

- **`label`** is the caption in the timeline's own language.
- **`captions`** translate labels per marker id. The page's `lang` (the closest
  `[lang]` ancestor, then `<html lang>`) chooses the language, and `es-MX` falls back
  to `es` and then to the label. Translations never touch the tracks.
- **`pause: true`** stops playback at the marker, even when not stepping.
- **`question`** is shown while stopped there, with a **Reveal** button: the
  predict-then-reveal pattern.

## The player

```js
const player = tinyfly.create('#figure', { stepMode: true, onMarker: (m) => console.log(m?.id) })
await player.load(definition)

player.next()              // animate to the next marker (a jump under reduced motion)
player.prev()              // jump to the previous marker
player.goToMarker('full')
player.currentMarker       // { id, time, label, … }
player.caption()           // the current caption, in the page's language
player.subscribe(render)   // called when time, play state or the marker changes
```

| Option | Default | |
|---|---|---|
| `initialFrame` | `'start'` | The frame shown on load: `'start'`, `'end'`, a time in ms, or `'none'`. Reduced motion takes precedence and shows the final frame; set `respectReducedMotion: false` to opt out |
| `stepMode` | `false` | `play()` runs to the next marker and stops |
| `respectReducedMotion` | `true` | Under `prefers-reduced-motion: reduce`: never autoplay, show the final frame, steps jump. Follows changes |
| `playWhenVisible` | `false` (embeds: `true`) | Pause off screen and in hidden tabs; `autoplay` waits until the figure is seen |
| `captions` | — | Captions per language per marker id, merged over the timeline's |
| `onMarker(marker)` | — | Called when the current marker changes |

**Values that change in steps:**

- **Text:** a `text` keyframe (`"len = 3"` → `"len = 4"`) switches exactly at its
  time. Strings never blend.
- **Numbers:** to hold a number and jump, give the keyframe
  `{ "type": "steps", "count": 1, "position": "start" }`.
- **SVG paint:** `fill`, `stroke`, `strokeWidth` and `strokeDashoffset` on SVG
  elements are written as SVG paint, so colouring a cell works. On HTML elements
  `fill` still means background.

## Controls

The embed bundle has them built in. To add them to your own player:

```js
import { createControls } from '@algorisys/tinyfly/embed'
createControls(player, figureElement, { labels: { play: 'Reproducir' }, speeds: [0.5, 1, 2] })
```

- **Controls:** restart, previous step, play/pause, next step, a scrub bar, a step
  counter ("2 / 5"), speed, the caption line and the question.
- **Keys:** while focus is inside that figure, Space plays or pauses, ← and → step,
  Home restarts, and F toggles full screen when it's on. Several figures on one page
  never react to the same key press.
- **Styling:** use custom properties on `.tf-ctl`: `--tf-ctl-fg`, `--tf-ctl-bg`,
  `--tf-ctl-accent`, `--tf-ctl-radius`, `--tf-ctl-font`. Every class is prefixed
  `tf-ctl`.
- **Text:** all visible text comes from `labels`. The step counter reads
  `"{index} / {total}"` by default; set `labels.stepFormat` to use words, e.g.
  `"Step {index} of {total}"` or `"第 {index} 步，共 {total} 步"`.
- **Empty rows:** with no captions (no marker labels and no translations) the caption
  line is left out, and the question row only appears at a step that asks one.
- **Several bundles:** `tinyfly-player.iife.js`, `tinyfly-embed.iife.js` and
  `tinyfly.iife.js` add to one `tinyfly` global, so loading more than one keeps every
  bundle's functions.

## Full screen

A detailed diagram is easier to follow when it fills the screen. Turn on a full screen
button per figure:

```html
<figure data-tinyfly-embed data-fullscreen="true">…</figure>
```

or in code, `createControls(player, figure, { fullscreen: true })`.

- **Where the browser supports it:** the button uses the Fullscreen API on the figure,
  so the figure, its controls and its captions fill the screen, and the browser's own
  Esc leaves it.
- **Where it doesn't:** iPhone Safari only supports element fullscreen on iPad. There,
  and whenever the browser refuses a request, the figure becomes a fixed overlay over
  the page, the page behind stops scrolling, and Esc or the button closes it.
- **Layout:** in both modes the figure gets the class `tf-fullscreen` and becomes a
  column: the controls and captions keep their size, and the SVG or canvas takes the
  remaining space, scaled to fit. Those rules use `!important` on purpose, so a host
  page's figure CSS, such as a `max-width` or a phone `min-width`, can't keep the drawing
  at its in-page size. The background comes from `--tf-fullscreen-bg` (default white).
- **Short landscape screens** (a phone on its side, up to 520px tall): the controls and
  captions move into a column beside the drawing, so the drawing keeps most of the width
  instead of shrinking into the strip left above a stack of controls.
- **Accessibility:** the button is labelled `labels.fullscreen` / `labels.exitFullscreen`
  ("Full screen", "Exit full screen") and reports its state with `aria-pressed`.
- **From code:** `controls.fullscreen.enter()`, `.exit()` and `.active`.

## Scenarios: let the reader change something

Some ideas are a comparison, not a sequence: a request with and without a cache, a
cluster before and after its leader fails, one server against ten. Give the figure
one timeline per case, and the reader chooses which one plays.

```html
<figure data-tinyfly-embed data-scenario-legend="Cache">
  <svg viewBox="0 0 720 240">
    …<rect data-tinyfly="db" …/>…
    <g data-tinyfly-choose="cache" aria-label="Turn the cache on">…</g>
  </svg>
  <script type="application/json" data-tinyfly-timeline
          data-scenario="no-cache" data-scenario-label="Off">{ …timeline… }</script>
  <script type="application/json" data-tinyfly-timeline
          data-scenario="cache" data-scenario-label="On">{ …timeline… }</script>
  <figcaption>The same request, with and without a cache.</figcaption>
</figure>
```

Every scenario animates the same markup. The controls add a choice under the bar.

| Attribute | On | Meaning |
|---|---|---|
| `data-scenario` | a timeline script | The scenario's id |
| `data-scenario-label` | a timeline script | What the reader sees on the choice (default: the id) |
| `data-scenario` | the figure | The scenario shown first (default: the first script) |
| `data-scenario-legend` | the figure | Names the choice: "Cache", "Servers" (default: `labels.scenario`, "Scenario") |
| `data-scenario-control` | the figure | `buttons` (default), a group of options; or `slider`, for points on a scale |
| `data-tinyfly-choose` | any element inside | Makes it a button that chooses that scenario |

**Two or more timeline scripts make a scenario figure.** One script with a
`data-scenario` does too, and `validate` warns that it gives the reader nothing to
choose. `data-markers` gives steps to every scenario that has none. Scenarios are
inline only; `data-src` isn't read for them.

**What switching does:**

- **Clean slate:** whatever the previous scenario drew is undone first. Each
  target's authored `style` attribute, its text (for elements holding only text)
  and its path geometry are put back, then the new scenario draws. A box one
  scenario paints red is back to its authored colour in a scenario that never
  touches it.
- **Same step:** when the new scenario has a marker with the current marker's id,
  the reader lands on it. Give comparable moments the same ids ("ask", "answer")
  and the reader can flip between cases without losing their place.
- **The end stays the end.** Otherwise, the start.
- **Playing stays playing.** A paused figure stays paused.
- **Reduced motion:** the new scenario's final frame.

**Choosing a control:**

- **Options** (radio buttons) for distinct cases: "HTTP/2" or "HTTP/3", "Read
  committed" or "Serializable". Arrow keys move between them.
- **Slider** for points on a scale: 1, 10, 100 servers. It's a range input with one
  stop per scenario, in script order. The value's label is shown beside it and
  announced as `aria-valuetext`.
- **Hotspots** for acting on the diagram itself: click the leader to take it down.
  Each `[data-tinyfly-choose]` becomes a toggle button (`role="button"`,
  `tabindex="0"`, `aria-pressed` while its scenario shows), chosen with a click,
  Enter or Space. It's named by its own `aria-label` or else the scenario's label.
  Hotspots work with `data-controls="false"` too.

**Numbers come from the author, not the browser.** A slider's stops are
precomputed timelines, not a formula evaluated on the page. That keeps figures
deterministic and JSON-only, and lets a build script generate every stop from the
same calculation the text quotes.

From code:

```js
const player = tinyfly.create('#figure')
await player.loadScenarios([
  { id: 'no-cache', label: 'Off', timeline: slow },
  { id: 'cache', label: 'On', timeline: fast },
], { initial: 'no-cache' })

player.scenarios          // [{ id: 'no-cache', label: 'Off' }, { id: 'cache', label: 'On' }]
player.scenario           // 'no-cache'
player.setScenario('cache')
createControls(player, figure, { scenarioControl: 'slider', labels: { scenario: 'Cache' } })
bindChoiceHotspots(player, figure)   // returns a function that unbinds them
```

## Authoring with `@algorisys/tinyfly/teach`

```js
import { lesson, figure, cells, pointer } from '@algorisys/tinyfly/teach'

const slice = cells({ id: 's', values: [1, 2, 3, ''], x: 20, y: 30 })
const len = pointer({ id: 'len', label: 'len', x: slice.center(2).x, y: 100 })

const l = lesson({ id: 'append' })
l.marker('before', { label: 'len 3, cap 4', captions: { es: 'len 3, cap 4' } })
slice.write(l, 3, 4)
len.moveTo(l, slice.center(3).x)
l.marker('after', { label: 'len 4', pause: true, question: 'What is cap(s) now?' })
slice.highlight(l, 3)

const markup = figure({ width: 360, height: 160, title: 'Appending to a slice', children: [slice, len] })
const definition = l.definition()
```

**`lesson()` builds keyframes from steps:**

| Call | Effect |
|---|---|
| `to(target, values, { duration, easing, delay })` | Animates from each property's last value |
| `set(target, values)` | Changes at once |
| `wait(ms)` | Moves the cursor forward |
| `together(() => …)` | Starts several steps at the same moment |
| `marker(id, { label, pause, question, captions })` | Adds a named step at the cursor |
| `initial(target, values)` | Sets starting values |

**Primitives return SVG markup, geometry, and step helpers that write to a lesson:**

| Primitive | Helpers |
|---|---|
| `cells` (array / slice) | `write(l, i, value)`, `highlight(l, i, colour)`, `center(i)` |
| `pointer` | `moveTo(l, x)` |
| `stack` (call frames) | `push(l, label)`, `pop(l)` |
| `queue` (queue / channel) | `send(l, label)`, `receive(l)` |
| `table` (map / buckets) | `put(l, key, value)` |
| `pipeline` (middleware, stages) | `advance(l, stage)` |

They run anywhere: in a browser, or in Node while a static site builds.

## In build pipelines

```bash
npx @algorisys/tinyfly validate append.json --markup append.svg
npx @algorisys/tinyfly render append.json append.svg --at end > append-final.svg
npx @algorisys/tinyfly render append.json append.svg --at full > append-question.svg
```

Pass every scenario's timeline to check a scenario figure. Each is named by its
`id`:

```bash
npx @algorisys/tinyfly validate no-cache.json cache.json --markup cache-figure.svg
```

**`validate`** exits with code 1 when:

- a track targets a `data-tinyfly` name the markup lacks;
- a marker is out of order, duplicated or outside the animation;
- a keyframe comes after an explicit duration;
- a caption names an unknown marker;
- with several timelines: two share an id, or a `data-tinyfly-choose` names no
  scenario. Each timeline's problems are prefixed with its id.

It also warns about markers missing a caption in some language, and elements that
are never animated.

**`render`** writes the state at `start`, `end`, a time in ms, or a marker id into
each animated element's `style` and text. The result is a static figure for RSS
readers, email, print, AMP and Open Graph images. The same functions are exported as
`validateEmbed` and `renderFrame` from `@algorisys/tinyfly/embed`.

## Format version

Timeline JSON carries `"formatVersion": 1`. A tinyfly that finds a newer version
refuses to play it, with an error saying to update, rather than playing it wrongly.

- **Additions:** new optional fields, such as markers and captions, do not change the
  version, so figures written today keep playing on later releases.
- **Breaking changes:** a change that would make an old player misread a file bumps
  the version and is announced in the release notes.
