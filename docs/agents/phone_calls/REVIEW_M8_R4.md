# M8 review, round 4 (m01 first ring and bring-in, after ringWhile)

Reviewer: Opus 5.5, 2026-11-12. Light round. Code under test: committed `7fecbed08` (engine `464c42064` ringWhile, `d05dad42d` banner caption fallback). The tree had no uncommitted engine or m01 change, only regenerated dungeon graphs elsewhere. Inputs: `REVIEW_M8_R3.md`, log entries for the engine sweep review R1 fixer.

**Verdict: accept. 0 B, 0 M, 0 m, 2 n. Nothing is above a nit.** The engine changes since R3 leave m01 as it was.

## Live check (keyless :3023, headless, server stopped afterwards)

Proofs in `proofs/R4_m01_m03_m04/` (`m01_*.txt`, `tut_idle_*`, `ring_decline_*`). Routes: `proofs/PS_m01_m03/tut_idle.sh`, `tools/phone_calls/routes/m08_live.sh` (`ring_decline`, `bring_keep`, `bring_end`).

| Case | Game | Result |
|---|---|---|
| Tutorial accepted, left idle on step 1 | 2289 | Banner at 25.96 s after the office entry (6 s offer delay plus the 20 s hold), tutorial still on step 0. `#phone-ring-layer.under-tutorial`; banner at y 892–984, clear of the panel (y 0–384) and SKIP TUTORIAL (`tut_idle_banner_tut_idle.png`). Banner reads "Agent HaX / SAFETYNET secure line / Incoming call". The call opened on "You're in." and the tour text arrived once afterwards. |
| Declined, then called back | 2292 | Banner with the caption. Decline leaves one "Missed call" row, Call back in the header, and the tour text once. Call back opens on "You rang back. Good habit." and plays to "Good. Off you go." Rows: "Missed call", "Outgoing call, 0:11". Events: declined, answered, one `conversation_closed:agent_0x99`. |
| Bring-in, Keep going | 2295 | Hub choice dials; "It went through. Not on an open line. Come back to HQ." The overlay lists "Collect pieces of office intelligence". Keep going leaves the call open on "On my way." with `start_debrief_cutscene` false. End returns to the hub with the same choice. One `conversation_closed`. |
| Bring-in, End the mission now | 2298 | "Walk out the way you came in..." is requested, `start_debrief_cutscene` true, one `conversation_closed`, the person-chat debrief opens and the phone does not reopen. |

The ringWhile change does not touch m01: its first ring has no `ringWhile`, and it rings on every path.

## Lab sheet

`HacktivityLabSheets/_labs/safetynet/m01_first_contact.md:71` (one ring on entering the main office; Answer, or Decline then Call back), `:387`/`:396` (report Operation Shatter by message) and `:436` (bring-in call, On my way, the end-now/keep-going question) match what the player does.

## Findings

### n1. The idle-tutorial case still lives outside the route
Carried from R3 n1. `proofs/PS_m01_m03/tut_idle.sh` is the only script that leaves the tutorial alone. Fold it into `m08_live.sh` when the route next changes.

### n2. Proof file names clash with the m04 run
`m08_live.sh` and `m04_live.sh` both label their bring-in cases `bring_end`/`bring_keep`, and both runs used the same `OUT`. In `proofs/R4_m01_m03_m04/`, `bring_end_game_id.txt` and `bring_keep_game_id.txt` now hold the m04 ids, and `bring_*_tts.jsonl`/`bring_*_session.jsonl` hold both runs. The m01 ids above come from `m01_bring_end.txt` and `m01_bring_keep.txt`. Proof housekeeping only; give each mission its own `OUT` next time.
