# m04 office life: build review R4 (delta)

**Counts: 0 blockers, 0 majors, 6 minors.**

Scope: `da3ece382..d405641e9` on `build/ol-m04` (head d69d88c36; the main merge ff6d8e6b0 only touches the engine, see "Merge" below). Changed in the delta that matters: the two newcomer ink files and their compiled JSON, three strings in `scenario.json.erb` (credit :250, Ibrahim pool :1676, Joanne bark :1725), and the assertions in routes r41 and r42. Everything else is documentation and screenshots. Read-only; no game or server driven. No SecGen XML or exploit guides opened.

This file is `BUILD_REVIEW_R4.md`, not `REVIEW_R4.md`: `REVIEW_R4.md` already exists in this folder (the plan review round 4, commit 3b8024832) and the name would have overwritten it.

## Re-run by the reviewer

| Check | Result |
|---|---|
| `bin/inklecate` on both newcomer files | Compiles; the output equals the committed `.json` for both (no stale JSON) |
| `ruby scripts/validate_scenario.rb scenarios/m04_critical_failure/scenario.json.erb` | 0 errors, 33 warnings. Newcomer items: V4 (attack probe) on both, the two "need target in another room" notes, the cooler chatter notes. Nothing from the delta. Graph files restored with `git checkout` |
| `dialoguelint.mjs scenarios/m04_critical_failure/` | line-len 1, blank-reentry 2, none in the newcomer files (the one line-len is `m04_closing_debrief.ink:294`, untouched) |
| `inkcheck.js` and `loopcheck.js` on both newcomer files | Clean on both: `runaway=0`, 6/6 strategies reach a clean end. R3 m1 reported RUNAWAY; the tag move cured it (m1 below) |
| Routes r41, r42 | both `all expectations met` |
| Dashes in the two ink files | none (`grep -P '[—–]'`) |
| Offline inkjs run, engine read rule (`ChoosePathString('start')`, one `Continue()` per talk, stop on the tag, save and restore between talks, `aes_staff_off` flipped on talk 3) | Both NPCs: exactly one read and one line per talk, the tag on that line, normal line on talks 1 and 2, curt line on talks 3 and 4, `canContinue` true after each (mid-knot) and the saved state constant (588 and 546 bytes for Ibrahim, 564 and 533 for Joanne; no growth) |

## F1 re-talk fix: sound

- The tag now rides on the spoken line inside each branch (`m04_npc_ibrahim_diallo.ink:23`, `:25`; `m04_npc_joanne_pell.ink:14`, `:16`), `-> start` is kept. The engine's close path (`person-chat-minigame.js:1534`) reads `originalResult.tags` on the first and only read, shows the line, saves the story (mid-knot) and closes. The next talk restores mid-knot, runs the divert and the conditional, and returns one line again. This is the same behaviour as the offline run above, so a reload between talks (restore path) and the curt flip are covered.
- The "first talk reads the line twice" wart from R3 m2 is gone: one read on talk 1.
- Tags are trimmed (the compiled text carries a trailing space before the tag; `person-chat-minigame.js:881` trims the line and `voicelines.mjs:108` trims for TTS). Cache keys are unaffected.
- Exchanges are untouched mechanically: separate `Story`, entered by knot, `-> DONE`. Heard state is `heard_<knot>` (`systems/npc-needs.js:2986`, set at `:3100`), and the three `VAR heard_ex_*` in Ibrahim's ink match the knot names, so once-only holds across a reload because the global persists. The edit to `ex_not_on_the_rota` changed words only; the knot names, gates (`requireGlobal`) and order in `scenario.json.erb:1678` to `:1680` are unchanged.

## Other correctness checks

