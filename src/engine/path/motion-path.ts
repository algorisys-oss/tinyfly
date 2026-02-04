/**
 * Motion path interpolator.
 * Computes position and rotation along an SVG path based on progress.
 */

import type { MotionPathConfig, MotionPathPoint } from '../types';
import { getPointAtProgress } from './path-utils';

/**
 * Get the current position and angle on a motion path at given progress.
 *
 * @param config - Motion path configuration
 * @param progress - Progress along the path (0-1)
 * @returns Point with x, y coordinates and tangent angle
 */
export function getMotionPathPoint(
  config: MotionPathConfig,
  progress: number
): MotionPathPoint {
  const point = getPointAtProgress(config.pathData, progress);

  // Apply rotation offset if specified
  if (config.autoRotate && config.rotateOffset) {
    point.angle += config.rotateOffset;
  }

  return point;
}

/**
 * Interpolate between two progress values on a motion path.
 * This is used by the track system to compute intermediate positions.
 *
 * @param config - Motion path configuration
 * @param fromProgress - Starting progress (0-1)
 * @param toProgress - Ending progress (0-1)
 * @param t - Interpolation factor (0-1), already eased
 * @returns Point at interpolated progress
 */
export function interpolateMotionPath(
  config: MotionPathConfig,
  fromProgress: number,
  toProgress: number,
  t: number
): MotionPathPoint {
  // Linear interpolation of progress values
  const progress = fromProgress + (toProgress - fromProgress) * t;
  return getMotionPathPoint(config, progress);
}
