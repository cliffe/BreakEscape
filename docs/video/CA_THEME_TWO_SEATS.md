# Cyber Aware trailer theme: "Two seats"

The visual spec for every Cyber Aware trailer (episodes, courses, the programme). It is the outline's option B (`CA_TRAILER_OUTLINE.md` section 7), the default until the user picks otherwise. Written so the edit stage can build it as new CA presets and components beside the SAFETYNET ones, changing none of them.

## The idea

Every CA episode has two halves: you build the attack, then you sit where it lands. The frame says that literally. The screen is split down the middle into two seats: the **attacker seat** on the left and the **defender seat** on the right. Footage plays inside a seat. **The flip** is the join: the seam slides across and the defender seat takes the frame. The trailer closes with the two halves meeting in the Cyber Aware mark.

Nothing from SAFETYNET: no keyhole, no navy-to-purple gradient, no glitched mirror reflection, no red hex curtain, no glitch joins, no Agent HaX, no "Play now".

## Palette

The base is the in-game `aw-*` skin (`public/break_escape/css/awareness-skin.css`), so the trailer looks like the product.

| Token | Hex | Use |
|---|---|---|
| `ca-surface` | `#f6f8f7` (`--aw-surface`) | card ground, end card |
| `ca-ink` | `#1f2933` (`--aw-ink`) | card text, 2 px borders |
| `ca-line` | `#cfd8d4` (`--aw-line`) | the seam, rules |
| `ca-mark` | `#2f6f5e` (`--aw-accent`) | the Cyber Aware mark, "What you'll spot" card |
| `ca-attack` | `#8c3b2e` (red-brown) | attacker seat label and border |
| `ca-attack-tint` | `#f3e4df` | attacker card ground |
| `ca-defend` | `#2f5f8a` (blue) | defender seat label and border |
| `ca-defend-tint` | `#e1eaf2` | defender card ground |
| company stripe | purple `#6b4c9a` on every episode (owner, 24 Nov 2026: purple looks better than the Merrin & Sallow brown `#8a5a2b`; was the episode's `brand.accent`) | the bar under the open card's title box and a 6 px stripe on the seat label |

Checked 22 Nov against `public/break_escape/css/awareness-skin.css`: `ca-surface`, `ca-ink`, `ca-line` and `ca-mark` match `--aw-surface`, `--aw-ink`, `--aw-line` and `--aw-accent` exactly. Note the game overrides `--aw-accent` per company from `brand.accent` (Merrin & Sallow shows brown `#8a5a2b` on the kiosk), so in-game panels are brown, not `ca-mark` green. The attack and defend colours have no game token (the skin has only `--aw-warn: #8a5a00`); they are this spec's own. The feature map artifact was not opened (not reachable from here), so its `atk` and `def` hexes remain unchecked.

Both seat colours pass 4.5:1 against `ca-surface` for label text (`#8c3b2e` and `#2f5f8a` on `#f6f8f7` are about 7:1 and 6:1).

## Type

Pixel fonts only for everything designed (UI rule): the game ships all three in `public/break_escape/assets/fonts/`.

| Role | Font | Notes |
|---|---|---|
| Episode and course titles | **GNF** (`gnf.woff2`) | the game's heading face, already used on the kiosk ("Merrin & Sallow Architects") |
| Seat labels, tool names, small caps text | **Press Start 2P** | uppercase, short: `ATTACKER`, `DEFENDER`, `PRETEXT CALL` |
| Card body ("What you'll spot", end card lines) | **VT323** | readable at size, still pixel |
| Burned captions | **Source Sans 3** (`SourceSans3/`) | the game's own readable face for learner text (`--se-font-readable`). The one non-pixel face, allowed for captions only |

`tools/video/remotion/src/fonts.ts` loads Press Start 2P only. Add GNF, VT323 and Source Sans 3 with the same `FontFace` and `delayRender` pattern, and add the files to the asset sync. Render text with font smoothing off, at integer pixel sizes (multiples of the font's pixel grid: GNF 16, Press Start 2P 8, VT323 16).

## Cards

- A flat `ca-surface` panel with a **2 px `ca-ink` border** and a 2 px inset rule, like the in-game kiosk. No radius, no gradient, no reflection, no drop shadow.
- A **tab** sits on the top edge of every card, in the seat's colour with white Press Start 2P: `ATTACKER` or `DEFENDER` (consequence-first episodes: `THE SHORTCUT`). Neutral cards (title, end card) have a `ca-mark` tab reading `CYBER AWARE`.
- A tool card names the tool in Press Start 2P beneath the tab (`OPEN-SOURCE RESEARCH`, `PRETEXT CALL`, `LOOK-ALIKE PAGE BUILDER`), then one VT323 line of what it does, at pattern level.
- Card text: up to two lines of about 22 characters in GNF, or three lines of about 34 in VT323.
- Cards in a seat fill that seat only; neutral cards fill the frame.
- **Chapter cards** (round 2): the owner wanted clearer title pages for what the attack covers, then the defence. A trailer shows a red chapter card (what the attack covers), short attack footage, the flip, a blue chapter card (what the defend half covers), then mostly defend gameplay. A chapter card fills the whole frame in its seat colour (`attack` red, `defend` blue) with the grid, the seat tab, a GNF heading (one line, two when stacked), up to three VT323 bullets revealed in turn, and a small `CYBER AWARE` plate. Pattern level only: no tell, verdict or answer. One red and one blue per trailer, red first. Edit fields: `"style": "ca"`, `"chapter": "attack"|"defend"`, `"text"` (heading), `"body"` (bullets). Lint enforces the order and counts.
- ca-close: the mark's two squares and the `CYBER AWARE` word read as one lock-up (gap 0.2 of a square). Stacked, the tagline splits at the dot onto two lines.

## Split-screen grammar

- **Seat layout (16:9).** Two seats of 50% each, with a 4 px `ca-line` seam and a 2 px `ca-ink` border around each. Footage is scaled with nearest-neighbour at an integer scale to fill the seat, cropped to the action (the call panel, the browser, the triage list). The idle seat shows a still frame of its own content at 40% saturation, never an empty panel.
- **One active seat at a time.** The active seat gets its colour border at 4 px; sound comes from it. The other seat is a quiet still. Two moving seats at once is reserved for the programme trailer's montage.
- **Full frame** is allowed for the hook, the living-office beat and the end line, where the room needs width. The seam slides out to the edge and back.
- **9:16 and 1:1.** The seats stack: attacker on top, defender below, the seam horizontal. The flip slides upward.
- **Seat labels** stay on screen for the whole time a seat is active, top-left of the seat, so a silent viewer always knows whose side this is.

## Voice-over lane and insets (round 3)

**`vo` (edit level).** `"vo": [{ "id", "start", "end", "text", "file"?, "onCard"?, "gain_db"? }]`, times in global seconds. Every cue is burned as a caption in all three aspects (`CaVo`): a CA surface plate with ink VT323 text (56 px at 1080, never under 48), a 2 unit square ink border, no speaker label, so it reads differently from the dark dialogue caption. Where a dialogue line is playing it sits above that line's caption (or above the game's own subtitle bar in 16:9). On a CA card it stacks above the `CYBER AWARE` plate; `"onCard": "hide"` drops the caption there but keeps the audio. `ca_open` and `ca_close` never show it. With a `file` (relative to the takes dir, or absolute), `mix-audio.mjs` mixes it in at `start` and ducks the music and every take's own audio by `edit.duck`. Without one the lint says "not voiced yet (caption only)". The `.srt` merges VO cues, with no speaker prefix, into the dialogue cues in time order. Lint: inside the trailer, `start < end`, no two cues overlap, text over 90 characters and over 3.0 words per second warn, and overlapping a `dialogue` line by more than 0.3 s warns. Known limit: on a chapter card with three bullets the plate can crowd the last one in 16:9; use `onCard: "hide"` there. To voice cues, run `ruby tools/video/scripts/narrate.rb <edit.json> --voice NAME --style "..." --ids v1,v10 --out DIR` (needs `GEMINI_API_KEY`; writes `<id>.mp3` and a `<id>.json` sidecar, skips unchanged cues, stops on a 429; audio stays outside the repo, then point each cue's `file` at it).

