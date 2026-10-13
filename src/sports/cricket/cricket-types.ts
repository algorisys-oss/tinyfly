import type { TimelineDefinition } from '../../engine/types'
import type { Vec3 } from '../../engine/math'
import type { CharacterObject3D, Scene3D } from '../../scene-3d/scene-types'
import type { CharacterOptions } from '../../characters/character'
import type { SoftCartoonName } from '../../characters/soft-cartoon-cast'

export type CricketFormat = 'test' | 'odi' | 't20'
export type CricketRole = 'batter' | 'bowler' | 'keeper' | 'fielder' | 'umpire'
export type CricketCast = 'adults' | 'men' | 'children' | 'mixed'
export type CricketMarkingProfile = 'mcc' | 'icc-men' | 'icc-women'

/** Ground-plane capsule: outward semicircles at the two middle stumps. */
export interface CricketFieldingArea {
  radius: number
  centres: [Vec3, Vec3]
}

export interface CricketFieldingPosition {
  id: string
  name: string
  position: Vec3
  /** Reference point classification; null when no restriction area is defined. */
  inside: boolean | null
}
export type CricketAction = 'bowling' | 'spin' | 'batting' | 'defend' | 'running' | 'four' | 'six' | 'catch' | 'fielding' | 'throw' | 'bowled' | 'lbw' | 'stumping' | 'run-out' | 'no-ball' | 'wide'

export interface CricketFormatInfo {
  name: string
  inningsPerSide: number
  oversPerInnings: number | null
  ballsPerOver: number
  freeHitAfterNoBall: boolean
  summary: string
}

/** Basic international format facts, not a full set of competition playing conditions. */
export const CRICKET_FORMATS: Readonly<Record<CricketFormat, Readonly<CricketFormatInfo>>> = Object.freeze({
  test: Object.freeze({ name: 'Test', inningsPerSide: 2, oversPerInnings: null, ballsPerOver: 6, freeHitAfterNoBall: false, summary: 'Multi-day cricket. Each side can have two innings; there is no innings over limit.' }),
  odi: Object.freeze({ name: 'ODI', inningsPerSide: 1, oversPerInnings: 50, ballsPerOver: 6, freeHitAfterNoBall: true, summary: 'One innings per side, up to 50 overs. A no-ball gives a free hit on the next legitimate delivery.' }),
  t20: Object.freeze({ name: 'T20', inningsPerSide: 1, oversPerInnings: 20, ballsPerOver: 6, freeHitAfterNoBall: true, summary: 'One innings per side, up to 20 overs. A no-ball gives a free hit on the next legitimate delivery.' }),
})

export const CRICKET_CASTS: Readonly<Record<CricketCast, string>> = Object.freeze({ adults: 'Adults', men: 'Men', children: 'Children', mixed: 'Mixed cast' })

export const CRICKET_FIELDING_POSITIONS = Object.freeze({
  bowler: 'Bowler', keeper: 'Wicketkeeper', fielder: 'Extra cover', slip: 'Slip',
  point: 'Point', cover: 'Cover', 'mid-off': 'Mid-off', 'mid-on': 'Mid-on',
  'square-leg': 'Square leg', 'fine-leg': 'Fine leg', 'third-man': 'Third man',
})

export interface CricketPlayerOptions {
  id: string
  role: CricketRole
  preset?: SoftCartoonName
  format?: CricketFormat
  height?: number
  position?: Vec3
  color?: string
  /** Optional headwear; bare heads keep expressive faces clear in tutorial close-ups. */
  headwear?: 'none' | 'cap' | 'sun-hat'
  /** JSON appearance settings; canvas hooks and custom rig callbacks are deliberately excluded. */
  appearance?: Pick<CharacterOptions, 'skin' | 'ink' | 'hair' | 'face' | 'body' | 'headSize' | 'shoulderWidth' | 'hipWidth' | 'armLength' | 'legLength' | 'handSize'>
}

export interface CricketFieldOptions {
  id?: string
  format?: CricketFormat
  cast?: CricketCast
  /** Marking dimensions only; default ICC men. Independent of character cast. */
  markingProfile?: CricketMarkingProfile
  /** Circular illustrative boundary in metres, default 64; venues choose their own boundaries. */
  boundaryRadius?: number
  battingColor?: string
  fieldingColor?: string
}

export interface CricketField {
  scene: Scene3D
  format: CricketFormat
  boundaryRadius: number
  landmarks: Record<string, Vec3>
  /** Present on newly built fields; optional for pre-profile/custom JSON fields. */
  markingProfile?: CricketMarkingProfile
  fieldingArea?: CricketFieldingArea | null
}

export interface CricketEvent {
  id: string
  time: number
  kind: 'setup' | 'release' | 'bounce' | 'contact' | 'collect' | 'throw' | 'wicket' | 'boundary' | 'signal' | 'result'
  label: string
  caption: string
}

export type CricketDismissal = 'caught' | 'bowled' | 'lbw' | 'stumped' | 'run-out'

