# m04 Critical Failure — pass-4 playtest script (design changes)

Tests only what pass 4 changed (`DESIGN_REVIEW.md` → "Changes made (pass 4 design)"). Keyless server on :3001: `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m04_critical_failure`. Follow `.claude/skills/playtest-scenario/SKILL.md`; silent lines (TTS 503) are expected. Keep the earned-secrets table; flags are stand-ins, so flag rows are "exercised, not earned". `tools/playtest/verify-run.rb` must show progress for each run.

Three short runs, each 10–15 minutes, on fresh games. Write findings into the report as you go.

## Run A — quiet route (no fights), with a reload

1. **Start.** Briefing: in the combat topic HaX says "You don't have to fight all of them… If they make you, you're cleared to." Pick "[I'll keep it quiet where I can…]". Confirm `enter_facility` is **open** at spawn and ticks on entering the operations office.
2. **Vance, cover route.** Clone his card ("Lean in…"); keep the cover. Read the Facility Layout Map: it names the duty engineer's round at the Hall 1 panel.
3. **Hall 1.** HaX: "…Relay does. She's walking the inverter room." Read the thermometer: about 2 s later, HaX relays Nightshade's read ("Their screens are lying because they have to…"). The aim "Take the Plant Back" must **not** mention a reader.
4. **Cipher, talked out.** Talk to him → "Hall 2 is venting…" → "Whatever Voltage told you…" → "There's a night crew in Hall 2. Go and look." He walks and disappears; `cipher_walked` true; his optional task ticks. No fight.
5. **Reload** (F5). Back in Hall 1, Cipher is still gone; no briefing or intro replays.
6. **Late reveal.** Back at Vance: the hub offers "I'm not an auditor. Your Hall 1 dial reads 61…". Take it → ally path → his phone opens after the chat closes.
7. **Hall 2, Relay notices you.** On entry her chat opens by itself ("She comes round the end of the inverter cabinets…"). Choose "Radio. Down. Now." then "(Keep her talking. Step in close enough for the cloner to find her card.)" → clone → "She hears it." → she turns hostile. Check: `relay_card_cloned` true, `neutralize_operative_relay` complete, HaX's "Get out of her reach" text, and the reader text ("And that plant-room door is biometric…") after the chat closes. **Retreat west**: she should stop chasing beyond about four tiles and go back to her walk. Note any damage taken.
8. **Workshop** opens on the cloned card (cloner → emulate). Workshop text ends "And that OptiGrid case… Open it." Pick the case: kit text says "Lift his print now, while nothing's counting down."
9. **Stealth past Relay.** Lift Vance's print at the Hall 1 panel (reference cards: Security Guard, Cipher, Relay; no Static). Go back into Hall 2, wait until Relay is at the east end of her walk, and reach the plant door at the south-west corner. Record whether you got through without a hit, how long you waited, and whether she interfered while the reader overlay was open. **This is the "dangerous but fair" check.**
10. **Plant room.** Talk to Voltage with Static up; choose "Go for the button and let him run." ESD refuses with "GRID PERMISSIVE NOT RECEIVED… The proof is on the workshop jump server" (VM not done). Stop here; record the state.

## Run B — VM first, plant door without a print

11. Fresh game. Clone Vance, read the thermometer, deal with Relay either way, enter the workshop and **do not open the tool case**. Submit the four flags (stand-ins). Check: the scan flag text offers the ProFTPD guide and the hub hands it over; the map-the-attack text says "get to the ESD"; the 6-minute advisory starts.
12. Go to the plant door with no kit and no print. The reader refuses ("You haven't lifted any prints yet"), and HaX texts once: "…Check what they left in the workshop." Check the event really fired from the Hall 2 side (`door_unlock_failed:plant_room` in the log). Phone HaX → "I need guidance" → "I can't find where to go next": she names the tool case. Then fetch the kit, lift the print, open the door. Record the time left on the advisory.

## Run C — fights, optional print, and the debrief

13. Fresh game. In Hall 1, talk to Cipher and let him radio ("Albion contracted me…"); fight him (real combat, not `debugKO`). In Hall 2 Relay should open with "Cipher said we had a live one. That'll be you." Fight Relay for real; note HP left (**fix 23 human-difficulty check**). The relayed card arrives by phone.
14. **Optional second print.** With the kit, dust the BMS Interlock-Bypass Module in Hall 2 (pale surface, so black powder) and identify it as Voltage. HaX: "Voltage's own thumb, on the bypass module…". "Use normally" still shows the cabinet text.
15. **Arrest and debrief.** KO Static (real combat; note HP), then talk to Voltage: the arrest choice reads "Your thumb's on the bypass module…". Finish the VM (stand-ins) and press the ESD (armed text: "Grid control's standing by"). In the debrief, check the "what failed" beat (three weaknesses, the fixes, one choice), "all three of his crew down", the bypass-print line, no "0600" anywhere, and Task Force Null as "Your name's on his list". Read the credits while they play (`#bv-cr-label`): "EVIDENCE: Voltage's own print on the bypass module".

## What to report

Per step: pass / fail / not reached, with session-log line ranges and the game id. Separately: damage and timings from steps 7, 9 and 13 (is the quiet route fair, are the fights fair), and anything that reads as a promise the game doesn't keep.

## Round 2 confirmation run (short; fresh games; real combat, no console heals)

Re-tests the round-2 fixes (`DESIGN_REVIEW.md` → "Round 2"). Record HP after each fight and the time each takes.

1. **The 61°C call.** Read the thermometer before the workshop. A phone conversation opens by itself: HaX quotes Nightshade's read and offers "Then where do I start?" → the workshop pointer. Close and reopen the phone: no replayed lines, no duplicate. Check there's no "None: " line at Vance's hub (re-talk after the first meeting).
2. **Quiet route via each first reply** (one fresh game, or a reload before Hall 2 for each). On entering Hall 2, try each in turn and confirm the clone choice is still reachable before she turns hostile:
   - "Then why are you walking it?" → radio call → "(Close the gap before she moves…)". Also cancel the RFID read once: it should come back to the same two choices.
   - "Radio. Down. Now." → the standoff clone choice.
   - "Say nothing." → "Last chance…" → the last-chance clone.
   - "I don't need to…" → a doubt reply → the last-chance clone.
   After a clone she sweeps faster. Back off: at most one hit, and she should stop within about three tiles, even near the door. Then slip to the plant door while she's away from the west end.
3. **Fights, average play.** Fresh game. Fight Cipher (after letting him radio), then Relay, then Static, with no console heals, then arrest Voltage. Pass if the player reaches Voltage alive. Note HP after each: the target is that a player of average skill survives all three. Voltage greets you with "You put three of my people down."
4. **VM first.** Fresh game. Thermometer, Relay (either way), workshop, four stand-in flags, case left shut. The advisory shows about 8:00. Go to the plant door (HaX points at the workshop), fetch the kit (the kit text says "…Hurry.", not "nothing's counting down"), lift the print, open the door. Record the time left. Read the work orders after the dial: no "go and check the racks" text.
5. **Armed text.** Deal with Voltage before the last flag. When the last flag lands, "Grid control's standing by. The ESD is live. Press it." arrives once, and there's no second "Get back to the ESD" text.
