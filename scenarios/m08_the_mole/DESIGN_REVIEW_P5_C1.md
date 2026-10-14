# m08 The Mole: scenario design review, pass 5, cycle 1

Reviewer: fresh Opus agent, read-only (2026-10-14). Skill: `scenario-design-review`, run in full. Static review only: no browser session was started.

Kind of game: a SAFETYNET campaign mission and the season finale, a TV spy thriller turned inward. The VM flags are required and woven into the story. Deduction must not be handed over by a title, toast or NPC, and red herrings should cost something.

Sources: `scenario.json.erb` and the twelve `.ink` files at HEAD 81e81355 (the m08 folder was clean in the working tree before and after the checks), the engine files cited below, `IMPROVEMENT_LOOP_LOG.md` (Pass 5), `DECISIONS_PENDING.md`, and m07's `DESIGN_REVIEW_P5_C1.md` as the worked example. I didn't rely on the older design docs. I didn't open the SecGen XML or any of the four restricted field guides. Alignment and puzzle-chain decisions are taken as settled (Option B, the tip-off as the cost, free retries on HaX's reading, the psych evaluation reachable early, the 360-degree catch circle). Nothing below reopens them.

## Verdict

Every naming route reaches the ending, and condition syntax is clean throughout. A script over the rendered JSON checked all 233 conditions (eventMappings, music, credits, text and observation variants): only `&&`, single-level `data.<name>`, and every `globalVars.*`, `setGlobal`, `globalVarOnKO` and `skipIfGlobal` name is declared. All 15 routes pass. The credits have a true line for every route; the validator's six "no unconditional fallback" suggestions are false positives (reasons under 2i).

I checked m08 for the three classes m07 had:
- **No "Where do I stand?" ladder.** m08 has one, spread across HaX's hub. Each VM step, the server room, the suite and the four naming steps get their own topic, gated on whether the step is done.
- **Silent clock expiry.** m08 has no clock, so this class doesn't apply.
- **Flag-locked console prompt.** No m08 object is `lockType: flag`. The nearest relative is an empty interrogation suite with its own music cue (m3).

The weak spot is a variant of m07's ladder gap. Every route to the required naming goes through the Director's conversation, or through HaX once he is knocked out. A Director who has been punched but not knocked out won't talk again. Nothing in the mission treats that state as "Director unavailable", and his controls text even offers "keep away" as an option. A player who keeps away can't finish the mission.

**Counts: 0 blockers, 1 major, 12 minors.** Items for the user are listed at the end: a correction to engine item E7, and the VM claims carried under U1.

## Step 1: the tools

Outputs are in the session scratchpad, `m08-design-reviewer/`.

### Validator (full, `--no-graph`; `validator_full.txt`)

- Schema passed with no unknown fields. All ink files are valid. Room geometry has no overlaps and door alignment is OK. Exit 0.
- **2 objective-wiring warnings, both known and intended.** The first is the 16 `npc_hostile_state_changed` controls texts on HaX: two-part pairs per NPC, disjoint by `data.npcId` (erb 861-892). The second is the four `brief_taken` completions on `closing_debrief`, each completing a different task (erb 1113-1153).
- **2 person-chat warnings, both known.** The confrontation is not `onceOnly`, by design, so it reopens after a reload. The off-duty agent's catch has no `background` yet (stage 4).
- **Dialogue lint:** 8 blank-reentry CHECKs, unchanged since alignment. They belong to the dialogue stage. Timed texts: median 27 words, maximum 30.
- **Good practice:** event-driven cutscenes, `globalVarOnKO`, `timedConversation.skipIfGlobal`, phased music, tuned hostiles, graph metadata.
- **Suggestions:**
  - Two are relevant. The first: the junior analyst shares `female_office_worker_v2` with ATHENA, which belongs to stage 5 (characters, parked). The second: the safe's psych evaluation has no `puzzle_graph_unlocks`. It's a clue, not a key, so that's fine.
  - The PC container, patrol and `timedMessages` suggestions are generic and don't apply here.
  - The six credits-fallback suggestions are false positives (2i).

