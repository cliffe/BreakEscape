# m05 Insider Trading — Puzzle chains plan

Status: **IMPLEMENTED (draft 4, after review round 3 and the implementation review).** Every ✅ item is in the working tree,
mission-local, and not committed. The implementation record, deviations and "done when" results
are in §0. A browser playtest (with a mid-mission reload) follows.

**What changed in round 3.** Items tagged **[r3]**:
- **F12, P11, the Recruiter.**
  - She is keyed on the naming conversation *closing* (three routes), with `recruiter_texted` as the guard.
  - The reload backstop moves to `game_loaded`.
  - Draft 3's "phone chats never emit `conversation_closed`" is corrected.
- **P11 re-navigation guards** on every naming knot (Patricia in person, Patricia by phone, HaX). "(Ring her.)" sits behind a choice. "Just checking in" varies with state. The mobile text is neutral.
- **P7** depends on P11.
- **§10** adds E11.
- **§11** has the new assertions and playtest wording.
- **Withdrawn.** W15–W16.

**Changed in round 2 (kept for the record).** Items tagged **[r2]**:
- **P11, Patricia's phone.**
  - Every resting knot re-checks state at its top, because a reopened phone chat re-navigates to the saved choice's knot, not to `start`.
  - The exact NPC JSON and the mapping that announces the phone route.
  - The Recruiter gets a reload backstop.
  - A shared "Torres appears" line.
  - The "hold him" choice is gated on `final_choice`.
- **P5.** Owen's refusal now points somewhere. The leverage line attributes the log to Patricia. Optional `onRead` on the relay note.
- **P4.** The ordering risk is resolved and the §6 fallback dropped. The choice text carries the clone beat.
- **P7, §6.** HaX's new hints sit above `general_advice`'s early return. The case-ready texts say "call Patricia".
- **HaX relay.** `on_patricia_ko_relay`'s "bring it to me" line is gated on `not torres_identified`.
- **§8.** The attentive count is 14, not ~16.
- **§11.** New loopcheck states, the Recruiter backstop assertion, the condition check scoped to eventMappings, and new playtest steps.
- **Withdrawn.** W10–W14.

**Changed in round 1 (kept for the record).** Items tagged **[r1]**:
- **§1 summary.** P5 and P6 are rebuilt. New P11, Patricia by phone. P9 is dropped. The costs and dependencies follow.
- **§2, §3.** The audit uses the depth each door is *seen from*. The vault is now "anticipated", traded for pacing. Crossings are recounted.
- **§4.**
  - F2: rename sites corrected and completed.
  - F6: wrong log claim removed.
  - New F12: the Recruiter's trigger.
  - New F13: `dr_chen` is hard-coded in the engine (E8).
- **§5.**
  - P4: card name; clone knots copy m04.
  - P5: evidence as leverage, not a rapport threshold. No monitor narration. Neutral bark. A `door_sign`.
  - P6: the Owen seed at the handover; the incident-log seed gone; a `door_sign`; a HaX naming line.
  - P8: Patricia can hand the email over.
  - New P11.
- **§6–§11.** Updated. The warning estimate is restated.
- **§9.** Reframed: m05's wall is the vault, and the social beat is evidence as leverage.
- **Withdrawn.** W1–W9. **Disagreement:** one reviewer item not adopted (passwordHint), with the reason in Withdrawn.

**Method.** Everything is cited to `scenario.json.erb` (as `erb:NN`), the nine `.ink` files
(as `<file>:NN`), the engine under `public/break_escape/js/`, and the auto-generated
`dungeon_graph.md`. `ALIGNMENT_PLAN.md`, `TESTING_WALKTHROUGH.md` and the `mission.json`
summaries were not used as sources. Line numbers in `m05_npc_patricia_morgan.ink` are after
the F1 fix. **[r1]** Draft 1 cited the Halloran and Lisa ink by offsets from a concatenated
listing. Every ink citation has been re-checked against its own file.

**Inputs carried in.**
- `scenarios/PASS3_APPROVAL_LOG.md`:
  - the orchestrator's m05 decision: rename Dr Sarah Chen and Kevin Park, player-visible names only;
  - the user's kit ruling: the kit is cumulative, and the PIN cracker is rationed;
  - E1: biometric engine gaps;
  - E8: the `dr_chen` id is hard-coded in the engine.
- **m04 is implemented [r1]:**
  - the fingerprint kit is in the workshop tool case and kept in the debrief, so P3's continuity holds;
  - the plant room is a working biometric door with a `door_sign` (`m04 erb:1489-1497`);
  - the clone-knot pattern is in `m04_npc_robert_vance.ink:242-306`;
  - the `card_cloned` mapping is at `m04 erb:740-746`;
  - the phone-contact precedent, `robert_vance_phone`, is at `m04 erb:875-900`.
- `m03_ghost_in_the_machine/PUZZLE_CHAINS_PLAN.md` §9.
- `tools/playtest/m04-phase0-biometric-report.md` (S1).
- **Engine state:**
  - `dropNPCItems` falls back to the room's `npcSprites` (`npc-hostile.js:256-261`);
  - ink variables and cloner cards survive a reload (`1de257bb`).

---

## 0. Implementation record and "done when" results **[r3]**

**Status per item** (phase order; all ✅ items implemented):

| Item | Status | Notes |
|---|---|---|
| F1 Patricia's naming lines | ✅ done (draft 1) | Also copied into the phone file |
| P0 rename | ✅ done | Owen Gallagher / Dr Ruth Halloran across erb, 7 ink files, mission.json and the walkthrough; sticky note signed "- O". Ids, speaker tags and VARs unchanged |
| P1 neutral door barks | ✅ done | Hallway, Torres' office, lockpicking guide |
| P2 stale comments | ✅ done | Relay item `_comment`; `on_owen_ko_relay` header |
| P3 start kit + briefing | ✅ done | Four start items; pick set, `find_lockpick`, `lockpick_obtained`, the pickup mapping and `request_lockpick` removed; two kit lines in `cover_story`; `resources_briefing` line replaced |
| P4 clone Owen's badge | ✅ done | `rfidCard` "Staff Badge - O. Gallagher"; `owen_clone` / `owen_clone_debrief` (m04 shape); `card_cloned` mapping; `obtain_server_badge` → `enter_room` |
| P5 password: evidence as leverage | ✅ done | Note in Owen's `itemsHeld`; `request_password` / `password_given`; Patricia's authority branch; HaX KO authority; relay note with onRead; IT notice moved to the hallway (pinned (4,4)); `door_sign` on the server room |
| P6 key vault | ✅ done | `data_center` biometric, `requires: "David Torres"`, `door_sign`; mug pinned (3,3) in `torres_office`; Owen's handover line; naming lines in all three naming routes; Torres' line; dusting bark |
| P7 HaX barks | ✅ done | Server-door and vault barks; `general_advice` hints above the early return; "Call Patricia" in the nudge and `general_advice` |
| P11 Patricia by phone + Recruiter | ✅ done | New `m05_phone_patricia.ink`; `patricia_phone` NPC in `npcIds`; Recruiter on three `conversation_closed` mappings plus the `game_loaded` backstop |
| P8 CEO email | ✅ done | onRead on both copies; `patricia_confession` knot; debrief branch; credits section |
| P10 privesc guide | ✅ done | Item, hub branch, `request_privesc_guide` (see deviation 1) |
| Phase 4 docs | ✅ done | Header lock summary in the erb; `mission.json` act 2 and Owen's entry; `TESTING_WALKTHROUGH.md` rewritten; dungeon graph regenerated by the validator |

**Deviations:**
1. **P10 offer.** The `privesc_guide_offered` flag and the offer text ride on the existing flag-3 bark mapping, not a new mapping. That avoids a third handler in the flag-3 co-fire group, and the behaviour is the same.
2. **Owen's password choice gains a local `password_handed` VAR.** The "given" global (`server_password_obtained`) comes from the pickup mapping (lesson 26). The local VAR hides the ask until that syncs, so the hub can't offer it twice in the same conversation.
3. **Owen's authority line reads "Security's signed it off"**, with a `patricia_ko` variant. On the KO route the authority comes from HaX "from Security", not from Patricia.
4. **HaX's `on_patricia_ko_relay` exit** is split into "Understood. I'll bring it to you." (before naming) and "Understood." (after), as well as the gated line.
5. **The fingerprint kit has no `puzzle_graph_unlocks`.** It now carries a `puzzle_graph_note`. With both the kit and the mug unlocking `data_center`, the validator reported "multiple solution paths", but the two are an AND, not an OR. The mug carries the unlock.
6. **HaX's vault hint** reads "The vault takes Torres' print. His office has it." It is true before and after the door opens, since no global records the vault opening.
7. **`all_topics()` removed** from Owen's ink. It is unused once the badge and password no longer gate on it.

**Done when — results (run 2026-10-01):**
- `./scripts/compile-ink.sh m05_insider_trading`: **10 compiled, 0 failed** (2 END warnings: the opening and debrief cutscenes).
- **Validator:**
  - "No unknown fields"; "All ink files valid"; schema passes; **0 errors**;
  - geometry OK, door alignment OK; critical path 4 hops;
  - **6 co-fire warnings (was 7)**, all on HaX and all intended: `item_picked_up:notes` ×4 and `item_picked_up:keycard` ×4 (disjoint by `data.itemId`), `flag3_submitted` ×2 (bark + `case_exfil` latch), `door_unlock_attempt` ×4 (disjoint by room), `object_interacted` ×3 (disjoint by name or type), `conversation_closed:david_torres` ×4 (guarded by `flags_nag_sent`);
  - 1 suggestion, which the validator itself rates acceptable: `identify_torres` has no KO-safe fallback it can see, but HaX's and the phone's naming routes exist.
- `check_door_alignment.py`: **9/9 OK.**
- `room_depth.py`: **0/10 empty rooms** (was 1); 6 lock declarations.
- **Rendered-JSON assertions: 24/24 pass:**
  - start kit types; phone `npcIds`;
  - no lockpick outside the kit; the vault lock;
  - one Torres print, in the office, with no text;
  - Owen's `rfidCard` with no parentheses; no `cloned_employee_badge`;
  - password note only in Owen's `itemsHeld`; notice pinned in the hallway; server-room `door_sign`;
  - `obtain_server_badge` is `enter_room`; `find_lockpick` gone; relay id in `find_server_password`;
  - Recruiter: exactly the 3 `conversation_closed` mappings plus `game_loaded`, with no `room_entered:data_center` and no `conversationMode`; the backstop is not `onceOnly`;
  - `patricia_phone` shape;
  - `conversation_closed:patricia_morgan` only on `patricia_phone` and the Recruiter;
  - the 9 new globals declared, `lockpick_obtained` gone;
  - eventMapping conditions `&&` only with no parentheses (credits excluded);
  - no `item_picked_up:lockpick`;
  - no old names (ids, VARs and speaker tags excluded); new names present.
- **inkcheck at `start`, all 10 files clean:**
  - opening, Halloran, Owen, Lisa, Patricia and HaX: 800/800;
  - Torres: 56/56; debrief: 2/2;
  - Patricia phone and Recruiter: 1/1 (resting knots).
