import { onMount, onCleanup, createEffect, createSignal, createMemo, For, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { DOMAdapter } from '../../adapters/dom'
import { CanvasAdapter, type CanvasTarget } from '../../adapters/canvas'
import { SVGAdapter } from '../../adapters/svg'
import type { EditorStore } from '../stores/editor-store'
import { fillToCss, type SceneStore, type SceneElement, type RectElement, type CircleElement, type TextElement, type LineElement, type ArrowElement, type PathElement, type ImageElement, type GroupElement } from '../stores/scene-store'
import { parsePathForEditing, buildPathString, updatePathPoint, getControlLines, type EditablePoint, type EditableCommand } from '../utils/path-editor'
import './preview-panel.css'

type RendererType = 'dom' | 'canvas' | 'svg'

interface PreviewPanelProps {
  store: EditorStore
  sceneStore: SceneStore
}

interface DragState {
  elementId: string
  startMouseX: number
  startMouseY: number
  startElementX: number
  startElementY: number
  startX2?: number
  startY2?: number
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'

interface ResizeState {
  elementId: string
  handle: ResizeHandle
  startMouseX: number
  startMouseY: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  // For line/arrow endpoints
  startX2?: number
  startY2?: number
}

interface RotateState {
  elementId: string
  centerX: number
  centerY: number
  startAngle: number
  startRotation: number
}

interface PathPointDragState {
  elementId: string
  pointId: string
  startMouseX: number
  startMouseY: number
  startPointX: number
  startPointY: number
  commands: EditableCommand[]
  points: EditablePoint[]
}

export const PreviewPanel: Component<PreviewPanelProps> = (props) => {
  let containerRef: HTMLDivElement | undefined
  let canvasRef: HTMLDivElement | undefined
  let canvas2dRef: HTMLCanvasElement | undefined
  let svgRef: SVGSVGElement | undefined
  let adapter: DOMAdapter | undefined
  let canvasAdapter: CanvasAdapter | undefined
  let svgAdapter: SVGAdapter | undefined
  let animationFrameId: number | undefined
  let lastTime: number | undefined

  // Renderer type
  const [rendererType, setRendererType] = createSignal<RendererType>('dom')

  // Drag state
  const [dragState, setDragState] = createSignal<DragState | null>(null)
  const [isDragging, setIsDragging] = createSignal(false)

  // Resize state
  const [resizeState, setResizeState] = createSignal<ResizeState | null>(null)
  const [isResizing, setIsResizing] = createSignal(false)

  // Rotate state
  const [rotateState, setRotateState] = createSignal<RotateState | null>(null)
  const [isRotating, setIsRotating] = createSignal(false)

  // Path point editing state
  const [pathPointDragState, setPathPointDragState] = createSignal<PathPointDragState | null>(null)
  const [isDraggingPathPoint, setIsDraggingPathPoint] = createSignal(false)

  // Parse selected path element for editing
  const selectedPathData = createMemo(() => {
    const element = props.sceneStore.selectedElement()
    if (!element || element.type !== 'path') return null
    const pathEl = element as PathElement
    return parsePathForEditing(pathEl.d)
  })

  // Create adapters
  adapter = new DOMAdapter()
  canvasAdapter = new CanvasAdapter()
  svgAdapter = new SVGAdapter()

  // Function to register elements with DOM adapter
  const registerDOMElements = () => {
    if (!adapter || !canvasRef) return

    adapter.clearTargets()
    const elements = props.sceneStore.elements()

    elements.forEach((element) => {
      const el = canvasRef!.querySelector(`[data-element-id="${element.id}"]`) as HTMLElement
      if (el) {
        adapter!.registerTarget(element.name, el)
        adapter!.registerTarget(element.id, el)
      }
    })
  }

  // Function to register elements with Canvas adapter
  const registerCanvasElements = () => {
    if (!canvasAdapter) return

    canvasAdapter.clearTargets()
    const elements = props.sceneStore.elements()

    elements.forEach((element) => {
      const target = sceneElementToCanvasTarget(element)
      if (target) {
        // Register by name (primary) for rendering
        canvasAdapter!.registerTarget(element.name, target)
        // Register by ID as alias (for lookup only, won't render twice)
        canvasAdapter!.registerTarget(element.id, target, element.name)
      }
    })
  }

  // Function to register elements with SVG adapter
  const registerSVGElements = () => {
    if (!svgAdapter || !svgRef) return

    svgAdapter.clearTargets()
    const elements = props.sceneStore.elements()

    elements.forEach((element) => {
      const el = svgRef!.querySelector(`[data-element-id="${element.id}"]`) as SVGElement
      if (el) {
        svgAdapter!.registerTarget(element.name, el)
        svgAdapter!.registerTarget(element.id, el)
      }
    })
  }

  // Convert scene element to canvas target
  const sceneElementToCanvasTarget = (element: SceneElement): CanvasTarget | null => {
    const base = {
      x: element.x,
      y: element.y,
      opacity: element.opacity,
      rotate: element.rotation,
    }

    switch (element.type) {
      case 'rect': {
        const rect = element as RectElement
        return {
          ...base,
          type: 'rect',
          width: rect.width,
          height: rect.height,
          fillStyle: typeof rect.fill === 'string' ? rect.fill : undefined,
          strokeStyle: rect.stroke,
          lineWidth: rect.strokeWidth,
          borderRadius: rect.borderRadius,
        }
      }
      case 'circle': {
        const circle = element as CircleElement
        return {
          ...base,
          type: 'circle',
          x: circle.x + circle.width / 2,
          y: circle.y + circle.height / 2,
          radius: Math.min(circle.width, circle.height) / 2,
          fillStyle: typeof circle.fill === 'string' ? circle.fill : undefined,
          strokeStyle: circle.stroke,
          lineWidth: circle.strokeWidth,
        }
      }
      case 'text': {
        const text = element as TextElement
        return {
          ...base,
          type: 'text',
          text: text.text,
          fontSize: text.fontSize,
          fontFamily: text.fontFamily,
          fontWeight: text.fontWeight,
          fillStyle: typeof text.fill === 'string' ? text.fill : undefined,
        }
      }
      case 'line': {
        const line = element as LineElement
        return {
          ...base,
          type: 'line',
          x2: line.x2,
          y2: line.y2,
          strokeStyle: line.stroke,
          lineWidth: line.strokeWidth,
          lineCap: line.lineCap as CanvasLineCap,
        }
      }
      case 'path': {
        const path = element as PathElement
        return {
          ...base,
          type: 'path',
          d: path.d,
          fillStyle: typeof path.fill === 'string' ? path.fill : undefined,
          strokeStyle: path.stroke,
          lineWidth: path.strokeWidth,
        }
      }
      default:
        return null
    }
  }

  // Render canvas elements (call after registering or updating)
  const renderCanvas = () => {
    if (!canvasAdapter || !canvas2dRef) return
    const ctx = canvas2dRef.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas2dRef.width, canvas2dRef.height)
      canvasAdapter.render(ctx)
    }
  }

  // Apply state based on current renderer
  const applyStateToRenderer = () => {
    const renderer = rendererType()

    if (props.store.state.timeline) {
      const state = props.store.state.timeline.getStateAtTime(props.store.currentTime())

      if (renderer === 'dom' && adapter) {
        adapter.applyState(state)
      } else if (renderer === 'canvas' && canvasAdapter) {
        canvasAdapter.applyState(state)
        renderCanvas()
      } else if (renderer === 'svg' && svgAdapter) {
        svgAdapter.applyState(state)
      }
    } else if (renderer === 'canvas') {
      // No animation, but still render canvas elements
      renderCanvas()
    }
  }

  // Register elements after initial mount
  onMount(() => {
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
      registerDOMElements()
      registerCanvasElements()
      registerSVGElements()
    }, 0)
  })

  // Re-register when elements change or renderer changes
  createEffect(() => {
    // Track elements and renderer for reactivity
    props.sceneStore.elements()
    const renderer = rendererType()

    // Canvas can render immediately for real-time property updates
    if (renderer === 'canvas') {
      registerCanvasElements()
      applyStateToRenderer()
    } else {
      // DOM and SVG need to wait for DOM update before querying elements
      requestAnimationFrame(() => {
        if (renderer === 'dom') {
          registerDOMElements()
        } else if (renderer === 'svg') {
          registerSVGElements()
        }
        applyStateToRenderer()
      })
    }
  })

  // Animation loop
  createEffect(() => {
    const isPlaying = props.store.isPlaying()

    if (isPlaying) {
      lastTime = performance.now()
      const animate = (currentTime: number) => {
        if (!props.store.isPlaying()) return

        const delta = currentTime - (lastTime ?? currentTime)
        lastTime = currentTime

        props.store.tick(delta)

        // Apply state to preview based on renderer type
        applyStateToRenderer()

        animationFrameId = requestAnimationFrame(animate)
      }

      animationFrameId = requestAnimationFrame(animate)
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = undefined
      }
    }
  })

  // Update preview when scrubbing
  createEffect(() => {
    // Track time changes to trigger effect
    props.store.currentTime()
    if (!props.store.isPlaying() && props.store.state.timeline) {
      applyStateToRenderer()
    }
  })

  const handleElementClick = (elementId: string, e: MouseEvent) => {
    e.stopPropagation()
    props.sceneStore.selectElement(elementId)
  }

  const handleCanvasClick = () => {
    if (!isDragging()) {
      props.sceneStore.selectElement(null)
    }
  }

  // Drag handlers
  const handleDragStart = (elementId: string, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const element = props.sceneStore.elements().find((el) => el.id === elementId)
    if (!element || element.locked) return

    // Select the element
    props.sceneStore.selectElement(elementId)

    const state: DragState = {
      elementId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startElementX: element.x,
      startElementY: element.y,
    }

    // For line/arrow elements, also store x2, y2
    if (element.type === 'line' || element.type === 'arrow') {
      const lineEl = element as LineElement | ArrowElement
      state.startX2 = lineEl.x2
      state.startY2 = lineEl.y2
    }

    setDragState(state)
    setIsDragging(false)

    // Add global mouse listeners
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  }

  const handleDragMove = (e: MouseEvent) => {
    const state = dragState()
    if (!state || !canvasRef) return

    const deltaX = e.clientX - state.startMouseX
    const deltaY = e.clientY - state.startMouseY

    // Only start dragging after a small threshold
    if (!isDragging() && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      setIsDragging(true)
    }

    if (!isDragging()) return

    const newX = state.startElementX + deltaX
    const newY = state.startElementY + deltaY

    const element = props.sceneStore.elements().find((el) => el.id === state.elementId)
    if (!element) return

    // For line/arrow, update both endpoints
    if ((element.type === 'line' || element.type === 'arrow') && state.startX2 !== undefined && state.startY2 !== undefined) {
      props.sceneStore.updateElement(state.elementId, {
        x: newX,
        y: newY,
        x2: state.startX2 + deltaX,
        y2: state.startY2 + deltaY,
      })
    } else {
      props.sceneStore.updateElement(state.elementId, { x: newX, y: newY })
    }
  }

  const handleDragEnd = () => {
    // Clean up listeners
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)

    // Reset drag state after a small delay to prevent click firing
    setTimeout(() => {
      setDragState(null)
      setIsDragging(false)
    }, 10)
  }

  // Resize handlers
  const handleResizeStart = (elementId: string, handle: ResizeHandle, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const element = props.sceneStore.elements().find((el) => el.id === elementId)
    if (!element || element.locked) return

    const state: ResizeState = {
      elementId,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: element.x,
      startY: element.y,
      startWidth: element.width,
      startHeight: element.height,
    }

    // For line/arrow elements
    if (element.type === 'line' || element.type === 'arrow') {
      const lineEl = element as LineElement | ArrowElement
      state.startX2 = lineEl.x2
      state.startY2 = lineEl.y2
    }

    setResizeState(state)
    setIsResizing(false)

    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  const handleResizeMove = (e: MouseEvent) => {
    const state = resizeState()
    if (!state) return

    const deltaX = e.clientX - state.startMouseX
    const deltaY = e.clientY - state.startMouseY

    if (!isResizing() && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
      setIsResizing(true)
    }

    if (!isResizing()) return

    const element = props.sceneStore.elements().find((el) => el.id === state.elementId)
    if (!element) return

    // For line/arrow elements, resize means moving endpoints
    if ((element.type === 'line' || element.type === 'arrow') && state.startX2 !== undefined && state.startY2 !== undefined) {
      // 'w' or 'nw' or 'sw' moves start point, 'e' or 'ne' or 'se' moves end point
      if (state.handle === 'w' || state.handle === 'nw' || state.handle === 'sw') {
        props.sceneStore.updateElement(state.elementId, {
          x: state.startX + deltaX,
          y: state.startY + deltaY,
        })
      } else {
        props.sceneStore.updateElement(state.elementId, {
          x2: state.startX2 + deltaX,
          y2: state.startY2 + deltaY,
        })
      }
      return
    }

    // For regular elements, calculate new bounds based on handle
    let newX = state.startX
    let newY = state.startY
    let newWidth = state.startWidth
    let newHeight = state.startHeight
    const minSize = 10

    switch (state.handle) {
      case 'nw': {
        let w = Math.max(minSize, state.startWidth - deltaX)
        let h = Math.max(minSize, state.startHeight - deltaY)
        if (e.shiftKey) {
          // Use the larger proportional change
          const scaleW = w / state.startWidth
          const scaleH = h / state.startHeight
          const scale = Math.min(scaleW, scaleH)
          w = Math.max(minSize, state.startWidth * scale)
          h = Math.max(minSize, state.startHeight * scale)
        }
        newWidth = w
        newHeight = h
        newX = state.startX + state.startWidth - w
        newY = state.startY + state.startHeight - h
        break
      }
      case 'n': {
        let h = Math.max(minSize, state.startHeight - deltaY)
        if (e.shiftKey) {
          const scale = h / state.startHeight
          newWidth = Math.max(minSize, state.startWidth * scale)
          newX = state.startX + (state.startWidth - newWidth) / 2
        }
        newHeight = h
        newY = state.startY + state.startHeight - h
        break
      }
      case 'ne': {
        let w = Math.max(minSize, state.startWidth + deltaX)
        let h = Math.max(minSize, state.startHeight - deltaY)
        if (e.shiftKey) {
          const scaleW = w / state.startWidth
          const scaleH = h / state.startHeight
          const scale = Math.min(scaleW, scaleH)
          w = Math.max(minSize, state.startWidth * scale)
          h = Math.max(minSize, state.startHeight * scale)
        }
        newWidth = w
        newHeight = h
        newY = state.startY + state.startHeight - h
        break
      }
      case 'w': {
        let w = Math.max(minSize, state.startWidth - deltaX)
        if (e.shiftKey) {
          const scale = w / state.startWidth
          newHeight = Math.max(minSize, state.startHeight * scale)
          newY = state.startY + (state.startHeight - newHeight) / 2
        }
        newWidth = w
        newX = state.startX + state.startWidth - w
        break
      }
      case 'e': {
        let w = Math.max(minSize, state.startWidth + deltaX)
        if (e.shiftKey) {
          const scale = w / state.startWidth
          newHeight = Math.max(minSize, state.startHeight * scale)
          newY = state.startY + (state.startHeight - newHeight) / 2
        }
        newWidth = w
        break
      }
      case 'sw': {
        let w = Math.max(minSize, state.startWidth - deltaX)
        let h = Math.max(minSize, state.startHeight + deltaY)
        if (e.shiftKey) {
          const scaleW = w / state.startWidth
          const scaleH = h / state.startHeight
          const scale = Math.min(scaleW, scaleH)
          w = Math.max(minSize, state.startWidth * scale)
          h = Math.max(minSize, state.startHeight * scale)
        }
        newWidth = w
        newHeight = h
        newX = state.startX + state.startWidth - w
        break
      }
      case 's': {
        let h = Math.max(minSize, state.startHeight + deltaY)
        if (e.shiftKey) {
          const scale = h / state.startHeight
          newWidth = Math.max(minSize, state.startWidth * scale)
          newX = state.startX + (state.startWidth - newWidth) / 2
        }
        newHeight = h
        break
      }
      case 'se': {
        let w = Math.max(minSize, state.startWidth + deltaX)
        let h = Math.max(minSize, state.startHeight + deltaY)
        if (e.shiftKey) {
          const scaleW = w / state.startWidth
          const scaleH = h / state.startHeight
          const scale = Math.min(scaleW, scaleH)
          w = Math.max(minSize, state.startWidth * scale)
          h = Math.max(minSize, state.startHeight * scale)
        }
        newWidth = w
        newHeight = h
        break
      }
    }

    props.sceneStore.updateElement(state.elementId, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    })
  }

  const handleResizeEnd = () => {
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)

    setTimeout(() => {
      setResizeState(null)
      setIsResizing(false)
    }, 10)
  }

  // Get resize handles for selected element
  const getResizeHandles = (element: SceneElement) => {
    // Line and arrow have only start/end handles
    if (element.type === 'line' || element.type === 'arrow') {
      const lineEl = element as LineElement | ArrowElement
      return [
        { handle: 'w' as ResizeHandle, x: lineEl.x, y: lineEl.y, cursor: 'move' },
        { handle: 'e' as ResizeHandle, x: lineEl.x2, y: lineEl.y2, cursor: 'move' },
      ]
    }

    // Regular elements have 8 handles
    return [
      { handle: 'nw' as ResizeHandle, x: element.x, y: element.y, cursor: 'nwse-resize' },
      { handle: 'n' as ResizeHandle, x: element.x + element.width / 2, y: element.y, cursor: 'ns-resize' },
      { handle: 'ne' as ResizeHandle, x: element.x + element.width, y: element.y, cursor: 'nesw-resize' },
      { handle: 'w' as ResizeHandle, x: element.x, y: element.y + element.height / 2, cursor: 'ew-resize' },
      { handle: 'e' as ResizeHandle, x: element.x + element.width, y: element.y + element.height / 2, cursor: 'ew-resize' },
      { handle: 'sw' as ResizeHandle, x: element.x, y: element.y + element.height, cursor: 'nesw-resize' },
      { handle: 's' as ResizeHandle, x: element.x + element.width / 2, y: element.y + element.height, cursor: 'ns-resize' },
      { handle: 'se' as ResizeHandle, x: element.x + element.width, y: element.y + element.height, cursor: 'nwse-resize' },
    ]
  }

  // Rotation handlers
  const handleRotateStart = (elementId: string, e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const element = props.sceneStore.elements().find((el) => el.id === elementId)
    if (!element || element.locked) return

    // Calculate element center in canvas coordinates
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2

    // Get canvas position for correct mouse offset calculation
    const canvasRect = canvasRef?.getBoundingClientRect()
    if (!canvasRect) return

    const mouseX = e.clientX - canvasRect.left
    const mouseY = e.clientY - canvasRect.top

    // Calculate starting angle from center to mouse
    const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI)

    setRotateState({
      elementId,
      centerX,
      centerY,
      startAngle,
      startRotation: element.rotation,
    })
    setIsRotating(false)

    document.addEventListener('mousemove', handleRotateMove)
    document.addEventListener('mouseup', handleRotateEnd)
  }

  const handleRotateMove = (e: MouseEvent) => {
    const state = rotateState()
    if (!state || !canvasRef) return

    const canvasRect = canvasRef.getBoundingClientRect()
    const mouseX = e.clientX - canvasRect.left
    const mouseY = e.clientY - canvasRect.top

    // Calculate current angle from center to mouse
    const currentAngle = Math.atan2(mouseY - state.centerY, mouseX - state.centerX) * (180 / Math.PI)
    const deltaAngle = currentAngle - state.startAngle

    if (!isRotating() && Math.abs(deltaAngle) > 1) {
      setIsRotating(true)
    }

    if (!isRotating()) return

    // Calculate new rotation (snap to 15-degree increments if shift is held)
    let newRotation = state.startRotation + deltaAngle
    if (e.shiftKey) {
      newRotation = Math.round(newRotation / 15) * 15
    }

    // Normalize to 0-360
    newRotation = ((newRotation % 360) + 360) % 360

    props.sceneStore.updateElement(state.elementId, { rotation: newRotation })
  }

  const handleRotateEnd = () => {
    document.removeEventListener('mousemove', handleRotateMove)
    document.removeEventListener('mouseup', handleRotateEnd)

    setTimeout(() => {
      setRotateState(null)
      setIsRotating(false)
    }, 10)
  }

  // Path point drag handlers
  const handlePathPointDragStart = (
    elementId: string,
    pointId: string,
    point: EditablePoint,
    commands: EditableCommand[],
    points: EditablePoint[],
    e: MouseEvent
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const element = props.sceneStore.elements().find((el) => el.id === elementId)
    if (!element || element.locked) return

    setPathPointDragState({
      elementId,
      pointId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPointX: point.x,
      startPointY: point.y,
      commands,
      points,
    })
    setIsDraggingPathPoint(false)

    document.addEventListener('mousemove', handlePathPointDragMove)
    document.addEventListener('mouseup', handlePathPointDragEnd)
  }

  const handlePathPointDragMove = (e: MouseEvent) => {
    const state = pathPointDragState()
    if (!state) return

    const element = props.sceneStore.elements().find((el) => el.id === state.elementId) as PathElement
    if (!element) return

    const deltaX = e.clientX - state.startMouseX
    const deltaY = e.clientY - state.startMouseY

    if (!isDraggingPathPoint() && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
      setIsDraggingPathPoint(true)
    }

    if (!isDraggingPathPoint()) return

    // Calculate new point position (relative to element position)
    const newX = state.startPointX + deltaX
    const newY = state.startPointY + deltaY

    // Update commands and rebuild path string
    const newCommands = updatePathPoint(state.commands, state.points, state.pointId, newX, newY)
    const newPathData = buildPathString(newCommands)

    props.sceneStore.updateElement(state.elementId, { d: newPathData })
  }

  const handlePathPointDragEnd = () => {
    document.removeEventListener('mousemove', handlePathPointDragMove)
    document.removeEventListener('mouseup', handlePathPointDragEnd)

    setTimeout(() => {
      setPathPointDragState(null)
      setIsDraggingPathPoint(false)
    }, 10)
  }

  // Get rotation handle position (above the element)
  const getRotationHandle = (element: SceneElement) => {
    // Don't show rotation for line/arrow
    if (element.type === 'line' || element.type === 'arrow') return null

    const centerX = element.x + element.width / 2
    const handleDistance = 25
    const handleY = element.y - handleDistance

    return { x: centerX, y: handleY }
  }

  // Keyboard shortcuts handler
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if typing in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    const selectedId = props.sceneStore.state.selectedElementId
    const selectedIds = props.sceneStore.state.selectedElementIds
    const hasSelection = selectedId || selectedIds.length > 0

    // Delete/Backspace - Delete selected element(s)
    if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection) {
      e.preventDefault()
      if (selectedIds.length > 0) {
        // Delete all selected elements
        selectedIds.forEach((id) => props.sceneStore.removeElement(id))
      } else if (selectedId) {
        props.sceneStore.removeElement(selectedId)
      }
      return
    }

    // Ctrl/Cmd + D - Duplicate selected element
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
      e.preventDefault()
      props.sceneStore.duplicateElement(selectedId)
      return
    }

    // Ctrl/Cmd + C - Copy selected element(s)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && hasSelection) {
      e.preventDefault()
      const idsToCopy = selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : []
      props.sceneStore.copyElements(idsToCopy)
      return
    }

    // Ctrl/Cmd + X - Cut selected element(s)
    if ((e.ctrlKey || e.metaKey) && e.key === 'x' && hasSelection) {
      e.preventDefault()
      const idsToCut = selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : []
      props.sceneStore.cutElements(idsToCut)
      return
    }

    // Ctrl/Cmd + V - Paste elements
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault()
      props.sceneStore.pasteElements()
      return
    }

    // Ctrl/Cmd + G - Group selected elements
    if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
      e.preventDefault()
      if (selectedIds.length >= 2) {
        props.sceneStore.groupElements(selectedIds)
      }
      return
    }

    // Ctrl/Cmd + Shift + G - Ungroup selected group
    if ((e.ctrlKey || e.metaKey) && e.key === 'g' && e.shiftKey) {
      e.preventDefault()
      const selected = props.sceneStore.selectedElement()
      if (selected?.type === 'group') {
        props.sceneStore.ungroupElement(selected.id)
      }
      return
    }

    // Ctrl/Cmd + A - Select all elements
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      const allElementIds = props.sceneStore.elements().map((el) => el.id)
      if (allElementIds.length > 0) {
        props.sceneStore.selectElements(allElementIds)
      }
      return
    }

    // Arrow keys - Nudge selected element
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && hasSelection) {
      e.preventDefault()
      const nudgeAmount = e.shiftKey ? 10 : 1
      let deltaX = 0
      let deltaY = 0

      switch (e.key) {
        case 'ArrowUp':
          deltaY = -nudgeAmount
          break
        case 'ArrowDown':
          deltaY = nudgeAmount
          break
        case 'ArrowLeft':
          deltaX = -nudgeAmount
          break
        case 'ArrowRight':
          deltaX = nudgeAmount
          break
      }

      // Nudge all selected elements
      const idsToNudge = selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : []
      idsToNudge.forEach((id) => {
        const element = props.sceneStore.elements().find((el) => el.id === id)
        if (element && !element.locked) {
          const updates: Record<string, number> = {
            x: element.x + deltaX,
            y: element.y + deltaY,
          }
          // For line/arrow, also update x2/y2
          if (element.type === 'line' || element.type === 'arrow') {
            const lineEl = element as LineElement | ArrowElement
            updates.x2 = lineEl.x2 + deltaX
            updates.y2 = lineEl.y2 + deltaY
          }
          props.sceneStore.updateElement(id, updates)
        }
      })
      return
    }
  }

  // Register keyboard listener
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  // Cleanup on component unmount
  onCleanup(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    adapter?.clearTargets()
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    document.removeEventListener('mousemove', handleRotateMove)
    document.removeEventListener('mouseup', handleRotateEnd)
    document.removeEventListener('mousemove', handlePathPointDragMove)
    document.removeEventListener('mouseup', handlePathPointDragEnd)
  })

  const getElementStyle = (element: SceneElement) => {
    // Use left/top for base positioning, transform for animation effects
    // Animation x/y values are OFFSETS from the base position
    const base: Record<string, string> = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: `rotate(${element.rotation}deg)`,
      opacity: String(element.opacity),
      visibility: element.visible ? 'visible' : 'hidden',
      cursor: element.locked ? 'not-allowed' : 'pointer',
      'transform-origin': 'center center',
    }

    switch (element.type) {
      case 'rect': {
        const rect = element as RectElement
        base.background = fillToCss(rect.fill)
        base.border = rect.strokeWidth > 0 ? `${rect.strokeWidth}px solid ${rect.stroke}` : 'none'
        base['border-radius'] = `${rect.borderRadius}px`
        break
      }
      case 'circle': {
        const circle = element as CircleElement
        base.background = fillToCss(circle.fill)
        base.border = circle.strokeWidth > 0 ? `${circle.strokeWidth}px solid ${circle.stroke}` : 'none'
        base['border-radius'] = '50%'
        break
      }
      case 'text': {
        const text = element as TextElement
        base.background = 'transparent'
        base.color = text.fill
        base['font-size'] = `${text.fontSize}px`
        base['font-family'] = text.fontFamily
        base['font-weight'] = String(text.fontWeight)
        base['text-align'] = text.textAlign
        base.display = 'flex'
        base['align-items'] = 'center'
        base['justify-content'] = text.textAlign === 'center' ? 'center' : text.textAlign === 'right' ? 'flex-end' : 'flex-start'
        break
      }
      case 'line': {
        // For line, we use the bounding box as the container
        const line = element as LineElement
        const minX = Math.min(line.x, line.x2)
        const minY = Math.min(line.y, line.y2)
        const maxX = Math.max(line.x, line.x2)
        const maxY = Math.max(line.y, line.y2)
        const padding = line.strokeWidth / 2
        base.left = `${minX - padding}px`
        base.top = `${minY - padding}px`
        base.width = `${maxX - minX + line.strokeWidth}px`
        base.height = `${Math.max(maxY - minY + line.strokeWidth, line.strokeWidth)}px`
        base.background = 'transparent'
        base.overflow = 'visible'
        break
      }
      case 'arrow': {
        // For arrow, similar to line but with extra padding for arrowheads
        const arrow = element as ArrowElement
        const minX = Math.min(arrow.x, arrow.x2)
        const minY = Math.min(arrow.y, arrow.y2)
        const maxX = Math.max(arrow.x, arrow.x2)
        const maxY = Math.max(arrow.y, arrow.y2)
        const padding = Math.max(arrow.strokeWidth / 2, arrow.headSize)
        base.left = `${minX - padding}px`
        base.top = `${minY - padding}px`
        base.width = `${maxX - minX + padding * 2}px`
        base.height = `${Math.max(maxY - minY + padding * 2, padding * 2)}px`
        base.background = 'transparent'
        base.overflow = 'visible'
        break
      }
      case 'image': {
        const img = element as ImageElement
        base.background = 'transparent'
        base.overflow = 'hidden'
        if (!img.src) {
          // Placeholder style when no image
          base.background = '#333'
          base.border = '2px dashed #666'
        }
        break
      }
      case 'group': {
        base.background = 'transparent'
        base.overflow = 'visible'
        break
      }
    }

    return base
  }

  // Get child elements of a group
  const getGroupChildren = (group: GroupElement): SceneElement[] => {
    return props.sceneStore.elements().filter((el) => group.childIds.includes(el.id))
  }

  // Check if element is a child of any group (should not render at top level)
  const isGroupChild = (elementId: string): boolean => {
    return props.sceneStore.elements().some(
      (el) => el.type === 'group' && (el as GroupElement).childIds.includes(elementId)
    )
  }

  const getLineSvgPath = (element: LineElement) => {
    const minX = Math.min(element.x, element.x2)
    const minY = Math.min(element.y, element.y2)
    const padding = element.strokeWidth / 2
    // Coordinates relative to the container
    const x1 = element.x - minX + padding
    const y1 = element.y - minY + padding
    const x2 = element.x2 - minX + padding
    const y2 = element.y2 - minY + padding
    return { x1, y1, x2, y2 }
  }

  const getArrowSvgPath = (element: ArrowElement) => {
    const minX = Math.min(element.x, element.x2)
    const minY = Math.min(element.y, element.y2)
    const padding = Math.max(element.strokeWidth / 2, element.headSize)
    // Coordinates relative to the container
    const x1 = element.x - minX + padding
    const y1 = element.y - minY + padding
    const x2 = element.x2 - minX + padding
    const y2 = element.y2 - minY + padding
    return { x1, y1, x2, y2 }
  }

  // Render SVG element for SVG renderer
  // Use transform-box and transform-origin CSS to make SVG transforms behave like CSS
  const svgTransformStyle = 'transform-box: fill-box; transform-origin: center;'

  const renderSVGElement = (element: SceneElement) => {
    switch (element.type) {
      case 'rect': {
        const rect = element as RectElement
        return (
          <rect
            data-element-id={element.id}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={rect.borderRadius}
            fill={typeof rect.fill === 'string' ? rect.fill : 'none'}
            stroke={rect.stroke}
            stroke-width={rect.strokeWidth}
            opacity={rect.opacity}
            style={svgTransformStyle}
          />
        )
      }
      case 'circle': {
        const circle = element as CircleElement
        const cx = circle.x + circle.width / 2
        const cy = circle.y + circle.height / 2
        return (
          <ellipse
            data-element-id={element.id}
            cx={cx}
            cy={cy}
            rx={circle.width / 2}
            ry={circle.height / 2}
            fill={typeof circle.fill === 'string' ? circle.fill : 'none'}
            stroke={circle.stroke}
            stroke-width={circle.strokeWidth}
            opacity={circle.opacity}
            style={svgTransformStyle}
          />
        )
      }
      case 'text': {
        const text = element as TextElement
        return (
          <text
            data-element-id={element.id}
            x={text.x}
            y={text.y + text.fontSize * 0.8}
            font-size={`${text.fontSize}px`}
            font-family={text.fontFamily}
            font-weight={text.fontWeight}
            fill={typeof text.fill === 'string' ? text.fill : 'none'}
            opacity={text.opacity}
            style={svgTransformStyle}
          >
            {text.text}
          </text>
        )
      }
      case 'line': {
        const line = element as LineElement
        return (
          <line
            data-element-id={element.id}
            x1={line.x}
            y1={line.y}
            x2={line.x2}
            y2={line.y2}
            stroke={line.stroke}
            stroke-width={line.strokeWidth}
            stroke-linecap={line.lineCap}
            opacity={line.opacity}
            style={svgTransformStyle}
          />
        )
      }
      case 'path': {
        const path = element as PathElement
        return (
          <path
            data-element-id={element.id}
            d={path.d}
            fill={typeof path.fill === 'string' ? path.fill : 'none'}
            stroke={path.stroke}
            stroke-width={path.strokeWidth}
            opacity={path.opacity}
            transform={`translate(${path.x}, ${path.y})${element.rotation ? ` rotate(${element.rotation})` : ''}`}
          />
        )
      }
      default:
        return null
    }
  }

  return (
    <div class="preview-panel">
      <div class="preview-header">
        <span>Preview</span>
        <select
          class="renderer-select"
          value={rendererType()}
          onChange={(e) => setRendererType(e.currentTarget.value as RendererType)}
          title="Switch renderer"
        >
          <option value="dom">DOM</option>
          <option value="canvas">Canvas</option>
          <option value="svg">SVG</option>
        </select>
        <span class="preview-element-count">
          {props.sceneStore.elementCount()} elements
        </span>
      </div>
      <div class="preview-container" ref={containerRef}>
        {/* DOM Renderer */}
        <Show when={rendererType() === 'dom'}>
          <div class="preview-canvas" ref={canvasRef} onClick={handleCanvasClick}>
          <For each={props.sceneStore.elements().filter((el) => !isGroupChild(el.id))}>
            {(element) => (
              <div
                class="preview-element"
                classList={{
                  // Don't show selection box for paths - they have control points
                  selected: element.type !== 'path' && (props.sceneStore.state.selectedElementId === element.id ||
                           props.sceneStore.state.selectedElementIds.includes(element.id)),
                  locked: element.locked,
                  dragging: isDragging() && dragState()?.elementId === element.id,
                }}
                data-element-id={element.id}
                data-element-type={element.type}
                data-tinyfly={element.name}
                style={getElementStyle(element)}
                onMouseDown={(e) => !element.locked && handleDragStart(element.id, e)}
                onClick={(e) => !element.locked && !isDragging() && handleElementClick(element.id, e)}
              >
                <Show when={element.type === 'text'}>
                  {(element as TextElement).text}
                </Show>
                <Show when={element.type === 'line'}>
                  {(() => {
                    const line = element as LineElement
                    const coords = getLineSvgPath(line)
                    return (
                      <svg
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
                      >
                        <line
                          x1={coords.x1}
                          y1={coords.y1}
                          x2={coords.x2}
                          y2={coords.y2}
                          stroke={line.stroke}
                          stroke-width={line.strokeWidth}
                          stroke-linecap={line.lineCap}
                        />
                      </svg>
                    )
                  })()}
                </Show>
                <Show when={element.type === 'arrow'}>
                  {(() => {
                    const arrow = element as ArrowElement
                    const coords = getArrowSvgPath(arrow)
                    const markerId = `arrow-${arrow.id}`
                    return (
                      <svg
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
                      >
                        <defs>
                          <marker
                            id={`${markerId}-end`}
                            markerWidth={arrow.headSize}
                            markerHeight={arrow.headSize}
                            refX={arrow.headSize - 1}
                            refY={arrow.headSize / 2}
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                          >
                            <path
                              d={`M0,0 L0,${arrow.headSize} L${arrow.headSize},${arrow.headSize / 2} Z`}
                              fill={arrow.stroke}
                            />
                          </marker>
                          <marker
                            id={`${markerId}-start`}
                            markerWidth={arrow.headSize}
                            markerHeight={arrow.headSize}
                            refX={1}
                            refY={arrow.headSize / 2}
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                          >
                            <path
                              d={`M${arrow.headSize},0 L${arrow.headSize},${arrow.headSize} L0,${arrow.headSize / 2} Z`}
                              fill={arrow.stroke}
                            />
                          </marker>
                        </defs>
                        <line
                          x1={coords.x1}
                          y1={coords.y1}
                          x2={coords.x2}
                          y2={coords.y2}
                          stroke={arrow.stroke}
                          stroke-width={arrow.strokeWidth}
                          marker-start={arrow.startHead ? `url(#${markerId}-start)` : undefined}
                          marker-end={arrow.endHead ? `url(#${markerId}-end)` : undefined}
                        />
                      </svg>
                    )
                  })()}
                </Show>
                <Show when={element.type === 'path'}>
                  {(() => {
                    const pathEl = element as PathElement
                    // For SVG paths, we need a string fill value
                    // If fill is a gradient object, fall back to 'transparent'
                    const svgFill = typeof pathEl.fill === 'string' ? pathEl.fill : 'transparent'
                    return (
                      <svg
                        width="100%"
                        height="100%"
                        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
                      >
                        <path
                          d={pathEl.d}
                          fill={svgFill}
                          stroke={pathEl.stroke}
                          stroke-width={pathEl.strokeWidth}
                          stroke-linecap={pathEl.lineCap}
                          stroke-linejoin={pathEl.lineJoin}
                        />
                      </svg>
                    )
                  })()}
                </Show>
                <Show when={element.type === 'image'}>
                  {(() => {
                    const img = element as ImageElement
                    return img.src ? (
                      <img
                        src={img.src}
                        alt={img.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          'object-fit': img.objectFit,
                          'pointer-events': 'none',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        color: '#666',
                        'font-size': '12px',
                      }}>
                        No image
                      </div>
                    )
                  })()}
                </Show>
                <Show when={element.type === 'group'}>
                  {(() => {
                    const group = element as GroupElement
                    const children = getGroupChildren(group)
                    return (
                      <For each={children}>
                        {(child) => (
                          <div
                            class="preview-element group-child"
                            classList={{
                              selected: props.sceneStore.state.selectedElementId === child.id,
                              dragging: isDragging() && dragState()?.elementId === child.id,
                            }}
                            data-element-id={child.id}
                            data-tinyfly={child.name}
                            style={getElementStyle(child)}
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              if (!child.locked) handleDragStart(child.id, e)
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!child.locked && !isDragging()) handleElementClick(child.id, e)
                            }}
                          >
                            <Show when={child.type === 'text'}>
                              {(child as TextElement).text}
                            </Show>
                            <Show when={child.type === 'line'}>
                              {(() => {
                                const line = child as LineElement
                                const coords = getLineSvgPath(line)
                                return (
                                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                                    <line x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2} stroke={line.stroke} stroke-width={line.strokeWidth} stroke-linecap={line.lineCap} />
                                  </svg>
                                )
                              })()}
                            </Show>
                            <Show when={child.type === 'arrow'}>
                              {(() => {
                                const arrow = child as ArrowElement
                                const coords = getArrowSvgPath(arrow)
                                const markerId = `arrow-${arrow.id}`
                                return (
                                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                                    <defs>
                                      <marker id={`${markerId}-end`} markerWidth={arrow.headSize} markerHeight={arrow.headSize} refX={arrow.headSize - 1} refY={arrow.headSize / 2} orient="auto" markerUnits="userSpaceOnUse">
                                        <path d={`M0,0 L0,${arrow.headSize} L${arrow.headSize},${arrow.headSize / 2} Z`} fill={arrow.stroke} />
                                      </marker>
                                      <marker id={`${markerId}-start`} markerWidth={arrow.headSize} markerHeight={arrow.headSize} refX={1} refY={arrow.headSize / 2} orient="auto" markerUnits="userSpaceOnUse">
                                        <path d={`M${arrow.headSize},0 L${arrow.headSize},${arrow.headSize} L0,${arrow.headSize / 2} Z`} fill={arrow.stroke} />
                                      </marker>
                                    </defs>
                                    <line x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2} stroke={arrow.stroke} stroke-width={arrow.strokeWidth} marker-start={arrow.startHead ? `url(#${markerId}-start)` : undefined} marker-end={arrow.endHead ? `url(#${markerId}-end)` : undefined} />
                                  </svg>
                                )
                              })()}
                            </Show>
                            <Show when={child.type === 'image'}>
                              {(() => {
                                const img = child as ImageElement
                                return img.src ? (
                                  <img src={img.src} alt={img.name} style={{ width: '100%', height: '100%', 'object-fit': img.objectFit, 'pointer-events': 'none' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', 'align-items': 'center', 'justify-content': 'center', color: '#666', 'font-size': '12px' }}>No image</div>
                                )
                              })()}
                            </Show>
                          </div>
                        )}
                      </For>
                    )
                  })()}
                </Show>
              </div>
            )}
          </For>

          {/* Resize handles for selected element (not shown for paths - they have control points) */}
          <Show when={props.sceneStore.selectedElement() && !props.sceneStore.selectedElement()?.locked && props.sceneStore.selectedElement()?.type !== 'path'}>
            {(() => {
              const element = props.sceneStore.selectedElement()!
              const handles = getResizeHandles(element)
              const rotationHandle = getRotationHandle(element)
              return (
                <>
                  <For each={handles}>
                    {(h) => (
                      <div
                        class="resize-handle"
                        classList={{
                          'resize-handle-endpoint': element.type === 'line' || element.type === 'arrow',
                        }}
                        style={{
                          position: 'absolute',
                          left: `${h.x - 5}px`,
                          top: `${h.y - 5}px`,
                          width: '10px',
                          height: '10px',
                          cursor: h.cursor,
                        }}
                        onMouseDown={(e) => handleResizeStart(element.id, h.handle, e)}
                      />
                    )}
                  </For>
                  {/* Rotation handle */}
                  <Show when={rotationHandle}>
                    {(() => {
                      const rh = rotationHandle!
                      const topCenter = { x: element.x + element.width / 2, y: element.y }
                      return (
                        <>
                          {/* Line from element to rotation handle */}
                          <div
                            class="rotation-line"
                            style={{
                              position: 'absolute',
                              left: `${topCenter.x}px`,
                              top: `${rh.y + 5}px`,
                              width: '1px',
                              height: `${topCenter.y - rh.y - 5}px`,
                              background: '#4a9eff',
                            }}
                          />
                          {/* Rotation handle */}
                          <div
                            class="rotation-handle"
                            style={{
                              position: 'absolute',
                              left: `${rh.x - 6}px`,
                              top: `${rh.y - 6}px`,
                              width: '12px',
                              height: '12px',
                              cursor: 'crosshair',
                            }}
                            onMouseDown={(e) => handleRotateStart(element.id, e)}
                          />
                        </>
                      )
                    })()}
                  </Show>
                </>
              )
            })()}
          </Show>

          {/* Path control points for selected path element */}
          <Show when={props.sceneStore.selectedElement()?.type === 'path' && selectedPathData()}>
            {(() => {
              const element = props.sceneStore.selectedElement() as PathElement
              const pathData = selectedPathData()!
              const controlLines = getControlLines(pathData.commands, pathData.points)

              return (
                <svg
                  class="path-control-overlay"
                  style={{
                    position: 'absolute',
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: `${element.width}px`,
                    height: `${element.height}px`,
                    overflow: 'visible',
                    'pointer-events': 'none',
                  }}
                >
                  {/* Control lines */}
                  <For each={controlLines}>
                    {(line) => (
                      <line
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#4a9eff"
                        stroke-width="1"
                        stroke-dasharray="3,3"
                      />
                    )}
                  </For>

                  {/* Control points */}
                  <For each={pathData.points}>
                    {(point) => (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={point.type === 'anchor' ? 5 : 4}
                        fill={point.type === 'anchor' ? '#4a9eff' : '#fff'}
                        stroke={point.type === 'anchor' ? '#fff' : '#4a9eff'}
                        stroke-width="2"
                        style={{
                          cursor: 'move',
                          'pointer-events': 'all',
                        }}
                        onMouseDown={(e) =>
                          handlePathPointDragStart(
                            element.id,
                            point.id,
                            point,
                            pathData.commands,
                            pathData.points,
                            e
                          )
                        }
                      />
                    )}
                  </For>
                </svg>
              )
            })()}
          </Show>

          {/* Show placeholder when no elements */}
          <Show when={props.sceneStore.elements().length === 0}>
            <div class="preview-placeholder">
              <p>No elements</p>
              <p class="hint">Add elements from the left panel</p>
            </div>
          </Show>
          </div>
        </Show>

        {/* Canvas Renderer */}
        <Show when={rendererType() === 'canvas'}>
          <div class="preview-canvas preview-canvas-renderer">
            <canvas
              ref={(el) => {
                canvas2dRef = el
                // Render after canvas mounts
                setTimeout(() => {
                  registerCanvasElements()
                  // Apply animation state before rendering to position elements correctly
                  applyStateToRenderer()
                }, 0)
              }}
              width={300}
              height={200}
              style={{ width: '100%', height: '100%' }}
            />
            <Show when={props.sceneStore.elements().length === 0}>
              <div class="preview-placeholder">
                <p>No elements</p>
                <p class="hint">Add elements from the left panel</p>
              </div>
            </Show>
            <div class="renderer-badge">Canvas</div>
          </div>
        </Show>

        {/* SVG Renderer */}
        <Show when={rendererType() === 'svg'}>
          <div class="preview-canvas preview-svg-renderer">
            <svg
              ref={(el) => {
                svgRef = el
                // Register elements after SVG mounts
                setTimeout(() => {
                  registerSVGElements()
                  applyStateToRenderer()
                }, 0)
              }}
              width="100%"
              height="100%"
              viewBox="0 0 300 200"
              preserveAspectRatio="xMidYMid meet"
            >
              <For each={props.sceneStore.elements().filter((el) => !isGroupChild(el.id))}>
                {(element) => renderSVGElement(element)}
              </For>
            </svg>
            <Show when={props.sceneStore.elements().length === 0}>
              <div class="preview-placeholder">
                <p>No elements</p>
                <p class="hint">Add elements from the left panel</p>
              </div>
            </Show>
            <div class="renderer-badge">SVG</div>
          </div>
        </Show>
      </div>
    </div>
  )
}

export default PreviewPanel
