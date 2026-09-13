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
- [WebGLAdapter](#webgladapter)
- [Spring Tracks](#spring-tracks)
- [Stagger](#stagger)
- [Baking](#baking)
- [Authoring Values](#authoring-values)
- [Drivers](#drivers)
- [Interaction](#interaction)
- [Flip](#flip)
- [GSAP Compat](#gsap-compat)
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
  matrix?: [a, b, c, d, e, f]  // Affine transform applied to points and tangent
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

When several tracks drive the same target and property, the value comes from the track that **started most recently** (its first keyframe plus delay and stagger, at or before `time`). Before any of them has started, the one that **starts first** supplies its starting value. Ties on start time go to the track added last. This is what lets a sequence of tweens on one property play in order. `findConflicts()` names winners by the same rule.

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

### morphPath (shape tween)

```typescript
function morphPath(from: string, to: string, progress: number, samples?: number): string
function isPathData(value: string): boolean
```

Interpolate between two SVG path `d` strings. Both paths are sampled uniformly
along their length and the points are blended by `progress`, so **any** two shapes
morph smoothly and deterministically (no DOM required). `isPathData` recognises a
string that starts with a moveto. A `d` track animates a path's shape — see
[shape-morph.md](shape-morph.md).

### getInterpolator

```typescript
function getInterpolator<T extends AnimatableValue>(sampleValue: T): Interpolator<T>
```

Auto-detect and return the appropriate interpolator based on a sample value:
- Numbers → `interpolateNumber`
- Strings starting with `#` or `rgb` → `interpolateColor`
- **SVG path data** (a moveto) → `morphPath` (shape morph)
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

Progress is by arc length, including within curves, so followers move at an even
speed. `matrix` places the path into another coordinate space (x' = a·x + c·y + e,
y' = b·x + d·y + f); the tangent is transformed too, so `autoRotate` still faces
along the path.

### Path utilities

```typescript
import { parsePath, getPointAtProgress, getPathLength, pointsToPath, shapeToPathData, morphPath } from 'tinyfly'

getPathLength('M0 0 L30 40')                          // 50
getPointAtProgress('M0 0 Q50 100 100 0', 0.5)         // { x: 50, y: 50, angle: 0 }
pointsToPath([{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 100, y: 0 }], { curviness: 1, closed: false })
shapeToPathData({ tag: 'circle', attributes: { cx: '50', cy: '50', r: '40' } })  // 'M90 50 A40 40 …'
```

`morphPath(from, to, progress, { shapeIndex? })` blends two paths: subpaths are
paired, the start point and winding are chosen automatically (or forced with
`shapeIndex`), and corners of both shapes are kept. `pointAtDistance(segments,
distance, start?, end?)` samples a run of parsed segments; `parsePath(d).subpaths`
lists each subpath's segment range, length and whether it is closed.

`parsePath` reads every SVG path command, absolute or relative, including compact
notation (`10-20`, `.5.5`, exponents, unseparated arc flags). It normalises to
absolute lines and cubic beziers (`Q`/`T` exactly, `S`/`T` with reflected
controls, arcs split into ≤90° cubics). Results are cached (bounded).

### GSAP-style: `motionPath`

`tf`, `timeline()` and `live` accept `motionPath: { path, curviness, autoRotate, start, end }`
(or shorthand path data / points). `live` also accepts a selector or element for
`path`, plus `align` and `alignOrigin`. See [gsap-compat.md](gsap-compat.md#motion-paths).

---

## Text Tracks

Animate text by typing or scrambling from one string to another.

```typescript
interface TextConfig {
  from?: string           // text at progress 0 (default '')
  to: string              // text at progress 1
  mode: 'type' | 'scramble'
  chars?: 'upperCase' | 'lowerCase' | 'upperAndLowerCase' | 'numbers' | string
  refreshRate?: number    // scramble: random-character changes per second (default 20)
  revealDelay?: number    // scramble: fraction of the tween before characters settle
  tweenLength?: boolean   // scramble: grow/shrink length over the tween (default true)
  rightToLeft?: boolean   // reveal / type from the end
  seed?: number           // scramble: fixes the random characters
}

interface TextTrack {
  id: string
  target: string
  property: 'text'
  textConfig: TextConfig
  keyframes: Keyframe<number>[]   // progress 0-1, with easing
  delay?: number; endDelay?: number; targets?: string[]; stagger?: StaggerConfig
}
```

The timeline expands progress into a `text` value in the animation state; the DOM
and SVG adapters set it as `textContent`, and the Canvas adapter as a text
target's `text`. `textAt(config, progress, elapsedMs)` computes the string
directly. It is pure: scramble characters come from a hash of the seed, position
and refresh step, so the same inputs always give the same string.

In `type` mode, the new text overwrites the old one character at a time over the
longer of the two strings, so typing towards shorter text deletes as it goes.

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

The engine also ships real encoders used by the editor: `exportToGIF`,
`exportToWebP`, and `exportVideo` (H.264 via WebCodecs/MediaRecorder), each taking
a `renderFrame` callback and returning a `Blob`.

### Sprite-sheet layout

```typescript
import {
  spriteSheetLayout, frameCell, spriteFrameTimes, spriteSheetMeta
} from 'tinyfly/engine/export'

const layout = spriteSheetLayout(frames, frameWidth, frameHeight, maxColumns) // grid + sheet size
const cell   = frameCell(index, layout)          // { index, col, row, x, y }
const times  = spriteFrameTimes(frames, durationMs) // even sample times (loop-safe)
const meta   = spriteSheetMeta(layout, fps, durationMs) // portable JSON metadata
```

Pure helpers for packing animation frames into a grid PNG and writing matching
metadata (frame size, columns/rows, count, fps). The editor's **Sprite** export
uses them to render each frame into its cell and download `…-spritesheet.png` +
`…-spritesheet.json`. See [sprite-sheet-export.md](sprite-sheet-export.md).

---

## WebGLAdapter

A minimal GPU render target: every element is a textured or solid-coloured quad
with a transform, opacity and tint. Covers the same ground as the Canvas adapter
for moving, scaling, rotating and fading rectangles and images. Paths, text and
gradients are out of scope — use the Canvas or SVG adapter for those.

```typescript
import { WebGLAdapter } from 'tinyfly/adapters/webgl'

const gl = canvas.getContext('webgl')!
const adapter = new WebGLAdapter(gl)

adapter.registerTarget('box', { x: 200, y: 100, width: 80, height: 80, fill: '#4f9' })

timeline.onUpdate = (state) => {
  adapter.applyState(state)
  adapter.render()
}
```

Pure helpers `quadMatrix(target, canvasWidth, canvasHeight)` and
`parseColor(hex)` are exported for testing and for building your own renderer.

---

## Inertia Tracks

A throw: a value released with a velocity that slows under friction and comes to rest.

```typescript
interface InertiaConfig {
  from: number
  velocity: number              // units per second at release
  friction?: number             // decay rate per second (default 4)
  min?: number
  max?: number
  end?: number | number[]       // snap to multiples of a number, or the nearest listed value
  restDelta?: number            // settle threshold (default: scales with distance)
}

interface InertiaTrack {
  id: string
  target: string
  property: string
  kind: 'inertia'
  inertia: InertiaConfig
  delay?: number; targets?: string[]; stagger?: StaggerConfig
}
```

`x(t) = from + (rest − from)(1 − e^(−friction·t))`, where `rest` is the free
throw's stopping point (`from + velocity / friction`), snapped, then clamped to
bounds. Settling takes the same time for any distance, like springs.

```typescript
inertiaValueAt(config, timeMs): number
inertiaVelocityAt(config, timeMs): number
inertiaRest(config): number          // where it comes to rest
naturalRest(config): number          // where a free throw would stop
inertiaDuration(config): number      // ms until settled
bakeInertiaTrack(track, options?): Track<number>
```

`Timeline.replaceTrack(id, track)` swaps a track in place, keeping its position
in the track order (which decides ties between overlapping tracks).

---

## Spring Tracks

A track whose values come from a physical simulation rather than keyframes.

```typescript
timeline.addTrack({
  id: 'pop',
  target: 'box',
  property: 'scale',
  kind: 'spring',
  spring: { from: 0, to: 1, stiffness: 200, damping: 12, mass: 1, velocity: 0 },
})
```

| Field | Default | Meaning |
|---|---|---|
| `from` / `to` | — | Start and resting values |
| `stiffness` | 180 | Higher is snappier |
| `damping` | 12 | Higher settles sooner; 0 oscillates forever |
| `mass` | 1 | Higher is more sluggish |
| `velocity` | 0 | Initial velocity, units/second |
| `restDelta` | 0.01 | Distance from `to` that counts as settled |
| `restSpeed` | 0.01 | Speed that counts as settled |

Springs are integrated at a **fixed 1ms timestep from t=0** on every query, so
`getValueAtTime` stays a pure function of time: seeking backwards gives the same
values as playing forwards, and two runs are byte-identical. The simulation is
memoised, so scrubbing is cheap after the first pass. An undamped spring is
capped at 60s so its duration stays finite.

Because the animation is the *parameters*, a spring track serializes like any
other track.

```typescript
import {
  SpringSampler, springValueAt, springDuration, isUnderdamped, criticalDamping,
} from 'tinyfly'

springDuration({ from: 0, to: 100 })     // natural settle time in ms
springValueAt({ from: 0, to: 100 }, 120) // value at 120ms
isUnderdamped({ from: 0, to: 100, damping: 4 })  // true — it overshoots
criticalDamping({ from: 0, to: 100, stiffness: 100, mass: 1 })  // 20
```

`isUnderdamped` is the closed-form test for whether a spring passes its target
before settling (`damping < 2 * sqrt(stiffness * mass)`), so it costs nothing —
no simulation needed. Overshoot is usually the point of reaching for a spring,
and its absence is the most common reason a "bouncy" one looks flat.

### Authoring in the editor

Add a spring from the **Tracks** panel (**+** → **Add Spring**), then tune it in
**Properties**: named feel presets (Gentle, Snappy, Bouncy, Wobbly…), from/to,
delay, and sliders for stiffness, damping and mass. The panel shows the settle
time and flags whether the spring overshoots.

The scene extends automatically to fit the settle time — a spring decides its
own duration, so a looser one simply takes longer, and without that the tail
would be silently cut off.

---

## Stagger

One track can drive many targets, each offset in time.

```typescript
timeline.addTrack(createTrack({
  id: 'letters',
  target: 'unused',            // ignored when `targets` is present
  targets: ['l1', 'l2', 'l3'],
  stagger: { each: 100, from: 'center' },
  property: 'opacity',
  keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1 }],
}))
```

| Field | Meaning |
|---|---|
| `each` | Milliseconds between consecutive targets |
| `amount` | Total spread, divided across the targets (wins over `each`) |
| `from` | `'start'` (default), `'end'`, `'center'`, `'edges'`, or an index |

This produces exactly what baking the stagger into N separate tracks would, so
either form is valid. **Which to use is a file-size and editability trade-off,
not a speed one** — the two evaluate at the same rate (measured; see
`stagger-forms.test.ts`), but serialize very differently:

| Targets | Baked JSON | Runtime JSON |
|---|---|---|
| 100 | 11,676 bytes | 792 bytes |
| 500 | 59,626 bytes | 3,593 bytes |

Use the **runtime** form when the stagger is uniform and you ship the JSON — a
500-letter split is 59 KB baked and 3.5 KB as one track. Use the **baked** form
when each target needs to be tuned individually, which is why the editor's
per-letter stagger bakes: it keeps every letter's keyframes draggable.

Pure helpers, shared by the editor, the engine and the compat facade:

```typescript
import { staggerOffset, staggerOffsets, staggerSpan, staggerDistance } from 'tinyfly'

staggerOffsets(3, { each: 100 })   // [0, 100, 200]
staggerSpan(4, { each: 100 })      // 300 — how far it extends a timeline
```

### Track scheduling

Every track kind also accepts:

| Field | Meaning |
|---|---|
| `delay` | Shift every keyframe by this many ms at evaluation time |
| `endDelay` | Extra ms held after the last keyframe (extends duration) |

---

## Baking

Turning a computed animation into plain keyframes, for export formats that only
understand keyframes (CSS, Lottie) and for eases with no closed form.

```typescript
import { bakeSpringTrack, bakeEasing, toKeyframedTracks, simplifyKeyframes } from 'tinyfly'

bakeSpringTrack(springTrack, { intervalMs: 1000 / 60, tolerance: 0.01 })
bakeEasing(fromKeyframe, toKeyframe, elasticFn, { intervalMs: 16 })
toKeyframedTracks(timeline.tracks)   // springs baked, everything else untouched
```

Baking is lossy in file size, not fidelity: sampling a deterministic simulation
always produces the same keyframes. `simplifyKeyframes` drops points that lie on
a straight line between their neighbours.

---

## Authoring Values

Relative and random values are resolved when the timeline is **built**, not when
it runs, so what lands in the JSON is a plain number.

```typescript
import { ValueResolver, resolveValue, resolveSequence, createRandom } from 'tinyfly'

resolveValue('+=100', { base: 50 })          // 150
resolveSequence(['+=100', '+=100'], 0)       // [100, 200]

const resolver = new ValueResolver(2024)     // the seed
resolver.resolve('random(-50, 50)')          // same seed → same number, always
resolver.seed                                // store alongside the timeline
```

Operators: `+=`, `-=`, `*=`, `/=`. Random: `random(min, max)` and
`random(min, max, step)`. Non-expression values (numbers, colours, path data)
pass through untouched.

---

## Drivers

Modules that decide *when* a timeline advances and *to what time*. They may
touch the DOM; the engine never imports them. See
[scroll-animation.md](scroll-animation.md).

```typescript
import { VisibilityDriver, ScrollDriver, scrollProgress } from 'tinyfly/drivers'

new VisibilityDriver({ timeline, trigger, behaviour: 'once' }).start()
new ScrollDriver({ timeline, trigger, start: 'top bottom', end: 'bottom top', scrub: true }).start()
```

`scrollProgress(rect, viewportHeight, start, end)` and `parseTrigger` are pure
and exported, so trigger geometry can be tested without a browser.

The editor's **⇅ Scroll** preview attaches the same `ScrollDriver` to a real
scroll strip, so triggers tuned there behave identically on a page.

---

## Interaction

Live input. **Has no serializable representation** — a dragged position is not
part of an animation document.

```typescript
import { Observer, Draggable } from 'tinyfly/interaction'

// Drag to scrub a timeline
new Draggable({ target: el, mode: 'scrub', timeline, scrubDistance: 500 }).start()

// Drag to move, with bounds and snapping
new Draggable({ target: el, axis: 'x', bounds: { minX: 0, maxX: 300 }, snap: 25 }).start()
```

`Observer` normalises pointer, touch and wheel into one `{ deltaX, deltaY,
velocityX, velocityY, totalX, totalY, isDragging }` shape.

Snapping shares the editor stage's math (`snapAxis` / `gridLinesFor`, also
exported from this entry point). Pass `snapLinesX` / `snapLinesY` to snap to
other elements' edges or guides, and read `draggable.snapLines` — or the
`onSnap` callback — to draw a guide for whichever line caught. `snapThreshold`
defaults to half the grid size, so a plain `snap: n` behaves like rounding.

---

## Flip

FLIP layout transitions, compiled to ordinary keyframes at authoring time.

```typescript
import { flip, recordFlipState, buildFlipTracks } from 'tinyfly/adapters/dom'

const tracks = flip(
  [{ name: 'card', element: cardEl }],
  () => container.classList.add('grid-layout'),   // your layout change
  { duration: 600, easing: 'ease-out' }
)
tracks.forEach((t) => timeline.addTrack(t))
```

Measurement happens in the DOM layer, so the engine stays free of live layout
reads. The trade-off: the resulting JSON is a snapshot of one specific layout
change — recompute it when the layout it was measured against changes.

---

## GSAP Compat

A GSAP-flavoured authoring surface that desugars to ordinary tracks. See
[gsap-compat.md](gsap-compat.md) for the full mapping table.

```typescript
import { timeline, quickPlay } from 'tinyfly/gsap-compat'

const tl = timeline()
tl.fromTo('box', { x: 0 }, { x: 200, duration: 1, ease: 'power2.out' })
tl.to('box', { rotate: 180, duration: 0.5 }, '-=0.25')

quickPlay({ timeline: tl.timeline, targets: { box: '#box' } })
```

`quickPlay` also stands alone: it wires a timeline to the DOM and runs the rAF
loop, replacing the usual boilerplate.

### `live` — play on real elements

```typescript
import { live, createLive, Stage } from 'tinyfly/gsap-compat'

live.to('.box', { x: 200, duration: 1 })          // → LiveTimeline, already playing
live.from(target, vars)
live.fromTo(target, fromVars, toVars)
live.set(target, vars)                            // applied on the next microtask
live.timeline(options?: LiveTimelineOptions)      // chainable .to/.from/.fromTo/.set/.addLabel/.add
```

`target` is a CSS selector, an `Element`, a `NodeList`, or an array of either.

| `LiveTimelineOptions` | |
|---|---|
| `repeat`, `yoyo`, `repeatDelay`, `timeScale`, `defaults`, `bakeEases`, `onWarning` | As on `timeline()` |
| `paused` | Do not autoplay |
| `onStart`, `onUpdate`, `onComplete` | Lifecycle callbacks |

`LiveTimeline` methods: `play()`, `pause()`, `resume()`, `restart()`,
`reverse()`, `seek(secondsOrLabel)`, `progress(value?)`, `timeScale(value?)`,
`duration()`, `isActive()`, `kill()`, `toDefinition()`. The engine timeline is
`.timeline`, the compiled compat timeline `.compat`.

`createLive(stage)` binds the same API to a separate `Stage`
(`new Stage({ scheduler?, root? })`). `stage.tick(ms)` advances it by hand, and
`stage.destroy()` stops everything on it and releases its elements.

### Flip

```typescript
live.getFlipState(targets): LiveFlipState
live.flipFrom(state, { duration?, ease?, stagger?, scale?, targets?, enter?, onComplete? }): LiveTimeline
live.flip(targets, change: () => void, vars?): LiveTimeline
```

Measures where elements appear before a layout change (transforms included) and
where they are laid out after (transforms ignored), then animates each from the
difference back to rest using centre offsets, plus scale for size changes.
Newly visible elements get the `enter` animation. A flip that starts while
another is running takes over each element from where it appears.

### Browser bundle

`tinyfly/browser` (and `lib/browser/tinyfly.iife.js` for `<script>` tags, global
`tinyfly`) re-exports the engine, player, drivers, interaction, `tf`, `live`,
`Stage` and `quickPlay`, with `to`, `from`, `fromTo`, `set` and `timeline` at the
top level bound to `live`.
