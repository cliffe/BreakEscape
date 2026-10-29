# m01 video trial: plan

Status: revised after review R1 (2026-10-29), approved to start. Branch `claude/break-escape-video-creation-wk365q`. Review: `docs/video/reviews/M01_TRIAL_PLAN_R1.md` (outcomes in section 14).

## 1. Goal

Prove a repeatable pipeline that turns Break Escape gameplay into finished videos, using m01 First Contact as the test case. The trial delivers:

1. **A 30 second m01 teaser** in 16:9 at 1080p, with live captured game audio (sound effects and voiced lines), a music bed cut to the beat, and text cards in the house style.
2. **The same teaser reframed** to 9:16 and 1:1.
3. **An m01 screenshot slideshow**: a curated set of 1920x1080 stills, a contact sheet, and a short slideshow MP4 set to music.
4. **Guidelines and lessons** (`docs/video/GUIDELINES.md`, `docs/video/TRIAL_LOG.md`) that the later skill will be built from.

This is the spike stage of the staged plan the user chose. It is not the director-script tool, the cinematic mode or the skill. Those come after, informed by this.

## 2. The user's brief (saved 2026-10-29)

- **Kinds wanted eventually:** whole-game trailer, per-mission trailers, lectures, staff walkthroughs, social clips, devlog. Each kind needs its own guidelines.
- **Audience:** students, prospective students, educators, industry, players.
- **Format:** 1080p; 16:9, 9:16 and 1:1; lengths from 15 s to 10 min.
- **Approach:** the staged recommendation. Fully automated final render. Remotion for compositing. A dev-only cinematic mode is welcome and should later be reused for in-game cutscenes. End state is a skill run per mission.
- **Music:** Noir, SpyAction, SpyAgro or CutScene sets. Cuts on the beat.
- **Voice:** existing voiced NPC lines, on-screen subtitles, a captions file.
- **Spoilers:** show mechanics, hide answers.
- **Must-have shots (across the series):** walking, lights snapping on, portrait dialogue, lockpicking, RFID, dusting, phone chat, OSINT, SIEM, CyberChef, VM / flag station, shredded documents, ransomware display, guards.
- **Cost:** use Haiku or Sonnet wherever possible.

### Follow-up corrections from the user (2026-10-29)

- **Capture the live audio.** The game plays full audio during a playtest, so record it with the video. Don't rebuild it in post.
- **Mid-mission shots:** game sessions already save state. If a saved game is gone, speed-run to the point again (usually short).
- **Style:** pixel-art fonts only. The existing trailers use Press Start 2P on the text screens. Blur and digital-glitch transitions are used only into and out of text cards. Quick-cut montages of gameplay use hard cuts, no transitions.
- **Logo:** keep the "Hacktivity Cyber Security Labs → Hacktivity Games" logo transition; now add the game title, Break Escape, which was not settled for the old trailer.
- **Also wanted:** a screenshot slideshow for each mission.

## 3. Reference: the existing 1:15 trailer

`HacktivityGamesTrailer1` (1920x1080, 60 fps, H.264 + AAC, 75.97 s), downloaded to the session scratchpad and analysed with scene detection and a 1 fps contact sheet.

| Time | Content |
|---|---|
| 0–5 s | Glitch-in → "Hacktivity / Cyber Security Labs" → morphs to "Hacktivity / Games" (pink-magenta logo on dark purple) |
| 5–9 s | Cards "Your Mission" / "Begins NOW" |
| 9–15 s | Agent HaX portrait dialogue, then a horizontal motion-blur streak transition to "Mission: FIRST CONTACT" |
| 15–28 s | Gameplay: top-down rooms, the SIEM world map, ticket lists |
| 28–33 s | "Real Hacking" card, then real VM terminal footage (Kali, scanners) |
| 33–45 s | Phone chat, keypad, rooms, lockpicking |
| 45–50 s | "Choices with Consequences", then portrait dialogue (Kevin Park, Maya Chen) |
| 50–57 s | "Uncover The Mystery", keypad, log terminal |
| 57–66 s | "And Hold Back The Entropy!", Derek Lawson portrait with a slow push-in on his line ("...That's not murder. That's optimisation."); the close-up crops the subtitle bar away |
| 66–76 s | "Play Mission 1 Free", "Play Now! hacktivity.co.uk", logo out |

