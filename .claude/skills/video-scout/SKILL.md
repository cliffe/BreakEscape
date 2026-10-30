---
name: video-scout
description: Scouts a SAFETYNET mission for video footage before anything is recorded: finds the shots (set pieces, minigames, NPC rooms), the cheapest entry state for each, and which voiced lines have cached audio (tested with real /tts requests), then writes a scout report with spoiler judgements. First stage of the video family (video-scout, video-takes, video-edit, video-stills, video-review). Trigger when the user asks to "scout a mission for video", "find shots for the trailer", "which lines can we use", "what has cached audio", "plan the trailer footage", "scout m0X", or names a mission and a video recipe in docs/video/recipes/ and nothing has been scouted yet.
---

# Video scout

Find out, before recording, what the mission can give a video: where each shot is, how to reach it cheaply, which spoken lines exist with cached audio, and what must stay off screen. Nothing is recorded or changed. The output is one report that the orchestrator reads and turns into picks.

Part of the video family: **video-scout** → `video-takes` → `video-edit` → `video-review`, with `video-stills` for the stills pack. The recipe for the kind of video (`docs/video/recipes/`) says which slots to scout for. House rules are in `docs/video/GUIDELINES.md`; the history behind them is `docs/video/TRIAL_LOG.md`. Read `AGENTS.md` ("Choosing a model", "Writing a subagent prompt") before tasking agents.

## Who does this

**Haiku** runs the scout (retrieval, line tests, tables). The **orchestrator (Opus)** reads the report, checks the claims that matter, and makes the picks. Haiku must not pick: it lists candidates with the facts the picker needs. In the m01 trial the Haiku scout got 44 of 44 lines right on the first pass, because the brief gave the exact method below.

Brief a scout agent like this: point at this skill, the recipe, and the mission folder; give its own scratch subfolder as a full path (`<scratchpad>/video-scout-<mission>/`, never the scratchpad root); say "don't commit, don't change any repo file except the report"; ask for the report as the final message if its Write is refused (`REPORT.md` and names with "report", "summary", "findings" or "analysis" in `.md` files are refused for subagents; name the file `docs/video/scout/<mission>_scout.md`, or return the text and let the orchestrator save it).

## Inputs

| Input | Where it comes from |
|---|---|
| Mission | `scenarios/<mission>/` (for example `m02_ransomed_trust`) |
| Recipe | `docs/video/recipes/<kind>.md`: its "what each slot needs from the scout" list sets the targets |
| Spoiler rules | `docs/video/GUIDELINES.md` ("Spoilers") plus the mission's own secrets: its PINs, passwords, flags and who the antagonist is, from `scenarios/<mission>/SOLUTION_GUIDE.md` (read for the *answers to keep off screen*, never to copy into the report) |
| Earlier scouts | `docs/video/scout/m01_scout_v2.md` is the model report |

## Output

`docs/video/scout/<mission>_scout.md`, in the shape of `m01_scout_v2.md`:

1. Headline: counts, top picks per speaker, top set pieces.
2. Environment notes (what was started, what was left running).
3. **Part A, voiced lines.** One table per speaker: ID, exact text, ink file:line, knot, conversation path from the NPC's start, cheapest entry state, words, spoken length in seconds, live result.
4. **Part B, set pieces and minigames.** Minigame inventory (where, object ids), then set pieces not yet recorded: room and object id, entry state, "answer on screen?" (yes or no, never copying the value), visual judgement.
5. Rooms with several NPCs visible together (usually none: plan walking shots as one NPC plus the player).
6. Entry-state notes (key and gate notes: which door needs which PIN, which hub choice needs which global).
7. Music: candidate tracks not used by an earlier mission (`docs/video/recipes/README.md`, mission-to-music table), with BPM from `tools/video/edits/music/summary.json` where analysed.
8. "What was not verified" and the restart commands for any server the scout started.

Never copy a code, PIN, password or flag value into the report. Say "yes, a post-it carries a login" and stop.

## Step 1: bring the environment up

A fresh cloud container has no usable database and no server. Every Rails command needs these exports:

```bash
export LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root
```

One-off database setup (this container only; weakening `pg_hba` to `trust` was refused by the safety check and should not be tried):

