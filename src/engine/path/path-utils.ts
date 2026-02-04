/**
 * SVG path parsing and point calculation utilities.
 * Supports M, L, H, V, C, S, Q, T, A, Z commands.
 */

import type { MotionPathPoint } from '../types';

/** Types of path commands */
type CommandType = 'M' | 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A' | 'Z';

/** A parsed path segment */
interface PathSegment {
  type: CommandType;
  points: number[];
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
}

/** Parsed path with segments and total length */
interface ParsedPath {
  segments: PathSegment[];
  totalLength: number;
}

/** Cache for parsed paths */
const pathCache = new Map<string, ParsedPath>();

/**
 * Parse an SVG path data string into segments.
 */
export function parsePath(pathData: string): ParsedPath {
  // Check cache first
  const cached = pathCache.get(pathData);
  if (cached) return cached;

  const segments: PathSegment[] = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;

  // Parse path commands
  const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

  for (const cmd of commands) {
    const type = cmd[0];
    const isRelative = type === type.toLowerCase();
    const absType = type.toUpperCase() as CommandType;
    const args = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .filter((s) => s.length > 0)
      .map(parseFloat);

    switch (absType) {
      case 'M': {
        // Move to
        if (isRelative) {
          currentX += args[0];
          currentY += args[1];
        } else {
          currentX = args[0];
          currentY = args[1];
        }
        startX = currentX;
        startY = currentY;
        // M doesn't create a drawn segment, but we track position
        break;
      }

      case 'L': {
        // Line to
        const endX = isRelative ? currentX + args[0] : args[0];
        const endY = isRelative ? currentY + args[1] : args[1];
        const length = Math.sqrt(
          Math.pow(endX - currentX, 2) + Math.pow(endY - currentY, 2)
        );
        segments.push({
          type: 'L',
          points: [endX, endY],
          startX: currentX,
          startY: currentY,
          endX,
          endY,
          length,
        });
        currentX = endX;
        currentY = endY;
        break;
      }

      case 'H': {
        // Horizontal line
        const endX = isRelative ? currentX + args[0] : args[0];
        const length = Math.abs(endX - currentX);
        segments.push({
          type: 'L',
          points: [endX, currentY],
          startX: currentX,
          startY: currentY,
          endX,
          endY: currentY,
          length,
        });
        currentX = endX;
        break;
      }

      case 'V': {
        // Vertical line
        const endY = isRelative ? currentY + args[0] : args[0];
        const length = Math.abs(endY - currentY);
        segments.push({
          type: 'L',
          points: [currentX, endY],
          startX: currentX,
          startY: currentY,
          endX: currentX,
          endY,
          length,
        });
        currentY = endY;
        break;
      }

      case 'C': {
        // Cubic bezier
        let i = 0;
        while (i + 5 < args.length || i === 0) {
          const cp1x = isRelative ? currentX + args[i] : args[i];
          const cp1y = isRelative ? currentY + args[i + 1] : args[i + 1];
          const cp2x = isRelative ? currentX + args[i + 2] : args[i + 2];
          const cp2y = isRelative ? currentY + args[i + 3] : args[i + 3];
          const endX = isRelative ? currentX + args[i + 4] : args[i + 4];
          const endY = isRelative ? currentY + args[i + 5] : args[i + 5];
          const length = estimateCubicBezierLength(
            currentX, currentY, cp1x, cp1y, cp2x, cp2y, endX, endY
          );
          segments.push({
            type: 'C',
            points: [cp1x, cp1y, cp2x, cp2y, endX, endY],
            startX: currentX,
            startY: currentY,
            endX,
            endY,
            length,
          });
          currentX = endX;
          currentY = endY;
          i += 6;
        }
        break;
      }

      case 'Q': {
        // Quadratic bezier
        let i = 0;
        while (i + 3 < args.length || i === 0) {
          const cpx = isRelative ? currentX + args[i] : args[i];
          const cpy = isRelative ? currentY + args[i + 1] : args[i + 1];
          const endX = isRelative ? currentX + args[i + 2] : args[i + 2];
          const endY = isRelative ? currentY + args[i + 3] : args[i + 3];
          const length = estimateQuadraticBezierLength(
            currentX, currentY, cpx, cpy, endX, endY
          );
          segments.push({
            type: 'Q',
            points: [cpx, cpy, endX, endY],
            startX: currentX,
            startY: currentY,
            endX,
            endY,
            length,
          });
          currentX = endX;
          currentY = endY;
          i += 4;
        }
        break;
      }

      case 'A': {
        // Arc
        const rx = args[0];
        const ry = args[1];
        const rotation = args[2];
        const largeArc = args[3];
        const sweep = args[4];
        const endX = isRelative ? currentX + args[5] : args[5];
        const endY = isRelative ? currentY + args[6] : args[6];
        const length = estimateArcLength(
          currentX, currentY, rx, ry, rotation, largeArc, sweep, endX, endY
        );
        segments.push({
          type: 'A',
          points: [rx, ry, rotation, largeArc, sweep, endX, endY],
          startX: currentX,
          startY: currentY,
          endX,
          endY,
          length,
        });
        currentX = endX;
        currentY = endY;
        break;
      }

      case 'Z': {
        // Close path
        const length = Math.sqrt(
          Math.pow(startX - currentX, 2) + Math.pow(startY - currentY, 2)
        );
        if (length > 0) {
          segments.push({
            type: 'L',
            points: [startX, startY],
            startX: currentX,
            startY: currentY,
            endX: startX,
            endY: startY,
            length,
          });
        }
        currentX = startX;
        currentY = startY;
        break;
      }

      case 'S':
      case 'T':
        // Smooth curves - simplified handling
        // For now, treat as line to endpoint
        if (absType === 'S' && args.length >= 4) {
          const endX = isRelative ? currentX + args[2] : args[2];
          const endY = isRelative ? currentY + args[3] : args[3];
          const length = Math.sqrt(
            Math.pow(endX - currentX, 2) + Math.pow(endY - currentY, 2)
          );
          segments.push({
            type: 'L',
            points: [endX, endY],
            startX: currentX,
            startY: currentY,
            endX,
            endY,
            length,
          });
          currentX = endX;
          currentY = endY;
        } else if (absType === 'T' && args.length >= 2) {
          const endX = isRelative ? currentX + args[0] : args[0];
          const endY = isRelative ? currentY + args[1] : args[1];
          const length = Math.sqrt(
            Math.pow(endX - currentX, 2) + Math.pow(endY - currentY, 2)
          );
          segments.push({
            type: 'L',
            points: [endX, endY],
            startX: currentX,
            startY: currentY,
            endX,
            endY,
            length,
          });
          currentX = endX;
          currentY = endY;
        }
        break;
    }
  }

  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
  const parsed = { segments, totalLength };
  pathCache.set(pathData, parsed);
  return parsed;
}

