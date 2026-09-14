# tinyfly

A lightweight, API-driven animation engine and visual editor for creating high-performance, embeddable animations.

**GSAP-level power with Excalidraw-level simplicity.**

## Features

### Core Engine
- **Framework-agnostic** - Works in any JavaScript environment (browser, Node.js, Web Workers)
- **JSON-first** - Animations are fully serializable, perfect for AI generation and persistence
- **Deterministic** - Same input always produces the same output
- **Lightweight** - No heavy dependencies, minimal footprint

### Animation Capabilities
- **Timeline-based** - Orchestrate multiple tracks with precise timing
- **Rich easing** - Linear, quad, cubic, custom cubic-bezier, and more
- **Interpolation** - Numbers, colors, and arrays
- **Playback control** - Play, pause, stop, seek, reverse, speed adjustment
- **Looping** - Finite loops, infinite loops, ping-pong (alternate), and `repeatDelay` between iterations
- **Springs** - Physical spring tracks, integrated at a fixed timestep from t=0 so they stay deterministic *and* serializable (the animation is the parameters, not a baked curve); scale-invariant, so `scale: 0→1` and `x: 0→100` settle identically; authored in the editor with feel presets and sliders
- **Runtime stagger** - One track fans across many targets (`each` / `amount` / `from`), producing exactly what baking N tracks would — and ~15x smaller in JSON (measured: 100 letters is 11.7 KB baked, 0.8 KB as one track)
- **Track scheduling** - Per-track `delay` and `endDelay` without rewriting keyframes
- **Track queries** - `getTracks(filter)`, `removeTracks(filter)`, and `findConflicts()` to surface overlapping writes
- **Compile-time values** - `"+=100"` and `"random(-50, 50)"` resolve at authoring time from a recorded seed, so the JSON holds plain numbers and replays identically

### Scroll & Interaction
- **Scroll-driven playback** - `ScrollDriver` scrubs a timeline against scroll position with GSAP-style trigger strings (`'top bottom'`, `'top top+=500'`); the geometry is a pure, unit-tested function
- **Play when visible** - `VisibilityDriver` plays on appearance (`once` / `repeat` / `reset`) via IntersectionObserver
- **Drag & pointer input** - `Observer` normalises pointer/touch/wheel; `Draggable` supports bounds, axis lock, grid/edge snapping (shared with the editor stage), and drag-to-scrub
- **FLIP transitions** - `flip()` measures a layout change in the DOM layer and emits ordinary keyframes, keeping the engine free of live layout reads

### Render Adapters
- **DOM** - CSS transforms, opacity, colors, clip-path reveal, filters, shine, transform-origin, perspective
- **Canvas** - Shapes with position, size, rotation, colors, clip reveal, filters, transform-origin pivot
- **SVG** - Attributes, transforms, clip-path reveal, filters, transform-origin, perspective
- **WebGL** - Minimal GPU target: textured/solid quads with transform, opacity, and tint
- **Clip/mask reveal** - Animatable clip-inset (`clipTop/Right/Bottom/Left`) wipes elements into view, consistently across all three renderers
- **Filters** - Animatable `blur`, `glow`, and drop-shadow, composed identically across DOM, SVG, and Canvas

### Text Animation
- **Split text into letters** - Break a text element into per-letter elements (Animate-style "break apart"), positioned to match the original layout
- **Staggered animation** - Fan any preset across the letters (or a multi-selection) with a per-letter delay — the primitive behind Animate-style drop, cascade, and wave effects
- **Per-letter presets** - Drop & Bounce, Cascade Up, Wave, Assemble, and Pop In, tuned to shine when staggered
- **Typewriter reveal** - Character-by-character typing with an optional blinking cursor that steps along; the timeline auto-extends to fit
- **Scramble & type-on text tracks** - Select a text element → **Text Animation** to scramble it into new words or type it on; a text-track inspector edits the words, character set, reveal delay, refresh rate and timing. Seeded, so previews and exports replay identically
- **Filters** - Animatable blur, glow, and drop-shadow (Blur In, Glow Pulse, Drop Shadow presets)
- **Shine sweep** - A highlight sweeps across the text, clipped to the glyphs, on all three renderers
- **All JSON** - A stagger, typewriter, or filter is just keyframe tracks, so it serializes, persists, and plays anywhere the engine runs

