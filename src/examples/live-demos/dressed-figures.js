import {
  POSES,
  pose,
  walkPose,
  blendPose,
  strideLength,
  talkingMouth,
  drawStickFigure,
  stickFigureJoints,
  jointsToScene,
  headPoint,
  seatHeight,
  taperedLine,
} from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = {
  POSES,
  pose,
  walkPose,
  blendPose,
  strideLength,
  talkingMouth,
  drawStickFigure,
  stickFigureJoints,
  jointsToScene,
  headPoint,
  seatHeight,
  taperedLine,
}

export const html = `<style>
  .df-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .df-canvas { width: 232px; height: 116px; border-radius: 8px; background: #fdf0d5; }
  .df-row { display: flex; align-items: center; gap: 10px; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .df-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="df-wrap">
  <canvas class="df-canvas" width="680" height="340"></canvas>
  <div class="df-row">
    <label><input type="checkbox" class="df-costumes" checked /> costumes</label>
    <label><input type="checkbox" class="df-joints" /> joints</label>
    <label><input type="checkbox" class="df-sketch" /> pencil</label>
  </div>
  <div class="df-readout">walk</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.df-canvas')
  const costumes = root.querySelector('.df-costumes')
  const showJoints = root.querySelector('.df-joints')
  const pencil = root.querySelector('.df-sketch')
  const readout = root.querySelector('.df-readout')
  const ctx = canvas.getContext('2d')

  const GROUND = 300
  const HEIGHT = 200
  const LOOP = 9000

  /** 0 before t0, 1 after t1, eased in between. */
  const ramp = (t, t0, t1) => {
    const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
    return u * u * (3 - 2 * u)
  }

  // ── Costumes: plain drawing code at the joints the figure hands each layer ──

  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

  /**
   * A smooth closed outline through the midpoints between `corners`, each
   * corner pulling the curve toward it: soft fabric rather than a polygon.
   */
  const rounded = (corners, samples = 6) => {
    const points = []
    corners.forEach((corner, i) => {
      const from = mid(corners[(i + corners.length - 1) % corners.length], corner)
      const to = mid(corner, corners[(i + 1) % corners.length])
      for (let k = 0; k < samples; k++) {
        const t = k / samples
        const u = 1 - t
        points.push({
          x: u * u * from.x + 2 * u * t * corner.x + t * t * to.x,
          y: u * u * from.y + 2 * u * t * corner.y + t * t * to.y,
        })
      }
    })
    return points
  }

  /** Points along a quadratic curve from `from`, pulled toward `control`, to `to`. */
  const curve = (from, control, to, samples = 12) =>
    Array.from({ length: samples + 1 }, (_, k) => {
      const t = k / samples
      const u = 1 - t
      return {
        x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
        y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
      }
    })

  /** Fill a closed outline and line it, in pencil when the figure is sketched. */
  const shape = (points, color, outline, pen) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    if (pen) pen.curve([...points, points[0]])
    else ctx.stroke()
  }

  /** Fabric along a limb (a sleeve, a trouser leg): tapered, with an outline. */
  const fabric = (points, from, to, color, outline) => {
    ctx.fillStyle = outline
    tinyfly.taperedLine(ctx, points, from + 5, to + 5)
    ctx.fillStyle = color
    tinyfly.taperedLine(ctx, points, from, to)
  }

  /**
   * Which way a side of the figure is on screen. The figure's left is its far
   * side, away from where it faces, so it is on screen-left when facing right.
   */
  const screenSide = (j, side) => (side === 'left' ? -j.facing : j.facing)

  /**
   * A point on the body: `along` the spine from the hip (0) to the neck (1),
   * or below the hip when negative, and `width` (fraction of the height) out
   * to one side, square to the spine, so clothes lean with the body.
   */
  const body = (j, along, side, width) => {
    const dx = j.neck.x - j.hip.x
    const dy = j.neck.y - j.hip.y
    const length = Math.hypot(dx, dy)
    const out = (side === 'centre' ? 0 : screenSide(j, side)) * width * j.height
    return { x: j.hip.x + dx * along - (dy / length) * out, y: j.hip.y + dy * along + (dx / length) * out }
  }

  /** Both sides of a garment, given its right-side profile from the top down: [along, width] pairs. */
  const garment = (j, profile, hem) => {
    const right = profile.map(([along, width]) => body(j, along, 'right', width))
    const left = profile.map(([along, width]) => body(j, along, 'left', width)).reverse()
    return [...right, ...hem, ...left]
  }

  const upperArm = (points) => points.slice(0, Math.ceil(points.length / 2) + 1)
  const arm = (j, side) => (side === 'left' ? j.limbs.leftArm : j.limbs.rightArm)

  /** A soft shadow under the feet: ground contact from the joints. */
  const shadow = (_ctx, j) => {
    ctx.fillStyle = 'rgba(80, 50, 20, 0.18)'
    ctx.beginPath()
    ctx.ellipse((j.toes.left.x + j.toes.right.x) / 2, j.feetY + 2, j.height * 0.2, j.height * 0.03, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  const tumLayers = {
    behind: shadow,
    body: (_ctx, j, _time, pen) => {
      // Trousers that taper from the hip to the ankle.
      fabric(j.limbs.leftLeg, j.height * 0.085, j.height * 0.05, '#1e3a5f', '#3a1010')
      fabric(j.limbs.rightLeg, j.height * 0.085, j.height * 0.05, '#1e3a5f', '#3a1010')
      // A loose shirt: shoulders, a little in at the waist, out again at the hem.
      const shirt = garment(
        j,
        [[0.98, 0.055], [0.8, 0.07], [0.4, 0.06], [-0.12, 0.075]],
        [body(j, -0.17, 'centre', 0)]
      )
      shirt.unshift(body(j, 0.9, 'centre', 0)) // the collar dips at the neck
      shape(rounded(shirt), '#ef4444', '#3a1010', pen)
    },
    sleeve: (_ctx, j, side) =>
      fabric(upperArm(arm(j, side)), j.height * 0.075, j.height * 0.055, '#ef4444', '#3a1010'),
    overHead: (_ctx, j) => {
      // Spiky hair: a zig-zag over the crown, down to just above the brows.
      const h = j.head
      const points = []
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (1.05 + (0.9 * i) / 10)
        const r = i % 2 ? 1.22 : 1.02
        points.push(tinyfly.headPoint(h, Math.cos(a) * r, Math.sin(a) * r))
      }
      points.push(tinyfly.headPoint(h, h.faceX + 0.4, h.browTopY - 0.08))
      points.push(tinyfly.headPoint(h, h.faceX - 0.5, h.browTopY - 0.12))
      shape(points, '#1f1a17', '#1f1a17')
    },
    front: (_ctx, j) => {
      // A brass lota in the right hand, turned with the forearm.
      ctx.save()
      ctx.translate(j.hands.right.x, j.hands.right.y)
      ctx.rotate(j.handAngle.right - Math.PI / 2)
      ctx.fillStyle = '#d4a017'
      ctx.strokeStyle = '#7a5a00'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 15, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(0, 1, 6, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    },
  }

  const didiLayers = {
    behind: shadow,
    body: (_ctx, j, _time, pen) => {
      // A sari: fitted to the waist, then falling in a flare to the ankles.
      const ankle = j.feetY - j.height * 0.04
      const hem = (side, width) => ({ x: j.hip.x + screenSide(j, side) * width * j.height, y: ankle })
      const sari = garment(
        j,
        [[0.98, 0.05], [0.75, 0.065], [0.4, 0.05]],
        [hem('right', 0.15), { x: j.hip.x, y: ankle + j.height * 0.015 }, hem('left', 0.15)]
      )
      shape(rounded(sari), '#16a34a', '#14532d', pen)
      // Pleats falling from the waist.
      ctx.strokeStyle = '#15803d'
      ctx.lineWidth = 2
      for (const spread of [-0.05, 0, 0.05]) {
        const top = body(j, 0.3, 'right', spread * 0.4)
        ctx.beginPath()
        ctx.moveTo(top.x, top.y)
        ctx.quadraticCurveTo(top.x + spread * j.height * 0.5, (top.y + ankle) / 2, j.hip.x + spread * j.height * 1.6, ankle)
        ctx.stroke()
      }
      // The pallu: over the near shoulder and across the chest to the far hip.
      const across = curve(j.shoulders.right, body(j, 0.6, 'centre', 0), body(j, 0.2, 'left', 0.06))
      fabric(across, j.height * 0.045, j.height * 0.07, '#facc15', '#a16207')
    },
    sleeve: (_ctx, j, side) => {
      const points = arm(j, side)
      fabric(points.slice(0, Math.ceil(points.length / 3) + 1), j.height * 0.07, j.height * 0.055, '#16a34a', '#14532d')
    },
    behindHead: (_ctx, j) => {
      // A bun at the back of the head: the side away from the face.
      const back = -Math.sign(j.head.faceX)
      const bun = tinyfly.headPoint(j.head, back * 0.75, -0.65)
      ctx.fillStyle = '#1f1a17'
      ctx.beginPath()
      ctx.arc(bun.x, bun.y, j.head.rx * 0.45, 0, Math.PI * 2)
      ctx.fill()
    },
    overHead: (_ctx, j) => {
      // Hair parted in the middle, swept down to the ears.
      const h = j.head
      const points = []
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI * (0.95 + (1.1 * i) / 12)
        points.push(tinyfly.headPoint(h, Math.cos(a) * 1.06, Math.sin(a) * 1.06))
      }
      points.push(tinyfly.headPoint(h, h.faceX + 0.35, h.browTopY - 0.1))
      points.push(tinyfly.headPoint(h, h.faceX, h.browTopY - 0.22))
      points.push(tinyfly.headPoint(h, h.faceX - 0.35, h.browTopY - 0.1))
      shape(rounded(points, 4), '#1f1a17', '#1f1a17')
    },
  }

  // ── The scene: Tum walks in turned toward where he goes, sits, and Didi asks him something ──

  const charpai = { x: 200, width: 150 }
  const stride = tinyfly.strideLength(HEIGHT)
  const tumStart = 40
  // Stop with the hips over the charpai and room for the knees past its front edge.
  const tumStop = charpai.x + charpai.width - 40

  const tumAt = (t) => {
    const walked = Math.min(1, t / 3000) // walking speed is constant, so the feet stay planted
    const x = tumStart + (tumStop - tumStart) * walked
    const walking = 1 - ramp(t, 2800, 3100)
    const standing = tinyfly.pose({ smile: 0.8, turn: 0.75 - 0.45 * ramp(t, 3000, 3500) })
    let figure = tinyfly.blendPose(standing, tinyfly.walkPose((x - tumStart) / stride, standing), walking)
    // Sit down, then get back up before the loop ends.
    const sit = ramp(t, 3300, 4000) - ramp(t, 7800, 8400)
    figure = tinyfly.blendPose(figure, { ...tinyfly.POSES.sit, smile: 0.8, turn: figure.turn }, sit)
    return { x, figure }
  }

  const didiAt = (t) => {
    const talking = t > 4400 && t < 7000
    const figure = tinyfly.pose({
      turn: 0.4,
      smile: 0.3,
      leftShoulder: 30,
      leftElbow: -100, // a hand on the hip
      rightShoulder: 30 + 40 * ramp(t, 4400, 4700) - 40 * ramp(t, 6800, 7200),
      rightElbow: 50 * ramp(t, 4400, 4700) - 50 * ramp(t, 6800, 7200),
      mouth: talking ? tinyfly.talkingMouth(t) : 0,
      headTilt: -6 * ramp(t, 4400, 4800),
    })
    return { x: 540, figure }
  }

  const style = (layers, facing) => ({
    height: HEIGHT,
    color: '#3a1010',
    headFill: '#f2c49b',
    lineWidth: 5,
    facing,
    rubber: 0.5,
    shoulderWidth: costumes.checked ? 0.07 : 0,
    layers: costumes.checked ? layers : undefined,
    sketch: pencil.checked ? { roughness: 2 } : undefined,
  })

  const drawCharpai = () => {
    const top = GROUND - tinyfly.seatHeight(HEIGHT)
    ctx.fillStyle = '#8b5a2b'
    for (const x of [charpai.x - 6, charpai.x + charpai.width - 4]) ctx.fillRect(x, top, 10, GROUND - top)
    ctx.fillRect(charpai.x - 10, top - 4, charpai.width + 20, 9)
    ctx.strokeStyle = '#e8c48a'
    ctx.lineWidth = 2
    for (let x = charpai.x; x < charpai.x + charpai.width; x += 12) {
      ctx.beginPath()
      ctx.moveTo(x, top - 3)
      ctx.lineTo(x + 8, top + 4)
      ctx.stroke()
    }
  }

  /** Dots on every joint, and the hand's direction: what the layers draw from. */
  const drawJoints = (j) => {
    ctx.fillStyle = '#2563eb'
    const dot = (p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    dot(j.hip)
    dot(j.neck)
    for (const key of ['shoulders', 'elbows', 'hands', 'knees', 'feet']) {
      dot(j[key].left)
      dot(j[key].right)
    }
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(j.head.center.x, j.head.center.y, j.head.rx, j.head.ry, j.head.angle, 0, Math.PI * 2)
    ctx.moveTo(j.hands.right.x, j.hands.right.y)
    ctx.lineTo(j.hands.right.x + Math.cos(j.handAngle.right) * 30, j.hands.right.y + Math.sin(j.handAngle.right) * 30)
    ctx.stroke()
    // The planted feet, from ground contact.
    ctx.fillStyle = '#dc2626'
    for (const side of ['left', 'right']) if (j.grounded[side]) dot(j.feet[side])
  }

  const drawBubble = (text, head) => {
    const tip = tinyfly.headPoint(head, head.faceX * 2.4, head.mouthY - 0.6)
    const box = { x: 390, y: 22, w: 200, h: 46 }
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#3a1010'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(box.x, box.y, box.w, box.h, 14)
    ctx.moveTo(box.x + box.w * 0.6, box.y + box.h)
    ctx.lineTo(tip.x, tip.y)
    ctx.lineTo(box.x + box.w * 0.75, box.y + box.h)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#3a1010'
    ctx.font = '600 20px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, box.x + box.w / 2, box.y + box.h / 2)
  }

  const clock = { time: 0 }
  live.to(clock, { time: LOOP, duration: LOOP / 1000, ease: 'none', repeat: -1 })

  const draw = () => {
    const t = clock.time
    const tum = tumAt(t)
    const didi = didiAt(t)
    readout.textContent = `Tum · turn ${tum.figure.turn.toFixed(2)} · sit ${tum.figure.sit.toFixed(2)}`
    if (!ctx) return

    ctx.fillStyle = '#fdf0d5'
    ctx.fillRect(0, 0, 680, 340)
    ctx.fillStyle = '#d9b27c'
    ctx.fillRect(0, GROUND, 680, 40)
    drawCharpai()

    const figures = [
      { at: tum, style: style(tumLayers, 1) },
      { at: didi, style: style(didiLayers, -1) },
    ]
    for (const { at, style } of figures) {
      ctx.save()
      ctx.translate(at.x, GROUND)
      tinyfly.drawStickFigure(ctx, at.figure, style, t)
      ctx.restore()
    }

    // Immediate drawing that follows the figures: the same joints, in scene space.
    const didiJoints = tinyfly.jointsToScene(tinyfly.stickFigureJoints(didi.figure, figures[1].style), didi.x, GROUND)
    if (t > 4400 && t < 7600) drawBubble('भैया, UPI चलेगा?', didiJoints.head)
    if (showJoints.checked) {
      drawJoints(tinyfly.jointsToScene(tinyfly.stickFigureJoints(tum.figure, figures[0].style), tum.x, GROUND))
      drawJoints(didiJoints)
    }

    // Fade through the loop's seam.
    const fade = Math.max(1 - t / 300, ramp(t, LOOP - 400, LOOP))
    if (fade > 0) {
      ctx.fillStyle = `rgba(253, 240, 213, ${fade})`
      ctx.fillRect(0, 0, 680, 340)
    }
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const dressedFigures = {
  id: 'live-dressed-figures',
  name: 'Dressed Stick Figures',
  description:
    'Costumes, hair and props drawn inside the stick figure with style.layers, from the joints stickFigureJoints() returns. Tum walks in turned toward where he is going, sits on a charpai at seatHeight(), and a speech bubble follows Didi\'s head. Toggle the joints to see what the layers draw from.',
  category: 'video',
  tags: ['canvas', 'character', 'stick figure', 'costume', 'layers', 'joints', 'sit', 'video'],
  html,
  run,
}