**`insets` (gameplay shot).** `"insets": [{ "src": {x,y,w,h}, "at": { "16:9": {x,y,scale}, "9:16": {...}, "1:1": {...} }, "from"?, "to"?, "label"? }]`. `src` is in source pixels of the take; `at` is the top-left in output pixels and a `scale` of 1.5 to 4. The inset is the shot's own frame at the same time, nearest-neighbour, with the shot's `masks` drawn in it and a 2 unit ink border, plus an optional upper-case `label` tab above (`INFLUENCE`). An aspect with no `at` entry draws nothing. `from` and `to` are shot seconds; it scales in over 0.2 s in four frame steps. Lint: `src` inside the frame, the box inside each output frame, scale 1.5 to 4, room above for the label.

## Joins and transitions

Gameplay to gameplay inside a seat stays a hard cut (house rule). Into or out of a card or a seat change:

| Join | What it does | Frames | Use |
|---|---|---|---|
| `seam` | a hard wipe along the seam line, 2 px `ca-ink` edge, stepped in 8 px blocks | 6 to 8 | into and out of cards; the default |
| `flip` | the seam slides across the frame (left to right; bottom to top in 9:16), the attacker seat shrinks to a 12% strip and the defender seat takes the frame; the step strip's "Defend" tab lands on the seam | 12 to 16 | **once per trailer**, at beat 6 |
| `pixel dissolve` | the existing PixelDissolve at 16 px blocks | 6 to 10 | the quiet joins around the living-office beat |

