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
- **Rich easing** - Linear, quad, cubic, and more easing functions
- **Interpolation** - Numbers, colors, and arrays
- **Playback control** - Play, pause, stop, seek, reverse, speed adjustment
- **Looping** - Finite loops, infinite loops, and ping-pong (alternate) mode

### Render Adapters
- **DOM** - CSS transforms, opacity, colors, clip-path reveal, filters, shine
- **Canvas** - Shapes with position, size, rotation, colors, clip reveal, filters
- **SVG** - Attributes, transforms, clip-path reveal, filters
- **Clip/mask reveal** - Animatable clip-inset (`clipTop/Right/Bottom/Left`) wipes elements into view, consistently across all three renderers
- **Filters** - Animatable `blur`, `glow`, and drop-shadow, composed identically across DOM, SVG, and Canvas

### Text Animation
- **Split text into letters** - Break a text element into per-letter elements (Animate-style "break apart"), positioned to match the original layout
- **Staggered animation** - Fan any preset across the letters (or a multi-selection) with a per-letter delay — the primitive behind Animate-style drop, cascade, and wave effects
- **Per-letter presets** - Drop & Bounce, Cascade Up, Wave, Assemble, and Pop In, tuned to shine when staggered
- **Typewriter reveal** - Character-by-character typing with an optional blinking cursor that steps along; the timeline auto-extends to fit
- **Filters** - Animatable blur, glow, and drop-shadow (Blur In, Glow Pulse, Drop Shadow presets)
- **Shine sweep** - A highlight sweeps across the text, clipped to the glyphs, on all three renderers
- **All JSON** - A stagger, typewriter, or filter is just keyframe tracks, so it serializes, persists, and plays anywhere the engine runs

### Playback & Sync
- **Standalone player** - `TinyflyPlayer` loads animation JSON and plays it onto DOM elements; ships as an ESM/UMD/IIFE bundle for npm or CDN
- **Audio/video sync** - `MediaSync` / `player.attachMedia()` locks an audio or video element to the timeline clock (play/pause/seek/rate), correcting drift as it plays
- **Audio & video in the editor** - Add an **Audio** or **Video** element (source, start time, volume, mute, loop; video also has object-fit); it plays in sync while you scrub and preview the timeline
- **Media in embeds** - Exported/embedded HTML carries the media, and the player auto-discovers and syncs it (`[data-tinyfly-media]`), so audio/video play in time wherever the animation is embedded

### Visual Editor
- **AI prompt → animation** - Describe an animation in plain language ("a title that fades up with a shine", "three cards sliding in one after another") and generate a fully editable timeline. Bring your own API key for **OpenAI, Google Gemini, or Anthropic** — keys stay in your browser and are sent directly to the provider. The model emits tinyfly's JSON schema, which loads through the same path as the sample library, so generated animations are ordinary keyframes you can tweak
- **Any canvas / aspect ratio** - The preview artboard follows the project canvas (DOM, Canvas, and SVG renderers) and fits-to-view, so a vertical 9:16 promo or any custom size previews at true proportions; samples can declare their own canvas size
- **Device-frame preset** - One click stamps a device mockup (rounded body, camera/notch, and a rounded video "screen") sized to the canvas, in **Phone / Landscape / Tablet** variants — drop a screen-recording into the screen's source for an app promo
- **Timeline view** - Visual keyframe editing with drag-and-drop
- **Curve editor** - Switch the timeline between the **Dope Sheet** (keyframes & timing) and a **Curves** graph view where each numeric track is a value-over-time curve with the real easing drawn between keyframes; drag points in 2D (time + value), drag the easing handles to shape the cubic-bezier, double-click a lane to add a keyframe, Ctrl/Cmd-click to multi-select
- **Timeline zoom & scroll** - Zoom the timeline with Ctrl/⌘+scroll or the −/+ control and pan with the scrollbar or Shift+scroll (shared across both views)
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
- **Rich raster export options** - Resolution multiplier (2x by default, so text and edges stay crisp), FPS, background colour or transparency, progress and cancel. Image and video layers are composited too — a device screen's recording is captured with `object-fit` cover/contain and rounded corners, seeked in sync
- **Resizable preview** - Drag the splitter between the preview and the timeline to resize (double-click to reset)
- **Stroke write-on** - Animate a path's stroke drawing itself on (DOM + SVG renderers); one-click "Write On" preset
- **Embed code** - Generate copy-paste code for websites (single scene or full sequence)
- **Sample library** - One-click starter animations across Basic, Motion, Text, UI, Effects, Showcase, and **Algorisys** product-showcase categories (viral infographic demos for TinyFly, YappyDraw, HappyPaint, ProPeak, SkillzEngine, and the full ecosystem)

