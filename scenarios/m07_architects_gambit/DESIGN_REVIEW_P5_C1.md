# m07 The Architect's Gambit: scenario design review, pass 5, cycle 1

Reviewer: fresh Opus agent, read-only (2026-10-14). Skill: `scenario-design-review`, run in full. Static review: no browser session was started.

Kind of game: a SAFETYNET campaign mission and the season's climax, judged as a TV spy thriller whose VM flags are required and woven into the story. Teaching comes through the VM work and the field guides.

Sources: `scenario.json.erb` and the eight `.ink` files at HEAD 1140511f (puzzle chains closed; the m07 folder was clean in the working tree), the engine files cited below, `IMPROVEMENT_LOOP_LOG.md` (Pass 5), `DECISIONS_PENDING.md`, and m04's Pass-5 scenario-design rounds as the model. The older design docs were not relied on. The SecGen XML and the four restricted field guides were not opened. Alignment and puzzle-chain decisions are taken as settled. Nothing below reopens them.

## Verdict

The mission is solvable on every branch I traced, and it survives a KO of any NPC. Condition syntax is clean throughout. All 97 eventMapping conditions and every timer, music and credit condition use only `&&`, single-level `data.<name>` and declared globals (checked by script against `safeEvaluateCondition`, `npc-manager.js:15-105`, and the timer evaluator, `scenario-timer-dispatcher.js:284-350`). The credits cover every route. Every section has a line whatever the player did, so the three "no unconditional fallback" suggestions are false positives.

The weak spot is the struggling player. m07 is the only mission from m01 to m06 whose handler has no progress-aware "where do I stand?" answer. The clock running out, the moment a struggling player is most likely to reach, gets no word from HaX, and HaX's clock answer is false from then on. The win console also puts up a flag prompt that can never accept a flag, so a player who carries a correct root flag there is told it is wrong.

**Counts: 0 blockers, 3 majors, 15 minors.** Items for the user are listed at the end: one engine item, one refused check, and the SecGen claims carried from U3.

## Step 1: the tools

### Validator (full, `--no-graph`; output in the scratchpad, `m07-design-reviewer/validator_full.txt`)

The schema passed with no unknown fields, all ink files are valid, room geometry has no overlaps and door alignment is OK. The working tree was unchanged after the run.

- **12 objective-wiring warnings**: multiple onceOnly handlers on one pattern, all on `agent_0x99`. They are known and deliberate: independent latches and texts that are disjoint by condition, as logged in alignment r1/r2 and puzzle chains r1. I re-checked `team_assigned` (five independent latches, erb 795-941), `flag2_submitted` (disjoint on `scada_password_found`, erb 880-900) and `debrief_timer_fired` (the first to fire sets `debrief_requested`, which closes the rest, erb 1167-1184).
- **4 person-chat warnings** (no background, not onceOnly): Hollis's sight challenge and Park's entry chat. Both are deliberate repeats, as in m04.
- **Dialogue lint**: blank-reentry 6, you-after-choice 2, transition 1, not-x-but-y 1. All are pre-existing and belong to the dialogue stage.
- **Good practice**: event-driven cutscenes, `globalVarOnKO`, `timedConversation.skipIfGlobal`, phased music, tuned hostiles, graph metadata.
- **Suggestions**: timedMessages on the phone NPCs is generic (both phones carry mapping-driven texts). The three credits fallbacks are false positives, as above.

### Route driver (`scripts/ink_runtime_check/m07_routes/route.js`, r1 to r20)

All 20 report `[result] all expectations met` with exit code 0 (output in `m07-design-reviewer/route_*.txt`). The compiled ink JSON (02:10) is newer than every `.ink` file.

### Dungeon graph

`dungeon_graph.md` (02:07, after the last erb edit at 02:04) has 42 puzzle nodes and 48 edges, plus 6 story nodes and 5 edges. Critical path: Commit The Team And Get Inside → Get Into The Control Room → Take The Attack Host Off The Board → Stop The Sequence And Report. One gap: m10.

## Severity table

