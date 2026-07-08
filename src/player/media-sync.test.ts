import { describe, it, expect, vi } from 'vitest'
import { MediaSync, type SyncableMedia } from './media-sync'

interface FakeMedia {
  currentTime: number
  paused: boolean
  playbackRate: number
  play: ReturnType<typeof vi.fn>
  pause: ReturnType<typeof vi.fn>
}

/** A controllable fake media element (structurally a SyncableMedia). */
function makeMedia(opts: { paused?: boolean; play?: ReturnType<typeof vi.fn> } = {}): FakeMedia {
  const media = {
    currentTime: 0,
    paused: opts.paused ?? true,
    playbackRate: 1,
  } as FakeMedia
  media.play =
    opts.play ??
    vi.fn(() => {
      media.paused = false
    })
  media.pause = vi.fn(() => {
    media.paused = true
  })
  return media
}

const asMedia = (m: FakeMedia): SyncableMedia => m as unknown as SyncableMedia

describe('MediaSync', () => {
  it('plays the media when the timeline is playing and it is paused', () => {
    const media = makeMedia()
    const sync = new MediaSync(asMedia(media))
    sync.update(0, true)
    expect(media.play).toHaveBeenCalled()
    expect(media.paused).toBe(false)
  })

  it('pauses the media when the timeline is not playing', () => {
    const media = makeMedia({ paused: false })
    const sync = new MediaSync(asMedia(media))
    sync.update(500, false)
    expect(media.pause).toHaveBeenCalled()
    expect(media.currentTime).toBe(0.5) // aligned to timeline
  })

  it('corrects drift beyond the tolerance while playing', () => {
    const media = makeMedia({ paused: false })
    media.currentTime = 0
    const sync = new MediaSync(asMedia(media), { driftTolerance: 0.15 })
    // Timeline at 1000ms (1s); media at 0s -> drift 1s > tolerance -> corrected.
    sync.update(1000, true)
    expect(media.currentTime).toBe(1)
  })

  it('does not re-seek when drift is within tolerance', () => {
    const media = makeMedia({ paused: false })
    media.currentTime = 1.02
    const sync = new MediaSync(asMedia(media), { driftTolerance: 0.15 })
    sync.update(1000, true) // target 1.0, drift 0.02 < 0.15
    expect(media.currentTime).toBe(1.02) // untouched
  })

  it('applies an offset when mapping timeline time to media time', () => {
    const media = makeMedia()
    const sync = new MediaSync(asMedia(media), { offset: 2 })
    sync.seek(1000) // 1s + 2s offset
    expect(media.currentTime).toBe(3)
  })

  it('never maps to a negative media time', () => {
    const media = makeMedia()
    const sync = new MediaSync(asMedia(media), { offset: -5 })
    sync.seek(1000) // 1 - 5 = -4 -> clamped to 0
    expect(media.currentTime).toBe(0)
  })

  it('mirrors the playback rate', () => {
    const media = makeMedia()
    const sync = new MediaSync(asMedia(media))
    sync.setRate(2)
    expect(media.playbackRate).toBe(2)
  })

  it('pauses on dispose', () => {
    const media = makeMedia({ paused: false })
    const sync = new MediaSync(asMedia(media))
    sync.dispose()
    expect(media.pause).toHaveBeenCalled()
  })

  it('swallows a rejected play() promise (autoplay policy)', () => {
    const media = makeMedia({ play: vi.fn(() => Promise.reject(new Error('blocked'))) })
    const sync = new MediaSync(asMedia(media))
    expect(() => sync.update(0, true)).not.toThrow()
  })
})
