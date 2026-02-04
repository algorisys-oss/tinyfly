/**
 * Path editing utilities for visual SVG path manipulation.
 * Parses paths into editable points and rebuilds path strings.
 */

/** Types of editable points */
export type PointType = 'anchor' | 'controlIn' | 'controlOut'

/** An editable point in a path */
export interface EditablePoint {
  id: string
  type: PointType
  x: number
  y: number
  /** For control points, the index of the associated anchor point */
  anchorIndex?: number
  /** Original command type this point belongs to */
  commandType: string
  /** Index of the command in the path */
  commandIndex: number
  /** Index of this point within the command */
  pointIndex: number
}

/** A parsed path command for editing */
export interface EditableCommand {
  type: string
  args: number[]
}

/** Parsed path structure for editing */
export interface EditablePath {
  commands: EditableCommand[]
  points: EditablePoint[]
}

/**
 * Parse an SVG path data string into editable commands and points.
 */
export function parsePathForEditing(pathData: string): EditablePath {
  const commands: EditableCommand[] = []
  const points: EditablePoint[] = []

  let currentX = 0
  let currentY = 0
  let startX = 0
  let startY = 0
  let commandIndex = 0
  let pointIdCounter = 0

  // Parse path commands
  const cmdMatches = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || []

  for (const cmd of cmdMatches) {
    const type = cmd[0]
    const isRelative = type === type.toLowerCase()
    const absType = type.toUpperCase()
    const args = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .filter((s) => s.length > 0)
      .map(parseFloat)

    // Convert relative to absolute for editing
    let absoluteArgs: number[] = []

    switch (absType) {
      case 'M': {
        const x = isRelative ? currentX + args[0] : args[0]
        const y = isRelative ? currentY + args[1] : args[1]
        absoluteArgs = [x, y]
        currentX = x
        currentY = y
        startX = x
        startY = y

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'anchor',
          x,
          y,
          commandType: 'M',
          commandIndex,
          pointIndex: 0,
        })
        break
      }

      case 'L': {
        const x = isRelative ? currentX + args[0] : args[0]
        const y = isRelative ? currentY + args[1] : args[1]
        absoluteArgs = [x, y]
        currentX = x
        currentY = y

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'anchor',
          x,
          y,
          commandType: 'L',
          commandIndex,
          pointIndex: 0,
        })
        break
      }

      case 'H': {
        const x = isRelative ? currentX + args[0] : args[0]
        absoluteArgs = [x, currentY]
        currentX = x

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'anchor',
          x,
          y: currentY,
          commandType: 'L', // Convert H to L for simplicity
          commandIndex,
          pointIndex: 0,
        })
        break
      }

      case 'V': {
        const y = isRelative ? currentY + args[0] : args[0]
        absoluteArgs = [currentX, y]
        currentY = y

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'anchor',
          x: currentX,
          y,
          commandType: 'L', // Convert V to L for simplicity
          commandIndex,
          pointIndex: 0,
        })
        break
      }

      case 'Q': {
        // Quadratic bezier: control point + end point
        const cpx = isRelative ? currentX + args[0] : args[0]
        const cpy = isRelative ? currentY + args[1] : args[1]
        const x = isRelative ? currentX + args[2] : args[2]
        const y = isRelative ? currentY + args[3] : args[3]
        absoluteArgs = [cpx, cpy, x, y]

        const anchorIndex = points.length + 1 // Will be added after control point

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'controlOut',
          x: cpx,
          y: cpy,
          anchorIndex,
          commandType: 'Q',
          commandIndex,
          pointIndex: 0,
        })

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'anchor',
          x,
          y,
          commandType: 'Q',
          commandIndex,
          pointIndex: 1,
        })

        currentX = x
        currentY = y
        break
      }

      case 'C': {
        // Cubic bezier: control point 1 + control point 2 + end point
        const cp1x = isRelative ? currentX + args[0] : args[0]
        const cp1y = isRelative ? currentY + args[1] : args[1]
        const cp2x = isRelative ? currentX + args[2] : args[2]
        const cp2y = isRelative ? currentY + args[3] : args[3]
        const x = isRelative ? currentX + args[4] : args[4]
        const y = isRelative ? currentY + args[5] : args[5]
        absoluteArgs = [cp1x, cp1y, cp2x, cp2y, x, y]

        const anchorIndex = points.length + 2 // Will be added after both control points

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'controlOut',
          x: cp1x,
          y: cp1y,
          anchorIndex,
          commandType: 'C',
          commandIndex,
          pointIndex: 0,
        })

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'controlIn',
          x: cp2x,
          y: cp2y,
          anchorIndex,
          commandType: 'C',
          commandIndex,
          pointIndex: 1,
        })

        points.push({
          id: `pt-${pointIdCounter++}`,
          type: 'anchor',
          x,
          y,
          commandType: 'C',
          commandIndex,
          pointIndex: 2,
        })

        currentX = x
        currentY = y
        break
      }

      case 'Z': {
        absoluteArgs = []
        currentX = startX
        currentY = startY
        break
      }

      default:
        // For unsupported commands, just store them as-is
        absoluteArgs = args
        break
    }

    // Store the command with absolute coordinates
    commands.push({
      type: absType === 'H' || absType === 'V' ? 'L' : absType, // Normalize H/V to L
      args: absoluteArgs,
    })

    commandIndex++
  }

  return { commands, points }
}

