# m08 The Mole — puzzle-chains plan (pass 3)

> **Status: signed off; implementing** (round 3, `scratchpad/m08_round3.md`: no blockers, one major
> R3-M1 folded in below, 15 minors folded in during implementation; see §0 "Round 3 fold-in").
>
> Draft 3, 2026-10-01. Status before round 3: for round 3 (confirmation). Round 2 (`scratchpad/m08_round2.md`) found
> 1 blocker, 5 majors and 13 minors, all in P5–P7's whodunit text; the mechanics held. Changes since
> draft 2 are tagged [r2].
>
> **Draft 3 changes, by round-2 item.**
> - **R2-B1:** P6 step 4's right answer is now the corroboration by the people on the audit (Cipher's
>   eight minutes, Nightshade's "I'm always here", the off-duty agent's "before eight"). Draft 2's answer
>   ("he can't get near that") was false and is now a wrong option. Step 4 is asked only after at least
>   one suspect has confirmed his rows (`cipher_audit_confirmed`, `nightshade_audit_confirmed`).
> - **R2-M1:** with the audit but no clock, Netherton sends the player back at no cost.
> - **R2-M2:** step 2 asks "which of the three"; step 3 gains a wrong option that also cites the door log.
> - **R2-M3:** the Citadel keeps UTC; both "hours nobody's rostered" lines are rewritten (P5).
> - **R2-M4:** the witness: no "propped", "at the bench", "just gone twenty past ten" (P7).
> - **R2-M5:** P6's counter and tags live in choice-free knots; each step knot re-checks its state at the
>   top; the question text sits apart from the choices; "[Let me read it again.]" at every step.
> - **Orchestrator rulings:** the suite code is one synced global `suite_code` (W12 reversed); the safe
>   stays the main route and Netherton's P6 line points at it; the confession is a USB stick in the
>   locker; the desk keeps `type: pc` with no `contents` key; X10–X12 fix three more foreknowledge
>   lines.
> - **Minors R2-m1 to m13:** all taken (X10–X12; desk; HaX's split suite answer and the all-flags text;
>   Netherton's pointer; the USB stick; P9's accusation line; "not on the first reading"; the timeline's
>   48-hour sentence; E22 confirmed; "D-2" defined; R2-m10b noted; F3 and §6 recount Nightshade's own
>   lines; the Pacific Northwest relabel; W12 corrected).
>
> Draft 2's header follows.
>
> Draft 2, 2026-10-01. Status: for review round 2. Round 1 (`scratchpad/m08_round1.md`) found no
> blockers and six majors; the orchestrator ruled on each. Items changed since draft 1 are tagged [r1].
>
> **Draft 2 changes, by round-1 item.**
> - **R1-M1 (clock):** every time in the clue documents is now UTC on "D-2", with no weekday, anchored
>   to m07's deployment at 10:41 UTC (`m07 erb:1659`). The plan was opened at 10:38 UTC D-2, 48 hours
>   and 3 minutes before. The audit, timeline, auth excerpt, Phantom's flight and Netherton's P6 line
>   move together (P5, P6). §12 step 3 checks they agree.
> - **R1-M2 (m07 contradictions):** three lines are added to §0 as fixes to make during implementation
>   (X7–X9).
> - **R1-M3 (the quiz):** P6 is rewritten as when → who → two eliminations (Netherton argues for Cipher,
>   then questions Phantom's custody of the audit). The options in each step share one form. Cipher's
>   beat no longer states the method. The check allows two misreads; the third closes it.
> - **R1-M4 (free pointers):** F3 is recounted (eighteen pointers today, not seven). P7 cuts the three
>   narrator verdicts, "maximum access" in four places and four character pointers, and gives all three
>   dossier entries planning access.
> - **R1-M5 (the signed mail):** PERSONAL_BACKUP.enc moves into the locker (P8). W9 is reversed. The
>   CyberChef offer still fires when the player opens it there (P2).
> - **R1-M6:** Nightshade gets an audit beat (P7).
> - **Answers taken:** keypad suite kept (P4); Cipher's badge-in kept (P5/P7); KO locker key kept, and
>   Nightshade now hands it over when asked (P8); the rail ticket becomes a flight (P8).
> - **Missed chances taken:** the Crypto Lab's single door as evidence (P5); the off-duty agent as an
>   unreliable witness (P7); Netherton gives the suite code on a correct reading (P6, which interacts
>   with P4; see P4 and §6).
> - **Minors taken:** R1-m1 (printout margin), R1-m2 (P10 silence), R1-m8 (HaX's Netherton-KO text),
>   R1-m9 (duplicate keycard, §12), R1-m11 (stale comments, P12), "Technical Analysis" (P3), debrief
>   precedence (P6), "token cabinet" (P7), the "one thing he kept" contradiction and the Montana answer
>   (P8), `globalVarOnKO` for HaX (P9), the off-duty agent's "both exits" (P7), §2's deduction count,
>   order-dependent boss-key verdicts (§3), F8's privilege-escalation claim, A1–A3 status.
>
> Derived from `scenario.json.erb` (cited `erb:N`), the ink (`<file>.ink:N`, file names without the
> `m08_` prefix), the engine under `public/break_escape/js/`, and the regenerated `dungeon_graph.md`.
> CONTRACT.md's sections 1–8 predate pass 2 and were not trusted; its "PASS 2 amendments" were checked
> against the `.erb`. Line numbers are for the working tree after the section 0 fixes. The voice audit's
> edits (Nightshade is now Enceladus; CONTRACT.md matches) are kept as they are.

## 0. Status and fixes already made

**State at the start of this pass.** Validator: 0 errors, 1 warning (the confrontation cutscene is
deliberately not `onceOnly`, PASS2_IMPROVEMENTS.md "Verification"). Door alignment 8/8. Critical path
4 hops. Ink 12/12. Playtested to completion in pass 2 (games 1181–1183) and in the pass-2 regression
(`tools/playtest/m08-regress-report.md`). No pass-3 playtest yet.

**Fixed during planning (small, unambiguous bugs in m08's own files):**

| # | Bug | Fix | Checked |
|---|---|---|---|
| X1 | The opening cutscene starts the `cutscene` playlist (`erb:128`) and nothing ever moved it on, so a first run played the cutscene playlist through the whole investigation. m01 has the cue m08 lacked (`m01 erb:76-80`, `conversation_closed:briefing_cutscene` → noir). | Added `conversation_closed:opening_briefing_cutscene` → `noir` (`erb:130`). | rendered: playlists now cutscene, noir, noir, threat, spy-action, victory |
| X2 | The flag-2 cue played `"tension"`, a playlist that does not exist. `music-config.js:56-145` defines noir, threat, spy-action, cutscene, vocals, end, victory; `_startPlaylist` logs "Unknown playlist" and returns (`music-controller.js:366-371`). | Removed the dead cue. Behaviour is unchanged (it never played); the beat-map comment (`erb:110-125`) now matches. | as X1 |
| X3 | Continuity with m07. m07's debrief reads **three** unanswered operations when the team was never committed (`m07_closing_debrief.ink:208-212`, a reachable state with its own credit line). m08 said "One tactical team, committed to one. Two crises went unanswered … OF THE TWO UNANSWERED … civilians at both sites" (tactical board) and "the two unanswered sites" (Nightshade's sent mail). | Both are now count-free: "one tactical team for the other three. Every crisis it could not reach went unanswered" / "AT THE UNANSWERED SITES" (`erb:986`); "the unanswered sites" (`erb:90`, re-encoded by the ERB). "Two of ours" stays: m07 says it on every path (`m07_closing_debrief.ink:225`). | validator 0 errors |
| X4 | Stale lesson 24. A KO'd NPC now drops its `itemsHeld` (`npc-hostile.js:139`, `:258-261`), and a given item is spliced out first (`npc-game-bridge.js:306`), so a Director knocked down before he hands over his keycard leaves it on the floor. HaX said "You still need a server-room badge: the visitor printer…" (KO text) and "The Director's in no state to hand you his keycard now, so it's the visitor badge printer" (phone hub). | Both now say the card will be beside him if it wasn't already handed over, then give the printer route (`erb:574-578`; `phone_agent_0x99.ink:46`). Compiled 12/12; only `m08_phone_agent_0x99.json` changed. | compile, validator |
| X5 | The ERB header's room drawing put Intel Analysis over the Crypto Lab and the Director's office to the south (comment only). | Redrawn from `connections` (`erb:25-36`). | — |
| X6 | TESTING_WALKTHROUGH.md promised "Music → tension on flag 2" and a printer-only route after a Netherton KO. | Updated to match X1, X2 and X4. | — |

Nothing else was changed. Validator after the fixes: 0 errors, the same 1 warning; doors 8/8;
ink 12/12.

**[r1] Bug-sized fixes to make during implementation (R1-M2).** In m07 the player chose the team's
target live at T-0, or chose none (`m07_opening_briefing.ink:262-286`; `team_assignment` may stay
`""`), and the intercept says "One team uncommitted -- they'll have to choose" (`m07 erb:1661`). Three
m08 lines assume otherwise:

| # | Line | Fix |
|---|---|---|
| X7 | Nightshade: "I knew, to the site, which crises the team could not reach" (`nightshade_confrontation.ink:58`). Nobody knew that until the player chose. | "I knew there would be four fires and one bucket, and that you would be standing in one of them. I didn't need to know which way the bucket went. Every way it went, people died." The rest of the line ("I did the arithmetic … with my eyes open") stays. |
| X8 | Timeline: "T-68h team assignments confirmed" (`erb:1348`). | [r2, R2-m12] "T-68h Agent 0x00 pre-positioned, Pacific Northwest" (draft 2 had "Portland agent confirmed (0x00)"; this also explains why m07 opens with the agent on the I-5, `m07_opening_briefing.ink:19`). P5 and P7 edit the same text. |
| X9 | `scenario_brief`: "four ENTROPY operations went live inside the same minute, and one of them cost lives" (`erb:93`). m07 projects deaths at every unanswered site (`m07_closing_debrief.ink:236-257`), and two or three were always unanswered. | "…and the ones nobody could reach cost lives." |

**[r2, R2-m1] Three more lines claim ENTROPY knew the team's target**, the same class as X7:

| # | Line | Fix |
|---|---|---|
| X10 | Tactical board: "…because ENTROPY knew, in advance, exactly where our people would and would not be" and "Everything on this board -- the assignments, the timing, the agent -- was in the leak" (`erb:986`). | "…because ENTROPY knew in advance where our agent would be, and that one team could not be everywhere." and "the deployment, the timing, the agent". |
| X11 | Netherton: "…they are dead because a person in this building told the enemy where the gaps would be" (`director_netherton.ink:40`). | "…told the enemy there would be gaps." |
| X12 | The sent mail: "Package delivered: assignments, timeline, agent ID" (`erb:90`). | "Package delivered: deployment, timeline, agent ID". The ERB re-encodes the blob. |

The bible repeats "team assignments" (`insider_threat_initiative.md:77`); m08 follows m07 as built and
the bible line can stay.

**Not a bug in m08: E20.** `PASS3_APPROVAL_LOG.md:113` lists `nightshade_profile`, `encrypted_backup`
and `deep_state_manual` as world `text_file`s whose `onPickup` never runs. All three are container
contents (the safe, `erb:822-836`; the desk, `erb:1171-1196`), and the container path is different:
`container-minigame.js:477` runs `item.onRead || item.onPickup` on the click, then `:550-553` takes a
takeable item. The pass-2 regression run saw the debrief option gated on `found_nightshade_profile`
("Okafor told you in writing", `closing_debrief.ink:46`) in `tools/playtest/m08-regress-session.jsonl`,
and pass 2 run 1 saw the credits line gated on it. So m08 needs no `notes` conversion. The log entry
has since been corrected by the orchestrator (§11, A1) [r1]. §12 still asks the playtest to confirm `found_deep_state_manual`.

**Round 3 fold-in [r3].** The reviewer signed off once R3-M1 was in (P6's knot rules, above). The 15
minors, as implemented:

| # | Minor | Where it landed |
|---|---|---|
| R3-m1 | Step 4: not every wrong option names Phantom; gate moved | Fourth option is now "[The badge system printed it. Nobody typed those rows.]" → "Somebody chose the query, Agent, and the window." The confirmation check sits in `audit_case`, beside the clock check, so a turned-back player never re-answers steps 1–3 |
| R3-m2 | Step 3: minute tell (optional; taken) | The door-log distractor carries a time: "[The door log has him in at 10:24, before the file was opened.]" → "Before it opened. Was he there when it did?" |
| R3-m3 | Double-KO dead end | With `cipher_ko and nightshade_ko` and no confirmation, `audit_case` sets `audit_skip_step4` and the check passes in three steps. §6 and §7 updated |
| R3-m4 | Set booleans with `~` too | `~ audit_misread`, `~ audit_closed`, `~ named_on_evidence`, `~ cipher_audit_confirmed`, `~ nightshade_audit_confirmed`, `~ witness_heard`, plus the tags |
| R3-m5 | Counter before any visible text | Wrong-option bodies carry only `~ audit_reply = N`; `audit_wrong` increments first, then prints the reply chosen by `audit_reply` |
| R3-m6 | Audit's 0x3C row | "07:52  IN   0x3C  OFF-SHIFT" (no "(break room)"). 0x3C is "behind CL-1 all window, off shift, no planning access" |
| R3-m7 | Witness replays on reload | `met` guard and `return_visit`; "[What did you see that morning?]" repeats the testimony; `witness_heard` is declared and set |
| R3-m8 | Witness window | About 10:20–10:30 overlaps Nightshade (from 10:15) and Cipher (from 10:24) and ends before 10:38. The figure could be either man |
| R3-m9 | Phantom's rewritten line | "…from a Crypto Lab terminal, for forty-seven minutes, on a file you read in five" (notes and lead beat) |
| R3-m10 | The leaked file's name | `pnw_contingency.enc` in the auth excerpt; the three spoken "Portland plan" lines stay |
| R3-m11 | Audit beats assume the alibi | All three suspects' audit beats are gated on `asked_alibi` |
| R3-m12 | HaX's ungated suite option | Gated `not mole_identified` |
| R3-m13 | Rendering and recalling the code | The card renders `<%= suite_code %>`; Netherton gains `{ named_on_evidence and not suite_code_found }` "[The suite code again, sir?]" |
| R3-m14 | X10's wording | "Every crisis it could not reach went unanswered. ENTROPY knew in advance where our agent would be, and that one team could not be everywhere." "Handed the board" stays |
| R3-m15 | `found_timeline` citation | It is a `notes` item's `onPickup`, read through `interactions.js:1436`; behaviour unchanged |

One further implementation detail: the validator only maps a container's clue contents to the dungeon
graph when the container itself has `puzzle_graph_unlocks`, so `director_safe` gains
`puzzle_graph_unlocks: interrogation_room` with `puzzle_graph_optional: true` (Netherton's code is the
other route). Documentation only.

**Implementation record (2026-10-01).** Phases 0–3 (X7–X12, P1–P12 and the round-3 fold-in) are
implemented in m08's own files: `scenario.json.erb`, eleven of the twelve inks (all but
`m08_background_analyst.ink`), CONTRACT.md ("PASS 3
amendments"), TESTING_WALKTHROUGH.md, and the regenerated dungeon graph. Voice blocks untouched.
Static checks:
- `./scripts/compile-ink.sh m08_the_mole`: 12/12.
- Validator: 0 errors, 1 warning (the deliberate non-`onceOnly` confrontation, as in pass 2).
- `check_door_alignment.py`: 8/8. `room_depth.py`: 9 rooms, 0 empty, 6 lockType declarations.
- Rendered-JSON assertions (`scratchpad/m08_assert.py`, 70 checks, 0 failures): the times agree with
  each other and with m07's 10:41 UTC; one code source (room `requires`, card, `suite_code` global;
  no literal code in the ink); no "maximum", no narrator verdicts, no "rostered", no weekday;
  `pnw_contingency.enc`; no `||`/`(` in mapping conditions; tasks active; `name_the_mole` optional;
  start kit; desk `pc` with no contents; locker contents and key pins; X9, X10, X12; E18 clean.
- ink.js simulation of Netherton's check (`scratchpad/sim_netherton.js`): the no-clock and
  no-confirmation turn-backs record nothing; the full path completes the task, sets the globals and
  prints the code from the global; three misreads close the check; the double-KO path passes in three
  steps; a reopen at `audit_c3` with `mole_identified` lands on the hub; a reopen at `audit_c3`
  replays no text; step 3's first choice has `sourcePath` `audit_c3.0.15` (top-level knot); a wrong
  answer increments the counter before its first visible line.
- inkcheck (30 entry states, 13 of them Netherton's, including mid-check reopen and reload states) and loopcheck (11 hubs): all clean.
- npc-dialog-review on the changed inks: every `#set_global` declared and read (except the
  `witness_heard` receipt, by design); no syntax hazards; no starved knots. One fix made: the
  debrief's named-on-evidence follow-up line no longer refers back to an "instinct" it hadn't named.
No browser playtest yet: scripts in `scratchpad/m08_playtest_scripts.md`.

**Implementation review fixes (`scratchpad/m08_impl_review.md`; no blockers, 2 majors, 11 minors):**
- **M1.** The debrief's final block gives `audit_closed` its own first branch ("…read it to me three ways. The box made the case in the end. Next time, read it once, and read it right."), so it replaces the later tiers and "the box made the case" is said once. **m4:** a misread that was never followed up gets "You brought me that door log, read it wrong, and never came back to read it right. Noted." and its own tier line.
- **M2.** The confrontation's lab-KO, door-log and early-accusation lines now come after his answer to "Why didn't you?".
- **m1.** The auth excerpt now reads "TERM crypto-lab-04", so §6's claim that it names the lab is true.
- **m2.** The go-bag question's "Ask me properly" line is gated on `not asked_architect`; after Tomb Gamma he says "You have the coordinates now…".
- **m3.** "YOUR FIRST CALL TO THE DIRECTOR: Nightshade" is gated on `!named_on_evidence`.
- **m5.** HaX's phone `start` is silent after the first call (`first_call_text` knot, as in m07).
- **m6.** HaX's pre-flag-4 suite answer adds "or look at what he signs", so an ATHENA KO doesn't kill the pointer.
- **m7.** The stale ERB comments are updated (the header drawing, the archives password, the sent mail's location).
- **m8.** Phantom's audit beat no longer needs `asked_alibi`.
- **m9.** HaX in person has a met guard backed by the synced global `hax_person_met`, with a short return line.
- **m10.** The witness's exit becomes "[I'll leave you to it.]", and ATHENA's four options are first person.
- **m11.** Placement: both rooms were rendered with `scripts/render_room_preview.py`, with the sprites overlaid (`scratchpad/m08_place/`). The locker at (8.6, 3.0) overlapped the east wall and door, so it moved to (4.4, 7.3), mid-floor, clear of the tables, NPCs and walls. The audit at (4.6, 3.4) is clear, on the floor between the desks, and its observation now says it slid off the desk.
**Playtest fixes (pass-3 runs A–F, games 1301–1309; every numbered step passed):**
- **B-F1, keycard lost on a force-closed conversation.** The give tag was already the first thing in `take_keycard`; the conversation was closed before that line displayed. Netherton's hub now offers "[I'll need access.]" until a pickup mapping on `closing_debrief` (`item_picked_up:keycard`, `data.itemId === 'netherton_keycard'`) sets the new global `netherton_card_taken`. A give and a KO-drop pickup both emit that event (`inventory.js:638`; `npc-game-bridge.js` awaits `addToInventory`). "[I'm ready.]" and "[I have a name forming.]" accept either `gave_keycard` or `netherton_card_taken`.
- **A, "Work The Three Suspects" ticked with no interview.** An aim with only optional tasks completes as soon as any one completes (`objectives-manager.js:725`, `:757`); `read_the_archives` did it. The three interviews are now required. Brief-gated pairs on `closing_debrief` (`global_variable_changed:<suspect>_ko` and `brief_taken`) complete a knocked-out suspect's interview. The archives and `name_the_mole` stay optional. The validator flags the four `brief_taken` handlers on `closing_debrief` as able to co-fire; they complete different tasks, so that is intended.
- **D, locker interaction range.** The engine measures object reach to the sprite's top-left corner (`interactions.js:1253` passes `sprite.x/y`; scenario sprites use origin 0,0, `rooms.js:333`, `:657`), with one global 32 px range and no per-object setting (`constants.js:57`). Scenario objects get no collider (only tables do, `rooms.js:2568-2571`), so a player can walk onto the sprite's top edge. The locker moved down 0.15 tile to (4.4, 7.45), widening the aisle between the tables and its top edge, where the corner is. The harness stopping 36 px out is its arrival tolerance. An engine option (measure to the sprite's centre or nearest edge) is noted below for approval.
- **E7, reload mid-debrief.** Ours: the debrief backstop completed `take_the_debrief` on the first room entry after the reload, which concluded the mission and opened the conclusion screen with no credits (`objectives-manager.js:965-990`). The backstops now also set `debrief_backstop_fired` and only fire while `mission_complete` is false. A second victory entry on `global_variable_changed:debrief_backstop_fired` carries the same credits (one Ruby string renders both), so the reload ending rolls the credits. `BondVisualiser.open` injects credits into an already-open visualiser (`bond-visualiser.js:1477-1481`), so the order of the two opens doesn't matter.
- Rechecked: compile 12/12; validator 0 errors, 2 warnings (the deliberate confrontation one and the intended `brief_taken` co-fire); doors 8/8; `m08_assert.py` 0 failures (new checks for all four fixes); `sim_netherton.js` and `rev_debrief.js` unchanged; Netherton inkcheck and loopcheck clean with the keycard states.

**Git-history field guide (orchestrator, after the playtests).** A new sheet,
`HacktivityLabSheets/_labs/safetynet/secrets-in-git-history.md` (permalink
`/labs/safetynet/secrets-in-git-history/`), closes the A3 gap for flag 2. HaX's `itemsHeld` gains
`m08_gitsecrets_field_guide` ("SAFETYNET Field Guide: Secrets in Git History", `labUrl`
`https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/secrets-in-git-history/`, the same
permalink-to-URL mapping as the CyberChef sheet, which returns 200). The flag-2 mapping sets
`gitsecrets_guide_offered`, and its text now offers the guide. The phone ink adds the gate and a
`guides_menu` option that loops back to `guides_menu` (E13). The sheet is untracked in
HacktivityLabSheets and the URL returned 404 on 2026-10-01; it resolves once the sheet is published.

**Needs approval (engine, optional):** object interaction distance is measured to a sprite's top-left corner (`interactions.js:1253`, origin 0,0), so tall or wide objects are hardest to reach from their front. Measuring to the sprite's centre or nearest edge would help every mission.

- Rechecked: compile 12/12; validator 0 errors, 1 warning; doors 8/8; `m08_assert.py` 74 checks with 0 failures; `sim_netherton.js` all cases; `rev_debrief.js` shows "the box made the case" at most once per state; confrontation, phone and HaX-in-person simulations; inkcheck and loopcheck on the changed inks.

## 1. Summary — what to do, in order

m08 works: it validates, and pass 2 played it to the end on both fates. What it lacks is a mystery.
The mole's name arrives as a phone text at flag 4 (F1); every suspect says "check my alibi" and there
is nothing to check (F2); eighteen pointers name Nightshade for free, two of them at minute one,
while the herrings clear themselves (F3) [r1]; and the start-kit picks make the one deduction in the building, the Director's safe,
optional (F4). The plan turns the investigation into a puzzle the player solves from documents in
three rooms, then lets the VM prove it. It adds no rooms and moves no doors.

The deduction, in one line [r1]: the timeline or the auth log says when the plan was opened (10:38 UTC,
two days before Portland); the door audit says who was behind the Crypto Lab's only door at that
minute; and the player has to say why Cipher, who was in the same lab that morning, and Phantom, whose
query produced the audit, are cleared.

| Phase | Item | What | Depends on |
|---|---|---|---|
| 0 | X1–X6 | Done during planning: music (2), m07 counts, KO-drop texts, header drawing, walkthrough | — |
| 0 | X7–X12 [r1][r2] | Implement: six lines that contradict how m07 played (R1-M2, R2-m1) | — |
| 1 | P1 | HaX's guide menu: text knot → choices-only knot | — |
| 1 | P2 | Drop the mis-pointed info-leak guide; offer the CyberChef guide when the backup file is opened | P1 |
| 1 | P3 | Cumulative start kit; ATHENA logs it on arrival and names the missing PIN cracker | — |
| 2 | P4 | Interrogation suite on a keypad; its code card in the Director's safe; the printout's margin stops spelling out the safe | P3 |
| 2 | P5 | Door audit in the archives (UTC, D-2); clock times on the timeline and auth excerpt; the lab's single door; ATHENA hints the password; Phantom's notes and HaX point at the archives | X8 |
| 2 | P6 | Netherton's check: when → which of the three → why not Cipher → why trust Phantom's printout (the people on it confirm it); free turn-backs for a missing clock or confirmation; two misreads allowed; choice-free counting knots; he gives the suite code (synced global) and points at the safe | P4, P5, P7 |
| 2 | P7 | Cut the free pointers (narrator verdicts, "maximum access", four character lines); all three suspects get planning access; audit beats for Cipher, Phantom and Nightshade (two set confirmation globals); the off-duty agent as a timed, testable witness | P5 |
| 2 | P8 | Nightshade's locker in the break room (picks, the key he hands over when asked, or the key a KO drops); the backup file and the brief move there; go-bag with a flight to Helena | P3, P7 |
| 3 | P9 | KO gaps: HaX in person; Nightshade's lab KO and early accusation read in the confrontation | P6 |
| 3 | P10 | Music state after a reload | X1 |
| 3 | P11 | Delete dead state | P5, P9 |
| 3 | P12 | CONTRACT.md, walkthrough, dungeon graph | all |

Walked top to bottom: every "depends on" points at an earlier row.

**Needs user approval (§11):** lab sheets for git-history secrets, the `sudo apt-get` escape, and
mission-neutral framing (A3); PASS2_LESSONS lessons 18 and 24 are stale (A4). A1 (E20's m08 entry) and
A2 (the bible's voice line) are done by the orchestrator [r1]. None blocks any proposal.

## 2. Headline numbers

From `room_depth.py` and the validator (2026-10-01); m01/m02 maximum depth and hops from the m07 plan §2.

| | m01 | m02 | m08 now | m08 after plan |
|---|---|---|---|---|
| Rooms | 13 | 13 | 9 | 9 |
| Empty rooms | 0 | 2 | 0 | 0 |
| lockType declarations | 12 | 15 | 5 | 6 |
| Max room depth | 3 | 7 | 2 | 2 |
| Critical-path hops (aims) | 9 | 4 | 4 | 4 |
| Locks on the critical path | — | — | 1 (server RFID; 3 routes) | 3 (server RFID; suite PIN ← safe PIN) |
| Deductions the player must make to finish | — | — | 0 | 1: printout → Director's number → safe → suite, or the audit check, which also yields the suite code (P6) [r1] |
| Optional deductions with a payoff | — | — | 1 (safe, for the eval) | 2 (the audit check; the locker's backup through CyberChef) [r1] |
| Start-kit tool classes | 1 | — | 1 (lockpick) | 3 carried; 1 used (picks, on the locker) |
| KO-able NPCs | — | — | 8 | 8 |

The five locks today: server room RFID (`erb:1007-1011`), archives password (`erb:1062-1066`), badge
printer PIN (`erb:716-720`), Director's safe PIN (`erb:805-809`), interrogation room key
(`erb:1203-1208`). After: the suite becomes a PIN and the locker adds a key lock.

m08 is small and shallow on purpose: it is one floor of one building, with the VM as most of the play
time ("60-75 minutes", `mission.json`). Depth here should come from chains across rooms, not more rooms.

## 3. Boss-key audit

Depth from `room_depth.py`: lobby 0; Crypto Lab, Director's office, ops floor 1; break room, intel,
interrogation, archives, server room 2.

### Today

| Lock | First seen at | Key/code available at | Verdict |
|---|---|---|---|
| Server room RFID | 1 (ops floor east wall) | Netherton's keycard, 1, handed over on request in the brief | ⚠️ key-before-lock for most players |
| … via the badge printer | printer at 0 | PIN on the break-room post-it, 2 | ✅ boss-key |
| … via a Netherton KO | — | keycard drops at 1 (X4) | ✅ by design (a KO route, with its cost) |
| Archives password | 1 (ops floor south wall) | ATHENA reads it out at 0; post-it at 2 | ⚠️ self-solving (F6) |
| Director's safe PIN | 1 (office) | printout at 1 (ops), a deduction | ✅ boss-key |
| Interrogation key | 1 (Crypto Lab south wall) | picks at 0 (start); key in the safe at 1 | ✅ by design, but it makes the safe chain optional (F4) |
| Desk file → CyberChef | 1 | 1, same room | ❌ same-room; accepted (the author with the motive sits in that lab; optional) |

### After the plan

| Lock / check | First seen at | Key/code available at | Verdict |
|---|---|---|---|
| Server room RFID | unchanged | unchanged | unchanged |
| Archives password (P5) | 1 | post-it at 2; ATHENA and HaX hint | ✅ boss-key |
| Director's safe PIN | 1 | printout at 1 | ✅ boss-key |
| Interrogation suite PIN (P4) | 1 (Crypto Lab south wall, passed on the way to the break room) | code card in the safe (1) ← printout (1); or Netherton, on a correct P6 reading (1) [r1] | ✅ boss-key; one of two deductions is required for the confrontation |
| Nightshade's locker (P8) | 2 (break room) | picks at 0; his key, handed over after the audit beat or dropped by a KO, at 1 | ✅ by design (spending the m01 picks); ✅ boss-key for the hand-over route |
| Netherton's audit check (P6) | 1 (office) | audit at 2 (archives ← post-it at 2) + window time at 2 (timeline, break room; or auth excerpt, server room) | ✅ boss-key; parts in three rooms |
| Backup file → CyberChef [r1] | 2 (locker) | CyberChef at 1 (Crypto Lab) | ✅ the file now leaves the room it is decoded in |

**Order-dependent verdicts [r1].** Two verdicts hold for the expected route (brief → ops → Crypto Lab →
break room) and change for others:
- A player who goes east first (printout → safe) holds the suite code card before seeing the suite
  door: ⚠️ key-before-lock, but the card names its door ("INTERROGATION SUITE -- DOOR CODE").
- A player who goes west first finds the post-it before the archives door: the same, and the post-it
  names its door ("Archives backup pw").
Both are acceptable. No key sits in the room it opens.

## 4. Findings

### F1. The mole is handed to the player, not found
The name arrives as a phone text at flag 4: "It's Nightshade. It was always Nightshade" (`erb:563`).
Nothing the player does in the building changes when or how they know. The interviews, the archives
and the safe are optional (`erb:251-279`), which is right for the ending, but none of them is a step
in a deduction either: they are colour around a VM result. m07 leaves the player distrusting what
they are handed (`m07 PUZZLE_CHAINS_PLAN.md` §9, item 2) and asks m08 to make them work from evidence
they derive and check. Today m08 does the opposite. This is the mission's biggest gap, and the 3a
question ("are the mission's own choices required?") lands here: the investigation is decorative.

### F2. Every alibi says "check it", and there is nothing to check
- Cipher: "the library logs its own door, and you can pull the terminal auth for the leak window"
  (`suspect_cipher.ink:47`).
- Phantom: "a flight manifest with my name on it … Check it. I'll wait." (`suspect_phantom.ink:45`).
- Nightshade: "Pull the terminal logs -- I'd genuinely encourage it." (`suspect_nightshade.ink:41`).

No door log, manifest or badge record exists anywhere in the scenario. The player can only take each
man's word, and the debrief then praises or blames them for doing so.

### F3. Too many free pointers at Nightshade, and no checks [r1: recounted]
Draft 1 counted seven. Round 1 found more, and the honest count is eighteen, before any evidence:

| # | Pointer | Where | Kind |
|---|---|---|---|
| 1 | ATHENA: "whoever it is has **maximum access**" | `opening_briefing.ink:21` | access (minute one) |
| 2 | Dossier: only Nightshade is "Access: MAXIMUM" | `erb:798` | access (minute one) |
| 3 | Netherton: "Maximum clearance -- he helps write the plans" | `director_netherton.ink:70` | access |
| 4 | Printout: "Clearance: MAXIMUM" | `erb:917` | access |
| 5 | Archive index: "a trusted insider with maximum access" | `erb:1091` | access |
| 6 | Dossier note: "The one with nothing on the file worries me most" | `erb:798` | instinct (Netherton) |
| 7 | Netherton: "It is the empty file that keeps me awake" | `director_netherton.ink:71` | instinct (Netherton) |
| 8 | Netherton: "You and I have the same instinct, then" (confirms a guess) | `director_netherton.ink:106` | confirmation |
| 9 | ATHENA: "the calmest person in a frightened building" | `receptionist_ai.ink:24` | instinct |
| 10–12 | Narrator: "the first genuinely strange thing…", "a line rehearsed alone in the dark", "it convinces you of nothing except that you are right" | `suspect_nightshade.ink:48`, `:55`, `:88` | the game's own verdict |
| 13 | NPC observation: "He is the calmest person in the building" | `erb:1152` | the game's own verdict |
| 14 | Desk observation: "A man who has already decided he is leaving" | `erb:1170` | the game's own verdict |
| 15 | Cipher: "Nightshade asks nothing. Ever." | `suspect_cipher.ink:60` | instinct |
| 16 | Phantom: "the one who never flinches"; "I'd bet my pension it's the quiet one" | `suspect_phantom.ink:49`, `:56` | instinct |
| 17 | Timeline: "The roster says one name" | `erb:1348` | document |
| 18 | The off-duty agent: "Crypto's ahead this hour" | `background_agent.ink:18` | rumour |

On top of these, two pieces of hard evidence sit unlocked on his desk at depth 1: the recruitment brief
(`erb:1184-1196`) and PERSONAL_BACKUP.enc, which decodes in the same room to mail signed by
`nightshade_deep_state` (`erb:90`, `:1173-1182`).

**[r2, R2-m11] Not counted above, and kept:** Nightshade's own in-character lines, "I made my peace
with most outcomes" (`suspect_nightshade.ink:47`), "decided the ship is going down" (`:54`) and "Watch
the person who teaches you what to look for. He has already checked that he doesn't fit it." (`:61`).
They are the character speaking, which a whodunit owes its culprit, and they need the player to sit
down with him.

Pointers 1–2 solve the case before the player moves: access is the only discriminating clue the game
offers, and only one man has it. Pointers 10–14 are worse than instincts, because they are the game
itself giving the answer. Meanwhile the herrings clear themselves in their first answers
(`suspect_cipher.ink:40`, `suspect_phantom.ink:38`). That is m02's over-redundancy tell, in a whodunit,
where it costs the most.

### F4. The start lockpick makes the safe chain optional
The interrogation room is a key lock (`erb:1203-1208`) and the start kit holds picks (`erb:193-200`,
whose observation calls them "the fallback for the interrogation room"). The printout → service number
→ safe → key chain, the mission's one real deduction, can be skipped at minute one. Pass 2 logged this
and left it (PASS2_IMPROVEMENTS.md "Left alone"; `PASS2_APPROVAL_LOG.md:34`, `:78`). m07's plan asks
m08 to settle it against the kit rule (`m07 PUZZLE_CHAINS_PLAN.md` §9, item 1). The rule keeps the
picks in the kit, so the lock has to change if the chain is to matter.

### F5. The start kit breaks the arc rule
`startItemsInInventory` (`erb:184-201`) holds the phone and picks only: no RFID cloner (m03), no
fingerprint kit (m04). Nothing tells the player what they carry or that the PIN cracker is missing.

### F6. The archives password solves itself
ATHENA reads it out on request: "it is 'TrustNoOne'" (`receptionist_ai.ink:16`). The post-it in the
break room (`erb:1335`) is then never needed. While the archives held only colour that was harmless;
F2's fix puts evidence there, and then the door should take a hunt.

### F7. A printed code with no lock
The personnel printout gives Nightshade's service number 4719 next to "Safe/locker code: service number
(POLICY VIOLATION -- flagged, never changed)" (`erb:917`; `nightshade_service_no`, `erb:78`). Nothing in
the mission takes 4719. As a decoy for the Director's safe it works (a player who tries 4719 on the safe
fails and has to read the "Requested by" line); as a promise of a locker it is a loose end.

### F8. The field guides don't match what HaX says they are
- `m08_infoleak_field_guide` points at `information-leakage-and-the-pin-oracle` (`erb:649`), a note on
  partial-feedback PIN oracles (its front matter). HaX offers it as "a field guide on secrets in commit
  history" (`erb:548`) and "Credentials in commit history -- classic" (`phone_agent_0x99.ink:86`). The
  sheet never mentions git.
- `scanning-and-exploitation`'s "Mission Application" describes the m02 FTP server and patients
  (`HacktivityLabSheets/_labs/safetynet/scanning-and-exploitation.md:149-150`). The Metasploit workflow
  still fits (there is a GitList argument-injection module), so the guide is usable; the framing is the
  sheet's, not m08's (§11, A3).
- `encoding-and-decoding-with-cyberchef` exists and covers exactly Base64 + ROT13, which is m08's desk
  file (`erb:1176-1180`), but m08 never offers it. Its framing says "Mission 1" (front matter, `:93-95`).
- The other three sheets exist: reconnaissance-and-network-mapping, vulnerability-analysis-and-attack-
  surface, privilege-escalation. **[r1]** The last teaches `sudo -l` and `sudo -u <user> /bin/bash`
  (`privilege-escalation.md:55-70`, `:142-154`) but not the pager or shell escape that `sudo apt-get` to
  root needs (SecGen `such_a_git.xml:173`, `sudo_root_apt_get`). It is the closest sheet, so it stays;
  the gap is A3.

### F9. Two music bugs (fixed, X1 and X2)

### F10. Two "unanswered" counts that m07 can contradict (fixed, X3)

### F11. HaX's Netherton-KO texts predate KO item drops (fixed, X4)

### F12. One phone knot breaks the phone-chat rule
`guides` opens with "Agent HaX: Course. Which one." and owns the guide choices
(`phone_agent_0x99.ink:75-98`). A player who closes the phone while in it re-navigates there when any
synced global changes, and the line replays (E13). Every other resting point is `hub`, which has no
leading text (`:43`), and its gates read synced globals, so it re-evaluates cleanly.

### F13. KO resilience: sound, with two gaps
- Netherton: `taskOnKO` + `brief_taken` (`erb:577`, `:772-773`); keycard drops (X4); printer route.
- Cipher, Phantom, Nightshade (suspect): interviews optional; HaX acknowledges each.
- Confrontation and debrief NPCs are hidden for their scenes.
- **Gap 1:** HaX in person (`agent_0x99_person`, `erb:1290`) is knock-out-able and nothing reacts.
- **Gap 2:** `nightshade_ko` is written (`erb:1122`) and never read. A player who knocked Nightshade down
  in his lab meets him at the table as if nothing happened.
- `itemsHeld`: only Netherton holds an item. A KO can't complete a task or reveal an aim early: the
  keycard opens the server room, and `breach_server_room` already waits for `brief_taken`, which his KO
  sets anyway.

### F14. Dead state
Declared or written but never read: `evidence_reviewed` (declared only), `safe_pin_found`,
`archives_password_found`, `found_timeline`, `found_access_logs_hint`, `found_architect_comms_local`,
`found_database_catalog`, `nightshade_ko`, `accused_nightshade` (set by Nightshade's ink, read by no
debrief or credit). Some of these are useful to the proposals below; the rest should go.

### F15. Bug sweep, clean items
- Cross-scenario hard-coded ids: m08 uses only `container`, `pin`, `password`, `rfid`, `lockpicking`,
  `notes`, `text-file`, `flag-station`, `vm-launcher`, person and phone chat. None is on the E7/E8 list.
- `item_picked_up:` mappings: one, keyed on type `keycard` with a `data.itemId` condition (`erb:614-616`).
  Correct (lesson 1).
- Player-visible author notes: none in `text` or `observations`.
- `observations` that state a code: none. The printer's observation says "four-digit facilities PIN"
  only.
- Rename residue: "Cross", "Dr Chen" and "Mission 7" were cleared in pass 2; a grep finds none.
- Stale geography: HaX's directions (server room east of ops, break room west of the Crypto Lab,
  interrogation south of the Crypto Lab) and ATHENA's "north of this lobby" match `connections`.
- Technical claims: GitList 0.4.0 argument injection is CVE-2018-1000533 (`mission.json`, bible); sudo
  `apt-get` to root is a standard GTFOBins escalation. Nothing else is asserted.
- Phone re-navigation: apart from F12, safe (see F12).
- NPC line-of-sight: no NPC has `los` or a `lockpick_used_in_view` mapping, so E4 can't bite.
- Validator, design-review and dialogue checks: run as part of pass 2; the one warning is deliberate.

### F16. Canon drift outside m08 [r1: done]
The bible gave Nightshade "voice **Charon**" (`insider_threat_initiative.md:82`). The orchestrator has
already changed it to Enceladus, matching the voice audit (§11, A2).

## 5. Proposals

Markers: ✅ keep, ⚠️ rework or probe first, ❌ dropped (dropped ideas are in §10).

### Phase 1 — bugs and rule fixes

#### P1. HaX's guide menu follows the phone-chat rule ✅ (bug, F12)
**What.** Split `guides` (`phone_agent_0x99.ink:75-98`) into a text knot and a choices-only knot:
`guides` prints "Course. Which one." and diverts to `guides_menu`; every guide choice and "That's
all" live in `guides_menu`, and each guide choice loops back to `guides_menu`, not `guides`. A
re-navigation then lands on `guides_menu` and replays nothing. `hub` already has no leading text.
**Cost.** Small. **Depends on** nothing.

#### P2. Field guides that are what HaX says they are ✅ (bug, F8)
**What.**
- **Drop the information-leakage guide.** Remove `m08_infoleak_field_guide` from HaX's `itemsHeld`
  (`erb:649`), its hub choice (`phone_agent_0x99.ink:85-88`), the `infoleak_guide_*` VARs and globals,
  and `infoleak_guide_offered` from the flag-2 mapping (`erb:547`). The flag-2 text (`erb:548`) loses
  "There's a field guide on secrets in commit history if you want it" and ends instead: "No guide for
  this one. It's reading, not tooling: the history and the stash." A sheet on secrets in git history
  is an approval item (§11, A3).
- **Offer the CyberChef guide for the backup file.** [r1: the file now lives in Nightshade's locker,
  P8; the trigger is unchanged.] Add `m08_cyberchef_field_guide` to HaX's `itemsHeld`
  ("SAFETYNET Field Guide: Encoding and Decoding with CyberChef", `labUrl`
  `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/encoding-and-decoding-with-cyberchef/`,
  the sheet's permalink; m01, m03 and m04 already use it). A new HaX mapping on
  `global_variable_changed:found_architect_comms_local` (set when the player opens
  PERSONAL_BACKUP.enc in the locker, via the container path, `container-minigame.js:477`), `onceOnly`,
  sets `cyberchef_guide_offered` and sends: "That backup file's wrapped twice. Same tricks as your
  first week. The lab's CyberChef station will take it, and the guide from back then still applies;
  ask me for it." Hub gate and `guides_menu` option as for the others. The "first week" line makes the sheet's Mission 1 framing honest.
- The other four guides stay; all four sheets exist under `_labs/safetynet/`.

**Cost.** Small. **Depends on** P1 (the new option goes in `guides_menu`); P8 moves the file.

#### P3. The cumulative kit, named on arrival ✅ (rule, F5)
**What.**
- `startItemsInInventory` (`erb:184-201`): phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, shaped
  as m07's (`m07 erb:227-263`). No PIN cracker.
- The lockpick's observation (`erb:197`) drops "the fallback for the interrogation room" (P4 makes that
  false): "SAFETYNET field pick kit. You did not expect to need it at headquarters." Its
  `puzzle_graph_unlocks` changes from `interrogation_room` to `nightshade_locker` (P8).
- **Where the kit is named.** The opening cutscene is the one knot every run sees
  (`opening_briefing.ink:10-25`, fired on `game_loaded`). ATHENA logs everything, so the kit line is
  hers, after "It's rather the point" (`:13`): "I have also logged your kit. One pick set, one RFID
  cloner, one fingerprint kit. The PIN device you are thinking of is still on a bench in Technical
  Analysis, two floors down." It names the absence in-world, at the Citadel, where Analysis has the
  cracker in pieces (m07's line, `m07_opening_briefing.ink:38`). [r1] "Technical Analysis", because
  this floor has an Intelligence Analysis room (`erb:936-938`) that players would search.

**Cost.** Small. **Depends on** nothing (P4 and P8 change the lockpick entry again).

### Phase 2 — the investigation becomes a puzzle

#### P4. The interrogation suite takes a code from the Director's safe ✅ (F4)
**Story logic.** Netherton keeps the means into the suite in his safe "so that using it is a decision,
not a habit" (`erb:820`). A keypad suite whose code he locks away is the same decision, and it is a door
the picks cannot open.

**Why a PIN door, not a harder key lock.** The engine offers the pick on every key lock the player
has no key for (`unlock-system.js:122-235`); difficulty only sets the pin count, and `keyPins` overrides
even that (`lockpicking-game-phaser.js:76-79`). Any key lock is therefore optional while the kit rule
keeps picks in the kit. A PIN door is the honest way to put the suite beyond the picks, and with the
cracker rationed (P3) it is where the player feels its absence.

**What.**
- New ERB secret `suite_code` (four digits, distinct from 2407, 4719 and 0311; e.g. "5386").
- `interrogation_room` (`erb:1202-1208`): `lockType: "pin"`, `requires: "<%= suite_code %>"`; remove
  `keyPins`.
- In `director_safe`'s contents (`erb:812-821`), replace the key with `interrogation_suite_code`: type
  `notes`, takeable, readable, name "Interrogation Suite Code Card", text "INTERROGATION SUITE -- DOOR
  CODE\n<code>\nChanged after every use. Kept here so that using it is a decision, not a habit. --
  M.N.", `onRead` → `suite_code_found`, `puzzle_graph_role: key`, unlocks `interrogation_room`.
- Lines that mention the key or the picks:
  - Netherton, `take_keycard` (`director_netherton.ink:90`): "It gets you into the server room. The
    archives take a passphrase and the interrogation suite takes a code from my safe. Neither is on
    the badge system. The safe's combination you can work out; everyone in this building has the same
    bad habit, myself included."
  - Netherton, `told_him` (`:112`): "…Dr Okafor's evaluation is in that safe, with the suite code."
  - HaX, all-flags text (`erb:571`): "…south of the Crypto Lab. The suite code's in the Director's safe,
    if he hasn't given it to you already. Go and finish it." [r2, R2-m3]
  - HaX hub (`phone_agent_0x99.ink:60-62`), [r2, R2-m3] split in two so the method isn't spelt out from
    minute one:
    - ungated, "[How do I get into the interrogation suite?]" → "Keypad, south of the Crypto Lab. The
      code's in the Director's safe. How his safe opens is the building's worst-kept secret; ask ATHENA."
    - gated on `mole_identified` as today, the full text without "Or pick the door; you're carrying a
      kit." (own service number, signs it on printouts, printout on the ops floor).
- TESTING_WALKTHROUGH step 9 and the order variant "picked before the flags" change to the code.
- **[r1, R1-m1] The printout stops spelling out the safe.** Its margin note (`erb:917`) ends "Every safe
  in this building opens on its owner's service number. The Director's included. Nobody has ever made
  anyone fix it." Drop "The Director's included." so the player has to connect the requester's number
  to the safe's owner. Now that the chain can be required, three pointers to the printout are right;
  a fourth that solves it is not.
- **[r1] Two routes to the code.** P6 lets Netherton give the code aloud on a correct reading of the
  audit. The confrontation is then gated behind one deduction or the other: the safe chain, or the
  audit check. Neither is free. **[r2] The safe stays the main route.** It is shorter (printout and
  safe, both depth 1) than P6 (post-it, archives, a clock document, a suspect's confirmation and
  Netherton), and Netherton's P6 line sends the player to it for Okafor's evaluation. The evaluation
  feeds a credit (`erb:168`), a debrief stance option (`closing_debrief.ink:46`), Nightshade's Okafor
  beat (one of the two routes to the locker key, P8) and the evidence wall (`erb:1258`).
- **[r2] The code is one synced global** (`suite_code`, P6), from the same ERB secret as the room's
  `requires`.

**Boss-key.** The suite door is on the Crypto Lab's south wall, which the player passes on the way to
the break room. They try it early, meet a keypad, and come back with the code after the safe.

**Solvability.** The code has two sources: the safe (whose only source is the printout) and
Netherton after P6 [r1]. The safe and the printout are in
rooms that are never locked (`erb:842`, `:750`); the printout is a takeable note that goes to the
notepad. Three hints point at it: ATHENA (`receptionist_ai.ink:20-21`), HaX (hub, above), Netherton
(`take_keycard`). The PIN pad allows three tries per opening (`pin-minigame.js:22`), not a lockout
(the m07 plan relied on the same, r2-m3). A Netherton KO changes nothing here.

**Cost.** Small–medium (one secret, one item swap, four lines). **Depends on** P3.

#### P5. The door audit: alibis that can be checked ✅ (F2, F6) [r1: UTC times; the single door]
**Story logic.** All three suspects tell the player to pull the logs. The Security Archives is where a
security service keeps door records. Phantom, hunting off the books, ran the query and was walked out
by the duty officer before it finished printing; the printout is still in the archive tray. Its author
(the badge system) has no motive to encode anything, so it is plain text.

**The clock [r1, R1-M1].** m07 fixes the deployment order at "02:41 Pacific, 10:41 UTC" (`m07 erb:1659`;
`m07_opening_briefing.ink:19`) and prints the intercept in UTC (`m07 erb:1661`, "Date: 09:50 UTC").
SAFETYNET's logs are therefore printed in UTC, and days are counted from the deployment ("D-2"), with
no weekday. **[r2, R2-M3] The Citadel keeps UTC.** It is a UK-based headquarters (every voice in it is
British), so local time and log time are the same: 10:38 is mid-morning there. CONTRACT.md gains that
line so later missions agree. The plan was opened at **10:38 UTC on D-2** for 47 minutes (closed 11:25), which is 48 hours
and 3 minutes before the order, matching "forty-eight hours" in HaX's flag-4 text (`erb:563`) and
"forty-seven minutes" everywhere else.

**What.**
- New object in `security_archives`: `badge_audit_printout`, type `notes`, takeable, readable,
  `observationDisplay: gameDisplay`, name "Badge Audit Printout -- Leak Window", `onRead` →
  `found_badge_audit` (new global). Observation: "A door-audit query, printed and never collected. The
  header carries Phantom's account." Text (draft):

  ```
  BADGE AUDIT -- QUERY RESULTS (all times UTC)
  Run by: 0x88 (PHANTOM). Printed. Not collected.
  Window: D-2 07:00 to 13:00 (D-2 = two days before the Portland order)

  CL-1 -- Crypto Lab door. The only way into the lab, the break room
          and the interrogation suite.
    07:52  IN   0x3C  OFF-SHIFT
    08:12  IN   0x61  FACILITIES (clean)
    08:58  OUT  0x61
    10:15  IN   0x47  NIGHTSHADE
    10:24  IN   0x23  CIPHER
    10:32  OUT  0x23  CIPHER
    11:43  OUT  0x47  NIGHTSHADE
    (next event: 13:10 OUT 0x3C)

  LIB-2 -- Crypto library door
    10:35  IN   0x23  CIPHER
    (next event: 13:40 OUT 0x23)

  TRAVEL DESK
    0x88  PHANTOM  Zurich handover. Wheels up 10:09, down 11:54. Manifest on file.
  ```
  The audit says who was behind the door. It doesn't say when the plan was opened; that is elsewhere.
- **The window time, in two other rooms.** The timeline (break room, `erb:1348`) gains a header line,
  "All times UTC. T-0 = deployment order, 10:41.", and its anomaly line becomes "T-48h (D-2
  10:38-11:25) ANOMALY: operations plan opened, 47 min, Crypto Lab terminal". It also gains "T-51m
  (09:50) Deployment confirmed to ENTROPY (intercept)", which ties m07's intercept in. X8 edits the
  T-68h line in the same text. [r2, R2-m12] Its first line, "T-72h Portland response plan finalised",
  becomes "T-72h Pacific Northwest contingency plan finalised": m07's threat desk had the tasking
  traffic for six hours only (`m07_opening_briefing.ink:62`, `:227`), so there was no Portland plan three
  days out. [r2, R2-m8] Its sentence "The leak went out in the 48-to-47-hour window" becomes "The leak
  went out just before the 48-hour mark", since 10:38 is T-48h 03m. The auth-log excerpt (server room, `erb:1055`) gains "D-2 10:38 UTC" beside
  "T-48h".
- **The single door [r1, missed chance 1].** The break room and the suite open only off the Crypto Lab
  (`erb:1099-1103`, `:1210`, `:1286`), so CL-1 is a complete record. The audit's header says so, and
  HaX says it once (below). The player's own walking confirms it.
- **The archives take a hunt.** ATHENA stops reading the password out (`receptionist_ai.ink:16-17`):
  "The archive door takes a passphrase. Facilities set it, and facilities, being human, wrote it down
  somewhere they shouldn't. I may not read a passphrase aloud on Level Red. I will observe that
  facilities spend most of the night near the kettle." She no longer sets `archives_password_found`.
  The post-it in the break room (`erb:1335`) becomes the only source.
- **[r2, R2-M3] "Hours nobody's rostered".** Two lines put the leak at night, which a UTC Citadel
  contradicts: Phantom's notes ("from a Crypto Lab terminal at hours nobody's rostered", `erb:998`) and
  his lead beat (`suspect_phantom.ink:56`). Both become "from a Crypto Lab terminal, on a file nobody in
  that lab had a reason to open, for forty-seven minutes".
- **Pointers to the archives.** Phantom's notes (`erb:992-1000`) gain the single earned hint about
  method: "Pulled a door audit for the window on the archive terminal. Duty officer walked in before I
  could get it off the printer. Doors tell you who was in a room, not whose account. Match it to when
  the plan was opened." HaX's hub gains `{ not found_badge_audit }` "[Where would the door logs be?]" →
  "Security Archives, south of the ops floor, behind a passphrase. If Phantom's been pulling logs off
  the books, that's where he did it. And the lab's got one door. The break room and the suite only open
  off it, so whatever that door saw, it saw everyone."
- `read_the_archives` (`erb:276-282`) now names a real step; its title stands.

**Hint tiers.** Direct (HaX names the room and the single door), inferential (ATHENA's kettle), earned
(Phantom's notes say what to match the audit against). Sources for the archives password: one (the
post-it), which can't be lost; the archives stay optional for the ending.

**Cost.** Medium (one object, four text edits, two ink edits). **Depends on** X8 (same timeline text).

#### P6. Netherton's check: when, who, and why not the others ✅ (F1) [r1: rewritten, R1-M3] [r2: steps 2–4, gates, knot rules]
**Story logic.** Netherton told the player "if you are certain before you are sure, come and tell me
the name" (`director_netherton.ink:76`) and "A hunch is not proof" (`:75`). The audit is more than a
hunch and less than proof. He should test it the way a director would: ask for the minute, then the
man, then argue the other side.

**Design rules.** Ask *when* before *who*, so the first answer can't come from instinct. Every option
in a step has the same form. In steps 3 and 4 at least one wrong option cites a record too, so the
right one can't be picked for citing a record [r2, R2-M2]. The method is hinted once, in Phantom's
notes (P5), and nowhere else. The player is never asked a step they can't yet answer: Netherton sends
them back for the missing piece, at no cost [r2, R2-M1].

**What.**
- New optional task `name_the_mole` in `work_the_suspects`: "Tell the Director who the door audit puts
  in the Crypto Lab" (custom, `optional: true`, `status: active`). It completes only in Netherton's
  ink, after the brief, so it can't reveal an aim early (lesson 27). Optional tasks count toward the
  score (`game.rb:42-48`, `:1657`). `work_the_suspects` is all-optional and so already ticked when the
  task completes (`objectives-manager.js:757`); completing it still works (`:537-539`), and Netherton's
  hub option is the signpost (R2-m10b, noted only).
- Netherton's hub gains `+ { found_badge_audit and not named_on_evidence and not audit_closed and not
  mole_identified } [I've been through the door audit, sir.] -> audit_case`.
- `audit_case` (text only, then a divert): "Then don't give me a suspect. Give me a reading."
  - **[r2, R2-M1] No clock yet:** if `not (found_timeline or found_access_logs_hint)` (both receipts exist
    today: `erb:1349`, `erb:1056`; a world text_file's `onRead` fires, `interactions.js:1370-1385`):
    "You've brought me a door. Bring me a clock. When was the plan opened? Somebody in this building
    has written it down." → `hub`. Nothing is recorded. This is also the hint.
  - Otherwise → `audit_step1`.

| Step | Netherton | Options (✓ = right) | Reply to a wrong option |
|---|---|---|---|
| 1 when | "When was the plan opened?" | [10:15 UTC.] / [10:32 UTC.] / ✓ [10:38 UTC.] / [11:25 UTC.] | 10:15, 10:32: "That's a door moving, not a file opening." 11:25: "That's when it was closed." |
| 2 who | [r2] "Which of the three was behind that door at 10:38?" | [Cipher.] / ✓ [Nightshade.] / [Phantom.] / [None of them.] | "Read the door against the minute, not the man." (None: "Somebody opened it, Agent.") |
| 3 why not Cipher | "Cipher badged through the same door that morning. Why not him?" | ✓ [The door log has him out of the lab at 10:32.] / [r2] [The door log has him in the lab for only eight minutes.] / [His desk is out on the ops floor, not in the lab.] / [He told me he spent that morning in the library.] | "Eight minutes is long enough to open a file. Which eight?" / "Desks don't open files." / "He told you. What does the door say?" |
| 4 why trust it | "That audit is Phantom's query, off Phantom's printer. Why trust it?" | [r2, R2-B1] ✓ [The people on it confirm their own rows.] / [Phantom's own row puts him on a plane.] / [It agrees with the auth log Phantom pulled.] / [Phantom never came back to collect it.] | "That clears him of the leak, not of the printout." / "Then it agrees with Phantom twice." / "Careless isn't the same as honest." |

  - Step 2's "of the three" rules out 0x3C, who was behind CL-1 all window, off shift, with no [r3]
    planning access (the timeline's P7 line: three people on the roster have it) [r2].
  - Step 3's desk option is Cipher's own spin ("My desk is on the ops floor. Do the geography.",
    `suspect_cipher.ink:48`), a trap the herring sets. The library-door answer is not offered, because
    it would also be right.
  - **[r2, R2-B1] Step 4.** Draft 2's right answer ("It matches the server's auth log, and he can't get
    near that") was false: Phantom tracked server auth (`erb:998`; `suspect_phantom.ink:38`), and the
    redacted excerpt reads as his work (`erb:1053-1055`). The audit is now trusted because the people on
    it confirm it, outside Phantom's control: Cipher owns his eight minutes, Nightshade his "I'm always
    here", and the off-duty agent his "before eight" (P7). The draft-2 answer becomes a wrong option
    ("Then it agrees with Phantom twice").
  - **Step 4's gate.** Step 4 is asked only if the player has put the audit to at least one suspect on
    it: `cipher_audit_confirmed or nightshade_audit_confirmed` (new globals, set by those P7 beats).
    Otherwise, after step 3: "Then go and ask the people on it whether it's right. Come back when one of
    them has told you." → `hub`, at no cost, and the next attempt restarts from step 1 as normal. The
    witness corroborates 0x3C's row but isn't a suspect, so he doesn't open the step on his own.
- **Wrong answers: two allowed, the third closes it.** Each wrong option diverts to `audit_wrong`. It
  adds one to a local `audit_misreads` (ink arithmetic, so lesson 32 doesn't apply) and sets
  `#set_global:audit_misread:true`.
  - Each wrong answer costs a restart from step 1 and the record (a debrief rider and a softer credit).
  - The third: "Enough. You've read me that log three ways. Bring me the account." →
    `#set_global:audit_closed:true`. The option is gone; the task and the confrontation line are lost.
    The code is not lost: it is still in the safe. The debrief notes it (below).
- **[r2, R2-M5] Knot rules (person-chat re-navigates on every reopen).** Reopening a person-chat with
  saved choices jumps to the knot that owns the first choice and replays its leading text and logic
  (`person-chat-minigame.js:505-523`), and End Conversation can close it at any step (`erb:599`, PASS 2
  D1). So:
  - **No counter or tag in a knot that owns choices.** `audit_wrong` and `audit_right` print their text,
    do their counting and tagging, and divert to `hub` (which has no leading text,
    `director_netherton.ink:54`). They own no choices.
  - **[r3, R3-M1] Each step's choices live in their own top-level knot (not a stitch), and that knot
    opens with `{ mole_identified or audit_closed or named_on_evidence: -> hub }`.** Re-navigation lands
    there: the engine takes the first choice's `sourcePath` up to the first `.` and calls
    `ChoosePathString` on it (`person-chat-minigame.js:510-516`). A player who closes at step 3, submits
    flag 4 and reopens is sent to the hub, and "named before the root logs" can't become false.
  - **Each step's question sits in its own text knot** (`audit_q1`…`audit_q4`) that diverts to the
    choices knot (`audit_c1`…`audit_c4`), so a reopen doesn't repeat the question.
  - **The free exit is explicit:** "[Let me read it again.]" is offered at every step, and costs nothing.
- **Right answer** (`audit_right`): `#complete_task:name_the_mole`, `#set_global:named_on_evidence:true`;
  if `suspect_theory == ""`, `#set_global:suspect_theory:nightshade`. Netherton: "He walked into his own
  lab twenty-three minutes before that plan opened and walked out eighteen minutes after it closed.
  That is a door, not an account. A man may sit in his own lab. But it is something I could put in front
  of a lawyer. Get me the account, and I will move. When the box agrees, he goes down to the suite. The
  code is {suite_code}; the card is in my safe, with Okafor's evaluation. Read it before you face him."
  [r2, R2-m4: the safe stays the main route, and this line points at it.]
- **[r2] The suite code: one synced global.** `globalVariables` gains `"suite_code": "<%= suite_code %>"`;
  Netherton's ink declares `VAR suite_code = ""` and prints `{suite_code}`, as `player_name` already
  works (`erb:1360`; `director_netherton.ink:14`, `:34`). The room's `requires` uses the same ERB secret,
  so the ERB is the only source. W12 is reversed (§10). No `suite_code_found` is set here; that receipt
  stays with the card.
- New globals: `found_badge_audit`, `named_on_evidence`, `audit_misread`, `audit_closed`,
  `cipher_audit_confirmed`, `nightshade_audit_confirmed`, `suite_code`.
- **Consequences.**
  - Confrontation (`nightshade_confrontation.ink:42-46`): when `named_on_evidence`, a line before the
    "why" branch: "The door log. I walked past that reader every morning for fifteen years and never
    once thought of it as a witness."
  - Debrief `the_hunt` (`closing_debrief.ink:58-72`): `named_on_evidence` is tested first: "You named
    him to me before the box did, on something I could put in front of a lawyer. You read the clock,
    not the face." With `audit_misread` [r2, R2-m7]: "Not on the first reading. I noticed. So would a
    lawyer." Then, if `suspect_theory` is cipher or phantom, the existing "You told me early it was
    Cipher, or Phantom…" sentence follows (`:62`). With `audit_closed`: "You read me that door log three
    ways. The box made the case." in place of the evidence tier.
  - Credits: "THE CASE: Named from the door audit, before the root logs" (entry, `named_on_evidence &&
    !audit_misread`); [r2] "THE CASE: Named from the door audit, not on the first reading" (entry,
    `named_on_evidence && audit_misread`); "THE CASE: The door audit, misread. The box made it."
    (warning, `audit_closed`).
- **Netherton KO'd.** No route; the KO costs the task. HaX's KO text says so (P9). The safe still gives
  the code.

**How hard is it to pass without reading?** Step 1 has four timestamps from two documents; step 2 is
easy once step 1 is right; steps 3 and 4 each have one right option among four of the same form, at
least one of the wrong ones citing a record. A guesser who has read nothing has about a 1-in-64 chance
per run, and three runs at most. A reader can't be forced into a misread: missing pieces send them back
for free.

**Cost.** Medium (about 35 lines in Netherton's ink across text and choice knots, one task, two
receipts in suspect inks, three lines elsewhere, three credit lines). **Depends on** P4 (the code), P5,
P7 (the confirmations).

#### P7. Cut the free pointers and make the herrings look guilty ✅ (F3) [r1: widened, R1-M4, R1-M6]
**Cuts (the game stops giving the answer).**
- Narrator verdicts in Nightshade's interview: delete "In a building where everyone else is shaking, he
  is a still pond." (`suspect_nightshade.ink:42`, keeping "He offers it without a flicker."), "You file
  that away. It is the first genuinely strange thing…" (`:48`), "It is the right sentiment, delivered a
  half-second too smoothly…" (`:55`) and "It is the calmest denial you have ever heard, and it
  convinces you of nothing except that you are right." (`:88`).
- Observations: Nightshade's (`erb:1152`) loses "Everyone else in the Citadel is coming apart. He is
  the calmest person in the building."; the desk's (`erb:1170`) loses "A man who has already decided he
  is leaving." (the go-bag shows it instead, P8).
- "Maximum access" in five places:
  - ATHENA's cutscene (`opening_briefing.ink:21`): "whoever it is has planning access and years of
    practice".
  - The dossier (`erb:798`): all three get planning access. Cipher: "Access: signals intelligence,
    cryptography, mission planning (crypto annex)." Phantom: "Access: team movements, tactical
    planning, mission planning." Nightshade: "Access: mission planning, operational security." The
    brief already says three agents had the access (`erb:239`).
  - Netherton (`director_netherton.ink:70`): "Planning access, like the other two. He helps write the
    plans ENTROPY seemed to be reading."
  - The printout (`erb:917`): "Clearance: planning".
  - The archive index (`erb:1091`): "a trusted insider with planning access".
- Character pointers:
  - Netherton's confirmation (`director_netherton.ink:106`): "An instinct is not evidence, and the
    man with nothing on his file is the second-easiest man in this building to suspect. If it is him,
    he has been careful for years. Careful men leave exactly one mistake. Find it."
  - Cipher's "Who do you think it is?" (`suspect_cipher.ink:60-61`) points at Phantom only: "Phantom
    reads logs he isn't cleared for. I've watched him do it over people's shoulders. But I'm
    frightened and pattern-matching in the dark, so weight that accordingly."
  - Phantom's list (`suspect_phantom.ink:49`): "Same three as yours, minus me. I'm not putting a name on
    it until I've seen a door log. Money leaves a trail and there is no trail, so it isn't money. It's
    belief."
  - Phantom's lead beat (`:56`) loses "I'd bet my pension it's the quiet one."
- The timeline's closing paragraph (`erb:1348`): "Full planning access and a Crypto Lab terminal.
  Three people on the roster have that access. Two of them badge through the lab door: Cipher and
  Nightshade. Get the door logs." With the dossier change this agrees with the roster.

**Kept (two instincts the bible owns).** Netherton's empty file (the dossier note and his line,
`insider_threat_initiative.md:74`) and ATHENA's "calmest person" (`receptionist_ai.ink:24`).

**Herrings that look guilty.**
- The audit shows Cipher through CL-1 at 10:24 (P5). His alibi (`suspect_cipher.ink:47-48`) only
  mentioned the library. New beat `{ found_badge_audit and not asked_audit }` "[The door audit has you
  in the Crypto Lab that morning. You left that out.]" → Narrator: "The colour goes out of his face."
  Cipher: "Eight minutes. I went in for a hardware token from the token cabinet, and I came out again.
  Eight minutes. I left it out because I knew exactly how it would sound." Sets `cipher_alibi_known`
  and [r2] `#set_global:cipher_audit_confirmed:true` (P6 step 4). No method: the comparison is the
  player's.
- The off-duty agent becomes an unreliable witness [r1, missed chance 2] [r2, R2-M4]. He sits in the
  one room reachable only through the lab, and the audit has him behind CL-1 all window (0x3C) [r3]. His opener
  (`background_agent.ink:8-10`) becomes: "You didn't hear it from me. Two days before Portland I was in
  here from before eight. Went through to the lab for the stapler, just gone twenty past ten, half past
  at the latest. Someone at the bench at the far end. Had the build of the nerdy one, Cipher. Or not. I
  wasn't looking, and I'm sitting where I can see the door. You should too." Sets `witness_heard` (a
  receipt for the walkthrough; nothing gates on it). This replaces "both exits" (the break room has one)
  and "Crypto's ahead this hour".
  - [r2] No "propped": a propped lab door would mean people came and went unbadged, and the audit
    would stop being a complete record.
  - [r2] "At the bench", not "at the terminal": Cipher says he came for a token from the token cabinet,
    and the witness mustn't make him a liar the game never clears.
  - [r2] [r3, R3-m8] A time the player can test: about 10:20–10:30 overlaps Nightshade's row (from
    10:15) and Cipher's (from 10:24), so the figure could be either man and the witness is honest, and
    it ends before the 10:38 opening, so the player can defuse him with the timeline. That is what makes him unreliable rather than a smear.

**Audit beats for the other two.**
- Phantom `{ found_badge_audit and not asked_audit }` "[Your door audit was still in the archive
  printer.]" → "So it printed. The duty officer walked me out before it finished. I never saw what it
  says, and I'd rather you didn't tell me. Tell the Director."
- **Nightshade [r1, R1-M6]** `{ found_badge_audit and not asked_audit }` "[The door log has you in this
  lab from 10:15 to 11:43 that morning.]" → "Yes. I told you: I'm always here. You've proved I keep long
  hours, 0x00. Bring me the account." Sets [r2] `#set_global:nightshade_audit_confirmed:true` (P6 step
  4). He is calm on evidence (bible `:79`), the clue doesn't catch him in a lie, and he hands the player
  back to the box.

**Cost.** Medium (text edits in five ink files and four erb texts; three short beats). **Depends on**
P5.

#### P8. Nightshade's locker ✅ (F7, kit) [r1: the backup moves here; the key is handed over; a flight]
**Story logic.** His desk is bare. In his locker in the break room are the bag he packed, the one thing
he kept from fifteen years ago (the recruitment brief), and a copy of what he sent. He packed to run
nine days ago and is still at his desk. The bible's "subconscious wish to be found"
(`insider_threat_initiative.md:78`) becomes a mechanic: ask him for the key and he gives it to you.

**What.**
- New object in `break_room`: `nightshade_locker`, type `safe` with `"sprite": "staff_lockers1"`
  (loaded at `core/game.js:596`; m02 overrides a safe's sprite the same way, `m02 erb:2302`), name
  "Staff Locker -- 0x47", `locked: true`, `lockType: "key"`, `requires: "nightshade_locker_key"`,
  `keyPins` (four values), pinned with `position` after a render (lesson 28). Observation: "A row of
  staff lockers, stickered and dented. One is labelled 0x47 in a neat hand and has nothing on it at all."
- Contents:
  - `encrypted_backup` (PERSONAL_BACKUP.enc), **moved from the desk** [r1, R1-M5]. It decodes to mail
    signed by `nightshade_deep_state`, the strongest evidence in the building before the VM. Behind a
    lock and a two-layer decode in another room, it supports the deduction instead of short-circuiting
    it at depth 1. Its observation changes "The lab's CyberChef station can unwrap it" to "The CyberChef
    station in the lab next door can unwrap it, last layer first." P2's offer fires on opening it here.
    **[r2, R2-m5] A physical medium.** A file can't sit in a locker, so the item becomes a USB stick:
    name "USB Stick -- PERSONAL_BACKUP.enc" (type `text_file` kept, id kept), observation "A plain USB
    stick in an envelope marked 0x47. One file on it, PERSONAL_BACKUP.enc. Its properties say how it was
    wrapped: Base64, then ROT13. Lazy, for a cryptographer. The CyberChef station in the lab next door
    can unwrap it, last layer first." Its `text` stays the bare blob, so it still pastes cleanly (E18:
    the new name is unique).
  - `deep_state_manual`, moved from the desk (keep id, name and global).
  - `nightshade_go_bag` (type `notes`, takeable, readable, name "Go-Bag -- Locker 0x47", `onRead` →
    `found_go_bag`). Text: "A packed holdall on the top shelf. Nothing in it is his.\n - A passport in
    a name you have never heard, with his photograph.\n - An e-ticket, one way, economy, to Helena,
    Montana, for the morning after Portland. Not used.\n - A change of clothes. No cash. No
    photographs.\n\nHe packed to leave nine days ago, and he is still at his desk." [r1] Helena has a
    commercial airport; the rail line doesn't exist. The "one thing he kept" is the brief beside the
    bag, so "nothing in it is his" is about the bag.
- The key, three routes:
  - **Asked for** [r1]: Nightshade's hub gains `{ (asked_audit or asked_training) and not
    gave_locker_key }` "[Your locker in the break room. I want to see inside it.]" →
    `#give_item:key:nightshade_locker_key`, "Take it. 0x47, second from the end. I'd genuinely
    encourage it." (`gave_locker_key` local VAR.) It opens only after the audit beat (P7) or the Okafor
    beat (`suspect_nightshade.ink:70`), so the player has a reason to ask.
  - **Picked**: the start-kit picks, any time.
  - **KO**: the key is in his `itemsHeld` (type `key`, `opens_lock`, same `keyPins`) and drops. A given
    key is spliced out first (`npc-game-bridge.js:306`), so no duplicate.
  The key in `itemsHeld` also keeps the validator's "no credential" warning away
  (`validate_scenario.rb:1484-1494`).
- The desk (`nightshade_desk`) has nothing left in it. [r2, R2-m2] It **keeps `type: "pc"`** (so it keeps
  its desk slot: `room_lab`'s Tiled slots match by type, `rooms.js:248-262`, and a `smartscreen` would
  fall to a random floor spot, `:2268-2273`) and **loses its `contents` key entirely**; only a present
  `contents` key makes a container (`interactions.js:1287`). It gains `readable: true` and text
  "0x47 -- SESSION LOCKED. Re-authentication required (Level Red).", and its observation becomes "A desk
  with nothing personal on it. No photos, no mug, no clutter." Draft 2's smartscreen is withdrawn.
- The printout's "Safe/locker code" (`erb:917`) becomes "Personal safe code", so 4719 is a decoy for the
  Director's safe and nothing promises a locker code.
- Lines:
  - HaX in person `{ found_go_bag }` "[Nightshade had a bag packed.]" → "Of course he did. Yours has picks
    in it. His had a passport. And he's still here. Either he's very sure of himself or he's waiting for
    someone, and I don't like either." (m07 called the player's kit their go-bag,
    `m07_opening_briefing.ink:38`.)
  - Confrontation hub `{ found_go_bag and not asked_bag }` "[You had a flight to Montana for the morning
    after Portland. Why are you still here?]" → "Because I wanted to see who they would send. I hoped it
    would be you." Then: "Montana. You'll want to know why Montana. Ask me properly." It points at the
    database and Tomb Gamma questions instead of revealing the place and dropping it.
  - Credits: the brief line reads "Recovered from his locker"; add "GO-BAG: Packed nine days ago. Never
    used." (entry, `found_go_bag`).

