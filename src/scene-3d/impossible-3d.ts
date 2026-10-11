import type { MeshObject, OrthographicCamera } from './scene-types'

export interface PenroseTriangle3DOptions {
  /** Object ids start with this (default `penrose`) */
  id?: string
  /** The beams' length, metres (default 4) */
  length?: number
  /** The beams' thickness, metres (default 0.8) */
  thickness?: number
  /** The material key for the beams (default `penrose`) */
  material?: string
  /** Where the figure's first corner goes (default the origin) */
  position?: [number, number, number]
  /** The camera's distance from the figure's middle, metres (default 20) */
  distance?: number
}

/**
 * The Penrose triangle in a 3D scene, as the sculptures do it: three square
 * beams along x, up y and along z, each starting where the last ends, the
 * last ending one (1, 1, 1) diagonal from where the first begins. From the
 * orthographic camera returned, looking down that diagonal, the ends meet on
 * screen and the loop closes; from anywhere else it is three beams. Add the
 * objects to a scene with a material of that name, and the camera (or any
 * camera placed along the diagonal); animate `rotateY` on a group round it
 * to break and remake the illusion.
 */
export function penroseTriangle3D(options: PenroseTriangle3DOptions = {}): { objects: MeshObject[]; camera: OrthographicCamera } {
  const id = options.id ?? 'penrose'
  const L = options.length ?? 4
  const t = options.thickness ?? 0.8
  const material = options.material ?? 'penrose'
  const [ox, oy, oz] = options.position ?? [0, 0, 0]
  const h = t / 2
  const beam = (suffix: string, min: [number, number, number], max: [number, number, number]): MeshObject => ({
    id: `${id}-${suffix}`,
    kind: 'mesh',
    geometry: { type: 'box', size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] },
    material,
    position: [ox + (min[0] + max[0]) / 2, oy + (min[1] + max[1]) / 2, oz + (min[2] + max[2]) / 2],
  })
  // The first beam starts half a thickness early, so the third's end cap lands inside its silhouette.
  const objects = [
    beam('x', [-h, -h, -h], [L - h, h, h]),
    beam('y', [L - h, -h, -h], [L + h, L - h, h]),
    beam('z', [L - h, L - h, -h], [L + h, L + h, L]),
  ]
  const middle: [number, number, number] = [ox + (2 * L) / 3, oy + L / 3, oz + L / 3]
  const d = (options.distance ?? 20) / Math.sqrt(3)
  const camera: OrthographicCamera = {
    id: `${id}-camera`,
    kind: 'camera',
    projection: 'orthographic',
    height: L * 1.6,
    near: 0.1,
    far: (options.distance ?? 20) * 3,
    position: [middle[0] + d, middle[1] + d, middle[2] + d],
    lookAt: middle,
  }
  return { objects, camera }
}
