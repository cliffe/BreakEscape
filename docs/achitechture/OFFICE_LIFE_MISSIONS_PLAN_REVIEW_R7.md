# Office life missions plan: review round 7

Reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` at 516aaddb5 (draft 7), against the engine JS, scenarios and tests in this worktree.

## Verdict

The round 6 major is fixed, and so is the event-scan minor. Draft 7 introduces no new blocker or major. Four minors remain in V5's event list and its tests. Each one can let a timing-dependent event past V5 or leave V5's own fixtures untested. None of them changes the design.

## Round 6 findings, checked

| Round 6 finding | Fix in draft 7 | Holds? |
|---|---|---|
| M1 V5 as a scenario-wide ERROR | Section 4, "Scope of V2, V4 and V5": these three run only for the ten campaign missions, named in one constant in `validate_office_life.rb`. Fixtures assert 0 errors on m01 to m10, and no output at all on the two labs and three test scenarios. Section 13 step 2 runs `bin/test-js -j 3` and the validator tests after committing. | Yes. The two tests R6 named (`test/js/npc-needs-slots.test.mjs:399-404`, `test/js/npc-left-behind.test.mjs:315-320`) fail only on `❌ ERROR` for `test_needs_sims`, which is outside the scope. The `npc_used` mappings in `lab_physical_pentest` and `test_needs_sims` are left alone. The other validator node tests run synthetic temp scenarios, which are not campaign ids either. |
| m1 V5 scans too few modules | The fixture scans every file under `public/break_escape/js/` in five emit forms. `npc_reacted`, `npc_use_` and `room_tone_` are added. | Mostly. The scan now sees `social-feed.js`, `npc-office-visuals.js` and the room-tone module. Three smaller holes remain: m1 to m3 below. |
| m3 sync total | 64 keys | Yes: 24 + 6 + 8 + 8 + 2 + 6 + 10 = 64. |
| m2, m4 to m10, n1 to n3 | Folded into sections 3, 5, 7, 8, 10, 12 and the appendix | Yes. The tool paths check out: `vendor/bundle` in the main repo, `new-game.rb:544` prints `FLAGS_XML`, `session-start.sh --flags`, `verify-run.rb`, and the `break_escape:tts` namespace with `wasted` (`lib/tasks/break_escape_tasks.rake:7,58`). |

The campaign missions today use only `npc_ko`, `npc_attacked`, `npc_hostile_state_changed` and `npc_conversation` from the office-life stems. No prefix matches any of them, so the fixture that requires "0 errors on m01 to m10" holds.

## Blockers

None.

## Majors

None.

## Minors

**m1. `npc_placed` is on the exclusion list, but it is a needs event.**
Section 4, V5, the exclusion list. `npc_placed:<itemId>` is emitted by the needs system when an NPC sets down a delivered slot (`public/break_escape/js/systems/npc-needs.js:5145`; `docs/achitechture/NPC_NEEDS_SYSTEM.md:899`). That depends on timing, just like `npc_used`. Because the fixture accepts any name on the exclusion list, it would pass with this entry in place.
Scenario: a later Tier 3 mission has a needs NPC deliver a file to the post tray and keys a required task on `npc_placed:memo`. V5 stays silent, and the task can stall for as long as the NPC's needs keep it busy.
Fix: move `npc_placed` from the exclusion list to the prefixes.

**m2. The prefix matching rule is undefined, and 13 emitted names are not named.**
Section 4, V5. The list mixes stems (`npc_print_`, `workstation_`) with whole names (`npc_used`, `npc_overheard`) and calls them all "exact prefixes", but never says whether `npc_used` matches `npc_used_phone` or `npc_used_object`. A plain string-prefix rule causes two problems:
- `npc_need_` does not match `npc_needs_leashed` (npc-needs.js);
- `npc_used` matches `npc_used_object` and `npc_used_object_done`. These come from the patrol route `useObject` step (`npc-behavior.js:2019-2021`, `2073-2076`), which is scripted movement, not office life.

The engine also emits these office-life names, which neither the "such as" list nor the exclusion list names: `npc_action_windup`, `npc_avoided`, `npc_checked`, `npc_job_failed`, `npc_picked_up`, `npc_needs_leashed` (all npc-needs.js); `npc_sat`, `npc_sat_at`, `npc_stood`, `npc_swivelled`, `npc_fetching_chair` (seating.js and others); `npc_guest_left` (npc-workarounds.js, workstation-state.js); `npc_left_item_gone` (left-card-consequence.js and others).
The fixture would force a decision on each name, but the implementer has no rule to decide with.
Fix: define the match. An entry ending in `_` matches any name that starts with it. Any other entry matches the name exactly, either alone or followed by `:`. Add the names above as prefixes. Put `npc_used_object` on the exclusion list with the reason "scripted patrol route", unless the plan decides route uses count as office life.

**m3. Names passed to emit helpers escape the scan.**
Section 4, V5, the five emit forms. `_emitRouteUse('npc_used_object', …)` (`npc-behavior.js:1768, 2019, 2021`) passes the literal to a helper that emits `` `${name}:${objectId}` ``. None of the five forms sees it, and later helpers of the same kind would also be missed.
Fix: the fixture collects every string or template literal that begins with an office-life stem, whatever call it sits in. The check in this review did exactly that and found every emitted name listed above.

**m4. V5's own fixture tests need a way past the campaign scope.**
Section 4, "Scope". V5 runs only for the ten campaign ids, and the validator's existing node tests write synthetic scenarios to temp files (for example `test/js/validator-exit-code.test.mjs`). A positive fixture ("a required task keyed on `npc_used:x` is an error") then has no way to trigger V5, short of copying a campaign mission.
Fix: `validate_office_life.rb` takes the campaign set as a parameter, or reads a test-only override (an environment variable or a `--campaign` flag). Fixture tests use it for the positive cases, and the lab and test-scenario fixtures run without it.

## Nits

**n1. The appendix says "no open findings".** After this round there are four minors on V5's list. They can be folded in when section 13 step 2 is specified, or in a draft 8 if one is written.

Counts: B=0 M=0 m=4 n=1
