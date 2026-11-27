# demo_ops_recon: guided tour, review R2 (implementation and dialogue)

Reviewer: round 2, implementation and dialogue together, and the dialogue sign-off before voice audio. Read-only apart from this file. Tree `/data/be-ops-follow`, branch `ops-showcase-tour`. Delta reviewed: `cf4362efd` (tour round 1 fixes) against `TOUR_IMPL_REVIEW_R1.md` and `TOUR_DIALOGUE_REVIEW_R1.md`. Lines judged with `npc-dialog-review` (concision check 2l) and the `tts-audio` standing rules. No SecGen XML or field guide was opened.

## Verdicts

- **Implementation: clean.** 0 blockers, 0 majors, 0 minors. Every round 1 finding is closed or has a stated reason.
- **Dialogue: signed off.** 0 blockers, 0 majors, 3 minors. Each minor is a one-line text or routing change with the exact rewrite below. Applying m1 to m3 as written needs no further review. Better to apply them before the batch runs, because a later change orphans clips.

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_recon/scenario.json.erb --no-graph` | 0 errors, 26 warnings (the same count as R1) |
| Ink compile (`bin/inklecate` into the scratchpad, compared with the committed `.json`) | 6 of 6 compile, and each matches the committed JSON |
| `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/demo_ops_recon/` | totals by rule: none (it counts only `Name:` lines, so it sees almost nothing here. The 2l and TTS checks below were done by hand.) |
| `bin/rails test test/controllers/break_escape/demo_ops_recon_scenario_test.rb test/unit/break_escape/tts_mission_lines_test.rb` (under flock) | 30 runs, 491 assertions, 0 failures |
| Stale-line grep (old wording in the scenario, ink and PLAYTEST) | none. Old wording remains only in the dated history sections of `VOICED_LINES.md` (see Notes) |

## Round 1 findings: closed

### Implementation R1

| Finding | Status | Evidence |
|---|---|---|
| M1 "Every move you made is in that log" untrue for R5c | closed | `signin_ok` is now in `network_log.events` (`scenario.json.erb:163`). Only the player's password and credential sign-ins write it (`game.rb:4831-4835`). Staff never write it, so the log does not fill with their sign-ins. Test asserts the row, with method `credential` and route `foothold` and no secret (`demo_ops_recon_scenario_test.rb:394-398`), and that the event is listed (`:446`) |
| M2 PLAYTEST contradicts the guided path | closed | The guided path table (`PLAYTEST.md:76-91`) quotes the current lines word for word, which I checked against the ink and the barks. Ten tasks. R8c is a task beat (`:148`). Run B's R6c is the same step as the guided R6c (`:128`). The grep found no old line |
| m1 nothing says switch the printer back on | closed | `ama_owusu.ink:88-91` |
| m2 the stale guard drops R8 | closed | The log bark is split into two mappings whose conditions cannot both hold (`unplug_done !== true` and `=== true`), so exactly one fires. The R7c guard is kept, with a sound reason: its "Now see Graham for the log" would be false after the log is read |
| m3 the plug-in bark repeats when the box moves | closed | Each tick mapping is guarded by the other jack's `*_used` global. The fixer chose this over `plug_in_done` because of the V3b stale-bark rule, which is right. Trace: first plug at hot desk ticks, and the tracker sets `hotdesk_used`. A later kitchen plug fails `hotdesk_used !== true`, so there is no tick and no bark. The reverse works the same way. Each guard reads only the other jack's global, so the order of the mappings does not matter. Test `:436-445` |
| m4 waits not measured | closed | Measured in PLAYTEST `:63` and `:93`. Coffee `useSeconds` 12 -> 30, and Jun is now away 38 s (expected 34.8 s). The R1 pointer names the kitchen port as the no-wait way in. Zainab's 1.4 s is recorded (`:168`) |
| m5 R7a to R8c not clicked live | closed | Tour playtest 1 (game 287): ten of ten ticks. The R3b printer-off bark is still unseen live. PLAYTEST asks the next run to report it (`:81`, `:113`). The emit path is sound (R1) |
| m6 `terminal_view` is a self-report | closed (noted) | PLAYTEST "Known limits" (`:95`). No Terminal-only signal exists |

### Dialogue R1

| Finding | Status | Evidence |
|---|---|---|
| M1 "Same findings, same names" twice in a row | closed | `terminal_ticked` (`:245`) no longer repeats it. See m1 below for a leftover antecedent problem |
| M2 no line says the Terminal's names are made up, and one sends the player to look the product up | closed | `:232` "On a real network, that's what you'd look up ...". `:245` "... but the products and names are made up." |
| M3 Jun's warning three times | closed | `:76` cut, and the lever warning cut. The lever says "Jun's desk will be empty for a bit." only before the plug-in (`:143-146`) |
| m1 "tile" in the scan bark | closed | "The scan lists what the printer offers ..." |
| m2 lines spell out the click | closed | `:103` and the false-card bark |
| m3 "saved connection" vs "saved link" | closed | Barks, recap, task title and board all say "saved link" |
| m4 the dangling "Then" in the log bark, and "the stranger" | closed | "... after that early sweep ... Last thing, unplug the box." |
| m5 the gate opener and "the real one" | closed | `:172`, `:191`. See m3 below for the skip path |
| m6 two barks with 49 words | closed | The false-card bark is 22 words |
| m7 "not a sign-in" | closed | "... not a password." |
| m8 the kitchen bark has no next step | closed | It ends "Now sweep the network." See m2 below |
| m9 the recap has no way back | closed | `+ [Never mind.]` -> "Right." (`:261-264`) |
| m10 the recap card line | closed | `:286` |
| m11 the short version | closed | `:319` |
| m12 the file server bark | closed | "Look at it in the Terminal, then tell me what it said." |
| exit P11 note | closed | "I'll be here." |

## Findings

### Blocker

None.

### Major

None.

### Minor (dialogue)

**m1. "It" has no antecedent after the banner answer.** `ama_owusu.ink:232` then `:245`. After "That's the banner. On a real network, that's what you'd look up before you guess.", the next line "It prints like a real console, ..." reads as if the banner prints like a console. After the other choice, the sentence before names "The Terminal", so there the line is fine. Both paths share the line, so name the subject.
- → "The Terminal prints like a real console, with the scan as a table, but the products and names are made up." (21 words. One word longer, to fix the reference.)

**m2. The kitchen bark repeats the pointer it follows (P2).** The new R1 pointer line (`:80`) says "the kitchen has a spare port too, and nobody watches it". The kitchen plug-in bark (`scenario.json.erb:507`) then opens "That works too. Nobody's watching the kitchen port." The player who takes the kitchen route hears the same fact twice, about a minute apart.
- → "That works too. The box is your foothold, so anything it can reach, you can look at. Now sweep the network." (21 words, was 26.) The test pins only the condition, not the text.

**m3. The skip path asks twice (P2, routing only).** `lever_day_refused` `[Skip them and call it a day anyway.]` sets `skip_day` and diverts to `lever_day_end`. That knot then asks "Seen what you wanted? Once they've gone home, it's just Zainab and Graham." with `[Yes, call it a day.]` / `[Not yet.]`. The player has just chosen to call it a day, so this is a second confirmation, and "once they've gone home" is the second telling in a few lines (`:172`).
- Fix: move the yes branch (`~ act_evening = true`, `#set_global:act_evening:true`, "Right. Home time for nearly everyone." and the Zainab and Graham line) into a stitch or knot that both the yes choice and the skip choice divert to. This adds no voiced line and changes none, so no clip changes. Keep `skip_day` if anything else reads it. Afterwards, run the loopcheck and tagdiff that the fixer ran in round 1.

