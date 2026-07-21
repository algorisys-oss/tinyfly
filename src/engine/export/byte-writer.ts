/**
 * Growable byte buffer shared by the binary exporters (GIF, WebP, MP4).
 *
 * Container formats need to append bytes of mixed widths and endianness, and
 * occasionally patch a length back into an earlier offset. Doing that with a
 * plain number array is slow and error-prone, so everything funnels through
 * this one small writer.
 */
export class ByteWriter {
  private buf: Uint8Array<ArrayBuffer>
  private len = 0

  constructor(initialCapacity = 1024) {
    this.buf = new Uint8Array(Math.max(16, initialCapacity))
  }

  /** Bytes written so far — also the offset the next write lands at. */
  get length(): number {
    return this.len
  }

  private ensure(extra: number) {
    if (this.len + extra <= this.buf.length) return
    let size = this.buf.length * 2
    while (size < this.len + extra) size *= 2
    const next = new Uint8Array(size)
    next.set(this.buf.subarray(0, this.len))
    this.buf = next
  }

  byte(value: number): void {
    this.ensure(1)
    this.buf[this.len++] = value & 0xff
  }

  bytes(values: ArrayLike<number>): void {
    this.ensure(values.length)
    this.buf.set(values as Uint8Array, this.len)
    this.len += values.length
  }

  /** Each character's low byte, e.g. a FourCC or an MP4 box type. */
  ascii(text: string): void {
    this.ensure(text.length)
    for (let i = 0; i < text.length; i++) this.buf[this.len++] = text.charCodeAt(i) & 0xff
  }

  uint16LE(value: number): void {
    this.byte(value)
    this.byte(value >> 8)
  }

  uint24LE(value: number): void {
    this.byte(value)
    this.byte(value >> 8)
    this.byte(value >> 16)
  }

  uint32LE(value: number): void {
    this.byte(value)
    this.byte(value >> 8)
    this.byte(value >> 16)
    this.byte(value >> 24)
  }

  uint16BE(value: number): void {
    this.byte(value >> 8)
    this.byte(value)
  }

  uint24BE(value: number): void {
    this.byte(value >> 16)
    this.byte(value >> 8)
    this.byte(value)
  }

  uint32BE(value: number): void {
    this.byte(value >> 24)
    this.byte(value >> 16)
    this.byte(value >> 8)
    this.byte(value)
  }

  /** 64-bit big-endian, written as two 32-bit halves (safe up to 2^53). */
  uint64BE(value: number): void {
    this.uint32BE(Math.floor(value / 2 ** 32))
    this.uint32BE(value >>> 0)
  }

  /** Overwrite a previously written 32-bit big-endian value, e.g. a box size. */
  patchUint32BE(offset: number, value: number): void {
    this.buf[offset] = (value >>> 24) & 0xff
    this.buf[offset + 1] = (value >>> 16) & 0xff
    this.buf[offset + 2] = (value >>> 8) & 0xff
    this.buf[offset + 3] = value & 0xff
  }

  /** Overwrite a previously written 32-bit little-endian value. */
  patchUint32LE(offset: number, value: number): void {
    this.buf[offset] = value & 0xff
    this.buf[offset + 1] = (value >>> 8) & 0xff
    this.buf[offset + 2] = (value >>> 16) & 0xff
    this.buf[offset + 3] = (value >>> 24) & 0xff
  }

  /** A view over the written bytes. Not a copy — do not retain across writes. */
  toUint8Array(): Uint8Array<ArrayBuffer> {
    return this.buf.subarray(0, this.len)
  }

  /** A standalone copy of the written bytes, safe to hand to a Blob. */
  toBytes(): Uint8Array<ArrayBuffer> {
    return this.buf.slice(0, this.len)
  }
}
