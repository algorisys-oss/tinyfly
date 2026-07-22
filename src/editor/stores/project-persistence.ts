import {
  migrateProject,
  localStorageBackend,
  STORAGE_KEY,
  CURRENT_PROJECT_KEY,
  type Project,
  type ProjectBackend,
} from './project-store'

/**
 * IndexedDB-backed persistence for the project store.
 *
 * The store keeps its projects in memory and reads them synchronously, so this
 * backend pre-loads everything into in-memory snapshots when it opens, then
 * serves synchronous reads from those snapshots and writes through to IndexedDB
 * asynchronously (fire-and-forget). This keeps the store API unchanged while
 * moving durable storage off the ~5 MB LocalStorage quota and adding a place to
 * keep per-project thumbnails.
 *
 * On first run it migrates any projects saved under the old LocalStorage keys.
 */

const DB_NAME = 'tinyfly'
const DB_VERSION = 1
const PROJECTS_STORE = 'projects'
const THUMBS_STORE = 'thumbnails'
const META_STORE = 'meta'
const CURRENT_ID_KEY = 'currentProjectId'

interface ThumbRecord {
  id: string
  dataUrl: string
}

interface MetaRecord {
  key: string
  value: unknown
}

/** Promisify an IDBRequest. */
function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(THUMBS_STORE)) {
        db.createObjectStore(THUMBS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function readAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  const tx = db.transaction(storeName, 'readonly')
  return promisify(tx.objectStore(storeName).getAll() as IDBRequest<T[]>)
}

/** Read the projects previously saved under the legacy LocalStorage key. */
function readLegacyLocalStorageProjects(): Map<string, Project> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return new Map()
    const parsed = JSON.parse(data) as Record<string, Record<string, unknown>>
    const out = new Map<string, Project>()
    for (const [id, raw] of Object.entries(parsed)) {
      out.set(id, migrateProject(raw))
    }
    return out
  } catch {
    return new Map()
  }
}

function readLegacyCurrentId(): string | null {
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY)
  } catch {
    return null
  }
}

/**
 * Open the IndexedDB-backed project backend. Falls back to LocalStorage when
 * IndexedDB is unavailable (private-mode Firefox, ancient browsers) or errors
 * while opening, so the editor always gets a working backend.
 */
export async function openIndexedDbBackend(): Promise<ProjectBackend> {
  if (typeof indexedDB === 'undefined') return localStorageBackend

  let db: IDBDatabase
  try {
    db = await openDatabase()
  } catch {
    return localStorageBackend
  }

  // Hydrate in-memory snapshots that back the synchronous store reads.
  const projects = new Map<string, Project>()
  const thumbnails = new Map<string, string>()
  let currentId: string | null = null

  try {
    const [rawProjects, rawThumbs, rawMeta] = await Promise.all([
      readAll<Record<string, unknown>>(db, PROJECTS_STORE),
      readAll<ThumbRecord>(db, THUMBS_STORE),
      readAll<MetaRecord>(db, META_STORE),
    ])
    for (const raw of rawProjects) projects.set(raw.id as string, migrateProject(raw))
    for (const t of rawThumbs) thumbnails.set(t.id, t.dataUrl)
    const meta = rawMeta.find((m) => m.key === CURRENT_ID_KEY)
    currentId = (meta?.value as string | undefined) ?? null
  } catch {
    return localStorageBackend
  }

  // First run: migrate anything sitting in LocalStorage, then persist it so the
  // legacy copy becomes redundant (we leave it in place as a safety net).
  if (projects.size === 0) {
    const legacy = readLegacyLocalStorageProjects()
    if (legacy.size > 0) {
      const tx = db.transaction(PROJECTS_STORE, 'readwrite')
      const store = tx.objectStore(PROJECTS_STORE)
      for (const [id, project] of legacy) {
        projects.set(id, project)
        store.put(project)
      }
      currentId = currentId ?? readLegacyCurrentId()
    }
  }

  /** Write a single record; failures are logged, never thrown (best-effort). */
  function put(storeName: string, value: unknown): void {
    try {
      const tx = db.transaction(storeName, 'readwrite')
      tx.objectStore(storeName).put(value)
    } catch (e) {
      console.error(`tinyfly: IndexedDB put into ${storeName} failed`, e)
    }
  }

  function remove(storeName: string, key: string): void {
    try {
      const tx = db.transaction(storeName, 'readwrite')
      tx.objectStore(storeName).delete(key)
    } catch (e) {
      console.error(`tinyfly: IndexedDB delete from ${storeName} failed`, e)
    }
  }

  return {
    loadProjects() {
      return new Map(projects)
    },

    saveProjects(next) {
      // Diff against the snapshot: write changed/new projects, drop removed ones.
      // Edits produce new object references (immutable updates), so identity
      // comparison is enough to skip untouched projects.
      for (const [id, project] of next) {
        if (projects.get(id) !== project) put(PROJECTS_STORE, project)
      }
      for (const id of projects.keys()) {
        if (!next.has(id)) {
          remove(PROJECTS_STORE, id)
          remove(THUMBS_STORE, id)
          thumbnails.delete(id)
        }
      }
      projects.clear()
      for (const [id, project] of next) projects.set(id, project)
    },

    loadCurrentProjectId() {
      return currentId
    },

    saveCurrentProjectId(id) {
      currentId = id
      put(META_STORE, { key: CURRENT_ID_KEY, value: id })
    },

    saveThumbnail(id, dataUrl) {
      thumbnails.set(id, dataUrl)
      put(THUMBS_STORE, { id, dataUrl })
    },

    getThumbnail(id) {
      return thumbnails.get(id)
    },

    deleteThumbnail(id) {
      thumbnails.delete(id)
      remove(THUMBS_STORE, id)
    },

    clear() {
      projects.clear()
      thumbnails.clear()
      currentId = null
      for (const name of [PROJECTS_STORE, THUMBS_STORE, META_STORE]) {
        try {
          const tx = db.transaction(name, 'readwrite')
          tx.objectStore(name).clear()
        } catch (e) {
          console.error(`tinyfly: IndexedDB clear of ${name} failed`, e)
        }
      }
    },
  }
}
