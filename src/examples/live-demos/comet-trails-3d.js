import { Timeline } from '../../engine'
import { loadScene3D, drawScene3D } from '../../scene-3d'
import { applyBloom } from '../../adapters/canvas'

// On a standalone page these come from the browser bundle's `tinyfly` global
// (with tinyfly-scene-3d.iife.js loaded after it); here they come from the
// source modules, so the code below runs unchanged in both.
const tinyfly = { Timeline, loadScene3D, drawScene3D, applyBloom }

export const html = `<style>
  .ct-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ct-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
  .ct-canvas { width: 100%; max-width: 420px; aspect-ratio: 16 / 9; height: auto; border-radius: 8px; background: #05030c; }
</style>
<div class="ct-wrap">
  <canvas class="ct-canvas" width="640" height="360"></canvas>
  <div class="ct-readout">lap 0%</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.ct-canvas')
  const ctx = canvas.getContext('2d')
  const readout = root.querySelector('.ct-readout')
  const LAP = 4000

  // Two comets ride on tilted spinning groups; each `trail` object follows one.
  // Every segment of a trail sorts by depth, so it passes behind the planet and in front.
  const scene = tinyfly.loadScene3D({
    id: 'sky',
    camera: 'eye',
    background: '#05030c',
    fog: { color: '#05030c', near: 6, far: 16 },
    materials: {
      planet: { color: '#1e1b4b', shading: 'lambert', outline: { width: 2, color: '#a78bfa' } },
      floor: { color: '#120f22', shading: 'flat' },
    },
    objects: [
      { id: 'eye', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 50, position: [0, 2.4, 8], lookAt: [0, 1, 0] },
      { id: 'key', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.8, position: [3, 5, 4] },
      { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [20, 20], segments: 10 }, material: 'floor' },
      { id: 'planet', kind: 'mesh', geometry: { type: 'sphere', radius: 0.9, segments: 32 }, material: 'planet', position: [0, 1.2, 0] },
      { id: 'orbitA', kind: 'group', position: [0, 1.2, 0], rotation: [0, 0, 25] },
      { id: 'a', kind: 'group', parent: 'orbitA', position: [2.2, 0, 0] },
      { id: 'orbitB', kind: 'group', position: [0, 1.2, 0], rotation: [0, 0, -40] },
      { id: 'b', kind: 'group', parent: 'orbitB', position: [0, 0, 1.8] },
      { id: 'tailA', kind: 'trail', follow: 'a', length: 1600, samples: 64, width: 0.12, color: '#00e5ff', blend: 'add', period: LAP },
      { id: 'tailB', kind: 'trail', follow: 'b', length: 1200, samples: 64, width: 0.1, color: '#ff2bd6', blend: 'add', period: LAP },
      // A `line` is a polyline in the scene: here a glowing ring on the floor.
      {
        id: 'ring',
        kind: 'line',
        points: Array.from({ length: 65 }, (_, i) => [3.2 * Math.cos((i / 64) * Math.PI * 2), 0.02, 3.2 * Math.sin((i / 64) * Math.PI * 2)]),
        width: 0.04,
        color: '#b6ff3b',
      },
    ],
  })

  const timeline = new tinyfly.Timeline({
    id: 'comets',
    tracks: [
      { id: 'a', target: 'sky/orbitA', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: LAP, value: 720 }] },
      { id: 'b', target: 'sky/orbitB', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: LAP, value: -1080 }] },
    ],
  })

  const clock = { time: 0 }
  live.to(clock, { time: LAP, duration: LAP / 1000, ease: 'none', repeat: -1 })

  const draw = () => {
    readout.textContent = `lap ${Math.round((clock.time / LAP) * 100)}%`
    if (!ctx) return
    // A trail asks the timeline where its comet was: `valuesAt` answers for any time.
    tinyfly.drawScene3D(ctx, scene, timeline.getStateAtTime(clock.time).values, {
      width: canvas.width,
      height: canvas.height,
      time: clock.time,
      valuesAt: (time) => timeline.getStateAtTime(time).values,
    })
    // The glow: bright pass, blur, add back.
    tinyfly.applyBloom(ctx, { threshold: 0.5 })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const cometTrails3d = {
  id: 'live-comet-trails-3d',
  name: '3D Scene: Comet Trails',
  description:
    'Trails and lines inside a 3D scene: two comets ride tilted spinning groups and a trail object follows each, a band through where it was over the last 1.6 s, tapering and fading, added as light. Every segment sorts by depth among the planet’s triangles, so a tail passes behind the planet and back in front; fog dims the far side, and bloom makes them glow. A glowing ring on the floor is a line object. All plain scene JSON and keyframes.',
  category: '3d',
  tags: ['3d', 'trail', 'line', 'comet', 'depth', 'scene'],
  addons: ['scene-3d'],
  html,
  run,
}
