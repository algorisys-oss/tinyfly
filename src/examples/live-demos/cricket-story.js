import { Timeline } from '../../engine'
import { cricketClip, cricketCameraTracks, cricketEventAt, CRICKET_ACTIONS, CRICKET_FORMATS, CRICKET_VIEWS, CRICKET_CAMERA_ANGLES } from '../../sports'
import { characterObjects } from '../../characters'
import { loadScene3D, resolveScene3D, drawResolvedScene } from '../../scene-3d'

const tinyfly = { Timeline, cricketClip, cricketCameraTracks, cricketEventAt, CRICKET_ACTIONS, CRICKET_FORMATS, CRICKET_VIEWS, CRICKET_CAMERA_ANGLES, characterObjects, loadScene3D, resolveScene3D, drawResolvedScene }

export const html = `<style>
.crkt-wrap{display:grid;gap:12px;width:100%;max-width:min(1060px,calc(100vw - 24px));min-width:0;font:14px system-ui;color:#e6eddc}
.crkt-heading{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:end;gap:8px}.crkt-heading h2{margin:0;font-size:24px;color:#f8edcf}.crkt-heading p{margin:4px 0 0;color:#a7bb9f;font-size:13px}
.crkt-canvas{display:block;width:100%;height:auto;aspect-ratio:16/9;border-radius:14px;background:#c8e5ef}
.crkt-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px}.crkt-controls label{display:flex;align-items:center;gap:6px;font-size:12px}.crkt-controls select,.crkt-controls button{padding:6px 9px;color:#e6eddc;background:#1c302b;border:1px solid #466150;border-radius:7px;font:12px system-ui}.crkt-controls input[type=range]{width:130px;accent-color:#c4da87}.crkt-time{flex:1;min-width:140px}.crkt-format-note{margin:0;font-size:12px;color:#b7cba9}
.crkt-caption{display:grid;gap:4px;min-height:58px;padding:13px 16px;border:1px solid #425546;border-radius:10px;background:#182821}.crkt-caption strong{color:#f8edcf;font-size:16px}.crkt-caption p{margin:0;color:#c3d1b6;font-size:13px;line-height:1.5}
.crkt-beats{display:flex;flex-wrap:wrap;gap:6px}.crkt-beats button{padding:5px 8px;font:11px system-ui;border:1px solid #486047;border-radius:20px;background:#1a2921;color:#aebda1;cursor:pointer}.crkt-beats button[aria-current=true]{background:#d4dfae;color:#203627;border-color:#d4dfae}.crkt-readout{font:11px ui-monospace,monospace;color:#a8b6a0;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.crkt-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:11px;color:#afbea4}.crkt-legend span:before{content:'';display:inline-block;width:9px;height:9px;margin-right:5px;border-radius:50%;background:#397cb9}.crkt-legend span:nth-child(2):before{background:#bf604e}.crkt-legend span:nth-child(3):before{background:#edd99e}
@media(max-width:600px){.crkt-heading h2{font-size:20px}.crkt-controls{gap:8px}.crkt-controls select{max-width:180px}.crkt-controls input[type=range]{width:95px}.crkt-caption{padding:10px;min-height:76px}}
</style>
<div class="crkt-wrap">
<div class="crkt-heading"><div><h2>Cricket, one play at a time</h2><p>A ground, an organic cast and a camera for your next story.</p></div><div class="crkt-legend"><span>Batting side</span><span>Fielding side</span><span>Wickets</span></div></div>
<canvas class="crkt-canvas" width="1280" height="720" aria-label="Animated cricket ground and players"></canvas>
<div class="crkt-controls"><label>Format <select class="crkt-format" aria-label="Cricket format"></select></label><label>Play <select class="crkt-action" aria-label="Cricket action"></select></label><label>Cast <select class="crkt-cast" aria-label="Cricket cast"><option value="adults">Adults</option><option value="children">Children</option><option value="mixed">Mixed cast</option></select></label><label>Camera <select class="crkt-view" aria-label="Cricket camera"></select></label><label>Angle <input class="crkt-yaw" aria-label="Camera angle" type="range" min="0" max="360" value="75" step="1"></label></div>
<p class="crkt-format-note"></p>
<div class="crkt-caption" role="status" aria-live="polite"><strong></strong><p></p></div>
<div class="crkt-beats" aria-label="Story events"></div>
<div class="crkt-controls"><label><input class="crkt-play" type="checkbox" checked> Play</label><button class="crkt-replay">Replay</button><label>Speed <select class="crkt-speed" aria-label="Playback speed"><option value="1">1×</option><option value="0.5">½×</option><option value="0.25">¼×</option></select></label><input class="crkt-time" aria-label="Story time" type="range" min="0" max="6000" step="1" value="0"><button class="crkt-export">Download story JSON</button></div>
<div class="crkt-readout"><span class="crkt-time-label"></span><span class="crkt-result"></span></div>
</div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.crkt-canvas'), ctx = canvas.getContext('2d')
  const format = root.querySelector('.crkt-format'), action = root.querySelector('.crkt-action'), cast = root.querySelector('.crkt-cast')
  const view = root.querySelector('.crkt-view'), yaw = root.querySelector('.crkt-yaw'), play = root.querySelector('.crkt-play')
  const scrub = root.querySelector('.crkt-time'), speed = root.querySelector('.crkt-speed'), beats = root.querySelector('.crkt-beats')
  const title = root.querySelector('.crkt-caption strong'), caption = root.querySelector('.crkt-caption p')
  const listeners = []
  const on = (node, type, fn) => { node.addEventListener(type, fn); listeners.push(() => node.removeEventListener(type, fn)) }
  const choices = (select, entries) => { for (const [value, label] of entries) { const option = document.createElement('option'); option.value = value; option.textContent = label; select.appendChild(option) } }
  choices(format, Object.entries(tinyfly.CRICKET_FORMATS).map(([key, info]) => [key, info.name]))
  choices(action, Object.entries(tinyfly.CRICKET_ACTIONS).map(([key, info]) => [key, info.name]))
  choices(view, Object.entries(tinyfly.CRICKET_VIEWS))
  format.value = 't20'; action.value = 'bowling'; view.value = 'pitch'

  const clock = { time: 0 }
  const playback = live.timeline({ paused: true, repeat: -1 }).to(clock, { time: 6000, duration: 6, ease: 'none' })
  let clip, loaded, motion, camera, cameraTracks, lastEvent
  const cameraFor = () => {
    cameraTracks = tinyfly.cricketCameraTracks(clip, { view: view.value, yaw: Number(yaw.value) })
    camera = new tinyfly.Timeline({ id: 'cricket-camera', tracks: cameraTracks })
  }
  const draw = () => {
    if (!loaded) return
    const time = clock.time
    const values = motion.getStateAtTime(time).values
    for (const [target, properties] of camera.getStateAtTime(time).values) values.set(target, properties)
    if (ctx) {
      const frame = tinyfly.resolveScene3D(loaded, values, { width: canvas.width, height: canvas.height, time })
      tinyfly.drawResolvedScene(ctx, frame)
    }
    scrub.value = String(Math.round(time))
    root.querySelector('.crkt-time-label').textContent = `${(time / 1000).toFixed(2)} s · ${Math.round(Number(yaw.value))}° · ${tinyfly.CRICKET_VIEWS[view.value]}`
    const event = tinyfly.cricketEventAt(clip.events, time)
    if (event?.id !== lastEvent) {
      lastEvent = event?.id; title.textContent = event?.label ?? ''; caption.textContent = event?.caption ?? ''
      for (const button of beats.querySelectorAll('button')) button.setAttribute('aria-current', String(button.dataset.event === event?.id))
    }
    const result = clip.result
    root.querySelector('.crkt-result').textContent = time < 5700 ? 'Select an event to inspect its pose.' : `Example result: ${result.runs} runs · ${result.extras} extras · ${result.wickets} wickets${result.freeHitNext ? ' · free hit next' : ''}`
  }
  const seek = (time) => { play.checked = false; playback.pause().progress(time / 6000); clock.time = time; draw() }
  const rebuild = () => {
    playback.pause().progress(0); clock.time = 0; lastEvent = undefined
    // The same builders work in Node/Workers and in your own app. All motion is data.
    clip = tinyfly.cricketClip({ format: format.value, action: action.value, cast: cast.value })
    loaded = tinyfly.loadScene3D(clip.scene, { kinds: [tinyfly.characterObjects] })
    motion = new tinyfly.Timeline(clip.timeline)
    cameraFor()
    root.querySelector('.crkt-format-note').textContent = tinyfly.CRICKET_FORMATS[format.value].summary
    beats.replaceChildren()
    for (const event of clip.events) { const button = document.createElement('button'); button.type = 'button'; button.textContent = event.label; button.dataset.time = String(event.time); button.dataset.event = event.id; beats.appendChild(button) }
    draw(); if (play.checked) playback.play()
  }
  for (const select of [format, action, cast]) on(select, 'change', rebuild)
  on(view, 'change', () => { yaw.value = String(tinyfly.CRICKET_CAMERA_ANGLES[view.value]); cameraFor(); draw() })
  on(yaw, 'input', () => { cameraFor(); draw() })
  on(play, 'change', () => { if (play.checked) playback.play(); else playback.pause(); draw() })
  on(scrub, 'input', () => seek(Number(scrub.value)))
  on(speed, 'change', () => playback.timeScale(Number(speed.value)))
  on(beats, 'click', event => { const button = event.target.closest('button[data-time]'); if (button && beats.contains(button)) seek(Number(button.dataset.time)) })
  on(root.querySelector('.crkt-replay'), 'click', () => { playback.progress(0); clock.time = 0; play.checked = true; playback.play(); draw() })
  on(root.querySelector('.crkt-export'), 'click', () => {
    const story = { ...clip, timeline: { ...clip.timeline, tracks: [...clip.timeline.tracks, ...cameraTracks] } }
    const url = URL.createObjectURL(new Blob([JSON.stringify(story, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `cricket-${format.value}-${action.value}.json`
    root.appendChild(anchor); anchor.click(); anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  })
  rebuild(); live.ticker.add(draw)
  // #endregion code
  return () => { playback.kill(); live.ticker.remove(draw); for (const remove of listeners) remove() }
}

/** @type {import('./types').LiveDemo} */
export const cricketStory = {
  id: 'live-cricket-story', name: 'Cricket Stories: Organic Players & 360° Ground',
  description: 'Reusable sports APIs create a cricket ground, standard pitch and creases, two wickets, eleven fielders, two batters and umpires on the existing organic rig. Choose Test, ODI or T20 and inspect sixteen plays: pace/spin bowling, drive, block, running, four, six, catch, ground field, throw, bowled, LBW, stumping, run-out, no-ball and wide. The camera can orbit the whole ground, view either end close up or follow the ball. Motion, bat grips, ball handoffs, wicket breaks, events and captions are JSON; download the story for your own tutorial.',
  category: '3d', alsoIn: ['video'], tags: ['cricket', 'sports', 'story', 'organic', 'camera', '360', 'bowling', 'batting', 'catch', 'stumping', 'Test', 'ODI', 'T20'],
  addons: ['scene-3d'], html, run,
}