- **loopcheck, all ✅, no runtime errors:**
  - Patricia phone: `start` (unavailable); `not_yet` with `patricia_phone_available=true`; `hub` with `patricia_ko=true`; `hub` with `torres_identified=true final_choice=turn_double_agent`; `phone_share_findings` with `torres_identified=true`; `hub` with both halves;
  - Owen: `hub` (badge unobtained); `owen_clone_debrief` with the clone true and false; `request_password` with no leverage, with the log, and with authority; `hub` with the password obtained;
  - Patricia: `request_authorization` with `server_door_seen`; `share_findings` and `significant_findings` with `torres_identified=true`; `share_findings` with vetting + manifest, and with bills + flag 3 + `vault_reader_seen`; `patricia_confession`;
  - HaX: `support_hub` in 4 states; `name_to_hax` with `torres_identified=true`; `on_owen_ko_relay`; `on_patricia_ko_relay` after naming; `post_ko_safety_net`;
  - Torres: `confrontation_scene` with and without `patricia_ko`;
  - debrief: **5 endings × `found_stand_down_email` true/false, 10/10.**
- **Path simulations (inkjs, scripted):**
  - Phone preload with `patricia_phone_available=false` shows only "(Hang up.)" and no text. Once available, `not_yet` routes to the hub. A KO'd hub shows only "(Ring her.)". With a fate set, "He's in the data centre" is gone. Naming by phone plays the case, the shared Torres line and the print line, and tags `identify_torres`. Re-entering `phone_share_findings` or `phone_significant_findings` after naming goes straight to the hub, with no naming text.
  - Owen: refusal with no leverage offers only "Fair enough"; with the log the note is given (`#give_item:notes:server_password_note`) with the vault line; the KO-authority variant line works; the ask disappears after the handover.
  - Patricia: the authority branch; naming with manifest only (F1 lines, office authorised, print line); confession → `#give_item:notes:ceo_stand_down_copy`.
  - HaX: `name_to_hax` after naming goes straight to the hub; the KO relay pushes three items and the vault line; `general_advice` with the name set still shows the password and vault hints.

**Not verified (for the playtest):**
- The clone minigame returning into `owen_clone_debrief`, and a live cancel.
- The `game_loaded` backstop for a phone NPC (r3 M2).
- Render placement of the mug (3,3) and the IT notice (4,4).
- The vault refusal and success alerts, and reload between dusting and the door.
- Torres appearing in front of a player who names him by phone from the data centre.
- The Recruiter's text timing after phone and in-person closes.

**[impl-review] Fixes from the independent implementation review (all applied, 2026-10-01):**

| # | Fix | Result |
|---|---|---|
| M1 (major) | The Recruiter's `start` opens with `{final_choice != "": ~ recruiter_contacted_player = true -> post_confrontation_contact}`. Its never-offered branch now goes to a new `never_talked_terms` knot ("we never did talk terms… the next one will cost me more", then the line goes dead), not to `end_contact`'s "Think it over". So the pre-confrontation pitch can't play, and the deal can't be taken, once Torres' fate is set. Marking her contacted also stops the `game_loaded` backstop. §6's claim is corrected (W17) | ✅ simulated: fate set, no offer → `never_talked_terms`; fate set with the offer made → the post-confrontation responses |
| m1 | Patricia's `ceo_copy_handover` knot is shared by the confession's "Show me the email" and a new hub choice `{topic_investigation and not gave_ceo_copy and patricia_influence >= 7}` "You mentioned an email that stopped you. Can I see it?" | ✅ "Another time" is now a promise the ink keeps |
| m2 | "I've told Owen you can have the spare" is its own line, `{not owen_ko and not office_card_obtained}`, in Patricia in person, Patricia by phone and HaX's `name_to_hax` | ✅ |
| m3 | HaX's password hint has a `patricia_ko` variant: "Owen wants a reason. He's had word from Security; tell him." | ✅ |
| m4 | `phone_hold_him`: "I know. Ring me when it's done." The phone naming now ends "Whatever you decide when you're in front of him, ring me when it's done." Neither commits to the police | ✅ |
| m5 | Briefing: "Owen Gallagher - IT systems administrator. He holds the spare cards and the server-room password, and he logs who gets them." | ✅ |
| m6 | Two HaX `item_picked_up:notes` mappings on `data.itemId` (`ceo_stand_down_copy`, `ceo_stand_down_email`) set `found_stand_down_email` on pickup | ✅ the notes co-fire group grows from 4 to 6, disjoint by id |
| m7 | A second Recruiter `game_loaded` backstop, condition `recruiter_deal_offered === true && recruiter_deal_decided !== true`: "You haven't given me an answer, agent. The offer stands until it doesn't. - R." The new global `recruiter_deal_decided` is set in `recruiter_deal_taken` and `recruiter_deal_refused`. It is disjoint from the first backstop, since an offer implies contacted. The engine can't add a phone contact at runtime: the list is `npcIds` plus NPCs with in-memory history (`phone-chat-ui.js:372-383`) | ✅ |
| m8 | Plan text: the withdrawn refusal is no longer quoted as live; §6's Recruiter claim is corrected | ✅ |
| m9a | Patricia's contact still shows from the start with only "(Hang up.)". Keeping her off the list needs her out of `npcIds`, and then a reload would lose her (history is in memory only). **Accepted and noted** | — |
| m9b | Owen's two clone-success choices get one reply each ("Don't be. Just don't let Patricia see you do it." / "Yeah. That's what I told Finance.") | ✅ |
| m10 | The flag-4 bark's condition gains `&& globalVars.final_choice === ''` | ✅ |
| m11 (E13 rule) | Every phone knot whose choices follow text now diverts to a choices-only `<knot>_choices` knot. That is 15 knots in HaX, 9 in the Recruiter and 2 in Patricia's phone, done by a script that detects text before the first top-level choice; the re-run detector finds 0 left. `post_ko_safety_net_choices` keeps its `final_choice` guard | ✅ |
| user rule | **Id rename** (map below). Dropping `dr_chen` also detaches m05 from the engine's hard-coded toast (E8). Dated rename notes added at the top of `ALIGNMENT_PLAN.md` and `PASS2_IMPROVEMENTS.md`. m01 not touched | ✅ |

**Old → new id map (user rename rule):**
- NPC `kevin_park` → `owen_gallagher`; `dr_chen` → `dr_halloran`.
- Ink files `m05_npc_kevin_park.ink/.json` → `m05_npc_owen_gallagher.ink/.json`; `m05_npc_dr_chen.ink/.json` → `m05_npc_dr_halloran.ink/.json` (storyPaths updated).
- Globals and VARs: `kevin_ko` → `owen_ko`; `chen_ko` → `halloran_ko`; `kevin_influence` → `owen_influence`; `chen_influence` → `halloran_influence`.
- Tasks: `talk_to_kevin` → `talk_to_owen`; `talk_to_dr_chen` → `talk_to_dr_halloran`.
- Knots: `on_kevin_ko_relay` → `on_owen_ko_relay`; `kevin_told` → `owen_told`; `chen_guilt` → `halloran_guilt`.
- Event patterns: `npc_ko:kevin_park` → `npc_ko:owen_gallagher`; `#speaker:kevin_park` → `#speaker:owen_gallagher`; `#speaker:dr_chen` → `#speaker:dr_halloran`.
- `mission.json` `key_npcs` ids and the walkthrough follow.

**E11 (fixed in the engine).** Mapping delays now count from the event. Nothing in m05 relied on the old behaviour: the Recruiter and Patricia texts are keyed on conversation closes, and HaX's barks gain their intended 1.5 s.

**Done when, re-run after the implementation-review fixes and the id rename (2026-10-01):**
- **Compile:** 10 files, 0 failed (files renamed: `m05_npc_owen_gallagher`, `m05_npc_dr_halloran`).
- **Validator:** no unknown fields; all ink files valid; schema passes; **0 errors**; geometry and door alignment OK; critical path 4 hops.
  - **6 co-fire warnings**, all intended, all on HaX: `item_picked_up:notes` ×6 (disjoint by `data.itemId`), `item_picked_up:keycard` ×4, `flag3_submitted` ×2, `door_unlock_attempt` ×4, `object_interacted` ×3, `conversation_closed:david_torres` ×4.
- **Door check:** 9/9. **Room depth:** 0/10 empty rooms, 6 lock declarations.
- **Rendered-JSON assertions: 26/26 pass.** New checks:
  - NPC ids renamed;
  - every storyPath exists;
  - task ids and KO globals renamed;
  - `npc_ko:owen_gallagher` → `on_owen_ko_relay`;
  - Recruiter: 3 closes + 2 `game_loaded`, no `room_entered`, no `conversationMode`;
  - 2 CEO pickup mappings;
  - flag-4 gated on `final_choice`;
  - `recruiter_deal_decided` declared;
  - **no "Sarah", "Chen", "chen", "Kevin", "kevin" or `- K"` anywhere** in the rendered JSON, the ink, `mission.json` or the walkthrough.
- **inkcheck at `start`:** all 10 files clean.
- **loopcheck: 36/36**, no runtime errors, plus the debrief at **10/10** (5 endings × CEO email found or not):
  - the Patricia-phone, Owen, Patricia and Torres states from round 3;
  - Patricia `hub` with `topic_investigation=true patricia_influence=7`;
  - Patricia `share_findings` with `owen_ko=true`;
  - HaX `support_hub` with `server_door_seen=true patricia_ko=true`;
  - HaX `post_ko_safety_net_choices` with `final_choice=arrest`;
  - Recruiter `start` with: Torres named; fate set; fate set with the deal taken; the deal offered; and `idle`.
- **Simulations:**
  - Recruiter with the fate set and no offer → `never_talked_terms`; fate set with the offer made → `deal_refused_response`;
  - Patricia's hub re-ask → `ceo_copy_handover`, after which the choice is gone;
  - Patricia's phone naming with `owen_ko=true` → no "told Owen" line, and it ends "ring me when it's done";
  - HaX `general_advice` with Patricia KO'd → "He's had word from Security; tell him."
- **E13 detector** re-run on the three phone inks: 0 knots with text before their choices.

**Still for the playtest:** the round-3 list, plus:
- the Recruiter rung back only after the confrontation;
- a reload with her offer unanswered (second `game_loaded` backstop);
- taking Patricia's email copy unread;
- that saved games from before the id rename are not expected to carry over (new ids).

**[playtest] Fixes from playtests 3a (game 1242, 5/5 PASS) and 3b (games 1243/1247/1248, 6/7 PASS, three endings completed), 2026-10-01:**

