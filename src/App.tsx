import { Router, Route } from '@solidjs/router'
import { Editor } from './editor'
import { Gallery } from './gallery'

function App() {
  return (
    <Router>
      <Route path="/" component={Editor} />
      <Route path="/gallery" component={Gallery} />
    </Router>
  )
}

export default App
