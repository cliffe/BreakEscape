# m04 Critical Failure: design re-review, round 1

Reviewer: fresh adversarial reviewer, 2026-10-02. Read-only apart from this file. Scope: the "Changes made (pass 4 design)" in `DESIGN_REVIEW.md`, checked against `git diff HEAD -- scenarios/m04_critical_failure/` and the engine. `erb:NN` is `scenario.json.erb`.

## Checks run (static)

- `ruby scripts/validate_scenario.rb …`: schema, JSON, all inks valid. 0 errors; 8 onceOnly-pair warnings, all on `agent_0x99` and all intended. The new ones are `anomaly_detected` (the Nightshade text plus the ESD check), `conversation_closed:operative_relay` (RFID offer plus reader text) and `map_the_attack` (setter plus two disjoint texts).
- `python3 scripts/check_door_alignment.py …`: 8/8 OK.
- `reopencheck.mjs … m04_critical_failure`: 0 problems. Both phone inks were tested, 1800 reopens each.
- `tagdiff.mjs`: 147 structural differences. The design log says 146. All the ones I read match the log's list. Relay's old `relay_standoff` choices moved into `relay_standoff_choices` with the same `*`/`+` stickiness, plus the new sticky clone choice.
- `dialoguelint.mjs`: see minor 7. This pass introduced new length errors.
- I recompiled all ten inks with `bin/inklecate` into the scratchpad. Every one matches the committed `.json` byte-for-byte as JSON.
- `dungeon_graph.json`: `lock_esd_pushbutton` has 7 inputs (plant room, thermometer, four flags, `action_deal_with_voltage`).

No browser run by me. The in-progress Run A report (`tools/playtest/m04-pass4-report.md`, game 1377) confirms steps 1–3. That covers the briefing lines, `enter_facility` ticking in the ops office, the Hall 1 text naming Relay, and the Nightshade text arriving as a toast.

## Verified as done

- **Clone rule on Relay (fix 6).** `#clone_keycard:server_room_keycard` (`m04_npc_operative_relay.ink:119`) finds her `rfidCard` by `card_id` (`chat-helpers.js:336-345`). It starts the cloner with `name: "Workshop Card Level 2"`. On save, the cloner emits `card_cloned` with `cardName: cardData.name` (`rfid-minigame.js:254-258`). That matches the mapping condition exactly (`erb:707-714`, no parentheses). The task and `relay_card_cloned` come from the mapping, not the tag. The tag sits on a throwaway line, and `relay_clone_debrief` re-checks the global and re-offers the clone on a failed read (`:123-126`). The cloned `card_id` equals the workshop's `requires: server_room_keycard`. The cloner holds 50 cards (`rfid-data.js:18`), so Vance's clone doesn't block hers.
- **Fix 2(b).** With no lifted prints, the reader calls `refuse()` → `emitDoorFailure`, which emits `door_unlock_failed:<connectedRoom>` (`fingerprint-reader-minigame.js:304-323`, `:333-340`). The mapping is gated on `fingerprint_kit_found !== true` and is `onceOnly`. Run B step 12 still has to confirm `connectedRoom` from the Hall 2 side.
- **Fix 7.** In `cipher_walks`, the task tag comes before `cipher_walked = true`, and the resting knot is live (`cipher_gone`). The hide uses `setVisible:false`, which disables the body and is synced to the server (`npc-behavior.js:172-190`). The `room_entered` re-hide also covers a reload.
- **Fix 9.** The two new `vance_hub` choices (`m04_npc_robert_vance.ink:379-383`) run `vance_early_reveal` → `vance_commits_to_helping` (sets `vance_is_ally`) → `vance_commits_exit` (sets `vance_met`). That fires the `conversation_closed:robert_vance` phone mapping (`erb:1016-1023`). Both read-only globals are declared (`erb:2018`, `:2022`).
- **Fix 13 split.** `attack_mechanism_known` is set by its own unconditional mapping. The two texts have disjoint `voltage_neutralised` conditions. Timers and the ESD check still key off the global.
- **Fix 3.** Only the text changed; `authVar` and the three-condition mapping are unchanged.
- **Fix 21.** The print branch runs before the notes handler, and "Use normally" bypasses it once (`interactions.js:1231-1250`). `fingerprint_identified:voltage` fires only on a new identification (`biometrics.js:94-98`). Nothing gates on it. The candidates and easy difficulty are as logged.
- **No fight elsewhere.** Static has no mapping and turns hostile only from his own chat. Voltage's "Go for the button" needs no fight and sets `voltage_neutralised` through `voltage_escaped`. Cipher and the guard are optional. Arrest still needs Static down, which is a fair trade, and the credits say so.
- **Debrief honesty.** The operative lines read the three `operative_*_defeated` globals. The no-KO line, guard KO line, Vance KO credit, Cipher credit and the softened Task Force Null / Voltage / Calder Wharf lines all read state that exists.

