# m09 Digital Archaeology: implementation review, round 1

## 0. Verdict

**Pass: ready for playtest.** 0 blockers, 0 majors, 6 minors.

The build follows the contract closely. Every mapping in CONTRACT §5.5, §6.2, §7 and §15, and in S4 §4–§7, exists with the event, condition and `onceOnly` the design gives. Two small deviations are both improvements: the Recruiter's ring (c) has no `onceOnly` (harmless), and `alpha_annotations` goes through a latch. The closing card and credits match `texts/C_texts_and_credits.md` byte for byte. Every timed text matches `texts/`. Every S6 document line is in the right object. All 43 + 8 imports exist in their sources' `exportGlobals` with the same default, and so do the 12 exports. Every global the ink declares has the scenario's default. Every mapped `targetKnot` exists. Every event the mappings key on is emitted by the engine with the payload field the condition reads.

The minors are one wrong HaX line on the warned-in-time route, invisible sight cones, three undocumented stage 9 globals, one stale row in `texts/`, validator noise to sign off, and the stage 9 checks still to run.

## 1. What was checked, and how

- `ruby scripts/validate_scenario.rb scenarios/m09_digital_archaeology/scenario.json.erb`: ERB renders, schema passes, ink valid, geometry and door alignment OK. 14 objective-wiring warnings, 40 issues and suggestions and 6 missing-recommended fields, all triaged in §6. The run rewrote `dungeon_graph.*` with identical content (no git diff).
- The ERB was rendered to JSON in the scratchpad through the validator's own `render_erb_to_json`, with no VM context, which is the placeholder path. Every assertion below was scripted against that JSON:
  - each mapping against S4 §4–§7 and CONTRACT §5.5, §6.2, §7 and §15;
  - each `sendTimedMessage` string against `texts/A_hax_texts.md`, `B_recruiter_texts.md` and `C_texts_and_credits.md`, in both directions;
  - the closing card and credits as parsed JSON, compared with C7's two code blocks;
  - every quoted `text`, `observations` and variant string in S6 §1 (107 strings across 41 objects), and the reverse, every line of each built object's text against S6;
  - `importGlobals` against each source mission's rendered `exportGlobals` and `globalVariables` defaults;
  - every `VAR` in `ink/*.ink` against `globalVariables` and the imports, and every `#set_global` name, `#complete_task` / `#unlock_task` id and `targetKnot` against the scenario and the ink;
  - every asset path (sprite sheets, talk and viseme sheets, avatars, backgrounds, room types).
- Engine reads (cited inline): the event emitters, the mapping condition evaluator, the delayed-mapping and `onceOnly` logic, `onRead` emission, NPC `#give_item` delivery, F19's server permission, the RFID and password lock paths, `triggerOnInteract`, the sight-challenge config.
- Not run: browser tests, `reopencheck.mjs`, the F20 voiced walk (see m-06). No VM material was opened. `mission.json`'s `secgen` block was read only as far as the file's shape.

## 2. Findings: blocker

None.

## 3. Findings: major

None.

## 4. Findings: minor

**m-01. HaX's legacy-box line plays over an empty feed tray on the warned-in-time route.** `scenario.json.erb:307-308` sends "Nobody of ours in here. Ours are on her tape, by codename." on `legacy_box_read` with `globalVars.legacy_files_saved`. On `m05_found_pipeline_list && !m05_recruiter_deal_accepted`, HaX's `cage_opened` mapping sets `legacy_files_saved` (`:177-178`). `feed_table_box`'s first variant then reads "SERIES L. RECALLED. M.S." with the observation "The feed tray is empty. The last box never came up." (`:1714`, `:1720`). Reading it fires the remark about a box that isn't there and sets `legacy_remark_sent`, so the right remark on Noor's box (`:311-312`, keyed on `noor_box_read`) never plays. The object's own comment (`:1704`, "only while the sheets show") says this wasn't intended. **Fix:** split `:307` into two arms, `value === true && globalVars.legacy_files_saved && !globalVars.m05_found_pipeline_list && !globalVars.legacy_remark_sent` and the same with `globalVars.m05_recruiter_deal_accepted` in place of `!globalVars.m05_found_pipeline_list` (no `||`, CONTRACT §5).

