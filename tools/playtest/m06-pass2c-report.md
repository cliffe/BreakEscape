# m06 pass 2c confirmation run
Logs: tools/playtest/m06-pass2c-session-A.jsonl (game 1175), m06-pass2c-session-B.jsonl (game 1176). Verifiers: m06-pass2c-verify-A.txt, -B.txt. Screenshots: m06-pass2c-debrief-visible.png (not re-checked by eye), m06-pass2c-ko-debrief-visible.png.
Both games status=completed, mission_concluded_at set (A 23:13:43Z, B 23:18:33Z).
D1 PASS (A): first meeting showed exactly 3 openers; "efficient" then two asks: first refused, second "Fine. You'd find it on the file server in ten minutes anyway. Here." gave the list; obtain_access_tools ticked; bitcoin2025 opened the door (checklist + list read in A).
D2 PASS (A, B): debrief visible and played fully with missionEnd false; credits only after the last line. hear_debrief ticked, status completed.
D3 PASS (A): obtain_access_tools, find_transaction_records (count 1), discover_architects_fund (count 1, breach aim active) all completed, no revert.
D4 PASS (B): after wordlist and badge handed, both options gone in the same conversation (only "That's all for now").
D5 PASS (A): walked in and out of the office by pointer, reached safe, manifesto and Satoshi; no stall. Note moveToNear short-stops (62px at the safe) but interact's pointer approach reaches them.
D6 PASS (B): Elena KO last; relay said "And that was the last thing on the list. I'm bringing you in."; debrief opened on phone close, credits after.
Not earned: flags (session tokens). Game B passphrase, PIN 3110 typed from knowledge (earned in game A/earlier runs); game B skipped reading the checklist/export.
New defects: none. Observations: a pointer click near Satoshi after his decision reopens his aftermath hub (expected); "Elena hub" first meeting shows no "Back again".
