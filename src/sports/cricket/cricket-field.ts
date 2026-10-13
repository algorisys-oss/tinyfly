import { SOFT_CARTOON_CAST } from '../../characters/soft-cartoon-cast'
import { outfitPreset } from '../../characters/wardrobe/outfit-preset'
import type { Object3D, MeshObject } from '../../scene-3d/scene-types'
import type { Vec3 } from '../../engine/math'
import { finiteVector } from '../ball-flight'
import { CRICKET_CASTS, CRICKET_FORMATS, CRICKET_FIELDING_POSITIONS, cricketChoice, type CricketField, type CricketFieldOptions, type CricketPlayer, type CricketPlayerOptions, type CricketRole } from './cricket-types'
import { battingStance, turnToward } from './cricket-motion'
import { CRICKET_MARKING_PROFILES, cricketFieldingOutline } from './cricket-markings'

export const CRICKET_PITCH = Object.freeze({ length: 20.12, width: 3.05, poppingCrease: 1.22, returnCrease: 1.32, stumpHeight: .711, wicketWidth: .2286 })

/** An owned JSON character object, on the existing organic rig. */
export function cricketPlayer(options: CricketPlayerOptions): CricketPlayer {
  if (!options.id?.trim()) throw new Error('cricketPlayer: id is required')
  cricketChoice({ batter: 1, bowler: 1, keeper: 1, fielder: 1, umpire: 1 }, options.role, 'cricketPlayer.role')
  const preset = cricketChoice(SOFT_CARTOON_CAST, options.preset ?? 'youngMan', 'cricketPlayer.preset')
  const format = cricketChoice(CRICKET_FORMATS, options.format ?? 't20', 'cricketPlayer.format')
  const headwear = cricketChoice({ none: 1, cap: 1, 'sun-hat': 1 }, options.headwear ?? 'none', 'cricketPlayer.headwear')
  const child = preset === 'childBoy' || preset === 'childGirl'
  const height = options.height ?? (child ? 1.24 : 1.78)
  if (!Number.isFinite(height) || height < .5 || height > 3) throw new Error('cricketPlayer: height must be between .5 and 3 metres')
  finiteVector(options.position ?? [0, 0, 0], 'cricketPlayer.position')
  const color = options.role === 'umpire' ? '#f5ebd5' : format === 'test' ? '#f5f0df' : options.color ?? '#3577b5'
  // Presets are data. A JSON snapshot also owns nested appearance profiles.
  const character = JSON.parse(JSON.stringify({
    ...SOFT_CARTOON_CAST[preset], ...options.appearance,
    outfit: outfitPreset('casual', { top: 'shirt', shirt: color, trousers: options.role === 'umpire' ? '#405058' : color, bottom: 'trousers', trouserStyle: 'plain', sleeves: 'short', collar: true, tie: null, shoes: 'boots', shoeColor: '#f3ead7' }),
    hat: headwear === 'none' ? null : { style: headwear === 'sun-hat' ? 'sunHat' : 'cap', color },
  }))
  return { id: options.id, name: options.role, kind: 'character', look: 'pen', height, position: [...(options.position ?? [0, 0, 0])], character, pose: options.role === 'batter' ? battingStance() : { turn: options.role === 'keeper' ? 2 : 0 } }
}

function box(id: string, position: Vec3, size: Vec3, material: string, layer = 0): MeshObject {
  return { id, kind: 'mesh', position, geometry: { type: 'box', size }, material, layer }
}

function wicket(end: 'striker' | 'bowler', z: number): Object3D[] {
  const H = CRICKET_PITCH.stumpHeight
  const spacing = (CRICKET_PITCH.wicketWidth - .036) / 2
  return [
    ...[-1, 0, 1].map((side, index) => ({ id: `${end}-stump-${index}`, kind: 'mesh' as const, position: [side * spacing, H / 2, z] as Vec3, geometry: { type: 'cylinder' as const, radius: .018, height: H, segments: 10 }, material: 'wicket' })),
    ...[-1, 1].map((side, index) => box(`${end}-bail-${index}`, [side * spacing / 2, H + .015, z], [.105, .025, .035], 'bail')),
  ]
}

