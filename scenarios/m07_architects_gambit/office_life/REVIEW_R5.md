# m07 office-life plan review, round 5 (delta)

B 0 / M 0 / m 2

Reviewer tier: delta review. Diff 9bdf2c70c to 1dca7f436, checked against round 4's findings. Both round 4 fixes verified. No new design decision.

| Id | Sev | Finding | Fix (applied) |
|---|---|---|---|
| m1 | m | Mid-use refill 83 to 97 is right (`npc-needs.js:1135` to `:1147`, `:3677` to `:3680`), but at decay 10 that is urgent after 5.3 to 6.7 min, not 5.2 to 6.6. Order still holds (gap at least 1.1 min). | Corrected in 2.4. |
| m2 | m | Pending-row dedupe is at `npc-manager.js:923`, not `:921`. | Corrected in 2.5. |

Verified: cooldown stamped when the delayed row fires (`npc-manager.js:1470` to `:1471`), checked at schedule and fire time (`:1260` to `:1285`); no double fire for one Adaeze use; Gwen's own `npc_use_started` fails the condition and stamps nothing; a set while Gwen walks or uses changes only her level, no second walk; seeds can be varied through `opts.seed` (`npc-needs.js:406`, `:410`) or `reset(seed)` (`:601` to `:602`); sections 2.4, 2.5, 7, 10.2 and 10.5 agree.
