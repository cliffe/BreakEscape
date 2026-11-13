# m09 stages 4–5: review round 2

## 0. Scope and method

Fresh read-only reviewer, round 2, 2026-10-21. Reviewed `../stage_4/objectives_tasks.md` ("S4", with §16) and `room_layout.md` ("S5", with §14) against `REVIEW_R1_PUZZLES.md` and `REVIEW_R1_DESIGN.md`, `docs/agents/FINALE_BRIEF.md`, the `mission-puzzle-chains` and `scenario-design-review` skills, and the engine. Engine docs read: `docs/agents/FINALE_ENGINE_UNLOCKS_SILENCE.md` (F18, F19, F10) and `docs/agents/FINALE_ENGINE_VOICED_CALLS.md` (F17, now written). `tools/playtest/README.md` was read for the F15 bootstrap. No VM material was opened.

There is still no `scenario.json.erb`. I rebuilt S5 §2's ten rooms and connections as plain-JSON stubs (the same shipped maps S5 names) and ran `scripts/check_door_alignment.py` on them from the real start room and from every segment start room in S4 §12.1. The stubs are in the session scratch folder under `r2/stub_<start>.json`.

Severity is the same as round 1. A **blocker** is a hard soft-lock, or a plan that can't be built or tested as written. A **major** is a silent failure, a broken forced choice, a stall with no pointer, or a test plan that gives false results. A **minor** is polish or a stage 9 check.

## 1. Round 1 findings: confirmation

"Resolved" means the text now says what the finding asked for, and that I grepped both documents for stale copies. "Resolved, new edge" means the fix is in the text but this round found a related hole (section 3).

