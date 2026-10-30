# Recipe: mission trailer (60 s)

Template from the m01 v4 trailer (`tools/video/edits/m01_trailer60.json`, 60.00 s, -13.9 LUFS). Priority 1. House rules (brand, music, captions, spoilers, placeholders) are in `README.md`; this file only adds what is specific to this video.

## Purpose

Sell one mission to a player who knows nothing: who you are, what the place is, the real tools, the people, the threat, then "Play now". It is the main cut; the teaser and social cuts come from its takes.

## Length and aspect ratios

60 s (59.9 to 60.1, music window of 60 s). Render **16:9 first** (YouTube, Hacktivity page, Steam), then **9:16** (Shorts, Reels, TikTok) and **1:1** (LinkedIn) after the user has picked the glitch or dissolve variant. Burned captions on 9:16 and 1:1 (see `mission-teaser.md`); `.srt` always.

## Beat sheet (m01, 30 fps, 0.5 s grid at 120 BPM)

Time is in seconds on the timeline. Lifts in m01's music were at 12, 18, 26, 34 and 52 s; strong hits at 52, 54, 56, 58 s. For another mission, analyse its track and move the cards onto its lifts (`video-edit` Step 2).

| Time | Dur | Section | Shot type | Content | Join in |
|---|---|---|---|---|---|
| 0.0 | 6.0 | Title | `title` + Veo `clip` | `spy_into_frame`: the agent walks into the keyhole; the pixel title assembles beside the keyhole art. Holds a long beat. Agent HaX's hook line J-cuts in under it (`audio.pre` 1.2 s: voice from 4.8 s) | cut |
| 6.0 | 3.0 | Hook | gameplay, dialogue | HaX portrait, one short voiced line (m01: "Whatever they're building, it's targeted and sophisticated.", 3.8 s) | glitch |
| 9.0 | 1.5 | Card | `card` | **Mission N / <Mission name>** | glitch |
| 10.5 | 1.5 | Drop | gameplay | the lights strike in a dark office (on the music drop; 1.5 s dark lead-in) | glitch |
| 12.0 | 6.0 | Montage A | gameplay, hard cuts | lockpicking 1 s, phone chat 1.5 s, keypad with 3 non-answer digits 1.5 s, a server or lab set piece 1 s, a real tool (CyberChef) 1 s | cut |
| 18.0 | 1.5 | Card | `card` | **Real / Hacking** | glitch |
| 19.5 | 2.0 | Real hacking | gameplay, `source.type: clip` | **placeholder** (`placeholder: true`) until in-game VM capture exists | glitch |
| 21.5 | 1.5 | Card | `card` | **Choices with / Consequences** | glitch |
| 23.0 | 12.5 | NPCs | gameplay, dialogue | three voiced NPC lines, 4.0 to 4.5 s each, portrait view with the game's own bar, hard cuts between them (Kevin, Maya, Sarah) | glitch, then cut |
| 35.5 | 1.5 | Card | `card` | **Uncover / the Mystery** | **dissolve** (pinned) |
| 37.0 | 4.5 | Montage B | gameplay | a second keypad 1.5 s (dissolve out of the card), then three 1 s walking shots with one NPC each | dissolve, then cut |
| 41.5 | 1.5 | Card | `card` | **And Hold Back / The Entropy!** | glitch |
| 43.0 | 9.0 | Antagonist | gameplay, dialogue | the antagonist's line plays wide for 4.8 s, then hard-cuts (3-frame glitch `hit`) to a 3x UI-free close-up for the last 4.2 s, at a silence in the line | glitch, then cut |
| 52.0 | 8.0 | Call to action | `cta` + Veo `clip` | `spy_laptop_out`: the agent opens a laptop; **"Play now"** beside the spy; key press at clip frame 90 (3.0 s); solid red hex curtain from 3.2 s covers by 5.1 s; the Hacktivity logo resolves in front of it (Labs morphs to **Games**) at about 58 s with the URL under it | glitch |

Total 60.0 s. Cards are 1.5 s, in white Press Start 2P on the navy-to-purple gradient with the glitched mirrored reflection. The m01 cut shows the card text in two lines; keep lines short (about 12 characters per line at this size).

**Card text pattern.** `Mission N / <name>`; `Real / Hacking` (only if the real-hacking slot exists, otherwise drop the card and its slot and give the time to montage A); `Choices with / Consequences` (only with at least two voiced NPC lines); `Uncover / the Mystery` (the exploration beat); a threat card in the mission's own words (m01: `And Hold Back / The Entropy!`). Do not write a generic "Your Mission" (the user's note: it is a mission trailer, name the mission).

## Shot types and what each slot needs from the scout

