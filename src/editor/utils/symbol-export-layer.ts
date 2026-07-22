import type { SceneElement, SymbolInstanceElement } from '../stores/scene-store'
import type { SymbolDefinition } from '../stores/scene-types'
import type { AnimationState } from '../../engine'
import { deserializeTimeline, type Timeline } from '../../engine'
import { buildExportComposite, type ExportComposite } from './export-composite'
import { expandSymbolInstances, shownSymbolId } from './expand-symbols'

/**
 * Renders symbol instances into a raster export **with their nested animation
 * and swaps baked in** — the piece the static flatten can't do.
 *
 * For each symbol used (base + swap sets) it builds one `ExportComposite` (which
 * handles the symbol's own shapes, images and nested-symbol flattening) and
 * deserializes the symbol's timeline. Per frame it picks the shown symbol
 * (swap), applies the symbol's timeline at `sceneTime mod symbolDuration`, then
 * draws it under a ctx transform that places it in the instance's (optionally
 * scene-animated) box.
 *
 * Limitations (v1): instance opacity doesn't multiply into the symbol's own
 * element opacity (the Canvas adapter sets alpha absolutely); width/height and
 * skew animation of the instance itself aren't composed.
 */
export interface SymbolExportLayer {
  draw(ctx: CanvasRenderingContext2D, timeMs: number, sceneState: AnimationState): Promise<void>
  dispose(): void
}

interface SymbolEntry {
  symbol: SymbolDefinition
  composite: ExportComposite
  timeline: Timeline | null
}

export async function buildSymbolExportLayer(
  elements: SceneElement[],
  getSymbol: (id: string) => SymbolDefinition | undefined
): Promise<SymbolExportLayer> {
  const instances = elements.filter((el): el is SymbolInstanceElement => el.type === 'symbol')

  // Every symbol id an instance might show (base + swap sets).
  const symbolIds = new Set<string>()
  for (const inst of instances) {
    symbolIds.add(inst.symbolId)
    for (const id of inst.swapSet ?? []) symbolIds.add(id)
  }

  const entries = new Map<string, SymbolEntry>()
  for (const id of symbolIds) {
    const symbol = getSymbol(id)
    if (!symbol) continue
    // Flatten any nested symbols within this symbol (static), then composite.
    const flat = expandSymbolInstances(symbol.elements, getSymbol)
    const composite = await buildExportComposite(flat.filter((e) => e.type !== 'symbol'))
    const timeline =
      symbol.timeline && symbol.timeline.tracks.length > 0
        ? deserializeTimeline(symbol.timeline)
        : null
    entries.set(id, { symbol, composite, timeline })
  }

  const num = (state: AnimationState, target: string, prop: string): number | undefined => {
    const v = state.values.get(target)?.get(prop)
    return typeof v === 'number' ? v : undefined
  }

  const draw = async (ctx: CanvasRenderingContext2D, timeMs: number, sceneState: AnimationState) => {
    for (const inst of instances) {
      try {
        // Which symbol shows (swap follows the animated swapIndex).
        const idx = num(sceneState, inst.name, 'swapIndex')
        const entry = entries.get(shownSymbolId(inst, idx))
        if (!entry) continue
        const { symbol, composite, timeline } = entry
        if (symbol.width <= 0 || symbol.height <= 0) continue

        // Nested animation: apply the symbol's timeline, looped over its duration.
        if (timeline) {
          const dur = timeline.duration
          await composite.prepareFrame(dur > 0 ? timeMs % dur : timeMs)
          composite.adapter.applyState(timeline.getStateAtTime(dur > 0 ? timeMs % dur : timeMs))
        }

        // Instance transform, honouring its own scene animation (position/rotate/
        // scale offsets on top of its base box).
        const ex = inst.x + (num(sceneState, inst.name, 'x') ?? 0)
        const ey = inst.y + (num(sceneState, inst.name, 'y') ?? 0)
        const erot = num(sceneState, inst.name, 'rotate') ?? inst.rotation
        const escale = num(sceneState, inst.name, 'scale') ?? 1
        const cx = ex + inst.width / 2
        const cy = ey + inst.height / 2

        ctx.save()
        ctx.translate(cx, cy)
        if (erot) ctx.rotate((erot * Math.PI) / 180)
        if (escale !== 1) ctx.scale(escale, escale)
        ctx.translate(-cx, -cy)
        ctx.translate(ex, ey)
        ctx.scale(inst.width / symbol.width, inst.height / symbol.height)
        composite.adapter.render(ctx)
        ctx.restore()
      } catch {
        // A single instance failing must not break the whole export.
      }
    }
  }

  const dispose = () => {
    for (const { composite } of entries.values()) composite.dispose()
  }

  return { draw, dispose }
}
