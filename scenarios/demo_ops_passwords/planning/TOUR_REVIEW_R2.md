# demo_ops_passwords: tour review R2 (implementation and dialogue)

Round 2 of the guided tour review, implementation and dialogue together, and the dialogue sign-off before voice audio. Tree `/data/be-ops-follow`, branch `ops-showcase-tour`. Delta under review: `5d61fe3d5` (round 1 fixes) against `717fd2956`. Sources: `planning/TOUR_IMPL_REVIEW_R1.md`, `planning/TOUR_DIALOGUE_REVIEW_R1.md`, the fixer's "Tour round 1 fixes" in `planning/BUILD_REPORT.md`, `.claude/skills/npc-dialog-review/SKILL.md` (2l) and the `tts-audio` standing rules. No code changed; no SecGen XML or field guide opened; no server started.

**Implementation: clean** (0 blockers, 0 majors, 1 minor).
**Dialogue: not signed off** (0 blockers, 1 major, 3 minors). The major is one recap line; the next round can be a one-line delta check.

## Checks run

| Check | Result |
|---|---|
| `scripts/compile-ink.sh demo_ops_passwords` | 7/7 compiled, 0 failed; committed JSON unchanged (git status clean) |
| `validate_scenario.rb ... --no-graph` | 0 errors, 27 warnings (same as R1) |
| `dialoguelint.mjs scenarios/demo_ops_passwords/` | 0 ERROR, 1 CHECK `crowded-hub` (24 choices, explained in BUILD_REPORT) |
| `loopcheck.js` on `ama_owusu.json` | no runtime errors, 6/6 strategies reach a clean end |
| `check_mapping_index_drift.rb main` | 0 failures |
| Rails `demo_ops_passwords_scenario_test.rb` (shared lock) | 52 runs, 1483 assertions, 0 failures, 0 errors |
| Stale-line grep (old wordings from R1) | none left outside the R1 review files; `VOICED_LINES.md` carries the new lines |

`bin/ops-golden-compare` was not re-run (the delta touches scenario data, ink and one test only; the fixer reports 45 runs, 0 failures).

## Round 1 findings, closed with evidence

### Implementation review R1

| Finding | Status | Evidence |
|---|---|---|
| M1 board order | closed | `tour_notice` text (`scenario.json.erb:549`): midday gains the P8b line; afternoon runs P10, P11a, P11b, P11c, P12, P13/P14 in panel order |
| M2 P13 pointer, coffee | closed | `ama_owusu.ink:213-215` names the coffee lever; PLAYTEST P13 says why |
| M3 live check, timings | mostly closed, rest is m-I1 below | game 294: P1, P6b, P8b barks and P8b end to end with the override row; PLAYTEST "Expected timings" is a measured table |
| m1 "names one record" | closed | toast no longer named in speech; PLAYTEST and runbook say "a single record" / "Hash collected (2)" |
| m2 P7 bark | closed | "...The taskbar said Administrator." |
| m3 P11c pointer and PLAYTEST | closed | `:207` "as Graham" plus switch-back advice; PLAYTEST P11c restores Start, Switch user |
| m4 borrow-first chosen at telling time | closed | `:94-99`: three choices by what the player says; tell-time divert gone; pinned in test `:544-550` |
| m5 leak scan lacks P8b | closed | `play_whole_run` signs in as Graham at `delphine_pc` and plants the stick; two `USB_OVERRIDE` rows asserted; scan 0 findings |
| m6 P14 sign-out | closed | `:218` "Now sign out at Julian's PC..." |
| m7 P8b before P6b spends the stick | closed | `desk_usb_port` hint (`!globalVars.usb_refused_done`) and conditional confirm. Checked in the engine: the port has no `consumesItem`, so `interactions.js:1143-1146` takes the non-gated path and `applyActions` skips the confirm by its condition (`apply-actions.js:215-217`); the stick is not sent. A user session still refuses before `triggerOnInteract` (`interactions.js:1114-1121`), so P6b is unaffected. Grammar `!globalVars.x` is valid (`global-condition.js:86`). Pinned in test `:592-593` |
| m8 P13 bark | closed | "It works on the desks it covers." |

### Dialogue review R1

