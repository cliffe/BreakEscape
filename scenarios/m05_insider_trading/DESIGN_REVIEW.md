# m05 Insider Trading: design review (pass 4)

Reviewer: design-review agent, 2026-10-02. Read-only review; nothing in the mission was edited. Line numbers refer to the files as they stood on 2026-10-02.

## 1. Validator output

`ruby scripts/validate_scenario.rb scenarios/m05_insider_trading/scenario.json.erb`, run 2026-10-02. Also run: `check_door_alignment.py` (9/9 OK) and `predict_door_sides.py`. Static checks only; no browser test was run for this review.

Dungeon graph: Puzzle 33 nodes / 34 edges; Story 6 / 6; Integrated 39 / 49; Rooms 10 / 9. Critical path (4 hops): Get Inside Quantum Dynamics → Work Out Who Has Been in the Servers → Prove the Exfiltration on the Server → + → Decide What Happens to Him.

### ❌ INVALID

None. Schema passes, no unknown fields, all ink valid, room geometry and door alignment OK.

### ⚠️ WARNING

- Six eventMapping co-fire warnings, all on `agent_0x99_handler`: `item_picked_up:notes` ×6, `item_picked_up:keycard` ×4, `global_variable_changed:flag3_submitted` ×2, `door_unlock_attempt` ×4, `object_interacted` ×3, `conversation_closed:david_torres` ×4. All six are intended. The first five sets are disjoint by `data.itemId`, `data.connectedRoom` or `data.objectName`/`objectType` (erb:761-793, :876-925); the flag-3 pair is meant to fire together (bark plus `case_exfil` latch, erb:819-850). The Torres-close quartet is guarded by `flags_nag_sent` (erb:927-935), and that guard works: `_handleEventMapping` evaluates each handler's condition at handling time and applies `setGlobal` synchronously before the next handler runs (`public/break_escape/js/systems/npc-manager.js:613-663`). The validator can't see disjoint `data.*` equality conditions; that is a validator gap (see backlog).
- "Missing recommended" items: `director_netherton` and `agent_nightshade` have no behaviour (erb:619-654). False positive: they are hidden co-speakers in the opening cutscene, like m02's. Eight `showProgress` suggestions on single-item collect tasks: not worth adding, a 0/1 counter tells the player nothing.

### ✅ GOOD PRACTICE

Event-driven cutscenes (7 person-chat), `globalVarOnKO` on every person NPC, `skipIfGlobal` on the opening, a full music event table with conditional credits, a hostile NPC with chase/attack settings, and `puzzle_graph_*` metadata throughout.

### 💡 SUGGESTION

- `identify_torres` has no KO-safe fallback "through person NPC `patricia_morgan`". Partly wrong: the same `#complete_task:identify_torres` tag also lives in two phone NPCs that can't be knocked out, HaX (`m05_phone_agent_0x99.ink:329`, offered when `patricia_ko`, :159) and Patricia's mobile (`m05_phone_patricia.ink:135`, which is closed off by her KO, :46). The HaX route is the real fallback, so this is fine. The validator should count phone-NPC tags (backlog).
- Patrol waypoints: not relevant. Nothing in m05 asks for a moving NPC, and an office at 8 pm is plausibly still.
- Phone `timedMessages`: not needed. HaX's opening text is an event mapping on `conversation_closed:opening_briefing` (erb:739-745), which is the better pattern (it can't land over the briefing).
- PIN locks: skip. The PIN cracker is rationed by user ruling (AGENTS.md "Standing user rules"), and m05 already has six locks of four kinds.

## 2. Design review (README_scenario_design.md)

### 2a. Solvability trace — OK, with one CONCERN on the story layer

Critical path, shortest route: briefing → Patricia (visitor badge, incident log on her desk, vetting file on request; `m05_npc_patricia_morgan.ink:114-135`, :245-252, erb:1436-1445) → Owen in the open-plan office, clone his lanyard from the hub (`m05_npc_owen_gallagher.ink:105-106`, :182-208) → server hallway (rfid `employee_badge`, erb:1187-1191) → try the server-room door, which sets `server_door_seen` (erb:887-895) → back to Owen, who hands the password over for the incident log or Patricia's authority (`m05_npc_owen_gallagher.ink:215-245`) → server room, VM, flags 1–3 (flag 3 is the exfil half of the case, erb:844-851) → name Torres to Patricia (in person, by phone, or to HaX if she's down), which also authorises Torres' office (`m05_npc_patricia_morgan.ink:335`) → Owen's spare card → Torres' office, dust the mug (erb:1292-1305) → key vault (biometric, `requires: "David Torres"`, erb:1472-1477) → confront Torres → flag 4 if not done → debrief.

- Every key is reachable before its lock. No circular dependency. The only AND (mug print plus kit) is recorded as a note on the kit (erb:482) and an unlock on the mug.
- Soft locks: none found. Every person-NPC KO has a relay (Patricia erb:863-869 → `on_patricia_ko_relay`; Owen erb:870-875 → `on_owen_ko_relay`), Torres' KO has a disableClose fate scene plus a phone safety net (erb:936-943, :1524-1532).
- VM wiring: all four `submit_flags` tasks have `targetFlags`/`targetCount` (erb:341-379); flag rewards are `set_global` (erb:1242-1267), not `emit_event`. Clean.
- **CONCERN, dialogue promises.** Several lines promise Patricia's presence after she may have been knocked out (see 2h). The confrontation's sympathetic choice has the player say "Told you it was for journalists, right?" (`m05_torres_confrontation.ink:100`), but nothing in the mission tells the player about the journalist cover story; "journalist" appears only there and in Torres' reply at :112. Torres' "You've seen the bills, then … three hundred and eighty thousand dollars" fires on the vetting file alone (:89-90), which doesn't give that figure (erb:1417).

### 2b. Clue distribution — OK

Clues are spread across six rooms: flyer (corridor, erb:1071-1080), leaflet (break room, erb:1114-1122), incident log and cabinet (Patricia's office), IT notice (hallway, erb:1198-1208), journal, mug and briefcase (Torres' office), schedule, manifest and envelope (vault). Each has a job (evidence global or a lock). The password hint sits at the door that needs it.

- **Minor.** The Building Directory (erb:1050-1057) is mostly navigation ("open-plan office", "Server hallway: staff badge only"). The map shows the rooms. Either cut it or give it a job: list the eight cleared cryptography staff, so Patricia's "one of eight" (erb:1442) is something the player can see.
- **Minor.** All found_* evidence is set `onRead` only. A player who picks up the upload schedule without reading it completes `find_upload_schedule` (pickup) but has no exfil half. HaX's pickup texts say "call me once you've read it" for the journal (erb:801-805) but nothing does the same for the schedule, manifest or vetting file.

### 2c. Educational coverage — OK

| Lock | Where | Teaches here |
|---|---|---|
| rfid (clone) | server hallway | proximity cloning of a colleague's badge; Owen's "I did half of Finance on last year's pen test" (`m05_npc_owen_gallagher.ink:194`) |
| password | server room | a "temporary" password on a sticky note for a year (:243), and an audit trail used as social leverage (:224-227) |
| rfid (card) | Torres' office | authorisation, not technique: an IT spare released on Security's say-so |
| biometric | key vault | a fingerprint is an identifier, not a secret: lifted from a mug and replayed |
| key | briefcase, cabinet | picks (optional, both) |
| flag ×4 | VM | leaked credentials → authenticated upload RCE → user → sudo root |

The set fits the brief well. Every critical lock is opened with someone else's trust (Owen's badge, Owen's password, Torres' print), so the player spends the mission doing what an insider does. That idea is never said aloud, and it should be (see §4 "Teaching").

### 2c′. Field guides — OK

