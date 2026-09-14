#!/usr/bin/env node
/**
 * tinyfly command line.
 *
 *   tinyfly validate <timeline.json> [--markup <figure.svg|.html>]
 *       Exit 1 when the timeline has errors: tracks aimed at elements the markup
 *       lacks, markers out of order or outside the animation, keyframes past an
 *       explicit duration, captions for unknown markers. Warnings are printed.
 *
 *   tinyfly render <timeline.json> <figure.svg|.html> [--at start|end|<ms>|<marker id>]
 *       Print the markup with that frame written in, for places that run no
 *       JavaScript (RSS, email, print, previews).
 */
import { readFileSync } from 'node:fs'
import { validateEmbed, renderFrame } from '../lib/cli/tools.js'

const [command, ...rest] = process.argv.slice(2)
const flag = (name) => {
  const index = rest.indexOf(name)
  if (index === -1) return undefined
  const [, value] = rest.splice(index, 2)
  return value
}

const usage = () => {
  console.error('Usage:\n  tinyfly validate <timeline.json> [--markup <file>]\n  tinyfly render <timeline.json> <markup file> [--at start|end|<ms>|<marker id>]')
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
  const [timelineFile] = rest
  if (!timelineFile) usage()
  const problems = validateEmbed(readJson(timelineFile), { markup: markupFile ? readFileSync(markupFile, 'utf8') : undefined })
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
} else {
  usage()
}
