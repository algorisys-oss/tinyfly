import type { CustomTarget } from '../../adapters/canvas/canvas-adapter'
import type { PropertyInfo } from '../../adapters/canvas/target-properties'
import type { FrameInfo } from '../../headless/video-scene'
import type { ActingRig } from '../acting/acting'
import { PROP_COMMON_CONTROLS, propView, solveProp, controlValue, type PropRig, type SolvedProp } from './rig'
import { drawSolvedProp, type PropDrawOptions } from './draw'
import type { PropAction } from './script'

/**
 * A prop: what it is, its rig, what it can do and how it acts. Families
 * (`vehicle()`, …) make them; presets (`car()`) are families with settings.
 */
export interface Prop {
  /** What it is: car, tree, helicopter */
  kind: string
  /** The family it comes from: vehicle, plant, building, aircraft */
  family: string
  summary: string
  rig: PropRig
  /** What its beats can do (see `propScript`) */
  actions: Record<string, PropAction>
  /** How its controls act: which lead, which follow, which wind up and overshoot (see `actKeyframes`) */
  acting: ActingRig
  /** Its colours, for effects drawn with it */
  colors?: { body?: string; ink?: string }
  /**
   * Follow-through: controls that trail another on a spring (an antenna
   * behind the car's motion). The control is how far the follower lags,
   * along the way the prop faces, × `per`, capped at ± `limit`.
   */
  follow?: PropFollow[]
  /** A wheeled prop's reference wheel radius, metres: `wheelSpin` is that wheel's turn (see `propTow`) */
  wheelRadius?: number
  /**
   * How it gets about, for beats in world metres (`propScript3D`): each way
   * of moving with its speed and the controls keyed as it goes, so wheels
   * roll and feet step exactly the distance covered.
   */
  moves?: Record<string, PropMove>
}

/** One way a prop moves over the ground (or through the air), as plain data. */
export interface PropMove {
  /** Its usual speed, metres per second */
  speed: number
  /** Controls set as it sets off (a gait's number) */
  set?: Record<string, number>
  /** Controls eased in as it sets off and out as it stops (`walking: 1`, `flapping: 1`) */
  hold?: Record<string, number>
  /** Controls advanced in step with the distance, per metre (`wheelSpin` in degrees, a stride's phase in cycles) */
  perMetre?: Record<string, number>
  /** Controls advanced with time, per second (a wingbeat, a rotor) */
  perSecond?: Record<string, number>
  /** It flies: a beat's `height` (metres) is how high, as its `lift` */
  flies?: boolean
}

export interface PropFollow {
  /** The control it drives */
  control: string
  /** What it follows: a directly keyed control, usually `x` */
  of: string
  /** Control units per px of lag */
  per: number
  stiffness?: number
  damping?: number
  /** The most it bends either way */
  limit?: number
}

export interface PropTargetOptions {
  /** Where its middle stands on the ground, scene px */
  x: number
  y: number
  prop: Prop
  /** px per metre (default 60, which makes a 1.7 m figure about 100 px tall) */
  scale?: number
  /** Starting control values (default each control's default) */
  values?: Record<string, number>
  look?: PropDrawOptions['look']
  ink?: string
  lineWidth?: number
  pencil?: PropDrawOptions['pencil']
  seed?: number
  /** `solid` (default) or `stick`: line art to go with stick figures */
  style?: PropDrawOptions['style']
  /** The paper colour a stick prop is filled with */
  paper?: string
}

/** A `custom` target made by {@link propTarget}. */
export interface PropTarget extends CustomTarget {
  readonly prop: Prop
  /** px per metre */
  readonly propScale: number
  readonly propDraw: Omit<PropDrawOptions, 'time' | 'rider'>
}

/** Every control a prop has, described: the common ones and its own. */
export function propControls(prop: Prop): Record<string, PropertyInfo & { default?: number }> {
  const out: Record<string, PropertyInfo & { default?: number }> = {}
  for (const [name, spec] of Object.entries({ ...PROP_COMMON_CONTROLS, ...prop.rig.controls })) {
    const { bind: _bind, ...info } = spec
    out[name] = info
  }
  return out
}

