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

### Stage 2 alignment, round 2 (fixer)

Review: `ALIGNMENT_REVIEW_P5_C2.md` (0 blockers, 2 majors, 9 minors), plus N1 and N2 from the round-1 browser check (`PASS5_ALIGN_R1_BROWSER.md`). Orchestrator decisions applied: U5 (drop "(Optional)", two tasks required again) and m7 (Park's third visit sends him hostile). Every finding was checked against `scenario.json.erb` and the ink before acting. No SecGen XML and none of the four restricted field guides were opened. No browser session was started this round.

Counts: 0 blockers, 2 majors, 11 minors (9 review + 2 browser). All fixed; none deferred.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| A1 | major | A late-opened T-10 call says "You logged in" to a player who never did | **Fixed.** `taunt_t10` branches `team_redirected` first, then `cascade_armed` ("You logged in…"), then a new time-shut branch on `redirect_window_closed` ("Forty minutes. Your team is committed now, wherever you left it."), then Trojan Horse, discrepancy, nothing found. The third bark row keys on `cascade_armed === true`; the first two rows also need `!cascade_armed`, so the three stay disjoint. Routes r6 (late open, no login) and r7 (redirected, then a login at minute 22) |
| A2 | major | Debrief and credits say the correction was never read to a player who read the decode | **Fixed.** The debrief declares `found_coordination_traffic`. In `revision_payoff`, a reader hears "Their own schedule was in your hands tonight. The Austin row said nine days. Nobody put it next to the brief."; "Two copies. Nobody read them." stays for a player who never read it. `dark_trojan` adds HaX's "It was in your hands. Nine days, in their own table." The PROJECTION UNCHALLENGED credit is split on `found_coordination_traffic`. Route r8 |
| m1 | minor | Informed Trojan commit told "You had no way to know" | **Fixed.** New latch `revision_before_commit` (HaX mapping on `team_assigned` while `projection_revised`). `covered_trojan_direct` and the Trojan block of `revision_payoff` branch on it. Route r9 |
| m2 | minor | Correction held, commit elsewhere after a login, told "found it after the window had closed" | **Fixed** with the same latch: a `revision_before_commit` branch in the found-late block, and in `dark_trojan`. New credit "CORRECTION IN HAND BEFORE THE CALL: the team went elsewhere" (warning). The AFTER THE WINDOW SHUT credit excludes it. Route r10 |
| m3 | minor | Decode read with the window open, deduction late: "The timing was his" lets the player off | **Fixed.** New latch `decode_read_open`, set by two mappings: the decode read while the window is open with the team elsewhere, or the decode already read at the commit. The found-late block has a `decode_read_open` branch ("Their schedule was in your hands with the window open…" / HaX "Late is still found…"). HaX's `deduce_right` says the same on the phone ("…It goes in the report as late."), so the phone and the debrief agree. New credit "CORRECTION FOUND LATE" (warning). The AFTER THE WINDOW SHUT credit excludes it. Route r11 |
| m4 | minor | The deduction can be brute-forced; right answers spell out the values | **Fixed.** The second menu names fields only: "The dormancy." / "The manifest." / "The key count." / "The site." (key count and site wrong). `deduce_right` still says the values back. "Costs nothing" kept. Route r11 checks the four choices and that the old values are gone |
| m5 | minor | U5 not applied | **Fixed.** Title "Trace How They Got In"; `optional` removed from `secure_generator_room` and `recover_vault_pin`; comment rewritten. `DECISIONS_PENDING.md` U5 notes it. Browser look still owed |
| m6 | minor | Hollis's re-sighting line says he can't see the player | **Fixed.** `wary_again` narration and line rewritten (below). r2 updated |
| m7 | minor | Park's third-visit threat is empty | **Fixed** (orchestrator's choice). The third visit says "I said there wasn't a third." and diverts to `goes_loud.swing` (a new stitch, the same narration, `park_resolved: ko`, hostile) without "Right.". The entry-chat mapping already skips `ko`. r2 now ends Park hostile and checks the "Fought off, not stopped" credit |
| m8 | minor | Elena's team lines and HaX's first Elena verdict misread Trojan, redirected and uncommitted players | **Fixed.** Elena's two team lines need `team_assignment != "trojan_horse"`. A team in Austin hears "If your people are in Austin, they're in the right place. Tell them about dispatch." (route r9). HaX's open-window verdict row needs `team_assigned === true`. A new disjoint row for an uncommitted player says "One frightened engineer, but it fits. When you call the team, that's where it goes." (r4 checks it) |
| m9 | minor | Tidy-ups | **Fixed.** T-20's uncommitted branches ("Or you haven't…", "Choose slowly…") are removed with a comment, because T-20 starts only on a commit. The T-10 order is covered by A1. Elena's unused `EXTERNAL player_name()` is removed |
| N1 | minor | Stance praise after "You knew… it did not move" | **Fixed.** The hardened stance's "Almost nobody gets there this quickly" and the handoff's "Above expectations" are both withheld when `revision_found_open and not team_redirected and not redirect_declined`. The alternatives are "Yes. You had one of his numbers in your hands tonight. Next time it moves the team." and "You finished it, Agent. I will write the rest myself." A redirect weighed and declined keeps the praise, because the debrief already records it as a decision (r4 unchanged). Route r12 |
| N2 | minor | Mercer credit "during the abort" when he left before it | **Fixed.** "Left before the cordon closed — no trace". This matches the debrief's "left before the cordon closed" and holds for either timing. Route r12 |

