# office_life_showcase: build review R3

Reviewed at `57dbaa743` (branch `plan/ol-showcase`). The R2 fixes are commit `ffa3f39ee`; `57dbaa743` adds only a handover note. Sources: `planning/BUILD_REVIEW_R2.md`, the "R2 fixes" section of `planning/BUILD_REPORT.md`, `git show ffa3f39ee`, `scenario.json.erb`, the whole of `ink/ama_owusu.ink`, the PLAN sections the diff touches, and the engine paths the fixes depend on. No live run in this round (the live check on :3094 is a separate task).

Checks run here: `validate_scenario.rb --no-graph` (0 errors, 17 warnings, the known baseline; V8 office-life onceOnly 8 of 10, magnet servings 1 of 2), `tools/playtest/showcase-lines-check.mjs` (PASS, every plan line matches the data word for word, caps hold), `node --test test/js/validator-exchange-line-length.test.mjs` (3 of 3 pass), and a grep that the compiled `ama_owusu.json` carries `cake_servings`, A31 and A34.

Severity: B blocker (a task or the tour can stall in a common path), M major (wrong against the plan, or a teaching beat that misleads or can be lost), m minor.

## Verdicts on R2 findings

| R2 | Verdict | Notes |
|---|---|---|
| m1 | Fixed | `scenario.json.erb:265`. `npc_used:<targetId>` carries `npcId` and `need` (`systems/npc-needs.js:3701-3707`), so `data.npcId === 'zainab_hussain' && data.need === 'caffeine'` matches her office and kitchen coffee alike, and nothing else she uses (her thirst goes to the cooler, need `thirst`). The `*` suffix is matched by the dispatcher (`systems/npc-events.js:54`), and Ama's block already used `npc_turned_back:*`. No `onceOnly`, so the V8 budget is unchanged; repeat ticks are harmless because `completeTask` returns early on a completed task. The `act_evening` gate keeps a midday coffee from ticking it; a use started before the turn and completed after it does tick, which is the B1 case R1 wanted. Live proof of the switch-off-on-the-walk path is still in the :3094 handover. |
| m2 | Fixed, wording slightly off | `scenario.json.erb:82`. The warning is there. "Calling it a day closes the earlier aims" is not literally true: nothing in the data closes an aim, and one or two earlier tasks can still tick in the evening (Zainab turning back from a switched-off machine ticks `see_coffee_off`). See m2 below. |
| m3 | Fixed | PLAN sections 6 and 9 and row 3.1 match the build; R14 records the lamp. Two small leftovers (row 3.3, the ink header comment): m4 below. |
| m4 | Fixed | `scenario.json.erb:232`. Title no longer repeated; 12 lines, the longest 47 characters. The short form lost the socket and the one-at-a-time rule: m3 below. |
| m5 | Fixed | Test added and passing (number, empty, blank, valid, absent); backlog line present in `docs/IDEAS_BACKLOG.md`. |
| m6 | Fixed; the sync works | See "How `cake_servings` reaches Ama's ink" below. |
| m7 | Fixed | `ama_owusu.ink:78-89`. Exactly the three-way gate R2 proposed: A32 needs `kitchen_seen and heard_exchange_cooler_chat`; `kitchen_seen` alone gives A7; else A8, A7. Both VARs are declared scenario globals, so both sync. PLAN 6 and 7a updated. |
| m8 | Fixed | `scenario.json.erb:16`. "Quiet one today, isn't it?" (26 characters). Works as an opener and as a reply. |
| m9 | Rewritten, but the new question clashes with "Yes" | `ama_owusu.ink:120`. See m1 below. |

### How `cake_servings` reaches Ama's ink (m6)

Read side. `cake_servings` is declared in the scenario `globalVariables` (`scenario.json.erb:35`), so `isGlobalVariable` is true for it (`systems/npc-conversation-state.js:461-472`, the declared set recorded at load). `syncGlobalVariablesToStory` writes every declared global the story also declares into the story (`:498-515`), and person chat calls it twice on every conversation start, after the restore and again just before the first `Continue` (`minigames/person-chat/person-chat-minigame.js:558-592`). The cached story is synced when it is built (`systems/npc-manager.js:3297`). On a reopen with saved choices, the re-navigate to `hub` re-evaluates the conditionals with the synced value (`:563-584`). Ama's ink never assigns the VAR, so the observer never writes it back. `exportNpcInkVariables` skips declared globals, so a reload cannot overwrite it with an old ink-local copy.

