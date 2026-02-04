import { describe, it, expect } from 'vitest'
import { createSceneStore } from './scene-store'
import type { RectElement, CircleElement, TextElement } from './scene-store'

describe('SceneStore', () => {
  describe('addElement', () => {
    it('adds a rect element with default properties', () => {
      const store = createSceneStore()

      const element = store.addElement('rect')

      expect(element.type).toBe('rect')
      expect(element.id).toBeDefined()
      expect(element.name).toBe('Rectangle 1')
      expect((element as RectElement).fill).toBe('#4a9eff')
      expect(element.width).toBe(60)
      expect(element.height).toBe(60)
    })

    it('adds a circle element with default properties', () => {
      const store = createSceneStore()

      const element = store.addElement('circle')

      expect(element.type).toBe('circle')
      expect(element.name).toBe('Circle 1')
      expect((element as CircleElement).fill).toBe('#2ecc71')
    })

    it('adds a text element with default properties', () => {
      const store = createSceneStore()

      const element = store.addElement('text')

      expect(element.type).toBe('text')
      expect(element.name).toBe('Text 1')
      expect((element as TextElement).text).toBe('Text')
      expect((element as TextElement).fontSize).toBe(16)
    })

    it('accepts property overrides', () => {
      const store = createSceneStore()

      const element = store.addElement('rect', { x: 100, y: 50, fill: '#ff0000' })

      expect(element.x).toBe(100)
      expect(element.y).toBe(50)
      expect((element as RectElement).fill).toBe('#ff0000')
    })

    it('auto-increments element names', () => {
      const store = createSceneStore()

      store.addElement('rect')
      store.addElement('rect')
      const third = store.addElement('rect')

      expect(third.name).toBe('Rectangle 3')
    })

    it('selects newly added element', () => {
      const store = createSceneStore()

      const element = store.addElement('rect')

      expect(store.state.selectedElementId).toBe(element.id)
    })
  })

  describe('removeElement', () => {
    it('removes an element by id', () => {
      const store = createSceneStore()
      const element = store.addElement('rect')

      store.removeElement(element.id)

      expect(store.elements().length).toBe(0)
    })

    it('clears selection if removed element was selected', () => {
      const store = createSceneStore()
      const element = store.addElement('rect')

      store.removeElement(element.id)

      expect(store.state.selectedElementId).toBeNull()
    })

    it('keeps other elements', () => {
      const store = createSceneStore()
      const el1 = store.addElement('rect')
      const el2 = store.addElement('circle')

      store.removeElement(el1.id)

      expect(store.elements().length).toBe(1)
      expect(store.elements()[0].id).toBe(el2.id)
    })
  })

  describe('updateElement', () => {
    it('updates element properties', () => {
      const store = createSceneStore()
      const element = store.addElement('rect')

      store.updateElement(element.id, { x: 200, y: 150 })

      const updated = store.elements().find((el) => el.id === element.id)
      expect(updated?.x).toBe(200)
      expect(updated?.y).toBe(150)
    })

    it('updates type-specific properties', () => {
      const store = createSceneStore()
      const element = store.addElement('rect')

      store.updateElement(element.id, { fill: '#000000', borderRadius: 10 })

      const updated = store.elements().find((el) => el.id === element.id) as RectElement
      expect(updated.fill).toBe('#000000')
      expect(updated.borderRadius).toBe(10)
    })

    it('does nothing for non-existent element', () => {
      const store = createSceneStore()
      store.addElement('rect')

      store.updateElement('non-existent', { x: 100 })

      expect(store.elements().length).toBe(1)
    })
  })

  describe('selectElement', () => {
    it('selects an element by id', () => {
      const store = createSceneStore()
      const el1 = store.addElement('rect')
      store.addElement('circle')

      store.selectElement(el1.id)

      expect(store.state.selectedElementId).toBe(el1.id)
    })

    it('clears selection with null', () => {
      const store = createSceneStore()
      store.addElement('rect')

      store.selectElement(null)

      expect(store.state.selectedElementId).toBeNull()
    })
  })

  describe('moveElement', () => {
    it('moves element up in layer order', () => {
      const store = createSceneStore()
      const el1 = store.addElement('rect')
      const el2 = store.addElement('circle')
      const el3 = store.addElement('text')

      store.moveElement(el1.id, 'up')

      const ids = store.elements().map((el) => el.id)
      expect(ids).toEqual([el2.id, el1.id, el3.id])
    })

    it('moves element down in layer order', () => {
      const store = createSceneStore()
      const el1 = store.addElement('rect')
      const el2 = store.addElement('circle')
      const el3 = store.addElement('text')

      store.moveElement(el3.id, 'down')

      const ids = store.elements().map((el) => el.id)
      expect(ids).toEqual([el1.id, el3.id, el2.id])
    })

    it('moves element to top', () => {
      const store = createSceneStore()
      const el1 = store.addElement('rect')
      const el2 = store.addElement('circle')
      const el3 = store.addElement('text')

      store.moveElement(el1.id, 'top')

      const ids = store.elements().map((el) => el.id)
      expect(ids).toEqual([el2.id, el3.id, el1.id])
    })

    it('moves element to bottom', () => {
      const store = createSceneStore()
      const el1 = store.addElement('rect')
      const el2 = store.addElement('circle')
      const el3 = store.addElement('text')

      store.moveElement(el3.id, 'bottom')

      const ids = store.elements().map((el) => el.id)
      expect(ids).toEqual([el3.id, el1.id, el2.id])
    })
  })

  describe('duplicateElement', () => {
    it('creates a copy of the element', () => {
      const store = createSceneStore()
      const original = store.addElement('rect', { x: 50, y: 50 })

      const copy = store.duplicateElement(original.id)

      expect(copy).not.toBeNull()
      expect(copy!.id).not.toBe(original.id)
      expect(copy!.name).toBe('Rectangle 1 copy')
      expect(copy!.x).toBe(70) // Offset by 20
      expect(copy!.y).toBe(70)
    })

    it('selects the duplicated element', () => {
      const store = createSceneStore()
      const original = store.addElement('rect')

      const copy = store.duplicateElement(original.id)

      expect(store.state.selectedElementId).toBe(copy!.id)
    })

    it('returns null for non-existent element', () => {
      const store = createSceneStore()

      const copy = store.duplicateElement('non-existent')

      expect(copy).toBeNull()
    })
  })

  describe('clearElements', () => {
    it('removes all elements', () => {
      const store = createSceneStore()
      store.addElement('rect')
      store.addElement('circle')
      store.addElement('text')

      store.clearElements()

      expect(store.elements().length).toBe(0)
    })

    it('clears selection', () => {
      const store = createSceneStore()
      store.addElement('rect')

      store.clearElements()

      expect(store.state.selectedElementId).toBeNull()
    })
  })

  describe('loadElements', () => {
    it('loads elements from serialized data', () => {
      const store = createSceneStore()
      const elements = [
        {
          id: 'el-1',
          type: 'rect' as const,
          name: 'Box',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          opacity: 1,
          visible: true,
          locked: false,
          fill: '#ff0000',
          stroke: 'transparent',
          strokeWidth: 0,
          borderRadius: 0,
        },
      ]

      store.loadElements(elements)

      expect(store.elements().length).toBe(1)
      expect(store.elements()[0].id).toBe('el-1')
    })

    it('clears selection after loading', () => {
      const store = createSceneStore()
      store.addElement('rect')

      store.loadElements([])

      expect(store.state.selectedElementId).toBeNull()
    })
  })

  describe('exportElements', () => {
    it('returns a copy of all elements', () => {
      const store = createSceneStore()
      store.addElement('rect')
      store.addElement('circle')

      const exported = store.exportElements()

      expect(exported.length).toBe(2)
      expect(exported).not.toBe(store.state.elements) // Should be a copy
    })
  })

  describe('computed values', () => {
    it('selectedElement returns the selected element', () => {
      const store = createSceneStore()
      const element = store.addElement('rect')

      expect(store.selectedElement()?.id).toBe(element.id)
    })

    it('selectedElement returns null when nothing selected', () => {
      const store = createSceneStore()
      store.addElement('rect')
      store.selectElement(null)

      expect(store.selectedElement()).toBeNull()
    })

    it('elementCount returns the number of elements', () => {
      const store = createSceneStore()

      expect(store.elementCount()).toBe(0)

      store.addElement('rect')
      store.addElement('circle')

      expect(store.elementCount()).toBe(2)
    })
  })

  describe('copy/paste operations', () => {
    it('copies elements to clipboard', () => {
      const store = createSceneStore()
      const rect = store.addElement('rect')

      expect(store.hasClipboardContent()).toBe(false)
      store.copyElements([rect.id])
      expect(store.hasClipboardContent()).toBe(true)
    })

    it('pastes elements from clipboard with offset', () => {
      const store = createSceneStore()
      const rect = store.addElement('rect', { x: 100, y: 100, name: 'TestRect' })

      store.copyElements([rect.id])
      const pasted = store.pasteElements()

      expect(pasted.length).toBe(1)
      expect(pasted[0].x).toBe(120) // 100 + 20 offset
      expect(pasted[0].y).toBe(120)
      expect(pasted[0].name).toBe('TestRect copy')
      expect(pasted[0].id).not.toBe(rect.id)
    })

    it('pastes multiple elements', () => {
      const store = createSceneStore()
      const rect = store.addElement('rect')
      const circle = store.addElement('circle')

      store.copyElements([rect.id, circle.id])
      const pasted = store.pasteElements()

      expect(pasted.length).toBe(2)
      expect(store.elementCount()).toBe(4)
    })

    it('cuts elements (copy and remove)', () => {
      const store = createSceneStore()
      const rect = store.addElement('rect', { name: 'CutRect' })

      expect(store.elementCount()).toBe(1)
      store.cutElements([rect.id])

      expect(store.elementCount()).toBe(0)
      expect(store.hasClipboardContent()).toBe(true)

      const pasted = store.pasteElements()
      expect(pasted.length).toBe(1)
      expect(pasted[0].name).toBe('CutRect copy')
    })

    it('paste returns empty array when clipboard is empty', () => {
      const store = createSceneStore()

      const pasted = store.pasteElements()
      expect(pasted).toEqual([])
    })

    it('selects pasted elements', () => {
      const store = createSceneStore()
      const rect = store.addElement('rect')
      const circle = store.addElement('circle')

      store.copyElements([rect.id, circle.id])
      const pasted = store.pasteElements()

      expect(store.state.selectedElementIds.length).toBe(2)
      expect(store.state.selectedElementIds).toContain(pasted[0].id)
      expect(store.state.selectedElementIds).toContain(pasted[1].id)
    })
  })

  describe('path element', () => {
    it('creates path element with default SVG data', () => {
      const store = createSceneStore()
      const path = store.addElement('path')

      expect(path.type).toBe('path')
      expect(path).toHaveProperty('d')
      expect(path).toHaveProperty('stroke')
      expect(path).toHaveProperty('strokeWidth')
      expect(path).toHaveProperty('lineCap')
      expect(path).toHaveProperty('lineJoin')
    })

    it('allows custom path data', () => {
      const store = createSceneStore()
      const path = store.addElement('path', {
        d: 'M 0 0 C 50 100 100 100 150 0',
        stroke: '#ff0000',
      })

      expect((path as any).d).toBe('M 0 0 C 50 100 100 100 150 0')
      expect((path as any).stroke).toBe('#ff0000')
    })
  })
})

