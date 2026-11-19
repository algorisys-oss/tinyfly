# Presentations

A talk given from a tinyfly page instead of a slide deck: the presenter steps
through with a clicker, and on each click a scene plays to its next beat while the
slide's text appears. `@algorisys/tinyfly/present` is the part that makes a page a
deck:

| Piece | What it gives you |
|---|---|
| **`createDeck()`** | Slides from plain markup, steps, a scene per slide, keys and clicker, a stage that scales to any screen |
| **Scenes** | `{ marks, draw }`: one scene time per click; the deck plays the clock from mark to mark |
| **Presenter window** | Notes, the clock, time left of the slot, and what the next press will do |
| **Countdowns** | `<button data-timer="30">` for polls and QR codes; scenes are told while one runs |
| **`DeckState`** | The same deck with no page: plain state driven by explicit times |
| **`tinyfly present`** | One HTML file that works offline from `file://` |

## Quick start

```html
<main id="deck">
  <section data-slide="hello" data-title="Hello">
    <h1>A deck made with tinyfly</h1>
    <aside data-notes>Welcome everyone. Wait for the wave.</aside>
  </section>

  <section data-slide="points" data-title="Three points">
    <ul>
      <li data-step="1">Shown on the first click</li>
      <li data-step="2">Shown on the second</li>
      <li data-step="3" data-reveal="pop">Shown on the third</li>
    </ul>
  </section>
</main>

<script src="vendor/tinyfly.iife.js"></script>
<script src="scenes.js"></script>
<script>
  tinyfly.createDeck('#deck', { scenes: window.SCENES, slotMinutes: 30 })
</script>
```

With a bundler: `import { createDeck } from '@algorisys/tinyfly/present'`. The
entry imports nothing else from tinyfly, so it adds only itself.

A complete deck with stick figures is in
[`examples/present-deck`](../examples/present-deck).

## Markup

| Markup | What it is |
|---|---|
| `[data-slide="id"]` | A slide. `data-title` names it in the presenter window |
| `[data-step="k"]` | Appears on click `k` and stays. `data-reveal` is `pop`, `fade` or `none` (default: it rises into place) |
| `[data-notes]` | Speaker notes. Never shown on the slide; several are joined |
| `<button data-timer="30">` | A countdown of 30 seconds on the step of the `[data-step]` around it |
| `canvas[data-scene]` | Where the slide's scene draws. Added for you when the slide has none |

The deck is a fixed stage, 1920 × 1080 unless you pass `width` and `height`, scaled
to fit the window. Lay slides out in those pixels with your own CSS; the same
layout then holds on a laptop and a projector.

The deck adds classes you can style: `tf-current` on the slide being shown,
`tf-on` on a fragment from its step on, `tf-now` on the fragment of the current
step, and `data-current-step` on the slide. Its own look comes from custom
properties on the deck element: `--tf-deck-bg`, `--tf-deck-accent`,
`--tf-deck-panel`, `--tf-deck-done`, `--tf-deck-font`.

## Scenes

`scenes` maps a slide id to a factory. It is called once, the first time the
slide (or the one before it) is shown, and returns the scene:

```js
window.SCENES = {
  points({ width, height, el }) {
    return {
      // marks[0]: where the entrance ends. marks[k]: where click k ends.
      marks: [1200, 2600, 4100, 5800],
      draw(ctx, frame) {
        // frame.time plays up to the current mark and waits there.
        drawEverythingAt(ctx, frame.time)
      },
    }
  },
}
```

| `frame` field | Meaning |
|---|---|
| `time` | The slide's scene clock in ms. It plays to the current step's mark and stops |
| `clock` | A clock in ms that never stops, for motion that loops while the scene waits |
| `step` | The current step, 0 until the first click |
| `timer` | `{ state, elapsed, seconds, sinceEnd }` while a countdown runs and after it ends, else `null` |
| `width`, `height` | The stage size |

- **`draw(ctx, frame)`** paints the slide's canvas, which is cleared first.
- **`update(frame)`** is for everything else: an SVG, DOM elements, or a tinyfly
  timeline you seek to `frame.time`. A scene may have both.
- **Steps** are the larger of the scene's marks and the highest `data-step` on
  the slide. A slide with no scene steps through its fragments alone.
- **Back** shows a step as it ends; it does not play backwards.
- A scene that throws is logged and stopped. The deck carries on.

### Marks from a beat script

A stick figure's script compiles to tracks with a `duration`. The mark for a
click is the duration of the script up to the last beat that click plays:

```js
const beats = [
  { do: 'walk', to: 1380, mood: 'happy' },      // entrance
  { do: 'point', toward: 800, for: 900 },       // click 1
  { do: 'cheer', mood: 'joyful', for: 1200 },   // click 2
]
const options = { from: 2050, ground: 900, height: 300 }
const marks = [1, 2, 3].map((count) => tinyfly.scriptTracks('guide', beats.slice(0, count), options).duration)
```

## Keys

