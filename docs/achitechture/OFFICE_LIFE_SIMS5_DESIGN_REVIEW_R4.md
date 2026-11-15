# SIMS-5 design review, round 4 (delta since round 3)

Scope: `git diff 7990a46da d3a07a739` over `scenarios/test_needs_sims`, `scripts/validate_office_life.rb`, `test/js/validator-office-life-v10.test.mjs` and `public/break_escape/js` (no engine change in the range). Read-only: the validator ran with `--skip-ink --no-graph`, and the V10 node test ran. No servers, no playtests.

Checks run: `ruby scripts/validate_scenario.rb scenarios/test_needs_sims/scenario.json.erb --skip-ink --no-graph` gives 0 errors and 35 warnings, none from V10 and three from V8. `node --test test/js/validator-office-life-v10.test.mjs` passes 38 of 38.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 3 |

## R3 findings: closed or not

| R3 item | Status | Evidence |
|---|---|---|
| M1 tour order | Closed | README rows 1 to 3 sit under "Before you open any door", then "Now open the kitchen and lounge doors", then rows 4 to 15. Row cross-references ("as row 1", "after row 3") match the new numbers. |
| M2 socket grumble, `see_coffee_off` | Closed | `scenario.json.erb:601` ticks `see_coffee_off` only on `npc_turned_back:*` with reason `off`; the `npc_used:kitchen_coffee` mapping is gone. `grumble_off` pool exists (line 18). Task title and README row 3 say the same thing (kitchen shut, Tom and Marek waiting, switch back on). |
| M3 Marek's post | Closed | `scenario.json.erb:718` and `727` both read (1.65, 4.0); README line 25 and the `_comment` at line 726 agree. The screenshot `marek-cooler-5201.png` shows the task-complete toast for "Nobody chats with the contractor", Marek in the kitchen labelled "returning" with his thirst bar full, Sanjay's name still over the office. That is the beat the Outcome describes. 5 of 5 proof is as logged; I did not re-run it. |
| M4 V10 ranking | Closed | Node tests 36 and 37 pass inside the 38. |
| m1 to m3 | Closed as the Outcome says | Row 2 stand-point, row 4 short-queue note, phone-id check. |
| m4 toasts | Still open, owner note | Visible in the screenshot: the toast covers the right third, including Sanjay's sprite. Unchanged and recorded. |

## V10 change in 96a5d2ad4

`validate_office_life.rb:1165-1170` drops the NPC's start room from its "can be here" set when the engine runs the NPC (`runs?`) and `VN.leash_rule` bars that room. I compared `VN.leash_rule` with `_roomForbidden` (`npc-needs.js:1308-1316`): same four tests (`needsRooms` allow list, `needsAvoidRooms`, room `needsPrivateTo`, home-room exemption). They agree.

- False warning from a patrolling NPC: none. `build_rooms` merges `patrol_rooms` afterwards (line 1176), and a one-room patrol returns its start room, so a leashed patroller keeps the start room. Test 28 covers the route case.
- False warning from an NPC with no needs and no interests: none, `runs?` is false so the start room stays.
- Wrong exemption: none found. A phone NPC is excluded by `runs?`. An NPC whose start room is its home returns `nil` from `leash_rule` and keeps it.
- Unverified edge: the rule assumes the engine walks a leashed NPC out of a barred start room and never back. If that walk-out only happens once the needs system has the room loaded, an NPC that starts in a barred, unloaded room is still physically there for a while. The comment cites `_roomForbidden` for the "never goes back" half only. This is a narrow case and the showcase has no such NPC (V10 is silent on it); logged as F4.

## Findings

### F1 (major) README does not say why the showcase exceeds the V8 caps

Evidence: validator output "reveal and left-behind globals 14/6; office-life onceOnly mappings 57/10; office-life items 9/4", each with "A plan that needs more must say why" (`validate_office_life.rb:786-792`). `grep -n -i "budget\|V8\|sync" scenarios/test_needs_sims/README.md` finds nothing about it. The README's only copy guidance is the lever paragraph at line 60.

Failure scenario: a mission author copies the showcase's pattern for a beat (this round's own `outcast_pending` arm, tick, disarm trio at `scenario.json.erb:572-574` is a good example: one persisted global and three mappings for one task). They run the validator on their mission, see the same V8 warnings, check the showcase, find it warns three times, and conclude the counts are normal. Every mission then carries tens of onceOnly mappings that are synced to the server, which is what the cap protects.

Fix, in the README (about four lines near line 60): the showcase holds fifteen beats and six NPCs in one scenario on purpose, so its counts (14, 57, 9) are a ceiling for a demo, not a size to copy; a mission should stay under the caps (6, 10, 4) by using three or four beats, and must say why in its plan if it goes over; the `outcast_pending` idiom costs one global and three mappings and is worth it only where a task must be tied to a beat that can fail. My call on point 3: yes, say so in the README.