/**
 * Get point at normalized progress (0-1) along path.
 */
export function getPointAtProgress(pathData: string, progress: number): MotionPathPoint {
  const parsed = parsePath(pathData);

  if (parsed.segments.length === 0) {
    return { x: 0, y: 0, angle: 0 };
  }

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const targetLength = clampedProgress * parsed.totalLength;

  let accumulatedLength = 0;

  for (const segment of parsed.segments) {
    if (accumulatedLength + segment.length >= targetLength || segment === parsed.segments[parsed.segments.length - 1]) {
      const segmentProgress = segment.length > 0
        ? (targetLength - accumulatedLength) / segment.length
        : 0;
      return getPointOnSegment(segment, Math.max(0, Math.min(1, segmentProgress)));
    }
    accumulatedLength += segment.length;
  }

  // Fallback to end point
  const lastSegment = parsed.segments[parsed.segments.length - 1];
  return { x: lastSegment.endX, y: lastSegment.endY, angle: 0 };
}

/**
 * Get point on a specific segment at given progress.
 */
function getPointOnSegment(segment: PathSegment, t: number): MotionPathPoint {
  switch (segment.type) {
    case 'L': {
      const x = segment.startX + (segment.endX - segment.startX) * t;
      const y = segment.startY + (segment.endY - segment.startY) * t;
      const angle = Math.atan2(
        segment.endY - segment.startY,
        segment.endX - segment.startX
      ) * (180 / Math.PI);
      return { x, y, angle };
    }

    case 'C': {
      const [cp1x, cp1y, cp2x, cp2y, endX, endY] = segment.points;
      const point = cubicBezierPoint(
        segment.startX, segment.startY,
        cp1x, cp1y, cp2x, cp2y,
        endX, endY, t
      );
      const tangent = cubicBezierTangent(
        segment.startX, segment.startY,
        cp1x, cp1y, cp2x, cp2y,
        endX, endY, t
      );
      const angle = Math.atan2(tangent.y, tangent.x) * (180 / Math.PI);
      return { x: point.x, y: point.y, angle };
    }

    case 'Q': {
      const [cpx, cpy, endX, endY] = segment.points;
      const point = quadraticBezierPoint(
        segment.startX, segment.startY,
        cpx, cpy, endX, endY, t
      );
      const tangent = quadraticBezierTangent(
        segment.startX, segment.startY,
        cpx, cpy, endX, endY, t
      );
      const angle = Math.atan2(tangent.y, tangent.x) * (180 / Math.PI);
      return { x: point.x, y: point.y, angle };
    }

    case 'A': {
      // Arc - simplified linear interpolation for now
      const x = segment.startX + (segment.endX - segment.startX) * t;
      const y = segment.startY + (segment.endY - segment.startY) * t;
      const angle = Math.atan2(
        segment.endY - segment.startY,
        segment.endX - segment.startX
      ) * (180 / Math.PI);
      return { x, y, angle };
    }

    default:
      return { x: segment.endX, y: segment.endY, angle: 0 };
  }
}

