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
        <button
          type="button"
          class="status-bar-version"
          title="Reload the app (fetches the latest build)"
          aria-label={`Version ${__APP_VERSION__} — click to hard reload`}
          onClick={hardReload}
        >
          <svg
            class="status-bar-version-icon"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          <span class="status-bar-version-label">v{__APP_VERSION__}</span>
        </button>
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