## Findings

### Major

**M1 · major: the quiet route closes on four of the five first-meeting choices, so the fight is still mandatory for most players.**
The design log says "No fight is now mandatory anywhere in m04". The clone choice exists only in `relay_standoff_choices` (`m04_npc_operative_relay.ink:86`). Every other branch ends in `#hostile`:
- "Then why are you walking it?" → `relay_alerts_team` (`:46-49`, `:63-72`). This is the first choice listed and the most natural reply.
- "Walk away" and "Say nothing" → `relay_refuses` (`:92-99`, `:137-142`).
- Both doubt answers → `relay_refuses` (`:106-112`).

Once she is hostile, the player can't talk to her: an interaction becomes a punch (`interactions.js:659-668`, `:1751-1757`). The Level 2 card then comes only from her KO. The HaX copy is KO-gated (`erb` `npc_ko:operative_relay` → `on_relay_ko_card`). The quiet route comes back only after a page reload, because hostile state isn't persisted (no persistence in `npc-hostile.js`; `RoomStateSync` stores only `isKO`/`isVisible`). That is an engine accident, not design. A player who picked the briefing's "keep it quiet" choice gets no warning that this one line in Hall 2 decides it.
Fix (all in Relay's ink):
- Give `relay_alerts_team` and `relay_refuses` a last sticky choice before the `#hostile`: `+ {not relay_card_cloned} [(Close the gap before she moves. The cloner's already reading.)] -> relay_clone`. Put the `#hostile` lines in a choices-only knot so the clone can return to it.
- Alternatively, make `relay_alerts_team` divert to `relay_standoff` after the radio call. The call is then its own consequence, and she is waiting for backup.
- Seed the option before Hall 2. Extend the Hall 1 text (`erb:646`) to "…Relay does. Old prox, like Vance's." The combat-help line in HaX's phone (`m04_phone_agent0x99.ink:713-715`) does this today, but only if the player asks.
- Correct the log's claim until this is done.

**M2 · major: the mission's turn is now a toast.**
The 61°C beat is one 38-word `sendTimedMessage` (`erb:651-656`). Run A step 3 confirms it arrives as a toast while the thermometer ticker is still on screen. Pass 3 already gives the reveal a music swing (`erb:103-108`), and the text pays off Nightshade's briefing line. Still, the biggest moment in the mission is reported second-hand in a notification the player can miss. Nobody is in the room with the player, and the player has nothing to say back.
Fix, using a pattern this file already uses (`npc_ko:operative_relay` → phone-chat `on_relay_ko_card`):
- Change the mapping to `conversationMode: "phone-chat"`, `targetKnot: "on_anomaly_confirmed"`, keeping the 2000 ms delay and `onceOnly`.
- The new HaX knot should be a text knot followed by a choices-only knot (phone rule E13). Use two or three short lines, with Nightshade's read as a quoted line (a prefix is allowed for a relayed quote under `PASS4_BRIEF.md`'s phone rule). Add one player reply ("[Then how long have we got?]" / "[Where do I start?]") that lands on the workshop pointer.
- Make the knot's resting state re-check itself on reopen, as `on_relay_ko_card` does. Re-run `reopencheck`.

### Minor

**m1 · minor: the slip-past window is fair, but the "129 px" margin is measured to a wall.**
- Hall 2 is the 20×10 `room_battery_hall` with its origin at (1280, 224). The plant door is at world (1328, 544) (door check), tile (1.5, 10). Row 9 is wall.
- A player using the reader stands at about tile (1.5, 8.5). Relay's west stop (5, 7) converts to world (1440, 448) (`npc-behavior.js:448-449`), about 123 px away. If pathing snaps her to the cell centre, it is about 133 px. Either way, she sits within a few pixels of `aggroDistance` 128 (`npc-behavior.js:680`) for her 2 s dwell.
- Her loop at speed 40 is about 20 s: 4 s per leg and 2 s dwells. She is only near the reader around the west dwell, so the safe window is about 16 s in every 20. That is fair.
- Her chase can't trap the player at the reader. Attacks are blocked while any minigame is open, including the reader overlay (`npc-combat.js:42-45`). The player walks at 150 and runs at 225 against her 120 chase (`constants.js:31-32`). Once beyond 128 px she drops back to `patrol` (`npc-behavior.js:680-692`).
- The worst case: she closes in during the overlay, lands one 15-damage hit when it closes, and follows through the open door into the plant room, where Static and Voltage are.

Fix: make the margin deliberate. Either move her west waypoint to (6, 7), which puts the reader about 152 px away and keeps her on the aisle the KO-drop comment needs, or keep (5, 7) and let Run A step 9 decide. Correct the `erb:1574-1577` comment either way.

