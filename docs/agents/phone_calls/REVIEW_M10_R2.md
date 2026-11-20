# Review M10 R2: m06 and m08 after the engine sweep (light, post-sweep)

Reviewer: Opus, 2026-11-12. Reviewed at `ff4f929ee`, which includes the M10 R1 fixes (`96afeaa70`), the sweep (`752d9d612`, `88862563c`, `40a15667c`) and the HaX contact `callLabel` (`4e5f7cd12`). HacktivityLabSheets at `10c4c44`. Committed code only. Keyless server on :3024 with its own pid file, headless, stopped afterwards. Routes: `tools/phone_calls/routes/m10_live.sh` (`m06_fund`, `m06_bring_clear`, `m06_bring_optional`) with `OUT=docs/agents/phone_calls/proofs/PS_m04_m06_m08`. The m08 KO and hostile cases are a scratch script on the same helpers. It starts from `found_timeline` and the Director's state, then sets `found_badge_audit` and emits its event, so HaX's text comes from the real mapping. Output in `proofs/PS_m04_m06_m08/m06_m08_runs.txt`. No code changed.

## Verdict

**Accept. Nothing above a nit.** All four R1 fixes hold in play, the sweep broke nothing on these three calls, and the duplicate `conversation_closed` that R1 noted at the m06 hand-off is gone. The m04 ring-banner caption gap (`REVIEW_M4_R3.md` m2) does not show here: m06 and m08 have no HaX ring on these paths, and every call I placed showed "SAFETYNET secure line".

## Live results

| Path | Game | Result |
|---|---|---|
| m06 fund call, early hang-up, then the recommend branch | 2243 | The hub's [I've found The Architect's Fund.] places the call, opening "I've got it in front of me." After [The advances already went out.], End leaves "Outgoing call, 0:16" and the hub choice is still there. The redial takes [Look at the projection line.] then [What do you recommend?], and HaX voices "Watching still works if we detain him. The payout's pre-signed; we keep it quiet until it's gone." between the watch cost and "The advances are gone either way." Afterwards the hub choice is retired. One `conversation_closed:agent_0x99_handler` per call. |
| m06 bring-in, nothing optional open | 2248 | "Police are twenty minutes out." [Not yet.] → "Then be quick." The call closes and the debrief does not start. Redial: "Police are close now. Ready?" [Bring me in.] completes `call_in_after_sweep`, "Round the back. They'll flash the headlights twice.", [On my way.], no overlay. The last line "We'll talk about the money at HQ, not on a phone." is requested, then the debrief person-chat opens and stays. |
| m06 bring-in, three optionals open | 2252 | Same up to [On my way.]. The overlay lists the three optionals and not the call-in task. Keep going leaves the call open on [On my way.] with no debrief. End returns to the hub with [I'm done here. Bring me in.] back. |
| m08 door audit, Director KO'd | 2255 | The real `found_badge_audit` mapping sends "…Call me when you've got both." No Call button in the thread header (`button: false`), and the hub's first choice is [I can name the leak.]. It places the call: CALLING caption "SAFETYNET secure line". 10:38 then Nightshade. The KO branch voices "I'll put it in front of the Director when he can stand." and "You finish the chain." `mole_identified`, `named_by_hax` and `name_the_mole` are set, and the hub moves on to [It's really Nightshade.]. |
| m08 text, Director hostile | 2258 | "The Director won't hear it from you. … Call me when you've got both." Same hub choice, no header button. |

## The R1 fixes

- **m1 (comments).** Not re-read beyond confirming that the behaviour they describe is what happens: the task completes on [Bring me in.] before the ending question (games 2248, 2252).
- **m2 ("Call me" with `button: false`).** It holds. Both texts say "Call me when you've got both." The thread has no header Call button, but the hub's top choice [I can name the leak.] places the call. That is the plan 3.5 pattern and how m06's "Call me about it" already works. A player who looks for a Call button in the header won't find one, but the choice is the first thing under the text. No action.
- **m3 (lab sheet).** `HacktivityLabSheets/_labs/safetynet/m06_follow_the_money.md:478`, in the "Satoshi Nakamoto II" Nudge. The choice name is exact (ink `:173`). "the phone rings her" is right for a placed call. "She can set out what freezing the wallet would cost against watching it" holds for both branches. "If you hang up early, the option stays on the menu and you can ring again" matches game 2243. I opened no VM companion.
- **m4 ("Watching still works if we detain him.").** It reads correctly in context. It follows the two costs and comes before "The advances are gone either way", so it states a condition, not news. "him" points back to "the man in the corner office upstairs" in the opener. That's six lines earlier, but it is the only man named in the call. I heard no problem in the text, and as R1 noted, there's no audio yet to judge it by ear.

## Nits

- **n1.** At the m06 hand-off, `global_variable_changed:start_debrief_cutscene` still fires twice in the same tick (game 2248), from the `~` plus `#set_variable`, as R1 noted. In m08, `global_variable_changed:mole_identified` also fires twice when the name lands (game 2255). Both are harmless, since the debrief opens once and the task completes once. Ink tidy-up only, if anyone is in those knots.
- **n2.** "$12.8 million" in the fund-call opener is a literal, not a printed variable. TTS should read it as "twelve point eight million dollars". This predates the track. Check it in the audio step.

## Not checked

The m06 and m08 reload cases were not re-run. The sweep's tutorial hold and terminal read beat don't touch these calls: they use the handset look and come long after the tutorial. I opened no SecGen file or VM companion.
