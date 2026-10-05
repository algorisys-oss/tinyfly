import type { PreparedMesh } from '../load-scene'
import type { ResolvedMesh, ResolvedScene3D } from '../resolve-scene'
import { parseColor } from '../shading'
import { normalMatrix3, packLights, surfaceUniforms } from './gl-data'
import { OUTLINE_FRAGMENT, OUTLINE_VERTEX, SURFACE_FRAGMENT, SURFACE_VERTEX } from './shaders'

/**
 * Draws a resolved 3D scene with WebGL2: the same frame the Canvas 2D
 * renderer paints, but with a depth buffer (shapes that cut through each
 * other are drawn right), light per pixel (smooth curves, toon bands, fog per
 * pixel) and ink outlines by the inverted hull. Opaque meshes first, then
 * see-through ones far to near.
 *
 * Added objects drawn whole (a character in its pen look, its shadow) are not
 * meshes: they go on `overlay`, a 2D canvas laid over this one, after the
 * meshes (so in front of them). Characters in the solid look are meshes and
 * sort properly.
 *
 * Works on a page canvas or an OffscreenCanvas in a Worker. Not in Node
 * (there is no WebGL2 there): headless video uses the Canvas 2D renderer.
 */
export class WebGL2Renderer {
  private readonly gl: WebGL2RenderingContext
  private readonly surface: Program
  private readonly outline: Program
  private readonly buffers = new WeakMap<PreparedMesh, MeshBuffers>()
  private readonly overlay?: CanvasRenderingContext2D

  constructor(gl: WebGL2RenderingContext, options: { overlay?: CanvasRenderingContext2D } = {}) {
    this.gl = gl
    this.overlay = options.overlay
    this.surface = createProgram(gl, SURFACE_VERTEX, SURFACE_FRAGMENT)
    this.outline = createProgram(gl, OUTLINE_VERTEX, OUTLINE_FRAGMENT)
  }

  render(frame: ResolvedScene3D): void {
    const gl = this.gl
    const width = gl.drawingBufferWidth
    const height = gl.drawingBufferHeight
    gl.viewport(0, 0, width, height)
    const background = frame.background && frame.background !== 'transparent' ? parseColor(frame.background) : null
    gl.clearColor(background?.[0] ?? 0, background?.[1] ?? 0, background?.[2] ?? 0, background ? 1 : 0)
    gl.clearDepth(1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.CULL_FACE)
    gl.frontFace(gl.CCW)

    const opaque = frame.meshes.filter((m) => m.opacity >= 1)
    const eye = frame.camera.position
    const distance = (m: ResolvedMesh) => Math.hypot(m.world[12] - eye[0], m.world[13] - eye[1], m.world[14] - eye[2])
    const clear = frame.meshes.filter((m) => m.opacity < 1).sort((p, q) => distance(q) - distance(p) || p.objectIndex - q.objectIndex)

    // Ink first, behind: the hulls only show past the surfaces' edges.
    gl.disable(gl.BLEND)
    gl.depthMask(true)
    for (const mesh of opaque) if (mesh.material.outline) this.drawOutline(frame, mesh, width, height)
    for (const mesh of opaque) this.drawSurface(frame, mesh)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.depthMask(false)
    for (const mesh of clear) this.drawSurface(frame, mesh)
    gl.depthMask(true)
    gl.disable(gl.BLEND)

    if (this.overlay && frame.drawables.length > 0) {
      const ctx = this.overlay
      ctx.save()
      ctx.setTransform(ctx.canvas.width / frame.width, 0, 0, ctx.canvas.height / frame.height, 0, 0)
      ctx.clearRect(0, 0, frame.width, frame.height)
      for (const drawable of frame.drawables) {
        ctx.save()
        drawable.draw(ctx, frame)
        ctx.restore()
      }
      ctx.restore()
    } else if (this.overlay) {
      this.overlay.clearRect(0, 0, this.overlay.canvas.width, this.overlay.canvas.height)
    }
  }

