# Ops showcase plan: review R4 (delta)

Reviewer: design review round 4, delta only. Reviewed: R3 review and `git show d1a04d492` ("plan revised after R3"). Worktrees: `[follow]` /data/be-ops-follow, `[build]` /data/be-ops-build, `[skin]` /data/be-ops-skin.

Counts: 0 blockers, 0 majors, 3 minors. Verdict: **clean**.

## M1 (coffee counter): closed

- A numeric ink global that rises fires the event every time. The observer returns early only when `gameState.globalVariables[name] === value` (`public/break_escape/js/systems/npc-conversation-state.js:598-604`). `n` then `n+1` differs, so gameState is written and `global_variable_changed:coffee_call` is emitted with `{name, value}` (`:622-638`). A `0` initial value passes (`valueObject ?? newValue`).
- Re-entry works: a later conversation syncs gameState into the story first, so the story's `coffee_call + 1` is again a change.
- A mapping with no `condition` skips the condition branch and returns fire (`systems/npc-manager.js:1577-1596`).
- `cooldown: 0` is honoured. It is read with `!== undefined && !== null` (`:1571-1573`) and the test is `now - lastTime < 0`, never true (`:1574`). No `once` or `maxTriggers` means no count cap (`:1567`).
- `needs.set` runs on every fire (`:1963-1966`, `npc-needs.js:1155-1161`), and `caffeine`/`thirst` are real needs (`npc-needs.js:109`). `ask_weekend`/`social_media` is valid (`:190`).
- The validator checks only that the global is declared (`scripts/validate_scenario.rb:4300-4305`). It does not check type for event globals, and the same-shape `cooldown: 0` mappings exist already (`scenarios/office_life_showcase/scenario.json.erb:291`).
- Section 4 states the shape once; 5.2, 6.2, 7.2, 7.6 and the contract globals (`coffee_call` 0) agree. Gwen's lunch lever is dropped.

## M2 (S8c leak scan): closed, with minor m1

The documented limit exists at [skin] `docs/ACCESS_AND_NETWORKS.md:876` ("the older `mfa_secret` and `mfa_session` rules can flag honest lock answers"). `lock_step_leak_rules` is required by `tools/playtest/lib/access_leak_scanner.rb:12`. The revised step 5 (run, list, hand-check against the limit, assert zero for other rules, plain zero if the limit has closed, record which) is workable.

## Minors

**m1. The S8c filter "answers with no lock echo (the PC answers)" is not something the scanner can tell.** The same limit says the recorder keeps no request body and an echo dropped in such a scenario is read as a PC answer, so the scanner cannot say which answers carry an echo. Fix: the S-8c test filters by its own case list. It tags each answer by the route the test called (sign-in or pad route against a lock `targetType`/`targetId`), and asserts zero `mfa_*` findings on the sign-in routes. Say so in 8.4 step 5.

**m2. Citation drift.** The plan cites "[build] docs:877, 'playtest order matters'" for the desk stop counting by typed username. At [build] that line is "A granted answer says which account and desk..." and the phrase is not in the file. The behaviour is supported at [build] docs:890 and 904 ("the tries and the stop"; "per desk and username the tries and whether the desk has stopped"). Fix: cite 890 and 904 in 7.5 M13 and drop the quoted phrase. Behaviour and the m7 fix are unchanged.

**m3. Run B's "second press is the check" is invisible while the NPC is still out.** `needs.set` on an NPC already on a coffee job changes nothing visible. Fix: Run B and PLAYTEST say "press again once Anjali is back at her desk and watch her leave again", and give an expected log line (`level_set` in the needs log, `npc-needs.js:1158`).

## R3 findings: status

| R3 | Status | Evidence |
|---|---|---|
| M1 | closed | above |
| M2 | closed (m1 above) | above |
| m1 owner-at-desk in S-T | closed | dropped from the S-T row (8.3), kept in Run A |
| m2 share goes to Anjali | closed | bark and Run A reworded; matches `npc-workarounds.js:149-151` |
| m3 ticks | closed | `door_propped:archive_store` is emitted (`npc-workarounds.js:388`); `mfa_approved` carries `{npcId, targetType, targetId, by}` or `pcId` for a PC (`systems/mfa-client.js:74-78,248`); `helpdesk_answered:<desk>` carries `{deskId, result}` (`[build] helpdesk-client.js:131-136`); S-8c records the exact door/safe/case values, with an ink fallback. `pestered` now needs `data.pcId === 'darren_pc'`, correct against `mfa-client.js:74-78`. Ink ticks on `helpdesk_it_desk_result` are task ticks only, within [build] docs:882's "next line only" limit because the tasks gate nothing |
| m4 M15 after M14 | closed | 7.6 and Run E (M15 first, or close the pane with the X) |
| m5 evening | closed | 6.9 keeps Graham, 7.9 keeps Thandiwe, neither gets an `act_evening` mapping |
| m6 settled choices | closed | rules 11, 12 and section 9 "Decided"; docs edit is one orchestrator commit after wave 1, no unit touches the file |
| m7 M13 username | closed (m2 cite) | Lorna's username, after M11 and M12 |
| m8 charger | closed | charger in the office, loaded from M1 |
| cosmetic 5.3 parenthesis | closed | no `role: "print"` fallback left |

## Builder traps

- **Shared files in one wave:** none. Wave 1 units own disjoint paths (same-named ink files sit under different `scenarios/demo_ops_*` dirs); `docs/ACCESS_AND_NETWORKS.md` is edited by no unit; wave 3 units run one at a time per scenario; the docs commit is orchestrator-only, after wave 1, by patch (its file has uncommitted edits, which the plan notes).
- **Validator errors:** `coffee_call` and `ask_weekend` are declared in `globalVariables`, so the `global_variable_changed` check passes; a needs-only mapping with no knot or bark already ships in `office_life_showcase`; the `resultGlobal` numeric rule does not apply (no `resultGlobal`). Nothing new for a builder to trip on.
- **Needs Opus:** no new design decision in the diff needs Opus judgement.

## Verdict

clean (0 blockers, 0 majors, 3 minors).