**m-02. Neither sight cone is drawn.** Old Coyote's `los` (`scenario.json.erb:1142`) and Tran's (`:1293`) have no `"visualize": true`. The engine draws a cone only when `los.visualize === true` (`npc-manager.js:2246`, `rooms.js:3158`). scenario-design-review §2d″ wants a visible cone on a guard the player slips past. FA §3.1 (`m01_maya_ko`) calls both sightings "avoidable", and with no cone, avoiding them comes down to luck. m02, m03 and m07 set it on their stealth guards. **Fix:** add `"visualize": true` to Old Coyote's `los`. For Tran it matters less: he faces the only door of a 5×6 closet, so a cone shows the player what they already know. Add it there too for consistency, or leave it with a note.

**m-03. Three stage 9 globals and one changed latch aren't in the contract or S4.** `alpha_annotations_opened`, `noor_box_read` and `legacy_remark_sent` (`scenario.json.erb:2321`, `:2364`, `:2365`) are explained only in ERB comments (`:2266-2267`, `:1050`, `:2082`). The alpha change also departs from CONTRACT §5.1 and §5.3 and S4 §5's row ("`alpha_annotations.onRead` sets `alpha_annotations_read`"). `onRead` now sets `alpha_annotations_opened`. HaX promotes that to `alpha_annotations_read` only while the readable variant shows (`:285`). The change is right: `onRead` emits on every read (`interactions.js:1600-1617`), including the "Blank label stock." read before the identity scene, which would otherwise have exported a true m10 reads as "the player opened his notes". The next agent reading the contract needs to know. **Fix:** add the three globals and the latch change to CONTRACT §15's stage 9 list, and note them against S4 §5 for the arc-keeper.

**m-04. `texts/A_hax_texts.md:10` still lists A3-02 with a `door_unlock_failed` trigger.** The build dropped it in favour of A3-02b on `door_unlock_attempt` (`scenario.json.erb:136-143`; CONTRACT §15 m-03, "A3-02's failure trigger is replaced"). After the deck HaX opens the door, so A3-02 has no state left to fire in. **Fix:** mark the A3-02 row "superseded by A3-02b (stage 9)", so the next texts pass doesn't paste it back.

**m-05. Validator output to sign off or quieten.** None of these is a defect. Left as they are, they bury real warnings in later runs:
- Issues 1–9, "phone NPC event mapping with no visible effect", are HaX's nine `unlockDoor` mappings (render indices 9, 11, 12, 20–22, 57–59). `validate_scenario.rb` doesn't count `unlockDoor` as an effect, though F19 makes it one (`game.rb` `npc_mapping_unlocks_door?`). That is a validator fix for whoever owns the script, not this mission.
- Issue 26: `sorensen_office` has no `puzzle_graph_unlocks` source. The only one is on the `answer_the_offer` task (`:595`), which the check doesn't read. Sign off.
- Suggestions 10–15: the Reading's pages and the schedule in `director_safe` (`:1834`, `:1879`, `:1889`) are flagged as clues with no target. Add `"puzzle_graph_role": "evidence"` to `the_reading_2`, `_3`, `_4`, `the_reading_last_page` and `master_schedule` to match `the_reading`.
- Suggestions 38–40: `tran_ko`, `sorensen_ko` and `alpha_clip_played` are set and never read. Debrief and credits use `tran_outcome` and `sorensen_fate`, and CONTRACT §5.3's "`tran_ko` … credits" read never shipped in C7. Keep them as harmless KO latches and correct §5.3's reader column, or drop the two `globalVarOnKO`s.
- Ring (c) on the Recruiter (`:339`) has no `onceOnly`, where S4 §4 row 3 puts it on all three rings. Harmless: the call's defaults set `recruiter_call_started` before any line, so the condition closes at once. Note it, or add `once: true` for parity.

