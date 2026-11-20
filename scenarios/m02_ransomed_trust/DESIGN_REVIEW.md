# m02 Ransomed Trust: design review (pass 4)

Reviewer: design-review agent, 2026-10-02. Read-only review. Nothing in the scenario or ink was changed. Method: `ruby scripts/validate_scenario.rb`, `scripts/predict_door_sides.py`, then a read of the scenario, every ink file and the engine paths they depend on. No browser playtest was run, so anything marked "verify" still needs one.

## Summary

m02 can be finished on every KO path, and the validator finds nothing invalid. The writing and the social routes (Bernie, Gary, Val) are the best in the pass so far.

The problems are in what the systems do, or fail to do, at the story's big moments:

- **The cover burn has no physical consequence.** It can resolve before it happens if the player grabs the spare lanyard, which they usually will.
- **Picking is never seen.** The briefing says picking is a confession, and nobody can ever catch you doing it.
- **Ghost's deal arrives after the choice it is meant to change.**
- **The Bed 4 countdown has no pointer**, and HaX sends the player the other way.
- **The credits print six deaths** for a restore the debrief says cost two.
- **The insider is named for the player** rather than by them.

U2 needs both a mission-local move (Val to the corridor, her office locked) and either an engine fix or a Bernie change. Every player holds Bernie's IT key, and holding any key bypasses the catch entirely (`unlock-system.js:175-187`). Section 4 has the design and section 5 the prioritised fixes.

## 1. Validator output

`ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb`. Schema passes, room geometry and door alignment are clean (`✓ Room layout geometry OK`, `✓ Door alignment OK`).

Graph summary: Puzzle 102 nodes / 122 edges, Story 8 / 7, Integrated 110 / 158, Rooms 13 / 12. Critical path (4 hops): Talk Your Way In → Get Into IT → Somebody Pulled Your Booking → Turn Their Backdoor Around → Put A Name To The Badge. The real ending is "Bring The Wards Back" (`scenario.json.erb:456-507`), so the graph ends its critical path on the wrong aim (see 2e).

### ❌ INVALID

None.

### ⚠️ WARNING

1. Top-level `mutuallyExclusiveGlobals` is unknown to the schema (`scenario.json.erb:3103-3105`). The validator reads it for its own overlap check, so this is the validator disagreeing with itself. Add it to `scripts/scenario-schema.json` (tooling, needs approval) or ignore.
2. Thirteen "several onceOnly handlers on one event" warnings on `agent_0x99` and `ghost`. Sorted by whether they matter:
   - **Real duplicates the player sees:**
     - `global_variable_changed:insider_badge_id_found`, handlers at `:1070-1076` and `:1101-1107`. When the post log and any other evidence are both in hand (the usual case, since seven objects set `insider_evidence_partial`), HaX sends two naming texts at 4.2 s each, both saying SC-4471 is Reeves.
     - The pair at `:1078-1084` and `:1093-1099` does the same in the other order.
     - `objective_task_completed:make_ransom_decision` plus `global_variable_changed:ransom_decision_made` produce "Decision logged. Whatever the board chooses…" (`:1129-1134`) and "Recovery decision logged. One more thing…" (`:1175-1179`) three seconds apart, then a Kim text at 9 s.
   - **Message floods (intended, but too many at once):**
     - Entering the server room sends three HaX texts in 3.6 s (`:939-955`) and opens Val's `on_server_room_access` conversation (`:2792-2798`).
     - The SSH flag sends three guide offers at 1.8, 4.2 and 5.6 s (`:969-985`).
   - **False positives:**
     - `item_picked_up:id_badge` and `item_picked_up:text_file` are kept apart by `data.itemId`, which the validator can't see.
     - `room_entered:*` is the debrief backstop (`:822-830`), which only fires once `debrief_played` is set.
     - The four advised-Kim texts are covered by `mutuallyExclusiveGlobals`.
     - `talk_to_gary`, `submit_database_flag` and Ghost's `submit_proftpd_flag` are deliberate pairs.
3. `security_guard_patrol` eventMappings[0] is a person-chat without `onceOnly` (`:2774-2781`). This is intended (a repeatable catch), but the 30 s cooldown is wrong for it. See section 4.
4. Two items unlock `emergency_storage_safe` (the plaque `:1294-1306` and the snag list `:2957-2969`). These are intended alternative clues to one code. Mark one `puzzle_graph_optional: true` to quiet it.
5. `reception_lobby` npcs[1] and [2] (Netherton and Nightshade) have "no behaviour". They are hidden co-speakers, so this is a false positive.

### ✅ GOOD PRACTICE

Event-driven cutscenes, `globalVarOnKO` on the people who matter, a `skipIfGlobal` briefing, a full music cue set with conditional credits, and dense `puzzle_graph_*` metadata.

### 💡 SUGGESTION

- `m02_object_press_terminal.ink:234,236`: `Status:` is a terminal label, not a speaker. Fine as written.
- "Add timedMessages to Ghost / the comms terminal": not needed. Ghost is driven by events, which suits him better.
- "Add a hostile NPC": m02 already has three NPCs who turn hostile on choice (Val, Gary, Reeves). The real gap is that no guard is a physical obstacle, which section 4 fixes.

## 2. Design review (skill checks 2a–2h)

### 2a. Solvability trace: OK, with three CONCERNs about promises the scenario doesn't keep

Critical path:

