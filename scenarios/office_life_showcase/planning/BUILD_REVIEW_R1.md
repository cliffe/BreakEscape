# office_life_showcase: build review R1

Reviewed at `0600a22fa` (branch `plan/ol-showcase`, S1 to S5 built, main merged). Sources: `planning/PLAN.md` (source of truth), `planning/BUILD_REPORT.md`, `scenario.json.erb`, `ink/*.ink`, and `git diff main -- public/break_escape/js scripts test/js docs` (the `exchanges[].topic` change). Engine code was read only where a finding depends on it. No live run in this round; times quoted are from the build report.

Severity: B blocker (a task or the tour can stall in a common path), M major (wrong against the plan, or a teaching beat that misleads or can be lost), m minor.

## Blockers

### B1. The evening task stalls when Zainab is away from her post at the turn

`scenario.json.erb:390` (Zainab, delayed `caffeine 10`) and `:251` (Ama, `npc_left_post:zainab_hussain` ticks `see_who_stays`).

The only evening task ticks on a fresh leave from post. `_leavePost` emits `npc_left_post` only when `s.atPost` is true (`systems/npc-needs.js:3284-3291`). Zainab is coupled into every office coffee queue (`:388`), so for roughly 50 s of each 145 s coffee cycle (leave at about 0:51, use ends about 1:30, home about 1:40 in the S2 timings) she is walking, queued, using or walking home. If the 8 s caffeine set lands then:
- mid-walk or queued: her current job carries on, the use ends and restores 70 over the 10, she walks home at about 80;
- walking home: the selector runs for `returning` NPCs (`:1522-1525`), so she goes straight back to the coffee with no leave.

Either way no `npc_left_post` fires after `act_evening`. Her next leave is thirst at 2 a minute (urgent at 30), about 25 minutes later. The viewer has no lever that helps: the four others are hidden, so nobody else can queue and re-fire her coupling. The measured run turned the evening at about 355 s; the third coffee run is due near 6:10, so this is a live risk on the guided path, roughly one run in three. T18 and R5 only proved the turn with her at her desk.

Failure: viewer calls "Call it a day." while Chidi, Jun and Zainab are on a coffee run; Zainab barks B10, has her coffee (or already had it), and "See who stays late" never ticks during the tour.

Fix: tick the task on her use instead of (or as well as) her leave. Add to Ama:
`{ "eventPattern": "npc_used:office_coffee", "condition": "data.npcId === 'zainab_hussain' && globalVars.act_evening === true", "cooldown": 0, "completeTask": "see_who_stays" }`
(`npc_used:<target>` carries `npcId`, `npc-needs.js:3701-3702`; no onceOnly needed, `completeTask` returns early once done). Keep the `npc_left_post` mapping for the common case. Re-prove T18 with the turn forced while she is queued, and while she is walking home.

## Majors

### M1. Ama replays her opening after every conversation that ended

`ink/ama_owusu.ink:22-27` (`start`), with `-> END` at `:88`, `:98`, `:121`.

The build report (S5 m1) logged this as minor. It is the most common way back into Ama: "I'll have a look round." ends with `-> END`, and so do lunch and "Call it a day.". The next talk restarts at `start` and says A1 and A2 again: "Today you watch an office instead of breaking into one. ... Start with the coffee machine." At midday or in the evening that second line points the viewer at the wrong beat, and the planned reopen line A0 ("What can I help with?") is never heard after an exit, only after Esc.

Fix: guard `start` with an ink-local VAR, the m01 Maya pattern (`m01_npc_maya.ink`, `met_maya`, carried in `npcInkVariables`):
```
VAR met_ama = false
=== start ===
{ met_ama: -> hub }
~ met_ama = true
# speaker:npc
Today you watch an office instead of breaking into one.
...
```
Divert to `hub` (not `hub.choices`) so A0 plays. No new spoken line. Update PLAN section 8, `npcInkVariables` row, from 0 to 1 boolean. Prove: exit with "I'll have a look round.", reopen, hear A0; reload, reopen, hear A0.

### M2. "Call it a day." loses every unticked day task, with no warning

`ink/ama_owusu.ink:90-98`; hide mappings at `scenario.json.erb:278`, `:308`, `:338`, `:364`.

