import { onMount, onCleanup, createSignal, createEffect } from 'solid-js'
import type { Component } from 'solid-js'
import {
  TimelineView,
  PreviewPanel,
  PlaybackControls,
  PropertyPanel,
  TrackPanel,
  Toolbar,
  ProjectSettingsDialog,
  EmbedDialog,
  ExportDialog,
  SamplesDialog,
  ShortcutsDialog,
  ElementPanel,
  PresetPanel,
  OnboardingOverlay,
  Tooltip,
} from './components'
import { createEditorStore, createProjectStore, createSceneStore, createOnboardingStore } from './stores'
import { serializeTimeline, deserializeTimeline } from '../engine'
import { StatusBar } from '../components'
import './editor.css'

export const Editor: Component = () => {
  const store = createEditorStore()
  const projectStore = createProjectStore()
  const sceneStore = createSceneStore()
  const onboardingStore = createOnboardingStore()
  const [showSettings, setShowSettings] = createSignal(false)
  const [showEmbed, setShowEmbed] = createSignal(false)
  const [showExportAs, setShowExportAs] = createSignal(false)
  const [showSamples, setShowSamples] = createSignal(false)
  const [showShortcuts, setShowShortcuts] = createSignal(false)

  // Mobile sidebar state
  const [leftSidebarOpen, setLeftSidebarOpen] = createSignal(false)
  const [rightSidebarOpen, setRightSidebarOpen] = createSignal(false)

  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(!leftSidebarOpen())
    setRightSidebarOpen(false)
  }

  const toggleRightSidebar = () => {
    setRightSidebarOpen(!rightSidebarOpen())
    setLeftSidebarOpen(false)
  }

  const closeSidebars = () => {
    setLeftSidebarOpen(false)
    setRightSidebarOpen(false)
  }

  // Keyboard shortcut for help dialog
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if typing in an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }
    // '?' or 'Shift+/' to show shortcuts dialog
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault()
      setShowShortcuts(true)
    }
  }

  // Initialize timeline from project or create demo
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
    const project = projectStore.currentProject()

    if (project.timeline) {
      // Load existing timeline from project
      const timeline = deserializeTimeline(project.timeline)
      store.loadTimeline(timeline)
    } else {
      // Create a demo timeline for new projects
      store.createNewTimeline(project.id, project.name, {
        duration: 2000,
      })

      // Add some demo tracks
      store.addTrack({
        id: 'opacity-track',
        target: 'box',
        property: 'opacity',
        keyframes: [
          { time: 0, value: 0 },
          { time: 500, value: 1, easing: 'ease-out' },
          { time: 1500, value: 1 },
          { time: 2000, value: 0, easing: 'ease-in' },
        ],
      })

      store.addTrack({
        id: 'x-track',
        target: 'box',
        property: 'x',
        keyframes: [
          { time: 0, value: -50 },
          { time: 1000, value: 50, easing: 'ease-in-out' },
          { time: 2000, value: -50, easing: 'ease-in-out' },
        ],
      })

      store.addTrack({
        id: 'rotate-track',
        target: 'box',
        property: 'rotate',
        keyframes: [
          { time: 0, value: 0 },
          { time: 2000, value: 360, easing: 'linear' },
        ],
      })

      store.addTrack({
        id: 'scale-track',
        target: 'box',
        property: 'scale',
        keyframes: [
          { time: 0, value: 1 },
          { time: 1000, value: 1.5, easing: 'ease-out' },
          { time: 2000, value: 1, easing: 'ease-in' },
        ],
      })

      // Clear history after setting up demo (so demo setup isn't in undo stack)
      store.clearHistory()
    }
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  // Auto-save: sync timeline to project store when it changes
  createEffect(() => {
    const timeline = store.state.timeline
    if (timeline) {
      const serialized = serializeTimeline(timeline)
      projectStore.updateTimeline(serialized)
    }
  })

  const handleSettingsClick = () => {
    setShowSettings(true)
  }

  return (
    <div class="editor">
      <header class="editor-header">
        <h1>tinyfly</h1>
        <span class="editor-subtitle">Animation Editor</span>
        <Tooltip content="Take the tour again" position="bottom">
          <button
            class="help-tour-btn"
            onClick={() => onboardingStore.restart()}
            title="Help Tour"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
                fill="currentColor"
              />
            </svg>
          </button>
        </Tooltip>
        <button
          class="settings-btn"
          onClick={handleSettingsClick}
          title="Project Settings"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
              fill="currentColor"
            />
          </svg>
        </button>
        <Toolbar store={store} projectStore={projectStore} sceneStore={sceneStore} onEmbed={() => setShowEmbed(true)} onExportAs={() => setShowExportAs(true)} onSamples={() => setShowSamples(true)} onShowShortcuts={() => setShowShortcuts(true)} />
      </header>

      <main class="editor-main">
        {/* Mobile sidebar overlay */}
        <div
          class={`mobile-sidebar-overlay ${leftSidebarOpen() || rightSidebarOpen() ? 'visible' : ''}`}
          onClick={closeSidebars}
        />

        <aside class={`editor-sidebar editor-sidebar-left ${leftSidebarOpen() ? 'open' : ''}`}>
          <ElementPanel sceneStore={sceneStore} />
          <TrackPanel store={store} />
        </aside>

        <div class="editor-center">
          <section class="editor-preview">
            <PreviewPanel store={store} sceneStore={sceneStore} />
          </section>

          <section class="editor-controls">
            <PlaybackControls store={store} />
          </section>

          <section class="editor-timeline">
            <TimelineView store={store} />
          </section>
        </div>

        <aside class={`editor-sidebar editor-sidebar-right ${rightSidebarOpen() ? 'open' : ''}`}>
          <PropertyPanel store={store} sceneStore={sceneStore} />
          <PresetPanel store={store} sceneStore={sceneStore} />
        </aside>

        {/* Mobile sidebar toggle buttons */}
        <button
          class={`mobile-sidebar-toggle left ${leftSidebarOpen() ? 'active' : ''}`}
          onClick={toggleLeftSidebar}
          title="Elements & Tracks"
        >
          {leftSidebarOpen() ? '✕' : '☰'}
        </button>
        <button
          class={`mobile-sidebar-toggle right ${rightSidebarOpen() ? 'active' : ''}`}
          onClick={toggleRightSidebar}
          title="Properties & Presets"
        >
          {rightSidebarOpen() ? '✕' : '⚙'}
        </button>
      </main>

      <ProjectSettingsDialog
        projectStore={projectStore}
        isOpen={showSettings()}
        onClose={() => setShowSettings(false)}
      />

      <EmbedDialog
        store={store}
        sceneStore={sceneStore}
        isOpen={showEmbed()}
        onClose={() => setShowEmbed(false)}
      />

      <ExportDialog
        store={store}
        sceneStore={sceneStore}
        isOpen={showExportAs()}
        onClose={() => setShowExportAs(false)}
      />

      <SamplesDialog
        store={store}
        sceneStore={sceneStore}
        isOpen={showSamples()}
        onClose={() => setShowSamples(false)}
      />

      <ShortcutsDialog isOpen={showShortcuts()} onClose={() => setShowShortcuts(false)} />

      <OnboardingOverlay store={onboardingStore} />

      <StatusBar />
    </div>
  )
}

export default Editor
