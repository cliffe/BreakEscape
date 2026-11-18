# m07 office-life plan review, round 4 (delta)

B 0 / M 0 / m 2

Reviewer tier: delta review. Diff c29f0a757 to 9bdf2c70c, checked against round 3's findings. All round 3 fixes verified. No new design decision.

| Id | Sev | Finding | Fix (applied) |
|---|---|---|---|
| m1 | m | The 30 s coupled cooldown is stamped 2 s after `npc_use_started` (`npc-manager.js:1449`, `:1471`, checked at `:1282`); a talk break landing as Adaeze finishes or walks home can start her second use 22 to 26 s after the first, so the row misses and she goes alone. No double fire within a trip (`npc-needs.js:3574`, `npc-manager.js:921`). | Cooldown 10000, below the 22 s use; section 2.5 text rewritten. |
| m2 | m | Jitter is seeded per NPC (`npc-needs.js:483` to `:485`, `:515`), so 50 cycles on one seed prove little; the check covered only the natural trip, not a talk-break set mid-use (refill 83 to 97, still safe). | Check runs 50 seeds and three paths (natural, talk break from seated, talk-break set mid-use). |

Verified: 2.4 arithmetic holds (gap at least 0.8 min); jitter on initial (`npc-needs.js:520`) and refill (`:3675`), fixed decay (`:1570`); cooler restores 70 (`office-presets.json:7`); talk rows have independent cooldown keys (`npc-manager.js:1263`); hub shape matches m05; exit tag closes after the text (`person-chat-minigame.js:1297` to `:1315`); needs are not saved across reload (only frustration, `game.js:2101`); ink-local `met` and `hub_quiet` restored (`npc-conversation-state.js:248` to `:265`).