// Test gradient utilities
import { isGradient, fillToCss, createLinearGradient, createRadialGradient } from './scene-store'

describe('gradient utilities', () => {
  describe('isGradient', () => {
    it('returns false for string colors', () => {
      expect(isGradient('#ff0000')).toBe(false)
      expect(isGradient('transparent')).toBe(false)
    })

    it('returns true for gradient objects', () => {
      expect(isGradient(createLinearGradient())).toBe(true)
      expect(isGradient(createRadialGradient())).toBe(true)
    })
  })

  describe('fillToCss', () => {
    it('returns string colors unchanged', () => {
      expect(fillToCss('#ff0000')).toBe('#ff0000')
      expect(fillToCss('transparent')).toBe('transparent')
    })

    it('converts linear gradient to CSS', () => {
      const gradient = createLinearGradient('#ff0000', '#00ff00')
      const css = fillToCss(gradient)
      expect(css).toContain('linear-gradient')
      expect(css).toContain('90deg')
      expect(css).toContain('#ff0000')
      expect(css).toContain('#00ff00')
    })

    it('converts radial gradient to CSS', () => {
      const gradient = createRadialGradient('#ff0000', '#00ff00')
      const css = fillToCss(gradient)
      expect(css).toContain('radial-gradient')
      expect(css).toContain('#ff0000')
      expect(css).toContain('#00ff00')
    })
  })

  describe('createLinearGradient', () => {
    it('creates gradient with default colors', () => {
      const gradient = createLinearGradient()
      expect(gradient.type).toBe('linear')
      expect(gradient.angle).toBe(90)
      expect(gradient.stops.length).toBe(2)
    })

    it('creates gradient with custom colors', () => {
      const gradient = createLinearGradient('#000', '#fff')
      expect(gradient.stops[0].color).toBe('#000')
      expect(gradient.stops[1].color).toBe('#fff')
    })
  })

  describe('createRadialGradient', () => {
    it('creates gradient with default settings', () => {
      const gradient = createRadialGradient()
      expect(gradient.type).toBe('radial')
      expect(gradient.centerX).toBe(0.5)
      expect(gradient.centerY).toBe(0.5)
      expect(gradient.stops.length).toBe(2)
    })
  })
})
