import { createSignal, createEffect } from 'solid-js'
import type { TimelineDefinition } from '../../engine'

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
  timeline: TimelineDefinition | null
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

function createDefaultProject(name = 'Untitled Animation'): Project {
  const now = Date.now()
  return {
    id: generateId(),
    name,
    created: now,
    modified: now,
    canvas: { ...DEFAULT_CANVAS },
    timeline: null,
  }
}

/**
 * Load all projects from LocalStorage
 */
function loadProjects(): Map<string, Project> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return new Map()

    const parsed = JSON.parse(data) as Record<string, Project>
    return new Map(Object.entries(parsed))
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
   * Update the timeline data (called when editor state changes)
   */
  function updateTimeline(timeline: TimelineDefinition | null): void {
    setCurrentProject((prev) => ({
      ...prev,
      timeline,
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
    updateTimeline,
    deleteProject,
    duplicate,
    getProjectList,
    clearAll,
    setAutoSaveEnabled,
  }
}

export type ProjectStore = ReturnType<typeof createProjectStore>