### Route driver (`scripts/ink_runtime_check/m08_routes/route.js`, r1 to r15)

All 15 report `[result] all expectations met` with exit 0 (`route_r*.txt`).

### Condition audit (`condcheck.js` over `rendered.json`)

233 conditions checked, no problems.

### Dungeon graph

I used `dungeon_graph.md` as committed, since `--no-graph` doesn't regenerate it. The structure matches the erb: the lobby as the hub, the RFID server room, the password archives, the PIN safe and suite, three key lockers, and the flag chain.

## Severity table

| # | Sev. | Finding | Evidence | Fix |
|---|---|---|---|---|
| D1 | **major** | **A Director who has been punched but not knocked out strands the required naming, and the texts tell the player to keep away.** A punch makes any NPC hostile for good in m08, and clicking a hostile NPC throws a jab instead of opening a chat. All the naming routes need either a conversation with him or `netherton_ko`: the reading, the three-misread fallback, HaX's reading and flag-4 mappings B and C. The confrontation needs `mole_identified`, so a hostile Director who stays on his feet blocks the ending. His second controls text says "Put him down for his card, or keep away: he's slower". A player who already has a badge reads "for his card" as irrelevant and keeps away. HaX's ladder then still says "Take it to him", her reading is hidden because `netherton_ko` is false, and flag 4 sends text D ("Who was behind that lab door?"). Punched before the brief, he also never sets `brief_taken`, so the interviews and the server-room task never tick. The same class shows up at a smaller scale: if Cipher and Nightshade are both hostile and neither is knocked out, nobody can confirm a row at step 4. The step-4 skip checks only `cipher_ko and nightshade_ko`. | erb 878 (text), 1243, 748-759 (flag-4 B/C/D on `netherton_ko`), 771-788; phone ink 139-161, 168; Netherton ink 132, 242-253; `interactions.js:662-683`; m04's `guard_hostile` pattern, `m04_critical_failure/scenario.json.erb:658-663` | The m04 pattern, mission-local, in two parts. **(a)** A HaX mapping on `npc_hostile_state_changed`, `data.npcId === 'director_netherton' && data.isHostile === true`, onceOnly, with `setGlobal: { netherton_hostile: true, brief_taken: true }` and `completeTask: brief_with_netherton` (declare the new global). The existing KO mapping already does the same for `brief_taken`. In the phone ink, read "Director unavailable" as `(netherton_ko or netherton_hostile)` in the ladder's first three rungs, in `[I can name the leak.]`, and in the K5 gate on "[The Director's taken the audit off me.]". The card branch of the server-room topic stays KO-only. Add a hostile branch there: "He won't let you near him now. The printer at reception, or put him down for his card." Flag-4 mappings C (two rows), the two `netherton_ko` texts and the audit-arrived text each need a `netherton_hostile === true && netherton_ko !== true` twin, because mapping conditions are `&&`-only. Add `&& netherton_hostile !== true` to B and D. The debrief's `named_by_hax` line needs a hostile variant, e.g. "You read the door audit to HaX because I would not let you near me." **(b)** Reword the Director's second text so it names the naming, not just the card: "He won't talk to you again tonight. Bring the door audit to me instead. Keep away, he's slower, or put him down for his card. Keep pressing Q…" (keep it to 30 words or fewer). For the step-4 edge, set `cipher_hostile` and `nightshade_hostile` the same way and let `audit_case`'s skip read `(cipher_ko or cipher_hostile) and (nightshade_ko or nightshade_hostile)`. New route: punch the Director after the brief, read the audit to HaX, flag 4, confront. |
| m1 | minor | **The planned sight challenge was never added** (regression finding 5, "Open: stage 2 (m04 pattern)"). m08 has no `challengeOnSight` on any NPC. The off-duty agent's sight circle only catches a lock being picked. | grep: no `challengeOnSight` in the erb; `IMPROVEMENT_LOOP_LOG.md` Pass 5 regression table, row 5; README 1120-1154 | Use Phantom, whose observation already says "He clocks you the second you enter, and smiles like he was expecting you" (erb 1516). Set `los: { range: 150, angle: 120, challengeOnSight: { cooldown: 20000, requireGlobal: "brief_taken", skipIfGlobal: ["phantom_interviewed", "phantom_ko", "netherton_hostile"] } }`. Map `player_spotted:agent_phantom` as a person-chat to `start`, onceOnly, `cooldown: 0`, so his own opening ("The Director's own bloodhound. Sit.") lands as he spots you. Don't give the challenge to Nightshade: one keyed to the tip-off would make him the only suspect who reacts, which turns it into an oracle and undoes J2. Add a route step for the sighting. |
| m2 | minor | **The archives' optional task ticks on entry, and the required clue is on the floor.** `read_the_archives` ("Cross-check the leak window against the Security Archives") completes on `archives_entered`. The door audit, which every naming route needs, is a notes item that "slid off the desk onto the floor" at (4.6, 3.4). A struggling player sees the archive task done, leaves, and only gets back on track through HaX's ladder. | erb 364-370, 574-585, 1034-1038, 1644-1661 | Complete it on `found_badge_audit` instead: swap `archives_entered` for `found_badge_audit` in the two mappings on `opening_briefing_cutscene`. Retitle it "Find the door audit for the leak window in the Security Archives". It stays optional. |
| m3 | minor | **The action track plays in an empty suite.** `room_entered:interrogation_room` switches to `spy-action` on `all_flags_submitted && !fate_decided`, with no `mole_identified`. A player with every flag but no name can open the suite with the safe's code card and walk in. Nightshade is hidden and the evidence wall reads "pending", but the music changes and never goes back to noir. | erb 162, 1799-1800 | Add `&& globalVars.mole_identified === true` to the music condition. |
| m4 | minor | **HaX's "[It's really Nightshade.]" goes stale.** It ends "Get the interrogation room open." That's wrong before the flags are in, when the room is empty (the topic above it says so), and again after a reload mid-confrontation, when the room is already open. Since the respawn in the lobby (E10), the player then has to walk back. | phone ink 173-181; erb 913-917 | Split the last line: `{ all_flags_submitted: Get in there. He's waiting at the table. | Finish the chain first. I'll be fine. I'll be fine after. }`. Keep "He carried me two miles once" unchanged. |
| m5 | minor | **A short brief leaves no pointer to the interviews.** The brief ends "Ask me what you need. Then go and prove something." "[I'm ready. Let me work.]" exits with "Bring me a name I can prove." The interviews and their rooms are only named under the rules topic and in the objectives panel. HaX doesn't text when the brief completes, and her hub has no rung for "before the brief" or "after the brief". | Netherton ink 68-87, 418-426; erb 686-692 | A HaX mapping on `conversation_closed:director_netherton`, condition `globalVars.brief_taken === true && globalVars.cipher_seen !== true && globalVars.phantom_seen !== true && globalVars.nightshade_seen !== true`, onceOnly, about 2 s: "Three names, three rooms. Cipher on the ops floor, Phantom north of it, Nightshade in the Crypto Lab. See all three before the server room." (25 words). |
| m6 | minor | **Knocking out the analyst or ATHENA is silent.** A knocked-out off-duty agent tips the mole off and goes on the record (credit, debrief). A knocked-out junior analyst on the ops floor does neither: she has no `globalVarOnKO`, no HaX text, no tip-off and no credit. ATHENA's KO isn't recorded either. Both have controls texts when they turn hostile, so the punch is expected. | erb 1402-1422, 598-621, 1006-1012, 229 | Add `globalVarOnKO: "analyst_ko"` (declared). Add a HaX `npc_ko:background_analyst` text that sets `nightshade_tipped_off` before the naming when not already tipped off, copying the off-duty mapping. Add a credit in ON THE RECORD, "A JUNIOR ANALYST: Knocked out at her desk. A witness to nothing.", and a matching line in the debrief's `the_hunt`. For ATHENA, one credit line, e.g. "ATHENA: Her reception avatar, knocked flat. She logged it." |
| m7 | minor | **A hostile off-duty agent still catches a pick.** The catch gate skips a knocked-out watcher, not a hostile one, so a player fighting him at the lockers can get "Don't worry. I didn't see anything." mid-fight. | `npc-manager.js:313`; erb 1938-1946 | Set `offduty_agent_hostile` from a mapping on his hostile event (as in D1), and add `&& !globalVars.offduty_agent_hostile` to the catch condition. One look at the next browser check. |
| m8 | minor | **The naming task's title names the wrong person on the HaX route.** "Name the leak to Director Netherton, on evidence" completes from HaX's reading when he is knocked out (and, after D1, when he is hostile). | erb 380-384; phone ink 215-223 | "Name the leak from the door audit, on evidence". It names no suspect, and every route reads the audit. |
| m9 | minor | **"Correlate The Leak Timeline" names work done in another aim.** Its tasks are flags 3 and 4. The correlation itself (door against minute) is the naming, which sits in Work The Three Suspects. | erb 424-451 | Retitle it "Follow The Account To Root". The description already says this. |
| m10 | minor | **The debrief's `the_hunt` has an unreachable branch that contradicts Option B.** Every naming route sets `named_on_evidence`, `named_by_hax` or `audit_closed`, and each of those has an earlier branch. So the `else` branch can't run. It says "You let the box make the case" and "The box made the case in the end". It's dead text, but the dialogue stage will read it and it misstates the design. | debrief ink 103-132; erb 741-759 (B is the only flag-4 naming, and it needs `audit_closed`) | Delete the `else` branch, or replace it with a comment saying it's unreachable under Option B. No spoken line changes. |
| m11 | minor | **Netherton's reply to an instinct of Phantom says "Bring me the logs."** Under Option B, the box's logs don't name a person, and the Director wants the door. | Netherton ink 147-151 | "…and neither, yet, have you. Bring me the door log." (voiced; list it for TTS). |
| m12 | minor | **HaX's hub lists late topics below early ones.** The skill wants the newest topics first. The suite, the naming ladder, the reading, "Why isn't he in the interrogation room yet?" and "It's really Nightshade" sit below the server-room and VM topics. The hub never shows more than about seven choices, so this is polish. | phone ink 74-187 | Reorder the hub: `[I can name the leak.]`, "It's really Nightshade", "Why isn't he…", "[What does the Director need from me?]", the suite, the door logs, then the VM steps and the server room, then the guides and the exit. Conditions stay as they are. |

