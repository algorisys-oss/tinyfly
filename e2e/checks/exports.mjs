/**
 * Exports in each browser. GIF is pure JavaScript and must work everywhere;
 * WebP and MP4 depend on browser encoders, so missing support is a note.
 *
 * MP4 runs in a page of its own: Playwright's Linux WebKit build can crash while
 * its bundled GStreamer starts up (inside WebKit, before any tinyfly code), and a
 * crashed page must not take the other results with it.
 */

/** Shared by both pages: a one-track timeline, a renderer, and a file-header reader. */
async function setUp() {
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
  return { engine, timeline, renderFrame, head }
}

async function imageExports() {
  const { engine, timeline, renderFrame, head } = await setUp()
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
  return results
}

async function videoExport() {
  const { engine, timeline, renderFrame, head } = await setUp()
  const label = 'MP4 export (WebCodecs)'
  if (!engine.isWebCodecsMP4Supported()) return { label, ok: 'note', detail: 'no VideoEncoder in this browser' }

  try {
    const mp4 = await engine.exportToMP4({
      width: 80,
      height: 40,
      fps: 10,
      durationMs: 300,
      renderFrame: (ctx, t) => renderFrame(ctx, timeline.getStateAtTime(t).values),
    })
    return { label, ok: (await head(mp4, 8)).slice(4) === 'ftyp', detail: `${mp4.size} bytes` }
  } catch (e) {
    const unsupported = /codec|support|NotSupported/i.test(String(e.message))
    return { label, ok: unsupported ? 'note' : false, detail: String(e.message).slice(0, 120) }
  }
}

export default {
  name: 'exports',
  async run({ page, context, base, browserName }) {
    // Functions are passed as source, so each page defines the helper it needs.
    const inPage = (fn) => `(async () => { ${setUp.toString()}; return (${fn.toString()})() })()`

    await page.goto(`${base}/e2e/harness.html`)
    const results = await page.evaluate(inPage(imageExports))

    const videoPage = await context.newPage()
    let crashed = false
    videoPage.on('crash', () => (crashed = true))
    try {
      await videoPage.goto(`${base}/e2e/harness.html`)
      results.push(await videoPage.evaluate(inPage(videoExport)))
    } catch (error) {
      if (!crashed) throw error
      results.push({
        label: 'MP4 export (WebCodecs)',
        ok: browserName === 'webkit' ? 'note' : false,
        detail: "the page crashed starting the browser's video encoder (a known GStreamer crash in Playwright's Linux WebKit, outside tinyfly)",
      })
    } finally {
      await videoPage.close().catch(() => {})
    }
    return results
  },
}
