# m07 The Architect's Gambit — Pass 2 improvements

> Renamed 2026-10-01: Jake Morrison → Ray Hollis (id jake_morrison → ray_hollis; ink m07_npc_jake_morrison → m07_npc_ray_hollis; globals morrison_* → hollis_*; item morrison_server_badge → hollis_server_badge). This document predates the rename and is not rewritten; see CONTRACT.md and PUZZLE_CHAINS_PLAN.md.

> The m02-standard pass. Sources: `scenario.json.erb`, the eight `.ink` files, the engine (`public/`, `app/`), m02–m06 as worked examples, m06's closing debrief and m08's opening. Nothing committed. Browser playtest not yet run.

## Browser playtest round (games 1177/1178, `tools/playtest/m07-pass2-report.md`) — fixes

Both runs reached `status=completed`. Passed: the console gate; the countdown (hidden after the win, no re-arm on a late flag 3 or a reload); the Architect not preloaded, his first contact and sign-off; the debrief before the credits and gated on all flags; the commit fallback; the redirect rules; Elena's flight. Fixed:

- **D1 (major): the Listener Capture never reached the player.**
  - The server added it to the inventory, but `inventory.js:501-507` returns early for `notes`-family items given outside the notes minigame, so it showed in neither the inventory nor the notepad. The second password route was dead.
  - Now type `text_file`, the shape of m06's flag-3 Door Controller Export, which reached players live.
  - The `onRead` was dropped: `scada_password_found` is set by the `flag2_submitted` mapping anyway. Engine gap logged.
- **D2: the stale T-20 taunt replayed after the win.**
  - The sign-off closed into `parked`, which replayed T-20 if its bark had never been clicked.
  - `start` and `parked` now route to a silent `after_win` knot once `grid_saved` and the sign-off is heard. The check uses the synced `architect_signoff_done` as well as the local latch, so a story reset by a bark's explicit knot can't replay it either.
- **D3: HaX called the team "uncommitted" after a briefing commit.**
  - His thread could be preloaded before the commit landed, baking in "the board says the team's still uncommitted".
  - `first_call_open` is now neutral and goes to the hub. The commit option is gated on the synced `team_assigned`, which is re-read whenever the hub is re-entered.
  - HaX's commit and redirect choices also set the ink-local copies (`~ team_assigned`, `~ team_assignment`, `~ team_redirected`, `~ redirect_declined`), so the options vanish in the same conversation.
- **D4: Elena stood in the rack rows.** At (6,5) she overlapped the server rows (`room_servers` tables x2.2–9.1, y2.8–5.3). She is now at (3,7.5) on the clear lower floor; nothing in the tilemap is below y6.5 there.
- **D5: Mercer still talked as if the sequence were live after flag 4.**
  - "Where tonight gets decided", "when the third submission is declined", the hostile-ending narration and the walk-out narration all now branch on `flag4_submitted or grid_saved`.
- **D6: the sign-off mentioned a clock that never ran.** "The countdown on the wall stops" is now only said when `cascade_armed`; otherwise "The console goes quiet."
- **D7: guide offers arrived after the door was open.**
  - `door_unlock_attempt` fires only on a failed attempt, so a player already holding the badge or key got the RFID and lockpicking offers late, or never.
  - The RFID offer now fires on entering the ops floor (the reader is across it) unless `badge_obtained`.
  - The lockpicking offer now fires on entering the server hall (the plant door is on its south wall) unless `maintenance_key_found`.
  - Both messages now say where the lock is.
- **D8: US setting, UK words.** Changed in the narration for US characters and places: "torch" → "flashlight" (Morrison, Elena, Park), "metres" → feet, "saloon/windscreen" → "sedan/windshield", "storeys" → "stories", and the wall map's "three metres". HaX and Netherton keep UK English.

### Verification after the playtest round
- validator: 0 errors, 6 warnings, 6 ❌ INVALID (the `targetKnot` false positives, see below). The warning set changed with D7:
  - `room_entered:operations_floor` ×2 (RFID offer + debrief backstop) and `room_entered:server_room` ×3 (recon offer, lockpicking offer, debrief backstop) replace the old `door_unlock_attempt` pair. They co-fire for different purposes, which is intended.
  - The other four are unchanged.
