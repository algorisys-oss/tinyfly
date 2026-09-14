/**
 * Warnings from the live API, reworded for someone learning: what went wrong in
 * the terms of the step (selectors, properties), and what to change.
 *
 * Returns undefined for warnings a learner doesn't need to see. Pure, so the
 * wording is testable without running a step.
 */

const PREFIX = /^gsap-compat:\s*/

export function learnerWarning(message: string): string | undefined {
  const text = message.replace(PREFIX, '')

  // Every first `live.to` on a property starts from its default (x: 0, opacity: 1…).
  // That is expected in the course, so it would only be noise.
  if (text.startsWith('no start value for ') && text.includes('static default')) return undefined

  const noTargets = text.match(/^no elements found for target (.+)$/)
  if (noTargets) {
    return `Nothing in the preview matches ${code(unquote(noTargets[1]))}, so that tween does nothing. Check the spelling against the class names in the markup.`
  }

  if (text.startsWith('drawSVG needs an SVG shape')) {
    return '`drawSVG` only draws SVG shapes with a stroke (`path`, `circle`, `line`…), not the `<svg>` or an HTML element. Target the shapes inside it, for example `\'.icon *\'`.'
  }

  const spring = text.match(/^spring works on numbers, so "(.+?)" on "(.+?)" eases instead$/)
  if (spring) {
    return `\`spring\` only moves numbers, so ${code(spring[1])} eases instead. Colours and other values need \`ease\` and \`duration\`.`
  }

  const snap = text.match(/^no usable start value for "(.+?)" on "(.+?)"/)
  if (snap) {
    return `${code(snap[1])} has no starting value to animate from, so it jumps to the end. Use \`fromTo()\` and say where it starts.`
  }

  return text
}

const unquote = (value: string) => value.replace(/^"(.*)"$/, '$1')
const code = (value: string) => `\`${value}\``
