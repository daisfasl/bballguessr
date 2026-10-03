# Frontend redesign plan: "printed box score"

Goal: make bballguessr feel personal and basketbally while staying minimal. References are in `mood-board/`.
Scope is frontend only, no backend changes. Production: https://bballguessr.vercel.app. Branch: `redesign`.

**Every implementer (main session and agents) loads the `frontend-design` skill before writing UI code.**

## Design review: what changed after the frontend-design pass

The mood board fixes the overall direction: paper, grotesk, mono annotations, print textures. Where the board left a choice open, the first draft fell back on generic defaults. Those are revised here:

1. **Paper:** moved from warm cream (it sits right on the generic "#F4F1EA" default) to a cooler **concrete/newsprint grey-bone**, taken from the concrete-wall hoop ref. Ink is true black, softened by the grain rather than by tinting it.
2. **Mono caps only where it is real annotation:** stat table headers, the HUD, ball callouts and pills. No uppercase eyebrow labels above headings: no "WHO'S THIS?" prompt, no "FINAL SCORE" eyebrow, no header "DATA //" string.
3. **Numbering only for real sequences:** rounds get 01–05 (HUD, recap). The mode picker loses its numbers, because modes aren't a sequence.
4. **No middle-dot meta strings and no "→" in buttons.** Captions are short plain sentences ("Got it in 2"). Ranges use an en dash (1947–2026).
5. **Buttons and copy are sentence case** in Inter or Archivo ("Quick play", "Next round", "Play again"), not mono caps.
6. **One orchestrated moment:** the round reveal (the dithered headshot "develops", then the name lands). Drop the page-enter fade on every page. Other motion only answers the user's actions (wrong-guess shake, score tick). The Home ball spin is the only ambient motion.
7. **Boldness in one place:** the print/halftone treatment (the ball and the dithered headshots) is the signature. Court lines stay barely visible, and everything else stays quiet.
8. **Attribution, not chrome:** the Home footer becomes a plain "Stats from Basketball-Reference.com" credit.

## Decisions (locked)

| Area | Decision |
|---|---|
| Type | Heavy, tight grotesk for display + Inter body + mono for labels/stats/annotations. Drop Playfair. |
| Color | **Pure monochrome.** Ink on bone paper. State is shown by fill, inversion, weight and strike-through, never by hue. |
| Imagery | Paper grain everywhere, faint court linework behind the game screen, one hero piece (halftone ball) on Home only. |
| Art source | Code-generated (SVG/canvas). No external image assets. |
| Hero | Halftone/engraved basketball with mono crosshair callouts. |
| Reveal | Headshot dithered on a canvas (1-bit, print look). |
| Motion | Subtle. Everything off under `prefers-reduced-motion`. |
| Stats table | Box-score print: mono, tabular nums, heavy header rule, sticky Season column, Awards as pills. |
| Wrong guesses | Struck-through outlined pills above the input, reset each round. |
| Game over | Client-side round recap (01–05) under a huge score. |
| Extra scope | Mobile pass, dark mode, favicon + OG image. |

## Design system

### Tokens (`src/css/index.css`)

```
Light ("concrete")             Dark ("blacktop")
--paper      #E4E2DC           #151514
--paper-2    #D9D6CE  (insets) #1E1E1C
--ink        #000000           #E4E2DC
--ink-2      #34332F           #B9B6AE
--muted      #6E6B64           #8C8981
--rule       #C4C0B6           #34332F
--grain-opacity 0.10           0.07
--grain-blend   multiply       screen
```

- Theme = `prefers-color-scheme`, overridable via `data-theme="light|dark"` on `<html>` (small toggle in the header, saved to `localStorage` inside try/catch).
- Keep the token names the current CSS already uses (`--bg`→`--paper`, `--paper`→`--paper-2`, `--ink`, `--muted`, `--rule`) and do the rename in one pass so nothing drifts.

### Type

