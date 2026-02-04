import { createSignal } from 'solid-js'

export interface HistoryOptions {
  /** Maximum number of history entries to keep */
  maxSize?: number
}

/**
 * Creates a history store for undo/redo functionality.
 * Generic type T represents the state type being tracked.
 */
export function createHistoryStore<T>(initialState?: T, options: HistoryOptions = {}) {
  const { maxSize = 50 } = options

  // Past states (for undo)
  const [past, setPast] = createSignal<T[]>([])
  // Current state
  const [present, setPresent] = createSignal<T | undefined>(initialState)
  // Future states (for redo)
  const [future, setFuture] = createSignal<T[]>([])
  // Batching flag
  let isBatching = false
  let batchStartState: T | undefined

  /**
   * Get the current state.
   */
  function current(): T | undefined {
    return present()
  }

  /**
   * Check if undo is available.
   */
  function canUndo(): boolean {
    return past().length > 0
  }

  /**
   * Check if redo is available.
   */
  function canRedo(): boolean {
    return future().length > 0
  }

  /**
   * Push a new state onto the history stack.
   */
  function push(state: T): void {
    const currentState = present()

    if (isBatching) {
      // During batching, just update present without adding to history
      setPresent(() => state)
      return
    }

    if (currentState !== undefined) {
      setPast((p) => {
        const newPast = [...p, currentState]
        // Trim to max size
        if (newPast.length > maxSize) {
          return newPast.slice(newPast.length - maxSize)
        }
        return newPast
      })
    }

    setPresent(() => state)
    // Clear redo stack on new action
    setFuture([])
  }

  /**
   * Undo to the previous state.
   * Returns the restored state, or undefined if nothing to undo.
   */
  function undo(): T | undefined {
    const pastStates = past()
    if (pastStates.length === 0) {
      return undefined
    }

    const currentState = present()
    const previousState = pastStates[pastStates.length - 1]

    setPast((p) => p.slice(0, -1))
    setPresent(() => previousState)

    if (currentState !== undefined) {
      setFuture((f) => [currentState, ...f])
    }

    return previousState
  }

  /**
   * Redo to the next state.
   * Returns the restored state, or undefined if nothing to redo.
   */
  function redo(): T | undefined {
    const futureStates = future()
    if (futureStates.length === 0) {
      return undefined
    }

    const currentState = present()
    const nextState = futureStates[0]

    setFuture((f) => f.slice(1))
    setPresent(() => nextState)

    if (currentState !== undefined) {
      setPast((p) => [...p, currentState])
    }

    return nextState
  }

  /**
   * Clear all history, keeping only current state.
   */
  function clear(): void {
    setPast([])
    setFuture([])
  }

  /**
   * Batch multiple operations into a single undo step.
   */
  function batch(fn: () => void): void {
    if (isBatching) {
      // Already batching, just run the function
      fn()
      return
    }

    isBatching = true
    batchStartState = present()

    try {
      fn()
    } finally {
      isBatching = false

      // After batch, add the start state to history
      const finalState = present()
      if (batchStartState !== undefined && finalState !== batchStartState) {
        setPast((p) => {
          const newPast = [...p, batchStartState as T]
          if (newPast.length > maxSize) {
            return newPast.slice(newPast.length - maxSize)
          }
          return newPast
        })
        setFuture([])
      }

      batchStartState = undefined
    }
  }

  return {
    current,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    clear,
    batch,
  }
}

export type HistoryStore<T> = ReturnType<typeof createHistoryStore<T>>
