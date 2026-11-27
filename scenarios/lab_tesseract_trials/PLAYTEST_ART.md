# Keyholder Trials in-game art check (walk sprites, talk sheets, visemes)

Run type: visual regression of newly wired PixelLab art. Not a puzzle test.

- Game id: **1614** (mission 79, lab_tesseract_trials), keyless server :3001, headless (load average about 1.5, but no display needed for screenshots).
- Setup exercised, not earned: all ten rooms unlocked with `Game#unlock_room!` through a rails runner (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-art/unlock.rb`) before the session started. This also fired some later-trial toasts. No puzzles played.
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-art/session-1614.jsonl` (429 commands). Session stopped with `session-stop.sh`; no browser of mine left running; :3000 and :3001 untouched.
- Screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-art/` as listed below.

## Result per NPC

| NPC | Room | Walk sprite | Portrait | Sheets loaded | Verdict |
| --- | --- | --- | --- | --- | --- |
| tom_shaw | lecture_theatre | idle animates, turns to face player | good | talk + visemes | PASS |
| cliffe_schreuders | common_room | idle animates, turns to face player | good | talk + visemes | PASS |
| cliffe_workshop | workshop | idle animates, turns to face player | good (same art) | talk + visemes | PASS |
| sidhu_selvarajan | seminar_room | idle animates, turns to face player | good | talk + visemes | PASS |
| oleg_illiashenko | staff_office | idle animates, turns to face player | good | talk + visemes | PASS |

## Evidence

Walk sprite (step 1). For each NPC I stood next to them, then walked to three points around them, reading the NPC sprite each time. The texture key was the new sheet (tom_shaw, cliffe_schreuders for both Cliffe entries, sidhu_selvarajan, oleg_illiashenko). The animation switched between `npc-<id>-idle-down`, `-up`, `-left`, `-right` and the diagonals as I moved, so all of the facing sets are populated, and `breathing-idle` frame numbers advanced between reads (the sprite is animating, not frozen). `flipX` stayed false throughout. The NPCs turn to face the player; none showed a wrong-way or blank frame. The sprites match their portraits (Tom: curly brown hair, dark jumper; Cliffe: glasses, beard, brown jacket; Sidhu: teal waistcoat, white shirt; Oleg: blond, navy suit, red tie).

Screenshots, standing next to the NPC and after walking past:
- tom: `tom-1-standing.png`, `tom-2-passed.png`
- cliffe_schreuders: `cliffe-1-standing.png`, `cliffe-2-passed.png`
- cliffe_workshop: `workshop-1-standing.png`, `workshop-2-passed.png`
- sidhu: `sidhu-1-standing.png`, `sidhu-2-passed.png`
- oleg: `oleg-1-standing.png`, `oleg-2-passed.png`

(Folder: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-art/`. The `-2-passed` shots are the camera view after the last move, so the NPC may be partly off-screen. The per-position facing readings are in the session log.)

Portrait (step 2). Conversation opened with `interact`, screenshot of the open `person-chat` minigame:
- `tom-3-portrait.png`, `cliffe-3-portrait.png`, `workshop-3-portrait.png`, `sidhu-3-portrait.png`, `oleg-3-portrait.png`

Sheets (step 3). `window.MinigameFramework.currentMinigame.ui.portraitRenderer` for every conversation:

| NPC | talkImageSrc | useSpriteTalk | visemeSheet |
| --- | --- | --- | --- |
| tom_shaw | assets/characters/tom_shaw_talk.png | true | tom_shaw_visemes.png, 896x128, loaded, frameSize 128, 7 columns |
| cliffe_schreuders | assets/characters/cliffe_schreuders_talk.png | true | cliffe_schreuders_visemes.png, 896x128, loaded |
| cliffe_workshop | assets/characters/cliffe_schreuders_talk.png | true | cliffe_schreuders_visemes.png, 896x128, loaded |
| sidhu_selvarajan | assets/characters/sidhu_selvarajan_talk.png | true | sidhu_selvarajan_visemes.png, 896x128, loaded |
| oleg_illiashenko | assets/characters/oleg_illiashenko_talk.png | true | oleg_illiashenko_visemes.png, 896x128, loaded |

`visemeSheet.columnFor` lists rest, closed, teeth, round, wide_open, medium_open, small_open, blink for each. `_visemesPending`, `_headshotFallbackAttempted` and `_baseTalkFallbackAttempted` were all false, so no fallback to the headshot or base talk sheet fired. `ttsManager.lipSync.timeline` was null in every conversation.

Facing (step 4). Every portrait renders on the right of the screen with `flipped: true`, `facingDirection: "left"`: the character is turned toward the dialogue text and the player side. All five look correct, faces undistorted.

## Lip sync

The keyless server has no TTS, so no speech audio played and the mouth cannot move from speech. That also means the "timeline set while a line plays" check from the pipeline skill's step 9 was **not run** here; it needs a run on :3000 with the Gemini key. What was confirmed: the sheet is loaded, the portrait sits at rest in pauses, nothing threw, and the blink was not observed in the short time each portrait was open (not confirmed).

## Console errors

`drain` after each conversation returned only `Failed to load resource: ... 503 (Service Unavailable)`, once per conversation line fetch. These are the expected TTS 503s on :3001. No JS exceptions.

Server log (`tmp/keyless-3001.log`) for the five characters: the `.png`, `.json`, `_visemes.png` and `_visemes.json` requests all returned 200. No 404 for tom_shaw, cliffe_schreuders, sidhu_selvarajan or oleg_illiashenko.

## Issues

No blockers and no majors for the five characters.

1. **minor**: `assets/characters/female_hacker_hood_v2_talk.png` returns 404 (the player portrait, Agent HaX). 156 hits in the shared log, including from this game at start-up. Not one of the five NPCs, and the player portrait does not animate, but the repeated 404 is noise. Not investigated further.
2. **minor**: `assets/icons/copy-sm.png`, `notes-sm.png` and `text-file.png` return 404 in the shared log (a handful each). Unrelated to this art.
3. **minor** (layout, not art): entering staff_office from the common room puts the player in the top-left door alcove, and the first few `moveToNear` calls stalled at y=56 until I used `moveTo` to a point further in. A pathing or arrival quirk of the door alcove; the same stall happened once on arrival in the lecture theatre. Not part of this art change.
4. **minor** (observation): the NPC name label and hearts show at a fixed screen position (bottom centre), not beside the NPC, in every room. It also showed the name of an NPC not being approached (Megan Oyelaran in `cliffe-2-passed.png`). Looks like the engine's existing nearest-NPC HUD, not new.
5. **minor** (observation): cliffe_workshop moved from x=90 to x=58 between readings (small patrol or drift), so his standing position is not fixed.
