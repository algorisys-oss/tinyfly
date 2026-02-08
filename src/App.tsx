import { Router, Route } from '@solidjs/router'
import { createSignal, Show } from 'solid-js'
import { Editor } from './editor'
import { Gallery } from './gallery'
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
          <Route path="/gallery" component={Gallery} />
          <Route path="/docs" component={DocsViewer} />
        </Router>
      </Show>
    </>
  )
}

export default App
