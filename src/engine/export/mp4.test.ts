import { describe, it, expect } from 'vitest'
import { muxMP4, type MP4Sample } from './mp4'

/** Walk the top-level boxes of an MP4, returning `[type, start, size]` triples. */
function topLevelBoxes(bytes: Uint8Array): { type: string; start: number; size: number }[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const boxes: { type: string; start: number; size: number }[] = []
  let pos = 0
  while (pos + 8 <= bytes.length) {
    const size = view.getUint32(pos)
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7])
    boxes.push({ type, start: pos, size })
    if (size <= 0) break
    pos += size
  }
  return boxes
}

/** Depth-first search for the first box of `type`, returning its payload range. */
function findBox(
  bytes: Uint8Array,
  type: string,
  start = 0,
  end = bytes.length
): { start: number; size: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let pos = start
  while (pos + 8 <= end) {
    const size = view.getUint32(pos)
    if (size < 8) return null
    const boxType = String.fromCharCode(
      bytes[pos + 4],
      bytes[pos + 5],
      bytes[pos + 6],
      bytes[pos + 7]
    )
    if (boxType === type) return { start: pos, size }

    // Container boxes hold children directly after their header.
    if (['moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf'].includes(boxType)) {
      const found = findBox(bytes, type, pos + 8, pos + size)
      if (found) return found
    }
    // stsd and dref are full boxes: children start after version/flags + count.
    if (boxType === 'stsd' || boxType === 'dref') {
      const found = findBox(bytes, type, pos + 16, pos + size)
      if (found) return found
    }
    // avc1 is a sample entry: children follow its 78-byte header.
    if (boxType === 'avc1') {
      const found = findBox(bytes, type, pos + 8 + 78, pos + size)
      if (found) return found
    }
    pos += size
  }
  return null
}

const u32 = (bytes: Uint8Array, offset: number) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset)

/** A stand-in avcC record — the muxer treats it as opaque bytes. */
const AVCC = new Uint8Array([0x01, 0x42, 0x00, 0x1f, 0xff, 0xe1, 0x00, 0x04, 0x67, 0x42, 0x00, 0x1f, 0x01, 0x00, 0x00])

function makeSamples(count: number, keyEvery = 30): MP4Sample[] {
  return Array.from({ length: count }, (_, i) => ({
    // Distinct, varying-length payloads so the size table is verifiable.
    data: new Uint8Array(10 + i).fill(i + 1),
    duration: 1000,
    isKeyFrame: i % keyEvery === 0,
  }))
}

const MUX_OPTIONS = { width: 640, height: 480, timescale: 30000, avcC: AVCC }

