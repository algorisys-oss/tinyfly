import { createMemo, createSignal, createEffect, Show, Switch, Match, For } from 'solid-js'
import type { Component } from 'solid-js'
import type { EditorStore } from '../stores/editor-store'
import { isGradient, createLinearGradient, createRadialGradient, type SceneStore, type RectElement, type CircleElement, type TextElement, type LineElement, type ArrowElement, type PathElement, type ImageElement, type FillValue, type LinearGradient, type RadialGradient } from '../stores/scene-store'
import type { EasingType, BuiltInEasingType, CubicBezierPoints } from '../../engine'
import { isCubicBezierEasing } from '../../engine'
import { HelpIcon } from './tooltip'
import { presetsByCategory, type AnimationPreset } from '../presets'
import { CurveEditor } from './curve-editor'
import './property-panel.css'

interface PropertyPanelProps {
  store: EditorStore
  sceneStore: SceneStore
}

const BUILTIN_EASING_OPTIONS: BuiltInEasingType[] = [
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'ease-in-quad',
  'ease-out-quad',
  'ease-in-out-quad',
  'ease-in-cubic',
  'ease-out-cubic',
  'ease-in-out-cubic',
]

/** Default control points for custom cubic-bezier */
const DEFAULT_CUBIC_BEZIER: CubicBezierPoints = [0.25, 0.1, 0.25, 1.0]

const TEXT_ALIGN_OPTIONS = ['left', 'center', 'right'] as const
const LINE_CAP_OPTIONS = ['butt', 'round', 'square'] as const
const LINE_JOIN_OPTIONS = ['miter', 'round', 'bevel'] as const
const OBJECT_FIT_OPTIONS = ['contain', 'cover', 'fill'] as const
const FILL_TYPE_OPTIONS = ['solid', 'linear', 'radial'] as const

