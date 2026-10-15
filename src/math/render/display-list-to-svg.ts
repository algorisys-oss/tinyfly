import type { Vec2 } from '../linear/vec2'
import type { DisplayList, Shape } from '../figure/display-list'
import { arrowGeometry } from './arrow'

/** Two decimals: plenty for screen pixels, and keeps the markup small. */
const n = (v: number) => String(Math.round(v * 100) / 100)

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const pathOf = (points: Vec2[], closed = false) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('') + (closed ? 'Z' : '')

const opacityOf = (shape: Shape) => (shape.opacity !== undefined && shape.opacity < 1 ? ` opacity="${n(shape.opacity)}"` : '')

function shapeToSvg(shape: Shape): string {
  switch (shape.type) {
    case 'line': {
      if (shape.points.length < 2) return ''
      const fill = shape.fill ? ` fill="${escape(shape.fill)}"` : ' fill="none"'
      const stroke = shape.stroke && (shape.width ?? 1) > 0 ? ` stroke="${escape(shape.stroke)}" stroke-width="${n(shape.width ?? 1)}"` : ''
      const dash = shape.dash?.length ? ` stroke-dasharray="${shape.dash.map(n).join(' ')}"` : ''
      return `<path d="${pathOf(shape.points, shape.closed)}"${fill}${stroke}${dash}${opacityOf(shape)}/>`
    }
    case 'arrow': {
      const { shaft, head } = arrowGeometry(shape.points, shape.head)
      const color = escape(shape.stroke)
      const line = shaft.length >= 2 ? `<path d="${pathOf(shaft)}" fill="none" stroke="${color}" stroke-width="${n(shape.width)}"/>` : ''
      const tip = head ? `<path d="${pathOf(head, true)}" fill="${color}"/>` : ''
      return `<g${opacityOf(shape)}>${line}${tip}</g>`
    }
    case 'circle': {
      const fill = shape.fill ? ` fill="${escape(shape.fill)}"` : ' fill="none"'
      const stroke = shape.stroke ? ` stroke="${escape(shape.stroke)}" stroke-width="${n(shape.width ?? 1)}"` : ''
      return `<circle cx="${n(shape.x)}" cy="${n(shape.y)}" r="${n(shape.r)}"${fill}${stroke}${opacityOf(shape)}/>`
    }
    case 'text': {
      const anchor = shape.align === 'center' ? 'middle' : shape.align === 'right' ? 'end' : 'start'
      const style = shape.italic ? ' font-style="italic"' : ''
      return `<text x="${n(shape.x)}" y="${n(shape.y)}" font-size="${n(shape.size)}" font-family="${escape(shape.font)}"${style} text-anchor="${anchor}" fill="${escape(shape.color)}"${opacityOf(shape)}>${escape(shape.text)}</text>`
    }
  }
}

/** The inner markup of a display list (what goes inside its `<svg>`). */
export function displayListToSvgContent(list: DisplayList): string {
  const background = list.background ? `<rect width="${n(list.width)}" height="${n(list.height)}" fill="${escape(list.background)}"/>` : ''
  return `${background}<g stroke-linecap="round" stroke-linejoin="round">${list.shapes.map(shapeToSvg).join('')}</g>`
}

/**
 * A display list as a standalone SVG document: for embedding, static export,
 * RSS, email and print. `title` becomes the figure's accessible name.
 */
export function displayListToSvg(list: DisplayList, options: { title?: string } = {}): string {
  const title = options.title ? `<title>${escape(options.title)}</title>` : ''
  const label = options.title ? ` role="img" aria-label="${escape(options.title)}"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(list.width)} ${n(list.height)}" width="${n(list.width)}" height="${n(list.height)}"${label}>${title}${displayListToSvgContent(list)}</svg>`
}
