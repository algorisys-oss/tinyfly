import { compileCricketMotion } from './cricket-action'
import { cricketField } from './cricket-field'
import { CRICKET_FORMATS, cricketChoice, type CricketAction, type CricketField, type CricketFieldOptions, type CricketPlay, type CricketPlayOptions, type CricketPlayResult, type CricketPlayClip, type CricketResult, type CricketRuling, type CricketDismissal } from './cricket-types'

export const CRICKET_PLAY_COMPONENTS = Object.freeze({
  deliveryStyles: Object.freeze(['pace', 'spin'] as const),
  deliveryLegalities: Object.freeze(['legal', 'no-ball', 'wide'] as const),
  shots: Object.freeze(['miss', 'drive', 'defend'] as const),
  finishes: Object.freeze(['none', 'single', 'four', 'six', 'stumps', 'pad'] as const),
  fielding: Object.freeze(['none', 'keeper', 'catch', 'gather', 'throw', 'stumping', 'run-out'] as const),
  dismissals: Object.freeze(['caught', 'bowled', 'lbw', 'stumped', 'run-out'] as const),
})

function choice<T extends string>(values: readonly T[], value: T, name: string): T {
  if (!values.includes(value)) throw new Error(`cricketPlay.${name}: unknown choice '${value}'`)
  return value
}

/** Resolve supported component combinations to proven native-contact motion recipes. */
function motionRecipe(play: CricketPlay): CricketAction {
  const { shot, finish, fielding } = play
  if (play.delivery.legality === 'wide') {
    if (shot !== 'miss' || finish !== 'none' || fielding !== 'keeper') throw new Error('cricketPlay: Wide currently supports only an untouched delivery gathered by the keeper')
    return 'wide'
  }
  if (shot === 'miss') {
    if (fielding === 'none' && finish === 'stumps') return 'bowled'
    if (fielding === 'none' && finish === 'pad') return 'lbw'
    if (finish === 'none' && fielding === 'stumping') return 'stumping'
    if (finish === 'none' && fielding === 'keeper') return play.delivery.style === 'spin' ? 'spin' : 'bowling'
  }
  if (shot === 'defend' && finish === 'none' && fielding === 'none') return 'defend'
  if (shot === 'drive') {
    if (fielding === 'none' && (finish === 'four' || finish === 'six')) return finish
    if (fielding === 'gather' && finish === 'single') return 'running'
    if (finish === 'none') {
      if (fielding === 'catch') return 'catch'
      if (fielding === 'gather') return 'fielding'
      if (fielding === 'throw') return 'throw'
      if (fielding === 'run-out') return 'run-out'
    }
  }
  throw new Error(`cricketPlay: unsupported motion combination (${shot}, ${finish}, ${fielding})`)
}

function normalize(options: CricketPlayOptions): CricketPlay {
  const shot = choice(CRICKET_PLAY_COMPONENTS.shots, options.shot ?? 'miss', 'shot')
  const finish = choice(CRICKET_PLAY_COMPONENTS.finishes, options.finish ?? 'none', 'finish')
  let defaultFielding: CricketPlay['fielding'] = shot === 'miss' ? 'keeper' : 'gather'
  if (shot === 'defend' || finish !== 'none') defaultFielding = finish === 'single' ? 'gather' : 'none'
  const fielding = choice(CRICKET_PLAY_COMPONENTS.fielding, options.fielding ?? defaultFielding, 'fielding')
  const freeHit = options.context?.freeHit ?? false
  if (typeof freeHit !== 'boolean') throw new Error('cricketPlay.context.freeHit must be boolean')
  const dismissal = options.decision?.dismissal ?? null
  if (dismissal !== null) choice(CRICKET_PLAY_COMPONENTS.dismissals, dismissal, 'decision.dismissal')
  return {
    delivery: {
      style: choice(CRICKET_PLAY_COMPONENTS.deliveryStyles, options.delivery?.style ?? 'pace', 'delivery.style'),
      legality: choice(CRICKET_PLAY_COMPONENTS.deliveryLegalities, options.delivery?.legality ?? 'legal', 'delivery.legality'),
    }, shot, finish, fielding, context: { freeHit }, decision: { dismissal },
  }
}