| # | Cause | Fix | Result |
|---|---|---|---|
| 1 (FAIL) Patricia's email copy never delivered | **Server.** `find_accessible_item` (`games_controller.rb:1543-1606`) matches `id == item_id \|\| name == item_name`, and searches room objects and their `contents` (priority 2) before NPC `itemsHeld` (priority 3). Her copy shared its name with the cabinet copy, so the give resolved to `patricia_filing_cabinet`'s contents: "Container not unlocked" | Her copy is renamed "Patricia's Copy of the CEO's Email" (id `ceo_stand_down_copy` unchanged, in her `itemsHeld`, matching `#give_item:notes:ceo_stand_down_copy`). The offer is now gated on the synced global `found_stand_down_email`, which only a pickup or read sets, and `ceo_copy_handover` closes the chat. If a give ever fails, the offer comes back next conversation; the local `gave_ceo_copy` is gone. New assertion: no two takeable items share type and name (the only duplicate in m05 was this one). **Engine item, for the approval log:** the lookup should prefer an id match, and only fall back to the name when the item has no id | ✅ assertion passes; simulated hand-over closes the chat |
| 2 Recruiter resumed at "Still deciding?" after the fate | Phone re-navigation (E10) re-runs the knot that owns the saved choice, which was `mid_mission_contact_choices` | All 7 pre-confrontation choices knots open with `{final_choice != "": -> post_confrontation_contact}`: `start`, `recruiter_introduction`, `recruiter_reveals_target`, `recruiter_confirms_casualties`, `recruiter_deal`, `recruiter_deal_terms`, `mid_mission_contact` `_choices`. `not_yet` opens with `{torres_identified: -> start}` | ✅ simulated: those knots with a fate set → post-confrontation lines |
| 3 Unread badge after "(Ring her.)" | The narrator line after the choice counted as an NPC message | `no_answer` is a single choice, "(Ring her. It rings out.)", with nothing after it but `#exit_conversation` | ✅ simulated: no line follows the choice (live badge to confirm) |
| 4 IT notice on the hallway's wall line | `hall_1x2gu` is 10×6 tiles; its walkable floor is rows 2–4, but the bottom row draws where the hallway overlaps Patricia's office (world y 0..64), so visible floor is y −64..0. Tile row 4 = y 0 = the wall line. The validator's geometry check allows that wall-row overlap (standard room overlap), so it reports OK | Notice pinned at (3, 2.3) on the visible floor. The overlap that let a harness `moveTo` cross from Patricia's top wall into the hallway is the engine's wall-row overlap, not a mission layout error; noted for the playtest harness | ✅ assertion; render to confirm |
| 5 Mug hidden by the plant | (3,3) = room px (96,96), inside the plant sprite (x 67–131, y 60–148) | Pinned at (5.6, 4.1) = room px (179,131), on the front-right of the desk (desk x 118–196, y 86–147; the chair sprite covers y 64–128). Fractional tiles are allowed (`rooms.js:2241-2242`, origin top-left) | ✅ assertion; render to confirm |
| 6 Owen asked for the log after Patricia's office authority | By design: office authority (`patricia_authorised_office`) and server authority (`patricia_authorised_server`) are separate asks of Patricia | Owen's refusal names what's missing when only the office is authorised: "Patricia signed off David's office, not the server room. Get her to put her name to that too, or give me a reason I can write in the log." | ✅ simulated |
| — Duplicate reader toast | Engine E1 | No mission fix | — |

**Done when, re-run after the playtest fixes (2026-10-01):**
- **Compile:** 10 files, 0 failed.
- **Validator:** no unknown fields; all ink valid; schema passes; **0 errors**; geometry and door alignment OK; critical path 4 hops; the same 6 intended co-fire warnings.
- **Door check:** 9/9. **Room depth:** 0/10 empty rooms.
- **Rendered-JSON assertions: 29/29.** New: no duplicate takeable type+name; mug clear of the plant; notice on the visible floor.
- **inkcheck at `start`:** 10/10 clean.
- **loopcheck: 42/42.** New:
  - Recruiter `mid_mission_contact_choices` and `recruiter_deal_choices` with a fate set, and `not_yet` with Torres named;
  - Patricia's phone `no_answer`;
  - Owen's `request_password` with office authority only;
  - Patricia's `ceo_copy_handover`.

  Debrief 10/10.
- **Simulations:** the four fixes above, plus the earlier set unchanged.

**Still for a playtest:** the email copy arriving on all three routes; the badge after "(Ring her. It rings out.)"; the two new positions on screen; reopening the Recruiter after the fate.

---

## 1. Summary: what to do, in order

**Phase 1: bugs and decided items. Ship these whatever happens to the rest.**

| # | Change | Cost | Why |
|---|---|---|---|
| 1 | **Done.** Patricia's naming scene no longer claims documents the player hasn't read | 1 ink block, recompiled | F1 |
| 2 | **P0** Rename Dr Sarah Chen → **Dr Ruth Halloran**, Kevin Park → **Owen Gallagher** (orchestrator decision) | ~45 player-visible strings across erb, 6 ink files, mission.json, walkthrough; dungeon graph regenerates | F2 |
| 3 | **P1** Lockpicking-guide bark and HaX's two door barks read true when the player already holds the key | 3 strings | F9 |
| 4 | **P2** Stale "can't drop" comments on HaX's relay items and knots | 3 comments | F10 |

**Phase 2: the kit and the lock chain. This is the core of the plan.**

