import { For, Show, createMemo } from 'solid-js'
import type { Component } from 'solid-js'
import type { SceneStore, ElementType, GroupElement, DeviceVariant } from '../stores/scene-store'
import type { ProjectStore } from '../stores/project-store'
import { HelpIcon } from './tooltip'
import { createCollapsed } from '../utils/use-collapsed'
import './element-panel.css'

interface ElementPanelProps {
  sceneStore: SceneStore
  projectStore: ProjectStore
}

const ELEMENT_TYPES: { type: ElementType; icon: string; label: string }[] = [
  { type: 'rect', icon: '▢', label: 'Rectangle' },
  { type: 'circle', icon: '○', label: 'Circle' },
  { type: 'text', icon: 'T', label: 'Text' },
  { type: 'line', icon: '/', label: 'Line' },
  { type: 'arrow', icon: '➔', label: 'Arrow' },
  { type: 'path', icon: '⌇', label: 'Path' },
  { type: 'image', icon: '🖼', label: 'Image' },
  { type: 'audio', icon: '🔊', label: 'Audio' },
  { type: 'video', icon: '🎬', label: 'Video' },
]

export const ElementPanel: Component<ElementPanelProps> = (props) => {
  const handleAddElement = (type: ElementType) => {
    // Center the element in the canvas (assuming 300x200 default canvas)
    const overrides: Record<string, number | string> = {
      x: type === 'audio' ? 12 : type === 'text' ? 100 : (type === 'line' || type === 'arrow') ? 50 : type === 'image' ? 100 : type === 'path' ? 100 : 120,
      y: type === 'audio' ? 12 : type === 'text' ? 85 : (type === 'line' || type === 'arrow') ? 100 : type === 'image' ? 50 : type === 'path' ? 50 : 70,
    }
    if (type === 'line' || type === 'arrow') {
      overrides.x2 = 250
      overrides.y2 = 100
    }
    props.sceneStore.addElement(type, overrides)
  }

  const handleAddDevice = (variant: DeviceVariant) => {
    const canvas = props.projectStore.currentProject().canvas
    props.sceneStore.addDeviceFrame({
      variant,
      centerX: canvas.width / 2,
      centerY: canvas.height / 2,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    })
  }

  const handleSelectElement = (elementId: string, e?: MouseEvent) => {
    // Check for Ctrl/Cmd key for multi-selection
    if (e && (e.ctrlKey || e.metaKey)) {
      props.sceneStore.toggleElementSelection(elementId)
    } else {
      props.sceneStore.selectElement(elementId)
    }
  }

  const selectedIds = createMemo(() => props.sceneStore.selectedElementIds())
  const canGroup = createMemo(() => selectedIds().length >= 2)
  const selectedIsGroup = createMemo(() => {
    const selected = props.sceneStore.selectedElement()
    return selected?.type === 'group'
  })

  const handleGroup = () => {
    const ids = selectedIds()
    if (ids.length >= 2) {
      props.sceneStore.groupElements(ids)
    }
  }

  const handleUngroup = () => {
    const selected = props.sceneStore.selectedElement()
    if (selected?.type === 'group') {
      props.sceneStore.ungroupElement(selected.id)
    }
  }

  const handleDeleteElement = (elementId: string, e: MouseEvent) => {
    e.stopPropagation()
    props.sceneStore.removeElement(elementId)
  }

  const handleDuplicateElement = (elementId: string, e: MouseEvent) => {
    e.stopPropagation()
    props.sceneStore.duplicateElement(elementId)
  }

  const handleMoveUp = (elementId: string, e: MouseEvent) => {
    e.stopPropagation()
    props.sceneStore.moveElement(elementId, 'up')
  }

  const handleMoveDown = (elementId: string, e: MouseEvent) => {
    e.stopPropagation()
    props.sceneStore.moveElement(elementId, 'down')
  }

  const handleToggleVisibility = (elementId: string, e: MouseEvent) => {
    e.stopPropagation()
    const element = props.sceneStore.elements().find((el) => el.id === elementId)
    if (element) {
      props.sceneStore.updateElement(elementId, { visible: !element.visible })
    }
  }

  const handleToggleLock = (elementId: string, e: MouseEvent) => {
    e.stopPropagation()
    const element = props.sceneStore.elements().find((el) => el.id === elementId)
    if (element) {
      props.sceneStore.updateElement(elementId, { locked: !element.locked })
    }
  }

  const [collapsed, toggleCollapsed] = createCollapsed('tinyfly-panel-elements')

  return (
    <div class="element-panel" classList={{ collapsed: collapsed() }}>
      <div class="panel-header">
        <button class="panel-toggle" onClick={toggleCollapsed} title={collapsed() ? 'Expand' : 'Collapse'}>
          <span class="panel-chevron" classList={{ collapsed: collapsed() }}>▾</span>
          Elements
        </button>
        <HelpIcon
          content="Add shapes, text, and images to your canvas. Click an element type to add it, then use the canvas to position and resize."
          position="right"
        />
      </div>

      <div class="panel-content">
        {/* Add Element Buttons */}
        <div class="element-add-section">
          <span class="section-label">Add Element</span>
          <div class="element-type-buttons">
            <For each={ELEMENT_TYPES}>
              {(item) => (
                <button
                  class="element-type-btn"
                  onClick={() => handleAddElement(item.type)}
                  title={`Add ${item.label}`}
                >
                  <span class="element-type-icon">{item.icon}</span>
                  <span class="element-type-label">{item.label}</span>
                </button>
              )}
            </For>
            <button
              class="element-type-btn"
              onClick={() => props.sceneStore.addPolyStar({ kind: 'polygon', points: 6 })}
              title="Add a regular polygon (edit sides in Properties)"
            >
              <span class="element-type-icon">⬡</span>
              <span class="element-type-label">Polygon</span>
            </button>
            <button
              class="element-type-btn"
              onClick={() => props.sceneStore.addPolyStar({ kind: 'star', points: 5, innerRatio: 0.5 })}
              title="Add a star (edit points / inner ratio in Properties)"
            >
              <span class="element-type-icon">★</span>
              <span class="element-type-label">Star</span>
            </button>
          </div>

          <span class="section-label">Presets · Device</span>
          <div class="element-type-buttons">
            <button
              class="element-type-btn preset"
              onClick={() => handleAddDevice('phone')}
              title="Phone mockup (portrait) with a video screen, sized to the canvas"
            >
              <span class="element-type-icon">📱</span>
              <span class="element-type-label">Phone</span>
            </button>
            <button
              class="element-type-btn preset"
              onClick={() => handleAddDevice('landscape')}
              title="Phone mockup (landscape) with a video screen, sized to the canvas"
            >
              <span class="element-type-icon">🖥</span>
              <span class="element-type-label">Landscape</span>
            </button>
            <button
              class="element-type-btn preset"
              onClick={() => handleAddDevice('tablet')}
              title="Tablet mockup with a video screen, sized to the canvas"
            >
              <span class="element-type-icon">▭</span>
              <span class="element-type-label">Tablet</span>
            </button>
          </div>
        </div>

        {/* Group Actions */}
        <Show when={canGroup() || selectedIsGroup()}>
          <div class="element-group-section">
            <Show when={canGroup()}>
              <button class="element-group-btn" onClick={handleGroup} title="Group selected elements">
                <span>⊞</span> Group ({selectedIds().length})
              </button>
            </Show>
            <Show when={selectedIsGroup()}>
              <button class="element-group-btn ungroup" onClick={handleUngroup} title="Ungroup">
                <span>⊟</span> Ungroup
              </button>
            </Show>
          </div>
        </Show>

        {/* Element List */}
        <div class="element-list-section">
          <span class="section-label">
            Layers ({props.sceneStore.elementCount()})
            <Show when={selectedIds().length > 1}>
              <span class="multi-select-hint"> • {selectedIds().length} selected</span>
            </Show>
          </span>

          <div class="element-list">
            <Show
              when={props.sceneStore.elements().length > 0}
              fallback={
                <div class="element-list-empty">
                  <p>No elements yet</p>
                  <p class="hint">Add elements above</p>
                </div>
              }
            >
              {/* Reverse order so top layers appear at top */}
              <For each={[...props.sceneStore.topLevelElements()].reverse()}>
                {(element) => (
                  <div
                    class="element-item"
                    classList={{
                      selected: props.sceneStore.state.selectedElementId === element.id ||
                               props.sceneStore.state.selectedElementIds.includes(element.id),
                      hidden: !element.visible,
                      locked: element.locked,
                      group: element.type === 'group',
                    }}
                    onClick={(e) => handleSelectElement(element.id, e)}
                  >
                    <span class="element-icon">
                      {element.type === 'rect' && '▢'}
                      {element.type === 'circle' && '○'}
                      {element.type === 'text' && 'T'}
                      {element.type === 'image' && '🖼'}
                      {element.type === 'audio' && '🔊'}
                      {element.type === 'video' && '🎬'}
                      {element.type === 'line' && '/'}
                      {element.type === 'arrow' && '➔'}
                      {element.type === 'path' && '⌇'}
                      {element.type === 'group' && '⊞'}
                    </span>
                    <span class="element-name">
                      {element.name}
                      <Show when={element.type === 'group'}>
                        <span class="group-count"> ({(element as GroupElement).childIds.length})</span>
                      </Show>
                    </span>

                    <div class="element-actions">
                      <button
                        class="element-action-btn"
                        classList={{ active: !element.visible }}
                        onClick={(e) => handleToggleVisibility(element.id, e)}
                        title={element.visible ? 'Hide' : 'Show'}
                      >
                        {element.visible ? '👁' : '👁‍🗨'}
                      </button>
                      <button
                        class="element-action-btn"
                        classList={{ active: element.locked }}
                        onClick={(e) => handleToggleLock(element.id, e)}
                        title={element.locked ? 'Unlock' : 'Lock'}
                      >
                        {element.locked ? '🔒' : '🔓'}
                      </button>
                    </div>

                    <Show when={props.sceneStore.state.selectedElementId === element.id}>
                      <div class="element-controls">
                        <button
                          class="element-control-btn"
                          onClick={(e) => handleMoveUp(element.id, e)}
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          class="element-control-btn"
                          onClick={(e) => handleMoveDown(element.id, e)}
                          title="Move Down"
                        >
                          ↓
                        </button>
                        <button
                          class="element-control-btn"
                          onClick={(e) => handleDuplicateElement(element.id, e)}
                          title="Duplicate"
                        >
                          ⧉
                        </button>
                        <button
                          class="element-control-btn delete"
                          onClick={(e) => handleDeleteElement(element.id, e)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ElementPanel
