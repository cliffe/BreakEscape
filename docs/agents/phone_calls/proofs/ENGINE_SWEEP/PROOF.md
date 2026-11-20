# Engine sweep part 2 — live proofs

Keyless server on :3027 (separate pidfile tmp/pids/server3027.pid, the shared test/dummy pidfile was
held by another agent's :3028 server). Headless. Server stopped afterwards.

## Item 8 self-latch fix (commit 88862563c) — PROVEN

Both orchestrator-mandated cases pass on the real event path:

- **m05 Recruiter rings** (`item8_m05/`, game 2197, `m05_live.sh recruiter_decline`): on
  `conversation_closed:agent_0x99_handler` the Recruiter rings — banner
  "The Recruiter | TalentStack Executive Recruiting | Incoming call | Answer | Decline". Declined → one
  "Missed call" row + "Call back"; Call back connects ("You rang back. Manners, or curiosity?"). Before
  the fix she never rang and left no row.
- **m09 Nightshade still rings** (`item8_m09/`, game 2198, `m09_m1_live.sh readout_full`): after HaX's
  flag-1 read-out closes, Nightshade rings — "Agent 0x47 'Nightshade' | Incoming call | Answer | Decline",
  ringer `nightshade_phone:ringing`, `nightshade_rang=true`; answered, plays her lines; no second ring on
  the next room entry.

## Still owed (handover: HANDOVER_ENGINE_SWEEP2.md)
- Part A owed from part 1 (items 1, 2, 4) on test_phone_calls (guard_off) + m04/m09.
- Item 9 live on m01 (ring at ~20 s, nothing covered); item 10 live on m07 (closing line readable).
- lab_social_engineering sha256_noseed check (Dev ffe4c083…, Ruth 52c50b7a…).