- Display: **Archivo** (Google Fonts, variable `wght` 100–900, `wdth` 62–125). Use 800–900, `letter-spacing: -0.045em`, `line-height: 0.9`. It's the closest free match to the "ZION" / "Screenshots" refs. Fallback candidate: Inter Tight 800.
- Body: Inter 400/500 (already loaded).
- Mono: **IBM Plex Mono** 400/500. Used only for data and annotation: the HUD, stat numbers and headers, pills, and ball callouts. Uppercase, `letter-spacing: 0.08em`, ~0.72rem. Body copy, buttons and captions stay in Inter, sentence case.
- Remove the Playfair `<link>` in `index.html`. Set `font-variant-numeric: tabular-nums` on mono.
- Check with a type specimen screenshot at the end of Phase 0 before building screens.

### Texture

- **Grain:** `body::before` fixed full-viewport layer with an inline SVG `feTurbulence` data-URI, `pointer-events: none`, opacity and blend mode from tokens. Static (no animated grain, for perf and calm).
- **Court lines:** `<CourtLines />` SVG (half-court: baseline, key, free-throw circle, restricted arc, 3pt arc). Stroke `currentColor` at ~5% opacity, fixed and cropped off the bottom-right of the game screen. Thin 1px strokes with `vector-effect: non-scaling-stroke`.

### Primitives (CSS classes plus tiny components where it helps)

- `.label`: mono, uppercase, muted. Audit the existing usages: keep it on data and annotations, and turn eyebrow-style uses into plain Inter text or delete them.
- `.display`: Archivo heavy (restyle of the existing class).
- `.pill`: 1px ink outline, fully rounded, mono label, `padding: .2em .7em`. Variants `.pill-solid` (inverted) and `.pill-struck` (line-through + muted).
- `.btn`: replaces `.Home-start` and `.RoundReveal-continue` (both are the same button now). Solid ink, square corners, Inter 600, sentence case, no arrow. Hover inverts to outline. `.btn-ghost` is the outline variant.
- `<Crosshair label="5 ROUNDS" />`: a thin `+` glyph with a mono label stacked beside it (the "BREAK ANKLES" ref).
- `.callout-num`: small square with a mono `01` in it, inverted (the Zion poster markers but monochrome). **Rounds only.**
- `.rule` stays as the hairline; add `.rule-heavy` (2px ink) for table headers and section breaks.

### Header (`<SiteHeader />`, rendered in `App.tsx`)

Minimal: the `bballguessr` wordmark (Archivo 800, small) linking home on the left, and the theme toggle (a half-filled circle glyph, `aria-label="Switch to dark theme"`) on the right. Nothing else. Hidden on Home (Home *is* the wordmark); Home still shows the toggle in a corner.

## Art components

### `HalftoneBall` (Home hero)

- SVG, sized by a prop (default 320px, and about 220px on mobile).
- Dot layer: generate a hex grid of `<circle>`s clipped to a disc. Radius per dot comes from a fake sphere lighting function (light source top-left, Lambert shading + rim darkening), so it reads as a 3D engraved ball. Fill is `currentColor` (works in dark mode for free). Generate once with `useMemo`, ~1.5–2.5k circles.
- Seam layer: the four classic basketball seams as SVG paths, stroke `currentColor`, ~2.5px, on top of the dots.
- Motion: only the seam group rotates slowly (≈60s per turn) while the shading stays still, which reads as the ball spinning under a fixed light. Off under reduced motion.
- Callouts placed around it with `<Crosshair>`: `5 ROUNDS`, `3 GUESSES`, `1947–2026`. They're true facts about the game, which is why they earn the annotation style.

### `DitheredImage` (round reveal)

- Props: `src`, `alt`, `size`. Loads with `img.crossOrigin = "anonymous"`. **Verified: basketball-reference's CDN returns `access-control-allow-origin: *`**, so `getImageData` won't be tainted.
- Pipeline: draw at native size → grayscale → contrast/levels stretch → **Atkinson dither** to 1-bit → paint "on" pixels with the computed `--ink` and "off" pixels transparent (so paper and grain show through) → scale up with `image-rendering: pixelated` at an integer factor for a chunky print look. Headshots are small, so this is cheap.
- Re-render when the theme changes (watch `data-theme` / `matchMedia`).
- Fallback: on load error or a canvas security error, render a plain `<img>` with `filter: grayscale(1) contrast(1.1)`. If there's no `img_url`, render a small `HalftoneBall` in the frame.
- Frame: square, with four corner tick marks (crosshair corners) and a mono caption under it.
- Motion: a 400ms "develop" (opacity plus a slight `steps()` reveal). Off under reduced motion.