## Concision (2l) and the voicing rules

Mannerisms are as in R1: Ama warm and practical, with the full check. Chidi, Jun, Agnieszka, Zainab and Graham are unchanged in this delta. No speaker was skipped. Only Ama's lines changed. I read every Ama line in order: the ink (`:40-322`) and her 18 barks.

- Strong: none.
- Mild: 3. P2 at m2 and at m3. The R8 bark "Last thing, unplug the box." followed by the R8c pointer "Last thing. Go back to the ... port and unplug the box." is acceptable, because the pointer adds where.
- Repeats across NPCs and knots: "a saved link works like a password". The R5c bark, the midday recap and the short version each say it. The recap and the short version are read-back layers that play only on request, so this is OK.
- Monologues of four or more lines: the R1 pointer now has four (`:74-80`). Each line is a different fact: where, the coffee window, Jun's catch and the kitchen alternative. Justified. The gate list is as in R1 (justified).
- P13: no semicolons, dashes or list colons in any spoken line.
- Word caps: every line is under 30 words. The longest is 28 (the `confirm_both` bark).
- `tts-audio` standing rules: no printed variables. The two inline conditionals (`:132` kitchen or hot desk, and the plug-in conditional lines) choose between fixed strings, and `tts_mission_lines_test.rb` passes. No stage directions, no `#delivery:` notes and no `Narrator:` lines. Voices and styles are unchanged in this delta, so no cache key moves except for the reworded lines.
- Truth checks on the new lines: "nobody watches it" is true, because only Jun catches the player, and only at his port. "Jun's desk will be empty for a bit" is shown only before the plug-in. "Switch the printer back on ... first" is shown only while `printer_off`. "Every move you made is in that log" is now true for the network moves and the R5c sign-in (impl M1).

## Notes (not findings)

- `VOICED_LINES.md`: the regenerated Ama table (84 rows) holds every new line. Old wording survives only in the dated "Changed in round 1", "Changed in round 2" and "Tour round (U1)" sections. Those are labelled as superseded, and the batch reads the ink, not this file. If m1 to m3 are applied, regenerate the Ama table again.
- A printer switched off after `confirm_both` gets no "switch it back on" pointer in the `use_card` branch. Only free play reaches this state, because the guided path never sends the player to the socket after the confirm. Not worth a line.