## Documentation

- [Getting Started](docs/getting-started.md) — Installation, setup, and your first animation
- [Editor Guide](docs/editor-guide.md) — Complete guide to the visual editor (elements, timeline, scenes, presets, shortcuts)
- [API Reference](docs/api-reference.md) — Full engine, player, adapter, and export API documentation
- [File Format](docs/file-format.md) — The tinyfly JSON format (animation documents, timelines, projects, sequences) for integrations
- [Examples](docs/examples.md) — Code examples for common animation patterns
- [Deployment](docs/DEPLOYMENT.md) — Hosting, Docker, and CDN configuration
- [2D Animation Roadmap](docs/2d-animation-roadmap.md) — Adobe Animate gap analysis and phased plan (symbols/library, camera, onion skinning, …)

## Installation

```bash
npm install tinyfly
```

The package ships two entry points:

```js
// The framework-agnostic engine (browser, Web Worker, or Node)
import { Timeline, createTrack } from 'tinyfly'

// The DOM player + media sync (browser)
import { TinyflyPlayer, MediaSync } from 'tinyfly/player'
```

### Build the distributable libraries

```bash
npm run build:libs   # engine + player bundles + type declarations -> lib/
```

This produces:

- `lib/engine/tinyfly-engine.js` (ESM) and `.umd.cjs` — the engine
- `lib/player/tinyfly-player.{es,umd,iife}.js` — the standalone DOM player
- `lib/types/**` — TypeScript declarations

### Use via CDN (no build step)

```html
<script src="https://unpkg.com/tinyfly/lib/player/tinyfly-player.iife.js"></script>
<script>
  const player = new tinyfly.TinyflyPlayer('#stage')
  player.load('animation.json').then(() => player.play())
</script>
```

## Quick Start

### Using the Editor

```bash
# Clone the repository
git clone https://github.com/your-username/tinyfly.git
cd tinyfly

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to use the visual editor.

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
│   │   └── svg/          # SVG adapter
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

### Future
- [x] Scene transitions (fade, slide between scenes)
- [x] Multi-scene player/sequencer
- [x] Per-letter text animation (split + stagger)
- [x] Typewriter reveal (char-by-char + blinking cursor)
- [x] Clip/mask reveal (wipe presets, all adapters)
- [x] Animatable filters (blur, glow, drop-shadow)
- [x] Shine sweep (highlight clipped to glyphs, all renderers)
- [x] Audio/video sync (`MediaSync` / `player.attachMedia()`)
- [ ] WebGL adapter
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

# Build for production
npm run build
```

### Test Coverage

- 500 tests passing
- Core engine: 136 tests
- Adapters: 87 tests (incl. clip/mask reveal, filters, shine across DOM/SVG/Canvas)
- Editor stores: 158 tests (incl. split-text, staggered presets, keyframe copy/paste)
- Split-text util: 8 tests
- Typewriter builder: 9 tests
- Letter-stagger sample (engine integration): 4 tests
- Player + media sync: 45 tests
- Sequencer: 30 tests
- Export formats: 71 tests (CSS 10, Lottie 10, GIF 19, MP4 16, WebP 16)
- Export filename sanitizer: 14 tests
- Animation presets: 18 tests

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

**Dual Licensed**

TinyFly is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

You are free to use, modify, and distribute this software for **personal and non-commercial purposes** under the terms of the AGPL-3.0. Any modified versions must also be released under the AGPL-3.0, and if you run a modified version as a network service, you must make the source code available to its users.

### Commercial & SaaS Use

If you wish to use TinyFly in a **commercial product, proprietary application, or SaaS offering** without the AGPL-3.0 obligations (including source disclosure), you must obtain a **commercial license** from the Algorisys Open Source Team.

For commercial licensing inquiries, please contact us via [GitHub](https://github.com/algorisys-oss/tinyfly).

### Attribution

Regardless of license type, all usage of TinyFly must retain visible attribution to the **Algorisys Open Source Team** and a link to the [original repository](https://github.com/algorisys-oss/tinyfly).