- Exposure-gated: Bludit and recon guides on first `vm-launcher` interaction (erb:919-926); lockpicking on first touch of the cabinet or briefcase (erb:910-918); privesc on flag 3 (erb:819-824). On request through hub choices (`m05_phone_agent_0x99.ink:147-157`). All four ids match `itemsHeld` (erb:668-735), all globals declared (erb:542-543, :574-579), and all four `labUrl`s exist in HacktivityLabSheets (`_labs/safetynet/bludit-cms-exploitation.md`, `lockpicking.md`, `reconnaissance-and-network-mapping.md`, `privilege-escalation.md`).
- **Minor gap.** The RFID clone is a critical-path technique and `_labs/safetynet/rfid-cloning.md` exists, but m05 never offers it. The player learnt the clone in m03, so it's optional; offering it on the hallway door bark (erb:876-881) costs one mapping field and one hub choice.
- No fingerprint/biometric lab sheet exists anywhere in HacktivityLabSheets (backlog).

### 2d. Narrative structure — OK, one CONCERN

- Opening: `timedConversation` with `skipIfGlobal` and `setGlobalOnStart` (erb:611-617); the briefing names Patricia as the first stop, and HaX's follow-up text repeats it (erb:744). It lacks `"waitForEvent": "game_loaded"`, which every other mission's opening has (m01 erb:534-541; `grep -c waitForEvent` is 0 for m05 and ≥1 elsewhere). Playtests passed without it, so this is alignment, not a bug.
- Debrief: hidden person NPC fired on Torres' conversation closing with all four flags in (erb:1014-1045), with a phone-path twin and a last-flag twin. Clear win condition. `debrief_played` stops replays.
- Event-driven arcs: spot-checked the case-ready nudge (erb:852-862), the Recruiter's text on the naming close (erb:961-969) and the Torres reveal (erb:1512-1523). All correct.
- **CONCERN.** The debrief and credits don't reflect several things the player did (KOs of friendly staff, whether they lived up to their briefing answer, the Recruiter deal in two endings). Detail in §4.

### 2d′. Ink conventions — CONCERN (dialogue stage)

- Narration uses `Narrator:` under `#speaker:narrator` and the scenario defines the narrator voice (erb:58-66). Good.
- No in-ink combat: the fight is `#hostile:david_torres` + `#exit_conversation` (`m05_torres_confrontation.ink:302-314`). Good.
- **`You:` echo lines: 118 across nine files** (`grep -c '^\s*You:'`: Torres 30, Patricia 23, Owen 14, Halloran 11, Patricia phone 11, debrief 10, opening 8, Lisa 7, HaX 3, Recruiter 1). Most follow a bracketed label, e.g. `[Fill me in. What have you found so far?]` then `You: Fill me in on what you've found so far.` (`m05_npc_patricia_morgan.ink:61-62`), or a straight duplicate (`m05_npc_owen_gallagher.ink:108` and :217). The pass-4 brief forbids these. Some are scripted player lines with no choice at all (`m05_torres_confrontation.ink:193`, :206, :239, :377-383), which is the player speaking without being asked. This belongs to the dialogue stage, but it is the single largest convention break in the mission.

### 2d″. Patrol guards — N/A

### 2e. Dungeon graph metadata — OK, two gaps

- Lock–key relationships are well covered: kit → locks, Owen → card and note, mug → vault, Halloran's badge as an optional second route.
- **Gap: the VM is an island.** The four `vmch_submit_flag*` nodes have no inbound edge from `server_room` (`dungeon_graph.md` puzzle graph). The `vm-launcher` (erb:1224-1233) carries no `puzzle_graph_*` keys, and it isn't locked, so the generator draws nothing. m01's launcher is a lock and is drawn (`m01 dungeon_graph.md:177`). Add a `puzzle_graph_note`/role on the launcher so the chain reads server_room → launcher → flag 1.
- **Gap.** The vault's contents (schedule, manifest, envelope) and Torres himself don't appear in the puzzle graph, so the graph can't show that the confrontation sits behind the biometric door.
- Starting items appear as nodes from the start room. No backwards edges.

### 2f. Room layout — OK

- No empty rooms; every room has an object or NPC with a job. Geometry and door alignment clean.
- Room types fit, with two notes. `torres_office` uses `room_ceo` (erb:1273) while the CEO herself has no room; fine visually, but the cryptography lead gets the grandest office in the building. `server_room` and `data_center` are both `room_servers` (erb:1213, :1473), so the key vault looks like the room before it. A distinct vault room is a backlog art item.
- Backtracking: Patricia's office is a dead end off reception, and the two Patricia authorisations (office card, server password) can only be asked for in person (`m05_npc_patricia_morgan.ink:240-269`); her phone has no authorisation choices (`m05_phone_patricia.ink:68-88`). An attentive run walks back to reception once or twice for permission. See fix 7.

### 2g. Objectives scaffolding

| Aim | Required tasks | With in-world pointer | Dead-zone risk | Bark at transition |
|---|---|---|---|---|
| Get Inside Quantum Dynamics | 3 | 3 (briefing; HaX text to Patricia, erb:744; badge given in her first chat) | Low | Patricia's closing lines name Owen and Halloran (`m05_npc_patricia_morgan.ink:120-127`) |
| Work Out Who Has Been in the Servers | 4 (Owen, hallway, office card, password) | 4 (Patricia, directory, door barks erb:876-895, IT notice) | Low; locked later aims also reveal when any of their tasks completes (erb:173-179) | None. The aim completes silently |
| Find Out Why | 2 (office, journal) | 2 | Low | HaX text on journal pickup (erb:801-805) |
| Prove the Exfiltration on the Server | 8 (room, VM, 4 flags, vault, schedule) | 8 | Low | HaX text per flag (erb:806-832) |
| Decide What Happens to Him | 4 (name, confront, choose, debrief) | 4 (case-ready nudge erb:852-862, naming lines, Torres revealed) | **Medium after the confrontation if flags are missing**: the climax ends and the player is sent back to the VM (erb:927-935) | HaX "finish the job" text |

- **Task titles.** Most are actions. "Work Out Who Has Been in the Servers" (erb:213) doesn't match its tasks, which are all about getting access; the description ("Interview staff and get the access you need") is right. "Get a keycard for Torres' office" and "Get into David Torres' office" (erb:251, :295) name the suspect from minute two. Pass 3 recorded this as F11 and chose not to fix it; §4 argues it is the mission's main design weakness.
- No aim has more than half its required tasks as `manual`/custom without a pointer.

### 2h. NPC knockout resilience

| Person NPC | Gates a required task/item? | `taskOnKO` / fallback | KO reflected in debrief/credits? | Verdict |
|---|---|---|---|---|
| opening_briefing (HaX, cutscene) | briefing task | `taskOnKO: receive_mission_briefing` (erb:610) | No; same as m01 | OK |
| patricia_morgan | badge, office and server authority, naming | `taskOnKO: meet_handler`; HaX relay gives a pass and both authorities (`m05_phone_agent_0x99.ink:362-380`); HaX takes the name (:159-160, :322-354) | **No.** `patricia_ko` isn't declared in the debrief ink (`m05_closing_debrief.ink:20-48`) or used in credits | **Should fix**: mechanically safe, narratively contradictory |
| owen_gallagher | badge, card, password | `taskOnKO: talk_to_owen`; relay gives all three (`m05_phone_agent_0x99.ink:386-400`) | No | Should fix (minor): silence, not contradiction |
| dr_halloran | optional badge | `taskOnKO` (erb:1357) | No | OK (side) |
| lisa_park | optional | `taskOnKO` (erb:1109) | No | OK (side) |
| david_torres | confrontation, fate | `taskOnKO: confront_torres`; `post_ko_choice` (erb:1524-1532); phone safety net (erb:936-943) | Yes, via `final_choice` | OK |

Win condition: the debrief needs a fate and four flags, neither of which any KO can block. Mechanically this is as solid as m01.

**The Patricia-KO contradictions.** With Patricia down, these lines still play:
- HaX's advice: "you hold him, hand him to Patricia, and she calls the police" (`m05_phone_agent_0x99.ink:509`).
- Arrest: "Patricia is calling them" (`m05_torres_confrontation.ink:239`); after-choice "Patricia's on her way with the police" (:464).
- Post-KO: "call Patricia. She brings the police and an ambulance" (:356); safety net "Get Patricia and an ambulance down here … Patricia will ring the police" (`m05_phone_agent_0x99.ink:415`, :419).
- Debrief: "Nobody found him until Patricia went looking" (`m05_closing_debrief.ink:218`), "Patricia brought the police and an ambulance" (:266), "Patricia called the police" (:288).