function resolveDecision(play: CricketPlay, action: CricketAction): CricketRuling {
  const candidate = play.decision.dismissal
  if (!candidate) return { dismissal: null, reason: 'no-dismissal' }
  const physical: Partial<Record<CricketAction, CricketDismissal>> = { catch: 'caught', bowled: 'bowled', lbw: 'lbw', stumping: 'stumped', 'run-out': 'run-out' }
  if (physical[action] !== candidate) throw new Error(`cricketPlay: '${candidate}' decision does not match '${action}' motion`)
  // Supported dismissal subset only: run-out remains possible on a no-ball/free hit.
  if (candidate !== 'run-out') {
    if (play.context.freeHit) return { dismissal: null, reason: 'free-hit' }
    if (play.delivery.legality === 'no-ball') return { dismissal: null, reason: 'no-ball' }
    if (play.delivery.legality === 'wide' && candidate !== 'stumped') return { dismissal: null, reason: 'wide' }
  }
  return { dismissal: candidate, reason: 'dismissal' }
}

/** Compose motion, authored legality, current context and candidate decision as owned JSON.
 * No innings ledger or geometric adjudication. Unsupported physical combinations throw.
 */
export function cricketPlay(field: CricketField, options: CricketPlayOptions = {}): CricketPlayResult {
  const format = cricketChoice(CRICKET_FORMATS, field.format, 'cricketPlay.format')
  const play = normalize(options)
  if (play.context.freeHit && !CRICKET_FORMATS[format].freeHitAfterNoBall) throw new Error('cricketPlay: Test format does not support free-hit context')
  const action = motionRecipe(play)
  const ruling = resolveDecision(play, action)
  const legalBall = play.delivery.legality === 'legal'
  const result: CricketResult = {
    runs: play.finish === 'single' ? 1 : play.finish === 'four' ? 4 : play.finish === 'six' ? 6 : 0,
    extras: legalBall ? 0 : 1,
    wickets: ruling.dismissal ? 1 : 0,
    legalBall,
    freeHitNext: CRICKET_FORMATS[format].freeHitAfterNoBall && (play.delivery.legality === 'no-ball' || play.context.freeHit && !legalBall),
    ...(ruling.dismissal ? { dismissal: ruling.dismissal } : {}),
  }
  const motion = compileCricketMotion(field, { action, duration: options.duration, every: options.every }, { delivery: play.delivery, result, ruling, freeHit: play.context.freeHit })
  return { ...motion, play, ruling }
}

/** Build a field and a composed play in one call. */
export function cricketPlayClip(options: CricketFieldOptions & CricketPlayOptions = {}): CricketPlayClip {
  const field = cricketField(options)
  return { ...field, ...cricketPlay(field, options) }
}

export type CricketPlayExample = 'no-ball-stumps' | 'free-hit-catch' | 'no-ball-four' | 'free-hit-run-out' | 'free-hit-wide'
/** Ready-to-compose educational examples. Test supports the two no-ball examples only. */
export const CRICKET_PLAY_EXAMPLES: Readonly<Record<CricketPlayExample, Readonly<{ name: string; options: CricketPlayOptions }>>> = Object.freeze({
  'no-ball-stumps': Object.freeze({ name: 'No-ball + stumps hit', options: Object.freeze({ delivery: Object.freeze({ legality: 'no-ball' }), finish: 'stumps', decision: Object.freeze({ dismissal: 'bowled' }) }) }),
  'free-hit-catch': Object.freeze({ name: 'Free hit + catch', options: Object.freeze({ context: Object.freeze({ freeHit: true }), shot: 'drive', fielding: 'catch', decision: Object.freeze({ dismissal: 'caught' }) }) }),
  'no-ball-four': Object.freeze({ name: 'No-ball + four', options: Object.freeze({ delivery: Object.freeze({ legality: 'no-ball' }), shot: 'drive', finish: 'four' }) }),
  'free-hit-run-out': Object.freeze({ name: 'Free hit + run-out', options: Object.freeze({ context: Object.freeze({ freeHit: true }), shot: 'drive', fielding: 'run-out', decision: Object.freeze({ dismissal: 'run-out' }) }) }),
  'free-hit-wide': Object.freeze({ name: 'Free hit + Wide', options: Object.freeze({ context: Object.freeze({ freeHit: true }), delivery: Object.freeze({ legality: 'wide' }) }) }),
})
