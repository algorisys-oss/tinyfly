import type { Keyframe, EasingType, SpringConfig } from '../../engine/types'

export interface AnimationPreset {
  id: string
  name: string
  description: string
  category: 'entrance' | 'emphasis' | 'exit' | 'motion' | 'text' | 'spring'
  /** Duration in milliseconds */
  duration: number
  /** Tracks to create, relative to element position */
  tracks: PresetTrack[]
  /**
   * Suggested delay (ms) between successive targets when this preset is applied
   * across a split (per-letter) text element. Purely a UI default — the stagger
   * itself is data, produced by offsetting each target's keyframe times.
   */
  recommendedStagger?: number
}

/**
 * A preset track is either keyframed or a spring.
 *
 * The two are genuinely different shapes: a keyframed track is sampled against
 * the preset's `duration`, while a spring decides its own duration from its
 * parameters. Widening this union is what lets the Presets panel offer
 * one-click spring effects alongside the keyframe ones.
 */
export type PresetTrack = KeyframePresetTrack | SpringPresetTrack

export interface KeyframePresetTrack {
  property: string
  keyframes: PresetKeyframe[]
}

export interface SpringPresetTrack {
  property: string
  /**
   * Spring parameters. The preset's `duration` does not apply — a spring runs
   * until it settles, and the scene extends to fit it.
   */
  spring: SpringConfig
  /** Milliseconds before the spring starts */
  delay?: number
}

/** Narrow a preset track to the spring kind. */
export function isSpringPresetTrack(track: PresetTrack): track is SpringPresetTrack {
  return 'spring' in track
}

export interface PresetKeyframe {
  /** Time as percentage of duration (0-1) */
  timePercent: number
  /** Value - can be absolute or relative (prefixed with + or -) */
  value: number | string
  easing?: EasingType
}

/**
 * Convert a preset keyframe to an actual keyframe with proper timing.
 */
export function resolvePresetKeyframe(
  presetKf: PresetKeyframe,
  duration: number,
  baseValue?: number | string
): Keyframe {
  const time = Math.round(presetKf.timePercent * duration)
  let value = presetKf.value

  // Handle relative values (e.g., "+100" or "-50"). Non-numeric strings such as
  // colours (e.g. "#66d9ff") are passed through unchanged.
  if (typeof value === 'string' && typeof baseValue === 'number') {
    if (value.startsWith('+')) {
      value = baseValue + parseFloat(value.slice(1))
    } else if (value.startsWith('-')) {
      value = baseValue - parseFloat(value.slice(1))
    } else {
      const numeric = Number(value)
      value = Number.isNaN(numeric) ? value : numeric
    }
  }

  return {
    time,
    value,
    ...(presetKf.easing && { easing: presetKf.easing }),
  }
}

// ============================================
// ENTRANCE ANIMATIONS
// ============================================

export const fadeIn: AnimationPreset = {
  id: 'fade-in',
  name: 'Fade In',
  description: 'Fade element from transparent to opaque',
  category: 'entrance',
  duration: 500,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const fadeInUp: AnimationPreset = {
  id: 'fade-in-up',
  name: 'Fade In Up',
  description: 'Fade in while sliding up',
  category: 'entrance',
  duration: 600,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 1, easing: 'ease-out' },
      ],
    },
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: '+30' },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
  ],
}

export const fadeInDown: AnimationPreset = {
  id: 'fade-in-down',
  name: 'Fade In Down',
  description: 'Fade in while sliding down',
  category: 'entrance',
  duration: 600,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 1, easing: 'ease-out' },
      ],
    },
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: '-30' },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
  ],
}

