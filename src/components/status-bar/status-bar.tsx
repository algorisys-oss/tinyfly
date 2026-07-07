import type { Component, JSX } from 'solid-js'
import './status-bar.css'

interface StatusBarProps {
  leftContent?: JSX.Element
}

export const StatusBar: Component<StatusBarProps> = (props) => {
  /** Force a full reload that bypasses the cache so the latest build is fetched. */
  const hardReload = () => {
    // Cache-busting query param guarantees a fresh document + assets.
    const url = new URL(window.location.href)
    url.searchParams.set('_r', Date.now().toString())
    window.location.replace(url.toString())
  }

  return (
    <div class="status-bar">
      <div class="status-bar-left">
        <span
          class="status-bar-version"
          role="button"
          tabindex="0"
          title="Click to hard reload the app"
          onClick={hardReload}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              hardReload()
            }
          }}
        >
          v{__APP_VERSION__}
        </span>
        {props.leftContent}
      </div>
      <div class="status-bar-right">
        Developed with <span class="status-bar-heart">&#9829;</span> by{' '}
        <a
          href="https://github.com/algorisys-oss/tinyfly"
          target="_blank"
          rel="noopener noreferrer"
        >
          Algorisys OSS Team
        </a>
      </div>
    </div>
  )
}
