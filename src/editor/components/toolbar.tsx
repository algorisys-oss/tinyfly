import { createSignal, Show } from 'solid-js'
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
  let fileInputRef: HTMLInputElement | undefined

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

      <button
        class="toolbar-btn"
        onClick={handleNewProject}
        title="New Animation"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 9v4h-2v-4H7v-2h4V5h2v4h4v2h-4z"
            fill="currentColor"
          />
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
            <path
              d="M12 2l1.9 4.6L18.5 8.5 13.9 10.4 12 15l-1.9-4.6L5.5 8.5l4.6-1.9L12 2zm6 11l.95 2.3L21.5 16.5l-2.55 1.2L18 20l-.95-2.3L14.5 16.5l2.55-1.2L18 13z"
              fill="currentColor"
            />
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
            <path
              d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 6v8h16v-8H4z"
              fill="currentColor"
            />
          </svg>
          <span>My Animations</span>
        </button>
      </Show>

      <Show when={props.sceneStore}>
        <button
          class="toolbar-btn toolbar-btn-sample"
          onClick={() => props.onSamples?.()}
          title="Browse Sample Animations"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"
              fill="currentColor"
            />
          </svg>
          <span>Samples</span>
        </button>
      </Show>

      <a
        href="/gallery"
        class="toolbar-btn toolbar-btn-gallery"
        title="View Animation Gallery"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"
            fill="currentColor"
          />
        </svg>
        <span>Gallery</span>
      </a>

      <a
        href="/docs"
        class="toolbar-btn toolbar-btn-docs"
        title="View Documentation"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"
            fill="currentColor"
          />
        </svg>
        <span>Docs</span>
      </a>

      <button
        class="toolbar-btn"
        onClick={handleImportClick}
        disabled={importing()}
        title="Import Animation (JSON)"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"
            fill="currentColor"
          />
        </svg>
        <span>Import</span>
      </button>

      <button
        class="toolbar-btn"
        onClick={handleExport}
        disabled={!props.store.state.timeline}
        title="Export Animation (JSON)"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
            fill="currentColor"
          />
        </svg>
        <span>Export</span>
      </button>

      <button
        class="toolbar-btn"
        onClick={() => props.onExportAs?.()}
        disabled={!props.store.state.timeline}
        title="Export as CSS, Lottie, or GIF"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z"
            fill="currentColor"
          />
        </svg>
        <span>Export As</span>
      </button>

      <div class="toolbar-divider" />

      <button
        class="toolbar-btn toolbar-btn-embed"
        onClick={() => props.onEmbed?.()}
        disabled={!props.store.state.timeline}
        title="Get Embed Code"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
            fill="currentColor"
          />
        </svg>
        <span>Embed</span>
      </button>

      <button
        class="toolbar-btn toolbar-btn-help"
        onClick={() => props.onShowShortcuts?.()}
        title="Keyboard Shortcuts (?)"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"
            fill="currentColor"
          />
        </svg>
        <span>Help</span>
      </button>

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
