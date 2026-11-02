---
name: video-takes
description: Records gameplay takes of a SAFETYNET mission for video: one script per shot driven through the window.__test bridge, captured at 30 fps with live game audio on a virtual display, then checked for sync and dropped frames and trimmed, with marks for every line and action. Second stage of the video family (video-scout, video-takes, video-edit, video-stills, video-review). Trigger when the user asks to "record the takes", "capture the shots", "record gameplay for the trailer", "re-record a take", "write a take script", "film the m0X keypad / NPC line / walking shot", or when a scout report and picks file exist and no takes do.
---

# Video takes

Turn the scout's picks into short, clean, marked recordings: one script per shot, run by `run-take.sh`, checked by `check-take.mjs`. A take is raw material; the edit stage chooses the in and out points.

Needs the scout report and the picks file (`docs/video/scout/<mission>_scout.md`, `docs/video/edits/<mission>_<KIND>_PICKS.md`). Reads `docs/video/GUIDELINES.md` and `docs/video/takes_v2.md` (the model takes table). The bridge API is `docs/test-bridge.md`; the playtest skill (`.claude/skills/playtest-scenario/SKILL.md`) explains its gotchas, and most of them apply here.

## Who does this

**Sonnet** writes and runs the take scripts, one agent per batch of takes, resumed between batches until it passes about 300k tokens. The **orchestrator (Opus)** reviews the takes table and the contact sheets and does the selects (`video-edit`). Captures are **serial**: one display, one take at a time. Do not parallelise.

Brief the agent with: this skill, the picks file, the take ids and entry states to record, its own scratch subfolder as a full path (`<scratchpad>/video-takes-<mission>/`), "don't commit, don't edit the tooling", and "report as the final message; save the table as `docs/video/takes_<mission>.md`".

## Outputs

| Path | What |
|---|---|
| `tools/video/takes/<mission>/<id>.mjs` | the take script (checked in) |
| `video_out/<mission>/takes/<id>.trimmed.mkv` | trimmed take with audio (git-ignored) |
| `.../<id>.trimmed.markers.json`, `<id>.check.json`, `<id>.contact.jpg` | marks in the trimmed file's clock, check result, contact sheet (1 frame per second) |
| `docs/video/takes_<mission>.md` | the table: id, entry state flags, length, drop %, A/V offset, key marks checked against frames, problems |

## Step 0: where things live

The tooling is mission-aware. A mission is named by its short key (`m02`, `sis01`) or its scenario id (`m02_ransomed_trust`); both work as the first argument of `run-take.sh`, and the scenario id is looked up in `scenarios/<key>_*`.

| What | Where |
|---|---|
| The recorder script | `tools/video/takes/run-take.sh <mission> <take id> ...` (`takes/m01/run-take.sh <take id>` still works and means m01) |
| Take scripts | `tools/video/takes/<mission>/<take id>.mjs`; make the folder for a new mission |
| Shared helpers | `tools/video/takes/lib/`: `lib.mjs`, `dlg.mjs`, `walklib.mjs`. Import them as `../lib/lib.mjs` and so on. Do not copy them: a fix lands once |
| Mission-specific bits | in the mission's own folder: the opening-cutscene gate (m01's `briefing_played`), room names, coordinates, a shared `setup()` such as `t04_lockpick.mjs` exports |
| Outputs | `video_out/<mission>/takes/` |

Take ids need no mission prefix: the folder separates missions (`m02` and `m01` can both have a `t01_title`). The edit list's `"mission"` field points lint, mix, `.srt` and render at the same folder.

## Step 1: bring the capture environment up

Database, keyless server and Rails exports are as in `video-scout` Step 1 (a fresh container needs the one-off database setup first). Then:

```bash
export VIDEO_STATE_DIR=<scratchpad>/video-takes-<mission>     # a dedicated folder
tools/video/capture/env-up.sh 97        # Xvfb :97 (1928x1088) + PulseAudio null sink be_rec_97
```

