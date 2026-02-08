import { createSignal, For, Show, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import type { ProjectStore } from '../stores/project-store'
import type { SceneDefinition } from '../stores/scene-types'
import type { SceneTransition } from '../../player/sequence-types'
import { DEFAULT_TRANSITION } from '../../player/sequence-types'
import { TransitionDialog } from './transition-dialog'
import './scene-bar.css'

interface SceneBarProps {
  projectStore: ProjectStore
  onSwitchScene: (sceneId: string) => void
}

interface ContextMenuState {
  sceneId: string
  x: number
  y: number
}

/** Get a short label for a transition type */
function transitionIcon(type: string): string {
  switch (type) {
    case 'fade': return 'F'
    case 'slide-left': return '\u2190'
    case 'slide-right': return '\u2192'
    case 'slide-up': return '\u2191'
    case 'slide-down': return '\u2193'
    default: return '\u2192'
  }
}

export const SceneBar: Component<SceneBarProps> = (props) => {
  const [renamingId, setRenamingId] = createSignal<string | null>(null)
  const [renameValue, setRenameValue] = createSignal('')
  const [contextMenu, setContextMenu] = createSignal<ContextMenuState | null>(null)
  const [transitionSceneId, setTransitionSceneId] = createSignal<string | null>(null)

  // Close context menu on any click
  const handleGlobalClick = () => setContextMenu(null)
  document.addEventListener('click', handleGlobalClick)
  onCleanup(() => document.removeEventListener('click', handleGlobalClick))

  const scenes = () => props.projectStore.getScenes()
  const activeSceneId = () => props.projectStore.currentProject().activeSceneId

  function handleTabClick(sceneId: string) {
    if (sceneId === activeSceneId()) return
    props.onSwitchScene(sceneId)
  }

  function handleTabDoubleClick(scene: SceneDefinition) {
    setRenamingId(scene.id)
    setRenameValue(scene.name)
  }

  function handleRenameKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      commitRename()
    } else if (e.key === 'Escape') {
      setRenamingId(null)
    }
  }

  function commitRename() {
    const id = renamingId()
    const value = renameValue().trim()
    if (id && value) {
      props.projectStore.renameScene(id, value)
    }
    setRenamingId(null)
  }

  function handleContextMenu(e: MouseEvent, sceneId: string) {
    e.preventDefault()
    setContextMenu({ sceneId, x: e.clientX, y: e.clientY })
  }

  function handleAddScene() {
    const scene = props.projectStore.addScene()
    props.onSwitchScene(scene.id)
  }

  function handleDuplicate(sceneId: string) {
    const scene = props.projectStore.duplicateScene(sceneId)
    if (scene) {
      props.onSwitchScene(scene.id)
    }
    setContextMenu(null)
  }

  function handleDelete(sceneId: string) {
    const wasActive = sceneId === activeSceneId()
    const removed = props.projectStore.removeScene(sceneId)
    if (removed && wasActive) {
      const newActiveId = props.projectStore.currentProject().activeSceneId
      props.onSwitchScene(newActiveId)
    }
    setContextMenu(null)
  }

  function handleRename(sceneId: string) {
    const scene = scenes().find((s) => s.id === sceneId)
    if (scene) {
      setRenamingId(scene.id)
      setRenameValue(scene.name)
    }
    setContextMenu(null)
  }

  function handleMoveLeft(sceneId: string) {
    props.projectStore.reorderScene(sceneId, 'left')
    setContextMenu(null)
  }

  function handleMoveRight(sceneId: string) {
    props.projectStore.reorderScene(sceneId, 'right')
    setContextMenu(null)
  }

  function handleSetTransition(sceneId: string) {
    setTransitionSceneId(sceneId)
    setContextMenu(null)
  }

  function handleTransitionApply(transition: SceneTransition) {
    const sceneId = transitionSceneId()
    if (sceneId) {
      props.projectStore.setSceneTransition(sceneId, transition)
    }
    setTransitionSceneId(null)
  }

  function getTransitionForScene(sceneId: string): SceneTransition {
    return props.projectStore.getSceneTransition(sceneId)
  }

  const transitionScene = () => {
    const id = transitionSceneId()
    if (!id) return null
    return scenes().find((s) => s.id === id) ?? null
  }

  return (
    <>
      <div class="scene-bar">
        <For each={scenes()}>
          {(scene, index) => (
            <>
              {/* Transition indicator between scenes (not before the first) */}
              <Show when={index() > 0}>
                {(() => {
                  const t = getTransitionForScene(scene.id)
                  const hasTransition = t.type !== 'none'
                  return (
                    <button
                      class={`scene-transition-indicator ${hasTransition ? 'has-transition' : ''}`}
                      onClick={() => handleSetTransition(scene.id)}
                      title={hasTransition ? `${t.type} (${t.duration}ms) — click to edit` : 'Add transition'}
                    >
                      {hasTransition ? transitionIcon(t.type) : '\u2192'}
                    </button>
                  )
                })()}
              </Show>

              <button
                class={`scene-tab ${scene.id === activeSceneId() ? 'active' : ''}`}
                onClick={() => handleTabClick(scene.id)}
                onDblClick={() => handleTabDoubleClick(scene)}
                onContextMenu={(e) => handleContextMenu(e, scene.id)}
                title={scene.name}
              >
                <Show
                  when={renamingId() === scene.id}
                  fallback={<span class="scene-tab-name">{scene.name}</span>}
                >
                  <input
                    class="scene-tab-rename"
                    value={renameValue()}
                    onInput={(e) => setRenameValue(e.currentTarget.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={commitRename}
                    ref={(el) => setTimeout(() => el.focus(), 0)}
                  />
                </Show>
              </button>
            </>
          )}
        </For>

        <button
          class="scene-add-btn"
          onClick={handleAddScene}
          title="Add scene"
        >
          +
        </button>

        <Show when={contextMenu()}>
          {(menu) => {
            const isFirstScene = () => {
              const sorted = scenes()
              return sorted.length > 0 && sorted[0].id === menu().sceneId
            }
            return (
              <div
                class="scene-context-menu"
                style={{ left: `${menu().x}px`, top: `${menu().y}px` }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  class="scene-context-menu-item"
                  onClick={() => handleRename(menu().sceneId)}
                >
                  Rename
                </button>
                <button
                  class="scene-context-menu-item"
                  onClick={() => handleDuplicate(menu().sceneId)}
                >
                  Duplicate
                </button>
                <Show when={!isFirstScene()}>
                  <button
                    class="scene-context-menu-item"
                    onClick={() => handleSetTransition(menu().sceneId)}
                  >
                    Set Transition...
                  </button>
                </Show>
                <div class="scene-context-menu-separator" />
                <button
                  class="scene-context-menu-item"
                  onClick={() => handleMoveLeft(menu().sceneId)}
                >
                  Move Left
                </button>
                <button
                  class="scene-context-menu-item"
                  onClick={() => handleMoveRight(menu().sceneId)}
                >
                  Move Right
                </button>
                <div class="scene-context-menu-separator" />
                <button
                  class="scene-context-menu-item danger"
                  disabled={scenes().length <= 1}
                  onClick={() => handleDelete(menu().sceneId)}
                >
                  Delete
                </button>
              </div>
            )
          }}
        </Show>
      </div>

      {/* Transition dialog */}
      <TransitionDialog
        isOpen={transitionSceneId() !== null}
        sceneName={transitionScene()?.name ?? ''}
        transition={transitionSceneId() ? getTransitionForScene(transitionSceneId()!) : { ...DEFAULT_TRANSITION }}
        onApply={handleTransitionApply}
        onClose={() => setTransitionSceneId(null)}
      />
    </>
  )
}
