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
- **Real hacking footage.** Every mission trailer has a `Real / Hacking` card and console footage (`vm-console-takes`). Until a mission's capture exists use a **marked placeholder** (`placeholder: true`) and leave a slot. Lint `--final` refuses placeholders: a final render needs the user's say-so.
- **Generated clips.** One Veo opening and launch pair per game; the user generates them. The skill prepares prompts and start frames (`title-launch-clips.md`).
- **Platforms.** YouTube, Hacktivity pages, Steam, LinkedIn, Shorts/Reels/TikTok. YouTube, the Hacktivity pages and Steam take 16:9. Shorts, Reels and TikTok take 9:16. LinkedIn takes 1:1 or 16:9 with burned captions (silent autoplay).
- **Spoilers.** Show mechanics, hide answers. No full codes, PINs, passwords or flag values. Keypads show 3 digits that are not the code. Pixelate real answers on screen (post-its, voicemail subtitles, the old-trailer Hydra line). No ending, no choice screens. Casualty figures are allowed when they are the stakes, such as Voltage's "forty-odd" in m04 (owner, 2026-11-23: "Relax it"); never as an outcome, and never a debrief total. The antagonist may be named and shown (m01's Derek, 2026-10-29); only an end twist the mission withholds stays off. Beyond that list, err towards showing: the threat, the villain's menace and confrontation lines are what sell a mission (user, m03 v2, 2026-11-22; `GUIDELINES.md` "Do not over-protect the story").
- **Capture and render.** 30 fps only. Never capture during a render, and never run renders in parallel (memory). `BE_VIDEO_SCRATCH` is deleted by `render.sh`.
- **Review.** A review page (artifact) with the videos and a feedback form that saves, every round, same link, a tab per round. Orchestrator (Opus) does selects and reviews; Sonnet and Haiku do the rest.
- **Storage.** Finals are committed straight to `master` in the `cliffe/hacktivity-videos` repo (user, 2026-10-30); `video-review` Step 6 does the export, only after "ship".
- **Writing.** Plain UK English, no em dashes, no AI-sounding filler.

## Presets, bumpers and fetch-wip

New mission trailers and teasers start from the two shot presets in `tools/video/edits/presets/` (`safetynet-open`, `hacktivity-close`), referenced from the edit list as `{"preset": "<name>", ...overrides}` and resolved by `tools/video/remotion/scripts/load-edit.mjs`. The same two shots are rendered as standalone bumpers (`tools/video/edits/bumpers/`: 6 s opening, 8 s closing, 16:9, 9:16, 1:1, with music and `-silent`) into `video_out/shared/renders/` and `shared/` in hacktivity-videos. `tools/video/fetch-wip.sh <mission>` restores a mission's takes from that repo into `video_out/<mission>/takes/`. Details: video-edit skill.

## Mission-to-music record

One track per mission. Before choosing, read this table; after the edit is final, add the row. The beat grid and windows come from `tools/video/edits/music/analyse_music.py` (analysis files in `tools/video/edits/music/`).

| Mission | Track | Window used | BPM | Where | Alternatives analysed | Notes |
|---|---|---|---|---|---|---|
| m01 First Contact (v13 tried Emerald Trigger from 85.571 s, owner said not right; v14 pick between Midnight Trigger, Emerald Trigger start, Cold Bond Circuit and this, under review 24 Nov) | Noir "Midnight Cipher Chase" (`Noir/Midnight Cipher Chase.mp3`) | 60 s from 109.023 s (a downbeat); the 30 s teaser used 107.02 to 137.03 s, later moved to 109.023 s | 120 (period 0.5 s) | 60 s trailer v4 | Cold Bond Circuit at 53.847 s (86 BPM); Midnight Trigger at 92.994 s; Shadow Code 1 at 114.322 s | lifts at 12, 18, 26, 34 and 52 s; quiet bar at 48 s; strong hits at 52, 54, 56, 58 s |
| m02 Ransomed Trust | Noir "Steel Shadows in E Minor (Remastered)" (`Noir/Steel Shadows in E Minor (Remastered).mp3`) | 60 s from 50.248 s (a downbeat) | 156 (period 0.3846, bar 1.538 s) | 60 s trailer v5 (shipped 2026-11-24) | Shadowline Protocol at 82.317 s (124 BPM); Encrypted Shadows at 105.537 s (99 BPM) | drop at 10.77 s (lights); 4-bar lifts at 16.92/23.08/29.23/35.38/41.54/47.69/53.85 s. Also in m02's own Noir playlist; m10 uses it in game. Picked by analysis, pending the user's ear |
| m03 Ghost in the Machine | CutScene "Shadow Code 1" (`CutScene/Shadow Code 1.mp3`) | 60 s from 51.619 s | 118.65 (period 0.5057 s) | 60 s trailer v3 (shipped 2026-11-24) | Midnight Trigger; Cold Bond Circuit | quiet to 12.1 s, drop at 12.136 s, loud to 44.5 s, lull after; 2 s fade-out |
| m04 Critical Failure | SpyAgro "Shadow Protocol (Remastered)" (`SpyAgro/Shadow Protocol (Remastered).mp3`) | 60 s from 26.638 s, so its strongest hit lands on the Mission card at 12.0 s | see `shadow_protocol_remastered_60.json` | 60 s trailer v3 (shipped 2026-11-24) | Hybrid Attack 1 at 76.317 s; Emerald Trigger at 75.972 s | 2 s fade-out |
| m06 Follow the Money | SpyAgro "Shadow Cipher" (`SpyAgro/Shadow Cipher.mp3`) | 60 s from 116.606 s (a downbeat) | see `shadow_cipher_60.json` | 60 s trailer v2 (shipped 2026-11-24) | Shadow Cipher at 92.61 s (analysis best); Noir Encrypted Shadows at 105.537 s | lift at 12.0 s on the HaX threat; 2 s fade-out |
| m05 Insider Trading | Spy "Midnight Double Agent" | 60 s from 47.992 s | see its analysis file | 60 s trailer v5 (shipped 2026-11-24) | | |
| m07 Architect's Gambit | "Shadow Tide" | 60 s from 0.05 s (its quiet intro) | see its analysis file | 60 s trailer v2 (shipped 2026-11-24) | the drop window at 92.1 s | |
| m08 The Mole | Noir "Shadowline Protocol" | 60 s from 109.406 s | see its analysis file | 60 s trailer v1 (shipped 2026-11-24) | | |
| m09 Digital Archaeology | SpyAgro "Action Dub" (`SpyAgro/Action Dub.mp3`) | 60 s from 0.0 s, 2 s fade-out (no natural end) | 120 (`action_dub_60.json`) | 60 s trailer v1 (in review) | Hybrid Attack 0, Hybrid Attack 2, Shadow Protocol (original) | lift on the Mission card at 10.7 s; Hybrid Attack 1/2 left for m10 |
| m10 Full Disclosure | SpyAgro "Hybrid Attack 1" (`SpyAgro/Hybrid Attack 1.mp3`) | 60 s from 98.599 s (a downbeat), track decays at its end; fade-out 1 s | 140 (`hybrid_attack_1_60.json`) | 60 s trailer v1 (in planning) | Hybrid Attack 2 from 122.4 s; Hybrid Attack 1 from 76.317 s (analysis best) | drop 5.1 s under the hook; lift and strongest hit on the Mission card at 10.28/10.92 s; lift 17.14 s on the mechanic card; hit 34.28 s in `It Goes / at Six` |
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
