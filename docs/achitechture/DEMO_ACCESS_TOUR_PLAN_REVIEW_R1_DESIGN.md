# demo_access_tour plan: review R1 (design and tour)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md at 9d55dd353. Scope: the tour as a demo, solvability against the engine, design rules, host and sign lines, build slices. Server enforcement and sync are covered by the other R1 reviewer.

Counts: B 0, M 9, m 19, n 5

## Build checks the plan left open, now answered

- B1 (remote sign-in completes `unlock_object` julian_pc): yes on both sides. Client: objectives-manager.js:362-365 skips only `relay` and `token`. Server: `start_login_session!` adds the PC to `signedInPcs` for any sign-in that is not a relay or a token (app/models/break_escape/game.rb:4321-4326). A saved_connection is neither. The eventMapping fallback is not needed.
- B3 (claim completes `unlock_object` thandiwe_laptop): the same `start_login_session!` records a claim too (game.rb:4305 treats `via == 'claim'` only for the guest rule). Still worth seeing in the scripted walk.
- B4 (`pc_in_use` field): `{ pcId, ownerId, signedInBefore }` (pc-sessions.js:65, 750), and `_emit` also fires `pc_in_use:<pcId>` (pc-sessions.js:328-333). See m3.
- B5 is partly wrong: the magnet engine is on main (npc-needs.js:842-863, `magnet_placed`; schema 3981). Only the CAKE_ITEM.md numbers are unreviewed. See m5.

## Majors

### M1. The rota board mapping never fires
2.6 gives Thandiwe `object_interacted:rota_board`. `object_interacted` is emitted only in its bare form, with `{ objectType, objectName, roomId }` and no object id (interactions.js:862-867). There is no `:rota_board` suffix, so the cake fallback is dead. The precedent the plan cites does it differently: `"eventPattern": "object_interacted", "condition": "data.objectName === 'Activity Board'"` (test_needs_sims:590).
Fix: `"eventPattern": "object_interacted", "condition": "data.objectName === 'Coffee rota'"` (the board's `name`, unique in the scenario), `cooldown: 30000`, `needs: { set: { caffeine: 10 } }`. State Thandiwe's caffeine `urgentAt` so 10 is below it. Add a scripted-walk check that reading the board sends her to the kitchen within N seconds.

### M2. "Where next?" sends a full-route presenter to unplug before the extras
2.13 says "first unmet wins", and W7 ("pull the box out") comes before W8 (the full-route extras). On the full route, once stop 10 is done the hub says to unplug, which ends Julian's session and the pivot before stops 11, 12 and 14 to 16 have been shown. W4 has the same problem: it is keyed on the optional t_open_session, so a presenter who skips the open session is stuck on W4 and never gets W5.
Fix: Ama's briefing ends with a choice ("The quick version or the full walk-round?") that sets `tour_full`. The hub runs the short list, and when `tour_full` is true it puts W8's stops (one line each, not one combined line) before W7. Key W4 on "has seen `pc_in_use`" or on stop 9's foothold, not on the optional task. Say in 2.9 that every task gets an `onComplete.setGlobal` (objectives-manager.js:1138-1141), because ink cannot read task state. There is no ink external function for it, only globals.

### M3. Which session the pivot comes from decides whether stop 17 works
4.6 expects `endedPcIds` to list julian_pc and door_controller. The server ends only sessions whose `foothold` is the unplugged one (network_access.rb:410-414). A `from` session is ended only if its source session goes (`from_session_pruned?`, network_access.rb:1378-1392). Stop 12 says "From a session on office_lan". If the presenter pivots from Delphine's keyboard session on reception_pc (the most obvious session they hold), door_controller survives the unplug and D5 is wrong. On the full route the presenter may also reconnect to julian_pc after stops 14 or 16 (the session was locked with K-lock at stop 10, say). The new session can then ride the implant or the Staff Wi-Fi foothold (credential_keyring.rb:450 lists every reaching foothold) and survive too.
Fix: Stop 12 and its "Where next?" line say to pivot from Julian's desktop. The stop 17 text and D5 should say what was opened through the box rather than state that both always end. 4.6 should prove the pivot-from-reception_pc case as well (door_controller stays), since a presenter will hit it.

### M4. The debrief is not gated, so the presenter can end early and Ama states what did not happen
2.12 has no `unlockCondition` on the wrap-up aim and no ink gate. A presenter who walks back to Ama before unplugging gets D4 and D5 ("when the box came out...") as facts. README_scenario_design.md:2934 and the "debrief lines match what the player did" rule apply. Lab precedent: the debrief aim has `unlockCondition.aimsCompleted` and the ink holds back the wrap-up choice until the required globals are set (lab_physical_pentest:780-800 comment).
Fix: give "Wrap up" `unlockCondition: { aimsCompleted: ["office", "network"] }`. Ama's in-person knot, before that, says what is still open (reuse the hub's state). Branch D3 to D5 on what was done (M8 below covers D3).

