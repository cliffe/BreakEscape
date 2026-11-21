# m10 office life: plan review R6 (delta)

Reviewer tier: planning tier, read-only, after R5's majors and design decision. Scope: the diff cb9954611..ca3351f71 of PLAN.md and QUESTIONS.md against REVIEW_R5.md.

**Counts: 0 blockers, 1 major, 4 minors.** No finding needs a new design decision. All fixed in the same commit as this file.

| # | Sev | Finding | Evidence | Outcome |
|---|---|---|---|---|
| 1 | M | Section 3's `fp_kettle` row still said `overhearRadius: 200`; the build copies that row, so the R5 fix would be lost. | PLAN section 3 against 2.5 | Fixed: 320 (**estimate**) in section 3. |
| 2 | m | The blast-door order (split line opened by a try at the blast door, `:1620`) leaves the player about 304 to 334 px from the pair when the gate-scene brew starts; not covered or tested. | `:1620`, `:2240`; `npc-needs.js:4462-4466` | Fixed: Sofia speaks first in `ex_fp_radios`; the build measures the stand cell; a miss at the door is accepted; L4 plays all three orders. |
| 3 | m | On the branch where the opening conversation runs into the tether, the console use opens `split_line` soon after the brew, so `ex_fp_kettle_on` often misses. | `ink/m10_director_netherton.ink:291`, `:346`; `:1618`, `:1716`; `npc-needs.js:668`, `:3067-3080` | Accepted and stated in 2.3; L4 lists it as an expected miss. |
| 4 | m | At 320 the faint edge reaches 960 px, so the whole tunnel hears faint kettle talk through the open door. | `npc-needs-chatter.js:235-244`, `:263-266`, `:377`; `room-hearing.js:24-31` | Fixed: 2.5 states it; slice 6 or L4 listens during the tunnel guard's beat. |
| 5 | m | `playerHears` citation off by a few lines; Q5 said "two minutes" where the cooldown is in needs-minutes. | `npc-needs.js:5564-5582`, `:118` | Fixed. |

Checked sound: no clamp on `overhearRadius` (schema minimum 1 only, `scenario-schema.json:3980`; 360 used in m02, m03, m05); object radius wins over the pool's (`npc-needs.js:3017-3021`); line of sight open across the yard; console and terminal reach cells at 231 to 300 px; no mapping in m10 reads `npc_overheard` or `npc_chatted`; no person-chat opens from a mapping within 25 s of a close passing the Netherton condition; the coupling is one way and its 30 s cooldown cannot hold the kettle (`npc-manager.js:1279-1283`, `:1471`; `EXCHANGE_MAX_MS` cap); table-group overlap wording matches `core/rooms.js:775-822`, `:873`.

Unchecked: speaker order in the exchanges (no `DIALOGUE_SAMPLE.md` yet); the real blast-door stand cell and walk speed; whether `split_line` opens over an open VM window; whether the blast door stays open after the breach; real seconds per needs-minute.
