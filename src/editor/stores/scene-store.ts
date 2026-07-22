import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { measureTextLetters } from '../utils/split-text'

export type ElementType = 'rect' | 'circle' | 'text' | 'image' | 'audio' | 'video' | 'line' | 'arrow' | 'path' | 'group' | 'symbol'

/** Device-frame preset silhouettes. */
export type DeviceVariant = 'phone' | 'landscape' | 'tablet'

// Gradient types
export interface GradientStop {
  offset: number // 0-1
  color: string
}

export interface LinearGradient {
  type: 'linear'
  angle: number // degrees, 0 = left to right, 90 = top to bottom
  stops: GradientStop[]
}

export interface RadialGradient {
  type: 'radial'
  centerX: number // 0-1, relative to element
  centerY: number // 0-1, relative to element
  radius: number // 0-1, relative to element size
  stops: GradientStop[]
}

export type Gradient = LinearGradient | RadialGradient
export type FillValue = string | Gradient

/**
 * Check if a fill value is a gradient.
 */
export function isGradient(fill: FillValue): fill is Gradient {
  return typeof fill === 'object' && fill !== null && 'type' in fill
}

/**
 * Convert a fill value to CSS string.
 */
export function fillToCss(fill: FillValue): string {
  if (typeof fill === 'string') {
    return fill
  }

  if (fill.type === 'linear') {
    const stops = fill.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')
    return `linear-gradient(${fill.angle}deg, ${stops})`
  }

  if (fill.type === 'radial') {
    const stops = fill.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')
    return `radial-gradient(circle at ${fill.centerX * 100}% ${fill.centerY * 100}%, ${stops})`
  }

  return 'transparent'
}

/**
 * Create a default linear gradient.
 */
export function createLinearGradient(color1 = '#4a9eff', color2 = '#2ecc71'): LinearGradient {
  return {
    type: 'linear',
    angle: 90,
    stops: [
      { offset: 0, color: color1 },
      { offset: 1, color: color2 },
    ],
  }
}

/**
 * Create a default radial gradient.
 */
export function createRadialGradient(color1 = '#4a9eff', color2 = '#2ecc71'): RadialGradient {
  return {
    type: 'radial',
    centerX: 0.5,
    centerY: 0.5,
    radius: 0.5,
    stops: [
      { offset: 0, color: color1 },
      { offset: 1, color: color2 },
    ],
  }
}

export interface BaseElement {
  id: string
  type: ElementType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
}

export interface RectElement extends BaseElement {
  type: 'rect'
  fill: FillValue
  stroke: string
  strokeWidth: number
  borderRadius: number
}

export interface CircleElement extends BaseElement {
  type: 'circle'
  fill: FillValue
  stroke: string
  strokeWidth: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  fill: string
  textAlign: 'left' | 'center' | 'right'
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  objectFit: 'contain' | 'cover' | 'fill'
}

export interface AudioElement extends BaseElement {
  type: 'audio'
  /** Audio source (URL or data URI). */
  src: string
  /** Volume 0..1. */
  volume: number
  /** Muted while previewing. */
  muted: boolean
  /** Loop the clip. */
  loop: boolean
  /** Timeline time (ms) at which the audio begins playing. */
  startTime: number
}

export interface VideoElement extends BaseElement {
  type: 'video'
  /** Video source (URL or data URI). */
  src: string
  /** How the frame fits the element box. */
  objectFit: 'contain' | 'cover' | 'fill'
  /** Corner radius in px (rounds the video frame, e.g. a device screen). */
  borderRadius: number
  /** Volume 0..1. */
  volume: number
  /** Muted while previewing. */
  muted: boolean
  /** Loop the clip. */
  loop: boolean
  /** Timeline time (ms) at which the video begins playing. */
  startTime: number
}

export interface LineElement extends BaseElement {
  type: 'line'
  x2: number
  y2: number
  stroke: string
  strokeWidth: number
  lineCap: 'butt' | 'round' | 'square'
}

export interface ArrowElement extends BaseElement {
  type: 'arrow'
  x2: number
  y2: number
  stroke: string
  strokeWidth: number
  headSize: number
  startHead: boolean
  endHead: boolean
}

