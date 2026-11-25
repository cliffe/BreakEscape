# CA pilot mechanics: the ca12 tailgate and the ca15 USB drop

Status: plan, draft 1 (25 Nov 2026). No scenario or engine edits yet. Items marked **[verify]** were not read by the planner and must be checked by the first reviewer before the plan is treated as settled; `CA_PILOT_MECHANICS_HANDOVER.md` lists them.

Kind of game: Cyber Aware (CA) security-awareness course. The aim is a short, fun episode that tells the attacker's side in attacker terms (the course's selling point), then flips the learner onto the defending seat. Every review of this work scores the CA fun/USP rubric (the rubric file in `tmp/handover/ac0/` of the main checkout).

Scope: the attack halves of `scenarios/ca12_visitor_tailgater` and `scenarios/ca15_shadow_it`, the matching story facts in their `_defend` twins, the kit data that generates their kit-owned records, and the smallest engine changes the two beats need. Both trailers are then re-shot around these beats, so on-screen movement is planned in from the start.

## 0. Ground rules that shape the design

- **Kit-owned records are generated.** Every `kit_*` NPC, object, timer, global, chatter pool and host mapping in a CA shell is regenerated from `office_kits/<company>.json` and `office_kits/episodes.json` by `office_kit.py` / `apply_training_room.py`; a hand edit in the shell is reverted by the next `--kit` run (`office_kit.py:14-17`). ca12 and ca15 are `handAuthored: true` rows (`episodes.json:100`, `:357`), so their non-kit records (Lorna, Delphine, Nilesh, new rooms, new NPCs) are hand-written in the shell, while kit records (Camila, Thandiwe, Julian, Fatima, Chidi, the set pieces) change only in the kit files. Regenerate into a scratch folder, confirm a no-change regen is byte-identical to HEAD, then copy in only the changed files (HANDOVER.md:89-90).
- Reuse the lab's engine pieces as configured in `scenarios/lab_physical_pentest/scenario.json.erb`; copy configuration shapes, never code.
- Office life never gates the episode. The attack half must always be able to finish: every new beat has a timer or a walk-away route that ends it.
- Server hard-enforces secrets, keys and forged items. The tailgate credit uses the server's `creditOnPass` (the lab's records door, `scenario.json.erb:1845-1854`); the tailgate itself stays best-effort, with the guard's challenge as the NPC sanity check.
- New eventMappings go last in their array. ca12's Camila array already carries an inert placeholder to keep indices (`ca12 scenario.json.erb:1546-1551`); follow the same pattern if any mapping is retired.
- No new PixelLab art without the owner's yes (section 6 lists requests). Prefer existing sprites; recurring characters keep their own keys.
- Voiced lines: no `{variables}`, no inline stage directions (use `#delivery:` tags in ink), 30-word face-to-face cap, chatter pool lines at most 40 characters.

---

## 1. ca12 Visitor and tailgater: "Two layers: the desk, then the door"

### 1.1 Today

- Rooms: `training_room` (the studio, `locked: true`, `requires: merrin_studio_badge`, connects east to `lobby`, `:1007-1053`) and `lobby` (Delphine at the desk, a hot-desk PC, connects west, `:1693-1743`). The player starts in the studio at the kiosk.
- Attack flow (awarenessEpisode stages `brief, osint, write, flip, defend, debrief`, `:598-605`): the kiosk runs Jo's brief and the OSINT browser; at the write stage world-play (`public/break_escape/js/utils/world-play.js`, launched by `episode-runner-minigame.js:1221-1240`) moves the learner into the lobby wearing `male_telecom_v2` (`world.costume`, `:607-614`) and opens the pretext-prep card and the call with Delphine (`pretextNpcs[0]`, callId `merrin_front_desk`, `:847-988`). When the outcome global `pretext_merrin_front_desk_outcome` is written, the call watcher (`episode-runner-minigame.js:1388-1442`) puts the learner straight back at the kiosk and opens the flip.
- So the learner never walks through a door. "Buzzed through" is a line in the outcome card, nothing on screen.