export const slideInLeft: AnimationPreset = {
  id: 'slide-in-left',
  name: 'Slide In Left',
  description: 'Slide in from the left',
  category: 'entrance',
  duration: 500,
  tracks: [
    {
      property: 'x',
      keyframes: [
        { timePercent: 0, value: '-100' },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
  ],
}

export const slideInRight: AnimationPreset = {
  id: 'slide-in-right',
  name: 'Slide In Right',
  description: 'Slide in from the right',
  category: 'entrance',
  duration: 500,
  tracks: [
    {
      property: 'x',
      keyframes: [
        { timePercent: 0, value: '+100' },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
  ],
}

export const scaleIn: AnimationPreset = {
  id: 'scale-in',
  name: 'Scale In',
  description: 'Scale up from zero',
  category: 'entrance',
  duration: 400,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 1, easing: 'ease-out-cubic' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.5, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

// ============================================
// EMPHASIS ANIMATIONS
// ============================================

export const pulse: AnimationPreset = {
  id: 'pulse',
  name: 'Pulse',
  description: 'Pulsing scale effect',
  category: 'emphasis',
  duration: 1000,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.5, value: 1.1, easing: 'ease-in-out' },
        { timePercent: 1, value: 1, easing: 'ease-in-out' },
      ],
    },
  ],
}

export const bounce: AnimationPreset = {
  id: 'bounce',
  name: 'Bounce',
  description: 'Bouncing up and down',
  category: 'emphasis',
  duration: 800,
  tracks: [
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.3, value: '-20', easing: 'ease-out' },
        { timePercent: 0.5, value: 0, easing: 'ease-in' },
        { timePercent: 0.7, value: '-10', easing: 'ease-out' },
        { timePercent: 1, value: 0, easing: 'ease-in' },
      ],
    },
  ],
}

export const shake: AnimationPreset = {
  id: 'shake',
  name: 'Shake',
  description: 'Horizontal shaking effect',
  category: 'emphasis',
  duration: 500,
  tracks: [
    {
      property: 'x',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.1, value: '-10' },
        { timePercent: 0.2, value: '+10' },
        { timePercent: 0.3, value: '-10' },
        { timePercent: 0.4, value: '+10' },
        { timePercent: 0.5, value: '-10' },
        { timePercent: 0.6, value: '+10' },
        { timePercent: 0.7, value: '-5' },
        { timePercent: 0.8, value: '+5' },
        { timePercent: 1, value: 0 },
      ],
    },
  ],
}

export const spin: AnimationPreset = {
  id: 'spin',
  name: 'Spin',
  description: 'Full 360 degree rotation',
  category: 'emphasis',
  duration: 1000,
  tracks: [
    {
      property: 'rotate',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 360, easing: 'ease-in-out' },
      ],
    },
  ],
}

export const flash: AnimationPreset = {
  id: 'flash',
  name: 'Flash',
  description: 'Flashing opacity effect',
  category: 'emphasis',
  duration: 800,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.25, value: 0 },
        { timePercent: 0.5, value: 1 },
        { timePercent: 0.75, value: 0 },
        { timePercent: 1, value: 1 },
      ],
    },
  ],
}

// ============================================
// EXIT ANIMATIONS
// ============================================

export const fadeOut: AnimationPreset = {
  id: 'fade-out',
  name: 'Fade Out',
  description: 'Fade element from opaque to transparent',
  category: 'exit',
  duration: 500,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 1, value: 0, easing: 'ease-in' },
      ],
    },
  ],
}

export const fadeOutDown: AnimationPreset = {
  id: 'fade-out-down',
  name: 'Fade Out Down',
  description: 'Fade out while sliding down',
  category: 'exit',
  duration: 600,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 1, value: 0, easing: 'ease-in' },
      ],
    },
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: '+30', easing: 'ease-in' },
      ],
    },
  ],
}

export const scaleOut: AnimationPreset = {
  id: 'scale-out',
  name: 'Scale Out',
  description: 'Scale down to zero',
  category: 'exit',
  duration: 400,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 1, value: 0, easing: 'ease-in' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0.5, value: 1 },
        { timePercent: 1, value: 0, easing: 'ease-in' },
      ],
    },
  ],
}

// ============================================
// MOTION ANIMATIONS
// ============================================

