import { Show, createSignal, onCleanup } from 'solid-js'
import type { Component, JSX } from 'solid-js'
import './tooltip.css'

export interface TooltipProps {
  content: string | JSX.Element
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: JSX.Element
  delay?: number
}

export const Tooltip: Component<TooltipProps> = (props) => {
  const [visible, setVisible] = createSignal(false)
  let timeout: number | undefined
  let triggerRef: HTMLDivElement | undefined

  const showTooltip = () => {
    timeout = window.setTimeout(() => {
      setVisible(true)
    }, props.delay ?? 300)
  }

  const hideTooltip = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
    setVisible(false)
  }

  onCleanup(() => {
    if (timeout) clearTimeout(timeout)
  })

  return (
    <div
      class="tooltip-trigger"
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {props.children}
      <Show when={visible()}>
        <div class={`tooltip tooltip-${props.position ?? 'top'}`}>
          <div class="tooltip-content">{props.content}</div>
          <div class="tooltip-arrow" />
        </div>
      </Show>
    </div>
  )
}

export interface HelpIconProps {
  content: string | JSX.Element
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const HelpIcon: Component<HelpIconProps> = (props) => {
  return (
    <Tooltip content={props.content} position={props.position ?? 'top'}>
      <button class="help-icon" type="button" aria-label="Help">
        ?
      </button>
    </Tooltip>
  )
}

export default Tooltip
