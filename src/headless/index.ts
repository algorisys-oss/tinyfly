/**
 * `@algorisys/tinyfly/headless`: render animations to video and stills
 * outside the browser (Node + `@napi-rs/canvas` + ffmpeg).
 */
export * from './video-scene'
export * from './frame-renderer'
export * from './ffmpeg-args'
export * from './scene-captions'
export * from './node-video'
export * from './narration-audio'
export * from './node-audio'
// Caption writers, so a render script can write .srt/.vtt next to its video.
export { toSRT, toWebVTT, captionCuesFromTimeline, type CaptionCue } from '../engine/export/captions'
