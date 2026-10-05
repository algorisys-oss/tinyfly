/**
 * Small, pure 3D math for rotations and transforms: vectors, quaternions and
 * 4×4 matrices as plain number arrays (JSON as they are). Grouped by kind, so
 * `quat.multiply` and `mat4.multiply` read as what they are.
 */
export * as vec3 from './vec3'
export * as quat from './quat'
export * as mat4 from './mat4'
export type { Vec3 } from './vec3'
export type { Quat } from './quat'
export type { Mat4 } from './mat4'
