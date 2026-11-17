# Review: HaX call writing, round 4

Reviewer: dialogue review (npc-dialog-review skill 2j; plan 3.5, 3.6, 7.3), 2026-11-12.
Branch `build/phone-calls-writing` at 982ed97f3. Fix commit 29dae9f30 (seven text edits in m01, m03, m04, m05, m07 inks and m08 `scenario.json.erb`). Round 3: `REVIEW_WRITER_HAX_R3.md`, outcomes `REVIEW_WRITER_HAX_R3_OUTCOMES.md`.

## Verdict: accept

Every R3 finding (M1, M2, m1 to m3) is fixed as written, and m4 is logged with a sound reason. Each changed line reads naturally where it sits, none breaks a cap, none repeats another HaX line, and no changed line is voiced. Two nitpicks below, neither needing a change.

Counts: B 0, M 0, m 0, nits 2.

## Checks run

On a scratch export of the branch HEAD (`git archive` into `scratchpad/hax_r4_9mAL/`, with `p-phone-calls/scripts/` copied over it). Nothing was compiled or written into either worktree.

- `bin/inklecate`: the five changed inks compile with no output, and each fresh compile is identical to the committed `.json`.
- dialoguelint (A7a copy), m01, m03, m04, m05, m07, m08: no finding on any changed line. The m08 ERB `:874` text-len error is gone (the line is now exactly 30 words). Everything it still reports is the pre-existing set listed in R3 and the R3 outcomes (line-len in m03, m04, m05, m08; m06 was not re-linted, as nothing in it changed; ERB text-len in m03, m04, m07, m08; the m07 crowded-hub CHECK).
- A7a validator (`scripts/validate_scenario.rb`), the same six missions: "Validation complete" on each. Phone-call ERRORs are only the merge-gated `#place_call:<knot> is not one of the contact's call entries` (m01 :146, m03 :116/:121, m04 :146/:150, m05 :186/:220, m07 :229, m08 :93). The p-phone-calls copy of `CALL_PROMISE` now includes `call back`, `ring back` and `call it in`, and none of the R3 changed lines trips it, so M2 is fixed by the rule as well as by eye. The remaining "call me" warnings are the bring-in and door-audit texts plan 7.3 allows, plus m08 `:248`/`:270`, which sit in `// lint: call-knot` knots and clear once m08's `call` config lands.

## R3 findings, one by one

| R3 | Line now | In its thread |
|---|---|---|
| M1 | m08 ERB `:874` "That's the door audit. The Director won't hear it from you. Read it to me: the door against the minute the plan was opened. Message me when you've got both." (30 words) | The full stop makes it a little more clipped than the sibling `:867`, which suits a Director who has just been punched. Sibling `:867` is 30 words too, and a player only ever sees one of them. |
| M2 | m04 `:201` "Line's open. Send me whatever you find." | The `[Nothing right now.]` exit of the support hub. It fits after any hub visit and no longer promises a call. See nit 1. |
| M2 | m05 `:461`, `:476` "Don't guess at me. Come back when you're sure." | Ends `name_to_hax_who` (Ashworth) and `hax_accuse_halloran` (cleared alibi). Both are once per guess and close the thread with `#exit_conversation`, so the shared line is correct. "Come back" works for a text thread. See nit 2. |
| m1 | m03 `:158` "Copy. Go carefully, {player_name()}." | Hub exit. It no longer echoes m02 `:204`, and "here" is no longer the first and last word of the thread. |
| m1 | m03 `:449` "Good. Back to it." | `report_end`, after every `report_progress` ending, including the hostile-guard "Get off the phone and keep out of his reach." It reads well after each one. |
| m2 | m01 `:290` "Good. Work the pins one at a time." | Reply to "[Thanks, I'll use it]". The sibling "[Understood]" reply is different, and the thread keeps three "Message me if…" lines plus the voiced first ring, which is enough. |
| m3 | m07 `:802` "Wait. I want to be sure I've read this right." | After "Narrator: Nothing comes back for a while." it reads as "hold on" from someone rereading the message. No pace order left in a text. |

## Repeat sweep

Grepped all HaX handler inks (m01 to m10) and `m10_hax_post.ink` for each new phrase: "whatever you find", "Come back when", "Go carefully", "Back to it", "Wait.", "Work the pins". Each appears only on its changed line, apart from the deliberate pair in m05. None of the lines is in a call knot, so 3.6's audio-key rule does not apply, and no voiced line changed (0 clips).

## m4 (m10 `hax_post` :49/:53), left as it is

I agree with the writer. Both lines are pre-existing, in-person and voiced. `:49` "I'll hear you just as well underground" suggests a voice call that m10's text-only HaX doesn't have, but the player reads it in person and then gets a text thread, so it misleads nobody for long. `:53` "Go on. I'm right here." after "From here I'm on your phone." still reads as "on the phone, right here". Changing `:49` costs a clip for a small gain. Logging it for m10's next dialogue pass, as the outcomes do, is the right call.

## Nits (no change asked)

1. m04 `:201` "Send me whatever you find." comes straight after a hub that can offer the player choice "[Send me a field guide.]" (`:190`). The two "Send me" lines face opposite ways and the player sees the choice, not a HaX line, so the echo is faint.
2. m05: HaX's "Don't guess at me. Come back when you're sure." and Patricia's "Don't throw names at me. Ring back when you're sure." (`m05_phone_patricia.ink:182`, `:201`) have the same shape. It's pre-existing (HaX's line had "Call back when you're sure." before R3), they are different speakers, and they're text. If the caller writer touches Patricia's line for its own reasons (the validator now warns on its "Ring back"), that's the moment to vary one of them.

## Voiced lines per mission

Unchanged from the R3 table: the R3 fixes touch no voiced line.
