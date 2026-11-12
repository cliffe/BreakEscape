# TTS R3 minors: code review, round 1

Branch `build/tts-r3-minors`, commit 4ed7f6e24, reviewed as `git diff main...build/tts-r3-minors`.

Counts: 1 blocker, 1 major, 3 minor, 5 nit.

## What was checked and holds

- `#ink` and `#tts` behave as before. `InkStoryFile.find` is the old controller lookup moved: same candidate order (storyPath, `.ink.json` form, `.json` form), same compile rule (mtime), same inklecate call (`-jo`), same RuntimeError on a failed compile (a 500 in both actions, as before). `gsub(/\.json$/)` became `sub(/\.json\z/)`, which is the same for any path without a newline. `#tts` still compiles on demand (resolver default `compile: true`).
- Scenario scoping is unchanged: the storyPath still comes from the game's server-side scenario data, never from the request, so the move adds no traversal route.
- TTS keys do not move. No cached clip's metadata text starts with "voice:" (0 of the cache JSON files), no mission or lab ink has a "voice:" line (the only hits are ink comments), and only `scenarios/ink/voice-message-example` and `mixed-message-example` (not used by any scenario) carry voice messages. `tts_mission_lines_test.rb` passes: every batch, chatter, bark and unplaced line resolves to its existing key.
- The voice: change cannot voice a non-scenario line: the transcript returned is the story's own text after the marker, taken only from lines `voiced_as` gives to this speaker.
- Tests run here (worktree, Ruby 2.7.8):
  - `ink_story_file_test.rb` 4 runs, 0 failures, 0.6 s
  - `tts_line_resolver_test.rb` 6 runs, 0 failures, 0.2 s
  - `ink_compiled_staleness_test.rb` 3 runs, 0 failures: 0.9 s warm, 6.5 s wall and 40 s CPU cold (cache moved aside; it rebuilt all 352 marks)
  - `tts_mission_lines_test.rb` 5 runs, 55 assertions, 0 failures, 5.1 s
  - `tts_text_match_test.rb`, `npc_ink_loading_test.rb`, `authorization_test.rb`, `tts_delivery_test.rb`, `scenario_npc_records_test.rb`: 131 runs, 0 failures
  - The tests leave nothing in the tree outside `tmp/`.

## Blocker

### B1. The git commit-order test fails on CI, which checks out one commit

`test/unit/break_escape/ink_compiled_staleness_test.rb:103-130`. `.github/workflows/ci.yml` uses `actions/checkout@v4` with no `fetch-depth`, so CI has a shallow clone of depth 1. `git rev-parse --is-inside-work-tree` succeeds, so the test does not skip; `git log -- scenarios` then shows at most one commit, every path sits at position 0, `out_of_order` is empty, and line 129 (`KNOWN_OUT_OF_ORDER - out_of_order` must be empty) fails with all five entries. The same happens in any tarball-plus-`git init` checkout.

The check also adds nothing the content test misses. If a JSON compiles identically from its .ink (which the content test proves for all 352, the five listed ones included), the commit order is irrelevant; if it does not, the content test already fails. It is brittle too: `git log` orders by commit date, merges list no files without `-m`, and anyone who recommits one of the five (or merges a branch that does) turns the suite red with "remove from KNOWN_OUT_OF_ORDER".

Fix: delete the test at lines 103-130 and `KNOWN_OUT_OF_ORDER` (lines 23-33), and drop the second bullet from the class comment (lines 13-14). If something must stay, `skip` when `git rev-parse --is-shallow-repository` prints `true`, but dropping it is the better call.

## Major

### M1. Eight storyPaths name a `.ink.json` the staleness test never checks, and the game recompiles them on every request once the .ink is newer

`app/services/break_escape/ink_story_file.rb:17-26` and `:60`, with `test/unit/break_escape/ink_compiled_staleness_test.rb:37-44`.

Nine storyPaths end in `.ink.json`. For each, `X.ink.json`, `X.json` and `X.ink` all exist, and in eight the two JSON files differ after parsing:

- `scenarios/test_event_cascade/ink/test_cascade_nurse`, `test_manager`, `test_patient`
- `scenarios/test_npc_patrol_override/ink/test_monitor`, `test_nurse`
- `scenarios/test_npc_visibility/ink/test_dispatcher`, `test_pharmacist`
- `scenarios/test_timer_system/ink/test_timer_monitor`

(`scenarios/test_seating/ink/seat_npc` is the ninth; its two files are equal.)

The game reads `X.ink.json` (the storyPath itself wins in `compiled_json`). The staleness test pairs each .ink with `compiled_json(X.json)`, so it checks `X.json` and passes, while the file the game serves is not what the .ink compiles to. The class comment's claim ("as InkStoryFile finds it") does not hold for these. Worse, when the .ink is newer than `X.ink.json`, `find` compiles to `X.json` (the `compile!` default output) and returns that; the next request finds `X.ink.json` again, still older, and compiles again, on every `#ink` request. These are test scenarios, so no voiced line is affected, but they are the ones the browser test runs load.

