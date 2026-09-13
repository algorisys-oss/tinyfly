export const html = `<style>
  .tw-line { color: #fff; font: 600 20px system-ui, sans-serif; white-space: nowrap; }
  .tw-text { color: #4a9eff; }
  .tw-cursor { display: inline-block; width: 2px; height: 22px; margin-left: 2px; vertical-align: -3px; background: #fff; }
</style>
<div class="tw-line">tinyfly is <span class="tw-text">fast</span><span class="tw-cursor"></span></div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  // Typing is the text option: the new text replaces the old one character at
  // a time. Deleting is typing towards an empty string, from the right.

  // A blink is three instant sets on a repeating timeline.
  live
    .timeline({ repeat: -1 })
    .set('.tw-cursor', { opacity: 1 }, 0)
    .set('.tw-cursor', { opacity: 0 }, 0.5)
    .set('.tw-cursor', { opacity: 1 }, 1)

  const words = ['deterministic', 'JSON-first', 'tiny']
  const tl = live.timeline({ repeat: -1, repeatDelay: 0.8 })
  for (const word of [...words, 'fast']) {
    tl.to('.tw-text', { text: { value: '', rightToLeft: true }, duration: 0.35, ease: 'none' }, '+=1')
    tl.to('.tw-text', { text: word, duration: word.length * 0.06, ease: 'none' }, '+=0.15')
  }
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const typewriterText = {
  id: 'live-typewriter-text',
  name: 'Typewriter',
  description: 'Types, deletes and retypes a word with a blinking cursor — the text option, sequenced on one timeline.',
  tags: ['text', 'typewriter', 'set', 'sequence'],
  html,
  run,
}
