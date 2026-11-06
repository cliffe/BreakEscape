# m10 Full Disclosure: walkthrough, round 1

Static trace (walkthrough-scenario skill), 2026-10-21. Read: `scenario.json.erb` (rendered to JSON with the validator's binding, no VM context), the ink for Netherton, HaX's phone, Tesseract, Ghost, Nightshade, Wendell, Voltage, Vance, Fonoti, Kowalczyk (routing), 06:00, the hearing and the Citadel, and the engine code for objectives, conclusion and credits. VM material not opened; flags 1–4 treated as given.

**Not finished in this round:** two parallel audits (every mapping's event and payload fields against the engine, `onceOnly` across reloads; the raid team's lines after each ending and every knock-out, including Kowalczyk's) were still running when this report was written. Their results are not in here. Run them before R2.

## Verdict

**Completable, fix two majors first.** No blockers found. Every lock has a reachable opener, every required task has a trigger, and all six endings and the four whodunit routes reach `close_the_night` and the credits. Join is three deliberate picks, each with a warning and a way back, and nothing else sets `ending = "joined"`. The stage 8 R1 fixes I checked are all in (§5).

Counts: 0 blockers, 2 majors, 5 minors.

## 1. Validator

`ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb`: schema passes, 0 invalid, 128 warnings and suggestions, critical path Breach → Below Ground → Cut → Release → Core → End It.

- Five "nothing can open it" warnings (four story doors, fitter's locker): intended, as the erb header says.
- 43 person-chat cutscenes without `background` or `onceOnly`: by design. Each is guarded by a done-global (`!split_started`, `!closing_done`, `!core_greeted`).
- 23 "condition on an import changes the game (setVisible)": each has a default occupant on a cold start (checked: Wendell, Vos, Asante, Imran, Kowalczyk, Nightshade in the van).
- 32 phone mappings "with no visible effect": these are HaX's `unlockDoor` and `bark` mappings. False positives.
- Three bark/topic echo warnings (HaX's door-log texts repeat the first line of her `door_log` topic). The topic is the fallback for a player who missed the texts, so the echo only shows on that path. Minor; no change needed.
- Toast-stacking warnings on `six_done` (Ghost) and `room_entered:blast_tunnel` (HaX): the paired conditions exclude each other (`ghost_answer` set vs `''`; `m08_nightshade_triple_agent` vs `m08_nightshade_arrested`). False positives.
- "Two items point to gallery": the flag 2 + flag 3 AND gate. Intended.

## 2. Critical path (cold start)

**Breach the perimeter** [active at start]
1. Forward post: briefing opens on `game_loaded` → `take_the_briefing` (tag at the top), `briefing_played`. The aside follows → `aside_done` → `whodunit_open`, aim "Find the Sleeper" unlocks.
2. HaX: "Nightshade's in the van. Netherton has a question about him." (silent branch) → talk to Netherton → tether choice → `door_scene_done` → `settle_the_table`.
3. Click the gate console → `gate_console_used`, `guide1_offered`. With `door_scene_done` this fires Netherton's `split_line` → `split_started`, clock `t0200`, then Arakawa's call (`arakawa_gate`) → `arakawa_call_done`.
4. Flag 1 at the gate terminal → `flag1_submitted` → `pair_back` → HaX opens the blast door → `breach_open`, `breach_call`.
5. Into the tunnel → `go_through_the_blast_door`. Aim completes.

**Get below ground**
6. Tunnel: the inner door opens on entry (no tripwire on a cold start) → `security_office` → `reach_security_office`.
7. Duty handset → Ghost's call (stranger branch, `selling`) → the last choice sets `ghost_call_done` → `answer_the_handset`; HaX opens the stair.
8. Stair → `take_the_stair_down`.

**Cut the gallery's power**
9. Workshop: casualty sheet and margin (optional). Power room door: Imran's card cloned or talked open, or the fitter's locker picked for the spare card.
10. Power room → `reach_power_room`. Wendell: told → he cuts it; worked round or closed → `cut_by_hand` → HaX's `cut_call` → `gallery_shutter_cut` → `cut_the_shutter`.

**Find the release**
11. Server hall → `reach_server_hall`. Flag 2 at the release console, flag 3 at the hatch. HaX opens the gallery stair once flags 2 and 3 and the cut are all in.
12. Release console controls (optional) → `use_the_console` / `close_the_backdoor`.

**Reach the core**
13. Gallery → `cross_the_gallery`; HaX jammed. Outer lock 6083 by the cracker (dusted plate), Fonoti's card, Vos's card, Ghost's code or Victoria → `outer_lock_open` → `head_start_out` (four arms cover every share state) → `open_the_outer_lock`.
14. Core: Tesseract's arrival → `core_greeted`. Flag 4 → `flag4_submitted` → his conversation reopens → flag 4 lines, the case, three exchanges → `exchange_3` → `hear_him_out`.

**End it**
15. Console → `console_choice` → `decide_the_console`; WREN beat if she is free; database → `decide_the_database`; his end → `ending` → `decide_his_end`; Tesseract hidden on close.
16. Closing scene (06:00, the hearing after 06:00 on scorched, or the Citadel on Join) → `closing_done`, `close_the_night` → the conclusion, then the card and credits from the music entry on `conversation_closed`.

## 3. Endings and routes

| Route | Reached by | Close | Result |
|---|---|---|---|
| Arrest | standing "[No deal. You're under arrest.]" or seated arrest → "[Hold fire.]" | six_oclock → van → the_rest | ✅ |
| Surrender | standing menu, two points or more (three rebuttals offered on a cold start) | six_oclock → van → the_rest | ✅ |
| Lethal | seated arrest → "[Fire.]" | six_oclock, no van | ✅ |
| Executed | "[Shoot him…]" → warning → "[Do it.]" | six_oclock `executed` → `executed_close` | ✅ |
| Scorched | database "[Wipe both.]" | six_oclock → `scorched_close` sets `six_done` → the hearing | ✅ |
| Joined | console → join 1 → join 2 → join 3 "[Yes. Publish it.]" | Citadel; credits "MISSION FAILED" | ✅ |
| Rich save | the imports change occupants (Voltage cuts, Vance/Elena voices, Victoria opens the core, Mercer for Asante, Vector's code); every gate keeps a default route | as above | ✅ (traced) |
| WREN named | HaX "[I know who WREN is.]" or face to face → `accused`, `name_the_sleeper` | 06:00 lines | ✅ |
| WREN taken | `whodunit_live` false on load, van copy, no aim | as above | ✅ |
| Double-crossed | waits at the core → `double_cross_open` → `wren_at_core` | as above | ✅ |
| Unsolved | WREN beat at the console; `wren_at_core` → `name_the_sleeper` | HaX's line at 06:00 | ✅ |
| Kowalczyk knocked out | `kowalczyk_ko` skips the WREN beat; 06:00 has her line | — | ⏳ audit pending |
| Reload mid-Tesseract | `start` → `core_router` by globals; join resumes at `join_step` | — | ✅ |
| Reload after the ending | six_oclock / hearing / Citadel `game_loaded` backstops | — | ✅ |
| Reload mid-briefing | no backstop | — | ⚠️ m-1 |

Every closing arm sets `six_done`/`closing_done` and completes `close_the_night`. The concluding aim's four tasks all complete on every ending (Join sets `console_choice`, `database_outcome` and `ending` in one pick).

Out-of-order act 2 (flags 2 and 3 before the cut): the release aim is shown early and completes; when the cut later unlocks it, `unlockAim` leaves a completed aim alone (`objectives-manager.js:791-811`). No regression.

## 4. Findings

### Blockers

None.

### Majors

**M-1. Flag 1 without a click on the gate console strands the breach.** `split_line` (erb:1341-1344) and its `door_unlock_failed` backstop both need `gate_console_used`, and only a click on the vm-launcher sets it (erb:1431). A Hacktivity player with the VM already open in another tab can submit flag 1 at the gate terminal without touching the console. The split, Arakawa's call and `pair_back` then never happen, and the blast door stays shut. The pointers mislead: the door bark says "Arakawa's still on the phone" (erb mapping [65]) and "[Where are we?]" says "Quintero's on her way back." (`m10_phone_agent0x99.ink:117`). Clicking the console recovers it, but nothing says to. This is the same pattern as m09 WALKTHROUGH_R1 M-01, but here it gates the critical path. *Fix:* set `gate_console_used` on `flag_1_in` / `global_variable_changed:flag1_submitted` (HaX mapping beside erb:1431), or add a `split_line` mapping on `flag1_submitted && door_scene_done && !split_started`.

**M-2. The credits screen opens over the last line of every closing scene.** `close_the_night` is the last task of the conclusion aim. The server concludes on it, and `handleMissionConcluded` opens `BondVisualiser` straight away with no credits (`objectives-manager.js:567-569, 1059-1083`; full-screen overlay, z-index 99999). The tags sit above the final line: `m10_six_oclock.ink:451-465, 524-526`, `m10_hearing.ink:49-50`, `m10_citadel.ink:21-22`. So HaX's last word ("There'll be a board…", "He asked who taught you…"), the hearing's last line and Netherton's "Find 0x00" play under an empty visualiser. The card and credits only arrive once the player closes the overlay and finishes the chat (the music entries trigger on `conversation_closed`). This is PASS2 lesson 46. *Fix:* complete `close_the_night` from a HaX mapping on `conversation_closed:six_oclock|hearing|citadel` with `closing_done === true` (keep `#set_global:closing_done` in the ink). The music entry's `/conclude` call then gives one ordered roll. Alternatively, drop `conclusionScreen` from `end_it` so the music entries own the credits. Confirm in the browser.

### Minors

**m-1. Briefing and aside have no backstop.** The briefing is closable (no `disableClose`), and `skipIfGlobal: briefing_played` blocks a replay after a reload. If the player closes early or reloads, then goes straight to Nightshade's table, `aside_done` is never set: "Find the Sleeper" never unlocks, and HaX's "Start the gate console" pointer is lost. *Fix:* a Netherton `game_loaded` / `conversation_closed:director_netherton` mapping on `!aside_done` that reopens `start`, or `disableClose` on the briefing.

**m-2. No pointer to the ladder after the tripwire call.** With `tripwire_tripped && !ladder_used`, the inner door's `door_unlock_failed` only sets globals (erb mapping [78]), and "[Where are we?]" says "Through the tunnel." After a reload, or once the call is dismissed, the player gets no hint about the ladder. *Fix:* a bark on that failure ("The ladder at the guard post. Up and round.") and a `where_are_we` rung.

**m-3. Raid-team copies stay behind when the player moves on.** `kowalczyk_so/ws/pr/hall`, `arakawa_so/ws/pr/hall` and `quintero_so/ws/pr/hall` show on `room_entered` and are never hidden on exit. On a walk back, the same officer stands in several rooms. `vector_so` already has the `room_exited` hide (erb npc mapping [1]). *Fix:* copy that mapping to each copy.

**m-4. The dungeon graph under-models the gates.** The three vm-launchers share the name "Field Console" and collapse into one node wired only to flag 1. The table scene, Arakawa's call and the shutter cut are missing from the blast door and gallery stair. Imran/Gary and Victoria are missing as openers of the power room and the core. *Fix:* give the launchers distinct names, and add `puzzle_graph_*` hints to the HaX unlock mappings.

**m-5. Visualiser chrome on Join (unverified).** The credits title is "MISSION FAILED", but the visualiser's fixed header and ticker read "MISSION COMPLETE… ENTROPY CONTAINED… WELL PLAYED" (`bond-visualiser.js:140, 244`), and the server marks the game `completed`. Check in the browser whether the theme overrides it.

## 5. Stage 8 R1 items checked in the build

M-1 reinforcements on `share_zero_day !== 'stopped'` ✅. M-2 single tunnel-post rule and `breach_announced` on `!tethered && !override` ✅. M-3 `t0600` only on `six_done` ✅. M-4 `refused` on room exit and on `outer_lock_open` ✅. m-1 `hax_hatch_asked` ✅. m-3 Fonoti's bark gated on `!fonoti_ko` ✅. m-4 STOPPED only from `live` ✅. m-6 no "Pick." without a share ✅. m-7 guide 3 on the hatch ✅. m-8 Tesseract hidden on every ending and on re-entry ✅. W-10: Fonoti's challenge fires once (`skipIfGlobal: lock_guard_challenged`) ✅.

## 6. Locks

Blast door, inner door, stair and gallery stair: HaX `unlockDoor`, each with a `game_loaded` and `door_unlock_failed` backstop ✅. Power room: spare card in the picked fitter's locker, Imran/Gary's card cloned, or `#unlock_door` ✅. Outer lock 6083: cracker on every save, plus three codes and Victoria ✅. Records cupboard 2817 (optional): cracker, Ghost's or Vector's code ✅. Model terminal (optional): margin decode ✅.

*Run `/scenario-design-review` for full objectives scaffolding analysis.*

## R1b. Event mappings, and the raid team after the ending and under knock-outs

Static trace, 2026-10-21, finishing the two checks that R1 left open. The erb is being edited for the R1 findings while this was written. Line numbers below are from the **current working copy**: everything after erb:1277 has moved by +1 to +12 against the R1 lines (for example, the Arakawa loop was 1454 and is now 1460, and the console mapping was 1512 and is now 1521). The fixes in progress cover R1 M-1, M-2, m-1, m-2, m-3 and m-4 (the `conclusionScreen` was removed, the briefing has `disableClose` and a reload backstop, `gate_console_used` is set on flag 1, the ladder bark is in, raid copies hide on `room_exited`, the consoles are renamed, and graph hints are added). R1b-M1 below interacts with the M-2 fix.

Counts: 0 blockers, 3 majors, 10 minors (2 of the minors unverified).

### Check 1: every mapping against the engine

407 mappings, 104 distinct `eventPattern`s, 391 conditions.

- **Every pattern has an emitter.** The emitters are:
  - `room_entered[:id]` and `room_exited`: rooms.js:2992-3015
  - `object_interacted`: interactions.js:693
  - `door_unlock_attempt` and `door_unlock_failed[:room]`: unlock-system.js:122-130
  - `door_unlocked`: unlock-system.js:675 and apply-actions.js:119
  - `door_unlocked_by_npc`: npc-game-bridge.js:137
  - `card_cloned`: rfid-minigame.js:293
  - `fingerprint_collected:<owner>`: biometrics.js:95
  - `item_picked_up:<type>`: inventory.js:283, 627 and npc-game-bridge.js:40
  - `npc_ko[:id]`: npc-hostile.js:349-351
  - `conversation_closed:<id>`: person-chat-minigame.js:1754 and phone-chat-minigame.js:1123
  - `objective_task_completed[:id]`: objectives-manager.js:439-440, 612-619
  - `game_loaded`: game.js:2064
  - `player_spotted:<id>`: npc-sight-challenge.js:50
  - `lockpick_used_in_view`: lockpick-catch.js:48
  - `flag_N_in`: the flag station's `emit_event` reward, apply-actions.js:69
  - `global_variable_changed:<g>`: every name is declared, and the onRead-only writers (`clue_door_log`, `casualty_sheet_read`) are bridged by npc-game-bridge.js:36.
- **Every `data.*` field read is carried by its event.** The fields are `objectType`, `objectName`, `roomId` (object_interacted), `roomId`, `npcId` (door_unlocked_by_npc), `connectedRoom` (door events), `roomId` (room_exited), `cardName`, `objectId` (fingerprint) and `itemId`.
- **Every condition parses** in `safeEvaluateCondition` (npc-manager.js:16-110): `&&`, `!`, comparisons and bare terms only, with no `||` or brackets. Every `globalVars.*` name is declared or imported, and `value` is used only on `global_variable_changed`.
- **Action keys and targets.** Every action key is in `_buildMappingConfig` (npc-manager.js:656-690) except `barkDelay` (R1b-m2). Every `completeTask`, `unlockTask`, `unlockAim` and `unlockDoor` target exists. Every `targetKnot` exists in its NPC's ink. Every ink `#complete_task`, `#set_global`, `#give_item`, `#unlock_door` and `#clone_keycard` matches its target.
- **`onceOnly` across a reload.** It survives. Handlers that don't open a conversation are saved at once. Handlers that open a conversation are saved when it closes, so a reload mid-scene replays them (npc-manager.js:790-800). The saved key is `npc:pattern:<index in eventMappings>` (npc-manager.js:697), so inserting mappings mid-list remaps the saved state of existing games (R1b-m9). Every conversation-opening mapping without `onceOnly` is guarded by a done-global or an engine skip.
- Every handler has a **5 s default cooldown** unless `cooldown` is set (npc-manager.js:712). None of m10's repeating handlers needs to fire twice within 5 s.

### Check 2: the raid team after each ending

**Can the player move after the ending? Yes.**
- The credits open with `disableClose`, but the close button comes back once the last credit line has shown (bond-visualiser.js:1291-1294), and closing resumes Phaser (:1663-1666). Nothing sets `player.disableMovement` (only `showEndScreen` does).
- On a reload of a finished game, main.js:155-163 replays `handleMissionConcluded`. With the R1 M-2 fix (no `conclusionScreen`), that replay now opens nothing, so a reloaded finished game drops the player straight into the bunker.

Only Netherton (`m10_director_netherton.ink:35-40, 345-346`), HaX in person (`m10_hax_post.ink`) and HaX's phone (`m10_phone_agent0x99.ink:39-58`) branch on `ending`. The phone contacts' `start` knots are silent. Every other raid conversation plays as if the raid were still on.

| NPC (after any ending) | What they offer | OK? |
|---|---|---|
| Netherton, HaX (post and phone) | rest lines by ending; dead line on Join | ✅ |
| Ghost, Vance, Elena, Victoria line, Recruiter | silent `start` | ✅ |
| `quintero_core` | "Door's mine. You've got work." / "Don't. Finish it." (`m10_quintero.ink:179-192`) | ❌ R1b-M1 |
| `quintero_lock`, `minder_lock` | "Hold the door." / "I've got the lock. Go on." | ❌ R1b-M1 |
| Quintero, Arakawa, Malhotra, Vector, Phantom copies | normal menus, including "[You're WREN.]" | ❌ R1b-M1, R1b-M2 |
| Kowalczyk bunker copies | full menu and accusation, after her capture at the core | ❌ R1b-M3 |
| `kowalczyk_van` (taken) | "Go on. He's expecting you." | ❌ R1b-M1 |
| Nightshade (table, lock), Asante, Vos, escaped Voltage | in-raid lines ("Go and look at him for me", "Go and finish it") | ❌ R1b-M1 |
| HaX's release-console text (erb:1521) | reopens on a click, skipping her `start`; texts on Join; "[Close the backdoor.]" still completes a task | ❌ R1b-m1 |
| Imran, Gary, Wendell, captured Voltage, Fonoti, Victoria, Mercer | neutral resting lines | ✅ |
| Tesseract | hidden on close and on re-entry (erb:3665) | ✅ |
| Closing scenes | `onceOnly` and `!closing_done`; can't replay | ✅ |

### Check 2: knock-outs

The engine (npc-hostile.js:263-388) drops `itemsHeld`, fires `npc_ko` and `npc_ko:<id>`, and only then sets `globalVarOnKO`. A knocked-out NPC can't be talked to or have their card cloned (interactions.js:1882).

- **Kowalczyk knocked out** is possible only below ground (`kowalczyk_so/ws/pr/hall`, `globalVarOnKO: kowalczyk_ko`). Her post, van and core copies are `koImmune`.
  - At every one of those places, the core skips the WREN beat (`m10_tesseract.ink:54`) and plays normally.
  - The whodunit ends unsolved, unless she is then named on the phone ("She is already in the van.", `m10_phone_agent0x99.ink:354-357`).
  - At 06:00, HaX says "awake in the second van" (`m10_six_oclock.ink:438-442`), and the walkabout leaves her out (`kow_here` false).
  - Credits: "Woke in the second van. Nobody had named her."
  - On the taken and double-crossed branches her copies never appear. ✅
- **Many knock-outs.** `ko_pattern()` counts m01–m08 imports only, and its 4+ band is one line. With every knockable NPC down, the run still finishes:
  - breach: the door/Netherton/reload arms (R1b-m3)
  - power room: the fitter's locker by lockpick
  - shutter: a knock-out sets `cut_by_hand`, then the phone voice
  - outer lock: dropped cards, Ghost's code or the cracker
  - core: `quintero_ko` routes to "[Take her.]" / "[Stop her.]"
- **Gates whose speaker can be knocked out:** Arakawa's call (R1b-m3), Imran/Gary (locker), Wendell/escaped Voltage (phone cut), Victoria/Vos/Fonoti (PIN sources). Every one has a route that needs nobody. ✅

### Findings

**Majors**

**R1b-M1. The player can walk round after the ending, and the raid team talk as if the raid is on.** See the table above. Reachable two ways: closing the credits after the last line, or reloading a finished game, which with the R1 M-2 fix now opens with no screen at all. The worst cases:
- Quintero at the core says "You've got work." after every ending, including executed, where she has just taken the player's weapon.
- On Join, Arakawa, Vector, Phantom and Malhotra chat normally.

*Fix (m10, cheapest):* one HaX mapping per bunker and post NPC, `global_variable_changed:closing_done` → `setVisible: false`, plus the same on `game_loaded` with `closing_done === true`.
*Fix (engine, all missions):* set `window.player.disableMovement = true` when the mission concludes, in `handleMissionConcluded` (objectives-manager.js:1059) or in the music path's `openCredits` (scenario-music-events.js:148), and on the reload replay.
*Also:* branch `quintero.ink` `core` on `ending != ""`.

**R1b-M2. Officers can still be accused after WREN has shown herself at the core.** The face-to-face accusation checks in six files test only `clue_door_log`, `whodunit_live`, `accused == ""` and `officer_out == ""`:
- `m10_quintero.ink:20`
- `m10_arakawa.ink:22`
- `m10_malhotra.ink:16`
- `m10_vector.ink:17`
- `m10_phantom.ink:17`
- `m10_kowalczyk.ink:25`

HaX's phone version also tests `not wren_at_core` (`m10_phone_agent0x99.ink:93`). The WREN beat leaves `accused` at `""` (`m10_tesseract.ink:807-833`). So a player who leaves the core between the console and his end (or after the ending, per R1b-M1) can walk back and "[You're WREN.]" Quintero or anyone else. That writes `officer_out` and the exported `wrong_accusation`, and Quintero is "sent back" while holding Kowalczyk at the core (`quintero_core` doesn't hide on `officer_out`).
*Fix:* add `and not wren_at_core and ending == ""` to all six functions.

**R1b-M3. Kowalczyk's bunker copies come back after her capture.** Their reveal (`raid_copy`, erb:~2300-2316) tests `breach_open`, `!kowalczyk_ko`, `officer_out`, `accused` and `kowalczyk_gone_ahead`, but not `wren_entering` or `wren_at_core`. The new `room_exited` hide (R1 m-3) clears her when the player leaves a room, but `room_entered` shows her again on a walk back. So after Quintero has pinned her at the core, she is standing in the server hall with the full accusation sequence, whose last card writes `accused`, `sleeper_caught` and `wren_held`.
*Fix:* add `&& !globalVars.wren_entering && !globalVars.wren_at_core && globalVars.ending === ''` to her copies' reveal condition, and hide them on `wren_entering`.

**Minors**

1. **R1b-m1.** HaX's console mapping (erb:1521) has no ending guard. Add `&& globalVars.ending === ''`.
2. **R1b-m2.** `barkDelay` is ignored: `_buildMappingConfig` doesn't copy it, so npc-manager.js:1200 always reads 0. Fonoti's and the monitor guard's "Where's Farah?" barks (erb:3398, 3418) fire on entry, on top of "Camera's dead again." *Fix:* `sendTimedMessage`-style delay, or `delayMs` on the mapping (re-checked on fire), or copy `barkDelay` in the engine. m03 has the same problem.
3. **R1b-m3.** The `npc_ko:arakawa_gate` arm of the Arakawa loop (erb:1460) is dead: it tests `arakawa_ko === true`, which the engine sets only after `npc_ko` fires (npc-hostile.js:349 vs :360). The first push on the blast door rescues it, but that push gives no bark. *Fix:* use `global_variable_changed:arakawa_ko` in the loop.
4. **R1b-m4.** HaX's phone accusation menu (`m10_phone_agent0x99.ink:287-304`) still lists Quintero, Arakawa, Vector and Phantom when they are knocked out, and Netherton then orders an unconscious officer back. *Fix:* add `not <name>_ko` to each choice.
5. **R1b-m5.** `quintero_lock` isn't hidden when `quintero_core` appears (`quintero_enters_core`), so with the gallery beside the core there are two Quinteros. *Fix:* hide `quintero_lock` on `quintero_enters_core`.
6. **R1b-m6.** Knocking Arakawa out at the blast door after the breach leaves Nightshade untended: `minder_blast` reveals only on the breach, a reload or `officer_out`. *Fix:* add an `arakawa_ko` arm.
7. **R1b-m7.** Some knock-outs leave no trace in the story (design gap): the minders have no `globalVarOnKO`, Netherton's bruises line skips `gary_ko`, and Tesseract's sting counts no m10 knock-outs.
8. **R1b-m8.** On lethal and executed, Tesseract's sprite is hidden rather than shown down at the console. If his after-ending line is ever reached, "I'll see you in court" sits oddly against the van scene. Cosmetic.
9. **R1b-m9.** The saved `onceOnly` state is keyed by the handler's index (npc-manager.js:697). The edits now inserting mappings into `agent_0x99`'s list shift every later index, so existing dev and playtest saves may replay or skip once-only texts. Use fresh saves for playtests after this round of edits.
10. **R1b-m10 (unverified).** Two items:
    - One push on the blast door can raise a HaX bark and the delayed split or Arakawa scene together (erb:~1344, ~1447, ~1849). Optionally add `&& !globalVars.gate_console_used` to the erb:~1447 bark.
    - `duty_guard`'s `lockpick_used_in_view` mapping (erb:~2470, cooldown 250, no `onceOnly`) reopens `duty` on every catch. Check that this is intended.

### Interaction with the R1 fixes in progress

- Removing `conclusionScreen` (R1 M-2) fixes the empty screen over the last line, but makes a reloaded finished game open in the bunker with nothing over it. Pair it with R1b-M1's fix.
- R1 m-3's `room_exited` hide doesn't cover a walk back (R1b-M3).
- Renaming the three consoles is safe: no mapping reads `objectName === 'Field Console'`; the launchers are matched on `objectType`.
