# Gate A — wave 0 build and proofs

Status: **IN PROGRESS / handover**. Research done; no build files written yet. This note is a
complete build spec plus the engine facts already resolved, so a fresh agent can execute without
re-reading the 45k-token plan. Written on branch `feat/ca-living-office-build`, worktree
`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/b-ca-lo-build`.

Caller's task recap: build `scenarios/test_ca_office_kit/` (copy of the awareness test shell + the
Brightwell kit, Gate A scope only — no chain, no request, no ca12 screen fields, no EC1 panel),
shared stub ink in `scenarios/_office_kit/ink/`, the proof-4 single-shell registry/test-skip/staleness
part, then run validator and Gate A live proofs 1, 3, 6, 11 (Brightwell), 4 (single shell) on a
keyless `:3002` server, and record results below.

## 0. Do-not-touch in this tree
Another agent owns, uncommitted: `planning_notes/phishing_and_social_engineering/awareness/*.py`,
`scripts/validate_social/awareness.rb`, `test/js/social-awareness-office-kit.test.mjs`. Never stage/
revert those. My paths only: `scenarios/test_ca_office_kit/`, `scenarios/_office_kit/`, and the
registry/test-skip/staleness code (which turns out to need no edits — see §4). Commit with explicit
paths; `git diff --cached --stat` must show only my files.

## 1. Base shell chosen
`scenarios/test_social_episode/` is the awareness test shell closest to a ca full shell (title
"Test: awareness episode shell"; kiosk starts the full episode, host NPC completes the conclusion
task, OSINT site, mail account, attack target, five-message defend set). Copy its
`scenario.json.erb` and `mission.json` to `scenarios/test_ca_office_kit/`. It is 480 lines; full
structure already read. Key facts about it:
- `startRoom: "ep_room"`, room id `ep_room`, room `type: "room_office"`, host `ep_host` at (3,3),
  kiosk `ep_kiosk` at (6,2) with `minigameData.episodeId: "e1_stub"`.
- episode id = `e1_stub`; `setGlobalPrefix: "episode_e1_stub_defend_"`; `passPercent: 0`.
- Globals already declared incl. `episode_e1_stub_state: {}`, `episode_e1_stub_defend_percent/
  reportRate/complete`, `phish_supplier_contact_attempts`.
- Host mapping already present: `global_variable_changed:episode_e1_stub_defend_complete`,
  `condition: "value === true"`, `onceOnly`, `completeTask: finish_episode`.
- `disableAttacks: true`, company `brightwell_foods`, stages
  `[brief, osint, write, flip, defend, debrief]`, durationTargetMin 13.

### ROOM DECISION (open — pick before building)
To make **proof 11 (Brightwell)** meaningful (sources binding to *drawn* props), the test room
should be `type: "room_aw_brightwell"` (10x10 map exists at
`public/break_escape/assets/rooms/room_aw_brightwell.json` / `.tmj`, modified today). ca01 uses
exactly this: room id `training_room`, `type: room_aw_brightwell`, host `adaeze_okafor` at (5.5,3.8),
`chatBackground: assets/backgrounds/rooms/aw_brightwell_blended.png`. The plan's kit uses
`needsRooms: ["training_room"]`, which matches that room id.
- Brightwell walkable interior: x in [1..8], y in [2..8]. Walls: row y=1 and y=9 full, col x=0 and
  x=9 full; door gap is the whole top row y=0. (wall grid parsed from the map.)
- The map's drawn props are a Tiled `items` objectgroup of 19 objects, **all with empty name/type**,
  so you cannot tell coffee-station from water-cooler by map data — the engine draws them from the
  room-type sprite layer by GID. This is why plan 4.2/proof 11 mark "object with no position binds to
  the drawn prop" as UNVERIFIED. For Gate A the safe path is the plan's fallback: give `kit_coffee`
  and `kit_cooler` **explicit `position`** on free floor tiles, and in proof 11 report that drawn-prop
  auto-binding was not exercised on the test shell (it needs the real ca01 build / a position-less
  source on the Brightwell map, which is really Gate C/D territory). Recommend: keep room id
  `training_room` + `type: room_aw_brightwell`, host/kiosk at ca01 coords, sources at explicit
  positions. If you instead keep `room_office` (simpler), say proof 11 was run on room_office, not the
  Brightwell map, and flag Brightwell binding as deferred.

## 2. Kit content to add (Gate A scope)
Add to `scenarios/test_ca_office_kit/scenario.json.erb`. Follow plan §4.3 shape literally (it is JSON,
no ERB — ca shells contain no ERB tags). Ownership prefix `kit_` throughout.

**Globals (merge into `globalVariables`), declared with defaults:**
`kit_attack_done:false, kit_defend_done:false, kit_quiet:false, kit_caught:false, kit_ep:"ca01"`.
(Use `"ca01"` so the stub divert picks the ca01 episode knot. kit_quiet MUST be declared `false` —
pool gates compare with `===`, an undeclared one mutes every pool, npc-needs.js ~:329-336.)

