# Slice 4 review: demo_access_tour (office life)

Scope: `git diff b6daae155 ab37df65f -- scenarios/demo_access_tour`, read through `git show ab37df65f:`. No edits to scenario or tests. Validator run on a temp copy: 0 errors, 10 warnings. Rails tests and the live check were not run (another agent holds the worktree). I stopped at the context limit; checks 1 to 8 are all covered, but not every engine path was traced to the end.

Counts: B0 / M2 / m3 / n5

## Findings

### M1. The rota board and unprompted coffee runs need the kitchen loaded, and no route loads it
Evidence: the needs system lists only loaded rooms (npc-needs.js:5414-5420, `listObjects` walks `W().rooms`; OFFICE_LIFE_MISSIONS_PLAN.md:68: "A kitchen behind an unopened door is never used"). `coffee_station` is in the kitchen (scenario.json.erb 668-683), the plan says the kitchen is on neither route (plan 404), and the validator warns for both NPCs (warnings 23, 27). Plan 2.6 and stops 12 and 13 call the board "the guaranteed lever", so it rests on this.
Fix: the live check must read the board with the kitchen never visited. If Thandiwe and Yasmin do not leave: either put the coffee machine in the open plan, or make the kitchen visit part of the route (rota board text, kitchen sign S2 and a Ama hub line naming the west door), or have the board mapping preload the room if the schema allows it. Do not ship on the plan's assumption.

### M2. Plan gate C6 (BC1) not met; the slice is not done
Evidence: plan 643 (C6) and the handover's open items 3 and 4. The showcase's BC1 is not on this branch (`plan/ol-showcase` only), so the tour must run BC1 itself: cake held, down and untouched, one slice gone, finished, each reloaded on a fresh game. Also not done: cake dropped in open_plan empties both desks, P6 on a wrong-room drop, the scoped corpus run, and the validator-office-life.test.mjs:442 list entry (plan slice 4).
Fix: run those, commit the screens, then mark done.

### m1. Julian was given needs against plan 2.4, and it buys nothing
Evidence: plan 2.4 says "no needs, no routine" for Julian. The build adds a kitchen coordinate home and a hunger need (scenario 711-715). A tracked NPC starts `atPost: true` (npc-needs.js:568), and `ownerPresent` is true for a tracked NPC at post (workstation-state.js:672-676), so `pcUserAt('julian_pc')` returns julian (unlock-system.js:544-550) and a click on his PC says "Julian is using this PC" (623-627), though he stands in the kitchen. Validator warning 31 still says this. It starts only once the kitchen has loaded, so it differs before and after a kitchen visit. It does not break the Connect route (remote sessions do not click the PC; ownerReturned only ends claimed sessions, pc-sessions.js:689-693), and the partner door keeps the player out.
Fix: remove `needsHome` and `needs` from Julian and accept the warning as for Delphine, or keep them and log the toast as intended. I recommend removing them.

### m2. "social" dropped from the cake's `satisfies`: sound, but the plan text disagrees
Evidence: CAKE_ITEM.md snippet and plan 210 give `["hunger","social"]`. Nobody has a social need, so nothing is lost; chatter pairing depends on `affordance.chatter` and two users, not on `satisfies` (npc-needs.js:4392-4404). Every other field matches the spec at 08646ad8b, plus the one later spec change (9ad5b1c82: "Who's the cake from?"), which the build took (C4 done). `cake_servings` 2 equals `servings` 2.
Fix: note the deviation in plan 2.4/2.5 and the validator notes.

### m3. The `room_entered:open_plan` nudge also fires after the once-only nudge has worked
Evidence: scenario 579-580. The cooldown (600000) starts only after the fallback has fired, so the first entry to the open plan after the twin is up nudges Thandiwe again even if the first nudge already sent her to the laptop (for example full-route stop 18 passes through the open plan). She stands up for a 3 second laptop use. No harm to capture (the capture mapping is once-only), and no player_state growth: only mappings with `persist` (once-only or maxTriggers) are exported (npc-manager.js:2177-2182), so the cooldown mappings, the rota mappings and P6 add nothing.
Fix: add a "not yet captured" test to the fallback condition, or accept it and say so in the run sheet.

### n1. Logic of the stop 15 nudge and rota board: correct
`fireOnlyWhenLoaded` is a validator opt-out only (scenario-schema.json 4990). The once-only mapping is heard while the open plan is loaded, which it is by stop 11. Rota mappings key on `object_interacted` with `data.objectName === 'Coffee rota'` (name matches scenario 538); caffeine 10 is below `urgentAt` 30. Cooldown 30000 on both.

### n2. P6 and the phone knot
`magnet_placed` carries `roomId` (npc-needs.js:863), so the guard condition works. Open plan is north of reception (connections, scenario 159). Slice 5 must keep a knot named `hint_cake` in ama_phone.ink when it replaces the stub, or the timed text will open nothing.

### n3. Chatter pools
All lines are 40 characters or fewer, UK English and in character. They are scenario-level pools, which the TTS extractor covers (tts_office_lines.rb CHATTER_PATHS). No exchange knots exist in this slice and the plan asks for none, so "heard once" does not apply; pool lines come from a no-repeat shuffle bag with a cooldown (npc-needs.js:2808-2830). The coffee pool plays only when Thandiwe uses the machine and Yasmin queues (queue pairing, npc-needs.js:5025-5053), which depends on M1.

### n4. Owner presence at the desks (check 7)
Delphine without needs is right and is plan 2.4: untracked means `ownerPresent` false, so reception_pc always shows its sign-in (workstation-state.js:672-676), and stops 5 and 14 are safe. Thandiwe and Yasmin are now tracked: while seated their laptops and PCs answer "using this PC" and physical sign-in is blocked until they leave (unlock-system.js:623-627). That is the plan's design for stops 11 to 13, but validator info 45 and 46 ("reachable without a foothold") are now false while they sit, and no Rails test sees presence. Scripted walks from slices 2 and 3 that sign in at thandiwe_laptop or yasmin_pc must wait for them to leave or use the board.

### n5. Placement, the plant, and V8
Thandiwe (3.6, 5.0) and Yasmin (5.8, 5.0) start 1.7 tiles south of their chairs (3.3, 3.3 and 5.5, 3.3) but count as at post from tick 0; the live check should look at the first screen. The `plant-large11` swap is a valid hiding spot: `SMALL_PLANT` only excludes plant-large1 to 10 (plant-hiding.js:35; regex tested, lib/break_escape/hiding_spots.rb:23), the prefix `plant-large` is listed (plant-hiding.js:26-28) and the overlay anchor exists (plant-hiding.js:53). Its observations text still says "planter"; check the art. V8 matches the plan: office-life once-only 2/10 (capture, work nudge), magnet servings 1/2, dropped magnet items 1/2.