The X screen is 1928x1088 so a 1920x1080 window is not shrunk by 1 px (Chromium without a window manager shrinks a screen-sized window). The recorder grabs 1920x1080 at 0,0. Chromium as root needs `--no-sandbox` (the tooling passes it). Stop later with `tools/video/capture/env-down.sh 97` (it stops only recorded PIDs; never `pkill -f`). `NODE_PATH=/opt/node-tools/node_modules` is exported by `run-take.sh`.

**Before every capture, check nothing is rendering:** `pgrep -af 'remotion|render.mjs|render.sh'` must be empty (and `uptime` load not high). A capture during a Remotion render drops frames: the m01 t10 take recorded during a render dropped 4.1% and had to be redone. If a render runs, wait (poll every 60 s); do not start the capture. Kill strays by PID only.

## Step 2: write the take script

Header comment first (every m01 take has one): what it records, the entry state as the exact `new-game.rb` flags, the `run-take.sh` line, the path of choices, and the marks it writes. Skeleton:

```js
import { sleep, clearScreen, watchVoice } from '../lib/lib.mjs';
import { runDialogue } from '../lib/dlg.mjs';
export async function setup(page, bridge) { await clearScreen(page, bridge, () => {}); await sleep(500); }   // before recording starts
export default async (page, bridge, mark) => {      // mark('label', {data}) logs a take-relative time
  const vw = await watchVoice(page, mark);          // writes line-start:/line-end: marks from real TTS playback
  ...
};
```

Helpers in `tools/video/takes/lib/`: `lib.mjs` (`watchVoice`, `clearScreen`, `pickChoice`, `awaitChoice`), `dlg.mjs` (`runDialogue` follows a scripted choice path, plays target lines in full and skips others after a short dwell), `walklib.mjs` (`keyLegs`: key-driven walking with no click marker). Take scripts to copy from (all in `tools/video/takes/m01/`): `t13_sarah_line.mjs` (dialogue), `t06_keypad_v3.mjs` (PIN close-up), `t04_lockpick.mjs` (setup off camera, real picking), `t14_cyberchef.mjs` (overlay tool), `t16_walk_sarah.mjs` (walking), `t01_title.mjs` (title screen), `t09_derek.mjs` (finale line).

### Entry state

