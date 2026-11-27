# Recipe: mission trailer (60 s)

**SAFETYNET: Licence to Hack only.** Each product line has its own visual identity and its own trailer rules (`GUIDELINES.md`, "Product lines"). Do not use this recipe for Eldritch Hacker, the courses or Cyber Aware.

Template from the m01 v8.5 trailer, shipped 2026-11-02 (`tools/video/edits/m01_trailer60.json`, 60.00 s, -14.0 LUFS). Priority 1. House rules (brand, music, captions, spoilers, placeholders) are in `README.md`; this file only adds what is specific to this video.

## Purpose

Sell one mission to a player who knows nothing: who you are, what the place is, the real tools, the people, the threat, then "Play now". It is the main cut; the teaser and social cuts come from its takes.

What every mission trailer must sell (user, m03 v2, 2026-11-22): **the threat ENTROPY poses** in this mission, **the puzzles**, **the real hands-on hacking** (a `Real / Hacking` card and console footage, in every mission), **the action** (a chase, a guard turning hostile, a strike in the dark), and **the mission's new mechanics**. Judge each cut against those five before the spoiler list; a trailer that is safe but flat has failed.

## Length and aspect ratios

60 s (59.9 to 60.1, music window of 60 s). Render **16:9 first** (YouTube, Hacktivity page, Steam), then **9:16** (Shorts, Reels, TikTok) and **1:1** (LinkedIn) after the user has picked the glitch or dissolve variant. Burned captions on 9:16 and 1:1 (see `mission-teaser.md`); `.srt` always.

## Beat sheet (m01, 30 fps, 0.5 s grid at 120 BPM)

Time is in seconds on the timeline. Lifts in m01's music were at 12, 18, 26, 34 and 52 s (in v8.5 the 18 s lift falls inside the Real Hacking card); strong hits at 52, 54, 56, 58 s. For another mission, analyse its track and move the cards onto its lifts (`video-edit` Step 2).