### `CourtLines` (see Texture above)

### Favicon + OG

- `public/favicon.svg`: ball glyph (circle + seams). An embedded `<style>` with `@media (prefers-color-scheme: dark)` flips the stroke. Replace the current Vite favicon. Delete `public/icons.svg` if unused (check first).
- `public/og.png` 1200×630: concrete paper, grain, the halftone ball on the right, `bballguessr` in Archivo on the left, and one line in Inter: "Guess the NBA player from their stats." Built **in Phase 3** (it needs the final type and the ball): render a standalone `og.html` from the scratchpad at 1200×630 in Chrome and screenshot it. Commit only the PNG.
- `index.html`: `<meta name="description">`, `og:title`, `og:description`, `og:image=https://bballguessr.vercel.app/og.png`, `og:url=https://bballguessr.vercel.app`, `twitter:card=summary_large_image`, `theme-color` (light and dark).

## Screens

### Home (`pages/home.tsx`)

Stacked and centered like the "Screenshots" ref:

```
                 + 5 ROUNDS
          [ halftone ball ]          + 3 GUESSES
        + 1947→2026

             bballguessr                 ← Archivo 900, clamp(3.5rem, 12vw, 8rem)

    Five NBA players. Only their basketball-reference
    stat lines to go on. Three guesses each round.   ← Inter, muted, max 42ch

       [ Quick play ]   [ Create challenge ] (SOON)

         Stats from Basketball-Reference.com       ← Inter, small, muted
```

Move the inline `style={{…}}` blocks into CSS classes.

### Play (`pages/Play.tsx`, `ModePicker`, `CustomFilters`)