Use the cheapest head-start from the scout, as `new-game.rb --help` lists: `--start-room`, `--unlock`, `--set name=value`, `--give`, `--complete-task`, `--submit-flag`. m01 needs `--set briefing_played=true` to stop the opening briefing opening itself (that global is m01's; it is not built into the tooling); find the equivalent gate in the new mission's opening cutscene and say what you chose. Head-start games open a Mission Brief notes minigame: `clearScreen` closes it in `setup()`.

`--give` cannot supply an item an NPC hands over in conversation (Kevin's lockpick kit). Play that conversation in `setup()`, off camera (about 2.5 min in m01) and check the item arrived.

### Rules for what goes on screen

| Rule | Why (from the log) |
|---|---|
| **Keypads: at least 3 digits typed, digits that differ from the real code position by position and from every other PIN in the mission. Never press ENTER; cancel out.** | spoilers; the user's v2 review asked for 3 digits. `t06_keypad_v3`: 1, 9, 3 with a 0.6 s pace and a 1 s linger. The attempts log must stay empty |
| **Pixelate or crop any real answer.** Passwords, codes, flags, post-its with logins, a voicemail subtitle that states a PIN | m01's Hydra clip needed a mosaic over the cracked password |
| Phone and chat minigames need about 0.5 s more than feels natural | the reply choices must show (v3 review) |
| Minigame shots show the whole panel with a margin; shoot at 1x | the first teaser cropped too tight |
| Overworld shots: `--hide-hud --zoom-step 1` (3x), notifications and text boxes dismissed before the in point | HUD clutter and a tiny room in black space |
| Walking shots: key-driven (`walklib`), because a click leaves a marker. Rooms are small: 1.3 to 3 s of motion is normal; record the hold | only one NPC per room, so one NPC plus the player |
| Dialogue: use the game's own portrait view and subtitle bar; mark every target line | no second subtitle layer |
| Never name the antagonist or show an ending or choice screen unless the recipe allows it | spoilers |
| The title screen take is `--title-take` (recording starts on a black page before the game loads; the start slate is video-only) | AudioContext cannot run before the title's click |

**Driving the game for takes (learnt on m01 v8):**
- **Locked doors.** `enterRoom` returns `{reason: 'door-locked', doorway: {id}}` instead of opening the unlock minigame: `moveToNear(doorway.id)` then `interact(doorway.id)`, as `t19_minigames.mjs` does.
- **Key locks.** With any key in the inventory the minigame opens on a key SELECTION screen first: `minigame.getState().keySelection` lists click points and labels; `clickCanvas` the right one, then `keyTarget` appears and one `clickCanvas(keyTarget)` runs the insertion. Shoot the last half second of insertion (the pins riding the key onto the shear line), not the start.
- **`moveTo` stops where its path ends**, often short of the target (a chair, a desk, the room edge). For an exact start point, line up with short arrow-key pulses that correct both ways (`t21_walk_chair.mjs` `pulse()`); `keyLegs` only corrects forwards. Log the player position in `setup()` and check it before trusting a walk.
- **Taking an item out of a container** (`minigame.take`) opens a note in the notes reader. Read the note before using it on camera: Patricia's CyberChef note shows a real m01 PIN as its second example and was dropped.
- **Several minigames in one run.** A chain take (`t19_minigames.mjs`: briefcase contents, key lock, password screen) is cheaper than one take each when they share a costly setup; mark each beat.
- **Inventory items opened under `--hide-hud`.** The tray is hidden; record without `--hide-hud` when the shot is a full-screen minigame (`t22_launch_device.mjs`), or call the item's own handler (`t14`).
- **End a walk before anything opens.** A walk that ends on an interaction can carry a few frames of the next screen. Find the first frame of the new screen by luminance (ffmpeg to raw gray, mean per frame) and set the out point before it (`t23_walk_kali`: the VM launcher at 3.00 s shows a login post-it).
- **Walking shots must look purposeful.** Walking into an NPC pushes them (the user cut it). Give the walk a destination (a door) and let props be incidental: the m01 chair shot is the player heading for a door who clips a swivel chair. Swivel chairs are physics bodies in `window.chairs`; their `body.center` is the wheel row, which is what the player's feet (`player.body.center`) must meet. A chair tucked under a desk can only be pushed from its open side.
- **Setup can fail on pathing** (an NPC standing in a doorway); the take did not start, so simply run it again.

**Real lockpicking.** The bridge `pressKey` does not reach the nested Phaser lockpicking scene. Dispatch `keydown`/`keyup` events with `keyCode` to `window` (see `t04_lockpick.mjs`) and read the pin state only to know when to release. Never use `completeLockpick` on camera.

**Voice.** `--music 0` always (the edit supplies the music). Voiced lines play from the cache. Each target line must produce a `line-start:`/`line-end:` mark pair from the TTS manager (`watchVoice`), and its length must match the scout's ffprobe value to about 0.1 s. A line with no pair did not play: the take fails even if the picture looks right. Skipped lines (`runDialogue` presses through non-targets) are partly audible, so the edit must cut to the target marks only.

**Cached-voice testing.** Before recording an NPC line that the scout did not test, post the exact text to the real endpoint (`video-scout` Step 2). 200 audio/mpeg plays; 503 is silent. Never generate audio to make a take work: new TTS costs money and the orchestrator asks the user with a line count.

## Step 3: record and check

```bash
tools/video/takes/run-take.sh <mission> <take_id> "<new-game flags>" "<record-take flags>"
# for example:
tools/video/takes/run-take.sh m02 t06_keypad_v3 "--start-room main_office_area --set <gate>=true" "--hide-hud --zoom-step 1"
```

`run-take.sh` makes a fresh game of the mission (`new-game.rb`, port 3001), runs `record-take.mjs --display 97 ... --fps 30 --preset ultrafast --crf 14 --music 0`, runs `check-take.mjs`, prints one JSON line (pass, dropPct, offsets, problems, trimmed length) and deletes the raw `.mkv` on pass. `record-take.mjs` also takes `--sfx --voice --master` volumes, `--size`, `--no-bridge`, `--audio-delay-ms` (do not use: a fixed delay is not stable).

**30 fps only.** 60 fps fails on 4 cores at either preset; 30 fps `veryfast` is marginal; 30 fps `ultrafast` passed in m01 (0.06 to 1.2% dropped, CPU about 85%).

`check-take.mjs` finds the sync slates (white frames and a 1 kHz tone) at the start and end, corrects the constant audio offset (audio leads picture by 45 to 110 ms), trims between the slates and writes the contact sheet.

### Gate: a take passes when

- check exit 0: A/V offset under 33 ms at both ends after correction, **dropped plus duplicated frames under 1%**;
- both slates were found (a missing slate is a failed take: `t13_sarah_line` failed once this way and passed on the second run);
- every target line has a start/end mark pair of the expected length;
- the contact sheet shows what the script says it shows.

Expect to re-record about one take in three. Do not tune a failing take; re-run it. Keep the failed attempt's `.check.json` for the log.

## Step 4: check the marks against frames

The orchestrator's selects depend on this, so the takes agent does it first and records it in the table. **Marks are not the picture.** Dialogue marks come from real TTS playback edges and are safe to cut on (the game's subtitle appears 0.1 to 0.2 s before the line-start mark and stays until the next line). **Minigame marks can drift from the picture by seconds** (m01 t04: lock-open marked 14.36 s, visible at about 10.8 s; t14: output marks lag by 0.5 s). Extract frames at each mark and a little either side:

```bash
tools/video/scout/extract-frames.sh video_out/<mission>/takes/<id>.trimmed.mkv <scratch>/marks-<id> 5.2 5.6 6.0   # PNGs plus sheet.png; SCALE=960x540 shrinks them
```

For each key mark, say in the table "frame at T shows X". Check digits on keypad frames against the code. Look for toasts ("Influence: Kevin Park"), objectives panels and text boxes in frame.

## Step 5: the takes table

`docs/video/takes_<mission>.md`, columns as `takes_v2.md`: id, entry state flags, trimmed length, drop %, A/V offset start/end (ms, corrected), key marks (trimmed seconds, checked against frames), problems. Add "Things to look at first": marks versus picture, spoiler content in the pre-target part of dialogue takes, short walking shots, and what is left running.

## Traps

- **Do not capture during a render, and do not render during a capture.** One at a time.
- **Lip sync:** a late-word mouth bug (the closing pause swallowing a soft last word) was fixed in commit `1f56ea4e`. Takes recorded before it keep the old mouth; re-record dialogue takes of finale lines if they were made earlier (m01's `t09_derek` was redone as `t09_derek_v5.mjs`).
- A take whose script is missing fails at once (`no take script ...`); a mission with no unique `scenarios/<key>_*` folder fails with the folder list.
- Leave nothing changed in the repo: `git status` before and after. A take that edits a sprite or scenario for a check must restore it (`tools/playtest/restore-sprite.rb` exists for the sprite swap the m01 lip-sync check used).
- The keyless server and Postgres may have been stopped by the scout; restart them (Step 1 of `video-scout`).
- Leave display 97 and the sink up between batches; stop them at the end of the stage with `env-down.sh 97` unless the next stage is another batch.
- Headless browsers and ffmpeg processes left by a crashed take: list with `ps`, kill by PID.
- **Never `pkill -f <pattern>`** when the pattern appears in your own command line: it kills your own shell (exit 144) and whatever you queued after it. Find PIDs with `ps -eo pid,args | grep` and `kill` those.
- **The container can restart between turns.** Postgres, the keyless server, Xvfb and PulseAudio are then all down while `video_out/` survives. Restart them (Step 1, and `video-scout` Step 1); a stale `/tmp/.X97-lock` makes `env-up.sh` say the display is in use, and an old `env-97.pids` in `VIDEO_STATE_DIR` must go too.
- **A take that looks wrong may be a game bug.** m01's key insertion lagged and jumped because the minigame stepped pins per frame and sampled the key 14 px off; re-recording would not have helped. Look at the minigame frame by frame (ffmpeg `fps=5` contact strip) and read its code before re-recording; fix the game where the bug is (it helps players too) and say so.

## Related

`video-scout` (before), `video-edit` (after), `video-stills` (stills come from the same takes), `video-review`, `playtest-scenario`, `tts-audio`, `docs/video/recipes/README.md`.