Torres' opening already handles it (`m05_torres_confrontation.ink:59-63`), so the pattern is there to copy. A KO'd Owen gets no line anywhere after HaX's relay; the debrief could spend one line on a sysadmin with a concussion.

## 3. Prioritised action list (skill step 3)

**Must fix (blocks play)**
- Nothing. No invalid fields, no win-condition failure, no KO soft-lock.

**Should fix (degrades experience)**
- Patricia-KO contradictions across Torres, HaX and the debrief (2h).
- The Recruiter deal's consequences contradict themselves in two endings (§4, fix 2).
- `You:` echo lines, 118 of them (2d′; dialogue stage).
- The debrief claims things about the player that it never checks (§4, fix 5).
- The climax can end with the player sent back to the VM for flag 4 (2g, §4).

**Worth considering (polish)**
- Recruiter credits section can print an empty header (§4, fix 3).
- VM island and missing vault contents in the puzzle graph (2e).
- Opening `waitForEvent` (2d); directory with no job (2b); RFID guide (2c′).

## 4. Beyond the checklist

### 4.1 The mission promises a whodunnit and delivers a foregone conclusion

The setup sells a hunt. Nightshade: "Find whose behaviour stopped matching their story" (`m05_insider_trading_opening.ink:30`). HaX: "Identify the insider … narrowed it to eight people" (:138). The first learning objective is "Identify indicators of insider threats through behavioural analysis" (`mission.json:60`), and the universe framework lists "Identify the insider before confrontation" as the insider-mission bonus (`story_design/universe_bible/09_scenario_design/framework.md:769`).

What the player gets:
- The corridor flyer, two rooms from the start, is a collection for "David's wife Elena" (erb:1078).
- The to-do list says "Get a keycard for Torres' office" from the first aim that opens (erb:251), and Patricia's help menu offers his office before the player has any reason to want it (`m05_npc_patricia_morgan.ink:254`).
- Six of the eight suspects never appear. Halloran is the only other one on site, and nothing points at her.
- Naming isn't a choice. "I think I know who it is" always produces "David Torres" (`m05_npc_patricia_morgan.ink:276-307`). There is no wrong answer to give.

Pass 3 saw this (F11, `PUZZLE_CHAINS_PLAN.md:447-451`) and decided the mission is really "prove it and decide". That is a fair design, but then the framing should say so, because right now a player who came for a mystery spots Torres in the first minute and spends the rest wondering whether it's a trick. Two ways out, cheapest first:

1. **Make the framing honest (mission-local, small).** Patricia already suspects Torres and was ordered to stop (vetting file, erb:1417; CEO email, erb:1428). Let the briefing say so: the client has a suspect she can't touch; the job is to prove it, work out how he was turned, and stop the upload. Nightshade's line becomes about building a case that survives a CEO who wants it buried. Retitle aim 2 to match ("Get the Access You Need").
2. **Give the naming a real choice (mission-local, larger).** Patricia asks "who?" with three names (Torres, Halloran, and the anonymous crypto badge in her log). A name without matching evidence costs her trust and gets "that's not what your evidence says", like m01's Kevin frame-up, which carried its own credit line (m01 erb:133-137). That needs one red-herring thread for Halloran (e.g. her badge is one of the after-hours entries, explained by her own late work when asked).

Recommendation: option 1 now, option 2 only if the user wants m05 to be the campaign's deduction mission.

### 4.2 Evidence doesn't change the climax

All four endings are open whatever the player found. The evidence changes only flavour lines (`m05_torres_confrontation.ink:89-97`, :114-118, :145-147). Worse, the turn path has the player quote the journal whether or not they read it: "You wrote "what have I become"" is unconditional (`m05_torres_confrontation.ink:193`). The investigation's payoff should be what the player can say in that room:

- Gate the journal quote on `found_torres_journal`; without it, the player's argument falls back on Elena and the kids.
- Add a flag-4 argument to the turn path ("The Architect signed off thirty to forty-five deaths. Do you think they'd blink at yours?"). That also gives the player a reason to finish the VM before the confrontation (4.4).
- Keep every ending reachable, as "fun, not hard" requires. Evidence changes how persuasive the scene is, not whether the option exists.

### 4.3 Pacing and dead time

- **Permission errands.** The office card and the server password both route through Patricia's authority, and she can only grant it in person (2f). Each grant is a walk to the dead-end office off reception and back. Her mobile already exists; give it the same two asks (fix 7).
- **The password loop is good.** See the door, read the IT notice, go back to Owen with leverage (erb:887-895, :1198-1208; `m05_npc_owen_gallagher.ink:215-245`). That return trip teaches something and is worth keeping.
- **The urgent errand after naming.** Patricia and HaX say "He's at the upload terminal … Hang up and move" (`m05_phone_agent_0x99.ink:332-339`; `m05_npc_patricia_morgan.ink:338`), and then a player without the print has to collect Owen's card, dust a mug in another wing and walk to the vault. The lines do mention the print ("Something from his office will carry it"), so this works. It would sit better if the urgency line were conditional on `torres_print_collected` ("You've got his print. Go." vs "You'll need his print first. His office.").
- **Anticlimax after the climax.** The debrief waits for all four flags (erb:1018, :1038). A player who confronts Torres first is told "finish the job on that research server" (erb:933) and goes back to a VM after the story has ended. Nothing at the naming moment warns them. Fix 6 puts a line in each naming route when flags are outstanding, and 4.2's flag-4 argument gives a reason to finish first.

### 4.4 Does the player always know what to do next?

Mostly yes. HaX's door barks, the case-ready nudge and the state-aware `general_advice` (`m05_phone_agent_0x99.ink:552-590`) cover the main gaps. Two holes:

- After the fate is set with flags outstanding, HaX's `general_advice` has no branch for it: with `torres_identified` true it returns "You've named him … be ready for anything" (:565-568) even after the confrontation is over.
- **The Recruiter's call is easy to miss entirely.** Her text lands as the naming conversation closes (erb:961-969), the moment the game is telling the player to run to the vault. Ringing an unknown number back is optional and nothing points at it except HaX's early "watch for anyone who reaches out to you directly" (`m05_phone_agent_0x99.ink:108`). A player who ignores her until after the confrontation gets two lines (`never_talked_terms`, `m05_phone_recruiter.ink:345-352`) and loses the mission's second moral choice. Fix 4: have HaX react to her text ("She's reaching for you now. Hear her out, if you want; just don't give her anything.") so the player knows it matters and that it's safe to answer.

### 4.5 Teaching: the ideas are there; the closing line isn't

What each lock teaches is listed in 2c. What's missing is the moment that ties them together.

- **The player becomes the insider.** Every critical door opened with a colleague's trust. Torres even says the vault "logged me in twice tonight. One of them was you" (`m05_torres_confrontation.ink:67`), which is the best teaching line in the mission. The debrief never picks it up. One HaX line would: "You went through every locked door in that building on someone else's trust. That's what an insider looks like in the logs, and it's why nobody saw him."
- **Indicators.** The vetting file is the mission's best Cyber Security artefact: an undeclared change of circumstances, a credit-check hit, an aftercare interview cancelled from above (erb:1417). It's optional and behind a "help" submenu. The debrief should name the indicators the player actually found, gated on the found_* globals (financial pressure, out-of-hours access, an approach from a recruiter, management overruling security). That turns Nightshade's opening advice into a payoff.
- **Biometrics.** Nobody says the lesson out loud: a print is an identifier, not a secret, and you can't reset a thumb. Owen's handover line (`m05_npc_owen_gallagher.ink:244`) or HaX's lift text (erb:908) can carry it in a sentence.
- `mission.json` lists no biometric keyword under AAA or CPS (`mission.json` cybok block), though the vault is now a critical lock.

### 4.6 Fun

