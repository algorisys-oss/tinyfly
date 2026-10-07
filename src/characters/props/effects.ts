import { hashSeed } from '../../engine/authoring/random'
import { drawDustPuff } from '../acting/effects'
import type { PropEffect } from './script'

/**
 * The secondary action a prop script asks for, drawn at its time and place:
 * dust kicked up, exhaust puffs, skid marks, honk lines. Effects are plain
 * cues (`PropScriptResult.effects`); this draws them in a simple ink style,
 * or draw your own from the same cues.
 */
export function drawPropEffects(ctx: CanvasRenderingContext2D, effects: PropEffect[], time: number, options: { color?: string; size?: number; leafColor?: string } = {}): void {
  const color = options.color ?? '#555'
  const size = options.size ?? 60
  for (const effect of effects) {
    const progress = (time - effect.time) / effect.length
    if (progress <= 0 || progress >= 1) continue
    const seed = hashSeed(`${effect.kind}:${effect.time}:${effect.x}`)
    if (effect.kind === 'dust') drawDustPuff(ctx, { x: effect.x, y: effect.y }, progress, { size, color, seed })
    else if (effect.kind === 'exhaust') drawExhaust(ctx, effect, progress, size, color, seed)
    else if (effect.kind === 'skid') drawSkid(ctx, effect, progress, time, color)
    else if (effect.kind === 'honk') drawHonk(ctx, effect, progress, size, color)
    else if (effect.kind === 'smoke') drawSmoke(ctx, effect, time, size, color, seed)
    else if (effect.kind === 'leaves') drawLeaves(ctx, effect, progress, size, options.leafColor ?? '#5cae5a', color, seed)
  }
}

/** Puffs leaving a chimney one after another for the effect's length, rising, drifting, growing and fading. */
function drawSmoke(ctx: CanvasRenderingContext2D, effect: PropEffect, time: number, size: number, color: string, seed: number) {
  const direction = effect.direction ?? 1
  const every = 380
  const life = 1500
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, size * 0.025)
  // Puffs are born until the last `life` ms of the effect, so the last one fades out in time.
  for (let born = effect.time; born <= effect.time + effect.length - life; born += every) {
    const own = (time - born) / life
    if (own <= 0 || own >= 1) continue
    const wobble = Math.sin(born / 97 + own * 4) * size * 0.06
    const x = effect.x + direction * own * size * 0.7 + wobble
    const y = effect.y - own * size * 1.6
    ctx.globalAlpha = Math.min(1, own * 6) * (1 - own) * 0.85
    ctx.beginPath()
    ctx.arc(x, y, size * (0.07 + own * 0.2), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
  void seed
}

/** A few leaves drifting down from the canopy, swinging side to side and turning, landing on the ground. */
function drawLeaves(ctx: CanvasRenderingContext2D, effect: PropEffect, progress: number, size: number, leafColor: string, ink: string, seed: number) {
  const direction = effect.direction ?? 1
  const groundY = effect.toY ?? effect.y + size * 3
  ctx.save()
  ctx.lineWidth = Math.max(1, size * 0.02)
  ctx.strokeStyle = ink
  ctx.fillStyle = leafColor
  for (let i = 0; i < 4; i++) {
    const r = (hashSeed(`${seed}:${i}`) % 1000) / 1000
    const own = Math.min(1, progress * (1.1 + r * 0.4))
    const startX = effect.x + (r - 0.5) * size * 1.2
    const startY = effect.y + (r - 0.3) * size * 0.4
    const fall = own * own * 0.4 + own * 0.6
    const x = startX + direction * own * size * (0.6 + r) + Math.sin(own * 9 + r * 6) * size * 0.18
    const y = Math.min(groundY - 2, startY + (groundY - startY) * fall)
    ctx.globalAlpha = progress > 0.85 ? (1 - progress) / 0.15 : 1
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.sin(own * 7 + r * 5) * 1.2)
    ctx.beginPath()
    ctx.ellipse(0, 0, size * 0.07, size * 0.035, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

/** Puffs that leave the tailpipe one after another, drifting back and up, growing and fading. */
function drawExhaust(ctx: CanvasRenderingContext2D, effect: PropEffect, progress: number, size: number, color: string, seed: number) {
  const direction = effect.direction ?? -1
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, size * 0.025)
  for (let i = 0; i < 3; i++) {
    const own = progress * 1.6 - i * 0.25
    if (own <= 0 || own >= 1) continue
    const wobble = ((hashSeed(`${seed}:${i}`) % 100) / 100 - 0.5) * size * 0.1
    const x = effect.x + direction * own * size * 0.9
    const y = effect.y - own * size * 0.45 + wobble
    ctx.globalAlpha = (1 - own) * 0.9
    ctx.beginPath()
    ctx.arc(x, y, size * (0.06 + own * 0.14), 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

/** Two dark marks laid along the ground from where the wheels locked to where it stopped, fading late. */
function drawSkid(ctx: CanvasRenderingContext2D, effect: PropEffect, progress: number, time: number, color: string) {
  const to = effect.toX ?? effect.x
  // The marks are laid as it slides (the first third of the effect), then they fade.
  const laid = Math.min(1, ((time - effect.time) / effect.length) * 3)
  const end = effect.x + (to - effect.x) * laid
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.globalAlpha = progress < 0.6 ? 0.8 : 0.8 * (1 - (progress - 0.6) / 0.4)
  ctx.lineWidth = 3
  for (const offset of [-2, 4]) {
    ctx.beginPath()
    ctx.moveTo(effect.x, effect.y + offset)
    ctx.lineTo(end, effect.y + offset)
    ctx.stroke()
  }
  ctx.restore()
}

/** Three short arcs bursting from the front. */
function drawHonk(ctx: CanvasRenderingContext2D, effect: PropEffect, progress: number, size: number, color: string) {
  const direction = effect.direction ?? 1
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1.5, size * 0.04)
  ctx.lineCap = 'round'
  ctx.globalAlpha = progress < 0.7 ? 1 : (1 - progress) / 0.3
  const reach = size * (0.15 + 0.5 * (1 - (1 - progress) ** 2))
  for (let i = -1; i <= 1; i++) {
    const angle = (i * Math.PI) / 7
    const cx = effect.x + direction * Math.cos(angle) * reach
    const cy = effect.y + Math.sin(angle) * reach
    ctx.beginPath()
    ctx.arc(cx, cy, size * 0.12, direction > 0 ? -Math.PI / 3 : (Math.PI * 2) / 3, direction > 0 ? Math.PI / 3 : (Math.PI * 4) / 3)
    ctx.stroke()
  }
  ctx.restore()
}