```bash
pg_ctlcluster 16 main start
# role root with LOGIN CREATEDB (peer auth unchanged), then:
bin/rails app:db:prepare          # about 120 missions
```

Keyless server on :3001 (no `GEMINI_API_KEY`, so no TTS is ever generated and nothing is paid for):

```bash
env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3001 bin/rails server -b 127.0.0.1 -p 3001
```

`tools/playtest/start-keyless-server.sh` is the documented route but uses `bundle exec rails`, which isn't found in this container (`bin/rails server` works). Check with `ss -ltn | grep -E ':300[01]'`. Never touch :3000: it is the user's server. Stop only what you started, by PID.

A fresh game, for the scout:

```bash
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission>
# prints GAME_ID and URL. Pass a file path to rails runner, never an inline script (IndexError: string not matched).
```

On an empty database `new-game.rb` fails creating its DemoUser (`username:` where the column is `handle`, line about 162). Create the demo user by hand once, or fix the helper if the user has approved a tooling change. Say which in the report.

## Step 2: voiced lines (Part A)

**Pool.** The same list the batch audio generator uses (`BreakEscape::TtsLineExtractor`), dumped by a script:

```bash
export LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true BE_DB_USER=root
bin/rails runner tools/video/scout/dump-lines.rb <mission> <scratch>/lines.json [--max-words 12]
# writes lines.json (npc_id, text, words, voice, ink file and path, knot) and lines.tsv, and prints a count per NPC
```

`<mission>` is the scenario folder name (`m02_ransomed_trust`). Every entry is a whole ink line (the endpoint only accepts text the ink says for that NPC, so lines cannot be trimmed). The `path` column gives the ink file and the knot for the report's table; the conversation path from the NPC's start is still read from the ink.

**Filters.** Keep a line only if it is:

- 12 words or fewer and 4.5 s or shorter (shorter is better: 2 to 4 s, with a hook that works out of context);
- spoiler-free: drop anything that names the culprit or implies it by pronoun, carries a code or PIN, gives a casualty figure, or belongs to the ending or debrief (the m01 closing debrief was 260 lines and none were tested);
- reachable: record the conversation path and the cheapest entry state. A line behind a long hub (Kevin's audit answer was about nine choices) is a last resort.

Note, but do not test, lines that are excluded on purpose (Agent HaX phone lines have no cached audio in m01: the briefing lines do; the finale lines are outside the spoiler rule unless the recipe names them).

**Live test, through the real endpoint.** A line "has audio" only if the real `/tts` endpoint returns it. Reading the cache folder or predicting from the text is not a test (it matched in m01, but only the live run is evidence). The tester posts as the client does (game page for the session cookie and CSRF token, then `POST <game>/tts` with `npc_id` and `text`), prints status and duration for each line, and always adds a control line:

```bash
node tools/video/scout/tts-test.mjs --server http://127.0.0.1:3001 --game <game id> --npc <npc id> \
  --text "<exact ink text, stage directions kept>" --text "<another line>"
node tools/video/scout/tts-test.mjs --server http://127.0.0.1:3001 --game <game id> --lines <scratch>/picked.json   # [{"npc_id","text"}], a subset of lines.json
# PLAY<TAB>200<TAB>4.18 s<TAB>sarah_martinez<TAB>Next thing you know ...   (clips are saved under --out, default $BE_VIDEO_SCRATCH)
# CONTROL<TAB>403 ... "control line refused: the check is live"   (exit 1 if the control is accepted)
```

The game id comes from `new-game.rb` above (`GAME_ID=`). Use only a keyless server: it never generates, so a test costs nothing.

| Result | Meaning |
|---|---|
| 200 `audio/mpeg` | cached and playable. Record the ffprobe duration |
| 503 | no cached clip (keyless server tried to generate). Not usable. Expected for lines that were never voiced |
| 403 | the text is not in that NPC's ink: a typo, or a control line. `tts-test.mjs` adds a control line (text that appears in no ink) itself and reports whether it was refused, so you know the check is live |
| 404/400 | wrong npc id or no voice configured |

The cache is keyed on text, voice, style wording, language and model. **A rewritten line has no cached audio.** If the mission's dialogue was edited after audio was generated, expect 503s and say so. Generating new audio is never part of a scout: see "Money" below.

**Money.** New TTS costs money. If the best hook line has no cached audio, list it with its exact text and the line count (a count of lines, not words) as a question for the user. Do not generate. Voice generation, pruning and the style rules live in the `tts-audio` skill, and the orchestrator asks the user each time with a line count. Cached lines are free.

## Step 3: set pieces (Part B)

Ground the table in the scenario and the map, not memory:

- `scenarios/<mission>/scenario.json.erb`: room ids, object ids, `lockType`, which rooms have an NPC (the scout's "no room shows two NPCs" finding held for m01: check each mission), `lighting` (motion-lit dark rooms play well on camera).
- `ruby scripts/lighting_lookup.rb scenarios/<mission>/scenario.json.erb` shows which rooms strike their lights on entry.
- `docs/video/recipes/<kind>.md` lists the slots (title, hook line, drop shot, minigame close-ups, NPC lines, antagonist line, walking shots). Fill each with candidates.

For each candidate give: the entry state as the exact `new-game.rb` flags (`--start-room`, `--unlock`, `--set`, `--give`; `--help` lists them; `--give` cannot supply an item an NPC hands over in conversation, so a lockpick kit means playing the conversation in the take's `setup()`), whether an answer shows on screen, and a visual judgement (what it looks like in 2 s). To judge a take or an earlier render by eye, `tools/video/scout/extract-frames.sh <video> <out-dir> <t1> [t2 ...]` writes PNGs at those times plus a contact sheet (`--window <start> <length> [fps]` takes a run of frames).

Things that bit m01:

- **Post-its and logins on screen.** Two m01 password screens carried a post-it with a real login: usable only cropped or pixelated. Say "yes" in the "answer on screen" column.
- **Desk-phone voicemails** can state a PIN in their subtitle (m01 reception's did). Keep their subtitle off screen; they are also far too long (17 to 28 s).
- **Item and code reveals in notes and safes.** Keypad close-ups are fine. The *contents* of an antagonist's safe or cabinet are usually spoilers.
- **Real tools.** If a scene shows a third-party tool (m01's CyberChef), note its licence; m01 checked and used it.
- **Guard sight cones** exist only in some missions (m01 has none). Note whether the mission has one: it is a trailer beat from a later mission.
- **VM scenes.** A VM launcher or flag lock that needs a SecGen VM cannot run in the container. Mark such shots "needs VM" and list a stand-in. The user's decision (2026-10-30): in-game VM capture is coming; until then the "Real Hacking" slot is a marked placeholder (see `docs/video/recipes/mission-trailer.md`).

Do not play the mission through. Entry states come from the scenario and ink and may be listed as "expected, not played"; the take stage proves them.

## Gates

| Gate | Pass when |
|---|---|
| Lines | every listed line has a live result from `tts-test.mjs`; its control line was refused 403; no line is listed without its path and entry state |
| Spoilers | no value copied into the report; every "answer on screen" cell filled |
| Coverage | each slot in the recipe has at least two candidates, or the report says why not |
| Environment | the report lists what the scout started and either stopped it or says it is still running (the m01 scout stopped the server and Postgres; the takes agent restarted them: say which) |

The orchestrator then checks the picks against the report, reads any line it will rely on in the ink itself, and writes `docs/video/edits/<mission>_<KIND>_PICKS.md` (slot, pick, why, fallback), as `M01_TRAILER60_PICKS.md` does.

## Traps

- Do not stop or restart :3000. A scout that wants it asks the user.
- One `create_session` call was made by the m01 scout that it did not need and the permission check refused it. Scouts do not spawn sessions.
- Do not trust `docs/video/scout/m01_scout_v2.md` line ids for another mission: ids are per report.
- The scout is Haiku. It reports; it does not decide. Opus decides.

## Related

- `video-takes` (next stage), `video-edit`, `video-stills`, `video-review`.
- `tts-audio` for voice generation (needs the user's agreement and a line count).
- `playtest-scenario` for entry states and the `window.__test` bridge.
- `docs/video/recipes/README.md` for which recipe to use.