**m-06. Stage 9 checks from CONTRACT §10.2 and S4 §12.3 still to run.**
- `reopencheck.mjs`: m09 isn't in `scripts/ink_runtime_check/missions.json` as a mission yet; only m10's imports of it are there.
- The F20 walk of the voiced knots and the real voiced-line count. A grep here found no `Narrator:` line, no printed `{var}` and no divert to `start` or `support_hub` in `deck_resume`, `identity_scene`, `identity_resume`, `tesseract_call`, `call` or `resume_name`.
- `tagdiff.mjs` once a commit exists.
- The browser tests: a hit inside each forced scene, then open and close HaX's thread; reloads inside each scene; the hatch's reach; the `hax_voice` resolution test (S5 §3.1, which decides whether `hax_voice` stays); the hub's tap test at the north-west corner (ASSET_LIST §2).

Playtest folders `playtest_r1_a`–`_c` exist, so some of this may be under way. **Fix:** add m09 to `missions.json` and run the four.

## 5. Verified against the design (no finding)

Render indices are HaX's `eventMappings` (M*n*) and the Recruiter's (R*n*) in the rendered JSON.

- **S4 §4 rows 1–13.**
  - Stacks door: M9 `unlockDoor`, retry M11 (`door_unlock_attempt` with `cooldown: 0`), load backstop M12.
  - Cage: `cage_opened` from M17 (with the F-14 guard), M18 (`door_unlocked_by_npc` with `data.roomId`, which matches `npc-game-bridge.js:137`) and M19.
  - Victoria's route: M20–M22.
  - The Recruiter's call: rings (a)–(c) as R2–R4, with the two `in_cage` setters listed first with `cooldown: 0` (R0–R1), and HaX's load clear (M56).
  - Office: M57–M59.
  - Flags 3 and 4 and the scenes: M74–M86 and M93–M98, with every condition as S4 gives it, including the M9-15 owner-first text.
  - Purge: the `cage_bin` default with `!bin_chosen` (M25); the legacy clock (M31, M32); the KO save (M36); Noor's hold (M26); `ledger_page_seen` with `delayMs: 500` (M51); the trolley list's three strikes; the stamp's purge observation; "She's still feeding it." (M34).
- **Forced and voiced calls (CONTRACT §7, S4 §6).**
  - Every ring and re-ring for `call`, `resume_name`, `deck_resume`, `identity_scene`, `identity_resume` and `tesseract_call` has `voiced: true`, `disableClose: true` and a `targetKnot`.
  - `hour_read` and `hour_read_resume` are forced and unvoiced.
  - Re-rings carry `cooldown: 0`, and HaX's fire on `room_exited`, `game_loaded` and `conversation_closed:agent_0x99` (`delayMs: 500`).
  - Only re-ring 1 has `resume: true`. Re-rings 1–3 are disjoint.
  - The identity re-ring also fires on flag 4 (M81).
  - In the ink's voiced start knots: no `Narrator:`, no printed variable, and the only diverts go to `DONE` or the scene's own stitches.
- **Tasks.**
  - Every S4 §13 task is present with S4's title, type, target and status (`match_the_hand`, `stop_the_shredding`, `answer_the_offer`, `cross_reference_wren`, `hear_the_name`, `hear_the_mirror_job` and `send_the_notice` ship `locked`).
  - Each completer and unlocker exists: M2–M4, M10, M23, M24 (array `completeTask`, supported at `npc-manager.js:826`), M39–M45, M48–M50, M98, M99, `taskOnKO` on Noor, and the ink's `#complete_task` / `#unlock_task` ids. An `#unlock_task` only ever hits a `locked` task.
  - `open_plan_cabinet`'s biometric lock does emit `item_unlocked` (`unlock-system.js:355-357` calls `unlockTarget`, `:702`), so the validator's warning 1 is a false positive.
- **Strings.**
  - Closing card and credits equal C7's JSON blocks.
  - Every timed text equals its `texts/` row, except A3-02, which was dropped on purpose (m-04).
  - Every S6 §1 line sits in its object. The only strings S6 doesn't hold are CONTRACT §15's "Drop Terminal Screen", the safe's name "Floor Safe", and one-line observations on `noor_staff_card`, `tape_room_keycard` and `the_reading_2`–`_4`.
  - Office code `clerk-of-the-county` is written nowhere else (S6 §3.2).
  - The salvage decode checks out: `MSJMQAEGDZNVI` with key `BONEYARD` gives `LEWISANDCLARK`, and the Alpha line with `ALPHA` gives "Carry it yourself. Let it hurt afterwards."
