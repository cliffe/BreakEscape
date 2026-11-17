# demo_access_tour plan: review R3 (design and tour, delta)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md at 3a1fae639 (v3). Scope: what changed since R2 (stop 18 and the debrief at 19, the short route, P5a and P5b, the Julian route globals and D5c, the cake in the inventory, the mid-tour route switch), every mapping condition against the safe evaluator, event names against the engine, and the two open items from R2. Server enforcement and sync belong to the other reviewer.

Counts: B 0, M 0, m 6, n 3

## R2 findings: resolution

| R2 | Status | Where in v3 | Note |
|---|---|---|---|
| M1 `julian_ended_by_unplug` never holds | RESOLVED | 394, 51-53, 539 | `data.endedPcIds.includes('julian_pc')` takes the array branch at npc-manager.js:91-96. Section 1 lists the supported forms. |
| M2 Connect on julian.rdp kills Julian's session | PARTIAL | 223, 277, 309, 358, 361, 389-391, 403, 412, 431, 458, 605, 647 | Copy is asked for; W6b and D5c handle a Connect; Declined explains why Connect stays. Two gaps: P0's `skipIfGlobal` is written where the engine ignores it (new m1), and `julian_lost_with_desk` is inferred, not observed (new m2). |
| m1 `has_julian_rdp` on Open | RESOLVED | 223, 358, 386 | `onRead` sets `seen_julian_rdp`; W4 uses it. |
| m2 laptop work affordance | RESOLVED | 242, 248, 96 | Work affordance on the laptop; coffee station's `satisfies` and capacity stated. |
| m3 ink side of the debrief gate | RESOLVED | 347, 429 | `wrap_open()` over the eight required `done_` globals. |
| m4 task status and optionality | RESOLVED | 319 | |
| m5 W11 held on a best-effort event | RESOLVED | 366 | The same pattern now holds W15 (new m5). |
| m6 D5a second sentence | RESOLVED | 457 | Full route only. |
| m7 route choice one-shot | RESOLVED | 182, 349, 448 | Mid-tour knot offers the switch; briefing guard named. It ends once `wrap_open()` is true (new m6). |
| m8 static NPCs on walk paths | RESOLVED | 153, 628, 637 | |
| n1 doubled fridge | RESOLVED | 151 | The tour adds no fridge. |

## The two open items

1. `skipIfGlobal` is honoured at delivery, inside `sendTimedMessage` only. The mapping config copies `msgConfig.skipIfGlobal` into the scheduled message (npc-manager.js:1712-1722, comment "checked at delivery, not at the event"). `_checkTimedMessages` calls `_deliverTimedMessage` once the trigger time passes (npc-manager.js:2495-2513), and that returns early without adding the message when `_skipGlobalSet(name)` is truthy (npc-manager.js:2540-2546, 1035-1041). The message is then marked delivered, so it never retries. A `skipIfGlobal` on the mapping itself is a different field: it goes to `config.skipIfGlobal` (npc-manager.js:1236) and is read only by the video-call path (npc-manager.js:1905-1926; schema 5129 says "video-call only"). See new m1.
2. The validator flags only part of the unsupported forms. `unsupported_condition_syntax` (scripts/validate_scenario.rb:6335-6343) raises an error for `||` or parentheses in an NPC eventMapping condition, with `.includes('...')` allowed (validate_scenario.rb:6469-6478). It does not catch `==`, `!=`, a method other than `includes`, arithmetic or bracket access, all of which the evaluator rejects as "unsupported condition term" and treats as false (npc-manager.js:100-118). See new n1.

## Delta checks that pass

