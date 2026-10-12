/**
 * Reusable cricket story; no browser, editor or custom animation callbacks.
 * node bin/tinyfly.mjs video examples/headless-video/cricket-story.mjs --stills /tmp/cricket-story
 * node bin/tinyfly.mjs video examples/headless-video/cricket-story.mjs -o /tmp/cricket-story.mp4
 */
import { cricketClip, cricketCameraTracks, cricketEventAt } from '@algorisys/tinyfly/sports'
import { characterObjects } from '@algorisys/tinyfly/characters'
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'

const clip = cricketClip({ format: 't20', action: 'batting', cast: 'mixed' })
const camera = cricketCameraTracks(clip, { view: 'batter' })
const scene = loadScene3D(clip.scene, { kinds: [characterObjects] })

export default {
  width: 1280, height: 720, fps: 30, duration: clip.duration,
  timeline: { ...clip.timeline, tracks: [...clip.timeline.tracks, ...camera] },
  draw(ctx, { time, state }) {
    drawScene3D(ctx, scene, state.values, { width: 1280, height: 720, time })
    const event = cricketEventAt(clip.events, time)
    ctx.fillStyle = '#182821ee'; ctx.fillRect(24, 620, 1232, 78)
    ctx.fillStyle = '#f8edcf'; ctx.font = '600 22px sans-serif'; ctx.fillText(event?.label ?? '', 42, 651)
    ctx.fillStyle = '#c3d1b6'; ctx.font = '17px sans-serif'; ctx.fillText(event?.caption ?? '', 42, 680)
  },
}
