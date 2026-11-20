# Review M10 R5: m06 and m08 (light round)

Reviewed 2026-11-12 on committed HEAD `88033afb3`. Neither mission's scenario or ink has changed since R4 (`git log ba1300ab1..HEAD -- scenarios/m06_follow_the_money scenarios/m08_the_mole` is empty), and neither lab sheet has changed. The engine change in range is `41d00b419`, which makes `||` in `call.when` a validator error. Keyless :3024, headless, stopped afterwards; the routes closed their browsers.

Routes: `tools/phone_calls/routes/m10_live.sh` (`m06_fund`, `m08_audit`) with `OUT=docs/agents/phone_calls/proofs/R5_m06_m07_m08`. Output per case is in `<case>.txt` there.

## Verdict

**Accept. 0 B, 0 M, 0 m, 3 n (all carried).** Closes M10. Ready for audio.

## Validators

| Mission | `validate_phone_calls.rb` | `validate_scenario.rb --no-graph` |
|---|---|---|
| m06 | no output, exit 0 | "Validation complete", exit 0. Identical to R4 (`val_m06_follow_the_money.txt`): the three word-cap ERRORs at `scenario.json.erb:1128`, `:1167` and `m06_phone_agent_0x99.ink:237`, none on a call. |
| m08 | no output, exit 0 | "Validation complete", exit 0. Identical to R4 (`val_m08_the_mole.txt`): the four word-cap ERRORs at `scenario.json.erb:773-789` and `m08_phone_agent_0x99.ink:190`, none on a call. |

Neither mission uses `call.when`, so the `||` check has nothing to find.

## Live results

| Path | Game | Result |
|---|---|---|
| m06 fund call: [The advances already went out.], End, redial, [Look at the projection line.], [What do you recommend?] | 2375 | Same as R4. End mid-call leaves `Outgoing call, 0:15` and the hub choice stays. The redial plays the projection branch and the recommendation, then the choice is retired. Rows `0:15` and `0:28`, one `conversation_closed:agent_0x99_handler` per call. |
| m08 door audit: wrong time, wrong person, then right (Director hostile) | 2377 | Same as R4. "That's a door moving or the file closing…", then "Again, then. When was the plan opened?", then "Read the door against the minute, not the man…", then the right read: "In at 10:15, out at 11:43…", "Nightshade. I trained with him.", "I'll put it in front of the Director myself…", "You finish the chain." Rows `0:07`, `0:12`, `0:16`; `name_the_mole` completed; the hub moves on to [It's really Nightshade.]. |

## Lab sheets

Unchanged since R3, and so is the play, so the R3 match holds: m06 `m06_follow_the_money.md` `:478` and `:504`, m08 `m08_the_mole.md` `:410`. I opened no VM companion and no SecGen file.

## Voiced lines read for audio

I read the call knots once more: m06 `m06_phone_agent_0x99.ink:424-479` and `:606-641`, m08 `m08_phone_agent_0x99.ink:227-296`. No typos, printed variables or stage directions, and no branch that contradicts another. The only line I'd listen to first is the one in n3.

## Nits

- **n1 (carried).** `global_variable_changed:mole_identified` still fires twice in one tick when the name lands in m08 (2377, `m08_audit.txt`). Harmless: the task completes once. The m06 `start_debrief_cutscene` double fire was not re-run this round.
- **n2 (carried, sheet wording).** If the m06 sheet is touched again, add that choosing [Let me think about it.] closes the fund topic.
- **n3 (carried, audio).** "$12.8 million" in the fund-call opener (`m06_phone_agent_0x99.ink:428`) is written with a symbol and figures. Generate and listen to that clip first. If TTS reads it badly, write it out as "twelve point eight million dollars".

Not re-run this round: the m06 bring-in (both variants), the m08 Director-KO variant and the reloads. Nothing they touch has changed since R4.
