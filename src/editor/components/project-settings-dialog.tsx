import { createSignal, Show } from 'solid-js'
import type { Component } from 'solid-js'
import type { ProjectStore } from '../stores/project-store'
import './project-settings-dialog.css'

interface ProjectSettingsDialogProps {
  projectStore: ProjectStore
  isOpen: boolean
  onClose: () => void
}

const PRESET_SIZES = [
  { name: 'Small', width: 300, height: 200 },
  { name: 'Medium', width: 400, height: 300 },
  { name: 'Large', width: 800, height: 600 },
  { name: '720p', width: 1280, height: 720 },
  { name: '1080p', width: 1920, height: 1080 },
  { name: 'Square', width: 400, height: 400 },
]

export const ProjectSettingsDialog: Component<ProjectSettingsDialogProps> = (props) => {
  const [name, setName] = createSignal('')
  const [width, setWidth] = createSignal(300)
  const [height, setHeight] = createSignal(200)

  // Reset form when dialog opens
  const resetForm = () => {
    const project = props.projectStore.currentProject()
    setName(project.name)
    setWidth(project.canvas.width)
    setHeight(project.canvas.height)
  }

  const handleSave = () => {
    const trimmedName = name().trim()
    if (trimmedName) {
      props.projectStore.rename(trimmedName)
    }
    props.projectStore.setCanvas({ width: width(), height: height() })
    props.onClose()
  }

  const handleCancel = () => {
    props.onClose()
  }

  const handlePresetClick = (preset: (typeof PRESET_SIZES)[number]) => {
    setWidth(preset.width)
    setHeight(preset.height)
  }

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose()
    }
  }

  return (
    <Show when={props.isOpen}>
      {(() => {
        resetForm()
        return (
          <div class="settings-dialog-overlay" onClick={handleOverlayClick}>
            <div class="settings-dialog">
              <h2>Project Settings</h2>

              <div class="settings-section">
                <label class="settings-label">Project Name</label>
                <input
                  type="text"
                  class="settings-input"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="Enter project name"
                />
              </div>

              <div class="settings-section">
                <label class="settings-label">Canvas Size</label>
                <div class="settings-presets">
                  {PRESET_SIZES.map((preset) => (
                    <button
                      class="settings-preset-btn"
                      classList={{
                        active: width() === preset.width && height() === preset.height,
                      }}
                      onClick={() => handlePresetClick(preset)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <div class="settings-dimensions">
                  <div class="settings-dimension">
                    <label>Width</label>
                    <input
                      type="number"
                      class="settings-input settings-input-small"
                      value={width()}
                      onInput={(e) => setWidth(parseInt(e.currentTarget.value) || 0)}
                      min="1"
                      max="4096"
                    />
                    <span class="settings-unit">px</span>
                  </div>
                  <span class="settings-dimension-x">×</span>
                  <div class="settings-dimension">
                    <label>Height</label>
                    <input
                      type="number"
                      class="settings-input settings-input-small"
                      value={height()}
                      onInput={(e) => setHeight(parseInt(e.currentTarget.value) || 0)}
                      min="1"
                      max="4096"
                    />
                    <span class="settings-unit">px</span>
                  </div>
                </div>
              </div>

              <div class="settings-actions">
                <button class="settings-btn settings-btn-primary" onClick={handleSave}>
                  Save
                </button>
                <button class="settings-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </Show>
  )
}

export default ProjectSettingsDialog