/** Bat + grip as scene meshes. Its parent origin is the upper hand's grip. */
function bat(id: string, scale: number): Object3D[] {
  const objects: Object3D[] = [
    { id, kind: 'group', scale, visible: false },
    box(`${id}-grip`, [0, .1, 0], [.036, .28, .036], 'bat-grip'),
    box(`${id}-blade`, [0, .51, 0], [.108, .54, .055], 'bat-blade'),
    box(`${id}-label`, [0, .41, .029], [.07, .16, .004], 'bat-label'),
  ]
  return objects.map((object, index) => index === 0 ? object : { ...object, parent: id })
}

/** Standard pitch/creases; illustrative field positions and circular boundary. All units are metres. */
export function cricketField(options: CricketFieldOptions = {}): CricketField {
  const format = cricketChoice(CRICKET_FORMATS, options.format ?? 't20', 'cricketField.format')
  const cast = cricketChoice(CRICKET_CASTS, options.cast ?? 'adults', 'cricketField.cast')
  const markingProfile = cricketChoice(CRICKET_MARKING_PROFILES, options.markingProfile ?? 'icc-men', 'cricketField.markingProfile')
  const markings = CRICKET_MARKING_PROFILES[markingProfile]
  const R = options.boundaryRadius ?? 64
  if (!Number.isFinite(R) || R < 24 || R > 250) throw new Error('cricketField: boundaryRadius must be between 24 and 250 metres')
  const id = options.id ?? 'cricket'
  if (!id.trim()) throw new Error('cricketField: id is required')
  const half = CRICKET_PITCH.length / 2
  const fieldingArea = format !== 'test' && markings.fieldingRadius !== null
    ? { radius: markings.fieldingRadius, centres: [[0, 0, -half], [0, 0, half]] as [Vec3, Vec3] }
    : null
  const landmarks: Record<string, Vec3> = {
    'striker-wicket': [0, 0, half], 'bowler-wicket': [0, 0, -half],
    'striker-crease': [0, 0, half - CRICKET_PITCH.poppingCrease],
    'bowler-crease': [0, 0, -half + CRICKET_PITCH.poppingCrease],
  }
  const objects: Object3D[] = [
    { id: 'camera', kind: 'camera', projection: 'perspective', position: [25, 9, 6], lookAt: [0, .65, 0], fov: 48, near: .02, far: Math.max(600, R * 4) },
    { id: 'sun', kind: 'light', light: 'directional', position: [4, 8, 5], intensity: .8, color: '#fff2dd' },
    { id: 'ambient', kind: 'light', light: 'ambient', intensity: .85, color: '#eaf6f4' },
    { id: 'outfield', kind: 'mesh', layer: -4, position: [0, -.04, 0], geometry: { type: 'cylinder', radius: R + 1, height: .06, segments: 80 }, material: 'grass' },
    { id: 'square', kind: 'mesh', layer: -3, geometry: { type: 'plane', size: [8, 25] }, position: [0, .003, 0], material: 'square' },
    { id: 'pitch', kind: 'mesh', layer: -2, geometry: { type: 'plane', size: [CRICKET_PITCH.width, CRICKET_PITCH.length] }, position: [0, .008, 0], material: 'pitch' },
    { id: 'boundary', kind: 'line', layer: -1, closed: true, width: .15, color: '#f8f2db', points: Array.from({ length: 96 }, (_, i) => [Math.cos(i * Math.PI / 48) * R, .022, Math.sin(i * Math.PI / 48) * R] as Vec3) },
  ]
  if (fieldingArea) objects.push({ id: 'fielding-circle', kind: 'line', layer: -1, closed: true, width: .06, color: '#d6e4c8', points: cricketFieldingOutline(fieldingArea) })
  for (const sign of [-1, 1]) {
    const end = sign > 0 ? 'striker' : 'bowler'
    const z = sign * half
    const crease = z - sign * CRICKET_PITCH.poppingCrease
    objects.push(...wicket(end, z))
    const line = (name: string, points: Vec3[]) => objects.push({ id: `${end}-${name}`, kind: 'line', layer: -1, color: '#fffdf0', width: .045, points })
    line('popping-line', [[-markings.poppingCreaseHalfWidth, .02, crease], [markings.poppingCreaseHalfWidth, .02, crease]])
    line('bowling-line', [[-1.32, .02, z], [1.32, .02, z]])
    for (const side of [-1, 1]) line(`return-line-${side < 0 ? 'left' : 'right'}`, [[side * 1.32, .02, crease], [side * 1.32, .02, z + sign * 2.5]])
  }
  const roles: Array<[string, CricketRole, Vec3]> = [
    ['batter', 'batter', [-.38, 0, 9.3]], ['non-striker', 'batter', [-.85, 0, -9.3]],
    ['bowler', 'bowler', [.68, 0, -17]], ['keeper', 'keeper', [0, 0, 11.25]],
    ['fielder', 'fielder', [12, 0, -3]], ['slip', 'fielder', [3.5, 0, 12]],
    ['point', 'fielder', [20, 0, 6]], ['cover', 'fielder', [22, 0, -16]],
    ['mid-off', 'fielder', [9, 0, -25]], ['mid-on', 'fielder', [-9, 0, -25]],
    ['square-leg', 'fielder', [-20, 0, 7]], ['fine-leg', 'fielder', [-20, 0, 35]],
    ['third-man', 'fielder', [23, 0, 35]],
    ['umpire', 'umpire', [0, 0, -12.4]], ['square-umpire', 'umpire', [-15, 0, 8.84]],
  ]
  roles.forEach(([name, role, position], index) => {
    const child = cast === 'children' || cast === 'mixed' && index % 3 === 0
    const preset = cast === 'men' ? 'youngMan' : child ? index % 2 ? 'childGirl' : 'childBoy' : index % 2 ? 'youngWoman' : 'youngMan'
    // Keep outer fielders inside a smaller caller-selected boundary.
    const length = Math.hypot(position[0], position[2])
    const placed: Vec3 = length > R * .88 ? [position[0] * R * .88 / length, 0, position[2] * R * .88 / length] : [...position]
    landmarks[name] = [...placed]
    const player = cricketPlayer({ id: name, role, preset, format, position: placed, color: role === 'batter' ? options.battingColor ?? '#397cb9' : options.fieldingColor ?? '#bf604e' })
    if (Object.hasOwn(CRICKET_FIELDING_POSITIONS, name)) player.name = CRICKET_FIELDING_POSITIONS[name as keyof typeof CRICKET_FIELDING_POSITIONS]
    if (name !== 'batter') {
      const target = name === 'non-striker' || name === 'bowler' ? roles[0][2] : roles.find(([id]) => id === 'bowler')![2]
      player.pose = { turn: turnToward(placed, target) }
    }
    objects.push(player)
  })
  const heightOf = (name: string) => (objects.find(object => object.id === name) as CricketPlayer).height! / 1.78
  objects.push(...bat('bat', heightOf('batter')), ...bat('non-striker-bat', heightOf('non-striker')))
  objects.push({ id: 'ball', kind: 'mesh', position: [0, .075, 0], geometry: { type: 'sphere', radius: .075, segments: 12 }, material: 'ball' })
  objects.push({ id: 'lbw-guide', kind: 'group', visible: false }, { id: 'lbw-projection', kind: 'line', parent: 'lbw-guide', points: [[0, 0, 0], [0, 1, 0]], width: .04, color: '#e9ae38' })
  const outlined = (color: string) => ({ color, shading: 'toon' as const, outline: { color: '#69513a', width: .8 } })
  return { format, boundaryRadius: R, landmarks, markingProfile, fieldingArea, scene: {
    id, formatVersion: 1, camera: 'camera', background: { top: '#c8e5ef', bottom: '#e9efcc' }, ground: 0, objects,
    materials: {
      grass: { color: '#81a95c', shading: 'unlit' }, square: { color: '#a6b76a', shading: 'unlit', doubleSided: true }, pitch: { color: '#ddbd85', shading: 'unlit', doubleSided: true },
      wicket: outlined('#edd99e'), bail: outlined('#bd8c4d'), 'bat-grip': outlined('#385b5c'), 'bat-blade': outlined('#e8c58d'), 'bat-label': outlined('#c34d4c'),
      ball: { color: format === 'test' ? '#b32d36' : '#fff9e7', shading: 'toon', outline: { color: '#9b3840', width: 1 } },
    },
  } }
}