1. Reception (start).
2. Bernie hands over the IT override key (`m02_npc_receptionist.ink:207-212`; a KO drops it, `scenario.json.erb:642-652`).
3. Walk through the ward to the handover room and on to Kim (open).
4. IT door: key or pick (`:1763-1767`, lockpick in the start kit `:521-529`).
5. Gary's keycard: talk, or a KO drop (`:1796-1804`, `taskOnKO` `:1790`).
6. Corridor, security office (unlocked), server room (RFID `:1999-2002`).
7. VM flags 1–4. Flag 3 pays out the restore manifest (`:2039-2043`) and flag 4 opens the staging cache (`:2044-2048`).
8. Recovery console (manifest required, `:2104-2112`).
9. Boardroom (PIN 0417 from Kim's diary `:2514` or Kim herself).
10. Press terminal, gated on `backdoor_fully_exploited` and `ransom_decision_made` (`m02_object_press_terminal.ink:47-52`), which sets `mission_complete`.

There are no circular dependencies. The mission can't soft-lock: `concludeRequires` is the four flags only (`:468-475`), and each flag needs only the server room.

- **CONCERN: the cover burn has no physical consequence.** After Gary, nothing stops a player walking past Val to the RFID door. Her challenge plays only if the player clicks her (`m02_npc_security_guard.ink:50-53`), since no mapping opens it on sight or on entry (`scenario.json.erb:2773-2799`). The mission's stated midpoint (`:27-29`) is skippable without the player noticing it existed.
- **CONCERN: HaX promises that Bernie will see you pick the IT door.** "her desk faces that door" (`m02_phone_agent0x99.ink:380`). Bernie is in reception and the IT door is off the handover room, four rooms away. Her catch is dead too (section 4).
- **CONCERN: Ghost's offer arrives after the console choice it is meant to precede.** Ghost opens with "Before you touch that console" (`m02_phone_ghost.ink:465`), but the call fires on `objective_task_completed:initiate_backup_recovery` (`scenario.json.erb:1229-1234`). That task completes from `backup_restore_initiated` (`:1141-1146`), which the console sets once the source is already chosen (`backup-recovery-minigame.js:308-312`). The deal ("Clean recovery. Under an hour.", `m02_phone_ghost.ink:481`) therefore changes nothing. The HaX hub choice built for it, `{offline_keys_recovered and not ransom_decision_made and ghost_deal_accepted}` (`m02_phone_agent0x99.ink:187`), can never show.
- Minor: HaX places Gary on the "Main corridor, far door" (`m02_phone_agent0x99.ink:360`). IT is off the handover room (`scenario.json.erb:2935-2938`), and Bernie gets this right (`m02_npc_receptionist.ink:222`).

### 2b. Clue distribution: OK

Clues are spread well. The founding year 1987 appears in four places across depths 0–6: the plaque `:1294`, the nurse's note `:3041`, the snag list `:2959` and Kim's `escrow_safe` knot. The Reeves thread has three independent entry points: Val's notebook `:2801`, the night rota `:2873` and the post log `:2694`, plus the handover board `:2944`. That redundancy is intended and documented (`:1085-1091`).

- **CONCERN: clues that point at nothing.**
  - The CyberChef workstation says it decodes "the Base64 ransomware note" (`:2073-2075`). There is no Base64 note: `ransomware_note` and `base64_encode` are defined (`:86-95`) and never used.
  - `decoded_recovery_instructions` is declared (`:3199`) and never set.
  - Reading the ROT13 operator note sets `read_operator_note` on read, before any decoding (`:2253`), and HaX then gives away the plaintext (`:911-916`). The decoding step teaches nothing, because the handler does it for you.
- Flavour items with no puzzle role (Budget Report `:2528`, Patient Status Report `:2536`, Conference Table papers `:2654`, Whiteboard `:2662`, Comms Cabinet `:1970`, Staff Noticeboard `:2972`) all earn their place as stakes or texture. Keep them.
- Navigation-only: the Ward Board directory (`:2914-2922`) is mostly directions. It also carries the "ALL READERS DOWN" line, which is worth keeping. Fine.

### 2c. Educational coverage: OK, with one CONCERN

| Lock | Where | Teaches |
|---|---|---|
| key + lockpick | IT door, IT filing cabinet, sealed case | physical security; picks as a confession |
| pin | emergency safe, Kim's safe (both 1987), boardroom 0417 | default and reused codes; codes written in diaries |
| password | Gary's workstation `Hospital1987` | password reuse across workstation and SSH |
| rfid | server room | an isolated controller survives the attack, and an existing credential becomes the only key |
| flag ×4 | VM chain | scanning, SSH brute force, ProFTPD backdoor, privilege escalation, data recovery |
| ransomware_display ×7 | terminals across the building | what ransomware looks like to its victims |

The locks fit the brief closely: the access-control server is itself encrypted (`:14-20`, `:1309-1316`), which is why people become the locks. That's an unusually coherent premise.

- **CONCERN: the information-leak lesson is muddled.** The cracker's own text describes Mastermind-style feedback (right digit in place, right digit wrong place, `:2276`), and HaX says the same (`:1126`). Nightshade's debrief then says it "watches the lock's own response timing" (`m02_closing_debrief.ink:125`). That is a different side channel, so the two explanations contradict each other.
- Most players open the escrow safe from the plaque early, so the oracle rarely gets used. That is intended (`PHASE2_PUZZLE_CHAINS.md:640-700`), but it means the field note is the main carrier of the lesson.

### 2c′. Field guides: OK

All eight `labUrl`s resolve to sheets in `HacktivityLabSheets/_labs/safetynet/`, checked by filename. Offers are gated on exposure: server-room entry `:944-955`, the Kali box `:956-962`, the SSH flag `:968-985`, and the cracker `:1121-1127`. Delivery is on request, through hub choices (`m02_phone_agent0x99.ink:139-171`).

- Minor: the lockpicking guide is offered when the briefing closes (`:792-797`), before the player meets any lock. Its first real use is the IT door.
- Gap: `encoding-and-decoding-with-cyberchef.md` exists, but m02 never offers it, even though it has a ROT13 note and two decoding tools. Offer it from `read_operator_note`.

### 2d. Narrative structure: OK, with CONCERNs on payoff

- **Opening:** `opening_briefing_cutscene` uses `skipIfGlobal: briefing_played` (`:575-582`). The briefing is strong. It sets up the premise that "this is a mission about people" (`m02_opening_briefing.ink`, `security_routes`).
- **Closing:** the debrief fires on `mission_complete` (`:1266-1276`), and `hear_debrief` has a reload backstop (`:822-830`).
- **Event mappings spot-checked:** the burn (`:842-853`), naming the insider (`:1069-1107`) and the restore-source split (`:1149-1174`) all fire correctly. The payoff problems are in section 3: the Ghost deal, the death toll in the credits, and the "impossible choice" line.

### 2d′. Ink conventions: OK

There is a narrator voice (`:115-123`). Combat is handed off through `#hostile` (`m02_npc_security_guard.ink:136`, `:289`, `:339`). One scripted `You: Who are you?` line in `m02_npc_asset.ink:319` doesn't follow a choice. The dialogue pass should fold it into narration.

### 2d″. Patrol guards: CONCERN

Val's waypoints are in bounds (the 10×10 office, `:2756-2761`), her cone is 140°/150 px with `visualize: true` (`:2767-2772`), and she patrols an office-sized room. But her patrol guards nothing. Her room has no key lock, so the catch can't fire, and the server-room door is RFID. Section 4 covers this.

Nurse Raval's 360°/16 px LOS (`:1473-1477`) is a near-contact reactor with no mapping attached, which is fine.

### 2e. Dungeon graph metadata: CONCERN (minor)

- The critical path ends on `identify_inside_asset` instead of the conclusion aim `restore_hospital_systems`.
- `lock_guard_challenge` and `lock_gary_cooperation` are dangling lock nodes (`dungeon_graph.md:97,109`). The three lanyards point at a challenge (`:1414`, `:1812`, `:2998`) that gates nothing in the graph. Under the U2 design this node becomes the security-office door.
- The starting lockpick is present as a tool node with `puzzle_graph_unlocks` (`:526-528`).
- The VM chain is connected through `puzzle_graph_links` (`:2095-2097`, `:2716-2719`).

### 2f. Room layout and dead ends: OK, minor

- `ward_vestibule` and `ward_hall` are empty transit rooms (`:3004-3028`), and `ward_approach` holds one note. The walk from reception to Kim is six transitions. The Bernie vouch route doubles that, since reception to IT is seven rooms each way.
- Room types fit the setting. The door corners are deliberate and documented (`:70-80`).

### 2g. Objectives scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Bark or conversation at the transition |
|---|---|---|---|---|
| Talk Your Way In | 4 | 4 (rooms and NPCs) | low | HaX after sign-in (`:804-808`) |
| Get Into IT | 4 | 2 (two `manual`: hints, ransom screen) | low | HaX after Kim (`:836-841`) |
| Somebody Pulled Your Booking | 3 | 1 (two `manual`) | **high**: the burn's obstacle is invisible (2a), and the lanyard can be picked up before the burn | HaX burn texts (`:842-853`) |
| Turn Their Backdoor Around | 4 flags | 4 (guides plus HaX) | medium: `general_advice` is stale in the server room (3.2) | HaX on server-room entry |
| Somebody Held The Door | 2 | 2 (auto from evidence) | low | HaX (`:1032-1043`) |
| Put A Name To The Badge | 2 | auto | none, which is itself the problem: the deduction is done for the player (3.4) | HaX names him |
| The Keys In The Safe | 3 | 3 | low (often done before the aim shows; the engine handles that, `objectives-manager.js:641-650`) | HaX (`:1115-1120`) |
| Bring The Wards Back | 4 | 4 | **high on the slow path**: Bed 4 has no pointer, and HaX sends the player the other way (3.3) | Ghost call, HaX texts |

Task titles mostly say what to do. Two exceptions:

- "Find out your cover has been pulled" (`:308`) describes something that happens to the player. It's a `manual` task HaX completes.
- "Settle the ransom question" (`:486`) completes from the same console click as "Choose a restore method" (`:1149-1174`), so two tasks tick at once. Retitle it "Choose between paying and the offline keys at the console", or fold it into the restore task.

### 2h. KO resilience

| Person NPC | Gates a required task or item? | `taskOnKO` | KO reflected in debrief/credits? | Verdict |
|---|---|---|---|---|
| Bernie (`receptionist`) | sign-in, IT key | `sign_in_at_reception` `:639` | debrief yes (`m02_closing_debrief.ink:687-690`); credits no | OK; add a credit line |
| Dr Kim | meet task, boardroom code | `meet_dr_kim` `:2453` | debrief yes (`:711-713`); credits no | OK (the diary has the code) |
| Gary | keycard, hints | `talk_to_gary` `:1790`; `gary_ko` completes the hints task `:1020-1026` | debrief yes (`:715-717`); credits no | OK |
| Sister Doyle | PIN clue (side aim) | `gather_pin_clues` `:1401` | yes (`:707-709`) | OK |
| **Nurse Raval** | nothing | none | **No. She shares `ward_nurse_ko` with Doyle** (`:1454`), so KO'ing Raval silences Doyle's barks (`:1424`, `:1431`) and the debrief says "Sister Doyle… You dropped her" (`:707-709`) | **Should fix**: give her `raval_ko` and her own line |
| **Patients (beds 2, 4, 5)** | Bed 4 holds the manual-ventilation save | none | **No.** Combat lets the player punch any visible NPC (`player-combat.js:287-320`). KO'ing Mr Pryce removes the save, and the debrief then says "I'm not putting that on you" (`:293`) | **Should fix**: `globalVarOnKO`, a HaX reaction and a debrief line. The engine-side fix is in the backlog |
| Reeves | nothing required | n/a | yes, both known and unknown (`:594-606`); credits `:192` | OK, but see the ambush order in 3.5 |
| Val | nothing required today; the security door under U2 | n/a | yes (`:696-699`); credits `:189` | OK. Under U2 the door stays pickable after a KO, and her key can drop |

The win condition (`mission_complete` from the press terminal) can't be blocked by any KO: the terminal is an object, and the boardroom code is in the diary.

## 3. Beyond the checklist

### 3.1 The midpoint doesn't bite, and it can resolve before it happens

The scenario header calls the cover burn "the TURN" (`:27-29`). In play it is mostly a pair of HaX texts.

- **Nothing in the world reacts.** Val doesn't stop you (2a). The server-room door only wants Gary's card, which you got in the same conversation that triggered the burn.
- **The fix can come before the problem.** The spare contractor lanyard sits in the handover room (`:2991-3000`), which every player crosses on the way to Kim and Gary. Picking it up sets `staff_lanyard_obtained` and `cover_restored` with no check on `cover_burned` (`:864-870`). That fires HaX's "That'll hold. Now -- whoever made that call is still in the building…" (`:924-930`) **before any call has been made**. Then the burn text "Stop. Listen to me carefully…" (`:842-848`) arrives with nothing to follow it. Players who take the lanyard early (most players take everything) get the beats in the wrong order.
- **The safety net closes three branches.** `access_server_room` always sets `cover_restored` (`:878-886`), so the following can never be seen:
  - the credit "COVER BURNED: Booking pulled…" (`:186`), which needs `!cover_restored`;
  - the debrief choice "I never did get it back. I worked the rest of that night as a trespasser." (`m02_closing_debrief.ink:154`);
  - HaX's line "Nobody vouched for you…" (`:692-694`).
- **The KO path claims a clean record.** KO'ing Val also sets `cover_restored` (`:931-938`), so her assault and "COVER RE-ESTABLISHED: Access regained without incident" (`:187`) appear in the same credits.

The U2 design in section 4 fixes all of this together. Val becomes the physical gate, and `cover_restored` means only "someone accepted your standing".

### 3.2 Does the player always know what to do next?

Mostly yes. The HaX texts at sign-in, at Kim and at Gary hand on cleanly (`:804-853`), and the hub has a progress-gated `general_advice` (`m02_phone_agent0x99.ink:693-748`). The gaps:

- **Server room, before the first flag.** `general_advice` still says "Gary is your route to the server room" (`:705`) while the player is standing in it, card in hand. Add a branch for "in the server room, no SSH flag yet" (gate on `scanning_guide_offered and not flag_ssh_submitted`) that names the Kali box, the backup server and the drop-site.
- **Post-burn options name the wrong place.** "The officer in the security office" (`:227`) needs updating if Val moves (section 4).
- **The IT door.** HaX's "her desk faces that door" warning (`:380`) sends the player looking for a watcher who isn't there.

### 3.3 Bed 4: the one countdown has no pointer

Choosing offline keys only starts `bed4_slow_path_window` (100 s), then `bed4_death_window` (45 s) (`:3076-3095`). The player is in the server room, four rooms from the ward. The only signs that anything is wrong are:

- the HUD countdown labelled "Bed 4 — critical" (`:3078`);
- barks from Doyle, Raval, Chen and Pryce (`:1423-1427`, `:1484-1489`, `:1521-1526`, `:1605-1609`), which can only be heard in the ward.

Five seconds after the choice, HaX sends the player the other way: "the conference room has a hospital communications terminal" (`:1175-1179`). A player who does as the handler says loses Mr Pryce, and the debrief then tells them a faster route home might have reached him (`m02_closing_debrief.ink:293`).

Fix: a HaX text on `global_variable_changed:slow_path_window_open` (Doyle radioed: Bed 4 is alarming, she can't leave Bed 2, you're nearest). Suppress the conference-room pointer until `bed4_manually_stabilised || patient_bed4_deceased`. The manual-bagging scene in `m02_npc_patient_bed4.ink:96-124` is one of the best moments in the mission, and right now most players will miss it.

### 3.4 The insider is named for the player

The badge number SC-4471 appears only in Ghost's log (flag 4) and the boardroom post log (`:2697`). The task "Match the badge number to the security post it belongs to" (`:418`) suggests the player does the matching. In practice:

- `insider_evidence_partial` is set by seven objects (`:1027-1031`), including the handover board in a room every player crosses (`:2952`).
- So the handler at `:1100-1107` names Graham Reeves 4.2 s after flag 4 for nearly everyone, before they reach the boardroom.

The comment at `:1085-1091` says gating on the post log alone once soft-locked the ending. That stopped being true when `concludeRequires` moved to flags only (`:463-475`). Now the gate only costs score.

Proposal:
- With partial evidence and the badge, HaX should prompt rather than tell: "You've got a name in your notes and a number off their log. The post that badge sits on will have a duty sheet. Go and read it." That points at the boardroom.
- Keep `inspected_asset_post` (`:1077-1084`) as the naming route, alongside the Reeves confrontation.
- This also removes the duplicate naming texts (validator warning 12).

### 3.5 The ending: choices that don't land

- **The Ghost deal is after the fact** (2a). Two ways to fix it:
  - **Small:** fire Ghost's call when the console first becomes usable (`global_variable_changed:restore_manifest_obtained`, or when flag 4 is submitted at the drop-site, three steps from the console). Leave the deal as the narrative choice it already is.
  - **Larger, and better:** make the deal a fourth console source. The console reads `keySlots` and `backupRecoverySources` from data (`:2102-2220`). A `ghost_keys` item given by Ghost's `#give_item` would enable a "Ghost's keys" source: under an hour, free, but it binds you to upload. The mission then has a real three-way trade: pay ENTROPY money, pay Ghost the lesson, or pay in time.
- **The dominant option.** With the safe open early and flag 4 required anyway, combined recovery (4 h, nothing paid, two deaths) is almost always on offer and beats both other routes. Combined gives the same deaths as paying (`m02_closing_debrief.ink:250` vs `:279`). The debrief still says "Ghost built that choice so that it couldn't be got right" (`:754`) on every path. On the combined path, condition that line or reword it so it credits the player for finding the third way. The larger Ghost-deal change above would also give the decision real cost again.
- **Credits contradict the debrief.** "PATIENT DEATHS: 6" shows for any `!paid_ransom` (`:174`), including the combined restore, where the debrief says two died (`m02_closing_debrief.ink:279`). Condition 2 on `paid_ransom || ward_recovering`, and 6 on `!paid_ransom && !ward_recovering`.
- **Timing doesn't agree.** The console promises "ETA 30 MINUTES" if you pay (`:2138`) and Ghost says the same. The debrief says "Monitoring was back inside four hours" (`m02_closing_debrief.ink:248`). HaX's "Whatever the board chooses" (`:1133`) is wrong too: the player chose, at the console.
- **The Reeves ambush is wrong on the quiet path.** It fires on `decide_hospital_exposure` for both outcomes (`:2634-2641`), but opens "Your transmission clears the relay" (`m02_npc_asset.ink:315`). It sets `insider_asset_escaped` before any fight (`:332`). A player who then KOs Reeves is credited "Escaped in the scuffle" (`:191`) with him on the floor, because the debrief checks escaped before KO (`m02_closing_debrief.ink:559-563`). The terminal sets `mission_complete` in the same pass (`m02_object_press_terminal.ink:171-175`), so the debrief cutscene and a hostile Reeves start at the same moment. **Verify in a playtest** which wins. Proposal: set `insider_asset_escaped` only when the fight ends without a KO, or only if the player leaves the boardroom, and give the stay-quiet path its own opening line.

### 3.6 How clearly each puzzle teaches its idea

- **Strong:** the RFID door on an isolated controller (`:1309-1316`, `:2849-2859`). The password-reuse chain (sticky note → workstation → SSH, `:1847-1897`). The founding-year PIN flagged at three audits (`:2963`), which ties into the theme that everyone was warned.
- **Weak:** the ROT13 note is decoded by the handler (2b). The oracle has two explanations (2c). "Read a ransom screen and identify who you are up against" (`:278`) completes from any ransomware screen, including the one at reception in minute one, so the encoded-ransom-note idea in the tool text has no puzzle behind it.
- **Missing:** the briefing calls picking "a confession if anyone sees you do it" (`m02_opening_briefing.ink`, `security_routes`), and the start kit says the same (`:525`). In the current build nobody ever sees you (section 4). The mission states its main physical-security idea and never tests it.

### 3.7 Pacing and dead time

- **Transit:** two empty rooms and a one-note hallway on the busiest route (2f). The puzzle plan already offered dropping `ward_vestibule` (`PHASE2_PUZZLE_CHAINS.md:882-886`). If it stays, give it one beat, for example the husband Bernie walked round three wards (`m02_npc_receptionist.ink:373`).
- **Message floods:** three texts plus a conversation on server-room entry, and three guide offers after the SSH flag (section 1). Merge each set into one HaX text listing the guides on offer.
- **The safe:** it can be opened in the first few minutes from the plaque and the nurse's note. The plan intends this, but the "Keys In The Safe" aim then appears already done, and HaX's escrow text (`:1115-1120`) talks about a console the player hasn't seen. Harmless, but it flattens the middle.

### 3.8 Fun

The talking is excellent. Bernie, Gary and Val each offer several routes, and the routes change what happens later (Bernie's vouch, Gary's lanyard, Val's notebook). The physical side has no tension at all. Nothing in the building watches you except a guard whose watching can't trigger anything. Val as a corridor turnstile (section 4) adds the one stealth beat the mission needs, at the moment the story says the building has turned against you.

A cheap second beat: Gary sits in the room with the pick-only filing cabinet (`:1908-1918`). Picking it in front of him could open a short catch conversation that feeds his trust: "That's my filing cabinet. …Go on, then, read it." It fires already, because for an object the gate uses `currentRoomId` (`unlock-system.js:192`). It needs the key-holder engine fix in section 4 to reach most players.

### 3.9 Does the debrief reflect what the player did?

Largely, and well. Restore route, Bed 4 save or loss, exposure, Gary, the advice to Kim, Reeves (five branches), Bernie, Val's KO, Kim, Gary and Doyle KOs, and the lore finds all have their own lines. The gaps:

- **Being caught picking.** Val's `caught_lockpicking` is a local ink VAR (`m02_npc_security_guard.ink:30`), and Bernie's `seen_picking_by_bernie` is never set. Set a global from Val's catch and give it a line in the staff section.
- **Raval and the patients** (2h).
- **Ghost's deal.** The debrief says "Got the keys without the ransom payment" (`:223-225`), which isn't true mechanically.
- **Credits KO lines** for Bernie, Kim and Gary, matching m01.
- **The cover credits** (3.1).
- **The PIN cracker's origin.** "That PIN-cracker I pulled off the inside asset" (`m02_closing_debrief.ink:116`): the cracker came out of a sealed case in the server room (`:2258-2281`), not off Reeves. Reword it to "found in their kit".

## 4. U2: Val's lockpick catch

### 4.1 What counts as "in her room" (from the code)

The catch only starts from the key-lock branch of `handleUnlock`, `unlock-system.js:134-253`. Inside it:

1. **The player must hold no key at all.** `playerKeys` collects every inventory item of type `key` (`:141-167`). If there is even one, the key-selection minigame opens (`:175-186`), and its "Switch to Lockpicking" button (`lockpicking-game-phaser.js:402-406`; enabled from `minigame-starters.js:406-409`) goes straight to pick mode **with no line-of-sight check**. The interrupt check exists only in the `else if (hasLockpick)` branch (`unlock-system.js:187-214`).
2. **Which room is checked.** `roomId = lockable.doorProperties?.roomId || window.currentRoomId` (`:192`).
   - **Door:** each room builds sprites for its own connections (`doors.js:416-518`) and stamps `doorProperties.roomId` with the building room. So the room is the one the player stands in, and the lock state comes from the room on the far side (`doors.js:484`, `:510-514`).
   - **Container:** no `doorProperties`, so the room is the player's current room.
3. **The NPC.** `shouldInterruptLockpickingWithPersonChat` keeps only these NPCs (`npc-manager.js:290-334`):
   - `npc.roomId === roomId` and `npcType: person`;
   - not KO'd and visible;
   - a `lockpick_used_in_view` mapping with `conversationMode: "person-chat"`;
   - and that mapping would fire now, per `_mappingWouldFire` (`:559-608`, which checks cooldown, condition and once-only).

   Then it checks the LOS cone from the sprite centre (`:336-388`).
4. **The NPC's room is fixed.** `npc.roomId` changes only on a multi-room route transition (`npc-behavior.js:1179-1186`). `updateCurrentRoom` updates the behaviour's copy, not the manager's (`npc-behavior.js:629-656`). So a single-room NPC is always checked against the room she was defined in.

**Result for Val today.** She is defined in `security_office` (`:2724-2816`). Its doors as seen from inside are east to `office_corridor` (unlocked) and west to `server_room` (`lockType: rfid`, which never reaches the key branch). It has no key-locked containers. Nothing she can see is a key lock, so the mapping at `:2774-2781` can never be reached.

**And after any move.** Bernie always hands the player the IT override key at first meeting (`m02_npc_receptionist.ink:207-212`; on a KO it drops from `itemsHeld`, `scenario.json.erb:642-652`). Practically every player holds a `key` by the time they're near Val. Rule 1 then bypasses the check even after she has a lock to watch. **No room move alone will make her catch fire.** A key-holder fix is needed (4.4).

Other NPCs in m02 with the same dead mapping:

| NPC | Mapping | Why it can't fire |
|---|---|---|
| Bernie | `lockpick_used_in_view` bark plus `seen_picking_by_bernie` (`:662-670`) | (a) no `conversationMode: "person-chat"`, so the gate skips her (`npc-manager.js:311-319`), and `lockpick_used_in_view` is only ever emitted by the gate (`unlock-system.js:205`); (b) reception has no key lock; (c) the key rule above. Her return branch (`m02_npc_receptionist.ink:243-248`) and HaX's warning (`m02_phone_agent0x99.ink:380`) can't be reached or are false. |
| Gary, Kim, Doyle, Raval, Reeves, patients | none | No mapping. Gary is the one worth adding (3.8): he sits next to a pick-only cabinet. |

The only other pick-only lock, the sealed case in the server room (`:2258-2269`), has nobody watching it.

m03 and m06, the other two missions with a lockpick catch, give the player no `key` item (grep: 0 key items in each), so they don't hit rule 1. m02 is the only mission where it bites.

### 4.2 The design: Val on the corridor, her office door locked

This follows the user's suggestion and copies the m06 checkpoint turnstile, which is already proven in play (`m06_follow_the_money/scenario.json.erb:1097-1150`: guard in the hall, the next room locked with a key lock, `unlockable` plus `#unlock_door`, LOS on horizontal legs, cooldown 250).

Several existing lines already put Val on the corridor:
- "Okonkwo on north" (`m02_npc_security_guard.ink:338`);
- "Val Okonkwo, security officer, north corridor" (`m02_closing_debrief.ink:697`);
- "That solves your corridor problem" (`scenario.json.erb:937`);
- Gary's "something that holds up in a corridor" (`m02_npc_gary_whitlock.ink:432`);
- Doyle's "back up that corridor" (`m02_npc_ward_nurse.ink:165`).

**Rooms and lock**

- Move `security_guard_patrol` from `security_office.npcs` to `office_corridor.npcs`. `office_corridor` currently has `"npcs": []` (`:2910`). Keep the id (the rename rule doesn't apply: same person).
- `security_office` gets these fields, and its connections don't change:

  ```json
  "locked": true, "lockType": "key", "requires": "security_office_key",
  "keyPins": [ …4 values… ], "difficulty": "easy"
  ```

  It is the only route to the server room (`:2005`). The door, seen from the corridor, is the corridor's west door, 2.5 tiles from the top (`predict_door_sides.py`: `office_corridor … west=TOP(y2.5)`). That door sprite's `doorProperties.roomId` is `office_corridor`, the same as Val's room.
- Val gets `"unlockable": ["security_office"]`. The server accepts `#unlock_door` only from an NPC the player has met who lists the room (`app/models/break_escape/game.rb:971-996`).
- Val's `itemsHeld` gains a **Security Office Key** (`opens_lock: security_office_key`, same `keyPins`), which drops on a KO (`npc-hostile.js:262-284`). She never hands it over in dialogue, so E22 (reload re-adding given items) doesn't apply.

**Patrol and LOS**

The corridor is `room_hospital_hall`, 10×6 tiles, with a floor three tiles deep (rows 2–4, columns 1–8, from the `walls` layer). The north door to the handover room is top-LEFT and the south door from the ward link is bottom-RIGHT (`predict_door_sides.py`). Every player crosses her beat on the way to Kim and Gary, so she is met early.

Two waypoints on one row, horizontal legs only. Horizontal legs keep clear of the facing-table issues fixed in E2 (`npc-los.js`), as m06 does.

```json
"behavior": { "facePlayer": false, "patrol": { "enabled": true, "pauseForPlayer": false,
  "waypoints": [ { "x": 3, "y": 3.5, "dwellTime": 4000 },
                 { "x": 7.5, "y": 3.5, "dwellTime": 4000 } ],
  "waypointMode": "sequential", "speed": 40, "loop": true } },
"los": { "enabled": true, "range": 150, "angle": 140, "visualize": true }
```

The cycle:
- **West end (3, 3.5):** she arrives walking west, so she faces the security door at about 2 tiles. She sees the pick.
- **East leg and east end (7.5, 3.5):** her back is to the door, and she is about 6.5 tiles (~210 px) away, past the 150 px range. Safe.

That gives about 4.5 s seen and about 8 s safe at speed 40. After the burn, the existing `setPatrolSpeed: 62` and `setDwellMultiplier: 0.4` (`:2788-2789`) tighten the safe window to about 4 s: the corridor is more dangerous after the burn without being hard. The gate only checks when the pick starts, so the player just needs to start inside the window. That fits "fun, not hard".

Keep W1 at x ≥ 3 so she doesn't stand in the north doorway. The implementer must probe the exact window the m06 way: the eye is the sprite centre, about 31 px above the feet; also check the cone doesn't spill through walls (m06 cut range from 225 to 210 for this). If the cone does spill, set range to 140.

**Event mappings on Val**

1. The catch, kept but fixed:

   ```json
   { "eventPattern": "lockpick_used_in_view", "targetKnot": "on_lockpick_used",
     "conversationMode": "person-chat", "background": "assets/backgrounds/hospital1.png",
     "onceOnly": false, "cooldown": 250, "condition": "!globalVars.attacked_guard" }
   ```

   Change the cooldown from 30000 to 250. With the E4 gate, a 30 s cooldown means that after one catch the player can pick in front of her freely for 30 s (`npc-manager.js:322-332`). 250, not 0, because of E21's duplicate listeners (see the m06 comment at `m06…/scenario.json.erb:1137`). The condition stops a hostile Val from opening a chat.
2. **New**: make the burn land.

   ```json
   { "eventPattern": "room_entered:office_corridor",
     "condition": "globalVars.cover_burned && !globalVars.cover_restored && !globalVars.attacked_guard",
     "onceOnly": true, "conversationMode": "person-chat", "targetKnot": "cover_challenge",
     "background": "assets/backgrounds/hospital1.png" }
   ```

   A KO'd Val is skipped by the engine (`npc-manager.js:811-823`).
3. Keep `global_variable_changed:cover_burned` (bark plus speed-up).
4. `room_entered:server_room`: add `"condition": "!globalVars.val_opened_office"`. It then plays only for players who picked or slipped past. It becomes the after-the-fact catch ("Hang on -- server room's authorised IT personnel only"), which is a fair cost for picking unseen.

**Scenario mappings on HaX** (mission-local)

- The three lanyard pickups (`:857-877`) and the lanyard gifts in Gary's and Doyle's ink (`m02_npc_gary_whitlock.ink:609-610`, `m02_npc_ward_nurse.ink:252-253`) set only `staff_lanyard_obtained`, not `cover_restored`. The lanyard becomes what you show Val. It no longer quietly undoes the burn.
- `regain_freedom_of_movement` completes on `room_entered:security_office` (new handler), so every route counts: talk, pick, KO.
- Remove `setGlobal cover_restored` from the server-room safety net (`:878-886`) and from the guard-KO handler (`:931-938`; keep its task completion and text). `cover_restored` then means "someone accepted you". The cover credits, the debrief line "I worked the rest of that night as a trespasser" and HaX's "Nobody vouched for you" become true and reachable (3.1).
- Rename the task "Get something that stands up to a security challenge" (`:314`) to **"Get past Val at the security office"**.

**Val's ink** (`m02_npc_security_guard.ink`)

- **Pre-burn**, in `claim_consultant` (`:89-99`): she doesn't open up, and points the player to Gary. New line, roughly: "Server room's card-only and there's one card left in this building -- Gary's, in IT. Come back with it and I'll open the office for you." This turns the first meeting into a signpost. When the player comes back, she has been told they don't exist. Because the burn fires on `talk_to_gary` and the card comes only from that conversation or its KO, the card and the burn always arrive together.
- **Clearance knots** `show_lanyard` (`:141`), `bernie_backs_you` (`:170`) and `earn_it` (`:200`): add `#unlock_door:security_office`, `#set_global:val_opened_office:true` and one Narrator line ("She unlocks the office door and stands aside.").
- **Hub choice** for a player whose cover was restored elsewhere (Bernie vouched before meeting her): `+ {cover_restored and not val_opened_office} [Val -- I need the server room.]` leads to a short line and the same three tags.
- **Catches**: keep `lockpick_first` and `lockpick_again` as written (`:257-318`). They fit the corridor: the torch beam arrives first, "Away from the door", and "not in my office" is now literally true. The first choice, "Reception key's not working on this one", fits every key-holder.
  - Add `#set_global:val_caught_picking:true`.
  - Route `lockpick_first` and the `lockpick_again` replies through `start`, not `hub`, so a player caught after the burn goes straight into `cover_challenge`.
  - The catches lower `influence`, which gates `earn_it` (`>= 20`, `:123`). Being caught already costs you the talk route. That's the consequence the briefing promised.
- **Stage directions to update** (spoken lines unchanged unless noted):
  - first-encounter Narrator (`:62`: "the officer in it has clocked you through the glass") becomes she's on the corridor, in front of the office door;
  - `cover_challenge` Narrator (`:106`): "crosses the office" becomes "crosses the corridor", and "the server room door" becomes "her office door";
  - `:240` "a windowless room" becomes "a corridor";
  - `:471` "*from across the office*" becomes "*from the corridor*".
- **Other files:**
  - Bernie: "she's in that office by the server room" becomes "she's on the north corridor, outside the security office" (`m02_npc_receptionist.ink:410`);
  - HaX: "The officer in the security office" becomes "The officer on the main corridor" (`m02_phone_agent0x99.ink:227`);
  - HaX: delete the false "her desk faces that door" warning (`:380`);
  - the security-desk observation "why Val is stood in this room" (`scenario.json.erb:2827`).

**Spoken lines touched:** about 6 new (the pre-burn pointer ×2, the hub reply ×2, the narration on unlocking ×1, the catch-to-challenge bridge ×1) and about 7 edited (Bernie ×1, HaX ×2, Val Narrator ×4). m02 audio is generated after this pass, so there's no cached-audio cost.

**Routes after the change** (all keep the mission solvable)

| Route | How | Notes |
|---|---|---|
| Talk | lanyard (the spare is always in the handover room), Bernie's vouch, or Val's `earn_it` | always available; the lanyard is a free pickup |
| Pick | the west door in her blind window | caught, she talks; she never blocks |
| KO | KO Val, then take her key or pick | the gate skips a KO'd NPC (`npc-manager.js:300`); the HaX KO text (`:937`) already says "corridor" |
| Pick before the burn | possible; the door stays open | fine: the player chose the risky route, and she still challenges on corridor entry after the burn |

Graph: point the three lanyards and the new `val_opened_office` action at `door_security_office`, replacing the dangling `lock_guard_challenge`.

### 4.3 Alternatives considered

- **A key-locked drawer or locker in her current office** (the log's first option). It only works with the key-holder fix, and it guards nothing the player needs. Rejected.
- **A multi-room patrol (office ↔ corridor).** `npc.roomId` changes per segment (`npc-behavior.js:1179-1186`), so the catch would only work while she happens to be on the corridor segment, and the route relocates her sprite to the door (`npc-sprites.js:1643-1690`). Unproven for the gate. Rejected.
- **Drop the mapping.** That loses the only test of "picking is a confession". Rejected.

### 4.4 The key-holder bypass (needed for the catch to fire)

**Option A (engine, needs approval, recommended).** Run the same interrupt check when the player presses "Switch to Lockpicking" in the key-selection minigame:
- pass a callback from `startKeySelectionMinigame` (`minigame-starters.js:395-411`) into the button handler (`lockpicking-game-phaser.js:406`);
- if an NPC interrupts, end the minigame and emit `lockpick_used_in_view` exactly as `unlock-system.js:199-212` does.

Using a real key in view stays legal. Only picking is caught. It affects only missions where the player holds a key near a catching NPC (today, only m02). Check it with the node tests, the m03/m06 catch regression and an m02 playtest.

**Option B (mission-local fallback if A is declined).** Bernie stops giving the IT key and opens IT herself:
- `unlockable: ["it_department"]` on Bernie, and `#unlock_door:it_department` in `offer_key` in place of `#give_item` (`m02_npc_receptionist.ink:212`);
- story: she radios the porter on the exec corridor;
- a KO still drops the key.

Talk-route players then hold no key and the catch fires for them. Cost: about 3 lines rewritten, the "holds it a moment before letting go" beat is lost, and HaX's "Reception has the key" hint (`m02_phone_agent0x99.ink:379`) needs rewording. Bernie's dead mapping should be dropped either way.

**Recommendation:** do 4.2 now (mission-local) and file A for approval. If A is declined, apply B.

## 5. Proposed fixes

Tags: **[blocker / major / minor]**, **[local]** = the mission's own erb, ink and docs; **[approval]** = engine, shared code, tooling or other repos.

1. **[major][local] U2: Val becomes the corridor turnstile** (section 4.2): Val moves to `office_corridor`, `security_office` gets a key lock, `unlockable`, `#unlock_door` in the clearance knots, the patrol and LOS above, cooldown 250 with a condition, the `room_entered:office_corridor` challenge, her key in `itemsHeld`, and the stage-direction updates.
2. **[major][approval] Run the lockpick interrupt check on "Switch to Lockpicking"** in the key-selection minigame (4.4 A). Without it, fix 1 gives a real gate but the catch still won't fire for anyone holding Bernie's key, which is nearly everyone. If declined, apply **[major][local]** 4.4 B (Bernie opens IT by `#unlock_door`).
3. **[major][local] Lanyards no longer restore cover on pickup**, and `cover_restored` means only "accepted": `:857-877`, `:878-886`, `:931-938`, Gary `:609-610`, Doyle `:252-253`. `regain_freedom_of_movement` completes on `room_entered:security_office`. This fixes the out-of-order HaX text and makes three dead branches reachable (3.1).
4. **[major][local] Bed 4 pointer**: a HaX text on `slow_path_window_open`, with the conference-room text held back until Bed 4 resolves (3.3).
5. **[major][local] Ghost's offer before the choice**: move `on_recovery_console` to fire when the console becomes usable (`restore_manifest_obtained` or the flag-4 submission). Better still, add a fourth "Ghost's keys" console source given by Ghost's `#give_item` (3.5). Fix the dead HaX choice at `m02_phone_agent0x99.ink:187` to match.
6. **[major][local] Credits death toll**: condition on `ward_recovering` (`:173-174`) so the combined restore shows 2, not 6.
7. **[major][local] Raval's KO global**: `globalVarOnKO: "raval_ko"` (`:1454`), plus a debrief line, so a KO on Raval stops reading as a KO on Doyle.
8. **[major][local] Patient KOs**: `globalVarOnKO` on beds 2/4/5 (e.g. `patient_assaulted`), a HaX reaction text, and a debrief and credits line. The engine-side fix is in the backlog.
9. **[minor][local] Make the player read the post log**: drop the naming handlers driven by `insider_evidence_partial` (`:1092-1107`) in favour of a prompt that sends them to the boardroom. Naming comes from `inspected_asset_post` or the confrontation (3.4). This also removes the duplicate naming texts.
10. **[minor][local] The Reeves ambush**: set `insider_asset_escaped` only if the fight ends without a KO; give the stay-quiet path its own opening line (`m02_npc_asset.ink:315`); put KO before escaped in the debrief order (`m02_closing_debrief.ink:556-563`). **Verify in a playtest** how the ambush and the debrief cutscene interact on the same click.
11. **[minor][local] HaX text floods**: merge the three server-room texts into one and the three SSH-flag guide offers into one; drop "Decision logged. Whatever the board chooses" (`:1128-1134`).
12. **[minor][local] `general_advice` in the server room**: add a branch for "in the server room, no SSH flag yet" (3.2). Also fix "Main corridor, far door" (`m02_phone_agent0x99.ink:360`) and delete the "her desk faces that door" warning (`:380`).
13. **[minor][local] Bernie's dead catch**: delete the mapping (`:662-670`) and the `returning` branch it fed (`m02_npc_receptionist.ink:243-248`). Optionally, if a reception key box is ever added, rebuild it as a person-chat catch.
14. **[minor][local] Ending consistency**:
    - the paid restore's "inside four hours" (`m02_closing_debrief.ink:248`) should be "inside the hour";
    - condition the "couldn't be got right" line (`:754`) on the path taken;
    - reword "pulled off the inside asset" (`:116`);
    - rewrite Nightshade's "response timing" line (`:125`) so it describes the Mastermind feedback the device actually uses.
15. **[minor][local] Debrief and credits reflect being caught and KOs**: set `val_caught_picking` from her catch and give it a staff-section line; add credit lines for Bernie, Kim and Gary KOs (m01 pattern).
16. **[minor][local] ROT13 and CyberChef**:
    - HaX's `read_operator_note` text should name the cipher and point at a tool, not give the plaintext (`:911-916`);
    - offer the `encoding-and-decoding-with-cyberchef` field guide from the same event;
    - fix the CyberChef observation and graph note that refer to a Base64 note (`:2073-2075`);
    - delete the unused `ransomware_note`, `base64_encode` and `decoded_recovery_instructions` (`:86-95`, `:3199`).
17. **[minor][local] Task titles**: "Find out your cover has been pulled" (`:308`) and "Settle the ransom question" (`:486`, which completes on the same click as the restore task); retitle as in 2g.
18. **[minor][local] Graph metadata**:
    - point the lanyards at the security-office door (replacing `lock_guard_challenge`) and remove `lock_gary_cooperation`, or connect it to the keycard;
    - mark one of the two 1987 clues `puzzle_graph_optional`;
    - check the critical path ends on `restore_hospital_systems` after the edits.
19. **[minor][local] Optional Gary catch**: a `lockpick_used_in_view` person-chat on Gary for the filing cabinet, with a short knot that rewards a player who is honest about it (3.8). It depends on fix 2 or 4.4 B.
20. **[minor][local] Transit rooms**: give `ward_vestibule` one beat (the husband looking for his wife), or remove it as the puzzle plan proposed. This needs a door-side re-check, because the ward's corners depend on `ward_approach`'s column (`:70-80`).
21. **[minor][approval] Schema**: add `mutuallyExclusiveGlobals` to `scripts/scenario-schema.json`, so the validator stops flagging its own field.

## 6. Ideas for the backlog

- **Engine: LOS check on pick-mode switch** (fix 2). It is the general version of U2: any guard watching a key lock fails silently once the player holds an unrelated key.
- **Engine: a `nonCombatant` flag on NPCs** (`behavior.nonCombatant: true`), which `player-combat.js:287-320` skips. It's for bed-bound patients and similar characters, where an assault has no story and no fallback.
- **Engine: a "player spotted" event from LOS.** Today the cone does nothing unless a lock is being picked. A `player_in_view:<npc>` event with a cooldown would let guards challenge on sight, without needing `room_entered` as a stand-in.
- **Engine/tooling: the validator could flag catch mappings that can't fire**: a `lockpick_used_in_view` mapping without `conversationMode: "person-chat"`, an NPC whose room has no key lock on a door or container, or a 30 s or longer cooldown on a repeatable catch. The m02 and Bernie cases would have been caught statically.
- **Validator: `data.itemId` conditions.** Treat handlers on `item_picked_up:*` with different `data.itemId ===` values as disjoint. That removes two of m02's false-positive warnings and similar ones in other missions.
- **Minigame: backup-recovery console sources from items given mid-scene** (the "Ghost's keys" source in fix 5). This probably already works from data. If it doesn't, it's a small extension, and it would make deals with antagonists playable in later missions.
- **UI: one HaX text that lists several guide offers** with tap-to-request, instead of three back-to-back offer texts.
- **Design pattern for later missions:** "the credential is the cover". A burned cover should change what one specific NPC does at one specific door. m02's Val turnstile can be the worked example in `README_scenario_design.md` next to the m06 checkpoint.
- **Art (optional):** a corridor-appropriate pose or prop for Val (torch, radio) to sell the "torch beam arrives first" line. Ask before generating anything.

## 7. Changes made (pass 4 design)

Implementer: pass-4 design agent, 2026-10-02. Mission-local only: `scenario.json.erb`, ten of the fifteen ink files (recompiled), `TESTING_WALKTHROUGH.md`, this file and the new `PASS4_PLAYTEST.md`. No engine, shared or other-mission file was touched. Static checks only; **no browser playtest has been run** (script in `PASS4_PLAYTEST.md`).

Orchestrator decisions applied: engine fix A (LOS gate on "Switch to Lockpicking") is someone else's work and option B is not done, so Bernie still hands over the IT key; the player names the insider; Ghost's deal comes before the choice and matters; patients react in the story.

### Fix by fix

1. **U2, Val as the corridor turnstile: done.**
   - Val (`security_guard_patrol`, id kept) moved from `security_office` to `office_corridor`. `security_office` is now `locked`, `lockType: key`, `requires: security_office_key`, `difficulty: easy`. Val has `unlockable: ["security_office"]` and holds a **Security Office Key** (same `keyPins`), which drops on a KO.
   - Patrol: W1 (3, 3.5) and W2 (7.5, 3.5), horizontal only, 4 s dwells, speed 40, `facePlayer: false`, `pauseForPlayer: false`. LOS 140°, `visualize: true`, **range 110, not 150** (see the window below).
   - **Window, computed the m06 way** (the full working is in her `_comment`). The corridor template is 10×6 (the erb's `dimensions: 20×6` is ignored by the engine). The west door's sprite centre is (16, 80) room-local. A pick can start from a player sprite centre within 64 px of it and inside the floor: x 41–80, y 38–124. Val's eye is 31 px above her feet. At W1 facing west, the whole area is 16–70 px away and at most 54° off-axis: **seen**, with 40 px and 16° of margin. Facing east it is at least 126° off-axis: **safe**. At W2 it is 160–204 px away: **safe** on range alone. Walking west she starts seeing it with her feet at x≈184 and sees all of it from x≈144. Per loop that is about 5.6 s seen (plus 0.8 s partial) and 8.8 s safe. After the burn (speed 62, dwell ×0.4) it is about 2.6 s seen and 4.7 s safe. At range 150 the drawn cone reached 54 px into the security office; at 110 it reaches 14 px past the wall line. The window is computed, not observed: playtest step 6 checks it.
   - Mappings: the catch now has `cooldown: 250` and `!attacked_guard`. New: `room_entered:office_corridor` opens `cover_challenge` when the player is burned and not restored. The server-room catch is now gated on `!val_opened_office` and plays as an after-the-fact catch with a new "Footsteps behind you" line.
   - Ink: every clearance knot (`show_lanyard`, `bernie_backs_you`, `earn_it`) runs a `val_opens_office` tunnel: `#unlock_door:security_office`, `val_opened_office`, "She unlocks the office door and stands aside." New hub choice `open_after_vouch` for a player Bernie restored first. Before the burn, `claim_consultant` points the player at Gary's card ("Come back with it and I'll open the office for you"). Catches set `warned_player` and `#set_global:val_caught_picking:true`, then route through `after_catch`, so a burned player goes straight into the challenge speech (skipping the walk-up narration). Stage directions changed: first encounter, challenge, "a corridor", "from the doorway".
   - Other files: Bernie's "she walks the main corridor outside the security office"; HaX's cover-burn options rewritten around Val (lanyard, Bernie, Val's judgement, or pick in her blind spot); HaX's false "her desk faces that door" replaced with a true warning about Val's door; the security-desk observation updated.
   - **Limitation (engine):** anyone holding a `key` (Bernie's IT key, so nearly everyone) still bypasses the catch through "Switch to Lockpicking" until fix A lands. The blind-spot pick, talk and KO routes work regardless.
2. **Engine LOS on "Switch to Lockpicking": not done here** (another agent's engine work). Option B not done, as instructed.
3. **Lanyards and `cover_restored`: done.** The three lanyard pickups and Gary's and Doyle's gifts set only `staff_lanyard_obtained`; their texts no longer claim your standing is back. The server-room safety net is deleted, and the guard-KO handler no longer sets `cover_restored` or completes the task. `regain_freedom_of_movement` ("Get past Val at the security office") completes on the first `room_entered:security_office` after the burn, so talk, pick and KO all count. HaX's "That'll hold" now needs `cover_burned`. `cover_restored` comes only from Bernie's vouch or Val's clearance, so the COVER BURNED credit, "I never did get it back" and "Nobody vouched for you" are all reachable (pick or KO route). Doyle's burned greeting stops once she has given the lanyard.
4. **Bed 4 pointer: done.** HaX texts on `slow_path_window_open` (2.5 s): Bed 4 is alarming, get to the ward. The boardroom pointer is held (`!slow_path_window_open`) and sent instead when Mr Pryce is stabilised or lost. The wording ("The ward's just radioed") works if Doyle is down.
5. **Ghost's offer before the choice: changed approach (the larger option).** Ghost's `on_recovery_console` now fires on the first console use after the manifest, while no restore has been chosen (`object_interacted`, `objectType backup_recovery`). The video call closes the console. `ghost_offer_made` is set in the knot, so it can't replay. Accepting sets `ghost_deal_accepted`, which enables a fourth console source, **Ghost's Keys**: under an hour, no money, `requiresGlobal: ghost_deal_accepted`, manifest only. Using it sets `ghost_keys_used` and `ward_recovering`. "I need time to think" gets one more ask on the next console use (`on_console_again`), and the deal can also be accepted from the planted device's `mid_mission_contact`. Payoffs:
   - HaX's dead "I have Ghost's decryption keys" choice now shows (`ghost_deal_accepted and not ransom_decision_made`);
   - the debrief has `ghost_keys_outcomes`, plus a line for a player who shook on the deal and didn't use the keys;
   - the credits have a GHOST'S KEYS line;
   - Ghost has a post-decision `ghost_keys_response`.

   Why the larger option: with the timing fixed alone, "Keys transmitted" would still give the player nothing, so the deal still wouldn't matter.
6. **Credits death toll: done.** 2 on `paid_ransom || ward_recovering` (ransom, combined, Ghost's keys), 6 otherwise. RANSOM REFUSED is suppressed on the Ghost's-keys route.
7. **Raval's KO: done.** `globalVarOnKO: raval_ko`; her bark is guarded on it; Doyle keeps `ward_nurse_ko`. Debrief line for Raval, and a shared ward-staff credit.
8. **Patients: done in the story.** The engine has no non-combatant flag (`player-combat.js` converts any visible NPC it hits). Each bed has its own `globalVarOnKO` (`patient_bed{2,4,5}_ko`) and the barks are guarded on it. HaX reacts on the first `npc_attacked:patient_bed*` (`patient_assaulted`). There is a debrief staff line and a PATIENT ASSAULTED credit. A KO'd Mr Pryce can't be bagged, and the debrief owns that ("That one I am putting on you"). The engine flag stays in the backlog.
9. **The player names the insider: changed approach (orchestrator).** HaX no longer names Reeves. The four naming handlers are replaced with three nudges, none of which sets `insider_identified`:
   - reading the post log with the badge known confirms which post badge SC-4471 sits on (both orders wired);
   - evidence found after the badge points at the post log;
   - the flag-4 text says to find the duty sheet.

   The player names him by one of two routes:
   - **HaX's hub**: "I know whose badge SC-4471 is." with Reeves, Val, Gary or "not sure". A wrong name gets a pushback and the choices come back. Reeves → `badge_named_reeves`, where HaX confirms and adds the phone-call link.
   - **To his face**: Reeves' new "You're badge SC-4471." → `name_him` → `confrontation`.

   `general_advice` nudges a stuck player. The duplicate-naming validator warnings are gone. Unnamed costs score only (`concludeRequires` is flags-only).
10. **Reeves ambush: changed approach.** The race is removed rather than ordered. The press terminal now ends in `close_decision`: `mission_complete` if Reeves was named, confronted or KO'd, otherwise `awaiting_ambush`. The ambush fires on `awaiting_ambush` and has its own opening for the keep-quiet path. It is a walk-out, not a fight: no `#hostile`; it sets `insider_ambushed` and `insider_asset_escaped`, hides him, and sets `mission_complete` as it closes, so the debrief always comes after it. Backstops: Reeves' `start` resumes the ambush, the terminal's `start` ends it (`ambush_backstop`), and 13 `room_entered:*` mappings on `closing_debrief_trigger` end it. Debrief order is now KO before escaped, with a transmit/quiet variant line. Credits: escaped excludes KO, and KO no longer excludes escaped. **Needs a browser check** (playtest step 13).
11. **Message floods: done.** Server-room arrival is now one text that offers both guides (the `room_entered:server_room` text and the two guide offers are merged). The SSH flag is one text offering three guides; `flag_ssh_submitted` is folded into it. "Decision logged. Whatever the board chooses" is deleted, along with its unused `ransom_decision_acknowledged` global.
12. **`general_advice` and HaX geography: done.** New server-room branch (`scanning_guide_offered and not flag_ssh_submitted`). Gary's location now reads "Off the night handover room". The false IT-door warning is gone. The cover-burn branch stops once the player has passed Val (`reached_security_office`).
13. **Bernie's dead catch: done.** Mapping and `los` deleted, the `returning` branch deleted, and `seen_picking_by_bernie` removed from the ink and the globals.
14. **Ending consistency: done.**
    - "inside the hour" on the paid path;
    - the "couldn't be got right" line credits the player on the combined path;
    - the PIN-cracker choice reads "out of their kit in the server room";
    - Nightshade describes the Mastermind feedback instead of response timing;
    - Ghost's "eleven hours" line has a combined-restore variant.
15. **Caught and KO in the debrief and credits: done.** `val_caught_picking` gets a staff-section line (Val's incident log) and a credit. New KO credit lines for Bernie, Kim and Gary.
16. **ROT13 and CyberChef: done.**
    - HaX's operator-note text describes the cipher's shape and points at the CyberChef workstation in the same room, without the plaintext;
    - the new `m02_cyberchef_field_guide` (`encoding-and-decoding-with-cyberchef.md` exists in HacktivityLabSheets) is offered and requestable from the hub;
    - the CyberChef observation and graph note no longer mention a Base64 note;
    - `ransomware_note`, `base64_encode`, `require 'base64'` and `decoded_recovery_instructions` are deleted.
17. **Task titles: done.** "Read HaX's warning about your booking"; "Decide whose keys bring the wards back" (covers four sources).
18. **Graph metadata: mostly done.**
    - Lanyards, Val's key and the start-kit pick now point at `security_office`;
    - the `val_opens_office` action is added;
    - `lock_gary_cooperation` is removed;
    - the plaque is marked `puzzle_graph_optional`.

    **Not done:** the critical path still ends on "Put A Name To The Badge". `generate_dungeon_graph.rb` takes the longest path and breaks the tie by hash order. The fix is tooling: prefer the `missionConclusion` aim as the sink.
19. **Gary's cabinet catch: done.** He has 360°/400 px LOS (gate only, not drawn) and a once-only `lockpick_used_in_view` person-chat, `on_cabinet_picked`, with three replies that move `gary_influence`. It leaves `met_gary` alone. Like Val's, it can't fire for a key-holder until fix A.
20. **Transit rooms: done (one beat).** An appointment card on the vestibule chairs: the husband looking for his wife, signed off by Bernie. `ward_vestibule` is kept, so door parity is unchanged.
21. **Schema `mutuallyExclusiveGlobals`: not done** (tooling, approval).

### Also changed along the way

- The handover-room lanyard is renamed **Wrapped Contractor Lanyard**: it shared type and name with Gary's (E18).
- Val's catch, the corridor challenge and the server-room catch are all guarded on `!attacked_guard`.

### Checks

| Check | Result |
|---|---|
| `./scripts/compile-ink.sh m02_ransomed_trust` | 15 compiled, 0 failed (3 pre-existing END warnings) |
| `validate_scenario.rb` | schema passes, no unknown fields, geometry and doors OK. Warnings 13 → 9: the overlap set lost the server-room trio, the SSH quartet, the naming pairs and both "two items unlock the safe" warnings; new pairs are the debrief backstop vs the ward text and the security-office task, which are disjoint by `debrief_played` |
| `check_door_alignment.py` | all OK |
| Rendered JSON assertions | 59 checks on the new wiring, 0 failures |
| inkcheck + loopcheck matrix | 320 runs (each inkcheck DFS + loopcheck 200 steps × 6 strategies), 0 failures. States: Val pre-burn, burned, lanyard, vouched, restored, opened; HaX badge known or named, passed Val, server room, Ghost offer or deal; Ghost offer made, refused, every post-decision route; debrief 7 restore routes × 4 cover states (restored, burned, Val KO, caught) × 5 insider outcomes (unnamed, ambushed, KO, arrested, wrong suspect), with Raval KO; Reeves and terminal with and without `awaiting_ambush`; Gary catch; Bernie; Doyle; Bed 4. Val re-checked (40 runs) after the final edit |
| `reopencheck.mjs … m02` | 0 problems (HaX 757 reopens, Ghost 81, terminal 1800) |
| `tagdiff.mjs` | 252 structural differences in 9 files, all intended (listed in the agent report) |

### Round 2 (after `DESIGN_REREVIEW_1.md` and playtest `tools/playtest/m02-pass4-report.md`)

Same scope: m02 files only. Static checks are rerun below; no browser run yet. The confirmation run is in `PASS4_PLAYTEST.md`, "Round 2 confirmation run".

**Re-review majors**
- **M1, naming by guessing: done (orchestrator's version).**
  - HaX's names are plain and in this order: Val, Gary, Graham Reeves, Dr Kim. Choosing Reeves leads to `badge_reason`, where the player must also give the reason. The only correct reason is "The boardroom duty sheet puts badge SC-4471 on the comms post. That's his post.", and it appears only after the post log has been read (`inspected_asset_post`).
  - Wrong names and wrong reasons get pushback and the menu comes back, with no penalty.
  - Reeves' "You're badge SC-4471." also needs the post log. Before it, the player can only ask "What badge number do you carry on this post?", which he deflects.
  - HaX's Val pushback no longer refers to things the player may not have seen. "You've got a name in your notes now" is now "That's more on the inside asset, and you've got a badge number…".
- **M2: done.** `unmask_identify` is now "Name badge SC-4471's holder, with your reason -- to HaX, or to his face".
- **M3, Ghost's deal: done (orchestrator's version).**
  - Ghost's keys now cost **1 death** against the combined restore's 2. The story reason is that Ghost's restore brings ward monitoring up first.
  - **Ghost keeps a foothold**: the keys are Ghost's, so whatever they unlock Ghost can reach again. This appears on the console tile (banner "FASTEST -- AND GHOST KEEPS A WAY IN", bullets), in HaX's deal advice, in a HaX text when the keys are used, in Ghost's post-decision line, in the debrief's `ghost_keys_outcomes`, and in a new GHOST'S FOOTHOLD credit.
  - The credits now show PATIENT DEATHS: 1 on that route.
  - The paid route stays at 2: the portal decrypts host by host in no particular order.
- **Walk-out reply: done.** The ambush gives the player one reply ("You won't get far." / "[Go for the door.]" / "[Say nothing.]") before the same walk-out. The scene is now `disableClose`, and Reeves' `start` resumes it ahead of the `insider_confronted` check if a reload interrupts it.

**Re-review minors**
- **m1: done.** `npc_attacked:security_guard_patrol` sets `attacked_guard`.
- **m2: done.**
  - The dead "INSIDE ASSET: Unidentified" credit is replaced by WRONG SUSPECT (`accused_wrong_suspect`), plus a credit for a Reeves who was named but not arrested (the playtest found that gap).
  - `insider_escaped` gains a wrong-suspect line.
- **m3: done.** The escaped line has an `insider_ambushed` variant and a backstop variant ("His post was empty…").
- **m4: done.**
  - `cover_challenge` and `on_server_room_access` set `warned_player`.
  - Val's `start` sends a vouched player with the door still shut straight to `open_after_vouch`.
- **m5: done.** The dead `cleared_after_burn` branch is reused: a vouched player who picked the door anyway hears "Bernie's word's on the log… Still. That was my door."
- **m6: done.** `general_advice` starts with a Bed 4 branch while the countdown runs. There is also a hub button, "Bed 4. What do I do?" (`bed4_help`).
- **m7: done.**
  - The naming advice now depends on whether the post log has been read, and no longer claims Val and Bernie told the player anything.
  - A vouched player not yet past Val is told to ask Val to open up.
- **m8: done.** "That'll hold" now fires on `val_opened_office`. A Bernie vouch gets its own text: "Val will have heard… ask her to open her office."
- **m9: done.** Ghost's device accept is gated on `not ransom_decision_made`.
- **m10: done.**
  - COVER RE-ESTABLISHED needs `!guard_knocked_out`.
  - The "you owe Ghost a promise" reflection splits on `exposed_hospital` (kept, or broken).
- **m11: done.** The comment now names `closing_debrief_trigger`.
- **m12: done.** The playtest script now expects fix A in step 9, and the confirmation run covers the M2 tick and the vouched-reload case.

**Playtest items**
- **Val never dwelt before the burn: cause found, fixed in the mission.**
  - `npc-behavior.js` re-targets a patrol every `changeDirectionInterval` (default 3000 ms, `:323`, checked at `:887`), even mid-walk.
  - Her 144 px leg takes 3.6 s at speed 40, so she turned before arriving and never dwelt (the measured ~0.9 s seen per loop). After the burn (speed 62, 2.3 s legs) she arrived in time, which is why the post-burn window matched.
  - Fix: `"changeDirectionInterval": 60000` on her patrol. The engine behaviour (waypoint patrols cut short by the random-patrol re-target timer) is worth an engine note.
- **Repeated speech: done.**
  - Repeat detection now uses globals, because a catch can cut a scene short before its local state is saved. Playtest attempts 2 and 3 both played the "first catch" variant.
  - Repeat catches get "Again? Seriously?". After the first challenge, Val says "Same question as before…" or "Back again. Have you got something for me this time?". A repeated "I'll get you something" gets "Still here.", and a repeated argument gets a one-line version.
  - The challenge says "Whoever you are -- start talking" when she has never met the player.
- **"Ring Bernie" never appeared: done.** It needed `bernie_vouched`, which only Bernie's own desk sets. It now also shows on `bernie_trusts_player`: Val radios Bernie, and the call sets `bernie_vouched`.
- **Bed 4 from the north: changed approach.** The blocker is the ward's Tiled bedhead unit (gid 880 at tile (2.66, 5.91)), which stops the player 36 px from the bed against the 32 px interaction range. Bed 4 is raised 6 px (y 6.646 → 6.45) to bring the north approach in range. Confirmation run step R8 checks it.
- **HaX hub: done (m06 pattern).** The order is now:
  1. now-items: Bed 4, cover, naming, Ghost keys, ransom help, what's left;
  2. "Remind me where we are.";
  3. **one** "Send me a field guide." button opening a `field_guides` list (up to nine buttons became one);
  4. reactions;
  5. hints;
  6. exit.

  "I took Ghost's deal" now shows only after the decision, so it no longer overlaps "I have Ghost's decryption keys". The follow-ups that went stale (`cover_burned_advice`, `hint_ransom_decision`, `ghost_deal_recovery_advice`, `hint_press_terminal`) now sit in choices-only knots that re-check their state.
- **Val's wording: done.** "Bernie's signed you in, has she?" when Bernie gave the key; "Whoever you are" on a first meeting.
- **Gary credit vs debrief: done.** New credit "Sacked, then rehired when his warnings went public" when exposed and unprotected; the old credit now needs `!exposed_hospital`.
- **Kim's Patient Status Report: done.** The design note is replaced with an in-world observation.
- **Engine bugs, not worked around:** Gary's cabinet catch (`window.currentRoomId` undefined for containers) and catches cross-firing on every loaded NPC with a catch mapping.
- **Not done:** the press terminal lists Gary's advisory archive even when his cabinet was never opened (seen in the playtest, not in the orchestrator's list).
- **Not done (engine behaviour):** reload respawns the player in reception.

**Round 2 checks**

| Check | Result |
|---|---|
| Ink compile | 15 compiled, 0 failed |
| `validate_scenario.rb` | schema passes, no unknown fields, geometry and doors OK; 9 warnings, the same set as round 1 |
| `check_door_alignment.py` | all OK |
| Rendered JSON assertions | 72 checks, 0 failures |
| inkcheck + loopcheck matrix | 388 runs over the round-1 states plus the round-2 ones (Val repeats, trust-only Bernie, vouched reload; HaX naming with and without the post log, field guides, Bed 4; Ghost foothold kept or broken; wrong-suspect escape; Reeves probe and resumed ambush), 0 failures; 5 re-runs after the line splits, 0 failures |
| `reopencheck.mjs … m02` | 0 problems (HaX 684 reopens, Ghost 80, terminal 1800) |
| `tagdiff.mjs` vs HEAD | 455 structural differences in 9 files (HaX 202, mostly the hub reorder; Val 92; Ghost 47; debrief 32; Reeves 30; terminal 30; Gary 15; Doyle 4; Bernie 3), all intended |
| `dialoguelint.mjs` on touched lines | after splitting and trimming, 0 errors on lines changed in pass 4, ink and new texts |

### Round 3 (after `tools/playtest/m02-pass4-confirm-report.md`)

1. **Bed 4 from the north: changed approach.** Moving the bed can't fix this. Worked from the engine values:
   - Mr Pryce is a `staticSprite` with `collisionBox: bottom_half`, so his body's top edge is his sprite centre (`npc-sprites.js:89-95`).
   - The player's body is 18×10 with its centre 31 px below the sprite centre (`player.js:150-151`).
   - Interaction is centre to centre within 32 px (`interactions.js` `consider`, `isObjectInInteractionRange`).
   - Coming from the north, the player's feet stop on the bed's top edge, so the player centre is 31 + 5 = **36 px** from the bed wherever the bed stands. That matches both playtests (36.1). From the side it is 17.5 + 9 = 26.5 px; from the foot about 10 px. The round-2 nudge could never have worked, so the bed is back at its tile.
   - Fixes:
     - Nurse Raval, who already runs to this bedside when Bed 4 alarms (`patrolOverride`), now offers the same save: `bed4_assist` in `m02_npc_roaming_nurse.ink`, with the same globals. She has an ordinary character body, so she can be reached from any side.
     - HaX's Bed 4 help says to come at him from the side or the foot, and that Raval will be there.
   - Engine item: any `bottom_half` static NPC is unreachable from its north side. The engine should measure to the body centre, or allow 40 px for static NPCs.
2. **Press terminal stuck on RELAY LOCKED: done (resting-knot rule).** Each locked screen now ends in a choices-only knot (`relay_locked_investigation_choices`, `relay_locked_incident_choices`) that re-checks its own gate and goes back to `start`. A simulated reopen (save at the locked screen, flip `backdoor_fully_exploited`, re-navigate to the choice-owning knot) now lands on the decision menu.
3. **"Whoever you are" for a player Val had met: done.** The local `warned_player` isn't carried into an event-opened conversation, so meeting her now also sets a global, `val_met`, in `first_encounter`. The challenge checks `warned_player`, `val_met` and `val_caught_picking`.
4. **Hidden first catch, game 1417: engine or harness, described.**
   - One `interact` produced **two** `door_unlock_attempt` events 2 ms apart (seq 249/250).
   - The first `handleUnlock` caught the pick: `val_caught_picking` was set 264 ms later by Val's scene.
   - The second call found Val's catch mapping inside its 250 ms cooldown. `_mappingWouldFire` is false while a mapping cools down, so the gate let the pick through and the lockpicking minigame opened, which is what the harness reported.
   - 500 ms later Val's catch scene replaced the minigame. The tester's `mg close` then closed the catch scene unseen (seq 253: `minigame_failed PersonChatMinigame`, `conversation_closed:security_guard_patrol`).
   - The mission can't fix this: cooldown 0 would let duplicate listeners fire the catch twice (E21).
   - Engine fixes: de-duplicate `handleUnlock` per door within one frame, or have the gate treat "fired less than N ms ago" as still interrupting. It is worth checking whether a real click plus E can produce the double call, or only the harness's `interact`.
5. **Small items: done.**
   - The Ghost's Keys tile status reads "UNDER AN HOUR -- GHOST KEEPS A WAY IN".
   - HaX texts are spaced while the console is open: Bed 4 alarm 6 s, "Restore's running" 12 s, Kim's four texts 18 s, Ghost's foothold 24 s.
   - Reeves' "guarding" and "plain clothes" questions are merged into one, so before the post log his hub has three options (four if burned).
   - Every name in HaX's naming menu now goes through the same reason step. The duty-sheet reason confirms only Reeves; for anyone else HaX says "That isn't their post. Who stands that one?" and the names come back.

**Round 3 checks**

| Check | Result |
|---|---|
| Ink compile | 15 compiled, 0 failed |
| Validator | schema passes, no unknown fields, geometry and doors OK, 9 warnings (unchanged) |
| Door alignment | 12 OK |
| Rendered JSON assertions | 75, 0 failures |
| inkcheck + loopcheck matrix | 458 runs, 0 failures. New states: `val_met`; naming with each suspect, with and without the post log; Raval at every Bed 4 state; the terminal's locked choices knots under each gate; Bed 4 help |
| `reopencheck.mjs` | 0 problems |
| `tagdiff.mjs` | 515 differences in 10 files. New this round: Raval 17 (`bed4_assist` and its VARs), terminal +24 (the choices-only knots), Reeves +4 (merged question), Val +4 (`val_met`), HaX +11 (uniform naming flow, Bed 4 help) |
| `dialoguelint.mjs` | 0 errors on touched lines |

### Round 4 (playtest loop, 2026-10-04)

The naming flow above (§7 rounds 1–3) was reworked after blind and regression playtests: the deduction now runs handover board (security override) → Ghost's log (SC-4471, flag 4) → night rota (Val SC-2208) → boardroom post log, with Val as a red herring and graded HaX nudges. HaX's flag texts quote the rewritten SecGen documents. Details, checks and the spoken-line list are in `PLAYTEST_LOOP_LOG.md`.
