# M1 R1 proofs (m09 Nightshade order, Torres one ring, regression)

Server :3025, keyless (every /tts returns 503; the request list in `*_tts.jsonl` is the evidence).
Route: `tools/phone_calls/routes/m09_m1_live.sh` (new subcommands `nightshade_order`, `torres_once`).
Branches from `imports.json` (m02_gary_protected, m05_torres_turned, m08_nightshade_triple_agent).

| Route | Result |
|---|---|
| `nightshade_order` (M1) | After flag 1 at the drop terminal, HaX's read-out text is present ("First box is in. It came with a list.") while Nightshade is **not** ringing and `flag1_read_heard` is false. Opening HaX's thread plays the read-out (sets `flag1_read_heard`); Nightshade still not ringing. Closing HaX's thread rings Nightshade (`nightshade_ring_after_readout.png`). Answer plays the call: greeting, then the **else** branch ("Sorensen's card is on custom keys…", "That plan cabinet isn't on her schedule…") because the cage is not open. 5 `nightshade_phone` /tts requests. Order correct: read-out first, then the ring. |
| `torres_once` (m1) | Torres rings once at the shut lid (over the password field). Decline → ringer null, `torres_rang` latched true, callback left (`{knot:"call"}`). Opening the lid (ContainerMinigame) rings **no** second time within 8 s. One missed row. Call back connects and plays the `hl_box_opened` branch ("The old placements are filed under the firm that placed them. Read the placing sheet in the firm's box."). 5 `torres_phone` /tts requests. |
| `rec_hit` (regression) | Recruiter forced call opens, Cody's person-chat, a real guard attack takes HP to 96, re-ring on `room_exited` — identical to the A2c/review timeline. |
| `hand_flag1` / `hand_ledger` (M3 regression) | HaX's flag-1 and ledger read-out texts: toast with the phone closed, thread plays on open, reopen doesn't replay, salvage note given. Matches the M1 README record. |

No second ring, no stale advice: the m1/M1 faults in `REVIEW_M1_R1.md` are fixed on the real path.
