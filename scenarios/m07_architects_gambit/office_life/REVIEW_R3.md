# m07 office-life plan review, round 3

B 0 / M 3 / m 1

Reviewer tier: planning and review. Plan reviewed at commit c29f0a757. All round 2 minors landed; M1 and M2 of round 2 landed only in part (M1 and M3 below).

Reviewer's assumptions: chair-to-cooler walk about 4 s and Gwen's use ending about 6 s after Adaeze's, estimated from room size and the default 80 px/s; the needs clock runs at roughly real time at normal fps (`npc-needs.js:663` to `:674`).

| Id | Sev | Finding | Fix (applied) |
|---|---|---|---|
| M1 | M | Jitter applies to `initial` (`npc-needs.js:520`) and refills (`:3675`), never decay (`:1570`), so the "9 to 11 vs 7.2 to 8.8" claim had no basis. After a natural trip Adaeze is urgent again in 6.25 to 7.0 min, Gwen (set to 20 by the coupled row) in 6.6 to 8.4: overlap, Gwen first in about 11% of cycles, alone. A mid-use set (`:1134` to `:1150`) makes it worse. | Coupled row sets thirst 30; section 2.4 rewritten with the real mechanism and ranges (Gwen 7.8 to 8.75); slice 3 adds a 50-cycle manual-clock order check. |
| M2 | M | Coupled row cooldown 120000 is wall-clock from firing (`npc-manager.js:1265`, `:1281` to `:1282`); a talk break soon after a natural trip sends Adaeze alone. | Cooldown 30000; L2 adds talk-within-60 s and back-to-back talk checks. |
| M3 | M | The ink shape left out m05's `hub_quiet` skip-once guard (`m05_npc_thandiwe_moyo.ink:12` to `:13`, `:19` to `:23`, `:32`): after exit, `-> hub` prints the repeat or upset line again with the exit tag (`person-chat-minigame.js:1297` to `:1310`). | `VAR hub_quiet`, guard at the hub top, set before each exit, choice inside `hub`; L4 checks the chat closes on the goodbye or upset line and the upset line plays once. |
| m1 | m | NPC ink-local variables are saved and restored (`npc-conversation-state.js:248` to `:265`), so `met` survives a reload; the sync budget omitted them. | Sentence corrected; section 7 row "NPC ink-local keys, 4". |

Verified: `besideCell` order and `no_beside_cell` path (`npc-needs.js:3413` to `:3426`, `:5663` to `:5674`, `:3863` to `:3869`); `useFrom` in tiles from centre (`:5454` to `:5460`); pairing needs capacity 2 and a chatter pool (`:4411` to `:4414`); queue fallback chats with the queue front (`:5047` to `:5076`); `npc_use_started` carries `npcId` (`:3574`); `delayMs` re-checks its condition and waits for an open minigame (`npc-manager.js:905` to `:937`); mapping `needs` applies to the owning NPC (`:1648` to `:1649`); credits `||` conditions evaluate (`music/scenario-music-events.js:38` to `:57`); `server_hall_reached` set at SCN `:1131`; only m07 uses `room_pnw_ops`.
