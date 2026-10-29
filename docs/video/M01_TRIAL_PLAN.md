# m01 video trial: plan

Status: draft for review (2026-10-29). Branch `claude/break-escape-video-creation-wk365q`.

## 1. Goal

Prove a repeatable pipeline that turns Break Escape gameplay into finished videos, using m01 First Contact as the test case. The trial delivers:

1. **A 30 second m01 teaser** in 16:9 at 1080p, with live game audio (sound effects and voiced lines), a music bed cut to the beat, and text cards in the house style.
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

Downloaded to the session scratchpad and analysed (scene detection plus a 1 fps contact sheet). What it does, in order:

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
| 57–66 s | "And Hold Back The Entropy!", Derek Lawson portrait with a slow push-in on his line ("...That's not murder. That's optimisation.") |
| 66–76 s | "Play Mission 1 Free", "Play Now! hacktivity.co.uk", logo out |

House style to reproduce:
- Text cards: white Press Start 2P, centred, on a dark navy-to-purple vertical gradient, with a soft blurred reflection of the text below it.
- Dialogue shots: the full-screen portrait conversation view with subtitles at the bottom; a push-in (slow zoom) on the strongest line.
- Hard cuts in montages; glitch or blur only into and out of cards.
- Jazz hits in the music land on the text card changes.

The new trailers update all of this to the renamed game and the current art and UI, and add the Break Escape title after the Hacktivity Games logo.

## 4. What the repo gives us (checked)

- **Audio graph.** `music/music-controller.js:44` creates one `AudioContext`; `main.js:84-88` hands it to Phaser, so music and sound effects share one graph. TTS plays through an `HTMLAudioElement` routed into a Web Audio chain (`systems/tts-manager.js`, "MediaElement → [FX] → analyser → voiceGain").
- **Cached voice lines play without a key.** `GamesController#tts` (`app/controllers/break_escape/games_controller.rb` ~L640) serves a cached clip before trying to generate, so the keyless server on :3001 plays m01's 1,948 cached clips (`tts_cache/m01_first_contact/`).
- **Test bridge** (`js/systems/test-bridge/`): drives the game with synthetic input; enabled outside production (`app/views/break_escape/games/show.html.erb:248`).
- **Playtest harness** (`.claude/skills/playtest-scenario/scripts/playtest-session.js`): launches Chromium via Playwright (L156) and exposes commands (move, interact, dialogue, minigames, screenshot).
- **Head-start options** (`tools/playtest/new-game.rb`): `--start-room`, `--carry-npc`, `--unlock` create a game that begins mid-mission. Saved games keep their state server-side, so a game id reached once can be reloaded for further takes.
- **Fonts:** `assets/fonts/PressStart2P-Regular.woff2`, `PixelifySans-VF.woff2`. **Logo:** `assets/logos/hacktivity-logo.svg`. **Title screen:** `js/minigames/title-screen/` renders the Break Escape title in game.
- **Music:** `assets/music/{Noir,SpyAction,SpyAgro,CutScene}/`.
- **Tools in the container:** ffmpeg 6.1, Xvfb, Node 22, Playwright Chromium. PulseAudio is not installed but is available from apt (`pulseaudio 1:16.1`, noble-updates).
- **m01 prior runs:** many playtest reports and traces in `tools/playtest/` (`m01-*.md`) and `scenarios/m01_first_contact/SOLUTION_GUIDE.md`, so routes to every set piece are known.

## 5. Capture design

### 5.1 Primary: headed Chromium on a virtual display, recorded with ffmpeg

1. Start `Xvfb :99 -screen 0 1920x1080x24`.
2. Start PulseAudio in user mode with a null sink (`pactl load-module module-null-sink sink_name=be_rec`), set as the default sink.
3. Launch Chromium through Playwright with `headless: false`, `DISPLAY=:99`, `PULSE_SINK=be_rec`, a 1920x1080 window in kiosk/app mode (no browser chrome), and `--autoplay-policy=no-user-gesture-required`.
4. Record one take with `ffmpeg -f x11grab -framerate 60 -video_size 1920x1080 -i :99 -f pulse -i be_rec.monitor` to a lossless or near-lossless intermediate (e.g. `libx264 -crf 12 -preset ultrafast`, audio PCM in MKV).