export const float: AnimationPreset = {
  id: 'float',
  name: 'Float',
  description: 'Gentle floating motion',
  category: 'motion',
  duration: 2000,
  tracks: [
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.5, value: '-15', easing: 'ease-in-out' },
        { timePercent: 1, value: 0, easing: 'ease-in-out' },
      ],
    },
  ],
}

export const swing: AnimationPreset = {
  id: 'swing',
  name: 'Swing',
  description: 'Pendulum-like rotation',
  category: 'motion',
  duration: 1500,
  tracks: [
    {
      property: 'rotate',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.2, value: 15, easing: 'ease-in-out' },
        { timePercent: 0.4, value: -10, easing: 'ease-in-out' },
        { timePercent: 0.6, value: 5, easing: 'ease-in-out' },
        { timePercent: 0.8, value: -5, easing: 'ease-in-out' },
        { timePercent: 1, value: 0, easing: 'ease-in-out' },
      ],
    },
  ],
}

export const breathe: AnimationPreset = {
  id: 'breathe',
  name: 'Breathe',
  description: 'Gentle breathing/pulsing effect',
  category: 'motion',
  duration: 3000,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.5, value: 1.05, easing: 'ease-in-out' },
        { timePercent: 1, value: 1, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.5, value: 0.8, easing: 'ease-in-out' },
        { timePercent: 1, value: 1, easing: 'ease-in-out' },
      ],
    },
  ],
}

// ============================================
// TEXT ANIMATIONS
// ============================================

export const textColorCycle: AnimationPreset = {
  id: 'text-color-cycle',
  name: 'Color Cycle',
  description: 'Cycle through rainbow colors',
  category: 'text',
  duration: 3000,
  tracks: [
    {
      property: 'fill',
      keyframes: [
        { timePercent: 0, value: '#e74c3c' },
        { timePercent: 0.17, value: '#f39c12' },
        { timePercent: 0.33, value: '#2ecc71' },
        { timePercent: 0.5, value: '#3498db' },
        { timePercent: 0.67, value: '#9b59b6' },
        { timePercent: 0.83, value: '#e91e63' },
        { timePercent: 1, value: '#e74c3c' },
      ],
    },
  ],
}

export const textGlow: AnimationPreset = {
  id: 'text-glow',
  name: 'Glow Pulse',
  description: 'Pulsing neon glow with a gentle scale',
  category: 'text',
  duration: 2000,
  tracks: [
    {
      property: 'glowColor',
      keyframes: [{ timePercent: 0, value: '#66d9ff' }],
    },
    {
      property: 'glow',
      keyframes: [
        { timePercent: 0, value: 2 },
        { timePercent: 0.5, value: 18, easing: 'ease-in-out' },
        { timePercent: 1, value: 2, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.5, value: 1.05, easing: 'ease-in-out' },
        { timePercent: 1, value: 1, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0.85 },
        { timePercent: 0.5, value: 1, easing: 'ease-in-out' },
        { timePercent: 1, value: 0.85, easing: 'ease-in-out' },
      ],
    },
  ],
}

