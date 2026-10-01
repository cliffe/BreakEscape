# m03 Ghost in the Machine — Pass 2 improvements

> The m02-standard pass. Sources: `scenario.json.erb`, the seven `.ink` files, the
> engine (`public/`, `app/`), and m02 as the worked example. Nothing was committed.

## Headline

m03 validated with warnings, but three of its four scripted conversations — the HaX
phone hub, Danny's confrontation, and the **entire closing debrief** — crashed the
moment they opened, and the four VM-flag tasks that gate the ending could never
complete. So the mission was, in the real engine, unplayable to a finish. Both faults
are fixed, plus a puzzle-chain, day/night, dialogue and canon pass.

---

## Bugs and soft-locks (fixed)

1. **Ending blocker — flag tasks used the dead reference form.** The four `submit_flags`
   tasks targeted `"ghost_in_machine_vm_network:flag_1".."flag_4"`. The engine matches
   only the **display form** the controller generates (`game.rb:1108` says the reference
   form "silently never completes its task"). The ending gate (`concludeRequires`) is
   exactly those four tasks, so **the mission could never conclude.** Retargeted to
   `"flag_station_dropsite:ghost_in_machine_vm_network-flag1".."flag4"` (m02's fix,
   `4a099837`). Verified the rendered targets match `generate_flag_identifiers`.

2. **Three conversations crashed on open — unbound ink externals.** `m03_phone_agent0x99`,
   `m03_james_choice` and `m03_closing_debrief` called `EXTERNAL objectives_completed()`,
   `player_approach()`, `stealth_rating()`, `flags_submitted_count()`, `time_taken()`,
   `found_exploit_catalog()`, `found_architect_directive()`, `lore_collected()`,
   `victoria_fate()`, `james_fate()`, `knows_m2_connection()`. The engine binds **only
   six** externals (`player_name`, `current_mission_id`, `npc_location`, `mission_phase`, `operational_stress_level`, `equipment_status`); inkjs runs with
   `allowExternalFunctionFallbacks = false`, so any other external **throws on the first
   `Continue`** — the debrief, the support hub and Danny's scene all died. No other
   mission uses these externals. Rewrote all three files to the m01/m02 pattern: declare
   a `VAR` and let the scenario's `globalVariables` sync into it. Added the backing
   globals (`player_approach`, `knows_m2_connection`, `james_fate`, `flag_scan/ftp/http_submitted`,
   `lore_history/catalogue/directive_found`, `draft_seen`) and the handler `setGlobal`
   bridges that populate them. `inkcheck` now passes on every file at `start` and at the
   entry knots (previously three THREW).

3. **KO soft-lock guard on the two act-one tasks.** `meet_victoria` and `clone_rfid_card`
   completed only through Victoria's ink. Her KO handler existed but passed
   `completeTask` as an **array**, which the validator (and the KO-safety audit) doesn't
   recognise. Split into two string-`completeTask` handlers keyed to `victoria_ko`; the
   validator's soft-lock warnings for both tasks are gone. Victoria's fate on KO
   (`victoria_fate: "ko"`) is settled only once `night_confrontation_ready` is set, so a
   day-time KO can't roll the debrief before the network evidence exists.

4. **Dead speaker attribution / crash-prone tags removed.** The old `m03_james_choice`
   used prose labels (`Inside:`, `TO:`, `Reasoning:`) the validator flagged; the rewrite
   drops them. Removed a trailing `#hostile` tag placed after `-> DONE` in the guard's
   hostile branch (unreachable).

5. **No top-level `narrator` voice** despite `#speaker:narrator` in the briefing (and now
   the debrief). Added the standard narrator block (matches m01/m02).

---

## Puzzle chain (improved)

- **The wall safe no longer shares its code with the password.** Previously the safe PIN
  *and* the computer password were both the founding year (2010) — one deduction, two
  locks, no chain. Now the safe code is **5829**, found only by a real loop:
  **server-room whiteboard** (ROT13: "the code is in Sable's drafts, not on this board")
  → **Sterling's office PC** (password `Sterling2010`, the founding-year lesson) →
  **her unsent draft** (raw-MIME Base64 body carrying `5829`) → **the wall safe** (back in
  the server room). Boss-key loop across two rooms; the clue in the safe's own room only
  *signposts*, it doesn't give the answer. Verified the decode chain end-to-end by
  rendering the ERB and decoding each artefact.
