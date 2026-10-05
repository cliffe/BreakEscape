# sis02 Albion Battery Hall: Code Red, script editor review

Fresh review of the fix pass (commit 9cf6d9e) against the user's decisions at the top of `DIALOGUE_REVIEW.md`. Read-only apart from this file. Reviewed 5 October 2026.

## Verdict

**Revise.** The fix pass did what was asked. I checked every decision and every round-1 blocker and major at its line (section 2): 12 of 15 decisions fully hold, and the other three hold in the words but slip in one place each. Three of the five round-1 blockers are closed; S2 and PRI-1 are closed apart from one case each (MJ4, MJ1). Of the 31 majors, 29 are closed (HEL-5's knot is closed but its radio slips, MJ3; PRI-6 is partly closed, MJ5). The eight decision scenes are real, short, and each comes back once in Priya's debrief and once in the credits. The physics, the regulation and the NCSC's role are now right. Priya is recognisably sis01's Priya, and Helen sounds like a Nottinghamshire engineer. Every mechanical check is clean: lint, reopencheck, and loopcheck in five states, including the evacuation.

What stops it shipping:

- **MJ4**: the evacuation and the gas alarm are right in the words and absent from the rooms. The burning hall still says it is cooling, and walking into gas has no consequence.
- **MJ3**: one radio line from Helen re-gates the ESD on Marcus.
- **MJ1**: the debrief praises a shutdown argument the player never acted on.
- **MJ2**: the evidence-before-safety scene preserves the wrong evidence.
- **MJ5**: the safety-case scene teaches "claim, condition, evidence" instead of claim, argument, evidence.
- **MJ6**: Priya says the same moral four times.

All six are cheap. About 25 voiced lines change.

## 1. Checks run

All from the repo root with `BUNDLE_FORCE_RUBY_PLATFORM=true LANG=C.UTF-8`.

- `bin/inklecate` on all four `.ink` files into scratch: 4 compiled, no warnings, each byte-identical to the committed `npc_*.json`. The stale `npc_priya_sharma.ink.json` is gone (M8).
- `validate_scenario.rb --skip-ink --no-graph`: schema passes, no unknown fields, door alignment and room geometry OK. Warnings: (1) two "can pass at the same time" groups on Helen, `esd_activated` (indices 5, 6, 9) and `facility_safe_state` (11, 12, 13). Both are intended: 5 and 6 are disjoint on `early_esd_activation`, 12 and 13 on `nis_notified`, and 9 and 11 are meant to fire alongside. (2) No `conclusionScreen` on `post_incident_debrief`: sis01 and m01 have none either, so ignore it. (3) The evacuation cutscene (`scenario.json.erb:658-666`) has no `background` (m14). (4) Helen has no `spriteTalk` (cast phase, m14). (5) Every credits section is all-conditional: checked by hand in section 6, each covers every route that can reach the debrief.
- `dialoguelint.mjs scenarios/sis02_energy/`: **no findings**. Longest lines: Priya 28 words, Helen 25, timed texts 27. Nothing over the cap, no self-prefix, no fall-through, no blank re-entry.
- `reopencheck.mjs scripts/ink_runtime_check/missions.json` (sis02 is in it now): Marcus 1800 reopens, Tom 1800, **0 problems**. The "held back" notes (Marcus's isolation, evidence, shutdown and NIS scene openers; Tom's scope and isolation openers) are the phone thread not repeating text already on screen, which is right.
- `loopcheck.js` and `inkcheck.js` on Helen `start`, `arrival_briefing`, `hub`, `evacuation_scene`; Marcus `start`, `hub`; Tom `start`, `hub`; Priya `start`, under five global states: defaults; early (briefed, dial read); mid-game (historian, jump server, Marcus contacted); late (SIS confirmed, ESD, isolated, form read, hydrogen alarm, Priya visible, Trent raised); evacuated (hydrogen alarm, `facility_evacuated`, `esd_activated`, Priya visible). 45 entry/state pairs × 2 harnesses: **0 runtime errors, 0 empty choice lists, 0 failing paths**.
- Globals cross-check (every `globalVariables` name against ink `#set_global`/`~` writes, ink reads, scenario writes and reads, and the engine for `sis_config_seen` and `sis_tamper_confirmed`, which `sis-config-threshold-minigame.js:55, 229` sets): nothing read and never set. Set and never read: `rate_of_change_viewed`, `compare_racks_viewed` (m11). `en002_verdict` and `patch_decision` are read only by the credits, which is fine.
- Engine read where the dialogue depends on it: `esd-pushbutton-minigame.js:205-222` applies `conditionalActions` before `completionActions`, so `early_esd_activation` and `esd_before_dial` are set before `esd_activated` fires Helen's two acknowledgement mappings. The early/late split works.
- Pack, sis01 and sis03 searched for every new name and figure (section 8). No browser playtest is part of this review; `PASS_PLAYTEST.md` is a plan, not results.

## 2. Did the decisions and the round-1 findings land?

Checked at the line, not from the commit message.

### Decisions

| # | Decision | Status | Evidence / where it slips |
|---|---|---|---|
| 1 | Pack's attack story | Closed | Internal source 10.2.4.12 = ALB-SRV-02 (`scenario.json.erb:1509-1528`); Fosse Controls, domain locked, jump server local account left with default password (`:1530-1540`); Tor only as C2 egress; no SIS log, ENG TOOL HISTORY tab (`:1546-1592`); 55→85°C and 1.0→3.8% (`:1572-1590`, SIS panel `:1676-1697`). Marcus `:170-175`, Priya `:307-310`. The Tor address is still a real one (m10). |
| 2 | Saturday 21 March 2026 | Closed | Brief `:42`, live status `:904`, logs, historian `:924-936`, credits subtitle. 21 March 2026 is a Saturday. 01:47 + 4h43 = 06:30 on the log, rack and anomaly. "Helen called you in" gone; the players are the 07:00 window team (Helen `:56`). |
| 3 | ESD never gated | Partly | Three ungated stations (`:1089-1140`, `:1335-1357`, `authVar` always true `:84`); label gone; folder and objective say "Nobody needs permission" (`:965`, `:291`). Helen's historian radio still says "Message Marcus before we do anything else" (`:628`, MJ3). |
| 4 | Four arguable views | Closed | (a) Marcus `:127-142`, player wins; (b) Marcus `:286-291`, Priya answers `:245-249`; (c) Helen `:258-269`; (d) Priya `:210-217` with one push-back. |
| 5 | Regulation | Closed | Marcus `:225-262` (Ofgem with DESNZ, NCSC alongside, 72 hours at the outside, HSE, NESO); folder `:965`; form `:1010`; Priya `:70`, `:83`, `:273`, `:329`. No COMAH, no Bill, no "Dr", OES designation sentence in folder and pack. |
| 6 | Abstract NIS clock | Closed | Timer sets only `nis_deadline_missed` (`:397-405`); Helen's bark (`:709`) and Priya (`:261`, `:267`) say "your own clock", no 72 real hours. Hazard timers start on `helen_briefed` (`:415`, `:433`). The clock still starts at game start (m12). |
| 7 | Hydrogen by volume; evacuation as an outcome | Partly | Units right everywhere (detector `:1402-1415`, SIS panel, credits, Helen `:278-279`). The evacuation runs the debrief (`:658-666`, Helen `:324-336`, Priya `:93-95`). After it, the world still says the hall is cooling and can be walked into (MJ4). |
| 8 | Trent Water, Albion → Trent | Closed | Extract `:1805`; Tom `:160-187` with consent and a route back (`:68-69`, `:172-176`); Priya `:279-298`; "not an OES" in folder, Tom, Priya. |
| 9 | Eight decision scenes + R2 | Closed, two weak | All eight exist and each comes back in Priya and the credits (section 3). PRI-6 never names the argument (MJ5); R2's evidence point is technically off (MJ2). |
| 10 | Naming, place, cast | Closed | Ids `helen_marsh`, `priya_s`; "Priya S." everywhere; sis01 sprite, talk, visemes and identical voice style (`:750-766`); Newark; Whitworth (Marcus `:62`, Helen `:264`, risk assessment `:1747`). |
| 11 | Voices | Closed | Helen's style names a consistent Nottingham accent (`:572`); Priya's is sis01's string, character for character. |
| 12 | Lab sheet: two errors | Closed | `labsheet.md:78`: Helen notices, SIS described correctly. NERC CIP etc. wait for phase 6, as decided. |
| 13 | Risk beats | Closed | R1 Helen `:171-185`, Marcus `:127-142`, Priya `:134-139`; R3 Priya `:231-239`; R4 Marcus `:277`, Priya `:241`; R9 Priya `:146-172`; R2 Marcus `:149-161`; R5 Marcus `:197-218`, Priya `:193`; R6 Tom `:95-97`; R8 Helen `:244`, Priya `:249`. |
| 14 | Carry-over | Partly | Note softened (`mission.json:175`, last paragraph). `"consequences_persist": true` remains (`mission.json:168`) and `docs/IDEAS_BACKLOG.md` has no sis02→sis03 entry (m13). |
| 15 | sis03 edits | Not reviewed | Another agent is editing sis03 now; see section 8 for two things that agent should know. |

### Round-1 blockers and majors

| Finding | Status | Verified at |
|---|---|---|
| M1 starved knots | Closed | Every re-enterable knot has an unconditional `+` (`helen:225, 250, 268`; `marcus:116, 216, 292`; `tom:81, 103`); loopcheck clean in five states. |
| M2 early call locks the ESD | Closed | `marcus:57-60` sets `marcus_webb_contacted` on the first message whatever is said; no station reads it. |
| S1 hydrogen units | Closed | See decision 7. |
| S2 walking into gas, evacuation as failure | Partly | Stations outside, "stay out" in Helen `:279-281` and her radio `:655`, evacuation not a failure. Nothing happens if the player walks in during the alarm or uses the station inside (MJ4). |
| PRI-1 ungated debrief | Partly | Every Hall 1 line is gated (`priya:93-133`), but the shutdown-argument line praises "the right order" when the ESD came late or never (MJ1). |
| M3 Priya missing on isolate-first | Closed | Safe state from mappings, either order (`:667-685`). |
| M4 Trent "verify" dead end | Closed | `tom:68-69`, sticky `trent_water_action`, Priya `:287-288`, credits. |
| F1 to F6, F8 | Closed | Dates and times; 200 MWh, 50 MW, four A racks, 48 MW import; attack story; SIS weakness; Trent direction; historian trend 0.033 °C/min reaching about 51°C at 06:30 (`:930-933`), "Eighty-five puts the trip inside that" (`helen:236`) against the pack's 80 to 120°C self-heating; no 72 hours in 45 minutes. |
| REG-1, REG-2 | Closed | See decision 5. |
| HEL-1 | Closed | Briefing has unease, not the finding (`helen:57-59`); radio asks (`:621`); the gauge is the player's call (`helen:144-164`). The radio and the knot now say the same thing twice (m1). |
| HEL-2 | Closed | One ESD knot, ends on the proof test (`helen:207-226`). |
| HEL-3, HEL-4 | Closed | Jay (`helen:58-59`); Helen stays at her desk and says why (`:64`); objective no longer says "with Helen". |
| HEL-5 | Closed in the knot | `helen:171-185`. Her historian radio slips (MJ3). |
| HEL-6 | Closed | `helen:258-269`; modification procedure, not "third-party SIL 2 auditor". |
| MAR-1, MAR-2, MAR-3 | Closed | `marcus:127-142, 197-218, 225-262`. |
| TOM-1, TOM-2 | Closed | `tom:51-54`; `tom:111-135`, the lie is caught by the ring-back. |
| PRI-2, PRI-3, PRI-4, PRI-5, PRI-7 | Closed | Role `priya:70, 83, 273, 329`; no clause numbers spoken, zones and conduit `:248`; root cause points at ENG-02 and the overdue review `:307-312`; patch both sides `:224-239`; each decision debriefed. |
| PRI-6 | Partly | Real question with three answers (`priya:146-172`), but "claim, condition, evidence" in place of claim, argument, evidence (MJ5). |
| L1, L4 | Closed | Eight scenes; air gap is Marcus's view only, the diagram's "CYBER-IMMUNE" label is gone (`:1186`). |
| L6 | Closed for this pass | Decision 12. |

### Round-1 minors

Closed: M6, M7, M8, M9, F7, HEL-7, MAR-4, TOM-3, PRI-8, PRI-9, CR-1, L5, L7, V1. Partly: M5 (two progress flags still unread, m11), M10 (Helen's talk portrait and the cutscene background, m14), DOC-1 (real Tor address, m10), MIS-1 (`consequences_persist`, m13).

## 3. Teaching

### The eight decision scenes

| Scene | Real trade-off? | Short? | Comes back in Priya | Credits |
|---|---|---|---|---|
| Dial or screen (`helen:144-164`) | Yes: three defensible answers, plus "let me think" | 1 line + reply | `priya:110-117` | `:488-490` |
| Shut down now (`helen:171-185`, `marcus:127-142`) | Yes, and the cost is said in one line on each side | 1 or 2 lines | `priya:118-125`, then the R1 question `:134-139` | `:491-492` |
| Photo before the ESD (`marcus:149-161`) | Yes in shape; the evidence claim is wrong (MJ2) | 2 lines | `priya:126-133`, gated off the evacuation route | `:498-499` |
| How far to isolate (`marcus:197-218`) | Yes: each option names what it costs | 3 lines | `priya:182-194` | scope lines |
| Who may instruct CastleTech (`tom:111-135`) | Yes: a false "Marcus signed it" is caught by the ring-back | 2 lines | `priya:195-200` (does not tell a lie from an early ask, m17) | `:508-509` |
| Initial NIS notification (`marcus:225-262`) | Yes: send now with unknowns, or wait; three state-aware versions of "now" | 2 lines | `priya:259-272` | four lines |
| CLAIM-EN-002 (`priya:146-172`) | Yes, and the "it held" answer is answered well | 2 lines | is the debrief | `:529-530` |
| Patch as risk owner (`helen:258-269`, `priya:224-249`) | Yes: both sides voiced before the question; neither is "my recommendation" | 3 lines | is the debrief | `:531-532` |

This is the round-1 table turned round: every pack decision is now a choice in play, and every one returns once in the debrief and once in the credits. The lines are short. The Trent Water choice works too (`tom:169-180`, `priya:279-298`), and the question "Did Trent Water need telling under NIS?" (`:292`) is a good one-line check on the OES idea.

Two weak spots:

- **The shutdown line ignores what the player then did** (MJ1). Arguing "shut down on the hazard" and then not pressing for 25 minutes is debriefed as "That's the right order."
- **R2 teaches the wrong evidence** (MJ2). A photo of OPS-01 records what the historian already holds.

### Claim, argument, evidence

The scene is the best new teaching in the game: the claim is stated with its "provided" (`priya:151`), the player judges it, the wrong answer gets a reason rather than a mark (`:163`), and the evidence question has a concrete answer (`:167`). The other two claims follow in two lines (`:171-172`), each with the reason it held or half held. The CLAIM-EN-008 line ties back to Helen's proof test (`helen:210-211`), so the player has heard the evidence before Priya names it.

What it does not do is teach the word the lab sheet and the unit use. Priya's frame is "A claim, the condition it rests on, and the evidence that the condition still holds" (`priya:147`). The argument (why the evidence would show the claim holds: nothing on the network can reach it, so nothing on the network can change it) is never said. MJ5.

### Arguable views

- **Marcus, logs first** (`marcus:132`): fair (penalties for a sensor fault are real) and answered by the player in one line. He concedes at once ("Fair. You're right.", `:136`), which is quick but credible for a security manager who has just heard the number. The other branch keeps his view without a lecture (`:141`). Good.
- **Marcus, air-gap the SIS** (`marcus:289-290`): one line of reason, and it is a real one. Priya answers once, gated on having heard it (`priya:245-246`), then gives the IEC 62443 alternative to everyone (`:248-249`). Good.
- **Helen, eight weeks without the trip** (`helen:262-264`): the strongest of the four; it is her own night shift talking.
- **Priya, cable before Marcus** (`priya:210-217`): presented as "My view", one push-back, partial concession. But Marcus has already said the same thing twice, once with Priya's exact argument ("Cut someone mid-write…", `scenario.json.erb:828`; also `marcus:180`), so by the debrief it is no longer her view; it is the game's. m8.

### Risk beats

Natural, mostly one line each, and in the right mouths: Marcus on acceptance with no review date (`marcus:277`), Tom on outsourcing the watching (`tom:97`), Helen on the key switch (`helen:244`), Priya on appetite (`priya:241`) and on which mistake you can live with (`:134-138`). The one place it becomes a lecture is the "nobody reviewed it" moral, which Priya says four times in one debrief (MJ6).

## 4. Accuracy

| Topic | Verdict | Evidence |
|---|---|---|
| NIS Regulations 2018 | Right | "Without undue delay, seventy-two hours at the outside" (`marcus:228`); initial notification with unknowns (`:241-242`, folder `:965`); designated OES under reg 8(3) (pack `:212`, folder). No Bill cited. |
| Ofgem / DESNZ | Right | "Ofgem, jointly with DESNZ" (`marcus:227`); Ofgem handles reports (folder); Priya "Ofgem decide whether to look further" (`priya:329`). |
| NCSC's role | Right | "They help. They don't regulate." (`marcus:189`); "We're told alongside, and we help. We don't fine anyone." (`priya:273`); "here to help, not to inspect" (`:70`). |
| IEC 62443 zones and conduits | Right | "its own zone, with one conduit in and someone watching it" (`priya:248`). The 62443-2-4 tie for CastleTech (R6's optional second half) was not added; not required. |
| IEC 61511 | Right | Modification procedure, impact analysis, retest, sign-off (`helen:266`; SRS extract `:1735`); no clause spoken; mission.json's 8.2.4 and clause 17 match the pack (`information_pack.md:299-300`). |
| Hydrogen by volume | Right | 0.4% = 10% LEL, 1.0% = 25%, 1.1% ≈ 27%, 2.0% = 50%, 2.1% ≈ 52%, burns at 4.0% (detector `:1402-1415`). Priya says "three point eight" with no unit (`priya:149`, m4). |
| Thermal runaway | Right | Trip at 55°C well short of self-heating, 85°C "inside that" (`helen:236`), matching the pack's 80 to 120°C (`information_pack.md:889`). Historian real trend reaches about 51°C at 06:30. "Kilograms of lithium" gone. |
| ESD | Right | Relay and contactors, proof-tested with everything digital off (`helen:209-211`); twist to release, reset at the hall panel (`:223`); anyone may press (`:212`). |
| Evidence before the ESD | **Wrong in detail** | MJ2: the ESD's loss is the PLC-BMS register image, not the screen, and the historian holds the falsified temperatures (sis03 Exhibit B says so). |
| SOC, MSP consent | Right | Tom needs Albion's consent to tell Trent Water (`tom:166`, folder); verifies authority out of band (`tom:114-115`). |
| TRITON | Right | Triconex key left in PROGRAM, 2017 (`priya:249`). |

One small physics point is not worth a fix: hydrogen at 0.4% and rising at the walkdown (`:1402`), with cells at 51°C, is early for venting from heat alone, but the pack's overcharge story (94% SoC driven at high rate) makes gassing plausible.

## 5. Spoken dialogue and voices

What is voiced: every Helen and Priya line, Helen's timed messages and bark (`scenario.json.erb:621-709`), and Priya's reveal bark (`:783`). Marcus and Tom are phone texts and free.

**Helen** now sounds like one person from Nottinghamshire: "What else, duck?" (`helen:100`), "It's the ESD or nowt." (`:237`), "Be quick, mind." (`:160`), "that screen's telling us fairy stories" (`:64`), "a hundred and eighty grand" (`:266`). She asks and reacts instead of explaining, and her technical lines are an engineer's, not a textbook's. Two lines drift out of her voice: "Nor am I. That's rather the point." (`:184`, southern and arch) and "Mr Whitworth" (`:264`, fine, but she calls him Whitworth nowhere else). Repetition: "doesn't climb … on its own" three times (`:110`, `:149`, `:154`) plus Marcus `:136`; "Real sensors wobble" twice (`:155`, `:195`). m2.

**Priya** is the same person as sis01's. Same entry shape and lines ("Ready now?|When you are.", "Take them. I'll be here.", "That's everything from me."; `priya:67, 76, 347` against `sis01 npc_sharma.ink:61, 69, 56`), same no-blame opener in the same rhythm (`priya:84` against `npc_sharma.ink:77`), same one-question-per-section shape, same verdicts that name the person and what they did. Her voice style is sis01's string exactly. Two things sound unlike her: "You'd be certain in the car park." (`:138`, too compressed to parse when heard; m6) and the four "nobody looked at it again" lines (MJ6), where sis01's Priya says a moral once.

Checks the brief asked for:

- **Shared greetings**: none between NPCs. But Priya introduces herself twice in a row: the reveal bark "Priya, from the NCSC. I was the nearest…" (`:783`) and then "Priya, NCSC incident management…" (`priya:70`). m3.
- **Same fact twice**: Helen's dial radio "Fifty-one on the dial and twenty-eight on my screen. Which would you bet the hall on?" (`:621`) is followed, when the player walks back, by the knot's "Fifty-one on the dial. Twenty-eight on my screen. One of them's lying to us. Which would you bet the hall on?" (`helen:145`). m1.
- **Definitions in an engineer's mouth**: none left. "He's OT security" (`helen:199`) is introduction, not definition.
- **TTS hazards** (m4): "ENG-02" (`helen:248, 301`, radio `:635`), "OPS-01" (`helen:299`), "RUN" and "PROGRAM" in capitals (`helen:244`), "DESNZ" (`priya:273`, likely spelled out letter by letter), "IEC 62443" (`priya:248`, likely read as a large number), "three point eight" with no unit (`priya:149`). "c.ellison" is now only in choices and credits, and the voiced lines say "the Ellison account" (`priya:308`, radio `:635`). Good.
- **Lines over ~30 words**: none (lint max 28).
- **Printed variables in voiced lines**: none. `{priya_s_visible: …}` (`helen:295`) and the `{&…}` alternatives choose fixed strings.
- **Dashes in new text**: none in the ink or in new player-facing scenario text. The ones left are old (noticeboard document `:1789`, the Purdue diagram labels and attack-path names `:1229-1233`) or in Priya's voice style, which must stay identical to sis01's. m18.
- **Choices**: all first person. One asserts what may not have happened: Marcus's "[Helen and I think Hall 1 should come off now.]" (`marcus:90`) is offered whether or not the player talked to Helen, or told her "give me five minutes". m7.

Spoken lines this review would change are listed per finding in section 7.

## 6. Structure

| Check | Result |
|---|---|
| Runs out of content | None: loopcheck/inkcheck clean on 45 entry/state pairs, including the evacuated state. |
| Fall-through choices | None (lint). |
| Blank re-entry | Helen `hub_quiet` (`helen:97-101`), Priya `start_quiet` and `debrief_quiet` (`priya:63-72`, `:358-362`): one silent return straight after an exit, a varied line after that. Phones keep their thread. |
| Debrief lines gated on what the player did | All Hall 1, isolation, notification and Trent lines are gated. Exception MJ1 (shutdown argument without the ESD). Ungated lines are statements true on every route (root cause, the claims, closing). |
| Globals set but never read | `rate_of_change_viewed`, `compare_racks_viewed` (m11). |
| Globals read but never set | None. `sis_config_seen` and `sis_tamper_confirmed` are set by the SIS minigame (`sis-config-threshold-minigame.js:55, 229`). |
| Pending scenes | None used. |
| One cutscene per event | Yes. `facility_evacuated` has one person-chat cutscene (`:658-666`); every other event is a timed message, a bark or a state change. Helen's two `esd_activated` acknowledgements are disjoint and both skip the evacuation route. |
| NPCs in unloaded rooms | None: Helen and Priya are in the start room, Marcus and Tom are phone contacts. |
| `debrief_complete` set once | Yes: only `closing_end` (`priya:348`), guarded by `debrief_closed` on every route back (`:60-62`, `:357-367`), and the music event ignores a re-set (`scenario.json.erb:475-476`). |
| Credits cover every path | Yes. Priya appears only at the safe state (ESD and Tom's isolation) or after the evacuation, so the ESD lines always print one entry; cable, isolation, SIS, notification and Trent sections each pair `x` with `!x`; `en002_verdict` and `patch_decision` are always set by the debrief's `*` choices. The third title, "CELLS SAFE, ATTACKER STILL CONNECTED" (`:484`), cannot be reached; harmless. |
| Soft-locks | None found. Tom's isolation needs Marcus's sign-off, which comes either from the session briefing (`marcus:187-188`) or from the "Tom needs your sign-off" option (`marcus:96-100`) once the player has asked Tom; the ring-back option stays on offer (`tom:72-73`). The debrief unlocks by mapping (`:781-782`), not by the aim's `unlockCondition`, so a player who never pulls the cable still reaches it. |
| Stale status answers | Helen's `next_steps` is right at every stage including the evacuation (`helen:292-316`). Helen's hydrogen answer and Marcus's `current_status` are not (MJ4). |

Small wiring notes (minor, free):

- Marcus "Signed off. I'll text Tom myself" (`marcus:99`), yet the player still has to go back and tell Tom to ring him (`tom:72`). Either Marcus says "Tell Tom to ring me", or a mapping on `network_isolation_authorised` sends a Tom text. m9.
- Tom's confirmation reads the "historian" scope only (`tom:141-143`); a player who chose "Shut SCADA down" hears nothing about it. m15.

## 7. New findings

No blockers. Six majors, eighteen minors. "Spoken" means the change alters or adds a voiced line (TTS cost).

### Majors

**MJ1 (major): Priya praises a shutdown argument the player then didn't act on.** Spoken: yes. `priya:118-120` prints "And you argued to shut down on the hazard, before anyone knew the cause. That's the right order." whenever `shutdown_argument == "hazard"`. On the late-ESD route it follows "The ESD went in after the gas alarm… that was the margin you spent" (`:104-105`); on the evacuation route it follows "The gas reached two per cent before anyone pressed the ESD" (`:94`). The player said "press it" to Helen or Marcus and then left it for 25 minutes or more, and the debrief calls that the right order. Fix, as a first branch of that block:

```ink
- shutdown_argument == "hazard" and hydrogen_alarm:
    Priya S.: You argued to shut down on the hazard. Then nobody pressed it till the gas came up. An argument only counts once somebody acts on it.
```

**MJ2 (major): the evidence-before-safety scene points at the wrong evidence.** Spoken: yes (Priya `:129`, `:131`); Marcus and credits free. Marcus asks for a photo of "the live status on OPS-01" because "the ESD resets the BMS" (`marcus:150-151`), and Priya says "That photo's the only record of what they wrote." (`priya:129`). But OPS-01 shows what the historian already recorded for seven hours (the player has just used it), and sis03's Exhibit B says exactly that: "SCADA historian faithfully recorded the falsified temperatures" (`sis03 scenario.json.erb:1125`). What the ESD destroys is the PLC-BMS register image (sis03: the controller's own shutdown routine overwrites the holding registers): the falsified state of charge, the charge-rate command and anything the historian does not poll. As written, a student who thinks it through concludes the photo was pointless. Fix (Marcus free):

```ink
One thing before you press it. When the ESD trips, the BMS controller writes safe values over its own registers.
The historian's got the temperatures. It hasn't got the registers. Ten seconds to save the register page on OPS-01, if you've got them. If not, press it anyway.
```

Priya `:129` → "You took ten seconds to save the register page. The reset wiped those registers. That's the only copy of what they wrote into the controller." Priya `:131` → "You pressed it without saving the registers. The historian kept the temperatures. The rest went with the reset. The hall came first." Credits `:498-499` and facilitator note 3 (`mission.json:175`) to match ("register page saved"; "register image lost, historian kept the temperatures").

**MJ3 (major): Helen's historian radio re-gates the ESD on a conversation.** Spoken: yes. "That line's been dead flat since twelve minutes past eleven. Somebody's writing it. Message Marcus before we do anything else." (`scenario.json.erb:628`). At the moment the player has the dial and the flat line, the scenario's main voice tells them to wait for Marcus, which is decision 3's opposite and the pack's lesson reversed (Helen makes the call, `information_pack.md:784`). Fix: two mappings, disjoint on `esd_activated`:

- not pressed: "Dead flat since twelve minutes past eleven. Somebody's writing it. If that ESD's not in, I'd put it in. Then message Marcus."
- pressed: "Dead flat since twelve minutes past eleven. Somebody's writing it. Message Marcus."

**MJ4 (major): the evacuation and the gas alarm don't reach the world.** Spoken: yes (two new Helen lines). Decision 7 and S2 are right in the words and wrong in the rooms:

- After the evacuation, Hall 1 is still open and the dial says "46°C … The needle is falling slowly since the shutdown." (`scenario.json.erb:1306-1311`, the `esd_activated` variant comes before any evacuation variant), in a hall the game has just said is burning.
- Helen's hydrogen answer, still on offer after the evacuation if the player had not asked before, ends "ESD's in and the fans are on full. Now we watch it fall." (`helen:282-283`).
- Marcus's "Where are we?" says "Hall's safe. Now get them out." (`marcus:326-327`); Marcus never hears about the evacuation at all.
- Walking into Hall 1 during the gas alarm, or pressing the station inside (`:1335-1357`), has no consequence and is never debriefed. S2's whole point, "nobody goes into a hall in gas alarm" (folder `:965`), is only ever said, never tested.

Fix:
- `facility_evacuated` variants first on the dial, rack panel and detector ("Smoke at the far end. You shouldn't be in here.");
- Helen `hydrogen_alarm_response`: a `facility_evacuated` branch, "It's past two per cent and it's alight. That's the fire service's now.";
- Marcus `current_status`: a first branch `- facility_evacuated:` "Hall 1's gone and everyone's out. Now get them off our network." plus a Marcus text on `facility_evacuated` (free);
- a Helen mapping on `room_entered:battery_hall_1` with `globalVars.hydrogen_alarm` and `onceOnly`: bark "Out of that hall. Now. Use the station by the door." (the start room is always loaded, so Helen hears it);
- on the inside station, a `conditionalActions` entry `ifGlobalTrue: hydrogen_alarm` setting `esd_pressed_inside_in_alarm` (the minigame supports `ifGlobalTrue`, `esd-pushbutton-minigame.js:215`), and one Priya line: "You pressed the one inside the hall, in a gas alarm. The one by the door does the same job from outside."

Closing the hall door after the evacuation needs an engine action that doesn't exist (section 8).

**MJ5 (major): the safety-case scene never names the argument.** Spoken: yes (`priya:147`, `:151`). Priya frames it as "A claim, the condition it rests on, and the evidence that the condition still holds." (`:147`). The unit, the pack (`information_pack.md:145-195`, "Structure of the Argument") and the coming lab sheet teach claim, argument and evidence; the scene teaches a different three-part frame and the word "argument" is never said. Fix:

```ink
Priya S.: Now the safety case. A claim, the argument for it, and the evidence that it's still true.
Priya S.: Albion claimed its safety system would trip whatever happened to SCADA. The argument was that it sat on its own network, so nothing on SCADA could reach it. Did that hold this morning?
```

The evidence answer (`:167`) then lands as the third part.

**MJ6 (major): Priya says "nobody reviewed it" four times in one debrief.** Spoken: yes. "Who checks it's still true in a year? That's what nobody did here." (`priya:239`); "Nobody checked it stayed inside." (`:241`); "Its review date was March last year. Nobody looked at it again." (`:312`); "Each one was written down, accepted, and never looked at again." (`:323`). Helen (`helen:264`) and Marcus (`marcus:277`) have already said it. sis01's Priya says each moral once. Keep `:323` as the closing summary and `:241`'s first sentence (R4's appetite beat). Cut "That's what nobody did here." from `:239` and "Nobody checked it stayed inside." from `:241`. Make `:312` "Marcus's risk assessment described this attack, eighteen months ago, almost word for word."

### Minors

- **m1** (Spoken: yes) Helen's dial radio and her knot open with the same two numbers and the same question (`:621`; `helen:145`). Radio → "Fifty-one? Come and tell me which one you believe."
- **m2** (Spoken: yes) Helen repeats herself: "doesn't climb … on its own" (`helen:110, 149, 154`, and Marcus `:136`); "Real sensors wobble" (`:155`, `:195`). `:110` → "You've told me what you think. Now let's see the historian."; `:155` → "Have a look at the historian and see if ours wobble."
- **m3** (Spoken: yes) Priya introduces herself in the bark (`:783`) and again on the first talk (`priya:70`). `:70` → "Priya. I'm here to help, not to inspect. Ready to go through it, or is there something to finish?"
- **m4** (Spoken: yes) TTS: "ENG-02" (`helen:248, 301`; radio `:635`) → "the engineering workstation"; "OPS-01" (`helen:299`) → "the operator screen"; "RUN"/"PROGRAM" (`helen:244`) → "run"/"program"; "DESNZ" (`priya:273`) → "with the energy department"; "IEC 62443's language" (`priya:248`) → "the control-systems security standard, IEC sixty-two four four three"; "three point eight" (`priya:149`) → "three point eight per cent".
- **m5** (Spoken: yes) Helen says "Go on" to the player when a station sits on her own console (`helen:176`); she then presses it "on the way past" from the desk she never leaves (`:326`). `:176` → "Agreed. The station on my console's right here. Press it, and I'll tell Marcus."; `:326` → "I've hit the ESD on my console. Too late for the A racks. They're going."
- **m6** (Spoken: yes) "You'd be certain in the car park." (`priya:138`) is too compressed to hear. → "Wait to be certain and you'll be watching it from the car park."
- **m7** (free) Marcus's choice "[Helen and I think Hall 1 should come off now.]" (`marcus:90`) shows on every route, including after the player told Helen "give me five minutes". → "[I think Hall 1 should come off now.]"
- **m8** (free) The cable moral is said three times before Priya's "my view": Marcus `:180` and his bark `:828`, which uses Priya's exact argument. Bark → "Who pulled the jump server cable? It needed doing. Tell me next time."
- **m9** (free) Marcus: "Signed off. I'll text Tom myself" (`marcus:99`), yet Tom only acts when the player comes back and says "Ring him" (`tom:72`). → "Signed off. Tell Tom to ring me."
- **m10** (free) A real Tor exit address, 185.220.101.45, is still on screen (Purdue diagram `:1189`, threat intel `:1527`) and in the pack (`information_pack.md:758, 902`). DOC-1 asked for a documentation range: 203.0.113.45.
- **m11** (free) `rate_of_change_viewed` and `compare_racks_viewed` are set (`:942-943`) and never read. Add them to "EVIDENCE YOU READ" or drop them.
- **m12** (free) The NIS countdown runs from the first second of the game (`:397-405`, no `startOnGlobal`), before anyone knows there is an incident. The 72 hours run from becoming aware. `"startOnGlobal": "historian_flatline_found"`.
- **m13** (free) `mission.json:168` still says `"consequences_persist": true`, and `docs/IDEAS_BACKLOG.md` has no sis02→sis03 carry-over entry (decision 14).
- **m14** (cast/free) Helen has no talk portrait (validator); the evacuation cutscene has no `background` (`:658-666`).
- **m15** (free) Tom: "A contractor account that left over a year ago" (`tom:100`); an account doesn't leave. → "A contractor who left over a year ago, logged in at quarter to two from a print server." His confirmation ignores the "shut SCADA down" scope (`tom:141-143`).
- **m16** (Spoken: yes) "Nor am I. That's rather the point." (`helen:184`) is out of her voice. → "Nor am I. That's the trouble."
- **m17** (Spoken: yes, new) The debrief treats a player who told Tom "Marcus has signed it off" when he hadn't the same as one who asked honestly (`tom:116-117, 132-134`; `priya:196-197`). Set `tom_told_false_authority` in `isolation_verify`'s refusal branch and add: "You told Tom Marcus had signed it off before he had. Tom rang him. Plenty of suppliers wouldn't."
- **m18** (free) Old player-facing text keeps em dashes and an old date: the noticeboard's "Issued at commissioning — 4 years ago" (`:1789`) sits oddly beside Marcus's "Two-way RDP for commissioning" on the grid upgrade Fosse commissioned 18 months ago; the Purdue path labels (`:1229-1233`).

## 8. Pack, sis03 and engine items

### Facts the fix pass pinned that the pack doesn't have yet

These are not ink errors. The pack (`information_pack.md`, source of truth) should take them, since sis03 already uses the first four (`sis03 scenario.json.erb:972, 1110`).

| Fact in the game | Where | Pack today |
|---|---|---|
| Fosse Controls, the integrator c.ellison worked for | `marcus:170`, account history `:1533` | "a commissioning integrator's engineer" (`:396`) |
| ALB-SRV-02 (10.2.4.12), the print management server the session came from | log `:1507`, threat intel, rack, diagram | "a compromised host on Albion's enterprise network" (`:758`) |
| svc.deploy, CastleTech's endpoint-management account; `print_driver_update.pkg` written 02:31, opened on TW-WS-07 at 05:52 | Tom `:163-165`, extract `:1804` | "a domain service account used by the CastleTech endpoint management platform"; "a file … opened on a Trent Water workstation" (`:794`) |
| Vendor advisory SA-2024-09, firmware 2.4.1; deferral September 2024; review date March 2025, not reviewed | SRS extract `:1735`, risk assessment `:1747`, Priya `:225`, `:312` | "eighteen months"; no advisory, no review date |
| Designated OES "in 2023"; reference OES-EN-0471 | folder `:965`, form `:1010` | designated under reg 8(3), no year |
| A third ESD station inside the hall | `:1335-1357`, Helen `:212`, folder | stations at the hall door and in the control room only (`:786`) |
| The ESD resets the PLC-BMS registers; a photo first | Marcus `:149-161`, Priya, credits | not in the pack (sis03 Exhibit B has it) |
| Hall 1 lost to fire after an evacuation at 2.0% | evacuation route | precautionary evacuation after the 06:34 ESD (`:794`) |
| Safety controller key switch; TRITON 2017 | Helen `:244`, Priya `:249` | not mentioned |
| ESD proof test last October; Whitworth on leave until 30 March | Helen `:211`; folder | proof test as evidence E11/E12, no date; "annual leave that weekend" |
| Tor exit 185.220.101.45 (real address) | `:1189`, `:1527` | same address (`:758`, `:902`); both should change (m10) |

### sis03 (report only; another agent is editing it now)

- sis03's Exhibit B says "No image of the registers was taken first" (`sis03 scenario.json.erb:1125`). That is one of sis02's routes; the "photo" route contradicts it. Fine while carry-over is not wired, but once MJ2 lands the sis03 facilitator notes should say Exhibit B assumes the player pressed without saving.
- The same exhibit says the historian kept the falsified temperatures, which is the reason for MJ2.
- sis03 assumes the pack's outcome (ESD 06:34, no hall lost). sis02's evacuation route is a real ending now; real carry-over belongs in `docs/IDEAS_BACKLOG.md` (m13).

### Engine and tooling

- **E1** No event action re-locks a room or door, so Hall 1 stays open after the evacuation (MJ4). The fix in MJ4 works without it.
- **E2** (tooling, optional) The validator's "missionConclusion but no conclusionScreen" warning fires on every SIS scenario, and none of them, nor m01, use one.

### For the user

- Decision 3 named stations at the hall door and in the control room; the fix pass also kept a third, inside the hall, with "In a gas alarm, use those" on it (`:1341`). Real battery halls often have a local station too, and with MJ4's debrief line it teaches something. Keep it (recommended), or remove it to match the pack.

## 9. Fix list

Counts: **0 blockers, 6 majors, 18 minors**. About 25 voiced lines change or are added (Helen about 12, Priya about 13); everything for Marcus, Tom, the documents, the credits and mission.json is free.

1. MJ4: carry the evacuation and the gas alarm into the world: evacuated variants on the dial, panels and detector; Helen's hydrogen answer and Marcus's status branch on `facility_evacuated`; a Helen bark on entering Hall 1 in gas alarm; record and debrief the inside station pressed in alarm. (Spoken: yes, 2 or 3 new lines)
2. MJ3: Helen's historian radio no longer says "before we do anything else"; split on `esd_activated`. (Spoken: yes)
3. MJ1: Priya's shutdown-argument line gets a branch for "argued, then didn't press". (Spoken: yes, 1 new line)
4. MJ2: R2 is about the PLC-BMS register image, not the screen the historian already recorded; Marcus, Priya `:129`, `:131`, credits, facilitator note. (Spoken: yes, Priya 2)
5. MJ5: name the argument in the claim scene, `priya:147`, `:151`. (Spoken: yes, 2)
6. MJ6: Priya's "nobody reviewed it" moral once, not four times; `priya:239, 241, 312`. (Spoken: yes, 3)
7. m4: TTS-safe wording for ENG-02, OPS-01, RUN/PROGRAM, DESNZ, IEC 62443, "three point eight". (Spoken: yes)
8. m1: Helen's dial radio stops repeating the knot's opening. (Spoken: yes)
9. m2: Helen's "on its own" and "sensors wobble" repetitions. (Spoken: yes)
10. m3: Priya's second self-introduction. (Spoken: yes)
11. m5: Helen presses her own console, not "on the way past"; "Go on" becomes "right here". (Spoken: yes)
12. m6: Priya's "car park" line. (Spoken: yes)
13. m16: Helen's "That's rather the point." (Spoken: yes)
14. m17: debrief line for a false "Marcus signed it" to Tom. (Spoken: yes, 1 new)
15. m12: NIS clock starts on `historian_flatline_found`. (free)
16. m7: Marcus's "[Helen and I think…]" choice. (free)
17. m8: Marcus's cable bark drops Priya's argument. (free)
18. m9: Marcus "Tell Tom to ring me". (free)
19. m15: Tom's "account that left"; Tom acknowledges the SCADA-off scope. (free)
20. m10: documentation-range address for the Tor exit, game and pack. (free)
21. m11: credit or drop `rate_of_change_viewed`, `compare_racks_viewed`. (free)
22. m13: `consequences_persist` false; IDEAS_BACKLOG entry for sis02→sis03 carry-over. (free)
23. m18: noticeboard date and old dashes. (free)
24. m14: Helen's talk portrait (cast phase); a background for the evacuation cutscene. (free)
25. Pack: add the pinned facts in section 8 (Fosse, ALB-SRV-02, svc.deploy, SA-2024-09, review date, inside station, register reset, the evacuated ending). (free)
