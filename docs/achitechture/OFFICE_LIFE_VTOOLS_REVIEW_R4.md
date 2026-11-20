# Office-life validator tools V1 to V9: code review round 4 (delta)

Branch `build/ol-vtools` at 941ca0795. Delta reviewed: `git diff 379e64264 941ca0795` (fixes in 8afefc5c6, a one-line README update in 941ca0795), read against `OFFICE_LIFE_VTOOLS_REVIEW_R3.md` (findings and Outcomes).

**Verdict: ACCEPT, with three minors to fix when convenient.** 0 blockers, 0 majors, 3 minors.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 3 |

All R3 findings are closed. No false exit 2 and no false warning on the committed corpus. The three minors are edge cases an author is unlikely to hit.

## What was run

- Node tests: `lock-key-diff` 24/24, `validator-office-life` 32/32, `validator-office-life-events`, `validator-references` and `validator-exit-code` all pass (0 failures).
- `validate_scenario.rb --no-graph --skip-ink --no-lint` over all 180 scenario folders: no office-life line on m01 to m10, and the exit code and result line of every scenario are identical to the fixer's corpus run (`test_author_notes` exits 1 with 2 errors in both, so that is not from this delta).
- V9 self-diff on copies of all ten missions m01 to m10: empty, exit 0 each.
- V9 mutations on scratch copies under the session scratchpad `vtools-r4/` (real scenario files untouched). The R3 mutations were rerun:

| Mission | Mutation | Exit | Right? |
|---|---|---|---|
| m01 | lock `hallway_east` | 2, names `derek_office`, `storage_closet` | yes (R3 M1 closed) |
| m01 | lock `hallway_west` | 2, names `manager_office` | yes |
| m01 | lock `conference_room`, `maya_office` | 1 | yes (dead ends) |
| m01 | lock `kevin_office` | 2 | yes |
| m01 | unlocked id-less plant inserted first | 0 | yes (R3 minor 2 closed) |
| m05 | new locked `ol_annex` between start room and the rest | 2, eight rooms named | yes |
| m05 | same room unlocked | 1 | yes |
| m05 | locked dead end `ol_annex` off the lobby, original route kept | 1 | yes |
| m05 | lock `upload_schedule` (task target) / `data_package_manifest` (not required) | 2 / 1 | yes |
| m09 | lock `drop_terminal`, `plan_cabinet` switched to `locked: false` | 2, 2 (`RULE 2: critical-path lock ... removed or switched off`) | yes (R3 minor 3 as redefined) |
| m09 | new printer with an `access` list | 1 | yes |

## R3 findings

| R3 | Verdict |
|---|---|
| M1 reachability | Closed. The snapshot's `layout` (`scripts/lock_key_diff.rb:~195`) is built from `connections` and `doors`, both directions, locks ignored. `reachable` (`:421`) and `cut_off` (`:457`) compare what the start room reaches with and without the new locked room or door, and name only rooms holding required content or a critical-path lock (`lock_rooms`, `:442`). Reproduced above. A second way in, a dead end and an unlocked room all stay exit 1. |
| Minor 1 V2 prop_door | Closed. Only the prop's room is added, `share_login` adds the `with` NPC's home room, and the test pins both. |
| Minor 2 id-less keys | Closed for the case reported (see minor 1 below for a residue). |
| Minor 3 removed lock | Closed as the rule change. `:578-584` flags a non-optional baseline lock node that is gone, or whose entry is no longer `locked: true`. Optional locks stay exit 1. m09 reproduces. |
| Minor 4 completion fields | Closed. `completesTask` and `completesTaskOnOpen` are read; `<vm>:flag_N` references no longer fall through to `acceptsVms`. |
| Minor 5 mappings | Judged: acceptable. `global_set_rooms` (`:338`) takes the rooms with a `set_global` action, a `setGlobal`/`setVariable` map or NPC ink assigning the global, and the holder NPC's room only when none exists (`:324`). Falling back only for engine-set globals is the right trade, because dropping the row left m02 tasks with no room. The one cost is minor 3 below. |
| Minor 6 magnets | Closed (`carried?` in both counters), test added. |
| Minor 7 `lock_on?` | Closed (`locked == true`). |

## Minors

