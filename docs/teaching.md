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
| **`tinyfly/embed`** | Step controls with captions and questions, and one-script declarative mounting for CMS pages |
| **`tinyfly/teach`** | A `lesson()` step builder, and diagram primitives (cells, pointer, stack, queue, table, pipeline) |
| **The `tinyfly` command** | `validate` for build pipelines; `render` a frame to static SVG for RSS, email and print |

## Quick start: one script, declarative figures

```html
<figure data-tinyfly-embed data-alt="Appending to a full slice">
  <svg viewBox="0 0 720 200">…<rect data-tinyfly="cell-3" …/>…</svg>
  <script type="application/json" data-tinyfly-timeline>{ …timeline JSON… }</script>
  <figcaption>Appending to a full slice allocates a new array.</figcaption>
</figure>

<!-- once, anywhere on the page (a site-wide footer is fine) -->
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.64.0/cdn/tinyfly-embed.iife.js" data-tinyfly-auto></script>
```

Every `[data-tinyfly-embed]` mounts when the page is ready, with no per-post
JavaScript, so optimisation plugins that defer or strip inline scripts don't break
it. Without `data-tinyfly-auto`, call `tinyfly.mountAll()` yourself.

| Attribute | Meaning |
|---|---|
| `data-options` | Player options as JSON, e.g. `'{"stepMode": true, "autoplay": true}'` |
| `data-src` | Load the timeline from a URL instead of an inline script |
| `data-controls="false"` | No controls (a looping illustration) |
| `data-labels` | Control labels as JSON: `'{"play": "Reproducir", "next": "Siguiente"}'` |
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
| `initialFrame` | `'start'` | The frame shown on load: `'start'`, `'end'`, a time in ms, or `'none'` |
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
import { createControls } from 'tinyfly/embed'
createControls(player, figureElement, { labels: { play: 'Reproducir' }, speeds: [0.5, 1, 2] })
```

- **Controls:** restart, previous step, play/pause, next step, a scrub bar, a step
  counter ("2 / 5"), speed, the caption line and the question.
- **Keys:** while focus is inside that figure, Space plays or pauses, ← and → step, and
  Home restarts. Several figures on one page never react to the same key press.
- **Styling:** use custom properties on `.tf-ctl`: `--tf-ctl-fg`, `--tf-ctl-bg`,
  `--tf-ctl-accent`, `--tf-ctl-radius`, `--tf-ctl-font`. Every class is prefixed
  `tf-ctl`.
- **Text:** all visible text comes from `labels`.

## Authoring with `tinyfly/teach`

```js
import { lesson, figure, cells, pointer } from 'tinyfly/teach'

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
npx tinyfly validate append.json --markup append.svg
npx tinyfly render append.json append.svg --at end > append-final.svg
npx tinyfly render append.json append.svg --at full > append-question.svg
```

**`validate`** exits with code 1 when:

- a track targets a `data-tinyfly` name the markup lacks;
- a marker is out of order, duplicated or outside the animation;
- a keyframe comes after an explicit duration;
- a caption names an unknown marker.

It also warns about markers missing a caption in some language, and elements that
are never animated.

**`render`** writes the state at `start`, `end`, a time in ms, or a marker id into
each animated element's `style` and text. The result is a static figure for RSS
readers, email, print, AMP and Open Graph images. The same functions are exported as
`validateEmbed` and `renderFrame` from `tinyfly/embed`.

## Format version

Timeline JSON carries `"formatVersion": 1`. A tinyfly that finds a newer version
refuses to play it, with an error saying to update, rather than playing it wrongly.

- **Additions:** new optional fields, such as markers and captions, do not change the
  version, so figures written today keep playing on later releases.
- **Breaking changes:** a change that would make an old player misread a file bumps
  the version and is announced in the release notes.