### 1.2 The new beat

After the desk conversation the learner stays in the lobby, in the hi-vis, with the parcel. The badge door to the studio is now a real gate, and a security officer stands beside it.

1. **Desk (unchanged).** The pretext call with Delphine plays as now: same lines, same scoring (unscored attack), same outcomes `got_it`, `walked_away`, `reported`.
2. **The door (new).** The learner is handed control in the lobby. What happens depends on the desk outcome:
   - `got_it` (buzzed): Delphine comes round the desk, walks to the badge door and holds it (the gate opens for her). The learner walks through. The guard, seeing the hi-vis and Delphine at the door, says one line and lets it go. This is the "talked past" route.
   - `walked_away` or a desk that never buzzed: the gate stays shut. The guard challenges anyone who walks up to the reader alone. A member of staff, back from the coffee run, crosses the lobby and badges in; the learner in hi-vis can walk in behind them while the door holds open (about 2.5 s). The guard reads the hi-vis as a courier with the staff member and says nothing, or a light "Go on through". This is the tailgate.
   - `reported`: the guard is alerted (`ca12_guard_alerted`). The gate bars the player even behind staff (`playerMayPassIf` false). Walking up gets the guard's challenge; the beat ends after it.
3. **Hand-back.** Walking into the studio, the guard's challenge closing, the learner clicking "Back to the kiosk" in the objective toast, or a 120 s timer after the outcome ends the beat: the costume comes off, the learner is back at the kiosk and the flip opens. The flip card's existing strings already cover each outcome; add one flip line for the tailgate (1.7).

Attacker framing (USP): Jo's brief and the hint toasts speak as the red team: "The desk is the first layer. The door is the second. Watch who goes through it and how long it stays open." Clues leave deduction: nothing tells the learner which staff member to follow or when; the toast names only that a door that opens for staff holds for a moment.

### 1.3 Rooms and layout

- **Engine limit:** gate doors work on north and south doors only (`door-gates.js:17-19`; `register()` declines east/west). The studio-lobby door is east/west today. Smallest fix: **re-site the lobby south of the studio** (`training_room.connections: { "south": "lobby" }`, `lobby.connections: { "north": "training_room" }`). The alternative (teaching door-gates side doorways) is a larger engine change and is not planned.
  - **[verify]** that `room_aw_merrin_lobby` and `room_aw_merrin_sallow` maps take a north/south door where the gate's reader and the guard's post fit, with `python3 scripts/check_door_alignment.py` and the room depth check. If the Tiled maps cannot take it, a new small "entrance lobby" room south of the lobby (lobby north to studio is still E/W) is the fallback, using an existing room type.
