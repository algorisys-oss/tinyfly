import type { AnimationState, AnimatableValue } from '../../engine'

/**
 * Minimal WebGL render target.
 *
 * CLAUDE.md lists WebGL as a supported target, and until now no adapter existed.
 * This one is deliberately small: every target is a textured or solid-coloured
 * quad with a transform, opacity and tint. That covers the same ground as the
 * Canvas adapter for the common case — moving, scaling, rotating, fading
 * rectangles and images — on the GPU.
 *
 * It is not a scene graph and not a sprite engine. Paths, text and gradients
 * are out of scope; use the Canvas or SVG adapter for those.
 *
 * Like every adapter, it knows nothing about time. The engine hands it values;
 * it draws them.
 */

export interface WebGLTarget {
  /** Centre position, in pixels from the top-left of the canvas */
  x: number
  y: number
  width: number
  height: number
  /** 0..1 */
  opacity?: number
  /** Degrees, clockwise */
  rotate?: number
  scale?: number
  scaleX?: number
  scaleY?: number
  /** Transform pivot as a percentage of the quad (default 50/50) */
  originX?: number
  originY?: number
  /** Solid colour as #rgb / #rrggbb, used when no texture is set */
  fill?: string
  /** Optional texture image */
  texture?: TexImageSource
}

