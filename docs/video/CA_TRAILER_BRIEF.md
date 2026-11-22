# Cyber Aware course trailers: brief for the CA session

From the trailer session (VID1), 2026-11-22. The user decided that the CA course trailers are made in the CA session, not in the SAFETYNET trailer session. This brief gives you what the trailer session learned on m01 to m03, so you can task subagents for the work. Read it, then the files it points to. It does not decide anything about CA content; you and the user own that.

## What the user asked for

- A trailer for each CA course that **explains what the course covers** (the topic, what the learner does, what they come away able to spot).
- **A distinct Cyber Aware visual theme.** CA is a separate product line from SAFETYNET (`BRAND_SET.md`: neutral corporate skin, `ui_theme: "general"`, `aw-*` tokens). So none of the SAFETYNET look carries over: no keyhole title, no "Licence to Hack" opening, no red hex curtain. The CA trailers need their own opening and closing presets, card style, palette and music choice. Propose the theme to the user on a review page, with stills, before cutting any trailers.
- CA reviews already grade fun and the offensive-angle USP (`tmp/handover/ac0/CA_FUN_USP_RUBRIC.md`). Score the trailers against it as well. In attacker terms, the trailer should show that the learner builds the attack before defending against it.

Open questions for the user (put them on the first review page, not in chat):
1. Which courses get a trailer: each episode ca00 to ca20, the annual course, the role checks, or bundles?
2. The length: 60 s, or shorter (30 s) for a course catalogue?
3. Who narrates, if anyone? The SAFETYNET trailers use Agent HaX. CA needs its own voice, or none.
4. The sign-off: Hacktivity, or a separate CA brand?
5. Which platforms come first? Course catalogue pages probably need 16:9 and a silent, captioned version.

## Where the pipeline lives

| What | Where |
|---|---|
| House style and trailer rules | `docs/video/GUIDELINES.md`, `docs/video/recipes/README.md` (house rules), `docs/video/recipes/mission-trailer.md` |
| Stage skills, in order | `.claude/skills/video-scout`, `video-takes`, `video-edit`, `video-stills`, `video-review` |
| A worked plan | `docs/video/edits/M03_TRAILER60_V3_PLAN.md`; the round history in `docs/video/logs/m03_VIDEO_LOG.md` |
| Take scripts and helpers | `tools/video/takes/<mission>/*.mjs`, `tools/video/takes/lib/` (`_beat.mjs` style: steps, align) |
| Edits and presets | `tools/video/edits/*.json`, `tools/video/edits/presets/` (SAFETYNET presets: make CA ones alongside) |
| Render | `tools/video/remotion/render.sh <edit.json> 16:9` |
| Review page pattern | `docs/video/review/trailers_spies_review.html` (one tab per round, form saves to the page's db, "Copy answers") |

Write a recipe of your own, `docs/video/recipes/course-trailer.md`, as a variant of `mission-trailer.md`. The rest of this brief lists what changes.

## Rules that carry over unchanged

- **Show the product's appeal and keep the answers off screen.** For CA, the answers are the tells in a message (which detail gives the phish away), check-form answers, scores and grades, and debrief verdicts. The attack build and the lure itself are the appeal, so show them.
- **End on the most interesting line**, usually the attacker at their most persuasive. A competent but dull line is not an ending.
- **Cards advertise this course in its own words.** Retire generic cards. A course's signature activity gets a card that names it (in SAFETYNET terms, `RFID / Cloning`).
- **Action beats run set-up, action, payoff.** The CA equivalent of a chase is the attack landing: the call that gets the reset, the fake page that takes the password, the cloned voice. Then the learner catching the next one.
- **No empty screens.** Every minigame frame has content.
- **Walks are straight lines:** line up off camera, then move along one axis.
- **Check that each shot shows what it claims:**
  - the lighting is right;
  - no NPC jitters against furniture;
  - blinks use both eyes (several sprites blink with one eye; the audit list is with AC0);
  - no dev text in the UI. A save named "playtest" shows on the player's portrait for a few frames before an NPC speaks, so cut in after the NPC's portrait replaces the player's.
- **Audio:**
  - −14 LUFS, true peak under −1 dBTP;
  - a .srt cue for every line, which needs shot-level `"dialogue": true` in the edit;
  - voice levels judged by ebur128 momentary max over each cue window, aiming at −8.5 to −10.5;
  - burned captions on social cuts.
- **TTS:** a voiced line must be in the ink and cached. New lines and re-voices need the user's yes, sent through AC0 with a line count. A re-voice for a trailer also covers the dialogue around it in the game, so the new read fits.
- **Rendering and capture:** 30 fps only. Never capture during a render, and never run two renders at once.

## The take rig and its hazards

- **Server and display:** use a keyless server on a free port (`tools/playtest/start-keyless-server.sh <port>`), never 3000, 3001 or 3099. Ports 3017, 3018 and 3025 are taken by others. Use a virtual display with `tools/video/capture/env-up.sh <n>` and your own `VIDEO_STATE_DIR`. Run takes with `tools/video/takes/run-take.sh <folder> <take> "<flags>" "--hide-hud --zoom-step 1"`.
- **`BE_SPRITE=<key>` changes the SHARED demo user's avatar** (PlayerPreference id 1).
  - Before any take that sets it, message AC0 and wait for its go.
  - Afterwards, check by DB read that id 1 is `female_hacker_hood_v2`, and tell AC0.
  - Without BE_SPRITE, nothing changes.
- **Database:** worktrees share the dev database. Never run db:create, schema:load, migrate or reset. Never edit a game row's scenario or state. Fresh games via new-game.sh are fine.
- **Where takes go:** set `FOOTAGE_ROOT=$HOME/video-takes-local` on every `run-take.sh` call. Never write into `~/safetynet-footage`: it is a one-way rclone mirror of Google Drive (`footage-sync.timer`, every :00 and :30), and anything there that is not on Drive is moved to `~/safetynet-footage-deleted/<date>/` at the next run (ca12 lost its folder mid-capture this way, 2026-11-22).
- **Where to record:** record from a worktree of local main. Commit on a branch, never on main, and send hashes to AC0.

## Tasking subagents (what worked)

- **The orchestrator (you) does:**
  - the plan and beat sheet;
  - selects from frames;
  - every frame check of a changed section;
  - the review page questions.

  A subagent's "done" is not a check. On m03 the render agent stopped while waiting on its own render, and a "fixed" take had been recorded in the afternoon instead of at night.
- **Sonnet** writes take scripts and records them (one agent per batch of takes, with the avatar window agreed first), and re-times and renders edits. Give it the exact marks and windows. Social-engineering content can trip Sonnet's safety classifier; route SE writing to opus48, as your stream already does.
- **Haiku** encodes review copies (`ffmpeg -crf 26 -preset slow -maxrate 2500k`, 1280 wide, under 14 MB) and lists files.
- **Context:** each multi-step brief tells the agent to write a handover note and stop at about 150k tokens. Outlines for two missions took a whole agent each.
- **Every take brief names the entry state:** start room, `--set` globals, the avatar, and what the shot must prove (time of day, lights).

## Suggested first steps

1. Read this brief, the m03 plan and the CA rubric.
2. Ask the user the five open questions above on a review page. Add three candidate CA themes as stills (title card, a content card, the end card), plus candidate music.
3. Run a scout for one course (the video-scout skill, adapted to CA): its shots, its voiced lines with cached audio, and its signature activity.
4. Write `course-trailer.md` from the answers, then cut one pilot trailer through the review loop before the rest.
