/**
 * The maths add-on for pages with no build step (`tinyfly-math.iife.js`).
 * It adds the maths functions to the `tinyfly` global, with the lesson
 * builder and the embed player they need, so a lesson page loads only this:
 *
 *     <script src="…/tinyfly-math.iife.js" data-tinyfly-auto></script>
 *
 * With `data-tinyfly-auto`, every `[data-tinyfly-math]` figure mounts when the
 * page is ready. Otherwise call `tinyfly.mountAllMath()`.
 */
import { autoMountMathFromCurrentScript } from './embed/auto-mount-math'

export * from './index'
export { lesson } from '../teach/lesson'
export type { LessonBuilder, StepOptions } from '../teach/lesson'

autoMountMathFromCurrentScript()
