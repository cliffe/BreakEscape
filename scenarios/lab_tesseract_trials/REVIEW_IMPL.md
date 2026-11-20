# The Keyholder Trials: implementation review

Fresh, read-only review of the built scenario (`scenario.json.erb`, `ink/*.ink`, `mission.json`) against `DESIGN.md` v4, using the `scenario-design-review` skill. Reviewer: implementation review (Opus), 2026-10-06. Kind of game: a lab scenario with SAFETYNET spy framing (brief, AGENTS.md). Decisions in `DECISIONS_LOG.md` override this review; deviations listed in DESIGN's "Build notes (v4 build)" are accepted and not re-raised.

## 1. Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb … --skip-ink --no-graph` | 0 invalid. 7 warnings, all the ones the build notes justify (`validSprites`; two HaX mappings on `open_pigeonholes`; `concludeRequires` names a non-flag task; Keyholder pickup mapping "no visible effect"; debrief mapping without `onceOnly`; two AND-gate "multiple solution" warnings). One missing recommended field: `ghost.currentKnot`, deliberate (build rule 5). Room layout geometry OK. |
| `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_tesseract_trials/` | No findings ("Totals by rule: none"). |
| Recompiled all nine `.ink` files with `inklecate` into scratch | Compile clean, and every JSON is identical to the committed one. |
| `render_scenario.rb` seeds 31 and 2026 | Both render to valid JSON; `tools/verify_rendered_independent.py` gives ALL PASS on both (every lock's answer derived from the in-world artefacts; signature "Verified OK"; EBCDIC). |
| Cross-check script on the seed-31 render (scratch `check.py`) | 11 locks, every one top-level with a `lockType`; no unlocked container carries `lockType`/`requires`; every container states `locked`; every `#give_item` id exists in that speaker's `itemsHeld`; every ink `VAR` is either a declared global or ink-local by design; every `#set_global`, mapping `setGlobal`, `onRead`/`onPickup` and `globalVars.*` condition names a declared global; every `objective_task_completed:*` pattern, `completeTask`, `unlockAim`, `targetKnot` and `data.itemId` target exists; all answers ≤ 14 characters; the leaflet fingerprint matches the rendered `keyholder_public.pem`. |
| inkjs trace of the tag/line pairing (scratch `tags.cjs`) | Used for M1, M2 and W7 below. |
| `python3 scripts/predict_door_sides.py` | Fails on this scenario: it looks for `room_it` and the tilemap is `room_IT.json` (tool bug, not a mission bug). `build_evidence/door_alignment.txt` shows all six doors aligned. |
| Not run | No browser playtest (out of scope for this review). The validator's dungeon-graph summary is suppressed by `--no-graph`; I used the committed `dungeon_graph.md` (37/49 puzzle nodes/edges; critical path Freshers' Week → Bits and Bytes → Secrets and Keys → The Keyholder → The Offer). |

## 2. Build against design

Everything in the brief's list was checked line by line. Where it matches, it is listed in one line; deviations not in the build notes become findings in section 4.

**Locks, answers, gating order.** Match DESIGN section 4 exactly: L1 lockbox password (`scenario.json.erb:538-541`), L2 locker PIN (`:657-659`), L3 guest terminal password (`:600-602`), L4 corridor password (`:674-676`), L5 library PIN (`:724-726`), L6 safe password (`:737-739`), L7 pigeonholes password (`:687-689`), L8b drop box password (`:705-707`), L9 workshop key with matching `keyPins` (`:785-788`, brass key `:712`), L10 relay password (`:814-816`), scoreboard password = token (`:833-835`). Generation matches section 5 (`:49-126`): the IV only in the Vigenère plaintext, envelope re-rolled until it isn't valid UTF-8, report signed over the Base64 text, PEMs stripped. The chain corridor → library → safe → Trial VII + whiteboard → pigeonholes + IV → envelope + lab private key → drop box → brass key → relay holds; both renders verify. OK.

**Endings and their globals.** Send / double (`phone_agent_0x99.ink:157-169`), blown (`:171-178`), refused (`phone_ghost.ink:181-191`). Each sets `ending` before `decision_made`; the inkjs trace shows `set_global:ending:*` on an earlier output line than `set_global:decision_made:true`, so the mappings that read `globalVars.ending` see it. Credits (`scenario.json.erb:322-354`) cover all four endings with unconditional lines in each section. One gap: the late-warning branch of the debrief is unreachable (M2).

