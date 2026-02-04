import { createSignal, For } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import './track-panel.css'

interface TrackPanelProps {
  store: EditorStore
}

export const TrackPanel: Component<TrackPanelProps> = (props) => {
  const [showAddForm, setShowAddForm] = createSignal(false)
  const [newTarget, setNewTarget] = createSignal('')
  const [newProperty, setNewProperty] = createSignal('')

  const handleAddTrack = () => {
    const target = newTarget().trim()
    const property = newProperty().trim()

    if (!target || !property) return

    const id = `${target}-${property}-${Date.now()}`
    props.store.addTrack({
      id,
      target,
      property,
      keyframes: [
        { time: 0, value: 0 },
        { time: props.store.duration() || 1000, value: 1 },
      ],
    })

    // Reset form
    setNewTarget('')
    setNewProperty('')
    setShowAddForm(false)
  }

  const handleRemoveTrack = (trackId: string) => {
    props.store.removeTrack(trackId)
  }

  return (
    <div class="track-panel">
      <div class="panel-header">
        <span>Tracks</span>
        <button
          class="add-btn"
          onClick={() => setShowAddForm(!showAddForm())}
          title={showAddForm() ? 'Cancel' : 'Add Track'}
        >
          {showAddForm() ? '×' : '+'}
        </button>
      </div>

      <div class="panel-content">
        {showAddForm() && (
          <div class="add-track-form">
            <input
              type="text"
              placeholder="Target (e.g., box)"
              value={newTarget()}
              onInput={(e) => setNewTarget(e.currentTarget.value)}
            />
            <input
              type="text"
              placeholder="Property (e.g., opacity)"
              value={newProperty()}
              onInput={(e) => setNewProperty(e.currentTarget.value)}
            />
            <button class="confirm-btn" onClick={handleAddTrack}>
              Add Track
            </button>
          </div>
        )}

        <div class="track-list">
          <For each={props.store.tracks()}>
            {(track) => (
              <div
                class="track-item"
                classList={{ selected: props.store.state.selectedTrackId === track.id }}
                onClick={() => props.store.selectTrack(track.id)}
              >
                <div class="track-info">
                  <span class="track-target">{track.target}</span>
                  <span class="track-property">{track.property}</span>
                </div>
                <div class="track-meta">
                  <span class="keyframe-count">{track.keyframes.length} kf</span>
                  <button
                    class="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTrack(track.id)
                    }}
                    title="Remove track"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </For>

          {props.store.tracks().length === 0 && (
            <div class="empty-state">
              <p>No tracks yet</p>
              <p class="hint">Click + to add a track</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrackPanel
