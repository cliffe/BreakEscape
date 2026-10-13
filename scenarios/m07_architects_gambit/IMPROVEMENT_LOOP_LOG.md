# m07 The Architect's Gambit: improvement loop

Started 2026-10-13. Method: the five-phase improvement loop in `AGENTS.md`, to the standard m03 reached on 2026-10-13 (`scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md`, the model log; `scenarios/m04_critical_failure/IMPROVEMENT_LOOP_LOG.md`, Pass 5, the nearest worked example). Shared agent brief: `docs/agents/M07_PASS_BRIEF.md`.

Earlier work on this mission: pass 2, the pass-4 editorial loop and the cross-mission sprite renames. It has not had the full improvement loop or the art and atmosphere work before this pass.

Stages: regression playtest, then alignment, puzzle chains and scenario design (review, fix loops), dialogue, room dressing, lighting, POV backgrounds, characters (parked for user input), playtests. Each round is logged here with a severity table and an outcome for every finding (fixed, withdrawn and why, or deferred and why).

## Pass 5 (2026-10-13)

### Stage 1 regression

Run: `PASS5_REGRESSION.md` (Sonnet harness, keyless :3001, headless, game 2376, log `tools/playtest/m07-pass5A-game2376.jsonl`, 1574 lines). One fresh game, briefing driven by hand, two page reloads, flags supplied, credits reached and `mission_complete` set. Regression run, not blind. No mission files were edited and nothing was committed.

Counts: **0 blockers, 3 majors, 16 minors.**

Engine checks from the brief: toasts, the tutorial hold, KO on reload and the required-task marker work (the marker is wrong on two tasks, M-3). Lighting variants have nothing to test (m07 has no `lighting` block). The RFID denial hold could not be exercised (one RFID lock, no wrong card to try). `nightshade` is not used in m07. `agent_hax` is used only as the 32 px headshot, and HaX's new bust is never configured.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M-1 | major | No sight challenges: Hollis's and Park's `los` blocks are decorative (pass 4 fix 15) with no `challengeOnSight`, so walking past Hollis never provokes him | Open. Stage 2 design call (m03/m04 sight-challenge pattern against pass 4's deliberate choice) |
| M-2 | major | Briefing and debrief Netherton use the `male_spy_v2` placeholder instead of the `netherton_*` set; HaX has no `spriteSheet`, `spriteTalk` or `spriteVisemes`, so her new bust cannot show in the debrief | Open. Netherton half is quick wiring; HaX's bust goes to the character stage |
| M-3 | major | Required `x` marker on `secure_generator_room` and `recover_vault_pin`, inside the aim titled "(Optional)" that never gates the conclusion | Open |
| m-1 | minor | HaX's phone and toast avatar is the old 32 px headshot, not matching her new look | Open (character stage, shared with m04) |
| m-2 | minor | Five toasts stack on the first ops-floor entry; one announces the control-room aim early | Open |
| m-3 | minor | Readable-object popup prints "Observations:" and "Text:" labels with the content repeated; the one-line caption clips its tail | Open (engine formatting, for the user) |
| m-4 | minor | Cascade Control System text still says it will not take an abort after it has unlocked | Open |
| m-5 | minor | "Upstairs in the control room" and "down the service stair" against a same-level map | Open |
| m-6 | minor | Elena's "page forty" turn option is available when the player never heard about page forty (`m07_npc_elena_rodriguez.ink:152`, `:262`) | Open (stage 3) |
| m-7 | minor | Mercer's "When the fourth submission is declined" and "The host is yours" lines read as written | Open (stage 3) |
| m-8 | minor | Elena hands over both the password and the vault PIN in one turn, flattening flag 2's capture and the ATS plate | Open (stage 2) |
| m-9 | minor | Park "kneeling" but standing; the trunk runs object is a thin arc on the wall | Open (stage 4) |
| m-10 | minor | Wall pictures float outside `scada_control` and move between loads in the checkpoint | Open (stage 4) |
| m-11 | minor | Generator hall reads as a server hall; cable vault reads as an office | Open (stage 4) |
| m-12 | minor | Phone timestamps show the wall clock, not the story clock | Open (engine, for the user) |
| m-13 | minor | When an optional aim's required tasks finish, its active optional tasks vanish from the panel | Open (stage 2, engine behaviour) |
| m-14 | minor | Every reload respawns the player in the start room | Open (suspect engine, same as m04 E1) |
| m-15 | minor | `PASS4_PLAYTEST.md` still quotes HaX's "...Say that again."; the line is now "...Read me that again." | Open (docs) |
| m-16 | minor | Credits say Mercer left "during the abort"; on this route he left before it | Open (check which route sets the line) |

