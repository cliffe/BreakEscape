# SIMS-2 review R1: server, sync, cheat resistance, engine robustness

Slice SIMS-2 (OLMP E6: an arrival counts only where the NPC is). Branch `build/ol-sims-2`, tip
`69aa3c8ae`. Diff reviewed: `11b563d51^..e54332514`. Scope: no live server (static + node tests).
Reviewer focus: what is synced/persisted, cheat-resistance surface, and whether the arrival guard
can strand a needs NPC. Not in scope: room dressing, art, the live-proof gap in the README.

## Verdict: 0 blockers, 0 major, 2 minor

The slice is browser-only and does what the plan (5.2, 6.2, 6.5) promises. No Ruby/server file is
touched (`git diff --name-only` over the range is npc-behavior.js, npc-needs.js, docs, tests and the
proof tool — no `.rb`). Nothing new is synced or persisted. The failure branches are well tested.

## Sync / persistence (plan 6.5 "move ids live only in the browser") — confirmed

- **Nothing new synced.** The move-id counter (`_moveSeq`), `job.moveId`, `s.returnMoveId`,
  `job._farPhase`, `s.returnFarReissued` and the `_arrivals` Map all live on the in-browser needs
  system. None reaches `player_state`, a global, a server record or `filtered_*` bootstrap. No
  server code in the diff.
- **No growth with play time.** `_arrivals` is a `Map` keyed by npcId (bounded by cast size) and
  `delete`d each tick it is consumed (npc-needs.js:1398). `_moveSeq` is a single monotonic integer,
  not a collection. The decision log is a ring buffer capped at `LOG_CAP` with `shift()` on overflow
  (npc-needs.js:4593), so the new `arrival` / `arrival_far` / `arrival_ignored` lines cannot grow it.
- **No payload leak into persisted state.** `npc_arrived:<id>` now carries two extra fields
  (`moveId`, `pathLeft`) on top of the pre-existing `x,y,owner,npcId`. Scenario `eventMappings`
  read the payload only through `safeEvaluateCondition` (`data.<prop>`) for *conditions*;
  `setGlobal`/`unlockDoor`/`triggeredEvents` persist a mapping-named key, never the payload object
  (npc-manager.js:1340+). So `triggeredEvents` keys and saved globals are unaffected.
- **Corpus grep.** No *built* scenario (`scenarios/**/*.json`, `*.erb`) has an `npc_arrived:<id>`
  mapping; the only hits are prose in `test_needs_sims/README.md` and the `lab_physical_pentest`
  PLAN/HANDOVER (not built). So "mappings across the corpus still behave the same with the extra
  fields" holds vacuously for data, and by construction for the general handler. Scripted
  (`owner !== 'needs'`) arrivals get the two extra fields and ignore them; `onArrived` early-returns
  on a non-needs owner (npc-needs.js:641).

## Cheat resistance (plan 6.2) — unchanged by this slice

- Nothing here guards a secret, key, password or forged item. Move ids are client-only movement
  bookkeeping; forging one from the console at most mis-sequences one NPC's own walk, which is
  best-effort client behaviour the policy allows. No new global, object or droppable is introduced.

## Robustness: can a mapping/ink-driven move now strand a needs NPC? — bounded, with caveats

The arrival guard is bounded and cannot wedge a *job* permanently:
- A far **job** arrival re-issues `_moveForPhase` once (`job._farPhase = phase`); a second far
  arrival in the same phase calls `_failJob('arrival_far')`, which walks the NPC home
  (npc-needs.js:707-712). Re-issue refreshes `job.deadline` (npc-needs.js:3191), so no stale
  timeout timer is left running. Verified by the two-far-arrivals test.
- A far **returning** arrival re-issues `_goHome` once (`returnFarReissued`), then is left to
  `_watchReturn`; a returning NPC never fails (npc-needs.js:703-706). Verified by the returning
  test (atPost stays false, one re-issue, second left to `_watchReturn`).
- The move-id check drops a superseded move's arrival (`arrival_ignored`) without re-issuing, so an
  in-flight stale arrival cannot advance the wrong phase. Verified.

## Findings

### Minor 1 — queue `_farPhase` is not reset across queue-cell steps (npc-needs.js:709-711)

`_acceptArrival` fails a job when `s.job._farPhase === s.job.phase`. In the `queued` phase an NPC
steps through several cells, all with `phase === 'queued'`, each re-issued via `_moveForPhase`
(npc-needs.js:4521, 4528) but without clearing `_farPhase`. So a far arrival at queue-cell A
(re-issue, `_farPhase = 'queued'`) followed by a genuine step-up to cell B whose arrival is also far
would hit `_farPhase === 'queued'` and call `_failJob('arrival_far')` on what are two *different*
cells, not one stuck cell. Likelihood is low (authored queue cells are reachable and arrive near),
and failure is graceful (walks home), so this is minor. Suggested fix: key the far-arrival guard by
cell as well as phase, e.g. `job._farKey = \`${phase}:${job.qCell ?? ''}\`` and compare that, so a
far arrival only fails when it repeats on the *same* target cell. The besideCell test already proves
the same-cell fail path, so this change would not weaken it.

### Minor 2 — a returning NPC with an unreachable home retries forever (by design; note only)

If a home cell is permanently >48 px from where the path can end, the returning branch re-issues
once (`returnFarReissued`), then `_watchReturn` re-plans the walk every `RETURN_YIELD_MS` (3 s) and
`_goHome` clears `returnFarReissued` each time (npc-needs.js:3860, 3888), so the pair loops
indefinitely: far arrival -> re-issue -> far arrival -> `_watchReturn` -> re-issue... This is the
plan's intended "returning never fails, `_watchReturn` covers the stall", and it does not grow any
persisted or synced state (the log is ring-capped). It is a permanent low-frequency retry spin for a
genuinely stranded returner, which only arises from broken authored geometry (no reachable cell
within 48 px of home). No code change required for this slice; flagged so a future home-resolution
fault (cf. engine finding #1, start-room fallback homes) is not mistaken for a silent hang — such an
NPC will emit a steady trickle of `arrival_far {phase:'returning'}` / `return_resumed` log lines.

## Tests — failure branches well covered

`npc-needs.test.mjs` adds: far-then-near re-issue; two-far fail with `npc_job_failed:...arrival_far`;
stale-id `arrival_ignored` with no re-issue; no-id near counts + no-id far re-issues (transitional
rule); returning early-arrival does not set `atPost`, one re-issue, second left to `_watchReturn`,
never fails; own-desk shortcut still reaches `using` with zero moves and no far arrival; besideCell
unreachable cell fails with `arrival_far`. `npc-behavior-arrival.test.mjs` (new) proves the behaviour
layer stamps/echoes `moveId`+`pathLeft` once, `pathLeft 0` at a full path end, `cancelMove` clears
the id and emits nothing, and a no-id move echoes null. All 7 affected node files pass
(`npc-needs, npc-behavior-arrival, npc-magnet, npc-coffee-off, npc-avoidance, npc-desk-phone,
workstation-state`), confirming the transitional no-id rule keeps the existing `onArrived(` callers
and the golden sims-day digest byte-identical. No new static engine import, so no test-harness copy
list change is needed.

Gap worth noting (not a finding against this slice): the live proof could not capture Grace's
*natural* cross-room sofa run reaching `using` within the harness step budget and leans on the
stubbed-short-path reproduction (which the plan allows) plus a 33-entry natural within-48px sweep.
Same cross-room-navigation class as SIMS-1's E-carry; left for its own slice.
