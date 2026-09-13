/**
 * The engine inside each browser: determinism, text scramble and inertia, and
 * the path parser measured against the browser's own SVG geometry.
 */
export default {
  name: 'engine',
  async run({ page, base }) {
    await page.goto(`${base}/e2e/harness.html`)
    const out = await page.evaluate(async () => {
      const engine = await import('/src/engine/index.ts')
      const results = []

      // Determinism: the same timeline sampled twice, and backwards, matches.
      const tl = new engine.Timeline({
        id: 't',
        tracks: [
          { id: 'x', target: 'a', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 100, easing: 'ease-in-out-cubic' }] },
          { id: 'c', target: 'a', property: 'fill', keyframes: [{ time: 0, value: '#ff0000' }, { time: 1000, value: '#0000ff' }] },
          { id: 't', target: 'a', property: 'text', textConfig: { from: 'AAAA', to: 'BBBB', mode: 'scramble', seed: 3 }, keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }] },
          { id: 'i', target: 'b', property: 'x', kind: 'inertia', inertia: { from: 0, velocity: 700, end: 100 } },
        ],
      })
      const sample = (ms) => JSON.stringify([...tl.getStateAtTime(ms).values].map(([k, v]) => [k, [...v]]))
      const forward = [100, 400, 700].map(sample)
      const backward = [700, 400, 100].map(sample).reverse()
      results.push({ label: 'timeline evaluation is deterministic in any order', ok: forward.join() === backward.join() })
      results.push({ label: 'inertia rests on its snap point', ok: tl.getStateAtTime(5000).values.get('b').get('x') === 200 })

      // Path parser vs the browser's native geometry.
      const paths = [
        'M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80',
        'M10 10 Q 50 90 90 10 T 170 10',
        'M20 50 A30 30 0 1 1 80 50 A30 30 0 1 1 20 50 Z',
        'M0,0l10-10l10,10h20v-20z',
        'M10 10 H 90 V 90 H 10 Z M30 30 L70 30 L70 70 L30 70 Z',
      ]
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      document.body.appendChild(svg)
      let worstLength = 0
      let worstPoint = 0
      for (const d of paths) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        node.setAttribute('d', d)
        svg.appendChild(node)
        const native = node.getTotalLength()
        const ours = engine.getPathLength(d)
        worstLength = Math.max(worstLength, Math.abs(native - ours) / native)
        for (const p of [0.13, 0.5, 0.87]) {
          const a = node.getPointAtLength(native * p)
          const b = engine.getPointAtProgress(d, p)
          worstPoint = Math.max(worstPoint, Math.hypot(a.x - b.x, a.y - b.y))
        }
      }
      results.push({ label: 'path lengths match native getTotalLength', ok: worstLength < 0.005, detail: `worst ${(worstLength * 100).toFixed(3)}%` })
      results.push({ label: 'points along paths match native getPointAtLength', ok: worstPoint < 1, detail: `worst ${worstPoint.toFixed(3)}px` })

      // structuredClone of project-like data (the editor's persistence relies on it).
      const project = { tracks: tl.toDefinition().tracks, when: new Date(0), nested: { list: [1, 2, 3] } }
      let cloned = null
      try { cloned = structuredClone(project) } catch (e) { cloned = String(e) }
      results.push({ label: 'structuredClone of a timeline definition', ok: typeof cloned === 'object' && JSON.stringify(cloned.tracks) === JSON.stringify(project.tracks) })
      return results
    })
    return out
  },
}
