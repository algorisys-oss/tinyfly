# Getting Started with Tinyfly

Tinyfly is a lightweight, API-driven animation engine and visual editor for creating high-performance, embeddable animations. It follows a **JSON-first, API-first** design — every animation is serializable data, and every action is possible via code.

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/algorisys-oss/tinyfly.git
cd tinyfly

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to use the visual editor.

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build editor for production |
| `npm run build:player` | Build the embeddable player (`tinyfly-player.iife.js`) |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run all tests once |

## Key Concepts

Before diving in, here are the core concepts you'll work with:

### Timeline

A **Timeline** is the main container for an animation. It controls playback (play, pause, stop, seek, reverse) and orchestrates multiple tracks. Think of it as the ruler at the top of a video editor.

```
Timeline (2000ms, loop: infinite)
├── Track: box.opacity    [0ms: 0] ──────── [1000ms: 1] ──── [2000ms: 0]
├── Track: box.x          [0ms: 0] ──────── [2000ms: 300]
└── Track: box.rotation   [0ms: 0] ──────── [2000ms: 360]
```

### Tracks

A **Track** animates a single property of a single target element. Each track contains keyframes that define values at specific times. Between keyframes, values are interpolated automatically.

### Keyframes

A **Keyframe** is a value at a specific point in time. The engine smoothly transitions between keyframes using the specified easing function.

```typescript
{ time: 0, value: 0 }                          // Start at 0
{ time: 500, value: 1, easing: 'ease-out' }    // Reach 1 at 500ms, ease out
{ time: 1000, value: 0, easing: 'ease-in' }    // Return to 0 at 1000ms
```

### Easing

**Easing** controls the acceleration curve of an animation between two keyframes. Tinyfly includes:

- `linear` — constant speed
- `ease-in`, `ease-out`, `ease-in-out` — cubic acceleration/deceleration
- `ease-in-quad`, `ease-out-quad`, `ease-in-out-quad` — quadratic variants
- `ease-in-cubic`, `ease-out-cubic`, `ease-in-out-cubic` — cubic variants
- Custom **cubic-bezier** curves for fine-tuned control

### Elements

**Elements** are the visual objects you animate: rectangles, circles, text, images, lines, arrows, and SVG paths. In the editor, you add elements to the canvas and animate their properties.

### Scenes

A **Scene** is an independent canvas with its own set of elements and timeline. Projects can have multiple scenes, and you can add **transitions** (fade, slide) between them to create multi-step animations.

## Create Your First Animation

### Using the Visual Editor

1. **Open the editor** — Run `npm run dev` and open the browser.

2. **Add an element** — Click the shape buttons in the toolbar (Rectangle, Circle, or Text). A new element appears on the canvas.

3. **Position your element** — Drag it on the canvas, or use the Property Panel on the right to set exact X, Y, Width, and Height values.

4. **Add animation tracks** — In the Track Panel (left side), click **+ Add Track** and choose a property to animate (e.g., opacity, x, y, rotation).

5. **Set keyframes** — Click on the timeline at different time positions to add keyframes. Set the value for each keyframe in the Property Panel. For example:
   - At 0ms: opacity = 0
   - At 500ms: opacity = 1
   - At 1000ms: opacity = 0

6. **Preview** — Click the Play button to watch your animation. Adjust timing, values, and easing until it looks right.

7. **Export** — Click the **Embed** button in the toolbar to get copy-paste code for your website, or use **Export** to download the animation as a JSON file.

### Using the API (No Editor)

```typescript
import { Timeline, createTrack } from 'tinyfly'
import { DOMAdapter } from 'tinyfly/adapters/dom'

// 1. Create a timeline
const timeline = new Timeline({
  id: 'fade-pulse',
  config: { duration: 1000, loop: -1 }  // Infinite loop
})

// 2. Add tracks
timeline.addTrack(createTrack({
  id: 'opacity-track',
  target: 'box',
  property: 'opacity',
  keyframes: [
    { time: 0, value: 0 },
    { time: 500, value: 1, easing: 'ease-out' },
    { time: 1000, value: 0, easing: 'ease-in' }
  ]
}))

// 3. Set up DOM rendering
const adapter = new DOMAdapter()
const element = document.querySelector('#my-box')
adapter.registerTarget('box', element)

// 4. Connect timeline to adapter
timeline.onUpdate = (state) => adapter.applyState(state)

// 5. Start playback with animation loop
timeline.play()
function animate() {
  timeline.tick(16.67)  // ~60fps
  requestAnimationFrame(animate)
}
animate()
```

### Embedding in a Website

The simplest way to embed an animation:

```html
<div id="animation">
  <div data-tinyfly="box"
       style="position: absolute; width: 60px; height: 60px; background: #4a9eff;">
  </div>
</div>

<script src="tinyfly-player.iife.js"></script>
<script>
  tinyfly.play('#animation', './animation.json', {
    loop: -1,
    autoplay: true
  });
</script>
```

Build the player first: `npm run build:player` — this creates `dist/player/tinyfly-player.iife.js`.

## Animatable Properties

These properties can be animated on elements:

| Property | Type | Description |
|----------|------|-------------|
| `x` | number | Horizontal position (px) |
| `y` | number | Vertical position (px) |
| `width` | number | Element width (px) |
| `height` | number | Element height (px) |
| `rotation` | number | Rotation angle (degrees) |
| `opacity` | number | Transparency (0-1) |
| `scaleX` | number | Horizontal scale |
| `scaleY` | number | Vertical scale |
| `fill` | string | Fill color (hex, rgb, rgba) |
| `stroke` | string | Stroke/border color |
| `strokeWidth` | number | Border width (px) |
| `borderRadius` | number | Corner radius (px) |
| `fontSize` | number | Text size (px) |
| `shadow` | string | Drop shadow |

## Render Targets

Tinyfly supports three rendering backends:

- **DOM** — Animates HTML elements using CSS transforms and styles. Best for web embedding.
- **Canvas** — Draws to a `<canvas>` element. Best for complex scenes with many shapes.
- **SVG** — Animates SVG elements. Best for vector graphics and scalable animations.

The editor includes a renderer switcher to preview your animation in all three modes.

## What's Next

- [Editor Guide](editor-guide.md) — Complete guide to using the visual editor
- [API Reference](api-reference.md) — Full programmatic API documentation
- [Examples](examples.md) — Code examples for common animation patterns