export interface CricketResult {
  runs: number
  extras: number
  wickets: number
  legalBall: boolean
  freeHitNext: boolean
  dismissal?: CricketDismissal
}

export interface CricketActionOptions {
  action?: CricketAction
  /** Complete clip length, default 6000 ms, 4000..60000. */
  duration?: number
  every?: number
}

export interface CricketActionResult {
  action: CricketAction
  duration: number
  timeline: TimelineDefinition
  events: CricketEvent[]
  /** Authored example outcome; no automatic scoring or umpiring is inferred from geometry. */
  result: CricketResult
}

export interface CricketClip extends CricketField, CricketActionResult {}
export type CricketPlayer = CharacterObject3D

export const CRICKET_ACTIONS: Readonly<Record<CricketAction, Readonly<{ name: string; summary: string }>>> = Object.freeze(Object.fromEntries(Object.entries({
  bowling: { name: 'Pace bowling', summary: 'Run up, deliver with a straight arm, bounce and follow through.' },
  spin: { name: 'Spin bowling', summary: 'A shorter approach and a curved illustrative flight before the bounce.' },
  batting: { name: 'Drive', summary: 'Two hands on the bat, a backlift, contact and a follow-through.' },
  defend: { name: 'Defensive block', summary: 'Meet the ball with a controlled bat and keep it close.' },
  running: { name: 'Running between wickets', summary: 'Both batters make the opposite ground to complete one run.' },
  four: { name: 'Boundary four', summary: 'A struck ball reaches the boundary after touching the ground.' },
  six: { name: 'Boundary six', summary: 'A struck ball clears the boundary before touching the ground.' },
  catch: { name: 'Catch', summary: 'A fielder controls the struck ball before it touches the ground.' },
  fielding: { name: 'Ground field', summary: 'A fielder moves to the ball, bends and gathers it.' },
  throw: { name: 'Field and throw', summary: 'Gather, wind up, release and return the ball to the keeper.' },
  bowled: { name: 'Bowled', summary: 'A legal delivery hits the wicket and removes a bail.' },
  lbw: { name: 'LBW illustration', summary: 'Pad contact and a projected path to the stumps illustrate an authored LBW decision.' },
  stumping: { name: 'Stumping', summary: 'The keeper holds the ball and breaks the wicket while the striker is out of ground, not attempting a run.' },
  'run-out': { name: 'Run-out', summary: 'A direct throw breaks the wicket before the running batter makes that ground.' },
  'no-ball': { name: 'Front-foot no-ball', summary: 'The landing front foot oversteps the popping crease at release; one extra, no legal ball.' },
  wide: { name: 'Wide ball', summary: 'An untouched delivery passes beyond reach for a normal stroke; one extra, no legal ball.' },
}).map(([key, value]) => [key, Object.freeze(value)]))) as Readonly<Record<CricketAction, Readonly<{ name: string; summary: string }>>>

export function cricketChoice<T extends string>(choices: Readonly<Record<T, unknown>>, value: T, name: string): T {
  if (!Object.prototype.hasOwnProperty.call(choices, value)) throw new Error(`${name}: unknown choice '${value}'`)
  return value
}

/** Components supported by the deterministic stock motion compiler. */
export type CricketShot = 'miss' | 'drive' | 'defend'
export type CricketFinish = 'none' | 'single' | 'four' | 'six' | 'stumps' | 'pad'
export type CricketFielding = 'none' | 'keeper' | 'catch' | 'gather' | 'throw' | 'stumping' | 'run-out'
export interface CricketDelivery {
  style: 'pace' | 'spin'
  /** Authored legality; no-ball uses the stock front-foot overstep motion. */
  legality: 'legal' | 'no-ball' | 'wide'
}
export interface CricketPlayOptions {
  delivery?: Partial<CricketDelivery>
  shot?: CricketShot
  finish?: CricketFinish
  /** Defaults to keeper for a miss, gather for a drive, none for a block/boundary/stumps/pad. */
  fielding?: CricketFielding
  context?: { freeHit?: boolean }
  /** Explicit authored candidate; omitted/null means no dismissal. Geometry does not adjudicate. */
  decision?: { dismissal?: CricketDismissal | null }
  duration?: number
  every?: number
}
export interface CricketPlay {
  delivery: CricketDelivery
  shot: CricketShot
  finish: CricketFinish
  fielding: CricketFielding
  context: { freeHit: boolean }
  decision: { dismissal: CricketDismissal | null }
}
export interface CricketRuling {
  dismissal: CricketDismissal | null
  reason: 'no-dismissal' | 'dismissal' | 'no-ball' | 'free-hit' | 'wide'
}
export interface CricketPlayResult extends CricketActionResult {
  /** Normalized, owned JSON input; action names the compiled stock motion recipe. */
  play: CricketPlay
  ruling: CricketRuling
}
export interface CricketPlayClip extends CricketField, CricketPlayResult {}
