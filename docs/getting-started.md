# Getting Started with tinyfly

Welcome! **tinyfly** is a free, open-source tool for making animations right in
your browser — then using them anywhere (a website, an app, or as a GIF / video
file). You don't need to be a programmer to use the editor. This guide walks you
from "never opened it" to "made and exported your first animation."

> **In a hurry?** Open the editor → click **Samples** → pick one → press **Play**.
> That's the 30-second version. The rest of this page slows it down.

---

## 1. Open the editor

If someone has given you a link to a hosted version, just open it — nothing to
install.

To run it on your own machine you need [Node.js](https://nodejs.org) (version 18
or newer). Then:

```bash
git clone https://github.com/algorisys-oss/tinyfly.git
cd tinyfly
npm install      # one-time setup
npm run dev      # start the editor
```

Open the address it prints (usually **http://localhost:5173**). You'll see the
editor. Nothing you make is uploaded anywhere — it all lives in your browser.

---

## 2. The editor at a glance

When it opens, here's what you're looking at:

```
┌─────────────────────────────────────────────────────────────┐
│  tinyfly  BETA   [ Save ]  New  My Animations  Samples  …     │  ← top toolbar
├─────────────────────────────────────────────────────────────┤
│  Describe an animation…                    [ Generate ]       │  ← AI prompt bar
├────────────┬───────────────────────────────┬────────────────┤
│  Elements  │                               │   Properties    │
│  Tracks    │        Preview (the stage)    │   Presets       │  ← side panels
│  (left)    │                               │   (right)       │
├────────────┴───────────────────────────────┴────────────────┤
│        ▶ Play    0.00 / 2.00   ───●───────────────            │  ← playback
├─────────────────────────────────────────────────────────────┤
│  [ Dope Sheet | Curves ]         Timeline / keyframes         │  ← timeline
└─────────────────────────────────────────────────────────────┘
```

- **Preview (the stage)** — where your animation plays.
- **Elements / Tracks (left)** — the shapes on the stage, and the list of things
  being animated. You can **hide this panel** with the `«` button to get more room.
- **Properties / Presets (right)** — edit the selected shape or keyframe, and
  apply one-click animation presets. Also collapsible.
- **Timeline (bottom)** — the heart of it: a ruler of time with **keyframes**
  (diamonds) marking values at moments in time. Two views: **Dope Sheet** (timing)
  and **Curves** (the shape of the motion). More on these below.
- **Playback bar** — Play/pause, the current time, and a scrubber you can drag.

---

## 3. The fastest first win: load a sample

The quickest way to *feel* how it works:

1. Click **Samples** in the toolbar.
2. Pick one (try "Fade In/Out" or a Showcase demo).
3. Press the big **▶ Play** button.

Watch the diamonds on the timeline and the shape on the stage move together.
Drag the scrubber back and forth to "scrub" through time. Congrats — that's an
animation.

You can also click **My Animations** to see every project you've made (each is
saved automatically), or type a sentence in the prompt bar (e.g. *"a title that
fades up with a shine"*) and click **Generate** to have AI build one for you.

---

## 4. Make one from scratch

Let's build a simple "fade and slide in" by hand.

**Step 1 — Add a shape.** In the left **Elements** panel, add a **Rectangle**
(or Circle). It appears on the stage. Drag it where you want, or set exact
position/size in the **Properties** panel on the right.

**Step 2 — Add something to animate (a track).** In the **Tracks** panel, click
**+ Add Track** and choose a property — start with **opacity** (how see-through
it is).

**Step 3 — Place keyframes.** A **keyframe** says "at *this* time, the value is
*this*." On the timeline, **double-click** the track to drop a keyframe, then
select it and set its value in the Properties panel. Make two:

- At **0 ms**: opacity = **0** (invisible)
- At **500 ms**: opacity = **1** (fully visible)

Add an **x** (horizontal position) track the same way to make it slide in:

- At **0 ms**: x = **-50**
- At **500 ms**: x = **60**

**Step 4 — Play it.** Press **▶**. Your shape fades and slides in. Between the
two keyframes, tinyfly fills in every in-between value automatically — that's
*interpolation*.

**Step 5 — Make the motion feel nice (easing).** Right now the motion is a
straight, robotic ramp. Select the keyframe at 500 ms and give it an **easing**
like `ease-out` (fast then settling). Prefer to *see* it? Switch the timeline to
the **Curves** view (top-left of the timeline): each track becomes a line showing
its value over time, and you can drag the **amber handles** to shape the motion
by eye.

**Step 6 — Save & name it.** tinyfly auto-saves as you go (the **Saved ✓** badge
confirms it). **Double-click the title** in the toolbar to rename your project.
On a tablet, tap **Save** any time for peace of mind.

**Step 7 — Export.** Click **Export As** to download a **GIF**, **WebP**, or
**MP4** video, or **CSS** / **Lottie** code. Click **Embed** to get copy-paste
HTML for a website. Or **Export** to save the raw animation as a `.json` file you
can re-import later.

That's the whole loop: **add → animate → ease → play → export.**

---

## 5. The five ideas behind everything

Once these click, the rest of tinyfly makes sense.

| Idea | What it is |
|------|-----------|
| **Timeline** | The clock for one animation. It plays, pauses, loops, and holds all the tracks. |
| **Track** | One property of one shape being animated (e.g. *this circle's opacity*). |
| **Keyframe** | A value pinned at a moment in time — a diamond on the timeline. |
| **Easing** | The *feel* of the motion between two keyframes: constant (`linear`), or accelerating/settling (`ease-in`, `ease-out`, `ease-in-out`, …), or a fully custom curve. |
| **Element** | A thing on the stage you animate: rectangle, circle, text, image, video, line, arrow, or path. |

And two bigger ones:

- **Scene** — an independent stage with its own elements and timeline. A project
  can have several scenes with **transitions** (fade, slide) between them — like
  slides in a deck.
- **Project** — everything together, saved in your browser and listed in **My
  Animations**.

---

## 6. Dope Sheet vs. Curves (the two timeline views)

The timeline has a switch at its top-left:

- **Dope Sheet** — keyframes as diamonds on a time grid. Best for **timing**:
  when things happen, dragging them earlier/later, copy/paste.
- **Curves** — each numeric track drawn as a **line of value over time**, with
  the real easing shown between keyframes. Best for **feel**: drag points up/down
  to change values, and drag the easing **handles** to shape acceleration.

Both show the same animation — switch anytime. Use **Ctrl/⌘ + scroll** to zoom
the timeline and the bottom scrollbar (or Shift + scroll) to pan.

---

## 7. For developers: use it from code

The editor is optional — the engine is a small, framework-free library. Every
animation is plain JSON, and everything the editor does, you can do in code.

```typescript
import { Timeline, createTrack } from 'tinyfly'
import { DOMAdapter } from 'tinyfly/adapters/dom'

// 1. A timeline that loops forever
const timeline = new Timeline({ id: 'fade', config: { duration: 1000, loop: -1 } })

// 2. Animate the opacity of a target called "box"
timeline.addTrack(createTrack({
  id: 'opacity',
  target: 'box',
  property: 'opacity',
  keyframes: [
    { time: 0, value: 0 },
    { time: 500, value: 1, easing: 'ease-out' },
    { time: 1000, value: 0, easing: 'ease-in' },
  ],
}))

// 3. Point "box" at a real DOM element and play
const adapter = new DOMAdapter()
adapter.registerTarget('box', document.querySelector('#my-box'))
timeline.onUpdate = (state) => adapter.applyState(state)

timeline.play()
;(function loop() {
  timeline.tick(16.67)                 // advance ~1 frame (60fps)
  requestAnimationFrame(loop)
})()
```

Prefer to just play an exported file on a web page? Use the tiny player bundle:

```html
<div id="animation">
  <div data-tinyfly="box"
       style="position:absolute;width:60px;height:60px;background:#4a9eff"></div>
</div>

<script src="tinyfly-player.iife.js"></script>
<script>
  tinyfly.play('#animation', './animation.json', { loop: -1, autoplay: true })
</script>
```

Build the player with `npm run build:player` (outputs
`lib/player/tinyfly-player.iife.js`).

For the exact JSON shape, see the **[File Format](file-format.md)** reference.

---

## Common animatable properties

| Property | Meaning |
|----------|---------|
| `x`, `y` | Position (px) |
| `width`, `height` | Size (px) |
| `rotate` | Rotation (degrees) |
| `scale`, `scaleX`, `scaleY` | Scale |
| `opacity` | Transparency (0–1) |
| `fill`, `stroke` | Colours |
| `strokeWidth`, `borderRadius` | Border width / corner radius (px) |
| `blur`, `glow`, `dropShadow` | Filters |
| `clipTop`/`Right`/`Bottom`/`Left` | Reveal / wipe |

The full list is in the [File Format](file-format.md#animatable-properties) doc.

---

## Going further

Once you're comfortable, tinyfly has a lot more built in:

- **Shapes & drawing** — ⬡ polygons, ★ stars (parametric sides/points), and a
  ✒️ **Pen** tool for custom bezier paths.
- **🌀 Shape morph** — tween one shape into another over the timeline.
- **🎥 Camera** — animate a pan / zoom / rotate over the whole stage (drag to pan
  on stage, or keyframe it in the timeline).
- **Precision** — ▦ grid, 🧲 snapping, and 📏 rulers with draggable guides.
- **🧅 Onion skinning** — see ghost frames around the playhead while you edit.
- **Export** — GIF, WebP, MP4, a **sprite sheet** (PNG grid + JSON), CSS, or
  Lottie — plus copy-paste **embed** code.

Each is covered in the **[Editor Guide](editor-guide.md)**.

## Where to next

- **[Editor Guide](editor-guide.md)** — every panel, button, and shortcut in depth.
- **[Examples](examples.md)** — ready-made animations to learn from.
- **[File Format](file-format.md)** — the JSON behind it all, for integrations.
- **[API Reference](api-reference.md)** — the full engine/player/adapter API.
