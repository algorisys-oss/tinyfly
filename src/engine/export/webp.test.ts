import { describe, it, expect } from 'vitest'
import { WebPEncoder, parseWebPBitstream } from './webp'
import { ByteWriter } from './byte-writer'

/** Build a minimal single-image WebP file, as `canvas.toBlob` would produce. */
function makeStillWebP(options: {
  vp8Payload: Uint8Array
  alphaPayload?: Uint8Array
  width?: number
  height?: number
}): Uint8Array {
  const { vp8Payload, alphaPayload } = options
  const body = new ByteWriter()
  body.ascii('WEBP')

  if (alphaPayload) {
    // Extended format: VP8X advertises alpha, then ALPH, then VP8 .
    body.ascii('VP8X')
    body.uint32LE(10)
    body.byte(0x10) // alpha flag
    body.uint24LE(0)
    body.uint24LE((options.width ?? 64) - 1)
    body.uint24LE((options.height ?? 48) - 1)

    body.ascii('ALPH')
    body.uint32LE(alphaPayload.length)
    body.bytes(alphaPayload)
    if (alphaPayload.length % 2) body.byte(0)
  }

  body.ascii('VP8 ')
  body.uint32LE(vp8Payload.length)
  body.bytes(vp8Payload)
  if (vp8Payload.length % 2) body.byte(0)

  const out = new ByteWriter()
  out.ascii('RIFF')
  out.uint32LE(body.length)
  out.bytes(body.toUint8Array())
  return out.toBytes()
}

/** A lossy keyframe payload whose header encodes 64x48. */
function vp8Payload(width = 64, height = 48, fill = 0xaa, length = 40): Uint8Array {
  const payload = new Uint8Array(length).fill(fill)
  payload[3] = 0x9d
  payload[4] = 0x01
  payload[5] = 0x2a
  payload[6] = width & 0xff
  payload[7] = (width >> 8) & 0x3f
  payload[8] = height & 0xff
  payload[9] = (height >> 8) & 0x3f
  return payload
}

const fourCC = (bytes: Uint8Array, offset: number) =>
  String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])

const u32LE = (bytes: Uint8Array, offset: number) =>
  (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0

const u24LE = (bytes: Uint8Array, offset: number) =>
  bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)

/** Walk the RIFF chunks of a WebP file. */
function chunks(bytes: Uint8Array): { type: string; start: number; size: number }[] {
  const found: { type: string; start: number; size: number }[] = []
  let pos = 12
  while (pos + 8 <= bytes.length) {
    const type = fourCC(bytes, pos)
    const size = u32LE(bytes, pos + 4)
    found.push({ type, start: pos, size })
    pos += 8 + size + (size % 2)
  }
  return found
}