export const PropertyPanel: Component<PropertyPanelProps> = (props) => {
  const selectedTrack = createMemo(() => props.store.selectedTrack())
  const selectedKeyframeIndex = createMemo(() => props.store.state.selectedKeyframeIndex)

  const selectedKeyframe = createMemo(() => {
    const track = selectedTrack()
    const index = selectedKeyframeIndex()
    if (!track || index === null || index < 0) return null
    return track.keyframes[index] ?? null
  })

  const selectedElement = createMemo(() => props.sceneStore.selectedElement())

  // Text effect applied message
  const [textEffectMessage, setTextEffectMessage] = createSignal<string | null>(null)

  // Handle applying text animation preset
  const handleApplyTextPreset = (preset: AnimationPreset) => {
    const element = selectedElement()
    if (!element) return

    const trackIds = props.store.applyPreset(preset, element.name)
    if (trackIds.length > 0) {
      setTextEffectMessage(`Applied "${preset.name}"`)
      setTimeout(() => setTextEffectMessage(null), 2000)
    }
  }

  // Motion path state
  const [motionPathTarget, setMotionPathTarget] = createSignal('')
  const [motionPathDuration, setMotionPathDuration] = createSignal(2000)
  const [motionPathAutoRotate, setMotionPathAutoRotate] = createSignal(false)
  const [motionPathRotateOffset, setMotionPathRotateOffset] = createSignal(0)

  // Get animatable elements (not paths, not the selected path itself)
  const animatableElements = createMemo(() => {
    const elements = props.sceneStore.state.elements
    const selected = selectedElement()
    return elements.filter(el => el.type !== 'path' && el.type !== 'group' && el.id !== selected?.id)
  })

  // Keyframe handlers
  const handleTimeChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const time = parseFloat(input.value)
    const track = selectedTrack()
    const index = selectedKeyframeIndex()
    if (!track || index === null || isNaN(time)) return

    props.store.updateKeyframe(track.id, index, { time })
  }

  const handleValueChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const track = selectedTrack()
    const index = selectedKeyframeIndex()
    if (!track || index === null) return

    const currentValue = selectedKeyframe()?.value
    let newValue: number | string = input.value

    if (typeof currentValue === 'number') {
      newValue = parseFloat(input.value)
      if (isNaN(newValue)) return
    }

    props.store.updateKeyframe(track.id, index, { value: newValue })
  }

  const handleEasingChange = (e: Event) => {
    const select = e.target as HTMLSelectElement
    const value = select.value
    const track = selectedTrack()
    const index = selectedKeyframeIndex()
    if (!track || index === null) return

    if (value === 'custom') {
      // Switch to custom cubic-bezier with default points
      const currentEasing = selectedKeyframe()?.easing
      const points = isCubicBezierEasing(currentEasing) ? currentEasing.points : DEFAULT_CUBIC_BEZIER
      props.store.updateKeyframe(track.id, index, { easing: { type: 'cubic-bezier', points } })
    } else {
      // Use built-in easing
      props.store.updateKeyframe(track.id, index, { easing: value as BuiltInEasingType })
    }
  }

  const handleCubicBezierChange = (points: CubicBezierPoints) => {
    const track = selectedTrack()
    const index = selectedKeyframeIndex()
    if (!track || index === null) return

    props.store.updateKeyframe(track.id, index, { easing: { type: 'cubic-bezier', points } })
  }

  // Helper to get easing value for the select dropdown
  const getEasingSelectValue = (easing: EasingType | undefined): string => {
    if (easing === undefined) return 'linear'
    if (isCubicBezierEasing(easing)) return 'custom'
    return easing
  }

  // Helper to get cubic bezier points from current easing
  const getCurrentBezierPoints = (): CubicBezierPoints => {
    const easing = selectedKeyframe()?.easing
    if (isCubicBezierEasing(easing)) return easing.points
    return DEFAULT_CUBIC_BEZIER
  }

  const handleDeleteKeyframe = () => {
    const track = selectedTrack()
    const index = selectedKeyframeIndex()
    if (!track || index === null) return

    props.store.removeKeyframe(track.id, index)
  }

  // Element handlers
  const updateElement = (updates: Record<string, unknown>) => {
    const element = selectedElement()
    if (element) {
      props.sceneStore.updateElement(element.id, updates)
    }
  }

  const handleElementNameChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    updateElement({ name: input.value })
  }

  const handleNumberChange = (field: string) => (e: Event) => {
    const input = e.target as HTMLInputElement
    const value = parseFloat(input.value)
    if (!isNaN(value)) {
      updateElement({ [field]: value })
    }
  }

  const handleColorChange = (field: string) => (e: Event) => {
    const input = e.target as HTMLInputElement
    updateElement({ [field]: input.value })
  }

  const handleTextAlignChange = (e: Event) => {
    const select = e.target as HTMLSelectElement
    updateElement({ textAlign: select.value })
  }

  const handleLineCapChange = (e: Event) => {
    const select = e.target as HTMLSelectElement
    updateElement({ lineCap: select.value })
  }

  const handleLineJoinChange = (e: Event) => {
    const select = e.target as HTMLSelectElement
    updateElement({ lineJoin: select.value })
  }

  const handlePathDataChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    updateElement({ d: input.value })
  }

  const handleObjectFitChange = (e: Event) => {
    const select = e.target as HTMLSelectElement
    updateElement({ objectFit: select.value })
  }

  const handleSrcChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    updateElement({ src: input.value })
  }

  const handleImageFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Convert to data URL for embedding
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      updateElement({ src: dataUrl })
    }
    reader.onerror = () => {
      alert('Failed to read image file')
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be selected again
    input.value = ''
  }

  const handleCheckboxChange = (field: string) => (e: Event) => {
    const input = e.target as HTMLInputElement
    updateElement({ [field]: input.checked })
  }

  const handleDeleteElement = () => {
    const element = selectedElement()
    if (element) {
      props.sceneStore.removeElement(element.id)
    }
  }

  // Gradient handlers
  const getFillType = (fill: FillValue): 'solid' | 'linear' | 'radial' => {
    if (typeof fill === 'string') return 'solid'
    return fill.type
  }

  const handleFillTypeChange = (e: Event) => {
    const select = e.target as HTMLSelectElement
    const fillType = select.value as 'solid' | 'linear' | 'radial'
    const element = selectedElement()
    if (!element) return

    const currentFill = (element as RectElement | CircleElement | PathElement).fill

    if (fillType === 'solid') {
      // Convert to solid color - use first gradient stop or default
      if (isGradient(currentFill)) {
        updateElement({ fill: currentFill.stops[0]?.color ?? '#4a9eff' })
      }
    } else if (fillType === 'linear') {
      // Convert to linear gradient
      if (typeof currentFill === 'string') {
        updateElement({ fill: createLinearGradient(currentFill, '#2ecc71') })
      } else if (currentFill.type === 'radial') {
        updateElement({ fill: { ...currentFill, type: 'linear', angle: 90 } as LinearGradient })
      }
    } else if (fillType === 'radial') {
      // Convert to radial gradient
      if (typeof currentFill === 'string') {
        updateElement({ fill: createRadialGradient(currentFill, '#2ecc71') })
      } else if (currentFill.type === 'linear') {
        updateElement({ fill: { ...currentFill, type: 'radial', centerX: 0.5, centerY: 0.5, radius: 0.5 } as RadialGradient })
      }
    }
  }

  const handleGradientAngleChange = (e: Event) => {
    const input = e.target as HTMLInputElement
    const angle = parseFloat(input.value)
    const element = selectedElement()
    if (!element || isNaN(angle)) return

    const currentFill = (element as RectElement | CircleElement | PathElement).fill
    if (isGradient(currentFill) && currentFill.type === 'linear') {
      updateElement({ fill: { ...currentFill, angle } })
    }
  }

  const handleGradientStopColorChange = (stopIndex: number) => (e: Event) => {
    const input = e.target as HTMLInputElement
    const element = selectedElement()
    if (!element) return

    const currentFill = (element as RectElement | CircleElement | PathElement).fill
    if (isGradient(currentFill)) {
      const newStops = [...currentFill.stops]
      newStops[stopIndex] = { ...newStops[stopIndex], color: input.value }
      updateElement({ fill: { ...currentFill, stops: newStops } })
    }
  }

  const handleGradientStopOffsetChange = (stopIndex: number) => (e: Event) => {
    const input = e.target as HTMLInputElement
    const offset = parseFloat(input.value) / 100
    const element = selectedElement()
    if (!element || isNaN(offset)) return

    const currentFill = (element as RectElement | CircleElement | PathElement).fill
    if (isGradient(currentFill)) {
      const newStops = [...currentFill.stops]
      newStops[stopIndex] = { ...newStops[stopIndex], offset: Math.max(0, Math.min(1, offset)) }
      updateElement({ fill: { ...currentFill, stops: newStops } })
    }
  }

  const handleAddGradientStop = () => {
    const element = selectedElement()
    if (!element) return

    const currentFill = (element as RectElement | CircleElement | PathElement).fill
    if (isGradient(currentFill)) {
      const lastStop = currentFill.stops[currentFill.stops.length - 1]
      const newStops = [...currentFill.stops, { offset: 1, color: lastStop?.color ?? '#ffffff' }]
      updateElement({ fill: { ...currentFill, stops: newStops } })
    }
  }

  const handleRemoveGradientStop = (stopIndex: number) => () => {
    const element = selectedElement()
    if (!element) return

    const currentFill = (element as RectElement | CircleElement | PathElement).fill
    if (isGradient(currentFill) && currentFill.stops.length > 2) {
      const newStops = currentFill.stops.filter((_, i) => i !== stopIndex)
      updateElement({ fill: { ...currentFill, stops: newStops } })
    }
  }

  // Motion path handler
  const handleApplyMotionPath = () => {
    const element = selectedElement() as PathElement
    const targetName = motionPathTarget()

    if (!element || element.type !== 'path' || !targetName) return

    props.store.createMotionPathAnimation(targetName, element.d, {
      duration: motionPathDuration(),
      autoRotate: motionPathAutoRotate(),
      rotateOffset: motionPathRotateOffset(),
    })

    // Reset selection
    setMotionPathTarget('')
  }

  // Render gradient controls
  const renderGradientControls = (fill: FillValue) => {
    if (!isGradient(fill)) return null

    return (
      <>
        <Show when={fill.type === 'linear'}>
          <div class="property-row">
            <label>Angle</label>
            <input
              type="number"
              value={(fill as LinearGradient).angle}
              onInput={handleGradientAngleChange}
              min="0"
              max="360"
              step="15"
            />
          </div>
        </Show>
        <div class="gradient-stops">
          <label class="gradient-stops-label">Color Stops</label>
          {fill.stops.map((stop, index) => (
            <div class="gradient-stop-row">
              <input
                type="color"
                value={stop.color}
                onChange={handleGradientStopColorChange(index)}
              />
              <input
                type="number"
                value={Math.round(stop.offset * 100)}
                onInput={handleGradientStopOffsetChange(index)}
                min="0"
                max="100"
                step="5"
                class="offset-input"
              />
              <span class="offset-unit">%</span>
              <Show when={fill.stops.length > 2}>
                <button
                  class="gradient-stop-remove"
                  onClick={handleRemoveGradientStop(index)}
                  title="Remove stop"
                >
                  ×
                </button>
              </Show>
            </div>
          ))}
          <button class="gradient-add-stop" onClick={handleAddGradientStop}>
            + Add Stop
          </button>
        </div>
      </>
    )
  }

  // Render element-specific properties
  const renderRectProperties = (element: RectElement) => (
    <div class="property-section">
      <h4>Appearance</h4>
      <div class="property-row">
        <label>Fill Type</label>
        <select value={getFillType(element.fill)} onChange={handleFillTypeChange}>
          {FILL_TYPE_OPTIONS.map((type) => (
            <option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
      </div>
      <Show when={!isGradient(element.fill)}>
        <div class="property-row">
          <label>Fill</label>
          <input
            type="color"
            value={element.fill as string}
            onChange={handleColorChange('fill')}
          />
          <input
            type="text"
            value={element.fill as string}
            onInput={handleColorChange('fill')}
            class="color-text"
          />
        </div>
      </Show>
      {renderGradientControls(element.fill)}
      <div class="property-row">
        <label>Stroke</label>
        <input
          type="color"
          value={element.stroke === 'transparent' ? '#000000' : element.stroke}
          onChange={handleColorChange('stroke')}
        />
        <input
          type="text"
          value={element.stroke}
          onInput={handleColorChange('stroke')}
          class="color-text"
        />
      </div>
      <div class="property-row">
        <label>Stroke Width</label>
        <input
          type="number"
          value={element.strokeWidth}
          onInput={handleNumberChange('strokeWidth')}
          min="0"
          step="1"
        />
      </div>
      <div class="property-row">
        <label>Radius</label>
        <input
          type="number"
          value={element.borderRadius}
          onInput={handleNumberChange('borderRadius')}
          min="0"
          step="1"
        />
      </div>
    </div>
  )

  const renderCircleProperties = (element: CircleElement) => (
    <div class="property-section">
      <h4>Appearance</h4>
      <div class="property-row">
        <label>Fill Type</label>
        <select value={getFillType(element.fill)} onChange={handleFillTypeChange}>
          {FILL_TYPE_OPTIONS.map((type) => (
            <option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
      </div>
      <Show when={!isGradient(element.fill)}>
        <div class="property-row">
          <label>Fill</label>
          <input
            type="color"
            value={element.fill as string}
            onChange={handleColorChange('fill')}
          />
          <input
            type="text"
            value={element.fill as string}
            onInput={handleColorChange('fill')}
            class="color-text"
          />
        </div>
      </Show>
      {renderGradientControls(element.fill)}
      <div class="property-row">
        <label>Stroke</label>
        <input
          type="color"
          value={element.stroke === 'transparent' ? '#000000' : element.stroke}
          onChange={handleColorChange('stroke')}
        />
        <input
          type="text"
          value={element.stroke}
          onInput={handleColorChange('stroke')}
          class="color-text"
        />
      </div>
      <div class="property-row">
        <label>Stroke Width</label>
        <input
          type="number"
          value={element.strokeWidth}
          onInput={handleNumberChange('strokeWidth')}
          min="0"
          step="1"
        />
      </div>
    </div>
  )

  // Text input component that maintains local state to prevent focus loss
  // Uses debounced updates so preview updates while typing without losing focus
  const TextContentInput: Component<{ element: TextElement }> = (props) => {
    const [localText, setLocalText] = createSignal(props.element.text)
    let debounceTimer: number | undefined

    // Sync local text when element changes externally (e.g., undo/redo or different selection)
    createEffect(() => {
      const elementText = props.element.text
      // Only sync if different from local (avoids overwriting during typing)
      if (elementText !== localText()) {
        setLocalText(elementText)
      }
    })

    const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
      const value = e.currentTarget.value
      setLocalText(value)

      // Debounce store update - updates preview after 150ms of no typing
      clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        updateElement({ text: value })
      }, 150)
    }

    return (
      <input
        type="text"
        value={localText()}
        onInput={handleInput}
        onBlur={(e) => {
          // Immediately sync on blur
          clearTimeout(debounceTimer)
          updateElement({ text: e.currentTarget.value })
        }}
      />
    )
  }

  // Font family input with local state and debounced updates
  const FontFamilyInput: Component<{ element: TextElement }> = (props) => {
    const [localFont, setLocalFont] = createSignal(props.element.fontFamily)
    let debounceTimer: number | undefined

    createEffect(() => {
      const elementFont = props.element.fontFamily
      if (elementFont !== localFont()) {
        setLocalFont(elementFont)
      }
    })

    const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
      const value = e.currentTarget.value
      setLocalFont(value)

      clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        updateElement({ fontFamily: value })
      }, 150)
    }

    return (
      <input
        type="text"
        value={localFont()}
        onInput={handleInput}
        onBlur={(e) => {
          clearTimeout(debounceTimer)
          updateElement({ fontFamily: e.currentTarget.value })
        }}
      />
    )
  }

  const renderTextProperties = (element: TextElement) => (
    <>
      <div class="property-section">
        <h4>Text</h4>
        <div class="property-row">
          <label>Content</label>
          <TextContentInput element={element} />
        </div>
        <div class="property-row">
          <label>Color</label>
          <input
            type="color"
            value={element.fill}
            onChange={handleColorChange('fill')}
          />
          <input
            type="text"
            value={element.fill}
            onInput={handleColorChange('fill')}
            class="color-text"
          />
        </div>
        <div class="property-row">
          <label>Font Size</label>
          <input
            type="number"
            value={element.fontSize}
            onInput={handleNumberChange('fontSize')}
            min="8"
            max="200"
            step="1"
          />
        </div>
        <div class="property-row">
          <label>Font</label>
          <FontFamilyInput element={element} />
        </div>
        <div class="property-row">
          <label>Weight</label>
          <input
            type="number"
            value={element.fontWeight}
            onInput={handleNumberChange('fontWeight')}
            min="100"
            max="900"
            step="100"
          />
        </div>
        <div class="property-row">
          <label>Align</label>
          <select value={element.textAlign} onChange={handleTextAlignChange}>
            {TEXT_ALIGN_OPTIONS.map((align) => (
              <option value={align}>{align}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Text Effects Section */}
      <div class="property-section">
        <h4>
          Text Effects
          <HelpIcon
            content="Click an effect to apply it to this text element. Effects add animation tracks automatically."
            position="left"
          />
        </h4>
        <div class="text-effects-grid">
          <For each={presetsByCategory.text}>
            {(preset) => (
              <button
                class="text-effect-btn"
                onClick={() => handleApplyTextPreset(preset)}
                title={preset.description}
              >
                {preset.name}
              </button>
            )}
          </For>
        </div>
        <Show when={textEffectMessage()}>
          <div class="text-effect-applied">{textEffectMessage()}</div>
        </Show>
      </div>
    </>
  )

  const renderLineProperties = (element: LineElement) => (
    <>
      <div class="property-section">
        <h4>Line Points</h4>
        <div class="property-row">
          <label>X1</label>
          <input
            type="number"
            value={element.x}
            onInput={handleNumberChange('x')}
            step="1"
          />
        </div>
        <div class="property-row">
          <label>Y1</label>
          <input
            type="number"
            value={element.y}
            onInput={handleNumberChange('y')}
            step="1"
          />
        </div>
        <div class="property-row">
          <label>X2</label>
          <input
            type="number"
            value={element.x2}
            onInput={handleNumberChange('x2')}
            step="1"
          />
        </div>
        <div class="property-row">
          <label>Y2</label>
          <input
            type="number"
            value={element.y2}
            onInput={handleNumberChange('y2')}
            step="1"
          />
        </div>
      </div>
      <div class="property-section">
        <h4>Stroke</h4>
        <div class="property-row">
          <label>Color</label>
          <input
            type="color"
            value={element.stroke}
            onChange={handleColorChange('stroke')}
          />
          <input
            type="text"
            value={element.stroke}
            onInput={handleColorChange('stroke')}
            class="color-text"
          />
        </div>
        <div class="property-row">
          <label>Width</label>
          <input
            type="number"
            value={element.strokeWidth}
            onInput={handleNumberChange('strokeWidth')}
            min="1"
            step="1"
          />
        </div>
        <div class="property-row">
          <label>Cap</label>
          <select value={element.lineCap} onChange={handleLineCapChange}>
            {LINE_CAP_OPTIONS.map((cap) => (
              <option value={cap}>{cap}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )

  const renderArrowProperties = (element: ArrowElement) => (
    <>
      <div class="property-section">
        <h4>Arrow Points</h4>
        <div class="property-row">
          <label>X1</label>
          <input
            type="number"
            value={element.x}
            onInput={handleNumberChange('x')}
            step="1"
          />
        </div>
        <div class="property-row">
          <label>Y1</label>
          <input
            type="number"
            value={element.y}
            onInput={handleNumberChange('y')}
            step="1"
          />
        </div>
        <div class="property-row">
          <label>X2</label>
          <input
            type="number"
            value={element.x2}
            onInput={handleNumberChange('x2')}
            step="1"
          />
        </div>
        <div class="property-row">
          <label>Y2</label>
          <input
            type="number"
            value={element.y2}
            onInput={handleNumberChange('y2')}
            step="1"
          />
        </div>
      </div>
      <div class="property-section">
        <h4>Stroke</h4>
        <div class="property-row">
          <label>Color</label>
          <input
            type="color"
            value={element.stroke}
            onChange={handleColorChange('stroke')}
          />
          <input
            type="text"
            value={element.stroke}
            onInput={handleColorChange('stroke')}
            class="color-text"
          />
        </div>
        <div class="property-row">
          <label>Width</label>
          <input
            type="number"
            value={element.strokeWidth}
            onInput={handleNumberChange('strokeWidth')}
            min="1"
            step="1"
          />
        </div>
      </div>
      <div class="property-section">
        <h4>Arrowheads</h4>
        <div class="property-row">
          <label>Head Size</label>
          <input
            type="number"
            value={element.headSize}
            onInput={handleNumberChange('headSize')}
            min="4"
            max="50"
            step="1"
          />
        </div>
        <div class="property-row checkbox-row">
          <label>Start Head</label>
          <input
            type="checkbox"
            checked={element.startHead}
            onChange={handleCheckboxChange('startHead')}
          />
        </div>
        <div class="property-row checkbox-row">
          <label>End Head</label>
          <input
            type="checkbox"
            checked={element.endHead}
            onChange={handleCheckboxChange('endHead')}
          />
        </div>
      </div>
    </>
  )

  const renderImageProperties = (element: ImageElement) => {
    let fileInputRef: HTMLInputElement | undefined

    return (
      <div class="property-section">
        <h4>Image</h4>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileSelect}
          style={{ display: 'none' }}
        />
        <div class="property-row">
          <label>Source</label>
          <button
            class="image-upload-btn"
            onClick={() => fileInputRef?.click()}
          >
            Choose File
          </button>
        </div>
        <div class="property-row">
          <label>URL</label>
          <input
            type="text"
            value={element.src.startsWith('data:') ? '(embedded)' : element.src}
            onInput={handleSrcChange}
            placeholder="https://..."
            disabled={element.src.startsWith('data:')}
          />
        </div>
        <Show when={element.src.startsWith('data:')}>
          <div class="property-row">
            <label></label>
            <button
              class="image-clear-btn"
              onClick={() => updateElement({ src: '' })}
            >
              Clear Image
            </button>
          </div>
        </Show>
        <div class="property-row">
          <label>Fit</label>
          <select value={element.objectFit} onChange={handleObjectFitChange}>
            {OBJECT_FIT_OPTIONS.map((fit) => (
              <option value={fit}>{fit}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  // Path segment helpers
  const addPathSegment = (segmentType: 'L' | 'Q' | 'C') => {
    const element = selectedElement() as PathElement
    if (!element || element.type !== 'path') return

    // Parse current path to find last point
    const d = element.d.trim()
    const lastPoint = getLastPathPoint(d)

    let newSegment = ''
    switch (segmentType) {
      case 'L':
        // Line: add 50px to the right
        newSegment = ` L ${lastPoint.x + 50} ${lastPoint.y}`
        break
      case 'Q':
        // Quadratic curve: control point above, end point to the right
        newSegment = ` Q ${lastPoint.x + 25} ${lastPoint.y - 40} ${lastPoint.x + 50} ${lastPoint.y}`
        break
      case 'C':
        // Cubic curve: two control points for S-curve
        newSegment = ` C ${lastPoint.x + 20} ${lastPoint.y - 40} ${lastPoint.x + 30} ${lastPoint.y + 40} ${lastPoint.x + 50} ${lastPoint.y}`
        break
    }

    updateElement({ d: d + newSegment })
  }

  // Helper to get last point from path data
  const getLastPathPoint = (d: string): { x: number; y: number } => {
    const numbers = d.match(/-?[\d.]+/g)
    if (!numbers || numbers.length < 2) return { x: 50, y: 50 }
    const x = parseFloat(numbers[numbers.length - 2])
    const y = parseFloat(numbers[numbers.length - 1])
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y }
  }

  const renderPathProperties = (element: PathElement) => {
    // For SVG paths, we only support string fill values (not gradients)
    const fillStr = typeof element.fill === 'string' ? element.fill : 'transparent'

    return (
    <>
      <div class="property-section">
        <h4>Path Data</h4>
        <div class="property-row">
          <label>SVG Path</label>
          <input
            type="text"
            value={element.d}
            onInput={handlePathDataChange}
            placeholder="M 0 0 L 100 100"
          />
        </div>
        <div class="path-segment-buttons">
          <button class="path-segment-btn" onClick={() => addPathSegment('L')} title="Add straight line">
            + Line
          </button>
          <button class="path-segment-btn" onClick={() => addPathSegment('Q')} title="Add quadratic curve">
            + Curve
          </button>
          <button class="path-segment-btn" onClick={() => addPathSegment('C')} title="Add cubic bezier">
            + S-Curve
          </button>
        </div>
        <p class="path-hint">
          Drag control points on canvas to shape curves
        </p>
      </div>
      <div class="property-section">
        <h4>Appearance</h4>
        <div class="property-row">
          <label>Fill</label>
          <input
            type="color"
            value={fillStr === 'transparent' ? '#000000' : fillStr}
            onChange={handleColorChange('fill')}
          />
          <input
            type="text"
            value={fillStr}
            onInput={handleColorChange('fill')}
            class="color-text"
          />
        </div>
        <div class="property-row">
          <label>Stroke</label>
          <input
            type="color"
            value={element.stroke}
            onChange={handleColorChange('stroke')}
          />
          <input
            type="text"
            value={element.stroke}
            onInput={handleColorChange('stroke')}
            class="color-text"
          />
        </div>
        <div class="property-row">
          <label>Stroke Width</label>
          <input
            type="number"
            value={element.strokeWidth}
            onInput={handleNumberChange('strokeWidth')}
            min="1"
            step="1"
          />
        </div>
        <div class="property-row">
          <label>Line Cap</label>
          <select value={element.lineCap} onChange={handleLineCapChange}>
            {LINE_CAP_OPTIONS.map((cap) => (
              <option value={cap}>{cap}</option>
            ))}
          </select>
        </div>
        <div class="property-row">
          <label>Line Join</label>
          <select value={element.lineJoin} onChange={handleLineJoinChange}>
            {LINE_JOIN_OPTIONS.map((join) => (
              <option value={join}>{join}</option>
            ))}
          </select>
        </div>
        <div class="property-row checkbox-row">
          <label>Closed Path</label>
          <input
            type="checkbox"
            checked={element.closed}
            onChange={handleCheckboxChange('closed')}
          />
        </div>
      </div>

      {/* Motion Path section */}
      <Show when={animatableElements().length > 0}>
        <div class="property-section">
          <h4>
            Motion Path
            <HelpIcon
              content="Animate an element along this path. Select an element and click Apply to create the animation."
              position="left"
            />
          </h4>
          <div class="property-row">
            <label>Element</label>
            <select
              value={motionPathTarget()}
              onChange={(e) => setMotionPathTarget(e.currentTarget.value)}
            >
              <option value="">Select element...</option>
              <For each={animatableElements()}>
                {(el) => <option value={el.name}>{el.name}</option>}
              </For>
            </select>
          </div>
          <div class="property-row">
            <label>Duration</label>
            <input
              type="number"
              value={motionPathDuration()}
              onInput={(e) => setMotionPathDuration(parseInt(e.currentTarget.value) || 2000)}
              min="100"
              step="100"
            />
            <span class="unit">ms</span>
          </div>
          <div class="property-row checkbox-row">
            <label>Auto-Rotate</label>
            <input
              type="checkbox"
              checked={motionPathAutoRotate()}
              onChange={(e) => setMotionPathAutoRotate(e.currentTarget.checked)}
            />
          </div>
          <Show when={motionPathAutoRotate()}>
            <div class="property-row">
              <label>Rotation Offset</label>
              <input
                type="number"
                value={motionPathRotateOffset()}
                onInput={(e) => setMotionPathRotateOffset(parseInt(e.currentTarget.value) || 0)}
                step="15"
              />
              <span class="unit">deg</span>
            </div>
          </Show>
          <div class="property-row">
            <button
              class="apply-motion-path-btn"
              onClick={handleApplyMotionPath}
              disabled={!motionPathTarget()}
            >
              Apply Motion Path
            </button>
          </div>
        </div>
      </Show>
    </>
  )}

  return (
    <div class="property-panel">
      <div class="panel-header">
        <span>Properties</span>
        <HelpIcon
          content="Edit the selected element or keyframe. Change position, size, colors, and animation values here."
          position="left"
        />
      </div>

      <div class="panel-content">
        {/* Show keyframe properties when keyframe is selected */}
        <Show when={selectedKeyframe()}>
          {(keyframe) => (
            <>
              <div class="property-section">
                <h4>Track</h4>
                <div class="property-row">
                  <label>Target</label>
                  <span class="property-value">{selectedTrack()?.target}</span>
                </div>
                <div class="property-row">
                  <label>Property</label>
                  <span class="property-value">{selectedTrack()?.property}</span>
                </div>
              </div>

              <div class="property-section">
                <h4>Keyframe</h4>
                <div class="property-row">
                  <label>Time (ms)</label>
                  <input
                    type="number"
                    value={keyframe().time}
                    onInput={handleTimeChange}
                    min="0"
                    step="10"
                  />
                </div>
                <div class="property-row">
                  <label>Value</label>
                  <input
                    type={typeof keyframe().value === 'number' ? 'number' : 'text'}
                    value={String(keyframe().value)}
                    onInput={handleValueChange}
                    step="0.1"
                  />
                </div>
                <div class="property-row">
                  <label>Easing</label>
                  <select value={getEasingSelectValue(keyframe().easing)} onChange={handleEasingChange}>
                    {BUILTIN_EASING_OPTIONS.map((easing) => (
                      <option value={easing}>{easing}</option>
                    ))}
                    <option value="custom">Custom Curve...</option>
                  </select>
                </div>
                <Show when={isCubicBezierEasing(keyframe().easing)}>
                  <div class="curve-editor-section">
                    <CurveEditor
                      points={getCurrentBezierPoints()}
                      onChange={handleCubicBezierChange}
                      width={180}
                      height={180}
                    />
                  </div>
                </Show>
              </div>

              <div class="property-actions">
                <button class="delete-btn" onClick={handleDeleteKeyframe}>
                  Delete Keyframe
                </button>
              </div>
            </>
          )}
        </Show>

        {/* Show element properties when element is selected (and no keyframe selected) */}
        <Show when={!selectedKeyframe() && selectedElement()}>
          {(element) => (
            <>
              <div class="property-section">
                <h4>Element</h4>
                <div class="property-row">
                  <label>Name</label>
                  <input
                    type="text"
                    value={element().name}
                    onInput={handleElementNameChange}
                  />
                </div>
                <div class="property-row">
                  <label>Type</label>
                  <span class="property-value">{element().type}</span>
                </div>
              </div>

              <Show when={element().type !== 'line' && element().type !== 'arrow'}>
                <div class="property-section">
                  <h4>Transform</h4>
                  <div class="property-row">
                    <label>X</label>
                    <input
                      type="number"
                      value={element().x}
                      onInput={handleNumberChange('x')}
                      step="1"
                    />
                  </div>
                  <div class="property-row">
                    <label>Y</label>
                    <input
                      type="number"
                      value={element().y}
                      onInput={handleNumberChange('y')}
                      step="1"
                    />
                  </div>
                  <div class="property-row">
                    <label>Width</label>
                    <input
                      type="number"
                      value={element().width}
                      onInput={handleNumberChange('width')}
                      min="1"
                      step="1"
                    />
                  </div>
                  <div class="property-row">
                    <label>Height</label>
                    <input
                      type="number"
                      value={element().height}
                      onInput={handleNumberChange('height')}
                      min="1"
                      step="1"
                    />
                  </div>
                  <div class="property-row">
                    <label>Rotation</label>
                    <input
                      type="number"
                      value={element().rotation}
                      onInput={handleNumberChange('rotation')}
                      step="1"
                    />
                  </div>
                  <div class="property-row">
                    <label>Opacity</label>
                    <input
                      type="number"
                      value={element().opacity}
                      onInput={handleNumberChange('opacity')}
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                </div>
              </Show>

              {/* Line and arrow elements have opacity at bottom of their properties */}
              <Show when={element().type === 'line' || element().type === 'arrow'}>
                <div class="property-section">
                  <h4>Display</h4>
                  <div class="property-row">
                    <label>Opacity</label>
                    <input
                      type="number"
                      value={element().opacity}
                      onInput={handleNumberChange('opacity')}
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                </div>
              </Show>

              {/* Type-specific properties */}
              <Switch>
                <Match when={element().type === 'rect'}>
                  {renderRectProperties(element() as RectElement)}
                </Match>
                <Match when={element().type === 'circle'}>
                  {renderCircleProperties(element() as CircleElement)}
                </Match>
                <Match when={element().type === 'text'}>
                  {renderTextProperties(element() as TextElement)}
                </Match>
                <Match when={element().type === 'line'}>
                  {renderLineProperties(element() as LineElement)}
                </Match>
                <Match when={element().type === 'arrow'}>
                  {renderArrowProperties(element() as ArrowElement)}
                </Match>
                <Match when={element().type === 'path'}>
                  {renderPathProperties(element() as PathElement)}
                </Match>
                <Match when={element().type === 'image'}>
                  {renderImageProperties(element() as ImageElement)}
                </Match>
              </Switch>

              <div class="property-actions">
                <button class="delete-btn" onClick={handleDeleteElement}>
                  Delete Element
                </button>
              </div>
            </>
          )}
        </Show>

        {/* Show no selection message */}
        <Show when={!selectedKeyframe() && !selectedElement()}>
          <div class="no-selection">
            <p>Select an element or keyframe to edit properties</p>
          </div>
        </Show>
      </div>
    </div>
  )
}

export default PropertyPanel
