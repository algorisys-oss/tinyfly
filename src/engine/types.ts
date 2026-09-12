/**
 * Core type definitions for tinyfly animation engine.
 * All types are JSON-serializable to support persistence and cross-platform playback.
 */

/** Supported property value types for animation */
export type AnimatableValue = number | string | number[];

/** Easing function signature - takes normalized time (0-1), returns eased value (0-1) */
export type EasingFunction = (t: number) => number;

/** Built-in easing type identifiers for JSON serialization */
export type BuiltInEasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-quad'
  | 'ease-out-quad'
  | 'ease-in-out-quad'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic';

/** Cubic bezier control points [cp1x, cp1y, cp2x, cp2y] - values from 0 to 1 */
export type CubicBezierPoints = [number, number, number, number];

/** Custom cubic-bezier easing definition */
export interface CubicBezierEasing {
  type: 'cubic-bezier';
  /** Control points: [cp1x, cp1y, cp2x, cp2y] */
  points: CubicBezierPoints;
}

/** Easing type - either built-in string or custom cubic-bezier */
export type EasingType = BuiltInEasingType | CubicBezierEasing;

/** Type guard to check if easing is a cubic-bezier */
export function isCubicBezierEasing(easing: EasingType | undefined): easing is CubicBezierEasing {
  return typeof easing === 'object' && easing !== null && easing.type === 'cubic-bezier';
}

/** A single keyframe defining a value at a specific time */
export interface Keyframe<T extends AnimatableValue = AnimatableValue> {
  /** Time in milliseconds from timeline start */
  time: number;
  /** Value at this keyframe */
  value: T;
  /** Easing function to use when interpolating TO this keyframe */
  easing?: EasingType;
}

/** A track controls a single property over time */
export interface Track<T extends AnimatableValue = AnimatableValue> {
  /** Unique identifier for this track */
  id: string;
  /** Target identifier (e.g., element id, object reference key) */
  target: string;
  /** Property name to animate (e.g., 'opacity', 'x', 'transform') */
  property: string;
  /** Ordered list of keyframes (must be sorted by time) */
  keyframes: Keyframe<T>[];
  /**
   * Shift every keyframe by this many milliseconds at evaluation time.
   * Purely a convenience: `delay: 200` is equivalent to adding 200 to each
   * keyframe's `time`. Kept separate so authoring tools can adjust a track's
   * start without rewriting its keyframes.
   */
  delay?: number;
  /**
   * Extra milliseconds held after the last keyframe. Contributes to the track's
   * duration (and therefore the timeline's) without changing its final value.
   */
  endDelay?: number;
  /**
   * Animate several targets from one track, each offset by `stagger`.
   * When present, `target` is ignored. See `StaggerConfig`.
   */
  targets?: string[];
  /** Per-target time offsets for `targets`. Ignored when `targets` is absent. */
  stagger?: StaggerConfig;
}

/** Where a stagger starts fanning out from */
export type StaggerFrom = 'start' | 'end' | 'center' | 'edges' | number;

/**
 * Runtime stagger: expands one track across `targets` by offsetting each
 * target's time. Serializable, and cheaper than baking N tracks when N is large.
 */
export interface StaggerConfig {
  /** Milliseconds between consecutive targets. Ignored when `amount` is set. */
  each?: number;
  /** Total spread in milliseconds, divided across the targets. Wins over `each`. */
  amount?: number;
  /** Which target gets offset 0 and which way the fan runs (default: 'start') */
  from?: StaggerFrom;
}

/** Timeline playback state */
export type PlaybackState = 'idle' | 'playing' | 'paused';

/** Timeline playback direction */
export type PlaybackDirection = 'forward' | 'reverse';

/** Timeline configuration */
export interface TimelineConfig {
  /** Total duration in milliseconds (auto-calculated from tracks if not specified) */
  duration?: number;
  /** Number of times to loop (0 = no loop, -1 = infinite) */
  loop?: number;
  /** Playback speed multiplier (1 = normal, 2 = double speed, 0.5 = half speed) */
  speed?: number;
  /** Whether to alternate direction on each loop iteration */
  alternate?: boolean;
  /** Milliseconds to hold at the end before starting the next loop iteration */
  repeatDelay?: number;
}

/** Serializable timeline definition */
export interface TimelineDefinition {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name?: string;
  /** Timeline configuration */
  config: TimelineConfig;
  /** Tracks in this timeline (keyframed, motion-path, or spring) */
  tracks: AnyTrack[];
}

/** Current state of an animation at a given time */
export interface AnimationState {
  /** Map of target -> property -> current value */
  values: Map<string, Map<string, AnimatableValue>>;
  /** Current time in milliseconds */
  currentTime: number;
  /** Current playback state */
  playbackState: PlaybackState;
  /** Current direction */
  direction: PlaybackDirection;
  /** Current loop iteration (0-indexed) */
  loopIteration: number;
}