| # | Sev. | Finding | Evidence | Fix |
|---|---|---|---|---|
| D1 | **major** | **HaX has no progress-aware "Where do I stand?".** Every other campaign handler has one: m01 "What should I focus on next?", m02 and m06 "Remind me where we are.", m03, m04 and m05 "Where do I stand?" (`m04_phone_agent0x99.ink:191`, `report_progress` at :888). m07's only always-on topic is "Remind me of the layout and the clock.", which goes to the static first-call layout and the clock answer. Its per-stage hints only appear once a step has started: the VM hints need `vm_terminal_used`, and the vault hint needs `generator_hall_reached`. A struggling player who doesn't know what comes next gets no answer at several points: in the server hall with the Kali box untouched; after flags 1 and 2 (door first, then login, then the redirect warning); after the abort when the "Bring me in" text was missed. | phone ink 123-144, 297-298, 271-279, 268 | Add a sticky `[Where do I stand?]` before the exit, diverting to a text-only `report_progress` knot that names the **first** unmet step, in order: commit (if `not team_assigned`); the badge (name the routes: Hollis, the badge station, the cloner); the Kali box in the server hall; flag 1; flag 2; the control room door (Elena or the capture); flag 3, with the door-first line and, while the window is open with the correction held, the redirect line; root (flag 4) at the relay; the console abort; missing flags at the relay; "Bring me in". End with one line on the optional plant if `not vault_entered`. Check each step's completion, not how it was done (the m04 pattern). Keep "layout and the clock" or fold it in. Add a route that walks the knot at each stage. No audio exists yet. |
| D2 | **major** | **The clock runs out in silence, and HaX's clock answer is false from then on.** When `countdown_expired` lands, only the Architect barks ("Seattle first. As scheduled."). HaX has no mapping on it. Her "What's the clock?" checks `cascade_armed` and still says "It's running. Fifteen minutes from your login on their host." after step one has run. The countdown display has no expired variant, so it still reads "ARMED / EXECUTION PENDING". The struggling player is the one who reaches this, and is the one left without a next instruction ("steps two to four can still be stopped: get root"). | erb 1451-1457 (only mapping), 1871-1883; phone ink 130-140 | (a) HaX mapping on `global_variable_changed:countdown_expired`, `value === true && !globalVars.grid_saved`, onceOnly, about 4 s after the bark: "Seattle's dark. Step one ran. Steps two to four haven't. Get root, put it through the relay, then the abort at the console." (23 words). (b) In the clock answer, branch on `countdown_expired` before `cascade_armed` ("Step one ran. The rest waits on the abort. Root first, then the console."). (c) Add a display variant `globalVars.countdown_expired` between `grid_saved` and `cascade_armed`: "STEP 01 SEATTLE METRO -- EXECUTED / STEPS 02-04 -- PENDING". Extend r2 (it already runs the clock out). |
| D3 | **major** | **The win console asks for a flag it can never accept.** `crisis_control_system` is `lockType: flag` with no `requires`, by design (one submission point per flag). Clicking it before flag 4 opens the flag-station lock screen, "ENCRYPTED — SUBMIT DECRYPTION KEY / Enter the correct flag to unlock this item." With no `requires`, the server check always fails, so any flag, the right root flag included, gets "✗ Incorrect decryption key". HaX's clock answer, `vm_hint_4` and the aim all point the player at this console, so a struggling player who has root is the one most likely to type the flag here and decide it is wrong. The console's description says "report it at the relay", but the player only sees that by examining it, not on the prompt. m02's `entropy_staging_cache` has the same shape. | erb 1841-1870, 541-551; `interactions.js:1290-1304`; `game.rb:1090-1095`; flag-station lock UI 422-427 and its error text | Mission-local: a HaX mapping on `object_interacted` with `data.objectName === 'Cascade Control System' && !globalVars.flag4_submitted`, onceOnly. The event fires before the flag branch (`interactions.js:622-628`). Text: "That console takes nothing typed into it. The root flag goes through the relay in the server hall, and the console opens itself after." (25 words). Retitle the four flag tasks "… and submit the flag at the relay", or at least flag 4's. Engine item for the user (E1 below). |
| m1 | minor | **Five toasts land together on the first ops-floor entry (regression m-2, never closed).** Completing `commit_the_team` unlocks three aims at once, including "Get Into The Control Room", two rooms before the player can see that door. On top of those come HaX's hurt line (1 s), the Architect's "Agent 0x00." (5 s) and the RFID guide text (9.5 s). | erb 391, 446, 500, 810-815, 1386-1390, 1110-1116 | Gate `reach_the_control_room` and `trace_the_intrusion` on a new synced latch, `"unlockCondition": { "globalVariable": "server_hall_reached" }` (`objectives-manager.js:695-699`), set by a HaX mapping on `room_entered:server_room`. Neither aim has a task that can complete before the server hall, and a story-gated aim records an early task and shows it on unlock (`revealAimForTask`). The ops floor then announces one aim, and the server hall announces the two branches where their doors are. Update the objectives comment (erb 330-335, 435-439). |
| m2 | minor | **A player who closes the briefing uncommitted gets no pointer to the commit.** The ops-floor text for `!hurt_line_said` doesn't mention the team. The task title "Commit the tactical team to one of the three operations" names no place to do it. The aim says "Read all three briefs", but the briefing doesn't replay. | erb 810-815, 362-367, 353 | Split the ops-floor row on `team_assigned`. The uncommitted text: "You're inside, and the team's still over Denver waiting on your call. Phone me when you've decided. Let it hurt afterwards, not during." (24 words). Aim description: "…The desk summary in your kit has all three." |
| m3 | minor | **The briefing's story clock contradicts the 40-minute window.** The commit happens in the car at 02:41. The transit beat then prints "Forty minutes of rain… 03:24 by the dashboard clock", so on the story clock the window (40 min from the commit) has shut as the player reaches the gate. Netherton also says the Fracture team lands "in eleven minutes". The redirect window, the HUD timer and T-10 all count 40 minutes from that commit. | briefing ink 88, 265, 296; erb 653-672 | Move the transit narration (ink 296-298) to the top of `delegation_intro`, so the car reaches the industrial park while Netherton is still on the line and the commit is made at the gate. Line 88 ("before you are through the gate") then becomes literal. The `handoff` keeps its building lines. No audio exists yet. |
| m4 | minor | **T-20 can play before first contact.** T-20 starts at the commit (10 min); first contact is on the first ops-floor entry. `start` routes T-20 first, and T-20 opens "Same voice, same absence of hurry". T-30's "Don't look for the trace… I've read your file" then plays afterwards, out of order. This happens to a player held in the checkpoint for 10 minutes: a hostile Hollis plus the U11 respawn loop, or a long talk with Hollis. | erb 631-640, 1386-1395; architect ink 51-71, 129 | In `taunt_t20`, when `not heard_t30`, open with T-30's narrator line ("Your handset lights without ringing…") instead of "Same voice", and set `heard_t30`. T-30's content is then skipped, which is better than playing it late. |
| m5 | minor | **Stale engine comments in the erb.** (a) The timers block says "the dispatcher restarts started timers on reload". It resumes them now (`scenario-timer-dispatcher.js:9`, `:29-31`, D14), so the 15-minute clock survives a reload. The `condition` guards are still worth keeping. (b) The WP1 header still lists objectives, flagRewards, KO wiring, voices and music as "DELIBERATELY ABSENT". | erb 618-623, 12-22 | Correct both comments. No logic change. |
| m6 | minor | **A reload after the abort swaps the end track for noir.** The `game_loaded` entries play noir on `team_assigned` (or `inside_reached`) with no `grid_saved` check. A reload puts the player in the start room (m-14), and they walk back to the plant under the wrong track. | erb 105-131 | Add `&& !globalVars.grid_saved` to the three `game_loaded` entries, and add `{ "trigger": "game_loaded", "condition": "globalVars.grid_saved === true", "playlist": "end", "fade": false }`. |
| m7 | minor | **The console's description still says it won't take an abort after it has opened (regression m-4, still open).** | erb 1851 | Make it true both before and after: "The master control position for 147 substations. The abort goes in here, once the host driving the sequence is off the network and reported at the relay." |
| m8 | minor | **Mercer offers "Elena Rodriguez thinks this is a six-hour demonstration" to a player who never met her.** Only Elena says it (or HaX, after an Elena outcome). This is the "page forty" class, fixed for Elena in alignment r1. | mercer ink 135; elena ink 132-138 | Declare `VAR elena_met = false` in Mercer's ink and gate on `elena_met and not heard_elena`. |
| m9 | minor | **The mole intercept says "Window: thirty minutes".** The mission's decision window is forty everywhere else (the drive, the redirect timer, the HUD, T-10). | erb 2059; 653-672 | "Window: forty minutes." (not voiced). |
| m10 | minor | **Graph gap: the cloner route (F3) isn't drawn.** The RFID Cloner has no `puzzle_graph_unlocks`, so the graph shows it as a loose item off the checkpoint. | erb 282-288; `dungeon_graph.md:121` | `"puzzle_graph_unlocks": ["server_room"], "puzzle_graph_optional": true`. |
| m11 | minor | **The RFID cloning guide hand-over doesn't mention cloning.** It names Hollis's badge and the badge station only, though the clone route is live and this is the cloning guide. | phone ink 679-681 | "Hollis's badge works, and so does a copy: stand close while he talks and the cloner reads it. Or the badge station behind his desk." |
| m12 | minor | **A never-committed player can commit the team after the abort.** "Where the team goes" is gated only on `not team_assigned`, and the debrief and credits then report a covered operation for a call made after the night was over. Rare, because the briefing pushes the commit hard. | phone ink 211; erb 190-194 | Gate it `{not team_assigned and not grid_saved}`. A commit after the login stays allowed (HaX's uncommitted flag-3 text invites it). |
| m13 | minor | **"The console up there"** in HaX's clock answer, on a single-level map (the regression m-5 class, fixed for Elena only). | phone ink 138 | "The console in there is the only place the abort goes in." |
| m14 | minor | **A credit genders the player and has an unclear "his".** "AGENT 0x00: Wants the numbers before he writes them — no more briefing off his figures". | erb 248 | "AGENT 0x00: Wants the numbers before writing them — no more briefing off the Architect's figures". |
| m15 | minor | **Six field-guide choices sit separately on the hub.** At the VM stage up to four can show at once beside the hints and topics. m04 folds them into one "Send me a field guide." choice with a sub-menu. The crowded-hub lint didn't fire, so this is polish only. | phone ink 282-293; `m04_phone_agent0x99.ink:185-188` | Fold them into one `[Send me a field guide.]` → choices-only `field_guides` knot (each guide's give stays in its text half). |

