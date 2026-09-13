/**
 * SVG path parsing and point calculation utilities.
 *
 * Parsing normalises every command to absolute lines and cubic beziers:
 * H/V become lines, Q/T are raised to cubics exactly, S/T reflect the previous
 * control point as the SVG spec defines, and arcs are split into cubic pieces
 * of at most 90°. Evaluation then only has two cases to handle.
 *
 * Progress along a path is by arc length, including *within* a curve (via a
 * per-segment length table), so something moving along a path does so at an
 * even speed rather than bunching up where control points are close together.
 *
 * Pure and DOM-free: runs in the engine, workers and tests alike.
 */

import type { MotionPathPoint } from '../types';

/** A drawn segment: a line or a cubic bezier, in absolute coordinates. */
export interface PathSegment {
  type: 'L' | 'C';
  /** L: [endX, endY]. C: [cp1x, cp1y, cp2x, cp2y, endX, endY] */
  points: number[];
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  /** Index of the subpath (each moveto starts one) this segment belongs to */
  subpath: number;
  /**
   * Cubic segments only: cumulative length at evenly spaced `t` values
   * (`lengths[i]` is the length from t=0 to t=i/(lengths.length-1)).
   */
  lengths?: number[];
}

/** One continuous run of segments, started by a moveto. */
export interface Subpath {
  /** Index of the first segment in `ParsedPath.segments` */
  start: number;
  /** Index one past the last segment */
  end: number;
  length: number;
  /** Ends with Z, or finishes exactly where it began */
  closed: boolean;
}

/** Parsed path with segments and total length */
export interface ParsedPath {
  segments: PathSegment[];
  totalLength: number;
  /** Drawn subpaths, in order (movetos that draw nothing are omitted) */
  subpaths: Subpath[];
}

/** Samples per cubic segment for the arc-length table. */
const LENGTH_SAMPLES = 32;

/** Bounded so a long-running page that animates many distinct paths does not grow without limit. */
const PATH_CACHE_LIMIT = 256;
const pathCache = new Map<string, ParsedPath>();

// ============================================
// Tokenising
// ============================================

const COMMAND = /[MmLlHhVvCcSsQqTtAaZz]/;
const NUMBER = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/;

/** Arguments each command consumes per repetition. */
const ARG_COUNT: Record<string, number> = {
  M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
};

interface RawCommand {
  type: string;
  args: number[];
}

/**
 * Split path data into commands and their numeric arguments.
 *
 * Handles the compact forms real exporters produce: numbers run together
 * (`10-20`, `.5.5`), exponents, and arc flags written without separators
 * (`a1 1 0 0110 10`). Parsing stops at the first malformed token, as browsers do.
 */
function tokenize(pathData: string): RawCommand[] {
  const commands: RawCommand[] = [];
  let i = 0;
  let current: RawCommand | null = null;

  const skipSeparators = () => {
    while (i < pathData.length && /[\s,]/.test(pathData[i])) i++;
  };

  while (i < pathData.length) {
    skipSeparators();
    if (i >= pathData.length) break;

    const char = pathData[i];
    if (COMMAND.test(char)) {
      current = { type: char, args: [] };
      commands.push(current);
      i++;
      continue;
    }
    if (!current) break;

    // Arc flags (4th and 5th argument of each arc) are single characters.
    const isArc = current.type === 'A' || current.type === 'a';
    const argIndex = current.args.length % 7;
    if (isArc && (argIndex === 3 || argIndex === 4)) {
      if (char !== '0' && char !== '1') break;
      current.args.push(char === '1' ? 1 : 0);
      i++;
      continue;
    }

    const match = NUMBER.exec(pathData.slice(i));
    if (!match) break;
    current.args.push(parseFloat(match[0]));
    i += match[0].length;
  }

  return commands;
}

// ============================================
// Normalising to absolute L / C
// ============================================