| ID | Status | Note |
|---|---|---|
| B1 | **resolved** | The static-sprite reach works as S5 §3.6 says. Player body 18×10 at the feet, centred (`core/player.js:135-136`). The counter edge is at x 7.0 tiles (224 px), so the player's body centre stops at about 215 px. Sorensen's full 80×80 body (`npc-sprites.js:91-107`) has its west edge at 224 px when her centre is at 8.25 tiles. That leaves about 9 px horizontally and 0 px vertically for a player standing between y 4.25 and 6.75, well inside 32 px. The body-edge measure is used by the talk icon (`interactions.js:384-389`), the E key (`:1720-1724`) and the click (`tryInteractWithNPC`, `:1795-1797`). `#clone_keycard` reads the host's `rfidCard` (`chat-helpers.js:341-356`). The clone is on every branch and in a repeatable choice; the hatch-bell fallback is recorded. Staging polish: m-R2-4 |
| B2 | **resolved, new edge** | The trigger, backstop and hub gate key on `!report_done` (S4 §6.5, §7.1 topic 1, §5). The claim that the debrief "resumes at the saved choice" is wrong: m-R2-2 |
| B3 | **resolved, new edge** | First-ring backstops for the identity scene, flag 4's read and Tesseract's call are in S4 §4 rows 9–11 and §5. Putting them on both `game_loaded` and `room_entered` double-fires on load: m-R2-1 |
| B4 | **resolved, new edge** | §12 now uses `--start-room` (phone NPCs carried, README L27), `--complete-task` and `--submit-flag` (README L32-35, `set_global` rewards written straight to the state), with a dock fallback. S6/S7 break in two ways: M-R2-4 |
| M1 | **resolved, new edge** | Mapping (c) excludes the cage. The re-rings on `room_exited` don't: m-R2-3 |
| M2 | **resolved, new edge** | `in_cage` is cleared on `game_loaded`. Its setters carry the default 5 s cooldown: M-R2-2 |
| M3 | **resolved, new edge** | F19 `unlockDoor` exists as specified (`npc-manager.js:672, 874-881`; `game.rb` `npc_mapping_unlocks_door?`). The stacks and office doors retire on `stacks_entered` / `office_entered`. Victoria's gate repeats the "set by the tag, not the door" pattern: M-R2-1 |
| M4 | **resolved** | The cracker is in the start kit (S5 §3.1; S4 P15). `cracker_given` appears only in the removal note (S4 L232, L672) |
| M5 | **resolved** | `sorensen_door` (hidden, `koImmune`) holds the files; `sorensen` holds her card only (S5 §3.7, §8). Traced on the hatch, KO and Victoria routes (section 2) |
| M6 | **resolved** | Topic 14 needs `stacks_entered`; there is a relay hide on `room_entered:restricted_stacks` |
| M7 | **resolved, new edge** | The legend is in the tape room and the CyberChef requirement went to stage 6 (P20). The coded line's only carrier, the drop terminal screen, can lose it: B-R2-1 |
| m1 | **resolved** | Two objects. `the_reading`'s `onPickup` with `setVariable` emits `item_picked_up` with `itemId` |
| m2 | **resolved** | `triggerOnInteract` (S5 §3.9, §10 item 25) |
| m3 | **resolved** | `biometricMatchThreshold: 0.5`. "medium" is left only on `fingerprintDifficulty`, which is correct |
| m4 | **resolved** | `salvage_opened`, `stacks_entered`, `tape_room_entered` are in §5 |
| m5 | **resolved** | Noor is on the floor at (6.5, 5.5); Old Coyote's override tile is beside the door |
| m6 | **recorded** | §15 item 2. S4 §4 row 1's wording contradicts it: m-R2-6 |
| m7 | **resolved** | Desk drawer gone; the rent book's date is the long way. Grep: "drawer" survives only in the removal notes |
| m8 | **resolved** | `delayMs` on the flag-keyed rings, Gary and Torres |
| m9 | **accepted** | Stage 9 tap check, alternative named |
| m10 | **resolved** | `hax_voice`; the called guard is turned hostile by his own conversation; the Recruiter's texts follow m05's precedent |
| D-01 | **resolved** | Noor's EM4100 card can be cloned on every branch (S5 §3.2) |
| D-02 | **resolved** | Retitled; HaX's text; the hub topic on the file alone; three answers; closed in the identity scene. One line keys on the wrong thing: m-R2-5 |
| D-03 | **resolved with M7** | Same edge as M7: B-R2-1 |
| D-04 | **resolved** | Trolleys, the list, the bins' line, the clock lines. The bins' line may be out of reach: m-R2-4 |
| D-05 | **resolved** | Aim 3's description no longer names the team (S4 §3.3, §13) |
| D-06 | **resolved** | VM help topics 4, 12 and 16 are mutually exclusive; guides sit under topic 18; worst case nine |
| D-07 | **superseded (F17)** | F17's batch covers the host's whole phone story: M-R2-3 |
| D-08 | **resolved** | Open stacks 4×2, salvage cage 2×1. My stub from `loading_dock` passes all ten connections. What the 4×2 size does for route B is overstated: m-R2-7 |
| D-09 to D-18 | **resolved** | Each is in S4 §6.6, §7.1 or §11 as §16 says |

Stale-copy grep (`cracker_given`, `stacks_door_opened`, drawer, `catalogue_view`, `ledger_view`, `catalogue_legend`, `onInteract`, threshold "medium", `unlockable`): nothing live is left; each hit is a removal note or the F19 fallback. Stale wording that remains is listed in m-R2-8.

## 2. Engine claims re-checked