/**
 * A `custom` canvas target that draws a prop, its middle standing at x, y.
 * Its props are the prop's controls, so tracks turn it, squash it, spin its
 * wheels; `describeTarget` lists them with what the prop can do.
 */
export function propTarget(options: PropTargetOptions): PropTarget {
  const { prop } = options
  const scale = options.scale ?? 60
  const width = prop.rig.length * scale * 1.4
  const height = prop.rig.height * scale * 1.6
  const controls = propControls(prop)
  const props: Record<string, number> = {}
  for (const [name, info] of Object.entries(controls)) props[name] = options.values?.[name] ?? info.default ?? 0
  const draw: PropTarget['propDraw'] = { look: options.look, ink: options.ink, lineWidth: options.lineWidth, pencil: options.pencil, seed: options.seed, style: options.style, paper: options.paper }
  return {
    type: 'custom',
    x: options.x - width / 2,
    y: options.y - height,
    width,
    height,
    props,
    prop,
    propScale: scale,
    propDraw: draw,
    about: {
      kind: prop.kind,
      summary: prop.summary,
      props: controls,
      actions: Object.fromEntries(Object.entries(prop.actions).map(([name, action]) => [name, action.summary])),
    },
    draw(ctx, self, time) {
      const values = (self.props ?? {}) as Record<string, number>
      ctx.translate(width / 2, height)
      drawSolvedProp(ctx, solveAt(prop, values, scale), { ...draw, time })
    },
  }
}

/** The prop solved for control values, in its own space (its middle on the ground at 0, 0). */
export function solveAt(prop: Prop, values: Record<string, number>, scale: number): SolvedProp {
  const view = propView(controlValue(prop.rig, values, 'turn'), controlValue(prop.rig, values, 'tilt'), scale)
  return solveProp(prop.rig, values, view, scale)
}

export interface PropFrame {
  /** Its control values in this frame */
  values: Record<string, number>
  /** Where its middle stands, scene px */
  origin: { x: number; y: number }
  solved: SolvedProp
  /** An anchor in scene px, with its depth (nearer is larger) */
  anchor(name: string): { x: number; y: number; depth: number }
}

/** A prop target in a frame: its values from the timeline's state, where it stands, and its anchors in scene px. */
export function propAt(target: PropTarget, frame: Pick<FrameInfo, 'time' | 'state'>, id: string): PropFrame {
  const values = { ...(target.props as Record<string, number>) }
  let dx = 0
  let dy = 0
  for (const [property, value] of frame.state?.values.get(id) ?? []) {
    if (typeof value !== 'number') continue
    if (property === 'x') dx = value
    else if (property === 'y') dy = value
    else if (property in values) values[property] = value
  }
  const origin = { x: target.x + target.width / 2 + dx, y: target.y + target.height + dy }
  const solved = solveAt(target.prop, values, target.propScale)
  return {
    values,
    origin,
    solved,
    anchor(name) {
      const anchor = solved.anchors[name]
      if (!anchor) throw new Error(`${target.prop.kind}: no anchor "${name}" (it has ${Object.keys(solved.anchors).join(', ') || 'none'})`)
      return { x: origin.x + anchor.point.x, y: origin.y + anchor.point.y, depth: anchor.depth }
    },
  }
}

/** Draw a prop target as it is in a frame, for immediate-mode drawing; `rider` draws a figure seated in it. */
export function drawProp(
  ctx: CanvasRenderingContext2D,
  target: PropTarget,
  frame: Pick<FrameInfo, 'time' | 'state'>,
  id: string,
  options: { rider?: (ctx: CanvasRenderingContext2D) => void } = {}
): PropFrame {
  const at = propAt(target, frame, id)
  ctx.save()
  ctx.translate(at.origin.x, at.origin.y)
  drawSolvedProp(ctx, at.solved, {
    ...target.propDraw,
    time: frame.time,
    // The rider is drawn in scene px.
    rider: options.rider
      ? (c) => {
          c.save()
          c.translate(-at.origin.x, -at.origin.y)
          options.rider!(c)
          c.restore()
        }
      : undefined,
  })
  ctx.restore()
  return at
}