| Finding | Status | Evidence |
|---|---|---|
| M1 local refusal reason | closed in the report-back; **reopened in the recap** (D-M1) | `:318` now gives the real reason; the recap contrast written for it is false |
| M2 hot desk recap | closed | `:520` Niamh's record |
| M3 report-backs about a gone toast | closed | `:287`, `:295` as suggested |
| M4 sign-in screen not seen | closed | `:215`, `:218` |
| m1 to m11 | closed | as suggested, except m6 worded differently (`:562`); the fixer's reason holds (P6b also ticks with no session) |
| m12 crowded hub order | closed | report-backs moved up to `:92-105` |
| m13 VOICED_LINES drift | closed | regenerated from the extractor in `5d61fe3d5` |

## Findings

### Dialogue

**D-M1 (major). The new refusal recap teaches a false rule** (`ama_owusu.ink:502`, P14 recap).
"A domain account works on any PC in the domain. A local one stays on its own few desks."
In this showcase a domain account signs in only where the PC's access list admits it: `delphine_pc`, `jun_pc` and the partner PC carry `access: { people: [owner], roles: ["it"] }`, and `CredentialModel#pc_admits_account?` (`lib/break_escape/credential_model.rb:197-205`) judges that list after the account kind. The scenario's own test pins it: "the owner-only PCs refuse an ordinary account that is not named" (Delphine refused at the partner PC and at Graham's PC). The line also contradicts Ama's other recap, `:568` "A user's sign-in opens that user's desk, and no more.", and her pointer `:189` "Delphine's sign-in never could." A player who heard both in one sitting gets two rules that cannot both be true.
Rewrite (16 words, true, keeps the domain contrast and does not repeat `:318`'s "set up on"): "A local account isn't part of the domain, so only the desks it was made on know it."

**D-m1 (minor, mild). "Both overrides" can be false in free play** (`:496`). The recap is gated on `stick_override_done` alone; a player who does P8b before P8 hears "Both" with one override made. Prose fix, true on every route: "Each override left a row in the log. An administrator can get round a rule, but not quietly."

**D-m2 (minor, mild, 2l P2). Two facts told three or more times in one sitting.**
- "A PC remembers who signed in": `:279`, `:287` (new), `:304`, `:490`, `:532`, `:614`. Trim `:490` to "Borrowing left Jun's account on the hot desk." (drop the second sentence).
- "A weak one falls at once": pointer `:210`, report-back `:311`, recap `:514`. Trim `:514` to "A remembered record cracks like any other."

**D-m3 (minor, mild, 2l P11). A dead hedge in the P13 pointer** (`:215`, 24 words). "Sign out first if you're still in as Graham" cannot apply by P13: Graham's session at Delphine's PC ends when she returns from the P8b coffee trip (PLAYTEST P8b; `pc-sessions.js` back-at-desk), and she is back at her desk all afternoon. Suggest "Ask me to send them for coffee, then type the name and password under Other user." Optional; it is not false, only padding.

### Implementation

**I-m1 (minor). The live check covers three of the seven new barks.** Game 294 proved the `global_variable_changed:<task>_done` bark route (P1, P6b) and P8b end to end. Not yet seen in a browser: the `user_signin`, `admin_signin`, `see_borrow` and `local_account` barks, the P11a and P11c toasts, the Start / Switch user path at the hot desk after the borrow, the m7 hint before P6b, and Jun's borrow timing (PLAYTEST says "not measured"). The mechanism is the one already proven, so this is not blocking; close it in the plan 4.2 guided playthrough and write the borrow seconds into PLAYTEST then.

## Voice checks (all voiced lines: seven ink files, Ama's barks, chatter)

- Rule 2 (no printed variables): none in any voiced line or bark.
- Rule 7 (no stage directions): none; no `#delivery:` needed.
- 2l P13 (written punctuation): no colon, semicolon or dash in any spoken line or bark.
- Word caps: longest line 25 words (`:207`); the `user_signin` bark is 24. None over 30.
- Speakers and mannerisms as in R1 (Graham and Julian skipped for P1/P3 on small talk and brevity). Only Ama's and Jun's ink changed; Jun's change ("doornail") is fine.
- Concision count for this round: strong 0; mild 4 (D-m1, D-m2 twice, D-m3). Monologues: `short_version` (five lines, asked for by name) still allowed.

## For the fixer

Ink only (`ama_owusu.ink`): D-M1 is required for sign-off; D-m1 and D-m2 are one-line prose changes worth taking in the same pass, since no audio exists yet; D-m3 is optional. Recompile, dialoguelint, regenerate `planning/VOICED_LINES.md`. The Rails test does not pin these strings (check with a grep before committing). I-m1 goes to the 4.2 playthrough, not the fixer.