- Title "Choose a mode" in Archivo. The back link becomes `.label` with `←`.
- ModePicker rows (no numbering, since modes aren't a sequence):
  `Curated ........................ ~470 players` with the name in Archivo, the count in mono and right-aligned, and the blurb on a second line in Inter.
  The selected row is **inverted** (ink background, paper text). That's the monochrome selection state and replaces the `→` prefix. Hover shows a hairline underline.
  Split each hint into a `count` and a `blurb` field so the count can be right-aligned.
- CustomFilters: mono inputs with an underline-only border (2px ink) and labels as `.label`. Era renders as `[1947] → [2026]`. Keep the existing clamp logic unchanged.
- The Start button is `.btn` ("Start game"). Errors are a plain sentence that says what to change, e.g. "No players match these filters. Lower the minimums or widen the era." (keep the server's `detail` when it has one).

### Game (`pages/GameScreen.tsx` and components)

Layout top to bottom: HUD → stats table → guess history → input. `<CourtLines>` sits behind. There's no heading: the table is the hero, and the input placeholder ("Who is it?") does the prompting.

- **ScoreHUD:** `+ ROUND 02/05` · guess pips · `PTS 06`. Pips are small ball glyphs: filled ink circle with seams = remaining, hollow outline = used. When the score changes, the number ticks up (count animation, ~400ms).
- **StatsTable:** box-score print.
  - Everything in mono, tabular nums, right-aligned numbers, left-aligned Season/Team/Lg/Pos.
  - Header: mono uppercase muted, `.rule-heavy` underneath.
  - Rows: hairline separators, subtle `--paper-2` hover row.
  - Season column is `position: sticky; left: 0` with a paper background, and the scroll container gets edge-fade masks to hint at horizontal scroll.
  - Awards: split the raw string on `,` (bbref format, e.g. `MVP-1,AS,NBA1`) and render each as a small `.pill`.
  - Career/total rows (if present) get bold weight and a `.rule-heavy` above them.
  - Put the pivot/format helpers in `lib/stats.ts` (e.g. `splitAwards`).
- **Guess history:** wrong guesses as `.pill .pill-struck` above the input. On each new wrong guess the input does a ~250ms horizontal shake. The message becomes "Not him. 2 guesses left." in Inter.
  - Needs `PlayerAutocompleteInput.onGuess` to pass the whole `PlayerMatch` (name + id) instead of only the id. Update the one call site.
- **PlayerAutocompleteInput:** large (1.25rem), underline-only 2px ink border, placeholder "Who is it?". The dropdown is a paper card with a 1px ink border; the active item is inverted. **Add keyboard nav** (↑/↓/Enter/Esc plus `aria-activedescendant`, `role="combobox"`/`listbox`). It's currently mouse-only, and this is the main interaction.
- **Loading:** a small spinning ball glyph plus "Loading round…". **Error:** "This game has expired or the server restarted." plus a `.btn` "Start a new game". (Sessions live in memory, so this really happens.)

### Round reveal (`components/RoundReveal.tsx`)

```
   ┌                 ┐
     [dithered img]        ← DitheredImage, 200–240px, crosshair corners
   └                 ┘
   (+2)  or  (MISSED)                      ← pill-solid vs pill-struck
   LeBron James                            ← Archivo 900, clamp(2.5rem, 7vw, 4.5rem)
   Got it in 2.  /  Out of guesses.        ← Inter, muted
   [ Next round ]   (last round: [ See results ])
```

### Game over

- A huge score in Archivo (`11` at ~10rem) with a small mono `/15` beside it. No eyebrow label.
- Recap list, one row per round: `[01]  LeBron James .............. ●●○ +2` and, for a miss, `[03]  ~~Tim Duncan~~ ........ MISSED`.
- `[ Play again ]` `.btn` (same mode, back to `/play`), plus a `.btn-ghost` "Home".
- **State:** in `GameScreen`, keep `recap: { player: RevealedPlayer; correct: boolean; points: number }[]`. Push to it whenever a guess returns `revealed_player`. Points = `res.current_score - prevScore` (scoring is `guesses_remaining + 1`, i.e. 3/2/1, and 0 on a miss). It's lost on refresh. In that case show only the score, without the recap.

## Motion (all gated by `@media (prefers-reduced-motion: no-preference)`)

- **The one orchestrated moment, the reveal:** the dithered headshot develops (~400ms), then the result pill and name land (~150ms later).
- HUD score tick, ~400ms.
- Wrong guess: input shake 250ms, and the new struck pill fades in.
- Home ball: seams rotate, 60s linear infinite.
- Nothing else. No page-enter fades, no parallax, no animated grain, no hover transitions on every row.

## Mobile (≤ 640px)

- `.page` side padding 16px. No horizontal page scroll anywhere except inside the table container.
- HUD stays on one row with a smaller font. Pips shrink.
- Table: font 0.8rem, sticky Season column, edge-fade masks.
- Autocomplete is full-width and the dropdown stays inside the viewport.
- Home: ball about 220px, wordmark uses `clamp`, and the callouts collapse to a row of pills under the ball (crosshair positioning gets cramped).
- Play: mode rows stay one column, count right-aligned.

## Accessibility checks

- Contrast: `--muted` on `--paper` must be ≥ 4.5:1 in both themes (adjust the hex if needed).
- Focus: visible `:focus-visible` ring (2px ink outline, 2px offset) on every interactive element.
- Pips keep the existing `aria-label`. Struck pills get `aria-label="Wrong guess: X"`. The reveal pill status is announced via `aria-live="polite"`.

## File plan

New:
- `src/components/SiteHeader.tsx`, `ThemeToggle.tsx`
- `src/components/art/HalftoneBall.tsx`, `DitheredImage.tsx`, `CourtLines.tsx`, `BallGlyph.tsx` (small icon used by pips and loading)
- `src/components/Crosshair.tsx`
- `src/lib/dither.ts` (pure Atkinson dither on `ImageData`), `src/lib/theme.ts` (read/set theme, subscribe)
- `public/favicon.svg` (replaced), `public/og.png`
- `src/pages/ArtLab.tsx`: a dev-only `/__art` route (behind `import.meta.env.DEV`) showing every art component in both themes. Used for review and screenshots. Delete it in Phase 3.

Changed:
- `index.html` (fonts, meta, theme-color, no-flash theme script)
- `src/css/index.css` (tokens, dark mode, grain, primitives)
- `src/css/App.css` (Home, Game, Reveal, GameOver, HUD, table, input)
- `src/css/play.css` (Play, ModePicker, CustomFilters)
- `src/css/art.css` (new: ball, dither frame, court, crosshair)
- `App.tsx`, `pages/home.tsx`, `pages/Play.tsx`, `pages/GameScreen.tsx`, every file in `components/`, `lib/stats.ts`

Untouched: `api.ts`, `types.ts` (no API changes), and the whole backend.

## Phases and execution

Every phase ends with `npm run build && npm run lint` passing, plus screenshots of the touched screens in **light, dark, and 390px width**, critiqued against this plan before moving on. Commit after every sub-step, in the repo's commit style.

**Phase 0: Foundation (main session)**
1. Branch `redesign`
2. Fonts and `index.html` (plus a no-flash theme script)
3. Tokens, dark mode, grain, primitives (`.label`, `.display`, `.pill`, `.btn`, `.rule-heavy`, focus ring), and the `.label` usage audit
4. `SiteHeader` and `ThemeToggle`
5. **Check-in:** type specimen and palette screenshots, light and dark. You approve the feel before any screen work.

**Phase 1: Art (2 background agents, running in parallel with Phase 0)**
- Agent A: `HalftoneBall`, `BallGlyph`
- Agent B: `DitheredImage`, `lib/dither.ts`, `CourtLines`, `public/favicon.svg`

**Phase 2: Screens (main session, sequential)**
1. Merge A and B, then visual review on `/__art`
2. Home
3. Play, ModePicker, CustomFilters
4. Game: HUD, StatsTable, autocomplete with keyboard nav, guess history
5. RoundReveal and GameOver with the recap state
6. **Check-in:** a full play-through, with screenshots of every screen

**Phase 3: Polish (main session)**
- Motion pass (with `review-animations` if installed), mobile pass, then an a11y/UI audit (with `web-design-guidelines` if installed)
- OG image and meta tags
- Delete `/__art` and refresh CLAUDE.md (the frontend section is stale)
- Final play-through in both themes, then open a PR from `redesign` to `main`

### Who does what

| Who | Model | Work | Why |
|---|---|---|---|
| Main session | Opus 5.5 | Phases 0, 2 and 3, merging, all visual QA | These are taste calls that need one consistent hand. Phase 2 edits shared files (`App.css`, `GameScreen.tsx`), where parallel agents would conflict. |
| Agent A | Opus 5.5, git worktree | Halftone ball + glyph | Self-contained new files behind a fixed interface. The shading math is where quality shows, so not Sonnet. |
| Agent B | Opus 5.5, git worktree | Dither pipeline, court lines, favicon | Same reasons. The dither has the CORS/fallback edge cases. |

**Agent rules** (put in each prompt):
- Read this plan and load `frontend-design` first.
- Only create or edit the files assigned to you, plus your section of `src/pages/ArtLab.tsx` and `src/css/art.css`. Prefix your classes (`HalftoneBall-`, `DitheredImage-`, `CourtLines-`) so the CSS merge doesn't collide.
- Use colors only through `currentColor` and the CSS vars, so components work in dark mode with no extra code.
- Don't drive the browser. The main session is the only one using Chrome, to avoid tab collisions. Verify with `npm run build` and `npm run lint`. Agent B also runs `lib/dither.ts` against a sample headshot in a small node script (in the scratchpad) and writes out a PNG to look at.
- Commit to your worktree branch in the repo's commit style. Report the files you changed, the props of each component, and any open questions.

**Not using more agents:** the whole job is about 20 files. Splitting the screens across agents would save little time and cost consistency, which matters most here.

## Risks and open items

- **Archivo might feel too wide.** The Phase 0 specimen screenshot settles it. Fallback: Inter Tight 800 or Archivo at `wdth` 85–90.
- **Headshot sizes vary and some players have none.** Upscale with an integer factor, and fall back to the ball when there's no `img_url`.
- **Grain on very large screens:** use a tiled noise (256px) so it isn't one huge texture.
- **Agent merge conflicts:** only `ArtLab.tsx` and `art.css` are shared, and both are append-only sections. Resolve them by hand at the start of Phase 2.
- **Vercel:** client-side routes (`/play`, `/game/:id`) need SPA rewrites. Check `vercel.json` exists before the PR; this is a pre-existing concern, not caused by the redesign.
- Running locally needs the backend up (`uvicorn backend.main:app --reload`) with `VITE_API_URL` pointing at it.
