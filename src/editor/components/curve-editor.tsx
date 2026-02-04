import { createSignal, createEffect, onMount, onCleanup } from 'solid-js'
import type { Component } from 'solid-js'
import type { CubicBezierPoints } from '../../engine/types'
import { createCubicBezier } from '../../engine/interpolation/easing'
import './curve-editor.css'

interface CurveEditorProps {
  /** Current control points [cp1x, cp1y, cp2x, cp2y] */
  points: CubicBezierPoints
  /** Callback when points change */
  onChange: (points: CubicBezierPoints) => void
  /** Optional width (default 200) */
  width?: number
  /** Optional height (default 200) */
  height?: number
}

/** Common easing presets for quick selection */
export const EASING_PRESETS: { name: string; points: CubicBezierPoints }[] = [
  { name: 'Linear', points: [0.25, 0.25, 0.75, 0.75] },
  { name: 'Ease', points: [0.25, 0.1, 0.25, 1.0] },
  { name: 'Ease In', points: [0.42, 0, 1.0, 1.0] },
  { name: 'Ease Out', points: [0, 0, 0.58, 1.0] },
  { name: 'Ease In Out', points: [0.42, 0, 0.58, 1.0] },
  { name: 'Ease In Back', points: [0.6, -0.28, 0.735, 0.045] },
  { name: 'Ease Out Back', points: [0.175, 0.885, 0.32, 1.275] },
  { name: 'Ease In Out Back', points: [0.68, -0.55, 0.265, 1.55] },
]

export const CurveEditor: Component<CurveEditorProps> = (props) => {
  const width = () => props.width ?? 200
  const height = () => props.height ?? 200
  const padding = 20

  let svgRef: SVGSVGElement | undefined
  const [dragging, setDragging] = createSignal<'cp1' | 'cp2' | null>(null)

  // Local state for points during drag (smoother interaction)
  const [localPoints, setLocalPoints] = createSignal<CubicBezierPoints>(props.points)

  // Sync local state when props change (but not during drag)
  createEffect(() => {
    if (!dragging()) {
      setLocalPoints(props.points)
    }
  })

  // Convert normalized coordinates (0-1) to SVG coordinates
  const toSvgX = (x: number) => padding + x * (width() - 2 * padding)
  const toSvgY = (y: number) => height() - padding - y * (height() - 2 * padding)

  // Convert SVG coordinates to normalized coordinates (0-1)
  const fromSvgX = (svgX: number) => (svgX - padding) / (width() - 2 * padding)
  const fromSvgY = (svgY: number) => (height() - padding - svgY) / (height() - 2 * padding)

  // Generate the curve path
  const curvePath = () => {
    const pts = localPoints()
    const easing = createCubicBezier(pts)
    const segments: string[] = []

    // Start at origin
    segments.push(`M ${toSvgX(0)} ${toSvgY(0)}`)

    // Sample the curve at many points for smooth rendering
    const steps = 50
    for (let i = 1; i <= steps; i++) {
      const x = i / steps
      const y = easing(x)
      segments.push(`L ${toSvgX(x)} ${toSvgY(y)}`)
    }

    return segments.join(' ')
  }

  // Control point positions
  const cp1 = () => ({ x: toSvgX(localPoints()[0]), y: toSvgY(localPoints()[1]) })
  const cp2 = () => ({ x: toSvgX(localPoints()[2]), y: toSvgY(localPoints()[3]) })

  // Handle mouse events
  const handleMouseDown = (point: 'cp1' | 'cp2') => (e: MouseEvent) => {
    e.preventDefault()
    setDragging(point)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging() || !svgRef) return

    const rect = svgRef.getBoundingClientRect()
    const svgX = e.clientX - rect.left
    const svgY = e.clientY - rect.top

    // Convert to normalized coordinates and clamp
    let x = fromSvgX(svgX)
    let y = fromSvgY(svgY)

    // X should be between 0 and 1
    x = Math.max(0, Math.min(1, x))
    // Y can go slightly outside 0-1 for overshoot effects (e.g., bounce)
    y = Math.max(-0.5, Math.min(1.5, y))

    const pts = [...localPoints()] as CubicBezierPoints
    if (dragging() === 'cp1') {
      pts[0] = x
      pts[1] = y
    } else {
      pts[2] = x
      pts[3] = y
    }

    setLocalPoints(pts)
  }

  const handleMouseUp = () => {
    if (dragging()) {
      // Commit the change
      props.onChange(localPoints())
      setDragging(null)
    }
  }

  // Global mouse listeners for drag
  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  })

  onCleanup(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  })

  // CSS value display
  const cssValue = () => {
    const pts = localPoints()
    return `cubic-bezier(${pts.map((p) => p.toFixed(2)).join(', ')})`
  }

  return (
    <div class="curve-editor">
      <svg
        ref={svgRef}
        width={width()}
        height={height()}
        class="curve-editor-svg"
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#333"
              stroke-width="0.5"
            />
          </pattern>
        </defs>
        <rect
          x={padding}
          y={padding}
          width={width() - 2 * padding}
          height={height() - 2 * padding}
          fill="url(#grid)"
        />

        {/* Diagonal reference line (linear) */}
        <line
          x1={toSvgX(0)}
          y1={toSvgY(0)}
          x2={toSvgX(1)}
          y2={toSvgY(1)}
          stroke="#444"
          stroke-width="1"
          stroke-dasharray="4 4"
        />

        {/* Control point handles (lines from endpoints to control points) */}
        <line
          x1={toSvgX(0)}
          y1={toSvgY(0)}
          x2={cp1().x}
          y2={cp1().y}
          stroke="#666"
          stroke-width="1"
        />
        <line
          x1={toSvgX(1)}
          y1={toSvgY(1)}
          x2={cp2().x}
          y2={cp2().y}
          stroke="#666"
          stroke-width="1"
        />

        {/* The bezier curve */}
        <path
          d={curvePath()}
          fill="none"
          stroke="#4a9eff"
          stroke-width="2"
        />

        {/* Start and end points (fixed) */}
        <circle cx={toSvgX(0)} cy={toSvgY(0)} r="4" fill="#888" />
        <circle cx={toSvgX(1)} cy={toSvgY(1)} r="4" fill="#888" />

        {/* Control point 1 (draggable) */}
        <circle
          cx={cp1().x}
          cy={cp1().y}
          r="8"
          class="curve-editor-handle"
          classList={{ dragging: dragging() === 'cp1' }}
          onMouseDown={handleMouseDown('cp1')}
        />

        {/* Control point 2 (draggable) */}
        <circle
          cx={cp2().x}
          cy={cp2().y}
          r="8"
          class="curve-editor-handle"
          classList={{ dragging: dragging() === 'cp2' }}
          onMouseDown={handleMouseDown('cp2')}
        />

        {/* Axis labels */}
        <text x={width() / 2} y={height() - 4} class="curve-editor-label">
          Time
        </text>
        <text
          x={8}
          y={height() / 2}
          class="curve-editor-label"
          transform={`rotate(-90, 8, ${height() / 2})`}
        >
          Progress
        </text>
      </svg>

      {/* CSS value display */}
      <div class="curve-editor-value">
        <code>{cssValue()}</code>
      </div>

      {/* Preset buttons */}
      <div class="curve-editor-presets">
        {EASING_PRESETS.map((preset) => (
          <button
            class="curve-preset-btn"
            onClick={() => {
              setLocalPoints(preset.points)
              props.onChange(preset.points)
            }}
            title={`cubic-bezier(${preset.points.join(', ')})`}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CurveEditor
