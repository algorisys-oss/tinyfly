import { CanvasAdapter, type CanvasTarget } from '../../adapters/canvas'
import type { SceneElement, ImageElement, VideoElement } from '../stores/scene-store'
import { sceneElementToCanvasTarget } from './scene-to-canvas'

/**
 * Builds a Canvas renderer for video export that also composites the DOM-only
 * layers — <img> and <video> — that the live Canvas renderer skips. Image and
 * video frames are drawn with `ctx.drawImage`, so a device screen's recording,
 * screenshots, etc. appear in the exported file.
 *
 * Videos are seeked per frame to stay in sync with the timeline.
 */
export interface ExportComposite {
  /** A CanvasAdapter with every drawable element registered in z-order. */
  adapter: CanvasAdapter
  /** Seek all video layers to the given timeline time before rendering a frame. */
  prepareFrame: (timeMs: number) => Promise<void>
  /** Release media elements. */
  dispose: () => void
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function loadVideo(src: string): Promise<HTMLVideoElement | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    const done = () => resolve(video)
    video.onloadeddata = done
    video.onerror = () => resolve(null)
    video.src = src
    // Safety: some browsers need a load() nudge.
    video.load()
  })
}

/** Seek a video to `seconds` and resolve once the frame is ready (with a timeout guard). */
function seekVideo(video: HTMLVideoElement, seconds: number): Promise<void> {
  return new Promise((resolve) => {
    if (!Number.isFinite(seconds)) return resolve()
    const target = Math.max(0, seconds)
    if (Math.abs(video.currentTime - target) < 0.001) return resolve()
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      video.removeEventListener('seeked', finish)
      resolve()
    }
    video.addEventListener('seeked', finish)
    // Guard against a 'seeked' that never fires (e.g. past the end).
    setTimeout(finish, 120)
    try {
      video.currentTime = target
    } catch {
      finish()
    }
  })
}

export async function buildExportComposite(elements: SceneElement[]): Promise<ExportComposite> {
  const adapter = new CanvasAdapter()
  const videos: { el: VideoElement; node: HTMLVideoElement }[] = []
  const mediaNodes: HTMLVideoElement[] = []

  for (const el of elements) {
    if (el.type === 'image') {
      const image = el as ImageElement
      const node = image.src ? await loadImage(image.src) : null
      if (node) registerImageTarget(adapter, el, node)
    } else if (el.type === 'video') {
      const video = el as VideoElement
      const node = video.src ? await loadVideo(video.src) : null
      if (node) {
        registerImageTarget(adapter, el, node)
        videos.push({ el: video, node })
        mediaNodes.push(node)
      }
    } else {
      const target = sceneElementToCanvasTarget(el)
      if (target) {
        adapter.registerTarget(el.name, target)
        adapter.registerTarget(el.id, target, el.name)
      }
    }
  }

  const prepareFrame = async (timeMs: number) => {
    await Promise.all(
      videos.map(({ el, node }) => {
        if (timeMs < el.startTime) return seekVideo(node, 0)
        let t = (timeMs - el.startTime) / 1000
        if (el.loop && node.duration) t %= node.duration
        return seekVideo(node, t)
      })
    )
  }

  const dispose = () => {
    for (const node of mediaNodes) {
      node.removeAttribute('src')
      node.load()
    }
  }

  return { adapter, prepareFrame, dispose }
}

function registerImageTarget(adapter: CanvasAdapter, el: SceneElement, image: CanvasImageSource) {
  const target: CanvasTarget = {
    type: 'image',
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    opacity: el.opacity,
    rotate: el.rotation,
    image,
  }
  adapter.registerTarget(el.name, target)
  adapter.registerTarget(el.id, target, el.name)
}
