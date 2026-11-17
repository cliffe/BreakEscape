# Review M10 R4: m06 and m08 after engine R2 (light round)

Reviewed 2026-11-12 on committed HEAD `ba1300ab1`. Neither mission's scenario or ink has changed since R3 (`git log 7fecbed08..HEAD -- scenarios/m06_follow_the_money scenarios/m08_the_mole` is empty), and neither lab sheet has changed in HacktivityLabSheets. This round covers engine R2: the `ringWhile`/`callbackWhen` grammar check, the latch restore, and the caption at first paint. Keyless :3024, headless, stopped afterwards; no browsers left open.

Routes: `tools/phone_calls/routes/m10_live.sh` (`m06_fund`, `m06_bring_clear`, `m08_audit`) with `OUT=docs/agents/phone_calls/proofs/R4_m06_m07_m08`. Output per case is in `<case>.txt` there.

## Verdict

**Accept. 0 B, 0 M, 0 m, 3 n (all carried).** Ready for audio.

## Validators

| Mission | `validate_phone_calls.rb` | `validate_scenario.rb --no-graph` |
|---|---|---|
| m06 | no output, exit 0 | "Validation complete", exit 0. The same onceOnly overlaps, cutscene-onceOnly and multi-path `server_room` warnings, plus three word-cap ERRORs (`scenario.json.erb:1128`, `:1167`, `m06_phone_agent_0x99.ink:237`), as in R2. None concern a call. |
| m08 | no output, exit 0 | "Validation complete", exit 0. Same onceOnly and cutscene warnings, plus four word-cap ERRORs (`scenario.json.erb:773-789`, `m08_phone_agent_0x99.ink:190`). None concern a call. |

The new grammar check raises nothing: neither mission uses `ringWhile` or `callbackWhen`, because all three calls are placed from the hub.

## Live results

| Path | Game | Result |
|---|---|---|
| m06 fund call: [The advances already went out.], End, redial, [Look at the projection line.], [What do you recommend?] | 2362 | Same as R3. End mid-call leaves "Outgoing call, 0:15" and the hub choice stays. The redial plays the projection branch and the recommendation, then the choice is retired. Rows `0:15` and `0:27`, one `conversation_closed:agent_0x99_handler` per call. |
| m06 bring-in, nothing optional open | 2363 | Caption "SAFETYNET secure line" while CALLING. "Police are twenty minutes out…" [Not yet. I'm still looking.] → "Then be quick. They won't wait for you." The call closes and no debrief starts. Redial: "Police are close now. Ready?" [Bring me in.] completes `call_in_after_sweep`, then "Round the back…", then [On my way.] with no overlay. "We'll talk about the money at HQ, not on a phone." is requested, then the debrief person-chat opens and stays. |
| m08 door audit: wrong time, wrong person, then right (Director hostile) | 2366 | Wrong time: "That's a door moving or the file closing… call me back." The call ends and the choice stays. Redial: "Again, then. When was the plan opened?". Wrong person: "Read the door against the minute, not the man…", and the call ends. Third call right: "In at 10:15, out at 11:43…", "Nightshade. I trained with him.", then the hostile line "I'll put it in front of the Director myself…" and "You finish the chain." Rows `0:07`, `0:12`, `0:15`. `name_the_mole` completed, and the hub moves on to [It's really Nightshade.]. |

## Lab sheets

Both are unchanged since R3, and the play above is unchanged too, so the R3 match still holds: m06 `m06_follow_the_money.md` `:478` and `:504`, m08 `m08_the_mole.md` `:410`. I opened no VM companion and no SecGen file.

## Voiced lines read for audio

I read every call-knot line: m06 `on_architects_fund_discovered` to `handler_recommendation` (`m06_phone_agent_0x99.ink:424-479`) and `extract_call` to `extract_go` (`:606-641`), and m08 `hax_read_1` to `hax_read_right` (`m08_phone_agent_0x99.ink:227-296`). I found no typos, no printed variables, no stage directions, and no branch that contradicts another. The m08 times agree with each other: in at 10:15, plan opened 10:38, Vector out by 10:32, the file closing at 11:25, Nightshade out at 11:43. Both Director variants end on "You finish the chain."

## Nits

- **n1 (carried from R3 n1).** `global_variable_changed:start_debrief_cutscene` fires twice in one tick at the m06 hand-off (2363), and `global_variable_changed:mole_identified` fires twice when the name lands in m08 (2366). Both are harmless: the debrief opens once and the task completes once.
- **n2 (carried from R3 n2, sheet wording).** [Let me think about it.] retires the fund-call hub choice. If the m06 sheet is touched again, add "choosing [Let me think about it.] closes the topic".
- **n3 (carried from R3 n3, audio).** "$12.8 million" in the fund-call opener (`m06_phone_agent_0x99.ink:428`) is written with a symbol and figures. Listen to that clip first in the audio step. If TTS reads it badly, write it out as "twelve point eight million dollars".

Not re-run this round: m06 [Let me think about it.], the m06 bring-in with optionals open, the m08 Director-KO variant, and the reloads. The engine R2 changes don't touch the placed-call path these use beyond the caption, and the caption was seen above.
