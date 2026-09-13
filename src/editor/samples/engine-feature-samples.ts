import type { SampleDefinition } from './sample-definitions'
import { polyStarPath } from '../utils/poly-star'

/**
 * Samples that show off the engine features added for the GSAP demos — text
 * tracks, inertia tracks and multi-shape morphs — in a form the editor can
 * open and edit. Each is ordinary sample data: elements plus tracks.
 */

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

/** A circle drawn as a path in a `size` box, so it can morph like any other shape. */
function circlePath(size: number): string {
  const r = size / 2
  return `M${size} ${r} A${r} ${r} 0 1 1 0 ${r} A${r} ${r} 0 1 1 ${size} ${r} Z`
}

const decodeHeadline: SampleDefinition = {
  id: 'decode-headline',
  name: 'Decode Headline',
  description: 'A headline scrambles into place, an underline draws in, and a subtitle types on — text tracks',
  category: 'text',
  thumbnail: '🔐',
  duration: 3200,
  elements: [
    { type: 'text', name: 'Headline', x: 30, y: 58, width: 240, height: 40, text: 'LOADING', fontSize: 32, fontWeight: 800, fontFamily: MONO, fill: '#ffffff', textAlign: 'center' },
    { type: 'rect', name: 'Underline', x: 70, y: 102, width: 160, height: 3, fill: '#4a9eff', borderRadius: 2 },
    { type: 'text', name: 'Subtitle', x: 30, y: 116, width: 240, height: 24, text: '', fontSize: 14, fontFamily: MONO, fill: '#9bb4c7', textAlign: 'center' },
  ],
  tracks: [
    {
      target: 'Headline',
      property: 'text',
      textConfig: { from: 'LOADING', to: 'TINYFLY', mode: 'scramble', chars: 'upperCase', revealDelay: 0.3, seed: 7 },
      keyframes: [{ time: 0, value: 0 }, { time: 1400, value: 1, easing: 'ease-out' }],
    },
    { target: 'Underline', property: 'originX', keyframes: [{ time: 0, value: 0 }] },
    { target: 'Underline', property: 'scaleX', keyframes: [{ time: 1000, value: 0 }, { time: 1700, value: 1, easing: 'ease-out-cubic' }] },
    {
      target: 'Subtitle',
      property: 'text',
      textConfig: { from: '', to: 'animation engine', mode: 'type' },
      keyframes: [{ time: 1600, value: 0 }, { time: 2600, value: 1, easing: 'linear' }],
    },
  ],
}

const countdown: SampleDefinition = {
  id: 'scramble-countdown',
  name: 'Scramble Countdown',
  description: '3, 2, 1, GO — each number scrambles into the next with a pulse',
  category: 'text',
  thumbnail: '⏱️',
  duration: 3400,
  elements: [
    { type: 'text', name: 'Count', x: 75, y: 55, width: 150, height: 80, text: '3', fontSize: 64, fontWeight: 800, fontFamily: MONO, fill: '#ffffff', textAlign: 'center' },
  ],
  tracks: [
    { target: 'Count', property: 'text', textConfig: { from: '3', to: '2', mode: 'scramble', chars: 'numbers', seed: 3 }, keyframes: [{ time: 700, value: 0 }, { time: 1000, value: 1 }] },
    { target: 'Count', property: 'text', textConfig: { from: '2', to: '1', mode: 'scramble', chars: 'numbers', seed: 2 }, keyframes: [{ time: 1500, value: 0 }, { time: 1800, value: 1 }] },
    { target: 'Count', property: 'text', textConfig: { from: '1', to: 'GO!', mode: 'scramble', chars: 'upperCase', seed: 1 }, keyframes: [{ time: 2300, value: 0 }, { time: 2700, value: 1 }] },
    {
      target: 'Count',
      property: 'scale',
      keyframes: [
        { time: 0, value: 1 },
        { time: 1000, value: 1.25, easing: 'ease-out' }, { time: 1300, value: 1, easing: 'ease-in-out' },
        { time: 1800, value: 1.25, easing: 'ease-out' }, { time: 2100, value: 1, easing: 'ease-in-out' },
        { time: 2700, value: 1.5, easing: 'ease-out' }, { time: 3100, value: 1.2, easing: 'ease-in-out' },
      ],
    },
    { target: 'Count', property: 'fill', keyframes: [{ time: 2300, value: '#ffffff' }, { time: 2700, value: '#3ecf7a', easing: 'ease-out' }] },
  ],
}

const throwAndSettle: SampleDefinition = {
  id: 'throw-and-settle',
  name: 'Throw & Settle',
  description: 'Three balls thrown at the same speed under different friction, snapping to a grid — inertia tracks',
  category: 'motion',
  thumbnail: '🥏',
  duration: 3000,
  elements: [
    { type: 'line', name: 'Grid 1', x: 35, y: 30, x2: 35, y2: 170, stroke: '#444444', strokeWidth: 1 },
    { type: 'line', name: 'Grid 2', x: 155, y: 30, x2: 155, y2: 170, stroke: '#444444', strokeWidth: 1 },
    { type: 'line', name: 'Grid 3', x: 275, y: 30, x2: 275, y2: 170, stroke: '#444444', strokeWidth: 1 },
    { type: 'circle', name: 'Loose', x: 20, y: 40, width: 30, height: 30, fill: '#4a9eff' },
    { type: 'circle', name: 'Normal', x: 20, y: 85, width: 30, height: 30, fill: '#9b59b6' },
    { type: 'circle', name: 'Tight', x: 20, y: 130, width: 30, height: 30, fill: '#ec4899' },
  ],
  tracks: [
    // Same release speed; friction decides how far each travels before snapping to the 120px grid.
    { target: 'Loose', property: 'x', kind: 'inertia', inertia: { from: 0, velocity: 900, friction: 2, end: 120, max: 240 } },
    { target: 'Normal', property: 'x', kind: 'inertia', inertia: { from: 0, velocity: 900, friction: 4, end: 120 }, delay: 200 },
    { target: 'Tight', property: 'x', kind: 'inertia', inertia: { from: 0, velocity: 900, friction: 8, end: 120 }, delay: 400 },
  ],
}