- Every condition in the plan is a form the evaluator supports: `value === true` (403); `data.reason === "sign_out"` (388, double quotes parse at npc-manager.js:37-38); `data.fromPcId` as a bare truthy operand (389, npc-manager.js:113-115); the three-term `&&` at 390, each term a comparison, with `!== true` on a global; `globalVars.julian_lost_with_desk === true` (391); `data.endedPcIds.includes('julian_pc')` (394); `data.reason === "port_security"` (407); `globalVars.tour_full !== true` and `=== true` (408-409); `data.roomId !== 'open_plan'` (410); `globalVars.staff_twin_up === true` (298); `data.cardName === "Lorna Easton FAC card"` (326); `data.via === "implant"` (335); `data.objectName === 'Coffee rota'` (264).
- Every event name has an emit: `pc_signed_in` with `fromPcId` through `_remoteOf` (pc-sessions.js:771, 958-964); `pc_signed_out` with `reason: 'sign_out'` (pc-sessions.js:795); `magnet_placed:<id>` with `roomId` (npc-needs.js:863); `network_device_unplugged` with `endedPcIds` (network-links.js:595); `network_device_refused` with `reason: 'port_security'` (network-links.js:438); `network_foothold_gained` with `via` (network-links.js:461, 536); `card_cloned` (rfid-minigame.js:555); `pc_in_use` (pc-sessions.js:750). `pc_signed_in` also completes the `unlock_object` task client side at once (objectives-manager.js:362-366), and `onComplete.setGlobal` writes the `done_` global in the same call (objectives-manager.js:1138-1144), so P0's 4 s guard is in place by delivery on a normal desktop Connect.
- P5a and P5b: onceOnly is keyed per handler (`npc:pattern:index`, npc-manager.js:1262-1265), and a false condition returns before the count rises (npc-manager.js:1283-1300). The two never share a key, and the one whose condition fails stays armed. The same holds for P6 when the cake first goes down in the open plan.
- Stop 18 sits after the unplug, P5b sends the full route there, W18 follows W17 (372-373), and t_guest_port is optional, so the ending check lists it if the player goes to Ama first (430).
- Short route 1, 2, 3, 5, 6, 9, 10, 11, 12, 17, 19: every required task is on it, the hub lines it meets are W1 to W6 (W6b if needed), W9, W10, W11, W17 and W19 in stop order, and the only return trip is the unplug.
- The full-route switch is safe whenever it is offered: `wrap_open()` needs `done_t_unplug`, so the switch is never offered after the box is out, and W7 onward assume a box still in the jack.
- Cake: the plan copies the spec's item and pools at d7bc4cf95 (209), A3b names it (442), and the departures (caffeine and work needs) are stated with their cost (202-205), as the spec's own drift note allows.
- Counts: 17 tasks give 17 `done_` globals, plus 11 others, 28 (509); onceOnly mappings P0 to P6 (8) plus the capture and the nudge, 10 (512).

## Minors

### m1. P0's `skipIfGlobal` is written as a mapping field, where the engine ignores it
Evidence: the P0 row (403) puts `skipIfGlobal: "done_t_julian_pc"` in the event column next to the condition, and 399 gives the timed-text shape as `sendTimedMessage: { delay, message, targetKnot }` without it. A builder following the table writes it on the mapping. That is valid schema (schema 5129, the video-call field), so neither the schema nor the validator objects, but only the video-call path reads it (npc-manager.js:1236, 1905-1926). P0 then arrives after a desktop Connect and tells the player to sign out, which is the exact harm R2 M2 was about. Section 1 (line 48) has the right shape; the table and 399 do not.
Fix: in 399 write `sendTimedMessage: { delay, message, targetKnot, skipIfGlobal? }`, and in the P0 row move it into the text column: `sendTimedMessage: { "delay": 4000, "message": "...", "targetKnot": "hint_sign_out", "skipIfGlobal": "done_t_julian_pc" }`. Add to the desktop Connect walk (605): P0 never appears in the phone thread.

### m2. `julian_lost_with_desk` is inferred from a sign-out, not from Julian's session ending
Evidence: the mapping (390) fires on `pc_signed_out:reception_pc` and assumes Julian went too because `julian_via_desk` is set. The sign-out event fires before the server's ended list is handled (pc-sessions.js:795, then 798-800), and it carries no ended list. It is set wrongly when the player had already signed out of julian_pc, or when the logout request failed (pc-sessions.js:789-791 leave `ended` null). Then W6b says "Julian's session went when you signed out at the front desk" and D5c says the same, neither true. `julian_via_desk` is never cleared and `julian_back` blocks every later case: a second desk route, lost again, never shows W6b, and D5c still plays after a reconnect that went through a desk and survived the unplug.
The engine reports the real event: a session dropped as an onward route of a signed-out desk emits `pc_signed_out` for that PC with `reason: 'link_dropped'` and its `fromPcId` (pc-sessions.js:865-887, 958-964).
Fix: set `julian_lost_with_desk` from `pc_signed_out:julian_pc` with `"condition": "data.reason === 'link_dropped' && data.fromPcId === 'reception_pc'"` and `setGlobal: { julian_lost_with_desk: true, julian_back: false }`. Keep `julian_back` on `pc_signed_in:julian_pc` (391). `julian_via_desk` (389) then has no reader except the run sheet; drop it, or keep it for D5b's wording. A box-route session has no `fromPcId`, so an unplug never matches. Add the "sign out of julian_pc first, then the front desk" case to the desktop Connect walk (605): no W6b.

