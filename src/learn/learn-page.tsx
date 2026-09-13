import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { A, Navigate, useNavigate, useParams } from '@solidjs/router'
import { BrandMark } from '../components/brand-mark'
import { renderMarkdown } from '../docs/markdown'
import { allSteps, course, findStep, stepKey } from './course'
import { checkStep, runStep, type CheckResult, type RunResult } from './runner'
import { completedSteps, draftFor, markCompleted, resetProgress, saveDraft } from './progress'
import './learn-page.css'

/** Modules planned for the course, shown on the map until they are written. */
const COMING = [
  'The editor: build it visually, compare the JSON',
  'Motion craft: overlap, anticipation, springs',
  'Text and SVG: split text, drawSVG, morphing',
  'Interaction: hover, drag, Flip, canvas',
  'Scroll: triggers, scrub, pinning, snap',
  'Accessibility and performance',
  'Capstone: build an award-style landing page',
]

const LearnHeader: Component<{ trail?: string }> = (props) => (
  <header class="learn-header">
    <A href="/" class="learn-brand" aria-label="tinyfly home">
      <BrandMark size={24} />
    </A>
    <A href="/learn" class="learn-title">
      Learn
    </A>
    <Show when={props.trail}>
      <span class="learn-trail">{props.trail}</span>
    </Show>
    <nav class="learn-links">
      <A href="/examples">Examples</A>
      <A href="/docs/gsap-compat">Docs</A>
      <A href="/studio">Editor</A>
    </nav>
  </header>
)

/** `/learn`: the course map. */
export const LearnHome: Component = () => {
  const [done, setDone] = createSignal(completedSteps())
  const nextStep = () => allSteps.find((location) => !done().has(stepKey(location))) ?? allSteps[0]
  const started = () => done().size > 0

  return (
    <div class="learn">
      <LearnHeader />
      <main class="learn-home">
        <section class="learn-intro">
          <h1>Learn tinyfly</h1>
          <p>
            Short, hands-on steps: read a little, change the code, watch it move. Each step checks your work, from
            your first tween to pages that move like award winners.
          </p>
          <div class="learn-intro-actions">
            <A class="learn-button learn-button-primary" href={`/learn/${stepKey(nextStep())}`}>
              {started() ? 'Continue' : 'Start the course'}
            </A>
            <Show when={started()}>
              <button
                class="learn-button"
                onClick={() => {
                  resetProgress()
                  setDone(completedSteps())
                }}
              >
                Reset progress
              </button>
            </Show>
          </div>
        </section>

        <For each={course}>
          {(module) => (
            <section class="learn-module">
              <h2>{module.title}</h2>
              <p>{module.summary}</p>
              <ol class="learn-lessons">
                <For each={module.lessons}>
                  {(lesson) => {
                    const finished = () => lesson.steps.filter((step) => done().has(stepKey({ module, lesson, step }))).length
                    return (
                      <li>
                        <A class="learn-lesson" href={`/learn/${module.id}/${lesson.id}/${lesson.steps[0].id}`}>
                          <span class="learn-lesson-title">{lesson.title}</span>
                          <span class="learn-lesson-summary">{lesson.summary}</span>
                          <span class="learn-dots" aria-label={`${finished()} of ${lesson.steps.length} steps done`}>
                            <For each={lesson.steps}>
                              {(step) => <i classList={{ done: done().has(stepKey({ module, lesson, step })) }} />}
                            </For>
                          </span>
                        </A>
                      </li>
                    )
                  }}
                </For>
              </ol>
            </section>
          )}
        </For>

        <section class="learn-module learn-coming">
          <h2>Coming next</h2>
          <ul>
            <For each={COMING}>{(title) => <li>{title}</li>}</For>
          </ul>
        </section>
      </main>
    </div>
  )
}