This captures exactly what a player sees and hears: the Phaser canvas, the DOM minigames, the dialogue overlays, music, sound effects and voiced lines, all on one clock.

**Sync check:** every take starts with a slate. The take script flashes a white frame and plays a short beep through the page's own `AudioContext`; a checker finds both in the recording and reports the offset. Pass: under 1 frame at 30 fps (33 ms).

**Frame-rate check:** ffmpeg's `dup`/`drop` counters plus a `mpdecimate` pass. Pass: fewer than 1% dropped frames over a take. If software GL in Xvfb can't hold 60 fps, try in order: record at 30 fps; render the game at 1280x720 and upscale with nearest-neighbour; Chromium flags for SwiftShader/ANGLE. Record the result in the log.

### 5.2 Fallback if PulseAudio or Xvfb capture fails

Tap audio inside the page: add a `MediaStreamAudioDestinationNode` on the shared `AudioContext` alongside the existing destination (the TTS chain must be confirmed to feed the same context first), record it with `MediaRecorder`, and record video with Playwright's `recordVideo`. Align the two with the slate. This is a fallback only: it's lower video quality, and audio that bypasses the shared context would be missed.

### 5.3 In-game music during takes

The trailer has its own continuous music bed, so the game's music must be silent in takes while sound effects and voice stay. Use the game's own music volume setting (music widget / player preferences). If there is no persistent setting a take script can use without engine changes, mute music via the test bridge's input path (open the music widget, set volume) at take start. Takes for the screenshot slideshow and for lectures may keep the game music.

### 5.4 Driving the takes

- **Deterministic take scripts, not an LLM at the wheel.** Each take is a short Node script that sends harness commands (move, interact, dialogue advance, minigame steps) with director pacing: dwell times long enough for a voiced line to finish, smooth walks, no retries on camera. A scout run first proves each route.
- **Markers:** the script writes a JSON marker log with the recording-relative time of each action and bridge event ("line 3 starts", "lock opens", "lights on"). The edit uses these to place in and out points.
- **Starting state:** use `new-game.rb --start-room/--unlock` for set pieces that don't depend on earlier progress. For ones that do, speed-run once to the point with the harness, save the game id as a named checkpoint in `tools/video/checkpoints.json`, and reload it per take. If a checkpoint has been cleared, rerun its speed-run script.
- **Server:** the keyless server on :3001 only (`tools/playtest/start-keyless-server.sh`). Never touch :3000.

## 6. The m01 teaser: shot list (first draft)

Target 30 s at about 100–120 BPM. Final choices depend on the scout run and the beat grid. No answers on screen: no full codes, passwords or the identity reveal; keypad digits can show only partly entered.

| # | Shot | Source | Approx. length | Transition in |
|---|---|---|---|---|
| 1 | Glitch-in: Hacktivity Cyber Security Labs → Hacktivity Games | Remotion, `hacktivity-logo.svg` | 2.5 s | glitch |
| 2 | Break Escape title | Captured title screen, or a Press Start 2P card if the capture doesn't read well | 2 s | glitch |
| 3 | Card: "Mission: First Contact" | Remotion card | 1.5 s | blur streak |
| 4 | Agent HaX briefing line (one short voiced line), subtitles | Take: opening briefing | 3 s | glitch out of card |
| 5–10 | Montage on the beat: agent walking into a dark room as the lights snap on; lockpicking; phone chat; keypad (partial entry); SIEM / log terminal; a guard's sight cone | Takes | 0.8–1.5 s each | hard cuts |
| 11 | Card: "Real Hacking" or similar | Remotion card | 1.2 s | glitch |
| 12 | VM launcher / flag station | Take | 1.5 s | hard cut |
| 13 | Derek portrait, push-in, his most ominous short voiced line | Take | 3.5 s | glitch out of card |
| 14 | Card: "Play Mission 1 Free" then "hacktivity.co.uk" | Remotion card | 3 s | glitch |
| 15 | Logo out | Remotion | 1.5 s | blur |

