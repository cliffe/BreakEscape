# CA look: inventory and mockups (22 Nov 2026)

Question from the owner: the CA course images, the Break Escape loading screen and the new trailer ("Two seats") each look different. Should the course art and loading screen move to the trailer style? This note is the inventory and the mockups. Nothing in the game, the course images or Hacktivity was changed.

Contact sheet of today's surfaces and the four mockup PNGs are in the session scratchpad `ca_look/` (contact_sheet_current.png, mockups/). The mockup source is `docs/video/concepts/ca_look/` (course_a, course_b, loading_a, loading_b .html plus `ca_look.css`; fonts are the game's own GNF, VT323 and Press Start 2P).

## Inventory

| Surface | Where | Looks like now |
|---|---|---|
| Course/episode tile background | Hacktivity `app/assets/images/stock/cyberaware_*.jpg` (13 files, 1376x768), chosen by `event.image`, drawn in `events/_tile.html.erb` | Painted, muted, dark, text-free scene (hooked envelope on a laptop, a lit office block) |
| Course title overlay | Hacktivity `app/assets/images/event_titles/cyberaware_*.svg` (about 1060x345, `event.title_image`) | Transparent SVG: amber `#e8a24a` outlined box with a small square and "CYBER AWARE", white title below, on a dark radial shade |
| Share card, game-shell title art | Hacktivity `event_titles/cyberaware_*_social.jpg` (1200x630), used by `Event#title_art_path` and `game_shell/_title_backdrop.html.erb` | The same painted art with the amber mark and title baked in on the right |
| Episode title art | BreakEscape `public/break_escape/assets/title_art/ca*.jpg` (22 files, 1200x630, plus `_master.png` and `_prompt.txt`), set by `mission.json` `"title_art"` | Painted scene, left 60% subject, right 40% left calm and dark. No CA mark. Same painted style as the courses |
| Loading screen | `public/break_escape/js/minigames/title-screen/title-screen-minigame.js`, `css/title-screen.css`, art url from `app/views/break_escape/games/show.html.erb` (`missionTitleArt`) | One screen for SAFETYNET and CA. Hacktivity logo with purple glow (2.5 s), then the episode name typed in green `#00ff41` over the art, "Continue?", then "Loading......." dots. CRT scanlines and vignette (recorded exception D220). No CA variant and no progress value |
| Mission Brief | shared notebook popup | Cream spiral notebook on navy, same as SAFETYNET |
| First view | engine HUD | Navy 9-slice Objectives panel and the "Welcome to Hacktivity Games!" tutorial popup, shared with SAFETYNET |
| Training kiosk | `awareness-skin.css` (`--aw-*`), kiosk minigame | The only CA-specific UI: off-white page, 2px frame, company-accent tabs (brown for Merrin and Sallow). Already in the trailer palette, minus the red and blue seats |
| Debrief and credits | not captured this pass | Kiosk debrief tab (step 6) and the shared credits screen. Not inspected |

Hacktivity was not run: the course images are read from files and the layout from the views.

Findings: three different looks (painted dark art with amber mark; SAFETYNET green terminal on painted art; off-white kiosk), and the trailer is a fourth. The kiosk already matches the trailer. The red and blue seat colours exist nowhere in the game today. The Hacktivity tile has no per-episode art: one image per course, so "episode name and company" on a course image means an episode cover that Hacktivity does not currently show.

## Mockups (real fonts, 2px ink borders, no radius, no shadow, hard-segment progress bar)

| File | Surface and size | Option |
|---|---|---|
| mockups/course_a.png | course/episode image, 1376x768 | A: ca-open look: red and blue halves, grid, seat tabs, white title plate with mark, episode name, company stripe |
| mockups/course_b.png | course/episode image, 1376x768 | B: single red (attacker) plate, 560px game screenshot inset with ATTACKER tab, white plate with mark, title and one-line promise |
| mockups/loading_a.png | loading screen, 1280x720 | A: split red/blue behind the title plate; the bar sits across the seam and fills outward from it, red left and blue right |
| mockups/loading_b.png | loading screen, 1280x720 | B: calm ca-surface and light grid, plate with mark, title, company, tagline "Play the attack · Learn to stop it", green segmented bar |

Mockup caveats: in B the screenshot is the ca12 studio from `docs/video/scout/ca12_play_shots/s1_studio_day.png`; the bar shows 8 of 14 and 12 of 20 segments as static frames.

## Implementation cost

- **Loading screen (either option).** Engine only, no Hacktivity edit. In `title-screen-minigame.js` add a CA branch (for example when the scenario has `ui_theme` or `collection` marking it as CA, or a new `mission.json` field such as `"title_style": "ca"`), a new `css/title-screen-ca.css`, and a changed `init()` template. The current phases (logo, typed name, Continue?, Loading) keep their timing and the `game_loaded` hook. The CA branch should drop the green terminal text, CRT overlay and logo zoom (the D220 exception covers the SAFETYNET look only) and show the Hacktivity logo small, like the trailer end card. The bar is stepped and indeterminate unless wired to the Phaser loader's `progress` event; a stepped bar that fills over the load is honest enough. Option A needs the seam and bar animation (about 8 CSS steps). Option B is a static page plus a bar. Both need the company stripe colour and name from the scenario (`brand.accent`, already used by the kiosk) passed in `breakEscapeConfig`, and a tests pass for `titleScreenName` and the new input helpers. Small: roughly a day with tests and a live proof.
- **Episode title art (`title_art`).** New image files only (22 jpgs at 1200x630 for the CA set, no code), if the loading screen simply shows the same art. If the loading screen is built in HTML as above, `title_art` is no longer needed for CA and can stay as the share card.
- **Course and episode images (Hacktivity).** Image files only for the tile backgrounds (`stock/cyberaware_*.jpg`) and share cards (`event_titles/*_social.jpg`), replacing painted art with pixel-style covers. Because the tile also overlays the `event_titles/*.svg` wordmark, option A or B would either have to be baked into the jpg (then the SVG must go, a change to `events/_tile.html.erb` and `Event#title_image_path`) or be sized to leave the SVG's space. Either way it touches Hacktivity, so it needs the owner's yes before any edit. Production is a render script over `ca_look.css`: one HTML template per course with the title, company and stripe as variables, rendered with headless Chromium. Per-episode covers also need a Hacktivity decision about whether episodes get their own image.
- **Kiosk, Mission Brief and tutorial popup.** The kiosk already matches. Tinting its tabs red and blue by seat is an `awareness-skin.css` edit. The notebook and tutorial popup are shared with SAFETYNET and should stay.

## Recommendation

Move the CA loading screen to option B and the course art to option A.

- Loading B is the cheaper, calmer page and reads as the same family as the kiosk, which the learner sees seconds later. A is more striking, but a red and blue split behind a progress bar loads slowly on a 15 minute workplace course and competes with the kiosk's off-white look. Keep A's seam-opening as a one-second reveal at the end of the load if you want the trailer link.
- Course A carries the "two seats" idea in a thumbnail without needing a screenshot per episode, so one template can produce all the covers (including the 13 course tiles) from the episode name and company. B shows the game but needs a fresh crop and breaks the visual link to the other side of the episode.
- Do the engine loading screen first (no Hacktivity edit, easy to prove live), then ask for the yes on the Hacktivity images. Keep the painted `title_art` as the share-card art until the covers are done so links and social cards do not change early.

Assumptions: the loading screen in the desktop app skips "Continue?" (`isDesktopApp`) but shares the same code; the Hacktivity tile image per course and the missing per-episode image are read from `event.rb` and `_tile.html.erb`, not from a running app.