## Design checks (§2a to §2i)

### 2a. Solvability: OK

- **Lock chain:** checkpoint (open) → ops floor → server hall. The RFID reader accepts Hollis's badge (talk or KO drop), the printed badge (PIN 0616 on the ops-floor handover sheet) or the clone. Plant: the ops-floor key or the start-kit picks. Vault: the rule (flag-1 decode, a talked-round Hollis or a turned Elena) plus the ATS-1 plate digits. Control room: Elena or the flag-2 capture. Console: flag 4's `unlock_object`. No circular dependency, and every gate has two sources.
- **After a reload between flag 4 and the console:** the server marks the console unlocked (`game.rb:862-871`). The container path still validates with the server and calls `unlockTarget`, which emits `item_unlocked` (`interactions.js:1306-1317`, `unlock-system.js:672-699`), so `shut_down_the_cascade` still completes. OK.
- **VM wiring:** all four `submit_flags` tasks carry `targetFlags`/`targetCount`. `flag2_submitted` and `flag4_submitted` are set from `objective_task_completed` mappings (erb 874-877, 971-977), `flag1_submitted` likewise (erb 816-821), and flag 3 by its `set_global` reward. None relies on an `emit_event` bridge.
- **Soft-lock patterns** (`SOFTLOCK_PATTERNS.md`): no burnt first-call gate (the first-call text is preloaded, and the commit lives on the hub). The `hollis_resolved === ''` evade latch isn't spent by a failed condition. The debrief backstops cover a reload mid-debrief, the missing-flags nag and the fallback timer.
- **Dialogue promising what the scenario can't deliver:** m8 only.