A Haiku agent lists m01's candidate voiced lines (Agent HaX, Derek, Kevin, Maya) that have cached clips, with speaker, text and clip duration, so the lines in shots 4 and 13 can be chosen. The orchestrator picks; any line that names a culprit, a code or the ending is out.

## 7. Edit and render (Remotion)

- **Project:** `tools/video/remotion/` with its own `package.json`, so the game's dependencies are untouched. Remotion renders with the container's Chromium (`browserExecutable: /opt/pw-browsers/...`).
- **Data-driven edit:** an edit decision list (`tools/video/edits/m01_teaser.json`) holds the music track, beat grid, and each shot (take file, in point, out point, card text, transition, framing for each aspect ratio). The composition reads it, so the later director-script tool and skill can generate it.
- **Components:**
  - `TextCard`: Press Start 2P, gradient background, blurred reflection, matching the reference.
  - `LogoMorph`: Hacktivity Cyber Security Labs → Games, then the Break Escape title.
  - `GlitchTransition`: RGB split, slice displacement and noise, 6–10 frames, only next to cards.
  - `BlurStreak`: horizontal motion blur, for the card-to-game moments the reference uses.
  - `PushIn`: slow zoom on a dialogue shot, nearest-neighbour scaling to keep pixels crisp.
  - `Subtitles`: from the marker log's line text, also exported as an `.srt` captions file.
- **Music:** one track from the chosen sets, trimmed to length with a clean ending. Beat grid from onset detection (`aubio` or `librosa` via pip, in a venv under the scratchpad), checked by ear against the reference style; fallback is a hand-set BPM and offset. Card changes land on strong hits; montage cuts land on beats.
- **Mix:** music bed; take audio (sound effects and voice) on its own track, ducked music under voiced lines (−8 to −10 dB), loudness normalised to −14 LUFS for online delivery (ffmpeg `loudnorm` pass after render).
- **Pixel crispness:** every scale uses nearest-neighbour (`image-rendering: pixelated`); push-ins use integer or near-integer steps where it's visible.
- **Output:** H.264 MP4, 1080p, 30 or 60 fps (whichever the capture holds cleanly), AAC 192 kbps.

### 7.1 Reframing to 9:16 and 1:1

- Text cards and logo: re-laid out per aspect ratio (larger type for 9:16, legible at phone size).
- Gameplay: crop windows per shot from the edit list. The marker log records the player's screen position from the bridge, so a default crop follows the player; minigame and dialogue shots crop to the overlay's bounds (recorded from the DOM at take time). Where a crop loses the point of a shot, swap the shot for 9:16.

## 8. Screenshot slideshow

