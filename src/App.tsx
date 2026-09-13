import { Router, Route, Navigate } from '@solidjs/router'
import { createSignal, lazy, Show } from 'solid-js'
import { LandingPage } from './landing'
import { Splash } from './splash'

// Everything but the landing page loads when first visited, so tinyfly.app's
// front page does not download the editor, the exporters or the docs.
const Editor = lazy(() => import('./editor').then((m) => ({ default: m.Editor })))
const ExamplesPage = lazy(() => import('./examples/examples-page').then((m) => ({ default: m.ExamplesPage })))
const ExamplePage = lazy(() => import('./examples/example-page').then((m) => ({ default: m.ExamplePage })))
const ShowcasePage = lazy(() => import('./examples/showcase-page').then((m) => ({ default: m.ShowcasePage })))
const DocsViewer = lazy(() => import('./docs').then((m) => ({ default: m.DocsViewer })))
const LearnHome = lazy(() => import('./learn').then((m) => ({ default: m.LearnHome })))
const LearnStep = lazy(() => import('./learn').then((m) => ({ default: m.LearnStep })))

/** The splash belongs to the editor; the landing page and the rest open straight away. */
const opensInEditor = () => /^\/(studio|app)(\/|$)/.test(window.location.pathname)

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
          <Route path="/studio" component={Editor} />
          {/* The editor was at /app in v0.56–v0.58; keep those links (and ?example=) working. */}
          <Route path="/app" component={() => <Navigate href={`/studio${window.location.search}`} />} />
          <Route path="/examples" component={ExamplesPage} />
          <Route path="/examples/:id" component={ExamplePage} />
          <Route path="/showcase/:id" component={ShowcasePage} />
          {/* The gallery and the editor's Samples dialog merged into /examples. */}
          <Route path="/gallery" component={() => <Navigate href="/examples" />} />
          <Route path="/docs/:page?" component={DocsViewer} />
          <Route path="/learn" component={LearnHome} />
          <Route path="/learn/:module/:lesson/:step?" component={LearnStep} />
        </Router>
      </Show>
    </>
  )
}

export default App
