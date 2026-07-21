/**
 * Browser-side end-to-end check for the binary exporters.
 *
 * Unit tests cover the container writers, but GIF/WebP/MP4 can only really be
 * proven in a browser: WebP needs the native still encoder, MP4 needs WebCodecs,
 * and the only honest test of an MP4 muxer is whether a real decoder will play
 * the file back. This page runs each exporter and validates its output, then
 * writes a report into the DOM so a headless run can read it.
 *
 * Not part of the app or the test suite — run it via `export-check.html`.
 */

import { Timeline } from '../engine/core/timeline'
import { createTrack } from '../engine/core/track'
import { exportToGIF } from '../engine/export/gif'
import { exportToWebP } from '../engine/export/webp'
import { exportToMP4 } from '../engine/export/mp4'
import { decodeGIF } from '../engine/export/gif-decode.test-helper'

const WIDTH = 320
const HEIGHT = 240
const DURATION = 1000
const FPS = 10

const lines: string[] = []
const report = (ok: boolean, label: string, detail: string) => {
  lines.push(`${ok ? 'PASS' : 'FAIL'} ${label}: ${detail}`)
  const out = document.getElementById('out')
  if (out) out.textContent = lines.join('\n')
}

/** A red square sliding left to right, so frames visibly differ. */
function makeTimeline(): Timeline {
  return new Timeline({
    id: 'check',
    name: 'check',
    config: { duration: DURATION },
    tracks: [
      createTrack({
        id: 'x',
        target: 'box',
        property: 'x',
        keyframes: [
          { time: 0, value: 0, easing: 'linear' },
          { time: DURATION, value: 200, easing: 'linear' },
        ],
      }),
    ],
  })
}

/** Draw the animated square for the frame at `timeMs`. */
function drawFrame(ctx: CanvasRenderingContext2D, timeline: Timeline, timeMs: number) {
  const state = timeline.getStateAtTime(timeMs)
  const x = (state.values.get('box')?.get('x') as number) ?? 0
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(x, 80, 80, 80)
  ctx.fillStyle = '#0000ff'
  ctx.fillRect(10, 10, 40, 40)
}

async function checkGIF(timeline: Timeline) {
  try {
    const blob = await exportToGIF(timeline, {
      width: WIDTH,
      height: HEIGHT,
      frameRate: FPS,
      backgroundColor: '#ffffff',
      renderFrame: (ctx, _values, time) => drawFrame(ctx, timeline, time),
    })
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const gif = decodeGIF(bytes)

    // The blue square at (10,10) must survive quantization as blue.
    const probe = (10 + 20 + (10 + 20) * WIDTH) * 4
    const [r, g, b] = [
      gif.frames[0].rgba[probe],
      gif.frames[0].rgba[probe + 1],
      gif.frames[0].rgba[probe + 2],
    ]
    const blueOk = b > 200 && r < 60 && g < 60

    // The red square moves, so the first and last frames must differ.
    // Compare all three channels: a red square on white shares its red channel
    // with the background, so checking red alone finds no difference.
    const last = gif.frames[gif.frames.length - 1]
    const first = gif.frames[0]
    let differing = 0
    for (let i = 0; i < last.rgba.length; i += 4) {
      if (
        last.rgba[i] !== first.rgba[i] ||
        last.rgba[i + 1] !== first.rgba[i + 1] ||
        last.rgba[i + 2] !== first.rgba[i + 2]
      ) {
        differing++
      }
    }

    report(
      gif.frames.length === FPS && blueOk && differing > 1000,
      'GIF',
      `${bytes.length} bytes, ${gif.frames.length} frames, ${gif.width}x${gif.height}, ` +
        `blue probe rgb(${r},${g},${b}), ${differing} px differ first→last`
    )
  } catch (err) {
    report(false, 'GIF', String(err))
  }
}

