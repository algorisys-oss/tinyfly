# Code Examples

Practical examples for common animation patterns using the tinyfly API.

## Table of Contents

- [Basic: Fade In](#basic-fade-in)
- [Multi-Property Animation](#multi-property-animation)
- [Infinite Looping](#infinite-looping)
- [Color Animation](#color-animation)
- [Custom Cubic Bezier Easing](#custom-cubic-bezier-easing)
- [Load from External JSON](#load-from-external-json)
- [Canvas Rendering](#canvas-rendering)
- [SVG Animation](#svg-animation)
- [Multi-Scene Sequence](#multi-scene-sequence)
- [Programmatic Animation Builder](#programmatic-animation-builder)
- [Motion Path](#motion-path)
- [Embed with IIFE Player](#embed-with-iife-player)

---

## Basic: Fade In

The simplest animation — fade an element from invisible to visible.

```typescript
import { Timeline, createTrack } from 'tinyfly'
import { DOMAdapter } from 'tinyfly/adapters/dom'

const timeline = new Timeline({
  id: 'fade-in',
  config: { duration: 1000 }
})

timeline.addTrack(createTrack({
  id: 'opacity',
  target: 'box',
  property: 'opacity',
  keyframes: [
    { time: 0, value: 0 },
    { time: 1000, value: 1, easing: 'ease-out' }
  ]
}))

// Set up DOM rendering
const adapter = new DOMAdapter()
adapter.registerTarget('box', document.getElementById('my-box'))

timeline.onUpdate = (state) => adapter.applyState(state)
timeline.play()

// Animation loop
function animate() {
  timeline.tick(16.67)
  if (timeline.playbackState === 'playing') {
    requestAnimationFrame(animate)
  }
}
requestAnimationFrame(animate)
```

---

## Multi-Property Animation

Animate position, opacity, and rotation simultaneously.

```typescript
import { Timeline, createTrack } from 'tinyfly'

const timeline = new Timeline({
  id: 'multi-prop',
  config: { duration: 2000 }
})

// Move horizontally
timeline.addTrack(createTrack({
  id: 'move-x',
  target: 'box',
  property: 'x',
  keyframes: [
    { time: 0, value: 0 },
    { time: 2000, value: 300, easing: 'ease-in-out' }
  ]
}))

// Fade in
timeline.addTrack(createTrack({
  id: 'fade',
  target: 'box',
  property: 'opacity',
  keyframes: [
    { time: 0, value: 0 },
    { time: 500, value: 1, easing: 'ease-out' }
  ]
}))

// Rotate
timeline.addTrack(createTrack({
  id: 'rotate',
  target: 'box',
  property: 'rotation',
  keyframes: [
    { time: 0, value: 0 },
    { time: 2000, value: 360, easing: 'ease-in-out' }
  ]
}))
```

---

## Infinite Looping

Create an animation that loops forever with a ping-pong (alternate) effect.

```typescript
const timeline = new Timeline({
  id: 'pulse',
  config: {
    duration: 800,
    loop: -1,        // Infinite loop
    alternate: true  // Reverse direction each loop
  }
})

timeline.addTrack(createTrack({
  id: 'scale-x',
  target: 'box',
  property: 'scaleX',
  keyframes: [
    { time: 0, value: 1 },
    { time: 800, value: 1.2, easing: 'ease-in-out' }
  ]
}))

timeline.addTrack(createTrack({
  id: 'scale-y',
  target: 'box',
  property: 'scaleY',
  keyframes: [
    { time: 0, value: 1 },
    { time: 800, value: 1.2, easing: 'ease-in-out' }
  ]
}))

// This will pulse smoothly: grow → shrink → grow → shrink → ...
```

---

## Color Animation

Smoothly transition between colors.

```typescript
const timeline = new Timeline({
  id: 'color-cycle',
  config: { duration: 3000, loop: -1 }
})

timeline.addTrack(createTrack({
  id: 'bg-color',
  target: 'box',
  property: 'fill',
  keyframes: [
    { time: 0, value: '#4a9eff' },       // Blue
    { time: 1000, value: '#ff4a4a' },     // Red
    { time: 2000, value: '#4aff4a' },     // Green
    { time: 3000, value: '#4a9eff' }      // Back to blue
  ]
}))
```

The engine automatically detects color values and uses color interpolation (blending in RGB space).

---

## Custom Cubic Bezier Easing

Define precise easing curves using cubic bezier control points.

```typescript
import { createCubicBezier } from 'tinyfly'

// Create a custom "bounce" feel
const bounceEase = createCubicBezier([0.68, -0.55, 0.265, 1.55])

// Use in keyframes with the object syntax
const timeline = new Timeline({
  id: 'custom-ease',
  config: { duration: 1000 }
})

timeline.addTrack(createTrack({
  id: 'move',
  target: 'box',
  property: 'y',
  keyframes: [
    { time: 0, value: 0 },
    {
      time: 1000,
      value: 200,
      easing: {
        type: 'cubic-bezier',
        points: [0.68, -0.55, 0.265, 1.55]
      }
    }
  ]
}))
```

---

## Load from External JSON

Load a previously exported animation from a JSON file.

### Using TinyflyPlayer

```typescript
import { TinyflyPlayer } from 'tinyfly/player'

const player = new TinyflyPlayer('#animation-container', {
  loop: -1,
  autoplay: true
})

// Load from URL
await player.load('./my-animation.json')

// Controls
player.pause()
player.seek(500)
player.setSpeed(2)
player.play()

// Cleanup when done
player.destroy()
```

### Using Serialization Directly

```typescript
import { fromJSON } from 'tinyfly'

const response = await fetch('./my-animation.json')
const json = await response.text()
const timeline = fromJSON(json)

timeline.play()
```

### Animation JSON Format

```json
{
  "id": "my-animation",
  "config": {
    "duration": 2000,
    "loop": -1
  },
  "tracks": [
    {
      "id": "track-1",
      "target": "box",
      "property": "opacity",
      "keyframes": [
        { "time": 0, "value": 0 },
        { "time": 1000, "value": 1, "easing": "ease-out" },
        { "time": 2000, "value": 0, "easing": "ease-in" }
      ]
    }
  ]
}
```

---

## Canvas Rendering

Animate shapes on a `<canvas>` element.

```typescript
import { Timeline, createTrack } from 'tinyfly'
import { CanvasAdapter } from 'tinyfly/adapters/canvas'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const adapter = new CanvasAdapter()

// Register shapes
adapter.registerTarget('box', {
  type: 'rect',
  x: 50, y: 50,
  width: 80, height: 80,
  fillStyle: '#4a9eff',
  borderRadius: 8
})

adapter.registerTarget('ball', {
  type: 'circle',
  x: 200, y: 100,
  radius: 30,
  fillStyle: '#ff4a4a'
})

adapter.registerTarget('label', {
  type: 'text',
  x: 150, y: 180,
  text: 'Hello!',
  fontSize: 24,
  fontFamily: 'Arial',
  fillStyle: '#ffffff',
  textAlign: 'center'
})

// Create timeline
const timeline = new Timeline({
  id: 'canvas-demo',
  config: { duration: 2000, loop: -1, alternate: true }
})

timeline.addTrack(createTrack({
  id: 'box-x',
  target: 'box',
  property: 'x',
  keyframes: [
    { time: 0, value: 50 },
    { time: 2000, value: 250, easing: 'ease-in-out' }
  ]
}))

timeline.addTrack(createTrack({
  id: 'ball-opacity',
  target: 'ball',
  property: 'opacity',
  keyframes: [
    { time: 0, value: 1 },
    { time: 1000, value: 0.3, easing: 'ease-in-out' },
    { time: 2000, value: 1, easing: 'ease-in-out' }
  ]
}))

// Animation loop
timeline.onUpdate = (state) => adapter.applyState(state)
timeline.play()

function animate() {
  timeline.tick(16.67)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  adapter.render(ctx)
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
```

### Canvas Gradients

```typescript
adapter.registerTarget('gradient-box', {
  type: 'rect',
  x: 50, y: 50,
  width: 200, height: 100,
  fillStyle: {
    type: 'linear',
    angle: 45,
    stops: [
      { offset: 0, color: '#4a9eff' },
      { offset: 1, color: '#ff4a4a' }
    ]
  }
})
```

---

## SVG Animation

Animate SVG elements directly.

```html
<svg id="my-svg" width="300" height="200">
  <circle id="ball" cx="50" cy="100" r="20" fill="#4a9eff" />
  <rect id="box" x="200" y="75" width="50" height="50" fill="#ff4a4a" />
</svg>
```

```typescript
import { Timeline, createTrack } from 'tinyfly'
import { SVGAdapter } from 'tinyfly/adapters/svg'

const adapter = new SVGAdapter()
adapter.registerTarget('ball', document.getElementById('ball') as SVGElement)
adapter.registerTarget('box', document.getElementById('box') as SVGElement)

const timeline = new Timeline({
  id: 'svg-demo',
  config: { duration: 2000, loop: -1 }
})

// Animate circle position
timeline.addTrack(createTrack({
  id: 'ball-cx',
  target: 'ball',
  property: 'cx',
  keyframes: [
    { time: 0, value: 50 },
    { time: 2000, value: 250, easing: 'ease-in-out' }
  ]
}))

// Animate rect fill color
timeline.addTrack(createTrack({
  id: 'box-fill',
  target: 'box',
  property: 'fill',
  keyframes: [
    { time: 0, value: '#ff4a4a' },
    { time: 1000, value: '#4aff4a' },
    { time: 2000, value: '#ff4a4a' }
  ]
}))

timeline.onUpdate = (state) => adapter.applyState(state)
timeline.play()

function animate() {
  timeline.tick(16.67)
  if (timeline.playbackState === 'playing') {
    requestAnimationFrame(animate)
  }
}
requestAnimationFrame(animate)
```

---

## Multi-Scene Sequence

Play multiple scenes in order with transitions between them.

```typescript
import { TinyflySequencer } from 'tinyfly/player'

const sequencer = new TinyflySequencer('#container', {
  loop: -1,
  onSceneChange: (index) => {
    console.log(`Playing scene ${index}`)
  }
})

await sequencer.load({
  id: 'my-sequence',
  name: 'Demo Sequence',
  canvas: { width: 400, height: 300 },
  scenes: [
    {
      id: 'intro',
      name: 'Intro',
      elements: [
        {
          type: 'rect', name: 'box',
          x: 50, y: 50, width: 100, height: 100,
          rotation: 0, opacity: 1,
          html: '<div data-tinyfly="box" style="position:absolute;left:50px;top:50px;width:100px;height:100px;background:#4a9eff;"></div>'
        }
      ],
      timeline: {
        id: 'intro-tl',
        config: { duration: 1000 },
        tracks: [{
          id: 't1', target: 'box', property: 'opacity',
          keyframes: [
            { time: 0, value: 0 },
            { time: 1000, value: 1 }
          ]
        }]
      },
      transition: { type: 'none', duration: 0 }
    },
    {
      id: 'main',
      name: 'Main',
      elements: [
        {
          type: 'rect', name: 'circle',
          x: 100, y: 75, width: 80, height: 80,
          rotation: 0, opacity: 1,
          html: '<div data-tinyfly="circle" style="position:absolute;left:100px;top:75px;width:80px;height:80px;background:#ff4a4a;border-radius:50%;"></div>'
        }
      ],
      timeline: {
        id: 'main-tl',
        config: { duration: 1500 },
        tracks: [{
          id: 't2', target: 'circle', property: 'x',
          keyframes: [
            { time: 0, value: 100 },
            { time: 1500, value: 250 }
          ]
        }]
      },
      transition: { type: 'fade', duration: 500 }  // Fade in from previous scene
    }
  ]
})

sequencer.play()

// Controls
sequencer.pause()
sequencer.goToScene(0)  // Jump to first scene
sequencer.play()

// Cleanup
sequencer.destroy()
```

---

## Programmatic Animation Builder

Build animations entirely from code, without the visual editor.

```typescript
import { Timeline, createTrack, toJSON } from 'tinyfly'

function createBounceAnimation(targetName: string, duration = 1000): Timeline {
  const timeline = new Timeline({
    id: `bounce-${targetName}`,
    config: { duration, loop: -1 }
  })

  // Vertical bounce
  timeline.addTrack(createTrack({
    id: `${targetName}-y`,
    target: targetName,
    property: 'y',
    keyframes: [
      { time: 0, value: 0 },
      { time: duration * 0.4, value: -80, easing: 'ease-out' },
      { time: duration * 0.6, value: -80, easing: 'ease-in' },
      { time: duration, value: 0, easing: 'ease-in' }
    ]
  }))

  // Squash on landing
  timeline.addTrack(createTrack({
    id: `${targetName}-sx`,
    target: targetName,
    property: 'scaleX',
    keyframes: [
      { time: 0, value: 1 },
      { time: duration * 0.1, value: 1.2 },
      { time: duration * 0.3, value: 0.9 },
      { time: duration * 0.5, value: 1 },
      { time: duration * 0.9, value: 0.9 },
      { time: duration, value: 1.2 }
    ]
  }))

  timeline.addTrack(createTrack({
    id: `${targetName}-sy`,
    target: targetName,
    property: 'scaleY',
    keyframes: [
      { time: 0, value: 1 },
      { time: duration * 0.1, value: 0.8 },
      { time: duration * 0.3, value: 1.1 },
      { time: duration * 0.5, value: 1 },
      { time: duration * 0.9, value: 1.1 },
      { time: duration, value: 0.8 }
    ]
  }))

  return timeline
}

// Create and export
const bounce = createBounceAnimation('ball', 800)
const json = toJSON(bounce)
console.log(json)  // Save this JSON, use it with TinyflyPlayer later
```

---

## Motion Path

Animate an element along a curved SVG path.

```typescript
import { Timeline } from 'tinyfly'
import type { MotionPathTrack } from 'tinyfly'

const timeline = new Timeline({
  id: 'path-animation',
  config: { duration: 3000, loop: -1 }
})

// Define a curved path (SVG path data)
const motionTrack: MotionPathTrack = {
  id: 'follow-path',
  target: 'ball',
  property: 'motionPath',
  motionPathConfig: {
    pathData: 'M 50 150 C 100 50, 200 50, 250 150 S 400 250, 450 150',
    autoRotate: true,      // Element rotates to face direction of travel
    rotateOffset: -90      // Adjust facing angle
  },
  keyframes: [
    { time: 0, value: 0, easing: 'ease-in-out' },
    { time: 3000, value: 1 }    // 0 = start of path, 1 = end of path
  ]
}

timeline.addTrack(motionTrack)

// The timeline expands motionPath into:
// - motionPathX (x position on path)
// - motionPathY (y position on path)
// - motionPathRotate (tangent angle, when autoRotate is true)
```

---

## Embed with IIFE Player

For simple website embedding without a build system.

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    #animation {
      position: relative;
      width: 300px;
      height: 200px;
      background: #1a1a1a;
      overflow: hidden;
      border-radius: 8px;
    }
  </style>
</head>
<body>

<div id="animation">
  <div data-tinyfly="box"
       style="position: absolute; left: 50px; top: 50px;
              width: 60px; height: 60px; background: #4a9eff;
              border-radius: 4px;">
  </div>
  <div data-tinyfly="circle"
       style="position: absolute; left: 180px; top: 60px;
              width: 40px; height: 40px; background: #ff4a4a;
              border-radius: 50%;">
  </div>
</div>

<!-- Include the built player -->
<script src="tinyfly-player.iife.js"></script>
<script>
  // Inline animation data
  const animation = {
    id: "demo",
    config: { duration: 2000, loop: -1, alternate: true },
    tracks: [
      {
        id: "t1", target: "box", property: "x",
        keyframes: [
          { time: 0, value: 50 },
          { time: 2000, value: 200, easing: "ease-in-out" }
        ]
      },
      {
        id: "t2", target: "circle", property: "opacity",
        keyframes: [
          { time: 0, value: 1 },
          { time: 1000, value: 0.2 },
          { time: 2000, value: 1 }
        ]
      }
    ]
  };

  tinyfly.play('#animation', animation, {
    loop: -1,
    autoplay: true
  });
</script>

</body>
</html>
```

Build the player with `npm run build:player` to generate `dist/player/tinyfly-player.iife.js`.