No glitch, no blur streak, no colour split.

## Opening preset: `ca-open` (2 s in episodes, 3 s in courses)

1. Frame 0: `ca-surface` with the 2 px border (no black open).
2. Frames 0 to 18: the seam draws down from the top; the two seats tint in their colours; `ATTACKER` and `DEFENDER` tabs drop onto them.
3. Frames 18 to 48: the episode title in GNF, centred over the seam on a neutral card (`Visitors and tailgating`), the company name in VT323 beneath with its stripe (`Merrin & Sallow Architects`).
4. Out on a `seam` join into the first attacker shot.

Parameters for the preset JSON: `title`, `company`, `stripe`, `duration`, and per aspect `layout`.

## Closing preset: `ca-close` (3 s)

1. In on `seam`. The attacker and defender halves slide together from the edges, and they meet at the seam.
2. Where they meet, the **Cyber Aware mark** forms: two 2 px-bordered squares, one red-brown and one blue, overlapped at a corner, with `CYBER AWARE` in Press Start 2P beside them in `ca-mark`. (A placeholder mark until the brand has one. The user may supply or approve a mark.)
3. Under it, in VT323: the episode or course name, then "Play the attack · Learn to stop it" (owner, 2026-11-22: no "15 minutes, in your browser · No installs").
4. Last 1 s: a thin rule and the Hacktivity logo, small (about 18% of the width), bottom centre.
5. The last frame holds for 0.5 s; music ends on a cadence.

## Building it beside SAFETYNET

- New presets: `tools/video/edits/presets/ca-open.json` and `ca-close.json`. `safetynet-open.json` and `hacktivity-close.json` stay unchanged.
- New shot types or kinds, dispatched in `Teaser.tsx` next to `title`, `cta` and `card`: `ca_open`, `ca_close`, `card` with `"style": "ca"` (a new `CaCard` component, not a change to `TextCard` or `CardStage`), and a `seat` block on `gameplay` shots (`{"seat": "attack" | "defend" | "full"}`).
- New components: `CaSeats` (the frame, the seam and the labels around a gameplay shot), `CaCard`, `CaOpen`, `CaClose`, and `SeamWipe` and `FlipTransition` (beside `GlitchTransition` and `PixelDissolve`).
- `lint-edit.mjs`: accept `seam` and `flip` joins on CA edits (`"theme": "ca"` at the top level), allow at most one `flip`, and reject `glitch`, `blur` and SAFETYNET presets in a CA edit.
- After the change, prove that SAFETYNET did not move: `check-preset-equal.mjs` on `m01_trailer60.json`, and a lint of the m01 and m02 edits with no new warnings.
- Captions: a `CaCaption` style (Source Sans 3, white on 80% `ca-ink`, 2 px border, lower third of the active seat).
- Bumpers: `tools/video/edits/bumpers/ca-open.json` and `ca-close.json`, with `-silent` twins.

## Music

The game library has no CA music: CA scenarios set none in play, and every set in `public/break_escape/assets/music/` (Noir, SpyAction, SpyAgro, CutScene, Vocals) is the SAFETYNET spy sound. Reusing one would tie CA to SAFETYNET, against the separate product line, and the mission-to-music rule already claims tracks per mission.

**Recommendation: a new CA track.** Light, mid-tempo (100 to 115 BPM) electronic with a plucked lead, in two cuts on one grid: an **attack cut** (a muted, tense pulse) and a **defence cut** (the same theme, steadier and brighter). The flip lands on the change. It needs the user's yes before any generation or purchase. None has been made.

**Until then:** cut every pilot to work **silent with burned captions** (the course page's first use), with the game's own room sound and the voiced lines. If the user wants music on the pilot before a CA track exists, the least SAFETYNET-sounding candidates from the library to audition are CutScene "Shadow Code 0" and "Shadow Code 2", and Noir "Midnight Surf Cipher 1". None of them has been analysed or played for this, and none is used by a mission trailer yet.

## Concept stills

Not made yet. The next session can make two or three with `tools/agy_image.sh` (no approval needed; stop on exit 3): the `ca-open` title frame over the Merrin & Sallow studio, the split call-and-desk frame mid-flip, and the `ca-close` end card. They belong on the review page with the outline's questions.
