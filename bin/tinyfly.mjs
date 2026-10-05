#!/usr/bin/env node
/**
 * tinyfly command line.
 *
 *   tinyfly validate <timeline.json> [<timeline.json> …] [--markup <figure.svg|.html>]
 *       Exit 1 when the timeline has errors: tracks aimed at elements the markup
 *       lacks, markers out of order or outside the animation, keyframes past an
 *       explicit duration, captions for unknown markers. Warnings are printed.
 *       Several timelines are a figure's scenarios, each named by its "id": they
 *       are checked together, including repeated ids and data-tinyfly-choose
 *       hotspots that name no scenario.
 *
 *   tinyfly render <timeline.json> <figure.svg|.html> [--at start|end|<ms>|<marker id>]
 *       Print the markup with that frame written in, for places that run no
 *       JavaScript (RSS, email, print, previews).
 *
 *   tinyfly video <scene.mjs> [-o <out.mp4>] [--stills <dir>] [--frames <i,j,…> | --times <ms,ms,…>]
 *                 [--loop-check] [--scale <n>] [--fps <n>] [--crf <n>] [--no-audio] [--srt <file>] [--vtt <file>]
 *       Render a scene module to an MP4 without a browser. The module's default
 *       export is a VideoScene (or a function returning one): a timeline and
 *       canvas targets, a draw(ctx, frame) function, or both. --stills writes
 *       one PNG per marker step instead of a video, or one per frame / time
 *       given with --frames or --times. --loop-check renders five frames and
 *       says whether the video loops (exit 1 when it does not). Needs ffmpeg on
 *       the PATH (not for stills or --loop-check) and the optional package
 *       @napi-rs/canvas.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { validateEmbed, validateScenarios, renderFrame } from '../lib/cli/tools.js'

const [command, ...rest] = process.argv.slice(2)
const flag = (name) => {
  const index = rest.indexOf(name)
  if (index === -1) return undefined
  const [, value] = rest.splice(index, 2)
  return value
}
const has = (name) => {
  const index = rest.indexOf(name)
  if (index === -1) return false
  rest.splice(index, 1)
  return true
}
const numberFlag = (name) => {
  const value = flag(name)
  if (value === undefined) return undefined
  const number = Number(value)
  if (!(number > 0 || (name === '--crf' && number === 0))) {
    console.error(`tinyfly: ${name} needs a number (got ${value})`)
    process.exit(2)
  }
  return number
}

/** A comma-separated list of numbers (frames or ms), or undefined when the flag is absent. */
function listFlag(name) {
  const value = flag(name)
  if (value === undefined) return undefined
  const numbers = value.split(',').map((part) => Number(part.trim()))
  if (numbers.length === 0 || numbers.some((n) => !Number.isFinite(n) || n < 0)) {
    console.error(`tinyfly: ${name} needs numbers separated by commas (got ${value})`)
    process.exit(2)
  }
  return numbers
}

const usage = () => {
  console.error(
    'Usage:\n' +
      '  tinyfly validate <timeline.json> [<timeline.json> …] [--markup <file>]\n' +
      '  tinyfly render <timeline.json> <markup file> [--at start|end|<ms>|<marker id>]\n' +
      '  tinyfly video <scene.mjs> [-o <out.mp4>] [--stills <dir>] [--frames <i,j,…> | --times <ms,…>] [--loop-check]\n' +
      '                [--scale <n>] [--fps <n>] [--crf <n>] [--no-audio] [--srt <file>] [--vtt <file>]'
  )
  process.exit(2)
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    console.error(`tinyfly: cannot read ${file}: ${error.message}`)
    process.exit(2)
  }
}