### Playback & Sync
- **Standalone player** - `TinyflyPlayer` loads animation JSON (and animates embedded **symbol instances** via their nested timelines) and plays it onto DOM elements; ships as an ESM/UMD/IIFE bundle for npm or CDN
- **Audio/video sync** - `MediaSync` / `player.attachMedia()` locks an audio or video element to the timeline clock (play/pause/seek/rate), correcting drift as it plays
- **Audio & video in the editor** - Add an **Audio** or **Video** element (source, start time, volume, mute, loop; video also has object-fit); it plays in sync while you scrub and preview the timeline
- **Media in embeds** - Exported/embedded HTML carries the media, and the player auto-discovers and syncs it (`[data-tinyfly-media]`), so audio/video play in time wherever the animation is embedded

### Visual Editor
- **AI prompt → animation** - Describe an animation in plain language ("a title that fades up with a shine", "three cards sliding in one after another") and generate a fully editable timeline. Bring your own API key for **OpenAI, Google Gemini, or Anthropic** — keys stay in your browser and are sent directly to the provider. The model emits tinyfly's JSON schema, which loads through the same path as the editable examples, so generated animations are ordinary keyframes you can tweak
- **Any canvas / aspect ratio** - The preview artboard follows the project canvas (DOM, Canvas, and SVG renderers) and fits-to-view, so a vertical 9:16 promo or any custom size previews at true proportions; samples can declare their own canvas size
- **Device-frame preset** - One click stamps a device mockup (rounded body, camera/notch, and a rounded video "screen") sized to the canvas, in **Phone / Landscape / Tablet** variants — drop a screen-recording into the screen's source for an app promo
- **Timeline view** - Visual keyframe editing with drag-and-drop
- **Camera** - Animate a pan/zoom/rotate over the whole stage (a reserved `Camera` layer driven by ordinary tracks). One-click add, a **🎥 Camera inspector** (Pan/Zoom/Rotation keyframed at the playhead), on-stage **✋ Pan** dragging, and a dedicated 🎥 lane at the top of the timeline; applies in every preview, export, and embed. Ready-made Push In / Pan Across / Orbit Reveal samples
- **Polygon & star shapes** - ⬡ Polygon and ★ Star elements are parametric paths — edit sides / points / inner ratio in Properties and they regenerate and rescale; they render and export like any path
- **Pen tool** - ✒️ Draw custom bezier paths: click for corners, click-drag for curves (Alt for a cusp), drag existing anchors/handles to adjust, snap points to grid/guides, click the first point or Enter to finish
- **Shape morph** - 🌀 Tween one path into another over the timeline (engine-level path interpolation); plays in every renderer, export, and embed
- **Grid, snapping & guides** - ▦ 20px grid, 🧲 snapping of drag/resize to grid/element-edges/artboard with live alignment guides, and 📏 rulers with draggable guides
- **Onion skinning** - 🧅 Faint ghost frames before/after the playhead (Canvas renderer) to see the arc of a move while editing one frame
- **Curve editor** - Switch the timeline between the **Dope Sheet** (keyframes & timing) and a **Curves** graph view where each numeric track is a value-over-time curve with the real easing drawn between keyframes; drag points in 2D (time + value), drag the easing handles to shape the cubic-bezier, double-click a lane to add a keyframe, Ctrl/Cmd-click to multi-select
- **Timeline zoom & scroll** - Zoom the timeline with Ctrl/⌘+scroll or the −/+ control and pan with the scrollbar or Shift+scroll (shared across both views)
- **Scene duration you can author** - Click the `current / duration` readout to type an exact length in seconds. The timeline **auto-extends** when a keyframe is added or dragged past the end, so late keyframes always play; the end of the scene is drawn as a dashed marker with the unreachable region dimmed, and a **Fit** button snaps the duration back out to the last keyframe after a manual trim
- **Box-select & curve overlay** - Rubber-band-select keyframes in either timeline view; in Curves, toggle **Overlay** to compare all tracks on one shared axis. Scene tabs show live per-scene thumbnails
- **Symbols & Library** - Bundle elements into a reusable **symbol** (Convert to Symbol), place instances across scenes, **edit in place** (double-click an instance), give a symbol its own timeline for **nested animation**, and **swap** which symbol an instance shows over time (lip-sync) — all JSON-serialized
- **Multi-select keyframes** - Ctrl/Cmd-click to select many keyframes; copy/paste (at the playhead) and delete them together
- **Property panel** - Edit keyframe values and easing
- **Track management** - Add, remove, and organize animation tracks
- **Per-letter stagger** - Toggle in the preset panel to split text and fan a preset across its letters
- **Playback controls** - Preview animations in real-time
- **Undo/Redo** - Unified history across the timeline and the scene: one Ctrl+Z reverses the last change of either kind (element add/move/resize/group/property edits or keyframe/track edits); drags collapse to a single step
- **Multiple scenes** - Organize animations into separate scenes with independent elements and timelines
- **Scene transitions** - Configurable transitions between scenes (fade, slide)
- **Multi-scene sequencer** - Play all scenes in order with transitions
- **My Animations gallery** - Every project you make is saved and browsable in a thumbnail grid; open one to keep editing, duplicate, or delete it. Persisted to **IndexedDB** (LocalStorage projects are migrated automatically on first run), so you can accumulate many animations without the old single-slot limit
- **Collapsible panels** - Hide the Elements/Tracks and Properties/Presets columns to give the canvas more room; a slim tab brings each back
- **Rename & save** - Double-click the project title to rename it inline; a Save button shows a clear Save / Saving… / Saved ✓ status (handy on touch devices) on top of continuous auto-save
- **Project management** - Auto-save to IndexedDB (with LocalStorage fallback)
- **Export/Import** - JSON file support
- **Named exports** - Choose the download filename in the Export dialog for every format; it defaults to the project name and is sanitized for any filesystem
- **MP4 export** - Encode the animation to a real MP4 (H.264) via WebCodecs, with a hand-written muxer and no dependencies. Frame-by-frame rather than real-time, so it's faster than playback and reproducible; MediaRecorder (WebM) is the fallback where WebCodecs is missing
- **Animated GIF export** - Median-cut colour quantization with optional Floyd–Steinberg dithering, per-frame palettes, and transparency
- **Animated WebP export** - Roughly 3× smaller than GIF at true colour, with full alpha
- **Sprite-sheet export** - Every frame packed into one PNG grid plus a JSON metadata file (frame size, columns/rows, count, fps) — ready for game engines or a custom `<canvas>` player; alpha kept when transparent
- **Rich raster export options** - Resolution multiplier (2x by default, so text and edges stay crisp), FPS, background colour or transparency, progress and cancel. Image and video layers are composited too — a device screen's recording is captured with `object-fit` cover/contain and rounded corners, seeked in sync
- **Resizable preview** - Drag the splitter between the preview and the timeline to resize (double-click to reset)
- **Stroke write-on** - Animate a path's stroke drawing itself on (DOM + SVG renderers); one-click "Write On" preset
- **Embed code** - Generate copy-paste code for websites (single scene or full sequence)
- **Landing page** - `/` introduces tinyfly with tinyfly itself: a masked headline, a pointer-led canvas, a live code playground that shows the JSON its code compiles to, a pinned feature story, a gallery and a copyable script tag, with a reduced-motion mode. It loads without the editor, which lives at `/studio` (lazy-loaded, as are Examples, Showcase and Docs)
- **Learn** - An interactive course at `/learn`: short steps with live code, a preview you can scrub, and checks that read what your code compiled to. Nine modules, 64 steps: Foundations (animation as JSON), the GSAP-style API, the Editor (build in the studio, Copy JSON, compare with code), Motion craft (timing, anticipation, springs), Text and SVG, Interaction (hover, quickTo, drag and throw, Flip, canvas), Scroll (reveals, scrub, pinning, velocity), Accessibility and performance (a real reduced-motion mode, keyboard parity, transforms, pausing off-screen work), and a Capstone that rebuilds the Agency Landing Page section by section
- **Examples** - One page (`/examples`, the **Examples** toolbar button), and a shareable page for every example at `/examples/<id>` for every ready-made animation: editable examples open in the editor as a new project, code examples show their timeline JSON and HTML to copy. Includes a full-page **Agency Landing Page** showcase and a **GSAP-style** section of 41 runnable `live.to()` demos (Flip layouts and shared elements, pinned horizontal scroll, line mask reveals, spring release, canvas from object tweens, motion paths, orbits, shape and menu morphs, scramble text, draggable throws, swipe cards, 3D card flips, magnetic button, proximity grid, marquee, split text, SVG draw…), and every card has **Copy code** for a complete standalone HTML page. Hover-to-play previews, search, and filters for kind and category (GSAP-style, Showcase, Basics, Motion, Text, UI, Loaders, Effects, Data, Camera, Scroll, and **Algorisys** product demos)

