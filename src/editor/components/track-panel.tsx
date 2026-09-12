import { createSignal, createMemo, For, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import { hasKeyframes } from '../../engine'
import { createCollapsed } from '../utils/use-collapsed'
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

  const conflicts = createMemo(() => props.store.trackConflicts())

  /**
   * Tooltip for a track whose values never reach the screen. The engine
   * resolves overlaps as last-added-wins, so the winner is named here rather
   * than leaving the user to guess why a track does nothing.
   */
  const overrideReason = (trackId: string): string | undefined => {
    const conflict = conflicts().find((c) => c.losingTrackId === trackId)
    if (!conflict) return undefined
    return (
      `Overridden: another track also animates ${conflict.target}.${conflict.property} ` +
      `over the same times. The later track (${conflict.winningTrackId}) wins.`
    )
  }

  const handleRemoveTrack = (trackId: string) => {
    props.store.removeTrack(trackId)
  }

  const [collapsed, toggleCollapsed] = createCollapsed('tinyfly-panel-tracks')

  return (
    <div class="track-panel" classList={{ collapsed: collapsed() }}>
      <div class="panel-header">
        <button class="panel-toggle" onClick={toggleCollapsed} title={collapsed() ? 'Expand' : 'Collapse'}>
          <span class="panel-chevron" classList={{ collapsed: collapsed() }}>▾</span>
          Tracks
        </button>
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

        <Show when={conflicts().length > 0}>
          <div class="track-conflict-banner">
            <span class="track-conflict">⚠</span>
            <span>
              {conflicts().length} overlapping track
              {conflicts().length === 1 ? '' : 's'} — the later track wins, so the
              marked ones have no effect where they overlap.
            </span>
          </div>
        </Show>

        <div class="track-list">
          <For each={props.store.tracks()}>
            {(track) => (
              <div
                class="track-item"
                classList={{
                  selected: props.store.state.selectedTrackId === track.id,
                  overridden: props.store.overriddenTrackIds().has(track.id),
                }}
                onClick={() => props.store.selectTrack(track.id)}
                title={overrideReason(track.id)}
              >
                <div class="track-info">
                  <span class="track-target">{track.target}</span>
                  <span class="track-property">{track.property}</span>
                </div>
                <div class="track-meta">
                  <Show when={props.store.overriddenTrackIds().has(track.id)}>
                    <span class="track-conflict" aria-label="Overridden">⚠</span>
                  </Show>
                  <span class="keyframe-count">
                    {hasKeyframes(track) ? `${track.keyframes.length} kf` : 'spring'}
                  </span>
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