- **Encoding now has an in-world author with a motive.** The whiteboard is the night
  team's ROT13 house style, kept from the day staff (real pentesters who don't know what
  the firm sells). The layered Base64-over-ROT13 drive is the Architect's directive. No
  more "a company ROT13s its own noticeboard for no reason."
- **The decode tool sits after the material, not before.** CyberChef is a takeable laptop
  in the server room (depth 2); the roster and drive are in the exec office (depth 3).
  Tool-after-lock.
- **distcc is the case.** Submitting the distcc flag fires HaX's revelation call, completes
  `find_operational_logs`, and (as the fourth flag) trips `night_confrontation_ready`.

## Choices that matter (improved)

- **Victoria** keeps four authored fates — cold-recruit / arrest / escape / KO — each with
  a distinct credit line (now keyed on `victoria_fate`, not four booleans) and a distinct
  debrief branch. She leaves the room (`setVisible:false`) once her fate is set unless KO'd.
- **Danny Foster** is a **live NPC** you confront, not an auto-firing phone cutscene. His
  fate is one global (`james_fate`: protected / exposed / left / ko) driving both credits
  and debrief. His open PC now holds the readable recon folder (with Sterling's lie about
  the client) and his own unsent notes — the moral weight is *in the room*, found, not
  narrated at you. Removed the redundant duplicate phone-cutscene NPC.
- **Perfect stealth** can now be earned *and* awarded: the guard stands where the only
  pickable lock is, and the debrief completes `zero_detection` when the count is 0.
  (Correction: the first version of this pass dropped that `#complete_task:zero_detection`
  line from the debrief rewrite, so Perfect Stealth could never complete. Restored.)

## Day/night (new — an alignment-plan goal that never shipped)

