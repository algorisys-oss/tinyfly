import type { Vec3 } from '../../engine/math'
import type { Object3D } from '../../scene-3d/scene-types'
import { finiteVector } from '../ball-flight'
import { CRICKET_FIELDING_POSITIONS, type CricketField, type CricketFieldingArea, type CricketFieldingPosition, type CricketMarkingProfile } from './cricket-types'

/** MCC 2026 Law 7.3; ICC October 2026 clauses 7.3 and 28.7 (all formats). */
export const CRICKET_MARKING_PROFILES = Object.freeze({
  mcc: Object.freeze({ name: 'MCC', poppingCreaseHalfWidth: 1.83, fieldingRadius: null, summary: 'MCC minimum crease markings. The base Laws do not prescribe a limited-over restriction area.' }),
  'icc-men': Object.freeze({ name: 'ICC men', poppingCreaseHalfWidth: 7.5, fieldingRadius: 27.43, summary: 'ICC men: extended crease markings; ODI/T20 restriction-area arcs have a 27.43 m radius.' }),
  'icc-women': Object.freeze({ name: 'ICC women', poppingCreaseHalfWidth: 7.5, fieldingRadius: 23, summary: 'ICC women: extended crease markings; ODI/T20 restriction-area arcs have a 23 m radius.' }),
} satisfies Record<CricketMarkingProfile, { name: string; poppingCreaseHalfWidth: number; fieldingRadius: number | null; summary: string }>)

/** Draw the ideal region as a sampled closed line; both straight sides are exact. */
export function cricketFieldingOutline(area: CricketFieldingArea): Vec3[] {
  const [a, b] = area.centres
  const length = Math.hypot(b[0] - a[0], b[2] - a[2])
  const axisX = (b[0] - a[0]) / length, axisZ = (b[2] - a[2]) / length
  const points: Vec3[] = []
  for (let end = 0; end < 2; end++) {
    const centre = end === 0 ? b : a
    for (let i = 0; i <= 64; i++) {
      const angle = (end + i / 64) * Math.PI
      const across = Math.cos(angle) * area.radius, along = Math.sin(angle) * area.radius
      points.push([centre[0] + axisZ * across + axisX * along, .018, centre[2] - axisX * across + axisZ * along])
    }
  }
  return points
}

/** Classify an x/z point against the ideal capsule. Its boundary is included.
 * null means the field has no region metadata (Test, MCC or older/custom JSON).
 * This does not adjudicate a player's feet, a powerplay phase or a legal field.
 */
export function cricketFieldingAreaContains(field: CricketField, point: Vec3): boolean | null {
  finiteVector(point, 'cricketFieldingAreaContains.point')
  const area = field.fieldingArea
  if (area == null) return null
  if (!Number.isFinite(area.radius) || area.radius <= 0) throw new Error('cricketFieldingAreaContains: radius must be positive and finite')
  if (!Array.isArray(area.centres) || area.centres.length !== 2) throw new Error('cricketFieldingAreaContains: two centres are required')
  const [a, b] = area.centres
  finiteVector(a, 'cricketFieldingAreaContains.centre'); finiteVector(b, 'cricketFieldingAreaContains.centre')
  const dx = b[0] - a[0], dz = b[2] - a[2], lengthSquared = dx * dx + dz * dz
  const t = lengthSquared ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[2] - a[2]) * dz) / lengthSquared)) : 0
  return Math.hypot(point[0] - a[0] - t * dx, point[2] - a[2] - t * dz) <= area.radius + 1e-9
}

/** Owned setup-position data for stock fielders, suitable for teaching overlays. */
export function cricketFieldingPositions(field: CricketField): CricketFieldingPosition[] {
  return Object.keys(CRICKET_FIELDING_POSITIONS).flatMap(id => {
    const player = field.scene.objects.find(object => object.id === id && object.kind === 'character')
    if (!player) return []
    if (player.parent) throw new Error(`cricketFieldingPositions: '${id}' must be unparented for setup markers`)
    const position: Vec3 = [...(player.position ?? [0, 0, 0])]
    return [{ id, name: player.name ?? CRICKET_FIELDING_POSITIONS[id as keyof typeof CRICKET_FIELDING_POSITIONS], position, inside: cricketFieldingAreaContains(field, position) }]
  })
}

/** Static ground markers for the setup positions; motion and field are untouched. */
export function cricketFieldingOverlay(field: CricketField): Object3D[] {
  if (!field.fieldingArea) return []
  return cricketFieldingPositions(field).map(player => ({
    id: `fielding-review-${player.id}`, name: `${player.name}: ${player.inside ? 'inside' : 'outside'} restriction area`, kind: 'line', closed: true,
    width: .12, color: player.inside ? '#d8eb8a' : '#ee9670',
    points: Array.from({ length: 32 }, (_, i) => [player.position[0] + Math.cos(i * Math.PI / 16) * .7, .06, player.position[2] + Math.sin(i * Math.PI / 16) * .7] as Vec3),
  }))
}