export const textBounceIn: AnimationPreset = {
  id: 'text-bounce-in',
  name: 'Bounce In',
  description: 'Bouncy entrance animation',
  category: 'text',
  duration: 1200,
  tracks: [
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: '-50' },
        { timePercent: 0.4, value: 0, easing: 'ease-in' },
        { timePercent: 0.55, value: '-15', easing: 'ease-out' },
        { timePercent: 0.7, value: 0, easing: 'ease-in' },
        { timePercent: 0.8, value: '-5', easing: 'ease-out' },
        { timePercent: 1, value: 0, easing: 'ease-in' },
      ],
    },
    {
      property: 'scaleY',
      keyframes: [
        { timePercent: 0.35, value: 1 },
        { timePercent: 0.4, value: 0.85, easing: 'ease-out' },
        { timePercent: 0.5, value: 1, easing: 'ease-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.2, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const textSlideUp: AnimationPreset = {
  id: 'text-slide-up',
  name: 'Slide Up',
  description: 'Slide up while fading in',
  category: 'text',
  duration: 800,
  tracks: [
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: '+30' },
        { timePercent: 1, value: 0, easing: 'ease-out-cubic' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.6, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const textRotateIn: AnimationPreset = {
  id: 'text-rotate-in',
  name: 'Rotate In',
  description: 'Rotate while appearing',
  category: 'text',
  duration: 1000,
  tracks: [
    {
      property: 'rotate',
      keyframes: [
        { timePercent: 0, value: -180 },
        { timePercent: 0.7, value: 10, easing: 'ease-out' },
        { timePercent: 1, value: 0, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.7, value: 1, easing: 'ease-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.4, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const textZoomIn: AnimationPreset = {
  id: 'text-zoom-in',
  name: 'Zoom In',
  description: 'Zoom from large to normal',
  category: 'text',
  duration: 800,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 2.5 },
        { timePercent: 1, value: 1, easing: 'ease-out-cubic' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.5, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const textWobble: AnimationPreset = {
  id: 'text-wobble',
  name: 'Wobble',
  description: 'Playful wobbling effect',
  category: 'text',
  duration: 1000,
  tracks: [
    {
      property: 'rotate',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.15, value: -5 },
        { timePercent: 0.3, value: 3 },
        { timePercent: 0.45, value: -3 },
        { timePercent: 0.6, value: 2 },
        { timePercent: 0.75, value: -1 },
        { timePercent: 1, value: 0 },
      ],
    },
    {
      property: 'x',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.15, value: '-5' },
        { timePercent: 0.3, value: '+4' },
        { timePercent: 0.45, value: '-3' },
        { timePercent: 0.6, value: '+2' },
        { timePercent: 0.75, value: '-1' },
        { timePercent: 1, value: 0 },
      ],
    },
  ],
}

export const textHeartbeat: AnimationPreset = {
  id: 'text-heartbeat',
  name: 'Heartbeat',
  description: 'Double-pulse like a heartbeat',
  category: 'text',
  duration: 1200,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.14, value: 1.15, easing: 'ease-out' },
        { timePercent: 0.28, value: 1, easing: 'ease-in' },
        { timePercent: 0.42, value: 1.15, easing: 'ease-out' },
        { timePercent: 0.7, value: 1, easing: 'ease-in' },
        { timePercent: 1, value: 1 },
      ],
    },
  ],
}

export const textCircularOrbit: AnimationPreset = {
  id: 'text-circular-orbit',
  name: 'Circular Orbit',
  description: 'Move in a circular path',
  category: 'text',
  duration: 2000,
  tracks: [
    {
      property: 'x',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.25, value: '+20', easing: 'ease-in-out' },
        { timePercent: 0.5, value: 0, easing: 'ease-in-out' },
        { timePercent: 0.75, value: '-20', easing: 'ease-in-out' },
        { timePercent: 1, value: 0, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: '-20' },
        { timePercent: 0.25, value: 0, easing: 'ease-in-out' },
        { timePercent: 0.5, value: '+20', easing: 'ease-in-out' },
        { timePercent: 0.75, value: 0, easing: 'ease-in-out' },
        { timePercent: 1, value: '-20', easing: 'ease-in-out' },
      ],
    },
  ],
}

export const textJello: AnimationPreset = {
  id: 'text-jello',
  name: 'Jello',
  description: 'Wobbly jello-like effect',
  category: 'text',
  duration: 1000,
  tracks: [
    {
      property: 'skewX',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.11, value: -12.5 },
        { timePercent: 0.22, value: 6.25 },
        { timePercent: 0.33, value: -3.125 },
        { timePercent: 0.44, value: 1.5625 },
        { timePercent: 0.55, value: -0.78125 },
        { timePercent: 0.66, value: 0.390625 },
        { timePercent: 0.77, value: -0.1953125 },
        { timePercent: 1, value: 0 },
      ],
    },
    {
      property: 'skewY',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.11, value: -12.5 },
        { timePercent: 0.22, value: 6.25 },
        { timePercent: 0.33, value: -3.125 },
        { timePercent: 0.44, value: 1.5625 },
        { timePercent: 0.55, value: -0.78125 },
        { timePercent: 0.66, value: 0.390625 },
        { timePercent: 0.77, value: -0.1953125 },
        { timePercent: 1, value: 0 },
      ],
    },
  ],
}