- The guard was patrolling the **main hallway**, a room with no pickable lock, so the
  lockpick line-of-sight check (which only considers NPCs in the lock's room) could never
  catch anyone. He now patrols the **executive wing** (x 2..8 of the 10x6 hall), watching
  Sterling's office door.
- He is **visible all mission** and his ink is phase-aware: a staff-only line in the
  afternoon (`daytime` knot), the torch-and-excuses flow at night. (Correction: the first
  version hid him until night. The engine's LoS interrupt ignores visibility and KO
  (`npc-manager.js:248-325`), so a hidden guard would have caught a daytime pick
  invisibly. Reverted to visible; engine patch logged.)
- **Danny** is `initiallyHidden` and revealed on entering his office once
  `mission_phase` is `act2_infiltration`, so his "sitting in the dark" scene can't play in
  the afternoon. His office has no pickable lock. The reveal is not `onceOnly`, because an
  `initiallyHidden` NPC is re-hidden on room load (`npc-sprites.js:222`), so it has to
  re-fire after a reload.
- The receptionist goes home (`setVisible:false`) when Victoria's card is cloned.

## Review round 2 (orchestrator's list, all addressed)

- **B1 positions.** NPC `position` is in tiles, relative to the room, and never clamped. The receptionist
  `{300,200}`, Victoria `{400,300}` and Danny `{420,300}` spawned hundreds of tiles outside
  their rooms, so nobody could reach them. They are now at `{3,3}` (behind the reception desk), `{5,7}`
  (between the conference tables) and `{5,7}` (Danny's office), all checked clear of template
  furniture. The guard spawns at `{5,3}`. His waypoint `x:17` sat outside the 10x6 hall and was being dropped
  silently; waypoints are now `x 2..8, y 3`.
- **M3 / lesson 14.** Danny and Victoria each have a re-entry guard (`after_choice`, sticky
  exit), so talking again can't replay the scene or overwrite the fate.
- **M5.** Victoria's three "six" lines are now count-free.
- **M6.** The debrief's split aftermath sentence now sits whole inside each branch. "Swears she's never
  met them" only plays for recruited/arrested. `left` is consistent across credits and debrief
  (he hasn't called; his whereabouts are unknown). The US legal terms are replaced with a CPS/Computer Misuse framing.
- **M7.** Four visible author placeholders in the guard ink (`[Improvise department name]`
  etc.) are now written as real lines.
- **M8.** The cloning route no longer dead-ends. With rapport spent (influence can fall to −15), the
  whiteboard move is still offered once both topics are exhausted, and Victoria's line is curt.
  I simulated the worst-case interview: influence −15, choices `[whiteboard, end]`.
- **Minor.** Standalone emotes are folded into lines. UK spelling fixed (police, favour, programme,
  enrolment, sceptical, recognise, specialised, authorise). The guard's "10 minutes" now matches the
  agreed hour. Every direction was checked against `connections`: conference is first on the left,
  the executive wing is east, Danny is on the south side of the wing. Teaching text is corrected: ROT13 is
  substitution, the Base64 is unpadded, and the whole draft is Base64. The safe observation no longer
  spoils the whiteboard. Wording that treats opening an item as decoding it is softened, and HaX
  no longer reads the directive out before the player has decoded it. `operational_log_content` is now the distcc
  flag reward (the **Zero Day Transaction Log**, m02 `71e8852e` pattern). All `[...]` narration is
  now `Narrator:` lines or cut. The walkthrough's stale lines are fixed.
- **Minor 10, collision.** On the day-KO path, finishing the last flag used to fire the debrief, the
  revelation call and the drop-site together. Now HaX sends a timed message back to the conference
  room, and the fate settles on `room_entered:conference_room_01`.

## Rule for every mission (from m05/m06, applied here)

**The `missionConclusion` aim's last task must complete at the END of the debrief, never on the decision that launches it.** `bond_visualiser` opens the moment the server confirms the aim's last task (`objectives-manager.js` `handleMissionConcluded`). If that task is the same decision whose global starts the debrief, the credits open over or before it. Pattern:
- a required custom task `hear_debrief` as the aim's last task;
- `#complete_task:hear_debrief` on the debrief's last line;
- `debrief_played` set at the top of the debrief, which also stops a replay after a reload;
- a backstop: `room_entered` on every room with `debrief_played === true` completes the task, in case the page reloads mid-debrief.

## Review round 5 (credits over the debrief)

- m03 had exactly this bug. `moral_choices` ended on `victoria_choice_made`, and the same global launched the debrief. Added `hear_debrief` as its last task, completed at the end of `m03_closing_debrief.ink`. `#set_global:debrief_played:true` now opens the debrief. The debrief trigger requires `debrief_played !== true`, because `onceOnly` isn't persisted. There's a room-entry backstop for all 7 rooms.
- Semantics checked:
  - `concludeRequires` is unchanged (the four flag tasks). The credits path (`conversation_closed:closing_debrief`, then `/conclude`) gates only on that (`game.rb` `conclude_mission!`), so the aim task and the credits can't deadlock. Whichever arrives first concludes; the other gets "already concluded".
  - `victoria_choice_made` is still required and still launches the debrief.
  - Day-KO route: entering the conference room settles her fate and launches the debrief. The backstop on that room can't fire then, because `debrief_played` is still false.
  - Perfect Stealth: `zero_detection` completes at the top of the debrief, which is now before the mission concludes rather than racing it.
- Validator: 0 INVALID. Three new co-fire notices, because the backstop shares `room_entered:` patterns with existing HaX handlers (`executive_wing_hallway`, `server_room`, `conference_room_01`). They're intended: the handlers do different things and each is conditioned.
- Compile 7/7. Debrief inkcheck at `start`: 40/40 (victoria_fate × james_fate × guard count 0/2). loopcheck clean.
- **Not confirmed live.** Running the test bridge means a browser playtest session against the Rails server, which isn't cheap. The order "debrief, then credits" is argued from the code path, not observed.

## Review round 4 (confirmation playtest, games 1158/1159)

The confirmation run passed D1, D2/D3, D6 and D8, plus Danny expose and Victoria recruit. It earned 5829 properly and reached `status=completed` on both routes. What it still found:

- **D9, same-session re-talk still showed "(End of conversation)".** The root `-> start` divert from round 3 did not help live. The engine's restore path doesn't run the story root the way my inkjs simulation assumed. Replaced with the m02 pattern: **person-chat conversations never reach DONE.** Every exit is `#exit_conversation` followed by a divert to a choice-first resting knot, so the engine saves the story at those choices and restores it there:
  - receptionist: 7 exits → `hub`. The hub is night-aware: after the clone, its only option is "You're still here? It's late." → `closing_up`. This also fixes her "Have a great visit!" at night. Two orphan knots (`daytime_return`, `restricted_area_daytime`) removed.
  - Victoria: 8 exits → `idle`, with one option per state (night confrontation / pick up the conversation / thank her / out cold / nothing more to say). The conditions cover every state, so the knot is never empty.
  - Danny: 3 decision exits → `after_choice`, now choices-first with one option per fate.
  - guard: 16 exits → `guard_idle` (daytime line by day, talk or back off by night).
  - phone (m02 `m02_phone_agent0x99` pattern): the 6 event-knot exits now land in the support hub; only "Nothing right now" ends the call. Briefing and debrief keep their endings, as m02's do.
  - The root divert is kept. It's harmless.
- **D13, same-session re-talk to Victoria looped "line → RFID read → same line".** The restore re-entered the knot carrying `#clone_keycard`. The clone tags now sit in a one-shot block guarded by the scenario global `victoria_card_cloned` (set by `#set_global` in the same tag batch, and synced back in on every talk). The choices after the capture moved to a separate knot, `clone_debrief`, so the engine's "re-navigate to the knot owning the current choices" lands there, never on the tags.
- **D14.** The clone-success call replayed after a reload because `onceOnly` isn't persisted. It's now guarded on a `clone_call_done` global that the handler sets.
- **Notes from the run, unexplained:**
  - Guard line of sight still can't be tested. The engine's NPC record for NPCs outside the start room has no sprite or x/y (the same gap as D3; added to approval-log item 6).
  - Walking west in the executive hall with the keyboard stops at x=361, but clicking crosses the doorway. The guard's patrol no longer reaches that doorway, so this is not the guard. Unexplained; needs a collision-layer look.

### Verification after round 4
Simulations use inkjs with the engine's restore sequence (`LoadJson`, then global sync, then `ChoosePathString` to the knot owning the first choice):

- Same-session re-talk:
  - receptionist, day → full hub;
  - receptionist, night → "You're still here? It's late.";
  - Danny after deciding → his fate's `after_choice` option;
  - Victoria at night → "Sterling. We need to talk.";
  - guard at night → "Talk to the guard".
- D13: state saved at the clone tag and restored with `victoria_card_cloned=true` resumes without the tag. Re-navigation goes to `clone_debrief` (its 3 choices) and the tag does not fire again. Entering `clone_complete` directly with the global set also skips the tag.
- loopcheck: 19 entry/state combinations clean, 200 steps × 6 strategies. All four person-chat NPCs report "never ended" in every state tested, which is the property this round needed. Phone, briefing and debrief end where m02's do.
- compile, inkcheck and validator results are in the report to the orchestrator.

## Review round 3 (browser playtest, games 1155-1157)

The playtest reached `status=completed` on the critical path and found the following. The mission-local ones are fixed; the engine ones are in the approval log.

- **D1, every container opened empty.** All six object containers (Danny's PC, Sterling's PC, the desk drawer, both filing cabinets, the wall safe) kept their items under `itemsHeld`, which is the NPC inventory field. Objects need `contents`. `item_unlocked` is only emitted when `contents` exist (`unlock-system.js:719-735`), so `access_victoria_computer`, `lore_fragment_1` and `lore_fragment_2` never ticked, and the 5829 draft could not be read. All six are converted. NPC `itemsHeld` and the drop-site's `itemsHeld` (read by `process_item_reward`) are unchanged. In the rendered JSON the six containers hold 1, 1, 1, 2, 1 and 2 items, and each `unlock_object` target is one of them. My round-1 claim that the safe chain was "verified end-to-end" came from decoding the ERB strings. It never proved that the player could obtain the draft in the game, and in fact the player couldn't.
- **D2, the KO handlers were dead.** `globalVarOnKO` writes the global without emitting `global_variable_changed` (`npc-hostile.js:159-166`), so nothing keyed on `victoria_ko`/`james_ko` ever fired. The handlers now key on `npc_ko:victoria_sterling` / `npc_ko:danny_foster`, which the engine does emit. `npc_ko` fires before `globalVarOnKO` is written, so the handlers set `victoria_ko`/`james_ko` and the fates themselves.
- **D3, a Victoria KO soft-locked the server room.** An NPC outside the start room has no sprite reference at KO, so no item drops. If she is knocked out before her card is cloned, HaX now phones and gives **Executive Keycard (Nightshade's copy)** (`card_id: victoria_keycard_clone`, held by `agent_0x99`, `#give_item` above the dialogue). The guard carries nothing the mission needs, so his missing drop costs nothing.
- **D6.** The clone-success call no longer opens over Victoria's conversation. The clone still sets `mission_phase` at once, but the call waits for `room_entered:main_hallway`.
- **D7.** The receptionist's `setVisible:false` mapping did not hold in play. Behaviour is registered for every sprite NPC and the server persists `isVisible`, so the cause is not settled from the source; it needs a live trace. Hiding her isn't needed, so the mapping is gone. At night her ink routes to `closing_up` ("shutting down for the night"). Victoria's `setVisible:false` after her fate uses the same mechanism, and if it also fails, her `after_choice` guard handles the re-talk.
- **D8.** The receptionist moved from `{3,3}` to `{6,3}`, away from the north door. The guard patrols `(5,3)-(8,3)-(8,4)-(5,4)`, off the west doorway and the south door. Victoria and Danny moved to `{5,4}`, the gap between the office tables (tables span x 1.0-3.4 and 6.6-9.0 in the template).
- **D9.** Victoria's "You step back..." line is now Narrator, and so are three other stray prefix-less lines (the guard's cash, the receptionist's two sign-ins). Danny's stray quote is gone. About 20 action emotes inside spoken lines are either cut or reduced to a short delivery cue. "Twenty-five thousand dollars" becomes "twenty-five thousand, priced in US dollars", keeping m02's canon figure.
- **D9, same-session re-talk showed "(End of conversation)".** The cause is an engine gap. When a story has ended, `restoreNPCState` restores only its variables and does not navigate (`npc-conversation-state.js:121-135`), so the story continues from an empty root. This hit every m03 NPC whose knots end in `-> DONE`. Without a reload it would also have hit Victoria's night confrontation. The playtest's arrest run came after a reload. Mission-local fix: every m03 ink now opens with a root `-> start`. I simulated that exact path (fresh story, globals set, continue from the root): Danny reaches `after_choice`, Victoria reaches the confrontation or `after_choice`, the receptionist reaches her hub and the guard his night hub. None of them hit the end.
- **D10** (wrong password shows "Network error", counter stays 0/3) is engine. `password-minigame.js:474` tests `error.message.includes('422')`, but `api-client.js` puts the status on `err.status` and the message is the server's "Invalid attempt". The PIN minigame was fixed for this; the password minigame wasn't. It's logged. Nothing in m03's config is involved.
- **D12.** `time_of_day` now flips to `night` together with `mission_phase`.
- Scenario validator: no warning about the missing containers any more; the new `give_item` placement warning is fixed.

### Verification after round 3
- compile: 7/7, 0 failed.
- `inkcheck <file> start`: 7/7 pass. Variants: the receptionist at night, Victoria KO'd, the guard at night (800/800), `on_victoria_ko_card`, and Danny with a fate set all pass.
- loopcheck: 13/13 state combinations clean, 200 steps × 6 strategies.
- Debrief matrix: 20/20 Victoria fate × Danny fate combinations.
- validator: schema passes, geometry OK, 0 INVALID. The 6 notices are all expected: 2× `rfidCard`, 4 `npc_ko:victoria_sterling` handlers that complete different tasks on purpose, the repeatable guard lockpick mapping, and 2 suggestions.
- Rendered JSON: 6 containers with `contents`, and the drop-site `itemsHeld` intact.
- Not verified in a browser: container pickup after the rename; the KO keycard handover; the clone call on leaving the room; the new positions and pathing (including `moveToNear` to Victoria); the root-divert re-talk in the live engine.

## Dialogue pass

- HaX renamed to **Agent HaX** throughout (was the inconsistent "Agent 0x99" display
  name); given the m02 voice, avatar and talk sprite. Briefing/debrief/phone all use her.
- Opening briefing re-seated on canon: WhiteHat = front, Zero Day = cell, Sterling = Sable
  under 0day/Architect; St. Catherine's link stated with m02's real figures.
- Victoria's `victoria_suspicious` was a `bool` incremented as an `int`; fixed to `int`.
  Trimmed her CVSS line to name the real mechanism (sector premium = defensive capacity).
- UK English and idiom pass on the guard (£ not $, "police" not "cops", "doughnuts"),
  receptionist, and Victoria. The receptionist's "2010 is the safe PIN!" line — now wrong —
  re-pointed at "a founding year is the sort of thing that ends up in a password."
- All NPCs given consistent v2 sprites, talk/viseme sheets and en-GB voices (guard,
  receptionist, Victoria, Danny, Netherton/Nightshade seed NPCs were already done).

## Canon / continuity

- See the approval log for the two canon items (codenames + m02 figures) and the **m04
  cross-mission flag-form bug** surfaced while fixing m03's.

---

## Verification (actual results, after review round 2)

- `./scripts/compile-ink.sh m03_ghost_in_the_machine` → **7 compiled, 0 failed**.
- `inkcheck.js <file> start` (explicit knot) → **7/7 ✅**, e.g. receptionist, Victoria,
  briefing and phone at 800/800 clean paths. Variants: guard at `mission_phase=act2` 800/800;
  Victoria at `night_confrontation_ready=true` 9/9; Danny at `start` 9/9 and with a fate set;
  debrief **20/20 victoria_fate × james_fate combinations** clean.
  (Correction: the first report quoted "`(start)` paths=1" runs. Those ran the root container,
  not the `start` knot, and proved little (lesson 16). Every number above now comes from runs with the explicit knot.)
- `loopcheck.js` → clean across 11 entry/state combinations, including the phone hub with every guide
  offered, the guard by day and by night, Danny before and after the decision, and Victoria after her fate. 200
  steps × 6 strategies, no runtime errors.
- `validate_scenario.rb` → **schema passes, geometry OK, 0 INVALID, 0 soft-locks**. 8 notices,
  all benign or intended:
  - 2× `rfidCard` unknown field. The engine reads it (`chat-helpers.js` `clone_keycard`); same as m02.
  - 1× three `victoria_ko` handlers. They complete three different tasks on purpose.
  - 1× guard `lockpick_used_in_view` without `onceOnly`. It's deliberately repeatable, with a cooldown.
  - 4× design suggestions.
- `predict_door_sides.py` → **no overlaps**; layout unchanged. Dungeon graph regenerated.
- I rendered the ERB and decoded every artefact. The whiteboard points to the drafts, the draft gives `5829`,
  the drive (Base64 then ROT13) gives the directive, and the roster (hex) gives the client list.

### Not verified
- **No browser playtest.** Everything above is static. These need a live check:
  - the flag round-trip;
  - Danny's `room_entered` reveal, including sprite-load ordering and re-reveal after a reload;
  - the debrief firing on `victoria_choice_made`;
  - the day-KO sequencing.
- **Known engine gap (logged):** a **KO'd** guard still triggers the lockpick LoS interrupt.
  Mission-locally, the only mitigation is that his frozen cone can be avoided.

## Capability arc

**m03 grants / makes the player fluent in:** two-stage RFID cloning (weak-default capture,
then a custom-key darkside crack that *takes time* — you hold proximity while it grinds),
lockpicking under an active line-of-sight guard, and multi-layer decoding as a routine
(ROT13, hex, Base64, and layered combinations, with a portable CyberChef the player
carries between rooms). On the network side: nmap recon → service enumeration → the
legacy-service exploit (distcc, CVE-2004-2687) as the route to the evidence.

**What m04 should make the player feel the absence of:** *time*. m03's second half is a
quiet building with a patrolling guard and no clock — the player can decode at leisure and
choose when to confront. m04 (Critical Failure) is a live 0800 thermal-runaway trigger on
grid storage; the same recon-and-exploit muscles now run against a countdown, and the
"come back later, take your stealth bonus" luxury is gone. m03 also plants **Critical
Mass** in the client roster and the Architect's directive ("Zero Day supplies, Critical
Mass executes"), so m04's cell is already named on paper the player carried out.
