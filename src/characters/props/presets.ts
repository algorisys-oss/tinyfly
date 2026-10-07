import { unknownName } from '../../engine/authoring/did-you-mean'
import type { Prop } from './target'
import { car, truck, bus, tractor, cart, trainCar, bike, motorbike } from './families/vehicle'
import { tree, house } from './families/environment'
import { helicopter, airplane } from './families/aircraft'
import { horse, dog, cat, cow } from './families/animals'
import { songbird, crow, chicken } from './families/birds'

/**
 * Every prop preset by name, so a prop can be named in plain data (a 3D
 * scene's `{ kind: 'prop', prop: 'car' }`, the catalog).
 */
export const PROP_PRESETS = { car, truck, bus, tractor, cart, trainCar, bike, motorbike, tree, house, helicopter, airplane, horse, dog, cat, cow, songbird, crow, chicken }

export type PropPresetName = keyof typeof PROP_PRESETS

/** A preset by name, with its options (colours, sizes); throws on a name it does not know, with the one probably meant. */
export function propPreset(name: string, options: Record<string, unknown> = {}): Prop {
  const make = (PROP_PRESETS as Record<string, (options?: Record<string, unknown>) => Prop>)[name]
  if (!make) throw new Error(unknownName('prop preset', name, Object.keys(PROP_PRESETS)))
  return make(options)
}
