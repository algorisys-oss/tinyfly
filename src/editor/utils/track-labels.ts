import { humanFieldLabel } from '../../characters'
import { isCharacterField } from './character-element'
import { isMapField, mapFieldLabel } from './map-element'

/**
 * How a track's property reads in the timeline: character pose fields and map
 * values in plain language ("Right arm · out / in", "View · zoom", "Delhi ·
 * pin"); everything else as it is.
 */
export function trackPropertyLabel(property: string): string {
  if (isCharacterField(property)) return humanFieldLabel(property)
  if (isMapField(property)) return mapFieldLabel(property)
  return property
}