**Objectives and `concludeRequires`.** Aims, tasks, types, targets, optional flags and `onComplete.setGlobal` match DESIGN section 7 (`scenario.json.erb:224-307`); `concludeRequires: { tasksCompleted: ["open_relay_terminal"] }` (`:288`) as Q13. `freshers_week` unlocks `trials_bits` through `unlockCondition.aimCompleted` rather than the aim's `onComplete.unlockAim`; equivalent (m02 pattern), and a task completed while its aim is still locked reveals the aim (`objectives-manager.js:718-736`). OK.

**Briefing and debrief.** Briefing wiring as section 8 (`scenario.json.erb:366-390`; Comms note on the first line, `opening_briefing.ink:9-10`, confirmed by the inkjs trace). Debrief opened by `start_debrief_cutscene` with `disableClose` (`:484`), `#complete_task:hear_debrief` then exit on the last line (`closing_debrief.ink:185-186`), credits on `conversation_closed:closing_debrief_person` (`:317`). Deviations: M2, m2, m3, and the double route's sequel-hook text (m10).

**Event mappings.** Every mapping read (`scenario.json.erb:415-438`, `:458-466`, `:484`, `:504-505`, `:646`). Conditions use `&&` only, `onceOnly` where the design asks, and every target exists. The text schedule matches section 8 except the FN7 fallback delay (12 s against 2 s, m10). The relay-opened music switch has no `onceOnly` (build note). OK.

**Items the ink gives or names.** Every `#give_item` resolves (Tom: laptop + FN1-3; Jordan: leaflet; Sidhu: FN7, FN10; HaX: FN4-11 + Comms copy; briefing: Comms). Props named in dialogue exist: ASCII chart, Dr Shaw's board (`whiteboard2`), Sidhu's whiteboard and desk handout, the lab account PC, the drop box tag, the signup laptop's Mailer, the coffee station, the soldering iron (in the info screen's text). OK.