| Time | Dur | Section | Shot type | Content | Join in |
|---|---|---|---|---|---|
| 0.0 | 6.0 | Title | `title` + Veo `clip` | `spy_into_frame`: the agent walks into the keyhole; the pixel title assembles beside the keyhole art. Holds a long beat. Agent HaX's hook line J-cuts in under it (`audio.pre` 1.2 s: voice from 4.8 s) | cut |
| 6.0 | 3.0 | Hook | gameplay, dialogue | HaX portrait, one short voiced line (m01: "Whatever they're building, it's targeted and sophisticated.", 3.8 s) | glitch |
| 9.0 | 1.5 | Card | `card` | **Mission N / <Mission name>** | glitch |
| 10.5 | 1.5 | Drop | gameplay | the lights strike in a dark office (on the music drop; 1.5 s dark lead-in) | glitch |
| 12.0 | 4.0 | Montage A | gameplay, hard cuts | lockpicking 1 s, phone chat 1.5 s, keypad with 3 non-answer digits 1.5 s (no CyberChef here: it closes the real-hacking beat; no shot of the player merely standing in a server room) | cut |
| 16.0 | 1.5 | Card | `card` | **Real / Hacking** | glitch |
| 17.5 | 2.0 | Walk to the VM | gameplay | the player walks up to the in-game Kali/VM station and stands at it; out point before the launcher opens (its screen can show a login) | glitch |
| 19.5 | 2.0 | Real hacking | gameplay, `source.type: clip` | **this mission's** real tools only (m01: Hydra cracking SSH, then the shell; slowed old-trailer footage, password mosaicked). **Placeholder** (`placeholder: true`) until in-game VM capture exists | cut |
| 21.5 | 1.0 | Real tool | gameplay | CyberChef (or the mission's in-game tool) on a worked example, cropped to the working panes | cut |
| 22.5 | 1.5 | Card | `card` | **Uncover / the Mystery** (introduces the NPC lines: what people say is mystery, not consequence) | glitch |
| 24.0 | 12.5 | NPCs | gameplay, dialogue | three voiced NPC lines, 4.0 to 4.5 s each, portrait view with the game's own bar, hard cuts between them (Kevin, Maya, Sarah) | glitch, then cut |
| 36.5 | 1.5 | Card | `card` | **Choices with / Consequences** | **dissolve** (pinned) |
| 38.0 | 3.5 | Montage B | gameplay | three walking shots with purpose: to an NPC 1 s (dissolve out of the card), heading for a door and knocking a swivel chair on the way 1.5 s, beside an NPC 1 s. Never walk into an NPC | dissolve, then cut |
| 41.5 | 1.5 | Card | `card` | **And Hold Back / The Entropy!** | glitch |
| 43.0 | 2.5 | Minigame crescendo | gameplay, hard cuts | **one quick cut of every minigame type in the mission** (m01: lockpick, key lock, briefcase contents, PC desktop, PIN pad, password screen, CyberChef, phone chat, flag station, the launch device), accelerating on the beat grid: 2 x 0.5 s, 4 x 0.25 s (8, 7, 8, 7 frames), 4 x about 0.125 s (4, 4, 4, 3 frames) = 75 frames. Shot audio at -10 dB. The antagonist's line starts under it (next row) | glitch, then cut |
| 45.5 | 6.5 | Antagonist | gameplay, dialogue | the antagonist's voice J-cuts in at 43.0 under the crescendo (`audio.pre` 2.5 s on the wide shot, its `source.in` moved 2.5 s later so the picture joins mid-line), the wide plays to a silence in the line, then hard-cuts (3-frame glitch `hit`) to a 3x UI-free close-up for the last 4.2 s. The cut into the wide also carries a 3-frame `hit` | cut |
| 52.0 | 8.0 | Call to action | `cta` + Veo `clip` | `spy_laptop_out`: the agent opens a laptop; **"Play now"** beside the spy; key press at clip frame 90 (3.0 s); solid red hex curtain from 3.2 s covers by 5.1 s; the Hacktivity logo resolves in front of it (Labs morphs to **Games**) at about 58 s with the URL under it | glitch |

Total 60.0 s. Cards are 1.5 s, in white Press Start 2P on the navy-to-purple gradient with the glitched mirrored reflection. The m01 cut shows the card text in two lines; keep lines short (about 12 characters per line at this size).

**Card text pattern.** `Mission N / <name>`; `Real / Hacking` (the game's USP: every mission has the card and console footage, a marked placeholder until the capture exists); every other card **advertises this mission's story and appeal** in its own words (house rule: the user asked for it on m02 and again on m03 v2, "like we did for m02 we should update the title pages to advertise the story/appeal of this specific mission"). m02: `Hack them / back`, `to Hold back / the ENTROPY`, `Before the / Ward Goes Dark`. The generic m01 cards (`Uncover / the Mystery`, `Choices with / Consequences`) are retired. A new mechanic earns a card of its own, and **that card names the mechanic** (user, 2026-11-22: "spotlight any new mechanics, such as RFID, call it out in the title screens"): `RFID / Cloning`, not a story phrase that only hints at it. The footage straight after the card shows that mechanic working. Do not write a generic "Your Mission" (the user's note: it is a mission trailer, name the mission).

**Story order with a day/night turn** (m03 v2): keep the day shots together and the night shots together, in story order, so a "this late" line never lands next to a bright day shot. The turn to night lands on a beat of the mission's own track.

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
| Minigame crescendo | **the full minigame inventory of the mission** (every distinct minigame type a player meets: lockpick, key lock, PIN, password, container (briefcase, PC desktop), CyberChef or other real tool, phone chat, notes, flag station, VM launcher, and any mission-specific one), each with a moment of visible action and whether an answer, login or post-it shows | most come from the montage takes at other in-points; a chain take (m01 `t19_minigames`: briefcase contents, key lock, password) covers the rest in one run |
| Real hacking | the mission's console footage (`vm-console-takes`), or a marked placeholder clip and a note until it exists | clip |
| NPC lines (3) | per NPC: a line of 4.5 s or less, a hook out of context, no culprit, cached, the path and entry state | dialogue takes, several lines per run if setup is costly |
| Walking shots (3) | one NPC per room, the start point, 1.3 to 3 s of motion | key-driven walking, `--hide-hud` |
| Antagonist | a finale line with a silence mid-line (to cut at), the entry-state flag for the confrontation, and the user's say-so to show him | finale take; re-record after any lip-sync fix |
| Title and CTA | the game's Veo pair (`title-launch-clips.md`) and the brand art, already in `tools/video/assets/` | none |

## Must include

- **The trailer tells a story, it is not a feature list** (the user's lesson, 2026-11-02). Order the cuts as a narrative: establish the premise and its human stakes first (the attack, and who it hurts), then the response and the investigation, then the climax. Place each NPC line where it advances that arc, a stakes-setting line early to set up the problem, a challenge or obstacle line in the investigation, rather than grouping the NPC lines together. Reorder footage to serve the story even when it means showing a minigame or room out of the order a player meets them.
- **The mission's new mechanic gets a readable beat, about 3 s or more, on its own** (user, m03 v2: "have the RFID on screen for longer, it's a new mechanic, remove the phone message and PIN flashes from this section"). Show it working start to finish (read the card, emulate it, the door opens); do not bury it among 1 s flashes of mechanics the earlier missions already sold.
- **End on the most interesting line in the mission** (up to about 6.5 s), usually the antagonist's menace or confrontation, not a polite opener (m03 v2: "Competent is cheap" was "not a very exciting line to end on").
- **Write a better line when the mission has none** (user, 2026-11-22: authoring new lines "to make them trailer perfect" is in scope). If the best existing ending or hook line is weak, draft a new one. Examples the user called weak: m09 "It's only paper..." and m04 "There's no version of this where I blink...". The new line goes into the ink at a point where it plays naturally in the game, in the character's voice and canon, never as a line that only exists in the trailer. Before any voicing it needs: the user's pick, an npc-dialog-review on the new lines, and the user's yes through AC0 for the TTS with a line count. If the lines around it would make the new read sound out of place, re-voice them too (tts-audio rule 10).
- **An action beat plays as a sequence**: set it up, show the action, then the payoff (m03 v2: the player at the door, then the lockpicking, then the guard's line). A voiced line in an action beat needs an angry or urgent delivery; if the cached take is flat, ask for a re-voice with an ink `#delivery:` tag (`tts-audio` rule 10; it needs the user's yes).
- **No empty screens anywhere**, crescendo included: no bare desktops, no idle panels (m03 v2).
- **A quick cut of every minigame in the mission** (the user's aim, 2026-11-01), in the crescendo before the antagonist's line. A minigame that cannot be shown safely (an answer on screen that no crop removes) is left out and named in the picks file.
- **Every NPC who does not get a spoken (or on-screen-dialogue) beat elsewhere in the trailer appears in the crescendo** (the user's rule, 2026-11-02), as a short face/presence flash interleaved with the minigame cuts, so no character the player meets is absent from the trailer. An NPC who already carries a dialogue beat (a voiced line, or a featured text beat like a phone/video-call) is exempt. One who cannot be shown without a spoiler (a culprit's face, a badge id) appears only in an obscured or partial frame, or is named in the picks file as dropped. Lengthen the crescendo a little rather than drop a minigame type to make room.
- The game title first and Hacktivity Games last. "Play now". Mission name on a card. At least two NPC voices and the handler. A real-hacking slot (placeholder allowed, marked).
- Music from the game, on this mission's own track, with a duck of 10 dB under dialogue; cuts and the night turn on its beat grid. -14 LUFS, true peak under -1 dBTP; voice levels per cue are judged as in `video-edit`.
- Every join to or from a card is a glitch (default) or pixel dissolve (the quieter joins); every other join is a hard cut.

## Must avoid

- "Break Escape" anywhere on screen. "Play Mission 1 Free". A generic card title.
- Answers, codes, PINs, passwords, flag values, choice or outcome screens, the debrief, and any end twist the mission withholds. Keypads with real digits. A post-it with a login. These hold even for a 3-frame crescendo cut: a viewer can step through frames, so crop or drop (m01: the Kali launcher's login post-it and Derek's "Anniversary" post-it are cropped out; Patricia's note was dropped because its second worked example is a real PIN). Casualty figures are allowed when they are the stakes, such as Voltage's "forty-odd" in m04 (owner, 2026-11-23: "Relax it"); never as an outcome, and never a debrief total.
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
5. `video-review`: one page every round at the same link, a tab per round, a form that saves; the orchestrator frame-checks every changed section before publishing. Later the 9:16 and 1:1 renders; export to hacktivity-videos only after "ship".

Models: Haiku scout, Sonnet takes and edit, Opus picks and reviews. m01 took four review rounds (the 30 s teaser, then v2, v3 and v4); plan for three or four.

## Review questions (put these on the review page)

1. Verdict: ship, revise or rethink?
2. The hook line and the three NPC lines: keep, or swap for the spares?
3. Does the mission card name the mission the way you want it?
4. The real-hacking slot: is a placeholder acceptable for now, or hold the release until in-game capture?
5. Glitch or pixel dissolve at the quiet joins (A/B)?
6. The antagonist moment: right line, right cut? Is it right to show him?
7. The minigame crescendo: right order and pace? Does the antagonist's voice read clearly over it? Any minigame missing?
8. Music: right track for this mission (the table shows what the other missions use)?
9. Is anything on screen an answer or a spoiler you can see?
10. The end card: "Play now" and the Games logo, right?
