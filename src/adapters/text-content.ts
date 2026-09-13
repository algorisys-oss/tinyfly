/**
 * Set an element's text for a text track.
 *
 * When the element holds exactly one text node, that node's `data` is updated
 * in place rather than replacing the node. UI frameworks that rendered the text
 * (the editor's Solid preview, a React app) keep a reference to that node; if it
 * were swapped out, their later updates would land on a detached node and never
 * show. Anything else gets its `textContent` replaced. Unchanged text is left
 * alone, so a settled string does not touch the DOM every frame.
 */
export function setTextContent(element: Element, value: string): void {
  const only = element.childNodes.length === 1 ? element.firstChild : null
  if (only && only.nodeType === 3) {
    const textNode = only as Text
    if (textNode.data !== value) textNode.data = value
    return
  }
  if (element.textContent !== value) element.textContent = value
}