## Design checks (2a to 2i)

### 2a. Solvability: OK, except D1

- **Lock chain.** Server room (RFID): the Director's MIFARE clone after the three interviews, the badge printer (PIN 0311 on the break-room post-it), or his dropped card after a KO. Archives (password `TrustNoOne`, same post-it). Safe (PIN 2407, the "requested by" line on the personnel printout plus its margin note). Suite (5386, on the card in the safe, or spoken by the Director after a correct reading). Lockers: the start-kit picks, or each owner's key after his audit beat. No circular dependency. Every gate has at least two sources.
- **Naming.** Four routes, each with a visible cost except the first:
  - the reading to the Director (`audit_right`);
  - three misreads after flag 4, where the Director reads it himself (`named_by_director`);
  - three misreads before flag 4, which costs a tip-off, then mapping B names him when flag 4 lands;
  - a knocked-out Director, where the player reads to HaX (`named_by_hax`).

  The confrontation waits on `all_flags_submitted && mole_identified`, and the debrief on the fate plus all four flags (erb 1162-1175). The only state that strands it is D1.
- **VM wiring.** All four `submit_flags` tasks have `targetFlags`/`targetCount`. The flags set `flag<n>_submitted` through `set_global` rewards (erb 1584-1589), and every narrative global hangs off those as explicit mappings. None relies on an `emit_event` bridge. `all_flags_submitted` latches on any of the four, whichever lands last (erb 1155-1161).
- **Soft-lock patterns** (`SOFTLOCK_PATTERNS.md`):
  - No burnt first-call gate: HaX's first call is a static text knot.
  - The interview and server-room tasks are brief-gated pairs, so they never fire early or go stale (erb 1107-1153, 1385-1397).
  - Netherton's step gates don't spend a misread when a precondition is missing (Netherton ink 229-253).
  - The tidy latch is not onceOnly and latches itself.
  - The debrief and its credits have a room-entry backstop for a reload mid-debrief (erb 586-595, 236-248).
