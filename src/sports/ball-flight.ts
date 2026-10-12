import type { Track } from '../engine/types'
import type { Vec3 } from '../engine/math'

export interface BallFlightOptions {
  target: string
  id?: string
  start: number
  end: number
  from: Vec3
  to: Vec3
  /** Height above the straight chord at halfway, in scene units. */
  arc?: number
  /** Sideways displacement at halfway, in scene units. */
  curve?: number
  /** Key spacing in ms, default 40. Contact endpoints are always included. */
  every?: number
}

export function finiteVector(value: Vec3, name: string): void {
  if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) throw new Error(`${name}: expected three finite coordinates`)
}

export function sampleTimes(start: number, end: number, every = 40, contacts: number[] = []): number[] {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) throw new Error('sampleTimes: expected finite ordered nonnegative times')
  if (!Number.isFinite(every) || every < 16 || every > 1000) throw new Error('sampleTimes: every must be between 16 and 1000 ms')
  if ((end - start) / every > 20000) throw new Error('sampleTimes: too many samples')
  const times = new Set([start, end, ...contacts.filter(t => t >= start && t <= end && Number.isFinite(t))])
  for (let t = start + every; t < end; t += every) times.add(t)
  return [...times].sort((a, b) => a - b)
}

/** A pedagogical arc, not a physics simulation. Pure and suitable for any sport. */
export function ballFlightPoint(options: BallFlightOptions, time: number): Vec3 {
  validateFlight(options)
  if (!Number.isFinite(time)) throw new Error('ballFlightPoint: time must be finite')
  const u = Math.max(0, Math.min(1, (time - options.start) / (options.end - options.start)))
  const bump = 4 * u * (1 - u)
  const dx = options.to[0] - options.from[0]
  const dz = options.to[2] - options.from[2]
  const length = Math.hypot(dx, dz) || 1
  return [
    options.from[0] + dx * u - dz / length * (options.curve ?? 0) * bump,
    options.from[1] + (options.to[1] - options.from[1]) * u + (options.arc ?? 0) * bump,
    options.from[2] + dz * u + dx / length * (options.curve ?? 0) * bump,
  ]
}

function validateFlight(options: BallFlightOptions): void {
  if (!options.target?.trim()) throw new Error('ballFlight: target is required')
  finiteVector(options.from, 'ballFlight.from')
  finiteVector(options.to, 'ballFlight.to')
  if (!Number.isFinite(options.start) || !Number.isFinite(options.end) || options.start < 0 || options.end <= options.start) throw new Error('ballFlight: end must be greater than start, both finite and nonnegative')
  if (!Number.isFinite(options.arc ?? 0) || (options.arc ?? 0) < 0 || !Number.isFinite(options.curve ?? 0)) throw new Error('ballFlight: arc must be finite and nonnegative; curve must be finite')
}

/** Ordinary numeric tracks. Use several flights with shared endpoints for bounces/throws. */
export function ballFlightTracks(options: BallFlightOptions): Track[] {
  validateFlight(options)
  const times = sampleTimes(options.start, options.end, options.every)
  const points = times.map(time => ballFlightPoint(options, time))
  return ['x', 'y', 'z'].map((property, axis) => ({
    id: `${options.id ?? 'flight'}-${property}`, target: options.target, property,
    keyframes: times.map((time, index) => ({ time, value: points[index][axis] })),
  }))
}