## Documentation

- [Getting Started](docs/getting-started.md) — Installation, setup, and your first animation
- [Editor Guide](docs/editor-guide.md) — Complete guide to the visual editor (elements, timeline, scenes, presets, shortcuts)
- [API Reference](docs/api-reference.md) — Full engine, player, adapter, and export API documentation
- [File Format](docs/file-format.md) — The tinyfly JSON format (animation documents, timelines, projects, sequences) for integrations
- [Examples](docs/examples.md) — Code examples for common animation patterns
- [Scroll Animation](docs/scroll-animation.md) — Scroll-driven and visibility-triggered playback via drivers
- [GSAP Compatibility](docs/gsap-compat.md) — The GSAP-flavoured API, the mapping table, and what we deliberately don't do
- [Deployment](docs/DEPLOYMENT.md) — Hosting, Docker, and CDN configuration
- [2D Animation Roadmap](docs/2d-animation-roadmap.md) — Adobe Animate gap analysis and phased plan (symbols/library, camera, onion skinning, …)

**Feature guides:** [Symbols & Library](docs/symbols-and-library.md) · [Camera](docs/camera.md) · [Polygon & Star](docs/polygon-star.md) · [Pen tool](docs/pen-tool.md) · [Shape morph](docs/shape-morph.md) · [Grid & snapping](docs/grid-and-snapping.md) · [Onion skinning](docs/onion-skinning.md) · [Sprite-sheet export](docs/sprite-sheet-export.md)

