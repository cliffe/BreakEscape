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
