import { describe, it, expect } from 'vitest'
import { SimpleGIFEncoder } from './gif'

// Mock DOM APIs for Node.js environment
const mockImageData = (width: number, height: number) => ({
  data: new Uint8ClampedArray(width * height * 4),
  width,
  height,
})

describe('GIF Export', () => {
  describe('SimpleGIFEncoder', () => {
    it('should create encoder with dimensions', () => {
      const encoder = new SimpleGIFEncoder(100, 100)
      expect(encoder).toBeDefined()
    })

    it('should add frames to encoder', () => {
      const encoder = new SimpleGIFEncoder(10, 10)
      const imageData = mockImageData(10, 10)

      // Should not throw
      expect(() => {
        encoder.addFrame(imageData as ImageData, 10)
      }).not.toThrow()
    })

    it('should encode frames to Blob', () => {
      const encoder = new SimpleGIFEncoder(10, 10, 0)
      const imageData = mockImageData(10, 10) as ImageData

      // Fill with some color data
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255 // Red
        imageData.data[i + 1] = 0 // Green
        imageData.data[i + 2] = 0 // Blue
        imageData.data[i + 3] = 255 // Alpha
      }

      encoder.addFrame(imageData, 10)
      encoder.addFrame(imageData, 10)

      const blob = encoder.encode()

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/gif')
      expect(blob.size).toBeGreaterThan(0)
    })

    it('should handle transparent pixels', () => {
      const encoder = new SimpleGIFEncoder(5, 5)
      const imageData = mockImageData(5, 5) as ImageData

      // Set some pixels transparent
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (i < 50) {
          imageData.data[i + 3] = 0 // Transparent
        } else {
          imageData.data[i] = 100
          imageData.data[i + 1] = 100
          imageData.data[i + 2] = 100
          imageData.data[i + 3] = 255 // Opaque
        }
      }

      encoder.addFrame(imageData, 10)
      const blob = encoder.encode()

      expect(blob.size).toBeGreaterThan(0)
    })

    it('should handle multiple different frames', () => {
      const encoder = new SimpleGIFEncoder(10, 10)

      // Frame 1: Red
      const frame1 = mockImageData(10, 10) as ImageData
      for (let i = 0; i < frame1.data.length; i += 4) {
        frame1.data[i] = 255
        frame1.data[i + 1] = 0
        frame1.data[i + 2] = 0
        frame1.data[i + 3] = 255
      }

      // Frame 2: Green
      const frame2 = mockImageData(10, 10) as ImageData
      for (let i = 0; i < frame2.data.length; i += 4) {
        frame2.data[i] = 0
        frame2.data[i + 1] = 255
        frame2.data[i + 2] = 0
        frame2.data[i + 3] = 255
      }

      // Frame 3: Blue
      const frame3 = mockImageData(10, 10) as ImageData
      for (let i = 0; i < frame3.data.length; i += 4) {
        frame3.data[i] = 0
        frame3.data[i + 1] = 0
        frame3.data[i + 2] = 255
        frame3.data[i + 3] = 255
      }

      encoder.addFrame(frame1, 10)
      encoder.addFrame(frame2, 10)
      encoder.addFrame(frame3, 10)

      const blob = encoder.encode()

      expect(blob.size).toBeGreaterThan(0)
    })

    it('should set loop count', () => {
      const infiniteLoop = new SimpleGIFEncoder(10, 10, 0)
      const finiteLoop = new SimpleGIFEncoder(10, 10, 5)

      const imageData = mockImageData(10, 10) as ImageData
      imageData.data.fill(128)

      infiniteLoop.addFrame(imageData, 10)
      finiteLoop.addFrame(imageData, 10)

      const infiniteBlob = infiniteLoop.encode()
      const finiteBlob = finiteLoop.encode()

      // Both should produce valid GIFs
      expect(infiniteBlob.size).toBeGreaterThan(0)
      expect(finiteBlob.size).toBeGreaterThan(0)
    })

    it('should handle varying delays', () => {
      const encoder = new SimpleGIFEncoder(10, 10)
      const imageData = mockImageData(10, 10) as ImageData
      imageData.data.fill(200)

      encoder.addFrame(imageData, 5) // 50ms
      encoder.addFrame(imageData, 10) // 100ms
      encoder.addFrame(imageData, 50) // 500ms

      const blob = encoder.encode()

      expect(blob.size).toBeGreaterThan(0)
    })

    it('should produce valid GIF header', async () => {
      const encoder = new SimpleGIFEncoder(10, 10)
      const imageData = mockImageData(10, 10) as ImageData
      imageData.data.fill(100)

      encoder.addFrame(imageData, 10)

      const blob = encoder.encode()
      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // GIF89a header
      expect(bytes[0]).toBe(0x47) // G
      expect(bytes[1]).toBe(0x49) // I
      expect(bytes[2]).toBe(0x46) // F
      expect(bytes[3]).toBe(0x38) // 8
      expect(bytes[4]).toBe(0x39) // 9
      expect(bytes[5]).toBe(0x61) // a
    })

    it('should produce valid GIF trailer', async () => {
      const encoder = new SimpleGIFEncoder(10, 10)
      const imageData = mockImageData(10, 10) as ImageData
      imageData.data.fill(100)

      encoder.addFrame(imageData, 10)

      const blob = encoder.encode()
      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // GIF trailer
      expect(bytes[bytes.length - 1]).toBe(0x3b)
    })

    it('should handle many colors in a single frame', () => {
      const encoder = new SimpleGIFEncoder(50, 50)
      const imageData = mockImageData(50, 50) as ImageData

      // Fill with many different colors
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = (i * 7) % 256
        imageData.data[i + 1] = (i * 11) % 256
        imageData.data[i + 2] = (i * 13) % 256
        imageData.data[i + 3] = 255
      }

      encoder.addFrame(imageData, 10)
      const blob = encoder.encode()

      expect(blob.size).toBeGreaterThan(0)
    })
  })
})