// Bezier curve utilities

function cubicBezierPoint(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3,
    y: mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3,
  };
}

function cubicBezierTangent(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  return {
    x: 3 * mt2 * (x1 - x0) + 6 * mt * t * (x2 - x1) + 3 * t2 * (x3 - x2),
    y: 3 * mt2 * (y1 - y0) + 6 * mt * t * (y2 - y1) + 3 * t2 * (y3 - y2),
  };
}

function quadraticBezierPoint(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  return {
    x: mt2 * x0 + 2 * mt * t * x1 + t2 * x2,
    y: mt2 * y0 + 2 * mt * t * y1 + t2 * y2,
  };
}

function quadraticBezierTangent(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  t: number
): { x: number; y: number } {
  const mt = 1 - t;

  return {
    x: 2 * mt * (x1 - x0) + 2 * t * (x2 - x1),
    y: 2 * mt * (y1 - y0) + 2 * t * (y2 - y1),
  };
}

// Length estimation utilities

function estimateCubicBezierLength(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  samples: number = 20
): number {
  let length = 0;
  let prevX = x0;
  let prevY = y0;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const point = cubicBezierPoint(x0, y0, x1, y1, x2, y2, x3, y3, t);
    length += Math.sqrt(
      Math.pow(point.x - prevX, 2) + Math.pow(point.y - prevY, 2)
    );
    prevX = point.x;
    prevY = point.y;
  }

  return length;
}

function estimateQuadraticBezierLength(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  samples: number = 20
): number {
  let length = 0;
  let prevX = x0;
  let prevY = y0;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const point = quadraticBezierPoint(x0, y0, x1, y1, x2, y2, t);
    length += Math.sqrt(
      Math.pow(point.x - prevX, 2) + Math.pow(point.y - prevY, 2)
    );
    prevX = point.x;
    prevY = point.y;
  }

  return length;
}

function estimateArcLength(
  x0: number, y0: number,
  rx: number, ry: number,
  _rotation: number, _largeArc: number, _sweep: number,
  x1: number, y1: number
): number {
  // Simplified arc length estimation using chord + arc approximation
  const chord = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
  const avgRadius = (rx + ry) / 2;
  // Approximate arc length as slightly more than chord
  return Math.max(chord, avgRadius * Math.PI * 0.5);
}

/**
 * Clear the path cache.
 */
export function clearPathCache(): void {
  pathCache.clear();
}

/**
 * Get the total length of a path.
 */
export function getPathLength(pathData: string): number {
  const parsed = parsePath(pathData);
  return parsed.totalLength;
}
