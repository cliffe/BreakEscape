---
name: video-stills
description: Makes a mission stills pack for SAFETYNET: a curated set of 12 to 20 clean, spoiler-free 1920x1080 PNG screenshots taken from recorded takes (and optionally the game's own title art), each with a caption, plus a contact sheet and platform crops. Not a slideshow video (the user dropped that). Trigger when the user asks for "mission stills", "screenshots for Steam", "a screenshot pack", "stills for the Hacktivity page", "pull stills from the takes", "a gallery for the mission", or when a recipe in docs/video/recipes/ calls for stills (mission-stills.md; the stills also feed the review page and the devlog).
---

# Video stills

A mission's stills are priority 1 with the mission trailer (user, 2026-10-30). The deliverable is **PNGs plus `captions.json` and a contact sheet**, not a video: the m01 slideshow MP4 was rejected in the first review ("drop the slideshow video, keep mission stills only"). The recipe is `docs/video/recipes/mission-stills.md`.

Part of the video family: `video-scout` → `video-takes` → `video-edit` → `video-review`; this skill runs after takes exist and is independent of the edit. Read `docs/video/GUIDELINES.md` ("Spoilers", "Pixels").

## Who does this

- **Haiku** extracts candidate frames from the takes (a frame every 0.5 s of each chosen window) and builds the contact sheet.
- **The orchestrator (Opus) picks.** It looks at every candidate frame itself and chooses the set. Picking by a contact sheet alone missed a dark terminal still and a near-duplicate pair in m01; look at the frames at full size.
- **Sonnet** crops, scales, writes captions, builds the final folder and platform crops, from the picks.

## Inputs

- The takes and takes table (`docs/video/takes_<mission>.md`): `video_out/<mission>/takes/*.trimmed.mkv` (if takes are not yet recorded, `video-takes` first).
- A title still, if wanted: the game's own title art (`tools/video/assets/brand/safetynet_licence_to_hack_social.jpg`, the 1200x630 composition) or a frame of the title screen take. The m01 title-screen still showed the "Continue?" prompt: avoid prompts.
- Spoiler rules: the mission's PINs, passwords, flags, antagonist and ending from `scenarios/<mission>/SOLUTION_GUIDE.md` (read for what to keep out, never copy into captions).

## Output

```
video_out/<mission>/stills/
  01_<slug>.png ... NN_<slug>.png      1920x1080, PNG
  captions.json                        [{file, caption, source}]  (source: take id and time, crop and scale used)
  contact.png                          numbered contact sheet
  platform/                            optional crops: 9:16 (1080x1920) and 1:1 (1080x1080) for social, if a recipe asks
```

Review copies (compressed JPG, 2x pixel-doubled thumbnails with `image-rendering: pixelated`) go on the review page (`video-review`); they are not the deliverable.

## Step 1: choose candidate windows

From the takes table, list moments that read as a good screenshot on their own in under a second:

- the dialogue portrait view (full-bleed, with the game's subtitle bar: strong lines make good captions) for each cast member;
- a lit room just after the lights strike, a walking shot with an NPC in frame (`--hide-hud` takes);
- minigame panels with the whole frame visible (lockpicking pins, phone chat with replies, keypad with 3 non-answer digits, CyberChef);
- the briefing by Agent HaX, the title, a drop-site or server-room set piece that carries no answer.

Aim for variety: no two stills of the same room unless the content differs, a spread across cast and minigames, at most two dialogue portraits of one character. Drop dark frames (a flag terminal in the dark was the weakest m01 still).

## Step 2: extract frames, then make the pack

Haiku, per window: `tools/video/scout/extract-frames.sh` writes frames at chosen times, or every 0.5 s of a window, plus a numbered-by-order contact sheet. Native size is the page at 1920x1080; the game is pixel art, so anything scaled is nearest-neighbour (`SCALE=960x540` for review thumbnails).

```bash
tools/video/scout/extract-frames.sh video_out/<mission>/takes/<id>.trimmed.mkv <scratch>/stills-<mission>/cand 3.5 6 8.5
tools/video/scout/extract-frames.sh video_out/<mission>/takes/<id>.trimmed.mkv <scratch>/stills-<mission>/cand-<id> --window <start> <length> 2
```

The orchestrator looks at each candidate at full size and picks. Sonnet then writes a picks file and runs the script, which makes the final PNGs, `captions.json` and `contact.png` in one go:

```json
{ "mission": "m02", "stills": [
  { "take": "t13_npc_line", "time": 3.5, "caption": "Reception: your way in.", "slug": "reception" },
  { "take": "t06_keypad", "time": 4.0, "crop": [480, 270, 960, 540], "caption": "A keypad, three digits in.", "slug": "keypad" } ] }
```

```bash
nice -n 19 node tools/video/stills/make-stills.mjs <picks.json> [--out <dir>]    # default video_out/<mission>/stills/
```

- `take` is a take id (`video_out/<mission>/takes/<take>.trimmed.mkv`); `time` is seconds in the trimmed take (the clock of its `.trimmed.markers.json`).
- `crop` is `[x, y, w, h]` in take pixels. It must scale to 1920x1080 by a whole number: `w` divides 1920 and `h` = `w` x 9 / 16 (960x540 is 2x, 640x360 is 3x). The script refuses any other crop, so pixels stay square. Crops are nearest-neighbour; nothing is smoothed.
- Files are numbered in list order (`01_<slug>.png`). `captions.json` records the take, time and crop as each still's `source`; captions with an em dash are refused. `contact.png` is numbered to match.
- Spoiler checks are not automated: step 3 is still the orchestrator's, at full size. Rerun the script after dropping or reordering picks (it overwrites the numbered files; delete leftovers from a longer earlier run).

## Step 3: spoiler and quality gate (orchestrator)

Every still, at full size, against the checklist:

- no PIN, code, password or flag value on screen, including post-its on monitors, CyberChef inputs and subtitle text. Pixelate (blocky mosaic, not blur) if the shot is otherwise essential, as in the placeholder Hydra clip;
- keypads show 3 or fewer digits that are not the code, never an accepted entry;
- no casualty figures, no choice screens, no ending, debrief or credits;
- the antagonist is shown only if the recipe or the user says so (m01's Derek is plain from the start: user, 2026-10-29);
- no toasts ("Influence: ..."), objective panels, notifications or stray text boxes in frame unless they are the point;
- no "Continue?" or resume prompts, no `Break Escape` text (it is the engine; the game is SAFETYNET: Licence to Hack);
- sharp: pixel edges crisp, no motion smear, no half-faded transitions, mouths not caught mid-blink if avoidable.

Record the outcome per still (kept, dropped and why). Fewer clean stills beat more with risk.

## Step 4: write captions and assemble

`captions.json` entries are short, plain UK English, no em dashes, one sentence naming what the player does or sees: "Reception: your way in, and a receptionist who sees everything." Avoid spoilers and avoid claims the game does not support. Put the picks in the order they should be shown (a story order: briefing, arrival, tools, minigames, characters, the threat): the script numbers the files from that order and writes `captions.json` and `contact.png` from the picks file. If the recipe asks for platform crops, make the 9:16 and 1:1 versions framed on the subject, with a 9:16 framing check on each.

## Step 5: platform notes

| Where | What to supply |
|---|---|
| Steam | 1920x1080 16:9 PNGs, a set of at least five (check the current Steamworks screenshot rules before submitting; this draft does not hold them) |
| Hacktivity pages | the PNG set and `captions.json`, in `video_out/<mission>/stills/` for the shell to pick up; page integration is the Hacktivity repo's job |
| YouTube community, LinkedIn, social | the 9:16 and 1:1 crops, captions on a card if needed |

Google Drive export is the last stage of `video-review` ("Export"), not here.

## Gates

| Gate | Pass when |
|---|---|
| Count and variety | 12 to 20 stills, covering cast, rooms and minigames, no near-duplicates |
| Spoilers | every still checked by the orchestrator at full size, logged |
| Pixels | integer scales only, nearest-neighbour, crisp at 100% |
| Captions | one per still, in `captions.json`, UK English, no em dashes |
| No slideshow video | none made. The old `tools/video/slideshow/` tool exists (defaults now "SAFETYNET: Licence to Hack" and "Play now", but the subtitle still says "Mission 1: First Contact": pass `SUBTITLE` for any other mission). Do not use it unless the user asks for a reel |

## Traps

- Frame extraction contention: extraction is light, but do not extract during a capture if the machine is loaded (`uptime`).
- A still of a take's first seconds can show the sync slate (white frame): the trimmed take starts after it, but check frame 0.
- A crop that the script refuses is a framing problem, not a bug: pick another whole-number crop rather than scaling by a fraction.
- The Step 5 platform crops (9:16, 1:1) are not scripted: crop the 1920x1080 PNGs by hand with `ffmpeg -vf crop=...` on whole source pixels, and check each framing by eye.

## Related

`video-takes` (source), `video-review` (page and export), `docs/video/recipes/mission-stills.md`, `docs/video/recipes/devlog.md`.
