/**
 * Exports in each browser. GIF is pure JavaScript and must work everywhere;
 * WebP and MP4 depend on browser encoders, so missing support is a note.
 */
export default {
  name: 'exports',
  async run({ page, base }) {
    await page.goto(`${base}/e2e/harness.html`)
    return page.evaluate(async () => {
      const engine = { ...(await import('/src/engine/index.ts')), ...(await import('/src/engine/export/index.ts')) }
      const timeline = new engine.Timeline({
        id: 'x',
        tracks: [{ id: 'x', target: 'dot', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 300, value: 60 }] }],
      })
      // GIF and WebP pass the frame's values; MP4 passes a time.
      const renderFrame = (ctx, values) => {
        ctx.fillStyle = '#4a9eff'
        ctx.fillRect(Number(values.get('dot')?.get('x') ?? 0), 10, 20, 20)
      }
      const head = async (blob, n) => new TextDecoder('latin1').decode(new Uint8Array(await blob.slice(0, n).arrayBuffer()))
      const results = []

      try {
        const gif = await engine.exportToGIF(timeline, { width: 80, height: 40, frameRate: 10, renderFrame })
        results.push({ label: 'GIF export', ok: (await head(gif, 6)) === 'GIF89a', detail: `${gif.size} bytes` })
      } catch (e) {
        results.push({ label: 'GIF export', ok: false, detail: String(e.message) })
      }

      if (engine.isWebPExportSupported()) {
        try {
          const webp = await engine.exportToWebP(timeline, { width: 80, height: 40, frameRate: 10, renderFrame })
          const bytes = await head(webp, 12)
          results.push({ label: 'WebP export', ok: bytes.startsWith('RIFF') && bytes.slice(8) === 'WEBP', detail: `${webp.size} bytes` })
        } catch (e) {
          results.push({ label: 'WebP export', ok: false, detail: String(e.message) })
        }
      } else {
        results.push({ label: 'WebP export', ok: 'note', detail: 'not supported by this browser (no WebP canvas encoding); the editor hides it' })
      }

      if (engine.isWebCodecsMP4Supported()) {
        try {
          const mp4 = await engine.exportToMP4({ width: 80, height: 40, fps: 10, durationMs: 300, renderFrame: (ctx, t) => renderFrame(ctx, timeline.getStateAtTime(t).values) })
          results.push({ label: 'MP4 export (WebCodecs)', ok: (await head(mp4, 8)).slice(4) === 'ftyp', detail: `${mp4.size} bytes` })
        } catch (e) {
          const unsupported = /codec|support|NotSupported/i.test(String(e.message))
          results.push({ label: 'MP4 export (WebCodecs)', ok: unsupported ? 'note' : false, detail: String(e.message).slice(0, 120) })
        }
      } else {
        results.push({ label: 'MP4 export (WebCodecs)', ok: 'note', detail: 'no VideoEncoder in this browser' })
      }
      return results
    })
  },
}
