# m01_first_contact regression playtest (engine changes, uncommitted)

**Questions answered:** plumbing plus unexpected behaviour (re-talk, reload, out-of-order KO). Solvability is only partly answered (flag rows below are "no").
**Step source:** no TESTING_WALKTHROUGH.md exists for m01; used `SOLUTION_GUIDE.md` and `tools/playtest/m01-baseline-report.md`.
**Games and session logs (headless, `session` flag policy):**

| Game | Log | Purpose |
| --- | --- | --- |
| 1188 (A) | `tools/playtest/m01-regress-A-session.jsonl` (1306 lines) | full critical path, Derek talk route (arrest), two reloads, abort, debrief, credits |
| 1189 (B) | `tools/playtest/m01-regress-B-session.jsonl` (293 lines) | short route to the archive, early Derek re-talk, Derek fight route + `debugKO` |
| 1195 (C) | `tools/playtest/m01-regress-C-session.jsonl` (322 lines) | `debugKO` Derek before any conversation, then archive, abort; single-click wrong password |

Combat cannot be driven by synthetic input, so both KO runs used the harness `debugKO` (logged as such). The real swing/hit path was not exercised.

## verify-run.rb output (verbatim, trimmed only of long item lists in B/C)

Game 1188 (exit 0): `unlocked rooms 10`, `unlocked objs 8`, `flags submitted 4`, `VERDICT: progress recorded — 9 rooms beyond the first, 8 objects unlocked, 4 flags submitted.` Server record: `status=completed`, `mission_concluded_at=2026-10-01 06:29:20 UTC`. Globals include `regress_marker`, `regress_marker2`, `player_aborted_attack`, `ready_for_debrief`, `start_debrief_cutscene`.

Game 1189 (exit 0): `unlocked rooms 5`, `flags submitted 3`, `VERDICT: progress recorded — 4 rooms beyond the first, 1 objects unlocked, 3 flags submitted.` `status=in_progress` (deliberately stopped after the KO; flag 3 and the device were not used).

Game 1195 (exit 0): `unlocked rooms 7`, `flags submitted 4`, `VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.` Server record: `status=completed`, `mission_concluded_at=2026-10-01 06:42:45 UTC`.

## Earned-secrets table (game A)

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Main Office Key | item | Sarah O'Brien dialogue reward | A seq 12-14 | yes |
| IT room PIN | `2468` | Kevin's voicemail, reception desk phone | A seq 22-24 (used seq 98) | yes |
| Lock Pick Kit, Server Room Keycard | items | Kevin Park dialogue reward | A seq 118 | yes |
| Derek's Office Key | item | Patricia's Briefcase (lockpicked, `completeLockpick` assisted) | A manager office | yes (assisted) |
| `0419` (cabinet PIN, computer password) | `0419` | Anniversary Card (break room bin) + ROT13 Encoded Note (2) on Derek's desk | before use | yes (I decoded ROT13 locally, not in the CyberChef workstation) |
| Storage safe PIN | `1337` | Base64 Encoded Note (1), Derek's desk (decoded locally with python, not in-game) | before use | yes (decode outside game) |
| Personal safe PIN | `0319` | "Personal Notes - Safe" on Derek's computer | before use | yes |
| SSH prerequisite (My Passwords, Server Access Details) | items | Derek's storage safe | A | yes |
| `shatter_server:flag_1` | `<flag:1>` | VM work, impossible standalone (prerequisite held) | A seq 812 | **no** |
| `shatter_server:flag_2` | `<flag:2>` | VM work | A seq 768 | **no** |
| `shatter_server:flag_4` | `<flag:4>` | VM work | A seq 775 | **no** |
| `shatter_server:flag_3` | `<flag:3>` | VM work | A seq 1041 | **no** |

Boundary: the four flag rows are "no". The archive, notes5 documents, launch device and everything downstream were exercised, not tested for solvability. Games B and C used `2468` directly without reading the voicemail (regression runs, not solvability runs), and skipped Derek's office entirely.

## Check results