**Docs for LLMs:** the repo root has [`llms.txt`](llms.txt), an [llmstxt.org](https://llmstxt.org) index of these docs. The built editor also serves `/llms.txt`, `/llms-full.txt` (every doc in one file) and each page as raw markdown at `/docs/<page>.md`.

## Installation

```bash
npm install tinyfly
```

Or use it with no build step from the [GitHub CDN](#use-from-a-script-tag-no-build-step).

The package ships these entry points. Each is tree-shakeable, so you pay only
for what you import:

| Import | What it is | Environments |
|---|---|---|
| `tinyfly` | The engine — `Timeline`, tracks, easing, JSON | Browser, Web Worker, Node |
| `tinyfly/player` | `TinyflyPlayer`, `MediaSync`, sequencer — plays editor JSON on the DOM | Browser |
| `tinyfly/export` | `exportToCSS`, `exportToLottie`, GIF / WebP / MP4 / sprite-sheet export | Browser (CSS and Lottie anywhere) |
| `tinyfly/adapters` | `DOMAdapter`, `CanvasAdapter`, `SVGAdapter`, `WebGLAdapter` — apply timeline state to a render target | Browser |
| `tinyfly/gsap-compat` | GSAP-style `live.to()` / `timeline()`, plus the compiling `tf` facade | Browser (`tf` anywhere) |
| `tinyfly/drivers` | `ScrollDriver`, `VisibilityDriver` | Browser |
| `tinyfly/interaction` | `Observer`, `Draggable` | Browser |
| `tinyfly/embed` | Teaching embeds: the player with step controls, captions and one-script `[data-tinyfly-embed]` mounting; `validateEmbed`, `renderFrame` | Browser (tools anywhere) |
| `tinyfly/teach` | `lesson()` step builder and diagram primitives (cells, pointer, stack, queue, table, pipeline) | Anywhere |
| `tinyfly/react`, `tinyfly/vue`, `tinyfly/svelte`, `tinyfly/solid` | `useTinyfly` hooks, a Svelte action and a Solid primitive: `live` animations scoped to a component and reverted on unmount | Browser (frameworks are optional peer dependencies) |
| `tinyfly/browser` | Everything above in one bundle | Browser |

```js
// The framework-agnostic engine (browser, Web Worker, or Node)
import { Timeline, createTrack } from 'tinyfly'

// The DOM player + media sync (browser)
import { TinyflyPlayer, MediaSync } from 'tinyfly/player'

// Render adapters: apply timeline state to DOM, Canvas, SVG or WebGL (browser)
import { DOMAdapter } from 'tinyfly/adapters'

// GSAP-style animation of real elements (browser)
import { live } from 'tinyfly/gsap-compat'
live.to('.box', { x: 200, duration: 1, ease: 'power2.out' })
```

```jsx
// React: everything the setup creates is reverted when the component unmounts
import { useTinyfly } from 'tinyfly/react'

function Hero() {
  const root = useRef(null)
  useTinyfly((live) => live.from('.title', { y: 40, opacity: 0 }), { scope: root })
  return <section ref={root}><h1 className="title">Hello</h1></section>
}
```

TypeScript declarations ship with every entry point. Works with any framework
or none; the engine has no dependencies. See
[framework hooks](docs/gsap-compat.md#framework-hooks) for Vue, Svelte and Solid.

### Use from a `<script>` tag (no build step)

Every release publishes browser bundles to the `cdn/` folder of
[algorisys-oss/tinyfly](https://github.com/algorisys-oss/tinyfly), tagged with
its version, and [jsDelivr](https://www.jsdelivr.com/) serves them straight from
GitHub. No npm required.

`tinyfly.iife.js` (~29 KB gzipped) puts everything on one `tinyfly` global, with
GSAP-shaped functions at the top level:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.64.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, rotate: 90, duration: 1, ease: 'power2.out' })

  tinyfly.timeline({ repeat: -1, yoyo: true })
    .fromTo('.dot', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 })
    .to('.title', { scale: 1.1, duration: 0.3 })

  // The player, engine, drivers and interaction are on the same global
  const player = new tinyfly.TinyflyPlayer('#stage')
  player.load('animation.json').then(() => player.play())
</script>
```

| File | What |
|---|---|
| `cdn/tinyfly.iife.js` | Everything, on a `tinyfly` global |
| `cdn/tinyfly.umd.js` | The same, as UMD |
| `cdn/tinyfly.esm.js` | The same, as an ES module: `import { live } from '…/cdn/tinyfly.esm.js'` |
| `cdn/tinyfly-player.iife.js` | Player only (~11 KB gzipped), for playing editor exports |

Replace `@v0.59.0` with the version you want. **Pin a version in production**:
a tag's files never change. `@main` follows the latest release, which jsDelivr
caches for up to a day. Load one `tinyfly` global, not both.

Every card on the [Examples page](docs/editor-guide.md#examples) has **Copy code**, which gives you a
complete HTML page already using these URLs.

### Build the distributable libraries

```bash
npm run build:libs   # all bundles + type declarations -> lib/
```

This produces:

- `lib/engine/tinyfly-engine.js` (ESM) and `.umd.cjs` — the engine
- `lib/player/tinyfly-player.{es,umd,iife}.js` — the standalone DOM player
- `lib/addons/{adapters,export,gsap-compat,drivers,interaction}.js` — the optional entry points
- `lib/browser/tinyfly.{iife,umd}.js` and `tinyfly.js` — the all-in-one bundle
- `lib/types/**` — TypeScript declarations

## Quick Start

### Using the Editor

```bash
# Clone the repository
git clone https://github.com/algorisys-oss/tinyfly.git
cd tinyfly

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the landing page; the visual editor is at [/studio](http://localhost:5173/studio).

### Using the Engine (API)

```typescript
import { Timeline, createTrack } from 'tinyfly';

// Create a timeline
const timeline = new Timeline({
  id: 'my-animation',
  config: { duration: 2000, loop: -1 }
});

// Add a track
timeline.addTrack(createTrack({
  id: 'opacity',
  target: 'box',
  property: 'opacity',
  keyframes: [
    { time: 0, value: 0 },
    { time: 1000, value: 1, easing: 'ease-out' },
    { time: 2000, value: 0, easing: 'ease-in' }
  ]
}));

// Play the animation
timeline.play();

// Animation loop
function animate() {
  timeline.tick(16.67); // ~60fps
  const state = timeline.getStateAtTime(timeline.currentTime);
  // Apply state to your elements...
  requestAnimationFrame(animate);
}
animate();
```

### Embedding Animations

```html
<div id="animation">
  <div data-tinyfly="box" style="width: 60px; height: 60px; background: #4a9eff;"></div>
</div>

<script type="module">
  import { play } from 'tinyfly/player';

  // Load from JSON file
  play('#animation', './animation.json', {
    loop: -1,
    autoplay: true
  });

  // Or use inline JSON
  play('#animation', {
    id: 'my-animation',
    config: { duration: 1000 },
    tracks: [...]
  });
</script>
```

The player automatically finds target elements by:
- `data-tinyfly="name"` attribute
- Class name `.name`
- ID `#name`

## API Reference

### Timeline

```typescript
const timeline = new Timeline({
  id: string,
  name?: string,
  config?: {
    duration?: number,    // Total duration in ms
    loop?: number,        // -1 for infinite, 0 for none, n for n times
    alternate?: boolean,  // Ping-pong effect
    speed?: number        // Playback speed multiplier
  }
});

timeline.play();
timeline.pause();
timeline.stop();
timeline.seek(timeMs);
timeline.reverse();
timeline.tick(deltaMs);
timeline.getStateAtTime(timeMs);
```

### Track

```typescript
const track = createTrack({
  id: string,
  target: string,      // Element identifier
  property: string,    // Property to animate
  keyframes: [
    {
      time: number,           // Time in ms
      value: number | string, // Value at this keyframe
      easing?: EasingType     // Easing to next keyframe
    }
  ]
});
```

### Easing Types

Built-in easing types:
- `linear`
- `ease-in`, `ease-out`, `ease-in-out`
- `ease-in-quad`, `ease-out-quad`, `ease-in-out-quad`
- `ease-in-cubic`, `ease-out-cubic`, `ease-in-out-cubic`

Custom cubic-bezier easing:
```typescript
{
  type: 'cubic-bezier',
  points: [0.42, 0, 0.58, 1] // [cp1x, cp1y, cp2x, cp2y]
}
```

### Player

```typescript
import { TinyflyPlayer, play, create } from 'tinyfly/player';

// Quick play
const player = await play('#container', 'animation.json', options);

// Manual control
const player = new TinyflyPlayer('#container', options);
await player.load('animation.json');
player.play();
player.pause();
player.seek(500);
player.setSpeed(2);
player.destroy();
```

### Audio / Video Sync

Attach a media element so it stays locked to the timeline clock (the timeline
stays the source of truth; the media follows play/pause/seek/rate and drift is
corrected as it plays).

```typescript
const player = new TinyflyPlayer('#container');
await player.load('animation.json');

const audio = document.querySelector('audio');
player.attachMedia(audio, { offset: 0 });  // start media at timeline t=0

player.play();     // audio plays in sync
player.seek(2000); // audio jumps to 2s
player.detachMedia();

// Or use the primitive directly with any { currentTime, paused, play, pause }:
import { MediaSync } from 'tinyfly/player';
const sync = new MediaSync(audio, { driftTolerance: 0.15 });
sync.update(timelineMs, isPlaying);
```

### Sequencer (Multi-Scene)

```typescript
import { TinyflySequencer, playSequence } from 'tinyfly/player';

// Quick play all scenes in sequence
const sequencer = await playSequence('#container', 'sequence.json', {
  loop: -1,
  autoplay: true,
  onSceneChange: (index) => console.log(`Scene ${index}`),
});

// Manual control
const sequencer = new TinyflySequencer('#container', options);
await sequencer.load('sequence.json');
sequencer.play();
sequencer.pause();
sequencer.goToScene(2);
sequencer.destroy();

// Properties
sequencer.currentSceneIndex; // Current scene index
sequencer.sceneCount;        // Total number of scenes
sequencer.isPlaying;         // Playback state
```

**Transition types:** `none`, `fade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`

## Scroll, springs, and GSAP-style authoring

Three optional entry points sit outside the engine. Each is opt-in and
tree-shakeable, so an embed that only plays an animation pays nothing for them.

```ts
import { ScrollDriver, VisibilityDriver } from 'tinyfly/drivers'
import { Observer, Draggable } from 'tinyfly/interaction'
import { timeline, quickPlay } from 'tinyfly/gsap-compat'
```

**Scroll-driven animation** is a *driver*, not a special timeline. The engine is
a pure function of time; a driver is what decides which time to hand it. So any
existing animation becomes scroll-driven without changing it — and the editor's
**⇅ Scroll** preview runs that same driver against a real scroll container, so
triggers you tune there behave identically on your page:

```ts
new ScrollDriver({
  timeline,
  trigger: document.querySelector('#panel')!,
  start: 'top bottom',
  end: 'bottom top',
  scrub: true,
}).start()
```

**Springs** are a track kind, integrated at a fixed timestep from t=0. That is
what lets them be physical *and* deterministic *and* serializable at once —
the animation is the parameters, so it exports like any other track:

```ts
timeline.addTrack({
  id: 'pop', target: 'box', property: 'scale',
  kind: 'spring',
  spring: { from: 0, to: 1, stiffness: 200, damping: 12 },
})
```

**Flip**: `live.flip('.item', () => reorder())` animates any layout change — reorders, class toggles, filters, resizes — from where elements were to where they land, and interrupts smoothly.

**Inertia and dragging**: throw elements with `live.draggable(el, { bounds, inertia: { end: slots } })` or the `inertia` tween option. Friction is exact closed-form decay, snapping lands precisely, and it all serializes like any track.

**Text animation** types, backspaces and scrambles text (`text` and `scrambleText`), deterministically: scramble characters are seeded, so scrubbing and exports replay exactly.

**Shape morphing** turns any path into any other (`morphSVG` in `live` and `tf`): subpaths are paired, the start point and direction are chosen so nothing twists, and corners stay sharp.

**Motion paths** follow SVG path data, points, or (with `live`) an SVG element on the page — `align` lays the path over the element where it is drawn and `autoRotate` turns the follower to face along it. The path parser handles everything design tools export, and followers move at an even speed.

**Award-site motion** on the same `live` API, all compiled to ordinary tracks:
- `scrollTrigger` — scrub (exact or smoothed), `pin` (the sticky recipe automated), `toggleActions`, `once`, velocity in `onUpdate`; scrolling does no layout reads
- `live.splitText()` — characters, words and rendered lines, with clipping masks and accessible labels
- `drawSVG` — stroke drawing by length or segment (`'20% 80%'`)
- `spring` — presets or stiffness/damping/mass, carrying the momentum of whatever it interrupts or a drag's release velocity
- Flip shared elements — `data-flip-id` grows a thumbnail into a different hero element
- Plain-object targets and `live.ticker` — drive canvas, Three.js or shader uniforms on the same frame as the DOM
- Survives resizes and breakpoints — function values, `invalidateOnRefresh`, `splitText` `autoSplit`, `live.matchMedia()` (a real reduced-motion mode) and `live.context()` cleanup
- `live.utils` (clamp, mapRange, interpolate, wrap, snap, seeded random, distribute, pipe…), `"random(…)"` values, `repeatRefresh`, `live.getProperty`; native elastic / bounce / back / steps eases
- Teaching animations ([guide](docs/teaching.md)): markers and captions in the JSON, a player that steps, respects reduced motion and pauses off screen, step controls with predict-then-reveal questions, one-script declarative embeds, `tinyfly/teach` diagram primitives, and `npx tinyfly validate` / `render`
- Timeline callbacks and control: `tl.call`, `tl.addPause`, `tl.tweenTo` / `tweenFromTo`, `onRepeat`, `onReverseComplete`, tween callbacks inside timelines, `live.delayedCall`, `live.killTweensOf`
- `live.quickTo` for pointer and scroll-driven values; `snap`, `markers` and `containerAnimation` on scroll triggers
- `live.smoothScroll` eased wheel scrolling with `data-speed` / `data-lag` parallax, on the real scroll position so triggers and pins keep working
- `live.imageSequence` scroll-scrubbed frame sequences, `live.pageTransition` route changes with shared elements, and `CustomEase` / `CustomBounce` / `CustomWiggle`

See the **Agency Landing Page** showcase on the Examples page (`/showcase/agency-landing`).

**GSAP-flavoured authoring** desugars a familiar API into ordinary tracks:

```ts
const tl = timeline()
tl.fromTo('box', { x: 0, opacity: 0 }, { x: 200, opacity: 1, duration: 1, ease: 'power2.out' })
tl.to(['l1', 'l2', 'l3'], { y: 0, duration: 0.5, stagger: 0.08 }, '-=0.25')

quickPlay({ timeline: tl.timeline, targets: { box: '#box', l1: '#l1', l2: '#l2', l3: '#l3' } })
```

For a page that just wants things to move, **`live`** plays straight onto
elements — CSS selectors, elements or node lists, no target map, no loop:

```ts
import { live } from 'tinyfly/gsap-compat'

live.to('.card', { y: -20, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out' })
live.to('#logo', { rotate: 360, duration: 2, repeat: -1 })
live.timeline({ repeat: -1, yoyo: true })
  .to('.a', { x: 120, duration: 0.5 })
  .to('.b', { scale: 1.4, duration: 0.5 }, '<')
```

Separate `live` animations on the same element compose (an `x` tween and a
`rotate` tween both apply) because they share one frame loop and one adapter.

It is **familiar, not compatible** — GSAP code will not run unchanged. Anything
authored through it is ordinary tinyfly JSON that opens in the editor. Read
[docs/gsap-compat.md](docs/gsap-compat.md) for the mapping table and, more
importantly, for what we deliberately don't do and why.

## Architecture

```
tinyfly/
├── src/
│   ├── engine/           # Framework-agnostic core
│   │   ├── core/         # Timeline, Track, Clock
│   │   ├── interpolation/# Easing and interpolators
│   │   └── serialization/# JSON import/export
│   ├── adapters/         # Render adapters
│   │   ├── dom/          # DOM/CSS adapter
│   │   ├── canvas/       # Canvas 2D adapter
│   │   ├── svg/          # SVG adapter
│   │   └── webgl/        # WebGL adapter
│   ├── editor/           # Visual editor (SolidJS)
│   │   ├── components/   # UI components
│   │   └── stores/       # State management
│   └── player/           # Lightweight embed player
```

## Roadmap

### Coming Soon
- [x] Multiple preview elements (shapes, images, text)
- [x] More animatable properties (colors, borders, shadows)
- [x] Copy/paste keyframes
- [x] Multi-select keyframes
- [x] Visual curve editor for custom easing
- [x] npm engine package + CDN player build (`npm run build:libs`)
- [x] All-in-one `<script>` bundle with a GSAP-shaped `tinyfly` global, and `live.to()` that plays on real elements
- [ ] Publish to npm

### Future
- [x] Scene transitions (fade, slide between scenes)
- [x] Multi-scene player/sequencer
- [x] Per-letter text animation (split + stagger)
- [x] Typewriter reveal (char-by-char + blinking cursor)
- [x] Clip/mask reveal (wipe presets, all adapters)
- [x] Animatable filters (blur, glow, drop-shadow)
- [x] Shine sweep (highlight clipped to glyphs, all renderers)
- [x] Audio/video sync (`MediaSync` / `player.attachMedia()`)
- [x] WebGL adapter (minimal: textured/solid quads with transform, opacity, tint)
- [x] Scroll-driven playback + visibility triggers (`tinyfly/drivers`)
- [x] Drag / pointer interaction layer (`tinyfly/interaction`)
- [x] Deterministic spring tracks
- [x] FLIP layout transitions
- [x] GSAP-flavoured compat facade (`tinyfly/gsap-compat`)
- [x] Scroll-scrub preview in the editor (runs the real driver, not a simulation)
- [x] Overlapping-track warnings in the Tracks panel
- [x] Spring curves in the graph editor
- [x] Spring parameter editing in the editor UI (presets + sliders, auto-extending scene)
- [x] Spring presets in the Presets panel (Pop, Drop, Slide, Wobble, Settle)
- [ ] Export-time collapse of baked staggers into runtime stagger tracks

**Planned — [Phase 27](todo.md) (closing on GSAP):**
- [x] Cross-browser checks (`npm run e2e`): Chromium, Firefox and WebKit pass
- [x] Performance benchmark against GSAP ([results](bench/README.md) — ~3x slower per frame; the DOM adapter is 75% of our cost, not the engine)
- [ ] Exercise the WebGL adapter against a real GL context (only its maths is tested)
- [ ] Load-time value resolution + responsive variants (the serializable answer to function values and `matchMedia`)
- [x] Inertia / throw as an `inertia` track kind
- [x] Text tracks: type-on and scramble text
- [x] CustomEase, CustomBounce, CustomWiggle
- [ ] Framework wrappers (React / Vue / Svelte)
- [x] Scroll pinning (`scrollTrigger: { pin }`), split text, drawSVG, springs and shared-element Flip on `live` ([Phase 28](todo.md))
- [x] Interactive tutorial at `/learn` — 9 modules from keyframes to an award-style landing page, checked in three browsers ([Phase 29](todo.md))
- [ ] Nested timelines at runtime, explicit track priority
- [ ] React Native adapter
- [ ] Collaborative editing

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Cross-browser checks in Chromium, Firefox and WebKit (see e2e/README.md)
npx playwright-core install firefox webkit   # once
npm run e2e

# Build for production
npm run build
```

### Cross-browser checks

`npm run e2e` runs tinyfly in real Chromium, Firefox and WebKit and measures the
results rather than just looking for errors:

- **Engine:** the path parser against each browser's own SVG geometry, determinism,
  and `structuredClone`.
- **Adapters:** transforms, shine clipped to the glyphs (`background-clip: text`), SVG
  rotating in place (`transform-box`), and canvas drawing, all checked by the pixels
  and boxes actually rendered.
- **Exports:** GIF, WebP and MP4 (WebCodecs).
- **Demos:** every GSAP-style demo animating under real mouse input, plus Flip and
  motion-path precision.
- **Editor:** adding elements, playing in all three renderers, and IndexedDB
  persistence across a reload.

Latest run: Chromium 150, Firefox 153 and WebKit 26.5 pass all 33 checks. In WebKit
on Linux, MP4 export is reported as a note: Playwright's WebKit build crashes while
starting its bundled GStreamer, before tinyfly's code runs. WebKit needs `libavif16`
on Linux hosts, and the runner removes the GTK/GIO variables a snap-installed
terminal (VS Code from the Snap Store) exports, which otherwise break every page
load.

### Test Coverage

`npm test` runs 1,711 unit tests in 99 files, all passing:

| Area | Tests |
|---|---|
| Engine (`src/engine`: timeline, easing, paths, text, exports, serialization) | 498 |
| Editor (`src/editor`: stores, utils, presets, AI, samples) | 393 |
| Examples page and GSAP-style demos (`src/examples`) | 206 |
| GSAP-style API (`src/compat/gsap`) | 201 |
| Render adapters (`src/adapters`) | 134 |
| Player, media sync and sequencer (`src/player`) | 83 |
| Drivers and interaction (`src/drivers`, `src/interaction`) | 108 |
| Docs viewer and `llms.txt` (`src/docs`) | 14 |

## Contributing

Contributions are welcome! For anything larger than a small fix, please open an
[issue](https://github.com/algorisys-oss/tinyfly/issues) first to discuss it, then send a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE) © 2026 Algorisys OSS Team. Use it in personal, commercial and SaaS projects, modify it and redistribute it; keep the copyright and license notice with copies of the source.
