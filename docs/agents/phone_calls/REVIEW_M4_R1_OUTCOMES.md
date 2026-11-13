# Review M4 R1: outcomes

Fixer: Sonnet, 2026-11-12. Proofs in `proofs/M4_r1/` (keyless server on :3023, headless, stopped afterwards). Route: `tools/phone_calls/routes/m04_live.sh` (new `dial_late`, `dial_retire`, `dial_shutdown`, `vance_none`).

| Item | Outcome |
|---|---|
| m1 | Fixed. The ring mapping's condition is now `value === true && globalVars.esd_authorized !== true`. Live `dial_late` (game 2088: `server_room_reached`, `attack_mechanism_known`, `voltage_neutralised` set, dial read for real): `esd_authorized` true in the same tick, no ringer and no banner at +3 to +15 s, no decline or missed text. The hub still offers [About the dial reading.]. `dial_plain` (game 2092, dial read first): banner "Agent HaX / SAFETYNET secure line / Incoming call", answered, call runs. |
| m2 | Not touched (engine item, orchestrator). |
| n1 | Fixed in the route: `dial_choice` reads the hub's choices instead of the ink-local flag. `dial_retire` (game 2090): before the call the hub shows "1. About the dial reading."; after the call it is gone (`[]`). `dial_plain` and the earlier routes print it too. |
| n2 | Left (would re-key five clips). |
| n3 | Checked live, `vance_none` (game 2097, nothing set): Vance's contact is listed from the start (`agent_0x99`, `robert_vance_phone`). It comes from the phone's `npcIds`, as it did at base `39eedbb9a`; the "No answer" ring-out is the config's `unavailable: no_answer`. Left: a per-state "hidden" would also hide the button after his KO, where "No answer" is wanted. |
| n4 | Checked live, `dial_shutdown` (game 2095): after a decline and the shutdown, the header still reads "Call back" and it connects `on_anomaly_confirmed` ("You rang. Good. Straight to it."). Harmless but dated. The engine clears a callback only when it connects or a newer offer rings; there is no config way to retire it. Left, for the engine sweep (a `ring` option or a `clearCallbackOn` global would do it). |
| n5 | Left. |
| callLabel | m01's M8 fix is in (`"SAFETYNET secure line"`). m04's HaX ring now uses the same, so the banner shows the name once. Vance's contact label "Albion ops desk" repeated "ops desk" from his display name "Robert Vance (ops desk)"; now "Albion Energy". Neither is voiced. |

Validators: `validate_phone_calls.rb` clean; `validate_scenario.rb` shows the same three word-cap ERRORs as the review and no new warning; `tts_mission_lines_test.rb` 5 runs, 0 failures. Key diff against `keys_baseline/`: +70, -0, unchanged (no voiced line changed). Lab sheet unchanged: only a late dial read changes (no ring), and the sheet's order dials early.
