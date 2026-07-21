import { describe, it, expect } from 'vitest'
import { GIFEncoder, SimpleGIFEncoder, lzwEncode } from './gif'
import { buildPalette, quantizeImage } from './quantize'
import { decodeGIF } from './gif-decode.test-helper'

/** Build an ImageData-shaped object filled with one RGBA colour. */
const solidImage = (width: number, height: number, r: number, g: number, b: number, a = 255) => {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = a
  }
  return { data, width, height } as ImageData
}

const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer())

/** Read the RGBA of pixel `index` out of a decoded frame. */
const pixelAt = (rgba: Uint8Array, index: number) => [
  rgba[index * 4],
  rgba[index * 4 + 1],
  rgba[index * 4 + 2],
  rgba[index * 4 + 3],
]

describe('GIF Export', () => {
  describe('GIFEncoder structure', () => {
    it('produces a GIF89a header and trailer', async () => {
      const encoder = new GIFEncoder(10, 10)
      encoder.addFrame(solidImage(10, 10, 100, 100, 100), 10)

      const bytes = await bytesOf(encoder.encode())

      expect(String.fromCharCode(...bytes.subarray(0, 6))).toBe('GIF89a')
      expect(bytes[bytes.length - 1]).toBe(0x3b)
    })

    it('writes the canvas dimensions into the logical screen descriptor', async () => {
      const encoder = new GIFEncoder(320, 240)
      encoder.addFrame(solidImage(320, 240, 10, 20, 30), 10)

      const gif = decodeGIF(await bytesOf(encoder.encode()))

      expect(gif.width).toBe(320)
      expect(gif.height).toBe(240)
    })

    it('records the loop count in the Netscape extension', async () => {
      const infinite = new GIFEncoder(8, 8, 0)
      const finite = new GIFEncoder(8, 8, 5)
      infinite.addFrame(solidImage(8, 8, 1, 2, 3), 10)
      finite.addFrame(solidImage(8, 8, 1, 2, 3), 10)

      expect(decodeGIF(await bytesOf(infinite.encode())).loops).toBe(0)
      expect(decodeGIF(await bytesOf(finite.encode())).loops).toBe(5)
    })

    it('exposes SimpleGIFEncoder as an alias for backwards compatibility', () => {
      expect(SimpleGIFEncoder).toBe(GIFEncoder)
    })
  })

  describe('colour fidelity', () => {
    it('round-trips a solid red frame as red, not greyscale', async () => {
      const encoder = new GIFEncoder(16, 16)
      encoder.addFrame(solidImage(16, 16, 255, 0, 0), 10)

      const gif = decodeGIF(await bytesOf(encoder.encode()))

      expect(gif.frames).toHaveLength(1)
      expect(pixelAt(gif.frames[0].rgba, 0)).toEqual([255, 0, 0, 255])
    })

    it('keeps each frame on its own palette', async () => {
      const encoder = new GIFEncoder(16, 16)
      encoder.addFrame(solidImage(16, 16, 255, 0, 0), 10)
      encoder.addFrame(solidImage(16, 16, 0, 255, 0), 10)
      encoder.addFrame(solidImage(16, 16, 0, 0, 255), 10)

      const gif = decodeGIF(await bytesOf(encoder.encode()))

      expect(gif.frames).toHaveLength(3)
      expect(pixelAt(gif.frames[0].rgba, 0)).toEqual([255, 0, 0, 255])
      expect(pixelAt(gif.frames[1].rgba, 0)).toEqual([0, 255, 0, 255])
      expect(pixelAt(gif.frames[2].rgba, 0)).toEqual([0, 0, 255, 255])
    })

    it('reproduces a multi-colour frame within quantization tolerance', async () => {
      const width = 32
      const height = 32
      const data = new Uint8ClampedArray(width * height * 4)
      const expected: number[][] = []
      for (let p = 0; p < width * height; p++) {
        const r = (p * 7) % 256
        const g = (p * 11) % 256
        const b = (p * 13) % 256
        data[p * 4] = r
        data[p * 4 + 1] = g
        data[p * 4 + 2] = b
        data[p * 4 + 3] = 255
        expected.push([r, g, b])
      }

      const encoder = new GIFEncoder(width, height, { dither: false })
      encoder.addFrame({ data, width, height } as ImageData, 10)
      const gif = decodeGIF(await bytesOf(encoder.encode()))

      // 255 palette entries over ~1000 distinct colours: expect closeness, not
      // an exact match. A greyscale palette would blow way past this bound.
      let totalError = 0
      for (let p = 0; p < width * height; p++) {
        const [r, g, b] = pixelAt(gif.frames[0].rgba, p)
        const [er, eg, eb] = expected[p]
        totalError += Math.abs(r - er) + Math.abs(g - eg) + Math.abs(b - eb)
      }
      const meanError = totalError / (width * height * 3)
      expect(meanError).toBeLessThan(12)
    })

    it('preserves colour through a large frame that overflows the LZW dictionary', async () => {
      // 200x200 of noise forces multiple dictionary resets during compression.
      const width = 200
      const height = 200
      const data = new Uint8ClampedArray(width * height * 4)
      for (let p = 0; p < width * height; p++) {
        const v = (p * 2654435761) >>> 0
        data[p * 4] = v & 0xff
        data[p * 4 + 1] = (v >> 8) & 0xff
        data[p * 4 + 2] = (v >> 16) & 0xff
        data[p * 4 + 3] = 255
      }

      const encoder = new GIFEncoder(width, height, { dither: false })
      encoder.addFrame({ data, width, height } as ImageData, 10)
      const gif = decodeGIF(await bytesOf(encoder.encode()))

      // Every pixel must decode to something opaque — a truncated or corrupt
      // LZW stream would leave the tail of the frame unwritten.
      const { rgba } = gif.frames[0]
      let opaque = 0
      for (let p = 0; p < width * height; p++) {
        if (rgba[p * 4 + 3] === 255) opaque++
      }
      expect(opaque).toBe(width * height)
    })
  })

  describe('transparency', () => {
    it('flags transparency and restores to background', async () => {
      const width = 8
      const height = 8
      const data = new Uint8ClampedArray(width * height * 4)
      for (let p = 0; p < width * height; p++) {
        const opaque = p >= 32
        data[p * 4] = 200
        data[p * 4 + 1] = 50
        data[p * 4 + 2] = 50
        data[p * 4 + 3] = opaque ? 255 : 0
      }

      const encoder = new GIFEncoder(width, height)
      encoder.addFrame({ data, width, height } as ImageData, 10)
      const gif = decodeGIF(await bytesOf(encoder.encode()))
      const frame = gif.frames[0]

      expect(frame.transparentIndex).toBe(0)
      expect(frame.disposal).toBe(2)
      expect(pixelAt(frame.rgba, 0)[3]).toBe(0) // transparent half
      expect(pixelAt(frame.rgba, 40)[3]).toBe(255) // opaque half
    })

    it('marks fully opaque frames as non-transparent', async () => {
      const encoder = new GIFEncoder(8, 8)
      encoder.addFrame(solidImage(8, 8, 12, 34, 56), 10)

      const frame = decodeGIF(await bytesOf(encoder.encode())).frames[0]

      expect(frame.transparentIndex).toBe(-1)
      expect(frame.disposal).toBe(1)
    })
  })

  describe('timing', () => {
    it('stores per-frame delays in centiseconds', async () => {
      const encoder = new GIFEncoder(8, 8)
      const image = solidImage(8, 8, 200, 200, 200)
      encoder.addFrame(image, 5)
      encoder.addFrame(image, 10)
      encoder.addFrame(image, 50)

      const gif = decodeGIF(await bytesOf(encoder.encode()))

      expect(gif.frames.map((f) => f.delay)).toEqual([5, 10, 50])
    })
  })

  describe('lzwEncode', () => {
    it('emits the minimum-code-size clear code and a terminator', () => {
      const out = lzwEncode(new Uint8Array([1, 1, 1, 1]), 8)

      expect(out[out.length - 1]).toBe(0x00) // block terminator
      expect(out.length).toBeGreaterThan(2)
    })

    it('compresses a long run far below its raw size', () => {
      const out = lzwEncode(new Uint8Array(10000).fill(7), 8)
      expect(out.length).toBeLessThan(1000)
    })

    it('never emits a sub-block longer than 255 bytes', () => {
      const indices = new Uint8Array(20000)
      for (let i = 0; i < indices.length; i++) indices[i] = (i * 31) % 256
      const out = lzwEncode(indices, 8)

      let pos = 0
      while (out[pos] !== 0x00) {
        expect(out[pos]).toBeLessThanOrEqual(255)
        expect(out[pos]).toBeGreaterThan(0)
        pos += 1 + out[pos]
      }
      expect(pos).toBe(out.length - 1)
    })
  })

  describe('quantize', () => {
    it('returns every distinct colour when the image fits in the palette', () => {
      const data = new Uint8ClampedArray([
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,
        255, 255, 0, 255,
      ])
      const palette = buildPalette(data, 255)
      expect(palette.size).toBe(4)
    })

    it('caps the palette at maxColors', () => {
      const data = new Uint8ClampedArray(4000 * 4)
      for (let p = 0; p < 4000; p++) {
        data[p * 4] = (p * 7) % 256
        data[p * 4 + 1] = (p * 13) % 256
        data[p * 4 + 2] = (p * 29) % 256
        data[p * 4 + 3] = 255
      }
      expect(buildPalette(data, 16).size).toBeLessThanOrEqual(16)
      expect(buildPalette(data, 255).size).toBeLessThanOrEqual(255)
    })

    it('ignores transparent pixels when building the palette', () => {
      const data = new Uint8ClampedArray([
        255, 0, 0, 0, // transparent, must not enter the palette
        0, 255, 0, 255,
      ])
      const palette = buildPalette(data, 255)

      expect(palette.size).toBe(1)
      expect(Array.from(palette.rgb.subarray(0, 3))).toEqual([0, 255, 0])
    })

    it('maps pixels to palette indices offset past the transparent slot', () => {
      const data = new Uint8ClampedArray([0, 255, 0, 255, 0, 255, 0, 0])
      const palette = buildPalette(data, 255)
      const { indices, hasTransparency } = quantizeImage(data, 2, 1, palette, { dither: false })

      expect(indices[0]).toBe(1) // first palette colour, index 0 is reserved
      expect(indices[1]).toBe(0) // transparent
      expect(hasTransparency).toBe(true)
    })

    it('leaves the source image untouched when dithering', () => {
      const data = new Uint8ClampedArray(64 * 4)
      for (let p = 0; p < 64; p++) {
        data[p * 4] = p * 4
        data[p * 4 + 1] = 128
        data[p * 4 + 2] = 200
        data[p * 4 + 3] = 255
      }
      const before = Uint8ClampedArray.from(data)
      const palette = buildPalette(data, 8)
      quantizeImage(data, 8, 8, palette, { dither: true })

      expect(Array.from(data)).toEqual(Array.from(before))
    })
  })
})
