# A5 live proofs (outgoing calls and the post-call thread)

Server: keyless :3025, headless. Routes: `tools/phone_calls/routes/a5_live.sh <route>` (`PC_PORT=3025`). Logs are `<route>.log`, events `<route>_events.json`, shots `<route>_<name>.png`. `/tts` answers 503 on the keyless server; the request lists show which lines were asked for.

| Route | What it shows | Result |
|---|---|---|
| `desk` | thread with the header "Call" button; press it: "CALLING" screen, then connect after 2.5 s; End mid-choice; thread back on its hub (rows: "Outgoing call, 0:03"); close and reopen the thread: hub, no call choices; second call plays the "second time round" line (ink VAR carried over) | pass |
| `row31` | `ring_desk` rings inside the open thread; Call pressed instead of Answer: queue 1 while dialling, 0 at connect, no missed row, no `phone_call_*` event, no second ring afterwards | pass |
| `away` | `when` false: button shows, dial then rings on, "NO ANSWER", "No answer" row, phone back on the thread; `hidden_contact` has no button until `lever_back` (real lever) sets `away_back`; then Hidden gets a button and Away connects | pass |
| `placed_ringout` | hub choice "Place the call from here." (`#place_call:away_call`, `-> DONE`): nothing typed before dialling (2 lines before and after: the opening line and the choice bubble), rings out, thread back on its hub with its choices, same on reopen | pass |
| `debrief` | `caller_debrief` hub choice places the call; the call's choice sets `debrief_go`; hand-off lines asked of `/tts`; call closes, phone not reopened, person-chat debrief opens | pass |
| `ending_keep` | `#place_call` call whose choice carries `#ending_check`: overlay shows, "Keep going": call stays on its choices, `end_go` false; "Not yet" ends the call, phone back on the thread | pass |
| `ending_end` | same, "End the mission now" (game started with `ending_ok=true`): `end_go` true, call ends, ringer closed, phone not reopened, credits show (`ending_end_credits.png`) | pass |

Lab SE (`se_dev/`, `se_dev.sh`): `sha256_noseed` for `dev_service_desk` and `ruth_phone` identical after the call and after the reload to `proofs/A3/se_dev/`; `/tts` text list identical; `se_phone_contacts.png` and `se_dev_thread.png` pixel-identical to A0; `dm_list.png` (test_dm_social) pixel-identical to `proofs/A3/dm_list.png`.

Key identity: the extractor's keys (with chatter) for every scenario in `keys_baseline_a1/` match the keys at 56a9e74b2 (A4) byte for byte; the only file that moves is `test_phone_calls` (new contacts). Against the A1 baseline m09 and m10 differ, from the M3 mission commits (no scenario file changed in A5).

## Notes
- A call placed from a thread fires `conversation_closed:<npc>` twice when the call ends and the phone is not reopened (`debrief`, `ending_end`): once from the call's own phone-chat, once from `dropDisplaced`, which owes the thread's own close event (skipped at the dial). When the phone does reopen (`desk`) only the call's one fires, and the thread's follows at its real close.
- Not shown live: the terminal-look dial (no call screen: connects or gives up at once; unit-tested in `phone-outgoing-call.test.mjs`) and a callback (A6).
