# CA engine review: E5 flip line by global, round 2 (delta)

Commits: `64fa593d7` (E5), fixes `c6b3db24c`. Round 1: `CA_ENGINE_REVIEW_E5_R1.md`.
Spec: `CA_PILOT_MECHANICS_PLAN.md` E5 (`:137-141`), ca12 strings (`:159-166`), Lorna/Delphine mappings (`:185-201`).
Reviewer: Opus 5.5, 2026-11-25. Code not edited.

**Totals: 0 B, 0 M, 3 m**

## Round-1 findings

| R1 | Status | Where |
|---|---|---|
| B1 missed call flips never read ByGlobal | Fixed | `flip-view.js:366-375`: the `missed \|\| landedNoTells` branch calls `globalEntry()`; a match replaces `flipMissed`/`flipLandedNoTells` with a `.aw-defender-line` paragraph and its optional `heading` replaces `flipMissedHeading`. No match: exactly the old code. Plan E5 `:140` and ca12 `:159`, `:166` updated to match (sixth entry on `ca12_world_done`). |
| M1 schema/validator | Deferred to a todo by decision; not re-raised. | |
| M2 tests bypass the runner | Fixed | `social-episode-runner.test.mjs:920-953` opens the runner with no `params.globals`, asserts `props.globals === window.gameState.globalVariables`, and renders call flips for `got_it` and `walked_away`. Mutation check: with `globals: this.globals` removed from `_renderFlip` (`episode-runner-minigame.js:848`), this test fails (53 pass, 1 fail). |
| m1 inherited keys | Fixed | `flip-view.js:110` `Object.hasOwn`; test `social-episode-views.test.mjs` "only own keys". |
| m2 stale doc comment | Fixed | `flip-view.js:95-102`, `:118-125` give the full precedence and the read-once note. |
| m3 truthy | Resolved by documenting it (code comment and plan E5 `:139`). |
| m4 parity comment | Fixed | `social-awareness-fragment-erb-parity.test.mjs:78-79`. |

Tests: `social-episode-views` 37/37, `social-episode-runner` 54/54, `social-awareness-fragment-erb-parity` 20/20.

## ca12 endings, traced

`_flipProps` (`episode-runner-minigame.js:811-813`) gives `call` for `got_it` (always non-null there: `flipCall` falls back to `{}` for the spec) and `missed: true` otherwise.

| Ending | Path | Globals set | First match (plan order) | Heading |
|---|---|---|---|---|
| `got_it`, hi-vis, walks in | call, `defenderLine` | `ca12_desk_pass`, `ca12_world_done` | 2 | `flipHeading` |
| `got_it`, no vest, turned back | call | `ca12_challenged`, `ca12_world_done` | 5 | `flipHeading` |
| `got_it`, hi-vis, stands still | call | `ca12_door_missed`, `ca12_world_done` | 3 | `flipHeading` |
| `walked_away`, follows Jun | missed | `ca12_tailgated`, `ca12_world_done` | 1 | entry 1's heading |
| `walked_away`, no vest, challenged | missed | `ca12_challenged`, `ca12_world_done` | 5 | `flipMissedHeading` ("The door stayed shut") |
| `reported` | missed | `ca12_guard_alerted`, `ca12_challenged`, `ca12_world_done` | 4 (before 5, as the plan intends) | entry 4's heading |
| `walked_away`, 75 s cap | missed | `ca12_runner_go`, `ca12_world_done` | 6 | `flipMissedHeading` |

The cap case works because `watchCall` writes the hold global through `writeGlobal` (synchronous on `window.gameState.globalVariables`) before `finish()` reopens the runner; the uncommitted E2 follow-up in this worktree (`episode-runner-minigame.js:1444-1454`, hold write then hand-back one tick later) keeps that order. A reload reads the server-restored map, where `ca12_world_done` is persisted.

Other shells: none carries `flipDefenderLineByGlobal` (grep of `scenarios/`), so `globalEntry()` returns null and the missed, landedNoTells (email-kind) and guess-missed views render exactly as before; the got_it/page/message paths only gained an extra null check in `defenderLine`. CSS: `.aw-defender-line` is already styled (`awareness-skin.css:153`).

## Minors

**m1. Entry 6 on `ca12_world_done` also catches a `got_it` run that ends on the cap, and its line is false there.**
Plan `:166`. `ca12_world_done` is true in every ending, including `got_it`. A `got_it` run in which none of `ca12_desk_pass`, `ca12_door_missed`, `ca12_challenged` gets set (Delphine's `npc_arrived` at the door never fires because her path is blocked, so `ca12_delphine_back` and the 14 s timer never start, and the 75 s cap ends the hold) reaches `defenderLine` on the call path, matches entry 6, and tells the learner "The desk and the door both held this time" after the desk said yes. It also makes the rewritten `flipDefenderLine` unreachable in ca12, which `:166` implies is still read on the call path.
*Fix (plan only):* point entry 6 at `ca12_runner_go` (Lorna mapping 2, `:188`, set only on `walked_away`) instead of `ca12_world_done`. The `walked_away` timeout still matches. A `got_it` residue then falls through to `flipDefenderLine`, so word that line to fit a yes from the desk with no entry ("The desk said yes, but you never went through the door."). `reported` always has `ca12_guard_alerted`, so it never needs the fallback. Update `:140` ("ca12: global `ca12_world_done`") to match.

**m2. ca12's current `flipMissed` becomes dead copy.**
`scenarios/ca12_visitor_tailgater/scenario.json.erb:634` ("Delphine stopped you and went to check, so the door stayed shut...") can no longer show: every missed ca12 flip (`walked_away`, `reported`) matches an entry. It also describes an ending that no longer exists. *Fix:* when the shell lands, rewrite it as a neutral fallback (or note in the plan's ca12 block that it is kept only as a fallback), so a later reader does not take it for a live ending.

**m3. A ByGlobal match on the landedNoTells path drops the `aw-landed-no-tells` class.**
`flip-view.js:371`. On a match the paragraph is `aw-defender-line` only, so a playtest that reads `.aw-landed-no-tells` (or `.aw-missed`) sees nothing; `getState().parts` still says `landedNoTells`. No shell is affected today (no email-kind shell carries the key). *Fix:* either add the old modifier classes to the replacement paragraph (`aw-defender-line aw-missed` / `aw-landed-no-tells`, the CSS order keeps the defender style) or say in the `globalEntry` doc comment that playtests read `.aw-defender-line` on every path.
