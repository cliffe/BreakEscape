---
name: video-edit
description: Selects shots and builds, lints and renders a SAFETYNET video from takes: orchestrator selects checked against frames, a Remotion edit list on the music's beat grid, cards, title, glitch or pixel-dissolve joins, the Veo opening and launch clips, a marked placeholder for real-hacking footage, then renders 16:9, 9:16 and 1:1 with loudness-normalised audio and an .srt. Third stage of the video family (video-scout, video-takes, video-edit, video-stills, video-review). Trigger when the user asks to "edit the trailer", "build the edit list", "render the trailer", "make the teaser", "cut a 9:16 version", "pick the music", "do the selects", "re-render with the new take", or when takes exist and a recipe in docs/video/recipes/ needs filling.
---

# Video edit

From recorded takes to a finished render. Three jobs in order: the **selects** (orchestrator), the **edit list** (Sonnet fills it from the selects), the **render** (Sonnet runs it, the orchestrator checks it). The recipe for the kind of video (`docs/video/recipes/`) gives the beat sheet; `docs/video/recipes/mission-trailer.md` is the m01 60 s structure as a template. House style is `docs/video/GUIDELINES.md`: read it, it is the source for fonts, cards, joins, pixels and sound.

Worked example to copy: `tools/video/edits/m01_trailer60.json` (v4, 25 shots, 60.00 s). Remotion project: `tools/video/remotion/` (Remotion 4.0.530; the free licence applies, user-confirmed 2026-10-29).

## Who does this

- **Orchestrator (Opus): selects and review.** Picks in and out points from contact sheets *and frames*, chooses the music window, reads every contact sheet of every render, runs the spoiler checklist. These are not delegated.
- **Sonnet:** fills and fixes the edit list, runs `render.sh`, builds effects or components if a recipe needs one, makes the A/B renders. One agent per render batch.
- **Haiku:** file chores only (extracting frames, contact sheets, listing take marks).

## Inputs

Takes and the takes table (`video-takes`), the picks file, the recipe, the game's Veo clips in `tools/video/assets/clips/` (one opening and one launch clip per game: `spy_into_frame.mp4`, `spy_laptop_out.mp4` for SAFETYNET: Licence to Hack; `title-launch-clips` recipe if they do not exist), brand art in `tools/video/assets/brand/`, the real-hacking placeholder in `tools/video/assets/placeholders/`.

## Outputs

`tools/video/edits/<mission>_<kind>.json`; renders in `video_out/<mission>/renders/` (git-ignored) named `<edit id>_<aspect>.mp4`, plus `<edit id>.srt` (always) and `<edit id>_<aspect>.contact.png`. A selects note at `docs/video/edits/<mission>_<KIND>_SELECTS.md` (in, out, why, frame evidence).

## Step 1: the selects

For every slot in the beat sheet, choose in and out on the take. **Marks are not the picture.** Look at frames:

```bash
ffmpeg -v error -ss <t> -i video_out/<mission>/takes/<id>.trimmed.mkv -frames:v 1 -vf scale=960:-2:flags=neighbor <scratch>/f.png
```

Check the first and last frame of every window, and every frame where something changes (a digit lands, a lock springs, a subtitle appears). Rules that came from the user's reviews:

- **Dialogue** (`dialogue: true`): cut to the target line's start and end marks; the subtitle shows 0.1 to 0.2 s before the start mark. Cut around skipped lines. A strong antagonist line plays wide, then **hard-cuts to a UI-free close-up** for its last part (not a slow push-in): m01's `derek_wide` then `derek_close` with a 3-frame glitch `hit` on the cut, at the silence before "Security".
- **Minigames:** show the whole panel with a margin at 1x (CyberChef is the exception: crop to the working panes at 2x). Phone and chat shots hold about 0.5 s longer so the reply choices show. PIN shots show at least 3 digits typed and held.
- **Walking shots:** 1 s excerpts around the motion; one NPC plus the player.
- **No second subtitle layer** over the game's own bar. Where a 9:16 crop loses the bar, set `"caption": {"9:16": true}` on the shot and the Press Start 2P caption appears from `lines`.
- **Spoilers:** see the checklist below; every shot carries a reviewed `spoiler` block.
- **Real-hacking footage** is a placeholder until in-game VM capture exists (user, 2026-10-30): the shot is `source.type: "clip"`, `placeholder: true`, with a note. Reusing `real_hacking_kali.mp4`: its Hydra shot names user `derek` and is m01-specific, so for another mission cut only the later part (about 20.8 to 23.4 s of the old trailer, after the Hydra line), check the frames for anything m01-specific, and leave the slot easy to swap. The lint lists placeholders and `--final` refuses them: a final render of a trailer with a slot needs the user's explicit say-so.

## Step 2: music

