# Video recipes: index

Draft (2026-10-30). Everything here was learned on mission m01 (`docs/video/TRIAL_LOG.md`) and the user's answers of 2026-10-30. A recipe says **what** to make; the stage skills say **how**: `video-scout` → `video-takes` → `video-edit` (and `video-stills`) → `video-review`, in `.claude/skills/`. House style: `docs/video/GUIDELINES.md`.

## I want ...

Priority order is the user's (2026-10-30). Skills are listed in the order to run them.

| I want | Priority | Recipe | Stage skills |
|---|---|---|---|
| A mission trailer (60 s) | 1 | `mission-trailer.md` | scout, takes, edit, review (stills alongside) |
| A mission stills pack | 1 | `mission-stills.md` | scout (light), takes, stills, review |
| A mission teaser or a social cut (15 to 30 s, 9:16 first) | 2 | `mission-teaser.md` | edit (reuses the trailer's takes; takes only for new shots), review |
| The whole-game trailer | 2 | `game-trailer.md` | scout per mission (reuse), takes, edit, review |
| The game's opening and launch clips (Veo), and the shell's title intro and start files | 2 | `title-launch-clips.md` | the user generates; edit consumes the clips |
| A devlog or a demo | 3 | `devlog.md` | takes, edit, review |
| A title or launch clip for the Hacktivity shell | 3 | `title-launch-clips.md` | see that recipe |
| An Agent HaX briefing (3 to 10 min) | 4 | `hax-briefing.md` (stub) | tooling missing |
| A concept explainer | 4 | `concept-explainer.md` (stub) | tooling missing |
| A label sizzle, a staff walkthrough | later | none yet | not designed; see GUIDELINES "By kind of video" |

Start every recipe by reading the **house rules** below, then the recipe, then the first stage skill.

## House rules every recipe inherits

These are the user's decisions (2026-10-29 and 2026-10-30) and the m01 lessons, in one place. Recipes do not repeat them, except where a recipe adds to them.

- **Brand.** The game title (SAFETYNET: Licence to Hack) opens the video. Hacktivity Games signs off at the end, on the red hex curtain (Labs morphs to Games). **"Break Escape" never appears on screen** (it is the engine). The call to action says **"Play now"**, not "Play Mission 1 Free".
- **Music.** Only the game's own tracks (`public/break_escape/assets/music/`, original and cleared). **A different track for each mission.** Record each choice in the table below.
- **Narration.** Agent HaX's TTS voice. A line is playable only if its text is in the ink for that NPC and cached. **New TTS lines cost money: ask the user each time, with a line count.** Cached lines are free. Use `tts-audio`.
- **Captions.** Always an `.srt`. **Burned in on social cuts** (9:16, 1:1, Shorts/Reels/TikTok). Do not stack a second layer on the game's own subtitle bar where the bar is still visible.
- **Real hacking footage.** In-game VM capture is coming. Until then use a **marked placeholder** (`placeholder: true`) and leave a slot. Lint `--final` refuses placeholders: a final render needs the user's say-so.
- **Generated clips.** One Veo opening and launch pair per game; the user generates them. The skill prepares prompts and start frames (`title-launch-clips.md`).
- **Platforms.** YouTube, Hacktivity pages, Steam, LinkedIn, Shorts/Reels/TikTok. YouTube, the Hacktivity pages and Steam take 16:9. Shorts, Reels and TikTok take 9:16. LinkedIn takes 1:1 or 16:9 with burned captions (silent autoplay).
- **Spoilers.** Show mechanics, hide answers. No full codes, PINs, passwords or flag values. Keypads show 3 digits that are not the code. Pixelate real answers on screen (post-its, voicemail subtitles, the old-trailer Hydra line). No casualty figures, no ending, no choice screens. An antagonist is shown or named only where the recipe or the user says so (m01's Derek, 2026-10-29).
- **Capture and render.** 30 fps only. Never capture during a render, and never run renders in parallel (memory). `BE_VIDEO_SCRATCH` is deleted by `render.sh`.
- **Review.** A review page (artifact) with the videos and a feedback form every round, same link. Orchestrator (Opus) does selects and reviews; Sonnet and Haiku do the rest.
- **Storage.** Finals are committed straight to `master` in the `cliffe/hacktivity-videos` repo (user, 2026-10-30); `video-review` Step 6 does the export.
- **Writing.** Plain UK English, no em dashes, no AI-sounding filler.

## Mission-to-music record

One track per mission. Before choosing, read this table; after the edit is final, add the row. The beat grid and windows come from `tools/video/edits/music/analyse_music.py` (analysis files in `tools/video/edits/music/`).

| Mission | Track | Window used | BPM | Where | Alternatives analysed | Notes |
|---|---|---|---|---|---|---|
| m01 First Contact | Noir "Midnight Cipher Chase" (`Noir/Midnight Cipher Chase.mp3`) | 60 s from 109.023 s (a downbeat); the 30 s teaser used 107.02 to 137.03 s, later moved to 109.023 s | 120 (period 0.5 s) | 60 s trailer v4 | Cold Bond Circuit at 53.847 s (86 BPM); Midnight Trigger at 92.994 s; Shadow Code 1 at 114.322 s | lifts at 12, 18, 26, 34 and 52 s; quiet bar at 48 s; strong hits at 52, 54, 56, 58 s |
| m02 Ransomed Trust | unassigned | | | | | |
| m03 Ghost in the Machine | unassigned | | | | | |
| m04 to m08 | unassigned | | | | | |
| Whole-game trailer | unassigned (suggestion for the user to hear: a Vocals-set track such as "Safetynet in the Smoke") | | | | | must not reuse a mission's track |

Not tied to a mission: the m01 slideshow used Noir "Shadow In E Minor" (the slideshow video was dropped; the track is free to use).

## Tooling gaps

Draft (2026-10-30). The mission-generalisation pass (same day) closed gaps 1, 4, 5, 7, 8, 13 and 14 and part of 3. Numbers stay as they were because recipes cite them (gap 6, gap 11). The orchestrator decides which open gap to fix next.

### Closed

- **1. Mission names hard-coded to m01.** `tools/video/takes/run-take.sh <mission> <take id> ...` (the m01 form `run-take.sh <take id>` still works), take scripts in `tools/video/takes/<mission>/`, outputs in `video_out/<mission>/takes/`. Edit lists carry `"mission"`; `render.sh` reads takes from `video_out/<mission>/takes`, writes `video_out/<mission>/renders/`, and passes the takes folder to sync, lint, mix and `.srt` (`--takes-dir`, `BE_TAKES_DIR` and `BE_RENDER_DIR` override).
- **3 (in part). The "Play Mission 1" wording.** `m01_trailer60.json` (v5) says "Play now". Still open: `m01_teaser.json` is the old v1 style (Break Escape wordmark, "Play Mission 1") and is obsolete as a template.
- **4. No stills script.** `tools/video/stills/make-stills.mjs` (picks file to 1920x1080 nearest-neighbour PNGs, `captions.json`, `contact.png`).
- **5. Slideshow defaults.** Now "SAFETYNET: Licence to Hack" and "Play now" (the subtitle default is still "Mission 1: First Contact"). Not used by any recipe.
- **7. librosa and no venv path.** `tools/video/edits/music/requirements.txt` and `setup-venv.sh` (`BE_MUSIC_VENV=<scratch path>`), referenced from `analyse_music.py`.
- **8. Scout helpers lost.** `tools/video/scout/dump-lines.rb` (voiced-line pool), `tts-test.mjs` (live `/tts` test with a control line) and `extract-frames.sh` (times or a window to PNGs and a contact sheet).
- **13 (in part). m01-only global.** The take helpers no longer hold any mission gate; `briefing_played` appears only in m01's take scripts and headers. Each new mission still has to find its own opening-cutscene gate (the takes skill says so).
- **14. Take helpers in `takes/m01/`.** Now `tools/video/takes/lib/` (`lib.mjs`, `dlg.mjs`, `walklib.mjs`), imported as `../lib/lib.mjs`.

### Still open

2. **Container setup scripts.** `tools/playtest/new-game.rb` creates its DemoUser with `username:` where the column is `handle`, so it fails on an empty database; `tools/playtest/start-keyless-server.sh` uses `bundle exec rails`, not found here (`bin/rails server` works). The dev database needs the root role and `app:db:prepare` first. (Not changed: `tools/playtest/` was out of scope.)
3. **`m01_teaser.json` is obsolete** (see above). Do not copy it; use `m01_trailer60.json`.
6. **Burned captions are per dialogue shot and per aspect only** (`caption[aspect]`, from `lines[]`). There is no caption overlay for narration over cards, and no "burn everything" switch for social cuts.
9. **The Veo prompts the user used for the m01 pair were not saved** (only the outputs and source URLs in `tools/video/assets/clips/README.md`). `title-launch-clips.md` drafts new ones and asks that the final prompts go into that README.
10. **No real VM footage.** The "Real Hacking" slot uses `real_hacking_kali.mp4` (the old trailer's Kali footage, m01-specific: its Hydra shot names user `derek`). Fix: in-game VM capture (coming).
11. **HaX narration needs fixed ink text.** The TTS endpoint voices only lines the NPC's ink says. Briefings and explainers voiced by HaX therefore need new fixed lines added to ink (or to a narration source) and a paid generation. `hax-briefing.md` and `concept-explainer.md` mark this.
12. **Closed (2026-10-30): export goes to the `cliffe/hacktivity-videos` repo, `master`.** (Drive was blocked: the connector carries files as text, and FTP is blocked by the network policy.)
15. **Not yet run on a second mission.** The generalised tooling was checked on m01 only (lint, one Remotion frame, three stills, the TTS tester, frame extraction); no capture or render ran. A dry run on m02 is the real test: expect to find that mission's opening-cutscene gate and VM shots.
16. **The platform crops of the stills pack (9:16, 1:1) are by hand**, and the stills script does not check spoilers.