| Claim | Verdict | Evidence |
|---|---|---|
| F19 `unlockDoor` on a HaX mapping unlocks persistently, with no encounter or `unlockable` | **confirmed** | `npc-manager.js:672` (config), `:874-881` (async, one room at a time); `npc-game-bridge.js:77-87` uses the mapping's NPC; the server's `npc_mapping_unlocks_door?` (engine doc §F19). It emits `door_unlocked_by_npc {roomId, npcId}` (`npc-game-bridge.js:137-141`), **not** `door_unlocked`. S4 doesn't key anything on `door_unlocked` for a door that `unlockDoor` opens, so that is fine |
| `door_unlocked` / `door_unlock_attempt` / `door_unlock_failed` carry `connectedRoom` | **confirmed** | `unlock-system.js:115-130, 673-681`. A password door reports its refusals through `onRefused` (`:288`), and so does an RFID door with a cloner (`:536`) |
| Mapping `setGlobal` emits even when the value is unchanged; ink `#set_global` emits | **confirmed** | `npc-manager.js:801-813`; `chat-helpers.js:456-510` |
| Delayed mappings re-check their condition when the delay ends, and wait for an open minigame | **confirmed** | `npc-manager.js:598-628`. This is what lets the no-delay `room_entered` first-ring backstops and the delayed first rings coexist: the late one cancels itself |
| A mapping without `cooldown` has a 5 s cooldown per handler | **confirmed, not allowed for in the plan** | `npc-manager.js:712-716`. See M-R2-2 |
| On load, `game_loaded` fires, then the start room's `room_entered` on the first update | **confirmed** | `game.js:2080`; `rooms.js:93` (`currentPlayerRoom = ''`), `:2972-3001`. See m-R2-1 |
| `room_entered` fires before `room_exited` on a crossing | **confirmed** | `rooms.js:2992-3014` (entered, entered:<id>, discovered, then exited with `nextRoom`) |
| A mapping-opened person-chat resumes at its saved choice | **wrong** | `npc-manager.js:1072-1081` always passes `startKnot`; `person-chat-event-start.js:22-33` restores state, then `goToKnot`. See m-R2-2 |
| F17 `voiced`: final key name; plumbing applied | **confirmed** | `npc-manager.js:336, 677, 1183, 1526, 1547`. Narration in a phone thread is **not** voiced, and the batch covers the host's whole phone story (`FINALE_ENGINE_VOICED_CALLS.md` §2, §7). See M-R2-3 |
| `--start-room` carries phone NPCs only; hidden person NPCs need `--carry-npc` | **confirmed** | `tools/playtest/README.md` L27. Speakers register room by room (`npc-lazy-loader.js:60-112`). See M-R2-4 |
| The coded line "travels in the notepad" | **only if read in the window** | A non-notes readable adds its *resolved* text as a note on read (`interactions.js:1541-1547`). Notes de-duplicate on title and text (`notes-minigame.js:855-871`), so each variant read becomes its own note. See B-R2-1 |
| Door layout (S5 §2) | **confirmed from the dock** | Stub, start `loading_dock`: all ten OK, every N/S door on the west corner. Start `tape_room`, `reading_room`, `restricted_stacks`, `restricted_cage`, `sorensen_office`: all OK. Start `salvage_cage`: **BAD** `loading_dock north->open_stacks` (592 vs 912). See M-R2-4 |
| Sorensen's three records on each route | **holds** | Hatch: `sorensen_hatch` (`koImmune`) gives the file; the gate opens; she hides on `cage_opened`. KO in the cage drops the card only (`npc-hostile.js:339`). Victoria: the gate opens from the hub after `stacks_entered`; the hatch record hides; `sorensen_door` runs the door scene on its own `room_entered` (README L1809 pattern) and gives the file. Victoria + hatch talked: the door scene is skipped and the default bin stands. The only route-level hole is M-R2-1 (a failed unlock) |
| The purge's three rules | **hold** | Bin default at `cage_opened` with `!bin_chosen`. Legacy clock on the file or the first exit, saved by a KO first or by Noor; `feed_table_box` variants run most specific first, so "saved" beats "gone" when both are true. Printed ledger on `sorensen_fate === 'left'`. A reload inside the cage delays the exit clock until the next exit, which is lenient and fine |
| Kit on a cold start | **holds** | Picks (dock door), cloner (Noor EM4100, Sorensen MIFARE custom keys, `npc-conversation-state.js:687-696` drives `card_needs_attack` as in m08), fingerprint kit (stamp), PIN cracker (`minigame-starters.js:526-540`, type `pin-cracker`), CyberChef (the decode; but see B-R2-1 for where the line comes from) |

## 3. Findings

### Blockers