The lock set is varied: a clone, a social puzzle with evidence as leverage, a lifted print, the VM, two optional picks. Owen is the most likeable character in the mission and his lines carry the security jokes well. The weak spots are the foregone suspect (4.1), the errands (4.3) and a climax resolved entirely in a menu. The upload is stopped in narration: "He reaches past you and cancels the transfer" (`m05_torres_confrontation.ink:414`), or "You pull the drive" (:354, :363). The "Exfiltration Upload Terminal" (erb:1537-1553) is only a readable log. Letting the player pull the drive needs an interactive object that sets a global (backlog). Mission-local, a one-line choice ("[Pull the drive myself.]" vs letting him cancel) at least makes it the player's hand.

### 4.7 Stakes and the story's payoff

- Stakes land well: 30–45 deaths, specific mechanisms (cardiac, stroke, fires), Elena's trial, the kids' ages, a child's mug in the office (erb:1303). The family details are consistent everywhere they appear (Sofia 11, Miguel 8, $380,000, 20:30, 73%/27%, 47 names).
- **Public exposure clashes with canon.** SAFETYNET's rule is deniability: "If it goes right, nobody hears about it at all" (`story_design/universe_bible/02_organisations/safetynet/overview.md:25`). The player goes to "every newsroom that will take it" (`m05_torres_confrontation.ink:379`), and HaX's debrief treats it as a strategic trade (`m05_closing_debrief.ink:332-369`) without mentioning that an agent leaked an operation. Keep the ending, it's a strong one, but HaX should say what it costs SAFETYNET (Netherton wants a word; the cover identity is burnt).
- The lethal ending says "Nobody else knows he's down here" (`m05_torres_confrontation.ink:365`), but Patricia was told he's at the terminal (`m05_npc_patricia_morgan.ink:338-347`). The debrief then has her find him 40 minutes later (:218), which is consistent with her knowing. The confrontation line should go.

### 4.8 Does the debrief reflect what the player did?

What it gets right: five Torres endings each with their own branch, Elena's treatment, the CEO email, case strength, the Recruiter deal, and the briefing's stakes question. What it gets wrong:

- **Briefing answers are reported as results.** "You said you'd be methodical. You were." (`m05_closing_debrief.ink:120-128`) plays whatever the player did. Tie each to `case_strength()`: methodical with a thin file should hear about it.
- **`handler_trust` is set by the briefing and the Recruiter only** (`m05_insider_trading_opening.ink:43, :52, :122, :190, :278`; `m05_closing_debrief.ink:414`, :421). Knocking out Owen or Patricia, or leaving Torres to die, doesn't touch it, so "I trust your judgement. Last night proved that." (:483) can follow a night of beating up the client's staff. Adjust it at the top of the debrief from the KO globals and `final_choice`.
- **Friendly KOs are invisible** (2h). Patricia's KO produces outright contradictions.
- `{flag4_submitted: … - else: …}` (:431-435) has a dead branch: the debrief can't start without flag 4 (erb:1018). Likewise flags 3 and 4 always count in `case_strength()`. Harmless; worth knowing when tuning the thresholds.

**The Recruiter branches, traced:**

| What the player did | Debrief | Credits | Problem |
|---|---|---|---|
| Never rang back, or rang only after the confrontation | Skipped (`m05_closing_debrief.ink:378-380`) | "── THE RECRUITER ──" with no entry: every line needs `recruiter_deal_offered` (erb:150-155) | Empty section header |
| Heard the offer, hung up | "You never gave her an answer" (:381-390) | OFFER LEFT UNANSWERED | OK |
| Refused | :391-399, with or without the list | OFFER REFUSED ± list | OK |
| Accepted, then confessed | :405-415 | OFFER TAKEN, THEN CONFESSED | Contradicted earlier in the same debrief if the list was found: the turn ending says "the forty-seven on that TalentStack list. We're getting to them before the Recruiter does" (:188-189), and the exposure ending says "We rang the forty-seven on that list before the story broke" (:338-340). Both play before the confession |
| Accepted, then denied | :417-422 | OFFER TAKEN — forty-seven names left in her pipeline | Same contradiction; and the credits say the names stayed with her while the debrief said SAFETYNET was ringing them |

There's also no in-world consequence of saying yes. The deal is "the envelope goes to Reading" (`m05_phone_recruiter.ink:194`), but the player can take and read the envelope afterwards and nothing changes; there is no ink tag to remove an item (the tag switch in `minigames/helpers/chat-helpers.js` has no `remove_item`). Mission-local fix: gate the two list lines on `not recruiter_deal_accepted`. Better fix (needs an engine tag, backlog): accepting removes the envelope, or the deal requires leaving it on the terminal.

### 4.9 Continuity

- **Kit:** picks, cloner and fingerprint kit in the start inventory (erb:458-483), named in the briefing (`m05_insider_trading_opening.ink:206-208`); m04's debrief hands the kit over ("Keep the crew's fingerprint kit", `m04_closing_debrief.ink:139`) and the OptiGrid crew is m04's (m04 erb:75, :986). Correct.
- **Cells:** "Ransomware Incorporated. Zero Day Syndicate. Critical Mass. Now the Insider Threat Initiative." (`m05_closing_debrief.ink:437`) matches m02–m04.
- **Money thread:** the $847,000 TalentStack payment (erb:1570; `m05_closing_debrief.ink:439`) is picked up by m06's briefing and evidence (`m06_opening_briefing.ink:51`; m06 erb:48, :1411), and the debrief's "Next, we follow the money" (:460) hands over to m06's title. Good.
- **Nightshade:** the narration introduces him as "a man in a lab coat -- the service's own insider-threat specialist" (`m05_insider_trading_opening.ink:26`), as if new, though he was the technical lead in m03 (`m03_opening_briefing.ink:24-28`) and m04 (`m04_opening_briefing.ink:26-30`). Netherton's "catching a mole is precisely his trade" (:28) is a sharp piece of irony given m08 is *The Mole*, but the NPC's own comment says "NO hint of the m08 betrayal" (erb:638). That's a user call: keep it as deliberate foreshadowing (my preference), or soften it.
- **Threads left open:** nothing after m06 picks up Torres' fate, the 47-name list or the Recruiter. m08's "Deep State" brief ("Ideal candidates are not bought. They are convinced… Belief is the payment", m08 erb:1515-1520) is the natural answer to HaX's "ENTROPY rarely recruits believers" (`m05_phone_agent_0x99.ink:205`); one line in m08 naming the Recruiter would close the loop (other mission, for the log).

### 4.10 Presentation: seven characters share two legacy sprites

