# m09 Digital Archaeology: Stage 8 review, round 1

## 0. Scope and method

Reviewer: stage 8 (Opus), read-only, 2026-10-21. Standards: `story_dev_prompts/08_scenario_review.md` with `.claude/skills/scenario-design-review` (the skill wins), and the parts of `mission-puzzle-chains` and `mission-alignment-plan` that can be judged before assembly.

Read: stage 0, S4 (`stage_4/objectives_tasks.md`), S5 (`stage_5/room_layout.md`), S6 (`stage_6/lore_fragments.md`) in full; stage 3 `moral_choices.md` ("MC") where a finding touched it; `scenarios/m09_digital_archaeology/CONTRACT.md` in full; every `.ink` in `ink/` and the three `texts/*.md`; FINALE_ARC ("FA") §3.3–3.4, §3.7, §5, §21. Stages 1–2 were spot-checked only: the contract and S4–S6 carry their decisions forward, and stage 7 settled the strings. No VM material was opened; flags are judged by story meaning.

Checked against code, not memory:
- All fifteen `.ink` files compile clean with `bin/inklecate` (compiled to a scratch folder; the compiled JSON matches the committed JSON byte for byte, so the ink and its builds are in step).
- `dialoguelint.mjs` on the folder: 0 errors; the five `not-x-but-y` warnings R1/R2 ruled to keep; one allowed `you-after-choice`.
- `inkcheck.js` on every entry knot in contract §1: no runtime errors, no runaways. `loopcheck.js` on HaX's `support_hub` with a mid-mission state: clean.
- An inkjs walk of HaX's `support_hub` at seeded states, counting choices (finding M-01).
- Both decodes re-run: `MSJMQAEGDZNVI` with `BONEYARD` gives `LEWISANDCLARK`; the Alpha line with `ALPHA` gives "Carry it yourself. Let it hurt afterwards."
- Engine reads: aim completion (`objectives-manager.js:838-851`: a `locked` non-optional task blocks its aim, so aim 3 can't close on flag 2 alone, and aim 5 can't close before the identity scene); mapping keys (`npc-manager.js:656-689`: `unlockTask`, `completeTask`, `unlockDoor`, `voiced` all exist); `item_picked_up` payloads from `#give_item` and containers carry `itemId` (`npc-game-bridge.js:40-46`, `container-minigame.js:503-509`), so A3's `data.itemId` texts work; door events (`unlock-system.js:121-131, 675-680`; `npc-game-bridge.js:137-141`); password lockout is per opening, not permanent (`password-minigame.js:539-552`); the validator's credential check (`validate_scenario.rb:1661-1673`); the music playlists exist (`music/music-config.js:78, 141`).
- Import values branched on in ink and S6 (`m01_final_choice`, `m03_victoria_fate`, `m03_danny_fate`, `m04_disclosure_choice`, `m05_final_choice`, `m07_team_assignment`, `m07_debrief_stance`, `m08_debrief_stance`) grepped against m01–m08: every value exists in its source. The source `exportGlobals` blocks were read: the missing names are all on FA §3.3's list of 58 JSON-only additions plus the two F5 ink changes, which stage 9 owes.

## 1. Verdict

**Fix first (light), then stage 9.** No blockers. The design is complete enough to assemble: every room, lock, code, task, aim, global, mapping, forced scene, text, card line and music cue stage 9 needs is written down somewhere, and the critical path is solvable on every import profile I traced, including cold starts and Victoria's route. Four majors. Three of them change ink or a design decision, which stage 9 shouldn't improvise while it is building JSON:

- **M-01** HaX's hub can show 14 choices in Act 3 (cap 10).
- **M-02** On the default route the player "saves" Derek's file without ever receiving or reading it, yet the credits, the Reading's margin bet and m10 all treat it as in their hands.
- **M-03** Sorensen's talk-down says the building falls quiet while the shredder's room ambient keeps playing.

The fourth (**M-04**, an asset manifest) can be stage 9's first step. Counts: **0 blockers, 4 majors, 15 minors.**

## 2. Findings

### 2.1 Blockers

