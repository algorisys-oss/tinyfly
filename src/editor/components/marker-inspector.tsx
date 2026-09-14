import { For, Show, createSignal, createEffect, on } from 'solid-js'
import type { Component } from 'solid-js'
import type { TimelineMarker } from '../../engine'
import type { EditorStore } from '../stores/editor-store'
import './marker-inspector.css'

/**
 * Properties for the selected step (timeline marker): its id, time and label,
 * whether playback pauses there, the question it asks, and its caption in each
 * language. Edits go through the editor store, so each one is a single undo step.
 *
 * Text fields commit when they lose focus or on Enter, not on every key press, so
 * typing a caption is one undo step rather than one per letter.
 */
export const MarkerInspector: Component<{ store: EditorStore; marker: TimelineMarker }> = (props) => {
  const [idError, setIdError] = createSignal<string | undefined>()
  const [newLanguage, setNewLanguage] = createSignal('')
  const [languageError, setLanguageError] = createSignal<string | undefined>()

  createEffect(on(() => props.marker.id, () => setIdError(undefined)))

  const steps = () => props.store.markers()
  const index = () => steps().findIndex((marker) => marker.id === props.marker.id)

  const commit = (patch: Parameters<EditorStore['updateMarker']>[1]) => props.store.updateMarker(props.marker.id, patch)

  /** Enter in a single-line field commits it (by blurring, which fires `change`). */
  const onEnterBlur = (event: KeyboardEvent) => {
    if (event.key === 'Enter') (event.currentTarget as HTMLElement).blur()
  }

  const addLanguage = () => {
    const added = props.store.addCaptionLanguage(newLanguage())
    if (!added) {
      setLanguageError('Use a language tag such as es, pt-BR or zh-CN.')
      return
    }
    setLanguageError(undefined)
    setNewLanguage('')
  }

  const missingIn = () =>
    props.store.captionLanguages().filter((language) => !props.store.captions()?.[language]?.[props.marker.id])

  return (
    <div class="marker-inspector">
      <div class="property-section">
        <h4>
          Step {index() + 1} of {steps().length}
        </h4>
        <div class="marker-nav">
          <button class="secondary-button" disabled={index() <= 0} onClick={() => goTo(-1)} title="Previous step ([)">
            ◀ Previous
          </button>
          <button class="secondary-button" disabled={index() >= steps().length - 1} onClick={() => goTo(1)} title="Next step (])">
            Next ▶
          </button>
        </div>

        <div class="property-row">
          <label for="marker-label">Label</label>
          <input
            id="marker-label"
            type="text"
            value={props.marker.label ?? ''}
            placeholder="What this step shows"
            onChange={(event) => commit({ label: event.currentTarget.value })}
            onKeyDown={onEnterBlur}
          />
        </div>
        <div class="property-row">
          <label for="marker-time">Time (ms)</label>
          <input
            id="marker-time"
            type="number"
            min="0"
            step="10"
            value={props.marker.time}
            onChange={(event) => {
              const value = Number(event.currentTarget.value)
              if (Number.isFinite(value)) {
                commit({ time: value })
                props.store.seek(Math.max(0, Math.min(props.store.duration(), value)))
              }
            }}
            onKeyDown={onEnterBlur}
          />
        </div>
        <div class="property-row">
          <label for="marker-id">Id</label>
          <input
            id="marker-id"
            type="text"
            value={props.marker.id}
            spellcheck={false}
            aria-invalid={idError() ? 'true' : undefined}
            onChange={(event) => {
              const error = commit({ id: event.currentTarget.value })
              setIdError(error)
              if (error) event.currentTarget.value = props.marker.id
            }}
            onKeyDown={onEnterBlur}
          />
        </div>
        <Show when={idError()}>
          <p class="marker-error" role="alert">
            {idError()}
          </p>
        </Show>
        <p class="property-hint">Captions and links refer to a step by its id.</p>
      </div>

      <div class="property-section">
        <h4>Predict, then reveal</h4>
        <label class="marker-check">
          <input type="checkbox" checked={props.marker.pause === true} onChange={(event) => commit({ pause: event.currentTarget.checked })} />
          Pause here, even when playing through
        </label>
        <div class="marker-field">
          <label for="marker-question">Question</label>
          <textarea
            id="marker-question"
            rows={2}
            value={props.marker.question ?? ''}
            placeholder="e.g. What does len(s) print now?"
            onChange={(event) => {
              const question = event.currentTarget.value
              commit(question.trim() && !props.marker.pause ? { question, pause: true } : { question })
            }}
          />
        </div>
        <p class="property-hint">A question pauses playback here and waits for Reveal in the embed controls.</p>
      </div>

      <div class="property-section">
        <h4>Captions</h4>
        <Show when={props.store.captionLanguages().length === 0}>
          <p class="property-hint">The label is the caption. Add a language to translate it.</p>
        </Show>
        <For each={props.store.captionLanguages()}>
          {(language) => (
            <div class="marker-caption">
              <div class="marker-caption-head">
                <span class="marker-language">{language}</span>
                <button
                  class="marker-remove-language"
                  title={`Remove ${language} captions from every step`}
                  aria-label={`Remove ${language} captions`}
                  onClick={() => props.store.deleteCaptionLanguage(language)}
                >
                  ×
                </button>
              </div>
              <textarea
                rows={2}
                lang={language}
                aria-label={`${language} caption`}
                value={props.store.captions()?.[language]?.[props.marker.id] ?? ''}
                placeholder={props.marker.label ?? ''}
                onChange={(event) => props.store.setMarkerCaption(language, props.marker.id, event.currentTarget.value)}
              />
            </div>
          )}
        </For>
        <div class="property-row marker-add-language">
          <input
            type="text"
            value={newLanguage()}
            placeholder="Add language (es, pt-BR…)"
            aria-label="Language to add"
            onInput={(event) => setNewLanguage(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addLanguage()
            }}
          />
          <button class="secondary-button" onClick={addLanguage} disabled={newLanguage().trim() === ''}>
            Add
          </button>
        </div>
        <Show when={languageError()}>
          <p class="marker-error" role="alert">
            {languageError()}
          </p>
        </Show>
        <Show when={missingIn().length > 0}>
          <p class="property-hint">
            Missing here: {missingIn().join(', ')}. The label is shown instead.
          </p>
        </Show>
      </div>

      <div class="property-actions">
        <button class="delete-btn" onClick={() => props.store.deleteMarker(props.marker.id)}>
          Delete Step
        </button>
      </div>
    </div>
  )

  function goTo(direction: 1 | -1) {
    const next = steps()[index() + direction]
    if (!next) return
    props.store.selectMarker(next.id)
    props.store.pause()
    props.store.seek(next.time)
  }
}
