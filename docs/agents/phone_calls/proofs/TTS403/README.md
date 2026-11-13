# TTS 403 live proof (real browser client, keyless server, :3025)

Server from a detached worktree at main 857ce87a7 plus the e25d673bc cherry-pick. Games made with tools/playtest/new-game.rb (no --start-room). Client: tools/phone_calls/ps.js --tts-log, headless. Keyless: an uncached line is 503, cached 200; 403 is the refusal.

m10 briefing (picking 'The record says six'): game 1344 unfixed, game 1349 fixed. m08 closing debrief (globals set so it opens): game 1347 unfixed, 1348 fixed.

| Run | npc_id | status | line |
|---|---|---|---|
| m10 unfixed | quintero_post | 403 | For the record, I'd go in at noon tomorrow with twice the pe |
| m10 unfixed | quintero_post | 403 | Your clock, then. |
| m10 unfixed | kowalczyk_post | 403 | This one's mine. Never been through stores. |
| m10 fixed | quintero_post | 503 | For the record, I'd go in at noon tomorrow with twice the pe |
| m10 fixed | quintero_post | 503 | Your clock, then. |
| m10 fixed | kowalczyk_post | 503 | This one's mine. Never been through stores. |
| m08 unfixed | agent_0x99 | 403 | He said it to you? Afterwards, not during. I was taught that |
| m08 unfixed | agent_0x99 | 403 | Same classroom, 0x00. Don't ask me whose yet. |
| m08 fixed | agent_0x99 | 503 | He said it to you? Afterwards, not during. I was taught that |
| m08 fixed | agent_0x99 | 503 | Same classroom, 0x00. Don't ask me whose yet. |
