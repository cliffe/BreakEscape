# Outcomes: HaX call writing, round 3

Writer: HaX call writer, fix round 3, 2026-11-12. Branch `build/phone-calls-writing`.
Task: `REVIEW_WRITER_HAX_R3.md` (verdict "revise, light, text only"; B 0, M 2, m 4).
Fix commit: `29dae9f30`.

All seven changes are text-only (no voiced line, no tag, divert or config touched). Every
changed line is under its length cap, each changed ink compiles, and the A7a validator reports
"Validation complete" for all six missions with no new errors.

## What changed

| Finding | File:line | Before | After |
|---|---|---|---|
| M1 | `scenarios/m08_the_mole/scenario.json.erb:874` | "That's the door audit. The Director won't hear it from you, so read it to me: the door against the minute the plan was opened. Message me when you've got both." (31 words) | "That's the door audit. The Director won't hear it from you. Read it to me: the door against the minute the plan was opened. Message me when you've got both." (30 words) |
| M2 | `m04_critical_failure/ink/m04_phone_agent0x99.ink:201` | "Line's open. Call it in when you have something." | "Line's open. Send me whatever you find." |
| M2 | `m05_insider_trading/ink/m05_phone_agent_0x99.ink:461` | "Don't guess at me. Call back when you're sure." | "Don't guess at me. Come back when you're sure." |
| M2 | `m05_insider_trading/ink/m05_phone_agent_0x99.ink:476` | same | same rewrite |
| m1 | `m03_ghost_in_the_machine/ink/m03_phone_agent0x99.ink:158` | "Copy. I'm here, {player_name()}." | "Copy. Go carefully, {player_name()}." |
| m1 | `m03_ghost_in_the_machine/ink/m03_phone_agent0x99.ink:449` | "Message me if you need me." | "Good. Back to it." |
| m2 | `m01_first_contact/ink/m01_phone_agent0x99.ink:290` | "Good. Work the pins one at a time. Message me if you get stuck." | "Good. Work the pins one at a time." |
| m3 | `m07_architects_gambit/ink/m07_phone_agent_0x99.ink:802` | "Slowly. I want to be sure I've read this right." | "Wait. I want to be sure I've read this right." |

- M1 keeps the sibling `:867` ("Call me when you've got both.", Netherton-KO branch) as the
  review directed: it sits at the cap and a player sees only one of the two branches.
- m1 breaks the m02/m03 sign-off echo: m02 keeps "Copy that. I'm here, {player_name()}." and
  "Copy. Message me when you need me."; m03 now opens "Here, {player_name()}.", exits "Copy. Go
  carefully, {player_name()}." and "Good. Back to it." The three are distinct.
- m2 drops the fourth "Message me if…" from m01's support thread (the voiced first ring already
  says "Message me the moment you're stuck"). The other three "Message me if…" lines stand.

## m4 (m10 `hax_post` :49/:53): not changed, logged

Both lines are pre-existing and voiced. The review's only candidate fix, `:49` → "Ask me on
the phone. It works just as well underground.", re-keys a voiced line and so costs a clip. The
task says leave them unless the fix costs no clip. Decision: left as they are, logged here for
m10's next dialogue pass (the task's own instruction). No clip spent this round.

## Checks

Scratch export of `build/phone-calls-writing` at `29dae9f30` (`git archive` into
`scratchpad/hax_r3fix_1794487281/`, with `p-phone-calls/scripts/` copied over it). Nothing was
compiled or written into either worktree.

- `inklecate`: the five changed inks (m01, m03, m04, m05, m07) compile with no output.
- dialoguelint (A7a copy): no finding on any line this round changed. The m08 ERB `:874` 31-word
  error is gone. All remaining dialoguelint errors are pre-existing and on unchanged lines
  (m03 :230/:354 and closing_debrief/ERB; m04 :258/closing_debrief/ERB; m05 :1083/closing_debrief;
  m07 ERB :947/:954/:962/:970; m08 :190/ERB :769/:777/:785).
- A7a validator (`scripts/validate_scenario.rb`), all six HaX missions touched: "Validation
  complete" on each. The only phone-call ERRORs are the merge-gated
  `#place_call:<knot> is not one of the contact's call entries` (m01 :146, m03 :116/:121,
  m04 :146/:150, m05 :186/:220, m07 :229, m08 :93), which clear once each mission's `call` config
  lands (writer notes, merge rule B1). The m08 `:874` and the m04 `:201` / m05 `:461`/`:476`
  "call" warnings are no longer reported.

## For the A7a validator owner

As the review noted, the 3.5 text pattern (`CALL_PROMISE`) misses `call it in` and `call back`,
which is why M2's three lines slipped through R2 and N1. HaX's own call knots legitimately use
"call me back" (m08 `:248`, `:270`, which redial a placed call), so adding those forms needs the
call-knot exemption the rule already has.