- compile: 8/8;
- inkcheck: 14 entry knots clean (new: Architect `after_win`);
- loopcheck clean on:
  - HaX `start` fresh and committed, and `commit_team`;
  - Architect `parked` and `start` after the win with a stale T-20 (route to `after_win`), and `sign_off` unarmed;
  - Mercer `hub` after flag 4;
  - Morrison, Elena and Park hubs;
- door_align: 5/5.
- Not re-run in a browser: D1 (capture visible), D4 (Elena's new spot), D7 (offer timing).

## Review round 2 (adversarial reviewer) — fixes

The reviewer found no blockers: the mission is completable in every order. Fixed:

### Majors
- **M1: the HUD clock outlived the win.**
  - `ui/scenario-timer.js` has no `cancelOnGlobal` handling, and the dispatcher skips cancelled timers without `markFired` (`scenario-timer-dispatcher.js:54-66,79`). The red clock kept counting through the debrief.
  - On reload the dispatcher restarts any timer whose start global is true (`:36-38`), so `cascade_zero` could set `countdown_expired` on a saved grid.
  - Every timer now carries a `condition`: `!globalVars.grid_saved`, plus `&& !globalVars.countdown_expired` on `cascade_zero`. The HUD hides a timer whose condition fails (`scenario-timer.js:140-150`), and the dispatcher skips its `setGlobal` (`scenario-timer-dispatcher.js:106-120`).
  - Engine gap logged.
- **M2: flag 3 submitted after the win re-armed the cascade.** The arming mapping now requires `!globalVars.grid_saved`.
- **M3: the phone preload used up the Architect's first contact (lesson 36).**
  - The first phone open ran his `start` → `taunt_t30` and saved it, so the ops-floor bark later opened on dead air.
  - The ops-floor mapping now sets the synced global `architect_contact`. Until that (or the first timed beat), `start` diverts to a silent `dormant` knot. The preload then has no text and saves no history (`phone-chat-minigame.js:357-376` only saves state when messages exist).
- **M4: the expired-clock outcome was contradicted.** These now branch on `countdown_expired`:
  - the debrief's opening;
  - the "Look at me" line and the closing narration;
  - the Architect's sign-off.
  
  HaX's mole topic, which is reachable before the win, branches on `grid_saved` as well.
- **M5: seams left by the old clock and the old VM:**
  - Architect: "thirty minutes of your attention"; the T-10 "countdown keeps running" line (its bark is now gated on `!architect_t5_played`, and so is its route in `start`/`parked`).
  - Mercer: "next four minutes" (×2); "the scripts are next door"; "the sequence still runs" after flag 4; the "until the sequence does" exit line after a win. `resolution` now has a `grid_saved` branch. VARs `grid_saved` and `flag4_submitted` are read.
  - Elena "looks at the countdown on the far wall" (wrong room, maybe unarmed).
  - The countdown display said "ARMED" before arming. It now shows LOADED, with `textVariants` for ARMED and ABORTED.
  - The debrief's thin coda said "before you were through the checkpoint"; first contact is on the ops floor.
  - `mission.json`'s description said "thirty minutes".

### Minors
1. **HaX KO branches never surfaced on an engine KO.** HaX now reads `morrison_ko` and `mercer_ko`. Elena has a separate "she's down" label when she is KO'd without ever being spoken to.
2. **Flag 1 message after a redirect.** Players who already redirected on Elena's word get their own message; the other two mappings exclude them.
3. **Elena's `projection_revised` tag** is now at the top of `revision_beat`.
4. **Mole intercept.** It gains `Date: 09:50 UTC`, 51 minutes before the 02:41 Pacific (10:41 UTC) tasking, matching HaX and the debrief. The commentary moved into `observations`.
5. **Debrief people section:**
   - Mercer's unresolved branch no longer says nobody saw him.
   - Park's KO line now says "four minutes", matching his own line.
   - "this substation" is now "that control centre".
6. **NPCs on furniture.**
   - Morrison spawned and patrolled on desk1, the waiting chairs and the plants. His circuit is now on the clear strip x3.5–6.5, y6–6.6 (`room_security` tables x2.0–4.4 / 5.6–8.0, y3.5–4.7; chairs x1.2–2.3 / 7.7–8.7; plants y7.0–9.4).
   - Park moved from smalldesk2 (7,3) to (4.5,4.5).
   - Not yet walked in a browser.
7. **US setting, UK idiom:**
   - Elena: "car park" → "parking lot", "select committee" → "congressional committee".
   - Mercer: "junctions/flats" → "intersections/apartments".
   - The board and key observation: "NORTH CAR PARK" → "NORTH PARKING LOT".
   - Morrison: "Federal building, federal record" → "Compliance record, three years' retention"; "magistrate" → "the police"; "closed terminal" → "desk drawer" (it is a bound paper log).
8. **Port hint.** HaX's "four-figure range" is now "a port above 1024".
9. **Briefing timing.** "Last week" is now "Three days ago", matching m06's 72-hour clock.
10. **Debrief timing.** The debrief is now the same night over the secure link, not "after the flight home". "Eight time zones west" is now "Outside, across three states … asleep". "Report back here" is now "Report to headquarters".
11. **Architect sign-off branches** each name the two operations left unanswered.
12. **Aims revealing early (lesson 27).** `trace_the_intrusion` and `reach_the_control_room` now unlock on `commit_the_team`, so the maintenance log or Elena's password can't reveal them out of order. The validator's critical path is now 3 hops.
13. **"Neutralised" without a KO.** Debrief and credit KO lines key only on the `*_ko` latches. Mercer gets a neutral credit line for "came at the agent" without a KO, and Morrison's "evaded" credit excludes a KO.
14. **Inline emotes that TTS would read aloud** removed from Mercer and Elena. HaX's `*long pause*` became a Narrator line.

### Validator "❌ INVALID" lines: false positives
The validator flags `targetKnot` inside `sendTimedMessage` on the_architect's six barks as "silently ignored for phone NPCs". The engine does use it:
- `npc-manager.js` passes `targetKnot` into `scheduleTimedMessage`, and `_deliverTimedMessage` hands it to the bark as `startKnot`.
- `npc-barks.js:511` puts it in the phone-chat params (`startKnot: startKnot || npcData.currentKnot`).
- `npc-barks.js:630` navigates to it.
- `phone-chat-minigame.js:510-534,579-582`: an explicit start knot overrides the saved story state and navigates there.

Removing it would make a bark click open the parked or ended state instead of the new transmission. The fix belongs in the validator (logged).

### Verification after review round 2
- validator: 0 errors, 6 warnings (same as round 1), 6 ❌ false positives;
- compile: 8/8;
- inkcheck: 14 entry knots clean, adding Architect `dormant` and Mercer `resolution`;
- loopcheck: 14 states clean, including:
  - HaX with all KOs + grid saved + clock expired;
  - Architect fresh (dormant), contact, post-win redirected, and t5+t10 pending;
  - Mercer post-win;
  - debrief with clock expired + redirect declined + Mercer KO, and debrief Trojan Horse + revised;
- door_align: 5/5.

---

## Headline

The mission validated, but it could not be finished. Four blockers stacked on the ending:

1. **No flag task could complete.** All four `targetFlags` used the reference form `scada_attack_host:flag_N`. `game.rb:1110` matches only the display form, so `concludeRequires` could never be met (lesson 5). Now `flag_station_safetynet_relay:scada_attack_host-flagN`.
2. **The win console opened the wrong minigame.** `crisis_control_system` was type `scada_historian`. `interactions.js:1078` sends that type to m04's SCADA-historian minigame before any lock or container check, so the console never unlocked and `shut_down_the_cascade` never completed (lesson 9).
3. **Flag 4 had two submission points.** The console also had `lockType: flag` with `requires: scada_attack_host:flag_4`. Submitting flag 4 there first would unlock it (`games_controller.rb:795` ignores the "already submitted" result), but `terminate_cascade_scripts` would never tick. The relay then refuses the flag as "already submitted" (lesson 6).
   - Fix for 2 and 3: the console is now a `pc` container with the `scada_historian` sprite, flag-locked with no `requires`.
   - Flag 4's reward unlocks it (`unlock_object`, the m02 staging-cache pattern). The server marks it unlocked on room load (`game.rb:713-724`), and opening it emits `item_unlocked` because it has contents (`unlock-system.js:718-741`).
4. **The debrief could open over the console and ignored the flags.** It was keyed on `mission_complete`, set the instant the console's task completed while its container was opening. It also completed `take_the_debrief` on its first line, so the bond visualiser covered it (lesson 46). Now it follows the m06 pattern (see Bugs).

## Bugs and soft-locks (fixed)

- **The control-room password had no real second source (lesson 8).**
  - Flag 2 only set `scada_password_found`, so a player without Elena (KO'd, fled or never met) could not learn `CascadeWindow19`.
  - Flag 2 now pays out a "Listener Capture — Operator Credentials" note from the relay's `itemsHeld`, with the password in the text.
  - `flag2_submitted` now comes from an `objective_task_completed:intercept_c2_channel` mapping.
- **The badge printer route was dead.**
  - It was a `workstation` whose `triggerOnInteract` handed out a keycard absent from the scenario. The inventory POST was rejected (`validate_item_collectible`, `games_controller.rb:1423-1454`).
  - Now it is a PIN-locked `pc` container holding `printed_contractor_badge`.
  - The PIN (0616) is on a new Shift Handover Sheet on the ops floor. The in-world author is the night supervisor. This makes the route a backtrack, with the clue and the lock in different rooms.
  - Morrison's badge got its own id (`morrison_server_badge`), so the server doesn't resolve his badge to the one in the container.
- **The ops-floor situation board opened another scenario's minigame.** It was type `command_board`, which `interactions.js:970` sends to the Major Incident Command Board minigame. It is now a readable `smartscreen` with the same sprite.
- **The Architect never called.** The timers set globals and nothing reacted.
  - He now has bark mappings with `targetKnot: start`: first contact on entering the ops floor, one bark for each timed beat, and one when the clock expires.
  - His sign-off opens as a phone call when the console's container closes.
  - He moved to the start room so his mappings register at load (lesson 43).
- **Debrief (m06 pattern).** It moved to the start room.
  - It opens on `minigame_completed`/`minigame_failed` after `architect_signoff_done`, or on any `room_entered`.
  - It requires `grid_saved` and all four `flagN_submitted`. It is latched by `start_debrief_cutscene` and uses `disableClose`.
  - `debrief_played` is set at the top of the ink. `take_the_debrief` (now `custom`) completes on the last line.
  - Six room-entry backstops cover a reload mid-debrief.
  - HaX nags if the grid is saved with flags 1–3 unsubmitted.
- **KO reactions never fired (lesson 18).** They were keyed on `global_variable_changed:<npc>_ko`; all four are now `npc_ko:<id>`.
- **Phone threads died after one exit (lesson 21, phone form).** HaX's "I'll call you back" went to `-> DONE`. `phone-chat-minigame.js:583` then shows "Conversation ended" on every reopen, so HaX was unusable after the first call. Every HaX exit now returns to `hub`. The Architect's exits park in a new `parked` knot, which re-routes to any taunt that has arrived since.
- **Person-chat DONEs (lesson 21).** Morrison, Elena, Park and Mercer never reach DONE. Resolved states park in their re-entry knots; hostile branches park in a silent `parked` knot. The remaining DONE/END are the terminal briefing and debrief.
- **No way to commit the team after closing the briefing early.**
  - The briefing (`setGlobalOnStart`) never replays, and HaX told the player to "settle it on the briefing channel". That was a soft-lock of aim 0.
  - HaX now has a `commit_team` knot plus a sticky hub option while `team_assigned` is false.
  - The briefing's commit lines complete `assign_tactical_team`, which is now `custom` because a phone NPC is never "encountered" for server validation.
- **Leaving NPCs stayed on screen (lesson 24).**
  - Mercer's `#remove_npc` silently fails in a later-loaded room. Elena's flight used `#hostile`, so a fleeing engineer attacked the player.
  - Morrison (talked round), Elena (fled), Park (talked round) and Mercer (detained or walked out) are now hidden by `setVisible:false` mappings, re-applied on `room_entered`.
- **Tags moved above the lines they belong to (lessons 3/44):**
  - Morrison's badge hand-over now uses the `#give_item:keycard:morrison_server_badge` selector (lesson 26); `badge_obtained` comes from pickup mappings.
  - Elena's turn tags; `question_elena` completes at the top of her first meeting.
  - Park's stand-down tags.
- **Elena's "give me the codes again" option was unreachable.** It was gated on `not gave_keys`, which was always true by then. It is now always offered after she turns.
- **Wrong timeline.** The briefing flew the agent from HQ (hours) against thirty-minute windows. It is now a secure link to the agent's car forty minutes out of Portland. The ERB comment and `scenario_brief` already said "on the approach road".
- **HaX told the player to "move the team to Trojan Horse" when it was already there.** The redirect options and the flag 1 message are now split on `team_assignment` (two disjoint mappings, lesson 35).
- **The countdown contradicted itself (lesson 29; tone call logged).**
  - The clock ran 60 real minutes from the briefing, VM time included, and reaching zero did nothing, although the HUD said "Cascade".
  - Now the sequence arms when the player logs in to the attack host (flag 3), and a visible 15-minute clock starts. Expiry means step one (Seattle metro) executes before the abort.
  - The Architect's early beats fire at 10 and 40 minutes after the commit. The redirect window still closes at 40 minutes or on flag 3.
  - HaX now says to get the control room door open before logging in to the host. That is the only door the finale needs. (Round 1 said "open every door", which overstated it: the generator hall and vault are optional and play no part in the abort.)
- **VM narrative now matches the VM.** SecGen `putting_it_together` has no "kill the processes" flag. Flags 3 and 4 are now the operator login and root via sudo. Titles, reward descriptions, HaX hints and Mercer's line are updated; task ids are kept.
- **Player-visible meta and inaccuracies:**
  - "M8" in HaX (twice).
  - The RFID guide text claimed cloning was needed; holding a matching keycard opens the reader (`unlock-system.js:489-514`).
  - Mercer's "scripts came down eleven minutes ago".
- **Continuity inside the mission:**
  - Morrison's leverage date was "the ninth"; the visitor log says 16 June.
  - Park knelt "at the transfer switch", which is in the generator hall; his scene is now the vault's control cable to it.
  - Elena "does not give back" a projection that stays in inventory.
  - The debrief called Morrison unpaid and socially engineered; his own ink says he took money.
  - The debrief said Park "is cooperating", after he says "I'm not going to help you".
  - The debrief said the evaded guard "never saw you", though the evade path is a conversation with him.
  - "Timestamped an hour and six minutes before the tactical element was committed" was impossible, because the team is committed in the briefing.
- **Canon (lesson 39).** "SAFETYNET tactical", "arrest team" and "you're under arrest" are replaced with the police. The one tactical team is at another operation. "Detained" stays in the credits.
- **Emote-only line** `Dr. James Mercer: *waits*` is now a Narrator beat. Mercer's exit line now comes before its `#exit_conversation`.

## Choices that matter

- `redirect_declined` (new) is set when the player weighs the redirect and holds. The debrief and credits record it.
- The debrief handles "team already on Trojan Horse" as its own case.
- `countdown_expired` is now a real outcome: printout variant, credits warning, one factual debrief line, and an Architect bark.
- New credits line when Elena was never spoken to.
- Casualty figures and threat wording are unchanged throughout. The only added consequence line is factual ("Seattle metro lost power until it did").

## Puzzles and chain

- **Badge:** three routes, each needing something. Visitor log leverage → Morrison; handover sheet (ops floor) → badge station (checkpoint); or fight him.
- **Control room:** Elena, or VM flag 2's capture.
- **The finale now has a planning beat.** Logging in (flag 3) starts the clock. A player who has the control room door open by then has only root and the walk upstairs left. One who hasn't must also get Elena's or the capture's password in.
- The key-before-lock ordering is unchanged elsewhere.

## Verification

- `ruby scripts/validate_scenario.rb` → 0 errors and 6 warnings, plus 6 "❌ INVALID" lines. Round 1 under-reported this: its grep counted only `ERROR`. The ❌ lines are false positives, explained in the review round below. Warnings, all judged intended:
  1. console `lockType: flag` "may not emit item_unlocked": it is unlocked by the reward, and opening a contents object emits it;
  2. `flag3_submitted` ×2: the privesc guide and the arm/close mapping, intended to co-fire;
  3. `door_unlock_attempt` ×2: disjoint by `connectedRoom`;
  4. `room_entered:server_room` ×2: guide offer vs debrief backstop, different purposes;
  5. `grid_saved` ×3: flag nags, one latch;
  6. `item_picked_up:keycard` ×2: disjoint by `itemId`.
- `./scripts/compile-ink.sh m07_architects_gambit` → 8/8. One END warning, on the terminal briefing.
- `inkcheck` clean (0 failing, 0 runaway) on:
  - briefing `start`;
  - HaX `start`, `hub`, `commit_team`;
  - Architect `start`, `sign_off`, `parked`;
  - debrief `start`;
  - Morrison, Elena, Park and Mercer `start`.
- `loopcheck` clean on:
  - HaX `hub` (default; fracture + revised; trojan + revised + window closed) and `start` with `team_assigned=false`;
  - Architect `parked` with t20+t10 pending, and `start` with `grid_saved`;
  - Morrison `hub`, and `start` in talked / evaded / KO states;
  - Elena `hub` (with and without the projection), and `start` turned / fled / KO;
  - Park `hub` (with the projection), and `start` talked / evaded;
  - Mercer `hub` (projection + traffic + flag 4), and `start` arrested;
  - debrief `debrief_hub`.
- `door_align.py` on the rendered JSON → 5/5 OK.
- Rendered JSON: 0 eventMapping conditions with `||` or `(`. The four `||` conditions the brief counted are music-credit conditions, evaluated with `new Function` (`scenario-music-events.js:34-54`), so they are fine. 0 mapping `completeTask`s on collect tasks (lesson 47).
- The dungeon graph was regenerated by the validator run.

## Not done / unverified

- **No browser playtest.** Specifically unverified:
  - that the Architect's `conversationMode: phone-chat` opens cleanly on `minigame_completed`;
  - that `textVariants` resolves on a file shown inside a container (the base printout text is neutral either way);
  - where the badge station (expected: a `pc5` slot) and the console (`scada_historian` sprite, no known slot in `room_control_1x2gu`) land (lesson 28).
- An earlier attempt to rewrite the whole HaX file was interrupted. It was redone as targeted edits, all of which landed. No knot is outstanding.
- Morrison's and Park's LOS cones are decorative (no lockpick mapping, no pickable lock in their rooms), so "evade" has no mechanical effect. Logged, not changed.
- `README.md` and `ALIGNMENT_PLAN.md` described the old clock and routes and have been deleted. `CONTRACT.md` carries a "PASS 2 amendments" section; the design rationale from the plan is kept in "Design rationale" below.

## Capability arc

m07 grants chained host exploitation under a clock the player's own action starts: recon, NFS, a plaintext listener, credential reuse into SSH, then sudo privesc. It also grants triage of a decision made on bad numbers. m08 should make the player feel the absence of a trustworthy briefing: no Netherton channel, the tasking itself suspect, and evidence that has to be derived rather than handed over.

## Design rationale (kept from the retired ALIGNMENT_PLAN)

- **Why delegation.** The original m07 was four playable branches chosen by an ERB variable at load. Three of the four were decorative (their confrontations funnelled into one knot or set no variables), so the player committed on a quarter of the information and every option not taken was content never seen. The player now runs one operation (the Portland grid facility, the only target where a person on site within thirty minutes changes the outcome) and delegates SAFETYNET's single tactical team to one of Fracture, Trojan Horse or Meltdown. The other two go unanswered. Delegation is resource allocation: the player reads all four briefs because the decision needs them, and the dilemma is which crises to abandon, not which to play. This matches the season arc's four incommensurable harms.
- **Why the revision mechanic exists.** The briefing projections are ENTROPY's own numbers, fed to SAFETYNET deliberately. Evidence that Trojan Horse is understated (dispatch and healthcare vendors on the key manifest, nine days of dormancy rather than ninety) can be found from two independent sources, Elena Rodriguez and the coordination traffic on the NFS share, so a KO cannot strand it. Finding it opens a redirect option on the HaX hub, and the window closes at T-10. A player who investigates can save people a player who rushes does not, and the rusher is never blocked.
- **The twist, in two turns.** At the SCADA console the traffic shows all four operations running from one schedule (Mercer is a diversion and does not know it; telling him is a stance choice). In the cable vault and the debrief, the Architect had SAFETYNET's deployment before SAFETYNET made it: the mole leaked the agent, and the gambit was an experiment in how SAFETYNET triages. The win is real; what drops out is the discovery that it was measured.
- **Still open:** UK or US geography for the campaign (m02 is UK, m07 is US); whether "The Professor" and the Montana Tomb Gamma coordinates become canon or are cut; whether `team_assignment` persists as a campaign global that m10 reads.