**B-R2-1 (blocker). The salvage code's coded line has one source, and it can disappear before the player reads it.**
- *Location:* S5 §3.5 `drop_terminal_screen`; S4 §2 aim 5 pointer, §4 row 7, §7.1 topic 5, §8 last row.
- *Evidence:*
  - The screen is one readable with variants, most advanced first: the sale line on `invoice_booked`, then the ledger after `flag2_submitted`, then the catalogue after `flag1_submitted`. The coded line is listed **only** in the catalogue variant.
  - Variants resolve first match wins (S5 §10 item 10, `resolveObjectField`).
  - Reading adds the resolved text at that moment as a note (`interactions.js:1541-1547`). Nothing else carries the line:
    - HaX's keypad topic says "It's in your notes";
    - Gary names the operation, not the line, and only on `m02_gary_protected`;
    - the Albion folder's "catalogue entry" is a different entry.
- *Problem:* A player who submits flag 2 before reading the screen never sees the line. Doing flag 2 first is what D-04 expects many players to do, since the VM is warm at the same terminal. After flag 2 the screen shows the ledger variant for the rest of the night. Without Gary, the salvage keypad (`password`, critical path) can't be opened: flags 3–4, the identity scene and the conclusion are all behind it. Even with cumulative variants, a player who never reads the screen faces Act 3's three-door walk-back to the reading room, which M7 and D-03 were fixed to remove.
- *Fix:*
  - Give the line to every player in a message they can't miss: HaX's `flag1_read` call ends with `#add_note:<title>|<the coded line>` (a fixed string; the tag exists, `chat-helpers.js:177-188`), and her line says she has logged it.
  - Write every screen variant from flag 1 on to repeat the coded line.
  - Have topic 5 quote the line rather than point at the notes.
  - Then S4 §2's "the catalogue entry is in the notepad since Act 1" is true on every route.

### Majors

**M-R2-1 (major). On Victoria's route, `cage_opened` is set by the mapping, not by the door, and the gate has no load backstop.**
- *Location:* S4 §4 row 2b, §5 backstop table; S5 §3.6 (hatch hide), §3.7.
- *Evidence:*
  - Row 2b's mapping does `unlockDoor: "restricted_cage"` **and** `setGlobal: { "cage_opened": true }`.
  - `setGlobal` runs at once (`npc-manager.js:801-813`). `unlockDoor` runs after it as an async request whose failure is only logged (`:874-881`; `npc-game-bridge.js:106-160` returns `success: false`).
  - §5's load backstops cover the stacks door and the office, not the gate.
- *Problem:* This is M3's pattern again: a backstop that retires on the step, not on the door. If the unlock request fails (network, session), the world still records `cage_opened`. Topic 14 retires, `sorensen_hatch` hides (so the clone can't be done), the bin default runs, and the gate stays locked. A Victoria player has no card, so the night stops at the gate with no pointer. A reload doesn't help, because nothing re-issues the unlock.
- *Fix:*
  - Drop the `setGlobal` from row 2b.
  - Set `cage_opened` on HaX's `door_unlocked_by_npc` with `data.roomId === 'restricted_cage'`, beside the existing `door_unlocked` setter for the card route.
  - Add the gate to §5: `game_loaded` with `maintenance_code_used && !cage_opened` → `unlockDoor: "restricted_cage"`.
  - Retire topic 14 on `cage_opened` as now, so it reappears if the unlock failed.

**M-R2-2 (major). The `in_cage` setters carry the default 5 s cooldown, so jittering in the doorway can leave `in_cage` stale and the Recruiter's call never rings.**
- *Location:* S4 §4 row 3, §5 `in_cage` row.
- *Evidence:*
  - A mapping without `cooldown` waits 5000 ms between firings of the same handler (`npc-manager.js:712-716`).
  - Room detection fires `room_entered` / `room_exited` each time the player's feet cross the boundary (`rooms.js:2947-3014`). Standing on a threshold or stepping back out produces several crossings within a second.
  - Mapping (a) also requires `!in_cage` on the same `room_exited`, so it depends on HaX's clearing handler running before the Recruiter's.