export interface PathElement extends BaseElement {
  type: 'path'
  /** SVG path data (d attribute) */
  d: string
  fill: FillValue
  stroke: string
  strokeWidth: number
  lineCap: 'butt' | 'round' | 'square'
  lineJoin: 'miter' | 'round' | 'bevel'
  /** Whether the path is closed */
  closed: boolean
}

export interface GroupElement extends BaseElement {
  type: 'group'
  childIds: string[]
}

/**
 * An instance of a reusable {@link SymbolDefinition}. The base transform
 * (x/y/width/height/rotation/opacity) places and sizes the instance; the
 * symbol's contents render scaled from its intrinsic size into that box.
 */
export interface SymbolInstanceElement extends BaseElement {
  type: 'symbol'
  /** References `SymbolDefinition.id` in the project Library. */
  symbolId: string
  /** Reserved for later per-instance property overrides / symbol-swap. */
  overrides?: Record<string, unknown>
}

export type SceneElement = RectElement | CircleElement | TextElement | ImageElement | AudioElement | VideoElement | LineElement | ArrowElement | PathElement | GroupElement | SymbolInstanceElement

export interface SceneState {
  elements: SceneElement[]
  selectedElementId: string | null
  selectedElementIds: string[]  // For multi-selection
}

const DEFAULT_RECT: Omit<RectElement, 'id' | 'name'> = {
  type: 'rect',
  x: 0,
  y: 0,
  width: 60,
  height: 60,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  fill: '#4a9eff',
  stroke: 'transparent',
  strokeWidth: 0,
  borderRadius: 4,
}

const DEFAULT_CIRCLE: Omit<CircleElement, 'id' | 'name'> = {
  type: 'circle',
  x: 0,
  y: 0,
  width: 60,
  height: 60,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  fill: '#2ecc71',
  stroke: 'transparent',
  strokeWidth: 0,
}

const DEFAULT_TEXT: Omit<TextElement, 'id' | 'name'> = {
  type: 'text',
  x: 0,
  y: 0,
  width: 100,
  height: 30,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  text: 'Text',
  fontSize: 16,
  fontFamily: 'system-ui, sans-serif',
  fontWeight: 400,
  fill: '#ffffff',
  textAlign: 'center',
}

const DEFAULT_LINE: Omit<LineElement, 'id' | 'name'> = {
  type: 'line',
  x: 0,
  y: 0,
  x2: 100,
  y2: 0,
  width: 100,
  height: 2,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  stroke: '#ffffff',
  strokeWidth: 2,
  lineCap: 'round',
}

const DEFAULT_ARROW: Omit<ArrowElement, 'id' | 'name'> = {
  type: 'arrow',
  x: 0,
  y: 0,
  x2: 100,
  y2: 0,
  width: 100,
  height: 10,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  stroke: '#ffffff',
  strokeWidth: 2,
  headSize: 10,
  startHead: false,
  endHead: true,
}

const DEFAULT_PATH: Omit<PathElement, 'id' | 'name'> = {
  type: 'path',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  // Simple bezier curve as default
  d: 'M 10 80 Q 50 10 90 80',
  fill: 'transparent',
  stroke: '#4a9eff',
  strokeWidth: 2,
  lineCap: 'round',
  lineJoin: 'round',
  closed: false,
}

const DEFAULT_AUDIO: Omit<AudioElement, 'id' | 'name'> = {
  type: 'audio',
  x: 20,
  y: 20,
  width: 40,
  height: 40,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  src: '',
  volume: 1,
  muted: false,
  loop: false,
  startTime: 0,
}

const DEFAULT_VIDEO: Omit<VideoElement, 'id' | 'name'> = {
  type: 'video',
  x: 60,
  y: 40,
  width: 180,
  height: 120,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  src: '',
  objectFit: 'contain',
  borderRadius: 0,
  volume: 1,
  muted: false,
  loop: false,
  startTime: 0,
}

function generateId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function generateName(type: ElementType, elements: SceneElement[]): string {
  const count = elements.filter((el) => el.type === type).length + 1
  const names: Record<ElementType, string> = {
    rect: 'Rectangle',
    circle: 'Circle',
    text: 'Text',
    image: 'Image',
    audio: 'Audio',
    video: 'Video',
    line: 'Line',
    arrow: 'Arrow',
    path: 'Path',
    group: 'Group',
    symbol: 'Symbol',
  }
  return `${names[type]} ${count}`
}

