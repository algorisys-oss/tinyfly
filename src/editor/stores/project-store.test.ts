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

    it('creates a default project with one scene', () => {
      const store = createProjectStore()
      const project = store.currentProject()

      expect(project.scenes).toHaveLength(1)
      expect(project.scenes[0].name).toBe('Scene 1')
      expect(project.scenes[0].elements).toEqual([])
      expect(project.scenes[0].timeline).toBeNull()
      expect(project.activeSceneId).toBe(project.scenes[0].id)
    })

    it('loads saved project from localStorage', () => {
      const savedProject = {
        id: 'test-project',
        name: 'Saved Project',
        created: 1000,
        modified: 2000,
        canvas: { width: 400, height: 300 },
        scenes: [{
          id: 'scene-1',
          name: 'Scene 1',
          order: 0,
          elements: [],
          timeline: null,
        }],
        activeSceneId: 'scene-1',
      }

      localStorageMock.setItem(
        'tinyfly-projects',
        JSON.stringify({ 'test-project': savedProject })
      )
      localStorageMock.setItem('tinyfly-current-project', 'test-project')

      const store = createProjectStore()

      expect(store.currentProject().id).toBe('test-project')
      expect(store.currentProject().name).toBe('Saved Project')
      expect(store.currentProject().scenes).toHaveLength(1)
    })

    it('migrates old format project (single timeline) to scenes', () => {
      const oldProject = {
        id: 'old-project',
        name: 'Old Project',
        created: 1000,
        modified: 2000,
        canvas: { width: 300, height: 200 },
        timeline: {
          id: 'tl-1',
          name: 'My Timeline',
          config: { duration: 2000 },
          tracks: [],
        },
      }

      localStorageMock.setItem(
        'tinyfly-projects',
        JSON.stringify({ 'old-project': oldProject })
      )
      localStorageMock.setItem('tinyfly-current-project', 'old-project')

      const store = createProjectStore()
      const project = store.currentProject()

      expect(project.id).toBe('old-project')
      expect(project.scenes).toHaveLength(1)
      expect(project.scenes[0].name).toBe('Scene 1')
      expect(project.scenes[0].timeline).toEqual(oldProject.timeline)
      expect(project.activeSceneId).toBe(project.scenes[0].id)
    })

    it('migrates old format project with null timeline', () => {
      const oldProject = {
        id: 'old-project',
        name: 'Old Project',
        created: 1000,
        modified: 2000,
        canvas: { width: 300, height: 200 },
        timeline: null,
      }

      localStorageMock.setItem(
        'tinyfly-projects',
        JSON.stringify({ 'old-project': oldProject })
      )
      localStorageMock.setItem('tinyfly-current-project', 'old-project')

      const store = createProjectStore()
      const project = store.currentProject()

      expect(project.scenes).toHaveLength(1)
      expect(project.scenes[0].timeline).toBeNull()
    })

    it('uses most recent project if current project ID not found', () => {
      const project1 = {
        id: 'project-1',
        name: 'Older Project',
        created: 1000,
        modified: 1000,
        canvas: { width: 300, height: 200 },
        scenes: [{ id: 's1', name: 'Scene 1', order: 0, elements: [], timeline: null }],
        activeSceneId: 's1',
      }
      const project2 = {
        id: 'project-2',
        name: 'Newer Project',
        created: 2000,
        modified: 3000,
        canvas: { width: 300, height: 200 },
        scenes: [{ id: 's2', name: 'Scene 1', order: 0, elements: [], timeline: null }],
        activeSceneId: 's2',
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
      expect(project.scenes).toHaveLength(1)
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

  describe('saveActiveSceneState', () => {
    it('saves elements and timeline to the active scene', () => {
      const store = createProjectStore()
      const timeline = {
        id: 'test-timeline',
        name: 'Test',
        config: {},
        tracks: [],
      }
      const elements = [
        { id: 'el-1', type: 'rect' as const, name: 'Box', x: 0, y: 0, width: 50, height: 50, rotation: 0, opacity: 1, visible: true, locked: false, fill: '#fff', stroke: 'transparent', strokeWidth: 0, borderRadius: 0 },
      ]

      store.saveActiveSceneState(elements, timeline)

      const scene = store.getActiveScene()
      expect(scene.timeline).toEqual(timeline)
      expect(scene.elements).toHaveLength(1)
      expect(scene.elements[0].id).toBe('el-1')
    })

    it('marks project as dirty', () => {
      const store = createProjectStore()
      store.saveNow()

      store.saveActiveSceneState([], { id: 'tl', name: 'Test', config: {}, tracks: [] })

      expect(store.isDirty()).toBe(true)
    })
  })

  describe('scene management', () => {
    it('addScene creates a new empty scene', () => {
      const store = createProjectStore()
      const scene = store.addScene('Scene 2')

      expect(scene.name).toBe('Scene 2')
      expect(scene.elements).toEqual([])
      expect(scene.timeline).toBeNull()
      expect(store.currentProject().scenes).toHaveLength(2)
    })

    it('addScene auto-generates name', () => {
      const store = createProjectStore()
      const scene = store.addScene()

      expect(scene.name).toBe('Scene 2')
    })

    it('removeScene removes a scene', () => {
      const store = createProjectStore()
      const scene2 = store.addScene('Scene 2')

      const success = store.removeScene(scene2.id)

      expect(success).toBe(true)
      expect(store.currentProject().scenes).toHaveLength(1)
    })

    it('removeScene prevents removing the last scene', () => {
      const store = createProjectStore()
      const sceneId = store.currentProject().scenes[0].id

      const success = store.removeScene(sceneId)

      expect(success).toBe(false)
      expect(store.currentProject().scenes).toHaveLength(1)
    })

    it('removeScene switches active scene if active was removed', () => {
      const store = createProjectStore()
      const scene1Id = store.currentProject().scenes[0].id
      const scene2 = store.addScene('Scene 2')
      store.setActiveScene(scene2.id)

      store.removeScene(scene2.id)

      expect(store.currentProject().activeSceneId).toBe(scene1Id)
    })

    it('renameScene renames a scene', () => {
      const store = createProjectStore()
      const sceneId = store.currentProject().scenes[0].id

      store.renameScene(sceneId, 'Intro')

      expect(store.getActiveScene().name).toBe('Intro')
    })

    it('duplicateScene clones a scene', () => {
      const store = createProjectStore()
      const sceneId = store.currentProject().scenes[0].id

      // Save some state to the scene first
      store.saveActiveSceneState(
        [],
        { id: 'tl-1', name: 'Timeline', config: { duration: 1000 }, tracks: [] }
      )

      const clone = store.duplicateScene(sceneId)

      expect(clone).not.toBeNull()
      expect(clone!.name).toContain('(copy)')
      expect(clone!.id).not.toBe(sceneId)
      expect(clone!.timeline).toEqual({ id: 'tl-1', name: 'Timeline', config: { duration: 1000 }, tracks: [] })
      expect(store.currentProject().scenes).toHaveLength(2)
    })

    it('duplicateScene returns null for non-existent scene', () => {
      const store = createProjectStore()

      const result = store.duplicateScene('non-existent')

      expect(result).toBeNull()
    })

    it('reorderScene moves scene left', () => {
      const store = createProjectStore()
      store.addScene('Scene 2')
      const scene3 = store.addScene('Scene 3')

      store.reorderScene(scene3.id, 'left')

      const scenes = store.getScenes()
      const scene3Index = scenes.findIndex((s) => s.id === scene3.id)
      expect(scene3Index).toBe(1) // moved from position 2 to 1
    })

    it('reorderScene moves scene right', () => {
      const store = createProjectStore()
      const scene1Id = store.currentProject().scenes[0].id
      store.addScene('Scene 2')

      store.reorderScene(scene1Id, 'right')

      const scenes = store.getScenes()
      const scene1Index = scenes.findIndex((s) => s.id === scene1Id)
      expect(scene1Index).toBe(1)
    })

    it('reorderScene does nothing at boundaries', () => {
      const store = createProjectStore()
      const scene1Id = store.currentProject().scenes[0].id
      store.addScene('Scene 2')

      // Try to move first scene left — should do nothing
      store.reorderScene(scene1Id, 'left')

      const scenes = store.getScenes()
      expect(scenes[0].id).toBe(scene1Id)
    })

    it('setActiveScene switches the active scene', () => {
      const store = createProjectStore()
      const scene2 = store.addScene('Scene 2')

      store.setActiveScene(scene2.id)

      expect(store.currentProject().activeSceneId).toBe(scene2.id)
      expect(store.getActiveScene().id).toBe(scene2.id)
    })

    it('setActiveScene ignores non-existent scene', () => {
      const store = createProjectStore()
      const activeId = store.currentProject().activeSceneId

      store.setActiveScene('non-existent')

      expect(store.currentProject().activeSceneId).toBe(activeId)
    })

    it('getScenes returns scenes in order', () => {
      const store = createProjectStore()
      store.addScene('Scene 2')
      store.addScene('Scene 3')

      const scenes = store.getScenes()

      expect(scenes).toHaveLength(3)
      expect(scenes[0].name).toBe('Scene 1')
      expect(scenes[1].name).toBe('Scene 2')
      expect(scenes[2].name).toBe('Scene 3')
    })

    it('getActiveScene returns the active scene', () => {
      const store = createProjectStore()

      const scene = store.getActiveScene()

      expect(scene.id).toBe(store.currentProject().activeSceneId)
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
      expect(list[0]).not.toHaveProperty('scenes')
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
      expect(duplicated!.scenes).toHaveLength(1)
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
      expect(store.currentProject().scenes).toHaveLength(1)
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

  describe('scene transitions', () => {
    it('should set and get scene transition', () => {
      const store = createProjectStore()
      const scene = store.addScene('Scene 2')

      store.setSceneTransition(scene.id, { type: 'fade', duration: 500 })

      const t = store.getSceneTransition(scene.id)
      expect(t.type).toBe('fade')
      expect(t.duration).toBe(500)
    })

    it('should return default transition for scene without transition', () => {
      const store = createProjectStore()
      const scene = store.getActiveScene()

      const t = store.getSceneTransition(scene.id)
      expect(t.type).toBe('none')
      expect(t.duration).toBe(0)
    })

    it('should return default transition for non-existent scene', () => {
      const store = createProjectStore()

      const t = store.getSceneTransition('nonexistent')
      expect(t.type).toBe('none')
      expect(t.duration).toBe(0)
    })

    it('should update transition type', () => {
      const store = createProjectStore()
      const scene = store.addScene('Scene 2')

      store.setSceneTransition(scene.id, { type: 'fade', duration: 300 })
      store.setSceneTransition(scene.id, { type: 'slide-left', duration: 500 })

      const t = store.getSceneTransition(scene.id)
      expect(t.type).toBe('slide-left')
      expect(t.duration).toBe(500)
    })

    it('should persist transition in project', () => {
      const store = createProjectStore()
      const scene = store.addScene('Scene 2')
      store.setSceneTransition(scene.id, { type: 'slide-up', duration: 400 })

      // Verify transition is in the project data
      const project = store.currentProject()
      const sceneData = project.scenes.find(s => s.id === scene.id)
      expect(sceneData?.transition?.type).toBe('slide-up')
      expect(sceneData?.transition?.duration).toBe(400)
    })

    it('should preserve transition when duplicating scene', () => {
      const store = createProjectStore()
      const scene = store.addScene('Scene 2')
      store.setSceneTransition(scene.id, { type: 'fade', duration: 600 })

      const dup = store.duplicateScene(scene.id)
      expect(dup).not.toBeNull()

      const t = store.getSceneTransition(dup!.id)
      expect(t.type).toBe('fade')
      expect(t.duration).toBe(600)
    })
  })

  describe('exportSequence', () => {
    it('should export a sequence definition', () => {
      const store = createProjectStore()
      const seq = store.exportSequence()

      expect(seq.id).toBeDefined()
      expect(seq.name).toBeDefined()
      expect(seq.canvas).toBeDefined()
      expect(seq.scenes).toBeInstanceOf(Array)
      expect(seq.scenes.length).toBeGreaterThan(0)
    })

    it('should include all scenes in order', () => {
      const store = createProjectStore()
      store.addScene('Scene 2')
      store.addScene('Scene 3')

      const seq = store.exportSequence()
      expect(seq.scenes.length).toBe(3)
    })

    it('should include scene transitions', () => {
      const store = createProjectStore()
      const scene2 = store.addScene('Scene 2')
      store.setSceneTransition(scene2.id, { type: 'fade', duration: 500 })

      const seq = store.exportSequence()
      const s2 = seq.scenes.find(s => s.id === scene2.id)
      expect(s2?.transition.type).toBe('fade')
      expect(s2?.transition.duration).toBe(500)
    })

    it('should include default transition for scenes without one', () => {
      const store = createProjectStore()
      store.addScene('Scene 2')

      const seq = store.exportSequence()
      // First scene should have 'none' transition
      expect(seq.scenes[0].transition.type).toBe('none')
    })

    it('should include canvas dimensions', () => {
      const store = createProjectStore()
      store.setCanvas({ width: 800, height: 600 })

      const seq = store.exportSequence()
      expect(seq.canvas.width).toBe(800)
      expect(seq.canvas.height).toBe(600)
    })
  })
})