- **Globals:** `aes_staff_off`, `ibrahim_ko`, `joanne_ko`, `ops_kettle_off`, `aes_staff_evacuated` and `crew_warned` are set and read exactly as before the delta. The bark still gates on `crew_warned === true && !joanne_ko`, `onceOnly`; the credit still gates on `ibrahim_ko || joanne_ko`. No new global.
- **Story NPCs and VM flags:** nothing in the delta touches Vance, Static, Voltage, any lock, key, flag or objective. R4 asked for the lock/key diff; the compiled scenario changes are three strings, so it is empty by inspection. Run the diff once more in the final static checks (HANDOVER item 5) as planned.
- **Route assertions:** r41 and r42 now assert "OFFICE STAFF: hurt, and that's on you", matching `scenario.json.erb:250`. Both pass.
- **Voicing arithmetic:** the HANDOVER table adds up from the files: Ibrahim 2 talk + 4 pool + 5 exchange (2 + 2 + 1) = 11; Joanne 2 + 4 + 1 bark + 6 (2 + 2 + 2) = 13; 24 total. The HaX line is at `m04_closing_debrief.ink:438`. All 24 are in ink or NPC bark and pool fields, so each is voiceable. All spoken-line references in `SPOKEN_LINES.md` match the files (ink :23, :25, :14, :16, exchange knots :33, :40, :47; erb :1676, :1716, :1725, :243, :250, :2857).
- **Merge:** the main merge changes `systems/npc-needs.js` (magnet `perPerson`, an optional exchange `topic`) and the sound/ambient code. None of it is used by m04: the three m04 exchanges set no `topic` (so they still play at any chatter object, as before) and m04 has no magnets. No conflict with the branch's work.

## Dialogue

UK English throughout ("Hiya, duck", "love", "rota", "image" as a verb, "coats"). No em or en dashes in the ink or the three scenario strings. Attribution is on every line (`Ibrahim Diallo:`, `Joanne Pell:`, including Joanne's lines inside Ibrahim's exchange knots). Speech is at most 40 characters on every exchange line (the validator passes, longest is 39). The delta's rewrites answer the dialogue review: the bark no longer repeats the following text, both talk lines now match what the NPCs are seen doing (waiting for imaging, getting ahead), "After the rota went out. You're early." stands alone aloud, and "Inductions at six. Nobody knows I'm in." follows from "Neither of us is on tonight's rota." There are no choices in these conversations by design (one curt/normal line); the choice that matters is the player's strike and the `aes_staff_off` flip, which changes what is said. Fine.

## Minors

### m1. BUILD_LOG R3 m1 row is now wrong
`BUILD_LOG.md:93` records inkcheck and loopcheck RUNAWAY as an "accepted tool limit". With the tag on the spoken line both tools are clean on both files (table above). The row, and the "optionally teach the tools to stop at `exit_conversation`" idea, are moot. Fix: change the outcome to "Closed by the m2 tag move: inkcheck and loopcheck clean on both files at d405641e9". Also `BUILD_LOG.md:94` (m2 row) quotes the pre-dialogue-fix talk lines as the live-proven text (game 8084); say that the words were changed afterwards (022235857) so a reader does not copy the old sentences into the voicing brief.

### m2. Stale spec text still carries the old words
`PLAN.md:138` and `:190` give the bark as "That's the evacuation. Coats, now."; `REGRESSION.md:54` and `PLAYTHROUGH_KO.md:29` (and `:94`) give the credit as "OFFICE STAFF: HURT, ON YOUR ACCOUNT". The build has "That's the alarm. Coats on, out we go." and "OFFICE STAFF: hurt, and that's on you". `PLAN.md` is what the next reviewer and the voicing step read. Fix: replace the strings in those four places (or add "superseded by DIALOGUE_SAMPLE.md" at `PLAN.md:138`). `DIALOGUE_SAMPLE.md` is current and should be the single source for voicing.

### m3. HANDOVER warning count is off by one
`HANDOVER.md:18` says the merged head has 32 validator warnings; the reviewer's run at d69d88c36 gives 33, the same as `BUILD_LOG.md:116` and R3. Probably a miscount; check once, correct the number, so the final static check (item 5) compares like with like.