### 2b. Clue distribution: OK

The badge PIN (ops floor) opens a lock in the checkpoint, a deliberate backtrack. The vault rule is in three places, and the digits are on the plate in the same hall. The two red herrings (the void code in the log, the rack note pointing at the log) are deliberate. The visitor log and handover give Hollis's leverage, and the projection (control room) feeds Park and Mercer. Lore drops are both in the vault. No navigation-only notes. The evacuation board, situation board, wall map and workstation are atmosphere, and each carries story facts the briefing and debrief use.

### 2c / 2c′. Educational coverage and field guides: OK, with E2 and S1 below

Lock types: rfid (reader, cloner), key and lockpick, pin (an observation rule), password (a leaked credential), flag (the VM chain). The four flags are required (`concludeRequires`) and framed: decode, capture, the login that arms the clock, root. HaX reacts to each, and the debrief names the three open doors. The guides are exposure-gated (ops floor, server hall, the Kali box, flags 2 and 3) and given on request from the hub. Every `#give_item` id matches `itemsHeld`. The six sheet files exist by filename. Their published titles could not be checked (E2).

### 2d / 2d′. Narrative and ink conventions: OK

The briefing waits on `game_loaded`, is skipped on `briefing_played`, and sets it on start. The debrief is hidden, opens once all four flags are in and the debrief has been requested, latches on `debrief_played`, and completes `take_the_debrief` on its last line with room-entry backstops. Fights hand over through `#hostile` to engine combat. The narrator voice is defined. A reload mid-debrief ends with no credits roll. That is the m03/m04 pattern, accepted there (m04 m17), so it is not raised again.

