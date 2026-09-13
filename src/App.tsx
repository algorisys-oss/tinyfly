import { Router, Route, Navigate } from '@solidjs/router'
import { createSignal, Show } from 'solid-js'
import { Editor } from './editor'
import { ExamplesPage } from './examples'
import { DocsViewer } from './docs'
import { Splash } from './splash'

function App() {
  const [showSplash, setShowSplash] = createSignal(true)

  return (
    <>
      <Show when={showSplash()}>
        <Splash
          duration={3000}
          onComplete={() => setShowSplash(false)}
        />
      </Show>
      <Show when={!showSplash()}>
        <Router>
          <Route path="/" component={Editor} />
          <Route path="/examples" component={ExamplesPage} />
          {/* The gallery and the editor's Samples dialog merged into /examples. */}
          <Route path="/gallery" component={() => <Navigate href="/examples" />} />
          <Route path="/docs" component={DocsViewer} />
        </Router>
      </Show>
    </>
  )
}

export default App
