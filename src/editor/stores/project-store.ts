import { createSignal, createEffect } from 'solid-js'
import type { TimelineDefinition } from '../../engine'
import type { SceneElement } from './scene-store'
import type { SceneDefinition } from './scene-types'
import type { SceneTransition, SequenceDefinition, SerializedElement } from '../../player/sequence-types'
import { DEFAULT_TRANSITION } from '../../player/sequence-types'
import { generateElementHtml } from '../utils/element-html'

const STORAGE_KEY = 'tinyfly-projects'
const CURRENT_PROJECT_KEY = 'tinyfly-current-project'
const AUTO_SAVE_DELAY = 1000 // ms

export interface ProjectCanvas {
  width: number
  height: number
}

export interface Project {
  id: string
  name: string
  created: number
  modified: number
  canvas: ProjectCanvas
  scenes: SceneDefinition[]
  activeSceneId: string
}

export interface ProjectMetadata {
  id: string
  name: string
  created: number
  modified: number
}

const DEFAULT_CANVAS: ProjectCanvas = {
  width: 300,
  height: 200,
}

function generateId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateSceneId(): string {
  return `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createDefaultScene(name = 'Scene 1', order = 0): SceneDefinition {
  return {
    id: generateSceneId(),
    name,
    order,
    elements: [],
    timeline: null,
  }
}

function createDefaultProject(name = 'Untitled Animation'): Project {
  const now = Date.now()
  const scene = createDefaultScene()
  return {
    id: generateId(),
    name,
    created: now,
    modified: now,
    canvas: { ...DEFAULT_CANVAS },
    scenes: [scene],
    activeSceneId: scene.id,
  }
}

/**
 * Migrate old project format (single timeline) to new format (scenes array).
 */
function migrateProject(project: Record<string, unknown>): Project {
  // Already migrated: has scenes array
  if (Array.isArray(project.scenes) && project.scenes.length > 0) {
    return project as unknown as Project
  }

  // Old format: has timeline field, no scenes
  const sceneId = generateSceneId()
  const scene: SceneDefinition = {
    id: sceneId,
    name: 'Scene 1',
    order: 0,
    elements: [],
    timeline: (project.timeline as TimelineDefinition | null) ?? null,
  }

  return {
    id: project.id as string,
    name: project.name as string,
    created: project.created as number,
    modified: project.modified as number,
    canvas: (project.canvas as ProjectCanvas) ?? { ...DEFAULT_CANVAS },
    scenes: [scene],
    activeSceneId: sceneId,
  }
}

/**
 * Load all projects from LocalStorage, migrating old format if needed.
 */
function loadProjects(): Map<string, Project> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return new Map()

    const parsed = JSON.parse(data) as Record<string, Record<string, unknown>>
    const migrated = new Map<string, Project>()
    for (const [id, raw] of Object.entries(parsed)) {
      migrated.set(id, migrateProject(raw))
    }
    return migrated
  } catch {
    return new Map()
  }
}

/**
 * Save all projects to LocalStorage
 */
function saveProjects(projects: Map<string, Project>): void {
  try {
    const obj: Record<string, Project> = {}
    projects.forEach((project, id) => {
      obj[id] = project
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch (e) {
    console.error('Failed to save projects to LocalStorage:', e)
  }
}

/**
 * Load current project ID from LocalStorage
 */
function loadCurrentProjectId(): string | null {
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY)
  } catch {
    return null
  }
}

/**
 * Save current project ID to LocalStorage
 */
function saveCurrentProjectId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(CURRENT_PROJECT_KEY, id)
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY)
    }
  } catch (e) {
    console.error('Failed to save current project ID:', e)
  }
}

/**
 * Create a project store for managing animation projects with persistence.
 */
export function createProjectStore() {
  // Load initial state from LocalStorage
  const initialProjects = loadProjects()
  const initialCurrentId = loadCurrentProjectId()

  // If there's a saved current project, use it; otherwise create a default
  let initialProject: Project
  if (initialCurrentId && initialProjects.has(initialCurrentId)) {
    initialProject = initialProjects.get(initialCurrentId)!
  } else if (initialProjects.size > 0) {
    // Use the most recently modified project
    initialProject = [...initialProjects.values()].sort(
      (a, b) => b.modified - a.modified
    )[0]
  } else {
    // Create a new default project
    initialProject = createDefaultProject()
    initialProjects.set(initialProject.id, initialProject)
    saveProjects(initialProjects)
  }

  const [projects, setProjects] = createSignal<Map<string, Project>>(initialProjects)
  const [currentProject, setCurrentProject] = createSignal<Project>(initialProject)
  const [isDirty, setIsDirty] = createSignal(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = createSignal(true)

  let autoSaveTimeout: number | undefined

  // Save current project ID when it changes
  createEffect(() => {
    saveCurrentProjectId(currentProject().id)
  })

  // Auto-save when dirty
  createEffect(() => {
    if (isDirty() && autoSaveEnabled()) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
      autoSaveTimeout = window.setTimeout(() => {
        save()
      }, AUTO_SAVE_DELAY)
    }
  })

  /**
   * Create a new project
   */
  function createNew(name?: string, canvas?: ProjectCanvas): Project {
    const project = createDefaultProject(name)
    if (canvas) {
      project.canvas = { ...canvas }
    }

    setProjects((prev) => {
      const next = new Map(prev)
      next.set(project.id, project)
      saveProjects(next)
      return next
    })

    setCurrentProject(project)
    setIsDirty(false)

    return project
  }

  /**
   * Open an existing project by ID
   */
  function open(projectId: string): boolean {
    const project = projects().get(projectId)
    if (!project) return false

    setCurrentProject(project)
    setIsDirty(false)
    return true
  }

  /**
   * Save the current project
   */
  function save(): boolean {
    const project = currentProject()
    project.modified = Date.now()

    setProjects((prev) => {
      const next = new Map(prev)
      next.set(project.id, project)
      saveProjects(next)
      return next
    })

    setIsDirty(false)
    return true
  }

  /**
   * Update project name
   */
  function rename(name: string): void {
    setCurrentProject((prev) => ({
      ...prev,
      name,
      modified: Date.now(),
    }))
    setIsDirty(true)
  }

  /**
   * Update canvas dimensions
   */
  function setCanvas(canvas: ProjectCanvas): void {
    setCurrentProject((prev) => ({
      ...prev,
      canvas: { ...canvas },
      modified: Date.now(),
    }))
    setIsDirty(true)
  }

  /**
   * Save the active scene's current state (elements and timeline).
   * Called by the editor on auto-save and before scene switches.
   */
  function saveActiveSceneState(
    elements: SceneElement[],
    timeline: TimelineDefinition | null
  ): void {
    setCurrentProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) =>
        scene.id === prev.activeSceneId
          ? { ...scene, elements: [...elements], timeline }
          : scene
      ),
      modified: Date.now(),
    }))
    setIsDirty(true)
  }

  /**
   * Get the active scene definition.
   */
  function getActiveScene(): SceneDefinition {
    const project = currentProject()
    return (
      project.scenes.find((s) => s.id === project.activeSceneId) ??
      project.scenes[0]
    )
  }

  /**
   * Get all scenes in order.
   */
  function getScenes(): SceneDefinition[] {
    return [...currentProject().scenes].sort((a, b) => a.order - b.order)
  }

  /**
   * Switch the active scene.
   */
  function setActiveScene(sceneId: string): void {
    const project = currentProject()
    if (!project.scenes.find((s) => s.id === sceneId)) return

    setCurrentProject((prev) => ({
      ...prev,
      activeSceneId: sceneId,
      modified: Date.now(),
    }))
    setIsDirty(true)
  }

  /**
   * Add a new empty scene.
   */
  function addScene(name?: string): SceneDefinition {
    const project = currentProject()
    const maxOrder = project.scenes.reduce((max, s) => Math.max(max, s.order), -1)
    const sceneName = name ?? `Scene ${project.scenes.length + 1}`
    const scene = createDefaultScene(sceneName, maxOrder + 1)

    setCurrentProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, scene],
      modified: Date.now(),
    }))
    setIsDirty(true)

    return scene
  }

  /**
   * Remove a scene. At least one scene must remain.
   */
  function removeScene(sceneId: string): boolean {
    const project = currentProject()
    if (project.scenes.length <= 1) return false
    if (!project.scenes.find((s) => s.id === sceneId)) return false

    const remaining = project.scenes.filter((s) => s.id !== sceneId)
    const newActiveId =
      project.activeSceneId === sceneId ? remaining[0].id : project.activeSceneId

    setCurrentProject((prev) => ({
      ...prev,
      scenes: remaining,
      activeSceneId: newActiveId,
      modified: Date.now(),
    }))
    setIsDirty(true)

    return true
  }

  /**
   * Rename a scene.
   */
  function renameScene(sceneId: string, name: string): void {
    setCurrentProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === sceneId ? { ...s, name } : s
      ),
      modified: Date.now(),
    }))
    setIsDirty(true)
  }

  /**
   * Duplicate a scene.
   */
  function duplicateScene(sceneId: string): SceneDefinition | null {
    const project = currentProject()
    const source = project.scenes.find((s) => s.id === sceneId)
    if (!source) return null

    const maxOrder = project.scenes.reduce((max, s) => Math.max(max, s.order), -1)
    const newScene: SceneDefinition = {
      ...structuredClone(source),
      id: generateSceneId(),
      name: `${source.name} (copy)`,
      order: maxOrder + 1,
    }

    setCurrentProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      modified: Date.now(),
    }))
    setIsDirty(true)

    return newScene
  }

  /**
   * Reorder a scene by moving it left or right.
   */
  function reorderScene(sceneId: string, direction: 'left' | 'right'): void {
    const project = currentProject()
    const sorted = [...project.scenes].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((s) => s.id === sceneId)
    if (index === -1) return

    const swapIndex = direction === 'left' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return

    // Swap orders
    const orderA = sorted[index].order
    const orderB = sorted[swapIndex].order

    setCurrentProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => {
        if (s.id === sorted[index].id) return { ...s, order: orderB }
        if (s.id === sorted[swapIndex].id) return { ...s, order: orderA }
        return s
      }),
      modified: Date.now(),
    }))
    setIsDirty(true)
  }

  /**
   * Delete a project
   */
  function deleteProject(projectId: string): boolean {
    const projectsMap = projects()
    if (!projectsMap.has(projectId)) return false

    // Can't delete if it's the only project and it's current
    if (projectsMap.size === 1) {
      // Create a new default project first
      createNew()
    } else if (currentProject().id === projectId) {
      // Switch to another project
      const otherProject = [...projectsMap.values()].find((p) => p.id !== projectId)
      if (otherProject) {
        setCurrentProject(otherProject)
      }
    }

    setProjects((prev) => {
      const next = new Map(prev)
      next.delete(projectId)
      saveProjects(next)
      return next
    })

    return true
  }

  /**
   * Get list of all project metadata (for "recent projects" list)
   */
  function getProjectList(): ProjectMetadata[] {
    return [...projects().values()]
      .map(({ id, name, created, modified }) => ({ id, name, created, modified }))
      .sort((a, b) => b.modified - a.modified)
  }

  /**
   * Duplicate a project
   */
  function duplicate(projectId?: string): Project | null {
    const sourceId = projectId ?? currentProject().id
    const source = projects().get(sourceId)
    if (!source) return null

    const now = Date.now()
    const newProject: Project = {
      ...structuredClone(source),
      id: generateId(),
      name: `${source.name} (copy)`,
      created: now,
      modified: now,
    }

    setProjects((prev) => {
      const next = new Map(prev)
      next.set(newProject.id, newProject)
      saveProjects(next)
      return next
    })

    setCurrentProject(newProject)
    setIsDirty(false)

    return newProject
  }

  /**
   * Clear all stored projects (for testing/reset)
   */
  function clearAll(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CURRENT_PROJECT_KEY)

    const defaultProject = createDefaultProject()
    setProjects(new Map([[defaultProject.id, defaultProject]]))
    setCurrentProject(defaultProject)
    setIsDirty(false)
  }

  /**
   * Force save immediately (bypasses auto-save delay)
   */
  function saveNow(): void {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
      autoSaveTimeout = undefined
    }
    save()
  }

  /**
   * Set the transition for a scene.
   */
  function setSceneTransition(sceneId: string, transition: SceneTransition): void {
    setCurrentProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === sceneId ? { ...s, transition } : s
      ),
      modified: Date.now(),
    }))
    setIsDirty(true)
  }

  /**
   * Get the transition for a scene (returns default if not set).
   */
  function getSceneTransition(sceneId: string): SceneTransition {
    const scene = currentProject().scenes.find((s) => s.id === sceneId)
    return scene?.transition ?? { ...DEFAULT_TRANSITION }
  }

  /**
   * Export the entire project as a SequenceDefinition for the multi-scene player.
   */
  function exportSequence(): SequenceDefinition {
    const project = currentProject()
    const orderedScenes = [...project.scenes].sort((a, b) => a.order - b.order)

    return {
      id: project.id,
      name: project.name,
      canvas: { ...project.canvas },
      scenes: orderedScenes.map((scene) => ({
        id: scene.id,
        name: scene.name,
        elements: scene.elements
          .filter((el) => el.visible && el.type !== 'group')
          .map((el): SerializedElement => ({
            type: el.type,
            name: el.name,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            rotation: el.rotation,
            opacity: el.opacity,
            html: generateElementHtml(el, ''),
          })),
        timeline: scene.timeline,
        transition: scene.transition ?? { ...DEFAULT_TRANSITION },
      })),
    }
  }

  return {
    // State
    currentProject,
    projects,
    isDirty,
    autoSaveEnabled,

    // Actions
    createNew,
    open,
    save,
    saveNow,
    rename,
    setCanvas,
    saveActiveSceneState,
    getActiveScene,
    getScenes,
    setActiveScene,
    addScene,
    removeScene,
    renameScene,
    duplicateScene,
    reorderScene,
    setSceneTransition,
    getSceneTransition,
    exportSequence,
    deleteProject,
    duplicate,
    getProjectList,
    clearAll,
    setAutoSaveEnabled,
  }
}

export type ProjectStore = ReturnType<typeof createProjectStore>
