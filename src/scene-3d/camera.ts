import { mat4, vec3, type Mat4, type Vec3 } from '../engine/math'

/**
 * Camera matrices and camera moves, as pure functions. A camera looks down
 * its own -z with +y up, as in WebGL and glTF.
 */

/** A view matrix looking from `eye` at `target`, level (when looking straight up or down, -z is "up" instead). */
export function lookAtView(eye: Vec3, target: Vec3): Mat4 {
  const forward = vec3.normalize(vec3.subtract(target, eye))
  const up: Vec3 = Math.abs(forward[1]) > 0.9999 ? [0, 0, -1] : [0, 1, 0]
  return mat4.lookAt(eye, target, up)
}

/**
 * A point on a sphere around `target`: `yaw` degrees around the up axis (0 is
 * in front, +z), `pitch` degrees up from level, `distance` metres away. Animate
 * yaw for an orbit, pitch for a crane, distance for a dolly.
 */
export function orbitPosition(target: Vec3, yaw: number, pitch: number, distance: number): Vec3 {
  const y = (yaw * Math.PI) / 180
  const p = (pitch * Math.PI) / 180
  return [target[0] + distance * Math.cos(p) * Math.sin(y), target[1] + distance * Math.sin(p), target[2] + distance * Math.cos(p) * Math.cos(y)]
}

/** `eye` moved toward `target` by `amount` metres (negative moves away); it never passes the target. */
export function dollyPosition(eye: Vec3, target: Vec3, amount: number): Vec3 {
  const offset = vec3.subtract(eye, target)
  const distance = vec3.length(offset)
  if (distance === 0) return eye
  const next = Math.max(1e-3, distance - amount)
  return vec3.add(target, vec3.scale(offset, next / distance))
}

/** The projection for a camera: perspective by vertical field of view, or orthographic by view height. */
export function projectionMatrix(
  camera: { projection: 'perspective'; fov: number; near: number; far: number } | { projection: 'orthographic'; height: number; near: number; far: number },
  aspect: number
): Mat4 {
  if (camera.projection === 'perspective') return mat4.perspective(camera.fov, aspect, camera.near, camera.far)
  const h = camera.height / 2
  return mat4.orthographic(-h * aspect, h * aspect, -h, h, camera.near, camera.far)
}