Write side. The magnet's key is `${o.id}_servings` (`systems/npc-needs.js:887`), and the dropped item keeps the id `cake`, so the key is `cake_servings` (the same id the `magnet_finished:cake` mapping relies on). `_takeServing` writes it through `world.setGlobal` (`:1054`), which goes to `npcChatterVoice.setGlobal` (`:5620-5625`), then to the shared `writeGlobal` (`systems/npc-needs-chatter.js:201-207`, `:445`). `writeGlobal` writes `gameState.globalVariables` first, broadcasts to every cached story that declares the name, and also writes the open chat's story (`systems/global-writer.js:151-190`). So the value is kept up to date even while Ama's conversation is open, and a fresh talk reads it at start. On reload `scanMagnets` reads the saved global (`npc-needs.js:885-890`), and the same sync puts it into the ink.

So A34 shows exactly when the cake has had its last serving taken. Two edges, neither a finding:
- A serving is taken as eating starts, so for the last eater's 12 s `useSeconds` A34 says "gone" while the slice is still being eaten, and `see_cake_eaten` has not ticked yet. If the viewer calls it a day inside those 12 s, the eater is hidden, `isAvailable` fails and the job is aborted (`npc-needs.js:1421-1427`), so nobody is left `using` and `_tickMagnets` finishes the magnet (`:1075-1077`): the task still ticks. No soft-lock.
- With one serving left (dropped early, one slice eaten), A11 still says "drop the cake from your inventory" although it is out. Transient: at midday the lunch hunger set (20) makes the cake the urgent eaters' first choice, so the count reaches 0 within a minute or so.

## Findings

No blockers or majors.

### m1. A31 asks a question that "Yes" answers the wrong way

`ama_owusu.ink:120-131`; PLAN 7a row A31 (`PLAN.md:222`).

"They won't be back once they've gone home. Any tasks still unticked first?" is followed by "Yes, call it a day." and "Not yet." Read literally, "Yes" means "yes, I still have unticked tasks", and the choice then does the opposite. The full choice text names the action, so a misclick is unlikely, but it reads oddly on screen and the line is not voiced yet, so it is cheap to fix now. Aloud, "unticked first?" also ends on a clipped, UI-flavoured phrase.

Fix (before voicing): make the question one that "Yes" confirms, for example
"They won't be back once they've gone home. Seen everything you wanted?" (12 words, 70 characters), which is close to R2's suggestion and keeps the "Once" echo out. Update PLAN 7a and the R2-fixes list in `BUILD_REPORT.md`.

### m2. The Evening aim says calling it a day "closes" the earlier aims

`scenario.json.erb:82`.

Nothing closes an aim: they stay active, and some earlier tasks can still tick in the evening (`see_coffee_off` from Zainab turning back at a switched-off machine; `use_open_screen` if an open screen is still reachable). A viewer told the aims are closed may stop trying. Fix (UI text): "Home time for nearly all of them, and they don't come back, so finish the earlier tasks first. Each task ticks when you have seen that behaviour happen."

### m3. The short board lines dropped two teaching points

`scenario.json.erb:232`.

- "Switch the coffee off while they queue." no longer says where. The lever is a separate object, `office_coffee_socket` named "Wall socket" (`:181-183`); a viewer reading only the board will try the machine. A6 says "at the wall socket", so Ama covers it, but the board is the reference people come back to.
- "Watch the coffee run; the rest queue." lost "one at a time", which is the reason they queue.

Fix (UI text, lengths within the current 47-character longest line): "- Watch the coffee run: one at a time." (38) and "- Switch the coffee off at the socket." (38). The "while they queue" timing is not needed for the tick (`npc_turned_back:*` with reason `off` fires for walkers too), and A6 still says it.

### m4. Two small doc leftovers

- `PLAN.md:136`, row 3.3: "Ticks on" still names only `npc_left_post:zainab_hussain`; add "or `npc_used:*` with `need === 'caffeine'` (any coffee source)", as section 9 now says.
- `ama_owusu.ink:5-6`, the header comment: "start diverts to hub.choices" is now true only on the first talk; later talks divert to `hub` (as the `met_ama` comment at `:24-26` says). Comment only; no recompile needed for meaning, but recompile if touched.

## The changed or new spoken lines