House style to reproduce:
- Text cards: white Press Start 2P, centred, on a dark navy-to-purple vertical gradient, with a soft blurred, mirrored reflection of the text below it.
- Dialogue shots: the game's own full-screen portrait conversation view, with the game's own subtitle bar, name tag and Continue button. A push-in on the strongest line, ending on a close-up that crops the UI away.
- Hard cuts in montages; glitch or blur only into and out of cards.
- Jazz hits in the music land on the text card changes.

## 4. What the repo and container give us (checked, with R1 corrections)

**Audio**
- `public/break_escape/js/music/music-controller.js:44` creates one `AudioContext`; `main.js:84-92` hands it to Phaser, so music and sound effects share one graph. The context stays suspended until the first trusted click or keydown (`music-controller.js:120-124`).
- TTS plays through an `HTMLAudioElement` routed `MediaElementSource → analyser → voiceGain → masterGain → destination` (`systems/tts-manager.js:324-380`). If routing fails it plays the raw element directly. Both reach the system output, so PulseAudio capture gets either.
- Volumes persist in localStorage: `be_music_vol`, `be_sfx_vol`, `be_voice_vol`, `be_master_vol`, read at init (`music-controller.js:706-724`). A take sets `be_music_vol=0` with `addInitScript` before load: no engine change, no clicking. Use a fresh browser profile per take, because `init()` does cross-tab leader election (`music-controller.js:66-73`).
- **Cached voice lines play without a key.** `GamesController#tts` (`app/controllers/break_escape/games_controller.rb:645-686`) serves a cached clip (current model, then legacy) before generating; with no key and no clip it returns 503 and the line is silent. m01 has 1,356 cached mp3 clips in `tts_cache/m01_first_contact/`. A clip only hits if text and voice config still match, so every chosen line is tested with a real `/tts` request in the scout.

**Display**
- The game picks an integer scale `round(min(w/640, h/480))` (`main.js:224-260`). A 1920x1080 window gives 2x and a 960x540 game view. `zoomStep` in localStorage (`ui/display-settings.js`) steps it to 3x (640x360 view, tighter) per shot if wanted. No non-integer upscales anywhere: the fallback for performance is a 960x540 window at 1x, upscaled 2x with nearest-neighbour in the edit (the same field of view).
- 9:16 and 1:1 crops come from the 960x540 game view (a 9:16 crop is about 304 game pixels wide), so reframes are planned per shot.

**Title screen** (`js/minigames/title-screen/title-screen-minigame.js:17-40`): Hacktivity logo zoom and fade, then the mission display name typed terminal-style ("First Contact"), then a "Continue?" prompt. It does **not** draw "Break Escape", and there is no Break Escape wordmark in `public/break_escape/assets/logos/` (only `hacktivity-logo.svg`, `cybok_logo_white.svg`, `friendface.png`). The typed mission name is a good in-game "Mission: First Contact" shot.

**Assets** (all under `public/break_escape/assets/`): `fonts/PressStart2P-Regular.woff2`, `fonts/PixelifySans-VF.woff2`, `logos/hacktivity-logo.svg`, `music/{Noir,SpyAction,SpyAgro,CutScene}/`.

**Driving the game**
- Test bridge (`js/systems/test-bridge/`), enabled outside production (`app/views/break_escape/games/show.html.erb:248`).
- The playtest harness (`.claude/skills/playtest-scenario/scripts/playtest-session.js`) launches Chromium with only `--window-size` and a fixed viewport (L154-160), no kiosk, autoplay or `viewport:null`, and the skill folder must not be edited. **The trial writes its own launcher** (`tools/video/capture/launch.mjs`) and reuses the bridge through `page.evaluate` the same way. Session URLs get `skip_resume=1` (harness L210-220) to suppress the resume overlay.
- Head-start games (`tools/playtest/new-game.rb`): `--start-room`, `--unlock`, `--carry-npc`, `--set name=value`, `--give ITEM_ID`, `--complete-task TASK_ID`, `--submit-flag`. Prefer these over speed-runs; use saved-game checkpoints only where they can't produce the scene.
- m01 routes are known from `scenarios/m01_first_contact/SOLUTION_GUIDE.md` and the `tools/playtest/m01-*.md` reports.

**Container:** 4 cores, no GPU, 15 GB RAM, about 28 GB free disk. ffmpeg 6.1 with `x11grab` and `pulse`; Xvfb; PulseAudio 16.1 (installed this session); Node 22 with Playwright 1.63 at `/opt/node-tools/node_modules` (`NODE_PATH`); Chromium at `/opt/pw-browsers/chromium-1243`. A 3 s smoke capture (Xvfb display plus a test tone through a PulseAudio null sink) recorded video and audio correctly.