Held up well, no finding: the opening briefing and commit, the tutorial prompt, Hollis's evidence route, the Elena revision beat, the decode's last line, the flag texts, the 15-minute clock, the abort, the post-abort plant, HaX's "Bring me in", the debrief's branching on what was done (Hollis, Elena, Park, Mercer, the intercept, the stance), and the credit lines.

Not covered by this run (carry into the stage 6 playtests): the badge-station route, Hollis KO or evade, the Park fight, the redirect, the 9-minute fallback timer, the clock expiring, the missing-flag nags, Elena left at the rack.

### Stage 2 alignment, round 1 (fixer)

Review: `ALIGNMENT_REVIEW_P5_C1.md` (Opus, read-only). Regression items folded in from `PASS5_REGRESSION.md` as the orchestrator directed (M-2, M-3, m-6, m-8, m-10). Orchestrator decisions applied: U1 (the m07/m08 timeline, fixed on the m07 side with one briefing line), U2 (fate-neutral cross-mission lines, no engine work). Every finding was checked against `scenario.json.erb` and the ink before acting. No SecGen XML and none of the four restricted field guides were opened.

Counts: 0 blockers, 6 majors, 16 minors from the review; 5 regression items folded in.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M1 | major | Debrief and credits never mention the VM work | **Fixed.** `the_win` gains Netherton's three-doors beat (share, listener, root) and a line on timing, from a new latch `logged_in_before_door` (HaX mapping on `flag3_submitted` while `scada_door_reached`, set on `room_entered:scada_control`, is false): "You logged in on their host before the control room door was open…" or "You opened the door before you touched their host. That is the order that kept it clean / kept it to one step". Credits: new "── THE ATTACK HOST ──" section (the host line unconditional, because the credits only roll after a debrief that needs all four flags), two CLOCK lines (stopped with time on it / ran out one step before the abort) and an ORDER warning on the latch |
| M2 | major | The Trojan Horse discovery is handed over | **Fixed.** "Austin" is out of the decode's observation and HaX's nudge. The decode's `onRead` sets `found_coordination_traffic` only. HaX's hub has "Their schedule doesn't match our brief." (gated `found_coordination_traffic and not projection_revised`): pick the operation (Fracture / Trojan Horse / Meltdown), then what's wrong (dormancy nine days, or the EHR/CAD manifest, both right; the key count, wrong because both sources say 840). A wrong pick costs nothing ("That isn't what I'm reading. Look again.", a second one adds "Put their rows next to the desk summary, line by line.") and the hub returns. `deduce_right` sets `projection_revised` and `verdict_sent` and says the verdict for the player's situation. The three automatic verdict texts are replaced by one prompt with no conclusion ("If a row in there doesn't match what we were told, call me and say which."). `topic_traffic` now needs `projection_revised`. Elena's lever is "The other three operations tonight. What were you told about them?" and she is the one who picks out Austin; her `projection_revised` stays (she is the witness). Her verdict rows no longer require the decode unread |
| M3 | major | The redirect window is invisible, and the debrief blames a player who had no chance | **Fixed.** Latch `revision_found_open`, set by two HaX mappings: the correction lands with the window open and the team on something else, or a player who already had it commits elsewhere. Debrief split in `revision_payoff` and `dark_trojan`: open-window players hear the current lines ("You knew…"); found after the window shut: "You found it after the window had closed. That is in the report as found, not as ignored." / HaX "The timing was his, not yours."; never committed: its own lines. Display-only HUD timer `redirect_window_display` (40 min from the commit, shown only while `projection_revised`, window open, not redirected, not on Trojan Horse). Warnings before the flag 3 login: the take-the-host aim text, the redirect cost line, a conditional line in `vm_hint_3`, a HaX text on flag 2 for a player who could still move the team, and the open-window verdicts ("before you log in on their host"). Credits: CORRECTION FOUND WITH THE WINDOW OPEN (warning) / AFTER THE WINDOW SHUT (entry) |
| M4 | major | T-10's open-window lines can never play; "Ten minutes left" is false | **Fixed.** New timer `architect_taunt_t10` at 30 min; `redirect_window_close` sets only `redirect_window_closed`. The bark is three disjoint rows: "Ten minutes before your team is too committed to move, Agent 0x00." / (team in Austin) "A word about Austin, Agent 0x00." / (window shut by an early login) "You logged in, Agent 0x00. A word about doors." `taunt_t10` branches: closed "You logged in. The door closed behind you."; redirected; Trojan Horse; discrepancy found; nothing found (with the ten-minute warning). `t10_close` uses "Doors close" for the Trojan Horse case too |
| M5 | major | No sight challenges; the checkpoint is a walk-past; Park never speaks first | **Fixed.** Hollis: `los.challengeOnSight` (cooldown 20 s, `requireGlobal: briefing_played`, `skipIfGlobal: [hollis_resolved, hollis_ko]`), `visualize: true`, and a `player_spotted:ray_hollis` → person-chat `start` mapping (m04's guard). A backed-off player is challenged again on the next sighting (`wary_again`). Park: `room_entered:cable_vault` → person-chat `start`, not onceOnly, skipped once he has walked out, turned on the player or been knocked out; a third visit gets its own line ("I said there wasn't a third.") instead of repeating "Second time". Both "decorative" comments replaced. Browser-checked (Hollis, below) |
| M6 | major | m07/m08 timeline clash | **Fixed** (U1). Briefing, "How do we know all this?": "Portland has been on our contingency board since Thursday, with you pencilled in as the nearest agent. Tonight's intercept told us it was live, and gave us the other three." |
| m1 | minor | "I'm not reopening it" / "nobody is going to ask you twice" contradict the redirect | **Fixed.** "It'd take something new to move it." Aim: "The team turns the moment you do." |
| m2 | minor | `{player_name()}` in voiced HaX lines | **Fixed.** "HaX here, Agent." (both). The unused `EXTERNAL player_name()` is removed from the phone ink |
| m3 | minor | The mole intercept's observation does the timestamp comparison | **Fixed.** Observation ends at "…by somebody who wanted a paper copy." The issue time is on the Threat Desk Summary |
| m4 | minor | Park's talk-down texted 4 s into the first visit | **Fixed.** Now on a return after backing off (`park_resolved === 'evaded'`); the `skipIfGlobal: park_resolved` that would have blocked it is gone; "upstairs" → "in the control room". The hub ask stays |
| m5 | minor | Post-abort music overrides `end` | **Fixed.** `!globalVars.grid_saved` on the threat, all-hostiles-KO and control-room music events |
| m6 | minor | "an hour after the abort" against the 9-minute fallback | **Fixed.** "not long after the abort" |
| m7 | minor | "Above expectations" plays for every outcome | **Fixed.** Only with a team sent and no step run; otherwise "You finished it, Agent. I will write the rest myself." |
| m8 | minor | Redirect cost promises health records; debrief settles dispatch only | **Fixed** in the debrief: "The dispatch and health-record keys were late in the sequence…" |
| m9 | minor | Recon guide implies two hosts | **Fixed.** "Their host turns up in a sweep. Find it first." Host count still needs checking against SecGen by the user (U3) |
| m10 | minor | Elena's "eighteen months / a year" | **Fixed.** Her study's worst case was eighteen months without spares; "They found spares since. Four to seven days, this time. In December, that's long enough." |
| m11 | minor | CyBOK maps story activity as player activity | **Fixed** (`mission.json`), judged from what the player does: "Coordinated attacks" and "Attack synchronization" moved to AB / Models; SS / Categories of Vulnerabilities added ("Misconfiguration", "Information leakage"); CPS keeps "Critical infrastructure protection", "Physical access control", "Lock bypass" (topic Physical Security) and drops ICS/SCADA, power grid and industrial control systems, which the player never touches. AAA "RFID authentication" kept: the player does get a badge accepted at the reader (m12 would make it stronger). NS and OSV keywords need checking against SecGen by the user (U3) |
| m12 | minor | The RFID cloner has no use | **Deferred** to the puzzle-chains stage, as the review hands it off |
| m13 | minor | m06's freeze-or-watch choice not acknowledged | **Fixed** (U2), fate-neutral: "Frozen or watched, the advances had already been paid. Tonight is what they paid for." |
| m14 | minor | Stale comments | **Fixed.** NFS guide comment (points at U4), the LOS comments, the timer file paths |
| m15 | minor | Park's unused VAR | **Fixed.** `found_mole_evidence` removed from Park's ink |
| m16 | minor | T-1 praises speed one minute from losing | **Fixed.** "Closer than the file suggested. Not close enough to be comfortable." |
| R M-2 | major | Netherton in the `male_spy_v2` placeholder; HaX with no bust | **Fixed.** Both Netherton NPCs use `netherton` (sheet, talk, visemes, headshot avatar), as m04. HaX (`agent_0x99`) gains `agent_hax_talk.png` and `agent_hax_visemes.png` beside the headshot avatar; the debrief's "Agent HaX:" lines resolve to her and draw that bust. No `spriteSheet` on her: she is a phone NPC and the validator rejects one (U7) |
| R M-3 | major | Required `*` inside the "(Optional)" aim | **Fixed** as directed: `secure_generator_room` and `recover_vault_pin` are `optional: true`. Engine side effect logged as U5 (the all-optional aim now completes on the generator hall) |
| R m-6 | minor | Elena's "page forty" choice without having heard it | **Fixed.** Gated on `asked_why` |
| R m-8 | minor | Elena gives the password and the vault PIN in one turn | **Fixed.** She gives the door password and the vault *rule* ("the last four of the serial on the transfer switch plate"), so the ATS-1 plate is still read; she no longer sets `vault_pin_found`. Flag 2 stays required and, when Elena already gave the door, HaX's flag-2 text treats the capture as corroboration ("Same door password as Elena's, so she told you the truth.") |
| R m-5 | minor | "Upstairs in the control room" on a same-level map | **Fixed** for Elena ("in the control room, through the north door"). Mercer's "service stair" exit left alone (a stair going down to the plant fits the map) |
| R m-10 | minor | Wall pictures outside `scada_control` | **Deferred**: not mission-side. The picture comes from the shared room maps (also seen outside the checkpoint's east wall in the browser check). U6, and the dressing stage |
| R m-11 | minor | Generator hall / cable vault look | **Deferred** to the room-dressing stage, as directed |

#### Decisions taken (fixer, with reasons)

- **Deduction wrong answer is the key count**, not "the casualty figure" the review suggested: the casualty figure *is* wrong in the brief, so marking it wrong would punish a correct reading. Both sources say 840 keys, so a player who reads carefully can rule it out.
- **The automatic verdict texts are gone**, not retargeted: the hub reply now says the verdict, and a second text would repeat it. A neutral prompt replaces them so a player who reads the decode and never calls is still pointed at HaX.
- **Elena gives the vault rule, not the digits**, rather than holding back the door password: the door password is her designed role (primary source), while the plate is the only thing that makes the plant hall a step. The flag 2 capture stays required (concludeRequires) and carries the operator password, so it never became optional.
- **T-10 bark in three rows** rather than one reworded line, because "too committed to move" is false for a team already in Austin and for a window an early login has already shut.
- **Park's entry chat repeats on every entry** (as the review asked) and a third visit has its own line; Park's cone stays undrawn because nothing checks it.
- **`revision_found_open` also latches on the commit**, so a player who heard Elena before sending the team elsewhere is not told the window was shut.

#### Route driver

New `scripts/ink_runtime_check/m07_routes/route.js`: m05's driver (renders the erb and runs the real eventMappings) plus m04's clock model (`advance`, `hud`), `flag` (the relay's real flagRewards and task), `task` (with onComplete), `creditsSaid`/`creditsNotSaid`, and `"expect": null` for "no music event fires". Ink `#complete_task` raises `objective_task_completed`, as the engine does. Five routes, all expectations met:
- `r1_deduce_redirect_open.json`: Fracture; Hollis challenged on sight and talked round; one wrong deduction then the right one; HUD window; T-10 at 30 min with the window open; redirect; door before login; page reload of the phone; debrief and credits.
- `r2_found_after_window_login_first.json`: Meltdown; Hollis backed off, re-sighted, slipped past; T-10 nothing-found branch; window shuts at 40; the closed-window redirect refusal; Elena turned (rule not digits, no page forty); flag 2 corroboration; login before the door; clock runs out; Park entry, back-off, second and third visits, HaX's text on the return; post-abort fight keeps the end track; found-after-the-window debrief and credits.
- `r3_trojan_direct_hollis_ko_early_login.json`: Trojan Horse from the briefing; Hollis goes loud and is knocked out; two wrong picks then the manifest; no redirect offer, no HUD window; login at 22 min shuts the window before T-10; T-10 closed branch; post-abort music; Trojan-direct debrief.
- `r4_elena_first_commit_after_declined.json`: briefing closed uncommitted; Elena's correction before any commit (deduction option hidden); commit on HaX's hub latches `revision_found_open`; HUD window; page reload; redirect declined; page forty after asking why; flag-2 warning; window shuts; debrief fallback timer; "weighed, and held" and "You knew".
- `r5_never_committed.json`: no team ever; deduction with no team; flag 3 uncommitted text; never-committed debrief lines and credits.
Each route ends with a run-length guard: the longest run is the debrief's read-out (55–63 lines without a choice; the M1 beat added about 3). That is pre-existing and goes to the dialogue stage.

#### Checks

- Ink compiles (8 files; the one END warning is the briefing's handoff, as before).
- Validator, full: schema passed, geometry and doors OK. 14 warnings: 10 duplicate-mapping notes (7 before; the new ones are the commit/`revision_found_open` pair, the flag-2 rows and the `scada_door_reached` latch beside the debrief backstop, all intended or disjoint) and 4 for the repeatable person-chats (Hollis's sight challenge, Park's entry chat), deliberate as m04's. The earlier toast-timing and synced-VAR warnings were fixed (rows made visibly disjoint; VAR commented as a synced global).
- dialoguelint: 0 errors (three line-length errors in new lines were fixed); the "however" and "Not to this room" style flags and 6 blank-reentry checks are pre-existing, left for the dialogue stage.
- reopencheck (m07 block in `missions.json` updated with the three new globals): 0 problems for both m07 phones.
- inkcheck and loopcheck over a state matrix (HaX at start and hub: committed, Trojan Horse, window shut, after the abort; the deduction menus; debrief open-window and expired; Architect T-10 closed and Trojan; Elena; Park evaded; Hollis; briefing): no failing paths, no runaways, no runtime errors.
- tagdiff against HEAD: 82 structural differences, all from the changes above (HaX's deduction knots and gates; the debrief branches and two VARs; Architect T-10 conditions; Elena's removed `vault_pin_found` tags and the `asked_why` gate; Park's VAR and repeat-visit branch). Mercer, Hollis and the briefing structure unchanged.
- `python3 scripts/check_door_alignment.py`: all doors OK.
- Browser (keyless :3001, headless, load about 21, game 2391, log `tools/playtest/m07-pass5-align-r1-game2391.jsonl`): briefing driven by hand to a Fracture commit; nothing fired while the tutorial prompt was up; a few seconds after declining it, Hollis (at 112,171) challenged the player at the start spot (160,144) with his `challenge` knot; "Back off" set `hollis_backed_off` and the chat did not reopen while the player stayed in view; the cone is drawn. Screenshots in the session scratchpad `m07-align-r1-fixer/`. The session was synced, quit and stopped. A short check only, so `verify-run.rb` was not run (no room beyond the first was entered).

#### Spoken lines changed (old → new)

No m07 audio exists yet; listed for the record.

HaX, phone (`m07_phone_agent_0x99.ink`):
- "HaX here, {player_name()}. I've got your channel and the board." (twice) → "HaX here, Agent. I've got your channel and the board."
- "…It's on the record. I'm not reopening it." → "…It's on the record. It'd take something new to move it."
- "You pay for it with the operation you abandon. Your call." → unchanged, plus new "And it's now or never. Once you log in on their host, the team stays where it is."
- "The attack host and its backup server both turn up in a sweep. Find them first." → "Their host turns up in a sweep. Find it first."
- New (`vm_hint_3`, conditional): "And if you mean to move the team, do it before you log in. Once they see you, it stays where it is."
- New (deduction): "Go on. Which operation?"; "Austin. What's wrong with it?"; "That isn't what I'm reading. Look again."; "Still not what I'm reading. Put their rows next to the desk summary, line by line."; "Yes. Nine days, and dispatch keys on the manifest. Austin was briefed low on purpose."; "One authority signing for all four. One operation wearing four coats." (also still in `topic_traffic`); "The team's already in Austin. You picked the one that was worse than the brief said."; "The window's shut. It goes in the report as found, not as ignored."; "That's grounds to move the team. The window's open until they're too committed, or until you log in on their host. Whichever comes first."; "The team's still waiting on your call. If you're making it now, that's where it goes."

HaX texts (`scenario.json.erb`):
- Nudge: "…Read the Austin row against the threat desk summary in your kit." → "…Read it against the threat desk summary in your kit."
- Removed: "That's their own table. Austin was briefed low on purpose. If the team isn't where it should be, call me while there's still time."; "…The window's shut. It goes in the report."; "That's their own table. The team's already in Austin. You picked the one that was worse than the brief said."
- New: "If a row in there doesn't match what we were told, call me and say which."
- Elena verdict, open window: "…If the team's in the wrong place, call me while there's time." → "…If the team's in the wrong place, call me before you log in on their host."
- New (flag 2, Elena already gave the door): "Their listener gives out passwords in clear. Same door password as Elena's, so she told you the truth. Capture's in your inventory. Name and password: want the SSH guide?"
- New (flag 2, team still movable): "Before you log in: if the team's moving, move it now. Once they see you on that host, it stays where it is."
- Park: "…Mercer's signed projection is upstairs. Show him that." → "…Mercer's signed projection is in the control room. Show him that."

The Architect, barks (`scenario.json.erb`): "Ten minutes left, Agent 0x00." → "Ten minutes before your team is too committed to move, Agent 0x00." / new "A word about Austin, Agent 0x00." / new "You logged in, Agent 0x00. A word about doors."

The Architect (`m07_architect_comms.ink`):
- "Whatever you have just learnt, you've learnt it too late to move anybody. That happens." → "You logged in. The door closed behind you."
- New: "You moved them. I had wondered whether you would."; "You sent them to the one with no bodies in the brief. I'd like to know what you saw."
- "The beauty of entropy is that it doesn't require me to win." → "The beauty of entropy is that it doesn't require me to win. Ten minutes, and your team is too committed to move."
- "Impressive. Genuinely. You've moved faster than the file suggested." → "Closer than the file suggested. Not close enough to be comfortable."

Debrief (`m07_closing_debrief.ink`):
- Narrator: "A borrowed office at the grid site, an hour after the abort. …" → "…, not long after the abort. …"
- New (Netherton): "Their backup server shared its coordination file with anyone who asked. Its listener read the operator's password to anyone who connected. And that account could make itself root."; "Three doors they left open, and you went through all of them before the clock did." / "Three doors they left open. You went through all of them."; "You logged in on their host before the control room door was open. The clock ran while you were on the wrong side of it."; "You opened the door before you touched their host. That is the order that kept it clean." / "…kept it to one step."
- "The dispatch keys were late in the sequence. The team reached them first. Nobody's ambulance goes missing." → "The dispatch and health-record keys were late in the sequence. …"
- New: "The team was never committed, on that or on anything else."; "You found it after the window had closed. That is in the report as found, not as ignored."; HaX "You found the thing that was built not to be found. The timing was his, not yours."; HaX "You found it, and the team still went nowhere."; HaX "You found it after the window shut. I'm writing that down too, in those words."; "You finished it, Agent. I will write the rest myself."

Elena (`m07_npc_elena_rodriguez.ink`):
- "Say the second half of that again. Ninety days." → "Told? Nothing. I was copied on their schedule. What were you told about Austin?"
- "I wrote a cascade study in 2019. Twenty-three transformers, no spares, eighteen months to build replacements." → "I wrote a cascade study in 2019. Twenty-three transformers. If the spares were gone, eighteen months to build replacements."
- "One bad afternoon and you lose a region for a year." → "They found spares since. Four to seven days, this time. In December, that's long enough."
- "He's upstairs in the control room. He won't come down. …" → "He's in the control room, through the north door. He won't come out. …"
- "Cable vault keypad: 4703. Mercer's tech reset it after my survey, so the plant log's out of date." → "Mercer's tech reset the vault keypad after my survey. The plant log's out of date." + "The new code is the last four of the serial on the transfer switch plate."
- "CascadeWindow19. Vault keypad is 4703." → "CascadeWindow19. The vault code is the last four of the serial on the transfer switch plate."
- "Control room door is CascadeWindow19. Vault keypad is 4703." → "Control room door is CascadeWindow19. Vault code is the last four of the serial on the transfer switch plate."
- Player choices (not voiced): "The Austin operation. They briefed it as no fatalities, dormant for ninety days." → "The other three operations tonight. What were you told about them?"; "Ninety days dormant…" → "Dormant ninety days. No projected fatalities. That's our brief."; "Why? What do you know about Austin?" → "Why Austin?"

Park (`m07_npc_thomas_park.ink`), new: Narrator "He doesn't look round. The flashlight stays on the wire."; "I said there wasn't a third."

Briefing (`m07_opening_briefing.ink`), new: "Frozen or watched, the advances had already been paid. Tonight is what they paid for."; "Portland has been on our contingency board since Thursday, with you pencilled in as the nearest agent. Tonight's intercept told us it was live, and gave us the other three."

#### Open after round 1

- U5 (all-optional aim completes early), U6 (shared-map pictures), U7 (no phone spriteSheet) in `DECISIONS_PENDING.md`.
- m12 (cloner route) to puzzle chains; the debrief's long read-out and the pre-existing dialoguelint flags to the dialogue stage; generator hall and cable vault look to room dressing.
- Browser checks still owed: Park's entry chat (hostile, talked down, evaded), the T-10 bark at 30 minutes with the window open, the HUD redirect timer appearing after the deduction and clearing on flag 3, the deduction menus on the phone, the debrief branches, HaX's and Netherton's busts in the debrief.
- Needs checking against SecGen by the user: the three-doors description in the debrief and the ATTACK HOST credit (share, listener password, root via the operator account), the one-host wording, and the CyBOK NS/OSV keywords (U3).