Only the game's own tracks (`public/break_escape/assets/music/`, original and cleared). **A different track for each mission.** The record is the mission-to-music table in `docs/video/recipes/README.md`: read it first, choose a track that no mission has used, and add the row when the edit is final.

Analyse the beat grid first (needs librosa; the container does not have it installed system-wide, so use a venv: `python3 -m venv <scratch>/venv && <scratch>/venv/bin/pip install librosa`, run under `nice -n 19`):

```bash
nice -n 19 <scratch>/venv/bin/python tools/video/edits/music/analyse_music.py --length 60 tools/video/edits/music "public/break_escape/assets/music/<Set>/<Track>.mp3"
# writes tools/video/edits/music/<slug>_60.json: bpm, beat offset, bars, strongest hits, per-bar energy, best windows
```

Look for a window with a quiet opening (title and the hook line), a drop at about 10 to 14 s, further lifts for the back half and a clean end. `tools/video/edits/music/summary.json` lists tracks already analysed (six, with 30 s windows); m01 used Noir "Midnight Cipher Chase" (120 BPM, window start 109.023 s, a downbeat; lifts at 12, 18, 26, 34 and 52 s; quiet bar at 48 s; strong hits at 52, 54, 56, 58 s). Cards land on lifts and strong hits, montage cuts on beats, every `snap: true` boundary on the grid. Put the choice in the edit's `music` block with `alternatives`.

## Step 3: fill the edit list

Top level: `id`, `title`, `fps` (30, integer, at least 24), `length`, `music` (`track`, `analysis`, `start`, `length`, `gain_db`, `fade_in`, `fade_out`), `beat` (`bpm`, `period`, `offset`), `duck` (`db: -10`, `attack`, `release`), `audio` (`fade_ms: 8`, `target_lufs: -14`, `true_peak: -1.5`), `aspects`, `shots`, `effects` (`cardJoin`: `glitch` or `dissolve`).

Shot types: `title` (first shot only, optional Veo `clip`), `card` (`text[]`; `kind: logo`/`logo_end` for the closing logos), `gameplay` (`source {file, in, out}` for a take, or `{type: "clip", file, in, out}` for a clip), `cta` (a Veo `clip`, `phases[]`, `curtain` timing). Per shot: `duration`, `snap`, `join {type: cut|glitch|blur|dissolve|card, pin, frames}`, `framing {aspect: {cx, cy, zoom}}`, `audio {gain_db, dialogue, duck_music, pre}`, `lines[]` (for the .srt and captions), `hit`, `caption`, `placeholder`, `spoiler {reviewed, shows_code, shows_identity, shows_ending, keypad_partial, note}`.

Rules the lint enforces (read `tools/video/remotion/scripts/lint-edit.mjs` for the rest):

