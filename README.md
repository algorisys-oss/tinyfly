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
- **DOM** - CSS transforms, opacity, colors
- **Canvas** - Shapes with position, size, rotation, colors
- **SVG** - Attributes and transforms

### Visual Editor
- **Timeline view** - Visual keyframe editing with drag-and-drop
- **Property panel** - Edit keyframe values and easing
- **Track management** - Add, remove, and organize animation tracks
- **Playback controls** - Preview animations in real-time
- **Undo/Redo** - Full history support with keyboard shortcuts
- **Project management** - Auto-save to LocalStorage
- **Export/Import** - JSON file support
- **Embed code** - Generate copy-paste code for websites

## Installation

```bash
npm install tinyfly
```

Or use via CDN:
```html
<script type="module">
  import { play } from 'https://unpkg.com/tinyfly/dist/player.js';
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
- [ ] Copy/paste keyframes
- [ ] Multi-select keyframes
- [x] Visual curve editor for custom easing
- [ ] npm package publishing

### Future
- [ ] WebGL adapter
- [ ] React Native adapter
- [ ] Lottie import/export
- [ ] Collaborative editing
- [ ] Animation presets library

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

- 264 tests passing
- Core engine: 134 tests
- Adapters: 44 tests
- Editor stores: 43 tests
- Player: 30 tests

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

Regardless of license type, all usage of YappyDraw must retain visible attribution to the **Algorisys Open Source Team** and a link to the [original repository](https://github.com/algorisys-oss/tinyfly).