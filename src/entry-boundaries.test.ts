import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'

/**
 * Pay only for what you import: each package entry reaches only the code it
 * needs. Walks the relative imports from an entry's source (what the bundler
 * would pull in) and checks what it must never reach.
 */

const SRC = resolve(__dirname)
const IMPORT = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\sfrom\s+)?['"](\.[^'"]+)['"]/g

function resolveImport(from: string, specifier: string): string | null {
  const base = resolve(dirname(from), specifier)
  for (const candidate of [base, `${base}.ts`, `${base}.js`, `${base}/index.ts`, `${base}/index.js`]) {
    if (existsSync(candidate) && !candidate.endsWith('/')) {
      try {
        readFileSync(candidate)
        return candidate
      } catch {
        // a directory
      }
    }
  }
  return null
}

/** Every source file an entry reaches through relative imports (type-only imports included, to be strict). */
function reachable(entry: string): string[] {
  const seen = new Set<string>()
  const stack = [resolve(SRC, entry)]
  while (stack.length > 0) {
    const file = stack.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(IMPORT)) {
      const next = resolveImport(file, match[1])
      if (next && !next.endsWith('.css') && !seen.has(next)) stack.push(next)
    }
  }
  return [...seen].map((file) => relative(SRC, file))
}

describe('entry boundaries', () => {
  it('the engine and the player never reach 3D scenes, characters or maps', () => {
    for (const entry of ['engine/index.ts', 'player/index.ts']) {
      const files = reachable(entry)
      expect(files.filter((f) => /^(scene-3d|characters|maps)\//.test(f)), entry).toEqual([])
    }
  })

  it('scene-3d reaches the engine, but not WebGL, glTF, three.js or the DOM adapters', () => {
    const files = reachable('scene-3d/index.ts')
    expect(files.some((f) => f.startsWith('engine/'))).toBe(true)
    expect(files.filter((f) => /webgl|gltf|three|adapters\/dom|adapters\/svg|^characters\//.test(f))).toEqual([])
    const source = files.map((f) => readFileSync(resolve(SRC, f), 'utf8')).join('\n')
    expect(source).not.toMatch(/from ['"]three['"]/)
  })
})