### M5. Short route: the copied badge has no payoff
t_copy_badge is required and on the short route (stop 4). The only places the clone pays off are stop 5 (comms cupboard) and stop 12 (door controller, via Lorna's password), and both are full-route only. A colleague on the 15-minute route sees a card copied and never used, and the debrief line about "only checked the card" points at nothing they saw.
Fix: put a one-minute version of stop 5 on the short route. The comms cupboard is next to Lorna, so this is: open the door with the copy and stop. The port refusal and patch panel stay full-route. Make t_comms required and move it to "The office". It fits V5 (the clone comes from a conversation, not office life). The alternative is to make the badge optional on the short route, but then stop 4 should leave it.

### M6. The kitchen and open-plan maps do not fit the stops
- room_break (kitchen) has no coffee machine, kettle, fridge or counter. Its unconditional Tiled objects are four small desks, four bookcases, two sofas and eight waiting chairs, with safes and bags as conditional items. The "coffee machine preset" and a kitchen sign would sit in a lounge.
- room_aw_merrin_sallow (open plan) has one conference table, six studio chairs, a kiosk and a plan chest. It has no "studio desk", "finance desk" or "Lorna's desk by the comms door" (2.4, 2.5). Two seated needs NPCs with their own PCs need two distinct seats at the table or proper desks.
Fix: use a kitchen map that has machines. room_qdc_break has a fridge, an undercounter fridge, a vending machine and a kettle. room_lw_kitchen has a kettle. Both are 10x10, so the grid and door corners do not change. For the open plan, either seat Thandiwe and Yasmin at opposite ends of the table and say so in 2.5, or add a room-dressing step to slice 1 (mission-room-dressing skill) for two desks set square to the walls. Name the seat for each needs NPC (needsHome and its chair) in 2.5.

### M7. Stop 8 has no lever for Yasmin
Yasmin's PC shows `pc_in_use` while she sits (workstation-state.js:625-626; presence is `atPost`, :673-676). The padlock beat needs her away. Her only lever is the cake, and the cake is eaten at stop 7: 2 servings, 1 each (2.6), and both she and Thandiwe are in the open plan and see it. On the full route, stop 8 comes later with nothing left to move her, and 2.4 gives no numbers for her other needs.
Fix: either make stop 8 run during stop 7 ("while they're both at the cake, try Yasmin's screen", with a W line and P1 saying so), or give the rota board a second mapping on Yasmin (`needs.set` on a need she has, with the same cooldown). Write her needs and their `urgentAt` and decay in 2.4.

### M8. Stop 15 can leave the presenter waiting with no end in sight
The capture fires on `npc_used:thandiwe_laptop` (README 1125-1131), which is a completed needs job at the laptop (npc-needs.js:3684). When that next happens depends on Thandiwe's work need, which the plan does not size. Stop 16 depends on stop 15's key, so both stall together.
Fix: after the console sets the twin global, an eventMapping on Thandiwe (`global_variable_changed:<twin global>`, `value === true`, `onceOnly`) sets her work need low (`needs: { set: { work: <below urgentAt> } }`). She uses the laptop within seconds. Add a P6 text ("Give it a moment, Thandiwe's about to check her email") or fold it into the hub. Verify in the scripted walk that `npc_used:thandiwe_laptop` fires for a work use at the needsHome PC. I did not check that path.

### M9. Slice order: slice 2 cannot prove its stops
Slice 2 "proves on the server" stops 2, 4, 9, 10, 16 and 17. But the cloner (stop 4), `kit_dropbox` (stops 9, 10, 17) and the kit table are in slice 3. Stop 16 needs the key captured at stop 15 (slice 3, and the capture mapping is on `ama_phone`, slice 5). The psk is a per-game render, so nothing else gives it. Slice 2 also "settles B1", which needs tasks, and tasks are slice 5. B1 is answered above anyway.
Fix: move the kit table items (`rfid_cloner`, `kit_dropbox`, `visitor_card`) into slice 2. Move stop 16 to slice 5, after the capture mapping exists. Or slice 3 proves stop 16 with a test-only global, and the real path is proved in slice 6. Put a bare `ama_phone` (no ink, mappings only) in slice 3 so the capture can be proved there.

## Minors

m1. t_meet_ama is `npc_conversation`, which has no engine handler. It completes only on a `#complete_task:t_meet_ama` tag in Ama's ink (the validator errors without it, scripts/validate_scenario.rb:1615-1665). State the tag in 2.8 and 2.9.

m2. Lorna's card: `card_cloned` carries `cardName: cardData.name` (rfid-minigame.js:555-559), and `#clone_keycard:<card_id>` builds that name from the NPC card's `name` (chat-helpers.js:366-402). There is no `cardName` field. Write `creds.card.name: "Lorna Easton FAC card"` and the tag with its card id. Without the cloner the tag only shows a warning (chat-helpers.js:378-386), so make the clone choice sticky (`+`) or the presenter who talks to Lorna before the kit loses it.

m3. P1: use `eventPattern: "pc_in_use:thandiwe_laptop"` and drop the condition (B4 above).

m4. Close B1 and B3 in 4.7 with the game.rb:4321-4326 reference, and keep only the walk check.

m5. B5: the magnet engine is on main. The open point is the CAKE_ITEM.md numbers, not whether the cake can be built. Note that with the default `tempt` of 30 and `urgentAt` 30, hunger counts at 60 or below (schema 3981 `magnet.tempt`), so the start of 50 tempts at once. That is what 2.6 wants. Declare `cake_servings: 2` in `globalVariables`.

m6. The closing card is not an eventMapping. In the lab it is a `music` event entry (`trigger: "conversation_closed:ruth_debrief"`, `condition`, `closingCard`, `credits`; lab_physical_pentest:773, 780-800). Reword 2.12 step 4. Name the wrap-up aim's `conclusionScreen` (the validator warns without one, README 2556).

m7. Two warnings: D1 is an ink warning, and `#ending_check` then shows the engine's own "Before the mission ends" panel, which lists the open optional tasks (ending-check.js:1-30). On the short route that is eight tasks, which is a good way to point at the full route, but the presenter is asked twice. Drop D1 and let D2's "I'm done, let's talk." carry `#ending_check` in its brackets. Or keep D1 as a plain line with no choice of its own.

m8. D3 does not match the model. Both RFID doors check the card only, and a clone carries its owner's identity (rfid-minigame.js:551). The partner door held because nobody copied Julian's card, not because it "checked who you were". Suggested: "The doors only ever checked the card. Copy the right one and you're that person, as far as the reader's concerned." Branch D3 on `t_comms` (or on the M5 change) so it refers to something the player did.

m9. Delphine's line is out of character. VOICE_CAST.md:111 has her "poised and polite under a little pressure", the receptionist who resists a pretext in e12. "Love" belongs to Lorna's Lancashire register, and offering the password contradicts the course. Let the sticky note speak for itself: "Visitors sign in on the tablet by the door. This screen's staff only." The note on the screen is then the joke.

m10. yasmin_pc has both `habits.writesDown` (2.4) and `postitNote`/`showPostit` (2.5). An authored `postitNote` is a plain password in the object (test_access_networks:740) and the validator warns on a writes-down over an authored note (README 1357). Use `habits.writesDown` only, as for Delphine.

m11. `habits.locksScreenOnLeave` is not a habit key. The habit is `locksScreen` (`never`/`sometimes`/`always`) or `screen.lockChance` (schema 4413-4419). `locksScreenOnLeave` and `lockChance` are object fields (schema 5486-5487), so strict keys will refuse the plan's spelling. Put `lockChance: 0` on thandiwe_laptop and `locksScreenOnLeave: true` on yasmin_pc (that is the default anyway), and say "on the object" in 2.4.

m12. The onceOnly count in 3.2 is 9, not "at most 8": 5 texts, card, implant, capture, plus t_unplug's mapping (2.8). That is still under 10. M8's work-need mapping makes 10, which is at the cap. The builder should check whether V8 counts non-office-life mappings before adding it, or drop `onceOnly` on texts guarded by `skipIfGlobal`.

m13. tts_mission_lines_test.rb does not pick the demo up. Its `MISSIONS` regex matches only m01 to m10 and lab_physical_pentest (tts_mission_lines_test.rb:18). Remove it from 1 and 4.3, or say it will cover the demo only if the user later asks for voicing.

m14. W6 ("You took a file off Delphine's desktop") assumes the file was taken. Branch on whether the `julian_rdp` credential is held (a global set by an `onPickup` `setVariable` on the file), or reword: "Delphine's desktop had a saved connection on it. Take it, then open your keyring."

m15. A1 says "for the next half hour", which is wrong on the short route. "for the next little while" works on both. A4's "I'll text when I see something" sits oddly with Ama staying in reception. "I'll text if I think of anything" fits better.

m16. S7 is not authorable. The refusal line comes from the policy kind ("USB storage is disabled on this PC.", network_access.rb `USB_REFUSAL_LINES`, and its client copy in pc-policy.js). Drop S7 from the sign list or quote the engine text. The plan's wording differs.

m17. The lobby map already has a `pc8` on its table layer and two `planter_fig1` as plain Tiled items. A scenario `reception_pc` and two hideable plants would double them up. Place the scenario objects on those spots and remove the Tiled duplicates in the room-dressing step, or use conditional items.

m18. Short-route backtracking: kit (meeting room), then front desk, open plan, kitchen, open plan, back to the meeting room to plug in, then unplug there. If W1 says to plug the box in while collecting the kit (stop 9 moved to straight after stop 2), the remote connection can happen at the front desk as soon as `julian.rdp` is taken, and the only return trip is the unplug. That saves one walk across reception on a 15-minute clock. Stop 10's text (P2) still works.

m19. Ama in person between briefing and debrief has no knot. A presenter who walks up to her mid-tour should get a short line that points to the phone (or the same hub). Say so in 2.9.

## Nits

n1. The port refusal field is `portSecurityMessage` (README 1024, 1138), not a "refusal message". The default text already says unused ports should be disabled, and S6 is a good replacement.

n2. P4 "Try one nobody's watching" points at the patch panel, whose guest port gives only guest. That is fine for the contrast, but "Try the patch panel, see where its spare port goes" says what the stop is for.

n3. Julian "working from the kitchen today" is a little contrived for a mid-60s founding partner (VOICE_CAST.md:106). Give a reason in his line: "My office is being rewired, so I'm in here with the kettle. Not that you'd get in."

n4. Props: the rota board, the signs and the kit table should be square to the walls (props-orthogonal rule). Put that in the slice 1 checklist.

n5. A one-page presenter run sheet (stop order, the one sentence to say at each stop, the expected on-screen result) would help colleagues who drive it once. It could live next to the plan and is cheap to write after slice 6.

## Checked and fine

- Events the plan relies on exist as named: `card_cloned` (rfid-minigame.js:555), `network_foothold_gained` with `via` (network-links.js:461, 536, 656; implant via is `'implant'`, network_access.rb:527), `network_device_refused` with `reason: 'port_security'` (network-links.js:438), `network_device_unplugged` with `endedPcIds` (:595), `usb_refused:<objectId>` (interactions.js:1039), `pc_in_use` (pc-sessions.js:750).
- An implant meets no `unlock_object`, so t_implant needs the mapping (objectives-manager.js:368-375).
- Owner presence is `atPost` plus available, so the cake drawing Thandiwe to a spot in the same room still counts as away (workstation-state.js:673-676). An owner with no needs gives `signin` (:625-627), as 1 says for Delphine and Julian.
- A locked workstation click opens the sign-in screen (unlock-system.js:632, 665), so stop 8 works once Yasmin is away (M7).
- `lockedHint` is appended to RFID denials (unlock-system.js:1495-1500).
- `timedConversation` takes `waitForEvent` and `skipIfGlobal` (schema 4790-4805). `sendTimedMessage` takes `delay`, `message`, `targetKnot`, `skipIfGlobal` (schema 5080-5086).
- Cast diversity: Ghanaian-British, Greek-heritage, Zimbabwean-British, British Pakistani, Black British of Jamaican heritage, Lancashire white British; 30s to 60s (VOICE_CAST.md:104-113). All seven art keys exist with 9 files each. Note that the course id for Delphine is `delphine_reception`, but the sprite key is `delphine_arvanitis`. The plan uses the sprite key, which is right.
- Story NPCs: Lorna (card source), Julian and Delphine have no needs, so V2 cannot fire on them. Thandiwe and Yasmin own no required knot and are not card sources.
- `scripts/predict_door_sides.py` exists at that path.

## Not checked (budget)

- The Finance share refusal from the bare foothold (stop 11): how the network view shows it. The plan gives it no task, so a wrong guess costs a line of patter, not a stuck run.
- Whether a work-need use at a needsHome PC emits `npc_used:<pc>` (M8 assumes it does, as the README pattern implies).
- ink_compiled_staleness_test.rb and phish_superset_test.rb globbing the demo (4.3).
- I did not rerun the validator or predict_door_sides.py on a skeleton. M6's map swap keeps every room at 10x10, so the plan's door results should still hold.
