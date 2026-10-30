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

## Step 2: extract frames

Haiku, per window, with nearest-neighbour scaling (the game is pixel art; never smooth it):

```bash
mkdir -p <scratch>/stills-<mission>/cand
ffmpeg -v error -ss <in> -t <len> -i video_out/<mission>/takes/<id>.trimmed.mkv \
  -vf "fps=2,scale=1920:1080:flags=neighbor" <scratch>/stills-<mission>/cand/<id>_%03d.png
# contact sheet of a folder, numbered:
ffmpeg -v error -pattern_type glob -i '<scratch>/stills-<mission>/cand/<id>_*.png' \
  -vf "scale=384:-2:flags=neighbor,tile=6x5:padding=4:color=black" -frames:v 1 <scratch>/stills-<mission>/cand/<id>.sheet.png
```

Frames of a take are exactly the page at 1920x1080 and 2x pixel scale: no resize is needed for a full frame. For a crop that fills the frame, crop on whole source pixels and scale by an **integer factor, 2x or 3x, nearest-neighbour** (m01: crops at 2x and 3x), so pixels stay square:

```bash
ffmpeg -v error -i in.png -vf "crop=960:540:480:270,scale=1920:1080:flags=neighbor" out.png
```

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

`captions.json` entries are short, plain UK English, no em dashes, one sentence naming what the player does or sees: "Reception: your way in, and a receptionist who sees everything." Avoid spoilers and avoid claims the game does not support. Number files in the order they should be shown (a story order: briefing, arrival, tools, minigames, characters, the threat).

Also write a contact sheet of the final set (`contact.png`) and, if the recipe asks for platform crops, 9:16 and 1:1 versions framed on the subject, with a 9:16 framing check on each.

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
| No slideshow video | none made. The old `tools/video/slideshow/` tool exists, but its defaults print "Break Escape" and "Play Mission 1 free", which break the brand rules: if a reel is ever wanted, pass `TITLE`, `SUBTITLE`, `END1` and `END2` explicitly and tell the user |

## Traps

- Frame extraction contention: extraction is light, but do not extract during a capture if the machine is loaded (`uptime`).
- A still of a take's first seconds can show the sync slate (white frame): the trimmed take starts after it, but check frame 0.
- m01's stills were cut by hand from take frames in the session scratchpad; there is no checked-in script for it (gap 4 in `docs/video/recipes/README.md`). Do the commands above and save any helper under `tools/video/stills/` only if the user asks.

## Related

`video-takes` (source), `video-review` (page and export), `docs/video/recipes/mission-stills.md`, `docs/video/recipes/devlog.md`.
