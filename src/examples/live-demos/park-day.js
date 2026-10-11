import { deserializeTimeline } from '../../engine'
import { buildScene, drawProp, character, castMember, characterScript, characterPoseOf, drawCharacter, hairFollowTracks } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, buildScene, drawProp, character, castMember, characterScript, characterPoseOf, drawCharacter, hairFollowTracks }

export const html = `<style>
  .pkd-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .pkd-canvas { width: 100%; max-width: 460px; aspect-ratio: 720 / 400; height: auto; border-radius: 8px; background: #5aaef2; }
  .pkd-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; min-height: 1.4em; }
</style>
<div class="pkd-wrap">
  <canvas class="pkd-canvas" width="720" height="400"></canvas>
  <div class="pkd-readout"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.pkd-canvas')
  const readout = root.querySelector('.pkd-readout')
  const ctx = canvas.getContext('2d')
  const W = 720
  const H = 400
  const LOOP = 16000

  // The park preset: a sky with hills, two trees and a bench, built as targets standing on the ground.
  const park = tinyfly.buildScene('park', { width: W, height: H, scenery: { hour: 6.5, clouds: 0.3 } })
  const sky = park.scenery
  // A day passes over the loop; wind gets up, rain comes and goes, the clouds thicken and clear.
  sky.set('hour', { at: 0, value: 21.5, duration: LOOP })
  sky.set('wind', { at: 4000, value: 0.9, duration: 1500 })
  sky.set('clouds', { at: 4000, value: 0.85, duration: 2500 })
  sky.set('rain', { at: 6500, value: 0.9, duration: 1200 })
  sky.set('rain', { at: 10500, value: 0, duration: 1500 })
  sky.set('clouds', { at: 10500, value: 0.25, duration: 2500 })
  sky.set('wind', { at: 11000, value: 0.15, duration: 2000 })

  // A cast member strolls through, her hair in the wind (the same wind the clouds drift on).
  const amy = tinyfly.character(tinyfly.castMember('youngWoman', 150))
  const script = tinyfly.characterScript('amy', amy, [
    { do: 'walk', to: 420, mood: 'happy' },
    { do: 'look', toward: 'viewer', mood: 'surprised' },
    { do: 'hold', for: 1800, mood: 'worried' },
    { do: 'walk', to: 300, mood: 'happy' },
    { do: 'wave', for: 1400, mood: 'joyful' },
    { do: 'hold', for: 4000 },
  ], { from: 40, ground: park.ground, style: 'snappy' })
  const hair = tinyfly.hairFollowTracks('amy', script.tracks, amy, { wind: 0.7 })
  const timeline = tinyfly.deserializeTimeline({ id: 'park-day', tracks: [...sky.tracks('sky'), ...script.tracks, ...hair] })

  const clock = { time: 0 }
  live.to(clock, { time: LOOP, duration: LOOP / 1000, ease: 'none', repeat: -1 })

  const valuesOf = (target, values) => {
    const props = { ...target.props }
    for (const [property, value] of values ?? []) if (property in props) props[property] = value
    return props
  }
  const draw = () => {
    const t = clock.time
    const state = timeline.getStateAtTime(t)
    const skyValues = valuesOf(sky.target, state.values.get('sky'))
    readout.textContent = `${String(Math.floor(skyValues.hour)).padStart(2, '0')}:${String(Math.floor((skyValues.hour % 1) * 60)).padStart(2, '0')} · wind ${skyValues.wind.toFixed(1)} · rain ${skyValues.rain.toFixed(1)} · clouds ${skyValues.clouds.toFixed(1)}`
    if (!ctx) return
    // The scenery first, then the props left to right, then the figure.
    sky.target.draw(ctx, { ...sky.target, props: skyValues }, t)
    for (const prop of park.props) tinyfly.drawProp(ctx, prop, { time: t, state }, 'prop')
    const values = state.values.get('amy') ?? new Map()
    const props = Object.fromEntries(values)
    ctx.save()
    ctx.translate(40 + (props.x ?? 0), park.ground + (props.y ?? 0))
    tinyfly.drawCharacter(ctx, amy, tinyfly.characterPoseOf(props), t)
    ctx.restore()
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const parkDay = {
  id: 'live-park-day',
  name: 'Park Day',
  description:
    'A day in the park from a scene preset (buildScene: a sky over hills, two trees and a bench), the sky’s hour, wind, clouds and rain as tracks: dawn to night with the sun and moon on their arcs and stars coming out, clouds drifting on the wind, a shower that slants with it. A cast member strolls through with her hair streaming in the same wind (hairFollowTracks with wind). Every frame is drawn from its time alone.',
  category: 'video',
  tags: ['canvas', 'scenery', 'sky', 'weather', 'rain', 'wind', 'character', 'props', 'video'],
  html,
  run,
}
