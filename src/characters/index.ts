/**
 * `@algorisys/tinyfly/characters`: drawable, poseable characters for canvas
 * scenes (browser or headless video). The pencil pen and path helpers live
 * with the canvas adapter (its shapes can be sketched too) and are re-exported
 * here.
 */
export * from './stick-figure'
export * from '../adapters/canvas/sketch'
export * from './erase'
export * from '../adapters/canvas/polyline'
export * from './hand'
