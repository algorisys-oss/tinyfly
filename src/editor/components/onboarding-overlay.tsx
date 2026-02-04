import { Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import type { Component } from 'solid-js'
import type { OnboardingStore } from '../stores/onboarding-store'
import './onboarding-overlay.css'

export interface OnboardingOverlayProps {
  store: OnboardingStore
}

export const OnboardingOverlay: Component<OnboardingOverlayProps> = (props) => {
  const [spotlightRect, setSpotlightRect] = createSignal<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = createSignal({ top: 0, left: 0 })

  const updatePosition = () => {
    const step = props.store.currentStep()
    if (!step) return

    const target = document.querySelector(step.target)
    if (!target) {
      // If target not found, position in center
      setSpotlightRect(null)
      setTooltipPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
      })
      return
    }

    const rect = target.getBoundingClientRect()
    setSpotlightRect(rect)

    // Calculate tooltip position based on step position
    const padding = 16
    const tooltipWidth = 320
    const tooltipHeight = 180
    let top = 0
    let left = 0

    switch (step.position) {
      case 'top':
        top = rect.top - tooltipHeight - padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'bottom':
        top = rect.bottom + padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.left - tooltipWidth - padding
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.right + padding
        break
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding))
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))

    setTooltipPosition({ top, left })
  }

  createEffect(() => {
    // Re-calculate position when step changes
    props.store.currentStep()
    updatePosition()
  })

  onMount(() => {
    window.addEventListener('resize', updatePosition)
    // Initial positioning after a brief delay for DOM to settle
    setTimeout(updatePosition, 100)
  })

  onCleanup(() => {
    window.removeEventListener('resize', updatePosition)
  })

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.store.isActive()) return

    if (e.key === 'Escape') {
      props.store.dismiss()
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      props.store.nextStep()
    } else if (e.key === 'ArrowLeft') {
      props.store.prevStep()
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  const step = () => props.store.currentStep()
  const rect = () => spotlightRect()
  const pos = () => tooltipPosition()

  return (
    <Show when={props.store.isActive()}>
      <div class="onboarding-overlay">
        {/* Spotlight mask */}
        <svg class="onboarding-mask" width="100%" height="100%">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <Show when={rect()}>
                <rect
                  x={rect()!.left - 8}
                  y={rect()!.top - 8}
                  width={rect()!.width + 16}
                  height={rect()!.height + 16}
                  rx="8"
                  fill="black"
                />
              </Show>
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border */}
        <Show when={rect()}>
          <div
            class="spotlight-border"
            style={{
              top: `${rect()!.top - 8}px`,
              left: `${rect()!.left - 8}px`,
              width: `${rect()!.width + 16}px`,
              height: `${rect()!.height + 16}px`,
            }}
          />
        </Show>

        {/* Tooltip */}
        <div
          class="onboarding-tooltip"
          style={{
            top: `${pos().top}px`,
            left: `${pos().left}px`,
          }}
        >
          <div class="onboarding-header">
            <span class="onboarding-step-counter">
              {props.store.stepNumber()} of {props.store.totalSteps()}
            </span>
            <button class="onboarding-skip" onClick={() => props.store.dismiss()}>
              Skip tour
            </button>
          </div>

          <h3 class="onboarding-title">{step()?.title}</h3>
          <p class="onboarding-content">{step()?.content}</p>

          <div class="onboarding-nav">
            <Show when={props.store.stepNumber() > 1}>
              <button class="onboarding-btn onboarding-btn-secondary" onClick={() => props.store.prevStep()}>
                Previous
              </button>
            </Show>
            <Show when={props.store.stepNumber() === 1}>
              <div />
            </Show>
            <button class="onboarding-btn onboarding-btn-primary" onClick={() => props.store.nextStep()}>
              {props.store.stepNumber() === props.store.totalSteps() ? 'Get Started' : 'Next'}
            </button>
          </div>

          {/* Progress dots */}
          <div class="onboarding-progress">
            {Array.from({ length: props.store.totalSteps() }, (_, i) => (
              <button
                class={`onboarding-dot ${i === props.store.state().currentStep ? 'active' : ''}`}
                onClick={() => props.store.goToStep(i)}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Show>
  )
}

export default OnboardingOverlay