| Line | Text | Verdict |
|---|---|---|
| A31 | They won't be back once they've gone home. Any tasks still unticked first? | Change before voicing (m1). The first sentence is good aloud and names the stake; the question fights the "Yes" choice. |
| A34 | The cake's gone already. Tell me when to call it a day. | Good. 12 words, natural British, and it names the choice the viewer needs ("call it a day") as A33 does. "Already" reads as information, not a rebuke, in Ama's warm voice style. |
| cooler pool | Quiet one today, isn't it? | Good. A tag question that works whether it opens or answers, so the single-draw problem from R2 m8 is gone. 26 characters. |

All three still need the user's yes before voicing, together with A32's unchanged text if not already voiced. If m1 is taken, voice the new A31 text, not the current one.

## Judged with no finding

- **onceOnly budget and conditions.** The widened mapping has no `onceOnly`; V8 stays 8 of 10. The `npc_used:*` listener sees every NPC's every use, but the condition is a few property checks; no cost worth noting.
- **Validator and test.** 0 errors, the same 17 warnings. The new test spawns Ruby per case, five calls, about 2 s; acceptable alongside the existing line-length cases.
- **PLAN section 7 against the inks.** The lines check passes with A31 to A34 and the new cooler line.
- **A7 on its own.** With `kitchen_seen` true and the exchange not heard, A6 is followed by A7 "Then open the kitchen door and hang about by the water cooler." The viewer has already been in, so "open the kitchen door" is slightly redundant, but it is accurate (the door may have closed) and it avoids a new line. Keep.
- **Soft-locks and beats out of order.** None new. Lunch still gates only on `kitchen_seen` and the owners being back, so a viewer who never hears the cooler exchange still reaches midday (A7 keeps pointing them at it, and the task stays open). "Call it a day." sits under `act_midday and not act_evening`; the confirm keeps every choice on "Not yet." The cake can be dropped in any act; A34 covers the early drop, and a drop in the evening finds nobody hungry except Zainab, which is fine for a tour.
- **Esc mid-conversation.** At the A31 confirm the first choice's `sourcePath` starts `hub`, so the reopen re-navigates to `hub`: A0 and the full menu, nothing set. Esc after "Yes" resumes mid-knot and runs A17, A18 and the `#set_global` on the next talk, which matches the viewer's answer. Esc during the try-next lines resumes and finishes them, then the choices; the `cake_servings` and `heard_exchange_cooler_chat` branches are evaluated with values synced at that reopen.
- **Reload in each act.** Morning: `met_ama` exported, A0 on re-talk; globals restore; A32/A7 gate reads the restored `kitchen_seen` and `heard_exchange_cooler_chat`. Midday: `cake_servings` restored from the server copy of the global and read both by `scanMagnets` and by the ink sync, so A11/A33 versus A34 stays right after a reload. Evening: the `room_entered:office` re-arm and the widened `npc_used:*` both tick `see_who_stays`. The "Not yet." blank-bubble check and the evening reload re-arm remain live-proof items in the :3094 handover.
- **`player_state` growth.** Nothing new grows: `cake_servings` is one bounded integer (0 to 2) already counted in V8, and `met_ama` is one boolean in `npcInkVariables`. No lists or logs are added; every write is a single-key change.
- **Teaching clarity.** Each system has one hint line from Ama, one board line and one task title. Apart from m3, the chain reads in order: coffee and queue, lever, mugs, cooler exchange, lunch and screens, cake, evening and motion lights, then the recap.
- **Magnet `perPerson` engine fix.** On another branch, not merged here and not reviewed. Dependency only: until it lands, one NPC can take both slices, which makes the "Two slices, then it's gone" bark and the "Put the cake out and watch it go" beat less clear but does not affect A34, since `cake_servings` still reaches 0. After it is merged in, re-run the lunch-then-cake beat (two eaters, two slices) on the merged tip.

## Counts and verdict

B 0, M 0, m 4.

R2: m1, m3, m4, m5, m6, m7 and m8 fixed; m2 fixed with a wording issue (m2 here); m9 rewritten into a new problem (m1 here). The `cake_servings` mirror really syncs: declared global, read on every conversation start, kept current by the shared global writer even while Ama's chat is open, and restored on reload.

Clean of blockers and majors. Before the voicing request, take m1 (one spoken line). m2, m3 and m4 are text-only and can go in the same commit. Live proof still owed by the :3094 run: the evening switch-off during Zainab's coffee walk, the "Not yet." return with no blank bubble, the board modal fit, and the evening reload re-arm.
