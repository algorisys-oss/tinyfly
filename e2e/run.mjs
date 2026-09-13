/**
 * Cross-browser check runner: starts the dev server, runs every check in every
 * requested browser, prints a result table, exits non-zero on any failure.
 */
import { spawn } from 'node:child_process'
import { chromium, firefox, webkit } from 'playwright-core'
import { checks } from './checks/index.mjs'

const PORT = 5177
const BASE = `http://localhost:${PORT}`

const args = process.argv.slice(2)
const option = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}

/**
 * A terminal inside a snap (VS Code installed from the Snap Store) exports GTK and
 * GIO variables pointing into the snap. WebKit's network process then loads GIO
 * modules built against the snap's older glibc and fails every page load with
 * "WebKit encountered an internal error". Launch it without those variables.
 */
function withoutSnapLibraries(env) {
  const snapScoped = ['GIO_MODULE_DIR', 'GTK_PATH', 'GTK_EXE_PREFIX', 'GTK_IM_MODULE_FILE', 'GDK_PIXBUF_MODULE_FILE', 'GDK_PIXBUF_MODULEDIR', 'GSETTINGS_SCHEMA_DIR', 'LOCPATH']
  const clean = { ...env }
  for (const name of snapScoped) {
    if (clean[name]?.includes('/snap/')) delete clean[name]
  }
  return clean
}

const BROWSERS = {
  chromium: () => chromium.launch({ channel: 'chrome', headless: true }),
  firefox: () => firefox.launch({ headless: true }),
  webkit: () => webkit.launch({ headless: true, env: withoutSnapLibraries(process.env) }),
}

const wantedBrowsers = option('browser') ? [option('browser')] : Object.keys(BROWSERS)
const wantedChecks = option('check') ? checks.filter((c) => c.name === option('check')) : checks

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`dev server did not start at ${url}`)
}

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
let exitCode = 0

try {
  await waitForServer(`${BASE}/e2e/harness.html`)

  for (const browserName of wantedBrowsers) {
    let browser
    try {
      browser = await BROWSERS[browserName]()
    } catch (error) {
      // Playwright explains missing system libraries in a boxed message; keep
      // the lines that say what to install.
      const hint = String(error.message)
        .split('\n')
        .map((line) => line.replace(/[║╔╗╚╝═]/g, '').trim())
        .filter((line) => /install|missing|not found/i.test(line))
        .join(' ')
      console.log(`\n${browserName}: could not launch — ${hint || String(error.message).split('\n')[0]}`)
      exitCode = 1
      continue
    }
    console.log(`\n=== ${browserName} ${browser.version()} ===`)

    for (const check of wantedChecks) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
      const page = await context.newPage()
      const pageErrors = []
      page.on('pageerror', (e) => pageErrors.push(e.message))
      page.on('console', (m) => {
        if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) pageErrors.push(m.text())
      })

      let results
      try {
        results = await check.run({ page, context, base: BASE, browserName })
      } catch (error) {
        results = [{ label: 'check threw', ok: false, detail: String(error.message).split('\n')[0] }]
      }
      if (pageErrors.length) {
        results.push({ label: 'no page errors', ok: false, detail: pageErrors.slice(0, 3).join(' | ') })
      }

      for (const r of results) {
        const mark = r.ok === true ? 'PASS' : r.ok === 'note' ? 'NOTE' : 'FAIL'
        if (r.ok === false) exitCode = 1
        console.log(`  ${mark}  ${check.name.padEnd(12)} ${r.label}${r.detail ? ` — ${r.detail}` : ''}`)
      }
      await context.close()
    }
    await browser.close()
  }
} finally {
  server.kill()
}

process.exit(exitCode)