const BADGE = 110

const badgeMorph: SampleDefinition = {
  id: 'badge-morph',
  name: 'Badge Morph',
  description: 'A badge morphs from circle to star to hexagon and back, spinning as it goes — corners stay sharp',
  category: 'effects',
  thumbnail: '⭐',
  duration: 4000,
  elements: [
    { type: 'path', name: 'Badge', x: 95, y: 45, width: BADGE, height: BADGE, d: circlePath(BADGE), fill: '#f59e0b', stroke: 'transparent', strokeWidth: 0, closed: true },
  ],
  tracks: [
    {
      target: 'Badge',
      property: 'd',
      keyframes: [
        { time: 0, value: circlePath(BADGE) },
        { time: 400, value: circlePath(BADGE) },
        { time: 1200, value: polyStarPath({ kind: 'star', points: 5, innerRatio: 0.45 }, BADGE, BADGE), easing: 'ease-in-out' },
        { time: 1800, value: polyStarPath({ kind: 'star', points: 5, innerRatio: 0.45 }, BADGE, BADGE) },
        { time: 2600, value: polyStarPath({ kind: 'polygon', points: 6, innerRatio: 0.5 }, BADGE, BADGE), easing: 'ease-in-out' },
        { time: 3200, value: polyStarPath({ kind: 'polygon', points: 6, innerRatio: 0.5 }, BADGE, BADGE) },
        { time: 4000, value: circlePath(BADGE), easing: 'ease-in-out' },
      ],
    },
    {
      target: 'Badge',
      property: 'rotate',
      keyframes: [{ time: 0, value: 0 }, { time: 4000, value: 360, easing: 'ease-in-out' }],
    },
  ],
}

const statsDecode: SampleDefinition = {
  id: 'stats-decode-sample',
  name: 'Stats Decode',
  description: 'Dashboard numbers decode digit by digit while their bars grow — text tracks with numbers',
  category: 'showcase',
  thumbnail: '📊',
  duration: 2600,
  elements: [
    { type: 'text', name: 'Users label', x: 30, y: 40, width: 90, height: 20, text: 'Users', fontSize: 12, fill: '#888888', textAlign: 'left' },
    { type: 'text', name: 'Users', x: 150, y: 36, width: 120, height: 24, text: '------', fontSize: 18, fontWeight: 700, fontFamily: MONO, fill: '#ffffff', textAlign: 'right' },
    { type: 'rect', name: 'Users bar', x: 30, y: 64, width: 240, height: 6, fill: '#4a9eff', borderRadius: 3 },
    { type: 'text', name: 'Revenue label', x: 30, y: 90, width: 90, height: 20, text: 'Revenue', fontSize: 12, fill: '#888888', textAlign: 'left' },
    { type: 'text', name: 'Revenue', x: 150, y: 86, width: 120, height: 24, text: '------', fontSize: 18, fontWeight: 700, fontFamily: MONO, fill: '#ffffff', textAlign: 'right' },
    { type: 'rect', name: 'Revenue bar', x: 30, y: 114, width: 240, height: 6, fill: '#3ecf7a', borderRadius: 3 },
    { type: 'text', name: 'Uptime label', x: 30, y: 140, width: 90, height: 20, text: 'Uptime', fontSize: 12, fill: '#888888', textAlign: 'left' },
    { type: 'text', name: 'Uptime', x: 150, y: 136, width: 120, height: 24, text: '------', fontSize: 18, fontWeight: 700, fontFamily: MONO, fill: '#ffffff', textAlign: 'right' },
    { type: 'rect', name: 'Uptime bar', x: 30, y: 164, width: 240, height: 6, fill: '#f59e0b', borderRadius: 3 },
  ],
  tracks: [
    ...([
      ['Users', '48,210', 0.86, 0],
      ['Revenue', '$9,742', 0.64, 300],
      ['Uptime', '99.98%', 0.97, 600],
    ] as const).flatMap(([name, value, share, at]) => [
      {
        target: name,
        property: 'text' as const,
        textConfig: { from: '------', to: value, mode: 'scramble' as const, chars: 'numbers', revealDelay: 0.4, seed: at + 11 },
        keyframes: [{ time: at, value: 0 }, { time: at + 1300, value: 1 }],
      },
      { target: `${name} bar`, property: 'originX', keyframes: [{ time: 0, value: 0 }] },
      { target: `${name} bar`, property: 'scaleX', keyframes: [{ time: at, value: 0 }, { time: at + 1300, value: share, easing: 'ease-out-cubic' as const }] },
    ]),
  ],
}

export const engineFeatureSamples: SampleDefinition[] = [decodeHeadline, countdown, throwAndSettle, badgeMorph, statsDecode]