- **State.**
  - Imports: 43 variables (FA §3.1 Tier 1 19, Tier 2 24) plus 8 `completed`. Each is in its source's `exportGlobals` with a matching default, and `m09_carryover_vars.ink` has the same 51 `VAR`s with the same defaults.
  - Exports: the 12 of FA §3.4 and CONTRACT §5.1.
  - Every contract §5.1 and §5.3 global is declared, with string defaults `sorensen_fate`/`tran_outcome` `"left"` and `""` elsewhere.
  - No ink `VAR` default differs from the scenario's. No `#set_global` names an undeclared global. No ink assigns an import. No ink-local shares a name with a global.
- **koImmune.**
  - On: `sorensen_hatch`, `sorensen_door`, `alpha_recording`, the briefing and debrief hosts, and the six hidden speakers.
  - Off, as designed: Noor, Old Coyote, Tran, Dillard and the caged Sorensen. Each has `globalVarOnKO`, and the debrief and credits branch on Noor, Old Coyote, Tran and Sorensen.
- **Gives and clones.**
  - Every `#give_item` id is in the speaker's `itemsHeld`; `sorensen_hatch` and `sorensen_door` both hold the three bin files.
  - `#clone_keycard` ids match `rfidCard.card_id` (`reading_staff_door`, `stacks_card`).
  - NPC notes gifts emit `item_picked_up:notes` with `itemId` (`npc-game-bridge.js:41-47`), so the `derek_file` remarks (M118–M121) fire.
  - The server allows a give only from an encountered NPC (`games_controller.rb:1785`). Room fetches record every NPC in the room (`:1538-1574`), hidden ones included.
- **Placeholders.**
  - Every sprite sheet, talk and viseme sheet, avatar, background and room type exists on disk.
  - `vm_object` and `flags_for_vm` fall back cleanly without a VM context.
  - Lab URLs, the missing SecGen file, deferred art (the hatch bins, trolley and feed-box sprite states) and lighting are all listed in ASSET_LIST §2–§4 and §7.
  - `mission.json` keeps the m08 shape plus a `_vm_wire` note. Its four `moralChoices` match the exports' values.

## 6. scenario-design-review

