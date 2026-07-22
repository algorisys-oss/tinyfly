import type { SceneElement, LineElement, ArrowElement } from '../stores/scene-store'
import type { SymbolDefinition } from '../stores/scene-types'

/**
 * Flatten symbol instances into ordinary elements.
 *
 * Every element of type `symbol` is replaced by transformed copies of its
 * symbol's contents (translated + scaled + rotated + opacity-multiplied into the
 * instance box). Nested symbols expand recursively (with a depth guard). The
 * result contains no `symbol` elements, so the existing Canvas/SVG renderers,
 * raster export, and embed HTML — all of which don't understand symbols — render
 * instances correctly.
 *
 * This is a **static** expansion (poster frame at base values); a symbol's own
 * nested timeline is not baked in here.
 */
export function expandSymbolInstances(
  elements: SceneElement[],
  getSymbol: (id: string) => SymbolDefinition | undefined,
  depth = 0
): SceneElement[] {
  if (depth > 4) return [] // recursion guard for symbols-in-symbols
  const out: SceneElement[] = []

  for (const el of elements) {
    if (el.type !== 'symbol') {
      out.push(el)
      continue
    }
    const symbolId = (el as { symbolId: string }).symbolId
    const sym = getSymbol(symbolId)
    if (!sym) continue

    // Expand nested symbols first, then transform each resulting element into
    // this instance's box.
    const children = expandSymbolInstances(sym.elements, getSymbol, depth + 1)
    for (const child of children) {
      if (!child.visible) continue
      out.push(transformIntoInstance(child, el, sym))
    }
  }

  return out
}

/** Transform one (already non-symbol) element into an instance's placement box. */
function transformIntoInstance(
  child: SceneElement,
  inst: SceneElement,
  sym: SymbolDefinition
): SceneElement {
  const sx = sym.width ? inst.width / sym.width : 1
  const sy = sym.height ? inst.height / sym.height : 1
  const theta = (inst.rotation * Math.PI) / 180
  const cx = inst.x + inst.width / 2
  const cy = inst.y + inst.height / 2

  // Map a symbol-local point into absolute canvas space: scale into the instance
  // box, then rotate around the instance centre.
  const mapPoint = (lx: number, ly: number) => {
    let ax = inst.x + lx * sx
    let ay = inst.y + ly * sy
    if (theta) {
      const dx = ax - cx
      const dy = ay - cy
      ax = cx + dx * Math.cos(theta) - dy * Math.sin(theta)
      ay = cy + dx * Math.sin(theta) + dy * Math.cos(theta)
    }
    return { x: ax, y: ay }
  }

  const copy = structuredClone(child) as SceneElement
  copy.id = `${inst.id}__${child.id}`
  copy.opacity = child.opacity * inst.opacity

  if (child.type === 'line' || child.type === 'arrow') {
    const l = child as LineElement | ArrowElement
    const p1 = mapPoint(l.x, l.y)
    const p2 = mapPoint(l.x2, l.y2)
    const c = copy as LineElement | ArrowElement
    c.x = p1.x
    c.y = p1.y
    c.x2 = p2.x
    c.y2 = p2.y
    c.width = Math.abs(p2.x - p1.x)
    c.height = Math.abs(p2.y - p1.y)
    // Endpoints already carry the instance rotation.
  } else {
    // Box element: rotate its centre around the instance centre, scale its size,
    // and add the instance rotation to its own (rotation composes).
    const center = mapPoint(child.x + child.width / 2, child.y + child.height / 2)
    copy.width = child.width * sx
    copy.height = child.height * sy
    copy.x = center.x - copy.width / 2
    copy.y = center.y - copy.height / 2
    copy.rotation = child.rotation + inst.rotation
  }

  return copy
}

/** True if any element in the list is a symbol instance. */
export function hasSymbolInstances(elements: SceneElement[]): boolean {
  return elements.some((el) => el.type === 'symbol')
}

/**
 * Which symbol a swap-enabled instance shows at a given `swapIndex`. Picks
 * `swapSet[floor(swapIndex)]` (clamped to the set); falls back to the instance's
 * base `symbolId` when there's no swap set or index. This gives step ("hold")
 * behaviour from a plain numeric track — the lip-sync primitive.
 */
export function shownSymbolId(
  inst: { symbolId: string; swapSet?: string[] },
  swapIndex: number | undefined
): string {
  const set = inst.swapSet
  if (set && set.length > 0 && typeof swapIndex === 'number' && Number.isFinite(swapIndex)) {
    const i = Math.max(0, Math.min(set.length - 1, Math.floor(swapIndex)))
    return set[i]
  }
  return inst.symbolId
}
