# m08 pass 2c confirmation run (game 1184)
Question: plumbing/unexpected behaviour confirmation of D1-D5. Flags session-supplied (not earned; no VM). Netherton KO'd (debugKO, PASS assisted), so the keycard row does not apply; other secrets: printer PIN 0311 from break-room post-it (earned), interrogation door by start-inventory lockpick (PASS assisted), safe PIN not used.
Session log: tools/playtest/m08-pass2c-session.jsonl. Verifier: tools/playtest/m08-pass2c-verify-run.txt (progress recorded; 6 rooms beyond the first, 4 flags). Server: status=completed, mission_concluded_at 2026-10-01 02:32:24.

| Check | Result | Evidence |
|---|---|---|
| D1 End Conversation on opening line | PASS | click at log seq 190; HaX message "You walked out on him before it was ente..." was in the phone by the first poll (<= ~1-4 s; I did not timestamp the exact arrival); step out and in reopened the scene; played to the fate choice |
| D1b End Conversation right after the fate choice | PASS | globals: fate_decided, nightshade_triple_agent, tomb_gamma_location_known true; start_debrief_cutscene and debrief_played set; debrief opened over the closed scene; credits followed the debrief |
| D2 Cipher after apology | PASS | sign-off "Go and finish it. And thank you. I mean that." (accused-only sign-off before flag 4 still "Check the logs", as intended) |
| D3 last-line presses | NOT REPRODUCED | 2 presses, 1.6 s to the credits (same conditions as run 2: KO'd Netherton, triple agent). Page hook recorded every fetch: /tts returned 500 (and some 403) on every dialogue line (about 36 failures), one 422 on update_room; no request over 1.5 s. After the last line: tts, objectives/tasks/take_the_debrief (117 ms), music, /conclude. Suspect TTS errors as the earlier stall; unconfirmed |
| D4 HaX server-room answer, Netherton KO'd | PASS | "The Director's in no state to hand you his keycard now, so it's the visitor badge printer..." |
| D5 countersign / Okafor gate | PASS | confrontation: "the Director will countersign it when he is back on his feet"; stance option "You had a warning and you sealed it" for a player who never read the eval |
| Completion | PASS | status=completed |

New observations: the confrontation line "you owe him the answer to his face" remains while Netherton is KO'd (minor). /tts returns 500/403 in standalone for every line (environment, likely no TTS key). The 422 from update_room is unexplained (once).
