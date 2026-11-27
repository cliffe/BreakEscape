# demo_access_tour plan: review R2 (design and tour)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md at f641a104e (v2). Scope: the tour as a demo, stop order, short route, hub and objectives, event mappings against the engine, pacing. Server enforcement and sync belong to the other reviewer.

Counts: B 0, M 2, m 8, n 1

## R1 findings: resolution

| R1 | Status | Where in v2 | Note |
|---|---|---|---|
| M1 rota board mapping never fires | RESOLVED | 237, 180-182, 535 | Bare `object_interacted` with `data.objectName === 'Coffee rota'`, as test_needs_sims:590. urgentAt stated. Walk check added. |
| M2 hub sends full route to unplug early | RESOLVED | 246, 307-328, 276 | `tour_full` choice; F lines sit before W17; every task sets `done_<id>`. W11 is now keyed on a best-effort event (new m5). |
| M3 pivot source decides stop 17 | RESOLVED | 251-252, 270-272, 317, 520-521, 536, 545 | Pivot from Julian's desktop; both unplug routes tested. A new way into the same trap is M2 below. |
| M4 debrief not gated | RESOLVED | 295, 372-374 | `aimsCompleted` gate; the ink side of the gate is unstated (new m3). |
| M5 copied badge has no payoff on short route | RESOLVED | 255, 265, 284 | Comms door on the short route; t_comms required. |
| M6 kitchen and open-plan maps | RESOLVED | 126, 133, 135, 551-552 | room_qdc_break; desks by room dressing with a table fallback (C2). |
| M7 no lever for Yasmin | RESOLVED | 182, 235-239, 258 | Second rota mapping on Yasmin; her needs written out. |
| M8 stop 15 can stall | RESOLVED | 180, 267, 325 | Work nudge on `staff_twin_up`; W15. The laptop's work affordance is unstated (new m2). |
| M9 slice order | RESOLVED | 563-565 | Kit in slice 2; bare `ama_phone` with the capture mapping in slice 3. |
| m1 t_meet_ama tag | RESOLVED | 280, 304 | |
| m2 card name and sticky clone | RESOLVED | 169, 254, 283 | |
| m3 P1 suffixed event | RESOLVED | 352 | |
| m4 close B1 and B3 | RESOLVED | 56, 545 | |
| m5 magnet engine on main, `cake_servings` | RESOLVED | 77, 223, 230 | |
| m6 closing card is a music entry | RESOLVED | 295, 375 | |
| m7 double warning | RESOLVED | 373 | |
| m8 D3 wording | RESOLVED | 396 | t_comms is now required, so no branch needed. |
| m9 Delphine's line | RESOLVED | 403 | |
| m10 yasmin_pc note | RESOLVED | 194, 217 | |
| m11 lock fields on the object | RESOLVED | 167-168, 217 | |
| m12 onceOnly count | RESOLVED | 299, 451 | idempotent mappings dropped `onceOnly`. |
| m13 TTS test scope | RESOLVED | 494 | |
| m14 W6 assumes the file was taken | PARTIAL | 314, 340 | Keyed on `has_julian_rdp`, but `onPickup` also fires on Open (new m1). |
| m15 A1 and A4 wording | RESOLVED | 382, 385 | |
| m16 USB line not authorable | RESOLVED | 366 | |
| m17 pc8 and planters doubled | RESOLVED | 137, 553, 571 | Placed on other spots instead. The kitchen fridge has the same problem (n1). |
| m18 short-route backtracking | RESOLVED | 248, 265 | |
| m19 Ama mid-tour knot | RESOLVED | 305, 389 | |
| n1 `portSecurityMessage` | RESOLVED | 212 | |
| n2 P4 wording | RESOLVED | 355 | |
| n3 Julian's reason | RESOLVED | 407 | |
| n4 props square to walls | RESOLVED | 562 | |
| n5 presenter run sheet | RESOLVED | 567 | |

## Majors

### M1. The `julian_ended_by_unplug` condition never holds, so the debrief always gives D5b
2.10 (line 344) sets the global with `condition: (data.endedPcIds || []).includes("julian_pc")`. NPC eventMapping conditions go through `safeEvaluateCondition` (public/break_escape/js/systems/npc-manager.js:25-136), not `eval`. It takes `value`, `name`, `data.x`, `globalVars.x`, comparisons, `!` and `&&`. A term that starts with `(` or holds `||` matches none of its patterns, logs "unsupported condition term" and returns false (npc-manager.js:119-120). So D5a never plays, and the short-route pass condition in 4.6 ("the debrief gives D5a", line 534) fails on every run.
Evidence: npc-manager.js:91-96 already supports what is needed: `data.endedPcIds.includes('julian_pc')` tests array membership, and a missing `endedPcIds` resolves to undefined and gives false without throwing (npc-manager.js:44-52, 93-96).
Fix: `"condition": "data.endedPcIds.includes('julian_pc')"`. Add a line to 4.1 or slice 5: every mapping condition in the scenario uses only the forms listed at npc-manager.js:16-23.