describe('MP4 muxer', () => {
  it('rejects an empty sample list', () => {
    expect(() => muxMP4([], MUX_OPTIONS)).toThrow(/no samples/i)
  })

  it('writes ftyp, mdat and moov as top-level boxes', () => {
    const bytes = muxMP4(makeSamples(10), MUX_OPTIONS)
    const boxes = topLevelBoxes(bytes)

    expect(boxes.map((b) => b.type)).toEqual(['ftyp', 'mdat', 'moov'])
  })

  it('produces box sizes that exactly tile the file', () => {
    const bytes = muxMP4(makeSamples(10), MUX_OPTIONS)
    const boxes = topLevelBoxes(bytes)

    const total = boxes.reduce((sum, b) => sum + b.size, 0)
    expect(total).toBe(bytes.length)
  })

  it('declares an isom major brand', () => {
    const bytes = muxMP4(makeSamples(3), MUX_OPTIONS)
    expect(String.fromCharCode(...bytes.subarray(8, 12))).toBe('isom')
  })

  it('stores every sample byte in mdat', () => {
    const samples = makeSamples(8)
    const bytes = muxMP4(samples, MUX_OPTIONS)
    const mdat = topLevelBoxes(bytes).find((b) => b.type === 'mdat')!

    const expected = samples.reduce((sum, s) => sum + s.data.length, 0)
    expect(mdat.size).toBe(expected + 8) // payload + box header

    // The first sample's bytes must sit right after the mdat header.
    const first = bytes.subarray(mdat.start + 8, mdat.start + 8 + samples[0].data.length)
    expect(Array.from(first)).toEqual(Array.from(samples[0].data))
  })

  it('points stco at the start of the mdat payload', () => {
    const samples = makeSamples(5)
    const bytes = muxMP4(samples, MUX_OPTIONS)
    const mdat = topLevelBoxes(bytes).find((b) => b.type === 'mdat')!
    const stco = findBox(bytes, 'stco')!

    // full box header (4) + entry count (4) → first chunk offset
    const chunkOffset = u32(bytes, stco.start + 8 + 4 + 4)
    expect(chunkOffset).toBe(mdat.start + 8)
  })

  it('lists every sample size in stsz', () => {
    const samples = makeSamples(6)
    const bytes = muxMP4(samples, MUX_OPTIONS)
    const stsz = findBox(bytes, 'stsz')!

    const base = stsz.start + 8 + 4 // skip header + version/flags
    expect(u32(bytes, base)).toBe(0) // 0 = per-sample sizes follow
    expect(u32(bytes, base + 4)).toBe(samples.length)

    const sizes = samples.map((_, i) => u32(bytes, base + 8 + i * 4))
    expect(sizes).toEqual(samples.map((s) => s.data.length))
  })

  it('run-length encodes equal durations into a single stts entry', () => {
    const bytes = muxMP4(makeSamples(50), MUX_OPTIONS)
    const stts = findBox(bytes, 'stts')!

    const base = stts.start + 8 + 4
    expect(u32(bytes, base)).toBe(1) // one run
    expect(u32(bytes, base + 4)).toBe(50) // sample count
    expect(u32(bytes, base + 8)).toBe(1000) // delta
  })

  it('splits stts when durations change', () => {
    const samples = makeSamples(4)
    samples[2].duration = 500
    samples[3].duration = 500
    const bytes = muxMP4(samples, MUX_OPTIONS)
    const stts = findBox(bytes, 'stts')!

    const base = stts.start + 8 + 4
    expect(u32(bytes, base)).toBe(2)
    expect(u32(bytes, base + 4)).toBe(2)
    expect(u32(bytes, base + 8)).toBe(1000)
    expect(u32(bytes, base + 12)).toBe(2)
    expect(u32(bytes, base + 16)).toBe(500)
  })

  it('lists sync samples in stss when only some frames are key frames', () => {
    const bytes = muxMP4(makeSamples(10, 4), MUX_OPTIONS)
    const stss = findBox(bytes, 'stss')

    expect(stss).not.toBeNull()
    const base = stss!.start + 8 + 4
    expect(u32(bytes, base)).toBe(3) // frames 0, 4, 8
    // Sample numbers are 1-based.
    expect([u32(bytes, base + 4), u32(bytes, base + 8), u32(bytes, base + 12)]).toEqual([1, 5, 9])
  })

  it('omits stss entirely when every frame is a key frame', () => {
    const bytes = muxMP4(makeSamples(5, 1), MUX_OPTIONS)
    expect(findBox(bytes, 'stss')).toBeNull()
  })

  it('embeds the avcC decoder configuration verbatim', () => {
    const bytes = muxMP4(makeSamples(3), MUX_OPTIONS)
    const avcC = findBox(bytes, 'avcC')!

    expect(avcC.size).toBe(AVCC.length + 8)
    const payload = bytes.subarray(avcC.start + 8, avcC.start + avcC.size)
    expect(Array.from(payload)).toEqual(Array.from(AVCC))
  })

  it('writes the track dimensions into the avc1 sample entry', () => {
    const bytes = muxMP4(makeSamples(3), MUX_OPTIONS)
    const avc1 = findBox(bytes, 'avc1')!
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

    // width/height sit 24 bytes into the VisualSampleEntry payload
    expect(view.getUint16(avc1.start + 8 + 24)).toBe(640)
    expect(view.getUint16(avc1.start + 8 + 26)).toBe(480)
  })

  it('derives media and movie durations from the sample durations', () => {
    // 30 samples of 1000 ticks at timescale 30000 = 1 second.
    const bytes = muxMP4(makeSamples(30), MUX_OPTIONS)

    const mdhd = findBox(bytes, 'mdhd')!
    expect(u32(bytes, mdhd.start + 8 + 4 + 8)).toBe(30000) // timescale
    expect(u32(bytes, mdhd.start + 8 + 4 + 12)).toBe(30000) // duration in ticks

    const mvhd = findBox(bytes, 'mvhd')!
    expect(u32(bytes, mvhd.start + 8 + 4 + 8)).toBe(1000) // movie timescale
    expect(u32(bytes, mvhd.start + 8 + 4 + 12)).toBe(1000) // 1 second
  })

  it('assigns all samples to a single chunk in stsc', () => {
    const bytes = muxMP4(makeSamples(7), MUX_OPTIONS)
    const stsc = findBox(bytes, 'stsc')!

    const base = stsc.start + 8 + 4
    expect(u32(bytes, base)).toBe(1) // entry count
    expect(u32(bytes, base + 4)).toBe(1) // first chunk
    expect(u32(bytes, base + 8)).toBe(7) // samples per chunk
    expect(u32(bytes, base + 12)).toBe(1) // sample description index
  })

  it('marks the media as self-contained via a dref url flag', () => {
    const bytes = muxMP4(makeSamples(3), MUX_OPTIONS)
    const url = findBox(bytes, 'url ')!

    // version 0, flags 0x000001 = data is in this file
    expect(bytes[url.start + 8]).toBe(0)
    expect(bytes[url.start + 11]).toBe(1)
  })
})