- *Problem:* Cage → hub → cage → hub inside 5 s: the second `room_exited` (cage) setter is on cooldown, so `in_cage` stays true in the hub. (a) and (b) both fail on `!in_cage`, and (c) fails on `!in_cage` at every later room entry. The call that opens the office never rings, and nothing points the player back into the cage to clear it. A reload clears it (M2's fix), but the player has no reason to reload. The reverse case (the true-setter skipped while inside) lets (b) ring the call in the cage, which M1 was meant to stop.
- *Fix:*
  - Put `cooldown: 0` on both `in_cage` setters, and on any other state setter that tracks a room crossing.
  - Drop `!globalVars.in_cage` from mapping (a): its `data.roomId === 'restricted_cage'` already proves the player has just left, and dropping it removes the dependence on listener order.

**M-R2-3 (major). Voicing HaX's scenes puts HaX's whole phone story into the TTS batch, so §6.7's audio budget is wrong.**
- *Location:* S4 §6 "Voicing (F17)", §6.4, §6.7, §15 item 1; S5 §10 item 4.
- *Evidence:* `FINALE_ENGINE_VOICED_CALLS.md` §7 Limits:
  - "The whole phone story is voiced for the batch, not only the call's knot: marking any call `voiced` makes the contact's texts (hub replies etc.) part of `batch_generate`."
  - The client also voices hub replies if the player keeps talking in the same open phone.
  - §2: narration in a phone thread is **not** voiced.
- *Problem:*
  - The identity scene, Tesseract's call and re-ring 3 (`deck_resume`) are hosted by `agent_0x99`. Her story also holds the 19-topic hub, every text, `flag1_read`, `ledger_read` and `hour_read`, which S4 says stays text. All of it would be generated and counted as covered. The "about 66 lines" the user approved F17 against undercounts by several times.
  - §6.7 counts two narrator lines that won't play.
  - §6.4 still leaves the narrator question open, though it is now settled: narration is silent.
- *Fix:*
  - Host the three voiced HaX scenes on their own phone record (for example `hax_line`: HaX's display name and voice, its own ink with only `identity_scene`, `tesseract_call` and `deck_resume`), left out of the phone's `npcIds` like the Recruiter. Their mappings move to it. The extractor then walks only that story. Keep the flags and globals unchanged.
  - Or tell the user the real batch size before generating.
  - Make "A man's voice on her end…" HaX's own aside, and drop both narrator rows from §6.7.

**M-R2-4 (major). Segments S6 and S7 come up with a broken map and without the scenes' other speakers.**
- *Location:* S4 §12.1 rows S6, S7; §12.3 (the reload checks run "from the matching segment").
- *Evidence:*
  - (a) The salvage cage is 1 GU tall at gy −7, so making it the start room shifts every grid sum by an odd number. Door sides depend on `(gridX + gridY) % 2` (`doors.js:96-110, 168-186`; `rooms.js:1239-1263, 1335-1358`). My stub with `startRoom: salvage_cage` gives `BAD loading_dock(10x10) north->open_stacks(20x10): door (592, 928) vs (912, 928)`. The same stub from `tape_room` (2×2, even shift) passes all ten connections.
  - (b) `--start-room` moves phone NPCs only; person NPCs need `--carry-npc` (README L27). Speakers register with their room (`npc-lazy-loader.js:60-112`). The identity scene's "Director Magnus Netherton:" lines need `netherton` registered, or F17 treats the three-word prefix as naming nobody and reads it in HaX's voice (engine doc §2). The debrief needs `hax_voice` and every registered speaker who talks in the hangar. S7 carries only `closing_debrief`.
- *Problem:* S6 is where the voiced identity scene, the first-ring reload and the co-speaker voice get checked. Run as written, Netherton is misattributed, and the shutter door is misaligned (harmless only if the run never walks there). S7's debrief runs with its speakers missing, so the B2 reload check can give a false result.
- *Fix:*
  - Start S6 and S7 in `tape_room`: one door from the salvage cage, and every door aligns.
  - Add `--carry-npc netherton` (S6, S7) and `--carry-npc hax_voice` plus each debrief speaker (S7).
  - Add a note to §12: a segment start room that is 1 GU tall flips door parity.

### Minors

**m-R2-1. First-ring backstops on both `game_loaded` and `room_entered` open their scene twice on a reload.**
- *Location:* S4 §4 rows 9–11, §5 (also the ledger-read backstop).
- *Evidence:*
  - `game_loaded` fires in `create()` (`game.js:2080`). The start room's `room_entered` fires on the first update, because `currentPlayerRoom` starts as `''` (`rooms.js:93, 2972-2997`).
  - Each phone-chat mapping opens its call in a 500 ms `setTimeout` (`npc-manager.js:1167-1186`), checking its condition at event time. So both handlers pass `!…_started`.
  - The second `startMinigame` ends the first (`minigame-manager.js:57-66`).
- *Problem:* The scene opens, closes and reopens a frame apart. That's harmless today, but it emits a stray close and runs the first line's tags twice.
- *Fix:* Keep only the `room_entered` copy (it covers load as well; m05's backstop relies on this), or give the `game_loaded` copy a `delayMs` so it re-checks when the delay ends.

**m-R2-2. A reopened debrief restarts from its knot rather than resuming.**
- *Location:* S4 §6.5 ("resumes at the saved choice"), §12.3; S5 §10 item 27.
- *Evidence:* A mapping-opened person-chat always passes `startKnot` (`npc-manager.js:1072-1081`). `startEventConversation` restores variables and visit counts, then calls `goToKnot` (`person-chat-event-start.js:22-33`).
- *Problem:* After a reload the debrief replays from the top. The first line's temp copy of `albion_notified` is taken again, so a notice sent inside the first pass now reads as sent in the archive, and the spine takes the wrong branch. The mission still concludes, so B2 holds.
- *Fix:* Copy the pre-debrief value into a global in HaX's "[Bring me in.]" knot, before `start_debrief`, and never overwrite it. Write the debrief so finished sections are skipped on a replay (visit counts or once-only choices). Correct the "resumes" wording.

**m-R2-3. The Recruiter's re-rings can ring as the player walks into the cage.**
- *Location:* S4 §6.1 re-rings 1–2.
- *Evidence:* Walking into the cage emits `room_exited {roomId: 'restricted_stacks', nextRoom: 'restricted_cage'}` (`rooms.js:3009-3014`). The re-rings fire on any `room_exited`.
- *Problem:* After a hit closes the call (Tran's guard, R5), the next crossing may be into the cage, and the Recruiter then talks with Sorensen in the room. That is the case M1 was fixed to prevent.
- *Fix:* Add `data.nextRoom !== 'restricted_cage'` to the Recruiter's `room_exited` re-rings. HaX's `deck_resume` doesn't need it.

**m-R2-4. Hatch staging details.**
- *Location:* S5 §3.6, §8.
- *Evidence:*
  - An atlas static sprite stays on its first `breathing-idle_south` frame (`npc-sprites.js:66-70, 143-151`), so she faces south, not "west across the counter". `facePlayer` defaults on and can flip the frame (`npc-behavior.js:845-856, 1730-1735`). m02's Mr Pryce sets `facePlayer: false` (`m02 scenario.json.erb:1732-1736`).
  - Her full body (x 7.0–9.5, y 4.25–6.75) fills the strip, so the two bins "in the strip" sit under her. An object's reach is 32 px from the player's facing-offset point (`interactions.js:71-101, 1286-1288`), so a bin more than about 0.75 tile behind the counter edge can't be examined. That bin carries D-04's "She's three boxes from the bins."
  - The stamp at (6.5, 4.5) is 16 px from her body edge, under the dressing rule's tile.
- *Fix:*
  - Set `facePlayer: false` and accept a south-facing frame, or give her a static sheet that faces west.
  - Put the bins at the strip's ends, clear of her body and within reach of the counter, or move the D-04 line onto the stamp or the counter.
  - Move the stamp to the counter's south end, about (6.5, 6.5).

**m-R2-5. "Two samples. One pen." can play when the player holds one sample.**
- *Location:* S4 §7.1 topic 11.
- *Problem:* `cage_bin == "derek_file"` is also the **default** at `cage_opened` when no bin was pressed. In that case Derek's file stays in the bin and the player never gets it.
- *Fix:* Gate the line on `bin_chosen and cage_bin == "derek_file"`. The credits' "Saved at the hatch: Derek Lawson's file" on the default is stage 3's call. It is flagged here only because the player is not holding it.

**m-R2-6. §4 row 1's backstop claim contradicts §15, and unlock failures recover only on reload.**
- *Location:* S4 §4 rows 1 and 5.
- *Problem:* Row 1 says the `game_loaded` backstop "covers a crash inside the client-only window of the flag global (review m6)". It reads `flag1_submitted`, which is the value a crash loses (`games_controller.rb:2209-2211`, client-only). §15 says so correctly. What the backstop does cover is a failed unlock request, and only after a reload. The door-refusal text is `onceOnly` and has usually been spent before flag 1.
- *Fix:* Correct the wording. Add an in-session retry: HaX on `door_unlock_attempt` with `data.connectedRoom === 'restricted_stacks' && globalVars.flag1_submitted` → `unlockDoor`, and the same for the office on `deck_choice_made`.

**m-R2-7. The 4×2 open stacks doesn't lengthen route B.**
- *Location:* S4 §11 "Walking"; S5 §3.3.
- *Evidence:* The shutter lands in the open stacks' south-west corner, and the reading-room door is on its west wall 2.5 tiles down (stub: `(48, 32)` and `(16, −176)`).
- *Problem:* The route B crossing is about seven tiles at the west end, whatever the room's width. The extra length is where the H&L boxes and the closet are.
- *Fix:* Draw Old Coyote's round so it crosses the west end on every lap, with the long aisles as the return leg. Correct the S4 sentence.

**m-R2-8. Stale wording.**
- S4 §0, §1 (L31) and §6 (L256) still call `voiced` and `unlockDoor` working names. Both engine docs are written, and the names are final. The `#unlock_door` fallback can go too.
- S5 §12 P1 says "the four phone scenes". Three are in the salvage cage; the Recruiter's call is not.
- S5 §3.10 says the salvage cage objects are "two tiles apart" at x 1.5 … 7.5, 9. The last gap is 1.5 tiles, and x 9 may be the side wall in a 10-wide map. Stage 9's `slot_audit.py` decides.

## 4. Verdict

**Not clean: 1 blocker, 4 majors, 8 minors.**

All 39 round 1 findings land in the text:
- 36 fixed;
- D-07 superseded by F17;
- m9 accepted with a stage 9 check;
- m6 recorded for the user.

The checks the orchestrator asked for hold:
- the hatch reach;
- Sorensen's records on every route;
- the purge rules;
- the door layout from the dock;
- the cold-start kit.

What's left is one data-carrying hole and a few engine edges:
- B-R2-1: the coded salvage line can be lost. One `#add_note` in `flag1_read` and cumulative screen variants close it.
- M-R2-1: Victoria's gate sets `cage_opened` before the door opens and has no load backstop.
- M-R2-2: the 5 s default cooldown on the `in_cage` setters.
- M-R2-3: F17 voices the host's whole phone story, which changes the audio budget the user approved.
- M-R2-4: S6/S7 start in a 1-GU room that flips door parity, and without the scenes' other speakers.

Each fix is local: a tag, a condition, a `cooldown`, a host record, a segment start room. None changes a room, a lock or a choice. Round 3 should re-check B-R2-1 and M-R2-1 to M-R2-4 in the text, and confirm the hidden speakers' ids for the `--carry-npc` lines.

Withdrawn while checking, so round 3 needn't raise them:
- `unlockDoor` emitting `door_unlocked_by_npc` rather than `door_unlocked` breaks nothing. No S4 trigger keys `door_unlocked` on a door it opens.
- The no-delay `room_entered` first-ring backstops don't double-ring against the delayed first rings, because a delayed mapping re-checks its condition when it fires (`npc-manager.js:598-628`).
- The salvage cage's own doors align on the normal layout.
