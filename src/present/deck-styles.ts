/**
 * The deck's own styles: the stage, slide changes, step reveals, countdown
 * buttons and the overlays. Every class is prefixed `tf-deck` or `tf-`, and the
 * look is set through custom properties on the deck element:
 *
 *   --tf-deck-bg       slide background (default #fff)
 *   --tf-deck-accent   progress bar, countdown button (default #f0812f)
 *   --tf-deck-panel    overlays and the countdown while running (default #0e2841)
 *   --tf-deck-done     a finished countdown (default #2e9e48)
 *   --tf-deck-font     overlay text (default: the page's font)
 *
 * Slide content is the page's own markup and CSS; nothing here styles it.
 */
export const DECK_CSS = `
html.tf-deck-page, html.tf-deck-page body { margin: 0; height: 100%; background: #000; overflow: hidden; }
.tf-deck { position: absolute; left: 0; top: 0; transform-origin: 0 0; overflow: hidden; background: var(--tf-deck-bg, #fff); }
.tf-deck.tf-idle { cursor: none; }
.tf-deck [data-slide] { position: absolute; inset: 0; opacity: 0; visibility: hidden; background: var(--tf-deck-bg, #fff); transition: opacity .55s ease, visibility 0s linear .55s; }
.tf-deck [data-slide].tf-current { opacity: 1; visibility: visible; z-index: 2; transition: opacity .55s ease, visibility 0s; }
.tf-deck canvas[data-scene] { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
.tf-deck [data-notes] { display: none; }
.tf-deck [data-step] { opacity: 0; transform: translateY(26px); transition: opacity .5s ease, transform .6s cubic-bezier(.2,.9,.25,1.15); }
.tf-deck [data-step][data-reveal="pop"] { transform: scale(.6); }
.tf-deck [data-step][data-reveal="fade"], .tf-deck [data-step][data-reveal="none"] { transform: none; }
.tf-deck [data-step][data-reveal="none"] { transition: none; }
.tf-deck [data-step].tf-on { opacity: 1; transform: none; }
.tf-deck [data-timer] { position: relative; overflow: hidden; min-width: 240px; height: 64px; padding: 0 28px; border: 0; border-radius: 32px; background: var(--tf-deck-accent, #f0812f); color: #fff; font: 700 26px/1 var(--tf-deck-font, inherit); cursor: pointer; }
.tf-deck [data-timer] i { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: rgba(255,255,255,.28); }
.tf-deck [data-timer] span, .tf-deck [data-timer] b { position: relative; }
.tf-deck [data-timer][data-state="running"] { background: var(--tf-deck-panel, #0e2841); cursor: default; }
.tf-deck [data-timer][data-state="running"] b { font-size: 40px; font-variant-numeric: tabular-nums; }
.tf-deck [data-timer][data-state="done"] { background: var(--tf-deck-done, #2e9e48); }
.tf-deck-progress { position: absolute; left: 0; bottom: 0; height: 8px; width: 0; z-index: 50; background: var(--tf-deck-accent, #f0812f); transition: width .5s ease; }
.tf-deck-blank { position: absolute; inset: 0; z-index: 90; background: #000; opacity: 0; pointer-events: none; transition: opacity .3s; }
.tf-deck-blank.tf-white { background: #fff; }
.tf-deck-blank.tf-on { opacity: 1; }
.tf-deck-goto { position: absolute; right: 50px; top: 40px; z-index: 95; display: none; padding: 10px 30px; border-radius: 18px; background: var(--tf-deck-panel, #0e2841); color: #fff; font: 800 54px/1.2 var(--tf-deck-font, inherit); }
.tf-deck-goto.tf-on { display: block; }
.tf-deck-help { position: absolute; inset: 0; z-index: 99; display: none; box-sizing: border-box; padding: 100px 180px; background: var(--tf-deck-panel, #0e2841); color: #fff; font: 400 30px/1.3 var(--tf-deck-font, inherit); opacity: .96; }
.tf-deck-help.tf-on { display: block; }
.tf-deck-help h2 { margin: 0 0 36px; font-size: 52px; }
.tf-deck-help table { border-collapse: collapse; }
.tf-deck-help td { padding: 9px 40px 9px 0; vertical-align: top; }
.tf-deck-help kbd { display: inline-block; margin-right: 6px; padding: 2px 14px; border-radius: 8px; background: #fff; color: #0e2841; font: 700 24px/1.4 var(--tf-deck-font, inherit); }
`

/** The presenter window's styles (it is a separate document). */
export const PRESENTER_CSS = `
body { margin: 0; height: 100vh; display: grid; grid-template-rows: auto 1fr auto; background: #0e2841; color: #fff; font-family: "Segoe UI", Inter, Arial, sans-serif; }
header { display: flex; gap: 40px; align-items: baseline; padding: 22px 34px; background: #071937; }
#timer { font-size: 64px; font-weight: 800; font-variant-numeric: tabular-nums; }
#timer.warn { color: #f0812f; }
#timer.over { color: #ff5a52; }
#left { font-size: 26px; opacity: .85; }
#clock { margin-left: auto; font-size: 30px; opacity: .7; }
main { padding: 28px 34px; overflow: auto; }
#where { font-size: 22px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #f0812f; }
#title { margin: 6px 0 18px; font-size: 44px; font-weight: 800; }
#steps span { display: inline-block; width: 18px; height: 18px; margin-right: 8px; border-radius: 50%; background: #33507a; }
#steps span.on { background: #f0812f; }
#notes { max-width: 1100px; font-size: 30px; line-height: 1.45; white-space: pre-line; }
footer { display: flex; gap: 30px; align-items: center; padding: 18px 34px; background: #071937; font-size: 24px; }
#next { opacity: .85; }
button { padding: 10px 22px; border: 0; border-radius: 10px; font: inherit; font-size: 22px; cursor: pointer; }
`
