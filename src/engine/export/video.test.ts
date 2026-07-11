import { describe, it, expect } from 'vitest'
import { getSupportedVideoCodecs, isVideoExportSupported } from './video'

describe('video export codec detection', () => {
  it('returns an array without throwing when MediaRecorder is unavailable', () => {
    // happy-dom has no MediaRecorder; the detector must degrade gracefully.
    const codecs = getSupportedVideoCodecs()
    expect(Array.isArray(codecs)).toBe(true)
  })

  it('reports unsupported when there are no codecs', () => {
    if (getSupportedVideoCodecs().length === 0) {
      expect(isVideoExportSupported()).toBe(false)
    } else {
      expect(isVideoExportSupported()).toBe(true)
    }
  })

  it('each detected codec has a mime type and extension', () => {
    for (const c of getSupportedVideoCodecs()) {
      expect(c.mimeType).toMatch(/^video\//)
      expect(c.extension).toMatch(/^(mp4|webm)$/)
      expect(typeof c.label).toBe('string')
    }
  })
})
