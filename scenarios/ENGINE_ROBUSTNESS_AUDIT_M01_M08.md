# Engine robustness audit: m01 to m08

October 2026. An ink-only pass over the shipped missions m01 to m08, applying what the finale reviews (m09, m10) taught about closing and reopening conversations. No engine, scenario.json.erb or spoken-line changes.

## The engine behaviour being tested

- A person-chat reopened in the same session resumes at the knot that owns the saved choices (the first choice's source path), with the ink call stack reset.
- A tunnel knot (`-> knot ->`) that offers choices and ends `->->` therefore throws on the next pick after an Esc and reopen.
- Esc closes a person-chat unless the opening mapping sets `disableClose`.
- A page reload restores ink variables (and hostility), not story position: the conversation restarts at the NPC's knot.
- A guard that lives only in an entry knot is skipped by a reopen, so a menu can keep offering a deal after the world has moved on.
- A "met" flag set before an opening plays makes an Esc plus reload skip that opening for good. In m05 and m06, where the opening's choices sit in `start` itself, an Esc and an in-session reopen skip it too, because the reopen re-runs `start`.
- Phone chats re-run the owner knot only when a synced global changed since the last save.
- A KO'd NPC cannot be talked to (interactions.js, and event conversations for a KO'd NPC are suppressed). A hostile NPC is punched, not talked to. Hostility lasts until a KO; a player KO resets hostiles and reloads the page.

## Method

All simulators run the compiled JSON with the vendored inkjs. They live in the scratchpad folder `m01_m08_robust/`. Each NPC entry comes from the rendered scenario: its talk knot, its timed conversation, and every event mapping with a knot, each marked `disableClose` or not.

