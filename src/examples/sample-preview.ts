import { Timeline, type AnyTrack } from '../engine'
import type { SampleDefinition } from '../editor/samples'
import { createSceneStore } from '../editor/stores/scene-store'
import { generateElementHtml } from '../editor/utils/element-html'

/**
 * A playable preview of an editable example, built the same way an embed is.
 *
 * The sample's partial elements are completed with the editor's defaults (by
 * adding them to a throwaway scene store, exactly as loading a sample does),
 * then rendered with the embed HTML generator. So a preview shows what an
 * embed of that sample would show — no second renderer to keep in sync.
 */

export interface SamplePreview {
  /** Markup for the stage, sized `width` × `height`, targets tagged `data-tinyfly` */
  html: string
  timeline: Timeline
  width: number
  height: number
}

/** The editor's default canvas, used when a sample does not declare one. */
const DEFAULT_SIZE = { width: 300, height: 200 }

/** The reserved camera layer's target name. */
const CAMERA_TARGET = 'Camera'

export function buildSamplePreview(sample: SampleDefinition): SamplePreview {
  const scene = createSceneStore()
  for (const element of sample.elements) {
    scene.addElement(element.type!, element)
  }

  const inner = scene
    .getTopLevelElements()
    .map((element) => generateElementHtml(element))
    .filter(Boolean)
    .join('\n')

  const hasCamera = sample.tracks.some((track) => track.target === CAMERA_TARGET)
  const html = hasCamera
    ? `<div data-tinyfly="${CAMERA_TARGET}" style="position: absolute; inset: 0; transform-origin: center center;">\n${inner}\n</div>`
    : inner

  const timeline = new Timeline({
    id: `example-${sample.id}`,
    name: sample.name,
    config: { duration: sample.duration },
    tracks: sample.tracks.map((track, index) => ({ id: `${sample.id}-track-${index}`, ...track }) as AnyTrack),
  })

  return {
    html,
    timeline,
    width: sample.canvas?.width ?? DEFAULT_SIZE.width,
    height: sample.canvas?.height ?? DEFAULT_SIZE.height,
  }
}