async function checkWebP(timeline: Timeline) {
  try {
    const blob = await exportToWebP(timeline, {
      width: WIDTH,
      height: HEIGHT,
      frameRate: FPS,
      backgroundColor: '#ffffff',
      renderFrame: (ctx, _values, time) => drawFrame(ctx, timeline, time),
    })
    const bytes = new Uint8Array(await blob.arrayBuffer())

    const fourCC = (o: number) =>
      String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3])
    const u32 = (o: number) =>
      (bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)) >>> 0

    // Walk the chunks and count frames.
    let pos = 12
    let frames = 0
    const types: string[] = []
    while (pos + 8 <= bytes.length) {
      const type = fourCC(pos)
      const size = u32(pos + 4)
      if (types.length < 3) types.push(type)
      if (type === 'ANMF') frames++
      pos += 8 + size + (size % 2)
    }
    const walkedExactly = pos === bytes.length

    // The real proof: hand it back to the browser as an image and see if it
    // decodes to the right size.
    const url = URL.createObjectURL(blob)
    const decoded = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve(null)
      img.src = url
    })
    URL.revokeObjectURL(url)

    report(
      frames === FPS && walkedExactly && decoded?.w === WIDTH && decoded?.h === HEIGHT,
      'WebP',
      `${bytes.length} bytes, ${frames} ANMF frames, chunks [${types.join(',')}], ` +
        `chunk walk exact=${walkedExactly}, browser decoded ${decoded ? `${decoded.w}x${decoded.h}` : 'FAILED'}`
    )
  } catch (err) {
    report(false, 'WebP', String(err))
  }
}

async function checkMP4(timeline: Timeline) {
  try {
    const blob = await exportToMP4({
      width: WIDTH,
      height: HEIGHT,
      fps: FPS,
      durationMs: DURATION,
      background: '#ffffff',
      renderFrame: (ctx, time) => drawFrame(ctx, timeline, time),
    })
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const boxes: string[] = []
    const view = new DataView(bytes.buffer)
    let pos = 0
    while (pos + 8 <= bytes.length) {
      const size = view.getUint32(pos)
      boxes.push(String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]))
      if (size <= 0) break
      pos += size
    }

    // Load it into a <video>: a malformed muxer fails here even when the byte
    // structure looks plausible.
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.muted = true
    video.src = url

    const meta = await new Promise<{ w: number; h: number; duration: number } | null>((resolve) => {
      video.onloadedmetadata = () =>
        resolve({ w: video.videoWidth, h: video.videoHeight, duration: video.duration })
      video.onerror = () => resolve(null)
      setTimeout(() => resolve(null), 8000)
    })

    // Seek into the clip and confirm a real frame comes out.
    let painted = 'skipped'
    if (meta) {
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve()
        video.currentTime = Math.min(0.5, meta.duration / 2)
        setTimeout(resolve, 4000)
      })
      const probe = document.createElement('canvas')
      probe.width = WIDTH
      probe.height = HEIGHT
      const ctx = probe.getContext('2d')!
      ctx.drawImage(video, 0, 0, WIDTH, HEIGHT)
      const data = ctx.getImageData(0, 0, WIDTH, HEIGHT).data
      let red = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 150 && data[i + 1] < 100 && data[i + 2] < 100) red++
      }
      painted = `${red} red px`
    }
    URL.revokeObjectURL(url)

    const durationOk = !!meta && Math.abs(meta.duration - DURATION / 1000) < 0.25
    report(
      !!meta && meta.w === WIDTH && meta.h === HEIGHT && durationOk && painted.startsWith('0 ') === false,
      'MP4',
      `${bytes.length} bytes, boxes [${boxes.join(',')}], ` +
        `video ${meta ? `${meta.w}x${meta.h} dur=${meta.duration.toFixed(2)}s` : 'FAILED TO LOAD'}, ` +
        `decoded frame: ${painted}`
    )
  } catch (err) {
    report(false, 'MP4', String(err))
  }
}

async function main() {
  const timeline = makeTimeline()
  report(true, 'env', `WebCodecs=${typeof VideoEncoder !== 'undefined'}`)
  const sample = (t: number) => timeline.getStateAtTime(t).values.get('box')?.get('x')
  report(
    true,
    'timeline',
    `duration=${timeline.duration} tracks=${timeline.tracks.length} ` +
      `x@0=${sample(0)} x@500=${sample(500)} x@1000=${sample(1000)}`
  )
  await checkGIF(timeline)
  report(true, 'step', 'starting WebP')
  await checkWebP(timeline)
  report(true, 'step', 'starting MP4')
  await checkMP4(timeline)
  lines.push('DONE')
  const out = document.getElementById('out')
  if (out) out.textContent = lines.join('\n')
  // Post the report so a headless run can collect it without virtual time,
  // which expires instantly and cuts the run short.
  try {
    await fetch('http://127.0.0.1:5200/report', { method: 'POST', body: lines.join('\n') })
  } catch { /* running interactively */ }
}

main()