### 1. Critical path to completed: PASS
Game A reached `status=completed` with `mission_concluded_at` set (06:29:20, set at the abort step; debrief and credits followed). Game C (KO route) also completed (06:42:45). Server records pasted above.

### 2. Re-talk receptionist and Kevin in-session: PASS
- Sarah, second `converse` (A seq 14): opens at the hub ("Where exactly is the IT room?" ... "Thanks, I'll get started"), no "(End of conversation)", inventory unchanged (Notepad, Phone, Visitor Badge, Main Office Key).
- Kevin, second `converse` (A seq ~120): resumes inside the hub ("If management won't listen to me..."), no "(End of conversation)", inventory unchanged (one Lock Pick Kit, one Keycard). Same in B (Kevin re-talk, 6 items, no duplicates).
- Note: first Kevin talk hits `hitTurnLimit` in the audit-quiz hub every time (known from baseline).

### 3. Derek
- **KO route (game B, via `debugKO`, after the choose-fight conversation):** `npc_ko` then `global_variable_changed:derek_confronted` (value true, oldValue false) fired from the KO event (B log seq ~696-698 in the drain output, line 258 of the log). `task_completed_by_npc confront_derek` once. `fight_outcome` mapping ran; launch device dropped on the break room floor (`entropy_launch_device` appeared in `room`), `derek_lawson` NPC remains in the room (KO'd).
- **KO-first route (game C):** `debugKO` before any conversation: `npc_ko`, `derek_confronted` true, `task_completed_by_npc`, and exactly one `objective_task_completed:confront_derek` (C drain, seq 174-180). The HaX message "Derek is contained. You still need to access the ENTROPY encrypted archive..." arrived once (checked in the toast and phone history). Launch device picked up from the floor, `<flag:3>` accepted, abort, `status=completed`.
- **Talk route (game A, arrest via "I have everything..." then "I'm calling in SAFETYNET"):** `derek_confronted` true once, one `objective_task_completed` for `confront_derek` (it completes at the start of the conversation via `#complete_task`, the eventMapping `completeTask` did not complete it a second time), launch device given once, `#remove_npc` removed Derek, `conversation_closed:derek_lawson` once.
- **Re-talk after the talk route:** not possible. Derek is removed (`unknown-entity:derek_lawson`), so there is nothing to replay. Re-talk after a KO is also not possible: the KO'd NPC reports `inRange:false` at 26-28px (range 32), `ko:true` (game C).
- **Re-talk behaviour with `restartOnRetalk:false` (game B):** early talk (insufficient evidence) twice: second talk shows "I'm kind of busy" again, no intro replay, no "(End of conversation)". After the archive (entropy_reveal_read true) the next Derek talk still resumed the old insufficient-evidence position ("Feel free to look around the office..."), and only the following talk reached the confrontation. A converse cut off mid-fight (turn limit) resumed at the fight knot on re-talk, which is the intended effect of the flag.
- **Defect (new, KO route):** see Defect 2 (duplicate HaX messages).

### 4. Aims: order and completion (game A)
establish_access active at start; access_main_office completes it, survey_offices active; IT PIN completes survey_offices (optional collect 2/4 not required), build_the_case active; Kevin talk + Lock Pick Kit completes build_the_case, search_derek_office active; entering Derek's office (task `access_derek_office`, `onComplete unlockAim`) makes capture_technical_evidence active; storage safe completes search_derek_office; archive unlock (`<flag:1>`) completes capture_technical_evidence and decrypt_entropy_intel active; taking the three notes5 completes decrypt, return_intel and disrupt_the_cell active; HaX report completes return_intel; Derek arrest completes disrupt_the_cell and activates deactivate_the_launch; abort completes deactivate and close_the_case. No aim failed to appear, none stalled.
- Game B: capture_technical_evidence became active by entering the server room (the self-referencing `unlockAim` on `access_server_room`), without visiting Derek's office. Derek's office is therefore skippable (all 3 flag tasks still required to conclude).
- **New rule (game C): PASS.** `confront_derek` completed early by KO while `disrupt_the_cell` was locked: the aim stayed hidden in the HUD (status locked, not listed), then appeared as completed with "Confront Derek Lawson" ticked once decrypt_entropy_intel completed. return_intel activated normally.
- **Observation:** in game C "Deactivate the Launch" appeared and went active straight after the KO (via `confront_derek` `onComplete unlockAim`), before its own `unlockCondition` (disrupt_the_cell completed) was met. Likely intended by the explicit unlockAim, flagged so someone can rule.
- **Observation:** in game C capture_technical_evidence stayed active after decrypt_entropy_intel completed, because I skipped the Kali terminal (`access_vm` manual task). decrypt aim was unlocked by `submit_ssh_flag` `unlockAim`, so nothing was blocked.
- `collect_operational_evidence` (status locked until the cabinet opens) shows in `brief().openTasks` while locked. Its status is `locked` in the manager, so this looks like a `brief` projection quirk.

### 5. Reload mid-mission: FAIL (partial)
Reload 1 was after Sarah, Kevin, IT room unlocked, HaX phone read (A seq 148). Reload 2 was after search_derek_office completed (A seq 650).

| Item | Result |
| --- | --- |
| Aims revert to locked | PASS. Same statuses before and after both reloads (`aims.sh` output, A seq 162, 654). `capture_technical_evidence` (opened by `unlockAim`) stayed active after reload 2. |
| Locked task stays locked | PASS (`collect_operational_evidence` locked after reload) |
| Rooms/doors | PASS. Main office door and IT door stayed unlocked, no lock minigame |
| Global set just before reload | PASS. `regress_marker` and `regress_marker2` written with no explicit sync, present on the server (verify-run lists both) and in the client after load |
| HaX first call replays | PASS. No second "Agent, I'm your handler..." message, no duplicate. Observation: the phone chat after reload shows only the last message (the three-message history is gone) |
| Briefing cutscene replays | PASS (not replayed; only the "Mission Brief" note opens on every load) |
| **NPC intros replay** | **FAIL** (person-chat): after reload 1 Kevin replayed "Oh hey! You found the IT room. I'm Kevin..." and the full first-meeting branch; after reload 2 Sarah replayed "Hi! You must be the IT contractor..." and the full intro. Rewards were not duplicated (inventory unchanged). |

Root cause evidence for the FAIL: `Game#player_state["npcInkVariables"]` for game 1188 holds
`{"kevin_park":{"patch":null,"_changedVariablesForBatchObs":null,"_batchObservingVariableChanges":false}, "sarah_martinez":{...same...}, "agent_0x99":{...}, "briefing_cutscene":{...}}`.
That is the inkjs `VariablesState` object's own internals, not the ink variables (`met_kevin` and friends). In the client, `conversationStates.get('kevin_park').variables` has the same keys (`patch`, `_batchObservingVariableChanges`, `_changedVariablesForBatchObs`, and for Kevin mid-story also `_callStack`, `_globalVariables`, ...). `saveNPCState` and `recordInkVariables` both build the map from `Object.entries(story.variablesState)`, which does not enumerate the declared variables. The sync and import plumbing works (server stores, client seeds); the thing being stored is wrong. (`public/break_escape/js/systems/npc-conversation-state.js`, `saveNPCState` around line 37, `exportNpcInkVariables`, `recordInkVariables`.) Not classified as a game bug beyond that; flagged for a human.

New `POST objectives/unlock` endpoint: no 404. A direct `fetch` from game B's page for `{kind:"aim", objective_id:"close_the_case"}` returned 200 `{"success":true}`. m01 itself relies on `onComplete unlockAim`, not `#unlock_aim` ink tags, and that path survived reload.

### 6. Wrong password: PASS
Derek's computer (A seq 430): "Incorrect password. 1 attempts remaining.", no "Network error". Single-click isolation on Kevin's workstation (C seq 312-316): one wrong submit gave `Attempts: 1/3` and "Incorrect password. 2 attempts remaining.". The 2/3 I saw in game A came from the harness `type(..., {submit:true})` submitting twice, not from the game.

### 7. Debrief and credits in order: PASS
After abort: phone "Operation Shatter resolved — I'm ready for debrief" then "On my way" set `start_debrief_cutscene`; the `closing_debrief_person` person-chat ran (no "End Conversation" control, only choices or "Skip [SPACE]"); at `ended:true` it closed itself within ~2 s; then the `bond_visualiser` credits overlay (`creditsShowing:true, closable:false`, text "OPERATION SHATTER: NEUTRALIZED") appeared. Debrief text reflected the arrest branch.

## Defects (observed, not classified)

1. **NPC-local ink variables saved/exported are the VariablesState internals, so intros replay after reload.** Repro: talk to Kevin or Sarah, reload the page, talk again; Kevin/Sarah start from their first-meeting lines. Evidence: DB value above; client `conversationStates`. This is the main reload failure.
2. **KO route sends three "Derek is contained" HaX messages** (one intended). Repro: game B (A conversation first, then KO) and game C order differ. In B, after Derek's `fight_outcome` conversation starts, the conversation init re-emits `global_variable_changed` for every declared ink global (log seq 703-707, 715-719: `derek_confronted` true, `entropy_reveal_read` true, `sudo_flag_submitted` true, no `oldValue`). Because `derek_confronted` is now already true from the KO, the onceOnly eventMappings for `entropy_reveal_read`/`sudo_flag_submitted` with `derek_confronted === true` fire as well, producing: "Derek is contained and ENTROPY's full picture..." (intended), "That's the full picture — and Derek's already contained..." and "All technical evidence secured. Derek is already contained..." all at the same minute in the HaX history. Suspect this is a consequence of the new KO-emitted `derek_confronted` change: before, `derek_confronted` became true at the end of the ink, after the re-emits. I did not run a pre-change build, so "regression" is an inference.
3. **Stale resume after `restartOnRetalk:false`:** a Derek talk before the archive leaves his saved position in the insufficient-evidence knot; the first talk after reading the archive replays the stale "busy" line and the confrontation only starts on the following talk. Player can recover by talking again.
4. Minor: after reload the phone chat history shows only the last message; the resume overlay ("RESUME SESSION?" with OTHER SESSIONS) appears after reload and must be answered; player is placed back in `reception_area` after reload.

## Regressions
- Defect 2 is the only item I would call a likely regression (new KO-time `derek_confronted` interacting with onceOnly mappings that re-fire on conversation start).
- Defect 1 means the new "NPC-local ink variables persist" feature does not work in m01; I cannot say it worked before (feature is new).
- Closing a `text-file` viewer opened from a container (Derek's computer) does not return to the container (`returnedToContainer:false`). The baseline log shows the same (`m01-baseline-session.jsonl` seq 549-579), so it is not a regression.

## Things that now work
- `globalVarOnKO` emits `global_variable_changed:derek_confronted` on KO; KO item drop works (device dropped and picked up in game C); `#remove_npc` works for Derek in the break room (loaded when talked to).
- Re-talk hub behaviour for Sarah and Kevin, no duplicated rewards, no "(End of conversation)".
- `conversation_closed:derek_lawson` fired once per close in A, B and C drains.
- Debrief `disableClose` auto-close, credits.
- Wrong-password message and attempt count.
- Aim-state persistence and the early-completed locked aim rule.
- `objectives/unlock` endpoint returns 200.

## Not tested
- Real combat (used `debugKO`), lockpick line-of-sight with hidden/KO'd NPCs, `setVisible` on an NPC whose sprite does not exist yet, cloner saved cards (no cloner in m01), ESD text variants, notes-as-flag-reward to notepad, the recruit/expose/surrender Derek routes, Maya conversation.
- `debugKO` cannot target an NPC in a room that is not loaded yet (`unknown-npc` from reception), so the "KO'd NPC in a later-loaded room" fix was only tested with the player already in the break room.
- Harness limits seen: `converse` hits turn limit on Kevin; `interact` often reports `no-effect-confirmed` for containers/flag stations on the first try (the minigame opens a second later); archive approach needs a manual walk to under 32px.