m05 still uses the old `hacker` and `hacker-red` sheets for the player, the opening HaX, Lisa, Owen (all `hacker`: erb:489, :602, :1100, :1145) and Halloran, Patricia, Torres (all `hacker-red`: erb:1348, :1393, :1494). In a mission about telling people apart, the three suspects-and-sponsors are the same red figure. The opening HaX looks different from the debrief HaX (`female_spy_v2`, erb:1001), and m01–m03 use v2 sheets throughout (commit `6d2c2a3f` says "All scenarios use the v2 character sprites"; m04 and m05 didn't follow). Every v2 sheet below has its talk, viseme and headshot files in `public/break_escape/assets/characters/`, so this is a mission-local swap with existing art (fix 9).

### 4.11 Housekeeping noticed in passing

- The pass-4 brief points at `story_design/universe_bible/04_characters/voice_bible.md`, which doesn't exist; only `09_scenario_design/dialogue_style.md` was found. The dialogue stage will need it (orchestrator).
- `ALIGNMENT_PLAN.md`, `PASS2_IMPROVEMENTS.md` and `TESTING_WALKTHROUGH.md` are older planning docs; the plan already marks them non-authoritative (`PUZZLE_CHAINS_PLAN.md:51-56`).

## 5. Proposed fixes

No blockers. Spoken-line counts are given because m05's audio is generated after this pass; they cost nothing yet but should be logged.

1. **[major] [mission-local] Patricia-KO variants.** Branch on `patricia_ko` wherever Patricia is promised after she may be down: `m05_torres_confrontation.ink:239`, :356, :464 (VAR already synced there, :38); `m05_phone_agent_0x99.ink:415`, :419, :509; `m05_closing_debrief.ink:218`, :266, :288 (declare `VAR patricia_ko = false` in the debrief). Replacement owner: "Security" or "QDC's night guard", or HaX calling it in herself. Also give `owen_ko` one debrief line. About 10 new spoken lines.

2. **[major] [mission-local] Make the Recruiter deal consistent.** In `m05_closing_debrief.ink` gate the list lines in the turn ending (:188-189) and the exposure ending (:338-340) on `found_pipeline_list and not recruiter_deal_accepted`, with an accepted-deal alternative ("He's met some of her other candidates. Not the list. We'll come back to that."). Leave the reckoning (:401-422) as the place the deal surfaces. 2 new spoken lines.

3. **[minor] [mission-local] Fill the empty Recruiter credits section.** Add an entry for `!globalVars.recruiter_deal_offered`, e.g. "NEVER RANG HER BACK — the TalentStack list went to SAFETYNET" / "…was never recovered", split on `found_pipeline_list` (erb:150-155). Credits only, no audio.

4. **[major] [mission-local] Point the player at the Recruiter's call.** Add a HaX mapping on `global_variable_changed:recruiter_texted` (`value === true`, `onceOnly`), `sendTimedMessage` after ~5 s: "That TalentStack number is the Recruiter. Hear her out if you want. Just don't give her anything." A single-term condition, so it meets the `&&`-only rule noted at erb:737. 1 new spoken line.

5. **[major] [mission-local] Make the debrief reflect the night.** In `m05_closing_debrief.ink`:
   - tie the `player_approach` lines (:120-128) to `case_strength()` (a promise kept or broken), 3–6 lines;
   - adjust `handler_trust` at the top of `start` from `patricia_ko`, `owen_ko`, `lisa_ko`, `halloran_ko` and `final_choice == "combat_lethal"` (declare the VARs; ink arithmetic is fine here since the debrief owns the value);
   - add an indicators recap gated on the found_* globals (financial pressure, after-hours access, a recruiter's approach, management overruling security), 3–4 lines;
   - add the "you went through every locked door on someone else's trust" line after the case assessment, 1–2 lines;
   - public exposure: one or two HaX lines on what it cost SAFETYNET's deniability (canon, `safetynet/overview.md:25`).
   About 12–15 new spoken lines.

6. **[major] [mission-local] Warn about outstanding flags before the climax.** In the three naming routes (`m05_npc_patricia_morgan.ink:336-349`, `m05_phone_patricia.ink:138-145`, `m05_phone_agent_0x99.ink:331-339`), add `{not (flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted): …}` with a line such as "Stop him first. HaX will still want everything off that portal before she pulls you out." (declare the flag VARs where missing). Add a `general_advice` branch for "fate set, flags outstanding" above the `torres_identified` return (`m05_phone_agent_0x99.ink:565`). 3–4 new spoken lines.

7. **[major] [mission-local] Patricia's phone grants the two authorities.** Add the office-card and server-room asks from `m05_npc_patricia_morgan.ink:254-265` to the hub in `m05_phone_patricia.ink:68-88`, with the same conditions and `~ patricia_authorised_*` assignments. Follow the file's header rules (each resting knot re-checks state; nothing printed before the first choice) and re-run `reopencheck.mjs`. Owen's lines already read correctly ("Patricia messaged", `m05_npc_owen_gallagher.ink:260`). 2–4 new spoken lines.

8. **[major] [mission-local] Let evidence shape the confrontation.** Gate "You wrote "what have I become"" (`m05_torres_confrontation.ink:193`) on `found_torres_journal`, with an Elena-and-the-kids fallback; add a flag-4 argument to the turn path ("The Architect priced thirty to forty-five lives. What do you think yours is worth to them?"). All endings stay available. 2–3 new spoken lines.

9. **[major] [mission-local] Replace the legacy sprites** with existing v2 sheets (talk, visemes and headshot all exist): opening HaX → `female_spy_v2` (as the debrief, erb:1001-1005, and m01 erb:520); Patricia → `female_security_guard_v2`; Halloran → `female_scientist_v2`; Lisa → `female_office_worker_v2`; Owen → `male_hacker_hood_down_v2` or `male_nerd_v2`; Torres → `male_telecom_v2` for now (avoid `male_scientist_v2`, which is Nightshade in the same mission, and `male_office_worker_v2`, m01's Derek); player → whatever the campaign standard is (m01: `female_hacker_hood_v2`, m01 erb:500). Swap `spriteConfig` to the v2 shape (`idleFrameRate`/`walkFrameRate`, as erb:629) and add `spriteTalk`/`spriteVisemes`/`avatar`. Check every NPC position renders, since sprite bounds change. No audio.

10. **[major, design decision] [mission-local] Fix the whodunnit framing (4.1).** Recommended option 1: rewrite the briefing so Patricia's suspicion of Torres is known and the job is proof, cause and choice; retitle aim 2 "Get the Access You Need" (erb:213); adjust Nightshade's line (`m05_insider_trading_opening.ink:30`) and HaX's "Identify the insider" (:138). About 4–6 spoken lines. Option 2 (a real accusation with a red herring) is a larger plan and should go through the puzzle-chains loop.

11. **[minor] [mission-local] Confrontation continuity.** The "journalists" line (`m05_torres_confrontation.ink:100`) assumes knowledge the player never got: rephrase as a question ("What did they tell you it was for?"). The bills line (:89-90) on a vetting-file-only run should drop the dollar figure. Cut "Nobody else knows he's down here" (:365). 3 lines changed.

12. **[minor] [mission-local] Urgency that matches the player's state.** Make "Hang up and move" / "He's at the upload terminal" conditional on `torres_print_collected` (declare it in the three naming inks): "You've got his print. Go." vs "You'll need his print first. His office." 2–3 lines.

13. **[minor] [mission-local] Teaching lines.** One biometric line at Owen's handover (`m05_npc_owen_gallagher.ink:244`) or HaX's lift text (erb:908): a print is an identifier, not a secret, and nobody can reset a thumb. Offer the RFID cloning guide (`_labs/safetynet/rfid-cloning.md`) on the hallway bark (erb:876-881) with a hub choice. Add biometric spoofing to `mission.json`'s AAA keywords. 1–2 lines.

14. **[minor] [mission-local] Read reminders.** HaX pickup mappings for `upload_schedule`, `data_package_manifest` and `torres_vetting_file` ("Read it; I need what's in it, not the paper."), matching the journal text (erb:801-805). Evidence globals are `onRead` only. 1 line, reused.

15. **[minor] [mission-local] Give the player the drive.** At `stop_upload` (`m05_torres_confrontation.ink:412-414`) offer "[Pull the drive myself.]" vs letting Torres cancel it; same outcome, different hand. 1–2 lines.

16. **[minor] [mission-local] Graph and config polish.** `puzzle_graph_*` on the `vm-launcher` (erb:1224) so the VM chain hangs off `server_room`; graph entries for the vault's contents; `"waitForEvent": "game_loaded"` on the opening `timedConversation` (erb:611-617) to match every other mission; give the Building Directory a job (list the eight cleared staff) or remove it (erb:1050-1057).

17. **[minor] [mission-local] Nightshade's introduction.** The narration (`m05_insider_trading_opening.ink:26`) should treat him as the known colleague from m03/m04. Whether to keep "catching a mole is precisely his trade" (:28) as m08 foreshadowing, against the erb:638 comment, is a user call; recommended: keep it and update the comment. 1 line.

18. **[dialogue stage] [mission-local]** Remove the 118 `You:` lines per the pass-4 rule (2d′), folding words into the choice brackets. Listed here so the count is on record; the npc-dialog-review stage owns it.

19. **[minor] [needs approval: other mission]** One line in m08 tying the "Deep State" brief to the Recruiter/TalentStack (m08 erb:1515-1520), closing m05's thread.

## 6. Ideas for the backlog

- **Engine: `#remove_item:<type>:<id>` ink tag.** Lets a deal or a handover take something back (the Recruiter's envelope, 4.8). Today the tag switch in `minigames/helpers/chat-helpers.js` has no removal.
- **Engine/minigame: an actionable terminal.** A `pc`/terminal object with an action button that sets a global or completes a task ("Pull the drive", "Cancel transfer"), so climaxes can be played rather than narrated. m05's upload terminal (erb:1537-1553) is the first customer.
- **Engine: cross-mission state.** A small set of campaign flags carried between missions (Torres turned, Recruiter deal taken, list recovered), so m06–m08 can acknowledge m05's choices.
- **Validator: understand disjoint `data.*` conditions.** Mappings that differ only by `data.itemId === '…'` (or `connectedRoom`, `objectName`) can't co-fire; stop warning on them. m05 carries six such warnings.
- **Validator: count phone-NPC `#complete_task` tags as KO fallbacks** (m05's `identify_torres` suggestion, 1 above).
- **Validator: flag empty credit sections.** A `section-header` whose entries all have conditions that can be false together (m05's Recruiter section).
- **Validator/linter: unconditional quotes of optional evidence.** Detect player lines that quote a readable's text without gating on its `onRead` global (`m05_torres_confrontation.ink:193`).
- **Lab sheet: biometrics field guide.** No fingerprint/biometric sheet exists in HacktivityLabSheets; m04 and m05 both rely on the technique.
- **Art: a key-vault room.** `data_center` reuses `room_servers`, so the vault looks like the server room before it. A cage/vault server room would sell the boss door.
- **Art: a bespoke David Torres** via the PixelLab pipeline (tired senior engineer, late forties). He is the mission's central figure and currently borrows a generic sheet. Needs user approval (image generation).
- **Design: a deduction variant of the insider mission** (option 2 in 4.1): an accusation with three names, a red-herring thread, and a credits line for a wrong accusation, modelled on m01's Kevin frame-up.
- **Design: "Pressure Point" (Viktor Kozlov)** from the Insider Threat Initiative canon (`insider_threat_initiative.md`, after :37) finds the leverage on targets. A later mission could show who found Torres' debts.

## Changes made (pass 4 design)

Implementation agent, 2 October 2026. Mission-local files only: `scenario.json.erb`, the ten inks and their compiled `.json`, `mission.json`, `TESTING_WALKTHROUGH.md`, this file and the new `PASS4_PLAYTEST.md`, plus the m05 entry in `scripts/ink_runtime_check/missions.json` (seven new globals, so reopencheck varies them). User decisions taken in this pass: fix 10 becomes a real whodunnit; Nightshade's "catching a mole" line stays as m08 foreshadowing.

### Fix status

1. **Patricia-KO variants: done.** `patricia_ko` branches in the arrest line, the post-KO narration (you call HaX; police and ambulance arrive "and nobody asks who rang"), HaX's confrontation advice and KO safety net, and three debrief branches (killed: "until the cleaners came through"; subdued; arrested). `after_choice` now reads "Sit tight. The police are on their way." in every case. Owen's KO, and Lisa's and Halloran's, each get a debrief line (`the_night` knot).
2. **Recruiter consistency: done.** The turn and exposure endings claim the list only when `found_pipeline_list and not recruiter_deal_accepted`; an accepted deal gets "Not the list. We'll come back to that." Also fixed a third contradiction the review missed: the no-cooperation arrest ending said "the forty-seven stay in the pipeline" even when the list was in the report.
3. **Empty Recruiter credits: done.** Two entries for `!recruiter_deal_offered` ("NEVER HEARD HER OFFER — the TalentStack list went to SAFETYNET / was never recovered"). Checked against every reachable combination of offered/decided/accepted/confessed/list: exactly one Recruiter line prints in each.
4. **Point at the Recruiter's call: done.** HaX mapping on `global_variable_changed:recruiter_texted`, 6 s, `skipIfGlobal: recruiter_contacted_player`.
5. **Debrief reflects the night: done.** `handler_trust` drops at the top of `start` for each friendly KO (Patricia -15, others -10), a lethal ending (-20), public exposure (-10) and a wrong accusation (-10). The briefing answer is checked against `case_strength()` (methodical, fast) or friendly KOs (read the room). New `the_night` knot: the badge-log line, KO lines, "every locked door … on someone else's trust", and a warning-signs recap gated on what was found (money, hours, an approach, a boss who stopped Security), with a fallback if none were found.
6. **Outstanding flags before the climax: done.** All three naming routes say "Stop him first", then finish the portal, when any flag is outstanding (`all_flags_in()` in each ink). HaX's `general_advice` has a "Torres is dealt with. The portal isn't." branch above the `torres_identified` return.
7. **Patricia's phone grants both authorities: done.** Same conditions as in person; the assignment is in the choice body and returns to the hub (which prints nothing before its choices). The office ask also waits for `torres_suspected` (whodunnit), in both places.
8. **Evidence shapes the confrontation: changed approach.** Instead of gating one scripted `You:` quote, the turn path is now a choice of arguments: the journal quote (needs `found_torres_journal`), the Architect's price (needs `flag4_submitted`), and Elena (always there). Each gets its own Torres reply. This removes a scripted player line and keeps every ending open.
9. **v2 sprites: done.** Player `male_hacker_hood_down_v2` (the m02/m03/m07/m08 standard); opening HaX `female_spy_v2` (same as the debrief); Patricia `female_security_guard_v2`; Halloran `female_scientist_v2`; Lisa `female_office_worker_v2`; Owen `male_nerd_v2` (not the hood-down sheet, which is now the player's); Torres `male_telecom_v2`. Each with talk, visemes and headshot, all checked on disk. No two characters share a sheet apart from the two HaX cutscene NPCs, which are the same person. Nightshade's and m01 Derek's sheets are not used. Patricia's phone avatar is now her headshot. Render at each NPC position is not yet browser-checked (playtest step 1).
10. **Whodunnit: done, per the user's decision.** See the next section.
11. **Confrontation continuity: done.** "What did they tell you it was for?"; the bills line now gives the dollar figure only with the medical bills (the vetting file gets its own line); "Nobody else knows he's down here" is cut.
12. **Urgency matches the print: done.** All three naming routes end on "You've got his print. Go." / the fingerprint hint / "You'll need his print first."
13. **Teaching lines: done.** Owen at the password handover: "you can't write a thumb on a sticky note. Course, you can't change one either, once it's out." RFID cloning guide offered on the hallway bark, with a hub choice and handover knot (`rfid_guide_offered` / `_hint_given`). "Biometric authentication" added to `mission.json` AAA keywords.
14. **Read reminders: withdrawn.** The premise is wrong: a notes item's `onRead` fires when it is picked up in the world (`interactions.js:1453-1468`) or given by an NPC (`npc-game-bridge.js:30-38`), so a picked-up note always counts as read.
15. **The player's hand on the drive: done.** `stop_upload` offers "Pull the drive myself." or "Cancel it, David. Your hand, not mine."; the follow-up moved to a new `upload_stopped` knot.
16. **Graph and config: done.** `puzzle_graph_role: vm` on the launcher (the flag chain now hangs off the server room), vault documents as graph items, a Torres action node, `waitForEvent: game_loaded` on the opening. Adding the wait made the validator ask for `show_scenario_brief: on_resume`, as every other mission has; added. The Building Directory lists the eight cleared staff (Halloran, Torres, four senior researchers, two junior engineers), and Patricia's "five others" became "six others" to match.
17. **Nightshade's introduction: done.** The narration treats him as the colleague who runs the technical side, with insider threat as his old speciality. The "catching a mole" line is unchanged (user decision); the erb:638 "NO hint of the m08 betrayal" comment is left for the orchestrator to update.
18. **`You:` lines: not done** (dialogue stage). Counts by file are in the tagdiff report below; the turn path lost one scripted line, Lisa's opener one, and a few were split into KO branches.
19. **m08 line: not done** (other mission). Written up for the log.

Also done: SAFETYNET deniability in the exposure ending. The player's line now says the story goes out "from a source nobody can trace", and HaX's debrief says what it still cost: "When this goes right, nobody hears about us at all. This week, three newspapers are asking who their source was." Then "Your consultant cover is burnt. Netherton wants you in his office at two."

### The whodunnit (fix 10, user decision)

- **No early pointers.** The corridor flyer names nobody. The TalentStack leaflet's initials are torn out; its "small neat capitals, blue ink" match the journal. "Get a keycard for Torres' office" moved into "Find Out Why", which now unlocks on `torres_suspected` (`unlockCondition.globalVariable`, plus an `unlockAim` mapping, the sis03 pattern; the server derives it on load, `game.rb:1174`). Flag 3's task title no longer names him. Patricia's and Owen's office asks wait for `torres_suspected`. Owen's "What's David Torres like?" became "Anyone on the crypto team keeping odd hours?"; Lisa's opener became "Who's the collection tin for?".
- **The briefing** says what to look for (a badge at an odd hour, money that doesn't add up, someone who's stopped acting like themselves) and not to take anyone's hunch for proof, Patricia's included.
- **Red herring: Dr Halloran.** A plausible motive and fair, misleading evidence: Owen's Server Hallway Badge Log shows her spare badge on the server hallway four nights; Lisa and Patricia mention her row with the CEO about publishing; her vetting file shows TalentStack approached her. Each clears on a proper reading: the log shows Torres' own badge on the main entrance six minutes before each entry and her primary never in after hours; she was in Zurich on the first night (lanyard in the lab, her vetting file, her own answer); she declared the approach. Asking her about the spare gives the alibi, the hook by the lab door, and "David, mostly".
- **Teaching:** access-log correlation (the log), behaviour (Owen, Lisa, Halloran), money (vetting file, bills), declared contact against undeclared debt (the two vetting files, which Patricia now hands over together: "One of them declared it. One didn't.").
- **Naming** ("Go on, then. Who?") offers only names the player has a reason for: Halloran once the log is read, Torres once the log is read or he is suspected. Torres with both halves of the case is named as before. With part of the case (motive, exfil, or the log's front-door pattern) he isn't, but `torres_suspected` is set and the office search is authorised. Nothing at all: "On what?". The same menu is on Patricia's phone and on HaX's line (when Patricia is down).
- **Wrong accusation** (Halloran, log only, alibi not yet seen): she is suspended (`halloran_accused`). Patricia's influence drops; Halloran's greeting changes and she won't hand over her spare badge, but still gives her alibi; HaX nudges after 15 s and `general_advice` points at the alibi and the front-door lines; Torres says he watched them cut her badge; the debrief and credits ("WRONG ACCUSATION — Dr Ruth Halloran suspended, then cleared") record it, and trust drops by 10. Torres can still be named, so the mission stays completable. A Halloran naming with the alibi known is refused at no cost. A correct read earns "BORROWED BADGE — Halloran's spare traced back to Torres" and a debrief line.
- **KO resilience:** an Owen KO drops the log (his `itemsHeld`), and HaX's relay sends a copy if it hasn't been read. A Patricia KO drops both vetting files.

### Checks (static; no browser test run)

- `bin/inklecate`: all ten inks compile; every `.json` is newer than its `.ink`.
- `ruby scripts/validate_scenario.rb`: no INVALID, no unknown fields, ink valid, geometry and doors OK. The co-fire warnings are the intended ones listed in §1 (the validator printed 3 at the end of this pass, down from 6, apparently after a validator change elsewhere in the tree). No new warnings of mine.
- `python3 scripts/check_door_alignment.py`: 9/9 OK.
- Rendered JSON (`tools/pass2/render.rb`): asserted the sprites (every sheet, talk, viseme and headshot file exists; no shared sheet), the opening wait, `show_scenario_brief`, the Recruiter pointer, the RFID guide wiring, the Recruiter credit matrix, the graph roles, the directory, and the whodunnit wiring: aims visible before suspicion never name Torres; the gated aim, its unlock mapping and the six suspicion latches; the nudge; the log's content and `onRead`; the relayed copy's distinct name; Halloran's file and lanyard; no item shares type and name. The log's dates match their weekdays (2026 calendar).
- `node scripts/ink_runtime_check/reopencheck.mjs … m05`: 0 problems (HaX 1800 reopens, Patricia's phone 1800, Recruiter 1800).
- inkcheck and loopcheck: 912 runs (24 states, including the KO combinations, the accusation states and five endings, across 19 entry knots), 0 failures.
- `tagdiff.mjs`: 430 structural differences, all intended: the added VARs, knots, tags, choices and conditions listed above. The removals are the old single-path naming knots, the old `stop_upload` tail (moved to `upload_stopped`), the old one-choice turn path, the ungated office and Lisa/Owen hub choices, and the old evidence conditions that are now split.

### Round 2 (after DESIGN_REREVIEW_1.md and tools/playtest/m05-pass4-report.md)

**Case pacing (M1).**
- Patricia now pulls the vetting files only after the badge log (`found_door_log or halloran_questioned`). Before that she says: "Vetting files are restricted. Bring me a name or a pattern and I'll pull the ones that matter."
- The aim-2 task is retitled "Find out who on the team is under pressure", so it no longer points at the files.
- Halloran's file is untidy on purpose. It reports her approach late ("eleven days later"), gives no travel dates, and has its own interview cancelled by the CEO's office. It sets only `found_halloran_vetting`. Her alibi now needs the lanyard's dates or her own answer, read against the log.
- Halloran's spare-badge answer no longer sets `torres_suspected`. No single early action sets it now. The remaining routes are:
  - Torres' vetting file (only after the log);
  - the medical bills or journal (in his office, already behind suspicion);
  - flag 3, the manifest or the schedule;
  - a reasoned partial naming.

**The player makes the deduction (M2).** On the log alone, naming Torres now asks why, in all three naming routes:
- "Look at the main-entrance times." is accepted. So is "Halloran says he's in her lab after hours…", offered once she has been asked.
- "He's been under strain…" and "He's the cryptography lead…" are refused ("So's half this building's family. That's not evidence.") at no cost.
- The player's scripted log explanation is gone. Patricia or HaX confirm the pattern after the player picks the right reason.
- The phone and HaX reason menus are choices-only knots that re-check their state at the top.

**Breadth ("closer to which of two").**
- The badge log adds Ben Ashworth (server hallway Thu 24 Sep, his test run logged with IT) and Amara Okafor (main entrance in and out, lab only). Owen's pencilled note explains each in a line.
- Ben is a third name on all three naming menus. Accusing him gets a refusal at no cost ("Ben logged that test run with Owen. It's pencilled on the sheet.").
- Patricia's suspect list now names all eight. Owen's odd-hours answer and Halloran's after-hours answer mention Ben and Amara.

**Re-review minors.**
- m1: Owen's card is now "IT Spare Office Card" and the relay copy "Spare Office Card (relayed copy)", both described as "the office beyond the open-plan". The relay's vault line is gated on `torres_suspected`.
- m2: Owen's handover line and HaX's vault advice say "the cryptography lead" until Torres is suspected.
- m3: HaX's naming restores Halloran's access if she was accused. Halloran's line branches on `patricia_ko` ("Security have given me my access back").
- m4: Owen now says "Halloran practically lives in that lab, but she's gone by seven". The player asks Halloran about the badge "at night", not "after midnight".
- m5: new debrief line, gated on Halloran's file: "Halloran had the same recruiter at her table in Zurich. She reported it, late. Torres never reported anything. That's the difference."
- m6: the "read the badge log properly" debrief line and the BORROWED BADGE credit need `door_log_reasoned`, which is set by the right log reason or by asking Halloran about her spare. With the log only held: "The badge log was in your kit all night. It would have saved you time."
- m7: the exposure ending's resting choice is "Go home, David. They'll come for you soon enough." (Torres: "Home. To tell Elena before the papers do."). The arrest ending keeps "Sit tight".
- m8: the confrontation opener is "I've seen what you've been staging. All of it."
- m9: the briefing line is split in two, HaX's KO advice is split in two, and the Architect choice is cut to 13 words.

**Playtest items.**
- The "badge cut in half" claim is cut (no visible object). Halloran now "sits at her bench with her coat on, as if she's been told to wait". Torres says he "watched Security walk her back to the lab".
- Server-room password: reading the IT notice by the door (`it_notice_read`, new `onRead`) now opens Owen's password ask and Patricia's server authorisation, as well as trying the door.
- "Open the research portal terminal" is now "Get into the research portal". It completes on flag 1. The VM launcher emits no event on real use (`vm-launcher-minigame.js` has none), so the first flag is the earliest real-use signal; the launcher still offers the guides.
- Torres is recast to `male_nerd_v2` (beard and glasses). Owen moves to `male_telecom_v2`, a hands-on network engineer who patches the core switch himself. The other free sheets were ruled out: `male_hacker_hood_v2` is m06's Satoshi, `male_office_worker_v2` is m01's Derek, `male_scientist_v2` is Nightshade, `male_spy_v2` is Netherton, and the hood-down sheet is the player. Within m05 only the two HaX cutscene NPCs share a sheet. Not yet browser-checked.
- Debrief praise: "best we've had on the Initiative" needs `case_strength() >= 8` and no wrong accusation (the strength count now includes the log). After a wrong accusation with a strong file: "The file's strong now. It went through an innocent woman on the way, and that's in it too."

**Round 2 checks (static).**
- Ink: all ten files compile and every `.json` is current.
- Validator: no INVALID; the same 3 intended co-fire warnings.
- Doors: 9/9.
- Rendered JSON: asserts pass (recast and sprite files, single shared sheet, no keycard named Torres, untidy Halloran file, log breadth, portal task on flag 1, IT-notice `onRead`, new globals, BORROWED BADGE gate, task title).
- reopencheck: 0 problems. m05's block in `missions.json` gained `found_halloran_vetting`, `door_log_reasoned` and `it_notice_read`.
- dialoguelint: no findings on any touched line.
- tagdiff: 529 differences against HEAD, all intended. The round-1 set plus:
  - the reason knots: `torres_why_log`, `log_reason_right` and their phone and HaX twins;
  - the Ben choices;
  - the split `after_choice` exposure choice;
  - the gated vault lines;
  - the flattened debrief praise conditional;
  - the extended `it_notice_read` conditions;
  - new VARs for the new globals.
- inkcheck/loopcheck: 1176 runs (28 states, including the KO combinations, the accusation and log-reason states and five endings, across 21 entry knots including both naming menus), 0 failures.

### Round 3 (after DESIGN_REREVIEW_2.md and tools/playtest/m05-pass4-confirm-report.md)

**Re-review 2.**
- **F1 (major): done.** The `found_vetting_file` latch now sets only `case_motive`. A handed-over note fires its `onRead` at once, so the file can no longer decide the case unread. `torres_suspected` stays on the bills, the journal, flag 3, the manifest and the schedule, and on a reasoned naming. HaX's leverage topic and moral sounding board also wait for `torres_suspected`. With the files in hand, naming Torres now goes through the reason menu.
- **F2: done, wider than proposed.** One reason menu now serves every Torres naming that lacks both halves, in all three routes (Patricia in person, her phone, HaX). The options, in this order:
  - "His own badge is on the server hallway those nights." (log decoy, wrong)
  - "He's been under strain…" (wrong)
  - "Halloran says…" (accepted; only after asking her)
  - "Check who comes in the front door just before the spare is used." (the log reason; the only one that sets `door_log_reasoned`)
  - "Money. He's hiding how much he owes." (motive, accepted)
  - "The staging is under his name." (exfil, accepted)
  - "He's the cryptography lead…" (wrong)
  A wrong reason ends the conversation; in person it also costs 1 influence. The naming menu itself is now bare names ("Dr Ruth Halloran." / "Ben Ashworth." / "David Torres."), so Torres is no longer the odd one out. Torres is offered on any evidence (log, suspicion, motive or exfil).
- **F3: done.** Ben's line is cut from Owen's pencilled note; only Amara is explained on the sheet. The three Ben refusals now send the player to the incident log: "Thursday at eight? The transfers run two till four, and he logged it with Owen."
- **F4: done.**
  - Halloran's answer no longer sets `door_log_reasoned`.
  - All three full namings offer "[And the badge log. Look at the main-entrance times.]" before the close.
  - The debrief has a middle line for asking Halloran without reading the log: "Halloran told you where her spare hangs. The log had already said who carried it."
  - Halloran's Torres question now needs `topic_team`.
- **F5: done.** The office-door bark is split on `torres_suspected`. Before suspicion: "Office keycard. IT holds a spare for every office. You'd need a reason Owen can write in his log."
- **F6: done.** The tasks are now "Get IT's spare card for his office" and "Get into his office".
- **F7: done.** HaX's leverage topic quotes the bills only with `found_medical_bills`. Otherwise it describes what the vetting file says. The old 32-word line is split in two.
- **F8: done.** The Patricia-KO branch of the log advice points at HaX and at her files on the floor.
- **F9: done.** The phone accusation of Halloran ends the call.
- **F10: done.** The top debrief praise also needs `found_pamphlet`.
- **F11, F12: done.** The stale comment is fixed, and HaX says "at night".
- **F13: not changed; needs the user.** m08's Cipher is `male_nerd_v2`. Every other existing male sheet clashes worse:
  - `male_telecom_v2`: Owen's in m05, and the "maintenance" look the playtest rejected;
  - `male_office_worker_v2`: m01's Derek (barred);
  - `male_scientist_v2`: Nightshade, in m05;
  - `male_spy_v2`: Netherton, in m05;
  - `male_hacker_hood_v2`: m06's Satoshi;
  - the bespoke sheets: named m02 characters (Bernie, Gary, Graham).

  Options: a bespoke Torres (PixelLab pipeline), or recasting Cipher in m08.

**Confirmation playtest.**
- **Volunteered pointers: spread or delayed.**
  - The flyer now says "one of our colleagues".
  - Patricia's suspect line spreads the motives: "Halloran's been fighting the CEO… Ben's asked twice about a pay review. Torres has been distracted. Angry, skint and distracted aren't evidence."
  - Owen's odd-hours answer names no one in the hallway ("someone from crypto… Didn't get a proper look"), gives Ben pressure ("always behind, and always skint"), and no longer mentions Torres' wife.
  - Halloran's team line covers Ben and David alike.
  - Halloran's "David, mostly" stays as the turn; it is only reachable after the log.
  - Owen's log hand-over line no longer contradicts "practically lives in that lab".
- **Reason menu:** see F2.
- **Toasts:** the "both halves" text now waits 8 s and reads "Patricia will act on that. Call her.", so it fits after a partial naming. HaX's Recruiter pointer waits 12 s. The vault and print texts stay at 1.5 s and the Recruiter's text at 2 s, so they no longer land together.
- **Grammar:** "Half this building has someone ill at home. That's not evidence."

**Round 3 checks (static).**
- Ink: compiles; every `.json` is current.
- Validator: no INVALID; the same three intended co-fire warnings (the split office bark doesn't add one).
- Doors: 9/9.
- Render asserts: pass.
  - The vetting latch sets only `case_motive`; five suspicion latches remain.
  - Ben is not explained on the sheet.
  - The office bark is split.
  - Task titles are neutral.
  - Text delays are 8 s and 12 s; the flyer is vaguer.
- Reason menu, driven through all three routes in inkjs: each wrong reason ends the conversation with `torres_suspected` false. Each right reason sets it. Only the log reason sets `door_log_reasoned`. Ben costs nothing. Halloran without an alibi is accused, and the conversation ends.
- reopencheck: 0 problems.
- dialoguelint: no findings on touched lines.
- tagdiff: 582 against HEAD, all intended. New this round: the shared reason knots (`torres_why`, `phone_torres_why`, `hax_torres_why`), `reason_wrong`, `significant_close` and `hax_named_close` (the closing choices moved there), `hax_partial_naming`, the gated HaX topics, the F7/F8 branches, and the Halloran and debrief changes.
- inkcheck/loopcheck: 1550 runs (31 states, including files-without-suspicion, Patricia KO with files, and the accusation and reason states, across 25 entry knots including all three reason menus), 0 failures.