**Globals versus ink VARs.** All 36 declared globals have a writer and a reader (`player_name` is the engine's), except `late_warning`, whose only reader is dead code (M2). Every ink VAR is either a declared global or deliberately ink-local (`fnXX_sent`, hint counters, `intro_done`, `on_call`, `met_*`, `debrief_done`). Ghost's story declares every global its router reads (R3-3). OK.

## 3. Design review (skill step 2)

**2a Solvability.** OK. Every lock's answer is behind an earlier lock or in another room, nothing is circular, and every locked object is top-level (`game.rb` looks only there). No soft lock found: password attempt limits reset on reopen (the counter starts at 0 per minigame, `password-minigame.js:17`), the PIN lockout likewise. No VM wiring. Dialogue promises nothing missing (section 2). Browser-unproven on the real build: the password-locked `pigeonholes1` (R17), both PIN locks, the unlocked lab account PC, the notepad pencil as scratch pad (R23), and reach in the common room, library and Sidhu's office (the smoke run walked only the foyer, lab, corridor and workshop, PROBE_RESULTS "Build smoke run"). These belong to the first playtest, not to this review.

**2b Clue distribution.** OK. Clues sit in six of seven rooms; L5 and L8b have clue and lock in one room by design. No navigation-only notes (the floor directory doubles as Cliffe's "(knock)" plant). The optional EBCDIC tape and the exhibits have teaching purpose.

**2c Educational coverage.** OK. Password, PIN and key locks carry CyberChef work from decimal to signatures, in the order of DESIGN section 4.

**2c′ Field guides.** Delivered as `notes`, not `lab-workstation` (Q7, decided). Exposure-gated offers, delivery on request through one sticky choice: matches the m01/m02 pattern. One ordering issue (m5).

**2d Narrative.** Opening cutscene has `waitForEvent: game_loaded` and `skipIfGlobal`. Debrief is a hidden person-chat opened by a global. Spot-checked mappings: the video call on `relay_opened` (`:465`), the decision-made texts (`:433-438`), Cliffe's hide (`:646`). Findings M1-M3, m1-m4.

**2d′ Ink conventions.** Narration uses `Narrator:` and a top-level narrator voice exists (`:158-162`). Unprefixed lines after a `Narrator:` line go to the main NPC (W1). No combat or terminal logic in ink. Choices read as speech, apart from the device's `[Close the device.]` (a non-verbal action, allowed) and one odd briefing line (m11).

**2d″ Patrol guards.** N/A.

**2e Graph metadata.** Lock-key edges are annotated; the two AND gates use `puzzle_graph_and_with`. The container-content suggestions are the ones the build notes explain. OK.

**2f Rooms.** No empty room (`build_evidence/room_depth.txt`), geometry OK, doors aligned. Room types fit a university building. No late room holds an early clue.

**2g Objectives scaffolding.**

| Aim | Required tasks | With in-world pointer | Dead-zone risk | Bark/text at the transition |
|---|---|---|---|---|
| Freshers' Week | 2 | 2 (briefing: "Dr Shaw first. Then the stand.") | low | HaX's timed text after the briefing |
| Bits and Bytes | 4 | 4 (each card's observations name the next lock) | low | HaX leaflet nudge, L2 nudge; Ghost Trial II/IV |
| Secrets and Keys | 4 | 4 (poster, slip, Trial VII notes, tag) | low | HaX corridor/library/safe/pigeonhole nudges |
| The Keyholder | 2 | 2 ("The workshop's north"; Final Trial card) | low | HaX "Brass…", workshop text |
| The Offer | 2 (+1 optional) | 2 (Ghost's offer; HaX hub; post-decision texts) | low | decision texts per ending |
| Loose Threads (side) | 0 (1 optional) | 1 | n/a | Ghost's candidates line |

Task titles are actions. Aim descriptions match their task lists.

**2h Knockout resilience.** N/A in practice: `"disableAttacks": true` (`:155`) and there is no hostile NPC, so no NPC can be knocked out. No `taskOnKO`/`globalVarOnKO` needed.

| Person NPC | Gates a required task/item? | taskOnKO | KO in debrief | Verdict |
|---|---|---|---|---|
| tom_shaw | yes (laptop; `get_lab_laptop`) | n/a | n/a | OK, no attacks |
| jordan_pike | yes (leaflet; `visit_stand`) | n/a | n/a | OK, no attacks |
| sidhu, megan, cliffe ×2 | no | n/a | n/a | OK |

**2i Recurring bugs.**
- Spoilers in names: none found. "Loose Threads" and its task are hidden until the file is read.
- Stale status answers: HaX's hint ladder and greetings follow progress. Stale lines in Tom's, Megan's and Ghost's hubs (m6-m8), and HaX's post-decision greeting comes too early (m1).
- Late first contact: the device opened late gets the short intro or the offer catch-up (K2, K3, K10 pass in `build_evidence/kstates.txt`).
- Credits and debrief versus routes: checked each conditional line. Breaks on send-then-warn (M2), refuse-then-warn (m2) and device-never-taken (m3).
- Interaction reach: not verifiable statically; see 2a.
- Deduction fairness: the token appears only inside the decoded report, so the double route can't be reached without decoding. OK.
- Hub order and size: HaX's hub lists late-mission topics first and peaks at 8 choices. OK.
- Look-alikes: the two Cliffe NPCs share a sheet and are the same person. OK.

## 4. Findings

No blockers. Every finding is mission-local. Fixes M1-M3 and m1-m4, m6-m8 touch spoken lines, so they cost TTS (AGENTS.md); the lines are listed in each fix.

### Majors

**M1. Ghost says "Back. So you've decided." as the player defers, on the video call and on the device.** `phone_ghost.ink:156-160`: after `[I'll think about it.]` the two reply lines are followed by `#exit_conversation` and `-> the_offer_again`, whose first output is "Back. So you've decided." (`:164-167`). A tag on its own line belongs to the next line of text, so the exit tag rides on that greeting. The inkjs trace shows it: "Take your time…", "Your terminal's still open…", then `[exit_conversation]` + "Back. So you've decided.". Person-chat (the call) shows every line of a result before honouring the exit (`person-chat-minigame.js:1224-1225`), and phone-chat shows all accumulated lines first (`phone-chat-minigame.js:803-831`). So every player who defers hears Ghost say they've decided, at the climax. The same happens on `[Still thinking.]` (`:172-174`), which answers "Still thinking." with "Back. So you've decided.", and on the device's `[Close the device.]` (`:81-83`), which re-posts the waiting line ("Still watching.") as the farewell, visible twice in `build_evidence/smoke-10-device-after-call.png`. *Fix:* make the resting knots' greeting skip once when they are entered from an exit. For example, an ink-local `VAR parked = false`: the exits do `~ parked = true` before the divert; `the_offer_again` and `waiting` print their greeting only `{not parked}` and then set `~ parked = false`. Put `#exit_conversation` above the last reply line ("Your terminal's still open. Read what I gave you.") so person-chat closes on that line. Re-run `tools/kstates.mjs` (K1, K5, K9, K10) and `reopencheck.mjs`, since both expect these knots. No spoken text changes.

**M2. The send-then-warn route gets no acknowledgement: the `late_warning` line is dead code.** `late_warning` is set only when `ending === 'sent'` (`scenario.json.erb:432`), but the debrief reads it only inside `opening_double` (`closing_debrief.ink:109-111`), which needs `ending == "double"`. DESIGN:682 and :777 promise "You tried. It was already open." on that route ("Every order is covered", DESIGN:680). As built, a player who decoded the report, sent it, then submitted the token is asked "Did you read it before you sent it?" as if they might not have, and nothing in the debrief or credits mentions the token. *Fix:* move the line into `opening_sent`: after "Nobody's hurt." add `{ late_warning: Agent HaX: You tried. It was already open. }`. When `late_warning` is true, skip the "Did you read it?" question and `#set_global:report_read_claimed:read`. Optionally add a credit line `REPORT: Read, sent, then flagged.` on `ending === 'sent' && late_warning === true`. Delete the unreachable branch in `opening_double`. Spoken lines: one new HaX line, one removed.

**M3. Ghost's prices for each route are behind an optional question, and "So does she." is gone.** DESIGN:642-645 puts the three prices in the offer itself (refusal costs Megan, a trick earns "a third offer", sending: "Send it and you start Monday. So does she."). This was lever 2, the logged answer to round-2 major R2B-M8 (DECISIONS_LOG: "The designer chose to price each route in Ghost's offer… to make the choice hard"). The build moves all three into a new choice, `[What happens if I say no?]` (`phone_ghost.ink:147-155`), and cuts "So does she." A player who goes straight to "I'll think about it" or "No" never hears what either route costs, so the choice loses its pull both ways. The deviation isn't in the build notes. *Fix:* put the three lines back into `offer_terms`, unprompted, after "Your handler's location is a number I can check." Restore "So does she." on the send line (only when `megan_choice != "warned"`). Keep `[What happens if I say no?]` as a re-ask if wanted. If the builder dropped them on purpose (pacing), log it in the build notes so the orchestrator can rule. Spoken lines: up to four Ghost lines move or change.

### Minors

- **m1. HaX's hub says "Call me when you're clear." the moment the report is sent** (`phone_agent_0x99.ink:56-57`, after "Received." at `:166-169`). It lands before her 1.5 s "Opening it now" and 7.5 s "My phone just did something it shouldn't" texts (`scenario.json.erb:433-436`), so on the sent route the player is told to get clear before anything has gone wrong. The same greeting follows "On my way to you." in `debrief` (`:186-190`). *Fix:* after a decision, greet with "Go ahead." until the debrief, or gate the line on a flag set by the 7.5 s text's mapping.
- **m2. "And you sent me the token first." is false on refuse-then-warn** (`closing_debrief.ink:117`; design: "either side of a warning"). *Fix:* drop "first".
- **m3. "Hand in the device." when the player never took it** (`closing_debrief.ink:143`; the offer already branches on `ghost_greeted`, `phone_ghost.ink:126-132`). *Fix:* declare `VAR ghost_greeted` in the debrief and branch: "Leave the device where you found it…" or skip the first sentence.
- **m4. Sidhu says "Take these. One on hashes, one on signatures." when he hands over only FN10** (`npc_sidhu.ink:100-104`, if `fn07_had`). *Fix:* branch the line on `fn07_had`.
- **m5. HaX sends AES (FN8) before public keys (FN9)** (`phone_agent_0x99.ink:102-109`). FN8 is offered 6 s after FN9, so "newest first" picks FN8, but the player needs FN9 first (L8a before L8b). *Fix:* swap the two branches.
- **m6. Tom's greeting "Go on then. Tell me how you got into it." shows from the moment the player asks about the terminal, before they're in, and for the rest of the game** (`npc_tom.ink:40-41`). *Fix:* gate it on `asked_terminal and guest_terminal_open and not corridor_open`.
- **m7. Megan's "You got past the locker? Dead good. I'm still on it." lasts to the end of the game** (`npc_megan.ink:123-124`), including after the player has read her file. *Fix:* add a later branch (e.g. on `corridor_open`) or limit it to `not guest_terminal_open`.
- **m8. Ghost's waiting line at `pigeonholes_open` says "Your own key opened your own envelope."** (`phone_ghost.ink:68-69`) before the player has decrypted it. *Fix:* "Your envelope's waiting. Only one key opens it." or similar.
- **m9. Refusing on the video call ends with "NO CARRIER."** (`phone_ghost.ink:189-195`, the exit tag rides on `closed`'s line, inkjs trace). It's harmless on the device but odd on a call that has just shown "CONTACT CLOSED.". The M1 `parked` fix covers it if `closed` uses the same skip.
- **m10. Deviations missing from the build notes.** None changes play much, but the notes should list them: the FN7 fallback text at 12 s rather than 2 s (`scenario.json.erb:428` vs DESIGN:549, probably to clear the drop-box texts; the smoke run still stacked four toasts); the hint ladder merges L8a and L8b into one step, `l8` (`phone_agent_0x99.ink:204-205`, `:274-279` vs DESIGN:425-426); the double route's sequel-hook message "Term's started. So have you." (DESIGN:788) isn't built anywhere (a debrief line on `ending == "double"` would carry it); Ghost's added `[What happens if I say no?]` (see M3). *Fix:* add rows to "Build notes (v4 build)".
- **m11. The briefing choice `[Read it. Go on.]` reads as the player telling HaX to read something** (`opening_briefing.ink:14`). *Fix:* `[I'll read it. Go on.]`.

### Withdrawn

- **W1.** Unprefixed lines after a `Narrator:` line (Tom `npc_tom.ink:25-28`, Sidhu `npc_sidhu.ink:143-145`, Cliffe, Megan, Ghost's call) would be voiced as narration. Withdrawn: `InkEngine.continue()` returns one line per call (`ink-engine.js:42-58`), so `createDialogueBlocks` sees one line and defaults it to the main NPC or the `#speaker` tag (`person-chat-minigame.js:1176-1180`).
- **W2.** Opening the lockbox before Freshers' Week completes would lose the task. Withdrawn: a task completed in a locked aim reveals the aim (`objectives-manager.js:718-736`).
- **W3.** `maxAttempts: 5` could lock a password box for good. Withdrawn: the counter is per minigame instance (`password-minigame.js:17`) and resets on reopen.
- **W4.** The briefing doesn't `#set_global:briefing_played:true` as DESIGN:498 says. Withdrawn: `setGlobalOnStart` sets it when the scene fires (`npc-manager.js:1590`).
- **W5.** Taking the Final Trial Card might not emit `item_picked_up:notes` with its id, because it has no `onRead`. Withdrawn: container notes go through `handleObjectInteraction`, which emits it with `itemId` for takeable notes (`interactions.js:1474-1482`).
- **W6.** Compiled ink could be stale. Withdrawn: a fresh `inklecate` build is identical for all nine files.
- **W7.** `decision_made` could fire before `ending` is set. Withdrawn: the inkjs trace puts `set_global:ending:*` on an earlier output line than `decision_made`, and phone-chat processes accumulated tags in order.

## 5. Prioritised action list

**Must fix (blocks play):** none.

**Should fix:**
- M1: skip the resting-knot greeting when a knot is entered from an exit (Ghost "Back. So you've decided." on deferring).
- M2: move the late-warning line into `opening_sent`, skip "Did you read it?" on that route.
- M3: restore the route prices in Ghost's offer, or log the change in the build notes.
- m1: HaX's "Call me when you're clear." greeting too early on the sent route.
- m5: send FN9 before FN8.

**Worth considering:** m2-m4 and m6-m8 (one-line text fixes), m9 (covered by M1), m10 (build-notes rows), m11.

**For the first playtest, not findings:** R17 password pigeonholes, the PIN locks, the lab account PC, R23 notepad pencil across a reload, reach in the common room, library and Sidhu's office, R12 Magic results, the four endings and their credits, and text stacking at speed.

## 6. Verdict

**Ready for playtest after small fixes.** The puzzle chain, locks, generation, objectives, conclusion gate, globals and mappings match the design and check out statically on two fresh seeds. Nothing blocks play. Fix M1-M3 before the browser runs, because each one is something a playtester will see at the climax or the debrief. The minors can go in the same pass.
