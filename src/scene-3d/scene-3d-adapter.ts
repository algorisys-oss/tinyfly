import type { AnimationState } from '../engine/types'
import type { LoadedScene3D } from './load-scene'
import { resolveScene3D, type SceneValues } from './resolve-scene'
import { drawResolvedScene, type Renderer3D } from './canvas-2d-renderer'

/**
 * Plays 3D scenes from a timeline, like the other adapters: `applyState`
 * takes the engine's values, `render` hands each scene's resolved frame to
 * the renderer. Knows nothing about time.
 *
 * ```js
 * const scene = loadScene3D(sceneJson)
 * const adapter = new Scene3DAdapter(new Canvas2DRenderer(ctx), { width: 800, height: 450 })
 * adapter.registerScene(scene)
 * timeline.onUpdate = (state) => { adapter.applyState(state); adapter.render() }
 * ```
 */
export class Scene3DAdapter {
  private readonly renderer: Renderer3D
  private width: number
  private height: number
  private readonly scenes = new Map<string, LoadedScene3D>()
  private values: SceneValues = new Map()
  private readonly valuesAt?: (time: number) => SceneValues

  /** `valuesAt`: the values at another time (`(t) => timeline.getStateAtTime(t).values`), for trails */
  constructor(renderer: Renderer3D, options: { width: number; height: number; valuesAt?: (time: number) => SceneValues }) {
    this.renderer = renderer
    this.width = options.width
    this.height = options.height
    this.valuesAt = options.valuesAt
  }

  /** Add a scene; its tracks address `<scene.id>/<objectId>`. */
  registerScene(scene: LoadedScene3D): void {
    this.scenes.set(scene.scene.id, scene)
  }

  unregisterScene(id: string): void {
    this.scenes.delete(id)
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
  }

  applyState(state: Pick<AnimationState, 'values'> & { currentTime?: number }): void {
    this.values = state.values
    this.time = state.currentTime ?? this.time
  }

  private time = 0

  render(): void {
    for (const scene of this.scenes.values()) {
      this.renderer.render(resolveScene3D(scene, this.values, { width: this.width, height: this.height, time: this.time, valuesAt: this.valuesAt }))
    }
  }
}

/**
 * Draw a scene at these animated values in one call: for a headless video
 * scene's `draw(ctx, frame)` (`drawScene3D(ctx, scene, frame.state?.values, frame)`)
 * or a canvas target's custom draw. A video frame carries `stateAt`, so
 * trails find where things were; elsewhere pass `valuesAt`.
 */
export function drawScene3D(
  ctx: CanvasRenderingContext2D,
  scene: LoadedScene3D,
  values: SceneValues | undefined,
  size: {
    width: number
    height: number
    time?: number
    valuesAt?: (time: number) => SceneValues
    stateAt?: (time: number) => { values: SceneValues }
  }
): void {
  const stateAt = size.stateAt
  const valuesAt = size.valuesAt ?? (stateAt && ((time: number) => stateAt(time).values))
  drawResolvedScene(ctx, resolveScene3D(scene, values ?? new Map(), { width: size.width, height: size.height, time: size.time, valuesAt }))
}
