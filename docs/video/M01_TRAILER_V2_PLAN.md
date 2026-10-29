# m01 trailer v2: plan

Status: draft for review (2026-10-29). Follows the user's review of the 30 s teaser (verdict "rethink"; notes in `TRIAL_LOG.md`, decisions in `DECISIONS_PENDING.md`). Tooling, style rules and lessons from the trial carry over (`M01_TRIAL_PLAN.md`, `GUIDELINES.md`).

## 1. What changes and why

| User note | Change |
|---|---|
| Use the game's title art and logo; Break Escape is the engine | Open on **SAFETYNET: Licence to Hack**: `hacktivity/app/assets/images/event_titles/safetynet_licence_to_hack.svg` (pixel title, red SAFETYNET badge) over the keyhole capsule art (`marketing/capsule_concepts/c1_keyhole_hookpick6.png`, or the `_social.jpg` composition). "Break Escape" is removed from every card. |
| Hacktivity Labs → Games at the end, full logos | Closing sequence animates the real `hacktivity/app/assets/images/hacktivity-logo.svg` → `hacktivity-games-logo.svg`. Fallback: cut the old trailer's 0-5 s logo transition. |
| Improve the glitch; try a pixel dissolve | Rework `GlitchTransition` (see 4) and add `PixelDissolve`. Render A/B versions of the same edit, one with each, for the user to pick. |
| Real Hacking is a USP; cut placeholders from the old trailer | A "Real Hacking" card followed by the old trailer's Kali footage (about 19.5-24.3 s of `HacktivityGamesTrailer1.mp4`: VM desktop, browser, sqlmap, dirb), marked placeholder in the edit list until in-game VM capture exists. |
| Different Agent HaX line | Scout her other briefing lines with cached audio and pick a short hook. |
| Minigames cropped too tightly | Minigame shots show the whole minigame panel with a margin (at most 2x, never cutting the panel's frame; 1x where the panel is large). |
| More NPCs with their best lines | A "Choices with Consequences" section with three short voiced NPC lines (Kevin, Maya, and one more such as Sarah), each with its portrait, as the reference trailer did. |
| Derek: the Entropy line | "Entropy is inevitable. Trust is a lie. Security through obscurity fails." (8.9 s) with the push-in. |
| Replace the flag shot | A different m01 minigame or set piece from the scout (candidates: Kevin's workstation password screen, CyberChef if m01 has it, the filing cabinet keypad, a notes or evidence view). |
| Slideshow video not wanted | Drop the slideshow MP4. Keep a curated mission stills set (PNG plus captions) as the deliverable; the script stays in the repo. |
| Remotion licence | User: the free licence applies. |

## 2. Length and structure (default 60 s; the user may overrule)

Music: Noir "Midnight Cipher Chase" (120 BPM, so 120 beats). The analysis script finds a 60 s window with a quiet opening, a drop around 10-14 s, a second lift for the back half and a clean end. If no single window works, the edit may join two sections of the track on a bar line. Every boundary on a beat; card changes on strong hits.

| Time (approx.) | Section | Content |
|---|---|---|
| 0-4 | Title | SAFETYNET badge then LICENCE TO HACK revealed over the keyhole art (pixel dissolve or glitch in) |
| 4-9 | Hook | Agent HaX, one new short voiced line |
| 9-10.5 | Card | "Your Mission Begins NOW" |
| 10.5-14 | Drop | Lights strike in the office (t03) |
| 14-20 | Montage A | 1 s hard cuts: lockpicking, phone, keypad, lock opens, server racks, replacement minigame |
| 20-21.5 | Card | "Real Hacking" |
| 21.5-26 | Real hacking | Old-trailer Kali footage, 2-3 hard cuts (placeholder) |
| 26-27.5 | Card | "Choices with Consequences" |
| 27.5-39 | NPCs | Three voiced NPC lines, about 3.5 s each, hard cuts between portraits |
| 39-40.5 | Card | "Uncover the Mystery" |
| 40.5-44 | Montage B | Rooms and characters walking, a second minigame angle |
| 44-45.5 | Card | "And Hold Back the Entropy!" |
| 45.5-54.5 | Antagonist | Derek's Entropy line, push-in to a UI-free close-up |
| 54.5-57 | Card | "Play Mission 1 Free!" with hacktivity.co.uk |
| 57-60 | Logos | Hacktivity Cyber Security Labs → Hacktivity Games |

A 30 s social cut-down (title, hook, drop, montage A, Derek, logos) comes later from the same takes.

## 3. Footage

Existing takes (t01-t09) are reused where they fit; t01 (title screen) and t07 (log terminal) are dropped. New work:

1. **Scout v2 (Haiku):** (a) Agent HaX's other briefing lines and Kevin, Maya, Sarah and any other m01 NPC lines: short (2-4 s), hooky, spoiler-free, tested with real `/tts` requests for cached audio; with the knot, the conversation path to reach each line, and the cheapest entry state. (b) m01 minigames and set pieces not yet recorded, with entry states, for the flag-shot replacement and montage B.
2. **Takes v2 (Sonnet):** one take per chosen NPC line (portrait view, the game's own subtitle bar, the line marked with `line-start`/`line-end`), the new HaX line, the replacement minigame, and montage B shots (characters walking through rooms, `--hide-hud`, zoom +1). Same capture settings and checks as the trial. Captures serial.
3. **Old-trailer clips:** cut 19.5-24.3 s from the reference (60 fps → 30 fps), check each cut point against frames.

## 4. Edit and effects (Sonnet)

- **Title component:** the SVG title rendered crisp (pixel shapes, `shape-rendering: crispEdges`) over the keyhole art, laid out per aspect ratio.
- **End logos:** the two Hacktivity SVGs with a morph between them in the reference's manner (Labs → Games).
- **Glitch v2:** study the reference's glitch frames (0-1 s and the card joins) and match them: horizontal slice offsets that jitter for 2-3 frames, a stronger RGB split on the moving slices only, brief blocky pixelation, no full-frame noise wash; shorter (4-6 frames).
- **Pixel dissolve:** the outgoing frame breaks into square pixel blocks that drop out in a random order (block size in game pixels, nearest-neighbour), revealing the next shot; 6-10 frames. Same lint rule: only next to a card.
- **Framing:** minigame shots show the whole panel with a margin; at most 2x.
- **Old-footage source type** in the edit list (a video file and in/out), marked `placeholder: true` so the lint lists it.
- **A/B renders:** render 16:9 twice (glitch v2, pixel dissolve). 9:16 and 1:1 only after the user picks.

## 5. Stills set

Keep the curated stills (`video_out/m01/stills/`) with the user's notes applied: no slideshow video. Add 4-6 stills from the new NPC takes. Deliver as PNGs plus `captions.json`, and on the review page as a gallery.

## 6. Stages and models

| Stage | Work | Model | Gate |
|---|---|---|---|
| 1 | Scout v2 | Haiku | Lines tested live; entry states cited |
| 2 | Selects for new lines and shots | Orchestrator | Choices logged with reasons |
| 3 | Takes v2 | Sonnet | All pass check-take; lines confirmed playing |
| 4 | Remotion v2: title, end logos, glitch v2, pixel dissolve, old-footage source, 60 s edit list, A/B 16:9 renders | Sonnet (can start alongside 1-3 with placeholders) | Lint clean; orchestrator reviews contact sheets and effect stills against the reference |
| 5 | Review page v2 for the user (A/B videos, stills gallery, feedback form) | Orchestrator | User has the link |
| 6 | After the user's pick: 9:16, 1:1 and the 30 s cut-down | Sonnet | As the trial |

## 7. Risks

- **Music window:** a single 60 s stretch with the right shape may not exist; the edit then joins sections on a bar line, checked by ear proxy (RMS profile).
- **Old-trailer footage quality:** it's compressed H.264 at 60 fps; it will look softer than the new captures. Acceptable as a placeholder.
- **NPC line reachability:** some good lines may sit behind long conversation paths; the scout gives the cheapest state or the line is swapped.
- **Render time:** a 60 s render at one thread is about 30 minutes; A/B doubles it. No captures run during renders, so concurrency 2-3 is fine.
