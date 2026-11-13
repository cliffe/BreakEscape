# m04 Critical Failure — Puzzle chains plan

Status: **implemented (draft 4, after review round 3).** Every ✅ item is in the m04 files,
plus the approved `biometric` lockType value in `scripts/scenario-schema.json`. Nothing is
committed. §0 records what was done, the deviations, and the Phase 4 "done when" results. The
Sonnet browser playtest (Phase 4 (a)–(g)) is the orchestrator's next step.

## 0. Implementation status [new r3]

**Done, in phase order.**
- **Phase 1.** Items 1–14:
  - P0 lethal force; P16; P17 (three lines); P15 privesc guide;
  - P20 Hall 1 at 1.1% amber; P21 ESD singular ×3; P22 advisory in Hall 2;
  - P23 audit lines (briefing ×3, guard ×3, Vance ×1); P24 paperwork lines; P25 comments (plus Cipher's header).
- **Phase 2.** Items 15–24:
  - P1 cloner in kit and kit line in `mission_objectives`; P2 clone restructure;
  - P3 Level 2 card to Relay; P4 biometric plant door and schema enum;
  - P5 tool case; P6 round panel; P7 export; P8; P9; P10.
- **Phase 3.** Items 25–31: P11a; P11b as specified after round 3; P12; P13; P14; P18; P19.
- **Phase 4.** Header layout comment rewritten. `TESTING_WALKTHROUGH.md` rewritten for the new chain, with the playtest checklist (a)–(g). Dungeon graph regenerated.

**Deviations (each verified, none changes a design decision).**
- **D-a. The cloned card is named "Level 1 Facility Card".** It is not "Facility Access Keycard (Level 1)". The validator rejects parentheses anywhere in a mapping condition (`safeEvaluateCondition` takes `&&`-joined simple terms only), and an apostrophe would break the single-quoted literal. The `card_cloned` condition is `data.cardName === 'Level 1 Facility Card'`. Vance's physical KO-drop card keeps its old name.
- **D-b. The merged FTP-flag mapping has no `privesc_guide_offered !== true` condition.** That mapping also completes `investigate_compromised_services` (round-1 D7), and a condition could skip the task. Its `setGlobal` is idempotent. The distcc-flag offer is a separate mapping with the condition, so the sudo offer still comes once.
- **D-c. Cipher's intel note no longer says "eliminate interference".** It now reads "hold Battery Hall 1. Nobody reaches the workshop." This was needed for done-when 4's zero-hit grep. It is an antagonist's note, not an authorisation, but the line also matches P3 (Cipher gates nothing now).
- **D-d. Positions.** The tool case is pinned at workshop (7, 7) and the round panel at Hall 1 (6, 8). The security-office export is left to the `room_office` notes slots, which the camera log already uses. All three need a look in the render or playtest.
- **D-e. Six clone knots, not four.** Cover, ally and hub each have a tag knot and a debrief knot. The hub pair returns to `vance_hub`, so a retry from the hub doesn't replay the first meeting's trust-gaining choices. Each debrief opens with the result: "buzzes once" if `vance_provided_keycard`, otherwise "didn't get a clean read". It then ends on a choice or diverts to a choice-owning knot.
- **D-f. m7 fixed cheaply.** Vance's 20 s "rack trends" text waits on `global_variable_changed:vance_phone_available` (set by the `vance_met`-gated close mapping) instead of `vance_is_ally`, so it can't land mid-clone.
- **D-g. A pre-existing double space in the debrief was fixed.** "Voltage is  in custody." was found by the debrief probe.
- **D-h. The arrest in `voltage_after_trigger` also sets `voltage_confronted`,** like the other stances.
- **D-i. Known edge, for playtest g3.** A player who runs out of the plant room mid-race and talks to Voltage after his hostility lapses in the same session would see "You went down" after a timeout. Hostile state holds in-session as far as the code shows, so this needs live confirmation, not a fix.
- **D-j. Not implemented: the optional "budget beat" line** in `optigrid_details_request`. Its content lives in the ally clone debrief instead ("We were meant to replace those readers this year").

**Done-when results (Phase 4, round-3 M3).**
1. **`scripts/compile-ink.sh m04_critical_failure`:** Compiled 10, Failed 0. Every `.json` is newer than its `.ink`. The three END warnings are pre-existing: `choice_fight -> END`, the briefing's terminal `-> END` and the debrief's terminal `-> END`.
2. **Validator: 0 errors.** Schema passes with `biometric`, there are no unknown fields, and the graph regenerated (puzzle 43 nodes / **46** edges [corrected after review; draft said 45]; critical path 4 hops). After the round-4 fixes there are **six** known benign onceOnly-pair warnings on `agent_0x99`. Two are new: `room_entered:battery_hall_2` (reader bark + RFID guide for players who never cloned) and `submit_ftp_intel_flag` (tick and distcc offer + conditional sudo offer). The original four:
   - `submit_distcc_exploit_flag`: methodology tick + privesc offer.
   - `submit_network_scan_flag`: methodology tick + Zero Day bark.
   - `npc_ko:operative_relay`: counters + card relay (pre-existing).
   - `npc_hostile_state_changed`: race start + telegraph.
3. **`check_door_alignment.py`:** 8/8 OK.
4. **Rendered JSON:**
   - `timers[0].id == "trigger_race"`.
   - `plant_room.lockType == "biometric"`, `requires == "Robert Vance"`.
   - `robert_vance.rfidCard.card_id == battery_hall_2.requires` (`facility_keycard_level1`).
   - 0 hits in the rendered JSON plus all `.ink` for `master_keycard`, `#give_item:keycard:vance_level1`, `240,000 lives`, `Hall 1 has gone amber`, `eliminate`, `on_cipher_ko_card`.
5. **inkcheck / loopcheck clean.** A probe script also checked the choice lists.
   - **Voltage `start`:**
     - inkcheck clean on defaults, `static_defeated`, `fight_started` × `vented_by_trigger` t/f × static t/f, `captured`, `escaped`.
     - `fight_started` routes to `voltage_after_trigger` with no button stance.
   - **`voltage_after_trigger`:** loopcheck ×4 clean. Choices are [Take him down. | arrest (static only) | Not yet.]. Text is "You went down…" only when `vented_by_trigger`.
   - **`confrontation_choice`:** 2 choices with Static up (fight, button), 3 with Static down. The arrest sub-menu is [court line | Not yet.].
   - **Vance:**
     - `initial_meeting` clean with `vance_provided_keycard` f/t.
     - `vance_hub` loopcheck clean across ally × `plant_reader_seen` × card (8 states).
     - All six clone knots end on a choice or divert to a choice-owning knot.
   - **Debrief `start`:** clean across (`racks_vented`, `vented_by_trigger`) ∈ {(f,f), (t,f), (t,t)} × captured × lore. Exactly one Bank B opener in each.
   - **Hubs and others:**
     - HaX `support_hub`: clean with and without privesc offered; "Send me the sudo guide." appears when offered.
     - HaX `start`, `on_relay_ko_card` and `navigation_help` clean.
     - Vance phone hub clean.
     - Briefing, guard (`start`, `guard_idle`), Cipher, Relay and Static clean.
6. **`room_depth.py`:** depths unchanged (0 entrance; 1 ops; 2 SCADA, security; 3 Hall 1; 4 Hall 2, workshop; 5 plant; 6 dock), matching §3's after-table. Six `lockType` declarations; 0 empty rooms.

**For the orchestrator's browser playtest.** It runs Phase 4 (a)–(g), plus these checks:
- **g1:** no "you went down" on an in-session timeout.
- **g4:** no race or telegraph after the 12-minute vent.
- **(e):** no phone text or bark during the RFID minigame, and the clone narration is visible.
- **"Last chance":** gone. The arrest sub-menu's "Not yet." returns to the stances.
- **The fingerprint chain:** with a reload between the minigame and the door.
- **KO and reload mid-race:** Voltage in `voltage_after_trigger`.

### 0.1 After the review and browser playtests (round 4) [new r4]

The independent review passed with minor fixes. Both browser playtests passed: `tools/playtest/m04-pass3a-report.md` (fingerprint chain) and `m04-pass3b-report.md` (race and endings; games 1224 and 1227 completed). Fixes applied, all in m04 files:

**Phone-chat rule (brief).** A reopened phone chat re-navigates to the knot of the first saved choice when a synced global changed (`phone-chat-minigame.js:532-566`), and replays that knot's leading text and tags.
- **Vance's phone.** `vance_not_yet_ally` now prints no NPC text, re-checks `robert_vance_ko` and `vance_is_ally` at the top, and routes on as soon as he allies. It was found latent in the m05 review: a player resting there stayed there after allying. New `vance_no_answer` for a KO'd Vance, also checked at the top of `start` and `support_hub` (new VAR `robert_vance_ko`).
- **HaX's phone.** 19 knots that printed text and then offered choices are split into a text knot that diverts to a choices-only `<knot>_choices` knot, so re-navigation replays nothing. This includes `on_relay_ko_card`, which would otherwise replay its `#give_item`. The split knots:
  - `on_relay_ko_card`, `first_call`, `vance_status_inquiry`, `first_call_objectives`;
  - `event_server_room_entered`, `vm_guidance`, `investigation_guidance`;
  - `event_attack_mechanism_identified`, `voltage_priority_update`, `capture_vs_speed_guidance`, `final_phase_briefing`;
  - `player_guidance_request`, `priority_guidance`, `intel_status_update`, `tactical_suggestions`;
  - `navigation_help`, `combat_help`, `vm_challenge_help`, `guidance_call_end`.
- **Clone rule.** Already met: the `card_cloned` mapping sets the global, the tag sits on a throwaway line, and debrief knots re-check and re-offer.

**From the playtests.**
- **Duty Round Panel** moved from Hall 1 (6, 8) to (6, 7). At row 8 its sprite drew over the workshop's top wall (`m04-pass3a-roundpanel.png`).
- **Stale HUD label** ("Voltage — the laptop 00:01" after firing; the same happens to `h2_advisory`): **not mission data, reported as engine.** `scenario-timer.js` `_tick` sets `display:none` when no timer is pending but never clears `labelElement`/`clockElement`. A harness reading `textContent` sees the old label in a hidden box. If the box is visible on screen, that is an engine bug (clear the text, or hide on fire). The pass-2 regression saw `display:none` after the ESD (check 4a), so it is most likely hidden. Logged for E-series, not fixed here.
- **Vance's thanks attributed to HaX.** Every Vance line in the debrief (`{not robert_vance_ko:}` blocks and the closing knots) now carries an explicit "Robert Vance:" prefix (18 lines). The `#speaker` tag inside a conditional block did not take.
- **Voltage's "One keystroke and I trigger it now…"** after the 12-minute vent is gated on `racks_vented` (new VAR): "Bank B's already gone. One keystroke and A and C follow it…".

**From the review (minors).**
1. `voltage_after_trigger` now reads "It's done. You were gone long enough, and Bank B went with it." That is true after a KO and after a voluntary reload. It replaces "You went down…".
2. Debrief: "The intelligence you brought out is the proof…" only when cross-cell or directive lore was found. The m03 directive line stays unconditional (HaX's own knowledge). The coordination claim moved into the lore-found branch.
3. Debrief: "He wants that in writing too." → "He still wants that in writing."
4. HaX `operative_down_advice`: one-down text branches on `operative_relay_defeated`.
5. Vance: "surprise inspections at dawn" → "an audit four hours early" (P23 leftover).
6. erb: the take_back_the_plant comment no longer says Relay carries the Master card.
7. RFID guide route for players who never cloned (locker or KO-drop card): new `room_entered:battery_hall_2` mapping, condition `rfid_guide_offered !== true`, delay 6000 (after the reader bark).
8. The merged FTP-flag mapping no longer mentions sudo. A separate FTP mapping with `privesc_guide_offered !== true` sends "And once you're on the box, I've a sudo guide…" at 4000. A distcc-first player isn't re-offered.
9. The race telegraph is now at delay 1500 with `skipIfGlobal: voltage_neutralised` (E11: delays count from the event and `skipIfGlobal` is checked at delivery).
10. Done-when 2 edge count corrected to 46.

**E11 re-check of m04 delays.** All delays now count from their event. Changes:
- Flag 1's Zero Day bark 4000 → **1500**, so it can't arrive after flag 2's distcc line (2000) when two flags go in quickly, as flagged in `tools/playtest/e11-timed-message-audit.md`.
- The race telegraph 0 → 1500 (item 9).

The rest read as intended:
- Vance's close text 2500 before the RFID offer 6000.
- Hall 2 reader bark 2500 before the Hall 2 RFID offer 6000.
- Kit bark 1500; print bark 1000.
- Distcc-first sudo offer 2500; FTP sudo clause 4000 after the distcc line 2000.
- Map-the-attack line 1500; ESD-armed line 1200.

**Rename (user's rename rule).** Robert Chen became Robert Vance in pass 1, but his ids still said chen. Every `chen_*` id in the live m04 files is now `vance_*`, using word-boundary replacement across `scenario.json.erb`, all ten `.ink` (recompiled), `TESTING_WALKTHROUGH.md` and this plan. NPC ids `robert_vance` / `robert_vance_phone` were already right.

| Old | New | Kind |
|---|---|---|
| `chen_trust_level` | `vance_trust_level` | global + ink VAR |
| `chen_is_ally` | `vance_is_ally` | global + ink VAR + credit condition |
| `chen_provided_keycard` | `vance_provided_keycard` | global + ink VAR + mapping conditions |
| `chen_phone_available` | `vance_phone_available` | global + mapping + timed-message `waitForEvent` |
| `chen_knows_truth` | `vance_knows_truth` | global |
| `chen_support_calls` | `vance_support_calls` | ink VAR (Vance phone) |
| `chen_warning_email` | `vance_warning_email` | ERB variable |

Ink knots:

| Old | New |
|---|---|
| `chen_provides_access`, `chen_provides_access_choices` | `vance_provides_access`, `vance_provides_access_choices` |
| `chen_commits_to_helping`, `chen_commits_choices`, `chen_commits_exit`, `chen_commits_immediately` | `vance_commits_to_helping`, `vance_commits_choices`, `vance_commits_exit`, `vance_commits_immediately` |
| `chen_not_yet_ally`, `chen_phone_support_start` | `vance_not_yet_ally`, `vance_phone_support_start` |
| `chen_cooperation_gained`, `chen_cooperation_acknowledged` | `vance_cooperation_gained`, `vance_cooperation_acknowledged` |
| `chen_timeline_reaction`, `chen_status_inquiry`, `chen_status_inquiry_choices` | `vance_timeline_reaction`, `vance_status_inquiry`, `vance_status_inquiry_choices` |
| `chen_skeptical_acknowledged`, `chen_revealed_acknowledged` | `vance_skeptical_acknowledged`, `vance_revealed_acknowledged` |
| `chen_professional_response`, `chen_apologetic_response`, `chen_defensive_response` | `vance_professional_response`, `vance_apologetic_response`, `vance_defensive_response` |
| `chen_processes_threat`, `chen_optigrid_realization`, `chen_early_reveal`, `chen_maintains_cover` | `vance_processes_threat`, `vance_optigrid_realization`, `vance_early_reveal`, `vance_maintains_cover` |
| `chen_cover_status`, `chen_briefing_advice`, `chen_accepts_audit` | `vance_cover_status`, `vance_briefing_advice`, `vance_accepts_audit` |
| `chen_emergency_call` | `vance_emergency_call` (only in comments) |

- `chen_fate` and `chen_suggests_server_room` appear only in the stale docs and were left there.
- A dated rename note is at the top of `ALIGNMENT_PLAN.md`, `PASS2_IMPROVEMENTS.md`, `SOLUTION_GUIDE.md` and `IMPLEMENTATION_STATUS.md` (not otherwise rewritten).
- The only remaining "chen" in the live files is the history comment at the top of `m04_npc_robert_vance.ink`.
- **Saved games:** a game started before the rename keeps its old `chen_*` globals and won't see them under the new names. The user's rule accepts this.

**Design note (recorded, not changed).** A game over during the Voltage fight with Static still up always costs Bank B, because the restart reloads and forfeits the race. The scripted playtests used `debugKO`, so fairness under real combat is unjudged. **Flag for a human playtest** (walkthrough g5).

**Done-when re-run after round 4.**
1. **Compile:** 10 compiled, 0 failed; every `.json` newer than its `.ink`.
2. **Validator:** 0 errors; schema passes; graph 43 / 46; six benign onceOnly-pair warnings (listed above).
3. **Door alignment:** 8/8 OK.
4. **Rendered JSON:**
   - `timers[0]` is `trigger_race`; the plant room is `biometric` with "Robert Vance"; the clone `card_id` matches the Hall 2 lock; the panel is at (6, 7).
   - 0 hits (rendered JSON + `.ink` + compiled `.json` + walkthrough) for `master_keycard`, `#give_item:keycard:vance_level1`, `240,000 lives`, `Hall 1 has gone amber`, `eliminate`, `on_cipher_ko_card`.
   - "chen": only the history comment.
5. **inkcheck/loopcheck all clean** (renamed VARs used):
   - **Voltage:** every listed `start` state, plus `racks_vented`; `voltage_after_trigger` ×4.
   - **Vance:** `initial_meeting` ×2; `vance_hub` ×8.
   - **Debrief:** 12 states.
   - **HaX:** `start`, `support_hub` ×2, and loopcheck on **every** knot in the file (including the 19 new `_choices` knots).
   - **Vance phone:** `start` not-ally, ally, KO.
   - **Others:** briefing, guard, the three operatives.
   - **Probes:**
     - Vance's phone before allying shows no text and one choice.
     - `vance_not_yet_ally` with `vance_is_ally` true routes to the support hub.
     - Voltage's leverage line after the vent reads "Bank B's already gone…".
6. **room_depth:** unchanged.

**What changed since draft 3 (round 3).** Items tagged **[new r3]** or **[changed r3]**:
- **P2:** clone narration order (m2); `clone_offered` dropped (m3); m7 timed-message fix.
- **P11a:** the narrator move is withdrawn (m1).
- **P11b:**
  - the HaX forfeit mapping is deleted (M1) and the timer hint is rewritten;
  - the telegraph is split into mappings (a) and (b) (m4);
  - "Not yet." added to `voltage_after_trigger` (m5);
  - the P22 coupling is dropped (m6).
- **`choice_arrest`:** "Last chance" replaced (M2).
- **§0** (new), and the Phase 4 done-when block (M3).
- **Withdrawn:** W9–W12.

**Changed in draft 3 (round 2), kept for the record.**

Items tagged **[new r2]** or **[changed r2]**:
- **§1 summary.** Item 26 (P11b) cost and deps; item 22 (P8) deps; Phase 4 playtest list (g).
- **§5 proposals.**
  - **P2:** both clone knots end on a choice (m03 pattern); covert hub wording; `clone_offered` reason corrected; the `conversation_closed:robert_vance` gates.
  - **P4:** the threshold claim corrected: doors ignore it.
  - **P5:** the job card's "Night 2".
  - **P6:** the panel moves west, away from Cipher.
  - **P8:** the `:200` rule.
  - **P9:** RFID bark gated and staggered; `vance_print_collected` not used for lines.
  - **P11a:** the narrator line goes before `#hostile`.
  - **P11b, largely rewritten:** first in `timers`; 25 s; `!racks_vented`; HaX telegraph; reload and KO forfeit Bank B; Voltage's post-race knot; fairness note.
  - **P12:** the escaped branch; the `vented_by_trigger` VAR moves to P11b.
  - **P15:** offer dedupe; merged with the distcc bark.
  - **P17:** three lines gated on `racks_vented` / `casualties_occurred`.
  - **P23:** two more lines.
- **§6, §7.** Race, reload and clone entries.
- **Withdrawn.** W6–W8.

**Changed in draft 2 (round 1), kept for the record.** Items tagged **[new r1]** or
**[changed r1]**:
- **§1 summary.** S1 is done and its fail-fallback is withdrawn. New Phase 1 items 9–14 (round-1 minors). P6 is relocated. P11 is split into P11a/P11b. P18 moves to the HaX bark.
- **§2 headline numbers.** Crossing count corrected to 9 (draft 1 said 9/11 on a wrong route).
- **§3 audit.** The plant-reader hunt row and the "three beats" paragraph.
- **§4 findings.** F3 extended (M2); F12 and F13 extended; F20 rewritten from the S1 result. New findings: F23 (briefing contradictions), F24 (Bank B in the wrong hall), F25 (Vance's paperwork lines), F26 (stale comments).
- **§5 proposals.**
  - **Phase 0:** S1.
  - **Phase 1:** P0, P15, P17, and new items P20–P24.
  - **Phase 2:** P1 (kit line moved, M1); P2 (restructured); P3 (two stale lines); P4 (threshold, owner string); P5 (job card); **P6 (moved to Hall 1, M4)**; P7 (tonight's entry); P8; P9 (kit bark, guide trigger, print-collected bark).
  - **Phase 3:** **P11b (new: the trigger race, M2)**; P12 (placement, honesty); P14 (Relay's line); P18 (moved, M3).
- **§6–§9.** Updated for the above.
- **§10.** Now references E1 in the approval log in place of draft 1's A1–A3. A5 extended.
- **Withdrawn.** Five new entries (W1–W5).

**Method.** Everything below is cited to `scenario.json.erb` (as `erb:NN`, line numbers after
the four fixes), the ten `.ink` files, the engine under `public/break_escape/js/`, the server
under `app/`, and the auto-generated `dungeon_graph.md`. `SOLUTION_GUIDE.md`,
`TESTING_WALKTHROUGH.md` and `IMPLEMENTATION_STATUS.md` were not used as sources.

**Inputs carried in.**
- `scenarios/PASS3_APPROVAL_LOG.md`: the orchestrator's m04 decision (drop the lethal-force line at `m04_opening_briefing.ink:179`); the user's kit ruling (cumulative kit; PIN cracker rationed; m04 introduces **biometric** locks and the fingerprint kit; the `biometric` lockType enum value is approved); and **E1**, the engine gaps found by Phase 0.
- `m03_ghost_in_the_machine/PUZZLE_CHAINS_PLAN.md` §9: m04 starts with phone, lockpicks and RFID cloner, no cracker; at least one RFID door opens by cloning a worker's card; the player meets a biometric lock and fails at it before getting the kit.
- `tools/playtest/m04-phase0-biometric-report.md` (S1, game 1217 on `scenarios/biometric_breach/scenario.json.erb`).
- Engine state: commit `18237332` landed. `registerNPC` keeps `_sprite`, and `dropNPCItems` falls back to the room's `npcSprites` (`npc-hostile.js:256-261`), so KO drops work in later-loaded rooms. Confirmed for Cipher and Relay (`tools/playtest/m04-regress-report.md`, checks 2a/2b).

---

## 1. Summary: what to do, in order

**Phase 0: prove the biometric path.** ✅ **Done [changed r1].**

| # | Change | Result |
|---|---|---|
| 0 | **S1** Browser test of biometric locks | **Passed with constraints** (`tools/playtest/m04-phase0-biometric-report.md`). A kit plus a collected print opens the door, and the unlock survives a reload on the server. The constraints that shape Phase 2 are: threshold ≤ 0.5; no needed text on a print surface; prints lost on reload but collectable again; the failure message prints the `requires` string and can't tell wrong from missing, so the player must be told what is needed by an NPC or a note. Engine gaps are logged as E1 |

**Phase 1: bugs and decided items. Ship these whatever happens to the rest.**

| # | Change | Cost | Why |
|---|---|---|---|
| 1 | **Done.** Facility Layout Map: "north exit" → "east exit" | 1 string | The dock hangs **east** of the plant room (`erb:1350`); the marked blueprints already say "east exit" (`erb:1464`) (F11) |
| 2 | **Done.** Hydrogen panel and Hall 2 procedures: volume % with % of LEL | 2 strings | "0.9% H₂ (Lower Explosive Limit)" stated 0.9% as hydrogen's LEL. The LEL is 4.0% by volume (F12). Item 9 adjusts the reading |
| 3 | **Done.** Two ESD notes name the plant room only | 2 strings | They said there were ESD buttons in the halls (`erb:982`, `erb:1334`) (F13). Item 10 finishes the job |
| 4 | **Done.** Deleted the unused ERB variable `attack_schedule_encoded` | 1 line | Defined, never interpolated (F14) |
| 5 | **P0** Lethal-force line and "eliminate" in the briefing (orchestrator decision) | 2 ink lines | `m04_opening_briefing.ink:179`, `:275` (F17) |
| 6 | **P16** Vance phone: gate "I'm in the engineering workshop" on `server_room_reached` | 1 VAR, 1 condition | Offered from the first call, wherever the player is (`m04_phone_robert_vance.ink:72`) (F15) |
| 7 | **[changed r1] P17** "240,000 lives" in three places | 3 ink lines | 240,000 is the number on supply; the casualty model is 40–60 plus the eleven on site (F16) |
| 8 | **[changed r1] P15** Offer the privilege-escalation field guide | 1 `itemsHeld` entry, 2 offer mappings, 1 hub branch | Flag 3 is the only one of four with no guide (F7) |
| 9 | **[new r1] P20** Hall 1 hydrogen panel reads amber | 1 string | Observation says amber (`erb:1226`), Cipher says amber, but the reading sat below amber (`erb:1233`) (F12) |
| 10 | **[new r1] P21** Three more ESD lines go singular | 3 strings | `erb:983`, `:1334` (last line), `:1126` still imply several buttons (F13) |
| 11 | **[new r1] P22** Bank B's advisory fires from Hall 2 | 2 fields | Bank B is in Hall 2 (`erb:1318`, `:1326`); the advisory tints and names Hall 1 (`erb:1569`, `:1577`) (F24) |
| 12 | **[new r1] P23** Briefing and guard agree on whether the audit was expected | 4 ink lines | "Surprise" vs "expecting an auditor today" vs "scheduled today" (F23) |
| 13 | **[new r1] P24** Vance's paperwork lines match his own email | 2 ink lines | `erb:71` vs `m04_npc_robert_vance.ink:135`, `:224` (F25) |
| 14 | **[new r1] P25** Stale comments | 2 comments | `m04_phone_robert_vance.ink:28-29`, `m04_npc_operative_relay.ink:11-12` (F26) |

**Phase 2: the kit and the lock chain. This is the core of the plan.**

| # | Change | Cost | Depends on |
|---|---|---|---|
| 15 | **[changed r1] P1** Start kit gets the RFID cloner; the briefing names the kit in `mission_objectives` | 1 inventory entry, 1 ink line | none |
| 16 | **[changed r1] P2** Hall 2's Level 1 card is cloned from Vance, not handed over | Vance ink (3 sites restructured), `rfidCard` on Vance, 1 mapping | 15 |
| 17 | **[changed r1] P3** The workshop card moves from Cipher to Relay | 2 `itemsHeld` edits, 1 KO mapping, 3 HaX knots, 1 task move | none |
| 18 | **[changed r1] P4** The plant room door becomes a fingerprint reader enrolled to Vance; the Master card goes; schema enum value added | room lock, door sign, 3 removals, `scripts/scenario-schema.json` (approved) | 17 |
| 19 | **P5** OptiGrid's tool case in the workshop holds the fingerprint kit | 1 container (lockpick), 2 contents | 18 |
| 20 | **[changed r1] P6** Vance's print on the Hall 1 round panel | 1 new pinned object | 18 |
| 21 | **[changed r1] P7** Access-control export in the security office | 1 note | 18 |
| 22 | **P8** Vance's lines: why he can't open it, where his print is | Vance ink + phone ink | 16, 18, **20 [r2]** |
| 23 | **[changed r1] P9** HaX's lines: the wall, the kit, the print, the corrected card talk | 4 barks, 4 knots edited | 16–20 |
| 24 | **P10** Objectives follow the new chain | 3 aims edited | 17, 18 |

**Phase 3: make the mission's own choices count. No new gates.**

| # | Change | Cost | Depends on |
|---|---|---|---|
| 25 | **[changed r1] P11a** The arrest needs Static down; Voltage's "both" line follows suit | 1 condition, 1 conditional line, 1 knot trimmed | none |
| 26 | **[changed r2] P11b** The trigger race: fighting Voltage starts a short clock, and a reload or KO during it forfeits Bank B | 1 timer (first in `timers`), 2 mappings, 2 conditions on existing timers, 1 Voltage knot, 3 debrief/credit lines, 2 globals | 25 |
| 27 | **[changed r1] P12** The debrief reads the optional intel; HaX lets you keep the kit | ~7 debrief lines, 4 VARs | 19, 26 |
| 28 | **P13** The ESD says which condition is missing | 3 `unauthorizedTextVariants` | none |
| 29 | **[changed r1] P14** Say where the night crew is, and why they're still there | 1 string | none |
| 30 | **[changed r1] P18** The Tasking Note's point moves into HaX's workshop bark | 1 object removed, 1 bark extended | none |
| 31 | **P19** FTP and distcc lines read true for what the VM does | 2 HaX lines | none |

**Phase 4: docs and verification.**
- Rewrite the header layout comment (`erb:29-39`, F19).
- Update `TESTING_WALKTHROUGH.md` and `SOLUTION_GUIDE.md` for the new routes, and refresh the `puzzle_graph_*` keys on everything Phase 2 moves.
- Run the validator, the door check, the ink compile and inkcheck/loopcheck.
- Then a full browser playtest. It must include:
  - (a) a reload between the fingerprint kit minigame and the plant door;
  - (b) a reload mid-mission for intro replays (brief);
  - (c) all three Voltage stances, including the fight stance (never run in pass 2, `m04-regress-report.md` 3c), timed against P11b's clock;
  - (d) the lockpick on the tool case;
  - (e) the Vance clone on both routes, including what happens when the clone minigame returns into a knot near `#exit_conversation` (P2);
  - (f) a measurement of crossings and time from the last flag to the ESD;
  - **[new r2]** (g) the trigger race three ways, timed from the conversation closing:
    - Voltage KO'd inside 25 s;
    - the race running out;
    - the player KO'd (or the page reloaded) mid-race, then walking back to find Voltage in his post-race knot with no button stance.

    Also confirm the race's countdown is the one on the HUD while `h2_advisory` is also counting.

❌ **Dropped:** D1–D9 (draft 1). **[new r1] Withdrawn:** W1 the S1 fail-fallback · W2 the SCADA console as print surface · W3 a print in the workshop · W4 the Tasking Note in the drop-site's observations · W5 P1's kit line in `cover_identity_explanation`. **[new r2]** W6 the 20 s race · W7 the "lenient restart" claim · W8 two P2/P8 claims. Reasons at the end.

**Needs user approval** (outside this mission's files; none blocks the plan): E1 (engine biometric gaps, already logged) · A4 a fingerprint-lock field guide · A5 the ProFTPD backdoor hands out root. See §10.

---

## 2. Headline numbers

| | m01 | m02 | m03 | **m04 now** | **m04 after** |
|---|---|---|---|---|---|
| Rooms | 13 | 13 | 7 | **9** | 9 |
| Physical locks | 13 | 32 | 7 | **5** (3 RFID doors, 2 key containers) + ESD interlock | 6 (2 RFID doors, 1 biometric door, 3 key containers) + ESD |
| Locks on the critical path | n/a | n/a | 2 | **3**, each opened by the NPC in the same or previous room | 4 (Hall 2 clone, workshop card, plant reader, tool case) |
| Lock classes in use | key, PIN, password, RFID | + cracker | + cloner | **RFID, key** | RFID (cloned), key, **biometric** |
| VM flag challenges | 3 | 4 | 4 | **4** | 4 |
| Critical path (hops through story aims) | 9 | 4 | 2 | **4** | 4 |
| Empty rooms | 0 | 2 | 1 | **0** | 0 |
| Story aims / tasks | 10 / 28 | 8 / 29 | 6 / 18 | **6 / 17** | 6 / 18 |
| Puzzle graph nodes / edges | 50 / 61 | 102 / 122 | 25 / 25 | **38 / 38** | — |
| **[changed r1]** Door crossings, entrance → ESD, no side trips | — | — | — | **7** | **9**, whenever the print is taken |
| **[new r1]** Crossings after the last flag (under the clock) | — | — | — | **3** | **3** |

Sources: `room_depth.py`, `dungeon_graph.md` (regenerated by the validator this session), m03's plan §2 for m01–m03.

**[changed r1] The route after Phase 2:** entrance → ops → SCADA → Hall 1 → Hall 2 (Relay, the
reader) → Hall 1 → workshop (kit, VM) → Hall 1 (print, P6) → Hall 2 → plant. That is 9
crossings against today's 7. Both extra crossings are the Hall 1 → Hall 2 → Hall 1 loop in
act 2, and each crosses a room with a job. Act 3 is unchanged at 3 crossings because the print
is on the way back.

m04 is mid-sized and has no empty rooms. Its problem is the shape of its chain. The header
says it outright: "single spine; each lock is opened by the previous room's NPC" (`erb:29`).
Every door is opened by a card handed over or dropped by the person standing next to it, so
there is never a hunt, and the mission grants no new capability at all.

---

## 3. Boss-key audit

Depths from `room_depth.py`: main_entrance 0 · operations_office 1 · scada_control_room,
security_office 2 · battery_hall_1 3 · battery_hall_2, engineering_workshop 4 · plant_room 5 ·
loading_dock 6. "Seen at" is the depth of the room the player stands in when they first see
the lock.

### Today

| Lock | Type | Seen at | Key first available | Verdict |
|---|---|---|---|---|
| `battery_hall_2` (`erb:1253-1255`) | RFID, Level 1 | 3 (Hall 1) | Vance gives it at depth 1, in the first conversation, on every route (`m04_npc_robert_vance.ink:197`, `:410`, `:273`) | ⚠️ **key-before-lock** |
| `engineering_workshop` (`erb:991-993`) | RFID, Level 2 | 3 (Hall 1) | Cipher, standing in Hall 1 (`erb:1147`, `:1162-1170`) | ❌ **same-room** |
| `plant_room` (`erb:1343-1345`) | RFID, Master | 4 (Hall 2) | Relay, patrolling Hall 2 (`erb:1266`, `:1291-1300`) | ❌ **same-room** |
| `security_equipment_locker` (`erb:1104-1131`) | key | 2 | lockpick in the start kit | ✅ *by design* (m01's tool) |
| `extraction_gobag` (`erb:1505-1528`) | key | 6 | lockpick | ✅ *by design* |
| ESD (`erb:1426-1450`) | `authVar` | 5 | three globals (`erb:734-752`) | convergence, not a lock |

### After Phase 2

| Lock | Type | Seen at | Key first available | Verdict |
|---|---|---|---|---|
| `battery_hall_2` | RFID, Level 1 | 3 | cloned off Vance at depth 1 with the m03 cloner (P2); spare card in the locker at depth 2 by lockpick | ✅ *by design*: two earlier-mission tools, either works |
| `engineering_workshop` | RFID, Level 2 | 3 (Hall 1) | Relay, depth 4, Hall 2 (P3) | ✅ **boss-key**: seen in Hall 1, card one room on, walk back |
| `plant_room` | **biometric**, "Robert Vance" | 4 (Hall 2) | **[changed r1]** kit in the workshop, depth 4, opened only on Relay's card (P5); print on the Hall 1 round panel, depth 3 (P6), collectable only once the kit is held | ✅ **boss-key**: encounter in Hall 2, hunt in the workshop, collect the print on the way back through Hall 1, return to Hall 2 |
| OptiGrid tool case | key | 4 (workshop) | lockpick | ✅ *by design* |
| locker, go-bag | key | 2, 6 | lockpick | ✅ *by design* |

**Why the plant reader is reliably met first.** The workshop needs a Level 2 card, and after
P3 the only Level 2 cards are Relay's drop and HaX's relayed copy on her KO. Both arrive in
Hall 2, whose south wall is the plant-room door (`erb:1263`). So the player has stood beside
the reader before they can open the room where the kit is. A player who doesn't try that door
still gets HaX's Hall 2 bark naming it (P9).

**[changed r1] The three beats for the plant reader.**
- **Encounter.** In Hall 2 the door refuses: "This door requires Robert Vance's fingerprint, which you haven't collected yet." The message prints the `requires` string verbatim (`unlock-system.js:399-403`), so P4 uses the readable name. Picks and cloner don't apply (the `biometric` case has no lockpick or cloner branch, `unlock-system.js:350-405`).
- **Hunt.** The kit is in the workshop. The print is on the Hall 1 round panel the player has already walked past. Before the kit, that panel answered "You need a fingerprint kit to collect samples from this surface!", and the player is told where Vance's print is by the job card (P5) and, for an ally, by Vance (P8). The kit's own "Search room" mode also highlights print-bearing objects in the current room (`biometrics-minigame.js:216-245`).
- **Return.** Hall 1 → Hall 2 → plant room.

---

## 4. Findings

**F1. The chain is a spine of same-room handovers.** See §3 and `erb:29`.

**F2. m04 grants nothing, and the m03 cloner is missing.** The start kit is phone, lockpick
and regulator credentials (`erb:386-409`). Pass 2 rewrote HaX's RFID bark because "m04 has no
cloner" (`PASS2_IMPROVEMENTS.md`, end of round 3).

**F3. [changed r1] Voltage's choice isn't a choice.** `confrontation_choice` says "The
button, or me. You genuinely don't get to have both" (`m04_npc_voltage.ink:219-221`). Two
routes give both:
- **Arrest.** It captures him with no fight whether or not Static is down (`:252-276`).
- **Fight.** It does too. `#hostile` hands him to combat, and the KO fires `npc_ko:voltage`, which sets `voltage_captured` and `voltage_neutralised` (`erb:697-702`). That arms the ESD (`erb:734-740`) and nothing is lost.

HaX's capture-vs-speed analysis, "he's holding the trigger, and cornered he will use it"
(`m04_phone_agent0x99.ink:434`), is therefore false in play. Only the button stance costs
anything.

**F4. The optional intel never reaches the ending.** `lore_architect_directive_found`,
`lore_cross_cell_coordination_found` and `lore_safehouse_address_found` are set on pickup
(`erb:1474`, `:1419`, `:1525`) and read nowhere. The debrief asserts "The documents you
recovered show clear coordination between cells" regardless (`m04_closing_debrief.ink:108`).
`lore_safehouse_address_found` is set on taking the card out of the go-bag, not on decoding
it, so it can reward retrieval only.

**F5. Vance's alliance is flavour.** `vance_is_ally` buys a credit line (`erb:151`), a phone
contact and a timed text (`erb:788-809`), and changes no route or hint.

**F6. Static has no task and no consequence.** `globalVarOnKO` only (`erb:1410`). Voltage's
arrest knot reads it (`m04_npc_voltage.ink:257-261`) and then ignores it.

**F7. Flag 3 has no field guide.** The recon, attack-surface and distcc guides are offered
(`erb:524-546`); flag 3, the sudoedit privesc (`erb:302-310`), is not. The sheet
`HacktivityLabSheets/_labs/safetynet/privilege-escalation.md` exists (permalink
`/labs/safetynet/privilege-escalation/`). It covers sudo rights generally, not
CVE-2023-22809. All six guides m04 already hands out exist.

**F8. The FTP flag's exploit gives root.** Flag 2 is `proftpd_133c_backdoor`
(`secgen/m04_critical_failure.xml:111-124`), whose metadata declares
`<privilege>root_rwx</privilege>`. So flags 3 and 4 can be read without their intended
steps. Approval item A5.

**F9. The SAFETYNET Tasking Note fails "would it exist anyway?".** `erb:1069-1076`.

**F10. The night crew is invisible.** Voltage's "Nine of them in Hall 2" (`m04_npc_voltage.ink:168`),
the blueprints (`erb:1464`) and the credits (`erb:145`) put nine people in a room that holds
only Relay. Relay's "They were told to clear at midnight. If they didn't, that's on them"
(`m04_npc_operative_relay.ink:89`) must still read true.

**F11 (done). Layout map "north exit".** `erb:933`.

**F12 (done; [changed r1]). Hydrogen units, and amber.**
- **Done.** `erb:1233` stated 0.9% as hydrogen's LEL (it is 4.0% by volume) and now reads in volume % with % of LEL. `erb:1334` was aligned to match.
- **Round 1 found more.** The observation says "An amber indicator is lit" (`erb:1226`) and Cipher reacts to amber (`m04_npc_operative_cipher.ink:45-47`), but 0.9% sits below the 1.0% amber threshold. P20 raises the reading.

**F13 (done; [changed r1]). ESD buttons "in the halls".**
- **Done.** `erb:982` and `erb:1334` step 1 now name the plant room.
- **Still plural.** `erb:983` ("the ESD pushbuttons are hardwired"), `erb:1334` last line ("ESD pushbuttons are hardwired…") and the locker's Incident Response Guide `erb:1126` ("Press the nearest hardwired ESD pushbutton"). P21.

**F14 (done). Dead ERB variable.** `attack_schedule_encoded`.

**F15. Vance's workshop phone choice is ungated.** `m04_phone_robert_vance.ink:72`.

**F16. [changed r1] "240,000 lives".** `m04_closing_debrief.ink:69` ("Says you saved
240,000 lives"), `:319` ("You saved 240,000 people") and `m04_opening_briefing.ink:314`
("240,000 lives").

**F17. Lethal force.** `m04_opening_briefing.ink:179`, `:275`.

**F18. The briefing doesn't name the kit.** `:213` says "Forged credentials in your phone",
but they are their own item (`erb:403-408`).

**F19. Stale header comment.** `erb:29-39` marks `security_office` and `loading_dock` `[key]`;
only containers inside them are locked.

**F20. [changed r1] The biometric subsystem, as tested.** Phase 0 passed with constraints
(`tools/playtest/m04-phase0-biometric-report.md`).

What works:
- **Collection.** Interacting with a `hasFingerprint` object while holding a `fingerprint_kit` starts the fingerprint kit minigame (`interactions.js:1227-1241`, `biometrics.js:106-150`).
- **Unlock.** A `biometric` lock opens if a sample's `owner` equals `requires` and its quality is at least `biometricMatchThreshold` (default 0.4) (`unlock-system.js:350-405`).
- **Server.** It trusts the client (`game.rb:789-793`) and keeps the unlock across reloads.

Constraints that shape m04:
- **(a) Quality.** Quality = 0.7 + 0.25×coverage − 0.15×overdust (`dusting-game.js:513-518`), and the minigame ends at 30% coverage. Measured prints were 0.775–0.793. Any threshold of 0.8 or more can never pass; 0.5 or lower is safe. A low-quality print can't be redone until reload.
- **(b) Prints don't survive a reload.** They live only in `window.gameState`. Not a soft-lock, since the surface can be collected again.
- **(c) A print surface hides its own text.** Without the kit it shows only "Missing Equipment"; with the kit it always opens the minigame (`interactions.js:1238-1241`).
- **(d) A `triggerOnInteract` object returns before the fingerprint branch** (`interactions.js:709-712`).
- **(e) Collection does emit an event, but a generic one.** `minigame_completed` `{minigameName: "DustingMinigame", success, result}` from `base-minigame.js:98-104`, with no owner or object id. With a single print surface in the mission, a mapping on it is unambiguous. But the kit's inventory "Search room" mode collects without that event and without clearing `hasFingerprint` (`biometrics-minigame.js:216-245`, `:556-568`), so nothing critical may depend on it. Draft 1 wrongly said nothing was emitted.
- **(f) The failure message** prints `requires` verbatim, fires twice, and can't tell a wrong print from a missing one.
- **(g) Biometric doors show the keyway icon.** `interactions.js:438-446` has no `biometric` case for doors.

All of these are logged as E1.

**F21. One static ESD refusal.** `erb:1439`. `unauthorizedTextVariants` is supported
(`esd-pushbutton-minigame.js:20`, `:125-129`).

**F22. HaX's distcc bark says "It's the way in" after the FTP flag** (`erb:604`).

**F23. [new r1] The briefing contradicts itself on the audit.** "Grid-safety regulator
conducting a surprise regulatory inspection" (`m04_opening_briefing.ink:211`), then "he's
expecting an auditor today" (`:213`). `:332` says "Act like a routine surprise inspection".
The visitor log says "Grid Safety Auditor (scheduled today - YOU)" (`erb:853`). The guard says
"Mr Vance mentioned a surprise inspection" (`m04_npc_security_guard.ink:55`). Vance's opener
("A grid-safety audit at 4 AM?", `m04_npc_robert_vance.ink:44`) fits a scheduled audit that
arrived early.

**F24. [new r1] Bank B is in the wrong hall.** Hall 2's manifest and BMS cabinet hold banks A
and B (`erb:1318`, `:1326`). Hall 1 holds bank C (`erb:1186`, `:1217`). The H₂ advisory says
"The hydrogen panel in Battery Hall 1 has gone amber. Bank B is venting" and tints Hall 1's
racks (`erb:1569`, `:1577`). The credits, the debrief and the night-crew casualties all put
Bank B in Hall 2 (`erb:145`; `m04_closing_debrief.ink:193`).

**F25. [new r1] Vance's paperwork lines contradict his email.** The email says "I have no work
order on file" (`erb:71`). In person he says "all contracted properly"
(`m04_npc_robert_vance.ink:135`) and "They had all the right paperwork" (`:224`). The visitor
log shows a work order number (`erb:853`).

**F26. [new r1] Stale comments.** `m04_phone_robert_vance.ink:28-29` says
`attack_mechanism_known` is "set true by the flag_4 drop-site eventMapping". It is set when the
`map_the_attack` aim completes (`erb:720-725`). `m04_npc_operative_relay.ink:11-12` names the
Master keycard, which P3/P4 remove.

---

## 5. Proposals

### Phase 0

**S1. Biometric browser test** ✅ **done [changed r1].** Result in §1 and F20. The draft-1
fail-fallback is withdrawn (W1).

### Phase 1

**P0. Lethal force (orchestrator decision)** ✅ keep.
- `m04_opening_briefing.ink:179` becomes "You're cleared for whatever force it takes to stop that trigger being pressed. But I want Voltage breathing. He knows things."
- `:275` becomes "Four: stop the operatives. Voltage, alive, is the priority for intelligence."
- `priority_clarification`'s "by any means necessary" (**[changed r1]** `:318`) stays: it is about the trigger and names no killing.
- Cost: 2 lines. Deps: none.

**P15. [changed r1] Privesc field guide** ✅ keep.
- Add a `lab-workstation` to HaX's `itemsHeld` with `labUrl` `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/privilege-escalation/`.
- Offer it on `objective_task_completed:submit_ftp_intel_flag` **and** `objective_task_completed:submit_distcc_exploit_flag`. Whichever foothold the player took, the offer follows. **[changed r2]**
  - Both conditions add `globalVars.privesc_guide_offered !== true`.
  - The FTP-flag offer is **merged into the existing mapping on that event** (`erb:600-605`, which already completes `investigate_compromised_services` and offers the distcc guide). Its `setGlobal` gains `privesc_guide_offered`, and P19's rewritten text mentions both guides, so the player gets one message, not two.
- Hub branch and a `request_privesc_guide` knot in the m01/m02 shape. Handover line: "Sent. Once you're on the box, check what sudo will let you do. That's how the crew got to the calibration file." It doesn't name the CVE (F7).
- Two globals. Cost: small. Deps: none.

**P16.** As in the summary table.

**P17. [changed r1] "240,000 lives"** ✅ keep.
- **[changed r2]** Debrief `:69`, gated on `not racks_vented`: "Vance says the grid held because of you. He wants that in writing." With `racks_vented`: "Vance says you kept it to one bank. He wants that in writing too."
- **[changed r2]** Debrief `:317-319` (Vance's thanks):
  - With `not casualties_occurred`: "You saved this facility. You kept 240,000 people on supply, and nobody in that hall died."
  - With `casualties_occurred`: "You kept it to one bank. Without you it was the whole hall."
  - "You saved this facility" is dropped from the casualty branch, because Bank B burned.
- Briefing `:314`: "Attack prevention is absolute priority. Eleven people on site, and everyone on that feed."

**P20. [new r1] Hall 1 panel reads amber.** `erb:1233`: current reading "1.1% H₂ by volume
(28% of LEL)", status "ADVISORY [AMBER]". This matches the observation (`erb:1226`) and
Cipher (`m04_npc_operative_cipher.ink:45-47`). The timed advisory (P22) is then about Hall 2
venting, a step worse. Cost: 1 string.

**P21. [new r1] ESD singular.**
- `erb:983`: "Emergency procedures — the plant-room ESD pushbutton is hardwired and independent of the compromised SCADA".
- `erb:1334` last line: "The ESD pushbutton is hardwired and cannot be disabled from SCADA."
- `erb:1126` step 1: "Press the hardwired ESD pushbutton (plant room)".
- Cost: 3 strings.

**P22. [new r1] Bank B's advisory fires from Hall 2.** In the `h2_advisory` timer:
- `tint_objects.roomId` → `battery_hall_2` (same `room_battery_hall` template, so the `batrack` texture exists).
- The hint message becomes "The hydrogen alarm in Battery Hall 2 has gone. Bank B is venting. The hardwired ESD is in the plant room, and the man holding the trigger is standing next to it."
- This matches the credits, the debrief and the night crew's bay (P14). Cost: 2 fields.

**P23. [new r1] The audit was scheduled; the hour is the surprise.**
- `m04_opening_briefing.ink:211`: "Your cover: the grid-safety regulator Albion is expecting today. You're just four hours early."
- `:213`: "Your credentials are in your kit. Facility manager is Robert Vance. He knows an auditor's due; he doesn't expect one before dawn."
- `:332`: "Act like a routine audit that came early."
- Guard `:55`: "Mr Vance said there was an audit today. Didn't say it'd be this early."
- Guard `:86` ("It's a surprise inspection") becomes "It's on today's list. I'm early."
- **[new r2]** Guard `:84` "Inspection? Nobody told me about any inspection." becomes "Inspection? Nobody told me it'd be at this hour."
- **[new r2]** Vance `:165` "That's why this surprise audit is... frustrating." becomes "That's why an audit at this hour is... frustrating."
- The visitor log already agrees. Cost: 7 lines.

**P24. [new r1] Vance's paperwork lines.**
- `m04_npc_robert_vance.ink:135`: "Maintenance? OptiGrid came in on the ninth for control-system upgrades. Their cards worked and they quoted an order number. I've still not found the order."
- `:224`: "They had cards and an order number. I never found the order behind it."
- This keeps his defensiveness (he isn't volunteering that he let them in) without contradicting his own email. Cost: 2 lines.

**P25. [new r1] Stale comments.** Fix the two in F26; the Relay header is rewritten with P3.

### Phase 2

**P1. [changed r1] Start kit and briefing** ✅ keep.
- Add the cloner exactly as m03 declares it (`m03 erb:380-387`): `"type": "rfid_cloner"`, `"name": "RFID Cloner"`, observations "Concealed RFID cloning device — get close to a keycard to copy it". The lockpick and the regulator credentials stay. No PIN cracker.
- **[changed r1]** The kit line goes in `mission_objectives`, after `:277` ("VM access is set up…"). Every exit from the briefing hub reaches it through `mission_stakes` (`:236-262`). Draft 1 put it in `cover_identity_explanation`, which is behind the once-only `{not asked_cover}` choice (`:99-101`) and can be skipped (W5).
- The line: "Kit: your picks, and the cloner from the WhiteHat job. No PIN cracker this time. We've got one, it's ENTROPY's, and it isn't leaving the lab." It stays clear of Nightshade, per m03's withdrawn B2.
- The briefing does **not** mention fingerprint readers. The wall should be met cold.
- Cost: 1 inventory entry, 1 line (P23 handles `:213`). Deps: none.

**P2. [changed r1] Clone Vance's card** ✅ keep. This is where the user's "a worker's card" rule lands.
- **Story logic.** The Budget Cut Memo says OT security upgrades were deferred (`erb:941`), so the halls still run on old 125 kHz prox cards. An EM4100 card clones instantly (`npc-conversation-state.js:557-558`). A visiting regulator isn't issued a card. On the cover route Vance says so, and the player copies his lanyard while he talks. On the ally route he won't give up his own card and tells the player to copy it.
- **NPC field.** `robert_vance` gets `"rfidCard": { "card_id": "facility_keycard_level1", "rfid_protocol": "EM4100", "name": "Facility Access Keycard (Level 1)" }`. A `card_id` equal to the lock's `requires` matches (`unlock-system.js:508-528`).
- **[changed r1; changed r2] Ink restructure.** The current hand-overs at `:196-201` and `:409-412` sit inside `{cond: …}` blocks, and choices inside those don't gather reliably (the file's own warning, `:269-270`). So every clone is a **knot-level** choice, and every clone tag sits in a knot that diverts to a separate knot **ending on a choice**. That is m03's `clone_debrief` pattern (`m03_npc_victoria.ink:360-367`): the engine restores a paused conversation into the knot that owns the current choices, never the one carrying the tag.
  - **[changed r3] `vance_provides_access` (cover).** The auditor line is plain text, conditional on `not vance_provided_keycard`, and the knot diverts to `vance_provides_access_choices`. That knot gains `+ {not vance_provided_keycard} [(Lean in over the site map while the cloner reads his lanyard.)]` → `vance_clone_cover`.
  - **[new r3] Clone knot shape (m2).** Action tags in a block run before its text, and starting the RFID minigame ends the chat, so narration in the tag's own block is never seen. Each tag knot is therefore: the narration first ("You lean over the site map…"); then the tag on a throwaway line ("He keeps talking."); then a divert to its `_debrief` knot. The debrief opens with the result ("The cloner buzzes once…" if `vance_provided_keycard`, otherwise "didn't get a clean read") after the return.
  - **[changed r3] `clone_offered` dropped (m3).** It persists via `npcInkVariables`, so after a reload mid-clone it would hide the choice. A cancelled clone returns to the conversation (`rfid-minigame.js:366-372`), and the choice reappearing while `vance_provided_keycard` is false is the retry.
  - **`vance_commits_to_helping` (ally).** This knot today ends `#exit_conversation -> vance_hub` with no choice (`:418-427`). Insert a choice point before the exit: `+ {not vance_provided_keycard} [Hold the cloner up to his lanyard.]` → `vance_clone_ally` (tag + Vance's line) → `-> vance_clone_ally_debrief`, which ends on `+ [Right. Going.]` → `vance_commits_exit`. Also `+ [Go.]` → `vance_commits_exit`. `vance_commits_exit` holds the existing `~ vance_met = true`, `#exit_conversation` and `-> vance_hub`.
  - **[changed r2] `vance_hub` safety net** (`:270-275`). Wording depends on the route, so the cover isn't blown: `+ {not vance_provided_keycard and not vance_is_ally} [(Ask about the site map again, and stand close.)]` and `+ {not vance_provided_keycard and vance_is_ally} [Let me copy your card.]`. Both use the same clone-knot pattern.
  - **[new r3] m7.** Vance's 20 s "rack trends" phone text (`erb:788-797`) waited on `vance_is_ally`, which is set mid-conversation (`:402`), so it could land mid-clone. It now waits on `global_variable_changed:vance_phone_available`, which is set by the `vance_met`-gated close mapping (§0 D-f).
- **[new r2] `conversation_closed:robert_vance` fires during the clone.** `#clone_keycard` starts the RFID minigame, which ends the running chat (`minigame-manager.js:24-26`), and person-chat cleanup emits `conversation_closed:<npc>` on every teardown (`person-chat-minigame.js:1594-1603`). Two mappings listen for it:
  - Vance's phone mapping (`erb:802-807`) gains `&& globalVars.vance_met === true`. On both routes `vance_met` is set only after the clone, in `initial_meeting_end_*` and `vance_commits_exit`.
  - P9's RFID guide bark is gated the same way, plus `vance_provided_keycard === true`.
  - The resumed conversation is a new instance, so its own close emits again once `vance_met` is true.
- **Flag.** `vance_provided_keycard` is set by a new HaX mapping on `card_cloned` with `condition: "data.cardName === 'Facility Access Keycard (Level 1)'"`. `rfid-minigame.js:245-249` emits `cardName` only. The `item_picked_up:keycard` mapping (`erb:668-674`) stays for the KO route.
- **Playtest flag.** Check (e) in Phase 4: the clone minigame returns into the conversation (`chat-helpers.js:360+`, "pending conversation return"). Confirm the return lands on the debrief knot's choice, and that neither Vance's phone text nor the guide bark arrives mid-clone.
- The spare Level 1 card in the security locker (`erb:1114-1120`) stays as the lockpick route.
- Cost: Vance ink at three sites, 4 small knots, 1 NPC field, 1 mapping. Deps: 15.

**P3. [changed r1] The workshop card moves to Relay** ✅ keep.
- Move the "Workshop Keycard (Level 2)" item (`erb:1162-1171`) from Cipher's `itemsHeld` to Relay's, replacing her Master Keycard (`erb:1291-1300`). Cipher keeps his intelligence note.
- Delete `on_cipher_ko_card` and its mapping (`erb:651-656`; `m04_phone_agent0x99.ink:172-178`). Re-point the `npc_ko:operative_relay` relay knot `on_relay_ko_card` (`:180-186`) to `#give_item:keycard:relayed_workshop_keycard`: "Relay's down. I've pulled her Level 2 number off the reader logs and pushed a copy to your kit. That's the workshop."
- **[new r1]** `relayed_workshop_keycard`'s observation "after Cipher went down" (`erb:561`) becomes "after Relay went down". Delete `relayed_master_keycard` (`erb:564-570`).
- **[new r1]** `navigation_help`'s "Check the operative you defeated—they may have had a keycard" / "that card is on the operative holding Battery Hall 1" (`m04_phone_agent0x99.ink:615-619`) become "Relay, in the inverter room, carries a workshop card."
- Rewrite the Relay header comment (F26).
- **Story logic.** Three OptiGrid techs badged into the workshop on the ninth (`erb:1058`). Relay patrols the next room.
- **Consequence.** Cipher gates nothing. Operatives turn hostile only through their dialogue or a punch (`npc-behavior.js:231`, `:308`; `player-combat.js:309-311`), so a player can walk round him. His task moves out of the gating aim (P10).
- Cost: as listed. Deps: none.

**P4. [changed r1] The plant room door is a fingerprint reader** ✅ keep.
- **Lock.** `plant_room`: `"lockType": "biometric"`, `"requires": "Robert Vance"`. **[changed r2]** No `biometricMatchThreshold`. The unlock reads it off the lockable (`unlock-system.js:360`), and a door sprite carries only `doorProperties` (`doors.js:503-525`), so a room-level threshold is ignored and the 0.4 default applies. That is harmless against measured quality of 0.78–0.79. Draft 2's "stated explicitly" is withdrawn (W8).
- **[new r1] Readable owner.** `requires` and `fingerprintOwner` are plain strings compared for equality (`unlock-system.js:364-366`; schema `fingerprintOwner: string`). So "Robert Vance" works, and the refusal reads "requires Robert Vance's fingerprint", not an id. m04 has one print in the whole mission, so the wrong-vs-missing ambiguity in F20(f) can't arise.
- **Door sign.** "Inverter / Plant Room — HV. Authorised Persons Only. Fingerprint Access".
- **Schema.** Add `"biometric"` to both lockType enums in `scripts/scenario-schema.json` (`:327`, `:821`). Already approved. The validator treats `biometric`'s `requires` as a secret (`validate_scenario.rb:1430-1434`); the graph generator labels it (`generate_dungeon_graph.rb:24`).
- **Removals.** `master_keycard` goes everywhere (P3, P9).
- **Keyway icon.** The door will show the keyway icon (F20(g), E1). An attempted pick still lands in the `biometric` refusal, and HaX's Hall 2 bark says picks won't work, so the icon misleads for one click.
- **Story logic.** The plant room is the HV and power-conversion room: switchgear, the PCS and the ESD. HV rooms are restricted to named Authorised Persons, and on a night shift that is the duty engineer, Vance. The crew got in on the ninth with Vance's print (P5, P7). They couldn't take the ESD from SCADA, so they took the door.
- **Why Vance can't open it himself.** Voltage and Static are behind it (`m04_opening_briefing.ink:176-177`), he's a civilian, and he's watching the honest historian (`erb:790`). P8 has him say so.
- Cost: lock, sign, schema enum, removals. Deps: 17.

**P5. [changed r1] OptiGrid's tool case holds the fingerprint kit** ✅ keep.
- **Object.** A new container in `engineering_workshop`:
  - Fields: `"type": "briefcase"` (container; `briefcase*.png` exist), `"id": "optigrid_tool_case"`, name "OptiGrid Tool Case", `"locked": true`, `"lockType": "key"`, `keyPins` (four values), `"difficulty": "medium"`, `"takeable": false`.
  - Observations: "A hard-shell tool case with OptiGrid stickers, shoved under the bench. Padlocked."
  - Pinned `position`.
- **Contents.**
  1. `{ "type": "fingerprint_kit", "name": "Fingerprint Kit", "takeable": true, "observations": "The crew's own fingerprint kit. Whatever OptiGrid came to maintain, it wasn't the vents." }`
  2. **[changed r1]** A note, "OptiGrid Job Card #4782 (back page)", in the crew's shorthand: "PLANT RM: FP reader, HV auth only. Use R.V. (duty eng). His thumb's on the Hall 1 round panel every 2 hrs. Tonight: same." **[changed r2]** The crew visited once, on 9–10 Jan (`erb:853`, `:1058`, `:1099`), so "Night 2" became "Tonight". Work order #4782 is the one in the visitor log (`erb:853`).
- **Story logic.** The crew spent 3h17m in the workshop (`erb:1058`), their base. The job card is their working note, so the clue has an author with a motive.
- **Wiring.** `item_picked_up:fingerprint_kit` fires on the type (`inventory.js:637`). P9's kit bark hangs on it and sets `fingerprint_kit_found`. The lockpick opens the case (*by design*).
- Cost: 1 container, 2 contents, 1 global. Deps: 18.

**P6. [changed r1] Vance's print on the Hall 1 round panel** ✅ keep. Replaces draft 1's SCADA console (W2).
- **Object.** A new object in `battery_hall_1`:
  - Fields: `"type": "pc"`, `"id": "hall1_round_panel"`, name "Duty Round Panel", `"takeable": false`, `"hasFingerprint": true`, `"fingerprintOwner": "Robert Vance"`, `"fingerprintDifficulty": "easy"`.
  - Observations: "A small wall terminal by the rack rows where the duty engineer logs each round." Flavour only: S1 showed the text is hidden until the print is taken.
  - No `readable`, `text` or `triggerOnInteract` (F20 c, d).
  - **[changed r2]** Pinned `position` in the **west half** of Hall 1, away from Cipher at (12, 7) (`erb:1151`), so collecting the print doesn't walk the player into him. It must stay off the doorway line (E/W doors at top + 2.5 tiles, `erb:57-58`) and clear of the south door at (1.5, 9). A spot such as (5, 8) needs a look in a render.
- **Story logic.** The duty engineer walks the halls every two hours and logs each round at the panel. So Vance's print is fresh there, and the crew knew it (job card). It is on the player's own route.
- **Why Hall 1 and not elsewhere.** See §2 and W2/W3. The print is passed on the way back from the workshop, so the hunt costs no extra crossings. It is still in a different room from both the reader (Hall 2) and the kit (workshop).
- **Pre-kit.** "You need a fingerprint kit to collect samples from this surface!" That makes a fair seed at depth 3, met before the reader. The kit's "Search room" mode later highlights it.
- **Mechanics.** With the kit, the fingerprint kit minigame; success stores a "Robert Vance" sample. Over-dusting leaves the panel collectable. Quality ~0.78 clears 0.5.
- Cost: 1 object. Deps: 18.

**P7. [changed r1] Access-control export in the security office** ✅ keep.
- **Object.** A takeable, readable note in `security_office`, pinned, "Access Control Export: HV Plant Room":
  - "PLANT ROOM READER (FP, HV authorised persons)."
  - "09 Jan 23:58 MATCH R. VANCE / 10 Jan 00:41 MATCH R. VANCE / 10 Jan 02:56 MATCH R. VANCE. Duty engineer 9–10 Jan: none rostered (contractor on site)."
  - **[new r1]** "12 Jan 03:58 MATCH R. VANCE." Under it: "Card reads, R. VANCE, 12 Jan: OPS OFFICE IN 03:35. No further reads."
- **Story logic.** The export puts Vance's print at the plant room on a night he wasn't there, and again tonight, twenty minutes after his own card put him at the ops desk where the player meets him. That is the inferential tier: someone is using his print. It is a clue, readable before or after the reader.
- **Optional wiring.** `onPickup` sets `evidence_reader_spoof_found` and completes `find_infiltration_evidence` (fourth source, as the camera log, `erb:772-776`). Reviewers may drop the task completion.
- Cost: 1 note, 1 global, 1 mapping. Deps: 18.

**P8. Vance's lines** ✅ keep.
- **Clone beats.** P2, §7.
- **Plant reader.** `plant_reader_seen` is set by HaX's Hall 2 bark (P9). In `vance_hub` (`m04_npc_robert_vance.ink:266-296`), add a knot-level sticky choice `{plant_reader_seen}` "The plant room's on a fingerprint reader."
  - **Ally.** "HV room. Authorised persons only, and tonight that's me." Asked to come: "With Voltage on the other side? And somebody has to watch the real numbers." Then **[changed r1]**: "They didn't need me on the ninth. I log every round on the Hall 1 panel. They'll have had it off that. Do what they did."
  - **Cover.** "That's an HV room, and you're an auditor." No hint: F5's consequence.
- **Phone.** The same beat in `m04_phone_robert_vance.ink`, gated on `vance_is_ally` and `plant_reader_seen`.
- **[changed r2] Stale line.** `:200` becomes "The workshop's on the contractor's cards, and the plant room's HV. Authorised persons only." It does **not** say "fingerprint". The rule (P1) is that the reader is met cold in Hall 2; this line tells a depth-1 player only that the plant room is restricted (W8). Folded into P2's restructure of the same knot.
- Cost: ~12 lines, 1 global. Deps: 16, 18.

**P9. [changed r1] HaX's lines** ✅ keep.
- **[changed r1] RFID guide offer.** Moves from `room_entered:battery_hall_1` to `conversation_closed:robert_vance` (lesson 20: don't bark into a live conversation). **[r2]** Condition `globalVars.vance_met === true && globalVars.vance_provided_keycard === true`, so it can't fire during the clone (P2) or before the card is copied. Delay 6000 ms, so it lands after Vance's own 2.5 s phone text (`erb:807`). Bark: "Vance's card is the old prox kind. If you want to know what the cloner just did, I'll send you the RFID guide."
- **Hall 1 bark** (replaces the old one on `room_entered:battery_hall_1`): "The workshop wants a Level 2 card, and Vance doesn't carry one."
- **Hall 2 bark** (new; `room_entered:battery_hall_2`, `onceOnly`). Sets `plant_reader_seen`: "That plant-room door is biometric. Picks and cloner won't touch it. Somebody got through it on the ninth, though."
- **[changed r1] Kit bark** (new; `item_picked_up:fingerprint_kit`, `onceOnly`). Sets `fingerprint_kit_found`: "That's the crew's fingerprint kit. The plant-room reader takes the duty engineer's print, and this is how they got past it. Keep the kit; it's ours now." It no longer assumes the player tried the door.
- **[new r1] Print bark** (optional; `minigame_completed`, `condition: "data.minigameName === 'DustingMinigame' && data.success === true"`, `onceOnly`). Sets `vance_print_collected`: "That's Vance's print. The reader's in Hall 2." Unambiguous because m04 has one print surface. Nothing critical depends on it: the "Search room" path skips the event (F20e). **[new r2]** `vance_print_collected` survives a reload while the print doesn't (F20b). So no line, hub choice or condition may say "you have his print" on the strength of it; it exists only for the bark's `onceOnly`.
- **Hub knots.** `operative_down_advice` (`:153-160`) drops "doors they're standing in front of". `navigation_help` (`:609-632`): workshop lines per P3; plant-room lines "The reader wants Vance's print. You need a kit, and somewhere he touches every round." `on_relay_ko_card` per P3; `on_cipher_ko_card` deleted.
- Cost: 4 mappings, 4 knots. Deps: 16–20.

**P10. Objectives** ✅ keep.
- **`reach_the_workshop`** (`erb:220-241`). `neutralize_operative_relay` moves here from `take_back_the_plant` (`erb:332-336`), replacing `neutralize_operative_cipher`, titled "Take a workshop card off the cell".
- **`take_back_the_plant`** (`erb:324-344`). Tasks:
  - `neutralize_operative_cipher`, **optional** (optional tasks don't block an aim, `objectives-manager.js:757`);
  - new `get_past_plant_reader` (`enter_room`, `targetRoom: "plant_room"`, "Get past the plant-room fingerprint reader");
  - `confront_voltage`.
  - Description: "The man holding the trigger is behind a reader that only takes the duty engineer's print."
- **Early KO.** A Relay KO before `confirm_the_lie` stays hidden until the aim unlocks (`18237332`; `m04-regress-report.md` check 9).
- Cost: 3 aims edited, 1 task added. Deps: 17, 18.

### Phase 3

**P11a. [changed r1] The arrest needs Static down** ✅ keep.
- In `confrontation_choice` (`m04_npc_voltage.ink:214-233`), gate "Step away from the bench. You're under arrest." on `{operative_static_defeated}`. Cut `choice_arrest`'s now-unreachable "You'd have to get past Static" branch (`:259-261`).
- **[new r1]** Make `:221` conditional. With Static up: "You genuinely don't get to have both, and I'd think about it quickly." With Static down: "Static's down. So it's you, me, and one keystroke." The first line is now true (P11b); the second no longer claims what the arrest disproves.
- Fight and button are always offered.
- ~~[new r2] Move the narrator line in `choice_fight` before `#hostile`.~~ **[withdrawn r3, W9]**
- **[new r3] `choice_arrest`'s "Last chance. Step away." is replaced (M2).** After P11a it was reachable only with Static down, yet Voltage refused and fired `#hostile`, which started the race from a surrender demand. It is now `+ [Not yet.] -> confrontation_choice`. The stance menu's fight choice is already labelled as one (`#color:red`).
- Story logic: he gives up only when nobody is left to buy him the keystroke. Static's KO now matters (F6).
- Cost: 1 condition, 1 conditional line, 3 lines cut. Deps: none.

**P11b. [new r1; changed r2] The trigger race** ✅ keep (M2; reworked after round 2).
- **What it does.** Fighting Voltage starts a short visible clock. If he isn't down before it runs out, he reaches the laptop and Bank B vents. The fight can still capture him and the ESD still saves banks A and C, but "both" is no longer free. HaX's "cornered he will use it" (`m04_phone_agent0x99.ink:434`) becomes true.
- **Start.** A HaX mapping:

  ```json
  {
    "eventPattern": "npc_hostile_state_changed",
    "condition": "data.npcId === 'voltage' && data.isHostile === true",
    "onceOnly": true,
    "setGlobal": { "voltage_fight_started": true }
  }
  ```

  **[changed r3] (m4)** A second mapping (b) on the same pattern, with `&& globalVars.racks_vented !== true` appended to the condition, sends the telegraph "He's going for the laptop. Drop him." at delay 0. Splitting them keeps the race start unconditional while the telegraph stays silent after the 12-minute vent. The pair raises a benign onceOnly-pair validator warning.

  - `setNPCHostile` emits `npc_hostile_state_changed {npcId, isHostile}` on a change (`npc-hostile.js:32-60`), from the `#hostile` tag or from a first punch on a non-hostile NPC (`player-combat.js:309-311`). So a punch-first player can't dodge the clock.
  - **[new r2]** The delay-0 HaX text telegraphs the race to a player who never saw the stance menu (punch first, or a stray punch while fighting Static).
  - Arrest and button never make him hostile.
- **Timer.** **[changed r2] First entry in `timers`**, ahead of `h2_advisory`. The HUD shows the first pending `showCountdown` timer in array order (`ui/scenario-timer.js:122-156`), so placed second the race would be hidden behind the advisory. Cancel and fire both call `markFired` (dispatcher `:91-95`, `:164-166`), so the advisory's countdown comes back afterwards.

  ```json
  {
    "id": "trigger_race",
    "label": "Voltage — the laptop",
    "startOnGlobal": "voltage_fight_started",
    "delayMs": 25000,
    "cancelOnGlobal": "voltage_neutralised",
    "condition": "!globalVars.voltage_neutralised && !globalVars.attack_prevented && !globalVars.racks_vented",
    "setGlobal": { "racks_vented": true, "casualties_occurred": true, "vented_by_trigger": true, "urgency_stage": 4 },
    "showCountdown": true,
    "onceOnly": true,
    "actions": [
      { "type": "tint_objects", "roomId": "battery_hall_2", "textureKey": "batrack", "color": 16729122, "pulse": true },
      { "type": "hint", "title": "HE REACHED THE LAPTOP", "message": "Bank B is going. He's still in the plant room, and so is the button. A and C are still yours to save." }
    ]
  }
  ```

  - **[changed r2] 25 s, not 20 s** (W6), per the round-2 ruling. The playtest times it from the conversation closing.
  - **[new r2] `!globalVars.racks_vented` in the condition.** If the 12-minute vent has already happened, a slow fight doesn't announce a second vent or credit it to Voltage.
- **Verified in the dispatcher** (`ui/scenario-timer-dispatcher.js`):
  - `startOnGlobal` and `cancelOnGlobal` both subscribe to `global_variable_changed:<var>` (`:52-79`).
  - A mapping's `setGlobal` emits that event. Evidence: the live escape chain (`erb:705-740`; game 1193, `m04-regress-report.md` check 3).
  - The fire-time `condition` (`:121-134`) is a second guard.
- **[new r2] Reload and KO forfeit Bank B.** Draft 2 called the restart "lenient"; that was wrong (W7).
  - **What actually happens.**
    - Every reload, and the KO screen's Restart (which is `location.reload`, `ui/game-over-screen.js:155-170`), respawns the player at `startRoom` (`core/player.js:217`, `core/game.js:1142`).
    - `voltage_fight_started` persists, and hostile state does not.
    - The dispatcher restarts the race from the reload (`:53-55`). With the player seven crossings away, it always fires. That outcome is right.
    - What was wrong is that Voltage came back calm: in `voltage_standoff_resumed` for a player who had talked (`m04_npc_voltage.ink:50`, `:58-64`), or with the full stance menu for a punch-first player (`:43-51`). The menu includes the button stance, which could add "ESCAPED" on top of "he reached the laptop".
  - **The ruling.** A KO or reload during the race forfeits Bank B ("you went down; he reached the laptop").
  - **Voltage's `start`** gains, first in its guard list: `{voltage_fight_started and not voltage_captured and not voltage_escaped: -> voltage_after_trigger}`. Declare `voltage_fight_started` and `vented_by_trigger` as VARs.
  - **The new knot `voltage_after_trigger`** has no button stance:
    - **[changed r3]** Text: `{vented_by_trigger: Voltage: It's done. You went down, and Bank B went with you. | Voltage: Still standing? Then let's finish it.}`. "You went down" is only here: the knot is reached only after a reload or KO, since a fight in progress makes him hostile and hostile NPCs are punched, not talked to.
    - `+ [Take him down.] #color:red` → `#hostile`, `#exit_conversation` on their own lines. The race is `onceOnly` and has already fired or is running.
    - `+ {operative_static_defeated} [Hands on the bench. You're under arrest.]` → `~ voltage_captured = true`, `#complete_task:confront_voltage`, then "Why not. The number's already moving." → `voltage_captured_end`.
    - **[new r3] (m5)** `+ [Not yet.]` → `#exit_conversation` → `voltage_after_trigger`, so with Static up the player isn't forced into the fight on contact.
  - ~~HaX on the forfeit.~~ **[withdrawn r3, W11]** The engine can't tell a KO, a reload and an in-session timeout apart, and on the commonest loss (a timeout with the player still standing) "you went down" is false. The timer's hint covers all three cases.
  - The ESD still needs `voltage_neutralised`, so the player must go back and deal with him. That is honest: they lost the race, not the mission.
- **[changed r2] Fairness.**
  - Voltage has the default 100 HP (`combat-config.js:44`). The player's jab does 10 per 0.5 s and the cross 25 per 1.5 s (`combat-config.js:11-28`), so a KO needs about 5–6 s of landed punches after closing the distance. 25 s with the countdown shown is about four times that.
  - The race is **one-on-one** unless Static was already engaged. Static becomes hostile only through his own dialogue or a punch.
  - After P11a, a player who chooses the fight while Static stands has usually already talked to Static. That makes it two-on-one (22 + 18, `erb:1364`, `:1408`) and a player KO likely, which now forfeits Bank B. P11a's "don't get to have both" line is the warning. Draft 2 didn't make that distinction.
- **Interactions.**
  - Add `&& !globalVars.racks_vented` to the `racks_vent` (`erb:1590`) and `h2_advisory` (`erb:1562`) conditions. ~~P22 coupling~~ **[withdrawn r3, W12]**: P22's fields (roomId, message) don't overlap with the condition.
  - **[changed r2] Debrief.**
    - Opener (`m04_closing_debrief.ink:53`): add `* {vented_by_trigger} [He reached the laptop before I reached him. Shutdown held A and C.]` and gate the existing `{racks_vented}` choice with `and not vented_by_trigger`.
    - At `:193`, when `vented_by_trigger`, "He got to the laptop before you got to him, and Bank B went with it." **replaces** "Bank B went before you got to the button". The rest of the paragraph stays.
  - **Credits.** A new entry "RACK BANK B LOST — he reached the laptop", condition `globalVars.vented_by_trigger`. The existing "RACK BANK B LOST" entry gets `&& !globalVars.vented_by_trigger`.
  - **[changed r2]** Declare `voltage_fight_started` and `vented_by_trigger` in `globalVariables`. This proposal also owns the `vented_by_trigger` VAR in the debrief ink (moved from P12).
- Cost: 1 timer, 2 mappings, 2 conditions, 1 Voltage knot + 1 guard, 3 debrief/credit lines, 2 globals. Deps: 25.

**P12. [changed r1] The debrief reads the optional intel** ✅ keep.
- Declare the three `lore_*` globals as VARs in `m04_closing_debrief.ink`. **[changed r2]** `vented_by_trigger` is declared by P11b.
- **[changed r1]** The new lines go **after** the `{voltage_captured: … - else: …}` block (`:105-109`), not inside its else:
  - Cross-cell or directive found: "The documents you brought out show the coordination in their own handwriting."
  - Neither: "The paper's still in the plant room. Forensics will bag it, but I'd rather you'd read it."
  - **[changed r2]** The existing `:108` else-line (reached when Voltage was **not** captured, i.e. he escaped) becomes "Voltage is gone, so the paper will have to talk."
- **[changed r1]** If `lore_safehouse_address_found`: "And that card from the go-bag. It decodes to Calder Wharf, Social Fabric's regional safehouse. A team's on it." This rewards **opening the go-bag**, which is what the global records (F4), and doesn't claim the player decoded it. A decode-specific reward would need a check the engine doesn't have; the CyberChef guide stays the decode's own reward.
- Kit line, end of `debrief_intelligence_gathered`: "Keep the crew's fingerprint kit. Forensics can have the case."
- Optional credit `{lore_safehouse_address_found}` "SOCIAL FABRIC SAFEHOUSE: located".
- Cost: ~7 lines, 4 VARs. Deps: 19, 26.

**P13. ESD refusal says what's missing** ✅ keep. Add three `unauthorizedTextVariants` (first
match wins; `!globalVars.x` is supported, `conditional-text.js:30-32`):
1. `!globalVars.anomaly_detected`: "NOT ARMED. Nobody has checked the racks against an instrument that isn't on the BMS bus."
2. `!globalVars.attack_mechanism_known`: "NOT ARMED. The attack on the OT network isn't proven. That evidence is on the workshop jump server."
3. `!globalVars.voltage_neutralised`: "NOT ARMED. The trigger holder is still within reach of the laptop."

**P14. [changed r1] Where the night crew is** ✅ keep. Append to the Rack Bank Maintenance
Manifest (`erb:1318`): "Night module-swap crew (9): bay 2B, behind the inverter wall,
22:00–06:00. Contractor request to clear the halls from midnight: REFUSED, R. Vance." Relay's
"They were told to clear at midnight. If they didn't, that's on them" stays true: they were
told, and Vance overruled it. That gives Vance one more quiet credit. Cost: 1 string.

**P18. [changed r1] The Tasking Note's point moves into HaX's workshop bark** ✅ keep.
- Delete the SAFETYNET Tasking Note (`erb:1069-1076`).
- Append one sentence to the `room_entered:engineering_workshop` bark (`erb:597`): "Four flags make the case: the status page, the FTP drop, the distcc foothold and root. The scan and enumeration steps are your own record."
- Draft 1 put it in the drop-site's observations, which the player never sees: the flag-station opens its minigame directly (`interactions.js:1023-1044`) with a hard-coded description (`flag-station-minigame.js:297`) (W4).
- Cost: 1 removal, 1 sentence.

**P19. FTP and distcc lines** ✅ keep.
- `erb:604` becomes "There's a legacy distccd on that box as well. The crew left it as their own way back in. Prove it works."
- New `onceOnly` bark on `objective_task_completed:submit_network_scan_flag`: "That FTP service. Same backdoored build you met at St Catherine's. Zero Day supplies, Critical Mass executes."
- Cost: 2 lines.

---

## 6. What could break

- **[changed r1] Reload between the fingerprint kit minigame and the door.** The print is lost and the panel can be collected again (S1 item 4). Not a soft-lock. The playtest covers it.
- **[new r1] Low-quality print.** A print can't be redone until a reload (S1 3b). At threshold 0.5 against a measured floor of ~0.78, this doesn't bite.
- **Playtest automation.** S1's agent drove the minigame with a drag, so the harness can do it.
- **Soft-lock checks after Phase 2.**
  - **Hall 2:** clone, Vance's KO drop, or the locker's spare card.
  - **Workshop:** Relay's drop plus HaX's relayed copy.
  - **Plant room:** kit (one source, lockpick always held) plus panel (one source, retryable).
  - **ESD:** unchanged, three globals.
  - **Cipher:** optional.
- **Cancelled clone.** `vance_provided_keycard` stays false; the hub offers it again (P2).
- **Clone return into the conversation.** Playtest check (e). If the return skips a choice, move the tag one knot earlier.
- **Clone vs KO.** Vance KO'd before cloning drops his card (`erb:896-906`). His print doesn't depend on him being conscious.
- **[changed r1] Clock (final act).** 3 crossings after the last flag, as today, with the panel on the route. The playtest records time from the last flag to the ESD. If the 12-minute vent fires on a normal run, widen `racks_vent` rather than move the start.
- **[new r2] Reload or KO during the race.** It forfeits Bank B by design (P11b). Voltage comes back in `voltage_after_trigger`, with no button stance; HaX explains. Playtest (g).
- **[new r2] Clone teardown.** `conversation_closed:robert_vance` fires mid-clone; both listeners are gated on `vance_met` (P2). Playtest (e).
- **[new r1] Trigger race.**
  - A player who picks the fight with Static up is likely to be KO'd, as today.
  - A player who punches Voltage before the VM is done starts the race early; that is the honest consequence of attacking the trigger holder.
  - The race can't fire after the ESD (condition). It can't double-vent (P11b's added conditions).
- **Layout.** No rooms or connections change. Three new objects are pinned and need a look in a render.
- **Schema.** The `biometric` enum value must land with P4.
- **Ink.** `confrontation_choice` keeps ≥ 2 choices in every state. P2's new knots each end on a choice or a divert to the hub. Recompile and rerun inkcheck/loopcheck on every changed file.
- **Reload of ink state.** `plant_reader_seen`, `fingerprint_kit_found`, `vance_print_collected`, `voltage_fight_started` and `vented_by_trigger` are globals.

## 7. Dialogue implications

Lines follow `README_ink_best_practices.md`: speaker attribution, action tags above their line,
`#exit_conversation` never ending the story, sticky hub choices.

- **Vance, cover clone (P2).** Auditor line: "Auditors get escorted, not carded. When the shift settles I'll walk you round myself." Clone knot: Narrator "You lean over the site map. The cloner buzzes once against your hip. Old prox. It didn't even have to work for it."
- **Vance, ally clone (P2).** "I'm not handing over my card. If this goes wrong I need to get into the halls. Copy it. You've got something that does that."
- **Vance, budget beat** (optional, `optigrid_details_request`): "We were meant to replace the prox readers this year. You've seen the memo."
- **Vance:** P8, P24. **HaX:** P3, P9, P15, P18, P19. **Briefing:** P0, P1, P23. **Guard:** P23. **Debrief:** P11b, P12, P17. **Voltage:** P11a.
- **Cipher, Relay, Static:** no change.
- **Stale-geography re-check** after P3/P4: grep the HaX and Vance files for "master keycard", "Level 2", "through him" (`README_ink_best_practices.md:121`).

## 8. Pacing

| Act | Rooms (depth) | Beats today | Beats after |
|---|---|---|---|
| 1, no clock | entrance 0, ops 1, security 2, SCADA 2, Hall 1 3 | briefing, guard, Vance hands over a card, evidence, thermometer (the turn: `anomaly_detected` → threat music, `erb:100-105`), Cipher fight | the same, but the card is cloned, Cipher is optional, the reader log seeds in the security office, and the round panel refuses a player with no kit |
| 2, no clock | Hall 2 4, workshop 4 | Cipher's card → workshop, VM | Hall 2: Relay, the reader wall. Workshop: tool case → kit, VM. On the way out, Hall 1's panel gives up the print |
| 3, clock | Hall 2, plant 5, dock 6 | Relay fight, Static, Voltage's choice, ESD | the reader, Static, Voltage's choice (arrest earned; a fight is a race), ESD |

- **Act 3.** Act 3 loses Relay to act 2 and gains the reader and the trigger race. The final door is one the player worked to open, and the final choice has a cost on every branch.
- **[changed r1] Crossings.** Act 2 gains two; act 3 none.
- **Empty rooms.** None.

## 9. Capability arc

Rule (`PASS3_APPROVAL_LOG.md`): the kit is cumulative. Each mission grants at most one new
class. The PIN cracker is rationed and not in start kits after m02.

| Mission | Grants | m04's use |
|---|---|---|
| m01 | Lockpicks | Tool case (critical path, P5), security locker (optional spare card), go-bag (optional). *By design* |
| m02 | PIN cracker (rationed); ProFTPD backdoor as a VM skill | Cracker not in the kit, and the briefing says why (P1). m04 has no PIN locks and adds none (D6). ProFTPD skill spent on flag 2 (P19) |
| m03 | RFID cloner | Vance's prox card for Hall 2 (P2) |
| **m04** | **Fingerprint kit (biometric)** | Plant reader met in Hall 2 with picks and cloner useless (P9). Kit one room on behind a lockpick (P5). Print on the way back (P6) |

**Start kit for m04:** phone, lockpicks, RFID cloner, plus the regulator credentials as a cover
item. No PIN cracker.

**What m04 grants:** the fingerprint kit, taken from the crew and kept (P12).

**For m05's planner (nothing here is m04 work):**
1. Start kit: phone, lockpicks, RFID cloner, fingerprint kit. No PIN cracker unless m05 issues one with a reason.
2. A biometric lock in m05 is a *by design* spend. Until E1 lands, follow m04's constraints: threshold ≤ 0.5, no needed text on print surfaces, the print owner named in-world, a readable owner string.
3. If m05 grants a new class, put its lock in front of the player before the tool.

## 10. Needs user approval

None blocks the plan.

- **[changed r1] E1 (engine), already logged in `PASS3_APPROVAL_LOG.md`.** It replaces draft 1's A1–A3. Biometric gaps found by S1 and this plan:
  - prints not saved across reload;
  - print surfaces hide their text;
  - the generic collection event;
  - the failure message (id, fires twice, wrong vs missing);
  - thresholds above ~0.8 unreachable;
  - the keyway icon on biometric doors;
  - the inventory "Search room" path that skips the minigame and its event.

  m04 works within all of them.
- **A4 (HacktivityLabSheets).** No fingerprint-lock field guide. Optional; HaX's kit bark stands in. Also listed under E1.
- **A5 [changed r1] (SecGen).**
  - **Root via flag 2.** The ProFTPD 1.3.3c backdoor declares `privilege root_rwx`, so flags 3 and 4 don't need their steps.
  - **[new r1] Unanchored module path.** `module_path=".*/proftpd_133c_backdoor"` (`secgen/m04_critical_failure.xml:114`) is an unanchored regex (`SecGen lib/objects/module.rb:147`). It can also select `proftpd_133c_backdoor_nonroot`, which exists in `modules/vulnerabilities/unix/ftp/`, so the build is non-deterministic about which variant is used.
  - **Options.** Anchor the path to the variant intended (`.*/proftpd_133c_backdoor$`, or the `_nonroot` one, which, if it really yields a non-root shell, would make the distcc → sudoedit chain meaningful; its metadata also says `root_rwx`, which needs checking); or accept. m04's lines are written to be true either way (P19).
- **Already approved:** the `biometric` lockType enum value (lands with P4).

## Withdrawn and dropped

**Dropped in draft 1**
- **D1. Biometric on the workshop door.** The kit would sit beside the door (Cipher) or force a six-crossing round trip before the VM. Beside the lock reads as a free pass (Step 3b).
- **D2. Biometric on the SCADA control room door.** Vance sits one door away and would open it; the control room is the only route to Hall 1.
- **D3. A reader re-enrolled to a cell member's print.** Extra concept, and the obvious print source would be the operative. KO'd NPCs aren't interactable (`interactions.js:1690`) and only objects carry prints.
- **D4. Cloning Relay's card in her standoff.** It copies m03's custom-key beat for its own sake (Step 3d).
- **D5. HaX "relaying" a kit by phone.** A kit is a physical object; the reader-log fiction doesn't stretch to it. The case is a world object, so there's no drop to fail.
- **D6. A PIN lock because the validator suggests one.** No author with a motive for a code.
- **D7. `attack_schedule_encoded` as a decode on Voltage's laptop.** No motive, and the laptop states the trigger in plain text (`erb:1456`). Deleted instead.
- **D8. Prints on the analogue thermometer.** Its `triggerOnInteract` returns first (`interactions.js:709-712`), and it is the mission's key clue.
- **D9. Vance's ops terminal as a second print surface.** Over-redundant, and it would hide that terminal's text (F20c).

**[new r1] Withdrawn after round 1**
- **W1. S1's fail-fallback** ("the plant room stays an RFID Master-card door"). S1 passed, and the fallback contradicted P3, which gives Relay the workshop card in place of the Master card.
- **W2. Draft 1's P6, Vance's print on the SCADA operator console.** The route became entrance → ops → SCADA → Hall 1 → Hall 2 → Hall 1 → workshop → Hall 1 → SCADA → Hall 1 → Hall 2 → plant: 11 crossings whenever the print was taken, and a dead SCADA round trip under the clock if taken after the VM. Draft 1 miscounted it as 9/11. The Hall 1 panel keeps every beat for 9 crossings.
- **W3. The orchestrator's alternative, a print in or next to the workshop** (Vance signing the crew in or issuing a permit). Two problems:
  - **No story reason.** Vance has no workshop access: the workshop is on contractor Level 2 cards, and his own line says so (`m04_npc_robert_vance.ink:200`). His email says he never saw a work order (`erb:71`), so there's no permit for him to have signed.
  - **It collapses the hunt.** A print in the workshop puts kit and print in one room, so the hunt becomes "open the case, turn round". Hall 1 is the room next to the workshop and gives the same walking cost with a real second location.
- **W4. Draft 1's P18 into the drop-site's observations.** Observations are never shown for a flag-station (`interactions.js:1023-1044`; `flag-station-minigame.js:297`).
- **W5. Draft 1's P1 kit line in `cover_identity_explanation`.** It sits behind the once-only `{not asked_cover}` choice (`m04_opening_briefing.ink:99-101`), so a player could deploy without hearing it.
**[new r3] Withdrawn after round 3**
- **W9. Draft 3's P11a narrator move.** The compiled `choice_fight` already emits the narrator line, then `#hostile` on an empty-text continue (`ink-engine.js:27-60`). So the line shows before the clock, about 1 s before close. Moving it would put narration ahead of Voltage's line. 25 s stands on fairness.
- **W10. `clone_offered`.** It persists via `npcInkVariables`, so a reload mid-clone hides the choice. The reappearing choice is the retry.
- **W11. The HaX forfeit mapping on `vented_by_trigger`.** False on an in-session timeout and on a deliberate reload. The timer hint covers every case, and "you went down" lives only in `voltage_after_trigger`.
- **W12. "Do P11b and P22 in one edit."** Their fields don't overlap.

**[new r2] Withdrawn after round 2**
- **W6. A 20 s race.** `#hostile` is processed before the block's text, so the clock started while lines were still on screen. The round-2 ruling set 25 s and moved the narrator line (P11a, P11b).
- **W7. "The race restarts its clock from the reload (lenient)."** A reload or KO respawns the player at the entrance, so a restarted race always fires, and Voltage came back with the full stance menu. Replaced by the forfeit rule and `voltage_after_trigger` (P11b).
- **W8. Three draft-2 claims.**
  - **P4's `biometricMatchThreshold: 0.5`.** Ignored on doors.
  - **P2's "`clone_offered` is ink-local for reloads".** Ink variables persist since `1de257bb`.
  - **P8's `:200` "fingerprint only".** It contradicted P1's rule that the reader is met cold.

- **Corrections, not withdrawals.** Draft 1's F20 said no event fires on collection and gave the quality as 0.70–0.95. Collection does emit a generic `minigame_completed`, and measured quality is ~0.78. Both are corrected in F20.

---

*Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds.*
