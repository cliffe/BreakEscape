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
- **Storage.** Google Drive is the permanent home. The export is one marked stage at the end of `video-review` (mechanism not settled).
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

## Known gaps a skill had to work around

Found while drafting the skills. None was fixed (no tooling was changed). The orchestrator decides which to fix; each skill states its workaround.

1. **Mission names are hard-coded to m01 in the tooling.** `tools/video/takes/m01/run-take.sh` writes `m01_first_contact` and `video_out/m01/takes`. `render.sh` defaults its output to `video_out/m01/renders` (`BE_RENDER_DIR` overrides). `lint-edit.mjs`, `mix-audio.mjs` and `make-srt.mjs` default to `video_out/m01/takes`, and `render.sh` does not pass `--takes-dir` (only `sync-assets.mjs` honours `BE_TAKES_DIR`). Workaround: copy `run-take.sh` per mission, prefix take ids with the mission and keep trimmed takes in `video_out/m01/takes/`. Fix: take a `--mission` or `BE_MISSION` and pass `--takes-dir` through.
2. **Container setup scripts.** `tools/playtest/new-game.rb` creates its DemoUser with `username:` where the column is `handle`, so it fails on an empty database; `tools/playtest/start-keyless-server.sh` uses `bundle exec rails`, not found here (`bin/rails server` works). The dev database needs the root role and `app:db:prepare` first.
3. **The m01 v4 trailer edit said "Play Mission 1 / Free!"** (the cta phase text). The user's rule is "Play now"; the working copy of `m01_trailer60.json` (v5) already reads "Play now", but check any edit you copy from. The old `m01_teaser.json` is the v1 style (a Break Escape wordmark) and is obsolete as a template.
4. **No stills script.** The m01 stills were cut by hand in a session scratchpad. `video-stills` gives the ffmpeg commands.
5. **`tools/video/slideshow/` defaults break the brand rules** (`TITLE="Break Escape"`, "Play Mission 1 free") and the user dropped the slideshow video. Not used by any recipe.
6. **Burned captions are per dialogue shot and per aspect only** (`caption[aspect]`, from `lines[]`). There is no caption overlay for narration over cards, and no "burn everything" switch for social cuts.
7. **`analyse_music.py` needs librosa**, which is not installed system-wide, and no venv path is recorded. `video-edit` shows a venv recipe.
8. **Scout helpers were scratch scripts.** The line dump, the live `/tts` test and the frame extraction were run from the session scratchpad and lost. `video-scout` and `video-stills` give the commands to re-create them.
9. **The Veo prompts the user used for the m01 pair were not saved** (only the outputs and source URLs in `tools/video/assets/clips/README.md`). `title-launch-clips.md` drafts new ones and asks that the final prompts go into that README.
10. **No real VM footage.** The "Real Hacking" slot uses `real_hacking_kali.mp4` (the old trailer's Kali footage, m01-specific: its Hydra shot names user `derek`). Fix: in-game VM capture (coming).
11. **HaX narration needs fixed ink text.** The TTS endpoint voices only lines the NPC's ink says. Briefings and explainers voiced by HaX therefore need new fixed lines added to ink (or to a narration source) and a paid generation. `hax-briefing.md` and `concept-explainer.md` mark this.
12. **Export to Google Drive has no mechanism yet.** `video-review` Step 6 is a marked stage.
13. **The m01 take scripts use an m01-only global** (`briefing_played`) to stop the opening cutscene. Each mission needs its own gate found in its opening; the takes skill says so.
14. **The take helpers (`lib.mjs`, `dlg.mjs`, `walklib.mjs`) live in `takes/m01/`.** New mission takes import them from there (`../m01/lib.mjs`); a shared folder would be cleaner.