/** Convert one elliptical arc to cubic beziers (SVG spec, appendix F.6). */
function arcToCubics(
  x1: number, y1: number,
  rxIn: number, ryIn: number, rotationDeg: number,
  largeArc: number, sweep: number,
  x2: number, y2: number
): number[][] {
  if (x1 === x2 && y1 === y2) return [];
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return [[x1, y1, x2, y2, x2, y2]];

  const phi = (rotationDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  // Scale radii up if they cannot span the endpoints.
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  const sign = largeArc === sweep ? -1 : 1;
  const numerator = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const denominator = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, numerator / denominator));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    const a = Math.acos(Math.max(-1, Math.min(1, dot / len)));
    return ux * vy - uy * vx < 0 ? -a : a;
  };

  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;

  const pieces = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)));
  const step = delta / pieces;
  const k = (4 / 3) * Math.tan(step / 4);

  const pointAt = (theta: number) => {
    const ex = rx * Math.cos(theta);
    const ey = ry * Math.sin(theta);
    return [cosPhi * ex - sinPhi * ey + cx, sinPhi * ex + cosPhi * ey + cy];
  };
  const derivativeAt = (theta: number) => {
    const ex = -rx * Math.sin(theta);
    const ey = ry * Math.cos(theta);
    return [cosPhi * ex - sinPhi * ey, sinPhi * ex + cosPhi * ey];
  };

  const cubics: number[][] = [];
  for (let p = 0; p < pieces; p++) {
    const a = theta1 + p * step;
    const b = a + step;
    const [ax, ay] = pointAt(a);
    const [bx, by] = p === pieces - 1 ? [x2, y2] : pointAt(b);
    const [dax, day] = derivativeAt(a);
    const [dbx, dby] = derivativeAt(b);
    cubics.push([ax + k * dax, ay + k * day, bx - k * dbx, by - k * dby, bx, by]);
  }
  return cubics;
}

function cubicPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function cubicDerivative(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return 3 * mt * mt * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

function lineSegment(x0: number, y0: number, x1: number, y1: number): PathSegment {
  return {
    subpath: 0,
    type: 'L',
    points: [x1, y1],
    startX: x0,
    startY: y0,
    endX: x1,
    endY: y1,
    length: Math.hypot(x1 - x0, y1 - y0),
  };
}

function cubicSegment(x0: number, y0: number, c: number[]): PathSegment {
  const [c1x, c1y, c2x, c2y, x1, y1] = c;
  const lengths = [0];
  let prevX = x0;
  let prevY = y0;
  let total = 0;
  for (let i = 1; i <= LENGTH_SAMPLES; i++) {
    const t = i / LENGTH_SAMPLES;
    const x = cubicPoint(x0, c1x, c2x, x1, t);
    const y = cubicPoint(y0, c1y, c2y, y1, t);
    total += Math.hypot(x - prevX, y - prevY);
    lengths.push(total);
    prevX = x;
    prevY = y;
  }
  return {
    subpath: 0,
    type: 'C',
    points: [c1x, c1y, c2x, c2y, x1, y1],
    startX: x0,
    startY: y0,
    endX: x1,
    endY: y1,
    length: total,
    lengths,
  };
}

/**
 * Parse an SVG path data string into absolute line and cubic segments.
 * Supports M, L, H, V, C, S, Q, T, A and Z, absolute and relative.
 */
export function parsePath(pathData: string): ParsedPath {
  const cached = pathCache.get(pathData);
  if (cached) return cached;

  const segments: PathSegment[] = [];
  let x = 0;
  let y = 0;
  let subpathX = 0;
  let subpathY = 0;
  // The previous command's second control point, for S (cubic) and T (quadratic).
  let lastCubicControl: [number, number] | null = null;
  let lastQuadControl: [number, number] | null = null;
  let subpath = -1;
  const closedSubpaths = new Set<number>();

  // Every segment pushed is tagged with the current subpath.
  const push = (segment: PathSegment) => {
    if (subpath < 0) subpath = 0;
    segment.subpath = subpath;
    segments.push(segment);
  };

  for (const { type, args } of tokenize(pathData)) {
    const absType = type.toUpperCase();
    const relative = type !== absType;
    const count = ARG_COUNT[absType];

    if (absType === 'Z') {
      if (x !== subpathX || y !== subpathY) push(lineSegment(x, y, subpathX, subpathY));
      if (subpath >= 0) closedSubpaths.add(subpath);
      x = subpathX;
      y = subpathY;
      lastCubicControl = lastQuadControl = null;
      continue;
    }

    for (let i = 0; i + count <= args.length; i += count) {
      const a = args.slice(i, i + count);
      const ox = relative ? x : 0;
      const oy = relative ? y : 0;
      let nextCubic: [number, number] | null = null;
      let nextQuad: [number, number] | null = null;

      switch (absType) {
        case 'M':
          // Coordinates after the first pair of a moveto are implicit linetos.
          if (i === 0) {
            x = a[0] + ox;
            y = a[1] + oy;
            subpathX = x;
            subpathY = y;
            // A new subpath begins, unless the previous moveto drew nothing.
            if (subpath < 0 || segments[segments.length - 1]?.subpath === subpath) subpath++;
          } else {
            push(lineSegment(x, y, a[0] + ox, a[1] + oy));
            x = a[0] + ox;
            y = a[1] + oy;
          }
          break;
        case 'L':
          push(lineSegment(x, y, a[0] + ox, a[1] + oy));
          x = a[0] + ox;
          y = a[1] + oy;
          break;
        case 'H':
          push(lineSegment(x, y, a[0] + ox, y));
          x = a[0] + ox;
          break;
        case 'V':
          push(lineSegment(x, y, x, a[0] + oy));
          y = a[0] + oy;
          break;
        case 'C': {
          const c: number[] = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy, a[4] + ox, a[5] + oy];
          push(cubicSegment(x, y, c));
          nextCubic = [c[2], c[3]];
          x = c[4];
          y = c[5];
          break;
        }
        case 'S': {
          const [rx, ry]: [number, number] = lastCubicControl ? [2 * x - lastCubicControl[0], 2 * y - lastCubicControl[1]] : [x, y];
          const c: number[] = [rx, ry, a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
          push(cubicSegment(x, y, c));
          nextCubic = [c[2], c[3]];
          x = c[4];
          y = c[5];
          break;
        }
        case 'Q':
        case 'T': {
          let qx: number = x;
          let qy: number = y;
          if (absType === 'Q') {
            qx = a[0] + ox;
            qy = a[1] + oy;
          } else if (lastQuadControl) {
            qx = 2 * x - lastQuadControl[0];
            qy = 2 * y - lastQuadControl[1];
          }
          const endX = absType === 'Q' ? a[2] + ox : a[0] + ox;
          const endY = absType === 'Q' ? a[3] + oy : a[1] + oy;
          // A quadratic is exactly a cubic with controls 2/3 of the way to its control point.
          push(
            cubicSegment(x, y, [
              x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y),
              endX + (2 / 3) * (qx - endX), endY + (2 / 3) * (qy - endY),
              endX, endY,
            ])
          );
          nextQuad = [qx, qy];
          x = endX;
          y = endY;
          break;
        }
        case 'A': {
          const endX = a[5] + ox;
          const endY = a[6] + oy;
          let startX = x;
          let startY = y;
          for (const c of arcToCubics(x, y, a[0], a[1], a[2], a[3], a[4], endX, endY)) {
            push(cubicSegment(startX, startY, c));
            startX = c[4];
            startY = c[5];
          }
          x = endX;
          y = endY;
          break;
        }
      }

      lastCubicControl = nextCubic;
      lastQuadControl = nextQuad;
    }
  }

  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);

  const subpaths: Subpath[] = [];
  for (let i = 0; i < segments.length; ) {
    const index = segments[i].subpath;
    let end = i;
    let length = 0;
    while (end < segments.length && segments[end].subpath === index) length += segments[end++].length;
    const first = segments[i];
    const last = segments[end - 1];
    const closed =
      closedSubpaths.has(index) ||
      (Math.abs(last.endX - first.startX) < 1e-9 && Math.abs(last.endY - first.startY) < 1e-9);
    subpaths.push({ start: i, end, length, closed });
    i = end;
  }

  const parsed = { segments, totalLength, subpaths };

  if (pathCache.size >= PATH_CACHE_LIMIT) {
    pathCache.delete(pathCache.keys().next().value!);
  }
  pathCache.set(pathData, parsed);
  return parsed;
}