### F2 (minor) `outcast_pending` can arm without the rota and survive a reload

Evidence: `scenario.json.erb:572` arms on any `npc_avoided:sanjay` where the avoided id is Marek, not only the cooler beat. Row 2 (coffee notice) also produces that event at the coffee machine. `outcast_pending` is a plain global (line 47), so it persists in the synced globals. Disarm is only `npc_returned_post:marek` (line 574), emitted by `npc-needs.js:1446` and `3383`.

Failure scenario: a tester runs row 2, Sanjay turns back from Marek and arms the flag, then reloads the page before Marek has returned to his post (NPCs reset to posts, and I did not find that a reload emits `npc_returned_post`). Later Marek's own slow thirst sends him to the cooler, `npc_used:water_cooler` fires with the flag still true, and `see_outcast` ticks although nobody read the rota and Sanjay never avoided him at the cooler. The reverse order also exists: if Sanjay's avoid event lands after Marek has already drunk, the flag arms after the use event, Marek's return disarms it, and the task does not tick on that visit (the mapping stays unspent, so a later visit can still tick it). The rota proof (5 of 5) only exercised the intended order. Not reproduced, reasoned from the mappings. Cheap fix if wanted: key the arm on `data.objectId === "water_cooler"` (the event carries `objectId`, `npc-needs.js:4065`).

### F3 (minor) Two tour orders in the README

Evidence: the table at lines 33 to 52 says rows 1 to 3 only work with the kitchen shut and must come first. The "How to watch it" timeline at line 66 to 67 says "About 1:30, open the doors", then continues. Nothing says the timeline is the unprompted walk-through and the table is the tour.

Failure scenario: someone follows the timeline first, opens the kitchen, then reads the table from row 1 and finds rows 2 and 3 (shut kitchen) do not behave as written, because the kitchen stays loaded once opened. One sentence at the top of "How to watch it" ("this is the unprompted run; for the lever tour start from the table, and open nothing first") closes it.

### F4 (minor) V10 start-room rule rests on an unchecked load-order assumption

Evidence: `validate_office_life.rb:1165-1170`, comment cites `_roomForbidden` only. Not exercised by the showcase (V10 prints no warning for it) and not by node test 38's fixtures beyond the leash rule itself.

Failure scenario: a mission puts an office worker whose `needsHome` is in the open-plan office but who is placed in a leashed-out room for a cold-open. A pool whose source sits in that start room is then reported as dead, although the NPC is physically there and speaks it at the start. The warning would be wrong for the first minutes only; the fix is to word the V10 message as "after the NPC walks home" or to confirm the walk-out happens at load. Low risk.

## New ways the showcase could mislead a copier

- F1 and F2 above are the two found. Nothing else in the delta changes what a mission author would copy: the engine files are untouched, spoken lines are unchanged (0 added, 0 changed, 0 removed), and the two task titles that changed are on-screen only.
- The stale references check (`(3, 8)`, "bottom-left corner", old row numbers) found only the README history text that deliberately records the old posts; the `(3,8)` at README line 12 is the kitchen coffee object, not Marek.
- V8's "small keys 89/64" figure is over its stated bound but raises no warning (info line only, `validate_office_life.rb:808`). A copier reading the info line sees an over-budget number with no flag. Worth one sentence in the F1 README note.

## Verdict

Approve for the next phase. Every R3 finding is closed as its Outcome says, the V10 change is sound, and there are no blockers. Fix F1 in the README (a few lines) before missions start copying the showcase; F2 to F4 are optional tidy-ups and can go on the owner list beside R2 m7 and R3 m1 earshot.

## Outcomes

| Item | Outcome |
|---|---|
| F1 | Fixed. README has a "Copy the levers, not the counts" section near the top: the V8 counts (14/6, 57/10, 9/4, small keys 89/64 info line) are a demo ceiling, a mission stays under the caps or says why in its plan, and the `outcast_pending` idiom costs one global and three mappings. |
| F2 | Fixed. The arm mapping now needs `data.objectId === "water_cooler"` as well as `avoidedId === "marek"` (`npc_avoided` carries `objectId`, `npc-needs.js:4065`), so a coffee-machine avoid (row 2) no longer arms it. A Marek thirst drink with no rota read leaves the flag unset, so `see_outcast` cannot tick. Live proof in the build log. |
| F3 | Fixed. One sentence in the README: the timeline is what happens if you only watch, the tour table is the order to pull the levers. |
| F4 | Assumption half wrong, conclusion right. The engine has no walk-out at load: an NPC in a barred start room stays there, idle, until its first job (`_goHome` calls follow a job, a block or a resume). After that it never returns (`_roomForbidden`, `npc-needs.js:1308-1316`). V10's rule is therefore true from the first trip, and the start-room exclusion stays. The `build_rooms` comment now says so and cites the engine lines. No behaviour change, so no new test. |

Checks: validator 0 errors (35 warnings, unchanged); `bin/test-js` 665 of 665 files pass.