Fix, both parts:
1. In `InkStoryFile.find`, compile to the file the lookup will read next time: `json = compile!(ink, json || ink.to_s.sub(/\.ink\z/, '.json'))`.
2. Delete the eight stale `.ink.json` duplicates and point those storyPaths at `X.json` (or recompile into the `.ink.json` and delete the `.json`). Then make the staleness test check every compiled candidate beside an .ink (`X.json` and `X.ink.json` when each exists), or build its pairs from the storyPaths the scenarios name, so a duplicate cannot hide again.

## Minor

### m1. The batch would still voice "voice: X" with the marker; the endpoint now refuses it

`app/services/break_escape/tts_line_extractor.rb:300-345` (`resolve`) with `app/services/break_escape/tts_line_resolver.rb:112-116`. `split_prefix` reads "voice: X" as prefix "voice", no NPC resolves from it, and `CLIENT_STRIP_PREFIX` does not match a lower-case single word, so the extractor gives the host the line text "voice: X". The batch would generate a clip keyed and spoken with the marker, and `found` now refuses that text at the endpoint, while the client asks for "X" (served from the new transcript path, with no batch clip). No mission has such a line today, so nothing breaks now, and `tts_mission_lines_test.rb` would flag the first one. Fix: in `TtsLineExtractor#resolve`, after speaker resolution, strip the marker for a non-narrator line (`text = text.sub(TtsLineResolver::VOICE_MESSAGE, '')`, with the constant made public or moved to `TtsService`), so the batch, the endpoint and phone-chat-ui.js agree on the transcript.

### m2. Host stories now build a second, full index on any miss

`app/services/break_escape/tts_line_resolver.rb:170-176`. Before, a host story only ever used the `placed: false` index. Now every request that misses `spoken_line` and the unplaced lookup also runs the voice-message lookup with the default `placed: true`, which builds and caches a full index of that host story (every host story in a mission, over time). With m1 fixed, the extractor places voice messages as transcripts and `spoken_line` finds them, so the voice-message lookup for a host only needs the lines the walker cannot place. Fix: pass `placed: !host` to that `canonical` call (keeps one index per host story).

### m3. The staleness test errors obscurely when inklecate cannot run

`test/unit/break_escape/ink_compiled_staleness_test.rb:61` and `:83`. A missing `bin/inklecate` raises ENOENT from `Digest::SHA256.file`; an unrunnable one (macOS, ARM, missing libicu) raises inside a worker thread and resurfaces from `join` as Errno::ENOEXEC with no hint. Fix: at the start of the test, `assert File.executable?(InkStoryFile.inklecate)` and run `inklecate` once with no arguments, then `flunk "bin/inklecate does not run here (#{e.class}); it is an x86-64 Linux binary"` on failure. Do not skip: a skipped staleness test hides stale JSON.

## Nit

### n1. Comment names a file that does not exist

`app/services/break_escape/ink_story_file.rb:10` says `ink_story_file_staleness_test.rb`; the file is `ink_compiled_staleness_test.rb`.

### n2. Cache marks grow without limit

`test/unit/break_escape/ink_compiled_staleness_test.rb:21` and `:79`. Every passing digest leaves a file in `tmp/cache/ink_staleness` forever (352 now, plus one per ink edit). Fix: after the run, delete marks whose names are not among this run's digests.

### n3. Fixed thread count

`test/unit/break_escape/ink_compiled_staleness_test.rb:20`. `THREADS = 8` is fine here (32 cores) but oversubscribes a 2-core runner alongside parallel test workers. Fix: `[Etc.nprocessors, 8].min`.

### n4. Includes are read one level deep

`test/unit/break_escape/ink_compiled_staleness_test.rb:46-50`. No included file includes another today (checked all 42 INCLUDE lines), but a nested include's edit would not change the digest and a cached pass would hide it. Fix: follow includes recursively with a seen set.

### n5. Broken storyPaths the lookup quietly returns nil for (pre-existing)

`scenarios/sis01_healthcare/...` names `ink/npc_chair_patient.json`, which has neither JSON nor .ink, and `scenarios/npc-hub-demo-ghost-protocol` names three `story_design/ink/*_hub.json` files that do not exist (and sit outside `scenarios/`, so the staleness glob would not see them if they did). Not introduced by this diff. Fix when convenient: a validator or test check that every storyPath resolves through `InkStoryFile.find(path, compile: false)` or has an .ink beside it.

## Recommendation on the commit-order check and the known-stale list

Drop both (B1). The content comparison is the real guard, it is fast with the cache (under 1 s warm, about 6.5 s cold), and the five listed files already compile to their committed JSON.