### m3. The plan never says which NPC carries the global and task mappings, and NPCs load per room
Evidence: 2.10 (388-394) and the task rows at 326, 330 and 335 say "mapping on `<event>`" with no holder. NPCs register, with their eventMappings, only when their room loads (npc-lazy-loader.js:37-60). The kitchen is not a stop on either route, so `julian` may never load on the short route, and the open plan loads only at stop 9. A builder who puts the `julian_*` mappings on `julian`, or the card mapping on `lorna` (her room loads before the clone, so that one works by luck), gets mappings that never fire; the short route's D5a then fails.
Fix: one line in 2.10: every mapping that sets a global or completes a task lives on `ama_phone`, which registers with reception at load. Only the rota board mappings (on thandiwe and yasmin, since `needs` acts on the holder) and the stop 15 nudge (thandiwe) sit elsewhere, and both fire after the open plan has loaded.

### m4. On the short route nothing names the sure lever for stop 12
Evidence: stop 12 is on the short route (284, 293), and the rota board is "the sure way". The short route never visits the kitchen, so S2 (417) is never seen. W12, which names the rota, is full route only (367). W11 hides as soon as `saw_in_use` is set (366), and the next short-route line is W17. P1 (404) says "give her a reason to get up" without saying what. The only named cue on the short route is A3b's cake (442), the best-effort one, and for Thandiwe the least reliable (260).
Fix: P1's text names the board: "She's signed in and sitting right there. Give it a minute, or read the coffee rota on the wall and watch her go." Optionally a non-F W11b while `saw_in_use and not done_t_open_session and not done_t_unplug` with the same pointer; it does not hold W17 for long because the board always works.

### m5. W15 holds the full-route hub, and with it the unplug line, on a best-effort event
Evidence: W15 (370) shows while `not done_t_capture_key`, and the capture rests on Thandiwe completing a use at her laptop after the nudge, which 3.1 lists as best-effort (499). If she is mid-job or slow, "Where next?" repeats W15, so W16, W17 (the unplug, a required task) and W18 never show. 4.6 (606) makes W17-after-W16 a pass condition. R2 m5 fixed the same pattern at W11.
Fix: W15's text adds the way on: "Give it a moment. Thandiwe's about to check her email. If she's busy, pull the box when you're ready: the Wi-Fi stops still work after." Or show W15 only while `not done_t_capture_key and not done_t_unplug` and let W17 follow W14 directly, with W15 and W16 then shown after W17 as F lines. The first is the smaller change.

### m6. After a short-route debrief, "I'll have another look round" leads nowhere
Evidence: on the short route `wrap_open()` becomes true at the unplug, so the mid-tour switch (M2, 448) is gone. D2's "I'll have another look round" (454) closes the conversation, the ending check lists the open optional tasks (430 says "that list points at the full route"), but the phone answers W19 "That's the lot" because `tour_full` is false, and most of the listed tasks (door controller, server room, implant) need the box back in and Julian reconnected, which no hub line covers.
Fix: say in 2.12 that the short route ends at the debrief. D2's look-round reply on the short route (`not tour_full`): "The box is out, so the network stops are done for today. The doors and desks are all still there if you want them." Change 430's last sentence to "On the short route that list shows what the full walk-round adds." No switch after the unplug.

## Nits

n1. 4.1 (539) lets the builder drop the condition grep "if the validator already checks this". It checks only `||` and parentheses (validate_scenario.rb:6335-6343, 6469-6478). Keep the grep and the check by eye for the other forms (`==`, `!=`, other methods, arithmetic, bracket access), and state that.

n2. Stop 10 (282) says "the ports come later, once the box is free", but stop 10 is on the short route, where they never come. Add "(full route, stop 18)".

n3. P6 (410) is a onceOnly timed text. The spec's guard is a bark with a cooldown and no onceOnly (CAKE_ITEM.md at d7bc4cf95, "Optional guard bark"), and line 205 says everything else is the spec as written. With onceOnly, a second wrong drop (reception, then the kitchen) gets no text, and V8 counts one more office-life onceOnly (514). Either take the spec's form (`cooldown`, no onceOnly; V8 count 2) or say at 205 that P6 departs from it and why.

## Not checked

- Server side of the stop 18 plants and the re-entry to the comms cupboard with the clone (the other reviewer).
- Whether ink's `wrap_open()` and the hub read the `done_` globals before the first sync after a task completes; `onComplete.setGlobal` broadcasts the change at once (objectives-manager.js:1141-1144), so this looks fine but was not traced into the ink bridge.
