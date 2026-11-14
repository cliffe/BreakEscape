# SIMS-2 R1b handover (owner item 6 offWhen + remaining live proofs)

Branch `build/ol-sims-2`. Worktree `.claude/worktrees/p-ol-sims2`, port 3094.
Scratch `officelife-sims/s2-fix-r1b/`.

## Done and committed
- **Owner item 6 (offWhen) fixed.** `public/break_escape/js/systems/npc-needs.js` `describe`
  (createEngineWorld, ~line 4780) now copies object-level `offWhen` onto the described object:
  `if (sd.offWhen !== undefined) out.offWhen = sd.offWhen;`. Cause: format hardening step 8a
  (commit `33b3ea3bc`) moved `affordance.offWhen` to object level and changed `_isOff` to read
  `o.offWhen`, but never updated `describe`, so `_isOff` was always false live. Format upgrade step 1
  guarantees object-level, so no `affordance.offWhen` path is left to read.
  - New real-adapter node test `test/js/npc-needs-offwhen-adapter.test.mjs` (createEngineWorld over a
    stub window; getObject/listObjects carry offWhen; `_isOff` flips with the global). Verified it
    FAILS without the fix, passes with it.
  - Commit `4fcda935b` (engine + offwhen-adapter test).
- **R1 Design M1 node test** added to `test/js/npc-needs.test.mjs` ("a far no-id arrival during
  `using` is dropped, not logged far, and issues no move") — covers review minor 3's gap for the
  non-own fetch branch. Verified it FAILS if the `_acceptArrival` phase gate is removed. Commit
  `b...` (see `git log`: "SIMS-2 R1 M1: node test...").

## Open / in progress (NOT done — forced handback before live proofs completed)
All browser live proofs are UNRUN (the keyless server and browsers were stopped mid-run). The
harnesses are written and games are created; just run them (server must be restarted first):

Restart server (worktree root):
`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle nohup bundle exec rails server -b 127.0.0.1 -p 3094 -P tmp/pids/server-3094.pid > tmp/keyless-3094.log 2>&1 &`

1. **offWhen live proof (Tom 20 trips, coffee off -> all kitchen, every `using` <=48 px).**
   Harness `s2-fix-r1b/tom20-kitchen.mjs` (copied from s2-fix-r1, OUT dir retargeted). Game **4290**
   (test_needs_sims). Run: `node s2-fix-r1b/tom20-kitchen.mjs 4290 3094`. Expect `switchOff.isOff:true`
   now (was false pre-fix), kitchen=20, office=0, over48=0. Takes ~15-25 min on the real clock; run
   ONE browser at a time (CPU contention slows the needs clock). Make a fresh game if 4290 is stale.
2. **Design M1 live proof (real chair fetch during `using`, no arrival_far, not cut short).**
   Harness `s2-fix-r1b/m1-fetch.mjs` (room fixed to `seat_office`; the old one used `office` -> never
   loaded, hence 4268's empty result). Game **4293** (test_seating, start seat_office). NB sam_pc is
   sam's OWN needsHome (own-post branch), so this proves the observable outcome; the non-own "no move
   issued" branch is covered deterministically by the new node test above. If a genuine non-own live
   fetch is wanted, test_access_work Ian/hot_desk needs 3 work failures first (expensive).
3. **offWhen cross-scenario check.** Generic probe `s2-fix-r1b/offwhen-probe.mjs <gid> <label>`:
   loads all rooms, reports per offWhen object {describeCarries, satisfies, isOffBefore,
   isOffWhenSet, affectsNeeds}. Games: social **4296**, networks **4297**, work **4298**.
   Static analysis already done (validator: all 4 load, 0 errors):
   - **Behaviour CHANGES (need-pick now excludes a switched-off source live):** test_needs_sims
     `office_coffee` (caffeine); test_access_social `f12_pc`,`l2_pc` (work); test_access_work
     `ian_pc` (work, the W6 "Ian parks at a dead PC" beat). These beats were silently dead live
     before the fix; now they fire as each README says. Confirm with the probe.
   - **No needs change:** test_access_networks `bench_pc` (affordance `{}` -> satisfies nothing;
     its off-state is for the access/device view, server-side). test_needs_sims copiers (producers,
     no need). lab_physical_pentest `lw_post_printer` offWhen is a RESOURCE (resources block), not a
     scene object -> describe never sees it -> my fix does not touch the lab.
4. **lab_physical_pentest three beats (arrival-guard regression).** Harness `s2-fix-r1b/lab-beats.mjs`.
   Game **4295** (lab, start open_plan). The three open-plan staff: hampshire (Chris, staff_pc,
   caffeine), pierce (Melanie, staff_pc_2), lord (Sofia, usb_target_pc). Forces caffeine x3 each,
   records coffee-trip target/dist and arrival_far/arrival_ignored. Observe office-life only; drive
   NO exploit path.
5. **Full `bin/test-js`** at the end — not yet run on the final tree.

## Docs still to update (after the live runs)
- README `scenarios/test_needs_sims/README.md`: the SIMS-2 proof rows (769-777, esp. the Tom-20
  off-switch row 774 which currently says "off-switch blocked"), engine finding 6 (mark FIXED with
  the describe one-liner and commit), and add a note about the other offWhen scenarios' behaviour
  change. RE-READ before editing.
- Build log `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md`: SIMS-2 section + the engine table
  (add the `describe` offWhen row). RE-READ before editing.

## Gotchas
- Server pidfile came back empty on this run; find the server by `ss -ltnp | grep :3094`.
- Kill ONLY your own browsers/server by exact PID (broad `kill $(pgrep -f chrome-headless-shell)` is
  denied by the classifier and risks other sessions). All my chromium shared one
  `--user-data-dir=/tmp/playwright_chromiumdev_profile-*`.