### m4. The changed bark and talk words have no live read yet
LIVE_PROOF_4, 7 and the game 8084 re-talk proof all pre-date 022235857 (or never read the bark). The changes are text only and the code path is unchanged, so this is low risk, but nothing live has shown the new bark toast or the new Ibrahim line. Fix: record the toast text ("That's the alarm. Coats on, out we go.") and both normal talk lines in the L8 Restart run and the KO playthrough that HANDOVER items 1 and 2 already schedule; no extra run needed.

### m5. Small writing points (optional)
- `ink/m04_npc_ibrahim_diallo.ink:25` opens "Morning." and ends "tonight's list". The mission clock is 02:00 to 06:00 (`scenario.json.erb:1924`, `:2577`), so the greeting is a little off; "Evening" is wrong too. "Hello." or dropping the greeting ("I'm waiting on the office desktops to image...") removes the clash. The line is unvoiced, so changing it now costs nothing.
- "Six o'clock" is now in Joanne's talk line, her pool, `ex_six_oclock`, and the last line of `ex_not_on_the_rota`. Four hits in a short session. Acceptable; if one goes, drop "Six o'clock comes round fast, duck." (`scenario.json.erb:1716`) since the pool repeats most.

### m6. Reload near a hostile newcomer (carried from HANDOVER, with an engine point)
`PLAYTHROUGH_KO.md:40` and `:44` note two things for AC0: a hostile newcomer stands within 30 px of the reload spawn at (159,141), and Joanne's `attackDamage` reads 4 before a reload and 10 after ("the known default-state quirk"). If the 10 is real, a newcomer you struck hits 2.5 times harder after a reload than the designed 4, and a plain reload (unlike the Restart button, `ui/game-over-screen.js:161`) does not reset hostiles, so a struck newcomer plus a reload can chain into a KO. Fix, for AC0: confirm the quirk is already tracked for all hostile NPCs; if it is not, log it; no change in this branch.

## R3 outcomes proposed in HANDOVER: my view

**R3 m3 (five-try counts L1, L2/L7, phone evacuation, seated attack at 2, 2, 2, 1; L8 Restart):** accept the counts for L1, L2/L7 and the phone evacuation at 2. They passed every time and the code paths are not random in the way a collision or timing case would be. Two caveats, neither a reason to hold the branch:
1. The justification in HANDOVER ("covered by the deterministic route files r41 and r42") is wrong for these cases. r41 and r42 set globals and run the ink debrief and credits only; neither mentions a newcomer, a talk, or any movement (`grep -c "diallo\|pell"` gives 0). They cover the credit and head-count branches, not L1, L2, L7 or the seated attack. Reword the justification.
2. The seated attack is at 1. Do not accept 1. The L8 Restart run (HANDOVER item 2) strikes a seated Ibrahim by definition, so it gives a second try for free; record it as such. Accept the seated attack only after that run passes.
The L8 Restart clause itself cannot be closed by acceptance: it is unrun. Keep it open until `LIVE_PROOF_8.md` exists. Code reading and the offline run say it works (same restore path as a reload, `aes_staff_off` still true so the curt line is expected).

**R3 m6 (R2 m3 `--set` deviation closed, R2 m5 tooling note stays, R2 m2 and m4 closed by LIVE_PROOF_7):** agree with three points.
- R2 m2 (pair render) and R2 m4 (sofa) are closed on the evidence: `LIVE_PROOF_7.md` B and C, with screenshots `pair_kettle_current.png` and `sofa_after_evac_reshoot.png`. The kettle not reading as "tea" is a cosmetic note (F3 there), not a blocker.
- R2 m3: `--set` seeds the timer start globals at game creation only, and the real timers then fire the real mappings in play (`LIVE_PROOF_7.md` "Seeds"). That is not a game-row edit and fits the no-edits-to-games rule. R3 said the deviation needed "the user's yes via AC0". HANDOVER says AC0 accepted it. Close it, but copy AC0's acceptance (the date and the words) into `BUILD_LOG.md` so the closure can be traced; "AC0 accepted" with no source is the weak point. Keep the caveat that A1 and A2 are seeded proofs, not by-play, as `LIVE_PROOF_7.md` already says.
- R2 m5 (probe-library id guard): fine as a tooling note for the integrator.
