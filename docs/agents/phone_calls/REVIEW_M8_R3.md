# M8 review, round 3 (m01 first ring and bring-in, after the engine sweep)

Reviewer: Opus 5.5, 2026-11-12. Light post-sweep round. Code under test: `ff4f929ee` (branch `build/phone-calls`, engine sweep `752d9d612`, `88862563c`, `40a15667c` committed; no uncommitted engine edits in the tree). Inputs: `REVIEW_M8_R2.md`, `REVIEW_M8_R2_OUTCOMES.md`, `ENGINE_SWEEP.md`.

**Verdict: accept. 0 B, 0 M, 0 m, 1 n. Nothing is above a nit.** R2's M1 (a tutorial left open held every ring) is fixed on the real path.

## Live check (keyless :3023, headless, server stopped afterwards)

Logs, TTS logs, game ids and a few screenshots are in `proofs/PS_m01_m03/` (`m01_*.txt`). Routes: `tools/phone_calls/routes/m08_live.sh` (`ring_now`, `ring_decline`, `bring_keep`, `bring_end`) plus a new `proofs/PS_m01_m03/tut_idle.sh` for the idle-tutorial case. The existing `m08r1_live.sh tut_accept` route calls `complete()`, so it does not cover a tutorial left alone.

| Case | Game | Result |
|---|---|---|
| Tutorial accepted, then left idle on step 1 | 2201 | The banner came up 26.3 s after the office entry: the 6 s offer delay plus the 20 s hold. The tutorial was still active on step 0. `#phone-ring-layer` had `under-tutorial`, and the banner sat at the bottom (y 892–984), clear of both the panel (y 0–384) and SKIP TUTORIAL (`tut_idle_banner_tut_idle.png`). The call opened "You're in." and the tour arrived once after the call. |
| Answered at once | 2208 | Ringing about 6 s after the entry, with "SAFETYNET secure line" on the banner. The call played to "Good. Off you go." One row, "Incoming call, 0:12". One `conversation_closed:agent_0x99`. |
| Declined, then called back | 2211 | One Missed call row. The 1.5 s follow-up carries the tour ("Texting from here, then. Now get a feel for the place..."), and it appears once in the thread. Call back opened on "You rang back. Good habit." and played to the end. Rows: "Missed call", "Outgoing call, 0:11". Events: declined, answered, then one `conversation_closed`. |
| Bring-in, Keep going | 2217 | The hub choice dials. The ending-check overlay lists the open optional objective. Keep going leaves the call open on "1. On my way." with `start_debrief_cutscene` false. End from the call returns to the hub, with no debrief. |
| Bring-in, End the mission now | 2223 | Plays "Walk out the way you came in...". `start_debrief_cutscene` is true, one `conversation_closed`, the person-chat debrief opens, and the phone does not reopen. |

## Sweep items as they touch m01

- **Item 9 (tutorial hold limit, from R2 M1):** fixed live, as above. R2 n2 ("You're in." after a long hold) is now bounded to a 20 s hold, so the line reads naturally.
- **Item 1 (`conversation_closed` once):** one emit per call on every path above. m01's `m01_tour_sent` mapping is latched anyway.
- **Item 8/8b (ring re-check, self-latch):** the first ring still rings on every path, so the re-check does not drop it.
- R2 m1 (a reload mid-tutorial turns a held ring into a Missed call) is still engine row 27. I did not re-test it this round, and the shorter hold makes it much less likely.

## Findings

### n1. The route has no idle-tutorial case
`m08r1_live.sh tut_accept` ends the tutorial with `complete()` after 14 s, so it can't show the 20 s hold. `proofs/PS_m01_m03/tut_idle.sh` covers it. Fold that into the route the next time the route changes. No action needed.
