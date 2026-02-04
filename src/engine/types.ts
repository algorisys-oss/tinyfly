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
}

/** Serializable timeline definition */
export interface TimelineDefinition {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name?: string;
  /** Timeline configuration */
  config: TimelineConfig;
  /** Tracks in this timeline */
  tracks: Track[];
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

/** Type guard to check if a track is a motion path track */
export function isMotionPathTrack(track: Track | MotionPathTrack): track is MotionPathTrack {
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
export type AnyTrack = Track | MotionPathTrack;
