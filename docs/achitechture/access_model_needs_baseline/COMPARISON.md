# Needs regression comparison: before and after step 9

Verdict: **every behavioural difference is one the plan predicts.** The knocked-out owner now
leaves the screen as rolled, with `workstation_owner_left` and the screen globals set, in
`test_needs_sims` and `test_npc_needs`; `test_needs_leash` is unchanged. One difference the plan's
table does not list is flagged below: `workstation_owner_left` now carries a `reason` field
(additive, no behaviour change). Everything else is run-to-run timing, shown by a second capture
on the same code.

Made with `tools/playtest/needs-baseline-compare.js`, which compares the order of decisions and
events per NPC and per workstation, not tick numbers (README.md). The plan's table is
`ACCESS_MODEL_PLAN.md` 5.4, "What changes for existing scenarios".

## test_needs_leash

`before.json` against `after.json`: **no differences.** It has no workstations; Ravi's decisions
and events are the same sequence.

## test_npc_needs

`before.json` against `after.json`, finder knocked out at his desk at 20 s (`debugKO`, exercised):

| Difference | Plan's table | Verdict |
|---|---|---|
| `finder_pc`: `workstation_owner_left` (`screenLocked` false, `reason: "ko"`), `finder_pc_owner_away` true; every later probe answers `accessed` (before: `attended` for ever) and emits `workstation_accessed`, setting `finder_pc_accessed` | "Owner knocked out at the desk: counts as a leave: the screen is rolled, `workstation_owner_left` fires, the globals are set, and a click emits `workstation_accessed` or `workstation_locked_attempt`" | Predicted. `finder_pc` has `locksScreenOnLeave: false`, so the roll leaves it open. The finder is tracked through his `interests` entry only, which the tracking rule counts |
| `workstation_owner_left:clerk_pc` gains `reason: "needs"` | Not listed | **Flagged:** additive event field, see below |

The clerk's caffeine trip (decisions, events, the screen locking on her leave and clearing on her
return, the probes) is the same sequence in both.

## test_needs_sims

Tom knocked out at his desk at 20 s (`debugKO`, exercised). Three captures:
`before.json` and `after.json` each ran alongside the other two scenarios (three browsers at once);
`after2.json` ran alone on the step 9 code.

`before.json` against `after2.json`:

| Difference | Plan's table | Verdict |
|---|---|---|
| `tom_pc` (`lockChance: 0.5`): `workstation_owner_left` with `screenLocked` false and `reason: "ko"`, `tom_pc_screen_locked` false and `tom_pc_owner_away` true; every later probe answers `accessed` (before: `attended`) | The knocked-out owner "now leaves the screen as rolled, with `workstation_owner_left` and the screen globals set" | Predicted. The seeded roll for Tom's first leave came out open |
| Task `spot_open_screen` completes (second in the order) | Follows from the row above: the scenario maps `workstation_owner_left:tom_pc` with `screenLocked === false` to that task | Predicted (a scenario mapping on the event the plan says now fires) |
| `workstation_owner_left` for `amara_pc` and `sanjay_pc` gains `reason: "needs"` | Not listed | **Flagged:** additive event field, see below |
| Amara's last `used work amara_pc` and `stowed copier_out_a` swap order | Not a workstation change | Timing: both fall on tick 569 in `after2` (570 and 569 before); the printout's stow time is set when she picks it up, one tick earlier in `after2` |
| One more `sanjay_pc` probe answers `locked` | Not a workstation change | Timing: Sanjay came back at tick 902 instead of 893, so the probe at tick 900 found him away; his screen locked on the leave in both, as `workstation: true` says |

`before.json` against `after.json` shows, besides the rows above, different outcomes for Grace's
and Rosa's walks (Grace's two sofa trips and Rosa's water-cooler trip time out in `before`, and
complete in `after`), and Amara walking straight from the coffee to the printout without first
reaching her desk. `after.json` against `after2.json`, both on the step 9 code, shows exactly the
same differences in the other direction (in `after2` the same trips time out again and Amara
reaches her desk first). So they are run-to-run walking variance under load, not a step 9 change.
Nothing in step 9 feeds back into a needs decision: `isAvailable` gives the same answer as the old
inline test, the `onTick` listener only reads the workstation state, and the presence test only
runs on a click.

Not seen in any capture, as the plan expects for scenarios with no sign-in PCs and no `policies`:
no `signin` answer, no `workstation_auto_locked`, no `lockAt`. Amara's and Sanjay's screens (which
always lock) locked on every leave in every capture; Tom's `lockChance: 0.5` roll is reached only
through the knock-out, so it has no before.

## Flagged: `reason` on `workstation_owner_left`

`workstation_owner_left:<id>` now carries `reason`: `needs` for a walk to a need, `ko` for a
knock-out at the desk. The plan describes the event without it. It was added so that
`test_access_sessions` can complete its T7 task only from a knock-out (Kai also has a need of his
own). It changes no behaviour and no existing mapping reads it; `ACCESS_MODEL_PLAN.md` 5.4 now
documents it.
