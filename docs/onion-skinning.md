# Onion skinning

Onion skinning shows faint **ghost frames** of the animation just before and
after the playhead, so you can see the arc of a move (a bounce, a swing, an
ease) while editing a single frame.

## Using it

1. Switch the preview to the **Canvas** renderer.
2. Click **🧅 Onion** in the preview header.
3. Scrub the playhead — dim copies of the moving elements appear at nearby times,
   brightest closest to the playhead.

Onion skin only draws while **paused** (it would just blur during playback) and
is an **editor-only visualization** — it is never part of the exported animation
or the saved JSON.

## Why Canvas only

The Canvas renderer can cheaply redraw the whole stage several times per frame at
different opacities. The DOM/SVG renderers would need cloned element trees per
ghost, which is heavier and easy to get wrong — so onion skin is Canvas-only for
now. The camera is honoured per ghost, so ghosts land where they actually appear.

## How it works

`src/editor/utils/onion.ts` is a pure helper:

```ts
onionGhostTimes(now, duration, { frames = 3, step = 120, maxAlpha = 0.35 })
  // → [{ time, alpha }, …]   nearer ghosts brighter; out-of-range times dropped
```

The preview (`preview-panel.tsx`, `renderCanvas`) samples each ghost time with
`timeline.getStateAtTime`, applies it to the Canvas adapter, and renders at the
ghost's alpha before drawing the current frame at full opacity.

## Config

The defaults (3 frames each side, 120 ms apart, 0.35 max opacity) are baked in for
now. Exposing them in the UI is a possible later refinement.
