# API Reference

Complete reference for the tinyfly animation engine, player, and adapters.

## Table of Contents

- [Core Types](#core-types)
- [Timeline](#timeline)
- [Track](#track)
- [Clock](#clock)
- [Easing](#easing)
- [Interpolators](#interpolators)
- [Motion Path](#motion-path)
- [Serialization](#serialization)
- [TinyflyPlayer](#tinyflyplayer)
- [TinyflySequencer](#tinyflysequencer)
- [DOMAdapter](#domadapter)
- [CanvasAdapter](#canvasadapter)
- [SVGAdapter](#svgadapter)
- [Export Formats](#export-formats)

---

## Core Types

### AnimatableValue

```typescript
type AnimatableValue = number | string | number[]
```

All values that can be animated. Numbers for position/opacity, strings for colors, arrays for multi-dimensional values.

### EasingType

```typescript
type BuiltInEasingType =
  | 'linear'
  | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'ease-in-quad' | 'ease-out-quad' | 'ease-in-out-quad'
  | 'ease-in-cubic' | 'ease-out-cubic' | 'ease-in-out-cubic'

interface CubicBezierEasing {
  type: 'cubic-bezier'
  points: [number, number, number, number]  // [cp1x, cp1y, cp2x, cp2y]
}

type EasingType = BuiltInEasingType | CubicBezierEasing
```

### Keyframe

```typescript
interface Keyframe<T extends AnimatableValue = AnimatableValue> {
  time: number          // Time in milliseconds from timeline start
  value: T              // Value at this keyframe
  easing?: EasingType   // Easing function to use when interpolating TO this keyframe
}
```

### Track

```typescript
interface Track<T extends AnimatableValue = AnimatableValue> {
  id: string            // Unique identifier
  target: string        // Target element name
  property: string      // Property to animate (e.g., 'opacity', 'x')
  keyframes: Keyframe<T>[]  // Must be sorted by time
}
```

### MotionPathTrack

```typescript
interface MotionPathConfig {
  pathData: string          // SVG path data (d attribute)
  autoRotate?: boolean      // Auto-rotate to follow path tangent
  rotateOffset?: number     // Rotation offset in degrees
}

interface MotionPathTrack {
  id: string
  target: string
  property: 'motionPath'
  motionPathConfig: MotionPathConfig
  keyframes: Keyframe<number>[]  // Progress values 0-1
}

type AnyTrack = Track | MotionPathTrack
```

### TimelineConfig

```typescript
interface TimelineConfig {
  duration?: number      // Total duration in ms (auto-calculated if not set)
  loop?: number          // 0 = no loop, -1 = infinite, n = n times
  speed?: number         // Playback speed multiplier (default: 1)
  alternate?: boolean    // Ping-pong effect on each loop
}
```

### TimelineDefinition

```typescript
interface TimelineDefinition {
  id: string
  name?: string
  config: TimelineConfig
  tracks: Track[]
}
```

The JSON-serializable format used for saving, loading, and embedding animations.

### AnimationState

```typescript
interface AnimationState {
  values: Map<string, Map<string, AnimatableValue>>  // target -> property -> value
  currentTime: number
  playbackState: 'idle' | 'playing' | 'paused'
  direction: 'forward' | 'reverse'
  loopIteration: number
}
```

Returned by `timeline.getStateAtTime()`. Contains the computed value for every target and property at the given time.

### Type Guards

```typescript
function isCubicBezierEasing(easing: EasingType | undefined): easing is CubicBezierEasing
function isMotionPathTrack(track: Track | MotionPathTrack): track is MotionPathTrack
```

---

## Timeline

The central class that orchestrates animation playback across multiple tracks.

### Constructor

```typescript
new Timeline(options: TimelineOptions)
```

```typescript
interface TimelineOptions {
  id: string
  name?: string
  tracks?: AnyTrack[]
  config?: TimelineConfig
}
```

**Example:**
```typescript
const timeline = new Timeline({
  id: 'my-animation',
  name: 'Fade Pulse',
  config: { duration: 2000, loop: -1, speed: 1 },
  tracks: [myTrack1, myTrack2]
})
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier (readonly) |
| `name` | `string \| undefined` | Human-readable name (readonly) |
| `tracks` | `AnyTrack[]` | Copy of all tracks (readonly) |
| `duration` | `number` | Total duration in ms (readonly, auto-calculated if not explicit) |
| `currentTime` | `number` | Current playback position in ms (readonly) |
| `playbackState` | `PlaybackState` | `'idle'`, `'playing'`, or `'paused'` (readonly) |
| `direction` | `PlaybackDirection` | `'forward'` or `'reverse'` (readonly) |
| `loopIteration` | `number` | Current loop iteration, 0-indexed (readonly) |
| `speed` | `number` | Playback speed multiplier (get/set) |

### Methods

#### `play(): void`

Start or resume playback. If at the end (forward) or beginning (reverse), resets to the opposite end.

#### `pause(): void`

Pause playback at the current position.

#### `stop(): void`

Stop playback and reset to the beginning (time = 0, direction = forward).

#### `seek(time: number): void`

Jump to a specific time in milliseconds. Clamped to `[0, duration]`.

#### `reverse(): void`

Toggle playback direction between forward and reverse.

#### `tick(delta: number): void`

Advance the timeline by `delta` milliseconds. Call this from your animation loop (e.g., `requestAnimationFrame`). The delta is scaled by the `speed` multiplier. Handles looping, alternate direction, and completion automatically.

#### `getStateAtTime(time: number): AnimationState`

Compute the animation state at a specific time. Returns a map of all target/property values at that time. For motion path tracks, expands the progress value into `motionPathX`, `motionPathY`, and optionally `motionPathRotate`.

#### `addTrack(track: AnyTrack): void`

Add a track to the timeline. Accepts both regular tracks and motion path tracks.

#### `removeTrack(trackId: string): void`

Remove a track by its ID.

#### `toDefinition(): TimelineDefinition`

Export the timeline as a JSON-serializable object.

### Callbacks

| Callback | Signature | Description |
|----------|-----------|-------------|
| `onUpdate` | `(state: AnimationState) => void` | Called on each `tick()` with the current state |
| `onComplete` | `() => void` | Called when the animation finishes (end of last loop) |

**Example:**
```typescript
timeline.onUpdate = (state) => {
  adapter.applyState(state)
}

timeline.onComplete = () => {
  console.log('Animation finished!')
}
```

---

## Track

### createTrack

```typescript
function createTrack<T extends AnimatableValue>(options: Track<T>): Track<T>
```

Creates a track with keyframes sorted by time.

**Example:**
```typescript
const track = createTrack({
  id: 'box-opacity',
  target: 'box',
  property: 'opacity',
  keyframes: [
    { time: 0, value: 0 },
    { time: 500, value: 1, easing: 'ease-out' },
    { time: 1000, value: 0, easing: 'ease-in' }
  ]
})
```

### Animatable Properties

Common properties you can animate:

| Property | Value Type | Description |
|----------|-----------|-------------|
| `opacity` | number (0-1) | Transparency |
| `x` | number | Horizontal position |
| `y` | number | Vertical position |
| `width` | number | Width |
| `height` | number | Height |
| `rotation` | number | Rotation in degrees |
| `scaleX` | number | Horizontal scale |
| `scaleY` | number | Vertical scale |
| `fill` | string | Fill color (hex/rgb/rgba) |
| `stroke` | string | Stroke color |
| `strokeWidth` | number | Stroke thickness |
| `borderRadius` | number | Corner radius |
| `fontSize` | number | Text font size |
| `motionPath` | number (0-1) | Progress along a motion path |

---

## Clock

### Clock (Browser/RAF)

RAF-based clock for browser environments. Automatically advances time using `requestAnimationFrame`.

```typescript
const clock = new Clock({ speed: 1 })

clock.onTick = (delta, currentTime) => {
  timeline.tick(delta)
}

clock.start()
```

| Property/Method | Type | Description |
|----------------|------|-------------|
| `currentTime` | `number` | Current time in ms (readonly) |
| `isRunning` | `boolean` | Whether the clock is ticking (readonly) |
| `speed` | `number` | Speed multiplier (get/set) |
| `onTick` | `TickCallback \| null` | Called each frame with `(delta, currentTime)` |
| `start()` | `void` | Start the RAF loop |
| `stop()` | `void` | Stop the RAF loop |
| `reset()` | `void` | Reset time to 0 |
| `seek(time)` | `void` | Set current time |

### ManualClock (Testing/Non-Browser)

For testing or environments without `requestAnimationFrame`. Time only advances when `tick()` is called explicitly.

```typescript
const clock = new ManualClock()
clock.onTick = (delta, currentTime) => {
  timeline.tick(delta)
}

clock.start()
clock.tick(16.67)  // Advance 16.67ms
clock.tick(16.67)  // Advance another 16.67ms
```

| Property/Method | Type | Description |
|----------------|------|-------------|
| `currentTime` | `number` | Current time (readonly) |
| `isRunning` | `boolean` | Running state (readonly) |
| `onTick` | `TickCallback \| null` | Tick callback |
| `start()` | `void` | Set running to true |
| `stop()` | `void` | Set running to false |
| `tick(delta)` | `void` | Advance time by delta ms |
| `reset()` | `void` | Reset time to 0 |
| `seek(time)` | `void` | Set current time |

---

## Easing

### Built-in Functions

| Function | Description |
|----------|-------------|
| `linear` | Constant speed, no acceleration |
| `easeIn` | Cubic ease in (starts slow, accelerates) |
| `easeOut` | Cubic ease out (starts fast, decelerates) |
| `easeInOut` | Cubic ease in-out |
| `easeInQuad` | Quadratic ease in (gentler curve) |
| `easeOutQuad` | Quadratic ease out |
| `easeInOutQuad` | Quadratic ease in-out |
| `easeInCubic` | Cubic ease in (same as `easeIn`) |
| `easeOutCubic` | Cubic ease out (same as `easeOut`) |
| `easeInOutCubic` | Cubic ease in-out (same as `easeInOut`) |

Each function takes a normalized time value (0-1) and returns an eased value (0-1).

### createCubicBezier

```typescript
function createCubicBezier(points: [number, number, number, number]): EasingFunction
```

Creates a custom cubic bezier easing function from 4 control points `[cp1x, cp1y, cp2x, cp2y]`. Uses Newton-Raphson iteration for accurate x-to-t mapping.

**Example:**
```typescript
const customEase = createCubicBezier([0.25, 0.1, 0.25, 1.0])
const easedValue = customEase(0.5)  // Returns ~0.8
```

### getEasingFunction

```typescript
function getEasingFunction(type: EasingType | undefined): EasingFunction
```

Resolves an easing type identifier to its function. Returns `linear` if type is undefined. Supports both built-in string types and `CubicBezierEasing` objects.

---

## Interpolators

Functions that compute intermediate values between two endpoints.

### interpolateNumber

```typescript
function interpolateNumber(from: number, to: number, progress: number): number
```

Linear interpolation between two numbers.

### interpolateColor

```typescript
function interpolateColor(from: string, to: string, progress: number): string
```

Smooth interpolation between two color values. Supports:
- Hex colors: `#ff0000`, `#00ff00`
- RGB: `rgb(255, 0, 0)`
- RGBA: `rgba(255, 0, 0, 0.5)`

Returns a color string in the same format as the inputs.

### interpolateArray

```typescript
function interpolateArray(from: number[], to: number[], progress: number): number[]
```

Element-wise interpolation of number arrays.

### interpolateString

```typescript
function interpolateString(from: string, to: string, progress: number): string
```

Discrete interpolation — returns `from` when `progress < 1`, `to` when `progress >= 1`.

### getInterpolator

```typescript
function getInterpolator<T extends AnimatableValue>(sampleValue: T): Interpolator<T>
```

Auto-detect and return the appropriate interpolator based on a sample value:
- Numbers → `interpolateNumber`
- Strings starting with `#` or `rgb` → `interpolateColor`
- Other strings → `interpolateString`
- Arrays → `interpolateArray`

---

## Motion Path

Animate elements along SVG paths.

### getMotionPathPoint

```typescript
function getMotionPathPoint(config: MotionPathConfig, progress: number): MotionPathPoint
```

Get the position and tangent angle at a given progress (0-1) along the path.

```typescript
interface MotionPathPoint {
  x: number      // X coordinate on the path
  y: number      // Y coordinate on the path
  angle: number  // Tangent angle in degrees
}
```

### interpolateMotionPath

```typescript
function interpolateMotionPath(
  config: MotionPathConfig,
  fromProgress: number,
  toProgress: number,
  t: number
): MotionPathPoint
```

Interpolate between two progress values on a path. The `t` parameter is the eased interpolation factor (0-1).

### Usage with Timeline

Motion paths are used through `MotionPathTrack`:

```typescript
const motionTrack: MotionPathTrack = {
  id: 'path-track',
  target: 'ball',
  property: 'motionPath',
  motionPathConfig: {
    pathData: 'M 0 100 Q 150 0 300 100',
    autoRotate: true,
    rotateOffset: 0
  },
  keyframes: [
    { time: 0, value: 0 },
    { time: 2000, value: 1, easing: 'ease-in-out' }
  ]
}

timeline.addTrack(motionTrack)
```

The timeline automatically expands the motion path progress into `motionPathX`, `motionPathY`, and `motionPathRotate` properties in the animation state.

---

## Serialization

### serializeTimeline / deserializeTimeline

```typescript
function serializeTimeline(timeline: Timeline): TimelineDefinition
function deserializeTimeline(definition: TimelineDefinition): Timeline
```

Convert between `Timeline` instances and JSON-serializable `TimelineDefinition` objects.

### toJSON / fromJSON

```typescript
function toJSON(timeline: Timeline): string
function fromJSON(json: string): Timeline
```

Convert between `Timeline` instances and JSON strings.

### serializeTrack / deserializeTrack

```typescript
function serializeTrack(track: AnyTrack): AnyTrack
function deserializeTrack(data: AnyTrack): AnyTrack
```

Serialize/deserialize individual tracks. Handles both regular and motion path tracks.

**Example:**
```typescript
// Save
const json = toJSON(timeline)
localStorage.setItem('animation', json)

// Load
const restored = fromJSON(localStorage.getItem('animation'))
restored.play()
```

---

## TinyflyPlayer

Lightweight player for embedding animations in web pages.

### Constructor

```typescript
new TinyflyPlayer(container: HTMLElement | string, options?: PlayerOptions)
```

```typescript
interface PlayerOptions {
  speed?: number           // Playback speed (default: 1)
  loop?: number            // -1 = infinite, 0 = no loop, n = n times
  alternate?: boolean      // Ping-pong effect
  autoplay?: boolean       // Auto-play on load (default: false)
  onComplete?: () => void  // Called when animation finishes
  onUpdate?: (state: AnimationState) => void  // Called each frame
}
```

The container can be an `HTMLElement` or a CSS selector string (e.g., `'#my-animation'`).

### Methods

#### `load(source: string | TimelineDefinition): Promise<void>`

Load an animation from a URL (fetches JSON) or an inline `TimelineDefinition` object. Automatically discovers target elements in the container.

#### `loadFromString(json: string): void`

Load an animation from a JSON string.

#### `registerTarget(name: string, element: HTMLElement | string): void`

Manually register a target element by name. The element can be an `HTMLElement` or a CSS selector (searched within the container).

#### `play(): void`

Start or resume playback.

#### `pause(): void`

Pause at the current position.

#### `stop(): void`

Stop and reset to the beginning.

#### `seek(time: number): void`

Jump to a specific time in milliseconds.

#### `setSpeed(speed: number): void`

Change the playback speed.

#### `reverse(): void`

Toggle playback direction.

#### `destroy(): void`

Clean up all resources, stop the animation loop, and clear registered targets.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentTime` | `number` | Current playback time in ms |
| `duration` | `number` | Total animation duration in ms |
| `isPlaying` | `boolean` | Whether currently playing |

### Target Auto-Discovery

When `load()` is called, the player automatically finds target elements by searching the container for:

1. `data-tinyfly="name"` attribute (highest priority)
2. Class name `.name`
3. ID `#name`

```html
<!-- All three are valid ways to mark a target named "box" -->
<div data-tinyfly="box"></div>
<div class="box"></div>
<div id="box"></div>
```

### Helper Functions

#### play()

```typescript
async function play(
  container: HTMLElement | string,
  source: string | TimelineDefinition,
  options?: PlayerOptions
): Promise<TinyflyPlayer>
```

Create a player and immediately start playback. Shorthand for creating a player with `autoplay: true`.

```typescript
const player = await tinyfly.play('#animation', './animation.json', {
  loop: -1
})
```

#### create()

```typescript
function create(
  container: HTMLElement | string,
  options?: PlayerOptions
): TinyflyPlayer
```

Create a player without auto-playing. Use this when you need to register targets or configure the player before loading.

```typescript
const player = tinyfly.create('#animation', { loop: -1 })
player.registerTarget('box', document.getElementById('my-box'))
await player.load('./animation.json')
player.play()
```

---

## TinyflySequencer

Multi-scene player that plays scenes in order with transitions between them.

### Constructor

```typescript
new TinyflySequencer(container: HTMLElement | string, options?: SequencerOptions)
```

```typescript
interface SequencerOptions {
  loop?: number                                    // -1 = infinite, 0 = no loop
  autoplay?: boolean                               // Auto-play on load
  onComplete?: () => void                          // Called when sequence finishes
  onSceneChange?: (sceneIndex: number) => void     // Called when scene starts
}
```

### Methods

#### `load(source: string | SequenceDefinition): Promise<void>`

Load a sequence from a URL or inline definition. Renders the first scene's elements and sets up the canvas dimensions.

#### `play(): void`

Start playing from the current scene. Does nothing if no sequence is loaded or if the sequence is empty.

#### `pause(): void`

Pause playback.

#### `stop(): void`

Stop and reset to the first scene.

#### `goToScene(index: number): void`

Jump directly to a specific scene by index. If the sequencer was playing, playback continues at the new scene. Invalid indices are ignored.

#### `destroy(): void`

Clean up all resources, remove scene containers, stop playback.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentSceneIndex` | `number` | Index of the current scene |
| `sceneCount` | `number` | Total number of scenes |
| `isPlaying` | `boolean` | Whether currently playing |
| `state` | `string` | `'idle'`, `'playing-scene'`, or `'transitioning'` |

### Sequence Types

```typescript
interface SequenceDefinition {
  id: string
  name: string
  canvas: { width: number; height: number }
  scenes: SequenceScene[]
  loop?: number
}

interface SequenceScene {
  id: string
  name: string
  elements: SerializedElement[]
  timeline: TimelineDefinition | null
  transition: SceneTransition       // Ignored for first scene
}

interface SceneTransition {
  type: TransitionType
  duration: number                  // In milliseconds
}

type TransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
```

### playSequence()

```typescript
async function playSequence(
  container: HTMLElement | string,
  source: string | SequenceDefinition,
  options?: SequencerOptions
): Promise<TinyflySequencer>
```

Create a sequencer and immediately start playback.

```typescript
const sequencer = await tinyfly.playSequence('#container', './sequence.json', {
  loop: -1,
  onSceneChange: (index) => console.log(`Now playing scene ${index}`)
})
```

---

## DOMAdapter

Applies animation state to HTML elements using CSS transforms and styles.

### Usage

```typescript
import { DOMAdapter } from 'tinyfly/adapters/dom'

const adapter = new DOMAdapter()
adapter.registerTarget('box', document.getElementById('my-box'))

// In animation loop:
const state = timeline.getStateAtTime(timeline.currentTime)
adapter.applyState(state)
```

### Methods

| Method | Description |
|--------|-------------|
| `registerTarget(id, element)` | Register an HTML element as a target |
| `unregisterTarget(id)` | Remove a target |
| `getTarget(id)` | Get a registered element |
| `clearTargets()` | Remove all targets |
| `applyState(state)` | Apply animation state to all registered targets |

### Property Mappings

The DOM adapter maps animation properties to CSS:

**Transform properties** (applied via `style.transform`):
- `x` → `translateX`
- `y` → `translateY`
- `rotation` / `rotate` → `rotate`
- `scale` → `scale`
- `scaleX` → `scaleX`
- `scaleY` → `scaleY`
- `skewX` → `skewX`
- `skewY` → `skewY`

**Style properties:**
- `opacity` → `style.opacity`
- `fill` → `style.backgroundColor` (or `style.color` for text)
- `stroke` → `style.borderColor`
- `strokeWidth` → `style.borderWidth`
- `width` → `style.width`
- `height` → `style.height`
- `borderRadius` → `style.borderRadius`
- `fontSize` → `style.fontSize`

**Motion path properties:**
- `motionPathX` → adds `translateX` override
- `motionPathY` → adds `translateY` override
- `motionPathRotate` → adds `rotate` override

---

## CanvasAdapter

Draws animated shapes on a Canvas 2D context.

### Usage

```typescript
import { CanvasAdapter } from 'tinyfly/adapters/canvas'

const canvas = document.getElementById('my-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')
const adapter = new CanvasAdapter()

// Register targets
adapter.registerTarget('box', {
  type: 'rect',
  x: 50, y: 50, width: 100, height: 100,
  fillStyle: '#4a9eff'
})

// Animation loop
function animate() {
  const state = timeline.getStateAtTime(timeline.currentTime)
  adapter.applyState(state)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  adapter.render(ctx)
  requestAnimationFrame(animate)
}
```

### Methods

| Method | Description |
|--------|-------------|
| `registerTarget(id, target, aliasFor?)` | Register a canvas target |
| `unregisterTarget(id)` | Remove a target |
| `getTarget(id)` | Get a registered target |
| `clearTargets()` | Remove all targets |
| `applyState(state)` | Update target properties from animation state |
| `render(ctx)` | Draw all targets to a canvas context |
| `static loadImage(src)` | Load an image for use as ImageTarget |

### Target Types

#### RectTarget

```typescript
{
  type: 'rect'
  x: number, y: number, width: number, height: number
  opacity?: number, rotate?: number, scale?: number
  fillStyle?: string | LinearGradient | RadialGradient
  strokeStyle?: string, lineWidth?: number
  borderRadius?: number
}
```

#### CircleTarget

```typescript
{
  type: 'circle'
  x: number, y: number, radius: number
  opacity?: number, rotate?: number, scale?: number
  fillStyle?: string | LinearGradient | RadialGradient
  strokeStyle?: string, lineWidth?: number
}
```

#### TextTarget

```typescript
{
  type: 'text'
  x: number, y: number, text: string
  fontSize?: number, fontFamily?: string, fontWeight?: number
  textAlign?: 'left' | 'center' | 'right'
  textBaseline?: CanvasTextBaseline
  fillStyle?: string | LinearGradient | RadialGradient
  strokeStyle?: string
}
```

#### LineTarget

```typescript
{
  type: 'line'
  x: number, y: number, x2: number, y2: number
  strokeStyle?: string, lineWidth?: number
  lineCap?: CanvasLineCap
}
```

#### PathTarget

```typescript
{
  type: 'path'
  x: number, y: number, d: string    // SVG path data
  fillStyle?: string | LinearGradient | RadialGradient
  strokeStyle?: string, lineWidth?: number
  lineCap?: CanvasLineCap, lineJoin?: CanvasLineJoin
}
```

#### ImageTarget

```typescript
{
  type: 'image'
  x: number, y: number, width: number, height: number
  image: CanvasImageSource | null
  opacity?: number
}
```

### Gradient Support

```typescript
interface LinearGradient {
  type: 'linear'
  angle: number          // Degrees
  stops: GradientStop[]
}

interface RadialGradient {
  type: 'radial'
  centerX: number        // 0-1, relative to target
  centerY: number        // 0-1, relative to target
  radius: number         // 0-1, relative to target
  stops: GradientStop[]
}

interface GradientStop {
  offset: number         // 0-1
  color: string
}
```

---

## SVGAdapter

Applies animation state to SVG elements.

### Usage

```typescript
import { SVGAdapter } from 'tinyfly/adapters/svg'

const adapter = new SVGAdapter()
const circle = document.querySelector('circle') as SVGElement
adapter.registerTarget('ball', circle)

// In animation loop:
adapter.applyState(state)
```

### Methods

Same interface as DOMAdapter:

| Method | Description |
|--------|-------------|
| `registerTarget(id, element)` | Register an SVG element |
| `unregisterTarget(id)` | Remove a target |
| `getTarget(id)` | Get a registered element |
| `clearTargets()` | Remove all targets |
| `applyState(state)` | Apply state to SVG elements |

### Property Mappings

**SVG attributes** (set via `setAttribute`):
- `fill`, `stroke`, `d`, `points`
- `x`, `y`, `cx`, `cy`, `r`, `rx`, `ry`
- `width`, `height`
- `strokeWidth` → `stroke-width`
- `borderRadius` → `rx`

**Transform properties** (set via `style.transform`):
- `x`, `y` → `translateX`/`translateY` (for non-positioning elements)
- `rotation` → `rotate`
- `scale`, `scaleX`, `scaleY` → `scale`

**Style properties:**
- `opacity` → `style.opacity`
- `fontSize` → `style.fontSize`

---

## Export Formats

### CSS Export

```typescript
import { exportToCSS } from 'tinyfly/engine/export'

interface CSSExportOptions {
  classPrefix?: string              // CSS class prefix (default: 'tinyfly')
  includeKeyframes?: boolean        // Include @keyframes (default: true)
  includeAnimation?: boolean        // Include animation properties (default: true)
  minify?: boolean                  // Minify output (default: false)
  propertyMap?: Record<string, string>  // Custom property name mapping
}

interface CSSExportResult {
  css: string                        // Full CSS output
  keyframes: Map<string, string>     // Individual @keyframes blocks
  selectors: Map<string, string>     // Individual animation properties
}

const result = exportToCSS(timeline, {
  classPrefix: 'my-anim',
  minify: true
})

// result.css contains the full CSS output
```

Generates standard CSS `@keyframes` animations. Combines transform properties automatically and maps easing to CSS timing functions.

### Lottie Export

```typescript
import { exportToLottie } from 'tinyfly/engine/export'

interface LottieExportOptions {
  name?: string                     // Animation name
  frameRate?: number                // Frame rate (default: 60)
  width?: number                    // Canvas width (default: 512)
  height?: number                   // Canvas height (default: 512)
  backgroundColor?: string          // Background color
}

const lottie = exportToLottie(timeline, {
  name: 'My Animation',
  frameRate: 30,
  width: 800,
  height: 600
})

// lottie is a bodymovin-compatible JSON object
```

Exports animations in the Lottie/bodymovin format. Supports position, rotation, scale, and opacity properties.

### GIF Export

```typescript
import { extractFrames } from 'tinyfly/engine/export'

interface GIFExportOptions {
  width: number
  height: number
  frameRate?: number                 // Default: 30
  quality?: number                   // 1-20, lower = better quality
  backgroundColor?: string
  loops?: number                     // 0 = infinite loop
  renderFrame?: (
    ctx: CanvasRenderingContext2D,
    values: Map<string, Map<string, AnimatableValue>>,
    time: number
  ) => void
}

interface GIFExportResult {
  frames: GIFFrame[]
  duration: number
  frameCount: number
}

const result = extractFrames(timeline, {
  width: 400,
  height: 300,
  frameRate: 15
})
```

Extracts individual frames from the animation. Use with a GIF encoder library (like gif.js or gifenc) to create the actual GIF file. The `renderFrame` callback lets you customize how each frame is drawn.
