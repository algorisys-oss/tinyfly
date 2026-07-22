import { createSignal, For, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { ProjectStore } from '../stores/project-store'
import { useEscapeClose } from '../utils/use-escape-close'
import './gallery-dialog.css'

interface GalleryDialogProps {
  projectStore: ProjectStore
  isOpen: boolean
  onClose: () => void
  /** Switch to a project, reload the editor and close the gallery. */
  onOpenProject: (id: string) => void
  /** Create a fresh project, load it and close the gallery. */
  onNewProject: () => void
}

/** Format a timestamp as a short, human relative time (falls back to a date). */
function formatModified(ts: number): string {
  const diff = Date.now() - ts
  const min = 60_000
  const hour = 60 * min
  const day = 24 * hour
  if (diff < min) return 'just now'
  if (diff < hour) return `${Math.floor(diff / min)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * "My Animations" gallery — browse every saved project, open one to keep
 * editing, duplicate it, or delete it. Thumbnails and metadata come straight
 * from the project store (IndexedDB-backed).
 */
export const GalleryDialog: Component<GalleryDialogProps> = (props) => {
  useEscapeClose(() => props.isOpen, () => props.onClose())

  // Bump to force the list/thumbnails to re-read after a mutation (duplicate,
  // delete) that doesn't otherwise re-trigger the signal we're iterating.
  const [refreshKey, setRefreshKey] = createSignal(0)
  const [confirmDeleteId, setConfirmDeleteId] = createSignal<string | null>(null)

  const projects = () => {
    refreshKey()
    return props.projectStore.getProjectList()
  }

  const currentId = () => props.projectStore.currentProject().id

  const handleOpen = (id: string) => {
    if (id === currentId()) {
      props.onClose()
      return
    }
    props.onOpenProject(id)
  }

  const handleDuplicate = (id: string, e: MouseEvent) => {
    e.stopPropagation()
    const copy = props.projectStore.duplicate(id)
    if (copy) props.onOpenProject(copy.id)
  }

  const requestDelete = (id: string, e: MouseEvent) => {
    e.stopPropagation()
    setConfirmDeleteId(id)
  }

  const confirmDelete = (id: string) => {
    const wasCurrent = id === currentId()
    props.projectStore.deleteProject(id)
    setConfirmDeleteId(null)
    setRefreshKey((k) => k + 1)
    // Deleting the current project switches the store to another one — reload
    // the editor so it stops showing the now-gone scene.
    if (wasCurrent) props.onOpenProject(props.projectStore.currentProject().id)
  }

  return (
    <Show when={props.isOpen}>
      <div class="gallery-dialog-overlay" onClick={() => props.onClose()}>
        <div class="gallery-dialog" onClick={(e) => e.stopPropagation()}>
          <div class="gallery-dialog-header">
            <div>
              <h2>My Animations</h2>
              <span class="gallery-count">
                {projects().length} {projects().length === 1 ? 'project' : 'projects'}
              </span>
            </div>
            <div class="gallery-header-actions">
              <button
                class="gallery-new-btn"
                onClick={() => props.onNewProject()}
                title="Create a new animation"
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
                </svg>
                New
              </button>
              <button class="gallery-close-btn" onClick={() => props.onClose()} title="Close">
                ×
              </button>
            </div>
          </div>

          <div class="gallery-grid">
            <For each={projects()}>
              {(project) => {
                const thumb = () => {
                  refreshKey()
                  return props.projectStore.getThumbnail(project.id)
                }
                const isCurrent = () => project.id === currentId()
                return (
                  <div
                    class="gallery-card"
                    classList={{ 'gallery-card-current': isCurrent() }}
                    onClick={() => handleOpen(project.id)}
                  >
                    <div class="gallery-thumb">
                      <Show
                        when={thumb()}
                        fallback={
                          <div class="gallery-thumb-empty">
                            <svg viewBox="0 0 24 24" width="32" height="32">
                              <path
                                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        }
                      >
                        <img src={thumb()} alt={project.name} loading="lazy" />
                      </Show>
                      <Show when={isCurrent()}>
                        <span class="gallery-current-badge">Editing</span>
                      </Show>
                    </div>

                    <div class="gallery-card-body">
                      <span class="gallery-card-name" title={project.name}>
                        {project.name}
                      </span>
                      <span class="gallery-card-meta">{formatModified(project.modified)}</span>
                    </div>

                    <Show
                      when={confirmDeleteId() === project.id}
                      fallback={
                        <div class="gallery-card-actions">
                          <button
                            class="gallery-action"
                            onClick={(e) => handleDuplicate(project.id, e)}
                            title="Duplicate"
                          >
                            <svg viewBox="0 0 24 24" width="15" height="15">
                              <path
                                d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                          <button
                            class="gallery-action gallery-action-danger"
                            onClick={(e) => requestDelete(project.id, e)}
                            title="Delete"
                          >
                            <svg viewBox="0 0 24 24" width="15" height="15">
                              <path
                                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                      }
                    >
                      <div
                        class="gallery-confirm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Delete?</span>
                        <button
                          class="gallery-action gallery-action-danger"
                          onClick={() => confirmDelete(project.id)}
                        >
                          Yes
                        </button>
                        <button class="gallery-action" onClick={() => setConfirmDeleteId(null)}>
                          No
                        </button>
                      </div>
                    </Show>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default GalleryDialog
