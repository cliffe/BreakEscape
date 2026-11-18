# Review R2 outcomes: chatter pool `requireGlobal` gate

| Finding | Outcome | Reason |
|---|---|---|
| m1 | Fixed | Four new tests in `test/js/npc-chatter-pool-gate.test.mjs`: mutter with the speech lock held (closed pool: no wait entry; open: one entry), `_unheard` radius, faint-grumble `faintVolume` radius, announce `playerHears` radius. No helper was added; each site is tested directly. |
| n1 | Fixed | The thoughts-off test now samples mode and job phase for each NPC every 500 ms over 30 s and compares the whole timeline with the ungated run, so use starts and ends both match. It also asserts each NPC finishes a use inside the window. |
| n2 | Fixed | Both-closed case now asserts `grumble_off` (has a picture entry) and `grumble` for `blocked` (has none). |
| n3 | Fixed | `station_fail` and `social_blocked` added to the security-pool lists in `docs/achitechture/NPC_NEEDS_SYSTEM.md` and `.claude/skills/mission-office-life/SKILL.md`. |
| n4 | Fixed (documented) | A doc bullet in 5.6a says a mutter queued while open keeps waiting for the lock after the gate closes, then shows its picture. Engine unchanged. |

## Mutation results (remove `, this._holds` at one site, run the gate test file)

| Site | Test failed | Restored |
|---|---|---|
| npc-needs.js:1019 (announce radius) | announce radius test | passes |
| npc-needs.js:2161 (faint radius) | faint grumble radius test | passes |
| npc-needs.js:2173 (`_unheard` radius) | `_unheard` radius test | passes |
| npc-needs.js:2221 (mutter has-lines) | mutter lock-busy test | passes |

The engine file is byte-identical to the committed one after the runs.
