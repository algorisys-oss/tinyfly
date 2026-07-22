import { createSignal, Show, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import type { ProjectStore } from '../stores/project-store'
import type { SceneStore } from '../stores/scene-store'
import './toolbar.css'

interface ToolbarProps {
  store: EditorStore
  projectStore?: ProjectStore
  sceneStore?: SceneStore
  onEmbed?: () => void
  onExportAs?: () => void
  onSamples?: () => void
  onOpenGallery?: () => void
  onSave?: () => void
  onToggleAI?: () => void
  aiOpen?: boolean
  onShowShortcuts?: () => void
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  const [importing, setImporting] = createSignal(false)
  const [showNewConfirm, setShowNewConfirm] = createSignal(false)
  const [showMore, setShowMore] = createSignal(false)
  let fileInputRef: HTMLInputElement | undefined
  let moreRef: HTMLDivElement | undefined

  // Close the More menu on an outside click.
  const handleDocClick = (e: MouseEvent) => {
    if (showMore() && moreRef && !moreRef.contains(e.target as Node)) setShowMore(false)
  }
  document.addEventListener('click', handleDocClick)
  onCleanup(() => document.removeEventListener('click', handleDocClick))

  // Inline rename of the project title (double-click the name to edit).
  const [renaming, setRenaming] = createSignal(false)
  const [renameValue, setRenameValue] = createSignal('')
  let renameInputRef: HTMLInputElement | undefined

  const startRename = () => {
    if (!props.projectStore) return
    setRenameValue(props.projectStore.currentProject().name)
    setRenaming(true)
    // Focus + select once the input is in the DOM.
    queueMicrotask(() => {
      renameInputRef?.focus()
      renameInputRef?.select()
    })
  }

  const commitRename = () => {
    if (!renaming()) return
    const value = renameValue().trim()
    if (value && props.projectStore) {
      props.projectStore.rename(value)
    }
    setRenaming(false)
  }

  const cancelRename = () => setRenaming(false)

  const handleRenameKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      cancelRename()
    }
  }

  // Explicit save with a short "Saving…" flash, then a "Saved ✓" resting state.
  // Auto-save still runs; this is a reassuring, tap-friendly manual trigger.
  const [saving, setSaving] = createSignal(false)
  const isDirty = () => props.projectStore?.isDirty() ?? false

  const saveState = (): 'saving' | 'dirty' | 'saved' => {
    if (saving()) return 'saving'
    return isDirty() ? 'dirty' : 'saved'
  }

  const saveLabel = () => ({ saving: 'Saving…', dirty: 'Save', saved: 'Saved' }[saveState()])

  const handleSave = () => {
    if (saving()) return
    setSaving(true)
    props.onSave?.()
    window.setTimeout(() => setSaving(false), 500)
  }

  const handleExport = () => {
    props.store.exportToFile()
  }

  const handleImportClick = () => {
    fileInputRef?.click()
  }

  const handleFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    setImporting(true)
    const success = await props.store.importFromFile(file)
    setImporting(false)

    if (!success) {
      alert('Failed to import animation. Please check the file format.')
    }

    // Reset input so the same file can be selected again
    input.value = ''
  }

  const handleNewProject = () => {
    if (props.projectStore) {
      // If there are unsaved changes, confirm first
      if (props.projectStore.isDirty()) {
        setShowNewConfirm(true)
      } else {
        createNewProject()
      }
    } else {
      // No project store, just clear the timeline
      if (props.store.state.timeline && props.store.tracks().length > 0) {
        if (confirm('Create a new animation? Current work will be lost.')) {
          props.store.createNewTimeline('new', 'Untitled Animation', { duration: 2000 })
          props.store.clearHistory()
          if (props.sceneStore) {
            props.sceneStore.clearElements()
          }
        }
      } else {
        props.store.createNewTimeline('new', 'Untitled Animation', { duration: 2000 })
        props.store.clearHistory()
        if (props.sceneStore) {
          props.sceneStore.clearElements()
        }
      }
    }
  }

  const createNewProject = () => {
    if (props.projectStore) {
      const project = props.projectStore.createNew()
      // Create a new timeline for the new project
      props.store.createNewTimeline(project.id, project.name, { duration: 2000 })
      props.store.clearHistory()
      // Clear scene elements
      if (props.sceneStore) {
        props.sceneStore.clearElements()
      }
    }
    setShowNewConfirm(false)
  }

  const handleSaveAndNew = () => {
    if (props.projectStore) {
      props.projectStore.saveNow()
    }
    createNewProject()
  }

  const handleDiscardAndNew = () => {
    createNewProject()
  }

  return (
    <div class="toolbar">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Project name — double-click to rename inline */}
      <Show when={props.projectStore}>
        <Show
          when={renaming()}
          fallback={
            <span
              class="toolbar-project-name"
              title="Double-click to rename"
              onDblClick={startRename}
            >
              {props.projectStore!.currentProject().name}
              <Show when={props.projectStore!.isDirty()}>
                <span class="toolbar-dirty-indicator" title="Unsaved changes — auto-saving…">*</span>
              </Show>
            </span>
          }
        >
          <input
            ref={renameInputRef}
            class="toolbar-project-name-input"
            value={renameValue()}
            onInput={(e) => setRenameValue(e.currentTarget.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={commitRename}
            maxLength={100}
            aria-label="Project name"
          />
        </Show>
      </Show>

      {/* Explicit save + status. Auto-save still runs; this is a tap-friendly
          manual trigger with a clear Saved/Saving/Unsaved state. */}
      <Show when={props.projectStore && props.onSave}>
        <button
          class={`toolbar-save-btn ${saveState()}`}
          onClick={handleSave}
          disabled={saving()}
          title={saveState() === 'saved' ? 'All changes saved' : 'Save now'}
        >
          <Show
            when={saveState() === 'saved'}
            fallback={
              <svg viewBox="0 0 24 24" width="15" height="15">
                <path
                  d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z"
                  fill="currentColor"
                />
              </svg>
            }
          >
            <svg viewBox="0 0 24 24" width="15" height="15">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor" />
            </svg>
          </Show>
          <span>{saveLabel()}</span>
        </button>
      </Show>

      <div class="toolbar-divider" />

      <button class="toolbar-btn" onClick={handleNewProject} title="New Animation">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 9v4h-2v-4H7v-2h4V5h2v4h4v2h-4z" fill="currentColor" />
        </svg>
        <span>New</span>
      </button>

      <Show when={props.onToggleAI}>
        <button
          class="toolbar-btn toolbar-btn-ai"
          classList={{ active: props.aiOpen }}
          onClick={() => props.onToggleAI?.()}
          title={props.aiOpen ? 'Hide the AI prompt bar' : 'Generate an animation with AI'}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 2l1.9 4.6L18.5 8.5 13.9 10.4 12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2zm6 11l.95 2.3L21.5 16.5l-2.55 1.2L18 20l-.95-2.3L14.5 16.5l2.55-1.2L18 13z" fill="currentColor" />
          </svg>
          <span>AI</span>
        </button>
      </Show>

      <Show when={props.projectStore && props.onOpenGallery}>
        <button
          class="toolbar-btn toolbar-btn-myfiles"
          onClick={() => props.onOpenGallery?.()}
          title="My Animations — browse, open and manage your saved projects"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 6v8h16v-8H4z" fill="currentColor" />
          </svg>
          <span>My Animations</span>
        </button>
      </Show>

      <Show when={props.sceneStore}>
        <button class="toolbar-btn toolbar-btn-sample" onClick={() => props.onSamples?.()} title="Browse Sample Animations">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z" fill="currentColor" />
          </svg>
          <span>Samples</span>
        </button>
      </Show>

      {/* Single Export = the format dialog (GIF/WebP/MP4/CSS/Lottie). JSON
          export lives in the More menu. */}
      <button
        class="toolbar-btn"
        onClick={() => props.onExportAs?.()}
        disabled={!props.store.state.timeline}
        title="Export as GIF, WebP, MP4, CSS or Lottie"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
        </svg>
        <span>Export</span>
      </button>

      {/* Overflow menu for secondary actions */}
      <div class="toolbar-more" ref={moreRef}>
        <button
          class="toolbar-btn"
          classList={{ active: showMore() }}
          onClick={() => setShowMore((v) => !v)}
          title="More actions"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M6 10a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" fill="currentColor" />
          </svg>
          <span>More</span>
        </button>

        <Show when={showMore()}>
          <div class="toolbar-more-menu">
            <button
              class="toolbar-more-item"
              disabled={importing()}
              onClick={() => { handleImportClick(); setShowMore(false) }}
            >
              Import JSON…
            </button>
            <button
              class="toolbar-more-item"
              disabled={!props.store.state.timeline}
              onClick={() => { handleExport(); setShowMore(false) }}
            >
              Export JSON
            </button>
            <button
              class="toolbar-more-item"
              disabled={!props.store.state.timeline}
              onClick={() => { props.onEmbed?.(); setShowMore(false) }}
            >
              Embed…
            </button>
            <div class="toolbar-more-sep" />
            <a class="toolbar-more-item" href="/gallery" onClick={() => setShowMore(false)}>
              Examples Gallery
            </a>
            <a class="toolbar-more-item" href="/docs" onClick={() => setShowMore(false)}>
              Docs
            </a>
            <button
              class="toolbar-more-item"
              onClick={() => { props.onShowShortcuts?.(); setShowMore(false) }}
            >
              Keyboard Shortcuts
            </button>
          </div>
        </Show>
      </div>

      {/* New project confirmation dialog */}
      <Show when={showNewConfirm()}>
        <div class="toolbar-dialog-overlay" onClick={() => setShowNewConfirm(false)}>
          <div class="toolbar-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Unsaved Changes</h3>
            <p>You have unsaved changes. What would you like to do?</p>
            <div class="toolbar-dialog-actions">
              <button class="toolbar-btn toolbar-btn-primary" onClick={handleSaveAndNew}>
                Save & Create New
              </button>
              <button class="toolbar-btn toolbar-btn-danger" onClick={handleDiscardAndNew}>
                Discard & Create New
              </button>
              <button class="toolbar-btn" onClick={() => setShowNewConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default Toolbar
