# m05 Insider Trading — Pass 2 improvements

> Renamed 2026-10-01 (pass 3): Dr Sarah Chen → Dr Ruth Halloran (id dr_chen → dr_halloran; ink m05_npc_dr_chen → m05_npc_dr_halloran; globals/VARs chen_* → halloran_*; task talk_to_dr_chen → talk_to_dr_halloran). Kevin Park → Owen Gallagher (id kevin_park → owen_gallagher; ink m05_npc_kevin_park → m05_npc_owen_gallagher; globals/VARs kevin_* → owen_*; task talk_to_kevin → talk_to_owen; knot on_kevin_ko_relay → on_owen_ko_relay). This document predates the rename and is not rewritten.

> The m02-standard pass. Sources: `scenario.json.erb`, the nine `.ink` files,
> the engine (`public/`, `app/`), m02/m03/m04 as worked examples, the escalated
> universe bible, and the published SecGen XML. Nothing was committed.
> Everything is derived from the `.erb` and the engine, not the hand-written
> docs. (The ALIGNMENT_PLAN header says "IMPLEMENTED 2026-08-23"; several of
> those claims did not survive contact with the engine.)

## Review round 3 (browser playtest, games 1165-1167) — fixes, D1 re-verified live in 1169

All three playtest runs reached `status=completed`. The playtest passed: the
Recruiter is not preloaded, the evidence gates, the `||` splits, the post-KO
`disableClose`, the Patricia-KO contractor pass, re-talk, no debrief replay,
and canon. Four defects are fixed:

