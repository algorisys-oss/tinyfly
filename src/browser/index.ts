/**
 * The all-in-one browser bundle: `<script src=".../tinyfly.iife.js">` exposes a
 * single `tinyfly` global.
 *
 *     tinyfly.to('.box', { x: 200, duration: 1 })
 *     tinyfly.timeline({ repeat: -1, yoyo: true })
 *       .to('.a', { y: -40, duration: 0.4 })
 *       .to('.b', { rotate: 90, duration: 0.4 }, '<')
 *
 * The top-level `to` / `from` / `fromTo` / `set` / `timeline` are the live
 * facade (they play on real elements). The engine, the player, the compiling
 * `tf` facade, drivers and interaction are all available on the same global.
 *
 * Bundler users should import the individual entry points instead
 * (`tinyfly`, `tinyfly/player`, `tinyfly/gsap-compat`, …) so unused parts
 * tree-shake away; this file exists for pages with no build step.
 */

import { live } from '../compat/gsap/live'

export const to = live.to
export const from = live.from
export const fromTo = live.fromTo
export const set = live.set
export const timeline = live.timeline

export * from '../engine'
export * from '../player'
export * from '../drivers'
export * from '../interaction'
export {
  tf,
  live,
  createLive,
  Stage,
  LiveTimeline,
  CompatTimeline,
  quickPlay,
  mapEase,
} from '../compat/gsap'
