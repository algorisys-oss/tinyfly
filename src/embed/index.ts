/**
 * @algorisys/tinyfly/embed — teaching embeds: the player, step controls and declarative
 * auto-mounting in one bundle, plus build-time `validateEmbed` and `renderFrame`.
 *
 *     <script src="…/tinyfly-embed.iife.js" data-tinyfly-auto></script>
 *
 * With `data-tinyfly-auto`, every `[data-tinyfly-embed]` figure mounts when the
 * page is ready. Otherwise call `tinyfly.mountAll()`.
 */

import { autoMountFromCurrentScript } from './auto-mount'

export { TinyflyPlayer, play, create } from '../player/player'
export type { PlayerOptions } from '../player/player'
export { createControls, DEFAULT_LABELS } from './controls'
export type { Controls, ControlsOptions, ControlLabels } from './controls'
export { mount, mountAll, unmount } from './mount'
export type { MountedEmbed, MountOptions } from './mount'
export { validateEmbed, renderFrame, targetNamesIn } from './tools'
export type { EmbedProblem, FrameAt } from './tools'

// Auto-mount when loaded with data-tinyfly-auto.
autoMountFromCurrentScript()
