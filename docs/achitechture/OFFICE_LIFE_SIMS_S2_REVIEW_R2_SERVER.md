# SIMS-2 review R2: server, sync, cheat resistance, engine robustness

Slice SIMS-2 (OLMP E6: an arrival counts only where the NPC is) plus the owner-item offWhen
describe copy. Branch `build/ol-sims-2`, tip `ec3275b8d`. R1 fix commits reviewed: `1b0557fb8`
(arrival guard), `4fcda935b` (offWhen describe), `9a7363739` (M1 test), docs in `c5e2d3c19`,
`ec3275b8d`. Scope: no live server (static read + node tests). Only new or still-open issues are
findings.

## Verdict: 0 blockers, 0 major, 0 minor

The two R1 minors are fixed cleanly. The new `_farKey` / `returnFarReissued` / `keepFarFlag` state
cannot leak, grow or strand an NPC. The offWhen describe fix reads only client-side sprite data that
the room payload already carried; it crosses no new server->client boundary, syncs nothing, and no
deployed mission is affected. Affected node tests pass (3 files, 0 failed).

## R1 minors — both fixed

- **R1 minor 1 (queue `_farPhase` not reset per queue cell).** Fixed in `1b0557fb8`: the guard is now
  keyed by `phase + rounded dest cell` (`job._farKey = `${phase}:${x},${y}`, npc-needs.js:725-727),
  reset on a genuine queue-cell step (`job._farKey = null`, npc-needs.js:4548) and on a post-freeze
  re-issue (npc-needs.js:1404). A far arrival now fails a job only when the *same* phase+cell goes far
  twice. Distinct queue cells differ by far more than 1 px, so the rounding cannot collide two cells.
  Covered by the new queue two-cell and freeze-reset tests.
- **R1 minor 2 / server minor 2 (returning spin logs a line a tick).** Fixed in `1b0557fb8`: a far
  returning arrival logs `arrival_far` once, then `returnFarReissued` persists across `_watchReturn`
  re-issues via `keepFarFlag` (npc-needs.js:716, 3908), so an unreachable home spins quietly instead of
  logging each tick. Covered by the once-per-return test.

## New state cannot leak, grow or strand — confirmed

- **No leak.** `_farKey` (job), `returnFarReissued` (needs state), `keepFarFlag` (call option) are all
  in-browser needs bookkeeping. R1's "nothing new synced/persisted" holds: no `.rb` changed in the fix
  commits (`git diff --name-only 69aa3c8ae..ec3275b8d` is npc-needs.js, tests, docs, README, proof tool).
  None reaches player_state, a global, a server record or bootstrap.
- **No growth.** `_farKey` is a single string replaced in place, discarded with the job. `returnFarReissued`
  is a per-NPC boolean. Neither is a collection. The `arrival_far` lines go to the LOG_CAP ring buffer.
- **No strand / no silent return.** Every job-ending path (`_completeJob`, `_failJob`, `_abortJob`) calls
  `_goHome` without `keepFarFlag`, and `_goHome` resets `s.returnFarReissued = false` (npc-needs.js:3878),
  so each new return re-arms the one re-issue and the one log. A flag cannot carry a cleared state into a
  fresh return, and `_farKey` cannot carry across jobs (new job object each cycle). A far return logs at
  least once (`logFar()` precedes setting the flag, npc-needs.js:716), so a return never ends quietly with
  nothing logged. The permanent low-rate retry for a geometrically unreachable home is the plan's intended
  "returning never fails, `_watchReturn` covers the stall" (R1 minor 2, note only).
- **M1 guard is safe.** The new `phase !== 'goto_item' && 'goto_target' && 'queued'` early-return
  (npc-needs.js:691) drops an arrival only in phases that issue no needs walk expecting acceptance
  (`using`'s seating chair fetch via goToAndStay, no move id; `self`). No needs walk phase is excluded.
  Covered by the using-drop test.

## offWhen describe fix — no new client exposure, no synced/objective effect

- **Reads client data that was already present.** `4fcda935b` adds `if (sd.offWhen !== undefined)
  out.offWhen = sd.offWhen` in `createEngineWorld`'s describe (npc-needs.js:4780). `sd` is the loaded
  sprite's scenario data, already in the browser. The fix copies object->describe within the client; it
  does not pull anything new across the server->client boundary (no server code changed).
- **offWhen is not stripped by either server filter, and always reached the client.** The bootstrap filter
  strips whole room contents (game.rb:1759); objects load via GET /room. `filtered_room_data`
  (game.rb:2073) strips only `requires`, locked `contents`, author notes and network membership, never
  `offWhen`. Pre-format-8a the same condition shipped as `affordance.offWhen` (also unstripped). So the
  format-8a move changed only where the engine *read* it, not whether it reached the client. No regression
  in what crosses the wire.
- **No secret/story global named, no deployed mission affected.** Object-level `offWhen` appears only in
  `test_needs_sims` and `lab_physical_pentest` (not built), plus network/resource-level offWhen in
  `test_access_*` (server-side, network_access.rb). No `m0*`/`sis*` mission has an object-level `offWhen`
  (grep of scenarios/). The sims globals are `office_coffee_off`, `office_copier_off`,
  `kitchen_copier_off` — wall-socket gameplay toggles, not flag answers, targetFlags or capture secrets.
- **A switched-off source changes no synced state or objective.** `_isOff` only drops an object from the
  needs candidate set; the in-flight off path calls `_turnBack` / parks the need (npc-needs.js:3230-3235).
  No setGlobal, no objective tick, no server write — pure in-browser needs behaviour.

## Standing guidance (not a finding)

The room payload has always carried an object's `offWhen` condition string to the client, so a future
mission must not author an object-level `offWhen` that references a secret or story global (its name would
be client-visible as before). This is pre-existing authoring guidance, not a regression introduced by this
slice.

## Tests

`npc-needs.test.mjs`, `npc-needs-offwhen-adapter.test.mjs`, `npc-behavior-arrival.test.mjs` all pass
(3 files, 0 failed). The adapter test drives the real `createEngineWorld` describe and asserts object
`offWhen` is copied, so the fix is proven against the live adapter, not only the stub world.