### 2d″. Patrol guard: OK

Hollis has a sequential four-point patrol on the clear strip (tiles x 3.5-6.5, y 6.0-6.6, in a 10×10 room), a 130° / 150 px drawn cone, and a sight challenge with a 20 s cooldown, gated on `briefing_played` and skipped once he is dealt with. Sight checks pause while a chat or the tutorial is open (`npc-sight-challenge.js:103-106`).

### 2e. Graph metadata: one gap (m10)

### 2f. Rooms and backtracking: OK

There are no dead rooms. The longest required walk is the Park last-chance carry (control room → server hall → generator hall → vault), which is optional. The start-room respawn on reload (m-14) is an engine item already logged.

### 2g. Objectives scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk? | Bark or conversation at the transition? |
|---|---|---|---|---|
| Commit The Team And Get Inside | 2 | 2 (briefing commit or HaX hub; the ops-floor door) | Low; the uncommitted skipper gets none (m2) | HaX hurt line, Architect bark, RFID text (stacked, m1) |
| Get Onto The Control Network | 3 | 3 (RFID text; guides at the Kali box; flag-1 nudge) | Low; the untouched Kali box has no pointer (D1) | Flag-2 text offers SSH and names the door password |
| Trace How They Got In (side) | 2 | 2 (lockpicking text in the server hall; vault hint) | None (gates nothing) | Vault lesson text |
| Get Into The Control Room | 2 | 2 (Elena or the flag-2 capture; Mercer at the console) | Low | Spy-action track; Mercer speaks when clicked |
| Take The Attack Host Off The Board | 2 | 2 (`vm_hint_3`; the flag-3 text names root) | **Clock expiry: no instruction (D2)** | Flag-3 and flag-4 texts |
| Stop The Sequence And Report | 2 | 2 (flag-4 text sends to the console; "Bring me in", fallback) | Console prompt contradicts (D3) | Architect sign-off, HaX "Grid's held…" |

Task titles are action-led, and the required `*` shows correctly in every aim that has an optional task (`objectives-panel.js:95-101`). Inside "Trace How They Got In" the two `*` tasks are required only within that side aim (U5, closed, not reopened).

### 2h. KO resilience: OK