#### Decisions taken (fixer, with reasons)

- **N1 spares a declined redirect.** The browser case was a player who let the window pass without asking. A player who asked for the cost and said no hears "on the record as a decision", so withholding praise from them as well would punish a deliberate call. r4 still expects "Above expectations".
- **`deduce_right` gets a late branch** that the review didn't ask for. Without it, HaX tells an m3 player "found, not ignored" on the phone and the debrief then says "late".
- **`decode_read_open` also latches at the commit**, so a decode read before the team was sent counts as in hand once the window opens.
- **T-10 bark rows 1-2 gain `!cascade_armed`**, so all three rows stay disjoint now that row 3 keys on the login.
- **Park's third visit reuses the `goes_loud` narration** through a stitch rather than "I said there wasn't a third." followed by "Right.", which read as two answers.

#### Route driver

New routes, all expectations met: `r6_t10_late_open` (was probe p1), `r7_t10_redirected_then_login`, `r8_decode_read_not_deduced` (was p2, now played from the flags rather than preset globals), `r9_informed_trojan` (was p3, played: deduction with no team, then Trojan on the hub, then Elena), `r10_informed_commit_after_login`, `r11_decode_open_deduced_late`, `r12_open_window_held_hardened`. Changes to existing routes: r2 (Hollis's new line, Park's third visit hostile, the Park credit) and r4 (the uncommitted Elena verdict text). r1-r12: all twelve pass. The longest run is still the debrief read-out (58-66 lines), which belongs to the dialogue stage.

#### Checks