describe('WebP export', () => {
  describe('parseWebPBitstream', () => {
    it('rejects data that is not a WebP file', () => {
      expect(() => parseWebPBitstream(new Uint8Array(20))).toThrow(/not a webp/i)
    })

    it('extracts a bare lossy bitstream and its dimensions', () => {
      const still = makeStillWebP({ vp8Payload: vp8Payload(64, 48) })
      const parsed = parseWebPBitstream(still)

      expect(fourCC(parsed.image, 0)).toBe('VP8 ')
      expect(parsed.width).toBe(64)
      expect(parsed.height).toBe(48)
      expect(parsed.alpha).toBeNull()
      expect(parsed.hasAlpha).toBe(false)
    })

    it('extracts the alpha chunk from an extended file', () => {
      const still = makeStillWebP({
        vp8Payload: vp8Payload(),
        alphaPayload: new Uint8Array([1, 2, 3, 4, 5]),
      })
      const parsed = parseWebPBitstream(still)

      expect(parsed.hasAlpha).toBe(true)
      expect(parsed.alpha).not.toBeNull()
      expect(fourCC(parsed.alpha!, 0)).toBe('ALPH')
      // Header (8) + payload (5), padding excluded from the chunk itself.
      expect(parsed.alpha!.length).toBe(13)
    })

    it('throws when no image chunk is present', () => {
      const out = new ByteWriter()
      out.ascii('RIFF')
      out.uint32LE(4)
      out.ascii('WEBP')
      expect(() => parseWebPBitstream(out.toBytes())).toThrow(/no VP8/i)
    })
  })

  describe('WebPEncoder', () => {
    it('refuses to encode with no frames', () => {
      expect(() => new WebPEncoder(64, 48).encodeToBytes()).toThrow(/no frames/i)
    })

    it('writes a RIFF/WEBP container whose size field matches the file', () => {
      const encoder = new WebPEncoder(64, 48)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 100)
      const bytes = encoder.encodeToBytes()

      expect(fourCC(bytes, 0)).toBe('RIFF')
      expect(fourCC(bytes, 8)).toBe('WEBP')
      // The RIFF size counts everything after the size field.
      expect(u32LE(bytes, 4)).toBe(bytes.length - 8)
    })

    it('emits VP8X, ANIM and one ANMF per frame', () => {
      const encoder = new WebPEncoder(64, 48)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 100)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 100)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 100)

      const types = chunks(encoder.encodeToBytes()).map((c) => c.type)
      expect(types).toEqual(['VP8X', 'ANIM', 'ANMF', 'ANMF', 'ANMF'])
    })

    it('records the canvas size in VP8X as width-minus-one', () => {
      const encoder = new WebPEncoder(320, 240)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 40)
      const bytes = encoder.encodeToBytes()
      const vp8x = chunks(bytes).find((c) => c.type === 'VP8X')!

      expect(u24LE(bytes, vp8x.start + 8 + 4)).toBe(319)
      expect(u24LE(bytes, vp8x.start + 8 + 7)).toBe(239)
    })

    it('sets the animation flag, and the alpha flag only when a frame has alpha', () => {
      const opaque = new WebPEncoder(64, 48)
      opaque.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 40)
      const opaqueBytes = opaque.encodeToBytes()
      const opaqueFlags = opaqueBytes[chunks(opaqueBytes).find((c) => c.type === 'VP8X')!.start + 8]

      const transparent = new WebPEncoder(64, 48)
      transparent.addFrame(
        makeStillWebP({ vp8Payload: vp8Payload(), alphaPayload: new Uint8Array([9, 9, 9]) }),
        40
      )
      const alphaBytes = transparent.encodeToBytes()
      const alphaFlags = alphaBytes[chunks(alphaBytes).find((c) => c.type === 'VP8X')!.start + 8]

      expect(opaqueFlags & 0x02).toBe(0x02) // animation
      expect(opaqueFlags & 0x10).toBe(0) // no alpha
      expect(alphaFlags & 0x10).toBe(0x10) // alpha
    })

    it('stores the loop count in the ANIM chunk', () => {
      const encoder = new WebPEncoder(64, 48, { loops: 7 })
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 40)
      const bytes = encoder.encodeToBytes()
      const anim = chunks(bytes).find((c) => c.type === 'ANIM')!

      // 4 bytes background colour, then a 16-bit loop count.
      expect(bytes[anim.start + 8 + 4] | (bytes[anim.start + 8 + 5] << 8)).toBe(7)
    })

    it('writes each frame duration into its ANMF header', () => {
      const encoder = new WebPEncoder(64, 48)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 33)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 250)

      const bytes = encoder.encodeToBytes()
      const frames = chunks(bytes).filter((c) => c.type === 'ANMF')

      // x(3) y(3) w(3) h(3) then duration(3)
      expect(u24LE(bytes, frames[0].start + 8 + 12)).toBe(33)
      expect(u24LE(bytes, frames[1].start + 8 + 12)).toBe(250)
    })

    it('marks frames as full-canvas, non-blended and disposed to background', () => {
      const encoder = new WebPEncoder(64, 48)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 40)
      const bytes = encoder.encodeToBytes()
      const anmf = chunks(bytes).find((c) => c.type === 'ANMF')!

      expect(u24LE(bytes, anmf.start + 8)).toBe(0) // x
      expect(u24LE(bytes, anmf.start + 8 + 3)).toBe(0) // y
      expect(u24LE(bytes, anmf.start + 8 + 6)).toBe(63) // width - 1
      expect(u24LE(bytes, anmf.start + 8 + 9)).toBe(47) // height - 1
      expect(bytes[anmf.start + 8 + 15]).toBe(0x03) // do-not-blend | dispose
    })

    it('carries the original VP8 bitstream through into the ANMF payload', () => {
      const payload = vp8Payload(64, 48, 0x5c)
      const encoder = new WebPEncoder(64, 48)
      encoder.addFrame(makeStillWebP({ vp8Payload: payload }), 40)

      const bytes = encoder.encodeToBytes()
      const anmf = chunks(bytes).find((c) => c.type === 'ANMF')!
      // ANMF payload: 16-byte header, then the image chunk.
      const imageStart = anmf.start + 8 + 16

      expect(fourCC(bytes, imageStart)).toBe('VP8 ')
      expect(u32LE(bytes, imageStart + 4)).toBe(payload.length)
      const carried = bytes.subarray(imageStart + 8, imageStart + 8 + payload.length)
      expect(Array.from(carried)).toEqual(Array.from(payload))
    })

    it('keeps alpha ahead of the image inside the frame payload', () => {
      const alphaPayload = new Uint8Array([7, 7, 7, 7])
      const encoder = new WebPEncoder(64, 48)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload(), alphaPayload }), 40)

      const bytes = encoder.encodeToBytes()
      const anmf = chunks(bytes).find((c) => c.type === 'ANMF')!
      const payloadStart = anmf.start + 8 + 16

      expect(fourCC(bytes, payloadStart)).toBe('ALPH')
      const afterAlpha = payloadStart + 8 + alphaPayload.length
      expect(fourCC(bytes, afterAlpha)).toBe('VP8 ')
    })

    it('pads odd-length chunks so following chunks stay word-aligned', () => {
      // 41-byte payload forces a pad byte after the image chunk.
      const encoder = new WebPEncoder(64, 48)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload(64, 48, 0xaa, 41) }), 40)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload(64, 48, 0xbb, 41) }), 40)

      const bytes = encoder.encodeToBytes()
      // Walking by declared sizes must land exactly on the end of the file.
      const walked = chunks(bytes)
      const last = walked[walked.length - 1]
      expect(last.start + 8 + last.size + (last.size % 2)).toBe(bytes.length)
      expect(walked.filter((c) => c.type === 'ANMF')).toHaveLength(2)
    })

    it('counts frames as they are added', () => {
      const encoder = new WebPEncoder(64, 48)
      expect(encoder.frameCount).toBe(0)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 40)
      encoder.addFrame(makeStillWebP({ vp8Payload: vp8Payload() }), 40)
      expect(encoder.frameCount).toBe(2)
    })
  })
})
