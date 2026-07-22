import { describe, it, expect, beforeEach } from 'vitest'
import { createProjectStore, type Project, type ProjectBackend } from './project-store'

/**
 * A fully in-memory backend, used to verify the store drives an injected
 * backend correctly (the IndexedDB backend is a thin async wrapper around the
 * same interface). This keeps the seam covered without needing a real
 * IndexedDB in the test environment.
 */
function createMemoryBackend(seed?: Map<string, Project>, currentId?: string | null) {
  const projects = new Map(seed ?? [])
  const thumbnails = new Map<string, string>()
  let current: string | null = currentId ?? null
  const calls = { saveProjects: 0, saveCurrentId: 0, clear: 0 }

  const backend: ProjectBackend = {
    loadProjects: () => new Map(projects),
    saveProjects: (next) => {
      calls.saveProjects++
      projects.clear()
      for (const [id, p] of next) projects.set(id, p)
    },
    loadCurrentProjectId: () => current,
    saveCurrentProjectId: (id) => {
      calls.saveCurrentId++
      current = id
    },
    saveThumbnail: (id, dataUrl) => thumbnails.set(id, dataUrl),
    getThumbnail: (id) => thumbnails.get(id),
    deleteThumbnail: (id) => thumbnails.delete(id),
    clear: () => {
      calls.clear++
      projects.clear()
      thumbnails.clear()
      current = null
    },
  }

  return { backend, projects, thumbnails, calls }
}

describe('ProjectStore with an injected backend', () => {
  let mem: ReturnType<typeof createMemoryBackend>

  beforeEach(() => {
    mem = createMemoryBackend()
  })

  it('seeds a default project through the backend when empty', () => {
    const store = createProjectStore({ backend: mem.backend })
    expect(store.currentProject()).toBeTruthy()
    expect(mem.projects.size).toBe(1)
    expect(mem.projects.has(store.currentProject().id)).toBe(true)
  })

  it('writes new projects through the backend', () => {
    const store = createProjectStore({ backend: mem.backend })
    const created = store.createNew('My Second')
    expect(mem.projects.has(created.id)).toBe(true)
    expect(mem.projects.get(created.id)!.name).toBe('My Second')
  })

  it('hydrates from backend data and honours the saved current id', () => {
    const now = Date.now()
    const p: Project = {
      id: 'p-1',
      name: 'Restored',
      created: now,
      modified: now,
      canvas: { width: 300, height: 200, background: '#252525' },
      scenes: [{ id: 's-1', name: 'Scene 1', order: 0, elements: [], timeline: null }],
      activeSceneId: 's-1',
    }
    const seeded = createMemoryBackend(new Map([[p.id, p]]), 'p-1')
    const store = createProjectStore({ backend: seeded.backend })
    expect(store.currentProject().id).toBe('p-1')
    expect(store.currentProject().name).toBe('Restored')
  })

  it('stores, reads and deletes thumbnails through the backend', () => {
    const store = createProjectStore({ backend: mem.backend })
    const id = store.currentProject().id
    store.setThumbnail(id, 'data:image/webp;base64,AAAA')
    expect(store.getThumbnail(id)).toBe('data:image/webp;base64,AAAA')
    expect(mem.thumbnails.get(id)).toBe('data:image/webp;base64,AAAA')

    const other = store.createNew('Another')
    store.deleteProject(id)
    // Deleting a project drops its thumbnail too.
    expect(mem.thumbnails.has(id)).toBe(false)
    expect(store.currentProject().id).toBe(other.id)
  })

  it('routes clearAll through the backend clear hook', () => {
    const store = createProjectStore({ backend: mem.backend })
    store.createNew('Doomed')
    store.clearAll()
    expect(mem.calls.clear).toBeGreaterThan(0)
    // A fresh default project exists after clearing.
    expect(store.getProjectList().length).toBe(1)
  })
})
