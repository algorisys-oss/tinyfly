import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { CanvasAdapter } from '../../adapters/canvas'
import { defaultScene3D, type Scene3DElement } from '../stores/scene-store'
import { freeObjectId, isScene3DField, loadedScene3D, scene3dElementTarget, scene3dFieldLabel, scene3dValues, splitScene3DField, toSceneValues } from './scene3d-element'

const element = (): Scene3DElement => ({
  id: 'el-1',
  name: '3D Scene 1',
  type: 'scene3d',
  x: 0,
  y: 0,
  width: 320,
  height: 180,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  scene: defaultScene3D(),
})

describe('3D scene elements', () => {
  it('starts from a scene that loads: a camera, lights, a floor and a box', () => {
    const loaded = loadedScene3D(element())
    expect(loaded.scene.objects.map((o) => o.id)).toEqual(['camera', 'sun', 'ambient', 'floor', 'box'])
    // A fresh copy each time: editing one element's scene never changes another's.
    expect(defaultScene3D()).not.toBe(defaultScene3D())
    expect(defaultScene3D().objects).not.toBe(defaultScene3D().objects)
  })

  it('names fields <object>.<property>, the first dot splitting them', () => {
    expect(splitScene3DField('box.rotateY')).toEqual({ object: 'box', property: 'rotateY' })
    expect(splitScene3DField('tum.arm.right.spread')).toEqual({ object: 'tum', property: 'arm.right.spread' })
    expect(splitScene3DField('rotateY')).toBeNull()
    expect(isScene3DField(element(), 'box.rotateY')).toBe(true)
    expect(isScene3DField(element(), 'activeCamera')).toBe(true)
    expect(isScene3DField(element(), 'ghost.rotateY')).toBe(false)
    expect(isScene3DField(element(), 'opacity')).toBe(false)
    expect(scene3dFieldLabel('box.rotateY')).toBe('box · rotateY')
    expect(scene3dFieldLabel('activeCamera')).toBe('Camera (cut)')
  })

  it("turns the element's values into the scene's: <sceneId>/<object>, and the cut on the scene", () => {
    const values = toSceneValues(element(), [['box.rotateY', 30], ['camera.fov', 50], ['activeCamera', 'camera']])
    expect(values.get('scene/box')?.get('rotateY')).toBe(30)
    expect(values.get('scene/camera')?.get('fov')).toBe(50)
    expect(values.get('scene')?.get('activeCamera')).toBe('camera')
    const state = { values: new Map([['3D Scene 1', new Map<string, number | string>([['box.x', 2], ['opacity', 0.5]])]]) }
    const fromState = scene3dValues(element(), state as never)
    expect(fromState.get('scene/box')?.get('x')).toBe(2)
    expect([...fromState.keys()]).toEqual(['scene/box'])
  })

  it('draws through the Canvas adapter, and its tracks reach the objects (for the Canvas preview and every export)', () => {
    const el = element()
    const draw = (values: Array<[string, number]>) => {
      const ctx = createCanvas(320, 180).getContext('2d') as unknown as CanvasRenderingContext2D
      const adapter = new CanvasAdapter()
      adapter.registerTarget(el.name, scene3dElementTarget(el))
      adapter.applyState({ values: new Map([[el.name, new Map(values)]]), currentTime: 0, playbackState: 'idle', direction: 'forward', loopIteration: 0 } as never)
      adapter.render(ctx)
      return ctx.getImageData(0, 0, 320, 180).data
    }
    const still = draw([])
    const moved = draw([['box.x', 2]])
    expect(still.some((v, i) => v !== moved[i])).toBe(true)
    // Something red (the box) is drawn.
    expect(still.some((v, i) => i % 4 === 0 && v > 150 && still[i + 1] < 90)).toBe(true)
  })

  it('makes new object ids free of dots and clashes', () => {
    const objects = defaultScene3D().objects
    expect(freeObjectId(objects, 'box')).toBe('box-2')
    expect(freeObjectId(objects, 'sphere')).toBe('sphere')
    expect(freeObjectId(objects, 'my.star')).toBe('my-star')
  })
})