// ============================================
// Evaluation
// ============================================

/** The `t` on a cubic segment at `distance` along it, from its length table. */
function tAtDistance(segment: PathSegment, distance: number): number {
  const lengths = segment.lengths!;
  if (distance <= 0) return 0;
  if (distance >= segment.length) return 1;

  let low = 0;
  let high = lengths.length - 1;
  while (low < high - 1) {
    const mid = (low + high) >> 1;
    if (lengths[mid] < distance) low = mid;
    else high = mid;
  }
  const span = lengths[high] - lengths[low];
  const fraction = span > 0 ? (distance - lengths[low]) / span : 0;
  return (low + fraction) / (lengths.length - 1);
}

function pointOnSegment(segment: PathSegment, distance: number): MotionPathPoint {
  if (segment.type === 'L') {
    const f = segment.length > 0 ? Math.max(0, Math.min(1, distance / segment.length)) : 0;
    return {
      x: segment.startX + (segment.endX - segment.startX) * f,
      y: segment.startY + (segment.endY - segment.startY) * f,
      angle: (Math.atan2(segment.endY - segment.startY, segment.endX - segment.startX) * 180) / Math.PI,
    };
  }

  const [c1x, c1y, c2x, c2y, x1, y1] = segment.points;
  const t = tAtDistance(segment, distance);
  let dx = cubicDerivative(segment.startX, c1x, c2x, x1, t);
  let dy = cubicDerivative(segment.startY, c1y, c2y, y1, t);

  // The derivative vanishes where a control point coincides with an end point;
  // use the chord direction toward the next distinct point instead.
  if (Math.hypot(dx, dy) < 1e-9) {
    const nudge = t < 0.5 ? Math.min(1, t + 1e-3) : Math.max(0, t - 1e-3);
    const nx = cubicPoint(segment.startX, c1x, c2x, x1, nudge);
    const ny = cubicPoint(segment.startY, c1y, c2y, y1, nudge);
    const px = cubicPoint(segment.startX, c1x, c2x, x1, t);
    const py = cubicPoint(segment.startY, c1y, c2y, y1, t);
    dx = t < 0.5 ? nx - px : px - nx;
    dy = t < 0.5 ? ny - py : py - ny;
  }

  return {
    x: cubicPoint(segment.startX, c1x, c2x, x1, t),
    y: cubicPoint(segment.startY, c1y, c2y, y1, t),
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

/**
 * The point `distance` along a run of segments (`segments[start]` up to, not
 * including, `segments[end]`), clamped to the run.
 */
export function pointAtDistance(
  segments: PathSegment[],
  distance: number,
  start = 0,
  end = segments.length
): MotionPathPoint {
  if (end <= start) return { x: 0, y: 0, angle: 0 };

  let accumulated = 0;
  for (let i = start; i < end; i++) {
    const segment = segments[i];
    if (accumulated + segment.length >= distance || i === end - 1) {
      return pointOnSegment(segment, distance - accumulated);
    }
    accumulated += segment.length;
  }

  // Unreachable: the loop always returns on the last segment.
  return { x: 0, y: 0, angle: 0 };
}

/**
 * Get the point and tangent angle at normalized progress (0-1) along a path,
 * measured by arc length.
 */
export function getPointAtProgress(pathData: string, progress: number): MotionPathPoint {
  const { segments, totalLength } = parsePath(pathData);
  return pointAtDistance(segments, Math.max(0, Math.min(1, progress)) * totalLength);
}

/**
 * Clear the path cache (useful for memory management).
 */
export function clearPathCache(): void {
  pathCache.clear();
}

/**
 * Get total length of a path.
 */
export function getPathLength(pathData: string): number {
  return parsePath(pathData).totalLength;
}
