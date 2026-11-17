# Review M10 R3: m06 and m08 after ringWhile (light round)

Reviewed 2026-11-12 on committed code at `7fecbed08`. The commits that landed during the run are docs only, and the m06/m08 scenario, ink and phone engine had no uncommitted changes. This round covers `464c42064` (`ringWhile` replaces the implicit ring re-check, held calls are never dropped, a player hang-up is instant) and `d05dad42d` (the banner falls back to the contact's `callLabel`). m06 and m08 have no scenario changes since R2. HacktivityLabSheets is at `e596f8b`. Keyless :3024, own pid file, headless, stopped afterwards.

Routes: `tools/phone_calls/routes/m10_live.sh` (`m06_fund`, `m06_bring_clear`, `m06_bring_optional`, `m08_audit`) and `proofs/R4_m05_m06_m08/r4_m06_m08.sh` (`m06_think`, `m08_ko`, `m08_hostile`), all with `OUT=docs/agents/phone_calls/proofs/R4_m05_m06_m08`. Output for each case is in `<case>.txt` there. The m08 KO and hostile cases start from `found_timeline` and the Director's state. They then set `found_badge_audit` and emit its change, so HaX's text comes from the real mapping.

## Verdict

**Accept. 0 B, 0 M, 0 m, 3 n. Nothing is above a nit.** Neither engine change shows on these calls. All three calls are placed from the hub, never rung, so `ringWhile` and the banner fallback don't apply. Every placed call showed "SAFETYNET secure line".

## Live results

| Path | Game | Result |
|---|---|---|
| m06 fund call: [The advances already went out.], End, redial, then [Look at the projection line.] and [What do you recommend?] | 2330 | Same as R2. End mid-call leaves "Outgoing call, 0:16", and the hub choice stays. The redial runs the projection branch and then the recommendation. The choice is retired afterwards, with rows `0:16` and `0:29` and one `conversation_closed:agent_0x99_handler` per call. |
| m06 fund call: [The advances already went out.], then [Let me think about it.] | 2329 | Dialled with caption "SAFETYNET secure line". The preview plays, then "Take your time. Not too much.", and the call closes itself (`#exit_conversation`). There is one `conversation_closed`, "Outgoing call, 0:23", and the hub choice is retired (n2). |
| m06 bring-in, nothing optional open | 2336 | "Police are twenty minutes out." [Not yet.] → "Then be quick." The call closes and there is no debrief. Redial: "Police are close now. Ready?" [Bring me in.] completes `call_in_after_sweep`, then "Round the back…" and [On my way.], with no overlay. "We'll talk about the money at HQ, not on a phone." is requested, then the debrief person-chat opens and stays. |
| m06 bring-in, three optionals open | 2335 | Same up to [On my way.]. The overlay lists the three optionals. Keep going leaves the call on [On my way.] with no debrief and the task completed. End returns to the hub with [I'm done here. Bring me in.] back. |
| m08 door audit, Director KO'd | 2339 | The real mapping sends "…With the Director on his floor, you read it to me… Call me when you've got both." There is no header Call button. [I can name the leak.] places the call, caption "SAFETYNET secure line". 10:38, then Nightshade. The KO line "I'll put it in front of the Director when he can stand." plays, then "You finish the chain." `mole_identified`, `named_by_hax` and `name_the_mole` are set, and the hub moves on to [It's really Nightshade.]. |
| m08 text, Director hostile | 2340 | "That's the door audit. The Director won't hear it from you. … Call me when you've got both." Same hub choice, and no header button. |
| m08 audit, wrong time, wrong person, then right | 2341 | Wrong time: "That's a door moving or the file closing… call me back." The call ends and the choice stays. The redial opens "Again, then. When was the plan opened?". Wrong person: "Read the door against the minute, not the man…" and the call ends. The third call is right and plays the hostile line "I'll put it in front of the Director myself. He won't take it from you tonight." Rows `0:07`, `0:12` and `0:16`, and the task is completed. |

## Lab sheets

- **m06** (`m06_follow_the_money.md`, unchanged since R2). `:478` in the Satoshi Nudge says [I've found The Architect's Fund.] rings her, she sets out the two costs, and an early hang-up keeps the option. That matches 2330. `:504` covers the bring-in: [Bring me in.] then [On my way.], [Not yet. I'm still looking.] ends the call and you can ring again, and with optionals open you get the overlay, where Keep going leaves you on the call and hanging up returns you to the thread. That matches 2336 and 2335 word for word.
- **m08** (`m08_the_mole.md`, unchanged since R2). `:410`: with the Director out of action, [I can name the leak.] rings her, she asks two questions, a wrong answer ends the call and the choice redials, and [Let me read it again.] ends it without cost. That matches 2339 and 2341.

I opened no VM companion and no SecGen file.

## Nits

- **n1 (carried from R2 n1).** At the m06 hand-off, `global_variable_changed:start_debrief_cutscene` still fires twice in one tick (game 2336). In m08, `global_variable_changed:mole_identified` also fires twice when the name lands (2339, 2341). Both are harmless: the debrief opens once and the task completes once.
- **n2 (new, sheet wording).** [Let me think about it.] retires [I've found The Architect's Fund.] (`reacted_fund = true`, ink `:463-466`). After that, HaX's recommendation can't be replayed from the hub. The wallet costs are still given by "What about the wallet?" once flag 4 is in, and by Satoshi's conversation. The m06 sheet's "If you hang up early, the option stays on the menu" is correct, but a student could read [Let me think about it.] as hanging up. If the sheet is touched again, add "choosing [Let me think about it.] closes the topic". No game change needed.
- **n3 (carried from R2 n2).** "$12.8 million" in the fund-call opener is a literal. Check it in the audio step.

## Not checked

The m06 and m08 reload cases were not re-run, because neither engine change touches a placed call's reload.
