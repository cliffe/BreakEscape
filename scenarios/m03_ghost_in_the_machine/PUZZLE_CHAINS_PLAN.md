# m03 Ghost in the Machine — Puzzle chains plan

> Renamed 2026-10-01: James Park → Danny Foster. Ids now `danny_*` throughout (room `danny_office`, task `danny_choice_made`, globals `danny_fate`/`danny_ko`/…, ink `m03_danny_choice`). Where this plan quoted the old `james_*` ids they have been updated in place; line numbers cited before this date refer to the old names.


Status: **IMPLEMENTED (draft 4, after review round 3).** Every ✅ item is in the working tree,
mission-local, and not committed. The implementation record and "done when" results are in
§0. A separate reviewer and a browser playtest (with a mid-mission reload) follow.

**What changed in round 3.** Items tagged **[r3]**:
- P4: the eager beat is gated on the warning, so a warned player can recover before the read.
- P2: three lines that would have burned a recruited Victoria are gated.
- Minor wording and gating fixes in P0, P1, P2, P5 and P6.
- P4 moves into the P1/P3 row.
- A "done when" block (§0).

**What changed since draft 2 (round 3: concentrate here).** Items tagged **[new r2]** or
**[changed r2]**:
- P0 (post-it becomes an IT reset slip);
- P1 (possession in the player's line; gate on `usb_seen`);
- P2 (credits hold for every fate; a recruited Victoria isn't burned);
- P3 (wording);
- P4 (warning on the accusing beats, a way back by playing the recruit, a reload guard, a +5 on :177);
- P5 (:169 reworded);
- P14 (gated on `victoria_fate`; block placement);
- the §1 merge note;
- §6, §7 and Withdrawn.

**Changed in draft 2 (round 1), kept for the record.** Sections and items tagged
**[new r1]** or **[changed r1]**:

- §1 summary: new item 0 (password clues); P4 rebuilt; P1, P2, P3, P5, P7, P8, P9, P11, P12 revised; new P14 (HaX nudge).
- §3 audit: the PIN cracker row and the PC row are rewritten; there is a note on the conference door depth.
- §4 findings: new F0 (password clues contradict the lock) and F16 (`victoria_suspicious` is written but never read). F15 is extended.
- §5 proposals: P1, P3, P4 (rebuilt), P2, P5, P7, P8, P9, P11, P12 and new P14.
- §6–§7: the risks and dialogue notes for the above.
- §9 capability arc: rewritten for the user's kit ruling.
- §10 approvals: resolved.
- Withdrawn: one new entry (B2, Nightshade's line).

**Method.** Everything below is cited to `scenario.json.erb` (as `erb:NN`), the seven
`.ink` files, the engine under `public/break_escape/js/` and the auto-generated
`dungeon_graph.md`. `ALIGNMENT_PLAN.md` and `TESTING_WALKTHROUGH.md` were not used as
sources. The coordinator flagged the alignment plan's Phase 1.3 flag form and its Phase 5
receptionist/guard plan as stale, and both are.

**Engine state this plan assumes.** Commit `18237332` ("Engine: the pass-2 fixes from the
approval log") landed after m03's pass 2. Three of its changes matter here:
- `registerNPC` now keeps `_sprite` (`npc-manager.js:192-193`), so KO drops work for NPCs in later-loaded rooms.
- Hidden or KO'd NPCs no longer see lockpicking.
- A re-talked ended story restarts at `start`.

m03's pass-2 workarounds for those gaps still work. Two of them now make wrong claims (F9,
F10), and four scenario comments describe gaps that are gone (P12).

---

## 0. Implementation record and "done when" **[r3]**

**Status per item** (all ✅ items implemented, in phase order):

| Item | Status | Notes |
|---|---|---|
| Phase 1 #1–3 (receptionist, debrief escaped line, drawer) | ✅ done (draft 1) | |
| P0 IT reset slip | ✅ done | 61-character post-it (`erb:1135`); the new observation **replaces all of** `erb:1138`; HaX `:167-169` reworded |
| P12 KO relay + stale comments | ✅ done | HaX line reworded. Comments updated: `erb:553` (relay item), the Victoria KO block, the D3 handler, the guard's `_comment` |
| P13 unsourced "grid… winter" | ✅ done | The roster branch names grid storage and Critical Mass; the no-roster branch says "Infrastructure, and soon" |
| P10 honest decode tasks | ✅ done | `decode_whiteboard` moved to `collect_lore` and retitled; the roster task retitled |
| P6 Perfect Stealth earned | ✅ done | Mapping on `closing_debrief` (deviation below); credit and debrief gated; new KO line (item 13) |
| P2 catalogue consequence + recruited carve-out | ✅ done | `catalogue_seen` onRead on the catalogue; four credit lines; debrief branch; "EXPOSED" credit and two aftermath lines gated (round 3 #2) |
| P1 + P3 + P4 (one Victoria edit) | ✅ done | Round 3 ruling (b) for P4; `:121` gains `not read_dropped` |
| P14 HaX nudge | ✅ done | Block before `-> report_end`, gated on `victoria_fate == ""`; same guard on `hint_confrontation` |
| P5 whiteboard + HaX | ✅ done | Whiteboard "NEW ONE COMES BY MAIL"; `:169` keeps "The wall safe's a different code." in front |
| P7 observations + HaX `:274` | ✅ done | The roster says lower-case a–f (the ERB's `unpack('H*')` emits lower case) |
| P11 cut narrator lines | ✅ done | |
| P8 ProFTPD tie-in | ✅ done | Runbook step 2, the server-room message (now also lists the ProFTPD guide), `hint_network`, the guide item and its hub knot |
| P9 briefing lines | ✅ done | Nightshade's cloner line plus HaX's cracker line in `topic_clone` |
| Phase 4 docs | ✅ done | Dungeon graph regenerated by the validator; `TESTING_WALKTHROUGH.md` updated, with a new "Pass 3" checklist |

**Deviations:**
1. **P6 mapping host.** The `room_entered:executive_office` → `exec_office_entered` mapping sits on the hidden `closing_debrief` NPC (start room, always loaded), not on HaX. On HaX it would share `room_entered:executive_office` with the `hear_debrief` backstop and add a fifth co-fire warning. Behaviour is the same.
2. **P8 hub label** reads "[Send me the ProFTPD exploitation guide again]", because the player had it in m02.
3. **P13** names the roster's content ("grid storage, and Critical Mass"), not just "grid".

**Done when — results (run 2026-10-01):**
- `./scripts/compile-ink.sh m03_ghost_in_the_machine`: **7 compiled, 0 failed.**
- Validator: schema passes, 0 errors, 0 INVALID. Geometry OK, door alignment OK. **Same 4 co-fire warnings, 8 notices and 2 missing-recommended as before.** Critical path still 2 hops.
- `python3 scripts/check_door_alignment.py`: all doors OK; layout unchanged.
- inkcheck at `start`: all 7 files ✅ (Victoria, briefing, phone, receptionist and guard 800/800; Danny 9/9; debrief 3/3).
- loopcheck with injected states (all ✅, no runtime errors):
  - Victoria at `clone_check_1` (`read_checked=true victoria_suspicious=10`);
  - `hub` with `read_dropped=true eager_act_done=false victoria_suspicious=15`;
  - `hub` with `read_dropped=true eager_act_done=true victoria_suspicious=20`;
  - `hub` with `suspicion_warned=true victoria_suspicious=10`;
  - `hub` with `rfid_clone_started=true read_dropped=true victoria_suspicious=10`;
  - `idle` at night; `nighttime_confrontation` with `usb_seen`; `confrontation_decision` with and without `recruit_refused`;
  - the phone `hub` at night with all guides, and with `victoria_fate=ko`;
  - the debrief across **4 fates × catalogue found/not** and three stealth states.
- Path simulations (scripted inkjs drive):
  - **Fail and recover:** accuse → warning → ignore → read drops → hub offers only "Play the eager recruit again" (no "Keep her talking", no "Drift back") → eager → "Drift back" → clone. `clone_keycard` and `complete_task:clone_rfid_card` fire **once**.
  - **Heed the warning:** accuse → warning → eager beat before the read → clone first time, `read_dropped=false`.
  - **Reload edge:** `read_checked=true`, suspicion 10 → "Keep her talking" → passes to `clone_check_2` → clone.
  - **Night, no drive:** the clean-afternoon line plays; two openers; "Work for us." is refused once and does not reappear.
  - **Night with `usb_seen` and a dropped read:** the "inventory" line plays; the Phase 2 opener appears with "So you've been through my office"; the recruit choice gives "Then you already have the what. I'm the when."
  - **Debrief:** recruited + catalogue + directive + stealth earned → Perfect Stealth, the directive nod, the vendor line only, "Zero Day doesn't know it's been read", and the quiet aftermath. Arrested + no catalogue + guard KO → the KO stealth line, the roster line, the "exposed" aftermath.
- Grep: no remaining "initials", "VS /", "VS2010" or "in her drafts" clue in the ERB or the ink.

**Not verified (for the playtest):**
- that the 61-character post-it fits its block;
- the keycard drop on a pre-clone Victoria KO;
- the `exec_office_entered` mapping firing live;
- the credit lines with `||` in their conditions rendering;
- P4 across a real reload (save mid-fail and after the eager beat).

**[impl-review] Fixes from the independent implementation review (all applied, 2026-10-01):**

| # | Fix | Result |
|---|---|---|
| 1 (major) | Eager beat gated on `(suspicion_warned or read_dropped)` so the hub can't shrink to "End" if local ink variables are lost but the global suspicion survives | ✅ Simulated: locals lost, `read_dropped=true`, suspicion 15 → hub offers the eager beat, then "Drift back" |
| 2 | Night "inventory" line also on `suspicion_warned` | ✅ |
| 3 | Roster-only opener no longer says "Healthcare SCADA" (SCADA is only in the directive) | ✅ Now "Phase 2. Critical Mass. The grid…", which is in both the roster and the directive |
| 4 | Recruited debrief: catalogue "folded into routine advisories over the next few months… nothing points back at her" | ✅ Non-recruited fates keep the anonymous-advisory line |
| 5 | Debrief recruit nod also accepts `usb_seen` (declared) | ✅ |
| 6 | Dropped "And you've got the directive." from her acceptance | ✅ |
| 7 | "half way" → "halfway" | ✅ |
| 8 | Briefing cloner line made route-neutral: "Last time a card meant getting it off somebody. This time you just stand next to it." | ✅ |
| 9 | Briefing names the whole kit: "Your picks for anything keyed, the cloner for anything carded. And no keypad gadget this time…" | ✅ |
| 10 | ProFTPD guide label and observation no longer assume the player had it in m02 | ✅ "[Send me the ProFTPD exploitation guide]" / "That's the backdoor that took St. Catherine's down." |
| 11 | "grid storage, and Critical Mass" comma | ✅ |

**[impl-review] Guard detection (playtest game 1216: 100 → 0 HP in about 3 s after a lockpick detection).**

*Comparison:*
- **m03's night guard** had no `behavior.hostile`, so he ran on the engine defaults (`npc-behavior.js:343-347`: chaseSpeed 145, attackDamage 10, pauseToAttack true; `combat-config.js:45-47`: cooldown 2000 ms). Player max HP is 100.
- **m01's hostile NPCs:** Sarah 100/10/pause; Kevin 145/15/no pause; Derek 145/25/pause (`m01 erb:565-569, 1466-1470, 1301-1305`).
- **m02's patrol guard** also runs on the defaults, with no `hostile` block.

So m03's *numbers* were no harsher than m02's and milder than two of m01's. At 10 damage per 2 s, 100 HP takes about 20 s, so a 3 s KO is not explained by the config. That points at the engine (E2, logged by the playtester, not touched here).

The real difference was the *flow*. m03's `on_lockpick_detected` went straight to `#hostile` with no choice. m02's guard (`m02_npc_security_guard.ink:248-320`, Val Okonkwo) gives a talk-down conversation, where only one deliberate choice turns her hostile. m01 likewise reaches `#hostile` only through a player choice (`m01_npc_kevin.ink:544`).

*Change:*
1. **`on_lockpick_detected` is now a warning, m02 style.**
   - First catch: "Oi. Away from the door." with three choices. A cover story or "Wrong door. I'm going." de-escalates; "Shove past him." goes hostile.
   - Second catch: "Again? I told you once." Back off, or stand your ground (hostile).
   - Third catch: "That's three times. I'm done talking." He goes hostile after a one-line beat.

   Every catch still counts against Perfect Stealth.
2. **Hostile tuning set explicitly to m01's mildest** (Sarah: chaseSpeed 100, attackDamage 10, pauseToAttack true), so a fight starts slower than the default chase.

*Verified:* the guard ink compiles; inkcheck at `start` passes 800/800; loopcheck on `on_lockpick_detected` is clean at detection counts 0, 1 and 2; the simulated first, second and third catches show the lines and choices above.

*Not verified:* live combat feel, and E2 itself.

**Done when, re-run after these fixes:**
- compile 7/7, 0 failed;
- validator: 0 errors, 0 INVALID, no unknown fields, the same 4 co-fire warnings, 8 notices and 2 missing-recommended; critical path 2 hops; geometry and door alignment OK;
- `check_door_alignment.py`: all OK;
- inkcheck at `start`: Victoria, briefing, phone and guard 800/800, debrief 3/3;
- loopcheck clean on:
  - Victoria `hub` (dropped/10; dropped/eager/20) and `clone_check_1` (read_checked/10);
  - guard `on_lockpick_detected` ×3;
  - phone `hub` at night;
  - the debrief across 4 fates × catalogue found/not (8/8);
- path simulations: fail and recover (tags fire once), the major-1 locals-lost hub, the roster-only night opener, the recruited debrief.

**[playtest 3b] Fixes from the second browser playtest (game 1218, `tools/playtest/m03-pass3b-report.md`):**

1. **"Double catch".**
   - *Cause, from the session log* (`tools/playtest/m03-pass3b-gameA-session.jsonl`, seq 864-923). It was not a re-fire. The first catch came from an interact at 10:34:58, and that conversation closed at 10:35:19.
   - A second interact at 10:35:28 did **nothing at all**, with no minigame and no conversation. It was inside the mapping's 30 s cooldown. The engine's interrupt gate (`npc-manager.js:261-340`, called from `unlock-system.js:187-200`) checks only that a `lockpick_used_in_view` mapping exists, not its cooldown or condition, so it cancels the pick even when the mapping won't fire. **Engine bug, reported, not touched.**
   - A third interact at 10:35:39, from the same spot and still in his view, was a genuine second catch (the "0.4 s" was measured from that interact, not from the first conversation). So the player paid two strikes for one approach.
   - *Fix:* one approach = one strike. The guard ink sets a synced `guard_grace` on a catch. While it is set, a further pick attempt in his view plays a no-strike line ("I'm still stood here, you know. Away from the door. … Come back when his back's turned.") and doesn't touch `guard_detection_count`. `closing_debrief` clears `guard_grace` on `room_entered:main_hallway` / `danny_office`, so a new approach after leaving the corridor is a new strike. The mapping cooldown is cut from 30 s to 3 s, so a retry gets that line rather than the silent swallow.
   - *Stealth beat check (E2 facing fix in).* The patrol runs at 40 px/s, about 11.4 s per loop:
     - (5,3) dwell 2.5 s, then east along row 3 for 2.4 s, facing the door: **seen**;
     - down to (8,4), dwell 2.5 s facing down, then west along row 4 for 2.4 s: **back to the door, safe for about 5 s**;
     - up to (5,3) for 0.8 s, partly in view, then a dwell facing up: about 69° off the door line, just outside the ±60° cone.

     The gate checks LOS only when the pick starts, so starting it as he turns down at the east end works. That still needs a live confirmation.
2. **Safe code not found.**
   - *Cause:* the chain was intact (whiteboard → Sterling's PC → the unsent email → Base64 → 5829), but the link from "COMES BY MAIL" to a file named "Unsent draft (raw message source)" was too weak. Tester 2 never opened the PC's files, and HaX's automatic pointer had been cut in P5.
   - *Fix, without giving the code away:*
     - the whiteboard now says "SHE IS MAILING THE NEW ONE FROM HER OFFICE", which names the room;
     - the PC file is renamed "Unsent email to the night team (raw source)", so the label matches the board;
     - HaX's automatic PC-access call gains one line, **only if the whiteboard was read**: "that board… said she mails the night team from in there. Anything she hasn't sent yet is worth a look.";
     - HaX's on-request hint says "Check what's sitting on her machine unsent."

     The decode is still the player's job.
3. **Safe and cabinet overlap.** *Cause:* `room_servers` has its two `safe4` slots stacked at the west wall, at x 10/11 and y-bottom 200/226 (`room_servers.json`). Both server-room "safe" objects took them, so they sat 26 px apart. *Fix:* the wall safe is pinned at tile `{x: 0.3, y: 2.2}` (top-left origin, `rooms.js` setOrigin(0,0)), high on the west wall in the strip left of the first server row. It is now about 100 px from the cabinet's slot and clear of the phone (y ≤ 53) and the suitcase slot (x 67-81). The cabinet keeps its slot.
4. **500 error.** *Cause:* `test/dummy/log/development.log`. Every game-1218 500 is `POST /games/1218/tts`, including 11:35:40 local, the second catch. The Gemini TTS quota was exhausted (429, `QuotaExhaustedError` at `tts_service.rb:277`), and `games_controller.rb:572` lets it surface as a 500. The `sync_state` request near a 500 in the log is interleaved with a TTS failure; it returned 200. **Engine/server, reported, not mission data.** New pass-3 lines have no cached audio, so they hit the quota.
5. **Repeated lab question after "Drift back".** *Cause:* the reload. The questions were once-only `*` choices, and a reload restarts the story with variables restored but visit counts lost. *Fix:* each question is now gated on its own ink variable (`asked_lab_services`, `asked_lab_access`, `asked_lab_praise`), and ink variables survive a reload. Simulated: `asked_lab_services=true` after a drop → "Drift back" offers only the other two.

**Done when, re-run after the 3b fixes:**
- compile 7/7;
- validator: 0 errors, 0 INVALID, no unknown fields, the same 4 co-fire warnings, 8 notices and 2 missing-recommended; critical path 2 hops; geometry and door alignment OK;
- `check_door_alignment.py`: 6/6 OK;
- loopcheck clean on:
  - guard `on_lockpick_detected` with `guard_grace=true`, and at counts 1 and 2;
  - Victoria `hub` after a drop with `asked_lab_services=true`;
  - phone `on_victoria_computer_accessed` with `whiteboard_seen=true`;
- simulations:
  - first catch then a retry in view → the "still stood here" line, count stays 1;
  - the rendered whiteboard decodes to the new text, and the wall safe carries its position.

inkcheck at `start` after the 3b fixes: Victoria, guard and phone each 800/800 clean; debrief 3/3.

**[playtest 3c/3d] Fixes from games 1226, 1236 (recruit) and 1225 (arrest).** Both completed runs had correct credits and debriefs for their fates. The strike rules, the safe/cabinet separation and the unaided safe-code trail all passed.

1. **No stealth window (major).**
   - *Cause:* the guard had no `facePlayer`/`pauseForPlayer` settings, so the engine defaults applied: `facePlayer: true`, `facePlayerDistance: 96`, `patrol.pauseForPlayer: true` (`npc-behavior.js:318-328`). Every point of his loop is within 96 px of the door pick spot (565,-90), so a player at the door stopped his patrol and turned him to face them in about 0.3 s. HaX's "when his back's turned" was false.
   - *Fix:* `facePlayer: false` and `patrol.pauseForPlayer: false`. The cone is widened from 120° to 140°, m02's guard value, because with 120° plus no facing he saw the door for only about 2 s of the loop.
   - *Computation* (patrol at 40 px/s; waypoints at about x 484/580, y -59/-27 from the observed loop; 8-way facing from movement; LOS range 150; checked every 0.05 s against (565,-90)):
     - 120° cone: seen 0.0-1.6 s and 8.1-8.5 s, safe the rest;
     - **140° cone: seen 0.0-1.8 s (heading east from the west end) and 8.1-11.4 s (walking up and dwelling at the west end facing the door); safe 1.8-8.1 s, a clean 6.3 s window each loop** (dwelling at the east end facing down, then walking west with his back to the door).
   - Since the LOS gate runs only when the pick starts, a human waits at the door, watches him pass and turn down, then picks.
   - *Hints kept true:* HaX's lockpicking field-guide line now says "only once he's passed the door and turned away from it" (it used to say "at the far end of his patrol", which is the facing-the-door dwell under 140°). "Wait until his back's turned" stays.
2. **Clone not recoverable (major).**
   - *Cause:* both clones completed their task and set their global from the ink tag batch (`#complete_task` / `#set_global` beside `#clone_keycard`). Closing the flipper before Save left no card but a ticked task, and the clone option had gone.
   - *Fix, m04 Vance pattern:*
     - New `card_cloned` mappings complete the tasks only on Save (`rfid-minigame.js handleSaveCard` emits it with `cardName`). "Staff Access Badge" (on the receptionist) sets `reception_badge_cloned` and completes `clone_reception_badge`. "Executive Keycard" (on HaX) sets `victoria_card_cloned` and completes `clone_rfid_card`.
     - Each mapping sits on a different NPC, so the validator's co-fire warning count is unchanged.
     - The ink tags now sit on throwaway lines, followed by a debrief knot that checks the synced global.
     - Receptionist: the hub's "Lean across the desk" option shows while `not reception_badge_cloned`.
     - Victoria: `start` routes on `victoria_card_cloned` alone. The hub offers "[Lean back towards the whiteboard. The cloner needs another read.]" → `clone_recapture` while the beats are done but the card isn't saved, and `idle` uses the global too.
   - *Simulated:* tag fires, not saved → the option is offered again; saved → normal flow. No `complete_task` tags remain in either ink file.
3. **Price mismatch.** The unsent email now says ProFTPD-class $25k and Struts $18k, matching the catalogue (`erb:52`).
4. **Phone over the PIN result.**
   - *Cause:* the HaX catalogue call opened on `objective_task_completed:lore_fragment_2`, which fires as the safe unlocks.
   - *Fix:* that mapping now only sets `lore_catalogue_found`. The call opens on `global_variable_changed:catalogue_seen` (the catalogue's onRead), after the PIN screen has closed.
   - Not changed: the PC-access call (`objective_task_completed:access_victoria_computer`) has the same shape against the password screen. It wasn't reported, so it is left for a playtest look.
5. **Revelation call twice in the phone history.**
   - *Cause:* the event fired once (game 1225 drain: one `objective_task_completed:submit_distcc_flag`). The engine's phone restore (`phone-chat-minigame.js`, "Re-navigated to … to re-evaluate choices") jumps to the knot owning the current choices whenever a synced global has changed, and replays that knot's text. `m2_revelation_call` held its choices after four lines of text, and globals change constantly at that point (flags, `night_confrontation_ready`).
   - *Fix:* `m2_revelation_call` and `m2_revelation_impact` now divert to choices-only knots (`m2_revelation_choices`, `m2_revelation_impact_choices`); `on_victoria_ko_card` drops its acknowledgement choice and returns to `hub`.
   - *Verified in inkjs:* the owner of the first choice is `m2_revelation_choices`, and re-navigating to it replays "" (empty).
   - **Engine behaviour reported:** re-navigation replays text in any knot whose choices follow text. The other phone knots with an acknowledgement choice (hints, guides) are still exposed, but only if a global changes while that choice is pending.
6. **"You left some of the paper behind."** The block now names what was left: the history in her filing cabinet, the catalogue in the wall safe, the drive in her desk. The "whole paper trail" test and its negation use the same `catalogue_seen`/`usb_seen` fallbacks. Simulated: recruited with catalogue and drive but no history → names only the filing cabinet.
7. **"Readable: No / Clonable: No" before Save.**
   - *Cause:* not mission data. MIFARE cards show "Readable: No" until a key attack recovers sectors (`rfid-data.js:166-177`). m03's cards are MIFARE on purpose: weak defaults, then custom keys, which is the two-stage lesson. m04's Vance card is EM4100, which reads directly.
   - The defect is that **Save is offered and succeeds with 0 keys known**, so the screen says "No" and then clones anyway. **Engine, reported:** the clone flow should require the key attack first, or the screen should reflect the clone mode.
8. **Safe out of interact range.** The pin moved from tile (0.3, 2.2) to (0.6, 2.6), about 10 px further onto the floor, so the player's approach can close inside 32 px. Still clear of the cabinet slot (y 174-200) and the phone (y ≤ 53). The harness's 33.4 px stop may be its own rounding, so this is a playtest check.

**Done when, re-run after the 3c fixes:**
- compile 7/7;
- validator: 0 errors, 0 INVALID, no unknown fields; the same 4 co-fire warnings, 8 notices and 2 missing-recommended; critical path 2 hops; geometry and door alignment OK;
- `check_door_alignment.py` 6/6 OK;
- loopcheck clean on:
  - Victoria `hub` (beats done, unsaved; and saved);
  - receptionist `hub`;
  - phone `m2_revelation_call`;
  - the debrief across 4 fates × paper found/not (8/8);
- simulations as listed above;
- inkcheck at `start`: Victoria, receptionist, phone and guard 800/800 clean; debrief 3/3.

**[playtest 3e] Confirmation run (game 1238, completed with a reload).** Clone retry passed for both clones; the stealth window passed 4 of 4 timed attempts; the wall safe, catalogue call and single revelation call all passed. Three items remained:

1. **PC call replaced the file list (FAIL 4b).**
   - *Cause:* `objective_task_completed:access_victoria_computer` fires as the password succeeds, before the PC's container opens.
   - *Fix:* the call now opens when the player opens one of the PC's files: `global_variable_changed:draft_seen` or `objective_task_completed:decode_client_roster` (the roster's own task, used so it doesn't share the `roster_seen` pattern). A `pc_call_done` global keeps it to one call. This is the same approach as the catalogue call.
2. **Catch at the west end.**
   - *Cause, confirmed:* with the 140° cone (half-angle 70°), his west-end dwell faced up at (485,-50). That is about 63-69° off the line to the door spot (565,-90), depending on exact sprite positions, so it sat on the cone edge. The simulation's closest-to-edge figure for that phase was 1°.
   - *Fix:* the loop now ends with a short step east, (5,4) → (4,4) → (4,3) → (5,3), so he arrives at the west dwell moving east and **dwells facing the door**. That is about 25° off the door line, clearly inside, with a 39° margin to the edge of a 120° cone.
   - The cone goes back to 120°. The east-end dwell (facing down) and the walk west are clearly outside. The only edge-near moments are the 0.8 s turns between legs.
   - *Recomputed* (same method as 3c; loop now 13.0 s): **seen 9.7-13.0 s and 0-1.6 s**, one block of about 4.9 s (west dwell facing east, then walking east until he is under the door). **Safe 1.6-9.7 s**, one block of about 8.1 s (east dwell facing down, walk west, step up).
   - *Hints:* "only once he's passed the door and turned away from it" and "when his back's turned" stay true. The walkthrough check is updated.
3. **Drop-site picked up the CyberChef laptop.**
   - *Cause:* `room_servers` puts the `workstation` slot (260,166) and the `flag-station` slot (262,172) on top of each other on the east desk.
   - *Fix:* the laptop is pinned on the west small desk at tile (4.53, 5.25), with elevation 32 so it draws on top of the desk. That is about 115 px from the drop-site. The west desk's vm-launcher slots are unused (the VM terminal sits elsewhere, about (209,-180) in the logs).

**Id renames (user rule).** The renames came from PASS2_IMPROVEMENTS.md and ALIGNMENT_PLAN.md progress: James Park → Danny Foster; CIPHER → Sable and Obsidian.

| Old | New |
|---|---|
| `ink/m03_james_choice.ink` / `.json` (and the `storyPath`) | `ink/m03_danny_choice.ink` / `.json` |
| room `james_office` (connections, `room_entered:` patterns, the `hear_debrief` backstop list) | `danny_office` |
| task `james_choice_made` (and `taskOnKO`) | `danny_choice_made` |
| globals `james_fate`, `james_ko` (and `globalVarOnKO`), `james_warned`, `james_protected`, `james_exposed`, `james_innocence_confirmed` (also in credit conditions and ink VARs) | `danny_fate`, `danny_ko`, `danny_warned`, `danny_protected`, `danny_exposed`, `danny_innocence_confirmed` |
| receptionist VAR `topic_james`, knot `ask_james` | `topic_danny`, `ask_danny` |
| debrief knot `james_discussion` | `danny_discussion` |
| graph label "James Office" | "Danny's Office" (regenerated) |

- Danny's NPC id was already `danny_foster`.
- CIPHER/Sable/Obsidian left no ids to rename.
- The rendered scenario and the compiled ink contain no "james".
- Dated rename notes were added to `ALIGNMENT_PLAN.md`, `PASS2_IMPROVEMENTS.md` and this plan.
- **Left alone:**
  - `agent_0x99`, HaX's id: it is the shared handler id m01/m02 also use, and the character is unchanged, only displayed as "Agent HaX". This needs a call if the rule is meant to cover it.
  - `planning_notes/overall_story_plan/…/m03_ghost_in_the_machine/stages/` still has old-name JSON. It sits outside the mission folder, so it is not touched.

**Done when, re-run after 3e and the rename:**
- compile 7/7;
- validator: 0 errors, 0 INVALID, no unknown fields; the same 4 co-fire warnings, 8 notices and 2 missing-recommended; critical path 2 hops; geometry and door alignment OK;
- `check_door_alignment.py` 6/6 OK;
- loopcheck clean on:
  - `m03_danny_choice` at `start` and at `after_choice` (`danny_fate=protected`);
  - receptionist `hub`;
  - the debrief across **4 Victoria fates × 5 Danny fates (20/20)**;
- inkcheck at `start`, all 7 files clean: Victoria, briefing, phone, receptionist and guard 800/800; Danny 9/9; debrief 3/3.

**[playtest 3f] Final run (game 1246, completed).** The PC call, the guard window (5 of 5 in-window picks uncaught, the outside pick caught), the laptop/drop-site separation and the debrief all passed. Two questions remained.

1. **"No Danny line in the credits."**
   - *How credits are built:* `scenario-music-events.js:127-131`. On `conversation_closed:closing_debrief`, each credit line's `condition` goes through `evaluateCondition` (`:34-53`). That binds `globalVars` to the live `window.gameState.globalVariables` at that moment, which is after the debrief, long after `danny_fate` is written by Danny's `#set_global`. `bond-visualiser.js:1228-1281` then shows the surviving lines **one at a time** (about 3.45 s each) in a separate `#bv-credits-overlay` element, which it hides when the sequence ends. Nothing truncates the list. Victoria's lines go through the same path.
   - *Game 1246:* the capture (session seq 1227-1230) is the text of `.bv-stage`, the visualiser's own panel ("SIGNAL ANALYSIS…", "OPERATIVE DATA…"). It contains **no credit lines at all**: not "MISSION COMPLETE", not Victoria. So it shows nothing about the Danny line. Evaluating the conditions against 1246's end state (arrested, `danny_fate='protected'`), the same way, gives 10 lines, with "DANNY FOSTER: PROTECTED — came in on his own, name kept out of the report" eighth, at about 24 s.
   - *Game 1236 (3d recruit):* the line-by-line capture (`m03-pass3d-recruit-credits-lines.txt`) matches the evaluated list exactly. There was no Danny line because Danny was never met: the end state had `james_fate=""`, the pre-rename name, so no fate condition could pass. That is correct behaviour, but the credits were silent about him while the debrief says "You never found the consultant".
   - **Not an engine bug.** *Mission fix:* a credit line for the unmet case, `"DANNY FOSTER: NEVER FOUND — his name is still in the recon files"` (warning style, `!globalVars.danny_fate`). Each of the five Danny states now produces exactly one Danny line (evaluated).
   - *Harness note for the playtest skill (not an m03 change):* read credits from `#bv-credits-overlay` / `#bv-cr-label` while they play, not from `.bv-stage`.
2. **Guard edge at the west dwell.**
   - *Computed:* the window ends when he starts the short step east into the west dwell. That is 9.7 s into my loop clock, and he crosses the door going east at 2.0 s, so in the tester's clock (time since he passed the door going east) the **window ends at about 7.7 s**. That matches the tester's observed arrival facing right at about 7.7 s (10.5 s on their sample clock, crossing at 2.8 s).
   - *Observed:* a pick started at about 8.0-8.3 s, just after arrival and facing the door, was not caught. One at about 10.3-10.6 s in the same dwell was caught. So the engine seems to update his facing slightly after arrival, and the effective window end is about 8.0-8.5 s. That is a few tenths of a second in the player's favour, not a flicker: there is no point late in the dwell where a pick is sometimes safe.
   - *Hints:* "once he's passed the door and turned away from it" and "when his back's turned" stay true. The walkthrough's "about 8 s window" spans both figures.
   - No config change.

*Done when after 3f:*
- validator: 0 errors, 0 INVALID, no unknown fields; the same 4 co-fire warnings, 8 notices and 2 missing-recommended; critical path 2 hops; geometry and door alignment OK;
- `check_door_alignment.py` 6/6 OK;
- credit evaluation: one Danny line for each of protected, exposed, left, ko and never found.

No ink changed in 3f, so compile, inkcheck and loopcheck results are unchanged from 3e.

**[r3] F5 window note (round 3 #4).** In `clone_read_dropped`, `read_dropped` is set before
any visible line. If the page reloads between her line and the next choice, the worst case is
one repeated line on re-talk, because the restart lands on `start` → hub. The same holds for
`eager_recruit`, whose state changes come first and which has no choice inside it.

---

## 1. Summary: what to do, in order

**Phase 1: bugs. Ship these whatever happens to the rest of the plan.**

| # | Change | Cost | Why |
|---|---|---|---|
| 0 | **[new r1] [changed r2] P0** Password clue becomes an IT reset slip (surname + founding year, with an example) | post-it, PC observation, 1 HaX line | The lock is `Sterling2010`. Every clue spells `VS2010`, so a player who follows them exactly is refused (F0) |
| 1 | **Done.** Receptionist layout lines | 3 ink lines | She said the executive wing is carded and that staff badges "cover the whole building". Neither is true, and the second contradicts her own line two knots earlier (F11) |
| 2 | **Done.** Debrief, escaped branch | 1 ink line | HaX said "the logs, the catalogue, the directive" to a player who may have neither (F12) |
| 3 | **Done.** Desk drawer observation | 1 string | "She did not expect anyone back here after hours" is shown in the afternoon too (F13) |
| 4 | **[changed r1] P12** HaX's KO relay line, plus four stale engine-gap comments | 1 ink line, 4 comments | Says Victoria's card is "still on her lanyard". With `18237332` it now drops (F10) |
| 5 | **P13** Debrief "grid… winter" with no source | 2 ink lines | HaX states Phase 2 detail the player never recovered (F14) |
| 6 | **P10** Honest decode tasks; move `decode_whiteboard` out of act 2 | small | Three "decode" tasks complete on opening the file. Skipping the whiteboard hides the conclusion aim (F6) |

**Phase 2: make the optional work matter. No new gates.**

| # | Change | Cost | Depends on |
|---|---|---|---|
| 7 | **P6** Perfect Stealth has to be earned | 1 global, 1 mapping, 2 conditions, 2 debrief lines | none |
| 8 | **[changed r1] P2** The catalogue puts Zero Day's stock and clients on notice | debrief branch + 2 credit lines | none |
| 9 | **[changed r1] P1** Recruiting Victoria needs the drive, plus **P3**, a Phase 2 opener based on what the player has seen, plus **[r3] P4** (moved here from Phase 3) | Victoria ink | none (one edit to `m03_npc_victoria.ink`) |
| 10 | **[new r1] P14** HaX nudges a player who reaches Victoria without the drive | 2 phone lines + 3 VARs | P1 |

**[new r2] Merge note.** P1, P3 and P4 all edit `m03_npc_victoria.ink` around
`nighttime_confrontation` and `confrontation_decision` (`:337-375`: the night line at :342,
the opener at :352, the decision at :369-375). P4 also edits the afternoon knots
(`:63-170`, `:224-290`). Implement them as one change to that file, with one inkcheck and
loopcheck run at the end, not three overlapping edits.

**Phase 3: chain depth and the capability arc.**

| # | Change | Cost | Depends on |
|---|---|---|---|
| 11 | **[r3] moved to row 9** | | |
| 12 | **[changed r1] P5** Cut HaX's unprompted safe pointer; reword the whiteboard | 2 lines | none |
| 13 | **[changed r1] P7** Observations describe the shape of the encoding, not the recipe; HaX's unprompted recipe goes too | 3 strings, 1 ink line | none |
| 14 | **[changed r1] P11** Cut the two narrator lines that pre-solve the password | 2 ink lines | P0 |
| 15 | **[changed r1] P8** The FTP box is the St. Catherine's exploit: say so | runbook text, 2 HaX lines, 1 field guide | none |
| 16 | **[changed r1] P9** Briefing: what the cloner replaces, and where the PIN cracker went | 2 ink lines | none |

**Phase 4: docs.** Regenerate the dungeon graph. Update `TESTING_WALKTHROUGH.md` for
anything in Phases 1–3 that changes codes, clues, task titles or routes. Its row 12
(`TESTING_WALKTHROUGH.md:77`) quotes the old post-it.

❌ **Dropped:** delete `main_hallway` (D1) · gate Sterling's office until night (D2) · put
the PIN cracker in m03's start kit (D3; now also the user's kit rule) · invent locks fed by
the roster or drive decodes (D4) · give the runbook unique content (D5) · move the CyberChef
laptop (D6) · P1 option B (D7) · draft 1's single trap question for P4 (D8). Reasons in §5.

**Needs user approval:** nothing open. The kit ruling settled A1–A3 (§10).

---

## 2. Headline numbers

| | m01 | m02 | **m03** |
|---|---|---|---|
| Rooms | 13 | 13 | **7** |
| Physical locks | 13 | 32 | **7** |
| Locks on the critical path | n/a | n/a | **2** (both RFID doors, both opened by a conversation) |
| VM flag challenges | 3 | 4 | **4** |
| **Critical path (hops through story aims)** | **9** | **4** | **2** |
| Empty rooms | 0 | 2 | **1** (`main_hallway`) |
| Story aims / tasks | 10 / 28 | 8 / 29 | **6 / 18** |
| Puzzle graph nodes / edges | 50 / 61 | 102 / 122 | **25 / 25** |

Sources: each mission's `dungeon_graph.md` statistics table (regenerated this session by the
validator) and `room_depth.py`.

m03 is a small mission, and its size is not the problem. Its whole physical-puzzle layer is
optional: the office pick under the guard, the password, four decodes, the safe, two
cabinets. The ending needs the four flags (`erb:329-336`) and Victoria's decision
(`erb:348-353`). Both critical-path locks open through dialogue, and today neither
dialogue can be got wrong (F16). That is where §4 starts.

---

## 3. Boss-key audit

Depths from `room_depth.py`: reception 0 · main_hallway 1 · conference_room_01,
executive_wing_hallway, server_room 2 · executive_office, danny_office 3.

**[new r1] How to read "Seen at".** It is the depth of the room the player stands in when
they first see the lock. A room door is seen from the room before it. So the conference door
is "seen at 1" although the conference room is at depth 2. The same applies to the server
room and Sterling's office.

| Lock | Seen at | Key / code | Key at | Verdict |
|---|---|---|---|---|
| Conference door, RFID `receptionist_badge` (`erb:856-858`) | 1 | Clone the receptionist's badge (`erb:515-519`; `m03_npc_receptionist.ink:226-233`) | 0 | ⚠️ **key-before-lock, accepted.** The clone is the tutorial beat. HaX's briefing (`m03_opening_briefing.ink:173`) and the task text (`erb:150-153`) tell the player to clone first, so the door opening is expected |
| Server room, RFID `victoria_keycard_clone` (`erb:931-933`) | 1 | Victoria's clone in the conference room (`m03_npc_victoria.ink:291-301`) | 2 | ✅ **boss-key.** Seen from the hallway, labelled "executive cards only" in the lobby directory (`erb:422`). The card is won in another room and the walk back is the payoff. After P4, how she is handled decides whether the read lands first time |
| Sterling's office, key (`erb:1101-1104`) | 2 | Lockpicks (start kit, `erb:389-396`) | 0 | ✅ *by design.* m01's grant, banked. The cost is the guard's cone (`erb:1062-1080`) |
| Server-room filing cabinet, key (`erb:940-943`) | 2 | Lockpicks | 0 | ✅ *by design.* Nobody watches it |
| Sterling's filing cabinet, key (`erb:1110-1114`) | 3 | Lockpicks | 0 | ✅ *by design* |
| **[changed r1]** Sterling's PC, password `Sterling2010` (`erb:1134`) | 3 | Plaque (`erb:427-430`), plus a post-it on the same PC that today gives the **wrong** formula (`erb:1135, 1138`) | 0 | ❌ **broken today** (F0). After P0 and P11: ⚠️ key-before-lock in the m01 sentimental-date style. The post-it gives the formula; the year is at depth 0, also in the briefing and the receptionist's small talk |
| Wall safe, PIN 5829 (`erb:960-962`) | 2 | Sterling's unsent draft (`erb:1141-1147`), decoded on the CyberChef laptop (`erb:994-1001`) | 3 (code) / 2 (tool) | ✅ **boss-key if the server room comes first.** Whiteboard → office → PC → draft → back. ⚠️ **order-dependent.** Sterling's office is pickable from minute one, so an explorer can hold the draft before the server room opens. It reads as gibberish until they reach the laptop, then decodes beside the safe and the loop collapses into one room (F5). **[changed r1]** No cracker shortcut: under the kit rule the PIN cracker is not in m03's kit (`erb:371-397`), so 5829 has to be worked out |
| Drop-site flags (`erb:1004-1030`) | 2 | VM | 2 | technical; not a physical lock |

The encoded artefacts against the decode tool: the draft, roster and drive sit at depth 3,
the laptop at depth 2. That is tool-after-lock for an explorer and tool-before-material for
the server-room-first player. Either way the player meets something they can't read before
they hold the means to read it. Keep it (D6).

---

## 4. Findings

### [new r1] F0. The password clues spell the wrong password

The lock requires `Sterling2010` (`erb:1134`), compared exactly (`game.rb:796`:
`room['requires'].to_s == attempt.to_s`). Every clue gives a different answer:

- the post-it reads "VS / founding year" (`erb:1135`), repeated in the PC observation (`erb:1138`);
- HaX's on-request hint says "Her initials, then the year. That's her login." (`m03_phone_agent0x99.ink:167-168`).

Both give `VS2010`. A player who solves the clue correctly is refused, and HaX's hint
confirms the wrong answer. The walkthrough has the right password next to the wrong post-it
(`TESTING_WALKTHROUGH.md:77`), which is probably how the mismatch survived the pass-2
playtest. Grep found no other "initials" or "VS /" clue. Round 1 found this; I re-verified
it. Fix: P0.

### 3a. Are the mission's own choices required?

**F1. Nothing physical is on the critical path.** `moral_choices` (`erb:317-366`) needs
`victoria_choice_made` and `hear_debrief`. `danny_choice_made` is optional (`erb:345`).
`concludeRequires` is the four flag tasks (`erb:329-336`). The aims
`search_executive_office`, `collect_lore` and `perfect_stealth` (`erb:241-316`) gate
nothing. A player can clone two cards, run the VM, walk into the conference room and
finish. They never pick a lock, never see the guard, never type a password, never decode
anything.

That is acceptable as structure. `concludeRequires` is for technical work, and story gates
make dead ends (skill Step 1). The problem is that the optional work has **no consequence
anywhere except the debrief's "you left some of the paper behind" line**
(`m03_closing_debrief.ink:250-254`):

- Victoria's three openers and three outcomes are unconditional (`m03_npc_victoria.ink:343-375`). The recruit deal is offered to a player who has never seen the Phase 2 directive.
- The catalogue in the safe, the end of the mission's longest chain, repeats what the transaction log already proves. The log is a guaranteed distcc reward (`erb:1017`). Both name Ghost, ZDS-2024-0847, St. Catherine's and Sable (`erb:51`, `erb:55`). The safe currently buys a phone call (`m03_phone_agent0x99.ink:266-270`) and one-third of a debrief line.

This is m02's B0/B7 shape, the optional safe and the decorative dilemma. m02 fixed it with
consequence, not a gate: the safe bought the right to refuse the ransom. P1 and P2 do the
same here.

**F2. Perfect Stealth is free if you never meet the guard.** `zero_detection` completes in
the debrief when `guard_detection_count == 0` (`m03_closing_debrief.ink:32-35`). The credit
"PERFECT STEALTH — never detected by security" has the same condition (`erb:132`). The only
place the guard can detect anyone is the lockpick on Sterling's door. `lockpick_used_in_view`
is his only detection mapping (`erb:1081-1091`); the others are his own conversation choices
(`m03_npc_guard.ink:160, 201, 368, 390`). So a player who skips the executive wing gets the
award. After `18237332` a KO'd guard no longer sees picks either, so "knock him out, then
pick" also scores as perfect stealth.

**F3. No "Prerequisite:" text in m03's minigame data.** Checked by grep; nothing to enforce.

### [new r1] F16. Victoria's suspicion is tracked and never used

`victoria_suspicious` goes up at `m03_npc_victoria.ink:77, 101, 152, 266` and is a scenario
global (`erb:1269`). Nothing reads it, in ink or in the scenario (grep: no other hits). The
afternoon interview has choices that read as an investigator (+10 at :101 "Sounds like you
sell vulnerabilities" and at :152 "That sounds like wilful ignorance", +5 at :77 and :266),
but they cost nothing. The clone always lands (`:237-301`). Her night line "You asked about
the training network twice this afternoon" (`:342`) plays whatever the player did. So act 1,
the mission's own capability, has no way to be played badly. Round 1 found this; I
re-verified it. Fix: P4.

### 3b. Does the mission earn the capability it grants?

**F4. The RFID cloner is earned across missions, but nothing says so.** The cloner is
issued at the start (`erb:380-387`) and the first RFID door is at depth 1. On its own that
would read as a free pass. The "before" is m02: an entire aim, "Work Gary Whitlock for the
server room keycard" (`m02 erb:251, 265`), offered rapport, leverage, theft or force to get
one card. In m03 you stand near the card. That is a real promotion. Nobody in m03 points at
the contrast, so a player who doesn't remember Gary feels nothing (P9).

**[changed r1]** The **PIN cracker** from m02 (`m02 erb:2272-2277`) is not in m03's kit
(`erb:371-397`). The user's kit ruling makes that the rule. The cracker is an ENTROPY device
SAFETYNET is studying, in limited supply. It is never in a start kit after m02, and PIN locks
stay normal puzzles. The design reason holds as well. The engine reads the cracker from
inventory and turns on the info-leak toggle on every PIN pad (`minigame-starters.js:500-503`,
`pin-minigame.js:170`). Attempts reset when the pad is reopened: the server has no lockout
(`game.rb:746-869`) and the counter is per minigame instance. With the cracker, 5829 would
fall to Mastermind-style probing and the mission's best chain would be optional. m02's
debrief ends with Nightshade taking the device apart (`m02_closing_debrief.ink:121-128`), but
m03 never says where it went. One HaX line closes that (P9).

### 3c. Chain depth and separation

**F5. The safe loop is order-dependent.** See the audit. Sterling's office has no gate
beyond the pick (`erb:1101-1104`). Its aim's `unlockCondition` (`erb:247`) hides the aim but
locks nothing, and since `18237332` a task finished early keeps its aim hidden
(`objectives-manager.js:641-650`). No mission-local primitive can hold the office until
night: locks can't be conditional, and `patrolOverride` is a one-way `goToAndStay`
(`npc-manager.js:634-654`). Early access also gives act 1 its only physical beat (§8). This
plan keeps it and makes both orders honest instead (P5, P7).

**F6. Three "decode" tasks complete on opening the file.** `decode_whiteboard`,
`decode_client_roster` and `lore_fragment_3` complete from `onRead` globals
(`erb:983, 1156, 1174` → mappings `erb:788-805`). The CyberChef laptop is an iframe that
emits nothing (`crypto-workstation.js`, 55 lines, no events; `interactions.js:766-784`), so
the engine can't observe a decode. Only the draft's decode is checked, by the safe.

There is a second effect. `decode_whiteboard` sits in `act2_breach_server_room`
(`erb:233-238`), and `moral_choices` unlocks on that aim (`erb:324`). A player who never
clicks the whiteboard plays the confrontation with "Settle Accounts" hidden. The server
concludes regardless (`game.rb:1304-1320` gates only on `concludeRequires`), so this costs
UI, not the ending.

**[changed r1] F7. The founding year is over-sourced, and two lines pre-solve it.** The
sources are the plaque (`erb:427-430`), the receptionist twice
(`m03_npc_receptionist.ink:67, 184`), her line that Danny has been there "since the
beginning - 2010" (`:167`), HaX's briefing (`m03_opening_briefing.ink:153`), and HaX's
on-request hint (`m03_phone_agent0x99.ink:167-168`). Two narrator lines go further: "You file
2010 away. Founding years end up in passwords." (`m03_npc_receptionist.ink:75, 194`). They
give the answer before the lock is seen, which is m02's "five sources for one PIN" tell.

**F8. HaX gives the whiteboard's answer unprompted.** On PC access the automatic call says
"And her drafts -- the wall-safe code lives in there." (`m03_phone_agent0x99.ink:228`). In
the server-room-first order the player already knows this from the whiteboard. In the
office-first order HaX hands it over before the safe has been seen. The whiteboard decode
(`erb:41`) is redundant either way. The on-request hint (`:169`) is the right tier for it.

### 3d. Would every object exist anyway?

- **Whiteboard (ROT13), night team, hiding it from day staff:** motive ✅ (`erb:35-41`). One wrinkle: it says the new code "IS IN HER DRAFTS", and the night team can't read an unsent draft. P5 fixes the wording.
- **Draft (Base64):** a raw MIME body. Transport encoding needs no human motive ✅ (`erb:1145-1146`).
- **Drive (Base64 over ROT13), the Architect's directive:** an antagonist with a motive ✅ (`erb:46-47`).
- **Client roster (hex):** nobody in-world has a reason to hex-encode their own export. ⚠️ P7 gives it one: it is a raw dump from the marketplace database.
- **Post-it:** contrived for a security CEO, but it is m01's tradition and fits her arrogance. Keep it; P0 corrects what it says.
- **Runbook in the server cabinet:** students' paperwork ✅. Its content repeats the conference whiteboard, HaX's hint and the briefing (D5), and step 2 is misleading (F15).

### Bug sweep (Step 4)

**F9. KO'd guard line-of-sight (approval log m03 §5) is resolved** by `18237332` ("hidden or
KO'd NPCs no longer see lockpicking"). Nothing to do in m03 except P6, and the stale comment
at `erb:1045` (P12).

**F10. HaX's KO relay now contradicts the engine.** `on_victoria_ko_card` says "Her card's
still on her lanyard, and I'm not having you rifle a CEO's pockets"
(`m03_phone_agent0x99.ink:282`). With `_sprite` preserved, Victoria's `itemsHeld` keycard
(`erb:912-921`) should now drop when she is KO'd. The player would see it on the floor while
HaX says it is on her lanyard. Not live-verified (P12).

**F11 (fixed). Receptionist geography.** "RFID badges throughout - conference area, server
room, executive wing" and "Staff badges cover the whole building" contradicted the
connections: the wing has no lock (`erb:1035-1043`) and the office is keyed
(`erb:1101-1102`). They also contradicted her own "Server room… executive cards only"
(`m03_npc_receptionist.ink:209`). A player could reasonably think her badge opens the server
room. "Main offices down the central hallway" was wrong too: `main_hallway` has no offices
(`erb:842-852`).

**F12 (fixed). Debrief, escaped branch:** it claimed the catalogue and directive
unconditionally (`m03_closing_debrief.ink:145`).

**F13 (fixed). Drawer observation** "back here after hours" (`erb:1165`), reachable in the
afternoon (F5).

**F14. Debrief "Infrastructure. Grid and healthcare. Winter."**
(`m03_closing_debrief.ink:180`) plays when the directive was *not* found. "Grid" comes from
the directive (`erb:46`) or the roster (`erb:43`); "winter" only from the directive. The
transaction log says only "Phase 2 sourcing continues" (`erb:55`). HaX is quoting a document
the player didn't bring out.

**[changed r1] F15. The FTP flag needs the ProFTPD backdoor, and two texts point
elsewhere.** The SecGen scenario's flag 2 is `proftpd_133c_backdoor`
(`SecGen/scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml:110-122`). The module
writes the flag to `/root` with mode 0600; anonymous FTP gets only a generated pre-leak note
(`modules/vulnerabilities/unix/ftp/proftpd_133c_backdoor/manifests/config.pp:36-49`).

- The runbook says "The FTP box allows anonymous login. Read what you are given." (`erb:951`). That is literally true and sends the player the wrong way.
- HaX's `hint_network` says "FTP and the web host give you the client and pricing flags" (`m03_phone_agent0x99.ink:186`). No client flag exists: the FTP flag is `ftp_intel` (`erb:1010`) and the task calls it "FTP intelligence" (`erb:193-195`).

The box the player attacks runs **the exploit Zero Day sold Ghost for St. Catherine's**, and
m02 taught it (m02 hands out `proftpd-exploitation-workflow`). Nothing in m03 says so (P8).

**Clean (checked):**
- **Lab sheets:** all five field-guide URLs (`erb:567-600`) exist with matching permalinks in `HacktivityLabSheets/_labs/safetynet/`, are on `origin/main`, and return HTTP 200 live.
- **Event mappings:** no `item_picked_up:` mappings are keyed on ids (the only one, `erb:636`, uses the type `workstation`).
- **Author notes:** none. `[NOTE]` in the transaction log (`erb:55`) is an in-world log annotation.
- **Rename residue:** the `danny_*` identifiers are internal only.
- **Numbers:** catalogue, log and draft prices agree. Currency is stated in-world as US dollars, the ransom in GBP.
- **CVEs:** CVE-2004-2687 for distcc is correct. No CVE is quoted for the ProFTPD backdoor, which is correct.
- **Directions:** the guard ink's directions match `connections`.
- **Validator:** 0 errors, 0 INVALID. The 4 co-fire warnings and 8 notices are the ones pass 2 justified.

---

## 5. Proposals

### [new r1] [changed r2] P0. The password clue becomes an IT reset slip ✅ *keep; do first*

Keep the password `Sterling2010` (orchestrator ruling). Change the clues.

**[changed r2] Why not draft 2's "SURNAME / FOUNDING YR".** Round 2 made two points, and I
verified both:
- Nobody writes a placeholder for their own name, so it fails Step 3d.
- The all-caps wording is a casing trap. `game.rb:796` is an exact, case-sensitive compare, so `STERLING2010` and `sterling2010` both fail.

**The new source: an IT helpdesk reset slip** stuck to her monitor.
- **It has an author with a motive.** The helpdesk tells a user their temporary password.
- **The example fixes both case and format.** `Smith1999` shows a capitalised surname followed by four digits.
- **She never changed it.** That fits her arrogance and echoes the mission's theme: a security CEO on a house-default password, like the receptionist's weak-default card.

The player still has to find the year.

- **Post-it (`erb:1135`).** Existing post-its run to 70 characters at most (m01/m02 scan), and the password minigame renders them in a small `.postit-note` block (`password-minigame.js:137-139`). So keep it short: "IT: reset to house default (Surname + year founded, e.g. Smith1999). CHANGE IT!" **[r3] Shipped instead: the 61-character "IT reset: Surname + year founded (e.g. Smith1999). Change it!".** The new PC observation replaces all of `erb:1138`
- **PC observation (`erb:1138`)** carries the fuller slip: "A helpdesk slip is stuck to the monitor: your password was reset to the house default, surname plus the year we were founded (e.g. Smith1999). Please change it at next login. It doesn't look as if she did."
- **HaX (`m03_phone_agent0x99.ink:167-168`):** "People never change the default. That slip on her monitor tells you the format. The founding year's on the plaque in reception." Drop "Her initials, then the year. That's her login." The on-request hint gives the parts, not the assembled answer.
- **`TESTING_WALKTHROUGH.md:77`:** the new clue text.

Grep for any other "initials", "VS /" or "VS2010" clue: none today. Re-run after P11.

**Cost:** 3 strings, 1 ink line. **Depends on:** nothing. **Verify:** in the playtest, check
that the post-it fits its block, then type `Sterling2010` into the password minigame.

### [changed r1] P1. Recruiting Victoria needs the drive ✅ *keep (option A)*

**Story logic.** Victoria's own line is that she is "a line item" to the Architect
(`m03_npc_victoria.ink:365`). She deals only with someone who can already hurt the plan,
someone holding the Phase 2 page. If the player took the drive from her desk, she trades
timing and rails for a deal. Without it, the offer is a bluff she sees through.

**What the gate checks [changed r1].** `lore_directive_found` is set when the player **opens**
the drive, not when they decode it. The chain is `usb_seen` onRead (`erb:1174`) →
`lore_fragment_3` (`erb:800-805`) → `lore_directive_found` (`erb:659-663`). Draft 1 said the
gate rewarded the decode, and that was wrong. The engine can't see a decode (F6). So the
lines are written around **possession**.

**[changed r2] Who says it.** Victoria can't know the drive is gone from her desk; she has
been in the conference room. So the possession goes in the **player's** line, and she
reacts to it.

**[changed r2] The gate condition.** Use `usb_seen or lore_directive_found`.
`lore_directive_found` is second-hand: it arrives via a task completion, which reverts if
the server sync fails (`objectives-manager.js:571-581`). `usb_seen` is written directly by
the item's onRead. Declare both VARs.

**Change.**
- In `confrontation_decision` (`:369-375`), replace the recruit choice with `+ {usb_seen or lore_directive_found} [I have the Phase 2 directive from your desk. Give me the Architect, and I'll fight for a deal.]`.
- Her acceptance in `confrontation_recruit` gains one line: "Then you already have the what. I'm the when."
- **[new r2]** In the debrief's `victoria_recruited_path` (`m03_closing_debrief.ink:93-97`), add a `lore_directive_found` nod: "And she knew you already had the directive. **[r3: "had", not "read"]** That's why she didn't try to sell us the parts we had."
- **[changed r1] Refusal, once.** Add a local `VAR recruit_refused = false` and `+ {not (usb_seen or lore_directive_found) and not recruit_refused} [Work for us.]` (condition updated in r2). That leads to a short knot that sets `recruit_refused = true`, where she declines ("In exchange for what? You haven't even taken what you'd be asking me to betray."). It diverts back to `confrontation_decision`. The refused option does not come back, so the choice can't loop against her "you have exactly one move" (`:366`).
- Arrest and walk-away stay unconditional, so the decision never empties.
- Declare `VAR lore_directive_found = false` (the scenario global exists, `erb:1297`).

**Effect.** The drive in her desk becomes the price of the mission's most valuable outcome.
Getting it means picking under the guard and searching her office. That is m02 C12's
architecture: a choice still exists without the work, and the work buys a better one.

**Cost:** ~12 ink lines. **Depends on:** nothing. **Risk:** §6.

### [changed r1] P2. The catalogue puts Zero Day's stock and clients on notice ✅ *keep*

**Story logic, corrected.** Round 1 pointed out that a price list gives vendors nothing to
patch: "Struts2 RCE: $18,000" names no bug. Draft 1's "burned before it sold" claimed too
much. What the catalogue does give:

- the **products** Zero Day holds working exploits for (Struts2, SMBv3, legacy distcc builds; `erb:51`), so vendors and operators can be told where to look;
- **proof** that SAFETYNET holds the list, so every buyer knows the stock is watched and the next sale may be a trap. Its value falls.

That is still Victoria's argument turned round (`:361`): the facts get to the people who can
defend against them.

**Change [changed r2].** In the debrief's `final_assessment` (`m03_closing_debrief.ink:248`),
add a `lore_catalogue_found` branch.

- **Every fate** gets the vendor line: operators are warned which products to audit. It goes out as the anonymous advisory HaX already describes for the Phase 2 list (`:204-205`).
- **Only when `victoria_fate != "recruited"`** does the second line play: the marketplace's buyers learn the list is in SAFETYNET's hands. A recruited Victoria "stays at Zero Day so nothing looks wrong" (`:95`), and telling her buyers the catalogue leaked would burn her.

Credits, after the St. Catherine's line (`erb:121`). Conditions are `new Function`, so plain
JS works:
- `"ZERO DAY CATALOGUE: IN SAFETYNET HANDS — vendors warned, buyers on notice"`, condition `globalVars.lore_catalogue_found === true && globalVars.victoria_fate !== 'recruited'`;
- `"ZERO DAY CATALOGUE: IN SAFETYNET HANDS — vendors quietly warned"`, condition `globalVars.lore_catalogue_found === true && globalVars.victoria_fate === 'recruited'`;
- warning style: `"ZERO DAY CATALOGUE: NOT RECOVERED — what else they hold is still unknown"`, condition `globalVars.lore_catalogue_found !== true`.
- **[r3]** As shipped, the "found" test is `catalogue_seen || lore_catalogue_found`. `catalogue_seen` is a new onRead global on the catalogue (`erb:967-973` area), so a reverted task sync can't hide the outcome. The "not found" line splits by fate: arrested gets "SEIZED WITH THE MARKETPLACE — but not in our hands". The vendor line stands alone in `final_assessment` after the paper-trail lines (`:250-255`), not in `architect_investigation`, which is reached only with the directive (`:160-177`).
- **[r3] Round 3 #2.** These unconditional lines also burned a recruited Victoria, so all three are gated on `victoria_fate != "recruited"`:
  - the credit "ZERO DAY SYNDICATE: EXPOSED" (`erb:120`);
  - the debrief's "Zero Day's exploit line is exposed.";
  - "…scrambling.".

  Recruited instead gets "ZERO DAY SYNDICATE: COMPROMISED — from the inside", "Zero Day doesn't know it's been read." and "…still think it's safe."

**[new r2] Why the last line was reworded.** Draft 2's "the stock is still for sale"
contradicted the arrested credit, "ARRESTED — marketplace seized" (`erb:125`). The new
wording holds for every fate.

**[changed r1] Condition syntax.** Credit conditions are evaluated with `new Function`
(`music/scenario-music-events.js:48`), not the eventMapping parser, so ordinary JS works
there. Draft 1 cited lesson 35 for this, and that was the wrong reason. The conditions above
need nothing special either way.

**Effect.** The safe (whiteboard → pick under the guard → password → decode → return) buys
an outcome nothing else gives. **Cost:** ~6 lines. **Depends on:** nothing.

### [changed r1] P3. The Phase 2 opener follows what the player has seen ✅ *keep (do with P1)*

"Phase 2. Healthcare SCADA. The grid. You're already sourcing the targets."
(`m03_npc_victoria.ink:352`) is offered to everyone. Gate it on
`usb_seen or lore_directive_found or roster_seen` **[changed r2]**; ink `or` is fine, because the `&&`-only rule applies
to eventMapping conditions. Both globals mean the file was **opened** (M2). Victoria's reply
is therefore written around what the player holds, not what they decoded. **[changed r2]**
Her reply is "So you've been through my office." Draft 2 said "my desk", which is wrong when
the opener is unlocked by the roster, since the roster is on her PC (`erb:1150-1157`).
Two openers always remain. Declare `VAR roster_seen` and `VAR usb_seen`.

### [changed r1] P4. Victoria's afternoon is the act-1 puzzle ✅ *keep, rebuilt*

**Today.** Every path through `clone_rfid_distraction` → `clone_check_1` → `clone_check_2`
reaches `clone_complete` (`:237-301`). "Custom keys: this will take a while. Keep her
talking." (`:233`) has no stakes, and her suspicion is never read (F16). A retry option
exists, "Keep her talking about the lab" (`:121-122`), but nothing reaches it.

**Draft 1** dropped the read on one trap question, "Who are your typical buyers?" (`:265`).
Round 1 pointed out that this is the most natural question for an investigator to ask, so
punishing it alone is arbitrary (D8).

**Change [new r1, changed r2].** Use the variable the interview already keeps.

1. **[changed r2] Warn on the beat itself.** Draft 2 put the warning in `clone_rfid_opportunity`. Round 2 pointed out that by then the outcome is already fixed, because suspicion never goes down. So the warning now plays the first time suspicion reaches 10, on the choice that takes it there. Put a guarded block after each suspicion increment that can cross 10 (`:101-103`, `:152-154`, and :177 below): `{victoria_suspicious >= 10 and not suspicion_warned: Narrator: Her smile stays exactly where it was. Her eyes don't.}`, then set `suspicion_warned = true`. The player is told at the moment it happens. **[r3]** It is a multi-line block (a `~` assignment can't sit inside `{cond: text}`), and with step 4 the warning is now actionable: the player can recover before the read.
2. **[new r2] Fairness: :177 adds +5.** "What about innocent people getting hurt?" is as far off-script for an eager recruit as :101, but today it adds no suspicion. Orchestrator ruling: +5 (out of character, not an accusation). One consequence I checked: the +5 at :77 ("Zero Day does interesting work") plus the +5 at :177 now reaches 10 with no openly accusing choice. That is intended, and the warning in step 1 fires on that beat too.
3. **[changed r2, r3] Fail once, with a reload guard.** At the top of `clone_check_1`, when `victoria_suspicious >= 10 and not eager_act_done and not read_dropped and not read_checked`, set `read_dropped = true`. She steps back to the table ("Let's sit back down."), a narrator line says the read dropped at half way, and the knot diverts to `hub`. Otherwise set `read_checked = true` and carry on. **Why `read_checked`:** a player at 5 who passes the check can take :266 (+5 → 10) in the same knot. If they reload at `clone_check_2`, the story restarts at `start` with its variables restored (`npc-conversation-state.js:120-140`). The retry would then reach `clone_check_1` again and fail a player who had already passed. `read_checked` stops that.
4. **[new r2, changed r3] A way back that costs a beat.** Round 3 found draft 3's "can still change course" was false: suspicion only fell through the eager beat, which was gated on `read_dropped`, so a warned player was guaranteed to fail. Ruling (b): the hub offers `+ {suspicion_warned and not eager_act_done and not rfid_clone_complete} [Play the eager recruit again]` **as soon as the player is warned**. It sets `eager_act_done = true` and lowers `victoria_suspicious` by 10, with a short exchange in which the player walks the earlier line back and she half-accepts it. The retry option is gated so the player has to earn it: `+ {read_dropped and not rfid_clone_complete and (victoria_suspicious < 10 or eager_act_done)} [Drift back to the whiteboard]`. A dropped read always leaves suspicion at 10 or more, so in practice the retry needs the eager-recruit beat first. **[r3]** `:121` "Keep her talking about the lab" **gains** `and not read_dropped` (draft 3 wrongly said it "stays"). It remains for a save that pauses mid-read and never shows after a drop. Verified: the hub with `rfid_clone_started=true read_dropped=true victoria_suspicious=10` offers only the eager beat. A player who heeds the warning recovers before the read; one who ignores it fails once and takes the eager beat afterwards.
5. **[new r2] The second pass doesn't repeat itself.** "Drift back to the whiteboard" plays "Narrator: Back at the board. The cloner finds her card again and picks up where it left off." Then `clone_rfid_distraction` guards its opening line (:239) with `{not read_dropped: …}`, so it isn't repeated word for word.
6. **Night line.** Gate `:342`: when `victoria_suspicious >= 10`, keep "You asked about the training network twice this afternoon. Once is curiosity. Twice is an inventory." Otherwise: "You were very easy to like this afternoon. That should have worried me sooner."

The local ink VARs are `read_dropped`, `read_checked`, `suspicion_warned` and `eager_act_done`. They are saved with the story's variables, which the engine exports and imports (`18237332`). `victoria_suspicious` is a scenario global (`erb:1269`), so the −10 persists the same way.

**What it does to play.** Before the read, the suspicion values she can hold are 0 to 30 in
steps of 5 (from :77, :101, :152 and now :177). :266 comes after the check, so it can't trip
it.
- A player who plays the curious recruit, as HaX advises (`m03_opening_briefing.ink:177`), clones first time.
- A player who argues is warned on the beat that does it.
- If they go to the board anyway, they lose the read and have to spend a beat buttering her up before they can try again.
- The backstop: it can't fail twice (`read_dropped`), so it can't soft-lock.

**Why it holds.** `clone_rfid_distraction` and `clone_check_1` use once-only `*` choices.
The fail fires before `clone_check_1` offers anything, so on the second pass all three of
its choices remain, and `clone_rfid_distraction` keeps at least two. No clone tags are on
the fail path, so D13's guard (`:294-301`) is untouched. The new hub options are sticky and
conditioned, and the existing `End the conversation` exit (`:123`) is always there, so the
hub never starves.

**Teaching value:** custom keys grind, so you have to stay in range. That is the lab's point,
and the player learns it from their own conduct. **Cost:** ~25 ink lines. **Depends on:**
nothing. **Merge with P1/P3** (§1 note).

### [changed r1] P5. Stop HaX giving away the whiteboard ✅ *keep*

- Cut "And her drafts -- the wall-safe code lives in there." from `on_victoria_computer_accessed` (`m03_phone_agent0x99.ink:228`). Keep the on-request hint (`:169`).
- **[changed r1] Whiteboard rewording, now taken (m6).** `erb:41` becomes "NIGHT TEAM: CATALOGUE STAYS IN THE WALL SAFE. SABLE HAS CHANGED THE CODE. NEW ONE COMES BY MAIL - DO NOT WRITE IT ON THIS BOARD." The pointer survives (her mail → the unsent draft), and the night team no longer claims to know about drafts it can't see. Update the header comment at `erb:35-39` to match.
- **[changed r2]** HaX's `:169` becomes "The wall safe's a different code. It goes to the night team by mail. Check what's sitting in her outbox." **[r3]** The first sentence stays in front, so "It" can't be read as the password. It now matches the whiteboard and still points at the unsent draft. **Cost:** 2 strings, 2 ink lines.

### [changed r1] P6. Perfect Stealth has to be earned ✅ *keep*

Add a global `exec_office_entered` (false), set by a HaX mapping on
`room_entered:executive_office` (`onceOnly`). Every route into that room passes the picked
door under the guard's patrol. Then:

- credits (`erb:132`): `globalVars.guard_detection_count === 0 && globalVars.exec_office_entered === true && globalVars.guard_knocked_out !== true`. It is a `new Function` condition (P2 note), so this is plain JS;
- debrief (`m03_closing_debrief.ink:32-35`): the same three terms gate `#complete_task:zero_detection`. Add one line for the player who never went near him: "The guard never saw you. Then again, you never gave him the chance." Declare both VARs.

**[r3] Which line each player hears (round 3 #13):**
- 0 detections + entered the office + no KO → Perfect Stealth line, task completes.
- 0 detections + guard KO'd (whatever else) → "The guard never logged you. Mind you, he spent most of the night unconscious, so I'm not calling it stealth."
- 0 detections + never entered + no KO → "you never gave him the chance".
- 1 or more detections → the existing lines.

The three zero-detection conditions are disjoint.

`guard_knocked_out` is written by `globalVarOnKO` (`erb:1061`) regardless of mappings (lesson
25), and the ink only reads it. **Cost:** ~8 lines. **Depends on:** nothing.

### [changed r1] P7. Observations describe the shape, not the recipe ✅ *keep*

The whiteboard already follows the m01/m02 convention ("the word lengths and punctuation hold
-- each letter swapped for another", `erb:982`). The other three name the recipe:

- "one solid block of Base64. Decode it." (`erb:1146`);
- "That is hexadecimal… run From Hex" (`erb:1155`);
- "Base64, then ROT13, on the laptop" (`erb:1173`).

Rewrite them to describe what the player sees: an unbroken block of letters, digits, + and /;
pairs of 0–9 and A–F; a block that still reads as nonsense after one pass. The roster's
observation also gets an author: "a raw export from the marketplace database".

**[new r1] HaX's unprompted recipe goes too.** Opening the drive fires
`on_architect_directive_found` (`erb:658-663`), whose line "Run it through the laptop --
Base64, then ROT13 -- and tell me what it says." (`m03_phone_agent0x99.ink:274`) would undo
the change. Reword it to "Run it through the laptop and tell me what it says."
`hint_encoding` (`:173-179`) keeps the full recipe as the on-request tier.

**Tension, kept on record.** m03 is the CyberChef teaching mission, and pass 2 added the
explicit recipes on purpose. The case for this change: identification is the skill the lab
teaches, and the hint tier is one phone call away. **Cost:** 3 strings, 1 ink line.

### P8. The FTP box is the St. Catherine's exploit ✅ *keep, extended in r1*

1. Runbook step 2 (`erb:951`): "The FTP box runs ProFTPD 1.3.3c, the trojaned 2010 build. Anonymous login works; nothing that matters lives in the anonymous folder." That is still the day staff talking, and it is true to the module.
2. HaX's server-room message (`erb:614`): add "Their FTP box is running the same backdoored ProFTPD that took St. Catherine's down. They rehearse on what they sell."
3. **[new r1]** `hint_network` (`m03_phone_agent0x99.ink:186`): "FTP and the web host give you the client and pricing flags" becomes "The FTP box is the ProFTPD backdoor you met at St. Catherine's; the web host has the price list."
4. Add m02's existing field guide to HaX's `itemsHeld` (`labUrl` `…/safetynet/proftpd-exploitation-workflow/`, live, HTTP 200), with a hub option gated on `netexploit_guide_offered`. Follow the pattern at `m03_phone_agent0x99.ink:56-61`.

**Effect.** The m02 VM skill is spent on purpose (✅ *by design* on the technical side), and
the player exploits the exact backdoor that killed patients. **Cost:** 3 strings, 1 item,
1 ink knot. **Depends on:** nothing. No SecGen change.

### [changed r1] P9. Briefing: what the cloner replaces, and where the cracker went ✅ *keep*

- **The cloner.** In `topic_clone` (`m03_opening_briefing.ink:171-178`), Nightshade gets one line: "Last time you had to talk a man out of his lanyard. This time you stand next to it." It is about the player's kit and his technical speciality; it seeds nothing.
- **The cracker [changed r1].** HaX, not Nightshade, and without draft 1's custody framing ("until I know what it phones home to"). Round 1 (B2) read that as a hindsight seed for the m08 mole, against the seed-NPC comment at `erb:480` ("NO hint of the m08 betrayal"). Mole seeding is a user call, so it is out. New line, in `topic_clone` or `topic_learn` (`:206`): "And no keypad gadget this time. Nightshade's still got the one from St. Catherine's on his bench, and we don't have a second." It fits the user's ruling (limited supply, under study), and the wording holds whether or not the player found the cracker in m02. **Cost:** 2 lines.

### P10. Honest decode tasks ✅ *keep*

- Retitle `decode_whiteboard` to "Read the night team's whiteboard" and `decode_client_roster` to "Recover Sterling's client roster". `lore_fragment_3` already reads "Read the drive".
- Move `decode_whiteboard` from `act2_breach_server_room` (`erb:233-238`) into `collect_lore`, next to the safe it belongs to. Act 2 then completes on the network work alone, and "Settle Accounts" reveals when the flags are in. Its status stays `active` (lesson 33).
- `collect_lore` unlocks on act 1 (`erb:272`), and the whiteboard can't be reached before then, so there is no early reveal.

### [changed r1] P11. Cut the pre-solving narrator lines ✅ *keep*

Cut "You file 2010 away. Founding years end up in passwords." (`m03_npc_receptionist.ink:75,
194`). Those are the only lines that name the year **as a password** before the PC is seen.
Draft 1 also claimed this would make the post-it "send the player back to the lobby". Round 1
pointed out that 2010 is also in the briefing (`m03_opening_briefing.ink:153`) and the
receptionist's spoken lines (`:67, :184`), so many players will already know it. The return
walk is available to a player who didn't note the year, not guaranteed. **Depends on:** P0.

### [changed r1] P12. KO relay line and stale engine-gap comments ✅ *keep (needs a live check)*

- Reword `m03_phone_agent0x99.ink:282` so it is true whether or not the card dropped: "If her card's come loose, leave it where it fell -- it's evidence. Nightshade lifted its keys from the reader logs and built you a copy." Keep the relay itself as the fallback (authoring rule: give required items a fallback).
- **[new r1] Four comments describe gaps `18237332` closed.** Update them so the next author isn't misled:
  - `erb:553`: the card "never drops";
  - `erb:723-727`: `globalVarOnKO` "without emitting a change event";
  - `erb:744`: the card never drops;
  - `erb:1045`: "LoS interrupt ignores visibility/KO".

  Mappings keyed on `npc_ko:<id>` still work and stay.
- Playtest check: KO Victoria before the clone and confirm whether a keycard drops.

### P13. HaX doesn't quote documents the player didn't bring ✅ *keep*

In the not-directive branch (`m03_closing_debrief.ink:178-182`), say "grid" only when
`roster_seen`, and drop "Winter". Otherwise: "Infrastructure, and soon. That's the shape of
it." Declare `VAR roster_seen`.

### [new r1] P14. Tell the player what the recruit option costs, before it costs it ✅ *keep*

P1's edit to `hint_confrontation` reaches only a player who asks. Two other places already
point at the drive, so the price is announced in-world:

- `m2_revelation_impact`: "If you find the directive, we get ahead of it for once." (`m03_phone_agent0x99.ink:253`), played automatically on the distcc flag;
- **[changed r2]** `report_progress`, `night_confrontation_ready` branch (`:196-198`): add a block on its own lines, before `-> report_end`, so the speaker prefix parses:
  ```
  { victoria_fate == "" and not (usb_seen or lore_directive_found):
      Agent HaX: And her desk drawer's still got that drive in it, if you want something to bargain with.
  }
  ```
  The `victoria_fate == ""` term keeps it off the day-KO path. There, `night_confrontation_ready` is set too, but Victoria is unconscious and her fate settles on entering the room (`erb:761-772`), so there is nobody to bargain with. Declare `VAR victoria_fate`, `VAR usb_seen` and `VAR lore_directive_found` in the phone ink.
- **[new r2]** P1's addition to `hint_confrontation` (`:75`) gets the same guard: `{ victoria_fate == "" and not (usb_seen or lore_directive_found): … }`. A player who already has the drive isn't told to fetch it.

**Cost:** 2 lines + 3 VAR declarations. **Depends on:** P1.

### Dropped

- **D1. Delete `main_hallway`.** ❌ It is the depth-1 junction for all four other routes. Deleting it moves upstream parity for every room after it (Step 5). An empty four-way hub is a router, not padding. Dressing is the `mission-room-dressing` skill's job.
- **D2. Hold Sterling's office until night.** ❌ No mission-local primitive does it (F5). Early access is also act 1's only physical beat (§8).
- **D3. Put the PIN cracker in the start kit.** ❌ It makes 5829 probe-able, so the whiteboard → PC → draft chain becomes optional. **[changed r1]** It is now also the user's kit rule: no cracker in any start kit after m02. P9's HaX line gives the in-story reason.
- **D4. Feed the roster or directive decode into a new lock** so the engine can check it. ❌ That invents a chain to match m01's pattern (Step 3d).
- **D5. Give the runbook unique content.** ❌ The redundancy is in VM guidance, where learners benefit. P8 fixes the one misleading step.
- **D6. Move the CyberChef laptop.** ❌ In both orders it already sits between the player and the encoded material (§3).
- **[new r1] D7. P1 option B (a quiz on what Phase 2 is).** ❌ Withdrawn. Round 1 kept option A; option B checked knowledge the engine still can't tie to a decode (the answer is guessable from HaX's own lines), and a wrong guess removed Victoria for good.
- **[new r1] D8. Draft 1's P4: one trap question drops the read.** ❌ Withdrawn. It punished the most natural question an investigator would ask (`:265`) and ignored the variable the interview already tracks. Replaced by the suspicion-driven P4.

---

## 6. What could break

- **Solvability.** None of P0–P14 touches a lock's key, a connection or `concludeRequires`. P0 changes only clue text; the password is unchanged. The critical path is unchanged: two clones, four flags, Victoria.
- **P0.** If any other clue still says initials, the bug survives. Grep `initials`, `VS /` and `VS2010` across the erb, the ink and the walkthrough after the edit.
- **P1 empties the decision?** No. Arrest and escape are unconditional. The refusal is once-only (`recruit_refused`) and returns to the same `+` knot. Run inkcheck on `nighttime_confrontation` with `usb_seen`/`lore_directive_found` true and false, and with `recruit_refused` true.
- **[new r2] P1 and a failed task sync.** Gating on `usb_seen or lore_directive_found` means a reverted `lore_fragment_3` sync (`objectives-manager.js:571-581`) can't hide the recruit option from a player who opened the drive.
- **[new r2] P2 and a recruited Victoria.** The buyers line and credit are excluded when `victoria_fate === 'recruited'`, so the catalogue outcome can't contradict "she stays at Zero Day so nothing looks wrong" (`m03_closing_debrief.ink:95`). Check all four fates × catalogue found/not found in the debrief inkcheck (pass 2's matrix plus one dimension).
- **P1 and the KO routes.** Both KO routes settle the fate without the knot (`erb:731-772`). Unaffected.
- **P1 and the debrief.** The `recruited` branch is unchanged; the outcome just becomes rarer.
- **[changed r2] P4 restore paths.** Simulate four cases:
  - suspicion 10 → fail → close → reopen → "Play the eager recruit again" → "Drift back to the whiteboard" → complete;
  - suspicion 5 → pass `clone_check_1` → :266 (+5) → reload at `clone_check_2` → retry → no second fail (`read_checked`);
  - the same with a restart from `start` (`npc-conversation-state.js:120-140`);
  - a reload between the fail and the eager-recruit beat.

  In every case `clone_rfid_card` must tick exactly once.
- **[r3] P4 warned-before-read path.** Accuse → warning → "Play the eager recruit again" → whiteboard → clone first time. Simulated ✅.
- **[changed r2] P4 worst case.** Influence −15 and suspicion 30 (pass 2's M8 case plus :177). The whiteboard option still appears once both topics are done (`:119`). The fail fires once. The eager-recruit beat drops suspicion to 20 and sets `eager_act_done`, which opens the retry. Neither option checks influence. Loopcheck the hub in that state, and in the state "dropped, eager beat not yet taken".
- **P4 and KO.** The existing KO handlers still complete `meet_victoria` and `clone_rfid_card` (`erb:731-742`) and relay the card (`:744-750`). A dropped read followed by a KO is covered.
- **P6.** If the `room_entered:executive_office` mapping misses, the worst case is a lost award, not a soft-lock.
- **P10 moving a task.** `completeTask:decode_whiteboard` is a mapping by id (`erb:788-793`), which doesn't depend on the aim. Re-run the validator for the "early task in a late aim" warning.
- **P8.** Adds a sixth guide to HaX's hub. Loopcheck `hub` with every guide offered (pass 2 did this for five).
- **[changed r2] P14.** `report_progress` gets one conditional block. Loopcheck the phone hub with `night_confrontation_ready` true and the three cases: drive found, drive not found, and day-KO (`victoria_fate == "ko"`).
- **Layout.** No layout change.

## 7. Dialogue implications

Apply `README_ink_best_practices.md`. Every new choice is first-person and differs in
consequence. Action tags go above their line. No new `DONE`.

- **[changed r2] P0:** the slip is written by IT, in IT's voice. HaX gives parts, not the answer ("People never change the default").
- **[changed r2] P1:** the player's choice names possession ("I have the Phase 2 directive from your desk…"); she only reacts. The refusal must sound like her: cool and amused, no anger, and said once. HaX's `hint_confrontation` (`m03_phone_agent0x99.ink:75`) adds, only when the drive hasn't been opened and her fate is unset: "and bring her something she can't shrug off. The drive in her desk." P14 carries the same message unprompted. The debrief nod in `victoria_recruited_path` is one HaX line.
- **[changed r2] P2:** one HaX line for every fate (the advisory) and one more unless she was recruited. Name product families, not prices, so HaX doesn't relay Victoria's numbers as fact (brief rule). Don't claim patches.
- **[changed r2] P3:** Victoria's response to the gated opener: "So you've been through my office."
- **[changed r2] P4:**
  - one warning narrator line on the beat that crosses 10;
  - one "Let's sit back down." from her, and one narrator line on the dropped read;
  - the eager-recruit exchange: the player walks back the earlier line in first person, and she accepts it coolly, not warmly;
  - the retry ("Drift back to the whiteboard") with its own narrator line;
  - an alternative night line.

  The player is never told a number. The :177 choice keeps its words; only its cost changes.
- **P6:** one HaX line, dry, not scolding.
- **P8:** one HaX line in a timed message, and a corrected `hint_network`.
- **P9:** one Nightshade line about the cloner (technical, collegial), and one HaX line about the cracker. No custody or "phones home" framing.
- **P12, P13, P14:** rewordings and one conditional line.

## 8. Pacing

- **[changed r1, r3] Act 1 is two conversations and a door, and after P4 the second conversation is the puzzle.** How the player plays the recruit decides whether Sterling's card comes cleanly or after a second approach. A warned player can walk the line back before going to the board (one extra beat); one who ignores the warning loses the read once and spends the same beat afterwards. The only other physical beat in the afternoon is Sterling's office under the guard, and that is why D2 is dropped.
- **The turn** (the clone, plus the night flip in the same mapping, `erb:621-624`) fires at depth 2. **The resolution** is Victoria back in the same room, and the bookend works: she has been waiting where you met her (`m03_npc_victoria.ink:340`). P4's night line now remembers how the afternoon went.
- **Final-act traversal:** server room → hallway → wing → Danny → wing → hallway → conference. That is six crossings, all through rooms the player already knows. HaX's message routes Danny first (`erb:721`). Acceptable; P1–P3 and P14 give the walk to Victoria something to carry.
- **Where it sags:** after the fourth flag, for the player who skipped the office and has nothing left but the walk. P1, P2 and P14 give that player a reason to go back for the drive and the safe before the confrontation.

## 9. Capability arc **[changed r1, user ruling]**

**The rule (PASS3_APPROVAL_LOG.md).** The kit is cumulative. Each mission starts with every
tool earned before it and grants at most one new class.

**The exception:** the PIN cracker. It is an ENTROPY device SAFETYNET is studying, in limited
supply, so it is not in start kits after m02. A mission may let the player find or be issued
one with an in-story reason. PIN locks stay normal puzzles.

| Mission | Grants | m03's use |
|---|---|---|
| m01 | Lockpicks | Banked (`erb:389-396`). Spent on Sterling's office and both cabinets ✅ *by design*; the guard makes the office pick cost something |
| m02 | PIN cracker (the exception); the ProFTPD backdoor as a VM skill | Cracker **not in the kit**, by rule and by design (D3). P9 gives the reason in-story, and 5829 is worked out. The ProFTPD skill is spent on the FTP flag (P8) |
| **m03** | **RFID cloner**: two stages, weak defaults at once and custom keys that make you hold range. Plus fluency in identifying and layering encodings | The promotion over m02's Gary aim (P9). P4 makes the custom-key stage depend on how the player handles Victoria |

**What m03 grants:** the RFID cloner (`erb:380-387`). The player has felt its absence: in
m01's RFID door (`m01 erb:1920`) and in m02's Gary aim, a card had to be obtained from a
person by persuasion or force.

**What m04 should do (for m04's planner; nothing here is m03 work):**
1. **Start kit:** phone, lockpicks, RFID cloner. No PIN cracker. Today m04 starts with phone, lockpick and an id badge (`m04` `startItemsInInventory`) and hands out keycards for its three RFID locks (`m04 erb:994, 1256, 1346`). Under the rule, the cloner is in the kit, and at least one of those doors should be opened by cloning a worker's card (by design), not by a handed-over keycard.
2. **New class: the fingerprint kit (biometric).** It was chosen by the user. The engine supports it (`unlock-system.js:350`; `interactions.js:464`; worked example in `scenarios/biometric_breach`). The schema enum addition is approved for m04. m04 should put a biometric lock where the player meets it **before** the kit, with picks, cloner and wits all failing on it, so the grant reads as a promotion. A fingerprint reader on an OT control-room door suits the facility.
3. **Time** (from pass 2's arc, still right): m03 has no clock and lets the player decode at leisure. m04's 0800 trigger takes that away.

## 10. Needs user approval **[changed r1]**

Resolved by the user's kit ruling (logged in `scenarios/PASS3_APPROVAL_LOG.md`):

- **A1. Carry rule:** the kit is cumulative, except the PIN cracker.
- **A2. Cracker's return:** any later mission may let the player find it or be issued it, with an in-story reason. It is not in start kits.
- **A3. `biometric` lock type:** the schema enum addition is approved for m04.

Nothing open for m03. No engine, SecGen or lab-sheet change is needed for anything in §5.

## Withdrawn

- **[new r2] Draft 2's post-it "SURNAME / FOUNDING YR".** Withdrawn after round 2. Nobody writes a placeholder for their own name (Step 3d), and the capitals invite `STERLING2010`, which the case-sensitive compare (`game.rb:796`) refuses. Replaced by the IT reset slip with an example.
- **[new r2] Draft 2's P2 wording "the stock is still for sale" and "buyers spooked" for every fate.** The first contradicted the arrested credit (`erb:125`); the second burned a recruited Victoria (`m03_closing_debrief.ink:95`).
- **[new r2] Draft 2's P4 telegraph in `clone_rfid_opportunity`.** It arrived after the outcome was fixed. Moved to the beat that raises suspicion.
- **[new r2] Draft 2's P1 line "You took the drive out of my desk" in Victoria's mouth.** She couldn't know. Moved into the player's choice.

- **"m03's field-guide lab sheets may 404."** Checked: all five exist under `HacktivityLabSheets/_labs/safetynet/` with matching permalinks, are on `origin/main`, and return 200.
- **"KO'd guard still interrupts picks" (approval log m03 §5).** Fixed by `18237332`; folded into P6 and P12.
- **[new r1] Draft 1's P9 Nightshade line on the cracker ("until I know what it phones home to").** Withdrawn after round 1 (B2): read in hindsight, it seeds the m08 mole, which `erb:480` forbids and which is a user call. Replaced by a HaX line.
- **[new r1] Draft 1's claim that P1/P3 reward the decode.** Wrong: the globals are set when the file is opened (`erb:1174`, `erb:800-805`, `erb:659-663`). The proposals are kept and reworded around possession.
- **[new r1] Draft 1's lesson-35 rationale for credit conditions.** Credits use `new Function` (`music/scenario-music-events.js:48`), not the eventMapping parser.
- **D7, D8:** see Dropped.

---

*Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds.*

## Pass 5 puzzle chains (2026-10-04)

Round-1 review `m03-puzzle-r1-review/REVIEW.md` (P2-1..P2-13) with orchestrator rulings. Bug fixes first, then the design items, each in dependency order. Boss-key table and headline numbers: see the review (unchanged by this pass; no layout change, no new locks).

Bug fixes (shippable on their own):
- P2-4: NOT changed in game. The clean removal is the hash form, but `scenario-schema.json` requires `flagRewards` to be an array (it does not yet allow the engine-preferred hash, `games_controller.rb:1995`), and the array is index-paired with `flags[i]`, so the distcc `give_item` must stay at index 3 and the three dead `emit_event` entries cannot simply be dropped. Re-keying progression onto those events is a Phase-5 change (needs a browser re-test). Left as-is with an explanatory comment. Engine/tooling item: allow the hash form in the schema, then remove the three. Dep: schema change.
- P2-8: ERB comment "raw MIME with a Base64 body" corrected to "the whole message Base64-encoded, shown as raw source" (the draft is wholly Base64). Dep: none.

Design items:
- P2-1: transaction log (`operational_log_content`) re-itemised to match m02's player-visible invoice ZDS-2024-0847 (ProFTPD $25k, recon/214 hospitals $15k, target selection $10k, deployment $5k, $55k total, 15% ENTROPY affiliate discount, SABLE/Architect sign-off). The +40% healthcare premium is demoted to a margin note pointing at the catalogue, so the catalogue keeps it as Zero Day's list-pricing logic and the Phase-1 spoken lines stay true. The catalogue (`lore_fragment_2`) is unchanged. Dep: none. XML sync: the draft XML flag4 transaction-log text must be updated to match (listed for the reviewer).
- P2-2 (light, ruled): the pre-arm "lean in near her lanyard" is removed from the opening message; the player meets the conference reader first, and a `door_unlock_attempt` mapping on `conference_room_01` (before the badge is cloned) has HaX introduce the cloner as the answer. Engine limit recorded: the cloner is always in the start kit, so a true "access denied, then granted the tool" is not possible mission-local; this is the least-cost version. Dep: none.
- P2-3: scan task description reworded to "read the service banners the scan turns up"; the server-room entry message no longer implies the scan itself emits a flag. Flag numbering kept. Dep: draft XML plants flag1 in the FTP banner + HTTP index (already in the draft).
- P2-5: distcc-is-the-records guidance thinned. The server-room entry message drops the "that's where their records are" spoiler and the redundant full sequence; the explicit "records on distcc" clue now lives in the briefing (spoken, kept), the runbook, and the on-demand `hint_network`. Dep: none.
- P2-6: office-PC password made a deduction. The worked example "(e.g. Smith1999)" is dropped from the post-it and the observation; the format stays (good security teaching), the year stays on the plaque and in flavour. Dep: none.
- P2-10: Perfect Stealth credit wording tightened to "never seen, never stopped, no deals" to match the `guard_challenged` gate. Dep: none.

Deferred / no change (ruled): P2-7 (quiz brute-force) and P2-13 (`player_approach`) to the dialogue phase; P2-9 (diegetic `[NOTE]`, not a bug); P2-11 (empty hub carries the act break, fine); P2-12 (PIN cracker rationing correct, no change); P2-2 full version and the capability-arc note for m04 are the user's.

### Round 2 (2026-10-04)

Review `m03-puzzle-r2-review/REVIEW.md` (P2-14..P2-18), rulings applied:
- P2-4/P2-15 (option B): the three dead `emit_event` flagRewards are now `set_global` rewards on write-only keys `vm_flag1_reward`..`vm_flag3_reward` (no panel, no reader); index pairing kept, distcc `give_item` still at index 3. The schema item E-2 is no longer needed for m03.
- P2-7: a wrong directive answer sets `directive_guessed`; the "decoded by the agent" credit and the debrief's "you read it yourself" line need a first-try right answer; a guesser gets "recovered by the agent, decoded at HQ" and the HQ debrief line. The optional task still completes.
- P2-16 (A and B): the aim, task and opening text no longer name the cloner before the reader; the door text drops "not your visitor pass". The receptionist's clone choice now needs `conference_reader_tried` (the door) or `cloner_explained` (briefing topic, HaX's clone hint or the RFID guide). A player who does neither is pointed at the reader by the task and by HaX's "Where do I stand?".
- P2-17: recon guide text now says the scan flag is in what the services say when you connect.
- P2-18: the log's invoice block gains a Target line and the discount moves to its own line. Draft XML flag 4 must be re-synced to the new `operational_log_content`.
- P2-14: fixed in the reviewer's round-2 draft XML; user item with SecGen D1.
