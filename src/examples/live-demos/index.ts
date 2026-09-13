import type { LiveDemo } from './types'
import { staggerGrid } from './stagger-grid'
import { labelSequence } from './label-sequence'
import { composedMotion } from './composed-motion'
import { timelineControls } from './timeline-controls'
import { pointerFollow } from './pointer-follow'
import { bakedEases } from './baked-eases'
import { magneticButton } from './magnetic-button'
import { proximityGrid } from './proximity-grid'
import { dockMagnify } from './dock-magnify'
import { velocitySkew } from './velocity-skew'
import { cardStack } from './card-stack'
import { infiniteMarquee } from './infinite-marquee'
import { splitTextReveal } from './split-text-reveal'
import { svgLineDraw } from './svg-line-draw'
import { canvasObjectTween } from './canvas-object-tween'
import { lineMaskReveal } from './line-mask-reveal'
import { pinnedHorizontal } from './pinned-horizontal'
import { imageSequenceScrub } from './image-sequence-scrub'
import { springRelease } from './spring-release'
import { sharedElementGallery } from './shared-element-gallery'
import { pageTransitionDemo } from './page-transition'
import { customEasesDemo } from './custom-eases'
import { motionPathAlign } from './motion-path-align'
import { motionPathPoints } from './motion-path-points'
import { shapeMorph } from './shape-morph'
import { iconMorph } from './icon-morph'
import { scrambleText } from './scramble-text'
import { typewriterText } from './typewriter-text'
import { throwToSlots } from './throw-to-slots'
import { inertiaCarousel } from './inertia-carousel'
import { frictionThrows } from './friction-throws'
import { menuMorph } from './menu-morph'
import { drawAndFollow } from './draw-and-follow'
import { orbits } from './orbits'
import { swipeCards } from './swipe-cards'
import { cardFlip3d } from './card-flip-3d'
import { statsDecode } from './stats-decode'
import { flipShuffle } from './flip-shuffle'
import { flipFilter } from './flip-filter'
import { flipLayout } from './flip-layout'
import { flipExpand } from './flip-expand'
import staggerGridSource from './stagger-grid.js?raw'
import labelSequenceSource from './label-sequence.js?raw'
import composedMotionSource from './composed-motion.js?raw'
import timelineControlsSource from './timeline-controls.js?raw'
import pointerFollowSource from './pointer-follow.js?raw'
import bakedEasesSource from './baked-eases.js?raw'
import magneticButtonSource from './magnetic-button.js?raw'
import proximityGridSource from './proximity-grid.js?raw'
import dockMagnifySource from './dock-magnify.js?raw'
import velocitySkewSource from './velocity-skew.js?raw'
import cardStackSource from './card-stack.js?raw'
import infiniteMarqueeSource from './infinite-marquee.js?raw'
import splitTextRevealSource from './split-text-reveal.js?raw'
import svgLineDrawSource from './svg-line-draw.js?raw'
import canvasObjectTweenSource from './canvas-object-tween.js?raw'
import lineMaskRevealSource from './line-mask-reveal.js?raw'
import pinnedHorizontalSource from './pinned-horizontal.js?raw'
import imageSequenceScrubSource from './image-sequence-scrub.js?raw'
import springReleaseSource from './spring-release.js?raw'
import sharedElementGallerySource from './shared-element-gallery.js?raw'
import pageTransitionSource from './page-transition.js?raw'
import customEasesSource from './custom-eases.js?raw'
import motionPathAlignSource from './motion-path-align.js?raw'
import motionPathPointsSource from './motion-path-points.js?raw'
import shapeMorphSource from './shape-morph.js?raw'
import iconMorphSource from './icon-morph.js?raw'
import scrambleTextSource from './scramble-text.js?raw'
import typewriterTextSource from './typewriter-text.js?raw'
import throwToSlotsSource from './throw-to-slots.js?raw'
import inertiaCarouselSource from './inertia-carousel.js?raw'
import frictionThrowsSource from './friction-throws.js?raw'
import menuMorphSource from './menu-morph.js?raw'
import drawAndFollowSource from './draw-and-follow.js?raw'
import orbitsSource from './orbits.js?raw'
import swipeCardsSource from './swipe-cards.js?raw'
import cardFlip3dSource from './card-flip-3d.js?raw'
import statsDecodeSource from './stats-decode.js?raw'
import flipShuffleSource from './flip-shuffle.js?raw'
import flipFilterSource from './flip-filter.js?raw'
import flipLayoutSource from './flip-layout.js?raw'
import flipExpandSource from './flip-expand.js?raw'

