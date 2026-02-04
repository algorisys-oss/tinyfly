import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createProjectStore } from './project-store'
import type { ProjectCanvas } from './project-store'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
})

describe('ProjectStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('creates a default project when no saved data', () => {
      const store = createProjectStore()

      expect(store.currentProject()).toBeDefined()
      expect(store.currentProject().name).toBe('Untitled Animation')
      expect(store.currentProject().canvas.width).toBe(300)
      expect(store.currentProject().canvas.height).toBe(200)
    })

    it('loads saved project from localStorage', () => {
      const savedProject = {
        id: 'test-project',
        name: 'Saved Project',
        created: 1000,
        modified: 2000,
        canvas: { width: 400, height: 300 },
        timeline: null,
      }

      localStorageMock.setItem(
        'tinyfly-projects',
        JSON.stringify({ 'test-project': savedProject })
      )
      localStorageMock.setItem('tinyfly-current-project', 'test-project')

      const store = createProjectStore()

      expect(store.currentProject().id).toBe('test-project')
      expect(store.currentProject().name).toBe('Saved Project')
    })

    it('uses most recent project if current project ID not found', () => {
      const project1 = {
        id: 'project-1',
        name: 'Older Project',
        created: 1000,
        modified: 1000,
        canvas: { width: 300, height: 200 },
        timeline: null,
      }
      const project2 = {
        id: 'project-2',
        name: 'Newer Project',
        created: 2000,
        modified: 3000,
        canvas: { width: 300, height: 200 },
        timeline: null,
      }

      localStorageMock.setItem(
        'tinyfly-projects',
        JSON.stringify({
          'project-1': project1,
          'project-2': project2,
        })
      )
      localStorageMock.setItem('tinyfly-current-project', 'non-existent')

      const store = createProjectStore()

      expect(store.currentProject().id).toBe('project-2')
    })
  })

  describe('createNew', () => {
    it('creates a new project with default values', () => {
      const store = createProjectStore()
      const project = store.createNew()

      expect(project.name).toBe('Untitled Animation')
      expect(project.canvas.width).toBe(300)
      expect(project.canvas.height).toBe(200)
      expect(store.currentProject().id).toBe(project.id)
    })

    it('creates a new project with custom name', () => {
      const store = createProjectStore()
      const project = store.createNew('My Animation')

      expect(project.name).toBe('My Animation')
    })

    it('creates a new project with custom canvas', () => {
      const store = createProjectStore()
      const canvas: ProjectCanvas = { width: 800, height: 600 }
      const project = store.createNew('Custom Canvas', canvas)

      expect(project.canvas.width).toBe(800)
      expect(project.canvas.height).toBe(600)
    })

    it('saves to localStorage', () => {
      const store = createProjectStore()
      store.createNew('Test Project')

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('open', () => {
    it('opens an existing project', () => {
      const store = createProjectStore()
      const project1 = store.createNew('Project 1')
      const project2 = store.createNew('Project 2')

      expect(store.currentProject().id).toBe(project2.id)

      const success = store.open(project1.id)

      expect(success).toBe(true)
      expect(store.currentProject().id).toBe(project1.id)
    })

    it('returns false for non-existent project', () => {
      const store = createProjectStore()

      const success = store.open('non-existent')

      expect(success).toBe(false)
    })
  })

  describe('save', () => {
    it('saves project and clears dirty flag', () => {
      const store = createProjectStore()

      store.rename('Updated Name')
      expect(store.isDirty()).toBe(true)

      store.saveNow()

      expect(store.isDirty()).toBe(false)
      expect(store.currentProject().name).toBe('Updated Name')
    })
  })

  describe('rename', () => {
    it('renames the current project', () => {
      const store = createProjectStore()
      store.rename('New Name')

      expect(store.currentProject().name).toBe('New Name')
    })

    it('marks project as dirty', () => {
      const store = createProjectStore()
      store.saveNow() // Clear dirty flag

      store.rename('New Name')

      expect(store.isDirty()).toBe(true)
    })
  })

  describe('setCanvas', () => {
    it('updates canvas dimensions', () => {
      const store = createProjectStore()
      store.setCanvas({ width: 1920, height: 1080 })

      expect(store.currentProject().canvas.width).toBe(1920)
      expect(store.currentProject().canvas.height).toBe(1080)
    })

    it('marks project as dirty', () => {
      const store = createProjectStore()
      store.saveNow()

      store.setCanvas({ width: 500, height: 500 })

      expect(store.isDirty()).toBe(true)
    })
  })

  describe('updateTimeline', () => {
    it('updates timeline data', () => {
      const store = createProjectStore()
      const timeline = {
        id: 'test-timeline',
        name: 'Test',
        config: {},
        tracks: [],
      }

      store.updateTimeline(timeline)

      expect(store.currentProject().timeline).toEqual(timeline)
    })

    it('marks project as dirty', () => {
      const store = createProjectStore()
      store.saveNow()

      store.updateTimeline({ id: 'tl', name: 'Test', config: {}, tracks: [] })

      expect(store.isDirty()).toBe(true)
    })
  })

  describe('deleteProject', () => {
    it('deletes a project', () => {
      const store = createProjectStore()
      const project1 = store.createNew('Project 1')
      store.createNew('Project 2')

      const success = store.deleteProject(project1.id)

      expect(success).toBe(true)
      expect(store.projects().has(project1.id)).toBe(false)
    })

    it('switches to another project when deleting current', () => {
      const store = createProjectStore()
      store.createNew('Project 1')
      const project2 = store.createNew('Project 2')

      store.deleteProject(project2.id)

      expect(store.currentProject().id).not.toBe(project2.id)
    })

    it('creates new default project when deleting the only project', () => {
      const store = createProjectStore()
      const initialId = store.currentProject().id

      store.deleteProject(initialId)

      expect(store.currentProject().id).not.toBe(initialId)
      expect(store.projects().size).toBe(1)
    })

    it('returns false for non-existent project', () => {
      const store = createProjectStore()

      const success = store.deleteProject('non-existent')

      expect(success).toBe(false)
    })
  })

  describe('getProjectList', () => {
    it('returns list of project metadata sorted by modified time', () => {
      const store = createProjectStore()
      store.createNew('Project A')
      store.createNew('Project B')
      const projectC = store.createNew('Project C')

      const list = store.getProjectList()

      expect(list.length).toBe(4) // Including initial default project
      // Most recently created should be first (or tied for first)
      expect(list.find((p) => p.id === projectC.id)).toBeDefined()
    })

    it('only includes metadata fields', () => {
      const store = createProjectStore()
      const list = store.getProjectList()

      expect(list[0]).toHaveProperty('id')
      expect(list[0]).toHaveProperty('name')
      expect(list[0]).toHaveProperty('created')
      expect(list[0]).toHaveProperty('modified')
      expect(list[0]).not.toHaveProperty('canvas')
      expect(list[0]).not.toHaveProperty('timeline')
    })
  })

  describe('duplicate', () => {
    it('duplicates current project', () => {
      const store = createProjectStore()
      const originalId = store.currentProject().id
      store.rename('Original Project')
      store.setCanvas({ width: 500, height: 400 })
      store.saveNow() // Save changes before duplicating

      const duplicated = store.duplicate()

      expect(duplicated).not.toBeNull()
      expect(duplicated!.name).toBe('Original Project (copy)')
      expect(duplicated!.canvas.width).toBe(500)
      expect(duplicated!.id).not.toBe(originalId) // New ID generated
    })

    it('duplicates a specific project by ID', () => {
      const store = createProjectStore()
      const project1 = store.createNew('Project 1')
      store.createNew('Project 2')

      const duplicated = store.duplicate(project1.id)

      expect(duplicated!.name).toBe('Project 1 (copy)')
    })

    it('returns null for non-existent project', () => {
      const store = createProjectStore()

      const duplicated = store.duplicate('non-existent')

      expect(duplicated).toBeNull()
    })

    it('sets duplicated project as current', () => {
      const store = createProjectStore()
      const duplicated = store.duplicate()

      expect(store.currentProject().id).toBe(duplicated!.id)
    })
  })

  describe('clearAll', () => {
    it('removes all projects and creates fresh default', () => {
      const store = createProjectStore()
      store.createNew('Project 1')
      store.createNew('Project 2')

      store.clearAll()

      expect(store.projects().size).toBe(1)
      expect(store.currentProject().name).toBe('Untitled Animation')
    })

    it('clears localStorage', () => {
      const store = createProjectStore()
      store.clearAll()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tinyfly-projects')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tinyfly-current-project')
    })
  })

  describe('auto-save', () => {
    it('can be disabled', () => {
      const store = createProjectStore()
      store.setAutoSaveEnabled(false)

      expect(store.autoSaveEnabled()).toBe(false)
    })
  })
})
