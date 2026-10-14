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

### Stage 2 puzzle chains, closing fix round (fixer, 2026-10-14)

Review: `PUZZLE_REVIEW_P5_C2.md` (F7, F8, F9; F10 stays with the dialogue stage) and `PASS5_PUZZLE_R1_BROWSER.md` (N1, N3). No SecGen XML and none of the four restricted guides were opened. No browser session. Nothing committed.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| F7 | minor | The clone is offered before the player has seen the reader, and its record matches the printer's | **Fixed.** `VAR inside_reached` added to `m07_npc_ray_hollis.ink` (line 32, synced global set at erb:1020); the clone choice at ink:99 (was :96) now needs `pressed_once and inside_reached and ...`. The `card_cloned` mapping (erb:1087-1092) also sets `hollis_backed_off: true`, so a reload between Save and the chat resuming still records `evaded`. New credit "RAY HOLLIS: Badge copied off his belt — he never knew, still on their payroll" (erb:228), and the plain Evaded line (erb:229, was :228) now has `!hollis_cloned`. A comment on `VAR hollis_backed_off` marks it as a synced global (the validator asked). `inside_reached` was already in `missions.json` for m07 (line 1079). Route r14 rewritten: the choice is hidden after the stakes exchange, the player backs off, HaX offers "RFID guide?" on the ops floor, the next sighting offers the clone, the credit is the new one |
| F8 / N1 | minor | HaX's controls texts say "Q again stows them" and promise that walking away works | **Fixed.** Three texts (Hollis erb:1050, Park erb:1062, Mercer erb:1074; were 1045, 1051, 1057) now read "<opener> Q switches to fists (again for a harder punch), then E or click when he's in front. Face him squarely." (24 words), each followed by a second text at 5.5 s (erb:1056, 1068, 1080): "Keep pressing Q until the open hand shows to walk by clicking. He's slower than you if you need distance." (20 words). Same wording as m05's Torres texts. No promise that walking away ends the chase. Routes r2, r3, r18 quotes updated |
| F9 | minor | A hostile Hollis who was walked away from is credited "Left at his post" | **Fixed.** New credit "RAY HOLLIS: Went for you, left standing — still on their payroll" for `hollis_resolved === 'ko' && !hollis_ko` (erb:230); the "Left at his post" condition (erb:231, was :229) now also excludes `ko`. New route r20 (the review's probe p6) |
| N3 | minor | After a Restart the player respawns 31 px from a still-hostile Hollis | **Deferred, engine.** No mission-side action can move an NPC or clear hostility (event mappings have `setVisible`, `setGlobal`, messages, `targetKnot`; nothing repositions). Moving his patrol or start point would not help while he is chasing, and the start room is the respawn room. Logged as U11 in `DECISIONS_PENDING.md` with the backlog link |

Counts: 0 blockers, 0 majors, 4 minors (F7, F8/N1, F9 fixed; N3 deferred to the engine backlog).

#### Spoken lines changed (old → new)

HaX texts (`scenario.json.erb`), no audio exists:
- "He's coming for you. Q for fists, then E or click when he's in front. Or walk away: he's slower than you. Q again stows them, then click to walk." → "He's coming for you. Q switches to fists (again for a harder punch), then E or click when he's in front. Face him squarely." + "Keep pressing Q until the open hand shows to walk by clicking. He's slower than you if you need distance."
- "Park's swinging. …" and "Mercer's coming at you. …": same change, with their own openers.
- Debrief and ink prose: no change. F10 ("You ask how much again") untouched for the dialogue stage.

#### Checks

- All 20 routes (r1-r20) pass "all expectations met".
- `dialoguelint`: 0 errors; totals unchanged (transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6); timed texts max 30 words.
- `reopencheck`: 0 problems (m07 HaX 1800 reopens, the_architect 476).
- `validate_scenario.rb`: no errors; the same onceOnly-overlap warnings and credits-fallback suggestions as before; the `hollis_backed_off` sync warning raised by the new mapping is cleared by the comment.
- `check_door_alignment.py scenarios/m07_architects_gambit/scenario.json.erb`: all OK. `tagdiff` on the Hollis ink: 3 structural differences (the new VAR, the choice condition, a comment).
- Ink recompiled: 8 files, 0 failed.

#### Open

- Browser check owed (a single short one): the two-part controls texts at a hostile Hollis, and the clone choice appearing on the sighting after the ops floor.

### Stage 2 puzzle chains: CLOSED (orchestrator, 2026-10-14)
Cycle 2 review 0/0/4, round-1 browser check all four items pass, closing round fixed F7, F8/N1, F9 (N3 to U11, engine). Owed on screen, carried to the next browser check: the two-part controls texts at a hostile Hollis; the clone choice appearing on the sighting after the ops floor. F10 to the dialogue stage.

### Stage 2 scenario design, round 1 (fixer, 2026-10-14)

Review: `DESIGN_REVIEW_P5_C1.md` (0 blockers, 3 majors, 15 minors). Each finding was checked against `scenario.json.erb`, the ink and the engine before acting. No SecGen XML and none of the four restricted field guides were opened. No browser session. Nothing committed.

Counts: 0 blockers, 3 majors, 15 minors. All fixed; D3's engine half stays as E1.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| D1 | major | HaX has no progress-aware "Where do I stand?" | **Fixed.** Sticky `[Where do I stand?]` on the hub (above "Remind me of the layout and the clock.", which stays) → text-only `report_progress`, m04's pattern. First unmet step, in order: the debrief state once the grid is saved (missing flags / sweep then "bring you in" / Netherton waiting); the commit; the checkpoint and badge (badge held / not inside yet / Hollis KO'd: his badge on the floor / otherwise Hollis, the clone, the badge station); the Kali box; flag 1; flag 2; the control room door (with or without the password); flag 3 (plus the redirect line while the window is open and the correction held); root (with "Step one ran" after expiry, and the door if still shut); the abort. One closing line on the optional plant while `not vault_entered`. Each test reads whether a step is done (`server_hall_reached`, `badge_obtained`, `scada_door_reached`, the flag globals), never which route did it. New phone VARs: `inside_reached`, `badge_obtained`, `server_hall_reached`, `scada_door_reached`, `scada_password_found`. Route r21 walks every state; r22 the uncommitted and missing-flag states |
| D2 | major | The clock runs out in silence; HaX's clock answer goes false | **Fixed.** (a) Two HaX texts on `countdown_expired`, disjoint on `flag4_submitted`, at 5 s (the Architect's bark is at 0.5 s; 4 s tripped the validator's 4-second spacing rule). (b) The clock answer branches on `countdown_expired` first, and on `flag4_submitted` (root in: the console is next) in both the expired and armed cases. (c) Display variant `globalVars.countdown_expired` between `grid_saved` and `cascade_armed` (first match wins, `conditional-text.js`). r2 now checks the expiry text; r21 and r22 cover both rows and both clock answers |
| D3 | major | The win console asks for a flag it can never accept | **Fixed mission-side.** HaX text on `object_interacted` with `data.objectName === 'Cascade Control System' && !globalVars.flag4_submitted`, onceOnly, 0.8 s (the event fires before the lock screen, `interactions.js` `handleObjectInteraction`). All four flag tasks now end "…at the relay". **Engine half deferred** (E1, already in `DECISIONS_PENDING.md`). The validator flags the console text and the Kali-box text as able to stack on `object_interacted`; they can't, as the conditions name different objects (logged as a false positive) |
| m1 | minor | Five toasts on the first ops-floor entry, one for a room two doors away | **Fixed.** `reach_the_control_room` and `trace_the_intrusion` now have `"unlockCondition": { "globalVariable": "server_hall_reached" }`. A new HaX mapping on `room_entered:server_room` sets `server_hall_reached` and calls `unlockAim` on both (the m05 `torres_identified` shape; the server re-derives a met story gate on reload, `game.rb` `objectives_state_for_client`). Objectives comments updated. New global declared in the erb and `missions.json` |
| m2 | minor | No pointer to the commit for a player who closed the briefing uncommitted | **Fixed.** The ops-floor HaX row is split on `team_assigned` (uncommitted text below; the committed row keeps the old text as a backstop). Aim description names the desk summary and HaX. r22 |
| m3 | minor | Briefing story clock contradicts the 40-minute window | **Fixed.** The transit beat moves to the top of `delegation_intro`, reworded so the Director holds the line during the drive. The commit is now made at the gate, so "before you are through the gate" is literal. `handoff` keeps the building lines. r23 |
| m4 | minor | T-20 can play before first contact | **Fixed, with one addition.** `taunt_t20` opens with T-30's narrator line when `not heard_t30` and sets it. Addition: `t20_close` then carries T-30's echo ("Let it hurt afterwards…") and sets `architect_echo_heard`, so the teacher thread (user decision P6) isn't lost. The ops-floor "Agent 0x00." bark now needs `!architect_t20_played`, because it would otherwise open on dead air after T-20. r23 |
| m5 | minor | Stale engine comments | **Fixed.** Timers block says timers resume on reload (guards kept); the WP header no longer lists landed work as absent |
| m6 | minor | Reload after the abort plays noir | **Fixed.** `!globalVars.grid_saved` on the three `game_loaded` rows, plus a `game_loaded` → `end` row on `grid_saved`. r22, r23 |
| m7 | minor | Console description false after it opens | **Fixed.** "The master control position for 147 substations. The abort goes in here, once the host driving the sequence is off the network and reported at the relay. Nothing typed at this chair changes that." |
| m8 | minor | Mercer quotes Elena to a player who never met her | **Fixed.** `VAR elena_met` in Mercer's ink; the choice needs `elena_met and not heard_elena`. r23 |
| m9 | minor | Mole intercept says "thirty minutes" | **Fixed.** "Window: forty minutes." |
| m10 | minor | Cloner route missing from the graph | **Fixed.** `puzzle_graph_unlocks: ["server_room"]`, `puzzle_graph_optional: true`; graph regenerated (`rfid_cloner -.-> door_server_room`) |
| m11 | minor | RFID guide hand-over doesn't mention cloning | **Fixed** with the review's line |
| m12 | minor | A never-committed player can commit after the abort | **Fixed.** `{not team_assigned and not grid_saved}`. r22 checks the choice is gone |
| m13 | minor | "The console up there" | **Fixed.** "The console in there…" |
| m14 | minor | Gendered credit with an unclear "his" | **Fixed.** "AGENT 0x00: Wants the numbers before writing them — no more briefing off the Architect's figures" |
| m15 | minor | Six field-guide choices on the hub | **Fixed.** One `[Send me a field guide.]` (gated on an ink function `guide_waiting()`) → choices-only `field_guides` with a sticky "Never mind."; each guide's give stays in its text half. r21 |

#### Decisions taken (fixer, with reasons)

- **"Remind me of the layout and the clock." kept** beside "Where do I stand?": the layout answer is the only map talk, and the clock answer is now right in every state.
- **D2's text split on `flag4_submitted`.** A player who got root and hasn't reached the console yet would otherwise be told to get root.
- **D3 text at 0.8 s,** so it lands with the lock screen rather than after the player has typed.
- **m4 keeps the echo line.** The review accepted losing T-30's content; T-30's last line is the hook for HaX's `topic_teacher`, so it moves to T-20's close for this player.
- **m1 unlocks both aims from one mapping** that also sets the global, so the client and the server's reload view agree.
- **The report's plant line** shows only once the server hall is reached, and not after the vault. It says "optional", because the aim gates nothing.

#### Route driver

New: `r21_where_do_i_stand_ladder` (every progress state, the guide sub-menu, the console click, server-hall aim unlock, expiry before and after root), `r22_uncommitted_ops_floor_flags_missing` (m2, m12, D2 root-in, the missing-flag state, end track on reload), `r23_t20_first_contact_mercer_music` (m3, m4, m8, m6). Changed: r2 checks the expiry texts. r1–r23: all 23 pass.

#### Checks

- Ink compiles (8 files, 0 failed; the briefing's END warning as before).
- Validator, full: schema passed, geometry and doors OK, graph regenerated. 13 onceOnly-overlap notes (one new, `object_interacted`: the Kali-box and console rows name different objects). New spacing note on `object_interacted` (false positive, as above). The `countdown_expired` spacing note was cleared by moving HaX to 5 s. Person-chat and credits notes unchanged.
- dialoguelint: 0 errors (three new phone lines first ran over the 25-word cap and were split); totals unchanged (transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6).
- reopencheck: 0 problems (m07 HaX 1800 reopens, the Architect 476).
- inkcheck (phone hub, `report_progress`, `field_guides`, the clock answer with expiry and root; the Architect's start after T-20; the briefing; Mercer with `elena_met`): no failing paths, no runaways. loopcheck on the same knots and `delegation_intro`: no runtime errors.
- tagdiff against HEAD: 79 structural differences, all from the changes above (mostly the phone's new knots and conditions).
- `check_door_alignment.py`: all OK.

#### Spoken lines changed (old → new)

No m07 audio exists yet; listed for the record.

HaX, phone (`m07_phone_agent_0x99.ink`):
- New, `report_progress`: "It's done. Netherton's waiting. Next door you go through, he's on the link." / "It's done. The grid's holding. Sweep what you want, then tell me to bring you in." / "Grid's held. Some of what you took off their host hasn't gone through the relay. Submit the rest, then call me." / "The team's still waiting on your call. Make it first. Tell me where it goes and I'll pass it up." / "You've got a badge. The server hall reader's on the far side of the ops floor." / "Get past the checkpoint to the ops floor. The server hall beyond it wants a badge." / "The server hall reader wants a zone badge. Hollis's should be on the floor by him." + "Or print one at the badge station behind his desk." / "The server hall reader wants a zone badge. Hollis wears one, and the cloner copies it if you stand close." + (same) / "The Kali box in the server hall is your way onto their network. Start there." / "Their host has an NFS share open to anyone. Read it from the Kali box and put its flag through the relay." / "Scan every port on their host. Something answers whoever connects. Its flag goes through the relay." / "Open the control room door, north of the server hall, before you log in on their host." + "You've got the password." or "Elena knows the password, and their listener gives it out." / "One SSH login: the name from the share, the password from the listener. The flag's in its home directory. The moment you log in, the clock starts." / "If you mean to move the team, do it before you log in." / "Step one ran. Steps two to four haven't." / "Get root on their host and put the root flag through the relay. The console opens itself after." / "And you'll need the control room door open for the abort." / "Root's in. Put the abort in at the console in the control room." / "The plant's south of the server hall, if you want to see how they got in. That part's optional."
- Clock answer, new: "Step one ran. Seattle's dark. Steps two to four wait on the abort, and the console in the control room will take it now." / "Step one ran. The rest waits on the abort. Root first, then the console." / "It's running, and root's in. The console in the control room takes the abort now."
- "So open the control room door first. The console up there is the only place the abort goes in." → "…The console in there is the only place the abort goes in."
- RFID guide: "Hollis's badge works. So does anything the badge station behind his desk prints." → "Hollis's badge works, and so does a copy: stand close while he talks and the cloner reads it. Or the badge station behind his desk."
- Player choices (not voiced): "Where do I stand?", "Send me a field guide." with "The RFID cloning guide." … "The privilege escalation guide.", "Never mind." (replacing six "Send me the … field guide." choices).

HaX texts (`scenario.json.erb`), new: "You're inside, and the team's still over Denver waiting on your call. Phone me when you've decided. Let it hurt afterwards, not during." (uncommitted, ops floor); "That console takes nothing typed into it. The root flag goes through the relay in the server hall, and the console opens itself after."; "Seattle's dark. Step one ran. Steps two to four haven't. Get root, put it through the relay, then the abort at the console."; "Seattle's dark. Step one ran. Steps two to four haven't. Root's in, so the console takes the abort now. Go."

Briefing (`m07_opening_briefing.ink`): "Narrator: Forty minutes of rain and empty interstate. Then an industrial park outside Portland, 03:24 by the dashboard clock." (in `handoff`) → "Narrator: He keeps the line open while the desk pulls the other three together. Forty minutes of rain and empty interstate. Then an industrial park outside Portland, 03:24 by the dashboard clock." (top of `delegation_intro`).

The Architect (`m07_architect_comms.ink`): when T-20 is first contact, "Narrator: The handset cuts across the facility alarm. Same voice, same absence of hurry." is replaced by T-30's "Narrator: Your handset lights without ringing. The call is already connected, and has been for some seconds.", and T-20's close adds "Let it hurt afterwards, not during. I expect you've been told that." The ops-floor bark "Agent 0x00." doesn't fire after T-20.

Not voiced: console description, display variant ("AUTOMATED SEQUENCE -- RUNNING / STEP 01 SEATTLE METRO -- EXECUTED / STEPS 02-04 -- PENDING / One region of the map has gone grey. The rest is waiting on the next step."), the intercept's "Window: forty minutes.", the credit, the four flag task titles, the first aim's description.

#### Open after round 1

- Browser check owed: "Where do I stand?" at two or three stages; the field-guide sub-menu; the console click before flag 4 (HaX text over the lock screen); the ops floor showing one new aim and the server hall two; the clock running out (HaX text, display variant); a reload after the abort (end track).
- Still owed from puzzle chains: the two-part controls texts at a hostile Hollis; the clone choice on the sighting after the ops floor.
- Engine: E1 (flag lock with no `requires`). User: E2 (guide titles), S1/U3 (SecGen claims, unchanged).

### Stage 2 scenario design, closing fix round (fixer, 2026-10-14)

Inputs: `DESIGN_REVIEW_P5_C2.md` (N1–N4; probes pA–pC) and `PASS5_DESIGN_R1_BROWSER.md` (N1–N3, O2). No SecGen XML and none of the four restricted guides were opened. No browser session. Nothing committed. Files: the phone and Architect inks (recompiled), `DECISIONS_PENDING.md`, routes r2, r21, r22 changed and r24–r27 new.

| # | Source | Sev. | Finding | Outcome |
|---|---|---|---|---|
| N1 | review | minor | A player who ignores the Architect hears his taunts newest first | **Fixed, extended.** T-20 now needs `not architect_t5_played` in `start`, `parked` and `dead_air_choices`, as T-10 already did. T-5 and T-1 (and T-10, which had the same gap) open as first contact when `not heard_t30`, set `heard_t30` and a local `late_first_contact` (was `t20_first_contact`). `taunt_t1` sets `heard_t5`, so T-5 never follows T-1. Each close (T-10, T-5, T-1, as T-20 did) carries the echo line once when its taunt was first contact, so the teacher thread survives. Two additions the probe showed: T-1 as first contact no longer ends "He has hung up first every time.", and T-1 opened after the clock ran out no longer starts "One minute." r24, r25 |
| N2 | review | minor | After the debrief is requested, the ladder sends the player the wrong way | **Fixed.** (a) The plant line needs `not grid_saved and not debrief_requested` as well, which also covers browser O2 (the line showed after the abort). (b) New row `grid_saved and debrief_requested` (flag missing) above the "Submit the rest, then call me." row. r22, r26, r27 |
| N3 | review | minor | Root in, control room never entered: nothing mentions the door | **Fixed** with a text-only tunnel `door_line` (`not scada_door_reached` → "The door's north of the server hall." plus the password line), called from the ladder's root-in row and the clock answer's two `flag4_submitted` rows. r22, r26 |
| N4 | review | minor | The ladder holds on the commit and gives nothing else | **Fixed.** The commit row is now a prefix, `{not team_assigned and not grid_saved: …Make it first, then:}`, and the first unfinished progress step follows. r21, r22, r27 |
| B-N1 | browser | minor (engine) | A hit closes the phone | **Deferred to the engine.** Already in `docs/IDEAS_BACKLOG.md` ("A hit closes the phone"); pointer logged as U12 in `DECISIONS_PENDING.md` |
| B-N2 | browser | minor | HaX's thread reopens inside the last sub-menu | **Fixed.** Phone chats reopen at the choices the story is waiting on (`phone-chat-conversation.js` re-navigates to the knot that owns them; gotcha 0b and the phone note under gotcha 2), so every sub-menu answer now ends on the hub. The layout and clock answers divert to `hub`, not back to `first_call_committed_choices`. The six guide hand-overs print and go to the hub, as m04's do; the one-choice "Got it." / "Received." / "Understood." / "Copy." knots are gone and HaX's reply to each is the hand-over's last line. `redirect_closed` lost its one-choice "Understood." the same way. The `#give_item` can't replay, because the story rests on the hub. r21, r22 and r26 reopen with no knot and check the hub's "Where do I stand?" |
| B-N3 | browser | minor | "You've got the password." shows before the capture is opened | **Fixed by wording,** true either way: a text-only tunnel `password_line`: Elena turned → "Elena gave you the password."; flag 2 in → "The password's in the listener capture in your inventory."; neither → unchanged. Wording was chosen over a new `capture_read` latch, because it needs no scenario change and points a player who hasn't opened the capture at it. r21, r26, r27 |
| B-O2 | browser | obs. | Plant line after the abort | **Fixed** with N2(a) |

#### Decisions taken (fixer, with reasons)

- **N1 covers T-10 too.** The review named T-5 and T-1; T-10 had the same missing opener (a player held at the checkpoint for thirty minutes). One local latch, `late_first_contact`, drives the opener-and-echo pair for all four late taunts.
- **T-20 is still not retired by T-10.** A player who ignores both hears T-10 and then T-20. T-20 is the taunt that names the two operations left, and T-10 doesn't, so retiring it would lose that unless T-5 also plays. Left for the dialogue stage to weigh.
- **`field_guides` itself is still a choices-only sub-menu.** A player who closes the phone with that list open comes back to it, with the sticky "Never mind." to get out. Folding the guides into the hub would bring back the crowding fixed in round 1 (m15).
- **The plant line is hidden from the abort on,** not only after the debrief is requested. The sweep line ("Sweep what you want…") already offers the building, and the browser check read the line after the win as noise.

#### Route driver

Changed: r2 (exits the redirect-closed answer with "I'll call you back."), r21 (the commit prefix, the guide hand-overs without the acknowledgement, a no-knot reopen after the RFID guide, the password line), r22 (the commit prefix with the next step, the door line in the clock answer, a no-knot reopen after the clock answer, no plant line after the abort). New, from the c2 probes inverted: `r24_architect_ignored_t5_first_contact` (pA at minute 23: T-5 as first contact with the echo line, no T-20, then T-1 in order), `r25_architect_ignored_t1_after_expiry` (pA as probed: only T-1, no "One minute", no "every time", nothing after), `r26_ladder_door_never_opened_fallback` (pB: the door line in the ladder and the clock answer, the reopen lands on the hub, the fallback-timer row), `r27_uncommitted_ladder_then_debrief` (pC: the commit prefix with the next step, Elena's password line, no plant line after the abort or after Bring me in). r1–r27: all 27 pass.

#### Checks

- Ink compiles (8 files, 0 failed; the briefing's END warning as before).
- Validator, full: schema passed, geometry and door alignment OK, graph regenerated (no change). 13 onceOnly-overlap notes and the person-chat and credits notes, all as before.
- dialoguelint: 0 errors; totals unchanged (transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6).
- reopencheck: 0 problems (m07 HaX 1800 reopens, the Architect 476).
- `check_door_alignment.py scenarios/m07_architects_gambit/scenario.json.erb`: all OK, exit 0.

#### Spoken lines changed (old → new)

No m07 audio exists yet; listed for the record.

HaX, phone (`m07_phone_agent_0x99.ink`):
- Ladder, commit: "The team's still waiting on your call. Make it first. Tell me where it goes and I'll pass it up." → "The team's still waiting on your call. Make it first, then:" followed by the next step's line.
- Ladder, new (debrief requested, a flag missing): "Grid's held. Put the rest of what you took through the relay and he's on straight after."
- Ladder, door row: "You've got the password." → "Elena gave you the password." (Elena turned) or "The password's in the listener capture in your inventory." (flag 2 in). "Elena knows the password, and their listener gives it out." unchanged.
- Ladder root-in row and the clock answer's two root-in rows, new when the control room was never entered: "The door's north of the server hall." plus the password line.
- "The plant's south of the server hall, if you want to see how they got in. That part's optional." no longer plays from the abort on.
- Guide hand-overs: the reply lines "Quiet and quick. Go.", "Patient hands open any of those.", "Go.", "Read, don't touch. Go.", "Log in when the control room door's open, not before. Go.", "Walk through the door they left open. Go." now end the hand-over without a player choice before them.
- Player choices removed (not voiced): "Got it.", "Received." (two), "Understood.", "Copy." (two) after the guides; "Understood." after the redirect-closed answer.

The Architect (`m07_architect_comms.ink`):
- T-10 as first contact: "Narrator: Your screen wakes on its own. Nothing else on it moves." → "Narrator: Your screen wakes on its own. The call is already connected, and has been for some seconds."
- T-5 as first contact: "Narrator: Five minutes on the display. The handset opens the line without asking." → "Narrator: Five minutes on the display. Your handset lights without ringing. The call is already connected, and has been for some seconds."
- T-1: "Narrator: One minute. The handset is warm in your hand and the line is already open." → the same, starting "The countdown has run out." when the clock has run out; as first contact, "Narrator: One minute. Your handset lights without ringing. The call is already connected, and has been for some seconds." (or "The countdown has run out. …").
- T-10, T-5 and T-1 closes, when that taunt was first contact: add "Let it hurt afterwards, not during. I expect you've been told that."
- T-1 close as first contact: "Narrator: He hangs up first. He has hung up first every time." → "Narrator: He hangs up first."

### Stage 2 scenario design: CLOSED (fixer's note for the orchestrator, 2026-10-14)

Cycle 2 review 0 blockers / 0 majors / 4 minors; round-1 browser check all six items pass with 3 minors; this closing round fixed N1–N4, browser N2 and N3 and O2, and sent browser N1 to the engine (U12). Nothing above minor is open. Still not seen on screen, for the next browser check: the ladder's debrief states, a reopen of HaX after a guide hand-over and after the clock answer (should land on the hub), the T-5 or T-1 first-contact call, and the door line with root in and the control room unopened. The browser check's "not covered" list (redirect line with the window open, uncommitted ops-floor text, vault and Park states, credits) carries to the dialogue stage. Items for the user unchanged: E1 (engine), E2, U3 (needs checking against SecGen by the user), U11, U12.

### Phase 4 dialogue, cycle 1 (fixer, 2026-10-14)

Review: `DIALOGUE_REVIEW_P5_C1.md` (Opus, read-only, `npc-dialog-review` in full). Counts: 0 blockers, 5 majors, 37 minors (D7-1 to D7-42; two lint warnings withdrawn by the reviewer). Snapshot for `tagdiff --old`: the session scratchpad's `m07-dialogue-reviewer-c1/snapshot/ink/` (commit `8e868ab9`). Every finding was checked against the ink before it was acted on. None was declined or withdrawn; where the fix differs from the reviewer's wording, the reason is given. The review's strengths are kept word for word: the teacher thread (T-30's close, the late-first-contact echo lines, `topic_teacher`), the Architect's register, HaX's voice, "The choice was yours. The menu was his.", "He measured you. He did not beat you." and the debrief's honest read-out of both dark operations by name and number. No m07 audio exists, so none of this costs anything to re-voice.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| D7-1 | major | Debrief read-out ran 59–63 lines without a choice | **Fixed** with the review's beats, plus two the review's count missed: the site list ran on into the coda (13 lines), and the stance reply ran into the handoff (up to 13). Opening narrators merged; beat 1 after the win ("How close was it?" / "It doesn't feel done, sir."), the door line answering both; narrator :131 cut; beat 2 `team_reaction` after every covered result; beat 3 the player can say the twist ("He let us capture it." / "Then whose numbers were they?"); narrator :306 cut and beat 4 ("Read them, sir." / "I know what they were, sir."); beat 5 `between` after every dark read-out but the last; beat 6 at "two of ours"; one line per person in the site list; a coda-turn beat ("Then it's over." / say nothing) before HaX's "one more thing"; beat 7 at the intercept (full and thin); Tomb Gamma moved to `q_tomb`; beat 8 before "Look at me"; a handoff beat at "Somewhere without windows" (fixer's addition). Longest debrief run is now 9 (r30, the worst case by construction). Rewordings: beat 6 is "Is there more, sir?" / "(Wait.)" with the two-of-ours line as the reply, because the review's version left that line on the end of the last read-out (10 lines on a Meltdown route) and its "Not tonight. Their families first." repeated "until the families are told"; beat 5's reply is "I will ask you that at the end, in your own words. Hear this one first." rather than "Ask me that after the next one", because he never answers after the next one and the stance question is where it's asked; beat 2 gives the uncommitted player "I couldn't choose, sir." rather than "Was it worth it?"; the site's Park lines end "A later abort, and that control centre runs on nothing." Non-verbal choices are written `[(Wait.)]`, as Park's are: `+ (Wait.)` is an ink label |
| D7-2 | major | The debrief reported a week four hours in | **Fixed** as proposed (:198, :335-336, :370, :372, :373) |
| D7-3 | major | T-20 played straight after T-10, twenty minutes stale | **Fixed** as proposed: T-20 retires on T-10 (`start`, `dead_air_choices`, `parked`) and on T-5; `t20_folded` carries its naming line into T-10 for a team not redirected and not in Austin. r6 and r7 assert T-20 doesn't follow T-10 |
| D7-4 | major | The stance question assumed a commit for the uncommitted player | **Fixed**: the question names the team never sent; "numbers I had" and "Two operations" gated on a commit; new "[I didn't make the call. Three went dark. That's mine.]"; hardened branch for no team. Reply reworded from "Not choosing was a choice", a stock phrase, to "It is. Leaving the team in the air was the most expensive answer on the board." Fixer's addition: "Don't ask me to rank them" said "I won't do that arithmetic twice" and got "you did the sum anyway, tonight" to a player who never did the sum, so the choice reads "I didn't tonight and I won't now" for that player and the reply "You made it tonight as well, and three operations went dark while you did." (r5, r29) |
| D7-5 | major | HaX's hub could show 15 choices | **Fixed**: "About the people in here." (Hollis, Elena, Mercer, the Park pointer), "What I found in the vault." (Tomb Gamma, the mole, word for word), "I'm stuck on something." (the vault keypad, the four VM hints, "Send me a field guide." → the guides menu). Each sub-menu is choices-only with a sticky "Never mind." back to the hub. "Where do I stand?" stays at the top level. "Remind me of the layout and the clock" shows only before the server hall; the report carries the clock after that ("The clock's running…" / "Step one ran. Seattle's dark. Steps two to four wait on the abort."), and for root in with an earlier flag missing names the abort itself (r22's state). Two fixer's additions to hold 9: the closed-window question is not offered after the abort (`deduce_right` already tells a late finder the window is shut; its `grid_saved` branch is gone), and a local `submenu_from_hub` sends a reopen that re-runs a sub-menu to the hub, so a reopen still lands on the hub. Most at once: 9 (r28 asserts the review's state; 200,000 sampled states peaked at 8). reopencheck clean |
| D7-6 | minor | Trojan facts twice on direct routes | **Fixed** as proposed; `revision_payoff`'s Trojan block is HaX's line only |
| D7-7 | minor | HaX's "separate sentence" before "You knew" | **Fixed** (cut) |
| D7-8 | minor | "But I'll answer one thing" before the question | **Fixed** |
| D7-9 | minor | "Good" for a held correction | **Fixed** as proposed (r30) |
| D7-10 | minor | `coda_thin`'s "the moment you reached the operations floor" | **Fixed** as proposed |
| D7-11 | minor | T-20 after an early redirect | **Fixed**, reworded to "You moved them already. You read the column nobody reads, and the one you chose first goes dark with the other." so the next line's "So Washington…" doesn't follow another "So". The direct wording kept word for word (m08) |
| D7-12 | minor | "The team's on the ground" a minute after the commit | **Fixed** as proposed (r10 asserts it) |
| D7-13 | minor | Clone narrator "You ask how much again" | **Fixed** as proposed |
| D7-14 | minor | Barks gave away the punch line | **Fixed** as proposed (erb barks; T-10's `else` line). r2 and r24 updated |
| D7-15 | minor | "I have." then more | **Fixed** ("Nearly.") |
| D7-16 | minor | T-5 named Mercer before the player might know him | **Fixed**; "even when it's monstrous" to fit the 25-word phone cap |
| D7-17 | minor | Briefing opened on 11 lines | **Fixed**: now 9. "the fund behind them", not "the fund that paid for them", because :29 already says "paid" twice; the second merge is three sentences to fit the 30-word cap |
| D7-18 | minor | Only Trojan's tail said what the team would stop | **Fixed** as proposed |
| D7-19 | minor | The Architect moved Meltdown's deaths to tonight | **Fixed**; :152 ends "dead this week" (the proposed "before the week is out" broke the 25-word phone cap) |
| D7-20 | minor | "No bodies in the brief" three times on a direct Trojan route | **Fixed** as proposed |
| D7-21 | minor | Hollis: "evacuated forty minutes" | **Fixed** as proposed |
| D7-22 | minor | Hollis's sighting on every re-talk and after the clone | **Fixed** as proposed (`wary_said`); r14 updated |
| D7-23 | minor | Clone choice was an instruction in speech brackets | **Fixed** as proposed; r14's three `notSaid` now check "Keep him on the money" |
| D7-24 | minor | Elena quoted "your ninety" unprompted; "a name" with no name | **Fixed** as proposed (`told_ninety`) |
| D7-25 | minor | Mercer offered no carve-out question | **Fixed**; Mercer's added line is "Page one of her copy had the carve-out. Mine didn't.", not "Mine had the annex instead", which would sit next to "She didn't have the human-cost annex" |
| D7-26 | minor | Elena's voice style described a contractor | **Fixed** as proposed (erb text field only, region re-read first) |
| D7-27 | minor | Mercer's submission count | **Fixed** as proposed |
| D7-28 | minor | "It takes no abort from this chair" | **Fixed** as proposed |
| D7-29 | minor | "modeler", "artifact" | **Fixed** |
| D7-30 | minor | First call told a late caller to get past the checkpoint | **Fixed** as proposed, in both first-call knots |
| D7-31 | minor | "three continents" | **Fixed** as proposed |
| D7-32 | minor | "The one place a person on the ground" four times | **Fixed** (HaX's first-call line cut) |
| D7-33 | minor | HaX absolved the redirect | **Fixed** (cut) |
| D7-34 | minor | "didn't read the briefs" after the correction | **Fixed** as proposed (r28) |
| D7-35 | minor | Hollis topic promised the vault | **Fixed** as proposed |
| D7-36 | minor | Mercer topic the same for every fate | **Fixed** as proposed (r28) |
| D7-37 | minor | Elena and Mercer re-talks landed on bare choices | **Fixed** with Hollis's `back`/`hub_quiet` pattern in Elena's hub and post-turn hub and Mercer's hub; Mercer's `returning` knot is gone, its lines in the hub. Lint `blank-reentry` down from 6 to 3 (the three the review explained) |
| D7-38 | minor | "held three states with one step gone" | **Fixed** as proposed |
| D7-39 | minor | A hostile Mercer left standing fell to "Blackout…" | **Fixed** as proposed (r30) |
| D7-40 | minor | Team "stood by in Denver" | **Fixed** (ink and credits) |
| D7-41 | minor | Intercept "thirty minutes" | **Fixed** in the ink; the intercept document already said "forty minutes" |
| D7-42 | minor | Double hyphens | **Fixed** as proposed |

#### Decisions taken (with reasons)

- **Two beats beyond the review's eight (D7-1).** Counted against the routes, the site list ran into the coda and the stance reply into the handoff; both broke nine. The coda turn gives the player the moment the debrief seems over; the handoff beat lets the player ask why "without windows", which Netherton's next line answers.
- **The closed-window question retires at the abort (D7-5).** Otherwise "Bring me in." and it together made ten. The refusal adds nothing after the night is over, and `deduce_right` already says the window is shut.
- **Sub-menu reopens go to the hub (D7-5).** The brief asks that a reopen land on the hub. A reopen without changed globals still shows the saved sub-menu (the engine doesn't re-run then), the same as `field_guides`; "Never mind." is always there.
- **The refused stance for the uncommitted player (D7-4).** Same class as the finding: a choice and reply that assumed a sum the player never did.

#### Route driver

All 27 routes updated: the 14 that reach the debrief pick the new beats by index (varied across routes, so both options of every beat are exercised); every route ends with `{"maxRun": 9}` (the old guards of 58–70 are gone). Quotes updated: r2 (T-10's line), r5 (the uncommitted stance), r9 (D7-6: asserts the cut lines are gone), r10 (D7-12, new assertion), r14 (D7-22, D7-23), r21, r22 and r26 (D7-5: the clock in the report, the field guides under "I'm stuck on something."), r24 (D7-14 bark), r6 and r7 (D7-3, new `notSaid`). The compact-format routes (r20–r27) were edited in their own format. New: r28 (D7-5 in the review's 15-choice state: the hub at 9, each sub-menu, Never mind, a reopen landing on the hub, D7-34, D7-36, the clock in the report, the closed-window question gone after the abort), r29 (uncommitted debrief: two between-beats, the full coda with "forty minutes", Tomb Gamma in the hub, the refused stance), r30 (the longest-run debrief: Meltdown covered, held correction, the fullest site list, D7-9, D7-39).

#### Checks (static; no browser session started)

- Recompiled with `scripts/compile-ink.sh m07_architects_gambit` before every route run: 8 files, 0 failed, no loose ends (the briefing's expected END warning).
- Routes: all 30 end `[result] all expectations met`; longest run anywhere 9 (the briefing's opening, and the debrief on r30).
- dialoguelint: 0 errors. Left: `transition` ×1 and `not-x-but-y` ×1 (both withdrawn by the review), `you-after-choice` ×2 (non-verbal, allowed), `blank-reentry` ×3 (Hollis `parked`, Park `parked` and `hub`, explained by the review), `crowded-hub` ×1 (a static count of 14 over mutually exclusive gates; the runtime maximum is 9).
- reopencheck (m07): HaX 1800 reopens, 0 problems; the Architect 390 reopens, 0 problems.
- tagdiff `--old` against the snapshot: 351 structural differences (debrief 76, HaX 114, Mercer 74, Elena 66, the Architect 16, Hollis 5, briefing and Park none). Every one is from the changes above: the new beats, stitches (`team_reaction`, `between`) and choices; `asked_on_me`, `t20_folded`, `told_ninety`, `wary_said`, `hub_quiet`, `submenu_from_hub`, `revision_before_commit` (declared in HaX; already a scenario global); the T-20 retire conditions; the hub's sub-menus, their news functions and diverts; the `back` stitches; the removed `returning` knot and the debrief's removed Trojan/Tomb conditions.
- loopcheck (200 steps × 6 strategies) on 21 states across all eight files (the briefing; four debrief states; Elena fresh, turned and at the hub; Mercer fresh, after the abort with Elena turned, and at the hub; Hollis with both documents, backed off, cloned; Park with the projection; HaX fresh, in the 15-choice state and after the abort with the clock expired; the Architect with T-20 and T-10 unheard, all taunts after expiry, and redirected): no runtime errors.
- Validator (`--skip-ink --no-graph`, the room-dressing agent is editing the erb): schema passes; the same 13 wiring notes, cutscene notes and `object_interacted` timed-text note as the review. Nothing new.
- AI-tell and UK spelling pass over every changed line.

#### Spoken lines changed (old → new)

No m07 audio is cached, so nothing here costs anything to re-voice. "New" marks an added line.

Briefing (Netherton)
- "Four ENTROPY operations went live inside the same sixty seconds. Four cells, one schedule." / "Three days ago you followed one fund paying six cells on one seventy-two-hour clock. Four of them are on that map." → "Four ENTROPY operations went live inside the same sixty seconds. Three days ago you followed the fund behind them."
- "A sequence on their SCADA stack takes all of it down in four steps. It is waiting on a start signal from a host inside the building." / "Nobody stops it from outside that building." → "A sequence on their SCADA stack takes it all down in four steps. It waits on a signal from a host inside the building. Nobody stops it from outside."
- New: "If the team goes there, the story never runs. The breach does." (Fracture tail); "If the team goes there, the ransomware never reaches the hospitals." (Meltdown tail)

The Architect
- T-20, redirected before minute 10, new: "You moved them already. You read the column nobody reads, and the one you chose first goes dark with the other."
- "…Twelve companies. Eighty to a hundred and forty people, tonight, on your clock." → "…Eighty to a hundred and forty people this week, starting on your clock."
- "…A hundred and eighty-seven million records. Eighty to a hundred and forty dead by morning." → "…Eighty to a hundred and forty dead this week."
- "I have." → "Nearly."
- T-10: "You sent them to the one with no bodies in the brief. I'd like to know what you saw." → "You sent them to Austin. I'd like to know what you saw in it."
- T-10: "The beauty of entropy is that it doesn't require me to win. Ten minutes, and your team is too committed to move." → "…Soon your team won't be yours to move."
- T-10, new (T-20 unheard): "You sent your team to Washington. San Francisco and the vendors are on your clock." / "You sent your team to San Francisco. Washington and the vendors stand open."
- T-5: "Mercer would give you his figure and defend it to your face. I respect that, even when the figure is monstrous." → "The man in your control room would give you his figure and defend it to your face. I respect that, even when it's monstrous."
- Barks (erb, timed texts): "Five minutes. Say the other two out loud." → "Five minutes, Agent 0x00."; "This was never about the power grid." → "One minute, Agent 0x00."

HaX (phone)
- "The ops room's covering three continents tonight. If I go quiet for ten seconds, it isn't personal." → "The ops room's running four fires tonight. If I go quiet for ten seconds, it isn't personal."
- "The team's logged for Fracture -- Washington / Meltdown -- San Francisco / Trojan Horse -- Austin. …" → "Fracture, Washington" / "Meltdown, San Francisco" / "Trojan Horse, Austin"
- Cut: "You're my hands in the one place where a person on the ground still changes the ending."
- First call, once past the checkpoint, new: "You're past the checkpoint. Ask me where you stand and I'll give you the next step." (in place of "Get past the checkpoint to the operations floor." and, in the uncommitted first call, "…Call me when you hit something you can't open.")
- Cut: "The ones you couldn't reach are on ENTROPY."
- "No. I'm sorry -- that window's shut." → "No. I'm sorry. That window's shut."
- New (correction before the commit): "You made that call with the numbers in hand. It stands."
- Cut (no longer reachable): "You found the numbers were wrong. That goes in the report. The part that was yours is finished."
- New (after the correction): "Not on the brief we gave you. He wrote the brief." ("No. That was the design." and "Anyone who says they'd have known…" now only before it)
- "It's a small version of a bigger question. You'll meet the big one tonight." → "If it missed him, I want to know what else it missed."
- "What you said is his to live with now." → "He'll talk. He's waited twenty years for a room that has to listen." (arrested) / "You let him walk. That's in the log, in your words." (escaped) / "He never got to say his piece. He'll mind that more than the cell." (KO)
- "You still held three states with one step gone." → "You still held most of three states, with Seattle gone for a while."
- Where do I stand?, new: "The clock's running. Fifteen minutes from your login on their host."; "Root's in, so the console in the control room takes the abort now." "Step one ran. Steps two to four haven't." → "Step one ran. Seattle's dark. Steps two to four wait on the abort."

Ray Hollis
- "Building's been evacuated forty minutes. So you're lost, or you're the other thing." → "Building's evacuating. So you're lost, or you're the other thing."
- Narrator: "You ask how much again, and step in close while he works out an answer." → "You ask him what it bought, and step in close while he works out an answer."
- New (re-talk after the clone): Narrator "He looks up from the desk. His hand stays off his belt this time." / "Thought you'd gone. Say it or go."; (later re-talks) "Still here. Say it or go."

Elena Rodriguez
- "The dormancy field says T plus nine. Nine days. Same table your ninety came out of, one column over." → unchanged when the player told her "ninety"; otherwise "…Nine days. The column next to it says ninety. That's the one somebody wanted read."
- "And I recognised a name on the vendor manifest. Over a third of the entries are prefixed EHR or CAD." → "And I read the vendor manifest. Over a third of the entries are prefixed EHR or CAD."
- New (re-talk): "Still here. Ask." / "I haven't moved. Neither has the table."; after turning: "The tables are coming back. Slowly." / "What else?"
- Voice style (erb): "A contract electrical engineer in her early thirties who worked out an hour ago what her cabling survey was for." → "A grid engineer in her early thirties who helped build tonight's outage believing nobody would be hurt, and has just read otherwise." (the rest unchanged)

Dr. James Mercer
- "I did publish. Four papers, two of them still cited. I testified twice, and filed the same submission three times in eight years." → "…filed the same submission twice in eight years."
- New (Elena turned): "Page one of her copy had the carve-out. Mine didn't."
- "…The modeler kept rounding down…" → "modeller"; "This is a scheduling artifact. …" → "artefact"
- "End it how? The sequence is local. It takes no abort from this chair, and it doesn't care what happens to me." → "End it how? While the host in the server hall drives it, this chair takes no abort, and the sequence doesn't care what happens to me."
- "Ah. It's decided in the server hall, not here. So I'm a man in a room with a signed piece of paper." → "Ah. It's decided on the host in the server hall, not by me. So I'm…"
- "Back. The console hasn't changed its mind either." / "Back. There's nothing left on that console for either of us." unchanged, now heard on a re-talk.

Debrief
- Narrator: "A borrowed office at the grid site, not long after the abort. The secure link to headquarters, lights down in the room behind the Director." / "Netherton sits down in front of the camera with a tablet, in the suit he briefed you in." → "A borrowed office at the grid site, not long after the abort. On the secure link, Netherton sits down in front of the camera with a tablet, in the suit he briefed you in."
- New: "It will not, tonight. It is done anyway."
- Cut: Narrator "He lets that stand for a moment. Then he turns the tablet over."
- "The manifest was not what the brief said. A third of those keys sign health record and emergency dispatch systems." / "The dormancy field said ninety days. The staged payload was set to wake in nine." → "The manifest was not what the brief said. A third of those keys sign health record and dispatch systems, and the payload wakes in nine days, not ninety."
- "You found out what you had chosen while they were stopping it." moved into the Trojan result (was "The team was already there. You found out…"); cut on those routes: "Your field notes say the Trojan Horse projection was understated. Nine days, not ninety, and dispatch on the manifest." and "The team was already there. You found it before you chose, and you chose Austin."
- "Eight of the twelve held clean. Four took damage, mostly money and stolen code. Markets moved three per cent and are recovering." → "…Futures are down three per cent."
- "There is no tasking record for the tactical team. It stood by in Denver all night and went nowhere." → "…It circled over Denver all night and went nowhere."
- New (beat 2): "Ask me again when I have read you the other two."; "Then the writing will be short. It will not be easy."
- Cut: HaX "The team not moving is a separate sentence. I won't pretend otherwise."
- "Every figure you were briefed with came from material we captured. The Architect let us capture it." / "Our threat desk did not derive one of those numbers." → "Every figure you were briefed with came from material we captured." then "Yes. Our threat desk did not derive one of those numbers." or "His. The Architect let us capture them. Our threat desk did not derive one."
- Cut: Narrator "He picks the tablet up again and holds it at arm's length, to read rather than say."
- New (beat 4): "You know the briefs. These are the results."; (beat 5) "I will ask you that at the end, in your own words. Hear this one first."
- "The Social Fabric package went out ninety minutes later, as designed. It is believable because the breach under it is real." / "Two states have postponed. A third has certified a result that a third of its own population will never accept." → "The Social Fabric package went out ninety minutes later, as designed." / "Two secretaries of state are already talking about postponing. The package is believable because the breach under it is real."
- "Operation Trojan Horse. Austin. The injection run completed. Forty-seven million systems took a signed backdoor." / "For nine days, nothing will happen at all." → one line, "…took a signed backdoor, and for nine days nothing will happen at all."
- "Ninety to a hundred and sixty dead over the following month." / "Spread thin enough that no single coroner sees a cluster." → "Ninety to a hundred and sixty dead over the following month, spread thin enough that no single coroner sees a cluster."
- "Operation Meltdown. Twelve targets, one command. Markets fell fourteen per cent and banking was down for eleven hours." → "…Futures are down fourteen per cent, and banking has been dark since three."
- "The ransomware landed across four thousand two hundred hospitals. Operations cancelled all week." → "The ransomware is in four thousand two hundred hospitals. Every theatre list from this morning is cancelled."
- "Eighty to a hundred and forty patients did not survive that week, waiting for operations the hospitals could no longer schedule." → "The desk projects eighty to a hundred and forty patients will not survive the week, waiting for operations nobody can schedule."
- "And two of ours. Names withheld until the families are told." kept (after "(Wait.)"); new "Two of ours. Names withheld until the families are told." (after "Is there more, sir?"). Cut: Narrator "He stops reading. He does not put the tablet down, and he does not say anything to soften it."
- "Blackout was still at the master console when you left that room. By the time the police reached it, he was not." → "Dr. James Mercer was still at the master console…"; new (hostile, left standing): "Dr. James Mercer came at you in that control room. By the time the police reached it, he was gone."
- "And you told him he was only there to keep us busy." / "A fanatic who has been told he was scenery. Whatever that does to a man, it is doing it now." → "And you told him he was scenery, there to keep us busy. Whatever that does to a man like him, it is doing it now."
- Elena KO: "Elena Rodriguez was found unconscious in the server room. She will be fine." / "She was also the only one on their side trying to stop it. Her statement will be an awkward document." → "Elena Rodriguez came round in the server room, the only one on their side who tried to stop it. Her statement will be an awkward document."
- Elena turned: "…without being asked twice. She has read what she was really part of." / "Analysis wants her. I have not decided." → "Elena Rodriguez walked out and gave a statement without being asked twice. Analysis wants her. I have not decided."
- Hollis KO: "The checkpoint guard is in hospital with a head injury. Ray Hollis. Thirty-six, two children." / "He was paid to renew Mercer's credentials in June. The police will talk to him when he can talk." → "The checkpoint guard is in hospital with a head injury. Ray Hollis, thirty-six, two children, paid to renew Mercer's credentials in June."
- Hollis talked: "Ray Hollis handed over his badge and walked out through the muster door. The police picked him up at the gate. He has given his name and nothing else, yet." / "He told you about the vault and the man on the riser. That is more than he has told us." → "Ray Hollis walked out through the muster door into the police at the gate. He told you more about the vault than he has told us."
- Park KO: two lines → "Thomas Park was found unconscious in the cable vault, four minutes from cutting the backup power that control centre needed to restart."
- Park evaded / fought off / in the vault / nobody went down: each pair with "Had the abort come any later, that control centre would have been running on nothing." → one line: "Thomas Park cut the control run to the transfer switch and walked out through our cordon. A later abort, and that control centre runs on nothing." / "Thomas Park came at you in the vault, finished the cut and was gone before the police got down. A later abort, …" / "You were in the vault with Thomas Park. He kept working, and he finished. A later abort, …" / "Nobody reached the cable vault before the police. Tools on a mat, the control run cut. A later abort, …"
- HaX: "Director. One more thing. It isn't in the reporting yet." kept (after saying nothing); new "Not quite. Director, one more thing. It isn't in the reporting yet." (after "Then it's over.")
- "…They will have to choose. Window, thirty minutes." → "…Window, forty minutes."; new "Word for word."
- "Four operations, one clock, one team. He built a problem with no right answer and pointed one agent at it." / "Then he watched what we protect when we can only protect one thing." → "He built a problem with no right answer, pointed one agent at it, and watched what we protect when we can only protect one thing."; cut "How fast we decide. Which numbers we believe. Which of the three we put down first, and how long it takes us."
- "The calls. He was on your handset the moment you reached the operations floor." → "The calls. He had your handset tonight, and your designation."
- Tomb Gamma (now in the hub, `q_tomb`): HaX "And from the vault: Tomb Gamma. Active, classed as a workshop. The coordinates were stripped before the copy was made." → "The dossier from the vault says active, classed as a workshop. The coordinates were stripped before the copy was made."; the quote unchanged; Netherton "Not yet. We have a designation, a classification and an empty coordinate field. The outline of a place." → "Not yet. A designation, a classification and the outline of a place."
- New (no team sent): "Three briefs. One team, and you never sent it. Where do you stand on that?"; "It is. Leaving the team in the air was the most expensive answer on the board." / "Carry it accurately. The menu was his. Leaving it unordered was yours."; "I will note the refusal. You made it tonight as well, and three operations went dark while you did."; "Yes. Next time, make the call while you work it out."
- New (held correction, defended): "The numbers you had changed while the window was open, and the team stayed where it was. That answer will need more than one sentence in a review room."
- HaX "Sir?" kept, now after the player says nothing at "Somewhere without windows".

Choices (not voiced) also changed: the debrief beats; "[Nothing on the record, sir.]"; the stance choices' gates and the refused choice's wording; HaX's three sub-menu choices and "[The guard on the checkpoint, Hollis. He was dirty.]", "[The share. Four operations running off one schedule.]"; Hollis's "[(Keep him on the money. Let the cloner read his belt.)]"; Mercer's Elena choice (three wordings).

#### Open after cycle 1

- Not seen on screen: the debrief beats (in particular the bracketed non-verbal choices and the run lengths as the engine paces them), HaX's sub-menus and a reopen on one, Elena's and Mercer's re-entry lines, T-10 with T-20 folded in. Worth a short targeted browser check before the dialogue stage closes.
- `crowded-hub` stays as a static lint note (14 gates; 9 at runtime).
- The debrief's one-line VM summary (`m07_closing_debrief.ink:115`) and HaX's VM hints are unchanged; whether they match the VM needs checking against SecGen by the user (U3).

### Phase 4 dialogue, cycle 2 (fixer, 2026-10-14)

Input: `DIALOGUE_REVIEW_P5_C2.md` (0 blockers, 0 majors, 23 minors, D7C2-1 to D7C2-23). All 23 applied with the review's rewrites. Two adjustments, both logged below. Ink recompiled (`scripts/compile-ink.sh m07_architects_gambit`: 8 files, 0 failed; the one END warning in the briefing is the existing `-> END` at the handoff). One erb text edit (D7C2-15), made after re-reading the line; the room-dressing edits were left alone. No browser session. Not committed.

| Id | Outcome | Line (old → new) |
|---|---|---|
| D7C2-1 | Fixed | debrief :221 "Ask me again when I have read you the other two." → "For the people the team reached, yes. That is the only half I can answer tonight." |
| D7C2-2 | Fixed | debrief :126 "It will not, tonight. It is done anyway." → "It will not, tonight. Count it anyway." |
| D7C2-3 | Fixed | debrief :582 choice "[(Say nothing.)]" → "[What does he do with a reading?]" (the :536 and :742 "(Say nothing.)" stay) |
| D7C2-4 | Fixed | debrief :369 choice "[(Say nothing.)]" → "[I'm keeping count, sir.]" (gate `asked_on_me` kept; no reply) |
| D7C2-5 | Fixed | :468 "And you told him he was scenery, there to keep us busy." → "He also heard from you that he was scenery, there to keep us busy."; :475 "Elena Rodriguez walked out and gave a statement without being asked twice." → "Elena Rodriguez gave a statement without being asked twice."; :493 "Ray Hollis walked out through the muster door into the police at the gate." → "The police picked Ray Hollis up at the gate." |
| D7C2-6 | Fixed | debrief :697 "You will live between those two. Most of us do." moved into the `else` (committed) branch; the uncommitted branch gets "That one you will have to live with." |
| D7C2-7 | Fixed | debrief :551 HaX "Word for word." → "Down to the forty minutes." |
| D7C2-8 | Fixed | debrief :752 "Outside, across three states, eight point four million people are asleep with the lights on." → "Outside, across three states, people are asleep with the lights on." |
| D7C2-9 | Fixed | HaX: the Park pointer choice moved from `people_topics` to the top of `stuck_topics`; `park_pointer_open()` dropped from `people_news()` and added to `stuck_news()` |
| D7C2-10 | Fixed | HaX :477 "[I found a dossier down in the vault. Tomb Gamma.]" → "[A dossier. Tomb Gamma.]"; :479 "[The intercept in the vault. They didn't leak the operation. They leaked me.]" → "[An intercept. They didn't leak the operation. They leaked me.]" |
| D7C2-11 | Fixed | HaX topic_mercer: "He'll talk. He's waited twenty years…" → "Good. He's waited twenty years for a room that has to listen."; last branch now gated on `mercer_ko` ("He never got to say his piece. He'll mind that more than the cell."), else "He came at you instead of saying his piece. Wherever he is, he's still writing it." |
| D7C2-12 | Fixed | HaX first call: "I can't be in the other two places." cut |
| D7C2-13 | Fixed | HaX redirect_closed: "You found the numbers were wrong. That goes in the report. Now finish…" → "{not revision_before_commit: You found the numbers were wrong. That goes in the report. }Now finish the part that's still yours." |
| D7C2-14 | Fixed | Architect: barks kept in the erb. T-5 :289 "Five minutes on the display. Your handset lights…" → "Your handset lights…"; :291 "Five minutes on the display. The handset opens…" → "The handset opens the line without asking."; T-1 :348/:350 "{countdown_expired:The countdown has run out.\|One minute.} …" → "{countdown_expired:The countdown has run out. }…" |
| D7C2-15 | Fixed (one erb edit) | Architect :237 "…Soon your team won't be yours to move." → "…It only requires you to wait."; erb :1481 login bark "You logged in, Agent 0x00. A word about doors." → "A word about doors, Agent 0x00." (text field only; the ink line "You logged in. The door closed behind you." stays) |
| D7C2-16 | Fixed | Architect :241 "You sent your team to Washington. San Francisco and the vendors are on your clock." → "Washington, then. San Francisco and the vendors are on your clock."; :243 "You sent your team to San Francisco. Washington and the vendors stand open." → "San Francisco, then. Washington and the vendors stand open." |
| D7C2-17 | Fixed | Architect T-5: "[I made a call. I'll carry it.]" gated `team_assignment != ""`; new "[I didn't make one. I'll carry that too.]" for `== ""` (both "Noted."); close line for no team: "You'll have to name all three, eventually, to somebody with a tablet." (committed unchanged). New route r31 |
| D7C2-18 | Fixed, adjusted | Hollis `wary_again`: the clone sighting plays once. The review suggested `wary_said`; that flag is already true when the player met him before cloning (r14), which would skip the first post-clone sighting. Used a new latch `clone_sight_said` instead. Later re-talks fall to "Still here. Say it or go." |
| D7C2-19 | Fixed | Mercer :280 "End it how? While the host in the server hall drives it, this chair takes no abort, and…" → "End it how? This chair takes no abort while the host drives it, and…" |
| D7C2-20 | Fixed | Mercer :176 "I testified twice, and filed the same submission twice in eight years." → "I testified twice. The same submission went in two times in eight years." |
| D7C2-21 | Fixed | Elena :111 "{&Still here. Ask.\|I haven't moved. Neither has the table.}" → "{&Ask. I can listen and type.\|I haven't moved. Neither have the tables.}" |
| D7C2-22 | Fixed | Elena :371 "[Say nothing.]" → "[(Say nothing.)]"; Mercer :110 "[Say nothing. Let him fill the silence.]" → "[(Say nothing. Let him fill the silence.)]"; both `You: ...` lines cut |
| D7C2-23 | Fixed | Briefing: the Fracture "What can the team actually stop" choice labelled `stop_asked`; the tail line "If the team goes there, the story never runs. The breach does." is skipped when it was asked |

#### Route driver

`scripts/ink_runtime_check/m07_routes/`: r2 (T-10 else line), r3 and r7 (login bark), r24 (T-5 and T-1 narrator lines; the bark asserts stay, T-1 gains "One minute, Agent 0x00."), r28 (renamed choices, Mercer line, Park pointer now asserted under "I'm stuck on something." and not under people), r29 (the "I'm keeping count" and "What does he do with a reading?" picks, "Down to the forty minutes.", the uncommitted refusal line, and `not said` for "You will live between those two."), r30 (new Was-it-worth-it reply; "he was scenery"; `not said` for the old deferral) updated. r14 gains a second re-talk after the clone ("Still here. Say it or go.", not the sighting again). New r31 (uncommitted, logs in, hears T-5: offered "I didn't make one", not "I made a call"; no "yours" question).

#### Checks (static; no browser session started)

- All 31 routes (r1 to r31): every expectation met; longest run without a choice 9 (briefing) in the worst route, never above 9.
- `dialoguelint` on m07: the `you-after-choice` notes are gone; remaining notes unchanged from cycle 1 (one "however" in the Architect, one "Not to this room. Somewhere without windows." in the debrief, three blank-reentry notes on Hollis and Park, `crowded-hub` on the HaX hub which stays 14 gates, at most 9 at runtime).
- `reopencheck` (missions.json): 0 problems in total; HaX 1800 reopens, 1280 re-runs; Architect 472 reopens, 316 re-runs.
- `loopcheck` (200 steps × 6 strategies) on the debrief (two states), HaX hub, `stuck_topics` and `topic_mercer` (escaped and ko), the Architect start and `taunt_t5_choices` (committed and uncommitted), Hollis `wary_again` and start (cloned), Mercer, Elena and the briefing: no runtime errors.
- `tagdiff` run; `inkcheck.js` needs a state spec I didn't build, so it wasn't run. `validate_scenario.rb` runs clean on the erb.
- Each touched line grepped in the ink after the edit and reads as intended.

#### Open after cycle 2

- The targeted browser check named in the review (the debrief beats on a committed and an uncommitted route, HaX's three sub-menus including the Park pointer now under "stuck", Elena's and Mercer's re-talk lines, T-10 with T-20 folded in, the T-5 bark then the call) is not yet run.
- The debrief VM summary and HaX's VM hints still need the user's check against SecGen (U3).

### Stage 4 room dressing (2026-10-14)

Full detail, per room and per finding, in `ROOM_DRESSING.md`; evidence in `build_evidence/dressing_c<N>/`.

| Cycle | Blocker | Major | Minor | Outcome |
|---|---|---|---|---|
| 1 (survey, own maps, all six rooms built) | 1 | 5 | 2 | All fixed: six `room_pnw_*` maps (shared maps untouched, U6 cleared for m07), 11 objects onto real fixtures (11 NO SLOT before, 0 after). First room (operations floor) pending sign-off, U13 |
| 2 (fresh Opus review of cycle 1) | 0 | 3 | 19 | 17 fixed, 1 in part, 2 left with reasons (handover-sheet wording; mimic behind the monitor) |

### Stage 4 room dressing: CLOSED (orchestrator, 2026-10-14)
Cycles 3–5 detail in `ROOM_DRESSING.md`. Cycle 5 fresh review 0/0/4 (`build_evidence/dressing_c5/review_c5.md`): m-1 ops back-row chair behind shelves, m-2 ATS cover should lean on the wall, m-3 open trench reads as a grille, m-4 stale builder docstrings — all optional, to pick up during lighting. Interaction walk game 2443 (`build_evidence/dressing_c5/walk_game2443.md`): 0/0/5, no pick-one menus, doors and lanes clear, fixtures persist after read and reload; F1 SCADA monitor hides the mimic's left lights (minor). Top-left taps on the five takeables untested (they vanish on first take). First room (operations floor) pending sign-off, U13. Next: lighting.

### Phase 4 dialogue: CLOSED (orchestrator, 2026-10-14)
Cycle 2 review 0/0/23, fixed (ba0308c5); browser check games 2445/2450 all five items pass (`PASS5_DIALOGUE_BROWSER_CHECK.md`). Orchestrator fixed its N3 (Netherton now answers "[What does he do with a reading?]": "Uses it. That is next year's problem, not tonight's.") and N4 (the deduction choice retires after the abort). N1 (number keys 1–5 only) backlogged; N2 sub-menu reopen is known and accepted. Routes 31/31, lint clean.
