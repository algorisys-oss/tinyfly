import type { SceneElement } from '../stores/scene-store'
import { buildExportComposite } from './export-composite'

/**
 * Render a static "poster" thumbnail of a scene to a data URL.
 *
 * Reuses the Canvas export compositor so what you see in the gallery matches
 * what the Canvas renderer/export produces — including images, videos (first
 * frame), gradients and rounded corners. The scene is drawn at its base element
 * values (time 0), scaled to fit `maxWidth`.
 *
 * Returns `null` for an empty scene or when rendering isn't possible (no 2D
 * context, tainted canvas, etc.) — callers should treat a null as "no thumbnail".
 */
export async function renderSceneThumbnail(
  elements: SceneElement[],
  canvas: { width: number; height: number; background: string },
  maxWidth = 360
): Promise<string | null> {
  const drawable = elements.filter((el) => el.visible && el.type !== 'group')
  if (drawable.length === 0) return null
  if (canvas.width <= 0 || canvas.height <= 0) return null

  const scale = Math.min(1, maxWidth / canvas.width)
  const w = Math.max(1, Math.round(canvas.width * scale))
  const h = Math.max(1, Math.round(canvas.height * scale))

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = canvas.background
  ctx.fillRect(0, 0, w, h)

  let composite: Awaited<ReturnType<typeof buildExportComposite>> | null = null
  try {
    composite = await buildExportComposite(drawable)
    await composite.prepareFrame(0)
    ctx.save()
    ctx.scale(scale, scale)
    composite.adapter.render(ctx)
    ctx.restore()
    // WebP is ~3× smaller than PNG and universally decodable in the browsers we
    // target; toDataURL falls back to PNG automatically if WebP is unsupported.
    return out.toDataURL('image/webp', 0.72)
  } catch (e) {
    console.error('tinyfly: thumbnail render failed', e)
    return null
  } finally {
    composite?.dispose()
  }
}