| Key | Does |
|---|---|
| `→` `↓` `PageDown` `Space` `Enter` `N`, or a click | Next step |
| `←` `↑` `PageUp` `Backspace`, or a right click | Back |
| digits then `Enter` | Go to that slide |
| `Home` / `End` | First slide / last slide at its last step |
| `B` or `.` / `W` or `,` | Black / white screen |
| `F` | Full screen |
| `R` | Play the current step again |
| `T` | Start or end the countdown |
| `P` | Presenter window |
| `?` or `H` | The key list |

Clickers send `PageDown` and `PageUp` (some send the arrows), and `B` or `.` for
their blank button.

**A second press never skips a step.** If Next arrives while a step is still
playing, the scene jumps to that step's end and stays. A nervous double press
shows the point at once; it does not move on to the next one.

## Countdowns

```html
<div data-step="2">
  <img src="assets/poll-qr.png" alt="">
  <button data-timer="30"></button>
</div>
```

On that step, Next (or the button, or `T`) starts the countdown. Next while it
runs ends it early. Next after it ends moves on; the deck never moves on by
itself. Going back or jumping resets it. The button gets `data-state`
(`idle`, `running`, `done`) and the fragment around it gets `data-timer-state`,
for your CSS.

Scenes see the countdown as `frame.timer`, so a figure can act while the room
votes:

```js
const dancing = frame.timer?.state === 'running'
const pose = dancing ? tinyfly.danceFrame('bhangra', (frame.timer.elapsed / 60000) * 120).pose : undefined
```

## Presenter window

`P` opens a second window with the elapsed time, the time left of `slotMinutes`,
the wall clock, the slide's title, its clicks, its notes, and what the next press
will do ("Next: start the 30s timer"). Its buttons and keys drive the deck. It is
written into a blank window, so it works from `file://` and needs no second file;
the browser must allow pop-ups for the page.

## Options

| Option | Default | |
|---|---|---|
| `scenes` | `{}` | Scene factories by slide id |
| `width`, `height` | `1920`, `1080` | Stage size in px |
| `slotMinutes` | none | The talk's length, for the presenter's countdown |
| `title` | page title | Names the presenter window |
| `labels` | English | Every visible word; see `DEFAULT_DECK_LABELS` |
| `hash` | `true` | Keep the place in the URL (`#5.2`) and start from it |
| `keyboard` | `true` | Listen for keys on the window |
| `fit` | `true` | Scale the stage to its container, or to the window when that is `<body>` |
| `autoStart` | `true` | Run the frame loop. With `false`, call `deck.render(now)` |
| `onChange` | none | Called after every change of slide, step or countdown |

## The deck object

```js
const deck = tinyfly.createDeck('#deck', options)
deck.next()                // as the clicker does
deck.prev()
deck.goTo(5)               // slide 5 (the first is 1), playing its entrance
deck.goTo(5, 2)            // playing into its second click
deck.seek(5, 2)            // exactly as click 2 ends
deck.seek(5, 2, 3400)      // at scene time 3400 ms
deck.replay()
deck.toggleTimer()
deck.blank('black')
deck.openPresenter()
deck.state                 // the DeckState
deck.destroy()
```

`seek` is for rehearsal and for checking a moment: set it, take a screenshot, and
see that every speech bubble and label sits inside its box.

## DeckState: the deck without a page

`DeckState` holds the slides, steps, scene clocks and countdowns, and reads no
clock itself. Every call that depends on time takes `now`, so the same calls give
the same state. Use it to test a deck's flow, or to drive a deck on something
other than a web page.

```js
import { DeckState } from '@algorisys/tinyfly/present'

const state = new DeckState([
  { id: 'hello', marks: [1000] },
  { id: 'poll', marks: [500, 2000], timers: [{ step: 1, seconds: 30 }] },
])
state.next(0)            // 'slide'
state.advance(16, 16)    // move the scene clock on by 16 ms
state.next(600)          // 'snap' while the entrance plays, then 'step', 'timer-start', …
state.hint()             // { kind: 'timer-start', seconds: 30 }
```

## One file for the venue

```sh
npx @algorisys/tinyfly present player/index.html -o Talk.html
```

This writes one HTML file with every script and stylesheet inlined and every
image, font and media file as a data URI. It opens from `file://` with no network,
so venue Wi-Fi cannot break the talk.

The command exits 1 and writes nothing when the page would still need something:

- a local file that is missing;
- a script, stylesheet, image or font loaded from the network (`--allow-remote`
  keeps these and only warns);
- something it cannot inline: `srcset`, `@import`, a module script that imports
  other files (bundle it first), or a file type it does not know.

Links (`<a href>`) are left alone. Load tinyfly from a copy beside the deck
(`vendor/tinyfly.iife.js`), not from a CDN, so the build is the version you
rehearsed with.

`inlineDeck(html, { readText, readBase64 })` is the same step as a function. It
reads no files itself, so it runs in any build script.

## Before the day

- Walk the built file with the keyboard: every step in order, back, a jump to a
  slide number, and the presenter window.
- Check each slide with `deck.seek()` at the size of the room's screen.
- Keep a copy of the talk in another format in case the laptop is not yours.
