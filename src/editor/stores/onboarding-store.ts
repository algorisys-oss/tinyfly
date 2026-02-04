import { createSignal } from 'solid-js'

const STORAGE_KEY = 'tinyfly-onboarding'

export interface OnboardingStep {
  id: string
  title: string
  content: string
  target: string // CSS selector for the target element
  position: 'top' | 'bottom' | 'left' | 'right'
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to tinyfly!',
    content: 'This quick tour will show you around the animation editor. You can skip at any time or restart from the settings menu.',
    target: '.editor-header h1',
    position: 'bottom',
  },
  {
    id: 'elements',
    title: 'Element Panel',
    content: 'Add shapes, text, images, and more here. Click any element type to add it to your canvas.',
    target: '.element-panel',
    position: 'right',
  },
  {
    id: 'preview',
    title: 'Preview Canvas',
    content: 'See your animation in real-time. Click to select elements, drag to move them, and use handles to resize or rotate.',
    target: '.preview-panel',
    position: 'bottom',
  },
  {
    id: 'playback',
    title: 'Playback Controls',
    content: 'Play, pause, and seek through your animation. Use the timeline slider to scrub to any point.',
    target: '.playback-controls',
    position: 'top',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    content: 'View and edit keyframes here. Click a track to select it, then click the diamond markers to edit keyframe values.',
    target: '.timeline-view',
    position: 'top',
  },
  {
    id: 'properties',
    title: 'Property Panel',
    content: 'Edit the selected element\'s properties here. Change position, size, colors, and more.',
    target: '.property-panel',
    position: 'left',
  },
  {
    id: 'presets',
    title: 'Animation Presets',
    content: 'Apply pre-built animations with one click! Choose from entrance, emphasis, exit, and motion effects.',
    target: '.preset-panel',
    position: 'left',
  },
  {
    id: 'toolbar',
    title: 'Toolbar',
    content: 'Import/export your work, embed animations, browse samples, and access export formats (CSS, Lottie, GIF).',
    target: '.toolbar',
    position: 'bottom',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    content: 'Speed up your workflow! Ctrl+Z to undo, Ctrl+D to duplicate, Delete to remove, and arrow keys to nudge elements.',
    target: '.editor-header',
    position: 'bottom',
  },
]

export interface OnboardingState {
  completed: boolean
  currentStep: number
  dismissed: boolean
}

function loadState(): OnboardingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return {
    completed: false,
    currentStep: 0,
    dismissed: false,
  }
}

function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

export function createOnboardingStore() {
  const initialState = loadState()
  const [state, setState] = createSignal<OnboardingState>(initialState)
  const [isActive, setIsActive] = createSignal(!initialState.completed && !initialState.dismissed)

  const currentStep = () => onboardingSteps[state().currentStep]
  const totalSteps = () => onboardingSteps.length
  const stepNumber = () => state().currentStep + 1

  const nextStep = () => {
    const current = state()
    if (current.currentStep < onboardingSteps.length - 1) {
      const newState = { ...current, currentStep: current.currentStep + 1 }
      setState(newState)
      saveState(newState)
    } else {
      complete()
    }
  }

  const prevStep = () => {
    const current = state()
    if (current.currentStep > 0) {
      const newState = { ...current, currentStep: current.currentStep - 1 }
      setState(newState)
      saveState(newState)
    }
  }

  const goToStep = (index: number) => {
    if (index >= 0 && index < onboardingSteps.length) {
      const newState = { ...state(), currentStep: index }
      setState(newState)
      saveState(newState)
    }
  }

  const complete = () => {
    const newState = { ...state(), completed: true }
    setState(newState)
    saveState(newState)
    setIsActive(false)
  }

  const dismiss = () => {
    const newState = { ...state(), dismissed: true }
    setState(newState)
    saveState(newState)
    setIsActive(false)
  }

  const restart = () => {
    const newState = { completed: false, currentStep: 0, dismissed: false }
    setState(newState)
    saveState(newState)
    setIsActive(true)
  }

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY)
    const newState = { completed: false, currentStep: 0, dismissed: false }
    setState(newState)
  }

  return {
    state,
    isActive,
    currentStep,
    totalSteps,
    stepNumber,
    nextStep,
    prevStep,
    goToStep,
    complete,
    dismiss,
    restart,
    reset,
  }
}

export type OnboardingStore = ReturnType<typeof createOnboardingStore>
