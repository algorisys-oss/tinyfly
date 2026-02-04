import { createMemo, onMount, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import './playback-controls.css'

interface PlaybackControlsProps {
  store: EditorStore
}

export const PlaybackControls: Component<PlaybackControlsProps> = (props) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const milliseconds = Math.floor(ms % 1000)
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}`
  }

  const currentTimeFormatted = createMemo(() =>
    formatTime(props.store.currentTime())
  )

  const durationFormatted = createMemo(() =>
    formatTime(props.store.duration())
  )

  const handleSeek = (e: Event) => {
    const input = e.target as HTMLInputElement
    const time = parseFloat(input.value)
    props.store.seek(time)
  }

  // Keyboard shortcuts for undo/redo
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        props.store.redo()
      } else {
        props.store.undo()
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
      e.preventDefault()
      props.store.redo()
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return (
    <div class="playback-controls">
      <div class="history-buttons">
        <button
          class="control-btn"
          onClick={() => props.store.undo()}
          disabled={!props.store.canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"
              fill="currentColor"
            />
          </svg>
        </button>

        <button
          class="control-btn"
          onClick={() => props.store.redo()}
          disabled={!props.store.canRedo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div class="playback-buttons">
        <button
          class="control-btn"
          onClick={() => props.store.stop()}
          title="Stop"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <rect x="6" y="6" width="12" height="12" fill="currentColor" />
          </svg>
        </button>

        <button
          class="control-btn play-btn"
          onClick={() =>
            props.store.isPlaying() ? props.store.pause() : props.store.play()
          }
          title={props.store.isPlaying() ? 'Pause' : 'Play'}
        >
          <span class="play-icon">{props.store.isPlaying() ? '❚❚' : '▶'}</span>
        </button>
      </div>

      <div class="time-display">
        <span class="current-time">{currentTimeFormatted()}</span>
        <span class="time-separator">/</span>
        <span class="duration">{durationFormatted()}</span>
      </div>

      <div class="seek-bar">
        <input
          type="range"
          min="0"
          max={props.store.duration() || 1000}
          value={props.store.currentTime()}
          onInput={handleSeek}
          class="seek-slider"
        />
      </div>
    </div>
  )
}

export default PlaybackControls