### M2. Delphine's desktop offers Connect on julian.rdp, and following the sign-out advice then kills Julian's session
A takeable file on a sign-in desktop opens an Open / Copy / Move dialog, and a saved connection adds Connect (container-minigame.js:1681-1683, 2011-2021). Connect takes the file and connects from that desktop's PC: `from = this.sourcePcId`, so the route is `from: reception_pc` (container-minigame.js:2028-2056). That is the most natural click on a file called julian.rdp, and stop 5 (line 250) does not mention it.
What follows:
- t_julian_pc completes at once, so W5 (line 315, `not done_t_julian_pc`) and W6 never show.
- P0 fires 4 s later and says "Before you use that: sign out of Delphine's PC." The player has already used it. If they follow the advice, signing out of a pivot source ends the onward sessions (pc-sessions.js:795-800; the server returns them as `ended`), so Julian's session closes.
- Full route: stop 7's pivot needs Julian's desktop, which is gone. The hub's W7 still says "Julian's desktop can see further".
- At stop 17 Julian's session is already closed, so `julian_ended_by_unplug` stays false and D5b says "Julian's session stayed up when the box came out". That is untrue.
Fix:
1. Stop 5 and W4: "Copy it, don't Connect from here." Say in the run sheet that Connect on the desktop is the `from` route.
2. Record the route: a mapping on `pc_signed_in:julian_pc` with `"condition": "data.fromPcId"` sets `julian_via_desk` (pc-sessions.js:769-771, 958-964 put `fromPcId` on desktop-route sign-ins).
3. P0 gets `skipIfGlobal: "done_t_julian_pc"`, so it does not tell a player who has already connected to sign out.
4. D5 branches three ways: D5a (`julian_ended_by_unplug`); D5c (`julian_via_desk` and `front_desk_signed_out`), along the lines of "You connected to Julian's from Delphine's desk, so when you signed out there, his went too."; D5b otherwise.
5. 4.6: add a walk that Connects from the desktop and then signs out, and check D5c.

## Minors

m1. `has_julian_rdp` is set when the file is only opened. Open runs `handleObjectInteraction` (container-minigame.js:2088-2090), and for a `text_file` that applies `onRead || onPickup` (interactions.js:1907-1909). The credential is held only after a take (3.1 line 427). A player who opens the file and closes it gets W5 and then W6 ("Open your keyring and use Julian's saved connection"), with no keyring row. Fix: give the file `onRead: { setVariable: { seen_julian_rdp: true } }`. Read paths prefer `onRead`, and `onPickup` then applies only on a take (inventory.js:652-665). Declare the new global, or let W4 use it ("You've read it; now take a copy").

m2. thandiwe_laptop has no work affordance in 2.4 or 2.5. The work need picks a target from objects whose affordance satisfies it, preferring needsHome only when needsHome is one of those options (npc-needs.js:1786-1797). Without `affordance: { "satisfies": "work", ... }` on the laptop (precedent test_access_devices:264), the nudge sends her nowhere and `npc_used:thandiwe_laptop` (npc-needs.js:3684) never fires, so stops 15 and 16 stall. State the affordance in 2.5. While there, state the coffee station's `satisfies: "caffeine"` and capacity. This closes R1's "not checked" item: a completed use at the needsHome PC does emit `npc_used:<pcId>`, as long as the job is a `use` and not a `visit` (npc-needs.js:3586).

m3. The ink side of the debrief gate is unstated. 2.12 step 2 (line 372) says aim_wrap unlocks first and the mid-tour knot answers until then, but ink cannot read aim state (line 49). Name the ink condition: either the conjunction of the eight required `done_` globals, or two mappings on `objective_aim_completed:aim_office` and `objective_aim_completed:aim_network` (objectives-manager.js:1261-1267) setting `office_done` and `network_done`. Without that, the builder may gate only on `done_t_unplug`, and Ama would debrief before the comms door on a route that skipped it.

m4. Task status and optionality are not stated. Optionality is per task in the engine (objectives-manager.js:734-737, 1233-1237); an aim's `optional` is a separate schema field. The aim_around table lists tasks in the order 12, 13, 8, but the stops run 8, 12, 13. If a builder chains them with `unlockTask`, t_server_room waits on an absence beat. Fix in 2.8: every task in aim_office, aim_network, aim_around and aim_deeper has `status: "active"` and no unlock chain. Tasks in aim_around and aim_deeper carry `optional: true` as well as the aim. aim_wrap and t_debrief start `locked`.

