# m04 office-life plan review, round 5

Reviewer tier: planning tier, read-only delta review of `git diff 05f2ba341` on the office_life folder plus the round 4 outcomes, at commit 3b8024832.

Counts: B 0 / M 0 / m 5

All round 4 fixes hold against the engine (anchor `npc-behavior.js:494`, `:3448`, `:1113` to `:1117`; room gate `npc-chase-leash.js:27` to `:29`; attacks only in chase `:1168` to `:1171`). Section 1, the section 2 table, 2.12, 10.4 and Q7 agree.

## Findings and outcomes

| # | Sev | Finding | Outcome |
|---|---|---|---|
| m1 | minor | Q7 and 2.12 gave no field path, and `aggroDistance` is not the only lever. The field is `behavior.hostile.aggroDistance` (`npc-behavior.js:657`, `|| 160`, so 0 falls back to 160); m04's operative uses 96 (`scenario.json.erb:2382`); m08 uses 1. `behavior.hostile.chaseRange` (`:667`, default 400) is a second lever, measured from the anchor with `leash: true` (`npc-chase-leash.js:30` to `:33`). Lowering aggro affects reception too (`npc-behavior.js:1054`). | Fixed: 2.12 names both levers with paths; Q7 (b) rewritten, (c) added. Field list change only if (b) or (c) is picked. |
| m2 | minor | "No snap back to the sofa" is false across a reload: hostility is saved, position only for a KO (`npc-hostile.js:9` to `:37`, `:352` to `:365`), so a struck newcomer respawns at the sofa place, unseated at once (`seating.js:1991`), hostile. | Fixed: 2.12 and Q7 say so; 10.3 adds two reload cases. |
| m3 | minor | Section 1 and the table said a struck newcomer "stands" hostile; in reception they chase and hit (`npc-behavior.js:1054` to `:1066`). | Fixed: both say they chase and hit only while the player is in reception. |
| m4 | minor | 2.12 gave the default chase as 120 to 400 px; the speed is 145 px/s (`npc-behavior.js:655`), range 400 (`combat-config.js:74`). | Fixed. |
| m5 | minor | HANDOVER.md still listed the leash anchors as unchecked. | Fixed: handover updated. |

## Checked and clean

Cross-room follow can path: chase uses `findWorldPath` on the world grid (`npc-behavior.js:2875` to `:2915`) and an opened door is carved into it (`npc-pathfinding.js:278` to `:310`). On estimated cells the kettle is about 180 to 200 px from the doorway, so the default 160 px follow may only fire at the door; 10.4 records the result. After a follow ends, the home push returns them to the kettle cell, matching 2.12. Line citations re-checked. The guard's hostile block at 748 matches. No stale leash wording.

## Not checked

How game.js places a restored KO sprite (relied on `npc-hostile.js` comments); whether `currentPlayerRoom` switches at the doorway or after the room transition; exact door position and cell distances (estimates until the build); the person-chat background with the NPC at the kettle.