if (command === 'validate') {
  const markupFile = flag('--markup')
  const timelineFiles = rest
  if (timelineFiles.length === 0) usage()
  const markup = markupFile ? readFileSync(markupFile, 'utf8') : undefined
  const timelineFile = timelineFiles.join(', ')
  const problems =
    timelineFiles.length === 1
      ? validateEmbed(readJson(timelineFiles[0]), { markup })
      : validateScenarios(
          timelineFiles.map((file) => {
            const timeline = readJson(file)
            return { id: timeline.id ?? file, timeline }
          }),
          { markup }
        )
  for (const problem of problems) console.error(`${problem.level}: ${problem.message}`)
  const errors = problems.filter((problem) => problem.level === 'error').length
  if (errors > 0) {
    console.error(`${timelineFile}: ${errors} error(s)`)
    process.exit(1)
  }
  console.error(`${timelineFile}: ok${problems.length ? ` (${problems.length} warning(s))` : ''}`)
} else if (command === 'render') {
  const at = flag('--at') ?? 'end'
  const [timelineFile, markupFile] = rest
  if (!timelineFile || !markupFile) usage()
  const frame = /^\d+(\.\d+)?$/.test(at) ? Number(at) : at
  process.stdout.write(renderFrame(readFileSync(markupFile, 'utf8'), readJson(timelineFile), frame))
} else if (command === 'video') {
  await video()
} else {
  usage()
}

async function video() {
  const output = flag('-o') ?? flag('--output')
  const stillsDir = flag('--stills')
  const srtFile = flag('--srt')
  const vttFile = flag('--vtt')
  const scale = numberFlag('--scale')
  const fps = numberFlag('--fps')
  const crf = numberFlag('--crf')
  const silent = has('--no-audio')
  const loopCheck = has('--loop-check')
  const framesList = listFlag('--frames')
  const timesList = listFlag('--times')
  const [sceneFile] = rest
  if (!sceneFile || rest.length > 1) usage()
  if ((framesList || timesList) && !stillsDir) {
    console.error('tinyfly: --frames and --times choose stills: add --stills <dir>')
    process.exit(2)
  }

  const headless = await import('../lib/headless/headless.js')
  const scenePath = resolve(sceneFile)
  const baseDir = dirname(scenePath)
  const exported = (await import(pathToFileURL(scenePath).href)).default
  const scene = typeof exported === 'function' ? await exported() : exported
  if (!scene || typeof scene !== 'object') {
    console.error(`tinyfly: ${sceneFile} must default-export a scene (or a function returning one)`)
    process.exit(2)
  }

  try {
    if (srtFile || vttFile) {
      const cues = headless.sceneCaptions(scene)
      if (srtFile) writeFileSync(srtFile, headless.toSRT(cues))
      if (vttFile) writeFileSync(vttFile, headless.toWebVTT(cues))
      console.error(`captions: ${cues.length} cue(s)`)
    }
    if (loopCheck) {
      const report = await headless.checkLoop(scene, { baseDir, scale, fps })
      const db = (value) => (Number.isFinite(value) ? `${value.toFixed(2)} dB` : 'identical')
      console.error(`frame at the duration vs the first: ${db(report.closure)}`)
      console.error(`last → first (the seam):           ${db(report.seam)}`)
      console.error(`ordinary steps:                    ${db(report.steps[0])}, ${db(report.steps[1])}`)
      console.error(`${report.loops ? '✓' : '✗'} ${report.verdict}`)
      if (!report.loops) process.exit(1)
      return
    }
    if (stillsDir) {
      // Stills at chosen frames or times, else one per marker step.
      const sceneFps = fps ?? scene.fps ?? 30
      const times = framesList
        ? framesList.map((frame) => ({ id: `frame-${frame}`, time: (frame * 1000) / sceneFps }))
        : timesList?.map((time) => ({ id: `t-${time}ms`, time }))
      const files = await headless.renderStills(scene, { dir: stillsDir, baseDir, scale, times })
      console.error(`stills: ${files.length} PNG(s) in ${stillsDir}`)
      return
    }
    const out = output ?? join(baseDir, `${basename(scenePath, extname(scenePath))}.mp4`)
    let lastPercent = -1
    const started = Date.now()
    const result = await headless.renderVideo(scene, {
      output: out,
      baseDir,
      scale,
      fps,
      crf,
      audio: silent ? false : undefined,
      onProgress: (done, total) => {
        const percent = Math.floor((done / total) * 20) * 5
        if (percent !== lastPercent) {
          lastPercent = percent
          console.error(`  ${String(percent).padStart(3)}%  frame ${done}/${total}`)
        }
      },
    })
    const seconds = ((Date.now() - started) / 1000).toFixed(1)
    console.error(`wrote ${result.output} (${result.frames} frames, ${(result.duration / 1000).toFixed(2)} s) in ${seconds} s`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
