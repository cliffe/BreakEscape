# Review R1 outcomes (chatter pool gate)

| Finding | Outcome |
|---|---|
| M1 | Fixed. `_sayMutter` condition restored to `!this._thoughtsOn()`. No other stray `, c => this._globalHolds(c)` in the diff (checked: all 9 were the intended call sites, now `this._holds`). Regression test: thoughts on and `chatter: false`, a mutter emits nothing; thoughts off emits one null event. The test fails if the branch is made unconditional. |
| m1 | Fixed. Skill line reworded (campaign missions stand silent; `{ "ops_watch_upset": false }` with the global declared `false`; other pools need their own gates). Worked example in NPC_NEEDS_SYSTEM.md 5.6a. |
| m2 | Fixed. V12 warns when a gate sits on `login_aloud`, `usb_refused`, `work_fail`, `work_fail_*`, `station_fail`, `social_blocked` or a `wk_*` start pool. `pool_has_line?` left unchanged (V12 is the single place that knows the gate; changing it would double-warn). Test added. |
| m3 | Fixed. Tests: mixed open/closed on one key; thoughts off with use timing equal to the ungated run; grumble fallback; mutter; phone pool; `_chatRadius`. |
| m4 | Fixed. V12 warns when a `{name: value}` gate value's JSON type differs from the declared global's. Test added. |
| n1 | Fixed. `this._holds` bound once in the constructor, used at all 9 sites. |
| n2 | Fixed by n1 (the shadowing arrow is gone). |
| n3 | Fixed in the doc (desk call draws its lines when it starts). |
| n4 | Fixed in the doc (gate flip restarts the bag). |
| n5 | Fixed as a doc comment on `_globalHolds` and a doc bullet; behaviour unchanged (no live impact). |
| n6 | Fixed. LIVE_PROOF.md points at `tools/playtest/chatter-pool-gate-proof.mjs`; schema `chatter` description lists `requireGlobal`. |
| n7 | Noted in the doc and the skill: a pool gate silences only its own pool. Declaring `ops_watch_upset` and gating m08's exchanges is m08 work, deferred to that branch. |

No gate logic changed (only the M1 restoration to main's behaviour and a bound closure), so no live proof was re-run.
