import type { Component, JSX } from 'solid-js'
import './status-bar.css'

interface StatusBarProps {
  leftContent?: JSX.Element
}

export const StatusBar: Component<StatusBarProps> = (props) => {
  return (
    <div class="status-bar">
      <div class="status-bar-left">
        <span class="status-bar-version">v{__APP_VERSION__}</span>
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
