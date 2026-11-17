# m07 office-life plan review, round 2

B 0 / M 3 / m 5

Reviewer tier: planning and review. Plan reviewed at commit f342c2e1b. All R1 fixes verified as landed (M3's ink shape completed by M2 below).

Verified answers: a one-need NPC pairs at a capacity-2 cooler (`_maybePair`, `npc-needs.js:4405` to `:4428`); an off cooler parks the need (`npc-needs.js:1749`); preset plus partial affordance override is shallow per field (`office-presets.js:66` to `:76`); ink VAR sync works (`npc-conversation-state.js:498` to `:513`); `seated: true` at position takes the nearest free chair (`seating.js:1974` to `:1986`), no chair declaration needed; `onceOnly` hide plus saved visibility covers reload (`npc-manager.js:254`, `:353` to `:355`, `:1517`); hands-down rows outside the loop collide with no once key (`npc-manager.js:1264`).

Outcomes are applied in the next PLAN.md rewrite (not yet done; see HANDOVER.md).

| Id | Sev | Finding | Fix to apply |
|---|---|---|---|
| M1 | M | Rates (initial 95/90, decay 2.5) give the first trip about 24 to 26 needs-minutes after load; jitter ranges overlap so the follower often goes alone; talking to Gwen sends her alone. | Ceiling 60 to 120 s for the first trip (e.g. Adaeze initial 45, decay 10, urgentAt 30); Gwen's initial far enough above that jitter cannot overlap (e.g. 60); add on Adaeze `conversation_closed:gwen_pritchard` (delayMs 4000, cooldown 150000, thirst 20); count it in section 7. |
| M2 | M | Talk ink has no hub; `#exit_conversation` resumes in the diverted knot, so a start-only upset check is skipped (`docs/agents/SAVED_KNOT_ANALYSIS.md:11` to `:12`). | m05 shape (`m05_npc_thandiwe_moyo.ink`): `start -> hub`, one player choice, goodbye `#exit_conversation` then `-> hub`; upset, repeat (local `VAR met`), opener at the top of `hub`; exchange knots end `-> DONE` and carry speaker prefixes; note visit counts reset on reload. |
| M3 | M | Only one cooler cell is authored; the second user takes `besideCell` E, W, S, N (`npc-needs.js:5663` to `:5674`) or fails `no_beside_cell`; chair (60, 258) sits north of the cooler, the supervisor's chair east. | Say so in section 3; pick `useFrom` so the intended second cell is free; fallback: move chair (60, 258) in a Tiled dressing tweak (and allow it in the positions diff) or capacity 1 with `queue.cells` (queue chats, `npc-needs.js:5055` to `:5080`); slice 3 logs `no_beside_cell` and records both cells and routes. |
| m1 | m | Restart keeps `ops_staff_upset` and the "STRUCK" credits line. | State it is deliberate (as m05). |
| m2 | m | Skeleton lacks `"currentKnot": "start"`. | Add. |
| m3 | m | `:2610` has no trailing comma. | Note the comma and that the block goes inside the `}` at `:2611`. |
| m4 | m | `capacity`, `chatter`, `queue: false` repeat the preset. | Keep only `useFrom`, `useSeconds`, `overhearRadius` (plus `queue` if the M3 fallback is taken). |
| m5 | m | PLAN people table "she walks home" ambiguous. | "the other operator walks home". |