export const textRubberBand: AnimationPreset = {
  id: 'text-rubber-band',
  name: 'Rubber Band',
  description: 'Stretchy rubber band effect',
  category: 'text',
  duration: 1000,
  tracks: [
    {
      property: 'scaleX',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.3, value: 1.25 },
        { timePercent: 0.4, value: 0.75 },
        { timePercent: 0.5, value: 1.15 },
        { timePercent: 0.65, value: 0.95 },
        { timePercent: 0.75, value: 1.05 },
        { timePercent: 1, value: 1 },
      ],
    },
    {
      property: 'scaleY',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.3, value: 0.75 },
        { timePercent: 0.4, value: 1.25 },
        { timePercent: 0.5, value: 0.85 },
        { timePercent: 0.65, value: 1.05 },
        { timePercent: 0.75, value: 0.95 },
        { timePercent: 1, value: 1 },
      ],
    },
  ],
}

export const textFlipIn: AnimationPreset = {
  id: 'text-flip-in',
  name: 'Flip In',
  description: '3D flip entrance effect',
  category: 'text',
  duration: 800,
  tracks: [
    {
      property: 'rotateX',
      keyframes: [
        { timePercent: 0, value: 90 },
        { timePercent: 0.4, value: -20, easing: 'ease-out' },
        { timePercent: 0.6, value: 10, easing: 'ease-in-out' },
        { timePercent: 0.8, value: -5, easing: 'ease-in-out' },
        { timePercent: 1, value: 0, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.4, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const textSwingIn: AnimationPreset = {
  id: 'text-swing-in',
  name: 'Swing In',
  description: 'Swing in like a pendulum',
  category: 'text',
  duration: 1200,
  tracks: [
    {
      property: 'rotate',
      keyframes: [
        { timePercent: 0, value: -90 },
        { timePercent: 0.3, value: 15, easing: 'ease-out' },
        { timePercent: 0.5, value: -10, easing: 'ease-in-out' },
        { timePercent: 0.7, value: 5, easing: 'ease-in-out' },
        { timePercent: 0.85, value: -2, easing: 'ease-in-out' },
        { timePercent: 1, value: 0, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.3, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const textTada: AnimationPreset = {
  id: 'text-tada',
  name: 'Tada',
  description: 'Attention-grabbing tada effect',
  category: 'text',
  duration: 1000,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 1 },
        { timePercent: 0.1, value: 0.9 },
        { timePercent: 0.2, value: 0.9 },
        { timePercent: 0.3, value: 1.1 },
        { timePercent: 0.4, value: 1.1 },
        { timePercent: 0.5, value: 1.1 },
        { timePercent: 0.6, value: 1.1 },
        { timePercent: 0.7, value: 1.1 },
        { timePercent: 0.8, value: 1.1 },
        { timePercent: 0.9, value: 1.1 },
        { timePercent: 1, value: 1 },
      ],
    },
    {
      property: 'rotate',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.1, value: -3 },
        { timePercent: 0.2, value: -3 },
        { timePercent: 0.3, value: 3 },
        { timePercent: 0.4, value: -3 },
        { timePercent: 0.5, value: 3 },
        { timePercent: 0.6, value: -3 },
        { timePercent: 0.7, value: 3 },
        { timePercent: 0.8, value: -3 },
        { timePercent: 0.9, value: 3 },
        { timePercent: 1, value: 0 },
      ],
    },
  ],
}

export const textLightSpeed: AnimationPreset = {
  id: 'text-light-speed',
  name: 'Light Speed',
  description: 'Fast entrance with skew',
  category: 'text',
  duration: 600,
  tracks: [
    {
      property: 'x',
      keyframes: [
        { timePercent: 0, value: '+100' },
        { timePercent: 0.6, value: '-10', easing: 'ease-out' },
        { timePercent: 0.8, value: '+5', easing: 'ease-in-out' },
        { timePercent: 1, value: 0, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'skewX',
      keyframes: [
        { timePercent: 0, value: -30 },
        { timePercent: 0.6, value: 20, easing: 'ease-out' },
        { timePercent: 0.8, value: -5, easing: 'ease-in-out' },
        { timePercent: 1, value: 0, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.6, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

// ============================================
// REVEAL / WIPE (CLIP MASK) ANIMATIONS
// These animate clip-inset percentages, wiping the element into view. They work
// on any element, and combine with per-letter stagger for mask-reveal text.
// ============================================

export const revealRight: AnimationPreset = {
  id: 'reveal-right',
  name: 'Reveal Right',
  description: 'Wipe into view from left to right (clip mask)',
  category: 'entrance',
  duration: 600,
  recommendedStagger: 55,
  tracks: [
    {
      property: 'clipRight',
      keyframes: [
        { timePercent: 0, value: 100 },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
  ],
}

export const revealLeft: AnimationPreset = {
  id: 'reveal-left',
  name: 'Reveal Left',
  description: 'Wipe into view from right to left (clip mask)',
  category: 'entrance',
  duration: 600,
  recommendedStagger: 55,
  tracks: [
    {
      property: 'clipLeft',
      keyframes: [
        { timePercent: 0, value: 100 },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
  ],
}

export const revealDown: AnimationPreset = {
  id: 'reveal-down',
  name: 'Reveal Down',
  description: 'Wipe into view from top to bottom (clip mask)',
  category: 'entrance',
  duration: 600,
  recommendedStagger: 55,
  tracks: [
    {
      property: 'clipBottom',
      keyframes: [
        { timePercent: 0, value: 100 },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
  ],
}

export const revealUp: AnimationPreset = {
  id: 'reveal-up',
  name: 'Reveal Up',
  description: 'Wipe into view from bottom to top (clip mask)',
  category: 'entrance',
  duration: 600,
  recommendedStagger: 55,
  tracks: [
    {
      property: 'clipTop',
      keyframes: [
        { timePercent: 0, value: 100 },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
  ],
}

// ============================================
// FILTER ANIMATIONS (blur / glow / drop-shadow)
// ============================================

export const blurIn: AnimationPreset = {
  id: 'blur-in',
  name: 'Blur In',
  description: 'Sharpen into focus from a blur while fading in',
  category: 'entrance',
  duration: 600,
  recommendedStagger: 55,
  tracks: [
    {
      property: 'blur',
      keyframes: [
        { timePercent: 0, value: 12 },
        { timePercent: 1, value: 0, easing: 'ease-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const dropShadowPop: AnimationPreset = {
  id: 'drop-shadow-pop',
  name: 'Drop Shadow',
  description: 'Lift the element with an animated drop shadow',
  category: 'emphasis',
  duration: 800,
  tracks: [
    {
      property: 'shadowColor',
      keyframes: [{ timePercent: 0, value: 'rgba(0, 0, 0, 0.45)' }],
    },
    {
      property: 'shadowX',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 6, easing: 'ease-out' },
      ],
    },
    {
      property: 'shadowY',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 6, easing: 'ease-out' },
      ],
    },
    {
      property: 'shadowBlur',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 10, easing: 'ease-out' },
      ],
    },
  ],
}

export const textShine: AnimationPreset = {
  id: 'text-shine',
  name: 'Shine Sweep',
  description: 'A highlight sweeps across the text, clipped to the glyphs',
  category: 'text',
  duration: 1600,
  tracks: [
    {
      property: 'shine',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 1, easing: 'ease-in-out' },
      ],
    },
  ],
}

// ============================================
// PER-LETTER (STAGGER) TEXT ANIMATIONS
// These are ordinary presets, but they are tuned to look their best when fanned
// out across the letters of a split text element with a small per-letter delay.
// ============================================

export const letterDropBounce: AnimationPreset = {
  id: 'letter-drop-bounce',
  name: 'Letter Drop & Bounce',
  description: 'Letters drop in from above and bounce to a stop — great when staggered',
  category: 'text',
  duration: 700,
  recommendedStagger: 70,
  tracks: [
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: '-140' },
        { timePercent: 0.5, value: '+16', easing: 'ease-in-quad' },
        { timePercent: 0.72, value: '-8', easing: 'ease-out-quad' },
        { timePercent: 0.88, value: '+3', easing: 'ease-in-quad' },
        { timePercent: 1, value: 0, easing: 'ease-out-quad' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.25, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const letterCascadeUp: AnimationPreset = {
  id: 'letter-cascade-up',
  name: 'Letter Cascade Up',
  description: 'Letters fade and rise into place one after another',
  category: 'text',
  duration: 500,
  recommendedStagger: 55,
  tracks: [
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: '+40' },
        { timePercent: 1, value: 0, easing: { type: 'cubic-bezier', points: [0.22, 1, 0.36, 1] } },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 1, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const letterWave: AnimationPreset = {
  id: 'letter-wave',
  name: 'Letter Wave',
  description: 'A rolling wave travels across the letters — loops seamlessly',
  category: 'text',
  duration: 900,
  recommendedStagger: 60,
  tracks: [
    {
      property: 'y',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.25, value: '-22', easing: 'ease-in-out' },
        { timePercent: 0.5, value: 0, easing: 'ease-in-out' },
        { timePercent: 1, value: 0 },
      ],
    },
  ],
}

export const letterAssemble: AnimationPreset = {
  id: 'letter-assemble',
  name: 'Letter Assemble',
  description: 'Letters spin and scale in from nothing to assemble the word',
  category: 'text',
  duration: 650,
  recommendedStagger: 65,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.7, value: 1.15, easing: 'ease-out' },
        { timePercent: 1, value: 1, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'rotate',
      keyframes: [
        { timePercent: 0, value: -120 },
        { timePercent: 1, value: 0, easing: { type: 'cubic-bezier', points: [0.34, 1.56, 0.64, 1] } },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.4, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

export const letterPopIn: AnimationPreset = {
  id: 'letter-pop-in',
  name: 'Letter Pop In',
  description: 'Letters pop in with a springy overshoot',
  category: 'text',
  duration: 450,
  recommendedStagger: 45,
  tracks: [
    {
      property: 'scale',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.6, value: 1.25, easing: 'ease-out' },
        { timePercent: 0.8, value: 0.92, easing: 'ease-in-out' },
        { timePercent: 1, value: 1, easing: 'ease-in-out' },
      ],
    },
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.3, value: 1, easing: 'ease-out' },
      ],
    },
  ],
}

// ============================================
// ALL PRESETS
// ============================================

// ============================================
// Spring presets
// ============================================
//
// These carry spring parameters rather than keyframes. A spring runs until it
// settles, so `duration` below is only a nominal value for the preset list —
// the real length comes from the physics, and the scene extends to fit it.

export const springPop: AnimationPreset = {
  id: 'spring-pop',
  name: 'Spring Pop',
  description: 'Scales up from nothing with a springy overshoot — the classic "pop in".',
  category: 'spring',
  duration: 600,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.25, value: 1, easing: 'ease-out' },
        { timePercent: 1, value: 1 },
      ],
    },
    { property: 'scale', spring: { from: 0, to: 1, stiffness: 220, damping: 11, mass: 1 } },
  ],
  recommendedStagger: 60,
}

export const springDrop: AnimationPreset = {
  id: 'spring-drop',
  name: 'Spring Drop',
  description: 'Falls in from above and bounces to a stop. Underdamped, so it overshoots.',
  category: 'spring',
  duration: 800,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.2, value: 1, easing: 'ease-out' },
        { timePercent: 1, value: 1 },
      ],
    },
    { property: 'y', spring: { from: -120, to: 0, stiffness: 190, damping: 10, mass: 1 } },
  ],
  recommendedStagger: 70,
}

export const springSlideIn: AnimationPreset = {
  id: 'spring-slide-in',
  name: 'Spring Slide',
  description: 'Slides in from the left and settles with a small overshoot.',
  category: 'spring',
  duration: 700,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.2, value: 1, easing: 'ease-out' },
        { timePercent: 1, value: 1 },
      ],
    },
    { property: 'x', spring: { from: -160, to: 0, stiffness: 200, damping: 14, mass: 1 } },
  ],
  recommendedStagger: 60,
}

export const springWobble: AnimationPreset = {
  id: 'spring-wobble',
  name: 'Spring Wobble',
  description:
    'A flick of rotation that wobbles back to rest. Driven by initial velocity rather than a displaced start.',
  category: 'spring',
  duration: 1000,
  tracks: [
    // Starting at rest *with velocity* is what makes this read as a knock
    // rather than a return from somewhere.
    {
      property: 'rotate',
      spring: { from: 0, to: 0, stiffness: 160, damping: 6, mass: 1, velocity: 700 },
    },
  ],
  recommendedStagger: 50,
}

export const springSettle: AnimationPreset = {
  id: 'spring-settle',
  name: 'Spring Settle',
  description: 'Critically damped: arrives fast and stops dead, with no overshoot at all.',
  category: 'spring',
  duration: 500,
  tracks: [
    {
      property: 'opacity',
      keyframes: [
        { timePercent: 0, value: 0 },
        { timePercent: 0.3, value: 1, easing: 'ease-out' },
        { timePercent: 1, value: 1 },
      ],
    },
    // damping >= 2 * sqrt(stiffness * mass) is critical; at or above it the
    // spring never passes its target.
    { property: 'scale', spring: { from: 0.8, to: 1, stiffness: 220, damping: 32, mass: 1 } },
  ],
  recommendedStagger: 50,
}

export const allPresets: AnimationPreset[] = [
  // Entrance
  fadeIn,
  fadeInUp,
  fadeInDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  revealRight,
  revealLeft,
  revealDown,
  revealUp,
  blurIn,
  // Emphasis
  pulse,
  bounce,
  shake,
  spin,
  flash,
  dropShadowPop,
  // Exit
  fadeOut,
  fadeOutDown,
  scaleOut,
  // Motion
  float,
  swing,
  breathe,
  // Text
  textColorCycle,
  textGlow,
  textBounceIn,
  textSlideUp,
  textRotateIn,
  textZoomIn,
  textWobble,
  textHeartbeat,
  textCircularOrbit,
  textJello,
  textRubberBand,
  textFlipIn,
  textSwingIn,
  textTada,
  textLightSpeed,
  textShine,
  // Per-letter (stagger) text
  letterDropBounce,
  letterCascadeUp,
  letterWave,
  letterAssemble,
  letterPopIn,
  // Springs (parameters, not keyframes)
  springPop,
  springDrop,
  springSlideIn,
  springWobble,
  springSettle,
]

export const presetsByCategory = {
  entrance: allPresets.filter((p) => p.category === 'entrance'),
  emphasis: allPresets.filter((p) => p.category === 'emphasis'),
  exit: allPresets.filter((p) => p.category === 'exit'),
  motion: allPresets.filter((p) => p.category === 'motion'),
  text: allPresets.filter((p) => p.category === 'text'),
  spring: allPresets.filter((p) => p.category === 'spring'),
}

export function getPresetById(id: string): AnimationPreset | undefined {
  return allPresets.find((p) => p.id === id)
}