- Ink compiles (8 files; the briefing's END warning as before).
- Validator, full: schema passed, geometry and doors OK. 11 duplicate-mapping notes (10 before). The new one is `team_assigned` with four handlers: the commit text, `revision_found_open`, `revision_before_commit` and `decode_read_open`, independent latches meant to fire together. There are also 4 repeatable person-chat warnings (deliberate, as before) and 10 dialogue-lint style notes (unchanged).
- dialoguelint: 0 errors; transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6, all pre-existing.
- reopencheck (`missions.json` m07 globals gain `revision_before_commit`, `decode_read_open`): 0 problems for both m07 phones.
- inkcheck and loopcheck over a state matrix: Architect T-10 closed by time, and redirected with a login; T-20 meltdown; the debrief with decode read, informed Trojan, informed Fracture, decode open/late, open window; the phone deduction with the window shut and `decode_read_open`; Elena with Trojan and uncommitted; Park evaded and fresh; Hollis backed off. No failing paths, no runaways, no runtime errors.
- tagdiff against HEAD: 47 structural differences, all from the changes above. Mercer and briefing structure unchanged.
- `check_door_alignment.py`: all doors OK.

#### Spoken lines changed (old → new)

No m07 audio exists yet; listed for the record.

The Architect (`m07_architect_comms.ink`):
- New (T-10, window shut by time): "Forty minutes. Your team is committed now, wherever you left it."
- T-10 order: "You moved them…" now plays before "You logged in. The door closed behind you."; the login line now needs the login (`cascade_armed`).
- Removed (unreachable): "Or you haven't. The clock does not care either way, and neither, particularly, do I."; "Choose slowly. I have all evening."
- Bark "You logged in, Agent 0x00. A word about doors.": text unchanged, now keyed on `cascade_armed`.

Debrief (`m07_closing_debrief.ink`):
- "You had no way to know what you were choosing. I would like it noted that you chose it anyway." stays; new alternative for an informed commit: "You read their schedule before you made the call, and sent the team where the brief said nothing would happen. I would like that noted."
- "The team was already there. You found out what you had chosen while they were stopping it." stays; new alternative: "The team was already there. You found it before you chose, and you chose Austin."
- New (held before the commit, sent elsewhere): "You had it before you made the call, and sent the team elsewhere." (HaX follows with her existing "I logged it. You found the thing that was built not to be found. That's the part I'd keep.")
- New (decode read open, deduced late): "Their schedule was in your hands with the window open. You put it against the brief after it shut." / HaX "Late is still found. It goes in the report as late."
- "The evidence was in that building tonight. Two copies. Nobody read them." stays for a player who never read the decode; new for a reader: "Their own schedule was in your hands tonight. The Austin row said nine days. Nobody put it next to the brief."
- New HaX (`dark_trojan`): "You had it before you sent them anywhere. That goes in the report too."; "It was in your hands. Nine days, in their own table."
- "Yes. Almost nobody gets there this quickly." stays; new alternative when the window passed without a decision: "Yes. You had one of his numbers in your hands tonight. Next time it moves the team."
- "Above expectations, Agent…": same text, now also withheld in that case (falls to "You finished it, Agent. I will write the rest myself.").

HaX, phone (`m07_phone_agent_0x99.ink`):
- Player choices (not voiced): "Dormancy. Theirs says nine days. Ours says ninety." → "The dormancy."; "The manifest. EHR and CAD: health records and dispatch." → "The manifest."; "The key count. Theirs isn't eight hundred and forty." → "The key count."; new "The site."
- New: "The window's shut. You had their schedule while it was open. It goes in the report as late."

HaX texts (`scenario.json.erb`), new: "One frightened engineer, but it fits. When you call the team, that's where it goes."

Ray Hollis (`m07_npc_ray_hollis.ink`):
- Narrator: "He is jumpier now. The flashlight comes up fast." → "He is jumpier now. The flashlight comes up fast, and this time it finds you."
- "Something's in here. I know something's in here." → "There you are. I knew something was in here."

Thomas Park (`m07_npc_thomas_park.ink`):
- Narrator (third visit): "He doesn't look round. The flashlight stays on the wire." → "He sets the wire down on the mat without looking round."
- "I said there wasn't a third." unchanged, now followed by the existing "He comes up off his knees with the crimping tool swinging." and a hostile Park, not the hub.

Elena Rodriguez (`m07_npc_elena_rodriguez.ink`), new: "If your people are in Austin, they're in the right place. Tell them about dispatch." Her "…you sent them on those numbers." and "…I'm sorry. I'd rather have known this in June." no longer play for a team in Austin.

Credits (`scenario.json.erb`):
- "DR. JAMES MERCER (BLACKOUT): Left the building during the abort — no trace" → "…Left before the cordon closed — no trace"
- New: "CORRECTION IN HAND BEFORE THE CALL: the team went elsewhere"; "CORRECTION FOUND LATE: their schedule was read with the window open, put against the brief after it shut"; "PROJECTION UNCHALLENGED: Their schedule was read; the Austin row was never put against the brief".

#### Open after round 2

- Browser checks still owed: the U5 aim no longer folding on the generator hall; Park's third visit turning him hostile in the vault, and his KO and talked-down outcomes; the T-10 late open after minute 40; the new deduction menu wording on the phone; the debrief branches above.
- Needs checking against SecGen by the user (U3, unchanged): the three-doors line and the ATTACK HOST credit, one host, the CyBOK NS/OSV keywords, and whether flag 4 can be reached before flag 3.
- U4 (NFS guide URL), U6 (shared-map pictures), U7 (HaX phone spriteSheet) unchanged. No new engine items.

### Stage 2 alignment: CLOSED (orchestrator, 2026-10-14)
Cycle 3 review 0/0/6 (`ALIGNMENT_REVIEW_P5_C3.md`) and round-2 browser check all six items pass (`PASS5_ALIGN_R2_BROWSER.md`, games 2409/2414). Carried into puzzle chains: C1, C2 (debrief latches), browser N1 (Hollis "talked" debrief line contradicts his refusal; major, pre-existing), N2 (hostile Park chases and KOs a fleeing player; tune like m06's Kemal), N3 (praise after "Nobody put it next to the brief"), m12 (RFID cloner route). C3–C6 to the dialogue stage.

### Stage 2 puzzle chains, round 1 (fixer)

Review: `PUZZLE_REVIEW_P5_C1.md` (0 blockers, 3 majors, 7 minors), with C1 and C2 taken from `ALIGNMENT_REVIEW_P5_C3.md` as written. Each finding was checked against `scenario.json.erb`, the ink and the engine before acting. No SecGen XML and none of the four restricted field guides were opened. No browser session was started.

Counts: 0 blockers, 3 majors, 7 minors. All fixed; none deferred. C5 (alignment cycle 3) closes with F1. C3, C4 and C6 stay with the dialogue stage.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| F1 | major | HaX's return text sends the player for the projection, and the next visit makes Park swing | **Fixed.** `VAR park_returns`, incremented at the top of `back_at_it`; `back_at_it` branches on it, not on its visit count, so the count survives a page reload (closes C5). A third visit carrying the projection goes to a new `last_chance` knot ("…in his fist, and waits." / "I said there wasn't a third. You've got one sentence."), with "(Hold up the projection.)" → `projection` and "(Step back.)" → a new `goes_loud.lunge`. Without the projection the third visit still swings (r2). `goes_loud` now ends in a shared `turned` stitch (the KO tags), reached from `swing` and `lunge`. HaX's return text and `topic_park` say to carry it back. Routes r13 (p1 flipped: talked) and r18 (page reload between visits, then step back: hostile) |
| F2 | major | Hollis, Park and Mercer fight at engine defaults, with no HaX controls text | **Fixed.** `behavior.hostile` as proposed: Hollis 100 / 4 (beside his patrol), Park 80 / 4, Mercer 70 / 3, all `pauseToAttack`. Three HaX texts on `npc_hostile_state_changed` (m06's pattern, keyed on `data.npcId`, `data.restored !== true` so a reload's restore doesn't repeat them), each with the controls and "Or walk away: he's slower than you." The route driver now passes `npcId` with the hostile event. r2 checks Park's text, r3 Hollis's. Mercer's text has no route (no route turns him hostile); browser check owed |
| N1 | major | Debrief says Hollis "waited for the police" on the route where he walks out | **Fixed** with the review's two lines (below) |
| F3 | minor | The RFID Cloner has nothing to clone | **Fixed.** Hollis has `rfidCard` (`server_zone_badge`, EM4100, "Server Zone Badge - R. Hollis"); `card_id` matches the reader's `requires`, so a saved clone opens it (`unlock-system.js` `hasValidClone`). His hub offers "Keep him on the money. Let the cloner read his belt." once `pressed_once` (after the stakes exchange), and not after a clone or with a badge already held. The `clone` knot runs `#clone_keycard:server_zone_badge` (tag on an unvoiced throwaway line, m05 Owen's shape); `clone_debrief` reads the synced `hollis_cloned`. On success he never notices, `hollis_backed_off` is set and the chat closes, so reaching the server hall records `evaded` (credit "Evaded — still on the checkpoint desk"). A cancelled read returns to the hub with the choice still there. A HaX `card_cloned` mapping sets `hollis_cloned` and `badge_obtained` and texts the lesson. Costs: no vault rule, no Park tip, he stays bought. The reader still opens the cloner screen for a player with no card and no clone ("No keycards in inventory"); that is engine behaviour (DECISIONS_PENDING U9), and the screen now has a use. Route r14. The route driver handles `#clone_keycard` (emits `card_cloned` with the NPC's `rfidCard` name) |
| F4 | minor | HaX's vault hint ignores a rule already given | **Fixed.** `vault_hint` checks `hollis_resolved == "talked" or elena_outcome == "turned"` first |
| F5 | minor | Elena KO text says the vault code is in the notes | **Fixed** ("How to read the vault code is in their site notes…") |
| F6 | minor | Stale comments | **Fixed.** The aim-chain and optional-task comments describe `trace_the_intrusion` and U5; Elena's comment says "the rule for reading the vault code"; the kit comment names the clone route and the unused print kit |
| C1 | minor | Informed commit elsewhere with the window open reads as passivity | **Fixed** as written: a `revision_before_commit and not redirect_declined` branch first in `revision_payoff`'s window-open block; a `dark_trojan` branch (also `not redirect_declined`, so r4's declined player keeps "You knew. You found it and it did not move."); credits: "the team was not moved" excludes `revision_before_commit`, "CORRECTION IN HAND BEFORE THE CALL" drops `!revision_found_open` and gains `!redirect_declined && !team_redirected`. Route r15 (was q1) |
| C2 | minor | A decode read before the commit isn't latched | **Fixed** as written: new latch `decode_before_commit` (HaX mapping on `team_assigned` with the decode read and no deduction; declared in `globalVariables`, the debrief, the phone and `missions.json`). `covered_trojan_direct` and the found-late block get their branches; `deduce_right`'s late wording also covers it. Credits: a separate neutral line "CORRECTION FOUND LATE: their schedule was read before the call, put against the brief afterwards" rather than widening the window-open one; "AFTER THE WINDOW SHUT" excludes the latch. Routes r16 (q2) and r17 (q3) |
| N3 | minor | Praise after "Nobody put it next to the brief" | **Fixed.** The handoff gate gains `not (found_coordination_traffic and not projection_revised and team_assignment != "trojan_horse")`; "defended" gets an alternative second line for that player. r8 (already the defended stance) now checks it; r19 is r8 with the hardened stance |

#### Decisions taken (fixer, with reasons)

- **Hostile texts on `npc_hostile_state_changed`, not on the `*_resolved == 'ko'` globals.** The review suggested the globals. The hostile event is the m06 pattern, and its `restored` flag is the engine's own guard against a reload repeating the text. Mercer's ink writes `mercer_fate = "ko"` on hostility, but Hollis and Park would need three different global names; one event covers all three.
- **Park's "(Step back.)" gets its own narration (`lunge`).** `swing` says "He comes up off his knees", and in `last_chance` he is already standing.
- **The hardened stance also loses its speed praise for the N3 player** ("Yes. Their schedule was in your hands tonight. Next time it goes next to the brief."). The review named only "defended" and the handoff, but "Almost nobody gets there this quickly" would follow the same line.
- **C1's HaX line spares a declined redirect,** matching the Netherton branch it sits beside; otherwise r4's established wording changes for a player who made a deliberate call.
- **C2's late credit is a separate line,** because the existing one says "with the window open", which isn't true for q3.
- **HaX's Park hint was cut to the 30-word text cap.** "That'll be their plant man" and "Show him that" went; the new text keeps "briefed on a building, not a body count".
- **The clone choice hides when a badge is already held,** since a second route to an open door is noise.

#### Route driver

New routes, all expectations met: `r13_park_last_chance_with_projection` (was p1), `r14_hollis_clone`, `r15_informed_commit_open_not_declined` (q1), `r16_decode_read_then_trojan_undeduced` (q2), `r17_decode_uncommitted_login_commit_then_deduce` (q3), `r18_park_reload_last_chance_step_back`, `r19_decode_read_hardened`. Changed: r2 (new HaX Park text, Park's hostile controls text, no last chance without the projection), r3 (Hollis's hostile controls text), r8 (N3 defended line, no "Above expectations"). `route.js`: the hostile event carries `npcId`; `#clone_keycard` emits `card_cloned`. r1–r19: all nineteen pass. The longest run is still the debrief read-out (dialogue stage).

#### Checks

- Ink compiles (8 files; the briefing's END warning as before).
- Validator, full: schema passed, geometry and doors OK. 11 duplicate-mapping notes as before (`team_assigned` now has five independent latches: the commit text, `revision_found_open`, `revision_before_commit`, `decode_read_open`, `decode_before_commit`). The 4 repeatable person-chat warnings (deliberate) and 10 dialogue-lint style notes are unchanged.
- dialoguelint: 0 errors (three new HaX texts first ran over the 30-word cap and were cut); transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6, all pre-existing.
- reopencheck (`missions.json` m07 globals gain `decode_before_commit`, `hollis_cloned`): 0 problems for both m07 phones.
- inkcheck over a state matrix (Park fresh, evaded with and without the projection at `park_returns` 0 and 1; Hollis fresh, cloned, with the paperwork; the phone with Hollis talked, Elena turned, `decode_before_commit` with the window shut, Park evaded; the debrief for q2, q3, q1, r8 and Hollis talked): no failing paths, no runaways. loopcheck on Park, Hollis, the phone and the debrief: no runtime errors.
- tagdiff against HEAD: 58 structural differences, all from the changes above. Briefing, Architect, Elena and Mercer structure unchanged.
- `check_door_alignment.py`: all doors OK.

#### Spoken lines changed (old → new)

No m07 audio exists yet; listed for the record.

Thomas Park (`m07_npc_thomas_park.ink`), new (third visit carrying the projection): Narrator "He comes up off his knees with the crimping tool in his fist, and waits."; "I said there wasn't a third. You've got one sentence."; Narrator (after "(Step back.)") "You give ground. He comes after you with the crimping tool." Player choices (not voiced): "(Hold up the projection.)", "(Step back.)".

Ray Hollis (`m07_npc_ray_hollis.ink`), new (clone route): Narrator "You ask how much again, and step in close while he works out an answer."; Narrator "He keeps talking about retainers."; Narrator "He's still talking when you step back. He never looks at his belt."; "Are we done? Go on, then."; Narrator (failed read) "The cloner didn't get a clean read. He's watching your hands now." Player choice (not voiced): "Keep him on the money. Let the cloner read his belt."

Debrief (`m07_closing_debrief.ink`):
- "Ray Hollis walked to the muster point and waited for the police. He is giving a full statement, payment included." / "He did not have to wait." → "Ray Hollis handed over his badge and walked out through the muster door. The police picked him up at the gate. He has given his name and nothing else, yet." / "He told you about the vault and the man on the riser. That is more than he has told us."
- New (C1): "You had it before you made the call, and sent the team elsewhere. The window stayed open after that."; HaX "You knew before you sent them, and you sent them somewhere else. That's the sentence I'm writing."
- New (C2): "Their schedule was in your kit when you made the call. Whatever you read in it, you sent them to Austin."; "Their schedule was in your hands before you sent the team anywhere. You put it against the brief afterwards." (HaX follows with the existing "Late is still found. It goes in the report as late.")
- New (N3): defended "That answer will stand up in a review room. You also had their schedule in your hands tonight, and you didn't put it next to the brief." (replaces "Good. That answer will stand up in any review room you ever sit in." for that player); hardened "Yes. Their schedule was in your hands tonight. Next time it goes next to the brief." (replaces "Yes. Almost nobody gets there this quickly." for that player); "Above expectations…" withheld for that player.

HaX, phone (`m07_phone_agent_0x99.ink`), new: "He won't wait for a third look. Have it in your hand when you go back down." (`topic_park`); "You've been told already. The plate on the transfer switch, in this hall. Last four of the serial." (`vault_hint`). "The window's shut. You had their schedule while it was open. It goes in the report as late." now also plays for `decode_before_commit`.

HaX texts (`scenario.json.erb`):
- "That'll be their plant man. He was briefed on a building, not a body count. Mercer's signed projection is in the control room. Show him that." → "He was briefed on a building, not a body count. Mercer's projection is in the control room. Carry it back down with you. He won't wait a third time."
- "She's not talking now. You don't need her. The vault code's in their site notes off the share, and their listener leaks the control room password." → "…How to read the vault code is in their site notes off the share, and their listener leaks the control room password."
- New: "He's coming for you. Q for fists, then E or click when he's in front. Or walk away: he's slower than you. Q again stows them, then click to walk." (Hollis); "Park's swinging. Q for fists, …" (same tail); "Mercer's coming at you. Q for fists, …" (same tail); "Got it. His badge never left his belt. Anyone who stands that close can walk off with a copy." (clone).

Credits (`scenario.json.erb`), new: "CORRECTION FOUND LATE: their schedule was read before the call, put against the brief afterwards". Conditions changed on "CORRECTION FOUND WITH THE WINDOW OPEN", "CORRECTION IN HAND BEFORE THE CALL" and "CORRECTION FOUND AFTER THE WINDOW SHUT".

#### Open after round 1

- Browser checks owed: Park's return with the projection (last chance) and the step-back chase; the three chase speeds and HaX's controls texts (Hollis at the start spot, Park out of the vault, Mercer at the console); the clone at Hollis (minigame returns to his chat, `clone_debrief` reads the clone, the reader opens on the saved clone, and the clone survives a page reload); the N1 debrief line.
- For cycle 2: whether four routes to the badge (talk, printer, KO, clone) reads as too many.
- Engine items to `DECISIONS_PENDING.md`: U9 (cloner screen with nothing to emulate), U10 (`chaseRange` unread). Fingerprint kit carried unused: U8.
- Needs checking against SecGen by the user (U3, unchanged).