## 5. Capture design

### 5.1 Environment

`tools/video/capture/env-up.sh <n>` and `env-down.sh <n>`:
- Xvfb on display `:<n>` (default 99) at 1920x1080x24, PulseAudio (user mode, `--exit-idle-time=-1`) with a null sink `be_rec_<n>` set as default. If a PulseAudio daemon is already running, reuse it and only load the sink.
- PIDs written to a pidfile in the caller's scratch folder; `env-down.sh` kills only those PIDs. Never `pkill`.
- Captures run **one at a time** per display. Parallel agents each take their own display number and sink.
- Keyless Rails server on :3001 via `tools/playtest/start-keyless-server.sh`. Never touch :3000.

### 5.2 Launch and record

`tools/video/capture/launch.mjs`:
- Playwright `chromium.launch({ headless: false, executablePath: full Chromium, env: { DISPLAY, PULSE_SINK } })` with `--kiosk` (or `--app=<url>`), `--window-position=0,0`, `--window-size=1920,1080`, `--autoplay-policy=no-user-gesture-required`, and `--no-sandbox` if the root check in stage 0 needs it. `viewport: null` so the page is the whole screen.
- A fresh persistent profile per take, with `addInitScript` setting the volume keys (music 0 for trailer takes) and `zoomStep` if the shot asks for it.

`tools/video/capture/record-take.mjs` wraps one take:
1. Open the game, pass the title screen with a trusted click (this resumes the `AudioContext`), and assert `context.state === 'running'`. Fail the take otherwise.
2. **Start slate:** an injected full-screen white div for 3 frames plus a 1 kHz tone from an `OscillatorNode` on the resumed context.
3. Run the take's actions.
4. **End slate**, the same, so drift over the take is measured.
5. Recorder: `ffmpeg -thread_queue_size 1024 -use_wallclock_as_timestamps 1 -f x11grab -framerate 30 -video_size 1920x1080 -i :<n> -thread_queue_size 1024 -f pulse -i be_rec_<n>.monitor -c:v libx264 -crf 14 -preset veryfast -c:a pcm_s16le take.mkv`.
6. `tools/video/capture/check-take.mjs` finds both slates in picture and sound, reports the offset at each end, dropped and duplicated frames, and trims to the slates. Pass: offset under 33 ms at both ends (or a constant offset that gets corrected), under 1% dropped frames.

**30 fps by default.** A clean 30 beats a dropping 60. Stage 0 tries 60 fps on the heaviest scene too and records the result; the rest of the trial uses whichever passes.

**Fallback if live capture fails:** tap `MusicController.masterGain` with a `MediaStreamAudioDestinationNode` and `MediaRecorder` (assert the TTS chain is routed first), record video with Playwright `recordVideo`, align with the slates. Fallback only.

### 5.3 In-game music during takes

Trailer takes set `be_music_vol=0` before load. That also silences music stingers, which is what the teaser wants. Sound effects and voice stay. Slideshow and lecture takes may keep the music.

### 5.4 Driving the takes

