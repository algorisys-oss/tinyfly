import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'

export type ElementType = 'rect' | 'circle' | 'text' | 'image' | 'line' | 'arrow' | 'path' | 'group'

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

export type SceneElement = RectElement | CircleElement | TextElement | ImageElement | LineElement | ArrowElement | PathElement | GroupElement

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
    line: 'Line',
    arrow: 'Arrow',
    path: 'Path',
    group: 'Group',
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

  // Clipboard for copy/paste operations
  const [clipboard, setClipboard] = createSignal<SceneElement[]>([])

  /**
   * Add a new element to the scene.
   */
  function addElement(type: ElementType, overrides: Partial<SceneElement> = {}): SceneElement {
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
      case 'group':
        // Groups are created via groupElements(), not addElement()
        throw new Error('Use groupElements() to create groups')
    }

    setState('elements', (elements) => [...elements, element])
    setState('selectedElementId', id)
    bumpVersion()

    return element
  }

  /**
   * Remove an element from the scene.
   */
  function removeElement(elementId: string): void {
    setState('elements', (elements) => elements.filter((el) => el.id !== elementId))

    if (state.selectedElementId === elementId) {
      setState('selectedElementId', null)
    }

    bumpVersion()
  }

  /**
   * Update an element's properties.
   */
  function updateElement(elementId: string, updates: Partial<SceneElement>): void {
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
    copyElements(elementIds)
    elementIds.forEach((id) => removeElement(id))
    setState('selectedElementId', null)
    setState('selectedElementIds', [])
  }

  /**
   * Paste elements from clipboard.
   */
  function pasteElements(): SceneElement[] {
    const clipboardContent = clipboard()
    if (clipboardContent.length === 0) return []

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
    getParentGroup,
    getTopLevelElements,
    copyElements,
    cutElements,
    pasteElements,
    hasClipboardContent,
  }
}

export type SceneStore = ReturnType<typeof createSceneStore>
