import { deserializeTimeline } from '../../engine'
import { SOFT_CARTOON_CAST, outfitPreset, softCartoonCharacter, characterPoseTracks, characterPoseOf, characterScript, drawCharacter, hairFollowTracks, humanPose, mirrorHumanPose, HUMAN_POSES, HUMAN_REST, HAND_REST, HAND_SHAPES, lipSyncOver, characterJoints, reachCharacter } from '../../characters'
const tinyfly = { deserializeTimeline, SOFT_CARTOON_CAST, outfitPreset, softCartoonCharacter, characterPoseTracks, characterPoseOf, characterScript, drawCharacter, hairFollowTracks, humanPose, mirrorHumanPose, HUMAN_POSES, HUMAN_REST, HAND_REST, HAND_SHAPES, lipSyncOver, characterJoints, reachCharacter }

export const html = `<style>
.oc-wrap {display:grid;gap:12px;width:100%;max-width:min(960px,calc(100vw - 24px));min-width:0}
.oc-canvas {display:block;width:100%;height:auto;aspect-ratio:960/900;border-radius:12px;background:#fbf6ed}
.oc-controls {display:flex;flex-wrap:wrap;gap:12px;align-items:center;color:#cbd5e1;font:12px system-ui}
.oc-controls label {display:flex;gap:5px;align-items:center}
.oc-outfit {border:1px solid #475569;border-radius:8px;padding:10px;margin:0;min-width:0}
.oc-outfit legend {padding:0 5px;color:#cbd5e1;font:12px system-ui}
.oc-readout {color:#cbd5e1;font:12px system-ui;min-height:1.4em}
</style><div class="oc-wrap"><canvas class="oc-canvas" width="960" height="900"></canvas>
<div class="oc-controls">
<label>Characters <select class="oc-actors"><option value="adults">Adults</option><option value="children">Children</option><option value="family">Adult & child</option></select></label>
<label>Face type <select class="oc-face"><option value="cast" selected>Actor defaults</option><option value="expressive">Expressive round</option><option value="soft">Soft jaw</option><option value="simple">Simple round</option></select></label>
<label>Hairstyle <select class="oc-hair"><option value="cast" selected>Actor defaults</option><option value="softSweep">Soft sweep</option><option value="flowingBob">Flowing bob</option><option value="cascadingWaves">Cascading waves</option></select></label>
<label>Action <select class="oc-action"><option value="story">Walk & talk story</option><option value="walk">Walk</option><option value="turn">Full turn</option><option value="gesture">Arms & hands</option><option value="sit">Seated speaking</option><option value="cheek">Palm at cheek</option><option value="crossed">Crossed arms</option></select></label>
<label>Clothing <select class="oc-clothes"><option value="everyday">Everyday</option><option value="formal">Formal</option><option value="casual">Casual</option><option value="leaves">Leaf garments</option></select></label>
<label>Edit outfit <select class="oc-outfit-target"><option value="both">Both characters</option><option value="0">Left character</option><option value="1">Right character</option></select></label>
<label>Outline <input class="oc-outline" aria-label="Outline width" type="range" min="0" max="4" step="0.25" value="1.5"></label>
<label>Skin <input class="oc-skin" type="color" value="#efbd96"></label>
<label><input class="oc-shade" type="checkbox" checked> Cel shading</label>
<label><input class="oc-play" type="checkbox" checked> Play</label>
<label>Time <input class="oc-time" aria-label="Story time" type="range" min="0" max="8000" step="50" value="0"></label>
</div>
<fieldset class="oc-outfit"><legend>Outfit details</legend><div class="oc-controls">
<label>Top <select class="oc-top"><option value="tshirt">T-shirt</option><option value="shirt">Shirt</option><option value="blouse">Blouse</option><option value="dress">Dress</option></select></label>
<label>Bottom <select class="oc-bottom"><option value="trousers">Trousers</option><option value="shorts">Shorts</option><option value="skirt">Skirt</option></select></label>
<label>Trouser style <select class="oc-trouser-style"><option value="plain">Plain</option><option value="jeans">Jeans</option><option value="cargo">Cargo</option></select></label>
<label>Sleeves <select class="oc-sleeves"><option value="short">Short</option><option value="long">Long</option><option value="none">None</option></select></label>
<label>Top colour <input type="color" class="oc-top-color" value="#bc7050"></label>
<label>Bottom colour <input type="color" class="oc-bottom-color" value="#495a67"></label>
<label><input type="checkbox" class="oc-collar"> Collar</label>
<label><input type="checkbox" class="oc-tie"> Tie</label>
<label>Tie colour <input type="color" class="oc-tie-color" value="#804453"></label>
</div><div class="oc-readout oc-outfit-note"></div></fieldset><div class="oc-readout oc-status"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.oc-canvas'), ctx = canvas.getContext('2d')
  const face = root.querySelector('.oc-face'), hair = root.querySelector('.oc-hair')
  const actors = root.querySelector('.oc-actors')
  const action = root.querySelector('.oc-action'), clothes = root.querySelector('.oc-clothes')
  const outfitTarget = root.querySelector('.oc-outfit-target')
  const outfitFields = Object.fromEntries(['top', 'bottom', 'trouser-style', 'sleeves', 'top-color', 'bottom-color', 'collar', 'tie', 'tie-color'].map(key => [key, root.querySelector(`.oc-${key}`)]))
  const outfits = [{ category: 'everyday', options: {} }, { category: 'everyday', options: {} }]
  const selectedOutfits = () => outfitTarget.value === 'both' ? [0, 1] : [Number(outfitTarget.value)]
  const outline = root.querySelector('.oc-outline'), skin = root.querySelector('.oc-skin')
  const shade = root.querySelector('.oc-shade'), play = root.querySelector('.oc-play'), scrub = root.querySelector('.oc-time')
  const readout = root.querySelector('.oc-status')
  const clock = { time: 0 }
  const animation = live.to(clock, { time: 8000, duration: 8, ease: 'none', repeat: -1 })
  const faces = {
    expressive: { style: 'anime', shape: 'round', eyeScale: .95, eyeAspect: 1.1 },
    soft: { style: 'anime', shape: 'angular', jawWidth: .8, chinWidth: .32, jawRoundness: 1, eyeScale: .95, eyeAspect: 1.1 },
    simple: { style: 'simple', shape: 'round' },
  }
  const hand = (shape, changes = {}) => Object.fromEntries(Object.entries({ ...tinyfly.HAND_SHAPES[shape], ...changes }).map(([key, value]) => [`hand.right.${key}`, value]))
  const rest = { ...tinyfly.HUMAN_REST, ...Object.fromEntries(['left', 'right'].flatMap(side => Object.entries(tinyfly.HAND_REST).map(([key, value]) => [`hand.${side}.${key}`, value]))) }
  const pairs = { adults: ['youngMan', 'youngWoman'], children: ['childBoy', 'childGirl'], family: ['youngWoman', 'childBoy'] }
  const labels = { youngMan: 'Young man', youngWoman: 'Young woman', childBoy: 'Child boy', childGirl: 'Child girl' }
  const resolvedOutfit = i => {
    const name = pairs[actors.value][i], config = outfits[i]
    if (config.category === 'everyday' || config.category === 'leaves') return { ...tinyfly.SOFT_CARTOON_CAST[name].outfit, ...config.options }
    const feminine = name === 'youngWoman' || name === 'childGirl'
    return tinyfly.outfitPreset(config.category, {
      ...(config.category === 'formal' && feminine ? { top: 'blouse', bottom: 'skirt' } : {}),
      ...config.options,
    })
  }
  const syncOutfitControls = () => {
    const i = selectedOutfits()[0], config = outfits[i], outfit = resolvedOutfit(i)
    clothes.value = config.category
    const disabled = config.category === 'leaves'
    root.querySelector('.oc-outfit-note').textContent = disabled ? 'Leaf garments use their own shape and colours.' : outfitTarget.value === 'both' ? 'Details show the left outfit. Changes apply to both characters; select either character to dress them separately.' : `Editing ${labels[pairs[actors.value][i]]}.`
    Object.values(outfitFields).forEach(node => { node.disabled = disabled })
    outfitFields.top.value = outfit.top ?? 'tshirt'
    outfitFields.bottom.value = outfit.top === 'dress' ? 'skirt' : outfit.bottom ?? 'trousers'
    outfitFields['trouser-style'].value = outfit.trouserStyle ?? 'plain'
    outfitFields.sleeves.value = outfit.sleeves ?? 'short'
    outfitFields['top-color'].value = outfit.shirt ?? '#e2493b'
    outfitFields['bottom-color'].value = outfit.trousers ?? '#24476b'
    outfitFields.collar.checked = outfit.collar ?? outfit.top === 'shirt'
    outfitFields.tie.checked = Boolean(outfit.tie)
    outfitFields['tie-color'].value = outfit.tie ?? '#804453'
    outfitFields.bottom.disabled = disabled || outfit.top === 'dress'
    outfitFields['bottom-color'].disabled = disabled || outfit.top === 'dress'
    outfitFields['trouser-style'].disabled = disabled || outfit.top === 'dress' || outfit.bottom === 'skirt'
    outfitFields['tie-color'].disabled = disabled || !outfit.tie
    outfitTarget.options[1].textContent = `Left: ${labels[pairs[actors.value][0]]}`
    outfitTarget.options[2].textContent = `Right: ${labels[pairs[actors.value][1]]}`
  }
  let cast, sheets, timelines, names
  const rebuild = () => {
    const options = {
      skin: skin.value, lineWidth: Number(outline.value), face: faces[face.value],
      body: { shading: { mode: shade.checked ? 'cel' : 'none' } },
      ...(hair.value !== 'cast' ? { hair: { style: hair.value, color: '#38291f' } } : {}),
    }
    names = pairs[actors.value]
    cast = names.map((name, i) => tinyfly.softCartoonCharacter(name, {
      ...options, height: name.startsWith('child') ? 260 : 340,
      ...(outfits[i].category === 'leaves' ? { outfit: null, leafOutfit: { top: name === 'youngWoman' || name === 'childGirl' } } : { outfit: resolvedOutfit(i) }),
    }))
    sheets = cast.map(who => ({ ...who, height: 155, lineWidth: who.lineWidth * 155 / who.height }))
    timelines = cast.map((who, i) => {
      const id = `actor-${i}`, side = i ? -1 : 1
      const orient = pose => i ? tinyfly.mirrorHumanPose(pose) : pose
      const base = tinyfly.humanPose({ turn: .6, smile: .55 })
      const posed = name => ({ ...tinyfly.HUMAN_POSES[name], turn: .6, smile: .55 })
      const partnerPose = (name, shape) => ({ ...tinyfly.mirrorHumanPose({ ...posed(name), ...hand(shape, { turn: 2 }) }), turn: .6 })
      let keys, lines = [], carried = []
      if (action.value === 'walk') {
        const script = tinyfly.characterScript(id, who, [{ do: 'walk', to: 100 * side, for: 3300 }, { do: 'face', toward: -side, for: 400 }, { do: 'walk', to: 0, for: 3300 }, { do: 'stand', for: 1000 }], { from: 0, facing: side })
        return tinyfly.deserializeTimeline({ id, tracks: [...script.tracks, ...tinyfly.hairFollowTracks(id, script.tracks, who)] })
      }
      if (action.value === 'turn') keys = [{ time: 0, pose: { ...base, turn: 0 } }, { time: 7000, pose: { turn: 4 } }, { time: 8000, pose: { turn: 4 } }]
      else if (action.value === 'gesture') keys = [
        { time: 0, pose: { ...base, turn: .15 } }, { time: 1000, pose: { ...posed('cheer'), turn: .15, ...hand('open', { turn: 2 }) } },
        { time: 2200, pose: { ...posed('point'), turn: .15, ...hand('point', { turn: 2 }) } },
        { time: 3600, pose: { ...posed('think'), turn: .15, ...hand('fist', { turn: 0 }) } },
        { time: 5000, pose: { ...posed('wave'), turn: .15, ...hand('open', { turn: 2, roll: -15 }) } },
        { time: 6500, pose: { ...posed('wave'), turn: .15, ...hand('open', { turn: 0, roll: 15 }) } }, { time: 8000, pose: { ...base, turn: .15, ...hand('relaxed') } },
      ]
      else if (action.value === 'cheek') {
        const j = tinyfly.characterJoints(who, base)
        const cheek = { x: j.head.center.x - j.head.rx * .6, y: j.head.center.y + j.head.ry * .65, depth: j.head.depth + j.head.rx * .6 }
        const touch = { ...tinyfly.reachCharacter(who, base, 'arm.right', cheek), ...hand('flat', { turn: 2 }), smile: .2 }
        keys = [{ time: 0, pose: base }, { time: 1400, pose: touch }, { time: 6000, pose: { ...touch, 'head.tilt': 5 } }, { time: 8000, pose: base }]
      } else if (action.value === 'crossed') {
        const crossed = { ...base, 'arm.left.spread': 32, 'arm.right.spread': 32, 'arm.left.bend': -130, 'arm.right.bend': -130, 'arm.left.elbow': 0, 'arm.right.elbow': 0 }
        keys = [{ time: 0, pose: base }, { time: 1600, pose: crossed }, { time: 6400, pose: crossed }, { time: 8000, pose: base }]
      } else if (action.value === 'sit') {
        const sitting = posed('sit')
        keys = [{ time: 0, pose: sitting }, { time: 1700, pose: { ...sitting, 'arm.right.spread': 65, 'arm.right.bend': 40, 'arm.right.elbow': 0, ...hand('open', { turn: 2 }) } }, { time: 5000, pose: sitting }, { time: 8000, pose: sitting }]
        lines = [{ text: i ? 'And we can tell our own stories.' : 'Every pose comes from the same rig.', start: i ? 4100 : 800, end: i ? 7200 : 3800 }]
      } else {
        const script = tinyfly.characterScript(id, who, [{ do: 'walk', to: side * 65, for: 2000 }, { do: 'stand', for: 6000 }], { from: 0, facing: side })
        carried = script.tracks.filter(track => ['x', 'y', 'walk', 'walking', 'gait'].includes(track.property))
        keys = [{ time: 0, pose: base }, { time: 2100, pose: base }, { time: 2800, pose: partnerPose(i ? 'wave' : 'point', i ? 'open' : 'point') }, { time: 4700, pose: partnerPose(i ? 'point' : 'think', 'open') }, { time: 7000, pose: base }, { time: 8000, pose: base }]
        lines = [{ text: i ? 'Yes! Let us make a story together.' : 'Shall we explore somewhere new?', start: i ? 4700 : 2600, end: i ? 7100 : 4600 }]
      }
      let tracks = tinyfly.characterPoseTracks(id, keys.map(key => ({ ...key, pose: orient(key.pose), easing: 'ease-in-out' })), rest)
      tracks.push(...carried)
      tracks = tinyfly.lipSyncOver(id, tracks, lines)
      tracks.push(...tinyfly.hairFollowTracks(id, tracks, who))
      return tinyfly.deserializeTimeline({ id, tracks })
    })
  }
  const draw = () => {
    const t = play.checked ? clock.time : Number(scrub.value)
    if (play.checked) scrub.value = String(Math.round(t))
    readout.textContent = `${action.options[action.selectedIndex].textContent} · ${(t / 1000).toFixed(1)} s · ${outline.value}px outline · ${shade.checked ? 'cel shading' : 'flat fill'}`
    if (!ctx) return
    ctx.fillStyle = '#fbf6ed'; ctx.fillRect(0, 0, 960, 900)
    ctx.fillStyle = '#eee4d5'; ctx.beginPath(); ctx.roundRect(20, 75, 920, 410, 18); ctx.fill()
    ctx.textAlign = 'center'; ctx.fillStyle = '#503a32'; ctx.font = '600 25px system-ui'; ctx.fillText('Soft cartoon characters', 480, 40)
    ctx.font = '14px system-ui'; ctx.fillText('Editable anatomy · expressive faces · flowing hair · stories from public APIs', 480, 63)
    cast.forEach((who, i) => {
      const values = Object.fromEntries(timelines[i].getStateAtTime(t).values.get(`actor-${i}`) ?? [])
      const pose = tinyfly.characterPoseOf(values)
      const x = (i ? 690 : 270) + (values.x ?? 0)
      ctx.save(); ctx.translate(x, 459)
      if (action.value === 'sit') {
        const hip = tinyfly.characterJoints(who, pose).points.hip
        ctx.fillStyle = '#ad8d6b'; ctx.beginPath(); ctx.roundRect(hip.x - 44, hip.y + 7, 90, 12, 5); ctx.fill(); ctx.fillRect(hip.x - 34, hip.y + 19, 10, -hip.y - 19)
      }
      tinyfly.drawCharacter(ctx, who, pose, t); ctx.restore()
      ctx.fillStyle = '#715e53'; ctx.font = '13px system-ui'; ctx.fillText(labels[names[i]], x, 478)
    })
    if (action.value === 'story' || action.value === 'sit') {
      ctx.font = '15px system-ui'; ctx.fillStyle = '#503a32'
      ctx.fillText(action.value === 'story' ? (t < 2600 ? 'A walk into a new scene…' : t < 4700 ? '“Shall we explore somewhere new?”' : '“Yes! Let us make a story together.”') : (t < 4100 ? '“Every pose comes from the same rig.”' : '“And we can tell our own stories.”'), 480, 510)
    }
    ctx.font = '600 16px system-ui'; ctx.fillText('The same bodies, viewed from six angles', 480, 550)
    sheets.forEach((who, row) => [0, .5, 1, 2, -1, -.5].forEach((turn, column) => {
      const x = 80 + column * 160, y = 732 + row * 160
      ctx.save(); ctx.translate(x, y); tinyfly.drawCharacter(ctx, who, tinyfly.humanPose({ turn, smile: .5 }), t); ctx.restore()
      if (row === 0) { ctx.fillStyle = '#806e63'; ctx.font = '11px system-ui'; ctx.fillText(['Front', '¾ right', 'Right', 'Back', 'Left', '¾ left'][column], x, 749) }
    }))
  }
  const update = () => { syncOutfitControls(); rebuild(); draw() }
  const controls = [[actors, 'change'], [face, 'change'], [hair, 'change'], [action, 'change'], [outline, 'input'], [skin, 'input'], [shade, 'change']]
  controls.forEach(([node, event]) => node.addEventListener(event, update))
  const outfitListeners = []
  const listenOutfit = (node, event, handler) => { node.addEventListener(event, handler); outfitListeners.push([node, event, handler]) }
  listenOutfit(outfitTarget, 'change', syncOutfitControls)
  listenOutfit(clothes, 'change', () => {
    for (const i of selectedOutfits()) outfits[i] = { category: clothes.value, options: {} }
    update()
  })
  const properties = { top: 'top', bottom: 'bottom', 'trouser-style': 'trouserStyle', sleeves: 'sleeves', 'top-color': 'shirt', 'bottom-color': 'trousers', collar: 'collar' }
  for (const [field, property] of Object.entries(properties)) {
    const node = outfitFields[field]
    listenOutfit(node, node.type === 'color' ? 'input' : 'change', () => {
      for (const i of selectedOutfits()) {
        outfits[i].options[property] = node.type === 'checkbox' ? node.checked : node.value
        if (field === 'top') {
          outfits[i].options.collar = node.value === 'shirt'
          if (node.value !== 'shirt') outfits[i].options.tie = null
        }
      }
      update()
    })
  }
  listenOutfit(outfitFields.tie, 'change', () => {
    for (const i of selectedOutfits()) outfits[i].options.tie = outfitFields.tie.checked ? outfitFields['tie-color'].value : null
    update()
  })
  listenOutfit(outfitFields['tie-color'], 'input', () => {
    for (const i of selectedOutfits()) outfits[i].options.tie = outfitFields['tie-color'].value
    update()
  })
  const seek = () => { play.checked = false; draw() }
  scrub.addEventListener('input', seek); play.addEventListener('change', draw)
  syncOutfitControls(); rebuild(); draw(); live.ticker.add(draw)
  // #endregion code
  return () => {
    animation.kill(); live.ticker.remove(draw)
    outfitListeners.forEach(([node, event, handler]) => node.removeEventListener(event, handler))
    controls.forEach(([node, event]) => node.removeEventListener(event, update))
    scrub.removeEventListener('input', seek); play.removeEventListener('change', draw)
  }
}

/** @type {import('./types').LiveDemo} */
export const organicCharacters = {
  id: 'live-organic-characters', name: 'Soft Cartoon Characters',
  description: 'Create original adult and child story characters with filled organic contours, rounded shoulders, shaped limbs, small articulated hands and cel shading. Choose adults, children or an adult and child, then the face, hairstyle and action. Dress either character in everyday, formal, casual or leaf garments; edit tops, bottoms, jeans/cargo details, sleeves, colours, collars and ties; scrub a walk-and-talk story, a full turn, hand gestures, seated speech, a palm at the cheek or crossed arms. Outline width changes the ink while body proportions remain stable. Everything is driven by the public character, pose, script, lip-sync and timeline APIs.',
  category: 'video', alsoIn: ['showcase'], tags: ['character', 'cartoon', 'organic', 'story', 'hands', 'motion'], html, run,
}