| Person NPC | Gates a required task or item? | Fallback | KO in the debrief and credits? | Verdict |
|---|---|---|---|---|
| Ray Hollis | One badge route (three others) | badge drops (itemsHeld, start room); `taskOnKO` optional | `hollis_ko` → "Neutralised on shift" | OK |
| Elena Rodriguez | Password and rule (both redundant) | flag-2 capture; decode; HaX KO text | `elena_ko` → "Neutralised — never questioned" | OK |
| Dr. James Mercer | `confront_mercer` (aim ordering only) | `taskOnKO: confront_mercer` | `mercer_ko` → "Neutralised at the console" | OK |
| Thomas Park | Nothing required | `taskOnKO: neutralise_park` | `park_ko` → "Neutralised in the vault" | OK |
| Netherton ×2 (hidden) | N/A | N/A | N/A | N/A |

The win condition is a terminal gated on flag 4 that no NPC can block.

### 2i. Recurring classes

- **Spoilers in names:** none that name an answer early. Task titles name Hollis and Elena, but each is the only person in the room, so nothing is being deduced.
- **Stale status answers:** the clock answer (D2) and "up there" (m13). The layout answer is static and stays true.
- **Late first contact:** the first-call text is preloaded at start, so it reads as an old message.
- **Credits against every route:** checked section by section. Each has a line on every route, and the KO and hostile twins are disjoint.
- **Interaction reach:** not checkable statically. The browser check should try walking up to Park at (4.5, 4.5) in the vault and Elena at (3, 7.5) at the rack.
- **Deduction fairness:** settled in alignment r1/r2 (field-only second menu, no cost for a wrong pick). Not reopened.
- **Hub order:** "Bring me in" first, the commit and the redirect next, the guides last. Fine, apart from the crowding (m15).

## What a struggling player hits, in order

1. Closes the briefing early and is never told where to commit (m2).
2. Five toasts at once on the ops floor, one of them for a room two doors away (m1).
3. In the server hall, unsure what to do with the Kali box, with no "what next" on the phone (D1).
4. Fights a hostile Hollis, is KO'd, respawns beside him (U11, engine), and if held there for 10 minutes gets T-20 before T-30 (m4).
5. Carries the root flag to the console, types it in, and is told it's incorrect (D3).
6. Runs out the clock and hears only the Architect, while HaX's clock answer still says fifteen minutes (D2).
7. Reloads after the abort and walks back to the plant under the wrong track (m6).

## Items for the user

**E1 (engine, new).** The flag-station lock screen (`interactions.js:1290-1304`) opens for any `lockType: "flag"` object, including one with no `requires` that only a remote `unlock_object` can open. It then asks for a "decryption key" that can never validate (`game.rb:1092-1093`). Recommendation: when the object has no `requires`, show a plain message ("This unlocks when the matching flag is submitted at the relay.") instead of the input. This affects m07's console and m02's `entropy_staging_cache`. D3's HaX text is the mission-side stopgap.

**E2 (check refused).** I tried to read the `title:` lines of the five unrestricted m07 field-guide sheets, to check each item name against its published title (as m04 m16 did). The permission check refused it, and I did not retry. Please compare the six item names (erb 1217-1260) with the published sheet titles. U4 (whether the NFS guide URL is live) is unchanged.

**S1 (needs checking against SecGen by the user; carried from U3, nothing new opened).** The in-game claims about the VM:
- the task titles (an NFS export holding a flag; a listener that sends a flag; a flag in the operator's home directory; root by escalation);
- the decode's "export holds a pointer and the operator account's name";
- the capture's "listener pushes the operator password and a flag";
- `vm_hint_2` "scan every port";
- `vm_hint_4` "start with what this account may run";
- the debrief's three-doors line (`the_win`, debrief ink 106-110) and the ATTACK HOST credit (erb 184);
- the Kali IP 192.168.100.50 (erb 1689) and the one-host wording;
- whether flag 4 can be reached before flag 3. If it can, `cascade_armed` never sets, the CLOCK credits are silent and the order latch can mislead.

Unchanged and not re-raised: U2, U6, U7, U8, U9, U10, U11, the engine half of U5, and m-14 (respawn in the start room).
