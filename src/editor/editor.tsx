import { onMount, onCleanup, createSignal, createEffect, createResource, Show } from 'solid-js'
import type { Component } from 'solid-js'
import {
  TimelinePanel,
  PreviewPanel,
  PlaybackControls,
  PropertyPanel,
  TrackPanel,
  LibraryPanel,
  Toolbar,
  ProjectSettingsDialog,
  EmbedDialog,
  ExportDialog,
  SamplesDialog,
  GalleryDialog,
  ShortcutsDialog,
  ElementPanel,
  PresetPanel,
  OnboardingOverlay,
  Tooltip,
  SceneBar,
  AIPromptBar,
  AISettingsDialog,
} from './components'
import { createEditorStore, createProjectStore, createSceneStore, createOnboardingStore } from './stores'
import type { ProjectBackend } from './stores/project-store'
import { openIndexedDbBackend } from './stores/project-persistence'
import { renderSceneThumbnail } from './utils/scene-thumbnail'
import { elementsBounds, shiftElement } from './utils/element-bounds'
import { serializeTimeline, deserializeTimeline } from '../engine'
import { StatusBar } from '../components'
import './editor.css'

interface EditorInnerProps {
  backend: ProjectBackend
}

const EditorInner: Component<EditorInnerProps> = (props) => {
  const store = createEditorStore()
  const projectStore = createProjectStore({ backend: props.backend })
  const sceneStore = createSceneStore()
  const onboardingStore = createOnboardingStore()

  // Unify undo/redo across the timeline and the scene: element edits snapshot the
  // same history the editor store uses, so one Ctrl+Z reverses the last change of
  // either kind.
  store.attachScene({
    getElements: sceneStore.exportElements,
    setElements: sceneStore.loadElements,
  })
  sceneStore.setHistoryHook(store.pushHistory)

  // Edit context: normally a scene; "edit in place" swaps in a symbol's contents.
  type EditContext = { type: 'scene' } | { type: 'symbol'; symbolId: string }
  const [editContext, setEditContext] = createSignal<EditContext>({ type: 'scene' })
  const editingSymbol = () => {
    const ctx = editContext()
    return ctx.type === 'symbol' ? projectStore.getSymbol(ctx.symbolId) ?? null : null
  }

  // Backstop: if the project changes by any path (e.g. the toolbar "New" button,
  // which bypasses the editor's own flows) while a symbol is open, drop back to
  // scene editing so we never write to a symbol from the wrong project.
  let lastProjectId = projectStore.currentProject().id
  createEffect(() => {
    const id = projectStore.currentProject().id
    if (id !== lastProjectId) {
      lastProjectId = id
      if (editContext().type === 'symbol') setEditContext({ type: 'scene' })
    }
  })

  const [showSettings, setShowSettings] = createSignal(false)
  const [showEmbed, setShowEmbed] = createSignal(false)
  const [showExportAs, setShowExportAs] = createSignal(false)
  const [showSamples, setShowSamples] = createSignal(false)
  const [showGallery, setShowGallery] = createSignal(false)
  const [showShortcuts, setShowShortcuts] = createSignal(false)
  const [showAISettings, setShowAISettings] = createSignal(false)

  // Desktop show/hide for the side panels (Elements/Tracks and Properties/Presets).
  const [leftCollapsed, setLeftCollapsed] = createSignal(false)
  const [rightCollapsed, setRightCollapsed] = createSignal(false)

  // Resizable split between the preview (flex:1) and the timeline. Dragging the
  // splitter changes the timeline height, so the preview grows/shrinks inversely.
  const TIMELINE_HEIGHT_KEY = 'tinyfly-timeline-height'
  const DEFAULT_TIMELINE_HEIGHT = 260
  const loadTimelineHeight = () => {
    const saved = Number(localStorage.getItem(TIMELINE_HEIGHT_KEY))
    return Number.isFinite(saved) && saved >= 120 ? saved : DEFAULT_TIMELINE_HEIGHT
  }
  /** Upper bound for the timeline: leave room for the preview (min ~160px). */
  const maxTimelineHeight = () =>
    Math.max(280, (typeof window !== 'undefined' ? window.innerHeight : 800) - 260)

  const [timelineHeight, setTimelineHeight] = createSignal(loadTimelineHeight())
  // Remember the chosen height across sessions (skip the expanded state).
  createEffect(() => {
    if (!timelineExpanded()) {
      try {
        localStorage.setItem(TIMELINE_HEIGHT_KEY, String(timelineHeight()))
      } catch {
        /* ignore */
      }
    }
  })

  // One-click expand: flip to a tall, timeline-focused layout and back.
  const [timelineExpanded, setTimelineExpanded] = createSignal(false)
  let heightBeforeExpand = DEFAULT_TIMELINE_HEIGHT
  const toggleTimelineExpand = () => {
    if (timelineExpanded()) {
      setTimelineExpanded(false)
      setTimelineHeight(heightBeforeExpand)
    } else {
      heightBeforeExpand = timelineHeight()
      setTimelineExpanded(true)
      setTimelineHeight(maxTimelineHeight())
    }
  }

  const startPreviewResize = (e: PointerEvent) => {
    e.preventDefault()
    setTimelineExpanded(false)
    const startY = e.clientY
    const startHeight = timelineHeight()
    const onMove = (ev: PointerEvent) => {
      // Drag up → timeline grows (preview shrinks); drag down → preview grows.
      const next = startHeight - (ev.clientY - startY)
      setTimelineHeight(Math.max(120, Math.min(maxTimelineHeight(), next)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }

  // Guard to prevent auto-save during scene switching
  let isSwitchingScene = false

  // Scene transition preview animation
  const [sceneTransitionClass, setSceneTransitionClass] = createSignal('')

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

  /**
   * Load a scene's data into the editor and scene stores.
   */
  function loadSceneIntoEditor(sceneId: string) {
    const project = projectStore.currentProject()
    const scene = project.scenes.find((s) => s.id === sceneId) ?? project.scenes[0]

    // Load elements
    sceneStore.loadElements(scene.elements)

    // Load timeline
    if (scene.timeline) {
      const timeline = deserializeTimeline(scene.timeline)
      store.loadTimeline(timeline)
    } else {
      store.createNewTimeline(scene.id, scene.name, { duration: 2000 })
      store.clearHistory()
    }
  }

  /**
   * Save current editor state into the active scene, then switch to a new scene.
   */
  function switchScene(newSceneId: string) {
    isSwitchingScene = true

    try {
      // Get the transition for the target scene (for preview animation)
      const transition = projectStore.getSceneTransition(newSceneId)

      // Stop playback
      store.stop()

      // Save current scene state
      const timeline = store.state.timeline
      const serializedTimeline = timeline ? serializeTimeline(timeline) : null
      const elements = sceneStore.exportElements()
      projectStore.saveActiveSceneState(elements, serializedTimeline)

      // Apply transition preview animation if set
      if (transition.type !== 'none' && transition.duration > 0) {
        setSceneTransitionClass(`scene-switch-${transition.type}`)
        setTimeout(() => setSceneTransitionClass(''), Math.min(transition.duration, 500))
      }

      // Switch active scene
      projectStore.setActiveScene(newSceneId)

      // Load new scene
      loadSceneIntoEditor(newSceneId)

      // Clear undo history (per-scene undo not supported in v1)
      store.clearHistory()
    } finally {
      isSwitchingScene = false
    }
  }

  // Initialize from active scene on mount
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)

    const project = projectStore.currentProject()
    const activeScene = project.scenes.find((s) => s.id === project.activeSceneId)
      ?? project.scenes[0]

    if (activeScene.elements.length > 0) {
      sceneStore.loadElements(activeScene.elements)
    }

    if (activeScene.timeline) {
      const timeline = deserializeTimeline(activeScene.timeline)
      store.loadTimeline(timeline)
    } else {
      // Create a demo timeline for new projects
      store.createNewTimeline(activeScene.id, activeScene.name, {
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

  // Auto-save: sync timeline and elements to active scene in project store.
  //
  // Track and keyframe edits mutate the *same* Timeline instance and announce
  // themselves through the store's version counter, so `state.timeline` is a
  // reference that never changes. Reading the version-backed memos below is what
  // subscribes this effect to those edits — without them the timeline is only
  // ever saved when the element list happens to change, and a reload restores a
  // stale (often empty) timeline that cannot play.
  createEffect(() => {
    if (isSwitchingScene) return

    store.tracks()
    store.duration()

    const timeline = store.state.timeline
    const elements = sceneStore.exportElements()
    const serializedTimeline = timeline ? serializeTimeline(timeline) : null
    const ctx = editContext()
    if (ctx.type === 'symbol') {
      // Editing a symbol in place → write back to the Library definition.
      projectStore.updateSymbol(ctx.symbolId, { elements, timeline: serializedTimeline })
    } else {
      projectStore.saveActiveSceneState(elements, serializedTimeline)
    }
  })

  /** Push the current scene/symbol straight to storage, bypassing the debounce. */
  const flushSave = () => {
    if (isSwitchingScene) return
    const timeline = store.state.timeline
    const elements = sceneStore.exportElements()
    const serialized = timeline ? serializeTimeline(timeline) : null
    const ctx = editContext()
    if (ctx.type === 'symbol') {
      projectStore.updateSymbol(ctx.symbolId, { elements, timeline: serialized })
    } else {
      projectStore.saveActiveSceneState(elements, serialized)
    }
    projectStore.saveNow()
  }

  // A reload can land inside the auto-save debounce window and lose the last
  // edit, so flush on the way out. `visibilitychange` covers mobile, where
  // `beforeunload` is unreliable.
  onMount(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushSave()
    }
    window.addEventListener('beforeunload', flushSave)
    document.addEventListener('visibilitychange', onHide)
    onCleanup(() => {
      window.removeEventListener('beforeunload', flushSave)
      document.removeEventListener('visibilitychange', onHide)
    })
  })

  const handleSettingsClick = () => {
    setShowSettings(true)
  }

  /**
   * Convert the current selection into a reusable symbol: bundle the selected
   * elements (normalized to the symbol's local origin) into a new Library symbol,
   * then replace them on the stage with a single instance.
   */
  const convertToSymbol = () => {
    const ids = sceneStore.selectedElementIds()
    if (ids.length === 0) return
    const selected = sceneStore.exportElements().filter((el) => ids.includes(el.id) && el.type !== 'group')
    if (selected.length === 0) return

    const bbox = elementsBounds(selected)
    // Symbol-local copies: shift so the bbox top-left sits at (0,0).
    const local = selected.map((el) => shiftElement(structuredClone(el), -bbox.x, -bbox.y))

    const name = `Symbol ${projectStore.getSymbols().length + 1}`
    const symbol = projectStore.createSymbol(name, local, { width: bbox.width, height: bbox.height })
    sceneStore.replaceElementsWithSymbol(ids, symbol.id, bbox, name)
  }

  /**
   * Enter "edit in place" for a symbol: swap the stage + timeline to the symbol's
   * own contents. Saving now writes to the symbol definition, so every instance
   * updates. Use `exitToScene()` (the breadcrumb) to return.
   */
  const enterSymbol = (symbolId: string) => {
    if (editContext().type === 'symbol') return // already editing a symbol
    const sym = projectStore.getSymbol(symbolId)
    if (!sym) return

    flushSave() // persist the scene before leaving it
    isSwitchingScene = true
    try {
      store.stop()
      setEditContext({ type: 'symbol', symbolId })
      sceneStore.loadElements(sym.elements)
      if (sym.timeline) {
        store.loadTimeline(deserializeTimeline(sym.timeline))
      } else {
        store.createNewTimeline(sym.id, sym.name, { duration: 2000 })
      }
      store.clearHistory()
    } finally {
      isSwitchingScene = false
    }
  }

  /** Leave symbol edit mode, saving the symbol and reloading the active scene. */
  const exitToScene = () => {
    const ctx = editContext()
    if (ctx.type !== 'symbol') return

    // Save the symbol's current state before leaving.
    const timeline = store.state.timeline
    projectStore.updateSymbol(ctx.symbolId, {
      elements: sceneStore.exportElements(),
      timeline: timeline ? serializeTimeline(timeline) : null,
    })

    isSwitchingScene = true
    try {
      store.stop()
      setEditContext({ type: 'scene' })
      loadSceneIntoEditor(projectStore.currentProject().activeSceneId)
      store.clearHistory()
    } finally {
      isSwitchingScene = false
    }
  }

  /**
   * Render one thumbnail for the given scene and store it under BOTH the
   * project id (gallery card) and the scene id (scene-bar tab). They share the
   * same image because the gallery shows a project's active scene.
   */
  const captureThumbnailFor = async (
    projectId: string,
    sceneId: string,
    elements: ReturnType<typeof sceneStore.exportElements>,
    canvas: ReturnType<typeof projectStore.currentProject>['canvas']
  ) => {
    const url = await renderSceneThumbnail(elements, canvas, 360, projectStore.getSymbol)
    if (url) {
      projectStore.setThumbnail(projectId, url)
      projectStore.setThumbnail(sceneId, url)
    }
  }

  /** Snapshot the current (active) scene as gallery + scene-tab thumbnail. */
  const captureThumbnail = () => {
    // While editing a symbol the stage shows the symbol, not the scene — don't
    // overwrite the scene/gallery thumbnail with symbol contents.
    if (editContext().type === 'symbol') return Promise.resolve()
    const project = projectStore.currentProject()
    return captureThumbnailFor(
      project.id,
      project.activeSceneId,
      sceneStore.exportElements(),
      project.canvas
    )
  }

  /**
   * Fire a thumbnail capture for the project/scene we're about to leave, using
   * its state snapshotted *now* (before the scene store is reloaded), so it
   * always has a current thumbnail even if you switch away immediately.
   */
  const captureOutgoingThumbnail = () => {
    const project = projectStore.currentProject()
    void captureThumbnailFor(
      project.id,
      project.activeSceneId,
      sceneStore.exportElements(),
      project.canvas
    )
  }

  // Keep gallery thumbnails fresh while editing. Rendering a thumbnail is a bit
  // heavy (it composites the scene to a canvas), so this is debounced well past
  // the auto-save delay — the goal is that a project you've been working on has
  // a current thumbnail by the time you open the gallery, without capturing on
  // every keystroke.
  let thumbTimeout: number | undefined
  createEffect(() => {
    if (isSwitchingScene) return
    // Subscribe to the same edit signals the auto-save effect watches.
    store.tracks()
    store.duration()
    sceneStore.exportElements()
    projectStore.currentProject().id

    if (thumbTimeout) clearTimeout(thumbTimeout)
    thumbTimeout = window.setTimeout(() => void captureThumbnail(), 2500)
  })
  onCleanup(() => {
    if (thumbTimeout) clearTimeout(thumbTimeout)
  })

  /** Refresh the current thumbnail, then open the gallery. */
  const openGallery = async () => {
    flushSave()
    await captureThumbnail()
    setShowGallery(true)
  }

  /** Switch to a saved project and reload the editor around it. */
  const openProjectFromGallery = (id: string) => {
    flushSave()
    captureOutgoingThumbnail()
    isSwitchingScene = true
    try {
      store.stop()
      setEditContext({ type: 'scene' }) // leave any symbol edit before switching
      projectStore.open(id)
      const project = projectStore.currentProject()
      loadSceneIntoEditor(project.activeSceneId)
      store.clearHistory()
    } finally {
      isSwitchingScene = false
    }
    setShowGallery(false)
  }

  /** Create a brand-new project from the gallery and load it. */
  const newProjectFromGallery = () => {
    flushSave()
    captureOutgoingThumbnail()
    isSwitchingScene = true
    try {
      store.stop()
      setEditContext({ type: 'scene' }) // leave any symbol edit before switching
      const project = projectStore.createNew()
      sceneStore.clearElements()
      store.createNewTimeline(project.id, project.name, { duration: 2000 })
      store.clearHistory()
    } finally {
      isSwitchingScene = false
    }
    setShowGallery(false)
  }

  return (
    <div class="editor">
      <header class="editor-header">
        <h1>tinyfly</h1>
        <span class="editor-beta-tag" title="tinyfly is in beta — expect rough edges">
          BETA
        </span>
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
        <Toolbar store={store} projectStore={projectStore} sceneStore={sceneStore} onEmbed={() => setShowEmbed(true)} onExportAs={() => setShowExportAs(true)} onSamples={() => setShowSamples(true)} onOpenGallery={() => void openGallery()} onSave={flushSave} onShowShortcuts={() => setShowShortcuts(true)} />
      </header>

      <Show
        when={editContext().type === 'symbol'}
        fallback={<SceneBar projectStore={projectStore} onSwitchScene={switchScene} />}
      >
        <div class="symbol-breadcrumb">
          <button class="symbol-breadcrumb-back" onClick={exitToScene} title="Back to the scene">
            ‹ {projectStore.getActiveScene().name}
          </button>
          <span class="symbol-breadcrumb-sep">▸</span>
          <span class="symbol-breadcrumb-current">
            <svg viewBox="0 0 24 24" width="13" height="13" style={{ 'vertical-align': '-2px' }}>
              <path d="M12 2 2 8v8l10 6 10-6V8L12 2zm0 2.3 7 4.2v.02L12 12.7 5 8.52 12 4.3z" fill="currentColor" />
            </svg>
            {editingSymbol()?.name ?? 'Symbol'}
          </span>
          <span class="symbol-breadcrumb-hint">editing symbol — changes apply to all instances</span>
        </div>
      </Show>

      <AIPromptBar
        store={store}
        sceneStore={sceneStore}
        projectStore={projectStore}
        onOpenSettings={() => setShowAISettings(true)}
      />

      <main class="editor-main">
        {/* Mobile sidebar overlay */}
        <div
          class={`mobile-sidebar-overlay ${leftSidebarOpen() || rightSidebarOpen() ? 'visible' : ''}`}
          onClick={closeSidebars}
        />

        <aside
          class={`editor-sidebar editor-sidebar-left ${leftSidebarOpen() ? 'open' : ''} ${leftCollapsed() ? 'collapsed' : ''}`}
        >
          <button
            class="sidebar-collapse-btn left"
            onClick={() => setLeftCollapsed(true)}
            title="Hide Elements & Tracks"
          >
            «
          </button>
          <ElementPanel sceneStore={sceneStore} projectStore={projectStore} />
          <TrackPanel store={store} />
          <LibraryPanel sceneStore={sceneStore} projectStore={projectStore} onConvert={convertToSymbol} onEdit={enterSymbol} />
        </aside>

        <Show when={leftCollapsed()}>
          <button
            class="sidebar-reveal-btn left"
            onClick={() => setLeftCollapsed(false)}
            title="Show Elements & Tracks"
          >
            <span>Elements</span> »
          </button>
        </Show>

        <div class="editor-center">
          <section class={`editor-preview ${sceneTransitionClass()}`}>
            <PreviewPanel store={store} sceneStore={sceneStore} projectStore={projectStore} onEditSymbol={enterSymbol} />
          </section>

          <section class="editor-controls">
            <PlaybackControls store={store} />
          </section>

          <div
            class="editor-vsplit"
            title="Drag to resize the preview"
            onPointerDown={startPreviewResize}
            onDblClick={() => {
              setTimelineExpanded(false)
              setTimelineHeight(DEFAULT_TIMELINE_HEIGHT)
            }}
          >
            <span class="editor-vsplit-grip" />
          </div>

          <section class="editor-timeline" style={{ height: `${timelineHeight()}px` }}>
            <TimelinePanel store={store} expanded={timelineExpanded()} onToggleExpand={toggleTimelineExpand} />
          </section>
        </div>

        <Show when={rightCollapsed()}>
          <button
            class="sidebar-reveal-btn right"
            onClick={() => setRightCollapsed(false)}
            title="Show Properties & Presets"
          >
            « <span>Properties</span>
          </button>
        </Show>

        <aside
          class={`editor-sidebar editor-sidebar-right ${rightSidebarOpen() ? 'open' : ''} ${rightCollapsed() ? 'collapsed' : ''}`}
        >
          <button
            class="sidebar-collapse-btn right"
            onClick={() => setRightCollapsed(true)}
            title="Hide Properties & Presets"
          >
            »
          </button>
          <PropertyPanel store={store} sceneStore={sceneStore} projectStore={projectStore} />
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
        projectStore={projectStore}
        isOpen={showEmbed()}
        onClose={() => setShowEmbed(false)}
        sceneName={projectStore.getActiveScene().name}
      />

      <ExportDialog
        store={store}
        sceneStore={sceneStore}
        projectStore={projectStore}
        isOpen={showExportAs()}
        onClose={() => setShowExportAs(false)}
        sceneName={projectStore.getActiveScene().name}
      />

      <SamplesDialog
        store={store}
        sceneStore={sceneStore}
        projectStore={projectStore}
        isOpen={showSamples()}
        onClose={() => setShowSamples(false)}
      />

      <GalleryDialog
        projectStore={projectStore}
        isOpen={showGallery()}
        onClose={() => setShowGallery(false)}
        onOpenProject={openProjectFromGallery}
        onNewProject={newProjectFromGallery}
      />

      <AISettingsDialog isOpen={showAISettings()} onClose={() => setShowAISettings(false)} />

      <ShortcutsDialog isOpen={showShortcuts()} onClose={() => setShowShortcuts(false)} />

      <OnboardingOverlay store={onboardingStore} />

      <StatusBar />
    </div>
  )
}

/**
 * Public editor entry point. Opens the (async) IndexedDB persistence backend
 * before mounting the editor, so the project store hydrates from durable
 * storage. Falls back to LocalStorage inside `openIndexedDbBackend` when
 * IndexedDB isn't available.
 */
export const Editor: Component = () => {
  const [backend] = createResource(openIndexedDbBackend)

  return (
    <Show
      when={backend()}
      fallback={
        <div class="editor editor-loading">
          <div class="editor-loading-inner">
            <span class="editor-loading-logo">tinyfly</span>
            <span class="editor-loading-text">Loading your animations…</span>
          </div>
        </div>
      }
    >
      {(ready) => <EditorInner backend={ready()} />}
    </Show>
  )
}

export default Editor
