// @vitest-environment happy-dom
// Solid's effects are live only in its client build, which resolves under the
// browser conditions set in vitest.config.ts together with this DOM environment.
import { describe, it, expect } from 'vitest'
import { createRoot, createEffect, createSignal } from 'solid-js'

/**
 * Guards the auto-save (and thumbnail) effects in `editor.tsx`.
 *
 * Those effects skip a run while a scene/project switch is in flight, using a
 * plain `isSwitchingScene` boolean. Solid re-tracks an effect's dependencies on
 * every run, so *where* that guard sits is load-bearing: a run that returns
 * before reading any signal leaves the effect with zero dependencies and never
 * runs again. The flag is a plain variable rather than a signal, so nothing
 * re-arms it either — auto-save would stay dead for the rest of the session and
 * edits would only reach storage on an explicit Save.
 *
 * These tests pin both halves: guard-before-read is broken, guard-after-read is
 * what `editor.tsx` must keep doing.
 */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

function harness(placement: 'before-reads' | 'after-reads') {
  return createRoot((dispose) => {
    const [version, setVersion] = createSignal(0)
    let switching = false
    const saves: number[] = []

    createEffect(() => {
      if (placement === 'before-reads') {
        if (switching) return
        saves.push(version())
      } else {
        const v = version()
        if (switching) return
        saves.push(v)
      }
    })

    return {
      saves,
      bump: () => setVersion((v) => v + 1),
      setSwitching: (v: boolean) => (switching = v),
      dispose,
    }
  })
}

/**
 * Reproduce a scene/project switch: the flag is up while the switch writes its
 * signals, and the effect flushes before the flag comes back down.
 */
async function switchWhileFlagIsUp(h: ReturnType<typeof harness>) {
  h.setSwitching(true)
  h.bump()
  await tick() // the effect flushes here, mid-switch
  h.setSwitching(false)
}

describe('auto-save effect keeps its subscription across a scene switch', () => {
  it('drops all dependencies when the guard runs before the signal reads', async () => {
    const h = harness('before-reads')
    await tick()
    expect(h.saves.length).toBeGreaterThan(0) // saves normally at first

    await switchWhileFlagIsUp(h)

    const before = h.saves.length
    h.bump() // an ordinary edit after the switch
    await tick()
    expect(h.saves.length).toBe(before) // never saves again — the bug

    h.dispose()
  })

  it('keeps saving after the switch when the reads come first', async () => {
    const h = harness('after-reads')
    await tick()
    const initial = h.saves.length
    expect(initial).toBeGreaterThan(0)

    await switchWhileFlagIsUp(h)

    const before = h.saves.length
    h.bump() // an ordinary edit after the switch
    await tick()
    expect(h.saves.length).toBe(before + 1) // still subscribed

    h.dispose()
  })
})