1. **A same-named sibling shifts an id-less lock's path, giving a false "bypass" exit 2** (`scripts/lock_key_diff.rb:118-136`, used by `:578-584`). Members with no id are keyed `type|name`, and when two members share that key both gain a suffix (`@x,y` or `#n`). Reproduced on a copy of m01: inserting an unlocked `safe` named "Main Filing Cabinet" (the same type and name as the locked id-less cabinet) into `main_office_area` changes the cabinet's path, and V9 exits 2 with `critical-path lock 'lock_main_filing_cabinet' removed or switched off (a bypass)` although the lock is untouched. Office life adding a second object with the same generic type and name as a locked id-less one is unlikely (m01 has two such locks, both with unique names), but the failure is an exit 2. Fix: when comparing for removal, match locks by the graph node id (already name based) rather than by path, or give an id to the id-less locked objects.
2. **A changed requirement on a critical-path lock still exits 1** (`:571-585`). The new rule catches removal and `locked: false` only. On m09, changing `plan_cabinet`'s `requires` to another value reports `locks: 1 removed, 1 added` and exit 1, with no RULE 2 line, although a requirement swapped for something the player already holds is as much a bypass (and one swapped for something unobtainable is a block). R3 minor 3 suggested including `requirementHash`; the fixer's outcome does not mention declining it. Fix: for a lock whose path is in both snapshots, exit 2 when `lockType` or `requires` differs and the lock is non-optional, or state in the header comment and README that a changed requirement is left to the reviewer.
3. **Fallback to the handler's room is skipped when only one of several setters is scripted** (`:324-330`). If a global is set both by scenario content in an optional room and by engine code, the holder NPC's room is not added, so the task's mapping row names the optional room only. Required content is then still caught by its other rows, so the effect is a missed attribution, not a wrong exit, and no scenario in the corpus is like this. Also untested: two doors in one room to the same `connectedRoom` get a `#n` suffix (`:118`), so `lock_entry_guards` (`:~495`) would look up the room `<name>#1` and miss the cut. No corpus scenario does this that I found; noted from reading the code only, not reproduced.

## Checks that passed

- No false exit 2 on any of the 12 reproduction mutations that should exit 0 or 1, and none on the corpus.
- The delta adds no em or en dashes and no model names to scripts, tests or README. The README sentence for V9 matches the new exit rule.
- The V9 snapshot gains a `layout` field only (room names, no secrets).

## Outcomes

Each minor was reproduced or checked before the fix. None is withdrawn. Tests are in `test/js/lock-key-diff.test.mjs` (V9, now 27) and `test/js/validator-office-life.test.mjs` (V1 to V8, still 32).

| Finding | Outcome |
|---|---|
| Minor 1 | Reproduced on a copy of m01 (an unlocked `safe` named "Main Filing Cabinet" inserted before the locked one: exit 2, `lock_main_filing_cabinet` removed or switched off). Fixed. `pair_locks` matches baseline and current lock entries by path, then by best fit: paths that differ only by the `@x,y` or `#n` a same-named sibling adds. The removal check and the "new lock" check both go through it, so the cabinet is neither removed nor new, and the same copy now exits 1 (a `locks` change, no RULE 2 line). A lock really switched off while a sibling arrives still exits 2. Tests: sibling before and after, with and without a position, and the switched-off case. |
| Minor 2 | Fixed. The snapshot gains `requiresHash` per lock (requires, key_id, targetFlags, requiresGlobal, requireGlobal; not keyPins or difficulty), and the baseline format goes 2 to 3, so a format 2 baseline is refused with the usual message (none is committed). A critical-path lock present in both snapshots whose `lockType` or requirement differs prints `RULE 2: critical-path lock '<node>' changed (lockType "a" to "b", requirement): a bypass or a block` and exits 2. Any change is reported, as nothing here can rank two requirements. m09 `plan_cabinet` with `requires` changed, and with `lockType` changed, both exit 2; optional locks and a keyPins-only change stay exit 1. The existing "a changed requirement shows as a changed hash" test now expects exit 2 for the vault door. Script header updated. |
| Minor 3, fallback | Fixed. A scripted setter does not say whether engine code sets the global too, so the holder NPC's room is now always added to the rooms that set it. The R3 minor 5 test expects the setter room and the holder room (`office`, `vault`) and a new test pins an optional-room setter plus holder. |
| Minor 3, `#n` suffix | The cut could be missed, as read: `lock_entry_guards`, `gate_guards` and `lock_node_of?` took the door key `vault#1` as a room name. Reproduced in a test (two doors to `vault` in one room, one locked: before the fix no required-content line). Fixed with `door_room`, which strips the `@x,y` or `#n` suffix. Because two doors to one room are a second way through, the layout now lists such pairs under `parallel` (only when there are any, so no other snapshot changes) and `cut_off` names nothing for them. A door keyed by its own `id` is still not mapped back to a room, as before. |

Not touched: `README_scenario_design.md` line 51 still describes exit 2 as a new door or gate, a locked room, or a removed critical-path lock. It should also mention a changed lockType or requirement (outside this fixer's files).
