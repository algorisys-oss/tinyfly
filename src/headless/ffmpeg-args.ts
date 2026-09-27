/**
 * The ffmpeg command line for encoding raw frames into an MP4.
 *
 * Frames arrive on stdin as raw RGBA at a fixed rate; an optional audio file
 * is muxed in and the output stops at the shorter of the two streams. Kept
 * separate from the process handling so it can be tested as plain data.
 */
export interface FfmpegOptions {
  width: number
  height: number
  fps: number
  output: string
  /** Soundtrack file to mux in */
  audio?: string
  /** x264 quality, 0 (lossless) to 51 (default 20) */
  crf?: number
  /** x264 preset (default `medium`) */
  preset?: string
}

export function ffmpegArgs(options: FfmpegOptions): string[] {
  const { width, height, fps, output, audio } = options
  const args = [
    '-y',
    '-loglevel', 'error',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgba',
    '-s', `${width}x${height}`,
    '-r', String(fps),
    '-i', '-',
  ]
  if (audio) args.push('-i', audio)
  args.push(
    '-c:v', 'libx264',
    '-preset', options.preset ?? 'medium',
    '-crf', String(options.crf ?? 20),
    // yuv420p needs even dimensions; players reject anything else.
    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    '-pix_fmt', 'yuv420p',
  )
  if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest')
  args.push('-movflags', '+faststart', output)
  return args
}
