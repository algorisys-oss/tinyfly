import { describe, it, expect } from 'vitest'
import { createHistoryStore } from './history-store'

describe('HistoryStore', () => {
  describe('initialization', () => {
    it('should start with empty history', () => {
      const history = createHistoryStore<string>()
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)
    })

    it('should accept initial state', () => {
      const history = createHistoryStore<string>('initial')
      expect(history.current()).toBe('initial')
    })
  })

  describe('push', () => {
    it('should add state to history', () => {
      const history = createHistoryStore<string>('a')
      history.push('b')
      expect(history.current()).toBe('b')
      expect(history.canUndo()).toBe(true)
    })

    it('should clear redo stack on new push', () => {
      const history = createHistoryStore<string>('a')
      history.push('b')
      history.push('c')
      history.undo()
      expect(history.canRedo()).toBe(true)
      history.push('d')
      expect(history.canRedo()).toBe(false)
    })
  })

  describe('undo', () => {
    it('should restore previous state', () => {
      const history = createHistoryStore<string>('a')
      history.push('b')
      history.push('c')
      history.undo()
      expect(history.current()).toBe('b')
    })

    it('should enable redo after undo', () => {
      const history = createHistoryStore<string>('a')
      history.push('b')
      history.undo()
      expect(history.canRedo()).toBe(true)
    })

    it('should not undo past initial state', () => {
      const history = createHistoryStore<string>('a')
      history.push('b')
      history.undo()
      history.undo()
      history.undo()
      expect(history.current()).toBe('a')
      expect(history.canUndo()).toBe(false)
    })

    it('should return undefined when nothing to undo', () => {
      const history = createHistoryStore<string>('a')
      expect(history.undo()).toBeUndefined()
    })
  })

  describe('redo', () => {
    it('should restore next state after undo', () => {
      const history = createHistoryStore<string>('a')
      history.push('b')
      history.push('c')
      history.undo()
      history.undo()
      history.redo()
      expect(history.current()).toBe('b')
    })

    it('should not redo past latest state', () => {
      const history = createHistoryStore<string>('a')
      history.push('b')
      history.undo()
      history.redo()
      history.redo()
      history.redo()
      expect(history.current()).toBe('b')
      expect(history.canRedo()).toBe(false)
    })

    it('should return undefined when nothing to redo', () => {
      const history = createHistoryStore<string>('a')
      expect(history.redo()).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('should reset history to current state', () => {
      const history = createHistoryStore<string>('a')
      history.push('b')
      history.push('c')
      history.clear()
      expect(history.current()).toBe('c')
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)
    })
  })

  describe('max history limit', () => {
    it('should respect max history size', () => {
      const history = createHistoryStore<number>(0, { maxSize: 3 })
      history.push(1)
      history.push(2)
      history.push(3)
      history.push(4)
      // past=[1,2,3], present=4 (0 was trimmed)
      history.undo() // present=3, past=[1,2]
      history.undo() // present=2, past=[1]
      history.undo() // present=1, past=[]
      expect(history.current()).toBe(1)
      expect(history.canUndo()).toBe(false)
    })
  })

  describe('batch operations', () => {
    it('should batch multiple changes into single undo step', () => {
      const history = createHistoryStore<number>(0)
      history.batch(() => {
        history.push(1)
        history.push(2)
        history.push(3)
      })
      expect(history.current()).toBe(3)
      history.undo()
      expect(history.current()).toBe(0)
    })
  })
})
