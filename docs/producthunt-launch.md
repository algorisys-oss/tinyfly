# tinyfly — Product Hunt Launch Kit

Everything you need to launch **tinyfly** on [producthunt.com](https://www.producthunt.com).
Copy/paste the sections below into the Product Hunt submission form and tweak to taste.

---

## 1. The basics

| Field | Value |
|-------|-------|
| **Name** | tinyfly |
| **Tagline** (≤ 60 chars) | GSAP-level power with Excalidraw-level simplicity |
| **Also consider** | The open-source animation engine you can actually read |
| **Website** | https://github.com/algorisys-oss/tinyfly |
| **Topics / tags** | Design Tools, Animation, Open Source, Developer Tools, Web App, No-Code |
| **Pricing** | Free & open source |
| **Platforms** | Web (runs entirely in the browser) |

### Alternate taglines (pick the one that fits the day)

- Design animations visually, ship them as clean JSON.
- A tiny, inspectable animation engine — with a real editor on top.
- Animate for the web without a heavyweight framework.
- Open-source motion design: prompt it, tweak it, export it anywhere.

---

## 2. Short description (the "what is it" blurb)

> **tinyfly** is a lightweight, API-first animation engine with a visual editor.
> Design timeline animations in the browser — shapes, text, images, video, device
> mockups — then export them as clean, framework-agnostic JSON, CSS, Lottie, GIF,
> WebP, or MP4. The engine has zero UI-framework dependencies and is small enough
> to actually read, so what you build is inspectable and runs anywhere:
> websites, canvas apps, or headless.

---

## 3. The maker's first comment (pin this)

> Hey Hunters 👋
>
> I built tinyfly because animation tooling felt like a false choice: either a
> heavyweight framework you bolt onto your app (and never fully understand), or a
> closed editor that spits out a format you can't inspect.
>
> tinyfly is the opposite of both:
>
> - **Engine first.** The core is framework-agnostic TypeScript — no React, no
>   Solid, no GSAP. It produces animation *state*; adapters apply it to DOM,
>   Canvas, or SVG. You can drive the whole thing from code with no UI at all.
> - **JSON all the way down.** Every timeline, track, keyframe, easing, and loop
>   is plain serializable data. That's what makes AI generation, persistence, and
>   "play it anywhere" fall out for free.
> - **A real editor on top.** Timeline + keyframes, multi-scene, presets,
>   per-letter text animation, device-frame mockups, and export to CSS / Lottie /
>   GIF / WebP / MP4 — all built on the *same* public API you'd use in code.
>
> Today's release adds a **My Animations gallery** so every animation you make is
> saved, thumbnailed, and one click away (backed by IndexedDB), plus a
> **prompt → animation** feature: describe what you want and get an editable
> timeline back (bring your own OpenAI / Gemini / Anthropic key — it stays in your
> browser).
>
> It's free and open source. I'd love your feedback — especially on the engine
> API and where it should go next (symbols/library, camera, onion skinning are on
> the roadmap). AMA! 🚀

---

## 4. Feature highlights (for the gallery captions / description bullets)

1. **Visual timeline editor** — keyframes, tracks, easing, multi-scene, undo/redo.
2. **My Animations gallery** — every project saved with a live thumbnail; open,
   duplicate, or delete. Backed by IndexedDB.
3. **Prompt → animation** — natural-language brief becomes an editable timeline
   (BYO API key; runs client-side).
4. **Text animation** — split-to-letters, staggered presets (drop, cascade,
   wave), typewriter, shine sweep, animatable blur/glow.
5. **Device-frame mockups** — one-click Phone / Landscape / Tablet with a rounded
   video screen; drop in a screen-recording for an app promo.
6. **Export anywhere** — clean JSON, CSS `@keyframes`, Lottie, animated GIF,
   animated WebP, and real MP4 (H.264 via WebCodecs) — all dependency-free.
7. **Framework-agnostic engine** — runs in the browser, Web Workers, or headless;
   DOM / Canvas / SVG adapters.
8. **Embeddable player** — ship a tiny player bundle (npm or CDN) that loads your
   JSON and plays it, with audio/video sync.

---

## 5. Suggested media plan (order matters on PH)

| # | Asset | What it shows |
|---|-------|---------------|
| 1 | **Hero GIF/MP4** | A polished animation being scrubbed in the editor, then the exported MP4 playing. Export it *with tinyfly*. |
| 2 | **Gallery screenshot** | The new My Animations grid with several thumbnails. |
| 3 | **Prompt → animation clip** | Type a prompt, watch the timeline populate, hit play. |
| 4 | **Text animation clip** | Per-letter drop/cascade + shine sweep. |
| 5 | **Device-frame clip** | App-promo mockup with a screen-recording inside the phone. |
| 6 | **Export menu** | The CSS / Lottie / GIF / WebP / MP4 dialog — proof of "export anywhere". |

Tips:
- Lead with motion, not static frames — PH thumbnails autoplay.
- Keep the hero under ~10s and loopable.
- Caption every asset (PH shows them).

---

## 6. Launch-day checklist

- [ ] Ship the release (`v0.19.0`) and confirm the live demo works in a fresh browser.
- [ ] Record the hero clip and 4–5 supporting clips (export them with tinyfly).
- [ ] Draft the maker's first comment (section 3) and have it ready to paste.
- [ ] Schedule for **12:01 AM PT** (Product Hunt's day boundary).
- [ ] Line up the first handful of genuine supporters (no vote-begging — just a heads-up).
- [ ] Prepare answers for the FAQ below.
- [ ] Cross-post: X/Twitter, LinkedIn, relevant subreddits, Hacker News ("Show HN").
- [ ] Stay in the thread all day to reply — engagement drives ranking.

---

## 7. FAQ (pre-write your answers)

**Is it really free?**
Yes — free and open source. Client-side only; there's no account and no server
storing your work.

**How is this different from GSAP / Framer Motion / Lottie?**
tinyfly is an *engine + editor* that emits plain JSON. It doesn't wrap your app in
a runtime framework; it produces animation state that adapters apply. You can also
export *to* Lottie, CSS, GIF, WebP, and MP4 — so it plays nicely with what you
already use.

**Where does my data go? What about the AI feature?**
Everything lives in your browser (now IndexedDB). The prompt → animation feature
is bring-your-own-key: your API key is stored locally and requests go straight
from your browser to the provider (OpenAI / Gemini / Anthropic). We don't proxy
or store anything.

**Can I use just the engine, without the editor?**
Absolutely — that's the whole point. The engine is framework-agnostic TypeScript
and ships as an npm package; the editor is just one consumer of the same public
API.

**Does it work on mobile?**
The editor is responsive and usable on tablets/phones, though it shines on a
desktop. Exported animations and the player run anywhere.

**What's next?**
Symbols + a reusable library, an animated camera (pan/zoom/rotate), onion
skinning, and a pen/shape-morph toolset — see the 2D animation roadmap in the repo.

---

## 8. One-liners for social

- "Animation tooling shouldn't be a black box. tinyfly is an engine you can read
  and an editor built on its own public API. Free & open source. 🚀"
- "Describe an animation → get an editable timeline. Then export it as JSON, CSS,
  Lottie, GIF, WebP, or MP4. All in the browser. Meet tinyfly."
- "GSAP-level power, Excalidraw-level simplicity. tinyfly is live on Product
  Hunt 👇"

---

*Keep this doc updated each launch. It's living copy, not a one-off.*
