/**
 * Minimal GIF89a reader used by the export tests.
 *
 * This exists so the encoder is verified by actually decoding its output back to
 * pixels rather than by asserting the blob is non-empty. It supports only what
 * our encoder emits: full-canvas frames with local colour tables.
 */

export interface DecodedFrame {
  /** RGBA pixels, `width * height * 4` bytes. */
  rgba: Uint8Array
  /** Delay in centiseconds. */
  delay: number
  /** Transparent colour index, or -1 when the frame is opaque. */
  transparentIndex: number
  /** Disposal method from the graphic control extension. */
  disposal: number
}

export interface DecodedGIF {
  width: number
  height: number
  loops: number
  frames: DecodedFrame[]
}

/** LZW-decompress GIF image data back into palette indices. */
function lzwDecode(data: Uint8Array, minCodeSize: number, pixelCount: number): Uint8Array {
  const clearCode = 1 << minCodeSize
  const endCode = clearCode + 1

  const out = new Uint8Array(pixelCount)
  let outPos = 0

  let dictionary: number[][] = []
  const resetDictionary = () => {
    dictionary = []
    for (let i = 0; i < clearCode; i++) dictionary.push([i])
    dictionary.push([]) // clear
    dictionary.push([]) // end
  }
  resetDictionary()

  let codeSize = minCodeSize + 1
  let acc = 0
  let accBits = 0
  let pos = 0
  let previous: number[] | null = null

  while (outPos < pixelCount) {
    while (accBits < codeSize) {
      if (pos >= data.length) return out
      acc |= data[pos++] << accBits
      accBits += 8
    }
    const code = acc & ((1 << codeSize) - 1)
    acc >>= codeSize
    accBits -= codeSize

    if (code === clearCode) {
      resetDictionary()
      codeSize = minCodeSize + 1
      previous = null
      continue
    }
    if (code === endCode) break

    let entry: number[]
    if (code < dictionary.length) {
      entry = dictionary[code]
    } else if (previous) {
      // The classic KwKwK case: the code refers to the entry being built.
      entry = [...previous, previous[0]]
    } else {
      break
    }

    for (const index of entry) {
      if (outPos < pixelCount) out[outPos++] = index
    }

    if (previous) {
      dictionary.push([...previous, entry[0]])
      // We trail the encoder by one entry, so compare against length + 1.
      if (dictionary.length + 1 >= 1 << codeSize && codeSize < 12) codeSize++
    }
    previous = entry
  }

  return out
}

/** Concatenate a chain of GIF sub-blocks starting at `pos`. */
function readSubBlocks(bytes: Uint8Array, pos: number): { data: Uint8Array; next: number } {
  const chunks: Uint8Array[] = []
  let total = 0
  while (bytes[pos] !== 0x00) {
    const len = bytes[pos]
    chunks.push(bytes.subarray(pos + 1, pos + 1 + len))
    total += len
    pos += 1 + len
  }
  const data = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    data.set(chunk, offset)
    offset += chunk.length
  }
  return { data, next: pos + 1 }
}

export function decodeGIF(bytes: Uint8Array): DecodedGIF {
  const signature = String.fromCharCode(...bytes.subarray(0, 6))
  if (signature !== 'GIF89a' && signature !== 'GIF87a') {
    throw new Error(`Not a GIF: ${signature}`)
  }

  const width = bytes[6] | (bytes[7] << 8)
  const height = bytes[8] | (bytes[9] << 8)
  const packed = bytes[10]
  let pos = 13

  let globalTable: Uint8Array | null = null
  if (packed & 0x80) {
    const size = 2 << (packed & 0x07)
    globalTable = bytes.subarray(pos, pos + size * 3)
    pos += size * 3
  }

  const frames: DecodedFrame[] = []
  let loops = 0
  let delay = 0
  let transparentIndex = -1
  let disposal = 0

  while (pos < bytes.length) {
    const marker = bytes[pos]

    if (marker === 0x3b) break // trailer

    if (marker === 0x21) {
      const label = bytes[pos + 1]
      if (label === 0xf9) {
        // Graphic control extension
        const flags = bytes[pos + 3]
        disposal = (flags >> 2) & 0x07
        transparentIndex = flags & 0x01 ? bytes[pos + 6] : -1
        delay = bytes[pos + 4] | (bytes[pos + 5] << 8)
        pos += 8
      } else if (label === 0xff) {
        // Application extension — read the NETSCAPE loop count.
        const name = String.fromCharCode(...bytes.subarray(pos + 3, pos + 11))
        const blocks = readSubBlocks(bytes, pos + 14)
        if (name === 'NETSCAPE') {
          loops = bytes[pos + 16] | (bytes[pos + 17] << 8)
        }
        pos = blocks.next
      } else {
        pos = readSubBlocks(bytes, pos + 2).next
      }
      continue
    }

    if (marker === 0x2c) {
      const fw = bytes[pos + 5] | (bytes[pos + 6] << 8)
      const fh = bytes[pos + 7] | (bytes[pos + 8] << 8)
      const framePacked = bytes[pos + 9]
      pos += 10

      let table = globalTable
      if (framePacked & 0x80) {
        const size = 2 << (framePacked & 0x07)
        table = bytes.subarray(pos, pos + size * 3)
        pos += size * 3
      }
      if (!table) throw new Error('Frame has no colour table')

      const minCodeSize = bytes[pos]
      const { data, next } = readSubBlocks(bytes, pos + 1)
      pos = next

      const indices = lzwDecode(data, minCodeSize, fw * fh)
      const rgba = new Uint8Array(fw * fh * 4)
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i]
        if (index === transparentIndex) continue // leave RGBA at 0
        rgba[i * 4] = table[index * 3]
        rgba[i * 4 + 1] = table[index * 3 + 1]
        rgba[i * 4 + 2] = table[index * 3 + 2]
        rgba[i * 4 + 3] = 255
      }

      frames.push({ rgba, delay, transparentIndex, disposal })
      continue
    }

    throw new Error(`Unexpected GIF block 0x${marker.toString(16)} at ${pos}`)
  }

  return { width, height, loops, frames }
}