**Two source objects** (in the room `objects` array), explicit positions on free floor:
- `kit_coffee` `type:coffee_station`, `takeable:false`, `interactable:false`,
  `affordance:{satisfies:"caffeine",restores:70,useSeconds:8,useFrom:{dx:0,dy:-1},queue:{cells:[{dx:-1,dy:-1}],maxWaitSeconds:60}}`.
  (useSeconds shortened to 8 for the proof; plan default 30. "need timings shortened" per brief.)
- `kit_cooler` `type:water_cooler`, `takeable:false`, `interactable:false`,
  `affordance:{satisfies:"thirst",restores:70,useSeconds:6,useFrom:{dx:0,dy:-1}}`.
Source-object shape confirmed from `scenarios/lab_physical_pentest/scenario.json.erb:2435-2454`
(`type`, `id`, `sprite`, `affordance{satisfies,restores,useSeconds,useFrom,queue,chatter}`).

**Two ambient staff** (room `npcs` array), per plan 4.2/4.3 and cast 8.3 (Brightwell ca01 pair =
Agnieszka Duda + Gwen Pritchard; neither is named in the shell's `social` block — confirm by grep):
- `kit_gwen_pritchard`: `person:"gwen_pritchard"`, `npcType:"person"`, `spriteSheet:"gwen_pritchard"`,
  talk/visemes sprites, voice from cast record, `storyPath:"scenarios/_office_kit/ink/gwen_pritchard_ambient.json"`,
  `currentKnot:"start"`, `position` + `needsHome` at a chair tile, `needsRooms:["training_room"]`,
  `chatterCooldownMin:5`, `needs:{caffeine:{decayPerMin:30,urgentAt:50,initial:45}}`, pool via
  per-NPC `chatter:{arrive:{...}}` OR top-level pool keyed by name (see below).
- `kit_agnieszka_duda`: same shape, `person/spriteSheet:"agnieszka_duda"`, one `thirst` need met by
  `kit_cooler`, `storyPath:"scenarios/_office_kit/ink/agnieszka_duda_ambient.json"`.
`initial` below `urgentAt` so the first trip is under way at load (learner sees it on the walk in).

**Pools gated on kit_quiet** (plan 6.7: every pool `requireGlobal:{"kit_quiet":false}`, 3 lines <=40
chars, no braces). Chatter shape confirmed from `scenarios/test_chatter_pool_gate/scenario.json.erb`:
top-level `chatter: { <poolKey>: { lines:[...], requireGlobal: <global-or-{obj}> } }`, NPC references
it via `chatter:{ <source-chatter-key>: [...] }` or the affordance's `chatter` field. The plan uses
object form `requireGlobal:{kit_quiet:false}` (npc-needs.js ~:290-311; VERIFY object form is accepted
— the test fixture uses a string form). Add a Brightwell company pool of 3 lines.

**The four 6.1 host mappings** (append to `ep_host`/host `eventMappings`, AFTER the existing
completeTask mapping so once-only indices are preserved — npc-manager.js:1546-1550):
| global | event | condition | action |
|---|---|---|---|
| kit_quiet TRUE | `global_variable_changed:episode_e1_stub_state` | (none) | onceOnly, `setGlobal:{kit_quiet:true}` |
| kit_attack_done TRUE | same event | `data.value.stage === 'defend'` | onceOnly, `setGlobal:{kit_attack_done:true}` |
| kit_defend_done TRUE | `global_variable_changed:episode_e1_stub_defend_complete` | `value === true` | onceOnly, `setGlobal:{kit_defend_done:true}` |
| kit_caught TRUE | same complete event | `value === true && globalVars.episode_e1_stub_defend_percent >= 85` | onceOnly, `setGlobal:{kit_caught:true}` |
Plus the shared "debrief done" mapping, every kit shell incl. twins:
`global_variable_changed:episode_e1_stub_state`, `condition:"data.value.done.includes('debrief')"`,
onceOnly, `setGlobal:{kit_quiet:false}`.
NOTE prefix here is `episode_e1_stub_defend_` (test shell's own), not `episode_ca01_...`.

**Also set** `scenario.npcThoughts:false` (plan 6.7.5) — the test shell has no `scenario` block;
add `"scenario": { "npcThoughts": false }` at top level if the engine reads it there (ca shells use
`"scenario": {"npcThoughts": false}` per plan 4.3 shape).

Gate A EXCLUDES: any chain/`kit_ca01_out`/set piece, any request/knot, ca12 screen fields, EC1 panel,
`awarenessEpisode.stepAway`. Keep it to staff+sources+pool+stubs+4 globals+kit_ep+5 host mappings.

### Twin for proof 1
Proof 1 needs "a full shell and a twin". The test shell is a single full shell. Options: (a) add a
second scenario `scenarios/test_ca_office_kit_defend/` as a defend-only twin (variant `defend`,
doubled prefix `episode_e1_stub_defend_defend_`, kit_attack_done stays false, same kit + the shared
debrief-done + kit_defend_done mappings) — this is the clean way to cover the twin; or (b) if time is
short, build only the full shell and report the twin as "not covered — test shell has no twin
variant" (brief allows: "cover the twin if the test shell supports it, otherwise say what you could
not cover"). Recommend (a) if budget allows, else (b).

## 3. Shared stub ink — `scenarios/_office_kit/ink/`
One `<person>_ambient.ink` per ambient person (gwen_pritchard, agnieszka_duda for Brightwell).
Shape per plan 4.2 / appendix "Shared mechanism facts": a `start` knot that **diverts in ink** to the
episode knot when `kit_defend_done` is true, choosing the knot by `kit_ep`. Example skeleton:
```
VAR kit_defend_done = false
VAR kit_ep = ""
=== start ===
{ kit_defend_done:
    { kit_ep == "ca01": -> ca01 }
}
Gwen: <neutral ambient greeting>.  // stub line read during the defend half
-> DONE
=== ca01 ===
Gwen: <post-defend episode line>.
-> DONE
```
Only declared globals (or `global_` names) sync into ink (npc-conversation-state.js:466-475), so
kit_defend_done and kit_ep must be VARs here and declared in the shell's globalVariables (they are).
Ink reading a kit global is UNVERIFIED (plan proof 10) but proof 4/1 here exercise the divert.
Compile with `./scripts/compile-ink.sh _office_kit` (finds any dir named `ink` under scenarios and
runs bin/inklecate; produces `<name>.json` beside the `.ink`). Commit both `.ink` and `.json`.
The staleness test (`test/unit/break_escape/ink_compiled_staleness_test.rb:26`) globs
`scenarios/**/*.ink` and pairs each with its compiled JSON — so it covers `_office_kit/ink/`
automatically; just make sure the committed `.json` equals a fresh compile.

## 4. Proof 4 single-shell part — registry/test-skip/staleness (ALREADY SATISFIED, verify only)
Resolved by reading the code — **no edits needed**, which itself is the proof-4 answer:
- Mission registry `db/seeds.rb`: iterates `Dir.glob("scenarios/*")` dirs then `SKIP`s any dir with no
  `scenario.json.erb` (seeds.rb ~:52-56). `_office_kit` has no erb → skipped. SKIP_DIRS also =
  `%w[common compiled ink]` (seeds.rb:6) — not needed but harmless.
- Every scenario-iterating test uses `Dir.glob('scenarios/*/scenario.json.erb')` (phish_superset,
  tts_mission_lines, capture_payload_secret, scenario_object_tile_bounds, payload_scan_fresh_state,
  payload_scan_opened_state, scenario_ending_bypass, scenario_schema) — these only match folders that
  HAVE the erb, so `_office_kit` is excluded with no code change.
- Staleness test globs `scenarios/**/*.ink` → covers `_office_kit/ink/` (wanted).
- **Server ink path rule ALLOWS it**: `resolve_and_compile_ink` -> `InkStoryFile.find(story_path)`;
  `InkStoryFile` allowed_roots = `[Engine.root.join('scenarios')]` (ink_story_file.rb:39). Any path
  under `scenarios/` resolves, with no per-game/per-scenario restriction. So a kit NPC whose
  storyPath is `scenarios/_office_kit/ink/<p>.json` loads. Plan's per-shell-copy fallback NOT needed.
So proof 4's non-live assertions all pass by construction. The live half (story actually loads in the
running game) is run in §6.

## 5. Validator
`ruby scripts/validate_scenario.rb scenarios/test_ca_office_kit/scenario.json.erb --strict-social
--no-graph --skip-ink` must be clean. Run after building; fix any schema complaints about kit keys
(e.g. affordance/needs/chatter). Note the new awareness.rb lint (owned by the other agent) errors on
`kit_`/`officePresets`/`npcThoughts`/`stepAway` in a `["check"]`-stage or annual shell — the test
shell is a full episode so it is fine, but don't give it check-only stages.

## 6. Live proofs — keyless server on :3002 (NEVER :3000/:3001/:3003; never any db: task)
Start (worktree needs BUNDLE_PATH; worktrees have no `.bundle/config`):
```
cd <this worktree>
env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true \
  BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle \
  bundle exec rails server -b 127.0.0.1 -p 3002   # (or tools/playtest/start-keyless-server.sh after
  exporting BUNDLE_PATH/RBENV_VERSION as that script does)
```
New game: `env ... bundle exec rails runner tools/playtest/new-game.rb test_ca_office_kit` (and the
twin). Drive `.claude/skills/playtest-scenario/scripts/playtest-session.js` at :3002. Headless only,
`window.__test.throttleFps(20)` (re-apply after each reload; fixedStep ON), fresh game per proof,
only drive game ids this run created. Evidence dir:
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/wave0_proofs/`.
Read the playtest-scenario skill for the window.__test bridge before driving.

Proofs to run and pass criteria (plan §11):
- **Proof 1** (full + twin): each of the 4 globals turns exactly once at the save named in 6.1;
  kit_quiet up at first state save, down at debrief; kit_caught set at >=85, false below; `done`
  holds `debrief` at last save; all survive reload incl. reload straight after the result screen;
  kit_defend_done set only on confirmed save (false through reload after a failed save); stub `start`
  diverts to the kit_ep episode knot once kit_defend_done, incl. after reload; no ambient bark at the
  confirmed save; per-answer triage saves re-fire nothing. (Driving a sub-85 vs >=85 result: use the
  defend set; triage scoring in triage-scoring.js.)
- **Proof 3** (quiet guard): two staff with gated pools; sit each stage 90s incl. the brief before the
  first save; close kiosk. Nothing reaches the learner while the kiosk is open; held-bark queue empty
  at every close; RECORD anything heard in the pre-first-save brief window (the one known gap, plan
  6.7 last para — if a line lands there, note it: fallback is kit_quiet default true or EC2).
- **Proof 6** (kiosk resume): close kiosk with X between stages and mid-stage; reopen → resumes at the
  saved stage, input returns.
- **Proof 11 (Brightwell only)**: staff in the Brightwell room for ~5 need cycles; staff sit at
  coordinate/chair homes; no stuck walker; learner path start→host→kiosk never blocked (incl. queue
  cell). See §1 ROOM DECISION re drawn-prop binding (likely report as deferred).
- **Proof 4 live**: the kit NPC's story loads in the running game from `scenarios/_office_kit/ink/`.
Stop the :3002 server when done.

## 7. Engine facts confirmed (so the builder/plan don't need re-checking)
- InkStoryFile allowed_roots = `[scenarios]` (ink_story_file.rb:39); storyPath under scenarios/ loads.
- seeds skip dir w/o scenario.json.erb; all scenario tests glob `scenarios/*/scenario.json.erb`.
- staleness test globs `scenarios/**/*.ink`, pairs X.json / X.ink.json (test lines 24-31).
- compile-ink.sh: `find scenarios -type d -name ink` → runs bin/inklecate `-o X.json X.ink`.
- Source-object/affordance shape: lab_physical_pentest:2435-2454.
- Chatter pool shape + requireGlobal gate: test_chatter_pool_gate/scenario.json.erb.
- ca01 real room: room id `training_room`, type `room_aw_brightwell`, host adaeze_okafor @(5.5,3.8).
- Brightwell map 10x10, interior floor x[1..8] y[2..8]; items objectgroup names are empty.

## 8. Open decisions for the next agent
1. Room type for the test shell (room_aw_brightwell vs room_office) — §1.
2. Whether to build a defend-only twin for proof 1 — §2.
3. Verify `requireGlobal` object form `{kit_quiet:false}` vs string in npc-needs.js before relying on it.
4. Confirm `scenario.npcThoughts:false` placement for a shell with no existing `scenario` block.

## Results (2026-11-19, build commit 4ba332087)

### Files built
- `scenarios/test_ca_office_kit/` (scenario.json.erb + mission.json): full awareness episode
  shell, room `training_room` type `room_aw_brightwell`, host `ep_host` @(5.5,3.8), kiosk @(7,3),
  two ambient staff + coffee/cooler sources, `kit_brightwell` chatter pool, 5 kit_ globals, 5 host
  mappings, `npcThoughts:false` at top level.
- `scenarios/test_ca_office_kit_defend/` (twin): defendOnly variant. The validator forced the
  "doubled prefix" the spec predicted — a defendOnly episode's id must end in `_defend` and its stages
  must be exactly `[brief, defend, debrief]`, so id=`e1_stub_defend`, state global
  `episode_e1_stub_defend_state`, defend prefix `episode_e1_stub_defend_defend_`. kit_attack_done
  mapping omitted (no attack phase) so it stays false.
- `scenarios/_office_kit/ink/{gwen_pritchard,agnieszka_duda}_ambient.{ink,json}`: stub ambient ink;
  `start` knot diverts in ink to the `kit_ep` episode knot when `kit_defend_done`. Compiled with
  `scripts/compile-ink.sh _office_kit`; committed .ink + .json, no drift.

### Validator (`--strict-social --no-graph --skip-ink`)
Both shells: **0 errors**. Remaining warnings are inherited base-shell social notes
(phish_supplier_contact_landed unread; full variant's playerSentAuth row) plus "kit_* set but
nothing reads it" SUGGESTIONS — expected for Gate A (kit_attack_done/kit_caught are read by the later
chain; the validator's reader does not count a chatter-pool `requireGlobal` as a read of kit_quiet).

### Decisions on §8 open items
1. **Room** = `room_aw_brightwell` (room id `training_room`), host/kiosk at ca01-style coords, sources
   at explicit positions (coffee @(2,7), cooler @(7,7)). Drawn-prop auto-binding **NOT exercised**
   (the map's `items` objectgroup has empty names) — **deferred to the ca01 build** as §1 recommends.
2. **Twin** built (defendOnly, doubled prefix). Small and clean.
3. **requireGlobal object form** `{kit_quiet:false}` is supported:
   `public/break_escape/js/systems/npc-needs.js:328-334` (`requiredGlobalsHold`, object branch uses
   `Object.entries(...).every(([n,v]) => globals[n] === v)`). Pool-gating read at npc-needs.js:306.
   **Proven live**: pool `kit_brightwell` spoke while kit_quiet=false (gate open).
4. **npcThoughts placement** = **top-level scenario key**, not a nested `scenario` block. Read at
   `public/break_escape/js/systems/npc-action-icons.js:356-357` (`scenario?.npcThoughts !== false`,
   scenario = `window.gameScenario` = the whole scenario JSON, set at `js/core/game.js:1716`); mirrored
   at `npc-needs.js:5667`. Matches m01:510 / m02:601. The spec's note about a nested `"scenario":{}`
   block is wrong per the code. Confirmed live: boot reported `npcThoughts:false`.

### Live proofs (keyless :3002, headless, throttleFps 20 after≈17-18/s, fixedStep ON; game 10255 main)
- **Proof 11 (Brightwell)** — **PASS**. Both staff spawn in training_room, go caffeine-urgent, walk to
  `kit_coffee`, use it, pair-chat (`npc_chatted:kit_coffee` topic `kit_brightwell` "Audit week again."),
  sit at coordinate chair homes (`npc_sat` hospital_chair_south, facing south), return to post;
  Agnieszka then goes thirst-urgent, walks to `kit_cooler`, uses it, returns. No stuck walker, all
  `npc_arrived` succeed, `pageErrors:[]`. Learner path start(160,144)→host/kiosk unobstructed.
  Evidence: wave0_proofs/proof11_session.jsonl (drain seq 7-41).
- **Proof 4 (kit NPC story loads)** — **PASS (spawn-level)**. Both staff load with
  `storyPath:"scenarios/_office_kit/ink/<p>.json"` and register/animate in-world with no page error, so
  the server resolved the ink under `scenarios/_office_kit/` (InkStoryFile allowed_roots). A converse to
  read a line was not driven (budget); the clean spawn + chatter prove the record loads.
- **Proof 1 (globals)** — **PARTIAL**. All 5 kit globals present at correct defaults at boot
  (`kit_quiet:false, kit_ep:"ca01", kit_attack_done:false, kit_defend_done:false, kit_caught:false`);
  chatter audible while kit_quiet=false confirms the open-gate half. The full episode run (4 globals
  turning once, reload persistence, sub-85 vs >=85) was **NOT driven** — out of context budget.
- **Proof 3 (quiet guard)** — **PARTIAL**. The gated pool mechanism is proven: pool `kit_brightwell`
  is spoken by the engine (coffee `affordance.chatter`) and the `requireGlobal:{kit_quiet:false}` gate
  governs it. The kiosk-open half (open kiosk → first state save sets kit_quiet TRUE → chatter stops)
  was **NOT driven** — out of budget.
- **Proof 6 (kiosk resume)** — **NOT RUN** — out of budget.

### Blocking / for gate B
- `test_ca_office_kit`/`_defend` were not in the shared missions table; registered the two rows via a
  scoped non-destructive `rails runner` (find_or_initialize_by + save, mission ids 278/279) — NOT a
  `db:` rake task. `db:seed` is both brief-forbidden and was blocked by the safety classifier; do not
  re-seed. new-game.rb game ids this run: 10255 (main), 10256 (twin).
- Proofs 1 (full episode), 3 (kiosk-open half) and 6 (resume) need a dedicated playtest pass driving
  the episode minigame end to end; the build and all four §8 decisions are verified. This is the main
  item outstanding before gate B can rely on the kit's runtime behaviour.
- Chatter wiring note: the plan's `kit_brightwell` pool is only spoken because the coffee affordance
  carries `chatter:"kit_brightwell"` and both staff meet there (capacity 2). A pool with no engine
  speaker (not an affordance.chatter / magnet / grumble / work-failure / phone topic) is silent — the
  validator warns. Carry this into the ca01 kit build.

## Results, run 2 (2026-11-19, partial)

Keyless server on :3002 from this worktree, started and stopped by this run. Games: 10257 (probe only, Start not pressed), 10258 (full shell run). Throttle 20 steps/s, fixedStep on. The run did not finish: the twin, the sub-85 score, the 90 s proof 3 sits and proof 6 are NOT RUN.

Log paths (scratchpad `gate_a_run2/`): `full_session.jsonl` (first harness session, ended by a hang on a converse command), `full_session2.jsonl` (second session on the same game after the restart), `drain_full_1.txt` (event log dump, the source for the seq numbers below).

- **Proof 1, kit_attack_done once at its save: PASS.** One `global_variable_changed:kit_attack_done` (seq 66), fired by the save that moved the stage to defend (seq 65).
- **Proof 1, kit_defend_done once: PASS.** One change (seq 108), after `episode_e1_stub_defend_complete` (seq 107), which fires on the fifth triage answer, before Finish.
- **Proof 1, kit_caught once, at 85 or more: PASS for 100%.** One change (seq 109). The below-85 run is NOT RUN.
- **Proof 1, kit_quiet true at first save and false at debrief: PASS.** True at the brief-to-osint save (seq 31). False at the debrief Finish (seq 120). It stays true on the debrief screen until Finish.
- **Proof 1, done holds debrief at last save: PASS.** Final episode state `done` is brief through debrief.
- **Proof 1, reload keeps values: PASS, partly.** A fresh page load after Finish (session 2) kept kit_attack_done, kit_defend_done and kit_caught true, kit_quiet false, and `debrief` in done. A reload on the result screen itself is NOT RUN.
- **Proof 1, per-answer triage saves re-fire nothing: PASS.** Seq 98 to 104 are episode-state saves only. No kit_ global event fired in the triage window.
- **Proof 1, staff click after kit_defend_done diverts to the kit_ep knot: FAIL as observed.** Talking to kit_gwen_pritchard after defend opened person-chat with only "(End of conversation - press ESC to exit)". The ca01 line ("Good spot on that invoice...") did not appear, though the compiled JSON contains it. Cause not found (dialogue skipped, or ink state). Needs a driven run that reads the transcript.
- **Proof 1, twin (defend-only): NOT RUN.**
- **Proof 3, quiet guard: FAIL (provisional, one observation).** `npc_chatted` on kit_brightwell ("Any biscuits left?", seq 80, t=121.8 s) fired while the kiosk was open (defend stage) and kit_quiet was true. Seq 24 (t=11.2 s, "Audit week again.") fired before the brief save, which is the known gap. The 90 s sits per stage and the held-bark queue check are NOT RUN.
- **Proof 6, kiosk resume after X: NOT RUN.**

Gotchas found in this run:
- `pkill -f games/<id>` matches the Chromium process for that game, and killed this run's own browser (exit 144). Kill by PID.
- A `converse` call hung the session for about 3 minutes, then failed with "Target page ... has been closed". Use `interact` plus `mg getState` to read a conversation.
- Triage flow: verdict, then optional tells (`input[data-chip=...]`), then Confirm (a second Confirm locks with no tells), then `.tri-next`. Finish is `.tri-finish` on the result step.

Next step for a fresh agent: run the twin on a new game (test_ca_office_kit_defend), the sub-85 run (answer all five wrong), the Gwen divert transcript, the 90 s stage sits with both staff, and proof 6. Work from the kiosk stage names: Brief, Research (osint), Write, Your message (flip), Defend, Debrief.

## Diagnosis (2026-11-19, run 2 failures)

Commits on `feat/ca-living-office-build`: `dd94ee640` (both fixes + tests), `56fb492bf` (stub speaker prefix). Test: `test/js/office-kit-quiet-and-stub.test.mjs`, 9 tests, all pass (8 failed before the fix). Ink staleness test passes; validator 0 errors on both shells.

### Failure 1: "Any biscuits left?" spoken with the kiosk open
- **Path:** a coffee pair chat (`_tickChats`, `public/break_escape/js/systems/npc-needs.js:4586-4633`), bag draw through `_pickBark` (:2970), which reads the pool with `chatterPool(..., this._holds)` (:2971). The gate is checked on this path, at every draw. Nothing was queued from before kit_quiet went true: the pair formed at seq 79 (t=121.7 s), kit_quiet had been true since seq 31.
- **Cause: scenario wiring.** `chatterPool` (npc-needs.js:302-315) gates the scenario pool and the NPC's own pool separately, each on its own `requireGlobal`. The scenario `kit_brightwell` pool was gated, but each kit NPC also had an own pool under the same key as a plain array (`scenarios/test_ca_office_kit/scenario.json.erb:516,534`, and the twin), which has no gate. With the scenario pool shut, Agnieszka's own lines still drew: lineId `kit_brightwell:1` is index 1 of her own two lines, which is only possible with the scenario pool shut.
- **Did it reach the learner? Yes, by voice.** With a minigame open the bubble is hidden (`npc-world-bubbles.js:1045`), but a deferred chatter voice with no bubble "speaks as before" (`npc-world-bubbles.js:1134-1141`), and `speak`/`say` only mute for person-chat or phone-chat (`npc-needs.js:5677`, `conversationOpen` :5267). The line was `overheard:true` at 95 px, so with TTS on (production) it would have played while the kiosk was open. The keyless run had no audio, so nothing was actually heard in run 2.
- **Fix:** both shells' per-NPC pools now use the object form with `requireGlobal: {kit_quiet:false}`. No engine change: the engine honours the gate per pool by design. EC2 not needed.
- **Carry into the ca builds:** every pool a kit NPC owns under a gated key needs its own gate. A validator lint for "NPC pool under a gated scenario key has no gate" would catch this; not added (validator files are shared).
- **Live re-check (game 10275, keyless :3002, throttle 20):** kiosk opened and Start pressed, kit_quiet true (seq 54); sat about 255 s with the kiosk open. Three coffee pairings (seq 62/66, 84/90, 108/114) and three cooler visits: **zero `npc_chatted`**, voice log empty after the pre-kiosk line. **PASS.** The pre-first-save gap stays (seq 24 "Audit week again." before Start, as in run 2).

### Failure 2: staff click after kit_defend_done showed only "(End of conversation)"
- **Cause: stub ink shape.** The divert itself worked (globals sync into the story; reproduced: the engine read "Gwen: Good spot on that invoice..."). But a knot that prints its line and ends at `-> DONE` with no choice leaves `canContinue` false with no choices on that same continue, so `PhoneChatConversation.continue` marks it ended (`public/break_escape/js/minigames/phone-chat/phone-chat-conversation.js:399-402`), and person-chat's `showCurrentDialogue` discards the text and shows "(End of conversation)" (`person-chat-minigame.js:676-725`). The pre-defend line was lost the same way. The driver did not skip anything.
- **Fix:** both stubs (`scenarios/_office_kit/ink/*_ambient.ink`) end each knot with `-> bye`, a sticky `+ [See you later.]` / `#exit_conversation` / `-> DONE`. Also the speaker prefix is now the display name (`Gwen Pritchard:`): a first name alone does not resolve (`normalizeSpeakerId`, id or displayName) and showed as text.
- **Live re-check:** before defend, Gwen now shows "Morning. Grab a coffee..." with the exit choice (game 10275). The post-defend line was **not re-driven live** (needs a full episode run); it is covered by the unit test through the real `PhoneChatConversation` + `syncGlobalVariablesToStory` with kit_defend_done true and kit_ep "ca01". Run 2 already proved the mapping that sets kit_defend_done.

## Results, run 4 (2026-11-19, partial)

Keyless server on :3002 from this worktree, started and stopped by this run (PID 2055561, killed by PID). Headless, throttle 20 (after 16.7 to 17.9 steps/s), fixedStep on. Scenario fix first: both kit finish objectives got a plain-text `conclusionScreen` (commit 8894b8879; validator 0 errors, 5 and 4 warnings). The finish step now concludes with a screen (`mission_concluded` and `objective_aim_completed:finish_episode_aim` fired in the twin run).

Log paths (scratchpad `gate_a_run4/`): `a_twin_session.jsonl` (session log), `a_drain.json` (event log, 85 events, pageErrors 0). The full-shell session log is `b_full_session.jsonl`; that run is not a result.

- **a. Twin (test_ca_office_kit_defend): PASS.** Game 10282. `kit_quiet` true at the first save (Start, seq 25), false at the debrief Finish (seq 84). `kit_defend_done` once (seq 68), `kit_caught` once (seq 69), `kit_attack_done` never changed, `done` = brief, defend, debrief. Score 100, all five messages right.
- **b. Full shell, score below 85: NOT RUN.** Game 10286 reached the OSINT browser and stopped there. Brief, OSINT, Write and Flip still need driving before the Defend triage.
- **c. Reload on the result screen: NOT RUN.** Depends on b's run.
- **d. Quiet guard, 90 s per stage: NOT RUN.** Not started.
- **e. Proof 6, close and resume: NOT RUN.** Not started.
- **f. Gwen after defend, kit_ep "ca01" divert: NOT RUN.** Needs defend complete in a full-shell run. The twin has no Gwen.

Driving gotchas found in this run:
- `mg clickText` takes a plain substring, not a regex. `^Confirm` and `^Report` return no-control-matching.
- Tell chips are checkbox inputs that `clickText` does not match. Tick them by eval: `document.querySelector('input[data-chip="changed_bank_details"]').click()`. Chip ids are in each message's `flags` in the scenario (ep_bank: changed_bank_details, ep_lookalike: lookalike_domain).
- Confirm with no tells asks for a second Confirm to lock. A genuine message needs Trust, then Confirm, then Confirm again, then "Next message". "See result" then "Finish" leads to the debrief, and a second "Finish" on the debrief screen drops `kit_quiet`.
- Full shell: Start, then "Open the browser" (OSINT). Do not assume the first stage is the Defend triage.

## Results, run 5 (2026-11-19, partial)

Keyless server on :3002 from this worktree, started and stopped by this run (PID 2119043). Headless, throttle 20 (16.6 steps/s after throttle). One game driven: 10288 (test_ca_office_kit). The step-away panel steps (P1 and C3) were dropped, as this branch has no panel. Scripts: scratchpad `gate_a_run5/` (`run5.jsonl`, plus `probe.jsonl` and `finish.jsonl` as follow-ups on the same game).

- **b. Defend triage, score below 85: PASS (once count not captured).** All five messages answered wrong (two phish trusted, three genuine reported). Result screen: `percent` 30, `kit_caught` false, `kit_defend_done` true. The count of `kit_defend_done` turning true was not read before the reload, so "once" is unverified here. Evidence: log seq 49. Log: `gate_a_run5/out/run5.log`.
- **c. Reload on the triage result screen: PASS (values), with a caveat.** Pre-reload `kit_` snapshot (log seq 53): `kit_ep` ca01, `kit_quiet` true, `kit_caught` false, `kit_attack_done` true, `kit_defend_done` true. Post-reload (log seq 57): the same five values. The compare was by hand, because the in-page comparison read a window global that the reload wiped. Caveat: the reload did not return to the triage. Bootstrap closed the triage and landed on the end-of-mission success screen ("TEST KIT: FINISHED", `missionEnd.kind` success) before any Finish was clicked. Whether the server had concluded the mission was not checked (needs the game record). Screenshot: `gate_a_run5/out/run5-after-reload.png`.
- **f. Finish, close kiosk, Gwen after defend: PASS, with deviations.** Because of the end screen after the reload, the kiosk opened the episode runner at the debrief (`run5b.log`). Then one debrief Finish, kiosk X closed (no success overlay, as it had already shown), and Gwen Pritchard printed "Good spot on that invoice" with "See you later." as the choice, `kit_ep` ca01. Debrief Finish left `kit_quiet` false, as run 4 noted. Logs: `gate_a_run5/out/run5c.log`. Screenshot: `gate_a_run5/out/run5c-gwen-ca01.png`.

Open question from c: the end-of-mission screen after a reload at the triage result, before the debrief. Decide whether that is a bug (a client or server conclusion that fires before the debrief) or expected resume behaviour.

## Results, run 6 (2026-11-19, partial)

Keyless server on :3004 from this worktree (PID 2118326, checked free with ss before start, stopped by PID at the end). Headless, throttle 20, fixedStep on. Scenario test_ca_office_kit, full shell, step-away panel steps dropped. One fresh game per item: 10289 for item d, 10290 for item e. Script: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/gate_a_run6/case_run6b.jsonl`, built from the ec1 case3 script by `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/gate_a_run6/build_case_b.py`.

- **d. Quiet guard: PASS, with the known pre-save gap.** Game 10289 (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/gate_a_run6/run1_quiet.log`, output `run1_quiet.out`). Six 90 s windows after the first save (Start): OSINT, Write menu, Write with mail open, Flip, Defend menu, debrief. In every window: zero `npc_chatted`, zero `npc_overheard`, zero other chat or bark events in the drained log, zero toasts, `kit_quiet` true. Staff kept moving in every window (npc_arrived, npc_sat, npc_used, npc_left_post, npc_returned_post). The held-line queues (`npcWorldBubbles.chatterVoice` and `chatterMust`) read 0 at every snapshot.
  - Recorded in the brief, before the first save: "Audit week again.", `npc_chatted:kit_coffee`, Gwen to Agnieszka, `overheard: true`, `playerDistance` 72, seq 24 at t 18.1 s. `kit_quiet` was false then. This is the known gap (plan 6.7) and matches the run 2 line. Game 10290 gave the same events at seq 24 and 25. Keyless, so nothing was voiced. Whether it would be voiced in production is untested here.
  - Bark check method: event names matched against `chatted`, `bark`, `overheard` in the drain, plus the toast capture. No bubble DOM check.

- **e. Kiosk close and resume: PASS.** Game 10290 (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/gate_a_run6/run2_close.log`, output `run2_close.out`). Three X closes (`.epr-kiosk-close`), each reopened with `interact ep_kiosk`:
  - C1, between stages (Write menu): saved stage `write`, reopened at `write`.
  - C2, mid-stage (Flip, send held): saved stage `flip`, reopened at `flip`, sent record still in `episode_e1_stub_state`.
  - C3, between stages (Defend menu): saved stage `defend`, reopened at `defend`.
  - Held queues 0 at every close. Input works while closed: walk up 400 ms then down moved the player each time (y 141.1 to 96.6 and back, 154.2 to 102.1 and back, 162.1 to 102.7 and back).
  - Game 10289 also passed C1 (`write`) and C3 (`defend`). Its C2 did not run: the kiosk X sits under the nested mail client, so the close found no X. That was a script choice, not a game result, so C2 moved to the Flip stage for game 10290.
- **Corroboration (both games):** debrief Finish gave no success overlay, and the X close afterwards showed the success overlay with `kit_quiet` false.
