import { createSignal, createEffect, For, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { ProjectStore } from '../stores/project-store'
import type { SceneStore } from '../stores/scene-store'
import { renderSceneThumbnail } from '../utils/scene-thumbnail'
import { createCollapsed } from '../utils/use-collapsed'
import './library-panel.css'

interface LibraryPanelProps {
  projectStore: ProjectStore
  sceneStore: SceneStore
  /** Bundle the current selection into a symbol (orchestrated by the editor). */
  onConvert: () => void
  /** Open a symbol for edit-in-place (orchestrated by the editor). */
  onEdit: (symbolId: string) => void
}

/**
 * The Symbol Library — reusable symbols shared across scenes. Convert a
 * selection into a symbol, then place instances; edit the symbol once and every
 * instance updates.
 */
export const LibraryPanel: Component<LibraryPanelProps> = (props) => {
  const [renamingId, setRenamingId] = createSignal<string | null>(null)
  const [renameValue, setRenameValue] = createSignal('')
  const [thumbVersion, setThumbVersion] = createSignal(0)
  const attempted = new Set<string>()

  const symbols = () => props.projectStore.getSymbols()
  const hasSelection = () => props.sceneStore.selectedElementIds().length > 0

  // Generate a thumbnail once per symbol (regenerate when its contents change).
  createEffect(() => {
    const bg = props.projectStore.currentProject().canvas.background
    for (const sym of symbols()) {
      const key = `${sym.id}:${sym.modified}`
      if (attempted.has(key)) continue
      attempted.add(key)
      renderSceneThumbnail(sym.elements, { width: sym.width, height: sym.height, background: bg }, 360, props.projectStore.getSymbol).then(
        (url) => {
          if (url) {
            props.projectStore.setThumbnail(sym.id, url)
            setThumbVersion((v) => v + 1)
          }
        }
      )
    }
  })

  const thumbOf = (id: string) => {
    thumbVersion()
    return props.projectStore.getThumbnail(id)
  }

  const placeInstance = (symbolId: string) => {
    const sym = props.projectStore.getSymbol(symbolId)
    if (!sym) return
    props.sceneStore.addSymbolInstance(
      symbolId,
      { x: 20, y: 20, width: sym.width, height: sym.height },
      undefined
    )
  }

  const startRename = (id: string, name: string) => {
    setRenamingId(id)
    setRenameValue(name)
  }
  const commitRename = () => {
    const id = renamingId()
    const value = renameValue().trim()
    if (id && value) props.projectStore.renameSymbol(id, value)
    setRenamingId(null)
  }

  const handleDelete = (id: string) => {
    const count = props.projectStore.symbolInstanceCount(id)
    if (count > 0) {
      alert(`This symbol has ${count} instance${count === 1 ? '' : 's'} in use. Remove them first.`)
      return
    }
    props.projectStore.deleteSymbol(id)
    setThumbVersion((v) => v + 1)
  }

  const [collapsed, toggleCollapsed] = createCollapsed('tinyfly-panel-library')

  return (
    <div class="library-panel" classList={{ collapsed: collapsed() }}>
      <div class="library-panel-header">
        <button class="panel-toggle" onClick={toggleCollapsed} title={collapsed() ? 'Expand' : 'Collapse'}>
          <span class="panel-chevron" classList={{ collapsed: collapsed() }}>▾</span>
          Library
        </button>
        <button
          class="library-convert-btn"
          onClick={() => props.onConvert()}
          disabled={!hasSelection()}
          title={hasSelection() ? 'Convert the selection into a reusable symbol' : 'Select elements first'}
        >
          + Symbol
        </button>
      </div>

      <div class="library-panel-content">
        <Show
          when={symbols().length > 0}
          fallback={
            <div class="library-empty">
              Select one or more elements on the stage, then <strong>+ Symbol</strong> to make a
              reusable symbol. Place instances here and edit once to update everywhere.
            </div>
          }
        >
          <div class="library-grid">
            <For each={symbols()}>
              {(sym) => {
                const count = () => props.projectStore.symbolInstanceCount(sym.id)
                return (
                  <div class="library-item">
                    <button
                      class="library-thumb"
                      title="Place an instance on the stage"
                      onClick={() => placeInstance(sym.id)}
                    >
                      <Show when={thumbOf(sym.id)} fallback={<span class="library-thumb-empty">◇</span>}>
                        <img src={thumbOf(sym.id)} alt={sym.name} />
                      </Show>
                      <span class="library-place-hint">Place</span>
                    </button>
                    <div class="library-item-row">
                      <Show
                        when={renamingId() === sym.id}
                        fallback={
                          <span
                            class="library-item-name"
                            title={sym.name}
                            onDblClick={() => startRename(sym.id, sym.name)}
                          >
                            {sym.name}
                          </span>
                        }
                      >
                        <input
                          class="library-item-rename"
                          value={renameValue()}
                          onInput={(e) => setRenameValue(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename()
                            else if (e.key === 'Escape') setRenamingId(null)
                          }}
                          onBlur={commitRename}
                          ref={(el) => setTimeout(() => el.focus(), 0)}
                        />
                      </Show>
                      <Show when={count() > 0}>
                        <span class="library-item-count" title={`${count()} instance(s) in use`}>
                          ×{count()}
                        </span>
                      </Show>
                      <button
                        class="library-item-edit"
                        title="Edit symbol (in place)"
                        onClick={() => props.onEdit(sym.id)}
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12">
                          <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        class="library-item-delete"
                        title="Delete symbol"
                        onClick={() => handleDelete(sym.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}

export default LibraryPanel
