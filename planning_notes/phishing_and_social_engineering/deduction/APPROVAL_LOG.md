# Deduction board: approval log

Items that need the user's approval before anyone builds them: server, Hacktivity or shared-engine
changes beyond Phase 10's scope, and anything that costs money. The orchestrator owns this file.
Each entry: id, date, what, why, evidence, recommendation, status.

| Id | Date | What | Why | Evidence | Recommendation | Status |
|---|---|---|---|---|---|---|
| AP-1 | 2026-10-22 | Strip `social.deduction.solution` from the scenario the server sends to the client | The answer key reaches the browser; it can already be worked out from the clue data, so nothing new leaks | Plan §5.5, §13.3, §14 (R2E-13) | Defer: low value while every clue's truth is client-side anyway | Pending |
| AP-2 | 2026-10-22 | Replay a lost case's credits (the music entry conditioned on `mission_failed`, with its header and lines) when a concluded game is reloaded | On reload `main.js:157-166` replays only `handleMissionConcluded`, so a lost strict case reopens the visualiser under the conclusion screen's neutral header with no credits list; the matching music entry is not fired again. Needs a change to `systems/objectives-manager.js` or the music code, outside Phase 10's owners | Plan §5.4 "The conclusion screen on a loss", §7.10, fixture D's fail bridge (§9.4); REVIEW_R3_ENGINE.md R3E-2 | Defer: DL9(h) already keeps a lost run from ever showing "MISSION COMPLETE"; build only if playtests show the bare reload screen confuses players | Pending |