| Slot | Needs from `video-scout` | Take |
|---|---|---|
| Hook (HaX) | one briefing line of 4 s or less, hooky, spoiler-free, cached; the conversation path from a fresh game | `t10`-style dialogue take, fresh game |
| Drop (lights) | a room that starts dark and strikes its lights on entry (motion sensor; `lighting_lookup.rb`), reachable in a few seconds | lights-on take |
| Lockpicking | a lock with the picking minigame and the item that opens it (an NPC may hand the kit over: play that in `setup()`) | real picking via synthetic key events |
| Phone chat | an NPC phone conversation with visible reply choices | phone take, hold 0.5 s longer than natural |
| Keypad | a PIN door or safe with an answer-free panel; the real code, to choose three different digits | 3 digits, no ENTER |
| Server or lab set piece | a lit set piece with no answer on screen (a VM launcher or flag station needing a VM is not possible here) | `--hide-hud --zoom-step 1` |
| Real tool | an overlay or minigame that shows a real tool (CyberChef from the briefcase in m01), with a worked example, never an answer | tool take, cropped to the working panes |
| Real hacking | nothing yet: a marked placeholder clip and a note. Plan for the in-game capture to replace it | clip |
| NPC lines (3) | per NPC: a line of 4.5 s or less, a hook out of context, no culprit, cached, the path and entry state | dialogue takes, several lines per run if setup is costly |
| Walking shots (3) | one NPC per room, the start point, 1.3 to 3 s of motion | key-driven walking, `--hide-hud` |
| Antagonist | a finale line with a silence mid-line (to cut at), the entry-state flag for the confrontation, and the user's say-so to show him | finale take; re-record after any lip-sync fix |
| Title and CTA | the game's Veo pair (`title-launch-clips.md`) and the brand art, already in `tools/video/assets/` | none |

## Must include

- The game title first and Hacktivity Games last. "Play now". Mission name on a card. At least two NPC voices and the handler. A real-hacking slot (placeholder allowed, marked).
- Music from the game, on this mission's own track, with a duck of 10 dB under dialogue. -14 LUFS, true peak under -1 dBTP.
- Every join to or from a card is a glitch (default) or pixel dissolve (the quieter joins); every other join is a hard cut.

## Must avoid

- "Break Escape" anywhere on screen. "Play Mission 1 Free". A generic card title.
- Answers, codes, PINs, passwords, flag values, casualty figures, ending or choice screens. Keypads with real digits. A post-it with a login.
- Gameplay-to-gameplay effects; slow push-ins (use the quick cut to a close-up); a second subtitle layer over the game's bar; minigames cropped through their frame.
- Placeholders in a final render without the user's say-so.

## Inputs

- Mission id, `scenarios/<mission>/` (including `SOLUTION_GUIDE.md`, read only to know what to keep off screen).
- The game's Veo pair in `tools/video/assets/clips/`, brand art in `tools/video/assets/brand/`.
- The mission-to-music record in `README.md`.
- User decisions: who may be named or shown, which NPC lines, the music.

**New missions start from the presets.** The first shot is `{"preset": "safetynet-open"}` and the last is `{"preset": "hacktivity-close"}` (see `tools/video/edits/presets/` and `m01_trailer60.json`); only the shots between them are written per mission. Overrides on the preset shot (join, duration) win.

## Stage skills, in order

1. `video-scout`: the scout report and the picks file (`docs/video/edits/<mission>_TRAILER60_PICKS.md`). Orchestrator picks.
2. `video-takes`: one take per slot (record `t10` to `t18`-style takes for hook, NPCs, keypads, walking, antagonist), checked and tabled.
3. `video-edit`: selects checked against frames; music analysis; `tools/video/edits/<mission>_trailer60.json` copied from the m01 file; lint `--final`; render 16:9 (glitch), and a dissolve A/B if the user wants it.
4. `video-stills` in parallel: the stills pack from the same takes.
5. `video-review`: the page with the 16:9 render, stills and the questions below; later the 9:16 and 1:1 renders and the export to hacktivity-videos.

Models: Haiku scout, Sonnet takes and edit, Opus picks and reviews. m01 took four review rounds (the 30 s teaser, then v2, v3 and v4); plan for three or four.

## Review questions (put these on the review page)

1. Verdict: ship, revise or rethink?
2. The hook line and the three NPC lines: keep, or swap for the spares?
3. Does the mission card name the mission the way you want it?
4. The real-hacking slot: is a placeholder acceptable for now, or hold the release until in-game capture?
5. Glitch or pixel dissolve at the quiet joins (A/B)?
6. The antagonist moment: right line, right cut? Is it right to show him?
7. Music: right track for this mission (the table shows what the other missions use)?
8. Is anything on screen an answer or a spoiler you can see?
9. The end card: "Play now" and the Games logo, right?
