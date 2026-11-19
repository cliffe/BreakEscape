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

## Results (fill in as proofs run)
_None yet — build not started._