None. Every lock on the critical path has a key the player can reach before it (S5 §4.2's boss-key table checks out against the ink and S6's codes), every forced scene has a done-flag, a re-ring and a first-ring backstop, and no person NPC whose knock-out could strand a required task is knock-out-able (`sorensen_hatch` and `sorensen_door` are `koImmune`; Noor has `taskOnKO` on an optional task; Old Coyote, Tran and the cage Sorensen hold nothing critical). The remaining risks are browser facts S5 already names with fallbacks (the hatch's static-sprite reach, the hatch bell).

### 2.2 Majors

**M-01. HaX's hub shows up to 14 choices in Act 3.** *Owner: contract §2.1 hub table, then A1; S4 §7.1's count.*
- Where: `ink/m09_phone_agent0x99.ink:585-739`; CONTRACT.md:121 ("Ten-choice cap … fold 3b and 13 behind a later gate"); S4 objectives_tasks.md:382 (claims the worst case is nine).
- Problem: an inkjs walk of `support_hub` with a reachable state (identity scene done, salvage open, flag 4 not in, the Reading found and not discussed, WREN not resolved, triple agent with the file held, the Alpha tapes decoded, two guides offered, `afterwards` closed early) shows **14** choices: "His notice. Send it. | Not yet. | About the name. | His annotation sheets, with the tapes. | I'm on his box. Where do I look? | Afterwards. | The Reading. | WREN. | Nightshade's file. | The box behind her. | The restricted series. | I need a field guide. | Where do I stand? | That's all for now." Even with the legacy topic gone (its clock has run by then), it is 13. Three causes. Topic 15, "[The restricted series.]" (L714), retires only when asked, so an Act 1 topic is still offered in Act 3. Topic 2 puts "[Not yet.]" (L614) in the hub as a row of its own, which reads oddly out of context and costs a slot. And S4's count assumed 3b and the hub copy of 7 wouldn't coexist with 8–10.
- Fix: retire topic 15 on `cage_opened`; make topic 2 one row, "[His notice.]", whose answer offers "[Send it.]" / "[Not yet.]"; retire topic 9 on `deck_choice_made` (the debrief and topic 1 already carry the unread boxes); then re-run the walk at the states in §4.4 and correct S4:382. `crowded-hub` with the scenario bound will fire on the current ink, so stage 9 can't close it with a lint run alone.

**M-02. The default bin "saves" Derek's file, but the player never gets it.** *Owner: MC §3.1 (the decision), S5 §3.6–3.7 and B3/B5 ink (the delivery), stage 9 (the mapping).*
- Where: MC moral_choices.md:70 ("A player who presses neither and opens the cage keeps Derek's file") and :86; S4 objectives_tasks.md:177 (`cage_opened` with `!bin_chosen` sets `cage_bin: derek_file`, nothing more); `ink/m09_sorensen_door.ink:12, 74` ("[Walk past her.]" sets nothing); `texts/C_texts_and_credits.md:88` ("Saved from the bins: Derek Lawson's file."); S6 lore_fragments.md:202 (the last page's margin bet, "right on `cage_bin = derek_file`"); FA §3.4 `cage_bin` row (m10's record answer, "You priced Derek Lawson before anyone hired him").
- Problem: `derek_file` reaches the notepad only through the two bin buttons (`#give_item:notes:derek_file`). A player who skips the hatch buttons, or walks past Sorensen on Victoria's route, gets `cage_bin = derek_file` and nothing to read. The bins are out of reach behind her (S5:141). That player's credits say the file was saved, the Reading's margin note tells them they did what he predicted, and m10 offers them a record answer quoting a page they never saw. Contract §8.2's rule ("A choice only quotes what the player has heard or done on this route") breaks in m10. Hub topic 11's "Two samples" already guards on `bin_chosen`, so the ink knows the gap is there.
- Fix (pick one, MC decides): (a) a short scene delivers it: on the hatch route, a second `sorensen_door` mapping on the first cage entry with `cage_opened && hatch_talked && !bin_chosen` opens a new knot where she hands over the file nearest her (one line, `#give_item:notes:derek_file`, no choice, because the other bin has already gone in); on Victoria's route "[Walk past her.]" gives `derek_file` the same way. The default then lands in the notepad on every route; or (b) a readable object at the cage's feed, `derek_file_copy`, shown by `textVariants` on `globalVars.cage_bin === 'derek_file' && !globalVars.bin_chosen`, whose `onRead` sets nothing new; or (c) make the default "neither saved" with a new `cage_bin` value and tell m10. (a) is the smallest and keeps the export's meaning.

**M-03. "The building is quiet" while the shredder keeps playing.** *Owner: B4 ink (one line), or the user (engine item).*
- Where: `ink/m09_sorensen_cage.ink:58` ("Narrator: The shredder runs down. For the first time tonight, the building is quiet."); S4 objectives_tasks.md:480 (a room `ambientSound` is fixed, so the shredder "can't fall silent when Sorensen is stopped"; "the narrator's line and HaX's carry the silence").
- Problem: the talk-down is the cage's payoff beat, and the line contradicts what the player hears at that moment, in that room. The knock-out route has the same gap without a line.
- Fix: either the engine item S4 §15 lists (an ambient sound keyed on a global, here `sorensen_fate !== 'left'`), which the user decides, or reword to something true with the sound still running: "She takes her hand off the feed. The shredder runs on, empty." Don't ship the current line without the engine change.

**M-04. The art and voice deliverables exist only in prose, spread over five documents.** *Owner: stage 9's build log (a manifest as its first step).*
- Where: S5 room_layout.md:466 (ten new room maps); :80 (the briefing's background, Task Force Null's room); S4 objectives_tasks.md:313 (the hangar background); S5:141 and S4:182 (`spriteVariants` for two bins on three `cage_bin` values, and trolleys in four states); S4:650 P14 (Dillard's sprite); CONTRACT.md:620 (voice-bible entries); FA §5 (L798: "New characters need sprites and the usual character pipeline at stage 9").
- Problem: `public/break_escape/assets/characters/` has art for HaX, Netherton, Nightshade, Gary and Torres, and none for Sorensen, Noor, Tran, Old Coyote, Dillard, Kowalczyk, Quintero, Malhotra, Arakawa, or Tesseract (the clip's speaker shows a portrait in person-chat). `assets/backgrounds/` has no hangar and no Task Force Null room. Nothing lists all of this in one place, with a placeholder for each, so stage 9 will either stall on missing files or ship mismatched placeholders silently.
- Fix: stage 9 opens with a manifest: every new character (sprite key, talk portrait, visemes, voice entry), every room map (type id, size, source map to start from), both cutscene backgrounds, every object needing variant art, each with the placeholder used meanwhile. Image generation waits for the user's go-ahead on scope (user rule; §5).

### 2.3 Minors

**m-01. Tran's "guard to your door" can be false, and may not happen at all.** *Owner: S5 §3.3, A3.*
`texts/A_hax_texts.md:17` sends "Tran's just sent the guard to your door." on the first close of HaX's thread after flag 1 on `m01_maya_ko`, and S5 room_layout.md:100 moves Old Coyote with a `patrolOverride` at the same point. Two gaps. The override mapping sits on Old Coyote in `open_stacks`, and a route-A player (front desk, staff door, reading room) may never have loaded that room, so per S4:28 his mapping doesn't hear flag 1. And if he is in his truck (`old_coyote_told`) or down (`old_coyote_ko`), the text describes a guard who isn't coming. Fix: add `!globalVars.old_coyote_told && !globalVars.old_coyote_ko` to A3-04 and to the override, and give the override a relay on `room_entered:open_stacks` with the same globals plus `flag1_submitted && m01_maya_ko`.

**m-02. Two status-ladder rows go stale.** *Owner: A1.*
`ink/m09_phone_agent0x99.ink:800-801`: with flag 3 in and the file not held, "[Where do I stand?]" still says "Flag three. Find out whose box that is." Add a row above it, `flag3_submitted and not nightshade_file_held`, naming the file and the cabinet. And L810-811 ("The plan cabinet takes her print.") doesn't say where the print is on the hatch route; the only pointers are A3-05's "She stamps everything." and Victoria's topic. Add "It's on her stamp, on the hatch shelf."

**m-03. `match_the_hand`'s title is on screen from flag 1.** *Owner: S4 §3.2 and §13.*
S4 objectives_tasks.md:87 and :580: the task ships `active` in aim 2, so at flag 1 the list reads "Compare the hand on Nightshade's file with the notebook scan in HaX's case file", before the player has found the file or knows it is in the building, and it hints at the teacher link the identity scene reveals. Ship it `locked`, unlocked by a HaX mapping on `nightshade_file_held` (A3-07's text announces it at the same moment). It can't block aim 2's completion, because the file is needed for the identity scene that closes it anyway.

**m-04. The hand comparison has nothing to look at.** *Owner: S6 §1.4 and §1.6.*
HaX's hints name a looped g and crossed sevens (`ink/m09_phone_agent0x99.ink:781, 784`), but the notebook scan and Nightshade's form are text notes (S6 lore_fragments.md:93-95, :124-126), and the file's observation already says "a sloping hand you have seen tonight". The "[Different hands.]" decoy has nothing to make it plausible, so the correlation is one click. Put the two features in each object's observations ("The g in 'again' loops back on itself. The 7 is crossed.", and the same for "Again" and "7 November" on the form), so the comparison is something the player does and HaX's hints point at something on the page.

**m-05. The Recruiter's re-ring 2 can't fire; route R5 tests nothing.** *Owner: S4 §6.1 and §12.2.*
`ink/m09_phone_recruiter.ink:152-157`: the five tags on "[Give me the name. Let the deck go.]" all attach to her naming line, so `recruiter_said_yes` and `sleeper_named` arrive in the same step. "Between yes and the name" (S4 objectives_tasks.md:278; R5 at :541) isn't a reachable state, and `resume_name` is dead in practice. Harmless: a close after the naming line is re-rung by HaX's `deck_resume`. Rewrite R5 to close the call after the naming line, before "[Leave it. Let it wipe.]", and expect re-ring 3. Keep `resume_name` as a guard.

**m-06. The last task reads like a place to walk to.** *Owner: S4 §3.6 and §13.*
"Report to Director Netherton at the airfield" (S4 objectives_tasks.md:143, :624) and the aim description (:137) name a location that isn't on the map; the only way in is HaX's "[Bring me in.]". Retitle: "Tell HaX to bring you in to Netherton".

**m-07. The Act 2 to 3 seam is three phone conversations back to back.** *Owner: S4 §6.6, a playtest call.*
On the common order (flag 2 submitted after the cage is open), HaX's `ledger_read` rings, the Recruiter's voiced call rings as it closes (S4:161, ring b), and `afterwards` rings 2.5 s after the deck choice (S4:326): about 35 lines with a handful of choices, before the player has taken a step. D-12 put `afterwards` there deliberately, and the writing earns it. Flag it for the first playtest; if testers skim, key `afterwards` on `office_entered` like the invoice (D-18).

**m-08. The briefing is at the top of its time budget.** *Owner: C1, S4 §11.*
An inkjs walk of `m09_briefing.ink` taking the first choice each time: every mission played, 53 lines, about 656 words, 21 lines before the first player input; cold start, 47 lines and 17 before input. At 150 words a minute that is 4.0–4.4 minutes of reading before TTS pauses; S4 objectives_tasks.md:488 budgets 4. Not a defect yet. Stage 9 times it with audio, and if it runs past 5 minutes, lowers the wall's `shorten` threshold (`m09_briefing.ink`, `the_wall`) first.

**m-09. S4 and S5 still carry two strings S6 replaced.** *Owner: the arc-keeper's fold.*
The stamp's purge line (S4:183 and S5:140, "Her stamp's warm. She's three boxes from the bins.", against S6:100, "DESTROYED, in red. The stamp is still warm. Three boxes left on her side of the counter.") and Noor's box base (S5:91 against S6:50). The contract's authority order (§0, L11) makes S6 win, so stage 9 copies every object string from S6 only.

**m-10. The contract's status ladder still lists a row the ink cut.** *Owner: contract §2.1.*
CONTRACT.md:125 keeps a `recruiter_call_started` row; A1 cut it (`ink/m09_phone_agent0x99.ink:788-789`, "Script edit R1 A-15") because `start`'s guards exit first, and §12 doesn't record the cut. Doc drift; record it.

**m-11. Dillard's knock-out global is claimed but doesn't exist.** *Owner: S6 §5, contract §5.3.*
S6 lore_fragments.md:464 says he "sets only `archive_guard`'s KO global, if the player drops him"; contract §5.3 lists no such global and nothing reads one. Either add `archive_guard_ko` (with a debrief or credit clause, e.g. under Tran's line) or delete the claim. His knock-out contradicts nothing as things stand.

**m-12. Whether the branch callers are phone contacts isn't decided.** *Owner: S5 §8.*
S5 room_layout.md:80 and :349 place `nightshade_phone`, `torres_phone` and `gary_phone` in `loading_dock` but say only of the Recruiter that she is outside the phone's `npcIds`. In `npcIds`, their contacts show on every save from the first minute (a spoiler on the triple-agent and turned branches, and dead contacts on the rest). Recommend m05's pattern for all three, as for the Recruiter.

**m-13. Two imports are read nowhere.** *Owner: the orchestrator (FA:2176 leaves it open).*
`m04_voltage_escaped` and `m07_team_redirected`. Drop both at stage 9 (44 to 42 imports); the include and FA §3.1 then lose a line each and no ink changes.

**m-14. HaX's dock call plays its Act 1 lines on any late first open.** *Owner: A1, S4 §12.*
`ink/m09_phone_agent0x99.ink:111-112` diverts to `dock` until `dock_heard` is set. Mapping M1 covers real players, but every F15 segment from S1 on (S4 §12.1) opens HaX for the first time mid-mission and hears "Shutter's his round." after flag 1, which will read as a bug in every seeded playtest. Guard the divert with `not flag1_submitted` (else set `dock_heard` and go to the hub), or seed `dock_heard=true` in every segment.

**m-15. The credential lesson has no in-game echo before flag 3.** *Owner: the lab-sheet stage; optionally S6.*
Stage 0 (L178) leaves "in-game challenges teach skills the VM needs" partly open, and the gap is sharpest at flag 3: the AAA lesson (a leaver's credential nobody revoked) is met only on the VM. The mission already has the echo in play: Victoria's maintenance code is a credential Sorensen never changed, and the tape-room card in a safe is access kept by a person rather than a system. One line of HaX's, or the lab sheet's concept section, can draw the line from the gate to the box. No ink change needed for stage 9.

## 3. What holds up

Short, so the fix round knows what not to touch.

- **Completeness.** Rooms, sizes and connections (S5 §2), every object with its id, type and final strings (S6 §1), every lock and code (S6 §3.2), six aims with every task's type and trigger (S4 §3, §13), the globals in three legs (contract §5), the mappings (S4 §4–§6, contract §6.2, A3/B9/C7), the forced scenes (S4 §6, contract §7), the hub (contract §2.1), the music cues (S4 §10), the card and credits (C7). Stage 9 has to invent wiring only where §4 below says so.
- **Consistency.** Ids, tags and globals agree across S4, S5, S6, the contract and the ink: every `#set_global` name in the ink is in contract §5; every `#give_item` names an item S5 puts in that speaker's `itemsHeld`; every `#complete_task` and `#unlock_task` names an S4 task; both codes decode; the PIN, file number and keypad input match on every object that carries them.
- **Lock order.** The night runs in one order on locks and done-flags, not on aims (S4 §4), with retries and backstops on every door that opens on a mapping. The salvage code's key hangs beside its keypad and the coded line is in the notepad from flag 1, so Act 3 has no long walk back. Kit is cumulative and every tool gets a real use (S5 §5).
- **Next step.** Each aim's handoff is a spoken line; the status ladder names the next step at every stage but the two rows in m-02; door refusals say why.
- **Carry-over.** Imports change who rings (Nightshade, Torres, Gary, the Recruiter's three openings), who helps (Noor's three forms, Victoria's code), what the wall and the identity scene say, what the Reading has written about the player, and what the ledger shows. Every branch has a default that plays as a whole story, and the never-played rule is applied (e.g. the wall's `shorten`, the Reading's cold base).
- **Choices.** Five forced for every player, each priced aloud before the button, each read back once (`afterwards`, the debrief, the credits) and exported.
- **Education.** Coordinated disclosure is the one permitted lecture and is earned by a real decision (the notice); RFID goes easy then hard; Vigenère is taught once on the critical path and repeated as a bonus; the insider-threat material is shown in costed ledgers and a recruited clerk, never explained.

## 4. Stage 9 checklist

FA §21 "Stage 9 handover" (FINALE_ARC.md:2180-2203) is the base list; this section adds the expected result for each and the checks it doesn't name.

### 4.1 Validator

`ruby scripts/validate_scenario.rb scenarios/m09_digital_archaeology/scenario.json.erb`. Expected:

| Check | Expected result |
|---|---|
| ❌ INVALID | none |
| Geometry | "Room layout geometry OK" (S5 §2 found no overlap on a stub) |
| Credential check (`validate_scenario.rb:1661-1673`) | exactly one ⚠️: "a lock requires rfid 'stacks_release', but no item declares…". *Stage 9 note (walkthrough R1 m-07): a second, also expected: `beta_crate`, the salvage crate, lockpick only by design.* Expected: HaX's `unlockDoor` opens it. Leave a `_comment` on the door saying so. Any other credential warning is a real fault (`reading_staff_door`, `stacks_card`, `tape_room_reader` and `dock_office_door` each have an item: `noor_staff_card`, the cage Sorensen's card, `tape_room_keycard`, Old Coyote's key) |
| `submit_flags` | four tasks, each with station-qualified `targetFlags` and `targetCount: 1` |
| `concludeRequires` | the four flag tasks only; no import in it or in any `unlockCondition` |
| `unlockDoor` rooms | `restricted_stacks`, `restricted_cage`, `sorensen_office` all exist |
| Speaker prefixes | every prefix in contract §8.3 resolves to a `displayName`, character for character, including `Agent 0x2D 'Anchor'`, `Agent 0x5E 'Lantern'` and `Dr Adrian Tesseract (recording)` |
| `#set_global` / `VAR` | every set global declared in `globalVariables`; ink defaults match (`sorensen_fate` and `tran_outcome` default `"left"`, strings `""`, bools `false`); ink-locals (`hub_quiet`, `said_floor_line`, `confession_heard`, `notice_sent_here` …) reported as locals, not globals |
| `#give_item` vs `itemsHeld` | `agent_0x99`: four `lab-workstation` guides and `catalogue_salvage_line`; `noor_haddad`: `noor_staff_card`; `sorensen_hatch` and `sorensen_door`: `derek_file`, `letters`, `nightshade_copy` |
| Imports | 52 in `importGlobals` (50 if m-13 drops two), each read through the `INCLUDE`, none assigned. *Stage 9 note (walkthrough R1 m-13): 51 = 43 + 8 `completed`, after ruling 17 dropped two and BP F-03 added `m06_assets_seized`.* |
| KO resilience | no critical-path warning; one side-objective suggestion for `meet_the_clerk` (covered by `taskOnKO`) |
| Item types | every new object `type` has a sprite under `assets/objects/` (`validate_scenario.rb:1748`), or the manifest (M-04) names its placeholder |
| Source missions | after the 58 JSON-only export additions and the two F5 ink changes (FA §3.3), the validator on each m01–m08 erb is as clean as before |

### 4.2 Doors, layout and the dungeon graph

| Tool | Expected result |
|---|---|
| `python3 scripts/check_door_alignment.py <erb>` | all ten connections OK (S5:63 passed on a stub) |
| `python3 scripts/predict_door_sides.py <erb>` | every N/S door on the **west** corner; every E/W door 2.5 tiles down; `restricted_stacks`' east wall free below the gate for the hatch counter (S5:63-66) |
| `python3 scripts/room_gen/check_room_walls.py --scenario <erb>` | 64 px north wall on all ten maps |
| `python3 scripts/room_gen/slot_audit.py` | every interactable a tile from the next; the 2×1 salvage cage's five objects clear of its side walls (S5:192) |
| `.claude/skills/mission-puzzle-chains/scripts/room_depth.py` | dock 0; front desk, open stacks 1; reading room, closet 2; restricted stacks 3; cage, office, tape room 4; salvage cage 5 (S5:242). Any other depth means a connection is wrong |
| Dungeon graph (`break-escape-dungeon-graph`) | four mandatory flag nodes; the start kit (picks, cloner, print kit, CyberChef, PIN cracker) as source nodes; launcher → station → VM chain for both stations; the stacks door, the office and the Victoria gate drawn as opened by HaX's mappings (needs `puzzle_graph_*` annotations, since the graph can't see `unlockDoor`); no backwards edge out of a locked room; critical path dock → reading room → restricted stacks → cage → (call) → office → tape room → salvage cage |
| Tap test (S5:66, :434) | in the hub's north-west corner, a tap opens the door tapped (tape room vs office); if not, hang the office off the reading room as S5 says |

### 4.3 Walkthrough

Run `walkthrough-scenario` on the built file and reconcile it with the dungeon graph. The critical path it should produce, cold start, route B, with the state each step must leave:

| # | Action | Expected |
|---|---|---|
| 1 | Load | briefing plays (`briefing_played`), `cutscene` music; closes to `noir`; HaX's `dock` call 2 s later (M1) |
| 2 | Shutter into the open stacks | `get_inside` done; Old Coyote's challenge on sight, any cover passes |
| 3 | West into the reading room; use `field_laptop` | `set_up_drop_terminal` done; catalogue guide offer text |
| 4 | Flag 1 at `drop_terminal` | aims 2 and 3 open; `flag1_read` rings; `catalogue_salvage_line` in the notepad; the stacks door unlocked by `unlockDoor` |
| 5 | North into the restricted stacks | `enter_restricted_stacks`, `stacks_entered` |
| 6 | Talk at the hatch; "[What's in tonight's run?]"; a bin button | `hatch_talked`, `talk_at_the_hatch` done; RFID minigame clones `stacks_card`; file in the notepad; `cage_bin`, `bin_chosen` |
| 7 | Lift the print off `sorensen_stamp` | print in the kit |
| 8 | Cloned card at the gate | `cage_opened`, `open_the_cage` done; hatch Sorensen hidden, cage Sorensen shown; A3-05 and A3-06 texts; `stop_the_shredding` unlocked |
| 9 | Print at `plan_cabinet`; take `nightshade_file` | `open_plan_cabinet` done; `nightshade_file_held`; `legacy_clock_run`; A3-07 |
| 10 | Read `notebook_scan`; hub "[The hand on his file.]" → "[Same hand.]" | `match_the_hand` done; aim 2 complete |
| 11 | Flag 2 at the drop terminal | `ledger_read` rings; `ledger_read_heard`; `cross_reference_wren` unlocked |
| 12 | Leave the cage (if inside) / any room entry | the Recruiter's voiced call; deck choice; `deck_choice_made`, `answer_the_offer` done; aims 4 and 5 open; office unlocked; `afterwards` 2.5 s later |
| 13 | West into Sorensen's office; open the safe (`060216` or the cracker) | `enter_office`, `open_the_safe`; the Reading pages, schedule and card collected; `take_the_reading`, `take_tape_room_card`; `lease_file` → `find_the_deed` |
| 14 | Card at the tape room door | `enter_tape_room`; `tape_room_entered` |
| 15 | Try the keypad; decode the notepad line with the legend's `BONEYARD` | `salvage_keypad_seen`; archive-code guide offer (or Gary); `LEWISANDCLARK` opens it; `open_salvage_cage`, `salvage_opened`; Tomb Beta guide offer |
| 16 | Flag 3 at `tomb_beta_station` | `submit_owner_flag`; identity scene rings, voiced; answer → `hear_the_name`, `send_the_notice` unlocked |
| 17 | Flag 4 | `hour_read` (text); Tesseract's call, voiced, `silence` music; `hear_the_mirror_job`; aim 5 complete; aim 6 open |
| 18 | HaX hub "[Bring me in.]" | `debrief_notice_before` copied; `start_debrief`; debrief opens, `cutscene` music |
| 19 | Debrief to the pen | `report_to_netherton`, `report_done`; mission concludes; `victory`, five card lines, credits |

Also walk route A (picks, Noor's card cloned, staff door) and Victoria's route (topic 14 → `maintenance_code_used` → gate → `sorensen_door` scene) to the cage, and confirm the graph shows both as alternatives to route B and the hatch clone.

### 4.4 Ink checks that need the scenario

| Check | Expected result |
|---|---|
| `dialoguelint.mjs scenarios/m09_digital_archaeology/` with the scenario bound | 0 errors; the five ruled `not-x-but-y` warnings only; phone rules now run on A1, B1, C3–C5 (no phone line over 25 words, no self-prefix); timed texts linted. `crowded-hub` fires on A1 until M-01 lands |
| Seeded hub count (inkjs or `crowded-hub`) after M-01 | at most ten choices at: just after the deck (`deck_choice_made`, flag 2, cage open, file held, triple agent, `afterwards` closed early, the Reading found); and just after the identity scene (§2.2 M-01's state) |
| `reopencheck.mjs scripts/ink_runtime_check/missions.json` with m09 added | every phone contact reopens cleanly after `#exit_conversation` / `-> DONE`; HaX lands on `start` and its guards run |
| F20 walk (TTS line extractor) | voiced knots exactly `recruiter` → `call`, `resume_name`; `agent_0x99` → `deck_resume`, `identity_scene`, `identity_resume`, `tesseract_call`; nothing reachable from `support_hub` or `start`; counts near contract §14 (HaX's calls 55 distinct, Recruiter 14, HaX in her call 17) |
| `voicelines.mjs` on A1 and B1 | no printed variable and no `Narrator:` in a voiced knot |
| `tagdiff.mjs` | baseline set at the first commit of the ink; run on every later rewrite (M-01–M-03 included) |
| Re-ring with `afterwards_heard` false and no echo (FA:2199) | the identity scene's answer offers two buttons and loses nothing |

### 4.5 Browser checks

S4 §12.3 and S5 §11 (room_layout.md:427-444) are the base set; the routes are S4 §12.2's R1–R12, with R5 rewritten as in m-05. Add these, each with its expected result:

- **The hatch.** From a tile at the counter, `sorensen_hatch` can be talked to, "[What's in tonight's run?]" starts the RFID clone of a MIFARE custom-keys card, and the stamp is within reach. If not: the hatch bell (S5:134).
- **`flag1_read` closed early.** Close HaX's thread at its first choice, reopen: the choice comes back and the notes item `catalogue_salvage_line` still arrives (it sits on the knot's last line, A1:170). If the reopen lands on `start` instead, move the `#give_item` to the knot's first line.
- **Route A after flag 1 on `m01_maya_ko`** (the open stacks never entered): Old Coyote's override and A3-04 behave as m-01's fix says; with `old_coyote_told`, no text.
- **Default bin** (after M-02): open the gate without pressing a bin, on the hatch route and on Victoria's; `derek_file` reaches the notepad both times; the credits' "Saved from the bins: Derek Lawson's file." is true.
- **Shredder** (after M-03): talk Sorensen down and knock her out on two runs; what the player hears matches the narrator.
- **Two launchers, one VM:** `field_laptop` and `field_kit_link` open the same session; flags 3–4 are refused at `drop_terminal` and accepted at `tomb_beta_station`.
- **Branch callers** (m-12): with every import default, the phone lists HaX only; on the triple-agent, turned and protected branches the calls ring without a contact having shown first.
- **`hax_voice`:** HaX's lines in the clip and the debrief play in her voice with and without `hax_voice` registered; drop it if the phone contact resolves (S5:80).
- **Three Sorensen records** share one voice and one portrait; a prefix `Margaret Sorensen:` resolves to the same voice from all three hosts.
- **Hyphenated password:** `HL2015-0477` can be typed into the password pad (no shipped password has a hyphen yet).
- **Seeded segments** (m-14): HaX's first open in S1–S7 doesn't play the dock call.
- **Published length:** time R1 and R2 end to end, VM included, against S4 §11's 85 (76 critical path).

## 5. For the user

VM questions are put in story terms; the answers belong with the opus48 VM pass.

1. **Can Tomb Beta's server be reached from the reading room's laptop in Act 1?** Both launchers open the same attack VM (S5 §9). If the VM network lets the player work on Tomb Beta's server before the story sends them there, a quick player could read the owner's credential (the Architect's name) before the identity scene. The stations still hold submission order, but they can't stop the reading. Should the VM keep that server out of reach until later, or is an early peek acceptable?
2. **The VM's system names and flag numbering.** S4:32 assumes each machine numbers its own flags from 1 (story flag 3 = Tomb Beta's first flag). Stage 9 needs the built VM to confirm this and to fill `vm_object` and `flags_for_vm`.
3. **The timed VM run** (FA §13 item 45; S4 §11's 7 minutes a flag is an assumption) decides whether the published length is about 85 minutes or nearer 97.
4. **VM-STEER comments in HaX's ink** (`ink/m09_phone_agent0x99.ink:312-316, 634, 637, 697, 840`) quote the VM plan's specifics in comments. Players never see them, but every Opus agent that opens the file does. Given the safeguard history, do you want them cut to a pointer ("see the VM plan, flag N") before stage 9 and the fix round?
5. **The shredder** (M-03): a small engine change (a room's ambient sound switched by a global), or a reworded line? The engine change would also let the knock-out route fall silent.
6. **The default bin** (M-02): which of the three fixes, or is "kept but never read" acceptable for m10's record answer?
7. **Art and voice scope** (M-04): ten new characters (Sorensen, Noor, Tran, Old Coyote, Dillard, the four raid officers, and a Tesseract portrait m10 will need anyway), ten room maps, two cutscene backgrounds (Task Force Null's room, the hangar) and a handful of object variants. Your rule is to confirm scope and cost before generating; stage 9 can build on placeholders until you do.
8. **Field-guide links.** The four guides need a `labUrl`; lab sheets are written last. Ship placeholder URLs, or hold the guides' links until the lab-sheet stage?
9. **Two unread imports** (m-13): drop them?