The evening turn hides Chidi, Jun, Graham and Agnieszka and cannot be undone. After it, `see_queue` and `hear_queue_chat` need two people at the coffee, `hear_cooler_exchange` needs Graham and Agnieszka, `see_caught` and `use_open_screen` need Jun to leave and return, and `see_cake_eaten` needs someone with hunger or social (Zainab has neither, `:383-386`). The choice is gated only on `act_midday`. A viewer who skips the cake, or who missed the cooler, calls the evening and is left with unticked tasks and no way back short of a new game. The tour has no ending, so the objectives panel stays incomplete for good. The mission-ending convention (warn before the irreversible step and let the player finish up first) applies here in spirit.

Fix (cheapest, no new globals): make "Call it a day." ask first.
```
+ { act_midday and not act_evening } [Call it a day.]
    # speaker:npc
    Once they go home, they're gone for the day. Ready?
    + + [Yes, call it a day.]
        (A17, A18, #set_global, exit as now)
    + + [Not yet.]
        -> choices
```
One new Ama line (49 characters, 9 words; add to PLAN 7a and the lines check). A fuller fix declares a `day_tasks_done` style global set from the task mappings and only asks when something is still open; the plain warning is enough for a tour. Also say in the Evening aim's description that the day's people will have gone.

### M3. Kitchen meal values differ from the plan, and the cake was re-tuned around the drift

`scenario.json.erb:406-421` (fridge, microwave with no affordance), `:48` (`tempt 45`); PLAN section 2 line 35 and row 2.7 (line 128); `CAKE_ITEM.md:10`, `:66`.

PLAN gives the fridge and microwave `restores 40`, so the lunch eaters come back at 60 and all four sit in the cake's tempt band. The build leaves both on the presets (`data/office-presets.json:8-9`: fridge 80, microwave 60). That is why the natural run had Jun at 98.3 and Chidi at 77.9, and why only two were tempted until S3 raised `tempt` from 30 to 45. PLAN row 2.7 still says "tempt band at or below 70 ... all four are tempted", and CAKE_ITEM still gives `tempt 30` and `announce news_cake`. The re-tune has side effects the plan does not cover: with the band at 40 to 85, a cake dropped at any time in the morning tempts Graham at once (social 72 at spawn, the cake satisfies social) and everyone else by about 1:15 (hunger 90 decaying 4 to 5 a minute). The cake starts in the inventory with an observation telling the viewer how to drop it, so the midday beat can be spent in the first minute and A11 ("drop the cake ... here in the office") then points at nothing.

Fix: build what the plan says. Add `"affordance": { "restores": 40 }` to `fridge` and `microwave`, set `tempt` back to 30, and re-run the natural lunch-then-cake beat (expect four tempted, up to two "Missed it."). If the 45 is kept instead, rewrite PLAN row 2.7, section 2 and CAKE_ITEM to the built values and record the morning-drop behaviour as accepted. Either way the plan and the build must agree.

### M4. The "Things to try" notice board is missing

PLAN section 2, line 32 (`tour_notice`, `notice_board1`, wall-mounted, readable "Things to try", at (8.1875, 0.6875)); not in `scenario.json.erb` office objects (`:101-221`), not mentioned in the build report.

The board is the tour's second route to the hints: a viewer who does not talk to Ama, or who has forgotten what she said, has nothing to read. It is a planned teaching object, so its absence is a gap against the plan, not a polish item.

Fix: add the object as planned, with its text giving the same steps as Ama's "What should I try next?" for all three acts (morning, midday, evening, in Ama's order, mugs before kitchen). Readable text is not voiced. Render the back wall to check it clears the right-hand chalkboard (ends x 7.82). If the board was dropped on purpose, take it out of PLAN with the reason.

## Minors

### m1. The lever window is short, and an early switch-off gives no hint why nothing happened

`scenario.json.erb:196` (switch-off hint), `:240` (B3); PLAN row 1.9.