- **Lobby additions** (objects, all existing sprites, orthogonal to the walls):
  - `ca12_badge_reader` by the gate (copy the lab's `badge_reader`, the object Len keys at; reuse its sprite).
  - A street door on the lobby's outer wall as decor (where the staff walker enters and leaves) **[verify]** a suitable existing door/decor sprite in the lobby map; otherwise the walker appears from behind the desk end of the room.
  - A coffee point already exists in the kit studio? **[verify]**. The staff walker carries a takeaway cup (held-item sprite only if an existing one fits; otherwise none).
- Room dressing and lighting: the re-sited lobby goes through `mission-room-dressing` (about five cycles) and then `mission-room-lighting` (2-4 rounds), then `room-pov-background` only if the owner approves a new lobby POV background (section 6).

### 1.4 NPCs

| NPC | Sprite key | Class | Movement |
|---|---|---|---|
| `delphine_reception` (existing) | `delphine_arvanitis` | story (pretext target) | Static at the desk, plus one scripted walk on `got_it`: desk to the gate and back (`patrolOverride`, she has no `needs`, protection 1). |
| `ca12_guard` (new, awareness cast) | **[verify]** an existing awareness-cast atlas with the stock six animations; prefer one not used in ca12 or ca15 | story (the challenge) | Short patrol inside the lobby: post by the reader, a slow loop to the window and back (`behavior.patrol`, `pauseForPlayer: false`), LOS with `challengeOnSight` anchored to the reader (lab `len`, `:2092-2113`). No needs (a patrol NPC may not have them). |
| `ca12_runner` (new, awareness cast) | **[verify]** an existing cast atlas, different ethnicity and age from the guard and Delphine | ambient, scripted walker | `behavior.patrol` with `multiRoom: true`: street door, across the lobby, the reader (route action `unlockRoom: training_room`, `useObject: ca12_badge_reader`, `useMs: 2500`), into the studio to a desk, dwell, back out. Copy Len's route (`:2073-2091`) and his never-firing `unlockDoor` mapping (`:2115-2122`), which the route action needs on both client and server. No needs. Hidden until the world beat starts (`initiallyHidden`, shown on the hand-off global) so the studio stays as it is during the kiosk stages. |

Guard pick: the owner confirmed a new lobby security NPC from the awareness cast. Pick from `planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md` and the course cast list (`HANDOVER.md`), keeping name, look and voice, and adapting the job to building security at Merrin & Sallow. The cast so far: Delphine (30s, Greek-British), Lorna (40s, Lancashire), Camila (40s, Colombian-British), Thandiwe, Julian. A guard in their 50s or 60s of South Asian or East Asian heritage, and a runner in their 20s, would widen the cast. **[verify]** atlases have the stock six animations; no seated frames needed.

### 1.5 Engine pieces reused, and gaps

Reused as-is:
- `door-gates.js`: `gate: { openFor: ["ca12_runner", "delphine_reception"], openRadius: 64, holdMs: 2500, playerMayPassIf: "ca12_cover_ok", creditOnPass: { viaPass: { setGlobal: { "ca12_tailgated": true }, completeTask: "slip_past_guard" } } }` on the lobby door entry whose `connectedRoom` is `training_room`. The server owns the credit (lab `:1846-1854`; `games_controller.rb` refuses a client completion of a `creditOnPass` task).
- `npc-behavior.js` patrol routes with route actions; LOS `challengeOnSight`; `door_gate_opened`, `door_gate_guard_turned_back`, `room_entered` events (lab `:913-923`).
- `apply-actions.js` hint toasts; the episode runner's flip strings.

Gaps (smallest fix each):
- **G1. World-play hands back at once.** Add an optional `world.holdUntil` (a global name) and `world.holdMaxMs` to the awarenessEpisode schema and `episode-model.js worldFor` (`:569-579`). In `watchCall` (`episode-runner-minigame.js:1411-1430`), when `holdUntil` is set, the outcome no longer triggers `handBack` + `finish` directly: it waits (same tick loop) until the global is truthy or `holdMaxMs` has passed since the outcome, then runs them as today. A reload while held resumes into the flip (the stage state already records the call; `_settleWorld` brings the learner back). Unit tests in `test/js/` for both paths and the reload.
- **G2. The world costume sets no global.** The gate needs a global for "in hi-vis". Add `world.costumeGlobal`: `enterWorld` writes it true after `applyCostume`, `leaveWorld` writes it false (scalar, sent as a delta). It is client-written, which is acceptable because the tailgate is best-effort and the credit is server-checked on the pass. `ca12_cover_ok` is then set by appended mappings: true on `global_variable_changed:ca12_in_hivis` with `value === true && !globalVars.ca12_guard_alerted`, false on `global_variable_changed:ca12_guard_alerted`.
  - Rejected alternative: making the hi-vis a `wearable` item (the lab's `kit_hivis_vest`, `:1302-1336`). Its global is server-owned, which is stronger, but the world-play already dresses the learner and the brief promises it, so a second "put it on" step would add a click without a choice. Revisit if the owner wants the learner to choose the disguise.
  - **[verify]** whether the server treats `playerMayPassIf` globals as read-only to sync (`wearables.rb:36-44` covers wearable globals only). If `creditOnPass.viaPass` requires a server-owned global, G2 needs a server write instead (POST from `enterWorld`, as `wear` does), which is a larger change.
- **G3. Camila pops in beside the reception door** (docs/IDEAS_BACKLOG.md). Kit fix in `office_kits/merrin_sallow.json` set piece `ca12_visitor` **[verify field names]**: spawn her on the lobby door tile and show her with `delayMs: 0`, so she walks in through the doorway. With the lobby re-sited south, the door tile moves too; recompute her spawn, her patrolOverride targets (`(6.5, 4.5)`, `(2.5, 5.0)`, `(8.5, 2.5)` today) and Lorna's (`(3.5, 5.0)`, `(5.5, 3.8)`) after the move, and re-check that "she arrives" (`npc_arrived` with `data.owner !== 'needs'`) still fires.

### 1.6 Scenario JSON and ink changes

- `awarenessEpisode.world`: add `holdUntil: "ca12_world_done"`, `holdMaxMs: 120000`, `costumeGlobal: "ca12_in_hivis"`, and a `spawn` in the lobby clear of the gate.
- Globals (all scalar): `ca12_in_hivis`, `ca12_cover_ok`, `ca12_guard_alerted`, `ca12_tailgated` (server-set), `ca12_delphine_held_door`, `ca12_world_done`, `ca12_runner_go`. Sync budget: seven bounded scalars; `ca12_in_hivis` and `ca12_cover_ok` are non-monotonic (last write wins is fine: both follow the world entry and exit).
- Objectives: add an optional task `slip_past_guard` ("Get through the badge door: talk your way past or follow staff in") under `red_team_aim`, server-completed by `creditOnPass`. `run_front_desk_pretext` still completes on the outcome, so the aim never waits on the tailgate.
- EventMappings, appended last on the listed NPCs (start-room or always-registered NPCs for globals that must not be missed: Lorna is the host in the start room):
  - Lorna: on `global_variable_changed:pretext_merrin_front_desk_outcome` with `value === "reported"`, set `ca12_guard_alerted`; with any non-empty value, set `ca12_runner_go` (shows and starts the runner).
  - Delphine: on `pretext_merrin_front_desk_outcome` `value === "got_it"`, `patrolOverride` to the gate's approach tile, then on `npc_arrived` a second override back to the desk once `room_entered:training_room` has fired or after 8 s.
  - Guard: the challenge mapping (`player_in_view_near:ca12_guard`, condition gate not open for staff, `conversationMode: person-chat`, `targetKnot: challenge`, `closeDoor: training_room`, cooldown 20 s), and the pass bark on `room_entered:training_room` when `ca12_in_hivis`.
  - Lorna: `room_entered:training_room` while `ca12_in_hivis` sets `ca12_world_done`; `conversation_closed:ca12_guard` sets it too. `door_gate_opened` for this door while the player is in the lobby and not yet through sets a one-shot hint cue (lab `:913-917`).
  - Runner: the never-firing `unlockDoor: training_room` mapping.
- Ink: new `scenarios/ca12_visitor_tailgater/ink/ca12_guard.ink` with `start` (a polite "can I help you?" exchange the learner can answer as the courier; the guard asks them to wait at the desk) and `challenge`. Short, choice-light, no hub. Delphine's ink is unchanged.
- Server-enforced items: none new; the studio badge stays where it is, and the gate credit is server-checked.

### 1.7 New spoken lines (draft wording; the dialogue review and the owner's sample yes come before voicing)

| Speaker | Where | Line |
|---|---|---|
| Delphine | bark, `got_it` walk | "I'll get the door for you." |
| Guard | bark, pass with Delphine | "Morning. Mind the step." |
| Guard | bark, tailgate pass | "Delivery? Studio's straight through." |
| Guard | challenge bark | "Sorry, can I help you there?" |
| Guard | `challenge` knot, 2-3 lines | e.g. "Deliveries sign in at the desk. I'll have someone come down for it." |
| Guard | `start` knot, 2-3 lines | e.g. "Desk's just there. Delphine will sort you out." |
| Runner | bark at the reader | "Morning, Arjun." (fixed name, no variable; replace with the guard's chosen name) |
| Runner | chatter pool (lobby, 3 lines, 40 chars max) | e.g. "Queue at the café was mad.", "Is the Harbour model in yet?" |
| Flip | `strings.flipTailgate` (shown text, not voiced) | "You walked in behind a member of staff while the door held. Nobody had to say yes." |

### 1.8 Defend twin consistency (`ca12_visitor_tailgater_defend`)

The twin has only the training room (`defend scenario.json.erb:608-643`) and no lobby. Story facts to keep consistent: the reception set (`e12_reception_desk`, `social.awareness` calls) should gain no new rule, but the "tailgater" call (`e12_call_tailgater`) and the concept panel text should name the guard and the held door if they mention the building's door controls **[verify the call text]**. If the guard's name appears in the attack half, add it to `people` in both shells. No room is added to the twin.

### 1.9 Tests and live proof

- Unit (`test/js/`): G1 (`holdUntil` waits, `holdMaxMs` ends it, reload resumes into the flip), G2 (`costumeGlobal` set on enter, cleared on leave, cleared when enter fails). Add any newly imported module to each test-harness copy list.
- Focused test scenario: `scenarios/test_ca_world_tailgate/` (new), one lobby and one studio, a guard, a runner and a minimal pretext call, so the hold and the gate can be proved without the full episode. Engine changes need it.
- Validator: `ruby scripts/validate_scenario.rb` on ca12, its twin and the test scenario, plus `--strict-social --no-graph --skip-ink` on all CA shells; `python3 scripts/check_door_alignment.py`; `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/ca12_visitor_tailgater/`; `tools/check_mapping_index_drift.rb main`.
- Ink: compile; any `ca12_routes` suite (maxRun 9) **[verify one exists]**; `reopencheck.mjs` if ca12 is in `missions.json`.
- Kit: no-change regen byte-identical before the change; after it, the diff shows only Camila's set piece.
- Live proof (Haiku, keyless server on a free port from the worktree, fresh game per check via `new-game.rb`, `throttleFps(20)`): (a) `got_it`: Delphine walks to the door, the player walks in, `ca12_tailgated` set by the server, flip opens; (b) `walked_away`: wait for the runner, follow within the hold, credit lands; walk up alone first and get challenged; (c) `reported`: barred behind the runner, challenge, flip opens; (d) do nothing: flip opens at 120 s; (e) reload while held; (f) Camila walks in through the doorway at step-away, five tries. `verify-run.rb` must show progress.

### 1.10 Risks

- The north/south re-site could disturb the kit studio layout and every kit coordinate (Camila, Lorna, Thandiwe's PC). Mitigation: measure positions before and after (office-life skill, measurement recipe 9) and diff.
- The runner's timing: if the learner reaches the door between passes they wait up to a loop. Keep the loop short (about 25-30 s) and start it when the call ends.
- The guard's LOS could fire during the desk conversation. Gate the challenge on `ca12_runner_go` (set only when the call has ended).
- G2's global is client-written; a tampered client could set it, but the credit is still server-checked and nothing secret sits behind the door.
- A hold that never ends would strand the learner in costume: `holdMaxMs` is required whenever `holdUntil` is set (validator rule).

---

## 2. ca15 Shadow IT: "The stick in the open-plan"

### 2.1 Today

- One room, `training_room` (`room_aw_tarrowby`, no connections, `ca15 scenario.json.erb:720-755`), with Nilesh Solanki (host, `nilesh_solanki`), Fatima Begum and Chidi Okeke (kit, `fatima_begum`, `chidi_okeke`). The attack half is a card sort of everyday shortcuts and where they led six months later (`shortcuts_aim` / `sort_shortcuts`, `:27-45`).
- The kit already has a `ca15_found_stick` set piece (`episodes.json:356-370`, setPiece in `tarrowby_logistics.json`) and the key message `e15_posted_stick`. **[verify]** what that set piece does today (likely a step-away beat on the defend side); the new drop must not duplicate or contradict it.

### 2.2 The new beat

After the card sort's first pass (or as its last card; the reviewer should pick, default below), Nilesh hands the learner a USB stick "from the red-team kit" and points at the open-plan next door: "Leave it where someone will find it, and watch." The learner walks into the new open-plan room, opens the stick in the inventory and chooses Drop here. A worker, on their way back from the printer or the kettle, notices it, picks it up ("Someone's dropped a memory stick."), walks to their desk and says they'll plug it in to find the owner. The learner gets the payoff: a capture toast and a note in the inventory ("Session opened on TL-OPS-04"), in attacker terms. Then back to the kiosk for the rest of the episode.

Default placement: the drop sits after the card sort, before the flip, because the sort is where the learner learns why a found stick matters; the drop then shows the attacker's half of the same card. Clues leave deduction: the hint says only that staff pass the printer and the kettle, not where to drop it.

Timeout: if the worker has not picked it up 90 s after the drop, Nilesh's line on returning ("Give it time. People are curious.") and the beat completes anyway with a weaker payoff note, so the episode never stalls. Dropping it in the training room gets Nilesh's "Not in here, I'll just hand it in" and the stick returns to the inventory **[verify the item-drop pick-up path for an NPC returning an item; otherwise he only says the line and the stick stays dropped and can be picked up again]**.

### 2.3 Rooms and layout

- New room `open_plan` east of the training room (connection east/west is fine: no gate is needed), using an existing open-office room type **[verify which `room_aw_*` or lab room type fits Tarrowby Logistics; the lab's `open_plan` type is the reference]**. Contents (existing sprites, orthogonal): four desks with PCs (one `workstation` owned by the finder), a printer and a kettle or coffee station (declared by base type name), a pinboard. `officePresets: true` if not already set.
- `mission-room-dressing` (about five cycles), then `mission-room-lighting`; a POV chat background only on the owner's yes.

### 2.4 NPCs

| NPC | Sprite key | Class | Movement |
|---|---|---|---|
| `ca15_finder` (new, awareness cast) | **[verify]** an existing atlas with seated and pose frames, not used in ca15 | the drop target; holding (the stick once picked up) | `needsHome: ca15_finder_pc`, needs `caffeine` (kettle) and a `print` habit (printer), `interests: { "tag_ca15_stick": { weight: 3, noticeRooms: ["open_plan"] } }`, copied from Sofia (lab `:1973-1990`). Moves on screen: printer and kettle trips, then the stick. |
| `ca15_colleague` (new, awareness cast) | **[verify]** as above, different age and ethnicity | ambient | needs at the kettle and the printer, `needsCompany` with the finder so the pair meets at the kettle (capacity-2 chatter object). No interests in the stick, so only the finder takes it. |
| `kit_fatima_begum`, `kit_chidi_okeke` (kit) | existing | ambient | **[verify]** whether the kit pair may take a trip into the open-plan (would need a kit change); default: they stay in the training room. |
| `nilesh_solanki` | existing | host, story | Stays at the kiosk; one scripted walk to the open-plan doorway when the drop task starts ("this way") and back, `patrolOverride` only if he has no needs **[verify]**. This is the "someone walks the player in" shot. |

Cast: Nilesh, Fatima and Chidi are British South Asian and Black British **[verify]**; pick the finder and colleague to widen age and background (for example a white Scottish worker in their 50s and an East Asian worker in their 20s).

### 2.5 Engine pieces reused, and gaps

Reused as-is:
- `item-drop.js`: the stick is `droppable: true` with `needsTag: "tag_ca15_stick"` (lab `kit_deviceB`, `:1244-1256`); dropping emits `item_dropped:<id>` with `data.roomId`.
- `npc-needs.js` interests: the finder notices, picks up (`npc_picked_up:<id>`) and uses it at her post PC (`npc_used:ca15_finder_pc` with `data.tag`), as Sofia does (`:2000-2023`).
- `npc-needs-chatter.js` pools for the pair; `apply-actions.js` `addCapture` (lab `:2036`) **[verify that the capture log exists in the CA HUD; if not, use a `give_item` note instead, which needs no new UI]**.

Gaps:
- None expected in the engine. **[verify]** that `interests` and `npc_used` work with `"npcThoughts": false` (CA shells set it), and that the needs layer runs in a CA episode while the kiosk overlay is closed. If interests depend on `npcThoughts`, the fix is in `npc-needs.js` and needs its own unit test.

### 2.6 Scenario JSON and ink changes

- Objectives: under the existing attack aim, add task `drop_the_stick` (manual, completes on `item_dropped:ca15_stick` in `open_plan`) and `watch_who_finds_it` (completes on `npc_used:ca15_finder_pc` with the tag, or on the 90 s timer). Neither gates `concludeRequires`.
- Items: `ca15_stick` given by Nilesh's ink (`give_item`, an id the server knows, so the item is not forgeable). The payoff note is a `give_item` from the finder's `npc_used` mapping. Neither carries a secret.
- Globals: `ca15_stick_given`, `ca15_stick_dropped`, `ca15_stick_found`, `ca15_stick_used`, `ca15_drop_timeout` (all scalar, monotonic).
- Timer: `ca15_t_drop`, `startOnGlobal: ca15_stick_dropped`, 90 s, condition `!globalVars.ca15_stick_used`, sets `ca15_drop_timeout`.
- EventMappings, appended last: on the finder (drop, pick-up bark, use bark and payoff), on Nilesh (the walk to the doorway, the training-room refusal line, the timeout line), on the host in the start room for every global another room's NPC must not miss.
- Ink: Nilesh gets a new knot `stick_handover` (the red-team framing, two or three lines, one choice) and `stick_back`; the finder needs no ink beyond barks unless the owner wants a conversation afterwards.

### 2.7 New spoken lines (draft)

| Speaker | Where | Line |
|---|---|---|
| Nilesh | `stick_handover` | "One more from the red-team kit. Leave this where someone will find it, then watch." |
| Nilesh | `stick_handover` | "No label, no note. Curiosity does the rest." |
| Nilesh | bark, drop in the training room | "Not in here. Try next door." |
| Nilesh | bark, timeout | "Give it time. People are curious." |
| Finder | bark, `npc_picked_up` | "Someone's dropped a memory stick." |
| Finder | bark, `npc_used` | "I'll plug it in and see whose it is." |
| Finder and colleague | kettle chatter pool, 3-4 lines each | e.g. "Printer's jammed again.", "Who took the good mug?" |
| Payoff note (shown, not voiced) | item text | "Session opened on the ops PC when the stick went in. One curious click, and you're on their network." |

### 2.8 Defend twin consistency (`ca15_shadow_it_defend`)

The twin's training room and the defend set must agree with the new fact that a stick was dropped in the open-plan. **[verify]** the twin's `ca15_defend_react` set piece and any "found stick" call text; if a defend item describes a stick found "by the kitchen" or similar, align the place name with the open-plan. No room is added to the twin.

### 2.9 Tests and live proof

- Unit: none if no engine change; if the `npcThoughts` check finds a gap, a `test/js/` test of interests with thoughts off.
- Validator, dialoguelint, ink compile, mapping index drift, kit regen check, door alignment for the new room, as in 1.9.
- Live proof (Haiku, fresh game each): drop in the open-plan, finder picks up and uses within 60 s, payoff note lands, tasks tick (five tries); drop in the training room (refusal); drop and wait past 90 s with the finder held at the kettle (timeout path); reload after the drop.

### 2.10 Risks

- The finder's interest could fire while she is mid-trip and look like a teleport-free but odd beeline; acceptable, it is what Sofia does in the lab.
- A second room loads only when its door opens; the finder must not be needed before then (she is not).
- The existing `ca15_found_stick` set piece may already carry the same idea on the step-away; merge rather than duplicate.

---

## 3. Footage notes (for the trailer re-shoots)

ca12:
- Wide of the lobby as the call card closes: the guard pacing by the reader, the runner crossing from the street door with a cup. Camera follows the learner in hi-vis.
- `got_it`: Delphine leaving the desk to hold the door; the learner walking past the guard.
- Tailgate: low wide on the gate as it opens for the runner and the learner slips in behind within the hold, the guard's "Delivery? Studio's straight through." over it.
- `reported`: the guard stepping in, "Sorry, can I help you there?", the door shutting.
- Step-away: Camila walking in through the doorway (after G3), Lorna walking her to the desks.

ca15:
- Nilesh walking the learner to the open-plan doorway.
- The drop: the stick on the floor in a wide that shows staff moving past (printer, kettle pair chatting).
- The find: the finder turning from the printer, the beeline, "Someone's dropped a memory stick.", sitting at the PC, "I'll plug it in and see whose it is.", the payoff toast. Camera-follow on the finder for this shot.

## 4. Order of work

1. Reviewer checks every **[verify]** item and the cast picks (Opus, read-only; review rounds per AGENTS.md, plan reviews stop at round 5).
2. Engine G1 and G2 with unit tests and the test scenario; commit before scenario work.
3. ca12 layout re-site, then the kit G3 fix (kit regen), then NPCs, mappings, ink.
4. ca15 room, NPCs, items, mappings, ink.
5. Dressing and lighting skills on the changed rooms.
6. Dialogue review of the new lines (npc-dialog-review, new lines only), owner's sample yes, then voicing (accepted without asking from 22 Nov unless uncertain).
7. Live proofs, then a CA fun/USP rubric review of both episodes.
8. Lab sheets/walkthroughs for both episodes last.

No scenario or test scenario is renamed or deleted. If a later revision does, grep Hacktivity's `test/` first (read-only), because Hacktivity's tests load BE test scenarios from main.

## 5. Open questions for the owner

1. ca12: keep the hi-vis automatic (world-play costume, recommended) or make it a wearable the learner chooses to put on (the lab's vest)?
2. ca12: is moving the lobby south of the studio acceptable, given it moves every kit coordinate in the studio?
3. ca15: the drop after the card sort (recommended) or as its last card?
4. Cast picks for the guard, the runner, the finder and the colleague (from the awareness cast, existing atlases).

## 6. Art requests (nothing generated without a yes)

| Item | Count | Notes |
|---|---|---|
| New characters | 0 planned | All four new NPCs use existing awareness-cast atlases. If no existing atlas fits the guard, one full character (concept, walk atlas with the stock six, bust, visemes) is about 35-40 PixelLab generations. |
| Pose or seated frames | 0-2 | Only if the chosen finder or colleague atlas lacks seated or `pose_drink_*` frames. |
| Props | 0-1 | A street-door decor sprite for the ca12 lobby, only if no existing one fits (one 1-direction object). |
| POV chat backgrounds | 0-2 | The re-sited ca12 lobby and the new ca15 open-plan, 400x400, after dressing and lighting, if the owner wants them (one Gemini concept via agy plus one PixelLab conversion each). |
