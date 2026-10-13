import { Timeline } from '../../engine'
import { cricketClip, cricketCameraTracks, cricketEventAt, CRICKET_ACTIONS, CRICKET_CASTS, CRICKET_FIELDING_POSITIONS, CRICKET_FORMATS, CRICKET_VIEWS, CRICKET_CAMERA_ANGLES, CRICKET_MARKING_PROFILES, cricketFieldingPositions, cricketFieldingOverlay } from '../../sports'
import { characterObjects } from '../../characters'
import { loadScene3D, resolveScene3D, drawResolvedScene } from '../../scene-3d'

const tinyfly = { Timeline, cricketClip, cricketCameraTracks, cricketEventAt, CRICKET_ACTIONS, CRICKET_CASTS, CRICKET_FIELDING_POSITIONS, CRICKET_FORMATS, CRICKET_VIEWS, CRICKET_CAMERA_ANGLES, CRICKET_MARKING_PROFILES, cricketFieldingPositions, cricketFieldingOverlay, characterObjects, loadScene3D, resolveScene3D, drawResolvedScene }

export const html = `<style>
.crkt-wrap{container-type:inline-size;display:grid;gap:12px;width:min(1060px,calc(100vw - 24px));max-width:100%;min-width:0;font:14px system-ui;color:#e6eddc}
.crkt-heading{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:end;gap:8px}.crkt-heading h2{margin:0;font-size:24px;color:#f8edcf}.crkt-heading p{margin:4px 0 0;color:#a7bb9f;font-size:13px}
.crkt-workspace{display:grid;grid-template-columns:minmax(0,1fr) 210px;align-items:start;gap:12px}.crkt-stage{display:grid;gap:10px;min-width:0}
.crkt-canvas{display:block;width:100%;height:auto;aspect-ratio:16/9;border-radius:14px;background:#c8e5ef}
.crkt-panel{position:sticky;top:12px;max-height:calc(100dvh - 24px);overflow:auto;box-sizing:border-box;display:grid;gap:12px;padding:12px;border:1px solid #425546;border-radius:12px;background:#182821;min-width:0}
.crkt-controls{display:grid;gap:10px;min-width:0}.crkt-controls label{display:grid;gap:5px;font-size:12px;min-width:0}.crkt-controls select,.crkt-controls button{box-sizing:border-box;min-width:0;width:100%;padding:8px;color:#e6eddc;background:#1c302b;border:1px solid #466150;border-radius:7px;font:12px system-ui}.crkt-controls input[type=range]{box-sizing:border-box;width:100%;min-width:0;margin:0;accent-color:#c4da87}.crkt-controls :focus-visible,.crkt-beats button:focus-visible{outline:2px solid #f8edcf;outline-offset:3px}.crkt-controls button{cursor:pointer}.crkt-transport{display:grid;grid-template-columns:auto 1fr 1fr;gap:8px;align-items:center}.crkt-transport label:first-child{display:flex;align-items:center;gap:5px}.crkt-format-note{margin:0;font-size:12px;line-height:1.5;color:#b7cba9}
.crkt-zoom-controls{display:grid;gap:6px;grid-column:1/-1}.crkt-zoom-buttons{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.crkt-controls button:disabled{opacity:.45;cursor:default}.crkt-selectors{grid-template-columns:repeat(2,minmax(0,1fr))}.crkt-selectors label:nth-last-child(-n+2){grid-column:1/-1}.crkt-area-controls label{display:flex;align-items:center;gap:6px}.crkt-area-note{margin:0;font-size:12px;line-height:1.5;color:#c3d1b6}.crkt-area-note[hidden]{display:none}
.crkt-caption{display:grid;gap:4px;min-height:58px;padding:13px 16px;border:1px solid #425546;border-radius:10px;background:#182821}.crkt-caption strong{color:#f8edcf;font-size:16px}.crkt-caption p{margin:0;color:#c3d1b6;font-size:13px;line-height:1.5}
.crkt-teams{border:1px solid #425546;border-radius:10px;padding:12px;color:#c3d1b6;font-size:13px;line-height:1.5}.crkt-teams summary{cursor:pointer;color:#f8edcf}.crkt-teams summary:focus-visible{outline:2px solid #f8edcf;outline-offset:3px}.crkt-teams p{margin:8px 0}.crkt-positions{display:flex;flex-wrap:wrap;gap:4px 20px;margin:8px 0;padding-left:20px}
.crkt-beats{display:flex;flex-wrap:wrap;gap:6px}.crkt-beats button{padding:7px 9px;font:11px system-ui;border:1px solid #486047;border-radius:20px;background:#1a2921;color:#aebda1;cursor:pointer}.crkt-beats button[aria-current=true]{background:#d4dfae;color:#203627;border-color:#d4dfae}.crkt-readout{font:11px ui-monospace,monospace;color:#a8b6a0;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.crkt-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:11px;color:#afbea4}.crkt-legend span:before{content:'';display:inline-block;width:9px;height:9px;margin-right:5px;border-radius:50%;background:#397cb9}.crkt-legend span:nth-child(2):before{background:#bf604e}.crkt-legend span:nth-child(3):before{background:#edd99e}
@container(max-width:600px){.crkt-workspace{grid-template-columns:minmax(0,1fr)}.crkt-panel{position:static;max-height:none;grid-row:1;gap:10px}.crkt-selectors{grid-template-columns:repeat(2,minmax(0,1fr))}.crkt-selectors label:last-child{grid-column:1/-1}.crkt-playback{grid-template-columns:minmax(0,1fr) auto;align-items:end}.crkt-playback>label{grid-column:1/-1}.crkt-playback>.crkt-transport{grid-column:1/-1}.crkt-format-note{display:none}.crkt-heading h2{font-size:20px}.crkt-caption{padding:10px}}
</style>
<div class="crkt-wrap">
<div class="crkt-heading"><div><h2>Cricket, one play at a time</h2><p>A ground, an organic cast and a camera for your next story.</p></div><div class="crkt-legend"><span>Batting side</span><span>Fielding side</span><span>Wickets</span></div></div>
<div class="crkt-workspace">
<div class="crkt-stage">
<canvas class="crkt-canvas" width="1280" height="720" aria-label="Animated cricket ground and players"></canvas>
<div class="crkt-caption" role="status" aria-live="polite"><strong></strong><p></p></div>
<p class="crkt-area-note" hidden></p>
<div class="crkt-beats" aria-label="Story events"></div>
<div class="crkt-readout"><span class="crkt-time-label"></span><span class="crkt-result"></span></div>
<details class="crkt-teams"><summary>Teams and field positions</summary><p>Each team has eleven players. All eleven of the fielding XI are shown; only the striker and non-striker of the batting XI are on the field. Their nine teammates wait off-field. Two umpires are also shown.</p><ul class="crkt-positions" aria-label="Eleven stock fielding positions"></ul><p>For this right-handed batter, the off side is in front of the chest; the on or leg side is behind the back. Mid-on is on the leg side, closer to the pitch toward the bowler. Long-on is its deeper boundary alternative, not an additional fielder in this stock layout. Extra cover is the collecting fielder in these authored plays.</p><p>Wicketkeeper and slip stand behind the striker. They watch the bowler during the run-up, then track the delivery through its bounce and follow the ball after a stroke or miss.</p><p class="crkt-marking-note"></p></details>
</div>
<aside class="crkt-panel" aria-label="Cricket story controls">
<div class="crkt-controls crkt-selectors"><label>Format <select class="crkt-format" aria-label="Cricket format"></select></label><label>Markings <select class="crkt-markings" aria-label="Field marking profile"></select></label><label>Play <select class="crkt-action" aria-label="Cricket action"></select></label><label>Cast <select class="crkt-cast" aria-label="Cricket cast"></select></label><label>Camera <select class="crkt-view" aria-label="Cricket camera"></select></label><label>Angle <input class="crkt-yaw" aria-label="Camera angle" type="range" min="0" max="360" value="75" step="1"></label></div>
<div class="crkt-controls crkt-zoom-controls"><label>Zoom <output class="crkt-zoom-label">100%</output><input class="crkt-zoom" aria-label="Camera zoom" type="range" min="25" max="400" value="100" step="25"></label><div class="crkt-zoom-buttons"><button class="crkt-zoom-out" type="button" aria-label="Zoom out">−</button><button class="crkt-zoom-reset" type="button" aria-label="Reset zoom">Reset</button><button class="crkt-zoom-in" type="button" aria-label="Zoom in">+</button></div></div>
<div class="crkt-controls crkt-area-controls"><label><input class="crkt-area-review" type="checkbox"> Setup field markers</label></div>
<div class="crkt-controls crkt-playback"><div class="crkt-transport"><label><input class="crkt-play" type="checkbox" checked> Play</label><button class="crkt-replay" type="button">Replay</button><label>Speed <select class="crkt-speed" aria-label="Playback speed"><option value="1">1×</option><option value="0.5">½×</option><option value="0.25">¼×</option></select></label></div><label>Story time <input class="crkt-time" aria-label="Story time" type="range" min="0" max="6000" step="1" value="0"></label><button class="crkt-export" type="button">Download story JSON</button></div>
<p class="crkt-format-note"></p>
</aside>
</div>
</div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.crkt-canvas'), ctx = canvas.getContext('2d')
  const format = root.querySelector('.crkt-format'), action = root.querySelector('.crkt-action'), cast = root.querySelector('.crkt-cast')
  const markings = root.querySelector('.crkt-markings'), areaReview = root.querySelector('.crkt-area-review')
  const view = root.querySelector('.crkt-view'), yaw = root.querySelector('.crkt-yaw'), play = root.querySelector('.crkt-play')
  const zoom = root.querySelector('.crkt-zoom'), zoomLabel = root.querySelector('.crkt-zoom-label')
  const zoomOut = root.querySelector('.crkt-zoom-out'), zoomIn = root.querySelector('.crkt-zoom-in')
  const scrub = root.querySelector('.crkt-time'), speed = root.querySelector('.crkt-speed'), beats = root.querySelector('.crkt-beats')
  const title = root.querySelector('.crkt-caption strong'), caption = root.querySelector('.crkt-caption p')
  const listeners = []
  const on = (node, type, fn) => { node.addEventListener(type, fn); listeners.push(() => node.removeEventListener(type, fn)) }
  const choices = (select, entries) => { for (const [value, label] of entries) { const option = document.createElement('option'); option.value = value; option.textContent = label; select.appendChild(option) } }
  choices(format, Object.entries(tinyfly.CRICKET_FORMATS).map(([key, info]) => [key, info.name]))
  choices(action, Object.entries(tinyfly.CRICKET_ACTIONS).map(([key, info]) => [key, info.name]))
  choices(view, Object.entries(tinyfly.CRICKET_VIEWS))
  choices(markings, Object.entries(tinyfly.CRICKET_MARKING_PROFILES).map(([key, info]) => [key, info.name]))
  choices(cast, Object.entries(tinyfly.CRICKET_CASTS))
  format.value = 't20'; action.value = 'bowling'; view.value = 'pitch'; markings.value = 'icc-men'

  const clock = { time: 0 }
  const playback = live.timeline({ paused: true, repeat: -1 }).to(clock, { time: 6000, duration: 6, ease: 'none' })
  let clip, loaded, shownScene, motion, camera, cameraTracks, lastEvent
  const cameraFor = () => {
    cameraTracks = tinyfly.cricketCameraTracks(clip, { view: view.value, yaw: Number(yaw.value), zoom: Number(zoom.value) / 100 })
    camera = new tinyfly.Timeline({ id: 'cricket-camera', tracks: cameraTracks })
    zoomLabel.value = `${zoom.value}%`
    zoomOut.disabled = Number(zoom.value) <= Number(zoom.min)
    zoomIn.disabled = Number(zoom.value) >= Number(zoom.max)
  }
  const sceneFor = () => {
    areaReview.disabled = !clip.fieldingArea
    const showMarkers = areaReview.checked && !!clip.fieldingArea
    shownScene = { ...clip.scene, objects: [...clip.scene.objects, ...(showMarkers ? tinyfly.cricketFieldingOverlay(clip) : [])] }
    loaded = tinyfly.loadScene3D(shownScene, { kinds: [tinyfly.characterObjects] })
    const note = root.querySelector('.crkt-area-note')
    note.hidden = !showMarkers
    if (showMarkers) {
      const positions = tinyfly.cricketFieldingPositions(clip), outside = positions.filter(player => player.inside === false)
      note.textContent = `Setup markers: ${positions.length - outside.length} inside (green), ${outside.length} outside (orange): ${outside.map(player => player.name).join(', ')}. These reference positions stay fixed during the play; they illustrate placement rather than an umpiring decision.`
    }
    root.querySelector('.crkt-marking-note').textContent = `${tinyfly.CRICKET_MARKING_PROFILES[markings.value].summary}${clip.format === 'test' ? ' Test has no fielding-restriction area.' : ''} Marking profiles are independent of cast; venue and competition rules need their own checks.`
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
  const rebuild = (preserveTime = false) => {
    const time = preserveTime ? clock.time : 0
    playback.pause().progress(time / 6000); clock.time = time; lastEvent = undefined
    // The same builders work in Node/Workers and in your own app. All motion is data.
    clip = tinyfly.cricketClip({ format: format.value, action: action.value, cast: cast.value, markingProfile: markings.value })
    sceneFor()
    motion = new tinyfly.Timeline(clip.timeline)
    cameraFor()
    root.querySelector('.crkt-format-note').textContent = tinyfly.CRICKET_FORMATS[format.value].summary
    const positions = root.querySelector('.crkt-positions')
    positions.replaceChildren()
    for (const id of Object.keys(tinyfly.CRICKET_FIELDING_POSITIONS)) {
      const player = clip.scene.objects.find(object => object.id === id)
      const item = document.createElement('li'); item.textContent = player.name; item.dataset.player = id; positions.appendChild(item)
    }
    beats.replaceChildren()
    for (const event of clip.events) { const button = document.createElement('button'); button.type = 'button'; button.textContent = event.label; button.dataset.time = String(event.time); button.dataset.event = event.id; beats.appendChild(button) }
    draw(); if (play.checked) playback.play()
  }
  for (const select of [format, action, cast]) on(select, 'change', () => rebuild())
  on(markings, 'change', () => rebuild(true))
  on(areaReview, 'change', () => { sceneFor(); draw() })
  on(view, 'change', () => { yaw.value = String(tinyfly.CRICKET_CAMERA_ANGLES[view.value]); cameraFor(); draw() })
  on(yaw, 'input', () => { cameraFor(); draw() })
  on(zoom, 'input', () => { cameraFor(); draw() })
  on(zoomOut, 'click', () => { zoom.stepDown(); cameraFor(); draw() })
  on(zoomIn, 'click', () => { zoom.stepUp(); cameraFor(); draw() })
  on(root.querySelector('.crkt-zoom-reset'), 'click', () => { zoom.value = '100'; cameraFor(); draw() })
  on(play, 'change', () => { if (play.checked) playback.play(); else playback.pause(); draw() })
  on(scrub, 'input', () => seek(Number(scrub.value)))
  on(speed, 'change', () => playback.timeScale(Number(speed.value)))
  on(beats, 'click', event => { const button = event.target.closest('button[data-time]'); if (button && beats.contains(button)) seek(Number(button.dataset.time)) })
  on(root.querySelector('.crkt-replay'), 'click', () => { playback.progress(0); clock.time = 0; play.checked = true; playback.play(); draw() })
  on(root.querySelector('.crkt-export'), 'click', () => {
    const story = { ...clip, scene: shownScene, timeline: { ...clip.timeline, tracks: [...clip.timeline.tracks, ...cameraTracks] } }
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
  description: 'Reusable sports APIs create a cricket ground, standard pitch and creases, two wickets, eleven named fielders, two on-field batters and two umpires on the existing organic rig. Choose MCC, ICC men or ICC women markings; ODI/T20 restriction areas use wicket-centred capsule outlines, with optional classified setup markers. Choose Test, ODI or T20 and inspect sixteen plays: pace/spin bowling, drive, block, running, four, six, catch, ground field, throw, bowled, LBW, stumping, run-out, no-ball and wide. The camera can orbit the whole ground, view either end close up or follow the ball. Zoom from 25% to 400% to review poses, and reset to the default framing. Motion, bat grips, ball handoffs, wicket breaks, events and captions are JSON; download the story for your own tutorial.',
  category: '3d', alsoIn: ['video'], tags: ['cricket', 'sports', 'story', 'organic', 'camera', '360', 'bowling', 'batting', 'catch', 'stumping', 'Test', 'ODI', 'T20'],
  addons: ['scene-3d'], html, run,
}