/**
 * Rebuild path string from edited commands.
 */
export function buildPathString(commands: EditableCommand[]): string {
  return commands
    .map((cmd) => {
      if (cmd.type === 'Z') {
        return 'Z'
      }
      const argsStr = cmd.args.map((n) => Math.round(n * 100) / 100).join(' ')
      return `${cmd.type} ${argsStr}`
    })
    .join(' ')
}

/**
 * Update a point in the editable path and return new commands.
 */
export function updatePathPoint(
  commands: EditableCommand[],
  points: EditablePoint[],
  pointId: string,
  newX: number,
  newY: number
): EditableCommand[] {
  const point = points.find((p) => p.id === pointId)
  if (!point) return commands

  const newCommands = commands.map((cmd) => ({
    type: cmd.type,
    args: [...cmd.args],
  }))

  const cmd = newCommands[point.commandIndex]
  if (!cmd) return commands

  // Update the coordinates in the command args
  switch (cmd.type) {
    case 'M':
    case 'L': {
      cmd.args[0] = newX
      cmd.args[1] = newY
      break
    }

    case 'Q': {
      // pointIndex 0 = control point, 1 = end anchor
      if (point.pointIndex === 0) {
        cmd.args[0] = newX
        cmd.args[1] = newY
      } else {
        cmd.args[2] = newX
        cmd.args[3] = newY
      }
      break
    }

    case 'C': {
      // pointIndex 0 = cp1, 1 = cp2, 2 = end anchor
      if (point.pointIndex === 0) {
        cmd.args[0] = newX
        cmd.args[1] = newY
      } else if (point.pointIndex === 1) {
        cmd.args[2] = newX
        cmd.args[3] = newY
      } else {
        cmd.args[4] = newX
        cmd.args[5] = newY
      }
      break
    }
  }

  return newCommands
}

/**
 * Get control lines for visualization (lines from anchor to control points).
 */
export function getControlLines(
  commands: EditableCommand[],
  _points: EditablePoint[]
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []

  let prevAnchorX = 0
  let prevAnchorY = 0

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i]

    if (cmd.type === 'M' || cmd.type === 'L') {
      prevAnchorX = cmd.args[0]
      prevAnchorY = cmd.args[1]
    } else if (cmd.type === 'Q') {
      // Control point to previous anchor
      lines.push({
        x1: prevAnchorX,
        y1: prevAnchorY,
        x2: cmd.args[0],
        y2: cmd.args[1],
      })
      // Control point to end anchor
      lines.push({
        x1: cmd.args[0],
        y1: cmd.args[1],
        x2: cmd.args[2],
        y2: cmd.args[3],
      })
      prevAnchorX = cmd.args[2]
      prevAnchorY = cmd.args[3]
    } else if (cmd.type === 'C') {
      // CP1 to previous anchor
      lines.push({
        x1: prevAnchorX,
        y1: prevAnchorY,
        x2: cmd.args[0],
        y2: cmd.args[1],
      })
      // CP2 to end anchor
      lines.push({
        x1: cmd.args[2],
        y1: cmd.args[3],
        x2: cmd.args[4],
        y2: cmd.args[5],
      })
      prevAnchorX = cmd.args[4]
      prevAnchorY = cmd.args[5]
    }
  }

  return lines
}