- **Deterministic take scripts, not an LLM at the wheel.** One script per take (`tools/video/takes/m01/<shot>.mjs`) sends bridge commands with director pacing: smooth walks, dwell long enough for each voiced line to finish (wait on the bridge's dialogue events, not sleeps), no retries on camera.
- **Entry state per take**, stated in the script header and the shot list: `new` (fresh game), `head-start` (the exact `new-game.rb` command with its flags), or `checkpoint` (a named saved game in `tools/video/checkpoints.json`, plus the speed-run script that recreates it if it's gone). Each take must reproduce its opening state three times in a row during scouting.
- Lights snapping on is a motion-sensor event: the take must walk from a lit room into the dark one.
- **Markers:** each take writes a JSON marker log with take-relative times of actions and bridge events (line start and end with text and speaker, lock opened, lights on, minigame open and close), the player's screen position, and open overlay bounds. The edit uses it for in and out points, audio fades and reframing.
- **Audio check:** the marker log records that voice playback started for every line the shot depends on.

## 6. The m01 teaser: shot list (first draft)

About 30 s at the chosen track's tempo. Final choices follow the scout and the beat grid. "Type" says whether a shot is a card or gameplay; any transition other than a cut needs a card on at least one side (a lint in the edit reader enforces this).

| # | Type | Shot | Source | Approx. | Join into it |
|---|---|---|---|---|---|
| 1 | card | Logo morph: Hacktivity Cyber Security Labs → Hacktivity Games → **Break Escape** (Press Start 2P wordmark) | Remotion, `hacktivity-logo.svg` | 2.5 s | glitch in |
| 2 | gameplay | In-game title screen typing "First Contact" | Take: title screen | 1.5 s | glitch (out of card) |
| 3 | gameplay | Agent HaX briefing, one short voiced line, game's own subtitle bar | Take: opening briefing | 3 s | cut |
| 4 | card | "Your mission begins now" (or similar) | Remotion card | 1.2 s | blur streak (into card) |
| 5–10 | gameplay | Montage on the beat: walk from a lit room into a dark one as the lights snap on; lockpicking; phone chat; keypad (partial entry only); SIEM or log terminal; a guard's sight cone | Takes | 0.8–1.5 s each | glitch out of card into 5, then hard cuts |
| 11 | card | "Real hacking" | Remotion card | 1.2 s | glitch |
| 12 | gameplay | VM launcher / flag station or the strongest terminal-style minigame in m01 | Take | 1.5 s | glitch (out of card) |
| 13 | card | "Hold back the Entropy" | Remotion card | 1.2 s | glitch |
| 14 | gameplay | Derek portrait, his most ominous short voiced line, push-in ending on a close-up that crops the UI | Take | 3.5 s | glitch (out of card) |
| 15 | card | "Play Mission 1 free · hacktivity.co.uk" then Hacktivity Games logo | Remotion | 3 s | glitch |

Known gap: the reference's "Real hacking" beat used real Kali terminal footage. There is no VM in this container, so shot 12 shows the in-game VM launcher or flag station. If it doesn't carry the message, the card is dropped and the montage extended. Real VM footage is a later option (the user records it, or a lab VM is reachable).

**Dialogue subtitles:** the game's own subtitle bar is used on screen; the edit adds no second subtitle layer. The `.srt` captions file is generated from the marker log. If an overlay caption is ever needed (for example a 9:16 crop that loses the game's bar), it uses Press Start 2P or Pixelify Sans.

A Haiku agent lists m01's candidate voiced lines (Agent HaX, Derek, Kevin, Maya) and tests each with a real `/tts` request on the keyless server, recording speaker, text, clip duration and whether it played. The orchestrator picks; any line that names a culprit, a code or the ending is out.

**Spoiler checklist** (each render): no full codes, PINs or passwords; no identity reveal; no ending or choice screens; keypad only partly entered.

## 7. Edit and render (Remotion)

- **Project:** `tools/video/remotion/` with its own `package.json`. Renders use the container's Chromium (`browserExecutable`). Time-boxed: if Remotion setup takes more than a day, fall back to ffmpeg for the trial and log why.
- **Data-driven edit:** `tools/video/edits/m01_teaser.json` holds the music track, beat grid, and each shot (type, take file, in and out points, card text, join, framing per aspect ratio, audio gain). The composition reads it and lints the join rule.
- **Components:** `TextCard` (Press Start 2P, gradient, blurred mirrored reflection; pre-render once per aspect ratio and reuse), `LogoMorph`, `GlitchTransition` (RGB split, slice displacement, noise, 6–10 frames), `BlurStreak`, `PushIn` (nearest-neighbour, ends on a UI-free close-up).
- **Music:** one track, trimmed to length with a clean ending. Beat grid from onset detection (`aubio` or `librosa` in a venv in the scratchpad), checked by ear; fallback is a hand-set BPM and offset. Card changes land on strong hits; montage cuts on beats.
- **Mix:** the music bed plus take audio. The take audio is one stereo stream of sound effects and voice (they can't be split with one sink; accepted). Each shot's take audio gets 5–10 ms fades at its cut points to avoid clicks; montage shots sit around −6 dB under the music; dialogue shots keep voice at full and duck the music 8–10 dB. Loudness normalised to −14 LUFS (ffmpeg `loudnorm` after render).
- **Output:** H.264 MP4, 1080p, at the capture frame rate, AAC 192 kbps, plus the `.srt`.

### 7.1 Reframing to 9:16 and 1:1

- Cards and the logo morph re-laid out per ratio (larger type for 9:16, legible at phone size).
- Gameplay crops per shot from the edit list. The default crop follows the player's logged screen position; minigame and dialogue shots crop to the logged overlay bounds. Where a crop loses the point of a shot, swap the shot in that ratio.

## 8. Screenshot slideshow

- **Stills:** frames pulled from the takes at marked moments (Haiku extracts), plus room renders from existing tools (`tools/playtest/lighting-tour.sh`, `capture.js`, `chat-background-shot.sh`). A Sonnet agent picks 12–20 covering rooms, characters, minigames and a lights-on moment, against the spoiler checklist; the orchestrator signs off.
- **Outputs:** `video_out/m01/stills/*.png` (1920x1080), a contact sheet, and a 45–60 s slideshow MP4 (slow pan and zoom per still, short crossfades, music bed, title and end cards). Crossfades are allowed here because it isn't a montage; flagged for the user on the review page.
- Assumption: "slideshow" means these files. A web slideshow or a deck can be generated from the same stills later.

## 9. Delivery and review

- Rendered media go to `video_out/` (git-ignored). Sources, edit lists, take scripts and docs are committed.
- The orchestrator reviews every render: contact sheets, sync and loudness numbers, the join lint, the spoiler checklist.
- The user gets a private review page (Artifact) with the 16:9 teaser, the 9:16 and 1:1 versions, the slideshow and the stills, uploaded as assets (review encodes under 15 MB each), plus a feedback form. Open items go on the same page: the Break Escape wordmark, the crossfade choice, the Remotion licence.

## 10. Stages, owners and models

The orchestrator (Opus) plans, reviews footage and renders, decides, and writes the log. Everything else runs on Sonnet or Haiku, per the user's cost instruction.

| Stage | Work | Model | Gate to pass |
|---|---|---|---|
| 0. Environment | `env-up.sh`/`env-down.sh`, `launch.mjs`, `record-take.mjs`, `check-take.mjs`; root and `--no-sandbox` check; 30 s smoke take of the heaviest m01 scene (lit multi-room area with NPCs, then a DOM minigame) at 30 and 60 fps | Sonnet | Frame is exactly the page (no browser chrome); audio present; context `running`; slates found at both ends with offset under 33 ms; under 1% drops at the chosen rate |
| 1. Scout | Candidate shots, routes and entry states from m01 docs and reports; voiced lines tested with real `/tts` requests | Haiku | Shot table with routes, entry states and tested lines, each cited |
| 2. Takes | One Sonnet agent per group of related takes; each take reproducible three times; marker logs | Sonnet | Every take passes `check-take`; markers present; voice confirmed |
| 3. Selects | Contact sheets per take; in and out points; edit list | Orchestrator | Edit list complete; join lint and spoiler checklist clean |
| 4. Remotion build | Project, components, edit-list reader, mix, loudness pass | Sonnet | Renders the 16:9 teaser end to end |
| 5. Review rounds | Orchestrator reviews; the same Sonnet builder fixes; at most 3 rounds | Orchestrator + Sonnet | Nothing above minor |
| 6. Reframes | 9:16 and 1:1 | Sonnet | Legible at phone size, nothing important cropped |
| 7. Slideshow | Haiku extracts frames; Sonnet picks and renders | Haiku + Sonnet | 12–20 good stills, no spoilers |
| 8. Write-up | `GUIDELINES.md`, `TRIAL_LOG.md`, review page | Orchestrator | User has the review link |

Stages 0 and 1 run in parallel. Stage 7 runs alongside 4–6. Captures are serial.

**Subagent prompt rules** (AGENTS.md): exact paths and the full session scratchpad path with the agent's own subfolder (`<scratchpad>/video-<role>/`); edit only its own files under `tools/video/` or `docs/video/`; no engine edits and no edits to `.claude/skills/`; never stop the :3000 server; kill only its own PIDs; write long documents section by section with Edit; don't commit; return a change list with evidence. A builder resumed across rounds writes a handover note and is replaced when it passes about 300k tokens.

## 11. Files

```
docs/video/M01_TRIAL_PLAN.md      this plan
docs/video/reviews/               plan reviews
docs/video/TRIAL_LOG.md           decisions, gates, timings, fallbacks
docs/video/GUIDELINES.md          house style and per-kind rules (draft from the trial)
tools/video/capture/              env-up.sh, env-down.sh, launch.mjs, record-take.mjs, check-take.mjs
tools/video/takes/m01/            take scripts and marker logs
tools/video/checkpoints.json      named saved-game checkpoints
tools/video/edits/m01_teaser.json edit decision list
tools/video/remotion/             Remotion project
video_out/                        renders and stills (git-ignored)
```

## 12. Risks

- **Software rendering on 4 cores** may not hold 60 fps at 1080p alongside Rails and the encoder. 30 fps default; then a 960x540 window at 1x with a 2x integer upscale; then frame stepping (approach D) moves forward in the plan.
- **Silent takes:** the context must be `running` before the slate; a 503 on a voice line is caught by the scout and the marker check.
- **Drift:** measured by the two slates; corrected or the take is re-recorded.
- **Remotion licence:** free for individuals and companies of up to three people; larger companies need a company licence. Not yet confirmed by the user; must be settled before any public release. The edit list keeps an ffmpeg port possible.
- **Break Escape wordmark:** none exists. The trial uses Press Start 2P; real logo art is a separate asset decision for the user.
- **Disk:** about 28 GB free; near-lossless 1080p30 is roughly 1 GB a minute. Keep takes short, delete rejects.

## 13. Out of scope for this trial (next stages)

- The director-script tool (generic shot-list format and runner).
- Cinematic mode in the engine (HUD hide, letterbox, camera moves), and its reuse for in-game cutscenes.
- Frame-stepped capture.
- Lectures: Agent HaX briefings with reveal.js slides for m01–m10 field notes, embedded in lab sheets and Hacktivity; per-concept explainers for HacktivityLabSheets.
- The whole-game trailer, staff walkthroughs, devlog.
- The skill.

## 14. Review R1 outcomes

| Id | Severity | Outcome |
|---|---|---|
| F1 | blocker | Fixed: own launcher `launch.mjs` with kiosk, `viewport:null`, autoplay flag (4, 5.2) |
| F2 | blocker | Fixed in part: Node, Playwright and Chromium paths stated (4); pidfiles, per-display sinks, reuse of a running PulseAudio (5.1). Withdrawn in part: the "running daemon from another agent" was the orchestrator's own smoke test, already stopped; PulseAudio was installed by the orchestrator this session |
| F3 | blocker | Fixed: Break Escape is a Press Start 2P wordmark in the logo morph; the title screen is used for the typed mission name; real wordmark art is an open item for the user (4, 6, 9) |
| F4 | major | Fixed: asset paths (4) |
| F5 | major | Fixed: 1,356 clips; scout tests real `/tts` requests (4, 6) |
| F6 | major | Fixed: TTS routing recorded; fallback taps `masterGain` (4, 5.2) |
| F7 | major | Fixed: localStorage volume and zoom keys via `addInitScript`; fresh profile per take (4, 5.3) |
| F8 | major | Fixed: 2x scale and 960x540 view; integer-only fallback; reframes budgeted on the game view (4, 7.1, 12) |
| F9 | major | Fixed: heavy-scene smoke take, 30 fps default, cheaper intermediate, ffmpeg queue flags (5.2, 10) |
| F10 | major | Fixed: slate after the gesture, end slate for drift (5.2) |
| F11 | major | Fixed: entry state per take, head-start flags first, three-run reproducibility, lights walk-in (5.4) |
| F12 | major | Fixed: type column and join lint; game's own subtitles, no second layer; "Real hacking" gap stated (6) |
| F13 | major | Fixed: per-cut fades, gain per shot type, single-stream limit accepted (7) |
| F14 | major | Fixed: one agent per take group, 300k handover, stills picked by Sonnet, full scratchpad path (8, 10) |
| F15 | minor | Fixed: per-agent display and sink, pidfiles, serial captures (5.1) |
| F16 | minor | Fixed: root and `--no-sandbox` check in stage 0 (10) |
| F17 | minor | Fixed: assert context `running` (5.2) |
| F18 | minor | Fixed: `video_out/` added to `.gitignore`; disk budget (12) |
| F19 | minor | Kept Remotion (user's choice), time-boxed, licence before public release (7, 12) |
| F20 | minor | Fixed: join lint; subtitle font stated (6, 7) |
| F21 | minor | Fixed: crossfade flagged for the user (8) |
| F22 | minor | Fixed: logo and title merged into one 2.5 s morph (6) |
| F23 | minor | Fixed: push-in ends on a UI-free close-up (3, 6) |

One review round, not three: this is a spike, the blockers were factual and are checked above, and the user asked for one subagent review.