  private drawSurface(frame: ResolvedScene3D, mesh: ResolvedMesh): void {
    const gl = this.gl
    const program = this.surface
    gl.useProgram(program.program)
    if (mesh.material.doubleSided) gl.disable(gl.CULL_FACE)
    else {
      gl.enable(gl.CULL_FACE)
      gl.cullFace(gl.BACK)
    }
    this.bindMesh(program, mesh.mesh)
    const u = program.uniform
    gl.uniformMatrix4fv(u('u_model'), false, mesh.world)
    gl.uniformMatrix4fv(u('u_view'), false, frame.camera.view)
    gl.uniformMatrix4fv(u('u_projection'), false, frame.camera.projection)
    gl.uniformMatrix3fv(u('u_normalMatrix'), false, normalMatrix3(mesh.world))
    const lights = packLights(frame.lights)
    gl.uniform1i(u('u_lightCount'), lights.count)
    gl.uniform1iv(u('u_lightKind'), lights.kind)
    gl.uniform3fv(u('u_lightColor'), lights.color)
    gl.uniform1fv(u('u_lightIntensity'), lights.intensity)
    gl.uniform3fv(u('u_lightPosition'), lights.position)
    gl.uniform3fv(u('u_lightDirection'), lights.direction)
    gl.uniform1fv(u('u_lightRange'), lights.range)
    gl.uniform2fv(u('u_lightCone'), lights.cone)
    const surface = surfaceUniforms(mesh.material, mesh.color, mesh.opacity)
    gl.uniform3fv(u('u_color'), surface.color)
    gl.uniform1f(u('u_opacity'), surface.opacity)
    gl.uniform1i(u('u_shading'), surface.shading)
    gl.uniform1f(u('u_bands'), surface.bands)
    gl.uniform3fv(u('u_eye'), frame.camera.position)
    gl.uniform3fv(u('u_forward'), frame.camera.forward)
    gl.uniform1i(u('u_orthographic'), frame.camera.orthographic ? 1 : 0)
    gl.uniform1i(u('u_fog'), frame.fog ? 1 : 0)
    if (frame.fog) {
      gl.uniform3fv(u('u_fogColor'), parseColor(frame.fog.color))
      gl.uniform2f(u('u_fogRange'), frame.fog.near, frame.fog.far)
    }
    gl.drawElements(gl.TRIANGLES, mesh.mesh.indices.length, gl.UNSIGNED_INT, 0)
  }

  private drawOutline(frame: ResolvedScene3D, mesh: ResolvedMesh, width: number, height: number): void {
    const gl = this.gl
    const program = this.outline
    const ink = mesh.material.outline!
    gl.useProgram(program.program)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.FRONT)
    this.bindMesh(program, mesh.mesh)
    const u = program.uniform
    gl.uniformMatrix4fv(u('u_model'), false, mesh.world)
    gl.uniformMatrix4fv(u('u_view'), false, frame.camera.view)
    gl.uniformMatrix4fv(u('u_projection'), false, frame.camera.projection)
    gl.uniformMatrix3fv(u('u_normalMatrix'), false, normalMatrix3(mesh.world))
    // The width is in the frame's px; the drawing buffer may be larger (device pixels).
    gl.uniform2f(u('u_viewport'), width, height)
    gl.uniform1f(u('u_width'), ink.width * (width / frame.width))
    const [r, g, b] = parseColor(ink.color)
    gl.uniform4f(u('u_ink'), r, g, b, 1)
    gl.drawElements(gl.TRIANGLES, mesh.mesh.indices.length, gl.UNSIGNED_INT, 0)
    gl.cullFace(gl.BACK)
  }

  /** Upload a mesh once; bind its buffers to the program's attributes. */
  private bindMesh(program: Program, mesh: PreparedMesh): void {
    const gl = this.gl
    let buffers = this.buffers.get(mesh)
    if (!buffers) {
      const position = gl.createBuffer()!
      gl.bindBuffer(gl.ARRAY_BUFFER, position)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW)
      const normal = gl.createBuffer()!
      gl.bindBuffer(gl.ARRAY_BUFFER, normal)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW)
      const index = gl.createBuffer()!
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(mesh.indices), gl.STATIC_DRAW)
      buffers = { position, normal, index }
      this.buffers.set(mesh, buffers)
    }
    const attribute = (name: string, buffer: WebGLBuffer) => {
      const location = gl.getAttribLocation(program.program, name)
      if (location < 0) return
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(location)
      gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0)
    }
    attribute('a_position', buffers.position)
    attribute('a_normal', buffers.normal)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index)
  }

  /** Release the programs (mesh buffers go with their meshes). */
  destroy(): void {
    this.gl.deleteProgram(this.surface.program)
    this.gl.deleteProgram(this.outline.program)
  }
}

interface MeshBuffers {
  position: WebGLBuffer
  normal: WebGLBuffer
  index: WebGLBuffer
}

interface Program {
  program: WebGLProgram
  uniform: (name: string) => WebGLUniformLocation | null
}

function createProgram(gl: WebGL2RenderingContext, vertex: string, fragment: string): Program {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(`scene-3d webgl: shader failed to compile — ${gl.getShaderInfoLog(shader)}`)
    return shader
  }
  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`scene-3d webgl: program failed to link — ${gl.getProgramInfoLog(program)}`)
  const locations = new Map<string, WebGLUniformLocation | null>()
  return {
    program,
    uniform: (name) => {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name))
      return locations.get(name)!
    },
  }
}