**Phase 1 (validator).** No ❌. Warnings and suggestions sort into three groups:
- **Intended:** `stacks_release` and `beta_crate` have no card or key (HaX's `unlockDoor` and the picks); several handlers share an event with `onceOnly` (each is a separate effect); `closing_debrief`, the clip and Old Coyote's challenge have no `onceOnly` (they replay by design); the salvage "two sources" (it's an AND, `puzzle_graph_and_with`).
- **Owed by a later pass:** cutscenes with no `background` and no `chatBackground` (POV pass); the six hidden speakers with "no behavior" (registered speakers, CONTRACT §1); phone contacts with no `timedMessages` (texts arrive by mapping).
- **Noise:** listed in m-05.

The dialogue lint has 6 advisory findings. The five `not-x-but-y` hits are contract-fixed lines, the villain allowance, or the briefing's "Not the bunker. Not yet." The `you-after-choice` hit is an allowed silence.

**2a Solvability. OK.**
- The critical path holds on both entry routes: dock, then the reading room by route A (picks, then Noor's card or clone through `staff_passage`) or route B (the open stacks). Then flag 1, HaX's door, the hatch (clone, print), the cage, the cabinet, flag 2, the call, HaX's office door, the safe (cracker or `060216`), the tape card, the legend plus the notepad line, the keypad, flags 3–4, the three scenes, "[Bring me in.]", the debrief.
- No circular dependency.
- Every first ring has a `room_entered` backstop and every door a retry plus a load backstop, so the SOFTLOCK_PATTERNS classes (burnt first-call gates, "said but not set", events that can't recur) are covered.
- VM wiring: four `submit_flags` tasks, each with `targetFlags` and `targetCount`; `flagRewards` use `set_global` (not `emit_event`).

**2b Clues. OK.** The coded line reaches the notepad on every route and is repeated on the screen. Its key sits beside the keypad. The PIN is on a page in the safe's room, with the cracker as the start-kit way. The H&L file number comes from flag 2, and the bay label makes the boxes findable in Act 1.

**2c Coverage. OK.** Key (picks), RFID ×3 (easy clone, hard clone, real card), biometric, PIN (cracker or page), password (decoded keypad, file-number box), four VM flags. These fit an archive raid.

**2c′ Field guides. OK.** Four guides, each offered on exposure (M4, M14, M73, M71/M72) and given only from the hub's `guides_menu`. The `labUrl`s point to pages not yet written; this is expected, since lab sheets come last (ASSET_LIST §7).

**2d Narrative. OK.** The briefing has `skipIfGlobal` and `setGlobalOnStart`. The debrief is a hidden person NPC opened from the hub, with a reload backstop keyed on `!report_done`. The win condition is the debrief's last line, then `concludeRequires`.

**2d″ Patrol guard. CONCERN (m-02).** Waypoints sit inside the 20×10 floor, the schema is current, and the cone is 120°/150 px. `visualize` is missing.

**2f Layout. OK.** No overlaps, doors aligned, no empty room. `staff_passage` has no objects, which is S5 §3.11's intent: it carries route A's lock.

**2g Objectives scaffolding. OK.**

| Aim | Required tasks | With in-world pointer | Dead-zone risk | Transition narrated |
|---|---|---|---|---|
| 1 `get_in` | 3 | 3 | low | `flag1_read` |
| 2 `restricted_series` | 5 (`match_the_hand` unlocks on the file) | 5 | low: the identity scene closes the hand | recognition, cabinet text |
| 3 `read_the_ledger` | 2 | 2 | low | the Recruiter's call |
| 4 `search_the_office` | 5 | 5 | none | the call's last lines |
| 5 `take_tomb_beta` | 6 | 6 | low | three scenes |
| 6 `report_in` | 1 | 1 | none | HaX's last line, hub topic 1 |

**2h KO resilience. OK.**

| Person NPC | Gates a required task or item? | `taskOnKO` | KO in debrief or credits | Verdict |
|---|---|---|---|---|
| `noor_haddad` | no (optional card; route B stays open) | `meet_the_clerk` | `noor_ko` (debrief, credits) | OK |
| `old_coyote` | no (his key drops; picks work) | n/a | `old_coyote_ko` | OK |
| `jesse_tran` | no | n/a | `tran_outcome = ko` via M43 | OK |
| `archive_guard` | no | n/a | `archive_guard_ko` (stops the re-show) | OK |
| `sorensen` (cage) | no | n/a | `sorensen_fate = ko` (M35); legacy save (M36) | OK |
| `sorensen_hatch`, `sorensen_door`, `alpha_recording`, hidden speakers | would gate the clone and the bin file | n/a | `koImmune` | OK |

**2i Recurring bugs.**
- **Spoilers:** none. Kowalczyk's name on the cracker is the designed double edge, and WREN appears in titles only after flag 2.
- **Status answers:** the ladder is ink. It was walked at stage 7 and stage 8, and walkthrough R1 m-04 added a row. Re-test in the browser (m-06).
- **Late first contact:** HaX's `start` routes by progress.
- **Credits against routes:** every person ends on an unconditional clause. "Saved from the bins: Derek Lawson's file." holds on the default route because of the `handover` knot and "[Walk past her.]".
- **Interaction reach:** placeholder maps have no hatch counter yet. Re-check after dressing.
- **Hub crowding:** handled at stage 8 (M-01).

## 7. mission-puzzle-chains: lock audit and silent-failure sweep

**Depth** (`room_depth.py`): dock 0; front desk and open stacks 1; reading room, closet and staff passage 2; restricted stacks 3; cage, office and tape room 4; salvage cage 5. No empty room.

**Boss-key audit.**

| Lock | Seen at | Key or code from | Verdict |
|---|---|---|---|
| `front_desk` (key) | dock, 0 | picks (start kit); Old Coyote's ring | ✅ by design |
| `staff_passage` (rfid) | front desk, 1 | Noor, same room | ❌ same-room, but it's the optional route A and the social step is the puzzle |
| `restricted_stacks` (rfid, HaX) | reading room, 2 | flag 1 at the same desk | ✅ the VM is the hunt |
| `restricted_cage` (rfid) | stacks, 3 | Sorensen at the hatch, same room | same-room by design: the clone across the counter is the scene |
| `plan_cabinet` (biometric) | cage, 4 | the stamp in the stacks, 3 | ✅ HaX's cabinet text sends the player back |
| `sorensen_office` (password, HaX) | stacks, 3 | the deck choice | ✅ boss-key |
| `director_safe` (pin) | office, 4 | cracker (kit) or the rent ledger, same room | ✅ by design (m02's capability) |
| `tape_room` (rfid) | stacks, 3 | the safe, 4 | ✅ boss-key |
| `salvage_cage` (password) | tape room, 4 | the line from flag 1 (2), plus the legend here | ✅ half earned early |
| `hl_box` (password) | open stacks, 1 | flag 2's file number | ✅ boss-key |
| `enrolment_crate` (key) | salvage, 5 | picks | ✅ optional |

**3a. Are the mission's own choices required? Yes.** The bin defaults and is handed over. The Recruiter's call is forced and locks the office until answered. The confession is forced and gates flag 4's read. The notice is asked at the debrief if still unsent. Each writes an export. `concludeRequires` holds only the four flags, as S4 §9 and the skill want.

**Silent-failure sweep (engine-checked).**
- **`item_picked_up` keyed on type, not id:** every such mapping uses `item_picked_up:notes` with `data.itemId` in the condition (M104–M107, M118–M121). The emitters supply `itemId` (`interactions.js:1612-1620`, `npc-game-bridge.js:41-47`). ✓
- **Suffixed events:** `door_unlock_failed:<room>` (`unlock-system.js:128-131`), `objective_task_completed:<id>` (`objectives-manager.js:440`), `npc_ko:<id>` (`npc-hostile.js:351`), `player_spotted:<id>` (`npc-sight-challenge.js:50`), `room_entered:<id>` (`rooms.js:2997`) and `conversation_closed:<id>` (`phone-chat-minigame.js:1123`; person-chat `:1754`) are all emitted. ✓
- **Payload fields:** `room_exited` carries `roomId` and `nextRoom` (`rooms.js:3011-3014`); `door_unlocked` and `door_unlock_attempt` carry `connectedRoom` (`unlock-system.js:115-121`, `:675-680`); `door_unlocked_by_npc` carries `roomId` (`npc-game-bridge.js:137-141`); `object_interacted` carries `objectType`, `objectName` and `roomId` (`interactions.js:693-697`), and the Torres condition's name equals `hl_box`'s. ✓
- **Condition syntax:** every condition uses forms `safeEvaluateCondition` supports (`npc-manager.js:16-118`): `&&` only, `!`, `===`/`!==`, quoted literals including `''`. `'Harwick & Lowe, Dead Files'` has a single `&`, so the `&&` split doesn't cut it. ✓
- **One-shot `onRead` latches:** `onRead` re-emits `global_variable_changed` on every read (`interactions.js:1600-1617`, `container-minigame.js:484-497`), and a delayed or conditional handler that fails its check doesn't spend `onceOnly` (`npc-manager.js:600-628`, `:777-784`). So `ledger_page_seen`, `reeves_sheet_read` and `alpha_annotations_read` all latch on the first read that meets the condition, even after an earlier read that didn't. ✓
- **Delayed rings during a minigame:** a due `delayMs` mapping waits while a minigame is open (`npc-manager.js:619-623`), so rings keyed on flags and keypads wait for the station or keypad to close, as S4 §6 assumed. ✓
- **F19 doors:** the server takes the mapping's `unlockDoor` as permission (`game.rb` `npc_mapping_unlocks_door?`), so HaX needs no `unlockable` list. ✓
- **`triggerOnInteract`** sets `alpha_deck_used` through `set_global` with `emitAlways` (`apply-actions.js:37-47`), so the clip replays. The deck's observation variant still shows on hover (`ui/info-label.js:94`). ✓
- **Cross-scenario hard-coded ids, author notes in visible text, a code in an `observations`, rename residue:** none found. No `[NOTE`/`[LORE`/TODO in player-visible strings. The only em dashes are in voice `style` prompts. ✓
- **Task completed by what it gates:** none. `talk_at_the_hatch` and `open_the_cage` both complete on `cage_opened`, which is correct for Victoria's route (S4 §3.2). ✓
