/**
 * Set expressions over named sets, for shading Venn diagrams:
 *
 *   A | B    union            A & B    intersection
 *   A - B    difference       A ^ B    symmetric difference
 *   A'  or  !A    complement (within the universe)
 *
 * with brackets and the usual precedence (complement, then &, then | - ^,
 * left to right). `∪ ∩ ∖ △ ¬` are accepted too. An expression is
 * evaluated per Venn cell: given which sets a point is in, is it in the region?
 */
export type SetExpression =
  | { type: 'set'; name: string }
  | { type: 'not'; operand: SetExpression }
  | { type: 'op'; operator: '&' | '|' | '-' | '^'; left: SetExpression; right: SetExpression }

const ALIASES: Record<string, string> = { '∪': '|', '∩': '&', '∖': '-', '△': '^', '¬': '!', '\\': '-' }

export function parseSetExpression(source: string): SetExpression {
  const text = [...source].map((ch) => ALIASES[ch] ?? ch).join('')
  let i = 0
  const space = () => {
    while (/\s/.test(text[i] ?? '')) i++
  }
  const fail = (message: string): never => {
    throw new Error(`set expression: ${message} at ${i + 1} in "${source}"`)
  }
  const atom = (): SetExpression => {
    space()
    let node: SetExpression
    if (text[i] === '!') {
      i++
      node = { type: 'not', operand: atom() }
    } else if (text[i] === '(') {
      i++
      node = union()
      space()
      if (text[i] !== ')') fail('expected ")"')
      i++
    } else {
      const name = /^[A-Za-z]\w*/.exec(text.slice(i))
      if (!name) fail(i >= text.length ? 'unexpected end' : `unexpected "${text[i]}"`)
      i += name![0].length
      node = { type: 'set', name: name![0] }
    }
    space()
    // Postfix complement: A'
    while (text[i] === "'") {
      i++
      node = { type: 'not', operand: node }
      space()
    }
    return node
  }
  const intersection = (): SetExpression => {
    let left = atom()
    space()
    while (text[i] === '&') {
      i++
      left = { type: 'op', operator: '&', left, right: atom() }
      space()
    }
    return left
  }
  const union = (): SetExpression => {
    let left = intersection()
    space()
    while (text[i] === '|' || text[i] === '-' || text[i] === '^') {
      const operator = text[i++] as '|' | '-' | '^'
      left = { type: 'op', operator, left, right: intersection() }
      space()
    }
    return left
  }
  const tree = union()
  space()
  if (i < text.length) fail(`unexpected "${text[i]}"`)
  return tree
}

/** Every set name an expression uses. */
export function setNames(e: SetExpression): string[] {
  if (e.type === 'set') return [e.name]
  if (e.type === 'not') return setNames(e.operand)
  return [...new Set([...setNames(e.left), ...setNames(e.right)])]
}

/** Is a point that lies in exactly the sets in `inside` within the region? */
export function inRegion(e: SetExpression, inside: ReadonlySet<string>): boolean {
  switch (e.type) {
    case 'set': return inside.has(e.name)
    case 'not': return !inRegion(e.operand, inside)
    case 'op': {
      const a = inRegion(e.left, inside)
      const b = inRegion(e.right, inside)
      return e.operator === '&' ? a && b : e.operator === '|' ? a || b : e.operator === '-' ? a && !b : a !== b
    }
  }
}

/**
 * The Venn cells (which sets a point is in) that make up the region, as
 * lists of set names: `[]` is the cell outside every set.
 */
export function regionCells(e: SetExpression, sets: string[]): string[][] {
  const cells: string[][] = []
  for (let mask = 0; mask < 1 << sets.length; mask++) {
    const inside = sets.filter((_, k) => mask & (1 << k))
    if (inRegion(e, new Set(inside))) cells.push(inside)
  }
  return cells
}