- **D1 (high): ten collect tasks never completed.** None of the
  `collect_items` tasks had a `targetCount`, and `objectives-manager.js:359/373`
  compares `currentCount >= undefined`, which is always false. Aims 1 and 2
  never finished; aims 3 and 4 opened only by auto-reveal. All ten now have
  `"targetCount": 1`.

  Items picked up before their aim opens still count, because every task is
  `active` from load (`handleItemPickup` checks only the task's status) and
  `reconcileWithGameState` recounts inventory on load.

  Checked live in game 1169 (`tools/playtest/m05-pass2-d1-session.jsonl`):
  - Patricia's visitor badge → `obtain_security_badge` 1/1, completed;
  - aim 1 completed → aim 2 active;
  - the sticky note (matched by `targetItemIds`) → `find_server_password`
    completed.
- **D2 (intermittent): the Recruiter's call skipped the offer.** In run 1,
  `conversation_closed:patricia_morgan` fired twice, so two jumps to her
  `start` knot happened. The second saw `recruiter_contacted_player` already
  set by the first and diverted to "Still deciding?", so no offer was ever made.
  Her routing now keys on `recruiter_deal_offered`:
  - `start` replays the intro (harmless) until the offer has been made;
  - `mid_mission_contact` diverts into the offer if it was never made;
  - the post-confrontation branch has its own "we never talked terms" line.

  An inkjs simulation of the failing state (contacted, not offered) reaches
  the offer from both `start` and `idle`. The double emit itself is logged as
  an engine item.
- **D3: stale Patricia references after a Patricia KO.** The case-ready text is
  now two mapping variants on `patricia_ko` ("call me and give me the name").
  Torres' opening line and HaX's general advice also branch on `patricia_ko`.
- **D4: the briefing task could be stranded.** `setGlobalOnStart` sets
  `briefing_played` the moment the cutscene opens, and emits no event
  (`npc-manager.js:1273-1277`). The task only completed on the last line, so an
  early close or a reload left it open for good. Now:
  - `receive_mission_briefing` is a `custom` task (the server no longer needs the
    NPC encountered);
  - it completes at the top of the briefing;
  - backstops complete it on `conversation_closed:opening_briefing` and on
    `room_entered:reception_lobby` once `briefing_played` is true.

  In game 1169 the harness closed the opening early and the task was completed.

Verification after round 3:
- validator: 0 errors, the same 7 intended warnings;
- compile: 9/9;
- inkcheck clean on the changed files (recruiter, Torres, opening);
- loopcheck clean on 7 new states: the recruiter in contacted-but-not-offered
  and post-confrontation states, Torres and HaX with Patricia KO'd;
- no `||` or `(` in any eventMapping condition;
- `door_align` 9/9.

## Review round 2 (adversarial reviewer + orchestrator) — fixes and corrections

An adversarial review found two blockers, seven majors and a list of minors,
and showed several round-1 claims wrong. All are fixed mission-locally and
re-verified with the tools (see Verification). The wrong claims are corrected
here and in the round-1 sections below.

### Blockers
- **B1: Escape before the post-KO choice stranded the ending.** The
  `npc_ko:david_torres` → `post_ko_choice` scene had no `disableClose`. Closing it
  left `final_choice` empty for good: a KO'd NPC can't be talked to
  (`interactions.js:1690`) and `npc_ko` doesn't re-fire, even after a reload.
  Fixed with `"disableClose": true`, plus a safety net: re-entering the data
  centre while `torres_ko` is true and no fate is set opens HaX's
  `post_ko_safety_net` phone knot with the same two choices. It sets
  `torres_fate_by_phone`, which fires the debrief (a phone chat closing emits
  nothing).
- **B2: the Recruiter's first call played before Torres was named.** The phone
  preloads the start knot of every contact in `startItemsInInventory.npcIds`
  the first time it opens (`phone-chat-minigame.js:283-380`). Her start knot
  named "David Torres" and set `recruiter_contacted_player`, which reached the
  real global through the variable observer. The real call then never came, and
  Torres, HaX and the debrief all behaved as if it had. Fixed three ways:
  - she is no longer in `npcIds` (her contact appears once a mapping gives her
    history, `phone-chat-ui.js:373-384`);
  - her `start` knot diverts to a resting `not_yet` knot until
    `torres_identified` is true;
  - the debrief keys the deal on `recruiter_deal_offered`.

### Majors
- **M1: every `||` or parenthesised eventMapping condition was dead.**
  `safeEvaluateCondition` (`npc-manager.js:14-101`) splits on `&&` only. Any
  `||` or `(` term fails and returns false. That killed:
  - both keycard pickup mappings, so `server_badge_obtained` and
    `office_card_obtained` were never set;
  - all six "you've got both halves" nudges;
  - the lockpicking-guide offer;
  - HaX's "finish the flags" nag.

  Each alternative is now its own mapping using `&&` only. Case readiness
  latches `case_motive` / `case_exfil` per item, and two mappings fire the nudge
  when the second half lands. The nag is four mappings
  (`flagN_submitted !== true`), guarded by `flags_nag_sent`. Mappings are
  separate listeners and `setGlobal` runs synchronously
  (`npc-manager.js:541-553`), so the guard stops repeats. A grep of the rendered
  JSON finds no `||` or `(` left in any eventMapping condition. Credits
  conditions go through a full JS evaluator (`scenario-music-events.js:34-48`),
  so they keep `||`.
- **M2: canon — SAFETYNET has no arrest powers.** Round 1 swapped US state-power
  framing for UK state-power framing ("arrested under the National Security
  Act", "solicitor", "sentence"). The bible says SAFETYNET has no jurisdiction,
  no legal cover and no arbitration (`02_organisations/safetynet/overview.md:41-47`),
  and commit 94df1678 stripped this framing across the campaign. Now:
  - the player detains Torres and hands him to Patricia, who calls the police;
  - SAFETYNET's evidence reaches the police anonymously;
  - "cooperation" is a private deal: SAFETYNET pays for Elena's treatment in
    exchange for a debrief before the police arrive, and sentencing is
    explicitly out of its hands;
  - the turned family can be moved "somewhere quiet", which is canon (a car, a
    flight, a new name).

  The Home Office contractor, the 999 target and Patricia's NCA past stay,
  because they describe the world, not SAFETYNET's authority. Changed in the
  opening, Torres, the debrief, HaX, Patricia and the credits.
- **M3: the Patricia-KO fallback couldn't complete its task.**
  `obtain_security_badge` is a collect task, and the server rejects completion
  without the item (`game.rb:1179-1210`). `npc_ko:patricia_morgan` now opens
  HaX's `on_patricia_ko_relay`, which gives a real `id_badge` (contractor pass)
  and sets `patricia_authorised_office`. Kevin has a matching line for when
  Patricia is down.
- **M4: aims revealed out of order (lesson 27).** The sticky note, the leaflet
  and the vetting file are all first-ring finds, but they sat in aims 3 and 4,
  so picking them up in minute two auto-revealed late aims. All three moved to
  aim 2. "Find Out Why" and "Prove the Exfiltration" now both open from aim 2
  and run in parallel, because nothing in the rooms orders them. The conclusion
  aim unlocks on both (`aimsCompleted`).
- **M5: the lethal ending couldn't be foreseen.** The scene said "breathing, a
  cut above his eye" and the choice said "he's not your problem", yet the
  outcome was death. Now:
  - the narration shows he isn't getting up: ragged breathing, blood pooling
    under his head;
  - the choice reads "Leave him bleeding on the floor";
  - the stay option describes the recovery position and pressure on the wound.
- **M6: the forty-seven names didn't exist in the world.** Added a real
  artefact: a sealed TalentStack envelope under the data-centre keyboard, with
  the 47-row candidate list and the Recruiter's note to Torres as courier
  (`found_pipeline_list`). The Recruiter's deal is now "leave the envelope out
  of your report". The debrief and credits branch on whether the player found
  it.
- **M7: continuity — "Agent HaX".** m02, m03, m04 and m06 display "Agent HaX".
  All display names, speaker lines and task titles now use it; the NPC ids
  (`agent_0x99_handler`, `#speaker:agent_0x99`) are unchanged. m06's briefing
  says the m05 job was worth "$847,000 in cryptocurrency". m05 now establishes
  that figure as the Architect's acquisition budget released to the Initiative
  through the TalentStack wallet (upload schedule, debrief). The money moved
  even though the final upload was stopped. See the approval log for what m06
  should align to.

### Minors
- **Patricia.** The naming line no longer claims the data-centre paper names
  Torres; the manifest and schedule now carry "Staged by / Operator on site:
  D. Torres", and the portal manifest line fires only on flag 3. Her "badge went
  in twenty minutes ago" line is now present tense ("has just gone through the
  server hallway"), so it's true even if the player was just in there.
- **HaX's file had the full dialogue pass:**
  - no "not X, it's Y" constructions and no em dashes;
  - no flat `[Understood]` / `[Noted]` / `[Received]` labels;
  - Patricia is no longer called "your handler on the ground".
- The opening and debrief lost their remaining "isn't X, it's Y" lines. The
  unhandled `#start_gameplay` tag is gone (no engine handler; m02 carries it as
  a no-op). The stale "Linear phone cutscene" comment is fixed.
- Lisa's first choice now matches her spoken line. mission.json has no US
  spellings left.
- **Walkthrough.** Step 3 now routes from Patricia's office back through
  reception.
- **`debrief_played`** is set at the top of the debrief, and every debrief
  trigger requires it false, so a reload can't replay the debrief.
- **Placement (lesson 28).** The render shows the Bludit terminal (server room)
  and the upload terminal (data centre) have no template slot, so both are now
  pinned clear of the doors. Torres moved from (5,6), just under the rack row,
  to (5,7), beside the pinned terminal on the clear aisle.
- **Patricia and her own cabinet (lesson 12).** Patricia has no
  `lockpick_used_in_view` mapping, so no line-of-sight check runs in her office
  (`npc-manager.js:258-268`). Picking her cabinet in front of her has no
  consequence. Adding one wasn't done, because the lockpick LoS can't locate
  NPCs in later-loaded rooms (m03 approval item 6 D3).

### Round-1 claims corrected
- **Headline 1, "a doorway opened onto a wall".** This was not observed, and
  `door_align.py` could not check it: it reported the three-room north
  connection as UNMODELLED and the other three pairs as OK. The actual risk came
  from the arithmetic of `positionNorthMultiple` (`rooms.js:1253-1300`) with
  three 10-wide rooms over a 10-wide corridor:
  - the first-overlap shift puts the group at x-5;
  - the last-overlap shift then pulls it to x-25;
  - so two of the three rooms land wholly west of the corridor, with no shared
    wall for their south doors to meet.

  That is a derivation from source, not a live observation. The rebuild removes
  the multi-connection, so every pair is now modelled (9/9 OK).
- **Bug 3, "evaluated in JS on agent_0x99_handler mappings".** Wrong: mapping
  conditions are `&&`-only (M1). They now latch `case_motive` / `case_exfil`.
- **Bug 8, "would crash the Recruiter's call".** Wrong: `player_name` is one of
  the six externals the engine binds, so `EXTERNAL player_name()` would have
  worked. Replacing it with the synced `VAR` is harmless tidying, not a crash
  fix.
- **Bug 10, the "HaX points the player at the data centre on
  `conversation_closed:recruiter`" mapping.** It never existed in the shipped
  file: phone chats don't emit `conversation_closed`, so it was removed before
  round 1 ended. Patricia (and HaX on the KO route) now tell the player where
  Torres is when they name him.
- **Bug 4, "the aim ladder still gates progress".** Wrong: aims are a to-do list.
  Doors, items and `concludeRequires` gate progress (see M4).

---

## Headline (round 1, corrected)

m05 validated with warnings, but three faults would have been player-visible:

1. **A three-room multi-connection off the corridor** that the engine's
   placement arithmetic can't lay out against a 10-wide corridor (see the
   correction above). Rebuilt as single connections.
2. **The case could never be counted.** Identification, the credits and the
   debrief keyed off `evidence_level` / `lore_collected`, incremented with
   `setVariable: { "evidence_level": "evidence_level + 1" }`. The engine assigns
   `setVariable` values literally (`interactions.js:1437`,
   `npc-game-bridge.js:30`), so the counter became a string and every
   `evidence_level >= 4` gate was dead.
3. **The credits could never roll.** The debrief was a phone NPC, and only
   person-chat emits `conversation_closed` (`person-chat-minigame.js:1566`).

## Bugs and soft-locks (fixed)

1. **Layout** rebuilt with single E/W and equal-width N/S connections;
   `door_align.py` 9/9 aligned.
2. **Flag tasks** retargeted from the dead reference form to
   `flag_station_evidence:qdc_research_server-flag1..4` (`games_controller.rb:2155-2187`).
   `concludeRequires` is those four tasks, so this was the ending blocker.
3. **Evidence counter** replaced with `found_*` booleans. The ink side uses
   `has_motive()` / `has_exfil()`; the mapping side latches `case_motive` /
   `case_exfil` (round-2 correction).
4. **Locked tasks never ticked.** `unlockAim` activates only an aim's first task
   (`objectives-manager.js:651-660`), and pickups ignore non-active tasks (:324).
   All tasks are now `active` (the m02 pattern).
5. **The debrief is a hidden person NPC** (the m02/m04 pattern), so the credits
   roll.
6. **Notes evidence matched by type** (every note is type `notes`) → switched to
   `targetItemIds`.
7. **Three `#give_item` selectors had no itemsHeld match** (validator INVALID) →
   the m02 `#give_item:<type>:<id>` form.
8. **`EXTERNAL player_name()`** replaced with the synced VAR. This was tidying:
   `player_name` is bound (round-2 correction).
9. **KO relays.** Kevin's cards can't drop from a later-loaded room (`npc._sprite`
   gap), so HaX relays copies. Patricia's KO gives a real contractor pass and the
   office authority (round-2 M3).
10. **Conversation staging (lesson 20).**
    - The Recruiter now calls on `conversation_closed:patricia_morgan`, not in the
      middle of Patricia's scene.
    - On the HaX route (Patricia KO'd) she leaves a text instead of forcing a
      call over HaX's.
    - The debrief waits for `conversation_closed:david_torres`.
    - HaX's opening bark waits for the briefing to close.
11. **Re-talk** follows the m02 never-DONE rule (lesson 21). The opening and
    debrief cutscenes keep `-> END`.
12. **Debrief before the ending gate.** The debrief also requires all four
    flags. Otherwise HaX sends the player back, and the last flag fires it.

## Puzzle chain

- A clean spine with no key-before-lock (`room_depth.py`):
  - visitor badge → interviews → server badge (Kevin, or Chen as the optional
    route) → server hallway → the password on Kevin's desk → server room →
    Bludit → four flags → data centre;
  - office card (Kevin, on Patricia's authority) → Torres' office → journal and
    the pickable briefcase.
- The two badge routes set the same state (lesson 8).
- The lockpick has a real target (the briefcase), and the motive has three
  sources.
- Encodings live where their author put them: the base64 payloads are on the
  attacker-staged SecGen box.

## Choices that matter

- **Five authored endings:**
  - turn;
  - hold for the police, with or without the treatment deal;
  - public exposure;
  - fight, then a post-KO choice to stay with him or leave him bleeding.
- **The Recruiter's offer** is tied to a real artefact (the envelope). The
  debrief catches the call in the phone logs and offers a confession (−10 trust)
  or a lie (−25). The credits show refused (with or without the list), taken,
  or taken-then-confessed.
- **`confront_stance`** pays back in the debrief's final reflection.

## Dialogue pass

- **UK setting.** A Home Office contractor near Cambridge. SAFETYNET with no
  state power (round-2 M2). UK spelling throughout.
- **Elena's invoice** stays in dollars because it's from a US clinic.
- **Chen's Heisenberg brief** matches the 999 dispatch stakes.
- **Craft:**
  - no standalone emotes;
  - first-person choices;
  - "Agent HaX" throughout;
  - HaX's file had a full pass (round-2 minors).

## Continuity (m04 → m05 → m06)

- m04's debrief ("Task Force Null", Critical Mass and the grid) isn't
  contradicted.
- Netherton and Nightshade are seeded as trusted colleagues, with no hint of the
  m08 betrayal.
- m05's debrief ends on "we follow the money". It now names the $847,000
  acquisition budget paid to the Initiative through TalentStack, which matches
  m06's figure.

## Verification (round 2, actual results)

- `validate_scenario.rb` → schema passes, geometry OK, **0 errors**. Remaining
  warnings:
  - 1 side-task suggestion (`identify_torres` has a HaX route the validator
    can't see);
  - 6 parallel-onceOnly groups on HaX, all intended. Each group is either
    disjoint by `data.itemId`, `data.connectedRoom` or `data.objectName`, or is
    a deliberate pair (the flag-3 bark plus the `case_exfil` latch), or is
    guarded by a synchronously-set global (the lockpicking guide, the flag nag).
- `compile-ink.sh m05_insider_trading` → **9 compiled, 0 failed**.
- `inkcheck.js` → **15/15 clean**: all nine files at `start`, plus Torres
  `post_ko_choice` / `after_choice`, recruiter `not_yet`, and HaX
  `on_patricia_ko_relay` / `on_kevin_ko_relay` / `post_ko_safety_net`.
- `loopcheck.js` → **20/20 clean**:
  - 10 hub and re-entry states (recruiter after naming, with and without the
    envelope; HaX hub, the KO and safety-net states; Kevin with Patricia KO'd;
    Patricia with the case ready; Torres re-entry), all "never ended";
  - the debrief across all 5 endings × 2 deal states, 10/10 reaching a clean
    end.
- `door_align.py` 9/9, and `room_depth.py` linear with no key-before-lock.
- The rendered JSON has no `||` or `(` in any eventMapping condition.

### Not verified (needs a browser playtest / SecGen build)
- The live flag round-trip, and the SecGen flag order on `qdc_research_server`.
- The fight → KO → `post_ko_choice` path through real combat, and whether
  `disableClose` holds on an event-opened person-chat.
- The Patricia → Recruiter → Torres staging under live timing.
- The post-KO safety net firing on `room_entered:data_center` after a reload.

## Capability arc

**m05 grants:** hunting one trusted insider rather than fighting through a
crowd. The player:
- reads behaviour against a story;
- correlates motive (debt, a journal, a stalled vetting file) with digital proof
  (leaked credentials → authenticated upload RCE → user → root on a CMS box);
- carries a choice whose weight lands after the confrontation, with no badge and
  no legal cover to hide behind.

**What m06 should make the player feel the absence of:** the person. m05 is one
man at a terminal. m06 follows the $847,000 into a network with no face on it.
