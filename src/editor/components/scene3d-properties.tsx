import { createSignal, For, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { Scene3DElement } from '../stores/scene-store'
import type { CameraObject, CharacterObject3D, LightObject, Material3D, MeshObject, Object3D, Scene3D } from '../../scene-3d'
import { orbitPosition } from '../../scene-3d'
import { DANCE_STYLES, type DanceStyleName } from '../../characters'
import { characterDanceTracks, mergeKeyframes } from '../utils/character-dance'
import { freeObjectId } from '../utils/scene3d-element'

/**
 * The 3D Scene element's properties: its objects (add, pick, remove), the
 * picked object's transform, material, light, camera or character, camera
 * presets and the scene's background and fog. Editing a value that is
 * animated keys it at the playhead; otherwise it changes the scene itself.
 */

interface Props {
  element: Scene3DElement
  store: EditorStore
  update: (changes: Partial<Scene3DElement>) => void
}

const STAR = 'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z'
const PALETTE = ['#ef4444', '#4a9eff', '#f1c40f', '#2ecc71', '#a855f7', '#f97316']

/** The editable transform channels, as track property and where they live in the JSON. */
const TRANSFORM = [
  { key: 'x', label: 'X', step: 0.1 },
  { key: 'y', label: 'Y', step: 0.1 },
  { key: 'z', label: 'Z', step: 0.1 },
  { key: 'rotateX', label: 'Tilt X°', step: 5 },
  { key: 'rotateY', label: 'Turn Y°', step: 5 },
  { key: 'rotateZ', label: 'Roll Z°', step: 5 },
  { key: 'scale', label: 'Scale', step: 0.1 },
] as const

type TransformKey = (typeof TRANSFORM)[number]['key']

function staticValue(object: Object3D, key: TransformKey): number {
  const p = object.position ?? [0, 0, 0]
  const r = object.rotation ?? [0, 0, 0]
  switch (key) {
    case 'x': return p[0]
    case 'y': return p[1]
    case 'z': return p[2]
    case 'rotateX': return r[0]
    case 'rotateY': return r[1]
    case 'rotateZ': return r[2]
    case 'scale': return typeof object.scale === 'number' ? object.scale : (object.scale?.[0] ?? 1)
  }
}

function withStatic(object: Object3D, key: TransformKey, value: number): Object3D {
  const p: [number, number, number] = [...(object.position ?? [0, 0, 0])] as [number, number, number]
  const r: [number, number, number] = [...(object.rotation ?? [0, 0, 0])] as [number, number, number]
  switch (key) {
    case 'x': p[0] = value; return { ...object, position: p }
    case 'y': p[1] = value; return { ...object, position: p }
    case 'z': p[2] = value; return { ...object, position: p }
    case 'rotateX': r[0] = value; return { ...object, rotation: r, quaternion: undefined }
    case 'rotateY': r[1] = value; return { ...object, rotation: r, quaternion: undefined }
    case 'rotateZ': r[2] = value; return { ...object, rotation: r, quaternion: undefined }
    case 'scale': return { ...object, scale: value }
  }
}

const round = (n: number, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits

/** Where a new object goes: the first spot on a ring of rows around the middle with nothing standing near it. */
function freeSpot(objects: Object3D[]): [number, number, number] {
  const standing = objects.filter((o) => o.kind === 'mesh' || o.kind === 'character').filter((o) => !(o.kind === 'mesh' && (o as MeshObject).geometry.type === 'plane'))
  for (let row = 0; row < 6; row++) {
    for (const column of [0, 1, -1, 2, -2, 3, -3]) {
      const spot: [number, number, number] = [column * 1.5, 0, -row * 1.5]
      const taken = standing.some((o) => Math.hypot((o.position?.[0] ?? 0) - spot[0], (o.position?.[2] ?? 0) - spot[2]) < 1.2)
      if (!taken) return spot
    }
  }
  return [0, 0, 0]
}

export const Scene3DProperties: Component<Props> = (props) => {
  const [picked, setPicked] = createSignal<string>('')
  const [danceStyle, setDanceStyle] = createSignal<DanceStyleName>('disco')

  const scene = () => props.element.scene
  const object = () => scene().objects.find((o) => o.id === picked()) ?? scene().objects.find((o) => o.kind === 'mesh' || o.kind === 'character') ?? scene().objects[0]
  const setScene = (next: Scene3D) => props.update({ scene: next })
  const replaceObject = (id: string, next: Object3D) => setScene({ ...scene(), objects: scene().objects.map((o) => (o.id === id ? next : o)) })

  /** Tracks on this element for one object property (by name or id). */
  const track = (property: string) => {
    props.store.timelineVersion()
    return (props.store.state.timeline?.tracks ?? []).find(
      (t) => (t.target === props.element.name || t.target === props.element.id) && t.property === property
    )
  }
  const animated = (property: string): number | undefined => {
    props.store.timelineVersion()
    const state = props.store.state.timeline?.getStateAtTime(props.store.currentTime())
    for (const key of [props.element.name, props.element.id]) {
      const value = state?.values.get(key)?.get(property)
      if (typeof value === 'number') return value
    }
    return undefined
  }
  const shown = (o: Object3D, key: TransformKey) => animated(`${o.id}.${key}`) ?? staticValue(o, key)

  /** An edit keys the value at the playhead once it is animated, else changes the scene. */
  const setTransform = (o: Object3D, key: TransformKey, raw: string) => {
    const value = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(value)) return
    if (track(`${o.id}.${key}`)) props.store.keyValuesAtPlayhead(props.element.name, { [`${o.id}.${key}`]: value })
    else replaceObject(o.id, withStatic(o, key, value))
  }
  const keyTransform = (o: Object3D) => {
    props.store.keyValuesAtPlayhead(
      props.element.name,
      Object.fromEntries(TRANSFORM.map(({ key }) => [`${o.id}.${key}`, shown(o, key)]))
    )
  }

  const add = (kind: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'star' | 'character' | 'light') => {
    const objects = scene().objects
    const id = freeObjectId(objects, kind)
    const count = objects.filter((o) => o.kind === 'mesh').length
    const at = freeSpot(objects)
    let added: Object3D
    let materials = scene().materials ?? {}
    if (kind === 'character') {
      added = { id, kind: 'character', position: [at[0], 0, at[2]], character: { look: 'clean', skin: '#f2c49b', ink: '#e2e8f0' } } satisfies CharacterObject3D
    } else if (kind === 'light') {
      added = { id, kind: 'light', light: 'point', color: '#ffd166', intensity: 0.8, position: [0, 2.5, 1.5], range: 8 } satisfies LightObject
    } else {
      const geometry: MeshObject['geometry'] =
        kind === 'box' ? { type: 'box', size: [1, 1, 1] }
        : kind === 'sphere' ? { type: 'sphere', radius: 0.5, segments: 24 }
        : kind === 'cylinder' ? { type: 'cylinder', radius: 0.4, height: 1, segments: 24 }
        : kind === 'cone' ? { type: 'cone', radius: 0.5, height: 1, segments: 24 }
        : kind === 'torus' ? { type: 'torus', radius: 0.45, tube: 0.15, segments: 32 }
        : { type: 'extrude', path: STAR, depth: 0.25, width: 1 }
      const material: Material3D = { color: PALETTE[count % PALETTE.length], shading: 'toon', outline: { width: 2, color: '#0f172a' } }
      materials = { ...materials, [id]: material }
      added = { id, kind: 'mesh', geometry, material: id, position: [at[0], kind === 'torus' ? 0.6 : 0.5, at[2]] }
    }
    setScene({ ...scene(), materials, objects: [...objects, added] })
    setPicked(id)
  }

  const remove = (o: Object3D) => {
    if (o.id === scene().camera) return
    setScene({ ...scene(), objects: scene().objects.filter((x) => x.id !== o.id && x.parent !== o.id) })
    setPicked('')
  }

  const material = (o: MeshObject): Material3D => scene().materials?.[o.material] ?? { color: '#ffffff' }
  const setMaterial = (o: MeshObject, changes: Partial<Material3D>) =>
    setScene({ ...scene(), materials: { ...scene().materials, [o.material]: { ...material(o), ...changes } } })

  const cameraPreset = (preset: 'front' | 'three-quarter' | 'side' | 'top') => {
    const camera = scene().objects.find((o) => o.id === scene().camera) as CameraObject | undefined
    if (!camera) return
    const target: [number, number, number] = camera.lookAt ?? [0, 0.6, 0]
    const angles = { front: [0, 12], 'three-quarter': [35, 22], side: [90, 10], top: [0, 80] }[preset]
    replaceObject(camera.id, { ...camera, position: orbitPosition(target, angles[0], angles[1], 7) as [number, number, number], lookAt: target })
  }

  const danceFromPlayhead = (o: CharacterObject3D) => {
    const style = DANCE_STYLES[danceStyle()]
    const start = Math.round(props.store.currentTime())
    const tracks = characterDanceTracks({ style: danceStyle(), bpm: style.bpm, start, hands: false, height: o.height ?? 1.7, x: o.position?.[0] ?? 0 })
    const prefixed = tracks.map((t) => ({ property: `${o.id}.${t.property}`, keyframes: t.keyframes }))
    props.store.replaceTracks(props.element.name, mergeKeyframes(props.store.state.timeline?.tracks ?? [], props.element.name, prefixed))
  }

  // A cut is one key: the active camera's id holds until the next key.
  const cutHere = (camera: CameraObject) => props.store.keyValuesAtPlayhead(props.element.name, { activeCamera: camera.id })

  return (
    <div class="property-section">
      <h4>3D Scene</h4>
      <div class="property-row scene3d-objects">
        <label>Objects</label>
        <select value={object()?.id ?? ''} onChange={(e) => setPicked((e.target as HTMLSelectElement).value)}>
          <For each={scene().objects}>{(o) => <option value={o.id}>{o.id} ({o.kind === 'mesh' ? (o as MeshObject).geometry.type : o.kind === 'light' ? `${(o as LightObject).light} light` : o.kind})</option>}</For>
        </select>
      </div>
      <div class="property-row scene3d-add">
        <label>Add</label>
        <div class="scene3d-buttons">
          <button onClick={() => add('box')}>Box</button>
          <button onClick={() => add('sphere')}>Sphere</button>
          <button onClick={() => add('cylinder')}>Cylinder</button>
          <button onClick={() => add('cone')}>Cone</button>
          <button onClick={() => add('torus')}>Ring</button>
          <button onClick={() => add('star')}>Star</button>
          <button onClick={() => add('character')}>Character</button>
          <button onClick={() => add('light')}>Light</button>
        </div>
      </div>

      <Show when={object()}>
        {(current) => (
          <>
            <h4>
              {current().id}
              <Show when={current().id !== scene().camera}>
                <button class="scene3d-remove" title="Remove this object" onClick={() => remove(current())}>✕</button>
              </Show>
            </h4>
            <Show when={current().kind !== 'light' || (current() as LightObject).light !== 'ambient'}>
              <For each={TRANSFORM}>
                {(field) => (
                  <div class="property-row" title={track(`${current().id}.${field.key}`) ? 'Animated: a change keys it at the playhead' : undefined}>
                    <label>{field.label}{track(`${current().id}.${field.key}`) ? ' ◆' : ''}</label>
                    <input type="number" step={field.step} value={round(shown(current(), field.key))} onChange={(e) => setTransform(current(), field.key, e.currentTarget.value)} />
                  </div>
                )}
              </For>
              <button class="secondary-button" onClick={() => keyTransform(current())}>◆ Key transform at playhead</button>
            </Show>

            <Show when={current().kind === 'mesh'}>
              <div class="property-row">
                <label>Colour</label>
                <input type="color" value={material(current() as MeshObject).color} onInput={(e) => setMaterial(current() as MeshObject, { color: e.currentTarget.value })} />
              </div>
              <div class="property-row">
                <label>Shading</label>
                <select value={material(current() as MeshObject).shading ?? 'lambert'} onChange={(e) => setMaterial(current() as MeshObject, { shading: e.currentTarget.value as Material3D['shading'] })}>
                  <option value="toon">Toon</option>
                  <option value="lambert">Smooth</option>
                  <option value="flat">Flat</option>
                  <option value="unlit">Unlit</option>
                </select>
              </div>
              <div class="property-row checkbox-row">
                <label>Ink outline</label>
                <input
                  type="checkbox"
                  checked={!!material(current() as MeshObject).outline}
                  onChange={(e) => setMaterial(current() as MeshObject, { outline: e.currentTarget.checked ? { width: 2, color: '#0f172a' } : undefined })}
                />
              </div>
            </Show>

            <Show when={current().kind === 'light'}>
              <div class="property-row">
                <label>Colour</label>
                <input type="color" value={(current() as LightObject).color} onInput={(e) => replaceObject(current().id, { ...(current() as LightObject), color: e.currentTarget.value })} />
              </div>
              <div class="property-row">
                <label>Intensity</label>
                <input type="number" step="0.1" min="0" value={(current() as LightObject).intensity} onChange={(e) => replaceObject(current().id, { ...(current() as LightObject), intensity: Number(e.currentTarget.value) })} />
              </div>
            </Show>

            <Show when={current().kind === 'camera'}>
              <Show when={(current() as CameraObject).projection === 'perspective'}>
                <div class="property-row">
                  <label>Field of view°</label>
                  <input type="number" step="1" min="5" max="170" value={(current() as CameraObject & { fov: number }).fov} onChange={(e) => replaceObject(current().id, { ...(current() as CameraObject), fov: Number(e.currentTarget.value) } as CameraObject)} />
                </div>
              </Show>
              <Show when={current().id !== scene().camera}>
                <button class="secondary-button" onClick={() => setScene({ ...scene(), camera: current().id })}>Look through this camera</button>
              </Show>
              <button class="secondary-button" title="An activeCamera key at the playhead: the shot changes here" onClick={() => cutHere(current() as CameraObject)}>✂ Cut to this camera at playhead</button>
            </Show>

            <Show when={current().kind === 'character'}>
              <div class="property-row">
                <label>Look</label>
                <select
                  value={(current() as CharacterObject3D).look === 'solid' ? 'solid' : String((current() as CharacterObject3D).character?.look ?? 'clean')}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    const c = current() as CharacterObject3D
                    replaceObject(c.id, value === 'solid' ? { ...c, look: 'solid' } : { ...c, look: 'pen', character: { ...c.character, look: value } })
                  }}
                >
                  <option value="clean">Clean (pens)</option>
                  <option value="pencil">Pencil (pens)</option>
                  <option value="silhouette">Silhouette (pens)</option>
                  <option value="solid">Solid</option>
                </select>
              </div>
              <div class="property-row">
                <label>Dance</label>
                <select value={danceStyle()} onChange={(e) => setDanceStyle(e.currentTarget.value as DanceStyleName)}>
                  <For each={Object.entries(DANCE_STYLES)}>{([name, style]) => <option value={name}>{style.label}</option>}</For>
                </select>
              </div>
              <button class="secondary-button" onClick={() => danceFromPlayhead(current() as CharacterObject3D)}>🕺 Dance from playhead</button>
            </Show>
          </>
        )}
      </Show>

      <h4>Camera</h4>
      <div class="property-row scene3d-add">
        <label>View</label>
        <div class="scene3d-buttons">
          <button onClick={() => cameraPreset('front')}>Front</button>
          <button onClick={() => cameraPreset('three-quarter')}>¾</button>
          <button onClick={() => cameraPreset('side')}>Side</button>
          <button onClick={() => cameraPreset('top')}>Top</button>
        </div>
      </div>

      <h4>Scene</h4>
      <div class="property-row">
        <label>Background</label>
        <input type="color" value={scene().background && scene().background !== 'transparent' ? scene().background : '#1e293b'} onInput={(e) => setScene({ ...scene(), background: e.currentTarget.value })} />
      </div>
      <div class="property-row checkbox-row">
        <label>Fog</label>
        <input
          type="checkbox"
          checked={!!scene().fog}
          onChange={(e) => setScene({ ...scene(), fog: e.currentTarget.checked ? { color: scene().background ?? '#1e293b', near: 8, far: 20 } : undefined })}
        />
      </div>
      <p class="property-hint">Objects animate by tracks on this element named object.property (box.rotateY). Edit a value, move the playhead, edit again, or key the transform.</p>
    </div>
  )
}