- **Joins:** glitch, pixel dissolve or blur only into or out of a card or the title. Gameplay to gameplay is always a hard cut. Glitch is 6 to 10 frames, dissolve 6 to 10 with 24 px blocks. The user prefers the glitch and wants the pixel dissolve used somewhere quieter: m01 pinned dissolves (`join.pin: true`) either side of "Uncover the Mystery". `effects.cardJoin` re-points every unpinned glitch/dissolve join, so one list renders both A and B versions.
- **Snap:** with `snap: true` every start and end is on the beat grid within half a frame.
- **Audio:** each gameplay shot needs `audio.gain_db` (montage about -6 dB, dialogue 0 with `dialogue` and `duck_music` true). A dialogue shot needs `lines[]`. Consecutive dialogue shots share one duck. `audio.pre` is a J-cut (m01: HaX's line starts 1.2 s under the held title).
- **Pixels:** nearest-neighbour, integer scale. Veo clips are painted art at 720p, so they are scaled smoothly (the one exception).

Brand and card rules (user, 2026-10-30; also in the recipes):

- The game title (`SAFETYNET: Licence to Hack`, pixel SVG over the keyhole art, integer scale 12x/16x/15x) opens the video. **Hacktivity Games signs off at the end, on the red hex curtain** (the `cta` shot's logo morphs Labs to Games). **"Break Escape" never appears on screen**, not in cards, captions, filenames shown on screen or end cards.
- **The call to action says "Play now".** The v4 edit said "Play Mission 1 / Free!"; the working copy of `m01_trailer60.json` (v5, uncommitted when this was drafted) already reads "Play now". Check the `cta` phase text of any edit you copy from, and never copy the old wording into a new one (gap 3 in `docs/video/recipes/README.md`).
- Cards are white Press Start 2P on the navy-to-purple gradient with the glitched mirrored reflection. Mission trailers name the mission on the card ("Mission 2 / ...").

## Step 4: lint, then render

```bash
cd /home/user/BreakEscape
node tools/video/remotion/scripts/lint-edit.mjs tools/video/edits/<mission>_<kind>.json          # drafts
node tools/video/remotion/scripts/lint-edit.mjs tools/video/edits/<mission>_<kind>.json --final   # before a real render: placeholders, missing files and unreviewed spoilers become errors
export BE_VIDEO_SCRATCH=<scratchpad>/render-<edit id>-16x9     # see the trap below
nice -n 19 tools/video/remotion/render.sh tools/video/edits/<mission>_<kind>.json 16:9 --final
# repeat, one at a time, for 9:16 and 1:1
```

`render.sh` syncs assets, lints, renders silent video through Remotion at concurrency 1, builds the audio mix (music window with a smooth duck, take audio with 8 ms fades, J-cuts), runs a two-pass `loudnorm` to **-14 LUFS with true peak under -1 dBTP**, muxes, writes the `.srt` and a contact sheet. Timing: about 15 minutes per 30 s of video at one thread (SVG filters on cards are the cost), about 30 minutes for 60 s. Run in the background and poll; render jobs of this length can be cut by a session limit, so write the resume note.

**Takes folder gap:** `lint-edit`, `mix-audio` and `make-srt` default to `video_out/m01/takes` and `render.sh` does not pass `--takes-dir`. Until that is fixed, copy or symlink the new mission's `*.trimmed.mkv` and `.markers.json` into `video_out/m01/takes/` with mission-prefixed names, or run the stages by hand with `--takes-dir`. `BE_TAKES_DIR` (asset sync) and `BE_RENDER_DIR` (output folder, set it to `video_out/<mission>/renders`) are honoured.

### Traps

- **`BE_VIDEO_SCRATCH` is deleted** (`rm -rf`) when `render.sh` finishes successfully. Point it at a dedicated, empty subfolder named for the render. Never at the scratchpad root, a take folder or anything you want to keep. If it is unset the script uses a fresh temp folder.
- **Renders run out of memory in parallel.** Render 16:9, 9:16 and 1:1 one after another, not side by side, and never alongside a capture. Check `free -g` and `uptime` first. `BE_CONCURRENCY=2` raises Remotion's frame concurrency and is a risk on 4 cores. A failed render leaves its scratch folder behind: delete it by name.
- **Never capture during a render** (frames drop). Check `pgrep -af 'remotion|render.mjs|render.sh'` before every capture.
- **30 fps only.** A different fps in the edit list breaks the beat snap and the takes.
- Re-render only the aspects that changed; the 9:16 and 1:1 after the user picks glitch or dissolve (m01 rendered A and B in 16:9 only).
- New effect or component work belongs to a Sonnet agent with a spec, reviewed against the reference frames (GUIDELINES "Joins"), not improvised in an edit.

## Gates

| Gate | Pass when |
|---|---|
| Selects | each window checked against frames, logged in the selects note |
| Lint | `--final` exits 0 (or only the user-approved placeholders remain, listed) |
| Audio | per render: -14.0 LUFS (13.9 to 14.1), true peak under -1 dBTP, dialogue 3 dB or more over the ducked music at its quietest |
| Length | within one frame of the recipe's length; `ffprobe` duration |
| Contact sheet (orchestrator) | every card, join, minigame frame (panel border visible with a margin), the title frame, the key-press and logo frames of the closing clip, and the last frame all checked by eye |
| Spoilers (orchestrator) | the checklist below, shot by shot |
| Captions | `.srt` exists and matches the voiced lines; burned captions present wherever the recipe says (social cuts) |

### Spoiler checklist

No code, PIN, password, flag value or answer on screen, including post-its, CyberChef inputs, subtitle text and the old-trailer placeholder (pixelate real answers; the Hydra shot's password was mosaicked). Keypad shots show 3 digits that differ from the real code. No casualty figures, no ending or choice screens, no debrief lines. An antagonist may be shown or named only if the recipe or the user says he is plain from the start (m01's Derek, 2026-10-29). Check the pre-target audio of a dialogue take: skipped lines can be partly audible.

## Captions

An `.srt` is always written (`make-srt.mjs`, from `lines[]` or the take's `line-start`/`line-end` marks). Social cuts (`mission-teaser` recipe) are **burned in**: set `caption[aspect]` on every dialogue shot of the 9:16 and 1:1 renders. Where the crop keeps the game's own subtitle bar (16:9), do not add a second layer. Gap: the burned caption exists only for dialogue shots with `lines[]`; narration over cards (Agent HaX TTS) would need a caption overlay on cards that is not built yet.

## Narration

Narration is Agent HaX's TTS voice. A voiced line is only playable if its text exists in the mission's ink for that NPC and is cached. **New lines cost money:** ask the user each time, with the number of new lines (cached lines are free); `tts-audio` is the skill for generating, and nothing is generated without the user's yes.

## Related

`video-scout`, `video-takes` (before); `video-review` (after); `video-stills`; `docs/video/recipes/*`; `tts-audio`; `AGENTS.md` ("Choosing a model").