export type { LiveDemo } from './types'

export interface LiveDemoWithCode extends LiveDemo {
  /** The demo's `live` code, read from its own source file */
  code: string
}

/**
 * The code between `// #region code` and `// #endregion code`, dedented.
 * Demos are plain JavaScript so this code runs unchanged when copied into a page.
 * Throws if a demo lacks the markers, so a broken demo fails its test rather
 * than showing an empty code panel.
 */
export function extractCode(source: string): string {
  const match = source.match(/\/\/ #region code\n([\s\S]*?)\n\s*\/\/ #endregion code/)
  if (!match) throw new Error('live demo source is missing its "// #region code" markers')

  const lines = match[1].split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length))
  return lines.map((l) => l.slice(indent)).join('\n')
}

const withCode = (demo: LiveDemo, source: string): LiveDemoWithCode => ({ ...demo, code: extractCode(source) })

export const liveDemos: LiveDemoWithCode[] = [
  withCode(flipShuffle, flipShuffleSource),
  withCode(flipFilter, flipFilterSource),
  withCode(flipLayout, flipLayoutSource),
  withCode(flipExpand, flipExpandSource),
  withCode(sharedElementGallery, sharedElementGallerySource),
  withCode(pageTransitionDemo, pageTransitionSource),
  withCode(motionPathAlign, motionPathAlignSource),
  withCode(motionPathPoints, motionPathPointsSource),
  withCode(shapeMorph, shapeMorphSource),
  withCode(iconMorph, iconMorphSource),
  withCode(scrambleText, scrambleTextSource),
  withCode(typewriterText, typewriterTextSource),
  withCode(springRelease, springReleaseSource),
  withCode(throwToSlots, throwToSlotsSource),
  withCode(inertiaCarousel, inertiaCarouselSource),
  withCode(frictionThrows, frictionThrowsSource),
  withCode(menuMorph, menuMorphSource),
  withCode(drawAndFollow, drawAndFollowSource),
  withCode(orbits, orbitsSource),
  withCode(swipeCards, swipeCardsSource),
  withCode(cardFlip3d, cardFlip3dSource),
  withCode(statsDecode, statsDecodeSource),
  withCode(staggerGrid, staggerGridSource),
  withCode(labelSequence, labelSequenceSource),
  withCode(composedMotion, composedMotionSource),
  withCode(timelineControls, timelineControlsSource),
  withCode(pointerFollow, pointerFollowSource),
  withCode(bakedEases, bakedEasesSource),
  withCode(customEasesDemo, customEasesSource),
  withCode(magneticButton, magneticButtonSource),
  withCode(proximityGrid, proximityGridSource),
  withCode(dockMagnify, dockMagnifySource),
  withCode(velocitySkew, velocitySkewSource),
  withCode(cardStack, cardStackSource),
  withCode(infiniteMarquee, infiniteMarqueeSource),
  withCode(pinnedHorizontal, pinnedHorizontalSource),
  withCode(imageSequenceScrub, imageSequenceScrubSource),
  withCode(lineMaskReveal, lineMaskRevealSource),
  withCode(splitTextReveal, splitTextRevealSource),
  withCode(svgLineDraw, svgLineDrawSource),
  withCode(canvasObjectTween, canvasObjectTweenSource),
]
