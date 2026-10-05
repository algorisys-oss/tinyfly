import type { Scene3D, Object3D } from './scene-types'

/** The animated channels that two kinds of track can both drive: only one kind per object. */
const CHANNELS: Array<{ name: string; vector: string; components: string[] }> = [
  { name: 'position', vector: 'position', components: ['x', 'y', 'z'] },
  { name: 'rotation', vector: 'quaternion', components: ['rotateX', 'rotateY', 'rotateZ'] },
]

/**
 * Problems with a scene, as plain sentences (empty when it is fine): ids,
 * parents, the camera, materials, sizes. With `tracks`, also a channel
 * animated two ways at once (x and position, rotateY and quaternion), which
 * would otherwise need a hidden rule to pick a winner.
 */
export function validateScene3D(scene: Scene3D, tracks: ReadonlyArray<{ target: string; property: string }> = []): string[] {
  const errors: string[] = []
  const seen = new Map<string, Object3D>()
  for (const object of scene.objects) {
    if (!object.id) errors.push('an object has no id')
    else if (seen.has(object.id)) errors.push(`two objects share the id "${object.id}"`)
    if (object.parent !== undefined && !seen.has(object.parent)) {
      errors.push(`"${object.id}" has parent "${object.parent}", which must be an earlier object`)
    }
    if (object.quaternion && object.quaternion.length !== 4) errors.push(`"${object.id}": a quaternion has four numbers`)
    if (object.kind === 'mesh') {
      if (!scene.materials?.[object.material]) errors.push(`"${object.id}" uses material "${object.material}", which is not in materials`)
      const g = object.geometry
      const sizes =
        g.type === 'box' || g.type === 'plane' ? g.size
        : g.type === 'torus' ? [g.radius, g.tube]
        : g.type === 'sphere' ? [g.radius]
        : g.type === 'extrude' ? [g.depth, g.width ?? 1]
        : [g.radius, g.height]
      if (g.type === 'extrude' && !(typeof g.path === 'string' && /^\s*[Mm]/.test(g.path))) errors.push(`"${object.id}": an extrude needs a path that starts with M`)
      if (!sizes.every((size) => Number.isFinite(size) && size > 0)) errors.push(`"${object.id}": a ${g.type}'s sizes must be positive`)
    }
    if (object.kind === 'camera') {
      if (!(object.near > 0 && object.far > object.near)) errors.push(`camera "${object.id}": near must be above 0 and far beyond it`)
      if (object.projection === 'perspective' && !(object.fov > 0 && object.fov < 180)) errors.push(`camera "${object.id}": fov is between 0 and 180 degrees`)
      if (object.projection === 'orthographic' && !(object.height > 0)) errors.push(`camera "${object.id}": height must be positive`)
    }
    if (object.id) seen.set(object.id, object)
  }
  const camera = seen.get(scene.camera)
  if (!camera) errors.push(`the scene's camera "${scene.camera}" is not one of its objects`)
  else if (camera.kind !== 'camera') errors.push(`the scene's camera "${scene.camera}" is a ${camera.kind}, not a camera`)
  if (scene.fog && !(scene.fog.far > scene.fog.near)) errors.push('fog: far must be beyond near')

  const animated = new Map<string, Set<string>>()
  for (const track of tracks) {
    if (!track.target.startsWith(`${scene.id}/`)) continue
    const id = track.target.slice(scene.id.length + 1)
    if (!animated.has(id)) animated.set(id, new Set())
    animated.get(id)!.add(track.property)
  }
  for (const [id, properties] of animated) {
    if (!seen.has(id)) errors.push(`a track animates "${scene.id}/${id}", which is not in the scene`)
    for (const channel of CHANNELS) {
      if (properties.has(channel.vector) && channel.components.some((c) => properties.has(c))) {
        errors.push(`"${id}": its ${channel.name} is animated both by ${channel.vector} and by ${channel.components.join(' / ')}; use one`)
      }
    }
  }
  return errors
}
