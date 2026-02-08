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
  onShowShortcuts?: () => void
}

export const Toolbar: Component<ToolbarProps> = (props) => {
  const [importing, setImporting] = createSignal(false)
  const [showNewConfirm, setShowNewConfirm] = createSignal(false)
  let fileInputRef: HTMLInputElement | undefined

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

      {/* Project name display */}
      <Show when={props.projectStore}>
        <span class="toolbar-project-name" title="Project name">
          {props.projectStore!.currentProject().name}
          <Show when={props.projectStore!.isDirty()}>
            <span class="toolbar-dirty-indicator">*</span>
          </Show>
        </span>
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
