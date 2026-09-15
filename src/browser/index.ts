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
 * Teaching embeds are included too: step controls (`createControls`), declarative
 * mounting (`mountAll`, or automatically when the script tag has
 * `data-tinyfly-auto`). The build-time `validateEmbed` / `renderFrame` stay in
 * `@algorisys/tinyfly/embed` and the CLI. For a page that only shows teaching
 * figures, `tinyfly-embed.iife.js` is the smaller choice.
 *
 * Bundler users should import the individual entry points instead
 * (`tinyfly`, `tinyfly/player`, `tinyfly/gsap-compat`, …) so unused parts
 * tree-shake away; this file exists for pages with no build step.
 */

import { live } from '../compat/gsap/live'
import { autoMountFromCurrentScript } from '../embed/auto-mount'

export const to = live.to
export const from = live.from
export const fromTo = live.fromTo
export const set = live.set
export const timeline = live.timeline
/** Per-frame callbacks, run after animations are applied (GSAP's `gsap.ticker`). */
export const ticker = live.ticker
/** Split text into char, word and line spans (GSAP's SplitText). */
export const splitText = live.splitText
/** Collect animations so they can be reverted together (GSAP's `gsap.context`). */
export const context = live.context
/** Setups that apply while media queries match (GSAP's `gsap.matchMedia`). */
export const matchMedia = live.matchMedia
/** A reusable setter that animates one property toward each value (GSAP's `gsap.quickTo`). */
export const quickTo = live.quickTo
/** A canvas scrubbing through an image sequence (tween its `frame`). */
export const imageSequence = live.imageSequence
/** Animate a client-side page change (old view out, update, shared elements across, new view in). */
export const pageTransition = live.pageTransition

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
  CustomEase,
  CustomBounce,
  CustomWiggle,
} from '../compat/gsap'
export { createControls, DEFAULT_LABELS } from '../embed/controls'
export type { Controls, ControlsOptions, ControlLabels, FullscreenControl } from '../embed/controls'
export { mount, mountAll, unmount } from '../embed/mount'
export { bindChoiceHotspots } from '../embed/choices'
export type { MountedEmbed, MountOptions } from '../embed/mount'

// Teaching figures mount themselves when the script tag has data-tinyfly-auto.
autoMountFromCurrentScript()
