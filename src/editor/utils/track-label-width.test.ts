// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest'
import { trackLabelWidth, DEFAULT_TRACK_LABEL_WIDTH } from './track-label-width'

/**
 * The label column's width is the origin every timeline hit test measures from.
 * It lives in CSS because that is what lays the column out, and it narrows at
 * the mobile breakpoints — so reading it back has to work, and has to degrade to
 * the desktop width rather than 0 when it can't.
 */
afterEach(() => {
  document.body.innerHTML = ''
})

function mount(styleValue?: string) {
  const panel = document.createElement('div')
  panel.className = 'timeline-panel'
  if (styleValue !== undefined) panel.style.setProperty('--track-label-w', styleValue)
  const child = document.createElement('div')
  panel.appendChild(child)
  document.body.appendChild(panel)
  return { panel, child }
}

describe('trackLabelWidth', () => {
  it('reads the custom property off the element', () => {
    const { panel } = mount('120px')
    expect(trackLabelWidth(panel)).toBe(120)
  })

  it('reads the narrowed value used at the mobile breakpoints', () => {
    expect(trackLabelWidth(mount('90px').panel)).toBe(90)
    expect(trackLabelWidth(mount('70px').panel)).toBe(70)
  })

  it('climbs to the panel that declares the property', () => {
    const { child } = mount('90px')
    expect(trackLabelWidth(child)).toBe(90)
  })

  it('falls back for an element outside any timeline panel', () => {
    const orphan = document.createElement('div')
    document.body.appendChild(orphan)
    expect(trackLabelWidth(orphan)).toBe(DEFAULT_TRACK_LABEL_WIDTH)
  })

  it('falls back to the desktop width when the property is absent', () => {
    const { panel } = mount()
    expect(trackLabelWidth(panel)).toBe(DEFAULT_TRACK_LABEL_WIDTH)
  })

  it('falls back when there is no element (ref not yet attached)', () => {
    expect(trackLabelWidth(null)).toBe(DEFAULT_TRACK_LABEL_WIDTH)
    expect(trackLabelWidth(undefined)).toBe(DEFAULT_TRACK_LABEL_WIDTH)
  })

  it('falls back on an unparseable value rather than returning 0', () => {
    const { panel } = mount('inherit')
    expect(trackLabelWidth(panel)).toBe(DEFAULT_TRACK_LABEL_WIDTH)
  })
})
