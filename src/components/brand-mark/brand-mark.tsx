import { createUniqueId, Show } from 'solid-js'
import type { Component, JSX } from 'solid-js'
import './brand-mark.css'

/**
 * The tinyfly icon: a small fly with a motion trail. Its wings flap when the
 * brand is hovered. Decorative — the wordmark next to it carries the name.
 */
export const TinyflyIcon: Component<{ size?: number; class?: string }> = (props) => {
  // Several icons can be on one page; each needs its own gradient id.
  const gradient = `tinyfly-icon-${createUniqueId()}`
  return (
    <svg
      class={`tinyfly-icon ${props.class ?? ''}`}
      viewBox="0 0 32 32"
      width={props.size ?? 22}
      height={props.size ?? 22}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#c6ff3d" />
          <stop offset="1" stop-color="#4a9eff" />
        </linearGradient>
      </defs>
      <path class="tinyfly-icon-trail" d="M3 27c4.5-.5 7.5-3 9.5-6.5" stroke={`url(#${gradient})`} stroke-width="2" stroke-linecap="round" fill="none" />
      <g class="tinyfly-icon-wing tinyfly-icon-wing-back">
        <ellipse cx="14.5" cy="10.5" rx="4" ry="7.5" transform="rotate(-38 14.5 10.5)" />
      </g>
      <g class="tinyfly-icon-wing tinyfly-icon-wing-front">
        <ellipse cx="21" cy="9.5" rx="4" ry="7.5" transform="rotate(28 21 9.5)" />
      </g>
      <ellipse cx="18" cy="18.5" rx="4.2" ry="6.4" transform="rotate(40 18 18.5)" fill={`url(#${gradient})`} />
      <circle cx="22.6" cy="13.4" r="2.6" fill={`url(#${gradient})`} />
    </svg>
  )
}

/** The BETA label, with a light sweeping across it now and then. */
export const BetaBadge: Component<{ class?: string }> = (props) => (
  <span class={`beta-badge ${props.class ?? ''}`} title="tinyfly is in beta — expect rough edges">
    Beta
  </span>
)

/**
 * Icon, wordmark and beta badge, as one block for page headers. Pass `wordmark`
 * to render the name inside a heading or link of your own.
 */
export const BrandMark: Component<{
  beta?: boolean
  size?: number
  class?: string
  wordmark?: JSX.Element
}> = (props) => (
  <span class={`brand-mark ${props.class ?? ''}`}>
    <TinyflyIcon size={props.size} />
    <span class="brand-mark-name">{props.wordmark ?? 'tinyfly'}</span>
    <Show when={props.beta !== false}>
      <BetaBadge />
    </Show>
  </span>
)
