# M5 live proofs (m05_insider_trading, keyless :3024)

Route: `tools/phone_calls/routes/m05_live.sh <case>` (PC_PORT=3024). Preconditions are head-start
globals only; the rings, call button, hub choices, banner and endings are the real path. `/tts` returns
503 keyless — the request list (each `*_tts.jsonl`) is the evidence a line is voiced.

| Case | What it shows | Evidence |
|---|---|---|
| `recruiter_decline` | First call rings with the `TalentStack Executive Recruiting` callLabel banner; Decline leaves a "Missed call" row + "Call back" header button + her old text as a follow-up; Call back connects `first_call` with `call_is_callback`. | `recruiter_decline_*`; events `phone_call_declined:recruiter`, `phone_call_answered:recruiter callback as=0`; `/tts` recruiter 503 lines. |
| `recruiter_reload` | Reload mid-ring → "Missed call" + "Call back", `recruiter_texted=true`, and **no** follow-up text (the `!data.reload` guard on the missed mapping). | `recruiter_reload_after_reload.png`, rows=["Missed call"]. |
| `root_slow` | Root-flag `untilAnswered` ring: banner stays up past 40 s (no timeout); answer at 42 s plays the slow-answer opener "Finally. Sit down for this." then the body. | `root_slow_*`; `phone_call_answered:agent_0x99_handler as=42`; `/tts` HaX 503. |
| `root_row31` | The hub choice "[The Architect signed off…]" dials `topic_architect` (`#place_call`); the queued ring is dropped (queue=0, no second call event); the placed call plays the plain opening (`call_answer_seconds`=0). | `root_row31_*`; events show only the flag4 emit, no `phone_call_*`. |
| `root_reload` | Reload mid-ring on the non-forced HaX ring → "Missed call" + "Call back". | `root_reload_after_reload.png`, rows=["Missed call"]. |
| `bring_clear` | Bring-in hand-off, nothing optional open: hub "[I'm done here. Bring me in.]" dials `extract_call`; "[Bring me in.]" completes `call_in_after_sweep` (task=completed) **before** "[On my way.]"; "[On my way. #ending_check]" shows no overlay (nothing optional open), voices the last line "Thursday, nine o'clock. My office.", sets `mission_complete`, the person-chat debrief opens and the phone does not reopen (`phone-open=false`). | `bring_clear_*`; events `objective_task_completed:call_in_after_sweep` then `mission_complete` then `conversation_closed`. |
| `bring_end` | Same clean hand-off with all four flags and a fate set (m05 has no open optional at the bring-in, so the ending question never shows — the nothing-optional path is the real m05 state). | `bring_end_*`. |
| `bring_reload` | Reload mid outgoing bring-in call → no row (`rows=[]`, A6 R1), thread back on the home knot (`knot=start`, task locked, `mission_complete=false`); redial from the hub choice reconnects with the redial opener "QDC's people are nearly at the vault. Say when." | `bring_reload_*`. |
| `patricia` | Patricia callable: "Call" header button dials `phone_call`, connecting to "PATRICIA MORGAN: Morgan." | `patricia_*`; `/tts` patricia_phone 503. |

Audio: 118 newly-voiced m05 call lines need clips (21 agent_0x99_handler/Aoede, 49 patricia_phone/Kore,
48 recruiter/Gacrux). None generated. Key diff vs `keys_baseline/m05_insider_trading.txt`: +118 added, 0
removed, 0 cross-mission clashes (`scratchpad` m05_added_keys check).
