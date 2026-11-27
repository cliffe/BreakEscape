# Wave 2 build brief: Cyber Aware living office

Branch `feat/ca-living-office-w2`, worktree `.claude/worktrees/b-ca-lo-w2`, cut from main `e9e57d1a9` (waves 1A and 1B are on main). Status: brief v4, ready for its delta review (section 6). Nothing is built yet.

Abbreviations: `AW/` = `planning_notes/phishing_and_social_engineering/awareness/` (run the tools from here); `PLAN` = `planning_notes/security_awareness_course/living_office/LIVING_OFFICE_PLAN.md` in the plan worktree `.claude/worktrees/p-ca-living-office/` (copy it in if a builder's worktree lacks it); `APP1`/`APP2` = `PLAN_APPENDIX_CA01_CA10.md` / `PLAN_APPENDIX_CA11_CA20.md` beside it; `T:` = `test/js/social-awareness-office-kit.test.mjs`; `QS:` = `test/js/office-kit-quiet-and-stub.test.mjs`. "Confirm" means the builder re-opens the source before relying on the point.

Reference builds to copy: ca01 (`scenarios/ca01_invoice_fraud`, fallback form, tier O, built as text plus host plus stubs) and ca12 (`scenarios/ca12_visitor_tailgater`, panel form). Read `living_office_build/GATE_B.md`, `GATE_C.md`, `CA01_DIALOGUE_EDITS.md` and `CA12_BUILD.md` parts 1, 3, 4 and 6 before building. `CA01_BUILD.md` is superseded except for its rules lists.

## 1. Scope

### 1.1 What wave 2 delivers (PLAN 13, wave 2 row)

36 shells first touched: ca00, 17 full incident shells, ca17, and 17 twins (16 generated, `ca13_ai_assistant_defend` hand-authored). In `episodes.json` that is 35 new rows plus the existing ca13 twin row (I step 3).

| Group | Shells | What each gets in wave 2 |
|---|---|---|
| ca00 | `ca00_first_play` (built by `gen_core00_shell.py`) | The convention form of section 1.3: Quayholt pair Darren and Niamh, with their `thirst` need and the Quayholt cooler (D12) but no pool chatter; each opens on a `ca00` hello knot; the host's greeting asks the learner to say hello to one colleague. The tour's cards and `alreadySeen` are unchanged. No layer 0 or 1, no host mappings. |
| Text tier (9) | ca02, ca04, ca05, ca07, ca10, ca13, ca14, ca18, ca20 | Kit staff, with a source and pool where the company has one (D12), two stub knots, layer 0 and layer 1 in `strings.conceptPanel`, up to two host lines (hub-first, three-way, PLAN 6.6), `keyMessage` (required, D13) and `hostLine` row fields. `stepAway: false`. |
| Observed and end-to-end, minus the pilots (8) | ca03, ca08, ca11, ca19 (O); ca06, ca09, ca15, ca16 (E) | The same as the text tier. No chain, no set piece (`setPiece: null`), no request, `stepAway: false`, tier recorded as in PLAN 5. Chains come in waves 3 and 4. |
| ca17 | `ca17_acceptable_use_defend` (built by `gen_e8_e17_shells.py`) | Shallow kit (Fatima, Chidi), the shared mappings only, one stub knot (Fatima), layer 1 through its fragment. No host line, no layer 0, and its layer 1 has no "have a word with" pointer (APP2 ca17). |
| Twins (17) | `<shell>_defend` for ca02 to ca11, ca13 to ca16, ca18 to ca20 | Shallow kit with the full shell's pair, layer 1 through the fragment, one two-way host line (catch or miss) on the doubled `_defend_defend_complete` global, as the ca01 and ca12 twins. No layer 0, no chain. ca13's twin is hand-authored and its row already exists. |
| Kits | `AW/office_kits/tarrowby_logistics.json`, `quayholt_insurance.json`, `carrholme_services.json` (new); `brightwell_foods.json` (add Graham Whitfield), `merrin_sallow.json` (add Lorna Easton, Delphine Arvanitis) | Staff with one `thirst` need each and a source per company; a pool at Tarrowby and Quayholt, the pool exemption at Carrholme (D12); shared `start` knots and the wave 2 episode knots. Gate D per new company. |

Which generator builds which shell: `gen_core00_shell.py` ca00; `gen_e2_e4_shells.py` ca02 and ca04 twins; `gen_e3_e5_shells.py` ca03 and ca05 twins; `gen_e6_e7_shells.py` ca06 and ca07 twins; `gen_e8_e17_shells.py` the e8 to e20 twins (e13 skipped, hand-authored) and ca17. `gen_e1_shells.py` builds ca01's twin and is the only generator with the tier argument today.

Graham, Lorna and Delphine have no kit records and no `_ambient` stubs on main (Lorna appears in the Merrin kit only as an `npc_arrived:lorna_easton` mapping target in the ca12 set piece). Their sprites, talk sheets, visemes and `sit` frames exist. P-SBM adds all three. Delphine's VOICE_CAST ink prefix is `delphine_reception`; her kit person key and stub file use the sprite key `delphine_arvanitis`.

Untouched and pinned: the 28 check shells, `ca_annual_2027_defend`, the `room_aw_*` maps, `gen_checks_v2_shells.py`, `gen_annual_shells.py`, `AW/training_room_lighting.json`. Also untouched: ca01, ca12, their twins and test shells.

Cast pairs are PLAN 8.3; hosts are in the APP1/APP2 section headings. An ambient pair never includes the shell's host or anyone named in its `social` block: re-run the text search per shell before writing the row.

### 1.2 Decisions this brief takes

| # | Topic | Decision |
|---|---|---|
| D1 | Layer 0 | In scope for all 17 incident shells (PLAN 5, 6.6). Not in ca00, ca17 or any twin. |
| D2 | Host lines | Full shells: up to two lines in the three-way block (CATCH, PARTIAL, MISS plus two closes, PLAN 6.6), hand-edited in the host's ink. Twins: one line, two-way `{'catch': ..., 'miss': ...}` with `VAR kit_key_caught`, generated from the generator's `LINES` (`gen_e8_e17_shells.py` `ink_source`). The plan's line counts are the budget; clips are tracked separately (section 4). |
| D3 | O and E shells | `setPiece: null` (`office_kit._set_piece` returns `{}`). Layer 1's last sentence points to the host only ("have a word with <host first name>"), with no "look around the office". Waves 3 and 4 add set pieces, `stepAway` and the panel copy. O and E rows carry `attack: true`. |
| D4 | Attacker's side | One host line per full shell gives the attacker's side in attacker terms. Split from layer 0: layer 0 is the next step and the breaking point (debrief); the host line is the attacker's reaction to being stopped, or what the habit cost them, in the room's voice, one sentence, no method. The other line gives the human side. |
| D5 | Duty wording | Held for owner call O1. Interim: layer 1 in ca02, ca03, ca05, ca08 and ca11 carries no duty claim; each H package keeps a duty clause ready in its handover. |
| D6 | Set pieces | `room_npcs` merges a set piece's `staff.<person>` patch and `npcs` array. No effect in wave 2; recorded for waves 3 and 4. |
| D7 | Brightwell and Merrin staff | Graham, Lorna and Delphine are added in wave 2 under the 1A/1B shared budget (up to 9 lines). |
| D8 | ca01 course shell | Stays the fallback form. Its follow-up waits for the pilot (AC0 relay, 19 Nov). Out of wave 2 scope. |
| D9 | Timing | PLAN 8.4: each shell pays for its required seconds by replacing one existing debrief sentence (named in the H handover); passages grow by at most one sentence net. Human timing runs after wave 2 are the gate; escalate only if they break the 15 and 8.5 minute rules. |
| D10 | Gate B carry-overs | The ca06, ca15, ca16 proof 9 items are wave 4. Not in gate D. |
| D11 | Quiet release | Every kit shell carries the `done.includes('debrief')` release on its state global; that is what releases `kit_quiet` in all wave 2 shells. The `debriefSeen === true` release and the kiosk finished variant exist only where `stepAway` is true (`office_kit.host_mappings`, `kiosk_condition`), which is no wave 2 shell. ca00 has neither (1.3). |
| D12 | Needs, sources and pools (capacity-2 rule, T:253-255) | Only engine needs are used: `caffeine`, `thirst`, `hunger`, `rest` (environmental, `npc-needs.js:109`) and `work`, `social_media` (judged, `:190`). Kit staff carry no judged need. Every kit colleague at the three new companies carries one `thirst` need and a coordinate `needsHome` beside a supported chair (PLAN 4.2 homes), so they leave home, drink and sit again. **Tarrowby:** `kit_vending` (`drinks_vending`, `satisfies: "thirst"`, `capacity: 2`, `chatter: "pool"`, `useFrom` north), bound to the drawn vending machine. **Quayholt and Carrholme:** neither map draws a source for a non-work need (`room_aw_quayholt` draws only a desk PC, `aw_pc_off1`, which stays map dressing with no scenario object; `room_aw_carrholme` draws none), so each kit declares a `water_cooler` source with an explicit `position`, using the existing `water_cooler1.png` (24x47, preloaded in `game.js`). No new art. With no drawn cooler to bind to, `rooms.js` creates the sprite by the fallback and moves it to `position` (`findMatchFor` returns null, then `createSpriteAtRandomPosition` and `applyScenarioObjectPosition`, about lines 2447-2510); `office_kit.room_objects` copies a source verbatim apart from the `chatter` key, so `position` reaches the shell unchanged. `position` is in tiles, room-relative, and is the sprite's top-left corner (origin 0, 0); `useFrom` is measured from the sprite centre (`npc-needs.js` `describe`, `approachCell`). The engine gives a static body only to tables and wheeled chairs (`rooms.js` about 2805-2834), so the cooler has no collision body: click-to-move routes round it (`path-avoid.js`: `water_cooler` pattern, 47 px over the 40 px floor), as it does round Tarrowby's drawn vending machine, and gate D checks that no walker stands inside its footprint. Free floor (walls layer: floor is x 1 to 9, y 2 to 9 in both rooms): column 8, rows 5 to 7, below the wall-hung extinguisher, is clear in both (the kiosk covers rows 3 and 4 of columns 7 and 8; Quayholt's desk covers row 8 and its chair column 7; Carrholme's linen cart covers rows 8 and 9). The cooler goes there, used from the front (south), well off the learner's start (6, 6.2) to host (5.5, 3.8) and kiosk lines. **Quayholt** keeps a pool, since every Quayholt shell carries a pair: `{ "type": "water_cooler", "id": "kit_cooler", "name": "Water cooler", "sprite": "water_cooler1", "takeable": false, "interactable": false, "observations": "<one sentence>", "position": { "x": 8.2, "y": 5.6 }, "affordance": { "satisfies": "thirst", "restores": 70, "useSeconds": 20, "useFrom": { "dx": 0, "dy": 1 }, "capacity": 2, "chatter": "pool" } }`, with a `pool` (`key` `kit_quayholt`, three lines, `requireGlobal: { "kit_quiet": false }`) and three `chatterLines` for each of Darren, Niamh and Anjali. A topic is spoken when the second of a pair reaches the capacity-2 source (`_maybePair`, `npc-needs.js:4490-4502`). **Carrholme** keeps the pool exemption, because Yusuf is alone in ca11 and `_maybePair` needs two: the same object with no `capacity` and no `chatter` key in `affordance`, at the same `position`; the kit carries `"pool": null` and `"poolExempt": "<reason>"`, and Yusuf has no `chatterLines`. He still walks to the cooler, drinks and sits. The learner reaches a stub by walking up and clicking the colleague, wherever they are: the conversation opens the shared stub at `start`, which gives the one hello line before the result and diverts on `kit_defend_done` and `kit_ep` to the episode knot after it (ca00 opens on the hello knot directly, 1.3). The `kit_spare_pc` errand source that PLAN rows ca03 and ca16 use belongs to waves 3 and 4; the wave 2 Quayholt kit has the cooler only. |
| D13 | `keyMessage` | Required on every wave 2 kit row whose stub knots, twin line or host block read `kit_key_caught`, which is every wave 2 row except ca00: the 17 full shells, the 17 twins (ca13's amended row among them) and ca17, 35 rows. This 35 is not the 35 rows I appends (I step 3): of the 36 shells, all but ca00 carry `keyMessage`. `kit_key_caught` is declared and written only for a row with `keyMessage` (`office_kit.kit_globals`, `messageGlobals`); without it every branch plays as miss. The value is data (the id of the message in the shell's first triage set that the incident turns on), so I writes it into `episodes.json`; each H package names the candidate id per shell in its keyMessage list (2.7), and I checks the id exists in the first triage set, with an outcome, of both the full shell and its twin. ca17's id comes from P-H3. A shell with no such message stops its package, which reports; there is no branch-free fallback. |

### 1.3 ca00: the convention form

ca00 has one stage (`brief`), no triage set, no `setGlobalPrefix`, no debrief and no `<prefix>complete`; its done global is `episode_core_00_first_play_done`. The kit's shared mappings would never fire there, so ca00 does not use them.

- **Row:** `{ "id": "ca00_first_play", "tier": "S", "company": "quayholt_insurance", "ep": "ca00", "stub": "ca00", "ambient": ["darren_price", "niamh_doherty"], "setPiece": null, "attack": false, "stepAway": false, "convention": true }`. No `prefix`, `keyMessage` or `hostLine`.
- **`office_kit.py` with `convention: true`:** `shell_ids` returns `(None, state_global)` without looking for a triage set; `room_npcs` sets `currentKnot` to the row's `stub` and writes no `chatter`; `room_objects` drops `affordance.chatter` from sources (the need affordance stays, so Darren and Niamh still walk to the Quayholt cooler, drink and sit again, in silence); `kit_globals` declares `kit_ep` only; `host_mappings` returns `[]`; `scenario_fields` gives `npcThoughts: false` and no pool. With no unprompted speech, nothing can be heard with the kiosk open, so no quiet guard is needed.
- **Kiosk:** the tour's cards and `alreadySeen` are not changed in wave 2. The brief's card index lives in memory only (`episode-runner-minigame.js:623-638`) and ca00's one stage completes the episode, so nothing in ca00 may tell the learner their place in the brief is saved.
- **Files:** `AW/office_kit.py` and `AW/gen_core00_shell.py` (P-GEN); `AW/core00/ink/anjali_rao.ink` greeting (P-X0); the `ca00` knots in `scenarios/_office_kit/ink/darren_price_ambient.ink` and `niamh_doherty_ambient.ink` (P-KQ); the row in `episodes.json` (I); `scenarios/ca00_first_play/*` regenerated (I).
- **Tests (P-TEST):** T conformance exempts a `convention` row from the pool, `kit_defend_done`, `start` knot and shared-globals checks, and instead asserts: no kit chatter anywhere in the shell, no kit host mapping, each kit NPC's `currentKnot` names a knot in its stub, `kit_ep === "ca00"`; `test_office_kit.py` cases for each convention branch of `office_kit.py` (P-GEN). No test covers the kiosk cards: they are unchanged.

## 2. Work packages

Every package works in its own worktree made by hand from `feat/ca-living-office-w2` (agent worktrees drift to the wrong repo), on a branch `w2/<package>`, and commits only the files it owns. No two packages write the same file; the ownership table in 2.9 is the reference. The integrator merges.

### 2.1 Standing rules for every package

- Never commit on main. Stage explicit paths; check `git diff --cached --stat` before each commit. Commit before testing; fixes are follow-up commits.
- CLI forms: every generator takes `[--repo <checkout>] <out_dir>` (the out dir is required, via `awareness_deploy.required_out_dir`). `apply_training_room.py` takes `[--repo <checkout>]` and one of `--kit <outdir> [--allow-drop <shell>]` (repeatable), `--refresh [outdir]`, or the default patch mode. `office_kit.py` has only `export <shell folder>`. Scratch output goes in `tmp/w2_*` (gitignored) or the agent's scratchpad, never `scratch/`. Move any `dungeon_graph.*` churn to `tmp/delete/`; never `rm`.
- Proof 5 is `AW/proof5.py` (2.2). It passes before and after every generator or `office_kit.py` change.
- The pin test keeps the 28 check shells, the annual shell and the `room_aw_*` maps byte-identical. Changing a pin needs the owner's yes.
- No `db:` task and no game-record edit. The Rails staleness test uses the test database only. Live proofs use keyless servers on :3001 to :3005 from a worktree (`bundle exec`, `BUNDLE_PATH` pointing at the main checkout's `vendor/bundle`). Never touch :3000. Stop servers by PID only.
- Headless runs call `window.__test.throttleFps(20)`; fixed steps stay on.
- Every NPC pool carries its own `requireGlobal: { "kit_quiet": false }`. Stub knots end on the sticky `+ [See you later.]` with `#exit_conversation`. Speaker prefixes are full display names. A kit pool is spoken only through a source with `affordance.chatter` and `capacity: 2` (T:253-255); Carrholme has no pool (D12).
- Every kit shell carries `npcThoughts: false` at top level and `kit_ep` declared with its own episode id; every kit shell except ca00 also carries the debrief release (D11, 1.3).
- Removing a mapping leaves an inert "Retired <date>" slot (condition `data.retired_<date> === true`). New `eventMappings` go last. Run `ruby tools/check_mapping_index_drift.rb main` before sending a hash.
- Synced player state must not grow: the new `kit_<ep>_host_said` booleans are fine; I's live proofs record that no synced key other than `kit_*` appears.
- Node asserts are booleans (`assert.ok(a === b)`). Run JS tests with `bin/test-js <files>` or `node <file>`, not `node --test`. A new static import in a test or engine module is added to every test harness copy list.
- `bin/rubocop` on any touched Ruby file (`BUNDLE_PATH` set in worktrees).
- npc-dialog-review (section 2l, P1 to P13) runs on opus48 on every batch of new lines before any voicing question. Voicing needs its own owner yes, sent through AC0.
- Content rules (CA01_DIALOGUE_EDITS.md, CA12_BUILD part 3): short natural speech, not policy; nobody blamed; no line says who let the incident in; no figure from layer 1 repeated by the host; no layer repeats another; less secure answers carry a real reason; no reusable method, tool, command or wording in layer 0 (ca13 and ca14 stay consequence-only); money as description, not a number. UK English, "Cyber Security".
- Owner aim: fun and immersion, and the attacker's side told in attacker terms.
- Each agent writes its handover at about 150k tokens or 80 calls, commits, and stops.

### 2.2 Model routing

opus48 writes every awareness line: shared start, chatter and pool lines, every stub episode knot, host blocks, twin lines, layers 0 and 1, and the ca00 greeting and cards. Sonnet only wires, compiles and tests what opus48 wrote, and does tools, generators, kit data and tests. opus55 does engine work (none planned) and design review. Haiku runs scripted live proofs and lookups in the foreground (timeout 300000) with small case lists.

### 2.3 P-GEN: proof 5, generators and office_kit.py

- **Model:** Sonnet.
- **Owns, for all of wave 2:** `AW/proof5.py` (new), `AW/office_kit.py`, `AW/gen_core00_shell.py`, `AW/gen_e2_e4_shells.py`, `AW/gen_e3_e5_shells.py`, `AW/gen_e6_e7_shells.py`, `AW/gen_e8_e17_shells.py`, `AW/test_office_kit.py`.
- **Step 1, proof 5 script (the first deliverable, gating everything after it).** `proof5.py [--keep] <work_dir>`: export HEAD with `git archive HEAD` into `<work_dir>/root`; run every generator (`gen_core00_shell`, `gen_e1`, `gen_e2_e4`, `gen_e3_e5`, `gen_e6_e7`, `gen_e8_e17`) with `--repo <root>` into `<root>/scenarios`; run `apply_training_room.py --repo <root> --kit <work_dir>/kit` for every tiered row in `episodes.json` (fixtures are skipped by the tool) and copy its output over `<root>/scenarios`; then compare every generated or kit-spliced shell's `scenario.json.erb`, `mission.json` and `ink/*` with HEAD. The generators and `apply_training_room.py` that run are the copies inside `<root>` (committed code only, so commit before running), and `inklecate` must be on the path (the generators compile ink). A second pass runs the generators again into a separate tree with no `--kit` step, for every row whose generator carries the tier argument (ca01's twin now; ca12's twin after step 2; the 16 twins and ca17 once their rows exist), and requires each such shell to equal its with-`--kit` output, so a generator that writes the kit differently from the splice fails. `ca14_social_media_defend`, `ca16_insider_risk_defend` and `ca18_credential_attacks_at_scale_defend` are compared as parsed JSON (known drift: HEAD holds hand-compacted one-line `verdict` objects); every other file byte for byte. Exit 0 only when all match; print each failing path. It must pass on HEAD, ca12's twin included, before step 2. If it does not, stop and report.
- **Step 2, tier plumbing.** Add `tier='none', kit_row=None` to `scenario()` in the five generators, with the same assert as `gen_e1_shells.py:267-372`; full and twin calls read `office_kit.row_for(mission)`; check calls pass `'none'`. The `gen_core00_shell.py` room-object walk (`build()`, with the `type != 'kiosk'` filter) is already present; keep it. Proof 5 passes.
- **Step 3, twin branch.** Copy the `{'catch': ..., 'miss': ...}` branch of `gen_e8_e17_shells.py:ink_source` (with `VAR kit_key_caught`) into the `ink_source` of `gen_e2_e4`, `gen_e3_e5` and `gen_e6_e7` (copied, not imported, as the generators' house rule says). A plain-string `after` gives today's output. Proof 5 passes.
- **Step 4, ca00, Quayholt and Carrholme.** In `office_kit.py`, with a `test_office_kit.py` case for each:
  - the `convention` branches of 1.3;
  - the `pool: null` branches of D12 (Carrholme): `_pool` (not called); `room_npcs` (no `chatterLines` pop, no `chatter` key); `room_objects` (no pool key lookup; the source, `position` included, copied as is); `scenario_fields` (no top-level `chatter`); `kit_chatter` and `kit_owned` (no pool entry); `test_office_kit.py` skips the pool-line length test for such a kit. A kit with `pool: null` and no non-empty `poolExempt`, or with `poolExempt` and a source carrying `chatter`, is an error;
  - a source with an explicit `position` reaches the shell's room objects unchanged (a Quayholt case and a Carrholme case).
  Proof 5 passes (no row uses them yet).
- **Step 5 (stage 2, after P-TW lands, on its own branch `w2/gen-step5`).** Wire the 16 twin lines from `W2_LINES_twins.md` into each generator's `LINES`, exactly as written. Regenerate into scratch: no twin row exists yet, so the generators run without a kit and only the 16 twins' `ink/*` differ; proof 5 passes on every other shell. I merges this branch at its step 4.
- **Checks:** `python3 AW/proof5.py tmp/w2_p5`; `python3 AW/test_office_kit.py`; `python3 AW/test_apply_training_room.py`; `bin/test-js test/js/social-awareness-office-kit.test.mjs test/js/office-kit-quiet-and-stub.test.mjs`.
- **Outputs:** commits; `living_office_build/HANDOVER_w2_gen.md`.

### 2.4 P-KT, P-KQ, P-KC: one kit per new company, with gate D

One package per company: Tarrowby (KT), Quayholt (KQ), Carrholme (KC).

- **Models:** opus48 writes every line first into the package's lines file: for KT and KQ the pool (3) and each person's shared lines (3 each, counted as the Brightwell and Merrin kits count them); for KC Yusuf's `start` line only (1, D12, no pool); and every wave 2 episode knot for those people, branching on `kit_key_caught` alone (ca00 knots do not branch). Sonnet builds the kit data, wires and compiles the knots exactly as written, and runs the checks. Haiku runs the live proof.
- **Owns:** `AW/office_kits/<company>.json`; `scenarios/_office_kit/ink/<person>_ambient.ink` and `.json` for its people (KT: fatima_begum, chidi_okeke, zainab_hussain; KQ: darren_price, niamh_doherty, anjali_rao; KC: yusuf_demir), including every wave 2 episode knot for them (section 4.1) and the two ca00 knots (KQ); `living_office_build/W2_LINES_<company>.md`; `living_office_build/GATE_D_<company>.md`.
- **Inputs:** PLAN 4.2, 4.3, 6.7, 8.3, 11 (proofs 4 and 11), 14; the Brightwell and Merrin kits as models; CA12_BUILD part 1. Needs and sources per D12: Tarrowby `kit_vending` (`drinks_vending`, thirst, `useFrom` north); Quayholt `kit_cooler` (`water_cooler1`, thirst, explicit position, capacity 2, pool); Carrholme `kit_cooler` (the same, no capacity or `chatter`), `pool: null` and `poolExempt`. Voices from `AW/VOICE_CAST.md`. Episode knots from the APP1/APP2 rows.
- **Kit rules:** sources declared without `position` bind to the drawn prop of their `type` (`rooms.js` `findMatchFor`, confirm); the Quayholt and Carrholme coolers carry an explicit `position`, since no cooler is drawn (D12). Homes off any `useFrom` cell. Walks count as arrived within 1 tile. Room NPC mappings register only once their room loads. Every KT, KQ and KC colleague carries one `thirst` need and a coordinate `needsHome` (D12). No judged need, no barks, exchange, call, `los`, sight, challenge, `frustration`, `workarounds` or `feed`. Pool and chatter lines: three, each 40 characters or fewer, no braces.
- **Gate D, in a throwaway worktree** `x-ca-w2-<company>` (never merged): copy the company kit into `test_ca_office_kit` (registered rows 278/279) with a fixture row, as gates B and C did. Ports: KT :3002, KQ :3003, KC :3004.
  - Proof 4: a kit NPC's `storyPath` in `scenarios/_office_kit/ink/` loads; the folder stays skipped by the mission registry and by tests that need a `scenario.json.erb`; the staleness test covers the new files.
  - Proof 11, all three companies: kit staff in `room_aw_tarrowby`, `room_aw_quayholt` or `room_aw_carrholme` for five need cycles. Pass: the source is in place (KT: bound to the drawn vending machine; KQ, KC: created at its explicit `position`, the log showing the fallback and no bind); the verdict records whether it has a collision body (none is expected, D12) and that click-to-move routes round it and no walker ends a step inside its footprint; no stuck walker; staff leave home, drink and sit again at coordinate homes on supported chairs; the learner's start to host and kiosk path is never blocked, queue cells included; in ca00 (KQ) the staff stay clear of the learner while the brief is open. Before the run, check the cooler position (8.2, 5.6) against the map's free cells (column 8, rows 5 to 7, D12); if it fails, move it within the free floor of that room and record the new position in the verdict.
  - Proof 3 form, KT and KQ: two staff at the pool source, a pool line heard with the kiosk closed, none with it open. KC has no pool.
- **Checks:** compile each changed `.ink` and commit `.ink` with `.json`; `bin/test-js test/js/office-kit-quiet-and-stub.test.mjs test/js/social-awareness-office-kit.test.mjs`; `python3 AW/test_office_kit.py`; `bundle exec ruby -Itest test/unit/break_escape/ink_compiled_staleness_test.rb`; npc-dialog-review (opus48) on the new lines.
- **Outputs:** kit, stub ink, lines file, gate D verdicts with game ids, `HANDOVER_w2_<company>.md`.

### 2.5 P-SBM: Brightwell and Merrin & Sallow staff and stubs

- **Models:** opus48 writes every line (shared lines for the three new people, all episode knots); Sonnet adds the records and wires and compiles the knots.
- **Owns:** `AW/office_kits/brightwell_foods.json`, `AW/office_kits/merrin_sallow.json`; `scenarios/_office_kit/ink/` files for gwen_pritchard, agnieszka_duda, graham_whitfield, julian_sallow, lorna_easton, delphine_arvanitis (new files for the last three); `W2_LINES_brightwell_merrin.md`.
- **Inputs:** PLAN 8.3; APP1 ca04, ca07; APP2 ca13, ca14, ca18; CA12_BUILD 1.3 (Thandiwe's file and the `kit_ca12_screen_asked` warning; confirm whether ca14 and ca18 carry it and take the build option there if so).
- **Work:** staff records, `start` stubs and shared lines for Graham, Lorna and Delphine (D7); episode knots for ca04, ca07, ca13, ca14, ca18. Do not change any ca01 or ca12 knot or line.
- **Checks:** as the kit packages, plus `proof5.py` (an added staff record must not reach a shell whose row does not name it).
- **Outputs:** commits, lines file, `HANDOVER_w2_sbm.md`.

### 2.6 P-X0: ca00 content

- **Models:** opus48 writes and makes the text edits; Sonnet compiles and checks.
- **Owns:** `AW/core00/ink/anjali_rao.ink`, `W2_LINES_ca00.md`.
- **Work (1.3):** the host's before-done line asks the learner to say hello to one of the team before sitting down (no names). The tour's cards and `alreadySeen` are not touched.
- **Checks:** compile the host ink; `python3 AW/proof5.py tmp/w2_p5`, whose only failing paths are `scenarios/ca00_first_play/ink/anjali_rao.*` (no ca00 row exists in stage 1, so no kit content is generated); dialoguelint on ca00.
- **Outputs:** commits, `HANDOVER_w2_ca00.md`.

### 2.7 P-H1, P-H2, P-H3: host blocks and layers 0 and 1

- **Model:** opus48 writes and makes the edits (the files are text). A Sonnet pass compiles ink and runs the checks.
- **Owns** (full shells only):

| Package | Episodes | Files |
|---|---|---|
| P-H1 | ca02, ca03, ca04, ca05 | `scenarios/<shell>/scenario.json.erb` (`strings.conceptPanel` and the replaced sentence only), `scenarios/<shell>/ink/<host>.ink` and `.json`, `AW/e2/defend.json` to `AW/e5/defend.json` (layer 1 for the twin), `W2_LINES_H1.md` |
| P-H2 | ca06, ca07, ca08, ca09, ca10, ca11 | as above, and `AW/e6/defend.json` to `AW/e11/defend.json` |
| P-H3 | ca13, ca14, ca15, ca16, ca17, ca18, ca19, ca20 | as above, and `AW/e13/defend.json` to `AW/e20/defend.json` (e17 is ca17's layer 1, with no host pointer), plus `scenarios/ca13_ai_assistant_defend/` (layer 1 and its one host line) |

  Each erb belongs to its H package until I merges it; after that only I runs the kit splice on it.
- **O1 hold:** layer 1 text for ca02, ca03, ca05, ca08 and ca11 is written without a duty clause and is not marked final until O1 is answered; everything else in those shells proceeds.
- **Inputs:** PLAN 6.6, 8.1, 8.4, 15; the episode's APP1/APP2 sections 3, 4, layer 0, 5 and 8; CA12_BUILD part 4; the shell's own `strings` read in full; the shell's ambient pair (8.3), to keep names out of host lines.
- **Work per shell:** (1) Name the candidate `keyMessage` id (the message in the first triage set that the incident turns on) for the full shell, its twin and, for P-H3, ca17, in the keyMessage list; I checks and writes it (D13). If a shell has no such message, stop and report. (2) Layer 0 then layer 1 in `strings.conceptPanel.text`, as ca01: layer 0 opens with "To a real attacker"; layer 1 replaces one existing sentence (named in the handover) and ends with "have a word with <host first name>." The fragment's panel carries layer 1 without "you", without layer 0 and without the pointer; layer 1 in both shares at least one run of eight or more words (P-TEST's new layer 1 parity case checks this; the existing fragment and erb parity test exempts `conceptPanel`). (3) Host block in the host's ink, above the existing defend-complete branch: gate `kit_defend_done && not kit_<ep>_host_said`; CATCH/PARTIAL/MISS on `kit_key_caught` and `kit_caught`; one line in attacker terms (D4); `~ kit_<ep>_host_said = true`; declare the kit globals it reads as `VAR`s. Edits touch `strings` and `debrief`, never `triageSets`.
- **Checks:** compile changed ink; `node scripts/ink_runtime_check/dialoguelint.mjs --json scenarios/<shell>` with no `error` findings (it always exits 0); `ruby scripts/validate_scenario.rb scenarios/<shell>/scenario.json.erb --strict-social --no-graph --skip-ink` (0 `^ +ERROR` lines; kit warnings wait for I's splice); npc-dialog-review (opus48).
- **Outputs:** commits, lines file, keyMessage list, replaced-sentence list, `HANDOVER_w2_H<n>.md`.

### 2.8 P-TW, P-TEST and I

**P-TW, twin host lines.** Model opus48. Owns `W2_LINES_twins.md` only. Writes the 16 generated twins' lines in the two-way form (catch, miss), the incident as the firm's own case (PLAN 6.6, 5), from the full shell's APP row, with the ca01 and ca12 twin inks as models; runs npc-dialog-review and the 30-word cap by hand. P-GEN step 5 wires them in. ca13's twin line is P-H3's.

**P-TEST, tests.** Model Sonnet. Stage 1. Owns `T:`, `QS:` and the harness copy lists until it lands; then I owns them. Adds, with boolean asserts:
- layer 0 presence: every row with `attack: true` and tier T, O or E has "To a real attacker" in `strings` plus `debrief`; no tier S row (twins, ca00, ca17) has it;
- layer 1 parity for every non-stepAway full row with a fragment: the erb panel ends with "have a word with <host first name>." (the first word of the shell's host NPC `displayName`, read from the shell, not the row); the fragment panel has no "To a real attacker" and no "have a word with"; the twin's panel equals the fragment's; erb and fragment layer 1 share a run of eight or more words;
- `kit_<ep>_host_said` is declared exactly when the row's `hostLine` is true;
- `keyMessage` dependency (D13): for every tiered row, if the row's stub knot (`stub`, else `ep`) in any ambient person's `_ambient.ink`, the shell's host ink, or the twin's generated ink reads `kit_key_caught`, the row must carry a non-empty `keyMessage`; a row with that dependency and no `keyMessage` fails, naming the row and the file that reads the global;
- the D12 exemption and ca00 cases of 1.3: a shell whose kit has `pool: null` (with a non-empty `poolExempt`) or whose row has `convention: true` carries no kit chatter anywhere and is excused the capacity-2 source check; every kit NPC from Tarrowby, Quayholt or Carrholme carries a `thirst` need and a coordinate `needsHome`; every Quayholt and Carrholme shell has exactly one `kit_cooler` with a tile `position`, and only Quayholt's carries `chatter`;
- `QS:` parameterised over every `scenarios/_office_kit/ink/*_ambient.ink` (not only Gwen and Agnieszka): run each committed `.json` (compile freshness stays with the staleness test); `start` diverts on `kit_defend_done` and `kit_ep` for each episode for which the person has a knot in their own file; every person named in a row's `ambient` has a knot for that row's episode, except Chidi in ca17 (4.1); every knot reaches the sticky `+ [See you later.]` with `#exit_conversation`; no state-writing tag; every speaker prefix equals the kit `displayName`; the ca00 knots open directly.
New cases that name rows not yet in `episodes.json` pass vacuously until I adds the rows.

**I, integration, rows, splice and live proofs.** Model Sonnet; Haiku for the scripted live runs; opus55 only if a live failure needs engine diagnosis. Owns `AW/office_kits/episodes.json`; the spliced `scenario.json.erb` files after each H merge; all regenerated shell outputs; `T:` and `QS:` after P-TEST lands; the `GATE_D.md` join; `W2_LINES_ALL.md`; `W2_INTEGRATION.md`. `scripts/validate_social/awareness.rb` has two kit lints today (`kit_free_checks`, and a warning for stepAway without a `kit_defend_done` mapping); I adds none unless a test cannot cover a case. Live proofs (Haiku, :3005, fresh games via `new-game.rb`, one shell per case list, at most four shells per agent): one text-tier shell per company (ca02, ca04, ca05, ca07, ca11), ca00, ca17 and one twin per generator. Cases: staff leave home, use the source and sit, at all three new companies (D12); each kit global turns at its save; nothing reaches the learner with the kiosk open; after the result, the host's hub speaks the right CATCH, PARTIAL or MISS block once, and each colleague gives their episode knot; a reload after the result keeps both; the twin raises and lowers `kit_quiet` and concludes; in ca00 each colleague opens their hello knot, wherever they are, and nothing is spoken unprompted, at the cooler included; one check shell has no staff and no kit global in saved state; no synced key other than `kit_*` appears. Pass: every case, game ids logged in `W2_INTEGRATION.md`. Every other shell gets the scripted critical-path run (PLAN 12).

### 2.9 File ownership

| File or folder | Owner |
|---|---|
| `AW/proof5.py`, `AW/office_kit.py`, the five generators named in 2.3, `AW/test_office_kit.py` | P-GEN |
| `AW/office_kits/<company>.json`, `_office_kit/ink/<person>_ambient.*` | the kit package for that company (Brightwell, Merrin: P-SBM) |
| `AW/core00/ink/anjali_rao.ink` | P-X0 |
| full-shell erbs, host ink, `AW/e2` to `AW/e20` fragments, ca13 twin | P-H1, P-H2, P-H3 by episode, then I |
| `T:`, `QS:`, harness copy lists | P-TEST, then I |
| `episodes.json`, every regenerated or spliced shell, joined files | I |

## 3. Order, dependencies and integration

```
Stage 1 (parallel): P-GEN steps 1-4 | P-TEST | P-KT | P-KQ | P-KC | P-SBM | P-H1 | P-H2 | P-H3 | P-TW | P-X0
Stage 2: P-GEN step 5 (after P-TW lands; its own branch, merged by I at step 4)
Stage 3: I
```

- P-GEN step 1 lands before any other P-GEN step and before I starts. Every later change to a generator or `office_kit.py` is gated on `proof5.py`.
- H packages need no kit to write text; the host block's live behaviour waits for I's splice, which declares the kit globals.
- Gate D for a company passes before I splices any shell of that company.

**Integration steps (I):**

1. Merge P-GEN and P-TEST; run `proof5.py`.
2. Merge the kit packages, P-SBM and P-X0; run `proof5.py` (no new row yet: clean).
3. Edit `episodes.json`: append 35 rows (ca00, the 17 full shells, ca17 and the 16 generated twins) and amend the existing `ca13_ai_assistant_defend` row, so 36 shells = 35 new rows + the ca13 twin row (keep `handAuthored: true`; add tier and the kit fields). Fields as the ca12 rows: `id`, `handAuthored` where true, `tier`, `company`, `ep`, `ambient`, `setPiece: null`, `attack`, `stepAway: false`, `keyMessage` (every row but ca00, D13, from the H packages' keyMessage lists once checked), `hostLine`; ca00 as in 1.3. The 17 full-shell rows carry `handAuthored: true` (they are not generator output), as the ca01 and ca12 full rows do. Twins and ca17 get `tier: "S"`, `attack: false`. Add `convention` to the file's `_note` (true only for ca00: no triage set, staff start on the `stub` knot, no chatter, no host mappings, `kit_ep` the only kit global). Leave the `test_ca_office_kit` and other test rows as they are.
4. Merge P-H1 to P-H3, then the P-GEN step 5 branch.
5. Full regeneration with the `proof5.py` procedure run on the merged tree. This is the first run in which the twin rows exist and carry `keyMessage` and `hostLine`, so the generators write kit content for them here for the first time, and proof 5's no-`--kit` pass covers them from here on. Generated shells (ca00, ca17, the 16 generated twins) take the generator output; `--kit` must leave them unchanged. Hand-authored shells take the `--kit` output. Expected: only the 36 shells change, and in them only kit-owned places, layer text, host ink and twin ink; ca01, ca12, their twins and test shells match HEAD; the pin test passes. Copy back only those files.
6. Checks on the merged tree: `python3 AW/test_office_kit.py`; `python3 AW/test_apply_training_room.py`; `bin/test-js` on `test/js/social-awareness-*.test.mjs`, `QS:`, `test/js/validator-social-*.test.mjs`, `test/js/validator-office-life.test.mjs` and the payload-scan files (`grep -l payload test/js/social-*.test.mjs`); then the full `bin/test-js` with `BUNDLE_PATH` set; the validator on all 36 shells (0 `^ +ERROR` lines); dialoguelint `--json` on all 36 (no `error`); `ruby tools/check_mapping_index_drift.rb main`; rubocop on any touched Ruby.
7. Commit with explicit paths, then the live proofs of 2.8.
8. Join the lines files into `W2_LINES_ALL.md`; run npc-dialog-review (opus48) across the whole batch once more; send AC0 the voicing card (O2) with the list.
9. Merge main into the branch, re-run step 6 on that hash, and send the hash to AC0. Merge only the tested hash.

## 4. Line budget and the new-lines format

### 4.1 Budget per package (PLAN 14 allows wave 2 30 shared and 88 episode lines, 118 in all; with Carrholme's pool exemption wave 2 spends 25 shared and 88 episode lines, 113 in all)

| Package | Shared lines | Stub | Host | Twin | Total |
|---|---|---|---|---|---|
| P-KT | 12 (pool 3; Fatima, Chidi, Zainab 3 each) | 11 (ca02 2, ca06 2, ca09 2, ca15 2, ca17 1, ca20 2) | | | 23 |
| P-KQ | 12 (pool 3; Darren, Niamh, Anjali 3 each) | 14 (ca00 2, ca03 2, ca05 2, ca08 2, ca10 2, ca16 2, ca19 2) | | | 26 |
| P-KC | 1 (Yusuf's `start` line; 6 budgeted, 5 unspent, D12) | 1 (ca11) | | | 2 |
| P-SBM | 0 (Graham, Lorna, Delphine 3 each, 9, under the 1A/1B budget) | 10 (ca04, ca07, ca13, ca14, ca18, 2 each) | | | 10 |
| P-X0 | | | 1 (ca00 greeting) | | 1 |
| P-H1 | | | 8 (ca02 to ca05) | | 8 |
| P-H2 | | | 12 (ca06 to ca11) | | 12 |
| P-H3 | | | 14 (ca13 to ca16, ca18 to ca20) | 1 (ca13 twin) | 15 |
| P-TW | | | | 16 | 16 |
| **Total** | **25** | **36** | **35** | **17** | **113** |

A "line" is the plan's unit: one beat. Clips are counted separately: a stub knot branching on `kit_key_caught` is 2 clips (ca00 knots 1); a three-way host block is up to 5 clips for its 2 lines; a twin line is 2 clips (catch, miss). An inline conditional is one ink line. A package that goes over its line count stops and reports; going over the clip estimate is fine if the line count holds. The 5 unspent shared lines (KC) are not moved to another package.

Layer 0 and layer 1 are static debrief text, unvoiced, outside the line budget; each H package lists them as `written`.

### 4.2 New-lines format

Every lines file uses this table, one row per clip:

```
| id | file:line | speaker (full display name) | voice | line (exact text) | kind | voiced or written | branch |
|---|---|---|---|---|---|---|---|
| ca02-H1c | scenarios/ca02_cv_lures/ink/<host>.ink:31 | <host display name> | <VOICE_CAST name> | <text> | host | voiced | CATCH |
```

- `id`: `<ep>-<kind letter><n><branch letter>` (S stub, H host, P pool, I idle start, T twin, L layer).
- `kind`: shared-pool, shared-start, shared-chatter, stub, host, twin, layer0, layer1.
- `voiced or written`: `voiced` for every NPC line proposed for TTS; `written` for layer text and for twin lines unless O2 says otherwise.
- `branch`: CATCH, PARTIAL, MISS, close, catch, miss, praise, neutral, or blank.
- Under the table: counts by kind against 4.1, and the npc-dialog-review verdict (blockers, majors, minors) with its commit.

## 5. Risks and cut order

| Risk | Guard |
|---|---|
| A generator change leaks into a check shell or the annual | `proof5.py` before and after; pin test; check calls pass `'none'` |
| Layer 1 drifts between erb and fragment, or a debrief edit reaches a check | P-TEST parity case; `strings` and `debrief` only, never `triageSets`; pin test after every regeneration |
| A pool or stub speaks with the kiosk open | `requireGlobal` on every pool; ca00 has no pool; the I live case per company |
| The Tarrowby source does not bind to its prop, or a Quayholt or Carrholme cooler lands off its position | Gate D proof 11 before any splice; explicit position as the Tarrowby fallback |
| A cooler with no collision body is walked through, traps a walker or blocks the learner's path | Position from the free cells (D12); gate D proof 11 (KQ, KC); the needs and `kit_cooler` case in T |
| A stub or host line plays miss for everyone because `keyMessage` is missing | D13; the P-TEST `keyMessage` dependency case |
| A stub knot strands the learner or speaks under the wrong name | `QS:` over every stub |
| Host line names an ambient colleague, or two shells sound the same | Text search per shell; the whole-batch dialogue review in I step 8 |
| Agents trip the safety check on awareness text | opus48 for all such text; a classifier stop goes to an opus48 retry first |
| Context overflow in live agents | One shell per case list, at most four shells per Haiku agent, foreground runs |
| Timing creep | One sentence replaced per shell (D9); human timing runs after wave 2 |

**Cut order if time is short** (first to go first):

1. The Quayholt pool (staff keep the cooler, needs and stubs; saves 3 pool lines and 9 chatter lines).
2. The Tarrowby pool (the same; saves 3 pool lines and 9 chatter lines).
3. Kit staff in twins (twins keep layer 1 through the fragment and the twin host line).

Last to go: layers 0 and 1, host lines, kit staff in full episodes. Wave 2 carries no chains, so the wave 3 and 4 cuts do not apply.

## 6. Review plan

1. **This brief:** a Sonnet delta review against PLAN 4, 5, 6, 8, 11, 13, 14 and the code on main. Findings by blocker, major, minor; fix and re-review until zero blockers and majors, at most five rounds.
2. **After build:** an opus55 review of each package's commits (P-GEN with its `proof5.py` runs; P-TEST with a deliberately broken copy showing each new case fails; each kit package with its gate D verdicts; each H package with its lines file and validator output; P-TW and P-X0 with their lines files). Each review states blockers, majors and minors.
3. **Delta reviews** on Sonnet from round 4, until zero; after round 5, minors only.
4. **Dialogue:** npc-dialog-review (opus48) per package batch, then once across the whole batch in I step 8. Voicing waits for both and for the owner's yes via AC0.

## 7. Open owner calls (send to AC0 as one card; do not use AskUserQuestion)

- **O1 (D225). Duty wording in ca02, ca03, ca05, ca08 and ca11 layer 1.** The appendices carry ICO and notification wording for these five (APP1 ca02, ca03, ca05, ca08; APP2 ca11). The ca01 ruling removed one wrong claim (supplier bank details "not personal data, so likely not reportable"); CA12_BUILD part 3 generalised it to "no reportability or legal-duty claims", while PLAN 15 fixes an accurate wording. Recommendation: in these five shells only, where personal data exposure is the lesson, use the accurate UK GDPR wording (the organisation assesses without delay and, where it must report, tells the ICO within 72 hours; people are told where the risk to them is high), and state nothing about reportability anywhere else. Until answered, the H packages hold layer 1 text for those five shells (2.7); all other work proceeds.
- **O2 (D226). Voicing.** Wave 2 adds up to 25 shared and 88 episode lines, which become more clips than lines (4.1). Recommendation: one voicing card after the whole-batch dialogue review, covering stubs, host blocks and shared start, chatter and pool lines (pool lines voiced per speaker, as D210), and leaving twin host lines written and unvoiced, as D207 did for the ca01 and ca12 twins.

## Decisions from build review R1/R2 (20 Nov)
- R1 Minor 9: twin host CATCH/MISS blocks replay on every talk after the result (no host_said gate). Kept on purpose, matching the ca01 and ca12 twins.
- R1 M1: Delete counts as caught unless the kit row sets keyCaughtVerdicts (ca06, ca08, ca11, ca15, ca16, ca19). CATCH lines in episodes where Delete counts praise the outcome, never a specific button (ca03, ca07, ca13, ca19 reworded).
- R1 M5: the duty clauses are held out pending D225; verbatim in D225_HELD_WORDING.md. Two older legal mentions stay and go to the owner with D225: ca11 mistake text "one wrote to the regulator" (a consequence, not a duty) and the ca17 twin's Data Protection Act 2018 s.170 offence citation.
- R2 N1: the per-game seed applies to the chatter bag only; all other needs rolls keep the scenario-name seed.