/** `/learn/:module/:lesson/:step`: one step. */
export const LearnStep: Component = () => {
  const params = useParams<{ module: string; lesson: string; step?: string }>()
  const navigate = useNavigate()
  const location = createMemo(() => findStep(params.module, params.lesson, params.step))

  const [code, setCode] = createSignal('')
  const [results, setResults] = createSignal<CheckResult[]>([])
  const [error, setError] = createSignal<string | undefined>()
  const [showHint, setShowHint] = createSignal(0)
  const [scrub, setScrub] = createSignal<number | undefined>()
  const [completed, setCompleted] = createSignal(false)
  let preview: HTMLDivElement | undefined
  let run: RunResult | undefined
  let timer: number | undefined

  const execute = (source: string) => {
    const current = location()
    if (!current || !preview) return
    run?.destroy()
    run = runStep(current.step, source, preview)
    setError(run.error)
    const checked = checkStep(current.step, run)
    setResults(checked)
    setScrub(undefined)
    if (checked.every((result) => result.passed)) {
      markCompleted(stepKey(current))
      setCompleted(true)
    }
  }

  // A new step: its draft (or starter), a fresh preview.
  createEffect(
    on(location, (current) => {
      if (!current) return
      const source = draftFor(stepKey(current)) ?? current.step.starter
      setCode(source)
      setShowHint(0)
      setCompleted(completedSteps().has(stepKey(current)))
      queueMicrotask(() => execute(source))
    })
  )

  onCleanup(() => {
    window.clearTimeout(timer)
    run?.destroy()
  })

  const edit = (source: string) => {
    setCode(source)
    const current = location()
    if (current) saveDraft(stepKey(current), source === current.step.starter ? undefined : source)
    window.clearTimeout(timer)
    timer = window.setTimeout(() => execute(source), 400)
  }

  const scrubTo = (value: number) => {
    setScrub(value)
    for (const timeline of run?.timelines ?? []) {
      timeline.pause()
      timeline.progress(value)
    }
  }

  const replay = () => {
    setScrub(undefined)
    for (const timeline of run?.timelines ?? []) timeline.restart()
  }

  const next = () => allSteps[(location()?.index ?? 0) + 1]
  const previous = () => allSteps[(location()?.index ?? 0) - 1]
  const lessonPosition = () => {
    const current = location()
    return current ? `${current.lesson.steps.indexOf(current.step) + 1} / ${current.lesson.steps.length}` : ''
  }

  const handleKey = (event: KeyboardEvent) => {
    // Tab inserts two spaces in the editor instead of leaving it.
    if (event.key !== 'Tab' || event.shiftKey) return
    event.preventDefault()
    const area = event.currentTarget as HTMLTextAreaElement
    const { selectionStart, selectionEnd, value } = area
    const updated = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`
    area.value = updated
    area.selectionStart = area.selectionEnd = selectionStart + 2
    edit(updated)
  }

  return (
    <Show when={location()} fallback={<Navigate href="/learn" />}>
      {(current) => (
        <div class="learn">
          <LearnHeader trail={`${current().module.title} › ${current().lesson.title}`} />
          <main class="learn-step">
            <section class="learn-instructions">
              <span class="learn-step-count">
                Step {lessonPosition()}
                <Show when={completed()}>
                  <span class="learn-done-badge">Done</span>
                </Show>
              </span>
              <h1>{current().step.title}</h1>
              <div class="learn-body" innerHTML={renderMarkdown(current().step.body)} />
              <Show when={current().step.hints?.length}>
                <div class="learn-hints">
                  <For each={current().step.hints!.slice(0, showHint())}>{(hint) => <p innerHTML={renderMarkdown(hint)} />}</For>
                  <Show when={showHint() < current().step.hints!.length}>
                    <button class="learn-link-button" onClick={() => setShowHint(showHint() + 1)}>
                      {showHint() === 0 ? 'Show a hint' : 'Another hint'}
                    </button>
                  </Show>
                </div>
              </Show>
            </section>

            <section class="learn-editor">
              <div class="learn-pane-bar">
                <span>Your code</span>
                <span class="learn-pane-actions">
                  <button class="learn-link-button" onClick={() => edit(current().step.starter)}>
                    Reset
                  </button>
                  <button class="learn-link-button" onClick={() => edit(current().step.solution)}>
                    Show solution
                  </button>
                </span>
              </div>
              <textarea
                spellcheck={false}
                aria-label="Code for this step"
                value={code()}
                onInput={(event) => edit(event.currentTarget.value)}
                onKeyDown={handleKey}
              />
              <Show when={error()}>
                <p class="learn-error" role="status">
                  {error()}
                </p>
              </Show>
            </section>

            <section class="learn-output">
              <div class="learn-pane-bar">
                <span>Preview</span>
                <button class="learn-link-button" onClick={replay}>
                  Replay
                </button>
              </div>
              <div class="learn-preview" ref={preview} />
              <label class="learn-scrub">
                <span>Scrub</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={scrub() ?? 0}
                  onInput={(event) => scrubTo(Number(event.currentTarget.value))}
                  aria-label="Scrub through the animation"
                />
              </label>

              <ul class="learn-checks" aria-live="polite">
                <For each={results()}>
                  {(result) => (
                    <li classList={{ passed: result.passed }}>
                      <span class="learn-check-mark" aria-hidden="true">
                        {result.passed ? '✓' : '○'}
                      </span>
                      <span>
                        <span innerHTML={renderInline(result.label)} />
                        <Show when={!result.passed && result.message}>
                          <span class="learn-check-message" innerHTML={renderInline(result.message!)} />
                        </Show>
                      </span>
                    </li>
                  )}
                </For>
              </ul>

              <div class="learn-nav">
                <Show when={previous()}>
                  <button class="learn-button" onClick={() => navigate(`/learn/${stepKey(previous()!)}`)}>
                    Back
                  </button>
                </Show>
                <Show
                  when={next()}
                  fallback={
                    <A class="learn-button learn-button-primary" href="/learn">
                      Finish
                    </A>
                  }
                >
                  <button
                    class="learn-button"
                    classList={{ 'learn-button-primary': completed() }}
                    onClick={() => navigate(`/learn/${stepKey(next()!)}`)}
                  >
                    {completed() ? 'Next step' : 'Skip'}
                  </button>
                </Show>
              </div>
            </section>
          </main>
        </div>
      )}
    </Show>
  )
}

/** Markdown for one line (inline code and emphasis), without paragraph wrappers. */
function renderInline(text: string): string {
  return renderMarkdown(text).replace(/^<p>|<\/p>$/g, '')
}