/**
 * Create a scene store for managing preview elements.
 */
export function createSceneStore() {
  const [state, setState] = createStore<SceneState>({
    elements: [],
    selectedElementId: null,
    selectedElementIds: [],
  })

  // Version counter for reactivity
  const [version, setVersion] = createSignal(0)
  const bumpVersion = () => setVersion((v) => v + 1)

  // Undo/redo integration: the editor store injects a hook that snapshots the
  // full editor state before a mutation. Continuous gestures (drag/resize/rotate)
  // wrap their many updates in begin/endInteraction so they form ONE undo step.
  let historyHook: (() => void) | null = null
  let interactionActive = false
  let interactionSnapshotTaken = false
  const setHistoryHook = (fn: (() => void) | null) => {
    historyHook = fn
  }
  /**
   * Snapshot the current state for undo. During a continuous gesture, exactly one
   * snapshot is taken — on the first mutation — so the whole gesture is one undo
   * step (and a gesture with no mutation records nothing).
   */
  const snapshot = () => {
    if (interactionActive) {
      if (!interactionSnapshotTaken) {
        historyHook?.()
        interactionSnapshotTaken = true
      }
      return
    }
    historyHook?.()
  }
  /** Begin a continuous gesture (drag/resize/rotate) or a compound operation. */
  const beginInteraction = () => {
    interactionActive = true
    interactionSnapshotTaken = false
  }
  /** End the current gesture/compound operation. */
  const endInteraction = () => {
    interactionActive = false
    interactionSnapshotTaken = false
  }

  // Clipboard for copy/paste operations
  const [clipboard, setClipboard] = createSignal<SceneElement[]>([])

  /**
   * Add a new element to the scene.
   */
  function addElement(type: ElementType, overrides: Partial<SceneElement> = {}): SceneElement {
    snapshot()
    const id = generateId()
    // Use override name if provided, otherwise generate one
    const name = overrides.name ?? generateName(type, state.elements)

    let element: SceneElement

    switch (type) {
      case 'rect':
        element = { ...DEFAULT_RECT, ...overrides, id, name } as RectElement
        break
      case 'circle':
        element = { ...DEFAULT_CIRCLE, ...overrides, id, name } as CircleElement
        break
      case 'text':
        element = { ...DEFAULT_TEXT, ...overrides, id, name } as TextElement
        break
      case 'image':
        element = {
          type: 'image',
          id,
          name,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          src: '',
          objectFit: 'contain',
          ...overrides,
        } as ImageElement
        break
      case 'line':
        element = { ...DEFAULT_LINE, ...overrides, id, name } as LineElement
        break
      case 'arrow':
        element = { ...DEFAULT_ARROW, ...overrides, id, name } as ArrowElement
        break
      case 'path':
        element = { ...DEFAULT_PATH, ...overrides, id, name } as PathElement
        break
      case 'audio':
        element = { ...DEFAULT_AUDIO, ...overrides, id, name } as AudioElement
        break
      case 'video':
        element = { ...DEFAULT_VIDEO, ...overrides, id, name } as VideoElement
        break
      case 'group':
        // Groups are created via groupElements(), not addElement()
        throw new Error('Use groupElements() to create groups')
      case 'symbol':
        // Symbol instances are placed from the Library, not via addElement()
        throw new Error('Use the Library / Convert to Symbol flow to place symbol instances')
    }

    setState('elements', (elements) => [...elements, element])
    setState('selectedElementId', id)
    bumpVersion()

    return element
  }

  /**
   * Stamp a device mockup: a dark rounded body, a rounded video "screen" (drop
   * your screen-recording in via its `src`), and a camera cutout. The three
   * elements are created at the top level (video renders on the DOM target /
   * export / player) and multi-selected so they can be moved or grouped as one.
   *
   * The `variant` picks the silhouette; sizing is derived from the canvas so the
   * device fits whatever aspect ratio the project uses.
   */
  function addDeviceFrame(opts: {
    variant?: DeviceVariant
    centerX: number
    centerY: number
    canvasWidth: number
    canvasHeight: number
  }): SceneElement[] {
    // One undo step for the whole device (three elements added below).
    beginInteraction()
    const variant = opts.variant ?? 'phone'
    // Silhouette parameters per variant.
    const spec = {
      phone: { aspect: 0.49, cornerFactor: 0.16, notch: 'pill' as const, label: 'Phone' },
      landscape: { aspect: 0.49, cornerFactor: 0.16, notch: 'dot' as const, label: 'Phone' },
      tablet: { aspect: 0.72, cornerFactor: 0.06, notch: 'dot' as const, label: 'Tablet' },
    }[variant]

    // Long side fits the canvas dimension it runs along; then scale to fit both.
    const landscape = variant === 'landscape'
    const longMax = (landscape ? opts.canvasWidth : opts.canvasHeight) * 0.92
    let longSide = Math.min(longMax, 640)
    let shortSide = Math.round(longSide * spec.aspect)
    let w = landscape ? Math.round(longSide) : shortSide
    let h = landscape ? shortSide : Math.round(longSide)
    const fit = Math.min(1, (opts.canvasWidth * 0.92) / w, (opts.canvasHeight * 0.92) / h)
    w = Math.round(w * fit)
    h = Math.round(h * fit)

    const bx = Math.round(opts.centerX - w / 2)
    const by = Math.round(opts.centerY - h / 2)
    const minSide = Math.min(w, h)
    const bezel = Math.max(5, Math.round(minSide * 0.05))
    const bodyRadius = Math.round(minSide * spec.cornerFactor)
    const screenRadius = Math.max(2, bodyRadius - Math.round(bezel * 0.7))

    const body = addElement('rect', {
      name: `${spec.label} Body`,
      x: bx,
      y: by,
      width: w,
      height: h,
      fill: '#0b0b0f',
      stroke: '#2a2a33',
      strokeWidth: 2,
      borderRadius: bodyRadius,
    })

    const sx = bx + bezel
    const sy = by + bezel
    const screen = addElement('video', {
      name: `${spec.label} Screen`,
      x: sx,
      y: sy,
      width: w - bezel * 2,
      height: h - bezel * 2,
      objectFit: 'cover',
      borderRadius: screenRadius,
      muted: true,
      loop: true,
    })

    // Camera: a wide pill notch for a portrait phone, otherwise a small dot.
    let camera: SceneElement
    if (spec.notch === 'pill') {
      const nw = Math.round(w * 0.36)
      const nh = Math.max(10, Math.round(bezel * 1.5))
      camera = addElement('rect', {
        name: 'Notch',
        x: Math.round(opts.centerX - nw / 2),
        y: sy + 3,
        width: nw,
        height: nh,
        fill: '#0b0b0f',
        stroke: 'transparent',
        strokeWidth: 0,
        borderRadius: Math.round(nh / 2),
      })
    } else {
      const d = Math.max(5, Math.round(bezel * 0.8))
      // Landscape front camera sits on the left short edge; else top-centre.
      const cx = landscape ? bx + Math.round(bezel / 2) + d / 2 : opts.centerX
      const cy = landscape ? opts.centerY : by + Math.round(bezel / 2) + d / 2
      camera = addElement('circle', {
        name: 'Camera',
        x: Math.round(cx - d / 2),
        y: Math.round(cy - d / 2),
        width: d,
        height: d,
        fill: '#1c1c22',
        stroke: 'transparent',
        strokeWidth: 0,
      })
    }

    setState('selectedElementId', screen.id)
    setState('selectedElementIds', [body.id, screen.id, camera.id])
    endInteraction()
    bumpVersion()

    return [body, screen, camera]
  }

  /**
   * Remove an element from the scene.
   */
  function removeElement(elementId: string): void {
    snapshot()
    setState('elements', (elements) => elements.filter((el) => el.id !== elementId))

    if (state.selectedElementId === elementId) {
      setState('selectedElementId', null)
    }

    bumpVersion()
  }

  /** Build a symbol-instance element (not yet added to the scene). */
  function makeSymbolInstance(
    symbolId: string,
    box: { x: number; y: number; width: number; height: number },
    name?: string
  ): SymbolInstanceElement {
    return {
      type: 'symbol',
      id: generateId(),
      name: name ?? generateName('symbol', state.elements),
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      symbolId,
    }
  }

  /** Place an instance of a symbol on the stage and select it. */
  function addSymbolInstance(
    symbolId: string,
    box: { x: number; y: number; width: number; height: number },
    name?: string
  ): SymbolInstanceElement {
    snapshot()
    const instance = makeSymbolInstance(symbolId, box, name)
    setState('elements', (els) => [...els, instance])
    setState('selectedElementId', instance.id)
    setState('selectedElementIds', [instance.id])
    bumpVersion()
    return instance
  }

  /**
   * Replace a set of elements with a single symbol instance (the second half of
   * "Convert to Symbol"). One history step.
   */
  function replaceElementsWithSymbol(
    ids: string[],
    symbolId: string,
    box: { x: number; y: number; width: number; height: number },
    name?: string
  ): SymbolInstanceElement {
    snapshot()
    const idSet = new Set(ids)
    const instance = makeSymbolInstance(symbolId, box, name)
    setState('elements', (els) => [...els.filter((el) => !idSet.has(el.id)), instance])
    setState('selectedElementId', instance.id)
    setState('selectedElementIds', [instance.id])
    bumpVersion()
    return instance
  }

  /**
   * Update an element's properties.
   */
  function updateElement(elementId: string, updates: Partial<SceneElement>): void {
    snapshot()
    setState('elements', (elements) =>
      elements.map((el) => (el.id === elementId ? { ...el, ...updates } as SceneElement : el))
    )
    bumpVersion()
  }

  /**
   * Select an element (single selection clears multi-selection).
   */
  function selectElement(elementId: string | null): void {
    setState('selectedElementId', elementId)
    setState('selectedElementIds', elementId ? [elementId] : [])
  }

  /**
   * Toggle element in multi-selection (for Ctrl/Cmd+click).
   */
  function toggleElementSelection(elementId: string): void {
    const currentIds = [...state.selectedElementIds]
    const index = currentIds.indexOf(elementId)

    if (index === -1) {
      currentIds.push(elementId)
    } else {
      currentIds.splice(index, 1)
    }

    setState('selectedElementIds', currentIds)
    setState('selectedElementId', currentIds.length > 0 ? currentIds[currentIds.length - 1] : null)
    bumpVersion()
  }

  /**
   * Select multiple elements.
   */
  function selectElements(elementIds: string[]): void {
    setState('selectedElementIds', elementIds)
    setState('selectedElementId', elementIds.length > 0 ? elementIds[elementIds.length - 1] : null)
  }

  /**
   * Clear all selection.
   */
  function clearSelection(): void {
    setState('selectedElementId', null)
    setState('selectedElementIds', [])
  }

  /**
   * Move an element in the layer order.
   */
  function moveElement(elementId: string, direction: 'up' | 'down' | 'top' | 'bottom'): void {
    const elements = [...state.elements]
    const index = elements.findIndex((el) => el.id === elementId)
    if (index === -1) return
    snapshot()

    const element = elements[index]
    elements.splice(index, 1)

    switch (direction) {
      case 'up':
        elements.splice(Math.min(index + 1, elements.length), 0, element)
        break
      case 'down':
        elements.splice(Math.max(index - 1, 0), 0, element)
        break
      case 'top':
        elements.push(element)
        break
      case 'bottom':
        elements.unshift(element)
        break
    }

    setState('elements', elements)
    bumpVersion()
  }

  /**
   * Duplicate an element.
   */
  function duplicateElement(elementId: string): SceneElement | null {
    const element = state.elements.find((el) => el.id === elementId)
    if (!element) return null
    snapshot()

    const newId = generateId()
    const newName = `${element.name} copy`
    const newElement = {
      ...element,
      id: newId,
      name: newName,
      x: element.x + 20,
      y: element.y + 20,
    }

    setState('elements', (elements) => [...elements, newElement])
    setState('selectedElementId', newId)
    bumpVersion()

    return newElement
  }

  /**
   * Clear all elements.
   */
  function clearElements(): void {
    setState('elements', [])
    setState('selectedElementId', null)
    setState('selectedElementIds', [])
    bumpVersion()
  }

  /**
   * Copy selected elements to clipboard.
   */
  function copyElements(elementIds: string[]): void {
    const elementsToCopy = state.elements.filter((el) => elementIds.includes(el.id))
    if (elementsToCopy.length === 0) return

    // Deep clone elements for clipboard
    const cloned = elementsToCopy.map((el) => ({ ...el }))
    setClipboard(cloned)
  }

  /**
   * Cut selected elements (copy to clipboard and remove).
   */
  function cutElements(elementIds: string[]): void {
    beginInteraction() // one undo step for the whole cut
    copyElements(elementIds)
    elementIds.forEach((id) => removeElement(id))
    setState('selectedElementId', null)
    setState('selectedElementIds', [])
    endInteraction()
  }

  /**
   * Paste elements from clipboard.
   */
  function pasteElements(): SceneElement[] {
    const clipboardContent = clipboard()
    if (clipboardContent.length === 0) return []
    snapshot()

    const pastedElements: SceneElement[] = []
    const newIds: string[] = []

    clipboardContent.forEach((el) => {
      const newId = generateId()
      const newName = `${el.name} copy`
      const newElement = {
        ...el,
        id: newId,
        name: newName,
        x: el.x + 20,
        y: el.y + 20,
      }
      pastedElements.push(newElement)
      newIds.push(newId)
    })

    setState('elements', (elements) => [...elements, ...pastedElements])
    setState('selectedElementIds', newIds)
    setState('selectedElementId', newIds.length > 0 ? newIds[0] : null)
    bumpVersion()

    return pastedElements
  }

  /**
   * Check if clipboard has content.
   */
  function hasClipboardContent(): boolean {
    return clipboard().length > 0
  }

  /**
   * Group selected elements into a new group.
   */
  function groupElements(elementIds: string[]): GroupElement | null {
    if (elementIds.length < 2) return null

    // Get elements to group
    const elementsToGroup = state.elements.filter((el) => elementIds.includes(el.id))
    if (elementsToGroup.length < 2) return null
    snapshot()

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    elementsToGroup.forEach((el) => {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
      maxX = Math.max(maxX, el.x + el.width)
      maxY = Math.max(maxY, el.y + el.height)
    })

    // Create group
    const groupId = generateId()
    const groupName = generateName('group', state.elements)
    const group: GroupElement = {
      type: 'group',
      id: groupId,
      name: groupName,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      childIds: elementIds,
    }

    // Update child positions to be relative to group
    const updatedElements = state.elements.map((el) => {
      if (elementIds.includes(el.id)) {
        return {
          ...el,
          x: el.x - minX,
          y: el.y - minY,
        } as SceneElement
      }
      return el
    })

    // Remove grouped elements from top level and add group
    const newElements = updatedElements.filter((el) => !elementIds.includes(el.id))
    newElements.push(group)

    // Store children inside a separate structure (keep them in elements but mark as grouped)
    // Actually, let's keep them in elements but track via childIds
    // Put children back but they'll be rendered via group
    elementIds.forEach((childId) => {
      const child = updatedElements.find((el) => el.id === childId)
      if (child) {
        newElements.push(child)
      }
    })

    setState('elements', newElements)
    setState('selectedElementId', groupId)
    setState('selectedElementIds', [groupId])
    bumpVersion()

    return group
  }

  /**
   * Ungroup a group element, restoring children to top level.
   */
  function ungroupElement(groupId: string): SceneElement[] | null {
    const group = state.elements.find((el) => el.id === groupId && el.type === 'group') as GroupElement | undefined
    if (!group) return null
    snapshot()

    // Get child elements
    const children = state.elements.filter((el) => group.childIds.includes(el.id))

    // Restore child positions to absolute
    const restoredChildren = children.map((child) => ({
      ...child,
      x: child.x + group.x,
      y: child.y + group.y,
    } as SceneElement))

    // Remove group and update children
    const newElements = state.elements
      .filter((el) => el.id !== groupId && !group.childIds.includes(el.id))
      .concat(restoredChildren)

    setState('elements', newElements)
    setState('selectedElementIds', group.childIds)
    setState('selectedElementId', group.childIds.length > 0 ? group.childIds[0] : null)
    bumpVersion()

    return restoredChildren
  }

  /**
   * Check if an element is part of a group.
   */
  function getParentGroup(elementId: string): GroupElement | null {
    for (const el of state.elements) {
      if (el.type === 'group' && (el as GroupElement).childIds.includes(elementId)) {
        return el as GroupElement
      }
    }
    return null
  }

  /**
   * Get all top-level elements (not inside a group).
   */
  function getTopLevelElements(): SceneElement[] {
    const groupedIds = new Set<string>()
    state.elements.forEach((el) => {
      if (el.type === 'group') {
        (el as GroupElement).childIds.forEach((id) => groupedIds.add(id))
      }
    })
    return state.elements.filter((el) => !groupedIds.has(el.id))
  }

  /**
   * Result of splitting a text element into per-letter elements.
   */
  interface SplitTextResult {
    /** Ids of the created letter elements, in reading order. */
    letterIds: string[]
    /** The characters, in the same order as {@link letterIds}. */
    chars: string[]
  }

  /**
   * Split a text element into one text element per glyph.
   *
   * This mirrors Adobe Animate's "break apart" workflow: the source text is
   * replaced by a series of single-character text elements positioned to
   * reproduce the original layout. Each letter is an ordinary scene element, so
   * it can be animated independently (e.g. staggered entrances) with the same
   * public API used for any other element.
   *
   * Whitespace does not produce an element — it only advances the layout. Returns
   * null when the target is not a (non-empty) text element.
   */
  function splitTextElement(elementId: string): SplitTextResult | null {
    const source = state.elements.find((el) => el.id === elementId)
    if (!source || source.type !== 'text') return null

    const text = source as TextElement
    const letters = measureTextLetters(text)
    if (letters.length === 0) return null

    const letterIds: string[] = []
    const chars: string[] = []
    const letterElements: TextElement[] = letters.map((layout, i) => {
      const id = generateId()
      letterIds.push(id)
      chars.push(layout.char)
      return {
        type: 'text',
        id,
        name: `${text.name} · ${i + 1}`,
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        rotation: 0,
        opacity: text.opacity,
        visible: true,
        locked: false,
        text: layout.char,
        fontSize: text.fontSize,
        fontFamily: text.fontFamily,
        fontWeight: text.fontWeight,
        fill: text.fill,
        textAlign: 'center',
      }
    })

    // Replace the source text element with its letters, preserving overall order.
    const index = state.elements.findIndex((el) => el.id === elementId)
    const next = [...state.elements]
    next.splice(index, 1, ...letterElements)
    setState('elements', next)
    setState('selectedElementId', letterIds[0] ?? null)
    setState('selectedElementIds', letterIds)
    bumpVersion()

    return { letterIds, chars }
  }

  /**
   * Load elements from serialized data.
   */
  function loadElements(elements: SceneElement[]): void {
    setState('elements', elements)
    setState('selectedElementId', null)
    bumpVersion()
  }

  /**
   * Get elements as serializable data.
   */
  function exportElements(): SceneElement[] {
    return [...state.elements]
  }

  // Getter functions (use version() for reactivity in SolidJS components)
  const elements = () => {
    version() // Track for reactivity
    return state.elements
  }

  const selectedElement = () => {
    version() // Track for reactivity
    return state.elements.find((el) => el.id === state.selectedElementId) ?? null
  }

  const elementCount = () => {
    version() // Track for reactivity
    return state.elements.length
  }

  const selectedElementIds = () => {
    version() // Track for reactivity
    return state.selectedElementIds
  }

  const topLevelElements = () => {
    version() // Track for reactivity
    return getTopLevelElements()
  }

  return {
    // State
    state,

    // Computed
    elements,
    selectedElement,
    elementCount,
    selectedElementIds,
    topLevelElements,

    // Actions
    addElement,
    addDeviceFrame,
    addSymbolInstance,
    replaceElementsWithSymbol,
    removeElement,
    updateElement,
    selectElement,
    toggleElementSelection,
    selectElements,
    clearSelection,
    moveElement,
    duplicateElement,
    clearElements,
    loadElements,
    exportElements,
    groupElements,
    ungroupElement,
    setHistoryHook,
    beginInteraction,
    endInteraction,
    splitTextElement,
    getParentGroup,
    getTopLevelElements,
    copyElements,
    cutElements,
    pasteElements,
    hasClipboardContent,
  }
}

export type SceneStore = ReturnType<typeof createSceneStore>