**Cost.** Medium (one object, two moved items, one new item, one key, four lines). **Depends on** P3
(the picks' graph entry), P7 (`asked_audit`).

#### P9. KO gaps ✅ (F13) [r1]
- HaX in person: `globalVarOnKO: "hax_ko"` on `agent_0x99_person` (lesson 18 is stale; the KO now emits
  `global_variable_changed`, `npc-hostile.js:157-172`), plus a HaX phone mapping on
  `npc_ko:agent_0x99_person`, `onceOnly`, text "That was me you just put on the break-room floor. I'm
  typing this from it. We'll talk about it after." Credits: "AGENT HAX: Put on the break-room floor by
  her own agent." (warning).
- Nightshade's lab KO: the confrontation's `start` (`nightshade_confrontation.ink:35-46`) reads
  `{ nightshade_ko: }` "You put me on the floor of my own lab. I've had worse from people I liked less."
  Add `VAR nightshade_ko`. Credits: "NIGHTSHADE: Knocked down in his lab before the evidence was in."
  (warning).
- Early accusation: `{ accused_nightshade and not named_on_evidence: }` [r2, R2-m6] "You said it to my
  face before you could put it in front of anyone. You were right, and it didn't matter until tonight."
  (A player may have decoded the USB stick first, which the game can't see, so "before you could prove
  it" could be false.) Add `VAR accused_nightshade`.
- **[r1, R1-m8] Netherton KO'd.** HaX's KO text (`erb:578`, after X4) gains: "…and whatever you were
  going to tell him tonight waits until he can hear it." It acknowledges the now-impossible
  `name_the_mole`.

**Cost.** Small. **Depends on** P6 (`named_on_evidence`, the task).

#### P10. Music after a reload ✅
A reload after flag 4 plays noir (`erb:129`). Change that cue's condition to `globalVars.briefing_played
=== true && !globalVars.mole_identified`, and add `game_loaded` with `globalVars.mole_identified ===
true` → `threat`. [r1, R1-m2] Draft 1 also required `!fate_decided`, which left silence on a reload
between the fate and the end of the debrief. The music system evaluates conditions as plain JS
(`scenario-music-events.js:34-51`), so the eventMapping `&&`-only rule (lesson 35) doesn't apply.
**Cost.** Small. **Depends on** X1.

#### P11. Dead state ✅ (F14)
Delete `evidence_reviewed` (declared only), `safe_pin_found` (the printout's `onPickup`, `erb:918`) and
`archives_password_found` (the post-it's `onPickup`, `erb:1336`, and ATHENA's VAR) from the scenario,
CONTRACT.md and the inks. Keep the other `found_*` receipts: they are cheap, harmless, and
`found_architect_comms_local` now drives P2, and [r2] `found_timeline` and `found_access_logs_hint`
now gate P6's first step. `witness_heard` (P7) is a new receipt for the walkthrough only. `nightshade_ko` and `accused_nightshade` are read after
P9. [r1] `audit_misreads` is an ink-local counter; only the booleans `audit_misread` and
`audit_closed` become globals. **Cost.** Small. **Depends on** P5, P9.

#### P12. Docs ✅
CONTRACT.md: the lock table (§2) and object list (§3) for P4, P5, P8; new globals and the task;
[r2] a line "The Citadel keeps UTC; SAFETYNET logs print UTC; days count from the Portland order (D-n)"; a line
at the top of §1–8 saying the PASS 2 and PASS 3 amendments win where they differ. TESTING_WALKTHROUGH.md:
the new chain, the audit check, the locker, the KO matrix, and the "Aim ladder" line "(ATHENA's
password)". Regenerate the dungeon graph through the validator.

[r1, R1-m11] Stale comments to update in the same pass: the ERB lock-chain header (`erb:41-47`, which
says "key interrogation_room <- … lockpick" and "ATHENA log query"); the safe's `_comment` (`erb:801`);
the post-it's `_comment` (`erb:1328`); ATHENA's `_comment` (`erb:482`); the receptionist ink header
(`receptionist_ai.ink:3`). **Depends on** everything above.

## 6. What could break

**Solvability from the start kit.** Every lock on the critical path opens with nothing but reading:
the server room (keycard by talking, printer PIN from the post-it, or the dropped card), the safe (the
printout), the suite (the card in the safe, or Netherton after P6). The picks are needed only for the optional locker, and it
has a second route. No new lock needs the cloner, the print kit or a PIN cracker.

**New soft-lock risk: the suite (P4).** It is now required: printout → safe → card → door, or the
audit check (P6) [r1]. A Netherton KO or a closed check leaves only the safe chain. Mitigations: the printout and safe are in rooms that are never locked; the printout is a note
that lands in the notepad and can't be dropped; three characters point at it; the PIN pad doesn't lock
out. The one case to test is a player who reads the code card and then reloads: the card is in the
notepad (notes go there), so the code survives the reload. §12 checks it.

**The confrontation trigger is unchanged.** It still fires on `room_entered:interrogation_room` with
`all_flags_submitted && !fate_decided` (`erb:1234-1240`). Opening the suite early (safe done first)
shows an empty room with "Awaiting evidence", exactly as picking it does today.

**KO routes.**
- Netherton: the brief completes (`taskOnKO`); his card drops if not given (X4); P6's check and its
  code hand-over are lost, and HaX says so (P9). The safe and the suite need no NPC.
- [r1, R1-m9] [r2, R2-m9: confirmed] **A duplicate after give → reload → KO is expected.** E22 confirms a
  reload restores given `itemsHeld` (`PASS3_APPROVAL_LOG.md:124-125`; the give splice is client-side,
  `npc-game-bridge.js:306`), so Netherton's card and Nightshade's key each drop a second copy in that
  order. Harmless: no pickup mapping exists for either (the only `item_picked_up:keycard` mapping is on
  `printed_server_badge`, `erb:615-616`), and a reload doesn't re-offer either give, because
  `gave_keycard` and `gave_locker_key` persist (`state-sync.js:51`). Nightshade can't be KO'd after the
  flags (`setVisible:false`, `erb:1141-1150`). §12 step 5.13 confirms it is harmless.
- Nightshade (suspect): his locker key drops (P8), which opens the locker without the picks or the
  audit beat. That is a shortcut bought with a KO; HaX already scolds it (`erb:581-585`), and P9 makes him mention it at the
  table and in the credits. The key can't complete a task or reveal an aim.
- Cipher or Phantom: their P7 beats are lost; the audit still clears them on paper, and P6 doesn't need
  them.
- HaX in person: P9 adds a reaction; she carries nothing.
- `itemsHeld` after the plan: Netherton's keycard, Nightshade's locker key. Neither can tick a task or
  reveal an aim: `breach_server_room` waits for `brief_taken`, and the locker has no task.

**Phone re-navigation.** P2's offer and P5's "Where would the door logs be?" go in `hub` (no leading
text) or `guides_menu` (P1). Their gates read synced globals (`found_badge_audit`,
`cyberchef_guide_offered`), so a re-navigation re-evaluates them cleanly. No new phone text is
once-only without a backstop: the CyberChef offer stays in the guides menu after a reload loses the
text (E9).

**Person-chat re-entry [r2, R2-M5].** Two cases. A reload restores variables only and restarts at
`start` (`npc-conversation-state.js:173-180`; `person-chat-minigame.js:483-487`), which goes via `met`
to `return_visit` and `hub`. A reopen in the same session re-navigates to the knot of the first saved
choice and re-runs its leading text and logic (`person-chat-minigame.js:505-523`), whether or not a
global changed. P6's knot rules cover both: no counting or tags in a knot that owns choices, a state
check at the top of each step knot, and question text in its own knot. `audit_misreads` persists with
his other VARs (commit 1de257bb), so neither a reload nor a reopen refunds or double-counts a misread. Cipher's, Phantom's and Nightshade's new beats are one-shot by their `asked_audit` VARs,
which now persist across a reload (commit 1de257bb).

**Aim reveals (lesson 27).** `name_the_mole` sits in `work_the_suspects` and completes only in
Netherton's ink, after the brief. No new task is in a later aim.

**E18 (shared names).** New takeables: "Interrogation Suite Code Card", "Badge Audit Printout -- Leak
Window", "Go-Bag -- Locker 0x47", "Nightshade's Locker Key", "SAFETYNET Field Guide: Encoding and
Decoding with CyberChef", [r2] "USB Stick -- PERSONAL_BACKUP.enc" (renamed from "File:
PERSONAL_BACKUP.enc"). [r1] Moved, not new: the brief. None shares a type and name with another item in m08. The removed key
("Interrogation Room Key") goes.

**Object placement (lesson 28).** The locker in the break room and the audit in the archives have no
template slot of their own; pin both with `position` (tiles) after a render. The archives are 10x6 and
already hold two objects. The room-dressing skill's render loop is the check.

**Layout.** No rooms or connections change, so door parity can't move (doors 8/8 today).

**Reload and music.** P10 only changes `game_loaded` cues; X1's new cue fires once per close (lesson
41's double close would only restart the same playlist).

**Over-redundancy check [r1] [r2, R2-m11].** Pre-evidence pointers at Nightshade drop from eighteen
(F3) to two instincts (Netherton's empty file, ATHENA's calm) and Nightshade's own three lines, plus
evidence that has to be found: the geography (Phantom's notes, the timeline, the auth excerpt and
Cipher's alibi all say "a Crypto Lab terminal", and Nightshade's desk is in that lab); Okafor's
evaluation, now on the main route to the suite, which names motive, not the leak; the witness (who leans
the wrong way); the audit; and, behind a lock and a decode, the signed mail. Round 2 judged this enough
suspicion: by instinct alone it is about a one-in-three guess, nudged by the empty file. The window time has two sources in
two rooms. The audit has one, the post-it one. The suite code two (the safe; Netherton after P6).

**The signed mail [r1, R1-M5].** A player can still pick the locker at minute five, carry the USB stick to
CyberChef and read a confession before any other evidence. That is the hardest route (find the
locker, pick it, carry the file, decode two layers), it earns nothing the game records, and it doesn't
open P6's check, which still needs the audit. It no longer sits on the desk of the man being
interviewed, and HaX only advertises it after it has been opened.

**The witness [r2].** He points at Cipher and gives a time, just gone twenty past ten. A player who
believes him and accuses Cipher pays the existing accusation costs. The audit puts Nightshade behind
the door from 10:15 and Cipher from 10:24, so the figure could be either and the witness is honest [r3], and the timeline puts the opening at 10:38, so the sighting
clears Cipher rather than condemning him. Without "propped", the single door stays a complete record.

**Suite code exposure [r2].** The code is in the client's globals from load. So is everything in ink:
the server serves compiled ink JSON as it is (`games_controller.rb:473-497`) and strips only `requires`
and locked `contents` (`game.rb:1495-1512`). A devtools reader could find the code either way; the
global at least keeps one source.

## 7. Dialogue implications

Applies `README_ink_best_practices.md`: speaker prefixes match `displayName`; choice brackets carry
the player's own words with no `You:` echo; Narrator for beats; no inline emotes; no "not X, it's Y".

| Where | New or changed | Proposal |
|---|---|---|
| `opening_briefing.ink` `start` | ATHENA's kit line | P3 |
| `receptionist_ai.ink` archives answer | hint, no read-out; drop the `archives_password_found` write | P5 |
| `director_netherton.ink` `take_keycard`, `told_him` | suite code, not key | P4 |
| `director_netherton.ink` hub + `audit_case` and four step knots + `audit_wrong` | ~25 lines; the suite code as text [r1]; `:70` and `:106` rewritten (P7) | P6, P7 |
| `phone_agent_0x99.ink` | `guides_menu` split; suite answer ungated, no picks; door-logs question; CyberChef guide; info-leak guide removed | P1, P2, P4, P5 |
| `suspect_cipher.ink` | audit beat (no method; sets `cipher_audit_confirmed` [r2]); "Who do you think it is?" points at Phantom only | P6, P7 |
| `suspect_phantom.ink` | audit beat; `:49` and `:56` cut back; [r2] `:56` loses "hours nobody's rostered" | P5, P7 |
| `suspect_nightshade.ink` [r1] | audit beat (sets `nightshade_audit_confirmed` [r2]); locker-key hand-over; four narrator verdicts deleted | P6, P7, P8 |
| `background_agent.ink` [r1] | the witness opener, [r2] timed, "at the bench", no "propped"; sets `witness_heard` | P7 |
| `opening_briefing.ink` `:21` [r1] | "planning access" | P7 |
| `agent_0x99.ink` (in person) | go-bag line | P8 |
| `nightshade_confrontation.ink` | door-log line, go-bag question (pointing at Montana, not naming why), lab-KO line, early-accusation line, X7 | X7, P6, P8, P9 |
| `closing_debrief.ink` `the_hunt` | named-on-evidence tier first, misread rider, closed-check line, then the existing wrong-first sentence | P6 |
| erb texts | X8, X9; flag-2 text, all-flags text, Netherton-KO text, timeline, auth excerpt, Phantom's notes, printout, dossier, archive index, two observations, audit, go-bag, code card, desk | X8, X9, P2, P4–P9 |
| credits (`erb:143-179`) | THE CASE (3), GO-BAG, NIGHTSHADE lab KO, AGENT HAX KO; brief line "from his locker" | P6, P8, P9 |

Voice notes. Netherton's audit lines stay flat and exact, with no praise until the answer is right
("Read the door against the minute, not the man"). His wrong-answer replies never name the right
answer. Cipher's beat is the one place he loses control. Phantom stays amused. Nightshade's new lines
are short and unhurried; none of them apologises. The off-duty agent stays gossipy and certain of
nothing. [r1] With the narrator verdicts gone, Nightshade's interview carries his calm through his own
lines alone; the voice note (`erb:1118`, "the only tell is that nothing rattles him") already asks for
that.

Ink checks after the edits: compile 12/12; `inkcheck` on Netherton `start` with `found_badge_audit`,
with `named_on_evidence`, with `audit_misreads = 2`, with `audit_closed`, and with `mole_identified`;
Nightshade with `found_badge_audit`, with `asked_training`, and after the key hand-over; Cipher and Phantom with `found_badge_audit`;
confrontation with each new flag; debrief with `named_on_evidence` × `audit_misread`; HaX phone with
`cyberchef_guide_offered`. `loopcheck` on every hub touched. (The tools live wherever pass 2 ran them;
`tools/pass2/` holds only `render.rb` and `door_align.py` now.)

## 8. Pacing

**Act 1 (the brief and the hunt).** Lobby → office for the brief → out to the three suspects. P5–P8
give this act its first real puzzle: the post-it opens the archives, the audit plus a clock time from
another room lets the player name him, and the herrings now cost a second look. A player who skips all
of it still reaches the server room in the same number of steps as today.

**Act 2 (the box).** Unchanged. The turn fires at flag 4 in the server room (depth 2, east).

**[r1] The audit check shortens act 3.** A player who passes P6 hears the suite code from Netherton
in act 1 and walks today's four crossings in act 3 without visiting the safe. That is the reward for the
deduction, and the safe still holds the psych eval for players who want it.

**Act 3 (the room).** Today: server → ops → lobby → Crypto Lab → interrogation, four crossings, with
the picks. After P4, a player who hasn't opened the safe goes server → ops (printout, if not already
read) → lobby → office (safe; Netherton is there for "It's Nightshade, sir", `told_him`) → lobby →
Crypto Lab → interrogation: six crossings. Each added room has a reason: the safe, and the Director,
who is the person the player should tell first. The walk crosses the Crypto Lab, where Nightshade's
desk now stands empty (`erb:1141-1150`, the `setVisible` pair), on the way to the room he was walked to. A player who opened
the safe early, or passed P6, walks the four crossings of today.

**Where the turn and the resolution sit.** The name lands in the east wing (server room) and the
resolution happens in the west wing (interrogation), with the Director's office between them. m02's
problem (the reversal undone in the same drawer) doesn't arise.

**Empty rooms.** None today, none after.

## 9. Capability arc

**Rule** (PASS3_APPROVAL_LOG.md:27-33, user, 2026-10-01): the kit is cumulative; each mission grants at
most one new class; the PIN cracker is rationed and not in start kits after m02.

| Mission | Grants | m08's use (after this plan) |
|---|---|---|
| m01 | Lockpicks | Nightshade's locker (P8). *By design*; his key, asked for or dropped by a KO, is the other route |
| m02 | PIN cracker (rationed) | Not carried; ATHENA says it is on a bench in Technical Analysis (P3). The suite keypad (P4) is where its absence is felt; the code comes from the safe |
| m03 | RFID cloner | Carried, unused. The one RFID door has three routes already; a dialogue clone would be a fifth in a row (m07 W7) |
| m04 | Fingerprint kit | Carried, unused. See §10 W3 |
| m05–m07 | Evidence as leverage; the VM opening the physical path; evidence that changes a decision | The door audit makes the player's reading of evidence count with the Director (P6) |
| **m08** | **No new tool class.** It adds **checking a claim against a record**: alibis against the door audit, the audit against the window time from another room, the custody of the evidence, and the root logs as the proof the audit can't give | — |

**Start kit for m08:** phone, lockpicks, RFID cloner, fingerprint kit. No PIN cracker.

**For m09's planner.**
1. Start kit as above. m09 is the first mission after the Citadel; if it issues the PIN cracker, the
   story reason is ready ("Analysis has finished with it"), and its PIN locks should be designed with
   that in mind.
2. m08 can't carry state forward (no campaign state; PASS3_APPROVAL_LOG.md:37). m09 must read true
   whether Nightshade was handed over or kept as a triple agent, and whether Tomb Gamma's coordinates
   were given (they always are, except on the KO safety net, `erb:604-612`).
3. m08 ends with the Global Threat Database in ENTROPY's hands at Tomb Gamma, Montana (bible
   `insider_threat_initiative.md:77`, `:355`). P8's unused flight to Helena is the first physical
   pointer there.
4. The player has now checked their own side's records. m09 can expect them to distrust a tidy record.
5. [r1] m08 is set nine days after m07, and m07's unanswered Trojan Horse starts dropping emergency
   calls "on day nine" (`m07_closing_debrief.ink:246-250`). m08 says nothing about it and shouldn't:
   it would be false whenever the team went to Austin, and nothing can carry m07's choice forward.

## 10. Withdrawn and considered

Not to be re-proposed without new evidence.

- **W1. Keep the key lock and make the pick harder.** Considered for F4: more `keyPins`, `difficulty:
  hard`. Withdrawn: the pick is still offered on every key lock (`unlock-system.js:122-235`), so the
  safe chain stays optional and only gets slower to skip.
- **W2. Remove the picks from the start kit.** Withdrawn: the user's kit rule.
- **W3. A fingerprint lock on Nightshade's workstation.** The notice board says classified systems need
  re-authentication (`erb:745`), and a mole hunt is forensic. Withdrawn: there is no in-world print
  source outside his lab except a mug in the break room, which repeats m05 (Torres' mug) and fights his
  bare-desk character; and E1 means a dusted print is lost on reload. Nothing else in the building has
  a reason to sit behind a print.
- **W4. Clone a suspect's badge in conversation.** Withdrawn for m07's reasons (m07 plan W7): m03–m06
  all do it, and the server room already has three routes.
- **W5. The shredder.** `shredder1` is loaded (`core/game.js:624`) and the shredded-document minigame
  exists (`interactions.js:1011-1019`): Nightshade's strip-cut shredder holding the Portland deployment
  page with 0x00's name on it would be a strong scene. Not taken in draft 1: it has only been used in a
  test scenario (`test-shredded-document`), so it needs a browser probe first; it would be a fourth
  "one mistake" alongside the credentials, the mailbox and the door log; and the audit already does the
  correlation work. A candidate for a later pass if a playtest finds act 1 still thin.
- **W6. A cryptex or combination padlock for the locker.** Both minigames exist but neither type is in
  the schema enum (`scenario-schema.json:325-328`), so the validator would reject them. That is an
  approval item for no gain the picks don't give.
- **W7. Put the audit or `name_the_mole` in `concludeRequires`.** Withdrawn: story tasks there make
  unannounced dead ends (skill, Step 1). The task carries score and three consequences instead.
- **W8. Convert m08's three text_files to `notes` for E20.** Withdrawn: they are container contents
  and their globals are set (section 0).
- **W9. ~~Move the encrypted backup to the locker as well.~~ Reversed in draft 2 [r1, R1-M5].** Draft 1
  kept the file on the desk. Round 1 showed that it decodes, in the room it sits in, to a signed
  confession stronger than everything P5–P7 build, and that P2's HaX text pointed straight at it. It
  now lives in the locker (P8).
- **W10. A HaX phone fallback for P6 when Netherton is KO'd.** Withdrawn: the debrief and credits frame
  the naming as something the Director heard; losing it is the KO's cost, as the brief already is.
- **W11. [r1] Strip the signature from the backup instead of moving it.** Round 1's second option:
  drop "From: nightshade_deep_state" and "-- N", so the mail proves only that someone at that desk wrote
  to the Architect. Not taken: the orchestrator chose the move, and the signed mail is the character's
  own voice (the "candle in a hurricane" line the confrontation quotes back).
- **W12. ~~[r1] Give the suite code through a synced global.~~ Reversed in draft 3 [r2, R2-m13].** Draft
  2 rejected the global because it would expose the code to the client. That reasoning was wrong: the
  ink JSON is served as it is (`games_controller.rb:473-497`), so a code written into Netherton's ink is
  just as visible. P6 now uses the synced global `suite_code`, and the ERB is the only source.
- **W13. [r1] A lockpick bark from the off-duty agent when the player picks 0x47's locker** ("I didn't
  see that. I'm reading."). Cheap character, but the E4 interrupt gate then swallows picks while he can
  see the locker unless the mapping always fires (it would need `cooldown: 250` and `los.visualize`).
  Considered, not taken; worth adding only if a playtest finds the locker flat.
- **W14. [r1] A line in m08 about m07's day-nine dispatch failures.** Would be false whenever the team
  went to Austin (§9, item 5).
- **W15. [r1] Unlimited retries on P6's check (draft 1).** Replaced by two allowed misreads, a restart
  from step 1 after each, and a closed check on the third, so guessing has a ceiling.
- **W16. [r2] Draft 2's step-4 answer, "It matches the server's auth log, and he can't get near that."**
  False on the documents (R2-B1). Kept only as a wrong option.
- **W17. [r2] The desk as a smartscreen with a `pc` sprite (draft 2).** It would have lost its desk slot.
  Replaced by `pc` with no `contents` key.
- **W18. [r2] A lie-catch beat: "[You badged in at 10:15. 'Always here'?]"** (round 2's optional
  missed chance). Not taken: step 4 now rests on Nightshade confirming his rows, and an answer like "I
  came in for it" would be closer to a confession than the man the bible draws, who stays calm on
  evidence and never gives the player the account.
- **W19. [r2] A HaX line when `name_the_mole` first becomes available** (R2-m10b). Netherton's hub
  option is the signpost; noted only.

## 11. Needs user approval

Nothing in this plan's proposals touches the engine, shared minigames, other missions, SecGen or
HacktivityLabSheets. For the log:

- **A1. E20's m08 entry. Done by the orchestrator** [r1]. `nightshade_profile`, `encrypted_backup` and
  `deep_state_manual` are container contents; `container-minigame.js:477` fires their `onPickup` and
  `:550-553` takes them. E20 itself (world text_files) stands; m08 is not affected.
- **A2. The bible's Nightshade voice line. Done by the orchestrator** [r1]
  (`insider_threat_initiative.md:82`, Charon → Enceladus, matching the voice audit). Not a planner edit.
- **A3. Lab sheets (HacktivityLabSheets; optional).**
  - No SAFETYNET field guide covers secrets in git history or `git stash` (m08's flag 2). P2 stops
    offering the PIN-oracle sheet for it. A short sheet (`git log -p`, `git stash list/show`, why a
    "deleted" secret is still in history) would let HaX offer one again.
  - **[r1] Privilege escalation through `sudo apt-get`.** `privilege-escalation.md` teaches `sudo -l` and
    `sudo -u <user> /bin/bash` (`:55-70`, `:142-154`) but not the pager or `APT::Update::Pre-Invoke`
    style shell escape that m08's flag 4 needs (SecGen `such_a_git.xml:173`, `sudo_root_apt_get`). A
    short section on GTFOBins-style escapes from an allowed binary would cover it.
  - `scanning-and-exploitation.md:149-150` ("Mission Application") describes m02's FTP server and
    patients; `encoding-and-decoding-with-cyberchef.md:8`, `:93-95` say "Mission 1". Both are offered by
    several missions. Mission-neutral wording would fix every mission at once (same class as L1's
    distcc and rfid-cloning note).
  - SecGen's `m08_the_mole.xml:38` `<lab_sheet_url>` (scanning-and-exploitation) is fine as it is.
- **A4. Two stale lessons** (`tools/pass2/PASS2_LESSONS.md`, shared): lesson 24 (KO drops; already noted
  in the brief) and lesson 18: `globalVarOnKO` now does emit `global_variable_changed:<var>`
  (`npc-hostile.js:157-172`). m08's `npc_ko:` mappings are unaffected; P9 now relies on it for
  `hax_ko`.

## 12. Done when

1. Validator: 0 errors; warnings no more than today's one plus none new. `check_door_alignment.py` 8/8.
2. Ink compiles 12/12; `inkcheck`/`loopcheck` on the states listed in §7.
3. **[r1, R1-M1] The times agree.** Read the rendered JSON and the ink and check, by hand or with a
   short script in the scratchpad:
   - the timeline, the auth excerpt and Netherton's step-1 answer all say the plan was opened at 10:38
     UTC on D-2 and closed at 11:25 (47 minutes); T-0 is 10:41 UTC, matching m07 (`m07 erb:1659`);
   - the audit's rows are those in P5, and its only lab entries spanning 10:38–11:25 are 0x47 (and 0x3C, behind
     CL-1, off shift, no planning access) [r3];
   - Netherton's "twenty-three minutes before … eighteen minutes after" matches 10:15 and 11:43;
   - Phantom's flight (10:09–11:54) covers the window; Cipher is out of CL-1 at 10:32 and into LIB-2 at
     10:35;
   - [r2] the witness's "just gone twenty past ten, half past at the latest" [r3] overlaps 10:15 (0x47) and
     10:24 (0x23) and ends before 10:38; his "before eight" matches 0x3C IN at 07:52;
   - [r2] the timeline says "Pacific Northwest contingency plan" at T-72h, "Agent 0x00 pre-positioned, Pacific
     Northwest" at T-68h, and "just before the 48-hour mark"; the audit header
     defines D-2;
   - [r2] no "hours nobody's rostered" remains (P5); CONTRACT.md says the Citadel keeps UTC;
   - no clue document carries a weekday, and every clock time is marked UTC (or sits under a "UTC"
     header);
   - [r2] the room's `requires` and the `suite_code` global render from the same ERB secret, and
     Netherton's ink prints `{suite_code}` with no literal code in it.
4. Rendered JSON: no eventMapping condition with `||` or `(`; every new task `status: active`;
   `name_the_mole` is `optional: true`; a grep finds no "maximum" in m08's player-visible text and none
   of the four narrator verdicts (P7).
5. Browser playtest on the keyless server (:3001, `tools/playtest/new-game.rb`), Sonnet agent, using
   the playtest-scenario skill:
   1. Opening: cutscene playlist, then noir when it closes (X1). ATHENA names the kit and says
      "planning access" (P3, P7). The brief reads "the ones nobody could reach cost lives" (X9).
   2. Inventory holds phone, picks, cloner, print kit; no PIN cracker.
   3. ATHENA does not read the archives password; the break-room post-it opens the archives.
   4. The audit reads; `found_badge_audit` true. Cipher's, Phantom's and Nightshade's audit beats
      appear; Cipher's states no method. The off-duty agent's opener names Cipher.
   5. Netherton's check [r2]:
      - With the audit read but neither the timeline nor the auth excerpt: he says "Bring me a clock"
        and nothing is recorded (`audit_misread` stays false).
      - Run 1: answer step 1 with 11:25 (misread; back to hub). Run 2: 10:38, Nightshade, "only eight
        minutes" (second misread; back to hub).
      - Before any suspect's audit beat, steps 1–3 right: he sends the player to ask the people on it,
        nothing recorded.
      - After Cipher's audit beat, run 3: all four right. `name_the_mole` completes; `named_on_evidence`
        and `audit_misread` true; Netherton says the code from `{suite_code}` and points at the safe.
      - Close the conversation at step 3 with End Conversation, reopen: the step 3 question is not
        repeated and no misread is added. In another save, close at step 3, submit flag 4 (or set
        `mole_identified`), reopen: he lands on the hub.
      - A separate save: three misreads close the check and the option disappears.
   6. Try the suite door before any code: a keypad, a wrong code fails, no picks offered. Then the code
      Netherton gave opens it (empty room, "Awaiting evidence").
   7. Second run without P6: printout → 2407 (try 4719 first: fails) → safe → code card in the notepad
      → reload the page → the code is still in the notepad → the suite opens.
   8. Nightshade: after the audit beat, ask for the locker key; it is given. The locker opens with it.
      The USB stick (PERSONAL_BACKUP.enc), the brief and the go-bag are inside; `found_deep_state_manual`,
      `found_architect_comms_local` and `found_go_bag` true. HaX offers the CyberChef guide; it opens
      the right sheet. The info-leak guide is gone; flag-2 text has no guide offer. The desk sits on its
      lab desk slot, reads the locked-session line, and opens no container.
   9. Mid-mission page reload: no intro replays (Netherton, suspects, HaX phone); HaX's guide menu
      replays no text; Netherton's check doesn't refund misreads.
   10. All four flags (or the stub the m05 run used): music → threat; reload → threat; reload after the
       fate → threat, not silence (P10).
   11. Confrontation shows the door-log and go-bag lines, X7's "four fires and one bucket", and the
       Montana answer; choose a fate; debrief has the named-on-evidence tier with the misread rider;
       credits show THE CASE ("not on the first reading") and GO-BAG, read from `#bv-credits-overlay` while they
       play.
   12. Picks route: a third save picks the locker without asking for the key.
   13. KO route: KO Nightshade in the lab before the flags → his locker key drops and opens the locker;
       KO Netherton before asking for access → keycard drops; HaX's text mentions the card and the
       unsaid name (P9); the confrontation and credits mention the lab KO. KO HaX in person → her text
       and credit. **[r1, R1-m9] [r2]** Then, in a fresh save: take Netherton's keycard, reload, KO him; a
       second keycard is expected to drop (E22). Confirm nothing ticks or texts on picking it up and
       that his give isn't re-offered. The same for Nightshade's key after the hand-over. Also check the
       off-duty agent's opener and that X10–X12 read as written.
6. TESTING_WALKTHROUGH.md, CONTRACT.md (including "The Citadel keeps UTC"), the stale comments (P12)
   and the dungeon graph updated.

## 13. Questions for the round-3 (confirmation) reviewer

New since draft 2, in reading order: the header; §0 X10–X12; F3's addendum; P4's split HaX answer and
"main route"; P5's UTC paragraph, D-2 header, relabels and Phantom lines; P6 (steps 2–4, the two free
turn-backs, the knot rules, the synced code, the safe pointer); P7's witness and confirmation globals;
P8's USB stick and desk; P9's accusation line; §6's re-entry, duplicate, witness and exposure notes;
§10 W12 (reversed) and W16–W19; §12 steps 3 and 5.5. Please don't re-litigate rulings or §10's
withdrawn items.

1. **Step 4.** Is "[The people on it confirm their own rows.]" the same form as its three siblings, and
   is gating step 4 on at least one *suspect's* confirmation (not the witness) right?
2. **Step 3.** With "[The door log has him in the lab for only eight minutes.]" added, is there still a
   tell?
3. **R2-M5.** Are the knot rules in P6 enough for person-chat re-navigation, or does any step still own
   choices behind text that does work?
4. **The witness.** Does "went through to the lab for the stapler" square with the single-door record
   (an internal walk from the break room, so no badge event), and is the time honest against the audit?
5. **Anything missed** in X10–X12's class: any remaining line in m08 that says ENTROPY knew which way
   the team would go.

---

*Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds.*