| Check | Script | What it does |
|---|---|---|
| Tunnel crash | `tunnel_sweep.cjs` | Depth-first over every entry with 9 global presets. At any choice point reached with a tunnel frame on the stack, reopen the way the engine does and pick three levels deep. |
| Skipped guard | `guard3.cjs` | At each choice point, set one global that something else writes in session (another ink, a setGlobal or setVariable mapping, a timer, another NPC's KO) the way it can move, then reopen. Reports a reopened choice that changes world state and that a fresh entry offered before the change but not after. |
| Met before opening | `reload3.cjs`, `reload4.cjs`, `reload2.cjs` | Close after each opening line and at the first choices, reload (variables kept, restart at entry), and list world tags, choices and lines that can no longer be reached within four picks. |
| Proofs | `proof_bed4.cjs`, `proof_met.cjs`, `proof_derek.cjs`, `proof_netherton.cjs`, `afterpick.cjs` | Before (HEAD JSON) and after, for every fix. |

The sweeps raised a lot of noise. Each finding was triaged by asking whether the changed global can move while that NPC's chat is parked and the NPC can still be talked to.

## Fixes

Seventeen fixes in seventeen ink files. Each is an assignment moved, or a guard added at the top of a menu knot. No dialogue line, choice text or speaker changed (checked with a diff filter and `voicelines.mjs`; see the voiced-lines note below).

### Skipped guards

| # | Mission, NPC, knot | Severity | Problem | Fix | Proof (before, then after) |
|---|---|---|---|---|---|
| G1 | m02 Mr Pryce (`m02_npc_patient_bed4`), `emergency` | Major | Esc at the ventilator alarm. Mr Pryce dies on the timer, or Nurse Raval bags him. The reopen replays the alarm and still offers "Bag him myself", which sets `bed4_manually_stabilised` and `patient_bed4_state = attended` on a dead patient. The debrief then counts him as both. Inklint flagged this one. | Guard at the top of `emergency`: if deceased, already stabilised, or no longer distressed or critical, `-> hub`. The hub already sends a death to `deceased_state`. | Reopen after death: alarm and bag choice, then "The bed is still..." with no choices. Reopen after Raval's save: alarm and bag choice, then "...still here." and the hub. Nothing changed: unchanged. |
| G2 | m02 Nurse Raval (`m02_npc_roaming_nurse`), `bed4_assist` | Major | The same, from the nurse's side: after he dies or is bagged at his bedside, the reopen still offers "Give me the bag." | Guard at the top of `bed4_assist` (the condition `start` uses) diverting to `start`. | Reopen after death or a bedside save: before, "He's fighting the vent" and the bag choice; after, her usual lines and menu. |
| G3 | m01 Derek (`m01_derek_confrontation`), `insufficient_evidence` | Minor | Esc at "come back when you've found something", then read the ENTROPY archive. The reopen has Derek tell you to come back with evidence you now hold, and a pick only closes the chat. | `{entropy_reveal_read: -> start}` at the top of `insufficient_evidence`. | Reopen after the read: before, "Oh, you must be the IT contractor..."; after, "Working late on the security audit?" and the confrontation choices. |

### Met flag set before the opening

| # | Mission, NPC | Severity | Lost after Esc and reload (and in-session where noted) | Fix |
|---|---|---|---|---|
| M1 | m01 Sarah (`m01_npc_sarah`) | Major | Visitor badge, office key and the `check_in_reception` task. The hub never offers them again. | `met_sarah` set at the top of `receive_items`. |
| M2 | m01 Kevin (`m01_npc_kevin`) | Minor | The first meeting and its three choices (influence, `discussed_audit`). The hub still offers the lockpicks and keycard. | `met_kevin` set in each `first_meeting` choice. |
| M3 | m01 Maya (`m01_npc_maya`) | Minor | The informant reveal (`revealed_informant`), which also locks the hub's "What should I do first?" | `met_maya` set in each `first_meeting` choice. |
| M4 | m02 Val (`m02_npc_security_guard`) | Minor | Her first encounter and its choices (influence +15, +5 or -20; where the server room is and whose card opens it). | `warned_player` and `#set_global:val_met:true` set in each of the three choices. Nothing else reads `val_met`. The cover challenge's "first meeting" test still works. |
| M5 | m02 Gary (`m02_npc_gary_whitlock`) | Minor | His first meeting and the three `*` openers (`gary_influence`, `gary_trusts_player`, topic flags; the blame route that hands over the keycard). The keycard stays reachable. | `met_gary` set in each `first_meeting` choice. |
| M6 | m03 Victoria (`m03_npc_victoria`) | Minor | The recruitment pitch (`first_impression` onwards: influence, suspicion, `philosophy_intro`). | `recruitment_discussed` set at the top of `philosophy_intro`, which only those three choices reach. The receptionist-KO suspicion (+10) is now added only `{not suspicion_warned}`, so a replay doesn't count it twice. |
| M7 | m04 Static (`m04_npc_operative_static`) | Minor | His challenge lines: the reload opened on bare choices. | `static_challenged` set at the top of `static_standoff`. |
| M8 | m05 Patricia (`m05_npc_patricia_morgan`) | Major, in session | Esc at her first three choices, and **talking to her again in the same session**, skips to the hub. The visitor badge (`give_item:id_badge:visitor_badge`) is never handed over, so `obtain_security_badge` can only complete through the KO fallback. | `first_meeting = false` set in each opening choice. |
| M9 | m05 Lisa (`m05_npc_lisa_park`) | Minor, in session | The opening and its choices (`lisa_influence` +10 or +5, the office-mood and collection-tin threads). | The same. |
| M10 | m05 Owen (`m05_npc_owen_gallagher`) | Minor, in session | The opening and its choices (`owen_influence`, `asked_access`). | The same. |
| M11 | m05 Dr Halloran (`m05_npc_dr_halloran`) | Minor, in session | The opening and its choices (`halloran_influence` +10 or -5, Heisenberg topic). | The same. The `halloran_accused` branch is unchanged. |
| M12 | m06 Irina (`m06_npc_irina_volkova`) | Minor | Her first meeting (`irina_trust` +15, -5 or +25; `irina_suspicious`). | `first_meeting = false` set in each `first_meeting_scene` choice. |
| M13 | m06 Satoshi (`m06_satoshi_confrontation`) | Major, in session | Esc at his opening choices, and the reopen (which re-runs `start`) gave "Back again." and went straight to the asset choice. The confrontation was gone: evidence, casualties, the Satoshi's Ghost reveal, `shown_evidence`. | `confrontation_started` and `#set_variable:satoshi_confronted=true` set in each of the four choices. `#complete_task:confront_satoshi` stays at the top (Review M2). |
| M14 | m08 Netherton (`m08_director_netherton`) | Minor | Esc during the brief, then a reload, lost the rest of it: the Portland carry-over and "There is a mole in SAFETYNET". | `met` set at the end of the brief, before `-> back`. `brief_taken` and the task still latch at the top. |

Proofs: `proof_met.cjs` (all of M1 to M13) has 21 of 42 close-and-reopen cases losing content against HEAD, and 0 of 42 after. `afterpick.cjs` shows that after any opening pick the opening does not replay, that the moved `val_met` and `satoshi_confronted` tags ride on the pick, and that Victoria's suspicion stays at 10 after a replay. For M14, `proof_netherton.cjs` gives "mole line reachable: false" against HEAD and true after. `metpaths.cjs` checks that every Sarah, Kevin and Maya opening path ends with the flag set.

Every reload sweep was rerun after the fixes. `reload3.cjs` finds no lost world tag in m01, m03, m04, m05, m06 or m08. The two left in m02 are listed under "left alone". `reload4.cjs` finds no lost opening choice with an effect in any touched mission, apart from the flavour-only openings listed below.

## Left alone, with reasons

### Tunnel crashes

- **m08 closing debrief, `conduct_beat`** (a tunnel with two choices): the simulator crashes it on a reopen. It can't happen in play. Every mapping that opens the debrief has `disableClose`. The NPC is hidden, so there is no plain talk. Any reopen, including one after a damage close, comes through an event mapping with startKnot `start`, which resets the stack. Latent; worth converting if the debrief ever loses `disableClose`.
- **m07 closing debrief**: its tunnel choices sit in stitches of `operations_gone_dark`, and re-running that knot rebuilds the tunnels. 16 tunnel choice points reopen cleanly. It is also `disableClose`.
- The other `->->` knots on the grep list have no choices, so a reopen can't stop inside them: m02 Val `val_opens_office`, m02 briefing `derek_outcome`, m02 HaX phone `doors_nudge`, m04 debrief `debrief_people`, m07 HaX phone `door_line` and `password_line`, m08 confrontation `lock_in`.
- Phone: no phone ink crashes in the tunnel sweep, and `reopencheck.mjs` reports 0 problems in every touched mission.

### Inklint hits that can't fire

- **m02 Val, `cover_challenge_options`, `the_argument`, `reeves_questions`** (guard `attacked_guard and not guard_knocked_out`). `attacked_guard` is set by the fight choice (`#hostile`) or by `npc_attacked` (a punch turns her hostile). A hostile NPC is punched, not talked to, until she is KO'd, and a KO'd NPC can't be talked to. A player KO calms hostiles and reloads the page, and a reload restarts at `start`, where the guard runs.
- **m04 Voltage, `voltage_ideology_explanation`** (guard `voltage_fight_started`). That flag is set by `npc_hostile_state_changed` when he turns hostile. `voltage_captured` is set by `npc_ko:voltage`. The same reasoning applies.
- **m07 Elena, `pressure_recover`** (guard `elena_ko`). `elena_ko` is only written by `globalVarOnKO`.
- **m02 Mr Pryce, met-before-opening at L38** (`spoke_to_player`). The opening's three choices only set `hub_quiet`, and its lines were shown before the choices. Flavour only.

### Other sweep findings

- m02 Val, `on_lockpick_used`: a reload after Esc at the catch loses the player's reply (including the fight option). The catch itself is recorded first on purpose (`val_caught_picking`, "survives a catch that cut the last scene short"), and the next catch plays "Again? Seriously?". These are the two m02 tags `reload3.cjs` still lists.
- m02 Val, `cover_challenge_options` and `the_argument` after Bernie vouches (`cover_restored`): the reopen keeps the challenge instead of `open_after_vouch`, but it still offers "Ring Bernie... she's logged a correction", which leads to the same door. Cosmetic.
- m02 Reeves, `confrontation_choice` with `awaiting_ambush`: the press terminal's ambush opens at once through its own mapping (startKnot, `disableClose`), and that conversation's save replaces the parked one.
- m03 Victoria's day knots after `night_confrontation_ready`: they already hand over to `start` on `clone_call_done` (D4-1 sweep), and the flags come after nightfall.
- m03 Victoria, `clone_check_2` with `victoria_card_cloned` set outside the chat: this needs the cloner saved while the chat is parked mid-read. An edge case, and at worst a second clone offer.
- m05 Owen, `request_password` with `server_password_obtained`: the only outside source is the relayed note, which comes after Owen is KO'd.
- m08 Nightshade confrontation, `hub` and `the_choice` with `fate_decided`: outside this ink, `fate_decided` is only set on his KO (taskOnKO and HaX's safety net), and he can't be talked to once KO'd. The room-entry mapping is `disableClose`, and `start` already routes a settled fate to the aftermath.
- KO-only fates (m03 Danny and Victoria `ko`, m05 Torres `final_choice`, m06 Irina `irina_fate_decided`, m07 Hollis, Mercer and Park): these globals change by KO, and a KO'd NPC can't be talked to.
- m08 Vector, Phantom and Nightshade intros: the `*_interviewed` latch is set before the intro on purpose (PASS 2, lesson 27; design C2: "the interview has happened even if the player leaves at once"). An Esc and reload mid-intro lose two or three flavour lines. Kept.
- m08 HaX in the break room: a one-line opening latched by a global (`hax_person_met`). Kept.
- Flavour-only openings whose lost choices change nothing: m02 patients in beds 2, 4 and 5; m06 trader (Dani) and analyst (Priya). Greeting-only losses whose reload line still makes sense: m02 Val and m06 checkpoint guard, minder and Hollis re-entries, m03 Ffion and Terry. Kept.
- Debriefs and forced scenes (all `disableClose`) were checked for crashes only.
- m02 opening briefing: Esc ends the briefing, since `setGlobalOnStart: briefing_played` and the NPC is hidden. That is engine configuration, not ink, so it is out of scope.

## Counts

| Mission | Fixes | Of which major | Inklint before | Inklint after |
|---|---|---|---|---|
| m01 First Contact | 4 (G3, M1, M2, M3) | 1 | 0 | 0 |
| m02 Ransomed Trust | 4 (G1, G2, M4, M5) | 2 | 6 | 4 (all left alone above) |
| m03 Ghost in the Machine | 1 (M6) | 0 | 0 | 0 |
| m04 Critical Failure | 1 (M7) | 0 | 1 | 1 (Voltage, can't fire) |
| m05 Insider Trading | 4 (M8 to M11) | 1 | 0 | 0 |
| m06 Follow the Money | 2 (M12, M13) | 1 | 0 | 0 |
| m07 Architect's Gambit | 0 | 0 | 1 | 1 (Elena, can't fire) |
| m08 The Mole | 1 (M14) | 0 | 0 | 0 |
| Total | 17 | 5 | 8 | 6 |

Inklint's heuristics don't catch most of the met-before-opening cases fixed here (M1 to M14). The simulators found them.

## Checks run after the fixes

- Recompiled with `scripts/compile-ink.sh` for m01, m02, m03, m04, m05, m06 and m08. No compile errors.
- `ruby scripts/validate_scenario.rb` on the same seven missions: all "Validation complete", with no new errors. The only warnings are the existing ones (dialogue lint, onceOnly overlaps, timed-text spacing).
- `reopencheck.mjs`: 0 problems in each of the seven.
- `inklint.mjs`: the counts are in the table above.

## Voiced lines

No spoken line, choice text or speaker changed. A diff filter over every changed `.ink` file finds only assignments, conditions, diverts, comments and moved `#set_global` and `#set_variable` tags. `voicelines.mjs` gives identical line sets before and after for 15 of the 17 files. For `m02_npc_patient_bed4` and `m02_npc_roaming_nurse`, the sampler no longer reaches the emergency lines from a knot start, because the new guard needs `patient_bed4_state` to be "distressed" or "critical" (a string the sampler doesn't set). The lines are unchanged in the source, and the TTS pruner also expands the ink source statically, so their audio is kept.

Two tags now ride on a different line: `#set_global:val_met:true` (on the player's first reply instead of Val's walk-up) and `#set_variable:satoshi_confronted=true` (likewise). Their audio is unaffected.

## Side effect

Running the validator rewrote `scenarios/m06_follow_the_money/dungeon_graph.html` and `.md`. The committed graph was stale against the committed scenario (27 tasks with 7 optional, now 28 with 8). Left as regenerated.
