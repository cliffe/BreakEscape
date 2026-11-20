# M5 review, round 4 (m05, light round after ringWhile)

Reviewed 2026-11-12 on committed code at `7fecbed08`. The commits that landed during the run (`a9fb7b727`, `239ca247d`) are docs only, and the m05 scenario, ink and phone engine had no uncommitted changes. This round covers the two engine changes since R3: `464c42064` (`ringWhile` replaces the implicit ring re-check, held calls are never dropped, a player hang-up is instant) and `d05dad42d` (the ring banner falls back to the contact's `callLabel`). m05's own files are unchanged since R3 (`dd2ba4ae5`).

**Result: 0 B, 0 M, 0 m, 3 n. Nothing is above a nit.** R3 n1 is fixed. R3 n2 is real, but it is the documented rule, not a fault.

## Live check (keyless :3024, own pid file, headless, server stopped afterwards)

Routes: `proofs/PS_m05/route.sh` (`rec_decline`, `rec_reload`, `root_slow`, `captions`, `row31_probe`, `bring_label`), `tools/phone_calls/routes/m05_live.sh patricia`, and a probe for n2 (`proofs/R4_m05_m06_m08/n2_probe.sh`). All have `OUT=docs/agents/phone_calls/proofs/R4_m05_m06_m08`. Output for each case is in `m05_<case>.txt` there. The head starts are the same as R3's. The Recruiter cases use the real Patricia naming call placed with the Call button.

| Case | Game | What happened |
|---|---|---|
| `rec_decline` | 2291 | The naming call ended by itself on [On my way.], with no End press. She rang 7.4 s after the call closed. Banner: "The Recruiter \| TalentStack Executive Recruiting \| Incoming call". After Decline, `recruiter_texted=true` and nothing else rang in 12 s. Her thread shows one "Missed call" row, the "Call back" header button and the follow-up text "TalentStack Executive Recruiting. We should talk before you do anything you can't take back. - R.". Call back went CALLING, then "You rang back. Manners, or curiosity?" into `first_call`, with `recruiter_contacted_player=true` and `as=0 callback`. |
| `rec_reload` | 2297 | Naming call, then the phone closed. A bare reload 3 s later, with `recruiter_texted=false` and no ring yet. After the load the `game_loaded` twin rang 3 s into the watch: one ring in 30 s, ring-out, one Missed row, `queue=0`. |
| `root_slow` | 2304 | Root flag in. Banner: **"Agent HaX \| SAFETYNET secure line \| Incoming call"** (R3 n1 fixed). It was still ringing at 40 s (`untilAnswered`), with the caption still on the banner. Answered at `as=43`: "Finally. Sit down for this." and then the authorisation lines. |
| `captions` | 2296 | Ring banner as in `root_slow`, and the answered call reads "SAFETYNET secure line". The hub-call step stalls at the gate, as in R3, because "Where do I stand?" is a text and not a call (route only). The hub-call caption comes from `row31_probe`. |
| `row31_probe` | 2303 | Root ring offered, then the hub choice "The Architect signed off…" taken. The placed call reads "SAFETYNET secure line" while dialling and once connected, `stateOf(HaX)=connected` and `stateOf(recruiter)=queued`. After End, HaX did not ring again (row 31 drops her offer). Her only row is "Outgoing call, 0:07". The Recruiter's twin rang next and was missed 11.6 s later (n1). |
| `bring_label` | 2317 | The twin rang at load and was declined. Bring-in from the hub: CALLING, then the call. HaX names the envelope, the upload schedule, the manifest, and then "TalentStack's line is still open. She's lost him. Ring her if you want to hear her lose." [Bring me in.] then [On my way.]: no overlay with nothing optional open, `mission_complete=true`, the person-chat debrief opened, **no ring in 15 s**, `ringer=null`, `queue=0`, and no Recruiter `/tts` request after load. |
| `patricia` | 2323 | Her thread has a "Call" header button. It dials and connects: "Morgan." with [I know who it is.] [Just checking in.]. |

The Recruiter rang exactly once in every case: after the naming call, after a reload in her window, and at load in the twin cases. The `ringWhile` change does not touch m05, which has no `ringWhile`. Her latch (`recruiter_texted`) now only restores on a `ringWhile` drop, so it stays set as before.

## Lab sheet

`HacktivityLabSheets/_labs/safetynet/m05_insider_trading.md` at `e596f8b`. Its last m05 change is `229ba7d`, which R3 already saw.

- `:80` and `:213`: Patricia's mobile, rung with the call button in her thread. This matches `patricia`.
- `:407`: "Ring Patricia and choose [I know who it is.]". This matches the naming call in `rec_decline` and `rec_reload`.
- The Recruiter Nudge, `:513`: she calls when the naming conversation closes. Declining or letting it ring out leaves a text and a call-back button, and you can ignore her. This matches `rec_decline` and `rec_reload`. I did not re-check the line "if you confront the insider first … she no longer makes an offer" live.
- `:557-559`: [I'm done here. Bring me in.] rings her, she names anything you have not read, then [Bring me in.]. This matches `bring_label`. The sheet doesn't mention [On my way.], but the call offers nothing else at that point, so no change is needed.

I opened no VM companion and no SecGen file.

## Findings

### n1. R3 n2 is real: a requeued ring keeps its elapsed ring time (by design)

`n2_probe.sh` (game 2312) samples the ringer. The Recruiter's `game_loaded` twin starts ringing at load, because the head start names Torres. It had rung for 14.7 s (`ringMs 14666`) when the route opened HaX's thread. The open conversation requeued it with its time kept: `requeueHead` (`phone-ringer.js:428`, "elapsed time kept (rows 23, 24, 26)"). After HaX's call it came back at `ringMs 18125` and was missed at 67.8 s, about 2 s later. Queued time does not count, because `advance()` (`:302-316`) adds to `ringMs` only while the offer is `ringing`. The total ring time is still the 20 s `RING_TIMEOUT_MS`. Only the first stretch rang before the player opened a conversation.

On the normal path the player can't reach this. The Recruiter rings after the naming call, with no conversation open. It only shows when the player opens a conversation part-way through a ring, and then the ring comes back for its remaining seconds. That follows the plan's rows 23 and 24. No action. If the rule ever needs softening, a requeued ring could get a short minimum ring when it comes back (for example 5 s), but that is a plan decision, not an m05 fault.

### n2. `captions` route: the hub-call step uses a text choice

`route.sh captions` picks "Where do I stand?", which is a text reply, so the gate waits for a call that never opens. `row31_probe` already gives the hub-call caption. If anyone reuses the case, swap the step for "The Architect signed off…" or "Bring me in". This is route only.

### n3. Carried

R2 n2 (the silent twin's text repeats HaX's own text) and R2 n3 (proof README) are unchanged, and both are still nits.

Housekeeping: when :3024 came up, a leftover headless session from an earlier run was syncing game 1552 (test_phone_calls) to it. That session is someone else's tab. It did not touch the m05 games.