`see_coffee_off` needs someone walking to or queued at the office machine: about 25 to 30 s per 145 s cycle (S2 run D: Chidi leaves 50.8, Zainab's use starts near 78). The full run caught the first window at 57 s, but a viewer who switches off outside it sees nothing, and while the machine is off no queue forms, so they must also know to switch it back on and wait. Fix: change the switch-off hint (UI text, not voiced) to "The coffee machine is switched off at the wall. Anyone on their way to it turns back." and the switch-on hint to "...switched on at the wall. The next coffee run comes here again." Optionally reword B2 (first queue, before voicing) to "Look, a queue. Now try the wall socket." (39 characters).

### m2. Double bark logs: a recorder artefact, but the probes should count renders

BUILD_REPORT S2 observations, S3 m4, S4 m3, S5 m2.

`showBark` is entered twice for a held bark: once when it is deferred (pushed to `deferredBarkQueue`, returns null) and again when the queue drains it (`systems/npc-barks.js:250-256`); while a release is in progress even a fresh bark goes through the queue and back at the same timestamp. That explains both patterns seen: same clock (B2, B3, B8, B10) and 4 to 5 s later (B7, B9, after a panel or a voiced bark held them). The player sees one bubble. Fix (harness only): have the bark recorder log the bubble render (or the non-null return of `showBark`), not the call, so a real replay would show up. No scenario change.

### m3. "Missed it." on Agnieszka not recorded as a speak

BUILD_REPORT line 239 (game 7579).

The same line recorded as a speak for Chidi in 7580 and 7583, so the pool and voicing path are fine; the 7579 bubble was most likely shown without a voice turn (out of earshot or under the chat voice lock). Accept for now; after voicing, the live check should confirm the line is voiced on whoever turns back with the viewer in earshot.

### m4. Picture-only word of mouth after a kitchen cake drop

BUILD_REPORT line 237 (game 7580).

With `news_cake` removed, a cake dropped in the kitchen with staff present still fires the engine's default `news` announce as a picture bubble with no line. It is honest (it shows word of mouth happening) and the tour tells the viewer to drop in the office. Accept; add one sentence to PLAN 7e saying a kitchen drop shows the picture only.

### m5. The evening lamp reads cream, not warm

`scenario.json.erb:97` (`"color": "#ffd9a0", "radius": 70, "intensity": 0.8`).

S4 m2 and the lamp clip confirm it blends with the white object glows on the other desks, so the one "someone stayed late" cue is easy to miss. Fix: a clearly amber colour such as `#ffaa55`, intensity 1.0, radius 56 to 64 so it stays on Zainab's end of the desk; re-render `s4-D-lamp-clip.png` against `s4-E-office-before.png`.

### m6. V6 counts 156 clips; the voicing request should give the real number

BUILD_REPORT S5 (V6: Ama 31, Chidi 24, Jun 25, Graham 27, Agnieszka 26, Zainab 23).

V6 counts every shared pool line once per speaker who could in principle use it. Several speakers cannot reach some pools in this tour: Zainab chats with nobody (no coffee, cooler or cake lines; only Z1 to Z5, B10 and `grumble_off`), Graham and Agnieszka never queue for coffee here, Chidi and Jun have no thirst or social and never meet at the cooler, and Zainab has no hunger, so she never says `grumble_gone` or a cake line. Voicing all 156 wastes clips. Fix: when asking for the voicing yes, give V6's 156, the plan's 105 distinct lines, and a reachable per-speaker count; voice only the reachable set.

### m7. The validator does not check `exchanges[].topic`

`scripts/validate_npc_needs.rb:874` (`check_exchanges`); engine `systems/npc-needs.js:3004`.

A topic that names no chatter pool any shared object uses (a typo such as `"Cooler"`, or `"water_cooler"` for the object id) makes the exchange silently unplayable; nothing warns. Fix: in `check_exchanges`, warn when `topic` is set and no object with that affordance `chatter` (scenario or preset) is reachable by both NPCs, and when it is not a string; add a validator test beside the three engine tests in `test/js/npc-exchange-heard.test.mjs`.

### m8. PLAN does not record the engine change or the `topic` field

PLAN line 9 ("Only existing engine features; anything needing an engine change is in section 14"), line 163 (exchange declared without `topic`), section 14.

The build added `exchanges[].topic` (S3 fix for the exchange firing at the cake) and uses it at `scenario.json.erb:334`. Fix: PLAN section 1 and 6 name the engine change and the field, with the reason; section 14 stays for changes not made.

### m9. A reload in the 8 s after the evening turn loses Zainab's coffee

`scenario.json.erb:390`.

The delayed mapping is not re-armed on reload, and needs reset to `initial` (caffeine 95, decay 1 a minute), so `see_who_stays` then waits on her thirst, about 30 minutes. The window is narrow. Fix: add on Zainab `{ "eventPattern": "room_entered:office", "condition": "globalVars.act_evening === true", "cooldown": 60000, "needs": { "set": { "caffeine": 10 } } }` (spawn after a reload fires `room_entered`), or accept it and note it in PLAN section 9.

## Known items judged with no finding

- Chidi passes 7 to 9 px from Ama on the east lane: planned (PLAN section 2), Ama is `immovable`, and S1 measured the first coffee walk with no stall or overlap. Accept.
- Magnet servings `perPerson` bypass: the fix is in progress on another branch. Dependency only: once it lands on main, re-run the natural cake beat (two servings, two different eaters, B7) on the merged tip. Not reviewed here.
- Esc mid-conversation: the S5 run shows Esc mid-hub reopens at A0. If Esc lands during A16/A30 or A17/A18 before the `#set_global` runs, the global stays false and the choice is offered again on reopen (globals sync into the ink at conversation start), so nothing is stranded.
- Beats out of order: `use_open_screen`, `see_caught`, `see_queue`, `hear_queue_chat` and `see_coffee_off` can tick in any act; B5 and B4 are gated on `act_midday`; all aims are visible from the start. Fine, apart from M2 and M3's morning cake.
- Reload in each act: T21 proves globals, visibility and lighting persist; needs reset is accepted in PLAN (R6). See m9 for the one gap.
- Hidden NPCs: T17 and T20 show no drawn image and no held capacity.
- `onceOnly` sharing: B2 and B3 share their mapping with a task that completes once anyway; every other task mapping has no `onceOnly`. V8 office-life onceOnly count 8 of 10.
- Globals: all nine are declared (`:26-36`); the ink mirrors six, all declared. `cake_servings` is engine-written and bounded.
- Spoken lines: all in ink, `bark` fields or `chatter` pools; the S5 lines check matches PLAN word for word with caps. Socket hints and observations are UI text. The em dashes in the `voice.style` strings are the house TTS prompt template, not displayed text.
- Secrets: no PIN, password or card on any office-life object; Jun's PC shows nothing secret.
- `player_state`: every key is a declared boolean or a bounded integer sent as a delta; `npcVisibility` four booleans written once. M1's fix adds one ink boolean.
- Open ending: no aim has `missionConclusion`, no `music` block, no `#ending_check`; T23 shows `in_progress`, no credits, and the recap A28 reads as a clean close.
- Pacing: 6.5 minutes against a 5 to 10 target. The two waits (about 2 minutes for the cooler, about 1:50 for all four to sit before the cake) are covered by Ama's hints.

## Engine change: `exchanges[].topic`

`systems/npc-needs.js:3004` adds `if (e.topic !== undefined && e.topic !== topic) continue;` and `:4466` passes `c.topic` (the object's affordance `chatter`, set at `:4428`). An entry with no `topic` takes the old path unchanged, so m01, m02, m03, m05 and the other scenarios that declare `exchanges` behave as before. A skipped entry falls through to the existing pending or null logic, which is right: a meeting's topic does not change mid-meeting. Schema (`scripts/scenario-schema.json`, `exchanges.items.properties.topic`, string, minLength 1) and `docs/achitechture/NPC_NEEDS_SYSTEM.md:688` document it. The three unit tests cover match, mismatch and absent. The S3 fix live proof shows the exchange at the cooler and not at the cake. Only gap: m7 (validator).

## Counts and verdict

B 1, M 4, m 9.

Not clean. Fix B1 and M1 to M4, re-prove T18 with the turn forced during a coffee run, the reopen after an exit, the "Call it a day." confirmation, the natural lunch-then-cake beat and a back-wall render with the notice board, then run R2 on the merged tip.
