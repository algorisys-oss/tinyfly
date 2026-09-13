import { Router, Route, Navigate } from '@solidjs/router'
import { createSignal, lazy, Show } from 'solid-js'
import { LandingPage } from './landing'
import { Splash } from './splash'

// Everything but the landing page loads when first visited, so tinyfly.app's
// front page does not download the editor, the exporters or the docs.
const Editor = lazy(() => import('./editor').then((m) => ({ default: m.Editor })))
const ExamplesPage = lazy(() => import('./examples/examples-page').then((m) => ({ default: m.ExamplesPage })))
const ShowcasePage = lazy(() => import('./examples/showcase-page').then((m) => ({ default: m.ShowcasePage })))
const DocsViewer = lazy(() => import('./docs').then((m) => ({ default: m.DocsViewer })))

/** The splash belongs to the editor; the landing page and the rest open straight away. */
const opensInEditor = () => window.location.pathname === '/app' || window.location.pathname.startsWith('/app/')

function App() {
  const [showSplash, setShowSplash] = createSignal(opensInEditor())

  return (
    <>
      <Show when={showSplash()}>
        <Splash duration={3000} onComplete={() => setShowSplash(false)} />
      </Show>
      <Show when={!showSplash()}>
        <Router>
          <Route path="/" component={LandingPage} />
          <Route path="/app" component={Editor} />
          <Route path="/examples" component={ExamplesPage} />
          <Route path="/showcase/:id" component={ShowcasePage} />
          {/* The gallery and the editor's Samples dialog merged into /examples. */}
          <Route path="/gallery" component={() => <Navigate href="/examples" />} />
          <Route path="/docs/:page?" component={DocsViewer} />
        </Router>
      </Show>
    </>
  )
}

export default App