| # | Change | Cost | Depends on |
|---|---|---|---|
| 5 | **P3** Start kit: lockpicks, RFID cloner, fingerprint kit. Remove Owen's pick set and everything hanging off it. The briefing names the kit | 3 inventory entries; delete 1 item, 1 task, 1 global, 1 mapping, 1 knot; 2 ink lines | none (m04 has landed the kit) |
| 6 | **P4 [r1]** The server-hallway badge is cloned from Owen | `rfidCard` on Owen, 4 knots (m04 shape), 1 mapping, 1 task retyped, 1 item deleted | 2, 5 |
| 7 | **P5 [r1]** The server-room password: Owen refuses by default; the incident log is the leverage; Patricia's authority is the second route | 1 object into `itemsHeld`, 1 object moved, 3 mappings, Owen knot, Patricia branch, 3 globals, relay copy, `door_sign` | 2, 6 |
| 8 | **P6 [r1]** The data centre becomes Torres' key vault: a fingerprint reader enrolled to him, his print on a mug in his office, and Owen's line at the password handover | room lock + `door_sign`, 1 object, 1 Owen line, 2 Patricia lines, 1 HaX line, 1 Torres line | 5, 7 (the seed rides on P5's handover) |
| 9 | **P7 [r1]** HaX's barks for the new chain. **[r3]** Its "Call Patricia" texts need P11 | 2 mappings, 1 rewording, 1 hub line, 2 texts | 6–8, **11 [r3]** |
| 10 | **P11 [new r1] [rebuilt r2]** Patricia by phone (resting knots re-check state); the Recruiter keys on the global, with a reload backstop | 1 phone NPC + mapping, 1 new ink file (~70 lines), 2 Recruiter mappings, 1 global, 1 shared Torres line | 8 (the naming lines), 2 |

**Phase 3: make the mission's own choices count. No new gates.**

| # | Change | Cost | Depends on |
|---|---|---|---|
| 11 | **P8 [r1]** The CEO's stand-down email has a consequence, and Patricia can hand it over | 1 global, 2 onRead, 1 `itemsHeld` copy, 1 Patricia knot, 2 debrief lines, 2 credit lines | 2 |
| 12 | **P10** Offer the privilege-escalation field guide for flag 4 | 1 `itemsHeld` entry, 1 mapping, 1 hub branch | none |

**Phase 4: docs and verification.** Header layout comment (`erb:10-31`), `mission.json`
(`key_npcs`, act summaries), `TESTING_WALKTHROUGH.md`, the `puzzle_graph_*` keys on
everything that moves, then the "done when" block in §11 and a browser playtest.

❌ **Dropped:** D1–D8 (draft 1), **[r1]** P9. **Withdrawn after round 1:** W1–W9. Reasons at the end.

**Needs user approval** (outside this mission; none blocks the plan):
- A1: `door_unlock_attempt` fires on a successful unlock too.
- E1 and E8 are already logged; m05 adds one observation to E1.

See §10.

---

## 2. Headline numbers

| | m01 | m02 | m03 | m04 | **m05 now** | **m05 after** |
|---|---|---|---|---|---|---|
| Rooms | 13 | 13 | 7 | 9 | 10 | 10 |
| Lock declarations (`room_depth.py`) | 12 | 15 | 7 | 6 | 5 | 6 |
| Critical-path hops (aims, generator) | 9 | 4 | 2 | — | 4 | 4 |
| Empty rooms | 0 | 2 | 1 | 0 | 1 (`server_hallway`) | 0 |
| **[r1][r2]** Room crossings, attentive run, incl. naming (§8) | | | | | ~18 | 14 (16 if the office was visited first) |

The locks today:

| Lock | Where | Type | Opened by |
|---|---|---|---|
| `server_hallway` | `erb:1063-1068` | rfid `employee_badge` | Kevin's clone (`erb:1029-1037`), Chen's spare (`erb:1203-1213`), HaX relay |
| `server_room` | `erb:1076-1080` | password `quantum2024` | sticky note on Kevin's monitor (`erb:1042-1051`), Kevin at influence ≥ 25 (`m05_npc_owen_gallagher.ink:157-160`) |
| `torres_office` | `erb:1135-1139` | rfid `office_keycard` | Kevin's spare on Patricia's authority or influence ≥ 30, HaX relay |
| `torres_briefcase` | `erb:1156-1163` | key | Kevin's pick set |
| `patricia_filing_cabinet` | `erb:1274-1282` | key | Kevin's pick set |

`data_center` (`erb:1299-1303`) is unlocked.

---

## 3. Boss-key audit

Depths from `room_depth.py`:
- 0: `reception_lobby`;
- 1: `patricia_office`, `main_corridor`;
- 2: `break_room`, `open_office_area`, `server_hallway`;
- 3: `research_lab`, `server_room`, `torres_office`;
- 4: `data_center`.

**[r1]** "Seen at" is now the depth of the room the door is seen *from*.

### Today

| Lock | Seen from | Key available at | Verdict |
|---|---|---|---|
| Server hallway | 1 (corridor) | 2 (Kevin, open office) | ⚠️ key-before-lock in practice. Kevin is the first person the player is pointed at (`m05_npc_patricia_morgan.ink:114`, HaX `erb:673`) |
| Server room password | 2 (hallway) | 2 (sticky note on Kevin's monitor) | ⚠️ key-before-lock. The note is a world object and says what it opens (`erb:41`) |
| Torres' office | 2 (open office) | 2 (Kevin) after 1 (Patricia) | ✅ boss-key only if the player tries the door before asking. Patricia's hub offers it from the first visit (`m05_npc_patricia_morgan.ink:222`) |
| Briefcase | 3 | 2 (Kevin's picks) | ⚠️ key-before-lock |
| Filing cabinet | 1 | 2 | ✅ boss-key, flavour only (F8) |

### After Phase 2

| Lock | Seen from | Key available at | Verdict |
|---|---|---|---|
| Server hallway | 1 | start (cloner) + Owen's card at 2 | ✅ *by design*: the m03 cloner, deliberately fast (P4) |
| Server room password | 2 (hallway) | after the door is seen: Owen at 2 with the incident log from 1 as leverage, or Patricia's authority from 1 | ✅ **boss-key [r1]**. Owen refuses by default. The hunt is for something that makes him say yes: Patricia's own log, or Patricia. Two elsewheres |
| Torres' office | 2 | Owen, on Patricia's authority | ✅ as today; Patricia also authorises it at the naming (P6/P11) |
| Briefcase, filing cabinet | 3, 1 | start (picks) | ✅ *by design* |
| **Data centre (vault)** | 3 (server room) | Torres' office (3), kit from start | ✅ **anticipated [r1]**. Owen names the reader and whose thumb it takes at the password handover (P6), so the player learns of the lock *before* seeing it and can lift the print next door (+2 crossings). This trades the strict boss-key for pacing (§8, M3). A player who skipped Owen (KO route) gets the same line from HaX's relay and meets the reader with its `door_sign` |

**The three beats.**
- **Password:**
  - encounter: the keypad and its sign ("Ask IT");
  - hunt: Owen refuses; the player brings back Patricia's log or her authority;
  - return.
- **Vault:**
  - encounter: Owen's warning (told, not tried);
  - hunt: the mug in the office next door;
  - return: through the building, with the print in hand.

---

## 4. Findings

### F1. Patricia's naming scene asserted documents the player hadn't read. **Fixed.**
`significant_findings` printed "There's a staging manifest and an upload schedule in the
data centre. Both say D. Torres. Tonight, half past eight." whenever flag 3 was missing.
`has_exfil()` is true on either document alone (`m05_npc_patricia_morgan.ink:36-37`). The
line is now one conditional line per document (`m05_npc_patricia_morgan.ink:272-281`).
Recompiled 9/9. inkcheck at `start`: 800/800. loopcheck on `share_findings`: clean with
manifest only, schedule only, and both.

### F2. Rename (orchestrator decision) **[r1 corrected]**
"Dr Sarah Chen" clashes with Dr Lyra "Loop" Chen and with the Recruiter's alias list
(`story_design/universe_bible/03_entropy_cells/insider_threat_initiative.md:37`). "Kevin Park" clashes with
m01's Kevin Park and sits beside m05's Lisa Park.
- **The new names:**
  - **Dr Ruth Halloran**: "Ruth", "Halloran" and the full name have 0 hits across `scenarios/` and `story_design/`;
  - **Owen Gallagher**: likewise.
- Lisa Park stays.
- **Player-visible sites (re-checked per file):**
  - display names, `erb:998`, `:1189`;
  - task titles, `erb:204`, `:219`;
  - the directory, `erb:921`;
  - the sticky note's observation "…edge of Kevin's monitor", `erb:1049` **[r1]**;
  - the IT notice, `erb:1057`;
  - three item observations, `erb:647`, `:1035`, `:1210`;
  - two HaX barks, `erb:789`, `:795`;
  - the sticky-note signature "- K", `erb:41`;
  - every speaker prefix and mention in `m05_npc_dr_halloran.ink` (incl. `:165` "Kevin in IT") and `m05_npc_owen_gallagher.ink`;
  - `m05_insider_trading_opening.ink:219-221`, `:234`;
  - `m05_npc_lisa_park.ink:110` **[r1]**;
  - `m05_npc_patricia_morgan.ink:94`, `:114`, `:180`, `:225`;
  - `m05_phone_agent_0x99.ink:328`, `:340`, `:488` **[r1: :341 had no hit]**;
  - `mission.json:81`, `:94`, `:100` ("Dr. Sarah Chen" becomes "Dr Ruth Halloran").
- The dungeon graph regenerates with the validator.
- **What stays:** sprites only. **[impl-review, user rename rule]** Ids, file names, `#speaker:` tags, globals, VARs, task ids and knot names were renamed too (map in §0). Draft 1–4 kept them. Neither NPC has a `voice` block (`erb:996-1010`, `:1187-1201`).
- **[r1]** The old `dr_chen` id is hard-coded in the engine (F13).

### F3. The start kit breaks the kit rule
`startItemsInInventory` is the phone alone (`erb:442-451`). The briefing explains why: "A
security auditor can't walk a pick kit through reception. Anything you need, you source on
site." (`m05_insider_trading_opening.ink:234`).
- The pick set is then found on Kevin (`erb:1011-1019`), with its own optional task (`erb:242-249`), global (`erb:499`), HaX mapping (`erb:682-687`) and hub knot (`m05_npc_owen_gallagher.ink:104-105`, `:212-226`).
- m04 also had a regulator's cover and still carried picks (`m04 erb:417-424` **[r1]**).

### F4. Kevin hands out three keys, and the cloner makes one of them odd
Kevin holds a cloned staff badge (`erb:1029-1037`), the office spare (`erb:1021-1028`) and
the picks; the password is on his monitor (F5). "I cloned my own badge for the pen test.
Here." (`m05_npc_owen_gallagher.ink:174-175`). A player with a cloner would copy his lanyard.

### F5. The password solves itself, and the rapport gate isn't one **[r1 extended]**
- The sticky note is a world object (`erb:1042-1051`), and its text names the lock (`erb:41`).
- Kevin's ≥ 25 line repeats it (`m05_npc_owen_gallagher.ink:157-160`).
- **[r1]** The first meeting's natural path gives +10 then +10 (`:50`, `:79`), so `owen_influence` is 20 before the hub opens. Any influence threshold of 20 is passed on the first ask. A rapport gate here would be a fetch, not a puzzle.

### F6. The data centre is an open room at the bottom of the mission **[r1 corrected]**
`data_center` has no lock (`erb:1299-1303`), yet it holds:
- the upload terminal (`erb:1355-1371`);
- the Recruiter's envelope (`erb:1372-1381`);
- the schedule and the manifest (`erb:1382-1401`);
- Torres himself.

It is where the key material is staged. **[r1]** Draft 1 said Patricia's log puts only
cryptography badges near it; the log is about the server room (`erb:1270`). That claim is
withdrawn.

### F7. `server_hallway` is empty
`room_depth.py`: "EMPTY — corridor doing the work of nothing". It holds only the RFID lock (`erb:1063-1074`).

### F8. The CEO's stand-down email has no consequence
Patricia's cabinet yields "Printed Email from the CEO's Office" (`erb:1286-1293`). It has no
`onRead`, and neither the debrief nor the credits mention it. It is the mission's one thread
of institutional failure. Patricia confesses to it at `m05_npc_patricia_morgan.ink:169-170`
("I let a polite email stop me"), but she can't show it.

### F9. Door barks fire on success too
`door_unlock_attempt` is emitted before the lock is checked (`unlock-system.js:110-118`).
- HaX's hallway bark (`erb:786-790`) and Torres-office bark (`erb:792-796`) fire as the door opens.
- The lockpicking-guide bark says "If you've got picks" (`erb:803`).

Engine side: A1.

### F10. Stale engine-gap comments
`erb:641` and `m05_phone_agent_0x99.ink:334-335` still say Kevin's items can't drop.
`dropNPCItems` now finds the sprite (`npc-hostile.js:256-261`).

### F11. The "who" is given away by the to-do list
"Get a keycard for Torres' office" (`erb:235`) shows from minute two, and Patricia's hub
offers his office from the first visit (`m05_npc_patricia_morgan.ink:222`). The mission is
really "prove it and decide". That is why P6 can name Torres on the reader without spoiling
anything. **[r1]** No fix proposed (P9 dropped).

### F12. [new r1] [corrected r3] The Recruiter's trigger
Her call fired on `conversation_closed:patricia_morgan` (`erb:845` before pass 3), which emits twice per close (pass 2, D2), and on a global for the HaX route. **[r3]** Draft 2 said phone chats never emit `conversation_closed` (lesson 31). That is stale: since `18237332` they do (`phone-chat-minigame.js:986-1007`, `:1192`). The real problem is that `global_variable_changed:torres_identified` fires mid-scene: in person, the global is set with lines and a choice still to come (`m05_npc_patricia_morgan.ink:292`). On top of that, mapping delays count from game start (E11, `npc-manager.js:710-718`, `:1121-1132`), so a "delay" doesn't hold it back.

### F13. [new r1] The `dr_chen` id is hard-coded in the engine (E8, logged)
`person-chat-conversation.js:108`, `:687-696` and `phone-chat-conversation.js:141` branch on `dr_chen`, for an `npc_location` default and "Dr. Chen…" influence toasts. It is latent in m05, which uses no `#influence_*` tags. The rename keeps the id, so nothing changes. If m05 ever adds influence tags, the toast would print the old name until E8 lands.

### Bug sweep (Step 4), clean items
- **`item_picked_up:` keyed on id:** none. Every mapping uses the type plus `data.itemId` (`erb:688-716`).
- **Tasks with no completion route:** none. `find_lockpick` goes with P3.
- **Author notes:** none. The bracketed lines on the flyer and leaflet (`erb:944`, `:980`) are in-world descriptions.
- **Observations stating a code:** none, apart from the sticky note's own text (F5).
- **Stale geography:** none (`erb:673` ✓ `:546`; "north of the server room" ✓ `:1082`; the directory ✓).
- **Numbers:** 20:30, 73% / 27%, 47 names, $380,000, £2,140 versus "about two grand", Sofia 11 and Miguel 8. All agree.
- **Dead ERB helpers:** none. **Write-only globals:** `mission_priority` and `knows_insider_profile`. Harmless.
- **Technical claims:** Bludit's authenticated image-upload RCE is real (Bludit ≤ 3.9.2, CVE-2019-16113; not cited in game). Flag 4 is `sudo_root_less` (`SecGen/scenarios/break_escape/safetynet/m05_insider_trading.xml:239`).
- **Field guides:** the three handed out exist with matching permalinks; so do `privilege-escalation` and `rfid-cloning`.
- **Shared minigames with hard-coded ids:** m05 uses none of them. `dual-auth-minigame.js` hard-codes sis01's names (D8). The `dr_chen` id is F13.
- **Validator:** 0 errors; 7 co-fire warnings, all intended; door alignment and geometry OK.

---

## 5. Proposals

### Phase 1

**P0. Rename** ✅ keep (orchestrator decision). The sites are in F2.
- Owen Gallagher, sysadmin, late twenties. Dr Ruth Halloran, Chief Scientist and Project Heisenberg lead.
- "Dr." becomes "Dr" (UK).
- After the edit, grep the rendered JSON, `mission.json` and all nine `.ink` files for `Sarah`, `Chen`, `Kevin` (outside ids, VAR names and `#speaker:` tags) and `- K"`. Expect 0.

**P1. Barks that read true when the door opens** ✅ keep.
- Hallway (`erb:789`): "Staff prox reader. Your cloner will take a card off anyone who carries one. Owen's lanyard is the nearest."
- Torres' office (`erb:795`): "Torres' office. IT holds a spare for every office, and Owen won't part with it without a reason."
- Lockpicking guide (`erb:803`): "Pin tumbler. Your picks will do it. Want the guide?"

**P2. Stale comments** ✅ keep. Rewrite `erb:641` and `m05_phone_agent_0x99.ink:334-335`: the relay duplicates the KO drop as a safety net.

### Phase 2

**P3. Start kit and briefing** ✅ keep.
- **Inventory** (`erb:442-451`), after the phone:
  - lockpicks, as `m04 erb:417-424`;
  - the cloner, as m03 `erb:386-392`;
  - `{ "type": "fingerprint_kit", "name": "Fingerprint Kit", "takeable": true, "observations": "The kit you took off the OptiGrid crew at Albion. Powder, brush, lifting tape." }`.

  No PIN cracker. Add `puzzle_graph_role: "tool"` and `puzzle_graph_unlocks`.
- **Removals:**
  - `kevin_lockpick` (`erb:1012-1019`);
  - task `find_lockpick` (`erb:242-249`);
  - global `lockpick_obtained` (`erb:499`) and its VAR (`m05_npc_owen_gallagher.ink:23`);
  - the `item_picked_up:lockpick` mapping (`erb:682-687`);
  - Owen's hub choice and `request_lockpick` knot (`m05_npc_owen_gallagher.ink:104-105`, `:212-226`).
- **Briefing.** `cover_story` (`m05_insider_trading_opening.ink:201-214`) is on every path. After `:204`:
  > Agent HaX: Your kit goes in with you. Picks, the cloner, and the print kit you brought back from Albion. Auditors carry odd bags; nobody looks.
  >
  > Agent HaX: Still no PIN cracker. The lab isn't finished with it.

  `:234` becomes "SAFETYNET can't get you a staff badge, so you'll be borrowing access on site. Owen Gallagher in IT is your best bet."
- **Continuity.** m04 is implemented. Its kit is in the workshop tool case and kept in the debrief.

**P4. [changed r1] Clone Owen's badge** ✅ keep.
- **NPC field.** `owen_gallagher` gains `"rfidCard": { "card_id": "employee_badge", "rfid_protocol": "EM4100", "name": "Staff Badge - O. Gallagher" }`.
  - A saved clone matches on `card_id` (`unlock-system.js:508-528`). EM4100 is instant (`npc-conversation-state.js:557-558`).
  - **[r1]** No parentheses in the name: the validator flags any `(` in a mapping condition, even inside a literal (`validate_scenario.rb:3091-3097`; only `.includes('…')` is stripped).
- **[r1] Ink: m04's clone shape** (`m04_npc_robert_vance.ink:242-306`). Narration first; the tag on a throwaway line (action tags run before their block's text, and starting the RFID minigame ends the chat); then a separate debrief knot that branches on the synced global.
  - `hub` loses `{not server_badge_obtained} [I need a badge that opens the server hallway.]` (`m05_npc_owen_gallagher.ink:98-99`). It gains a knot-level `+ {not server_badge_obtained} [(Lean over his log screen, close enough for the cloner to reach his lanyard.)]` → `owen_clone`.
  - `owen_clone`: "Narrator: You lean in while he scrolls the logs." / `#clone_keycard:employee_badge` / "Narrator: He keeps scrolling." / `-> owen_clone_debrief`.
  - **[r2]** Don't rely on the narration before the tag being shown. m04's playtest saw it skipped when the minigame starts. The hub choice's own text ("…close enough for the cloner to reach his lanyard") carries the beat; the narration is a bonus.
  - `owen_clone_debrief`:
    - `{server_badge_obtained:` "Narrator: The cloner buzzes once against your hip." / "Owen Gallagher: Did your bag just beep? …You read my badge. Fair. I did half of Finance on last year's pen test." `- else:` "Narrator: The cloner didn't get a clean read." `}`;
    - then `+ {server_badge_obtained} [Sorry. Habit.]` / `+ {server_badge_obtained} [Better me than them.]` / `+ [Leave it for now.]`, all → `hub`. A cancelled clone leaves `server_badge_obtained` false, so the hub choice reappears as the retry.
  - `server_badge_obtained` must be a synced VAR in Owen's ink (it is, `:21`).
- **State.** HaX mapping on `card_cloned`, `condition: "data.cardName === 'Staff Badge - O. Gallagher'"`, `onceOnly`, `setGlobal: { server_badge_obtained: true }` (as `m04 erb:740-746`).
- **[r2] Ordering: resolved.**
  - `card_cloned` is emitted synchronously when the card is saved (`rfid-minigame.js:239-250`).
  - `setGlobal` broadcasts synchronously (`npc-manager.js:574-585`).
  - The conversation resumes about 1.65 s later.

  So `server_badge_obtained` is set before `owen_clone_debrief` reads it. Playtest (b) keeps the cancel case only.
- **Task.** `obtain_server_badge` (`erb:226-232`) becomes `enter_room` `server_hallway`, "Get through the server-hallway reader". Delete `cloned_employee_badge` (`erb:1029-1037`) and its pickup mapping (`erb:688-696`, that id only).
- Halloran's spare (`m05_npc_dr_halloran.ink:111`, `:152-167`) and HaX's relay (`erb:641-648`) stay.
- `conversation_closed:owen_gallagher` fires mid-clone. Nothing in m05 listens for it (grep).

**P5. [rebuilt r1] The password: evidence as leverage** ✅ keep (orchestrator ruling, M2).
- **Story logic.** Owen's default is the IT rule on the notice (`erb:1057`): "After-hours server access must be logged with IT in advance." He doesn't hand the password to an auditor because they're pleasant. What moves him is evidence that his own building's logs have a problem. Patricia's incident log has exactly that: "[2 weeks ago] Cryptography badge: after-hours server room access (23:47)" (`erb:1270`). The player brings it to him. Patricia's say-so is the second route.
- **The note leaves the world.** Move `server_password_note` (`erb:1042-1051`) into Owen's `itemsHeld`. Its signature becomes "- O", and its observation "A sticky note Owen peels off the edge of his monitor".
- **[r1]** No narration shows the note on his monitor. A password you can see and not take fails Step 3d (W5).
- **Seen-door global.** HaX mapping on `door_unlock_attempt`, `condition: "data.connectedRoom === 'server_room'"`, `onceOnly`. It sets `server_door_seen` and barks (P7).
- **Owen's knot.** In `hub`, a knot-level `+ {server_door_seen and not server_password_obtained} [The server room wants a password.]` → `request_password`:
  - **Default [r2]**: "Owen Gallagher: After-hours server access gets logged with IT. That's me. Give me a reason I can write in the log. Or get Patricia to put her name to it." The refusal names both routes, in the same shape as his office-card refusal (`m05_npc_owen_gallagher.ink:207-208`). It offers:
    - **[r2]** `+ {found_incident_log} [Patricia's log has a crypto badge in your server room at 23:47, and nobody logged it with you.]` → `password_given`. Owen: "…Nobody logged that with me. Right." Then `#give_item:notes:server_password_note`, then the vault line (P6). The log is Patricia's ("-PM", `erb:1270`), so the line says so;
    - `+ {patricia_authorised_server} [Patricia's authorised it.]` → `password_given`;
    - `+ [Fair enough. I'll be back.]` → `hub`.
  - Both conditional choices sit at knot level (lesson 48), and the sticky exit is always present.
- **Cut** the ≥ 25 sticky-note line in `ask_security` (`m05_npc_owen_gallagher.ink:157-160`). The +5 stays.
- **[r1] No influence or `all_topics()` route.** F5 shows a threshold isn't a gate here.
- **Patricia's authority.** In `request_authorization` (`m05_npc_patricia_morgan.ink:208-231`), a knot-level `+ {server_door_seen and not server_password_obtained and not patricia_authorised_server} [The server room wants a password Owen won't give me.]` sets `patricia_authorised_server`: "I sign the access log; IT holds the password. I'll message Owen and tell him it's on my authority." Then `-> hub`.
- **Patricia KO.** `on_patricia_ko_relay` (`m05_phone_agent_0x99.ink:323-332`) also sets `patricia_authorised_server` beside `patricia_authorised_office`. The incident log stays on her desk whatever happens to her: `patricia_office` is unlocked (`erb:1220-1224`), and the log's `onRead` sets `found_incident_log`. **[r2]** In the same knot, "When you've got a name and the proof, bring it to me instead of her" (`:329`) is gated on `{not torres_identified}`, so a KO after the naming doesn't ask for it again.
- **Owen KO.** His drop includes the note (now in `itemsHeld`). `on_owen_ko_relay` (`:336-345`) also gives `relayed_server_password_note` ("Server-room password (from IT's ticket queue)") and speaks the vault line. `find_server_password` (`erb:251-256`) adds the relay id. **[r2] Optional:** the relay note also carries `"onRead": { "setVariable": { "server_password_obtained": true } }`, a second path beside its pickup mapping.
- **Globals.**
  - `server_door_seen`;
  - `patricia_authorised_server`;
  - `server_password_obtained`, set by `item_picked_up:notes` mappings on `data.itemId` for the note and the relay copy (lesson 26).

  `found_incident_log` already exists (`erb:483`). VARs go in Owen's, Patricia's and HaX's ink.
- **The IT notice moves into the server hallway** (`erb:1052-1059` → `server_hallway.objects`, pinned clear of both doors). It is reworded: "SERVER ROOM: password access. After-hours access must be logged with IT in advance. Temporary password rotated by IT; expires Friday. Contact O. Gallagher (IT), open-plan office." This fixes F7.
- **[r1] Door sign.** `server_room` gains `"door_sign": "Server Room — Password Access. Contact IT."` (`doors.js` carries `door_sign` onto the door, `:516`).
- **The hunt.** Owen refuses at depth 2. The player needs Patricia's log (depth 1) or Patricia herself. A player who already read the log, which Patricia hands over in her first scene (`m05_npc_patricia_morgan.ink:116`), has the leverage in hand and spends it. That is the reward for reading.
- Cost: 1 object into `itemsHeld`, 1 object moved, 3 mappings, 2 knots, 1 Patricia branch, 3 globals, 1 relay item, 1 `door_sign`. Deps: P0, P4 (one edit to Owen's ink).

**P6. [changed r1] The data centre is Torres' key vault** ✅ keep.
- **Lock.** `data_center` gains `"locked": true, "lockType": "biometric", "requires": "David Torres"` and **[r1]** `"door_sign": "Key Vault — Fingerprint Access. Cryptography Lead Only."` (`m04 erb:1491-1493` pattern).
  - No threshold: a room-level one is ignored, and the 0.4 default holds against ~0.78.
  - The refusal reads "requires David Torres's fingerprint".
- **Print surface.** A new pinned object in `torres_office`:
  - Fields: `"type": "office-misc-cup"` (sprite exists), `"id": "torres_mug"`, name "Mug", `"takeable": false`, `"hasFingerprint": true`, `"fingerprintOwner": "David Torres"`, `"fingerprintDifficulty": "easy"`.
  - Observations, flavour only (hidden until dusted, E1): "A mug printed with a child's drawing: four stick figures and a dog. 'WORLD'S BEST DAD — love Miguel'. Cold coffee, a thumbprint on the glaze."
  - No `text` and no `readable`.
- **Story logic.** Key custody sits with the cryptography lead, and the vault is enrolled to him alone. That is why the Recruiter wanted this man. The player walks in on his own thumbprint, lifted from his son's mug: "the access looks legitimate because it is legitimate" (`m05_npc_patricia_morgan.ink:167`), turned round.
- **[r1] The seed is Owen, at the password handover** (M3a). IT runs the readers. In `password_given`, after the note: "Owen Gallagher: Past the server room is the key vault. Fingerprint reader. David's thumb and nobody else's. Don't ask me how you'd get in there." Torres' office is the next room north, so lifting the print costs about +2 crossings.
- **[r1] The incident-log seed is withdrawn** (W1).
- **At the naming** (in person and by phone, P11):
  - `~ patricia_authorised_office = true`;
  - `{not vault_reader_seen}` "The data centre door reads his fingerprint. Something from his office will carry it."
  - **[r1]** HaX's `name_to_hax` (`m05_phone_agent_0x99.ink:293-315`) gets the same line, so a Patricia-KO run hears it.
- **Torres.** `confrontation_scene` (`m05_torres_confrontation.ink:65`), after "You're not an auditor.": "David Torres: The vault logged me in twice tonight. One of them was you." Always true.
- **Optional bark.** HaX on `minigame_completed`, `condition: "data.minigameName === 'DustingMinigame' && data.success === true"`, `onceOnly`: "That's Torres' print. The vault's north of the server room." It sets `torres_print_collected`, which is never read (m04 W8).
- **Task.** `access_data_center` is retitled "Get past the key-vault reader".
- **Fallback, held in reserve.** A second Torres print on a drinks machine in the server hallway (`objects/drinks_vending1.png`). The story reason is Owen's own line, "I saw him in the server hallway the other night… just standing there, looking wrecked" (`m05_npc_owen_gallagher.ink:142`). Use it only if the playtest finds the vault walk tedious.
- Cost: room lock and sign, 1 object, 1 Owen line, 2 Patricia lines, 1 HaX line, 1 Torres line, 1 optional mapping. Deps: P3, P5.

**P7. [changed r1] HaX's barks for the chain** ✅ keep.
- **Server-room door** (P5's mapping), **[r1]** neutral so it is true on every route: "Password lock. IT sets these; the notice by the door says who." It sets `server_door_seen`.
- **Vault door** (`door_unlock_attempt`, `data.connectedRoom === 'data_center'`, `onceOnly`). It sets `vault_reader_seen`: "Fingerprint reader on the key vault. It takes the cryptography lead's print, and you've got the kit." True whether or not the door opens.
- **Hallway:** P1.
- **Hub [r2]:** `general_advice` returns early once `torres_identified` is true (`m05_phone_agent_0x99.ink:467-470`). So both new hints go **above** that block, as the knot's first lines:
  - `{server_door_seen and not server_password_obtained}` "Owen wants a reason. Patricia's log has one, or ask Patricia." (§6);
  - `{vault_reader_seen}` "The vault wants Torres' print. His office."
- **[r2] Case-ready texts.** With P11 the naming can be done by phone:
  - the nudge tail at `erb:762`, "Take it to Patricia and name him. She won't move on anything less.", becomes "Call Patricia and give her the name. She won't move on anything less.";
  - `general_advice`'s "Take it to Patricia and name him." (`m05_phone_agent_0x99.ink:475`) becomes "Call Patricia and give her the name."

**P11. [rebuilt r2] [r3] Patricia by phone; the Recruiter keys on the naming conversation closing** ✅ keep (orchestrator rulings M3b, r2 M1/M3, r3 M1–M3).
- **Why.** Every player is in the server room for the VM. Naming him in person means walking back to Patricia's office and out again (~10 crossings in act 3). Patricia says "Stay in touch" (`m05_npc_patricia_morgan.ink:159`). The precedent is m04's `robert_vance_phone` (`m04 erb:875-901`).
- **[r2] NPC JSON**, added beside HaX, with `patricia_phone` added to the phone's `npcIds`:
  ```json
  {"id":"patricia_phone","displayName":"Patricia Morgan","npcType":"phone",
   "storyPath":"scenarios/m05_insider_trading/ink/m05_phone_patricia.json",
   "avatar":"assets/npc/avatars/npc_neutral.png","phoneId":"player_phone","currentKnot":"start",
   "eventMappings":[{"eventPattern":"conversation_closed:patricia_morgan","onceOnly":true,
     "setGlobal":{"patricia_phone_available":true},
     "sendTimedMessage":{"delay":2500,"message":"Patricia. This is my mobile. Ring me if anything changes; don't walk it back through reception."}}]}
  ```
  The text tells the player the phone route exists. **[r3]** The wording is neutral, because a player may already have named Torres in that first meeting (r3 minor 3). The `setGlobal` is unconditional. `conversation_closed` can emit twice, but `onceOnly` plus an idempotent `setGlobal` make that harmless.
- **[r2] Why every resting knot re-checks state.**
  - The phone preload runs `start` and saves the story state when `start` prints anything (`phone-chat-minigame.js:369-380`).
  - A reopened chat with saved state, after any synced global has changed, re-navigates to the knot owning the first saved choice, **not** to `start` (`:532-566`).
  - HaX texts 3 s after the briefing (`erb:670-674`), so most players open the phone before meeting Patricia.

  So a player could be parked in `not_yet` for good, or `hub` could answer after a KO. Each knot therefore routes on state at its own top:
  ```ink
  === start ===
  {patricia_ko: -> no_answer}
  {not patricia_phone_available: -> not_yet}
  -> hub

  === not_yet ===
  {patricia_ko: -> no_answer}
  {patricia_phone_available: -> hub}
  + [(Hang up.)]
      #exit_conversation
      -> not_yet

  === no_answer ===
  + [(Ring her.)]
      #speaker:narrator
      Narrator: It rings out.
      #exit_conversation
      -> no_answer

  === hub ===
  {patricia_ko: -> no_answer}
  {not patricia_phone_available: -> not_yet}
  #speaker:patricia_morgan
  + {not torres_identified} [I know who it is.] -> phone_share_findings
  + {torres_identified and final_choice == ""} [He's in the data centre.] -> phone_hold_him
  + [Just checking in.]
      {not torres_identified: Patricia Morgan: Still here. Ring me when you've got something.}
      {torres_identified and final_choice == "": Patricia Morgan: You know where he is. Go.}
      {final_choice != "": Patricia Morgan: It's done, then. I'll look after the building.}
      #exit_conversation
      -> hub
  ```
  - `not_yet` prints no NPC text (lesson 36): the preload must write no global and show nothing.
  - **[r3]** The "(Ring her.)" line sits behind the choice, so the preload leaves no unread badge after a KO (minor 1). "Just checking in" varies with the state (minor 2).
  - **[r3] Re-navigation guard (M3).** `phone_share_findings`, `phone_significant_findings` and `phone_hold_him` open with `{torres_identified: -> hub}` (or `{final_choice != "": -> hub}`). The same guard opens `share_findings` and `significant_findings` in the person file, and `{torres_identified: -> support_hub}` opens HaX's `name_to_hax`. Evidence-short branches end in `-> hub` with no choice of their own.
  - `phone_share_findings` repeats `share_findings`/`significant_findings` with identical `has_motive()`/`has_exfil()` conditions. On success it runs, near the top, `#complete_task:identify_torres`, `~ torres_identified = true` and `~ patricia_authorised_office = true`, then the P6 print line (`{not vault_reader_seen}`) and the shared Torres line below.
  - `phone_hold_him`: "Keep him there. I'm bringing the police." It is reachable only while `final_choice == ""`.
  - Every exit is `#exit_conversation` → `hub` (lesson 21).
- **[r2] VARs** in `m05_phone_patricia.ink`, all synced globals:
  - `patricia_ko`, `patricia_phone_available`, `torres_identified`, `final_choice`, `patricia_authorised_office`, `vault_reader_seen`;
  - the six evidence globals (`found_medical_bills`, `found_torres_journal`, `found_vetting_file`, `flag3_submitted`, `found_manifest`, `found_upload_schedule`);
  - `found_pamphlet`, `player_name`.
- **[r2] The shared "Torres appears" line.** It is used in both Patricia files and replaces `m05_npc_patricia_morgan.ink:295`: "His badge just went through the hallway and the vault's logged him in. He's at the upload terminal." It reads true wherever the player is standing, including in the data centre when he appears (his `setVisible` on `torres_identified`, `erb:1331-1335`).
- **[r3] The Recruiter (F12): keyed on the naming conversation closing.**
  1. Three mappings, on `conversation_closed:patricia_morgan`, `conversation_closed:patricia_phone` and `conversation_closed:agent_0x99_handler` (HaX's NPC id, `erb:608`; the Patricia-KO naming route). Each has:
     - condition `globalVars.torres_identified === true && globalVars.recruiter_contacted_player !== true && globalVars.recruiter_texted !== true`;
     - `onceOnly`;
     - `setGlobal: { recruiter_texted: true }`;
     - `sendTimedMessage` with `delay: 2000` and the existing text, with no `conversationMode`.

     Keying on the close means nothing lands mid-scene whether or not E11 is fixed. Today the 2 s is effectively immediate; after a fix it is a short pause. `recruiter_texted` stops a second text across the three routes and the double close.
  2. **[r3] Reload backstop on `game_loaded`.** Not `onceOnly`, condition `globalVars.torres_identified === true && globalVars.recruiter_contacted_player !== true`, re-sending the same text.
     - `game_loaded` fires once per load, after globals are restored (`game.js:929-941`), with NPCs loaded at `:1177-1180` and the emit at `:1469`. So it re-sends only after a reload, not on every room entry (W15).
     - It is unproven for phone NPCs; playtest (f) must confirm it. If it fails, the fallback is `room_entered:data_center`, with the duplicate texts recorded.
     - `recruiter_contacted_player` is set when her chat opens (`m05_phone_recruiter.ink:56`).

  Her `start` guard (`m05_phone_recruiter.ink:32-43`) is unchanged.
- **HaX's naming route** (`name_to_hax`, Patricia KO'd) stays and uses the same Torres line.
- Cost: 1 phone NPC, 1 ink file (~70 lines), 3 Recruiter/Patricia mappings, 1 global, 1 shared line. Deps: P6's lines, P0.

### Phase 3

**P8. [changed r1] The CEO's email counts** ✅ keep.
- `ceo_stand_down_email` (`erb:1286-1293`) gains `"onRead": { "setVariable": { "found_stand_down_email": true } }`.
- **[r1] Patricia can hand it over.** Her confession at `m05_npc_patricia_morgan.ink:169-172` ("I let a polite email stop me") becomes a divert to a new knot `patricia_confession` (lesson 48):
  - it keeps the line and the +1;
  - it offers `+ [Show me the email.]` → `#give_item:notes:ceo_stand_down_copy` with "Patricia Morgan: I kept a copy. If this goes wrong, it went wrong there.";
  - and `+ [Another time.]`, both → `hub`.
  - `ceo_stand_down_copy` is a second `notes` item in Patricia's `itemsHeld` with the same text and onRead.
  - The cabinet pick stays as the impatient route.
- **Debrief.** In `mission_outcome_assessment`:
  - `{found_stand_down_email:` "Patricia's copy of the CEO's email went to the Home Office review with the rest of the file. Nobody signs off on a stand-down like that twice." `- else:` "QDC's readiness review passed. Nobody asked who cancelled Patricia's interview." `}`
- **Credits.** "── QUANTUM DYNAMICS ──":
  - "CEO'S STAND-DOWN — on file with the Home Office review" when found;
  - "WHO STOPPED THE INTERVIEW — never asked" when not.
- **Canon.** SAFETYNET passes evidence on and decides nothing (`02_organisations/safetynet/overview.md:41-47`).

**P10. Privilege-escalation guide** ✅ keep.
- Flag 4 is `sudo_root_less`, which matches `privilege-escalation.md` ("Privilege Escalation via Sudo").
- `safetynet_field_guide_privilege_escalation` goes in HaX's `itemsHeld`, with the `labUrl` as `m04 erb:581`.
- A mapping on `global_variable_changed:flag3_submitted` sets `privesc_guide_offered`. That group grows from 2 to 3, which is intended. The flag-3 bark's text extends: "…somewhere only root can read. I've a sudo guide if you want it."
- A hub branch `request_privesc_guide`.

---

## 6. What could break

- **Solvability after Phase 2:**
  - **Hallway:** clone (with retry); Halloran's spare; relay.
  - **Password:** the incident log (always on Patricia's desk); Patricia's authority; HaX's authority on a Patricia KO; Owen's KO drop; relay.
  - **Torres' office:** Patricia's authority (also set at every naming); Owen at ≥ 30; relays.
  - **Vault:** the mug, always present and retryable.
  - **Naming:** in person, by phone, or to HaX.
  - **Ending:** unchanged.
- **[r1] No route opens the password without either evidence or authority.** If a player never reads the log and Patricia is fine, they must ask her. **[impl-review]** Owen's refusal names both routes ("Give me a reason I can write in the log. Or get Patricia to put her name to it."), and the notice points at IT. HaX's `general_advice` gives "Owen wants a reason. Patricia's log has one, or ask Patricia.", or with Patricia KO'd, "…He's had word from Security; tell him." That makes it a puzzle with a fair hint, not a dead end.
- **Reload between dusting and the vault door.** The print is lost; the mug can be dusted again. Not a soft-lock.
- **A failed dusting** leaves the mug collectable. **A low-quality print** (~0.78) clears 0.4.
- **Biometric door icon** (E1). A pick attempt lands in the refusal. The sign and HaX's bark name the print.
- **Refusal fires twice per click** (E1). The barks are `onceOnly`.
- **[r2] Clone return.** Ordering is resolved (P4). The remaining case is a cancelled clone, where the debrief says "didn't get a clean read" and the hub choice reappears. Playtest (b).
- **[r2] Phone preload and re-navigation (lesson 36 and `phone-chat-minigame.js:532-566`).** Patricia's phone writes no global in `start` or `not_yet` and prints no NPC text there. Every resting knot (`not_yet`, `hub`) re-checks `patricia_ko` and `patricia_phone_available` at its top, so a chat re-navigated to a saved choice still routes on the current state.
- **[impl-review] Recruiter.** Text only, sent when the naming conversation closes, on all three routes. If the player confronts Torres before ringing back, her `start` sees `final_choice` set and plays `never_talked_terms`: no pitch, no deal. Draft 4 claimed the old branch at `:239-242` handled this, but it was unreachable without `recruiter_deal_offered` (W17). After a reload, two `game_loaded` backstops re-send a text: one if her chat was never opened, one if the offer is still unanswered.
- **Lesson 27.** `obtain_server_badge` and `find_server_password` stay in aim 2, which is where those doors are met.
- **Lesson 35.** Every new condition is `&&` only. **[r1]** No `(` even inside literals (B1).
- **[r1] Validator co-fire groups:**
  - on HaX: `door_unlock_attempt` grows from 2 to 4 (disjoint by room); `item_picked_up:notes` from 2 to 4 (disjoint by `data.itemId`); `item_picked_up:keycard` shrinks from 5 to 4; `flag3_submitted` from 2 to 3 (P10);
  - on the Recruiter: `global_variable_changed:torres_identified` goes from 1 to 1.

  The same groups warn as today. Expect 7, possibly 8 if a group crosses the validator's threshold for the first time. Each is listed with its reason in the implementation record.
- **Layout.** No room changes. Two pinned objects (mug, notice) need a render look.
- **Ink.** Every new knot ends in a hub or a choice. Recompile and rerun inkcheck/loopcheck on Owen, Patricia (person and phone), HaX, Torres, the opening and the debrief.

## 7. Dialogue implications

Lines follow `README_ink_best_practices.md`: exact speaker prefixes; tags above their line;
`#exit_conversation` never ends a story; first-person choices; sticky hub exits.

- **Owen.**
  - Clone knots (P4).
  - `request_password` with its two leverage choices, and `password_given` with the vault line (P5, P6).
  - `request_badge_clone` and `request_lockpick` go.
- **Patricia.**
  - **[r2]** The shared Torres line replaces `:295`; "Keep him there" only while `final_choice == ""`.
  - Password authority (P5).
  - Naming additions (P6).
  - `patricia_confession` (P8).
  - The new phone file (P11).
- **HaX.**
  - Barks (P7).
  - Two hub lines (P7, §6).
  - Relay additions (P5).
  - `name_to_hax` print line (P6).
  - Privesc guide (P10).
- **Opening.** Kit lines and `:234` (P3).
- **Torres.** One line (P6).
- **Debrief.** Two lines (P8).
- **Halloran, Lisa.** Rename only.
- **Re-check.** Grep for "sticky note", "on my monitor", "pick set", "cloned my own", "Dr Chen", "Kevin" afterwards.

## 8. Pacing **[r1 recounted]**

| Act | Rooms (depth) | Beats today | Beats after |
|---|---|---|---|
| 1 | reception 0, Patricia 1 | briefing, badge, vetting file, log | the same; the log is now leverage |
| 2a | corridor 1, open office 2, break room 2, lab 3 | Kevin hands out badge, password, picks and office card | Owen: clone his lanyard (fast). Lisa, Halloran, leaflet as today |
| 2b | hallway 2, server room 3, Torres' office 3 | sticky note in pocket, VM | **the password**: Owen refuses; bring the log or Patricia. At the handover Owen names the vault. The mug next door. Then the VM |
| 3 | data centre 4 | open room; walk back to Patricia to name him; walk back to Torres | **the vault** on his print; evidence; name him **by phone**; Torres appears; the confrontation |

**Crossings**, counted by hand on the rendered layout:
- **Today, attentive run:** ~18. That is:
  - reception → Patricia → reception → corridor → open office → corridor → hallway → server room → data centre (8);
  - back to Patricia to name him (5);
  - back to the data centre (5).
- **After, attentive run** (log read in act 1, office authorised by Patricia on the first visit): **[r2] 14** (draft 2 said ~16). That is:
  - Patricia and back to the corridor (3);
  - open office, clone (4);
  - hallway, password door (6);
  - open office, Owen with the log and the vault line (8);
  - Torres' office, mug (9);
  - back through the open office and corridor to the hallway (12);
  - server room (13); data centre (14);
  - naming by phone (0).

  It is 16 if Torres' office was already visited before the handover.
- **After, a player who never read the log:** about +4 (a trip to Patricia's desk or to Patricia), so ~20.
- **After, a KO run that skipped Owen:** the vault line comes from HaX's relay. If they meet the reader before dusting, the cold walk is +8 (~24). The drinks-machine fallback (P6) exists for that case.

Act 3 is now the vault, the evidence and the confrontation, with no walk back to the start. **Empty rooms:** none.

## 9. Capability arc **[r1 reframed]**

**Rule** (`PASS3_APPROVAL_LOG.md`, user, 2026-10-01): the kit is cumulative. Each mission
grants at most one new class. The PIN cracker is rationed and not in start kits after m02.

| Mission | Grants | m05's use |
|---|---|---|
| m01 | Lockpicks | Briefcase and Patricia's cabinet. *By design* |
| m02 | PIN cracker (rationed) | Not in the kit; the briefing says so (P3). No PIN lock in m05 (D2) |
| m03 | RFID cloner | Owen's lanyard → server hallway (P4). *By design*, deliberately fast |
| m04 | Fingerprint kit | **Torres' own print → the key vault (P6).** The insider's credential turned against him with last mission's tool. This is m05's wall |
| **m05** | **No new tool class.** It adds a mechanic: **evidence as leverage.** A piece of the case is the thing that opens a door (Patricia's log makes Owen give up the password), not a rapport score | The password (P5) |

**Start kit for m05:** phone, lockpicks, RFID cloner, fingerprint kit. No PIN cracker.

**[r1] What the wall is.**
- **The vault.** It is the one lock that is about this mission's antagonist: his custody, his thumb, his son's mug. The player opens it with the kit they earned at Albion, and Torres says so when they meet.
- **The password.** It is a social puzzle, not a wall. Draft 1 called it "the first lock in the campaign the whole kit can't touch", which is false: m01 has 2 password and 5 PIN locks, m02 has 1 and 3, m03 has 1 and 1 (W3).

**Why no new class.**
- The engine's unused lock types are `bluetooth` and `ble` (`unlock-system.js:407`, `:459`). Nobody in QDC has a reason to use either, and m06–m08 never do (their lockTypes are pin, rfid, password, key and flag). So it would be a one-off gadget (D1).

**For m06's planner (nothing here is m05 work):**
1. Start kit: phone, lockpicks, RFID cloner, fingerprint kit. m06 currently starts with the phone alone and places an `rfid_cloner` in the world (`m06 erb:1086-1094`), which the rule makes a duplicate.
2. Evidence as leverage carries forward naturally to a money trail: a ledger or a flagged-transactions report that makes a reluctant person open something.
3. If m06 issues a PIN cracker, it needs an in-story reason.

## 10. Needs user approval

None blocks the plan.

- **A1 (engine, minor).** `door_unlock_attempt` is emitted before the lock check (`unlock-system.js:110-118`), so a bark meant for a refusal also fires on success. Proposal: emit `door_unlock_failed` (or add a `success` field). If declined: barks stay neutrally worded (P1, P7).
- **E1 (logged).** One addition from m05: with no saved prints and only a generic collection event, no scenario can tell whether the player holds a print.
- **E8 (logged).** The `dr_chen` id is hard-coded in the engine (F13). **[impl-review]** m05 no longer uses that id (the id rename below), so it is detached from E8.
- **A4 from m04 (optional).** No fingerprint field guide.
- **[playtest] New engine item (server).** `find_accessible_item` (`app/controllers/break_escape/games_controller.rb:1543-1606`) matches an item on `id` OR `name`, and searches room containers before NPC `itemsHeld`. Two items with one name (an NPC's copy and a locked container's copy) make the NPC's give fail with "Container not unlocked". Proposal: match on id first, and fall back to the name only for items with no id. m05 works round it with a distinct name.
- **[r3] E11 (logged by the orchestrator).** An eventMapping's `sendTimedMessage.delay` counts from game start, not from the event (`npc-manager.js:710-718`, `:1121-1132`), so mapping delays are effectively immediate. m05 is designed to read correctly either way: everything that must not land mid-scene is keyed on a `conversation_closed` event.

## 11. Done when

**Build and static checks:**
- `./scripts/compile-ink.sh m05_insider_trading`: **10** compiled (with the new Patricia phone file), 0 failed. The 2 END warnings are the opening and debrief cutscenes.
- `ruby scripts/validate_scenario.rb scenarios/m05_insider_trading/scenario.json.erb`:
  - schema passes, 0 errors, 0 INVALID;
  - geometry and door alignment OK;
  - no "unsupported condition syntax" error (B1);
  - co-fire warnings as restated in §6, each listed with its reason.
- `python3 scripts/check_door_alignment.py …`: 9/9 OK.

**Rendered-JSON assertions** (`ruby tools/pass2/render.rb … m05.json`, then a short script):
- `startItemsInInventory` types are exactly `phone`, `lockpick`, `rfid_cloner`, `fingerprint_kit`. No PIN cracker. The phone's `npcIds` includes `patricia_phone` and not `recruiter`.
- No `lockpick` in any `itemsHeld` or `contents`.
- `rooms.data_center`: `locked`, `lockType: "biometric"`, `requires: "David Torres"`, a `door_sign`.
- Exactly one object with `fingerprintOwner: "David Torres"`, in `torres_office`, with no `text` and no `readable`.
- `owen_gallagher.rfidCard`: `card_id: "employee_badge"`, `name` with no parentheses. No item `cloned_employee_badge`.
- `server_password_note` is in `owen_gallagher.itemsHeld` and in no room's `objects`. The IT notice is in `server_hallway.objects` with a pinned `position`. `server_room` has a `door_sign`.
- Task `obtain_server_badge` is `enter_room`/`server_hallway`. `find_lockpick` is gone. `find_server_password.targetItemIds` includes the relay id.
- **[r3]** The Recruiter has exactly four mappings: `conversation_closed:patricia_morgan`, `conversation_closed:patricia_phone`, `conversation_closed:agent_0x99_handler` (each `onceOnly`, setting `recruiter_texted`) and `game_loaded` (not `onceOnly`). None has `conversationMode`, and there is **no** `room_entered:data_center` mapping on her.
- No mapping on `conversation_closed:patricia_morgan` other than the `patricia_phone_available` setter.
- Declared globals:
  - `server_door_seen`;
  - `patricia_authorised_server`;
  - `server_password_obtained`;
  - `vault_reader_seen`;
  - `patricia_phone_available`;
  - `found_stand_down_email`;
  - `privesc_guide_offered`;
  - `torres_print_collected` (if kept).

  No `lockpick_obtained`.
- **[r2]** No `||` and no `(` or `)` in any **eventMapping** `condition`. The check is scoped to eventMappings: credit conditions run through a full evaluator and legitimately use both (`erb:114`, `:133`).
- **[r2]** `patricia_phone` matches P11's JSON, and its one mapping sends the "This is my mobile" text.
- Name grep (ids, VAR names and `#speaker:` tags excluded): 0 hits for `Sarah`, `Chen`, `Kevin`, `- K"` across the rendered JSON, `mission.json` and all `.ink`.

**Ink runtime:**
- `inkcheck.js` at `start` on all ten compiled files: clean.
- `loopcheck.js` (no runtime errors; hubs "never ended"):
  - **Owen:**
    - `hub` with `server_badge_obtained=false`;
    - `owen_clone_debrief` with `server_badge_obtained` true and false;
    - `request_password` with `found_incident_log` false and `patricia_authorised_server` false (only "I'll be back" offered), with `found_incident_log=true`, and with `patricia_authorised_server=true`;
    - `hub` with `server_password_obtained=true`.
  - **Patricia (person):** `request_authorization` with `server_door_seen=true`; `share_findings` across each motive × exfil pair and `vault_reader_seen` both ways; `patricia_confession`.
  - **Patricia (phone) [r2]:**
    - `not_yet` with `patricia_phone_available=true` reaches `hub`;
    - `hub` with `patricia_ko=true` reaches `no_answer`;
    - `hub` with `torres_identified=true final_choice="turn_double_agent"` doesn't offer "He's in the data centre";
    - `start` with `patricia_phone_available=false` (reaches `not_yet`, writes no global);
    - `start` with `patricia_ko=true` (reaches `no_answer`);
    - `hub` with `torres_identified` false and true;
    - the naming knot across the same evidence pairs.
  - **HaX:** `support_hub` with `vault_reader_seen=true`, with `server_door_seen=true server_password_obtained=false`, with `privesc_guide_offered=true`; `on_owen_ko_relay`; `on_patricia_ko_relay`; `name_to_hax` with both halves and `vault_reader_seen=false`.
  - **Torres:** `confrontation_scene` with and without `patricia_ko`.
  - **Debrief:** 5 endings × `found_stand_down_email` true/false (10/10 reach a clean end).
  - **Opening:** `start`, confirming every path passes `cover_story`.

**Playtest** (separate Sonnet agent, `playtest-scenario`):
- (a) The start inventory shows the four items. The phone lists HaX and Patricia only.
- (b) Owen's clone. The minigame returns to `owen_clone_debrief` and shows the success line. The hallway opens on the saved card. `obtain_server_badge` ticks on entry. Cancel once to check the retry.
- (c) The server-room door: HaX's neutral bark and the door sign.
  - Owen refuses without the log.
  - With the log read, he gives the note and the vault line.
  - In a second run, use Patricia's authority instead.
- (d) Lift the mug print, then go to the vault. The door opens; the sign and the success alert name Torres. Separately, meet the vault without the print to check the refusal.
- (e) **Reload between dusting and the vault door.** The print is gone, the mug can be dusted again, and the door then opens.
- (f) **Mid-mission reload** (brief requirement): no intro replays; the cloner card survives. **[r2][r3]** Also reload after the Recruiter's text and before ringing back. On load the `game_loaded` backstop re-sends her text, and the ring-back plays the offer. If it doesn't arrive, record it; the fallback is `room_entered:data_center`.
- (g) Owen KO'd before the clone and the password. The relay gives the badge, office card and password, and HaX speaks the vault line.
- (h) Name Torres **by phone** from the server room. The phone offers the naming only after the first in-person meeting. **[r3]** The Recruiter's text arrives when the phone call closes, not during it; ring back and the offer plays. In person, it arrives when Patricia's conversation closes. (h2) Name him by phone while standing in the data centre, and record how his appearance reads. **[r2]** (h3) Open the phone **before** meeting Patricia (HaX's 3 s text makes this the normal case): she shows only "(Hang up.)" and leaves no unread badge. Meet her: the "This is my mobile" text arrives, and phoning her reaches the hub. (h4) KO Patricia after a call, then phone her again: only "(Ring her.)" → "It rings out.", with no unread badge from the preload.
- (i) Measure crossings and time from the last flag to the confrontation on the attentive route (§8).
- (j) Torres' "The vault logged me in twice tonight" line plays. The CEO credit line is right both ways, including the copy Patricia hands over.
- (k) Regression: the post-KO choice, the debrief and credits roll, and the Patricia-KO naming via HaX.

---

## Withdrawn and dropped

**Dropped in draft 1**
- **D1. A BLE or Bluetooth scanner as m05's new class.** Nobody in QDC has a reason to use either, and m06–m08 never use them.
- **D2. A PIN lock** (a briefcase combination set to a family date). The cracker-absence wall is m03's, and it would be a third hunt in act 2b.
- **D3. The vault enrolled to Dr Halloran, with her print in the lab.** It loses the story reason (Torres is the key custodian).
- **D4. Torres' print in the server room.** Same room as the vault door.
- **D5. Torres' print on his journal.** Needed text on a print surface (E1).
- **D6. Owen keeps handing over a pre-made clone.** It makes the player's cloner pointless (F4).
- **D7. A real whodunit among the eight.** A rewrite of acts 1–2, not a puzzle-chain change.
- **D8. The `dual-auth` minigame as a two-person vault rule.** It hard-codes sis01's names; reusing it needs an engine change.

**[new r1] Dropped in round 1**
- **P9. Neutral task titles before the naming.** Patricia's hub offers "I need into David Torres' office" from the first visit (`m05_npc_patricia_morgan.ink:222`), the vault refusal names him (P6), and the directory maps role to name (`erb:921`). Three titles would buy nothing.

**[new r1] Withdrawn after round 1**
- **W1. The incident-log seed for the vault** (draft 1 P6: "Key vault reader (fingerprint): cryptography lead, 23:52"). The CSO's own log would name the culprit's role, which contradicts "The badge is always one of eight" (`erb:1270`) and her own "access looks legitimate" (`m05_npc_patricia_morgan.ink:167`). The seed moves to Owen, because IT runs the readers.
- **W2. The rapport and `all_topics()` routes to the password** (draft 1 P5). The first meeting's natural path reaches influence 20 at once (`m05_npc_owen_gallagher.ink:50`, `:79`), so most players would get the note on the first ask. Replaced by evidence as leverage (orchestrator ruling).
- **W3. "The first lock in the campaign the whole kit can't touch"** (draft 1 §9). False: m01, m02 and m03 all have password or PIN locks. §9 now names the vault as m05's wall.
- **W4. The `vault_reader_seen`-gated Owen line** (draft 1 P6). It came after the cold encounter and so couldn't save the walk. Replaced by the line at the password handover (orchestrator ruling, M3a). The audit records the trade.
- **W5. Owen's narration "A sticky note curls off the edge of his monitor"** (draft 1 P5). A password you can see but not take fails Step 3d.
- **W6. The card name "Staff Badge (O. Gallagher)"** (draft 1 P4). The validator rejects parentheses in any mapping condition (`validate_scenario.rb:3097`).
- **W7. Draft 1's clone knot** ("The cloner buzzes once" before the tag; the debrief asserting "You read my badge"). It was wrong on a cancelled clone. Replaced by m04's shape, which branches on the synced global.
- **W8. The wall bark "Nothing in your bag opens what's in somebody's head"** (draft 1 P7). Wrong on the KO route, where the note drops. Now neutral.
- **W9. Naming in person only, with the Recruiter on `conversation_closed:patricia_morgan`** (draft 1). It cost act 3 a ~10-crossing round trip and, once a phone naming exists, a phone chat never emits that event (lesson 31). Replaced by P11.

**[new r2] Withdrawn after round 2**
- **W10. Draft 2's P11 gate in `start` only.** A reopened phone chat re-navigates to the saved choice's knot, not `start` (`phone-chat-minigame.js:532-566`), so a player who opened the phone before meeting Patricia would stay parked in `not_yet`, and `hub` would answer after a KO. Every resting knot now re-checks state.
- **W11. Draft 2's Owen refusal** ("I don't log auditors in on a whim"). It pointed nowhere. **And its leverage line** ("Your own logs show…"): the log is Patricia's (`erb:1270`, "-PM"), not IT's.
- **W12. The Recruiter as a single text-only mapping.** Lost on a reload before the ring-back. A backstop was added.
- **W13. Draft 2's P4 ordering risk and its §6 fallback** ("read the cloner's saved card instead"). The emit and `setGlobal` are synchronous and the resume comes ~1.65 s later, so the risk doesn't exist.
- **W14. Draft 2's "~16 crossings" for the attentive run.** Its own steps add up to 14.

**[new r3] Withdrawn after round 3**
- **W15. Draft 3's Recruiter design** (a text on `global_variable_changed:torres_identified`, and a `room_entered:data_center` backstop that wasn't `onceOnly`). The global fires mid-scene, and E11 makes the 8 s delay meaningless. The backstop re-sent the text on every entry until her chat opened. Replaced by the three `conversation_closed` mappings and the `game_loaded` backstop.
- **W16. Draft 3's claim that phone chats never emit `conversation_closed`** (F12, from lesson 31). Stale since `18237332` (`phone-chat-minigame.js:986-1007`, `:1192`).

**[new impl-review] Withdrawn after the implementation review**
- **W17. Draft 4's §6 claim that the Recruiter's post-confrontation branch handled "never talked terms".** That branch was reachable only through `return_contact`, which needs `recruiter_deal_offered`, and `start` checked only `torres_identified`. So a player who confronted Torres first heard the pre-confrontation pitch and could still take the deal. Fixed by the `final_choice` guard in `start` and `never_talked_terms`.

**[r1] Reviewer item not adopted**
- **`passwordHint`/`showHint` on the server-room lock.** The password case reads them from `lockable.passwordHint || lockable.scenarioData?.passwordHint` (`unlock-system.js:283-288`). A door sprite carries only `doorProperties` (lockType, requires, keyPins, difficulty, `door_sign`; `doors.js:503-525`), so a room-level hint never reaches the minigame. Used `door_sign` instead (P5).
- **Citation correction.** Patricia's confession is at `m05_npc_patricia_morgan.ink:169-170`, not `:160`.

---

*Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds.*
