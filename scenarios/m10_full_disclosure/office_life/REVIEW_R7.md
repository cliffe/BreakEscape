# m10 office life: plan review R7 (delta)

Delta review on the cheaper tier, read-only: the diff ca3351f71..66a1805db of PLAN.md and QUESTIONS.md against REVIEW_R6.md, plus a whole-plan consistency pass.

**Counts: 0 blockers, 1 major, 4 minors.** No finding needs a new design decision. All fixed in the same commit as this file.

| # | Sev | Finding | Evidence | Outcome |
|---|---|---|---|---|
| 1 | M | "Sofia speaks first in `ex_fp_radios`" read as if the engine picks the nearer speaker; it takes the first speaker from the knot, and unprefixed lines go to the owner, Darren. | `npc-needs-chatter.js:64-81`; `npc-needs.js:3005`, `:4464-4465` | Fixed: section 6 states how a line becomes Sofia's and that the knot opens with her line; L4 asserts `lines[0].speakerId`. |
| 2 | m | `ex_fp_door_open` has the same geometry and no Sofia-first rule. | PLAN 2.5 | Fixed: it also opens with a Sofia line; L4 asserts it. |
| 3 | m | Faint-edge citation off by about seven lines. | `npc-needs-chatter.js:240`, `:270-272` | Fixed. |
| 4 | m | "0.11 to 0.15 volume" had no derivation and sat beside "40%", which is the door factor. | `npc-needs-chatter.js:250`, `:312`; `room-hearing.js:7`, `:24-31` | Fixed: about 0.03 to 0.2 by distance, door factor 0.4, measured in slice 6. |
| 5 | m | "Blast door" and "east door" name one connection, shut until the breach. | `:1587`, `:1618-1620` | Fixed: 2.5 names both once and says the tunnel hears only in the door-open window. |

Checked sound: every R6 outcome applied; no stale 200 outside the Q5 fallback and Tiled coordinates; L3 and L4 match 2.3; the tether-branch claim and retry of an unheard exchange (`npc-needs.js:3067-3080`); `playerHears` false while a conversation is open; door factor 0.4, shut door 0; no em or en dashes, review mentions or model names in PLAN.md or QUESTIONS.md.

Unchecked: real positions of the pair and the blast-door stand cell; cross-room distance to the tunnel guard's post; whether the guard's beat falls inside the door-open window; real seconds per needs-minute; speaker order of the real knots (no dialogue sample yet).