**m2 · minor: after the clone she never comes, so "Then you'd better be quick" is empty.**
The chat opens on room entry, with the player at the west door (tile 0.5, 3.5). That is at least 182 px from any point on her patrol line, so after `#hostile` she just carries on walking. HaX's "She'll come for you now, but not far" (`erb:710`) is usually false. Operatives feel less dangerous than the text says.
Fix: either reword the text ("She knows. She won't leave that hall for you, so don't walk into her."), or give `operative_relay` an `npc_hostile_state_changed` mapping (`data.npcId === 'operative_relay' && data.isHostile === true`) with `setPatrolSpeed` around 70 (`npc-manager.js:745-753`), so she visibly sweeps the hall faster. The loop becomes about 11 s, which still leaves a window. Do this together with m1's waypoint move. Don't use `patrolOverride`: it calls `goToAndStay` and would leave her parked by the doors.

**m3 · minor: the kit text tells a VM-first player "nothing's counting down" while the clock runs.**
`item_picked_up:fingerprint_kit` (`erb:695-699`) says "Lift his print now, while nothing's counting down" even when `attack_mechanism_known` has started the advisory and vent timers. That is exactly the route fix 2 exists for. Fix: two disjoint mappings, one per state of `attack_mechanism_known`. Keep the `setGlobal` on one unconditional mapping, as fix 13 does.

**m4 · minor: one stale "a hardwired ESD" was missed by fix 13.**
Vance's phone timed message (`erb:1008`) says "get to a hardwired ESD". Change it to "the hardwired ESD in the plant room".

**m5 · minor: the debrief overclaims, and the quiet route has no credit.**
- `debrief_what_failed` opens "you used all three yourself" (`m04_closing_debrief.ink:178`). That is untrue for a locker or KO-drop player, and the player never "used" the trusted sensors. Suggested wording: "Three things let them in. Two of them let you in too."
- Cipher's debrief line says he "walked out of the gate" (`m04_closing_debrief.ink:153`). In-game he "walks for the Hall 2 door" (`m04_npc_operative_cipher.ink:119`). Suggested wording: "Cipher went to look at the night crew and kept walking."
- `relay_card_cloned` has no credit line, although Cipher's walk-out does. Add `{ "text": "RELAY: card copied mid-standoff", "style": "entry", "condition": "globalVars.relay_card_cloned" }`.

**m6 · minor: the biometric lesson is said twice in nearly the same words.**
The print text says "A print tells a reader who you are. It can't tell it you're standing there." (`erb:726`). The debrief says "A print says who you are. It doesn't prove you're there." Keep the debrief line and vary the text, for example "…and the reader can't tell a lift from a living thumb."

**m7 · minor: the pass added dialoguelint length errors.**
- The new or longer texts: `erb:655` (38 words), `:699` (41), `:710` (33), `:726` (31) and the workshop text `:738` (now 87).
- `m04_closing_debrief.ink:187` (32 words).
- Voltage's new arrest choice `:285` (16 words, cap 15).

`PASS4_BRIEF.md` requires these resolved or justified. Hand them to the dialogue stage by name.

**m8 · minor: the tagdiff count is wrong in the log.**
The log says 146 differences; the tool now reports 147. Recount, and explain the extra one in the "Intended tagdiff differences" paragraph.

## Story editor's view

**Is m04 more fun now? Yes, clearly.** Relay challenging the player at the Hall 2 door is a real scene now. Copying her card while she talks is the best new idea in the pass: it reuses m03's tool under pressure, and her "Was that what I think it was?" is a good line. Talking Cipher out with the night crew pays off a briefing line, and it's the first time words change an operative encounter. The grid-permissive refusal fixes the ESD contradiction without touching the logic. The optional thumb on the bypass module gives the compare step a job, and that carries into the arrest line and the credits. The debrief now teaches what failed. The VM-first player gets pointed at the tool case twice.

**Do the operatives feel dangerous? Less than the text claims.**
- Relay was given a shorter aggro radius (128, down from 160) to make the quiet route possible. On that route she never closes on the player (m2), and her threat lasts one line.
- Cipher and Static still stand and wait to be spoken to.
- The real danger is still Voltage's 25-second race, which is good.
- M1 makes the problem worse: the "dangerous but fair" stand-off is decided by the player's first line, with no sign that it matters.

With M1, m1 and m2 fixed, Relay becomes the scene the design wants: she is visibly hunting, there is a gap you can read, and you have the choice to talk your way to her card.

**Fingerprint changes.** Easy difficulty on both surfaces suits "fun, not hard". The kit text explains why the reference cards are in the lid. The security point is now spoken in the debrief (m6 only asks to vary the wording). Fine as it stands.

**The 61°C turn.** It lands musically. In words, it's a toast (M2). Turn it into a short phone conversation and it will land.

## Verdict

**Another round needed.** M1 and M2 are both mission-local, small, and use patterns already in this file. Minors m1 to m8 can go in the same pass. Run A steps 7 and 9 should re-test once M1 is in.