m5. W11 holds the full-route hub on a best-effort event. W11 (line 321) shows while `not saw_in_use`, and `saw_in_use` needs `pc_in_use`, which fires only while Thandiwe sits at her desk. Her caffeine goes urgent about 15 minutes in (line 179). On the full route stop 11 comes at around minute 20, so she may be away. The player then gets the claim (stop 12) instead, and W11 keeps repeating, holding back W12 to W16 until she returns and the player clicks again. Fix: show W11 while `not saw_in_use and not done_t_open_session`.

m6. D5a's second sentence is often untrue on the short route. "The desks you'd sat at stayed signed in." By stop 17 on the short route the player has signed out of reception_pc (stop 5), and Thandiwe's return has ended the claim (stop 12). Fix: drop the sentence, or show it only when `tour_full` is true (stops 13 and 14 leave keyboard sessions).

m7. The route choice is one-shot. A5 sets `tour_full` once, in the timed briefing. A presenter who picks the quick version and later wants the extras never sees the F lines. Fix: Ama's mid-tour knot (M1, line 389) offers "Actually, show me the full walk-round" while `tour_full` is false. Also name the briefing's `skipIfGlobal` (line 164); `done_t_meet_ama` is the obvious one.

m8. Static NPCs and walk paths. Lorna stands "by the comms door" (line 169) and Julian stands in the kitchen beside the coffee station (line 221). C2 keeps the desks off door approach cells, but nothing does that for the NPCs. Lorna on the comms door's approach cell blocks stop 10. Julian on the coffee station's use or queue cell stalls the rota-board run that stops 12 and 13 rely on. Fix: add to C2: both static NPCs stand clear of every door approach cell and of the coffee station's `useFrom` cell and queue line.

## Nits

n1. room_qdc_break already has a fridge (line 133), and 2.5 adds `kitchen_fridge` as a scenario container (line 221). That doubles the fridge, as R1 m17 found at reception. Add it to C3: place the container on a clear counter spot (or use a small undercounter fridge sprite), not over the map's fridge.

## Checked and fine

- Suffixed events used by the plan all exist. network-links.js `_emit(name, data, id)` also fires `<name>:<id>` (network-links.js:163-171), which covers `network_foothold_gained:meeting_jack` (P2), `network_device_refused:managed_port` (P4, `reason: 'port_security'` at :438) and `network_device_unplugged:meeting_jack` (:595). pc-sessions.js `_emit` fires `<name>:<pcId>` (:328-333), which covers `pc_in_use:thandiwe_laptop` and `pc_signed_out:reception_pc`; the Sign out button's reason is `sign_out` (:795). `usb_refused:<objectId>` (interactions.js:1039). `object_interacted` is bare with `objectName` (interactions.js:861-866).
- `global_variable_changed:staff_twin_up` fires: the console writes `cloneGlobals` through `writeGlobal` (rogue-ap-minigame.js:22, 359), which emits it (global-writer.js:18, 194). `onPickup` on a take also emits it (inventory.js:664).
- `value === true`, `data.reason === "sign_out"`, `data.via === "implant"`, `data.cardName === "Lorna Easton FAC card"` and `data.objectName === 'Coffee rota'` are all forms the safe evaluator supports (npc-manager.js:100-110; both quote styles, :37-38).
- `unlockCondition.aimsCompleted` is supported and re-checked on each aim completion (objectives-manager.js:1044-1046, 1247-1256).
- Music conditions use a separate evaluator with `globalVars` in scope (scenario-music-events.js:38-57), so `globalVars.tour_debriefed === true` works, as in the lab (lab_physical_pentest:782-783).
- A locked pivot source extends no reach (network_access.rb:1268-1272), and a `from` session is pruned only when its source goes (:1378-1392), as section 1 says.
- Stop order after the renumbering is consistent: the stops table (244-263), the short route (265, 534), the task table's stop column (278-295) and the hub order W1 to W18 (311-328) agree. On the full route every F line comes before W17.
- Short route coherence: every required task (t_meet_ama, t_kit, t_front_desk, t_copy_badge, t_comms, t_drop_box, t_julian_pc, t_unplug) sits on a short-route stop, and none needs an NPC to move. Stops 11 and 12 are optional on both routes.

## Not checked

- Whether the server's `connect: true` flag on a desktop file can be switched off per file. If it can, that is a simpler fix for M2 than steering the presenter.
- Whether the scenario validator already flags conditions the safe evaluator cannot parse (M1).
- How the network view shows the stop 4 Finance refusal.
