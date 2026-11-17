# Review A7 docs, round 5 (light, final)

Reviewer: Opus, 2026-11-12. Read-only review of `build/phone-calls` at `88033afb3` (R4 fixes in `41d00b419`).

Scope: the R4 outcomes; `README_scenario_design.md` "Voiced phone calls" (1848-2095) and the phone-call parts of `README_ink_best_practices.md` (109, 547-717, 1084-1110) against each other and against the messages in `scripts/validate_phone_calls.rb`; `docs/agents/phone_calls/A7_DOCS_NOTES.md` for the end-of-track skill updates (checked against this branch's `.claude/skills/tts-audio`, `validate-scenario`, `scenario-design-review` and `npc-dialog-review` SKILL.md files). `node --test test/js/validator-phone-calls.test.mjs`: 0 fail.

## Verdict

**Accept. Nothing above a nit.** Seven nits: two in the scenario README, three in the skill notes, two in validator text that the docs now describe more precisely than the code says it.

Every R4 finding landed as asked: m1 (notes 64 and 43), n1 (1878, 1879), n2 (1989, one full stop, m07 aside outside the connected-call clause), n3 (1979, 1884), n4 (2075, both clauses), n5 (1878), n6 (2089), n7 (validator line 449 errors on `||` in `call.when`, with a test; the doc line 2079 matches the message). The two READMEs agree with each other on every rule I checked: call knot ending, no divert home, home knot never routes into a call, `#place_call` form and its validator error/warning, the two engine variables and the 20 s ring-out, voicemail timing, the bring-in shape and `#ending_check` placement, id prefixes. The scenario README's error and warning lists match the validator's `err`/`warn` calls one for one.

## Nits

- **n1** `README_scenario_design.md:1977`. The grammar here still reads as before R4 n5: "including `!globalVars.x` and a comparison to a literal". Replace "an `&&` chain of `globalVars.*` terms, including `!globalVars.x` and a comparison to a literal (" with "an `&&` chain of single `globalVars.<name>` terms, including `!globalVars.x` and a comparison to a literal or another `globalVars.<name>` (".
- **n2** `README_scenario_design.md:1912` (`call.when` row). It says "For an OR, write two entries with the same knot" but not that an `||` is now an error. Replace that sentence with: "For an OR, write two entries with the same knot: an `||` is a validator error, because the engine would read the whole condition as false."
- **n3** `A7_DOCS_NOTES.md:11-14`. The heading says the work is done, but the two items below it still read as to-dos. Replace lines 11-14 with:

  > ## Merged from main (done)
  >
  > 1. "Remote conversations: write for the mode" (README_ink_best_practices.md): the "Voiced phone call" and "Voicemail or recording" rows of the mode table name `ring`, `call` and `voicemailKnot`, and point at "Writing call and voicemail knots" and "A voicemail knot".
  > 2. Its "never the contact's home knot or hub" and "ends `#exit_conversation` then `-> DONE`" agree with the new section; no change.

- **n4** `A7_DOCS_NOTES.md`, **validate-scenario and scenario-design-review**. The R4 `call.when` error (`41d00b419`) is not in the skill notes. After the `ringWhile` bullet (line 64), add:

  > - `call.when` is an `&&` chain of `globalVars.` terms. An `||` is a validator error (the engine reads it as one unsupported term and the entry never holds); write two entries with the same knot. The full error and warning list is in `README_scenario_design.md` "What the validator checks for phone calls": point the skills at it rather than copying it.

- **n5** `A7_DOCS_NOTES.md:21`/`:23` (tts-audio line 21). The skill line says "Phone chats are not voiced (no ink has `voice:` lines)", which is false once voicemail knots exist. At the end of the line 23 bullet, add: "Delete the parenthesis \"(no ink has `voice:` lines)\" from skill line 21: voicemail knots have them."
- **n6** `scripts/validate_phone_calls.rb:493` (warning text) disagrees with the doc after R4 n6. Replace "a call and its thread each emit it, so it can fire twice (plan 3.2)" with "it runs once per call and again on each later thread visit (plan 3.2)".
- **n7** `scripts/validate_phone_calls.rb:566-568` and `:580`. The comment says an unreadable `callbackWhen` means "the callback never be offered", where R4 n4 found, and the doc now says, that it is cleared at once. The error message also omits the `globalVars.`-to-`globalVars.` comparison that the engine and the code accept. In the comment replace "or the callback never be offered (callbackWhen)" with "or the callback be cleared at once (callbackWhen)". In the message on line 580 replace "only globalVars. terms (optionally negated or compared to a literal) are evaluated" with "only single globalVars.<name> terms (optionally negated, or compared to a literal or another globalVars.<name>) are evaluated". Check `test/js/validator-phone-calls.test.mjs` for an assertion on the old wording first.

None of these blocks the track. n3-n5 matter most, because the notes are what the orchestrator hands the user for the skill edits.
