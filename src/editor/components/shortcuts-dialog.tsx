import { Show, For } from 'solid-js'
import type { Component } from 'solid-js'
import './shortcuts-dialog.css'

interface ShortcutsDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
}

interface ShortcutCategory {
  name: string
  shortcuts: ShortcutItem[]
}

const shortcutCategories: ShortcutCategory[] = [
  {
    name: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo (alternate)' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    name: 'Selection',
    shortcuts: [
      { keys: ['Ctrl', 'A'], description: 'Select all elements' },
      { keys: ['Ctrl', 'Click'], description: 'Toggle multi-selection' },
      { keys: ['Esc'], description: 'Deselect all' },
    ],
  },
  {
    name: 'Elements',
    shortcuts: [
      { keys: ['Delete'], description: 'Delete selected element(s)' },
      { keys: ['Backspace'], description: 'Delete selected element(s)' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate element' },
      { keys: ['Ctrl', 'C'], description: 'Copy element(s)' },
      { keys: ['Ctrl', 'X'], description: 'Cut element(s)' },
      { keys: ['Ctrl', 'V'], description: 'Paste element(s)' },
      { keys: ['Ctrl', 'G'], description: 'Group selected elements' },
      { keys: ['Ctrl', 'Shift', 'G'], description: 'Ungroup' },
    ],
  },
  {
    name: 'Transform',
    shortcuts: [
      { keys: ['\u2190', '\u2191', '\u2192', '\u2193'], description: 'Nudge element (1px)' },
      { keys: ['Shift', 'Arrow'], description: 'Nudge element (10px)' },
      { keys: ['Shift', 'Resize'], description: 'Proportionate resize' },
      { keys: ['Shift', 'Rotate'], description: 'Snap to 15\u00b0 increments' },
    ],
  },
]

export const ShortcutsDialog: Component<ShortcutsDialogProps> = (props) => {
  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    }
  }

  return (
    <Show when={props.isOpen}>
      <div class="shortcuts-dialog-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
        <div class="shortcuts-dialog">
          <div class="shortcuts-dialog-header">
            <h2>Keyboard Shortcuts</h2>
            <button class="shortcuts-close-btn" onClick={props.onClose}>
              ×
            </button>
          </div>

          <div class="shortcuts-dialog-content">
            <For each={shortcutCategories}>
              {(category) => (
                <div class="shortcuts-category">
                  <h3 class="shortcuts-category-title">{category.name}</h3>
                  <div class="shortcuts-list">
                    <For each={category.shortcuts}>
                      {(shortcut) => (
                        <div class="shortcut-item">
                          <div class="shortcut-keys">
                            <For each={shortcut.keys}>
                              {(key, index) => (
                                <>
                                  <kbd class="shortcut-key">{key}</kbd>
                                  <Show when={index() < shortcut.keys.length - 1}>
                                    <span class="shortcut-separator">+</span>
                                  </Show>
                                </>
                              )}
                            </For>
                          </div>
                          <span class="shortcut-description">{shortcut.description}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>

            <div class="shortcuts-footer">
              <p class="shortcuts-hint">
                On Mac, use <kbd>Cmd</kbd> instead of <kbd>Ctrl</kbd>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default ShortcutsDialog