- **Stills:** frames pulled from the takes at marked moments, plus room renders from the existing tools (`tools/playtest/lighting-tour.sh`, `capture.js`, `chat-background-shot.sh`). Aim for 12–20 stills covering rooms, characters, minigames and a lights-on moment, with no answers visible.
- **Outputs:** `video_out/m01/stills/*.png` (1920x1080), a contact sheet, and a 45–60 s slideshow MP4 (slow pan and zoom on each still, crossfades allowed here because it's not a montage, music bed, title and end cards).
- Assumption: "slideshow" means these files. A web slideshow or a Slides deck can be generated from the same stills later if wanted.

## 9. Delivery and review

- Rendered media go to `video_out/` (git-ignored; videos are too large for the repo). Sources, edit lists, take scripts and docs are committed.
- The orchestrator reviews renders itself: contact sheets of every render, a check of sync and loudness numbers, and the no-spoilers checklist.
- The user gets a private review page (Artifact) with the 16:9 teaser, the 9:16 and 1:1 versions, the slideshow, and the stills gallery uploaded as assets (each file under the 15 MB asset limit; encode review copies to fit), plus a feedback form.

## 10. Stages, owners and models

The orchestrator (Opus) plans, reviews footage and renders, decides, and writes the log. Everything else runs on Sonnet or Haiku, per the user's cost instruction.

| Stage | Work | Model | Gate to pass |
|---|---|---|---|
| 0. Environment | Install PulseAudio; script `tools/video/capture/env-up.sh` / `env-down.sh` (Xvfb, Pulse, null sink); 10 s smoke take of the title screen with music | Sonnet | Video and audio in the file, sync under 33 ms, under 1% drops (or a chosen fallback recorded in the log) |
| 1. Scout | List candidate shots and routes from m01 reports and the solution guide; list voiced lines with cached clips and durations | Haiku | Shot list with routes and lines, each cited |
| 2. Take scripts | `tools/video/takes/m01/*.mjs`, checkpoints, marker logs; record raw takes | Sonnet | Every take records cleanly; marker logs present |
| 3. Selects | Contact sheets per take; choose in and out points; fill the edit list | Orchestrator | Edit list complete, spoiler checklist clean |
| 4. Remotion build | Project, components, edit-list reader, mix, loudness pass | Sonnet | Renders the 16:9 teaser end to end |
| 5. Review rounds | Orchestrator reviews the render; Sonnet fixes; at most 3 rounds | Orchestrator + Sonnet | Nothing above minor |
| 6. Reframes | 9:16 and 1:1 | Sonnet | Legible at phone size, nothing important cropped |
| 7. Slideshow | Stills, contact sheet, slideshow MP4 | Haiku (stills), Sonnet (render) | 12–20 good stills, no spoilers |
| 8. Write-up | `GUIDELINES.md` (house style, per-kind rules), `TRIAL_LOG.md` (what worked, costs, timings, fallbacks), review page for the user | Orchestrator | User has the review link |

Stages 1 and 0 can run in parallel. Stage 7 can run alongside 4–6.

Subagent rules: each gets its own scratch folder under the session scratchpad (`video-<role>/`), the exact paths it needs, edits only its own files under `tools/video/` or `docs/video/`, no engine edits in this trial, never stops the :3000 server, kills only its own processes by PID, and doesn't commit.

## 11. Files

```
docs/video/M01_TRIAL_PLAN.md      this plan
docs/video/TRIAL_LOG.md           decisions, gates, timings, fallbacks
docs/video/GUIDELINES.md          house style and per-kind rules (draft from the trial)
tools/video/capture/              env-up.sh, env-down.sh, record-take.mjs, slate + sync checker
tools/video/takes/m01/            take scripts and marker logs
tools/video/checkpoints.json      named saved-game checkpoints
tools/video/edits/m01_teaser.json edit decision list
tools/video/remotion/             Remotion project
video_out/                        renders and stills (git-ignored)
```

## 12. Risks

- **Software rendering in Xvfb** may not hold 60 fps at 1080p. Mitigation in 5.1. If nothing holds, deterministic frame stepping (approach D) moves forward in the plan.
- **Autoplay and the AudioContext:** browsers suspend audio until a gesture. The take script's first real click handles it, plus the autoplay flag.
- **Voice line timing:** lines must play fully before the script moves on. Use the bridge's dialogue events, not fixed sleeps.
- **Spoilers:** a checklist per render (no full codes or passwords, no identity reveal, no ending choice screens).
- **Remotion licence:** Remotion is free for individuals and companies of up to three people; larger companies need a company licence. Not yet confirmed by the user. The trial keeps the composition thin so it could be ported to ffmpeg if needed. Logged as a pending decision.
- **Disk:** lossless takes are large. Keep takes short, delete rejected ones, keep intermediates in the scratchpad or `video_out/`.

## 13. Out of scope for this trial (next stages)

- The director-script tool (generic shot-list format and runner).
- Cinematic mode in the engine (HUD hide, letterbox, camera moves), and its reuse for in-game cutscenes.
- Frame-stepped capture.
- Lectures: Agent HaX briefings with reveal.js slides for m01–m10 field notes, embedded in lab sheets and Hacktivity; per-concept explainers for HacktivityLabSheets.
- The whole-game trailer, staff walkthroughs, devlog.
- The skill.