const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform mat3 u_matrix;
varying vec2 v_texCoord;
void main() {
  vec3 position = u_matrix * vec3(a_position, 1.0);
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec4 u_color;
uniform sampler2D u_texture;
uniform bool u_useTexture;
uniform float u_opacity;
varying vec2 v_texCoord;
void main() {
  vec4 color = u_useTexture ? texture2D(u_texture, v_texCoord) : u_color;
  gl_FragColor = vec4(color.rgb, color.a * u_opacity);
}
`

/** Properties the adapter applies directly to a target. */
const NUMERIC_PROPERTIES = new Set([
  'x',
  'y',
  'width',
  'height',
  'opacity',
  'rotate',
  'rotateZ',
  'scale',
  'scaleX',
  'scaleY',
  'originX',
  'originY',
  'motionPathX',
  'motionPathY',
  'motionPathRotate',
])

export class WebGLAdapter {
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private positionBuffer: WebGLBuffer
  private texCoordBuffer: WebGLBuffer
  private textures = new Map<string, WebGLTexture>()

  private targets = new Map<string, WebGLTarget>()
  /** Base positions, so x/y animate as offsets like the other adapters */
  private basePositions = new Map<string, { x: number; y: number }>()

  private locations: {
    position: number
    texCoord: number
    matrix: WebGLUniformLocation | null
    color: WebGLUniformLocation | null
    texture: WebGLUniformLocation | null
    useTexture: WebGLUniformLocation | null
    opacity: WebGLUniformLocation | null
  }

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl
    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)

    this.locations = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      texCoord: gl.getAttribLocation(this.program, 'a_texCoord'),
      matrix: gl.getUniformLocation(this.program, 'u_matrix'),
      color: gl.getUniformLocation(this.program, 'u_color'),
      texture: gl.getUniformLocation(this.program, 'u_texture'),
      useTexture: gl.getUniformLocation(this.program, 'u_useTexture'),
      opacity: gl.getUniformLocation(this.program, 'u_opacity'),
    }

    // A unit quad, reused for every target; the transform matrix does the rest.
    this.positionBuffer = createBuffer(gl, [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    this.texCoordBuffer = createBuffer(gl, [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
  }

  registerTarget(id: string, target: WebGLTarget): void {
    this.targets.set(id, target)
    this.basePositions.set(id, { x: target.x, y: target.y })
  }

  unregisterTarget(id: string): void {
    this.targets.delete(id)
    this.basePositions.delete(id)
    const texture = this.textures.get(id)
    if (texture) {
      this.gl.deleteTexture(texture)
      this.textures.delete(id)
    }
  }

  getTarget(id: string): WebGLTarget | undefined {
    return this.targets.get(id)
  }

  clearTargets(): void {
    for (const id of [...this.targets.keys()]) this.unregisterTarget(id)
  }

  /** Apply engine state to the registered targets. */
  applyState(state: AnimationState): void {
    for (const [targetId, properties] of state.values) {
      const target = this.targets.get(targetId)
      if (!target) continue

      const base = this.basePositions.get(targetId) ?? { x: 0, y: 0 }

      for (const [property, value] of properties) {
        this.applyProperty(target, base, property, value)
      }
    }
  }

  private applyProperty(
    target: WebGLTarget,
    base: { x: number; y: number },
    property: string,
    value: AnimatableValue
  ): void {
    if (typeof value === 'number') {
      if (property === 'x' || property === 'motionPathX') {
        target.x = base.x + value
        return
      }
      if (property === 'y' || property === 'motionPathY') {
        target.y = base.y + value
        return
      }
      if (property === 'rotateZ' || property === 'motionPathRotate') {
        target.rotate = value
        return
      }
      if (NUMERIC_PROPERTIES.has(property)) {
        ;(target as unknown as Record<string, number>)[property] = value
        return
      }
    }

    if (typeof value === 'string' && property === 'fill') {
      target.fill = value
    }
  }

  /** Draw every registered target. */
  render(): void {
    const gl = this.gl
    const { width, height } = gl.canvas

    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(this.program)

    bindAttribute(gl, this.positionBuffer, this.locations.position)
    bindAttribute(gl, this.texCoordBuffer, this.locations.texCoord)

    for (const [id, target] of this.targets) {
      this.drawTarget(id, target, width, height)
    }
  }

  private drawTarget(id: string, target: WebGLTarget, canvasWidth: number, canvasHeight: number): void {
    const gl = this.gl
    const matrix = quadMatrix(target, canvasWidth, canvasHeight)

    gl.uniformMatrix3fv(this.locations.matrix, false, matrix)
    gl.uniform1f(this.locations.opacity, target.opacity ?? 1)

    if (target.texture) {
      gl.bindTexture(gl.TEXTURE_2D, this.textureFor(id, target.texture))
      gl.uniform1i(this.locations.useTexture, 1)
      gl.uniform1i(this.locations.texture, 0)
    } else {
      gl.uniform1i(this.locations.useTexture, 0)
      const [r, g, b] = parseColor(target.fill ?? '#ffffff')
      gl.uniform4f(this.locations.color, r, g, b, 1)
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  private textureFor(id: string, source: TexImageSource): WebGLTexture {
    const existing = this.textures.get(id)
    if (existing) return existing

    const gl = this.gl
    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)

    this.textures.set(id, texture)
    return texture
  }

  /** Release GL resources. */
  destroy(): void {
    this.clearTargets()
    this.gl.deleteProgram(this.program)
    this.gl.deleteBuffer(this.positionBuffer)
    this.gl.deleteBuffer(this.texCoordBuffer)
  }
}

/**
 * Build the 3x3 matrix that maps the unit quad to the target's on-screen box,
 * in clip space. Column-major, as WebGL expects.
 */
export function quadMatrix(
  target: WebGLTarget,
  canvasWidth: number,
  canvasHeight: number
): Float32Array {
  const scaleX = (target.scale ?? target.scaleX ?? 1) * target.width
  const scaleY = (target.scale ?? target.scaleY ?? 1) * target.height

  const originX = (target.originX ?? 50) / 100
  const originY = (target.originY ?? 50) / 100

  const radians = ((target.rotate ?? 0) * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  // 1. Shift the quad so its pivot sits at the origin.
  // 2. Scale to the target's size, rotate, then move into place.
  // 3. Convert pixels to clip space (-1..1, y flipped).
  const pivotX = -originX
  const pivotY = -originY

  const a = cos * scaleX
  const b = sin * scaleX
  const c = -sin * scaleY
  const d = cos * scaleY

  const tx = target.x + a * pivotX + c * pivotY
  const ty = target.y + b * pivotX + d * pivotY

  const sx = 2 / canvasWidth
  const sy = -2 / canvasHeight

  return new Float32Array([
    a * sx, b * sy, 0,
    c * sx, d * sy, 0,
    tx * sx - 1, ty * sy + 1, 1,
  ])
}

/** Parse #rgb / #rrggbb into 0..1 components. Unknown input renders white. */
export function parseColor(color: string): [number, number, number] {
  const hex = color.trim().replace('#', '')

  if (hex.length === 3) {
    return [
      Number.parseInt(hex[0] + hex[0], 16) / 255,
      Number.parseInt(hex[1] + hex[1], 16) / 255,
      Number.parseInt(hex[2] + hex[2], 16) / 255,
    ]
  }

  if (hex.length === 6) {
    return [
      Number.parseInt(hex.slice(0, 2), 16) / 255,
      Number.parseInt(hex.slice(2, 4), 16) / 255,
      Number.parseInt(hex.slice(4, 6), 16) / 255,
    ]
  }

  return [1, 1, 1]
}

function createProgram(gl: WebGLRenderingContext, vertex: string, fragment: string): WebGLProgram {
  const program = gl.createProgram()
  if (!program) throw new Error('WebGLAdapter: could not create a program')

  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertex))
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragment))
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`WebGLAdapter: program link failed — ${gl.getProgramInfoLog(program)}`)
  }

  return program
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('WebGLAdapter: could not create a shader')

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`WebGLAdapter: shader compile failed — ${gl.getShaderInfoLog(shader)}`)
  }

  return shader
}

function createBuffer(gl: WebGLRenderingContext, data: number[]): WebGLBuffer {
  const buffer = gl.createBuffer()
  if (!buffer) throw new Error('WebGLAdapter: could not create a buffer')

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
  return buffer
}

function bindAttribute(gl: WebGLRenderingContext, buffer: WebGLBuffer, location: number): void {
  if (location < 0) return
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.enableVertexAttribArray(location)
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
}