/** Interpolator function signature */
export type Interpolator<T extends AnimatableValue = AnimatableValue> = (
  from: T,
  to: T,
  progress: number
) => T;

// ============================================
// Motion Path Types
// ============================================

/** Configuration for motion path animation */
export interface MotionPathConfig {
  /** SVG path data string (d attribute) */
  pathData: string;
  /** Whether to auto-rotate element to follow path tangent */
  autoRotate?: boolean;
  /** Rotation offset in degrees (added to tangent angle when autoRotate is true) */
  rotateOffset?: number;
}

/** A track that animates along a motion path */
export interface MotionPathTrack {
  /** Unique identifier for this track */
  id: string;
  /** Target identifier (e.g., element id) */
  target: string;
  /** Property type - always 'motionPath' for motion path tracks */
  property: 'motionPath';
  /** Motion path configuration */
  motionPathConfig: MotionPathConfig;
  /** Keyframes with progress values (0-1) */
  keyframes: Keyframe<number>[];
  /** Shift every keyframe by this many milliseconds at evaluation time */
  delay?: number;
  /** Extra milliseconds held after the last keyframe */
  endDelay?: number;
  /** Animate several targets along the path, each offset by `stagger` */
  targets?: string[];
  /** Per-target offsets for `targets` */
  stagger?: StaggerConfig;
}

/** Result of computing position on a motion path */
export interface MotionPathPoint {
  /** X coordinate on the path */
  x: number;
  /** Y coordinate on the path */
  y: number;
  /** Tangent angle in degrees */
  angle: number;
}

// ============================================
// Spring Types
// ============================================

/**
 * Parameters for a physically-simulated spring. Serializable: the animation is
 * the parameters, not a baked curve, so a spring track is as portable as a
 * keyframe track.
 */
export interface SpringConfig {
  /** Starting value */
  from: number;
  /** Resting target value */
  to: number;
  /** Spring constant — higher is snappier (default: 180) */
  stiffness?: number;
  /** Damping coefficient — higher settles sooner, 0 oscillates forever (default: 12) */
  damping?: number;
  /** Mass — higher is more sluggish (default: 1) */
  mass?: number;
  /** Initial velocity in units per second (default: 0) */
  velocity?: number;
  /**
   * How close to `to` counts as settled, as a fraction of the spring's travel
   * distance (default: 0.01, i.e. within 1% of the journey).
   *
   * Relative rather than absolute so that settling depends on the spring's
   * parameters and not on the units of the property it drives — `scale: 0→1`
   * and `x: 0→100` settle at the same time.
   */
  restDelta?: number;
  /**
   * How slow counts as settled, as a fraction of the travel distance per
   * second (default: 0.1). Relative for the same reason as `restDelta`.
   */
  restSpeed?: number;
}

/**
 * A track whose values come from a spring simulation instead of keyframes.
 *
 * Evaluated by integrating forward from t=0 at a fixed timestep, so it stays a
 * pure function of time — seeking backwards yields the same values as playing
 * forwards, and two runs produce identical output.
 */
export interface SpringTrack {
  /** Unique identifier for this track */
  id: string;
  /** Target identifier */
  target: string;
  /** Property name to animate */
  property: string;
  /** Marks this as a spring track for serialization and dispatch */
  kind: 'spring';
  /** Spring parameters */
  spring: SpringConfig;
  /** Milliseconds before the spring starts */
  delay?: number;
  /** Animate several targets, each offset by `stagger` */
  targets?: string[];
  /** Per-target offsets for `targets` */
  stagger?: StaggerConfig;
}

/** Type guard to check if a track is a spring track */
export function isSpringTrack(track: AnyTrack): track is SpringTrack {
  return (track as SpringTrack).kind === 'spring' && 'spring' in track;
}

/** Type guard to check if a track is a motion path track */
export function isMotionPathTrack(track: AnyTrack): track is MotionPathTrack {
  return track.property === 'motionPath' && 'motionPathConfig' in track;
}

/** Type guard to check if a value is a motion path point */
export function isMotionPathPoint(value: unknown): value is MotionPathPoint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'x' in value &&
    'y' in value &&
    'angle' in value
  );
}

/** Union type for any track */
export type AnyTrack = Track | MotionPathTrack | SpringTrack;

/**
 * Tracks whose values come from keyframes — everything except springs.
 * Most authoring and export code only makes sense for these.
 */
export type KeyframedTrack = Track | MotionPathTrack;

/**
 * Narrow a track to the keyframed kinds. Use this before reaching for
 * `.keyframes`, which spring tracks do not have.
 */
export function hasKeyframes(track: AnyTrack): track is KeyframedTrack {
  return 'keyframes' in track;
}