- **Dialogue promising what the scenario can't deliver.** One case: D1's "keep away". Otherwise nothing found. Every prop named in the ink exists (the safe's card and evaluation, the lockers, the CyberChef station, the disposition screen).

### 2b. Clue distribution: OK

The clock appears in three places: the timeline (break room), the auth excerpt (server room) and flag 4. The door is in one place, the audit in the archives, and Phantom's notes and interview, HaX and the timeline all point there. The confirmation comes from two men (Cipher on the ops floor, Nightshade in the lab). The safe PIN is a small deduction (printout plus margin note), and ATHENA and HaX point at it without reading it out. The decoys are the three lockers, Cipher's token slip and project sheet, Phantom's stub and suspect sheet, and the off-duty agent's "had the build of Cipher". Each is explained by the audit or by its owner. The tactical board, the operations board, the catalogue and the past-leak index are story with payoffs in the confrontation and debrief. There are no navigation-only notes. The walk from the break room (post-it) to the archives (far side) is four doors. That's a fair backtrack, not a chore.

### 2c / 2c'. Educational coverage and field guides: OK

Lock types: rfid (a MIFARE darkside clone, a step up from m04-m07's EM4100), password, pin (two deductions), key and lockpick (three lockers, with a witness), fingerprint lifting (optional), CyberChef decoding (optional), and flag (the VM chain). The four flags are required (`concludeRequires`, erb 498-505) and framed: an unpatched repo browser, credentials in history, the account, and root for the logs. HaX reacts to each one (erb 694-769). The debrief has a VM beat on every path (debrief ink 140-143), and the credits have a THE BOX section. The guides are exposure-gated: the server room, the launcher, flag 1, flag 3, and the stick. They are given on request from `guides_menu`. Every `#give_item` id matches `itemsHeld` (erb 1048-1055; phone ink 233-256). I didn't check the published sheet titles (not needed this round). The scanning and privilege-escalation URLs are two of the restricted guides: refer to them by title only.

### 2d / 2d'. Narrative and ink conventions: OK

- The opening waits on `game_loaded`, is skipped on `briefing_played`, and sets it on start (erb 560-567). HaX's first text follows the opening's `conversation_closed`.
- The confrontation opens on entry with `disableClose`, completes `confront_nightshade` at the top, and writes the fate in the same step as the choice (`lock_in`).
- The debrief is hidden, opens on the confrontation closing or on any room entry once the fate and all four flags are in, sets `debrief_played` on its first line, and completes `take_the_debrief` on its last.
- Fights hand over to engine combat. The ink has no scripted fights.
- The narrator voice is defined (erb 132-140).
- Player choices are spoken lines. The one action choice, "[Step up beside him and let the cloner read his card.]", is non-verbal and allowed.

### 2d''. Patrol guards: N/A

There is no patrol. The off-duty agent's 360-degree, 160 px circle is a lockpick witness, not a guard the player sneaks past (settled in puzzle chains, C1 m6).

### 2e. Graph metadata: OK

The start-kit picks link to the three lockers. The cloner links to the clone action and on to the server room (graph links on the dossiers, erb 1282-1286). The audit, timeline and auth excerpt link to the reading action, which links to the suite. The printer badge, the dropped card and the code card carry `puzzle_graph_unlocks`. No backwards edges were seen in the committed graph.

### 2f. Rooms and backtracking: OK

There are no dead rooms. The break room, at the far west, holds the post-it, the timeline, the lockers, HaX in person and the witness, and the lab, the gateway to it, holds Nightshade and the CyberChef station. The longest required trip is the post-it to the archives and then back to the Director (lobby, north), about eight doors in all. The respawn in the start room on reload (E10) adds walking but loses nothing.

### 2g. Objectives scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk? | Bark or conversation at the transition? |
|---|---|---|---|---|
| Report In And Take The Brief | 1 | 1 (opening "north of this lobby"; HaX's first text) | None | The brief itself |
| Work The Three Suspects | 4 (+1 optional) | 4: rooms in the task titles; the naming through HaX's ladder and the flag-4/all-flags texts | Low. A short brief gets no pointer to the interviews (m5). The archive task ticks before the audit is found (m2). A hostile Director strands the naming (D1). | Access nudge after the three interviews; "Give him the person. Door audit." |
| Get Into The Internal Repository | 3 | 3 (server-room topic; VM topics; launcher text) | None | Recon text on entry; flag 1 and 2 texts |
| Correlate The Leak Timeline | 2 | 2 (flag-2 and flag-3 texts, VM topics) | None; the title is misleading (m9) | Flag 3 and 4 texts |
| Confront The Mole | 2 | 2 ("Whole chain's in…", the suite topic) | Low; "It's really Nightshade" is stale (m4) | Threat music on the naming; the scene opens on entry |
| Close The Investigation | 2 | 2 (the choice is in the scene; the debrief opens itself) | None | Debrief cutscene |

Task titles say what to do. The required `*` shows only in Work The Three Suspects, the one aim with an optional task (E1, engine, already logged).

### 2h. KO resilience: OK (the hostile-but-standing state is D1)

| Person NPC | Gates a required task or item? | Fallback | KO in the debrief and credits? | Verdict |
|---|---|---|---|---|
| Director Netherton | Brief; naming; one server-room route | `taskOnKO: brief_with_netherton`, the `brief_taken` mapping, a dropped card, HaX's reading | `netherton_ko`: debrief jaw line, credit, HaX-reading line | OK (hostile, not KO: D1) |
| Cipher | Interview (score only); one of two step-4 confirmations | interview completes on KO; Nightshade confirms; both down skips step 4 | `cipher_ko` credit; the KO text is neutral before the naming | OK |
| Phantom | Interview (score only) | interview completes on KO | `phantom_ko` credit | OK |
| Nightshade (lab) | Interview (score only); one confirmation; locker key | interview completes on KO; key drops; Cipher confirms | `nightshade_ko` credit; confrontation line | OK |
| Nightshade (confrontation) | Confront; fate | `taskOnKO`, the KO-before-fate mapping (handover) | `nightshade_ko_before_fate`: credit, debrief | OK |
| HaX (in person) | Nothing | N/A | `hax_ko` credit; text | OK |
| Off-duty agent | Nothing (witness) | N/A | `offduty_agent_ko`: credit, debrief, tip-off | OK |
| Junior analyst | Nothing | N/A | **none** (m6) | Minor |
| ATHENA (standing) | Hosts the tidy and go-bag latches | latches still fire with her down (setGlobal runs before the KO skip, `npc-manager.js:876-887`) | **none** (m6) | Minor |
| Opening ATHENA, debrief Netherton | Hidden | N/A | N/A | N/A |

The win condition is the debrief's last line, which follows the confrontation. With D1 fixed, no single NPC's state can block it.

### 2i. Recurring classes

- **Spoilers in names.** None that name the answer early. The locker and item names say "0x47" because the locker is labelled. The holdall, the brief and the evidence wall hold back the confession until the naming (alignment J4, K1).
- **Stale status answers.** These are the HaX topics, stage by stage:
  - server room: retires on entry;
  - VM steps: one per step;
  - suite: two versions, either side of the naming;
  - Director needs: a full ladder, including the KO rungs;
  - "It's really Nightshade": stale (m4);
  - in-person "Any advice for the room?": split on the naming.

  Netherton's `return_visit` is right at each stage.
- **Late first contact.** The first call is a static two-liner and true at any point.
- **Credits against every route.**
  - THE SUSPECTS: each innocent has three disjoint lines that cover every case.
  - THE FATE: arrested and not KO'd, KO before the fate, or triple agent. Tomb Gamma known or not known.
  - RECOVERED: the server room can't be entered without one of `netherton_card_cloned`, `badge_cloned` or `netherton_card_taken`. The database line is set by all six flag-4 mappings, so it always prints.
  - THE CASE: one line per naming route.

  So no heading prints over nothing. The validator's suggestions are false positives.
- **Interaction reach** (not checkable statically). At the next browser check:
  - HaX in person at (3.0, 7.6), within a tile of locker 0x23 at (3.9, 7.45). Check that a click on the locker doesn't open HaX.
  - The door audit on the archive floor at (4.6, 3.4).
  - Netherton at (6.8, 6.2) for the clone.
- **Deduction fairness.** Settled in alignment and puzzle chains (the tip-off as the cost, the three-misread warning, free retries on HaX's reading, the early psych evaluation as motive, not the act). Not reopened.
- **Hub order.** HaX's hub has late topics low (m12). Netherton's early topics are once-only and retire.
- **Look-alikes.** The analyst and ATHENA share a sheet (stage 5).
- **Notes from containers (E7).** Checked against the engine, and the engine item needs correcting (see Items for the user). Notes-family items taken from a container go to the notepad, not the inventory. The suite code card, the token pouch, the project sheet, the holdall, the boarding stub and the suspect sheet can all be re-read there, as the text stood when first read. The `text_file` items (the stick, the brief, the evaluation, the auth excerpt, the catalogue) stay in the inventory and resolve their variants on each read.
- **Timers, HUD, reload.** m08 has no timers and no HUD. After a reload:
  - the tidy latches and the catch are saved globals or `onceOnly` mappings;
  - Netherton's misread counter is a local ink VAR saved with his ink state;
  - HaX's reading asks its question again;
  - the confrontation reopens on entry;
  - the debrief has its backstop.

  The respawn in the lobby (E10, engine) is the only rough edge (m4).

## What a struggling player hits, in order

1. Takes the brief by "I'm ready. Let me work." and isn't told the three rooms (m5).
2. Walks into the archives, sees the archive task tick, and leaves without the audit on the floor (m2). HaX's ladder rescues them: "The archives keep the door audits."
3. Gets frustrated with the Director and punches him. The text says keep away, and the naming can't happen (D1).
4. Gets the suite code from the safe with all four flags in but no name, walks into an empty room, and the action track starts (m3).
5. Asks HaX "It's really Nightshade" before the flags are in and is told to open a room that's empty (m4).
6. Reloads mid-confrontation, wakes in the lobby, and gets the same stale line (m4, E10).

## Items for the user

**E7 correction (engine item, not new).** Logged as "notes taken from a container can't be re-read". The engine puts them in the notepad: `container-minigame.js:507-509` and `:884-888` ("they live in the notepad"), `notes-minigame.js:658-683` (`addNote`), `inventory.js:521-527`. They are re-readable there, frozen at the text first read, so variants don't update them. That is what m08 already designs around: HaX's holdall text covers a player who read it before the naming. Recommendation: at the next browser check, open the notepad and look for the holdall and the suite code card. If both are there, reword E7 in `DECISIONS_PENDING.md` to "variants don't reach a note already in the notepad" and drop the engine change.

**U1 (needs checking against SecGen by the user; nothing new opened).** These are the in-game claims about the VM, unchanged since U1, addendum and addendum 2:
- the THE BOX credits: an unpatched repository browser open without a password; credentials in history; logged in as the owner with the mail to the Architect; root through a sudo rule; the logs putting the plan on a Crypto Lab terminal for 47 minutes (erb 217-221);
- the flag texts (erb 694-759);
- HaX's step hints (phone ink 104-120);
- the debrief's VM beat (debrief ink 141-142);
- the evidence wall's `nightshade_ops` (erb 1838-1839);
- the CVE and the four flag descriptions (`mission.json`, erb 1585-1588);
- the Kali IP 192.168.100.50 (erb 1565);
- which SecGen scenario is built, and the flag order (erb header 17-26).

Unchanged and not re-raised: U2, U3, U4, E1 to E6, E8, E9, E10, and m7 (the reader opening the cloner, engine backlog).
