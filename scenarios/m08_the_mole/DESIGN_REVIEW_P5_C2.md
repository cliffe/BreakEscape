> **Rename (2026-10-16):** Agent 0x23 'Cipher' is now 'Vector' (user's decision). Ids, globals, the ink file and routes were renamed with him (`agent_vector`, `accused_vector`, `vector_*`, `m08_suspect_vector.ink`). This file predates the rename and still says Cipher.

# m08 The Mole: scenario design review, pass 5, cycle 2

Reviewer: fresh Opus agent, read-only (2026-10-14). Skill: `scenario-design-review`. Static review only. A Sonnet browser check ran at the same time, and I started no browser session.

Sources: `scenario.json.erb` and the twelve `.ink` files at HEAD 8c7ece8e (the m08 folder was clean in the working tree), the engine files cited below, `DESIGN_REVIEW_P5_C1.md` and the scenario-design round-1 section of `IMPROVEMENT_LOOP_LOG.md`. I opened no SecGen XML and none of the four restricted field guides. Settled decisions are not reopened: Option B, the tip-off as the cost, free retries on HaX's reading, and the round-1 fixer's choices (the step-4 skip for two unavailable witnesses, B excluding a hostile Director, Phantom's challenge undrawn).

Scratch outputs: session scratchpad, `m08-design-reviewer-c2/` (validator, rendered JSON, condition audit, flag-4 table check, 20 route outputs, probes p1 and p2).

## Verdict

Round 1's fixes are all in place, and every one checks out against the erb and the ink. The hostile machinery holds: no path turns an NPC hostile without its latch firing (details below). The hostile-Director route reaches the ending, and the flag-4 and all-flags tables are disjoint and complete. All 250 conditions are `&&`-only, use single-level `data.<name>` and name only declared globals. All twenty routes pass.

Three new minors, all in the same family as round 1's D1:
- A suspect who has been punched and left standing never counts as seen.
- Nightshade can give the wrong reason for his tidy.
- Punched suspects go unmentioned in the debrief and credits.

None of them strands the mission.

**Counts: 0 blockers, 0 majors, 3 minors.** Scenario design can close once the concurrent browser check confirms round 1's owed items. The three minors can go in a closing fix round, or be carried into the dialogue stage (N2 and N3 are mostly ink).

## Step 1: the tools

- **Validator** (full, `--no-graph`): exit 0. Schema passed, no unknown fields, all ink valid. The known warnings, unchanged: 17 `npc_hostile_state_changed` mappings on HaX that can co-fire (intended two-part pairs, disjoint by `data.npcId`), the four `brief_taken` co-fires on `closing_debrief`, the confrontation not being `onceOnly`, and two person-chats with no `background` (Phantom's sighting and the off-duty catch, both waiting on stage 4). Suggestions: the safe's evaluation has no `puzzle_graph_unlocks` (a clue, fine). The analyst and ATHENA share a sheet (stage 5). The six credits-fallback suggestions are false positives (C1, 2i). The rest are generic.
- **dialoguelint**: 0 errors, 0 warnings, 8 blank-reentry CHECKs (unchanged, dialogue stage). Timed texts: 37, median 27 words, maximum 30.
- **reopencheck** (m08 phone hub): 1800 reopens, 0 problems.
- **Route driver**: r1 to r20 all print `[result] all expectations met`, exit 0.
- **Condition audit** over the rendered JSON: 250 conditions, no `||`, no parentheses, no nested `data.`, and every `globalVars.*`, `setGlobal`, `globalVarOnKO`, `requireGlobal`, `skipIfGlobal` and ink `#set_global` name is declared.
- **Flag-4 and all-flags tables**: I enumerated all 64 combinations of `named_on_evidence`, `mole_identified`, `audit_closed`, `netherton_ko`, `netherton_hostile` and `found_badge_audit`, keeping only reachable states (a name on evidence implies `mole_identified`, and a KO implies hostility). Exactly one of the eight flag-4 mappings fires in every state, and exactly one of the five all-flags texts.
- **Probes**: p1 (Cipher punched before his interview) records N1, and its expectations pass on the current files. p2 (the Director's tip-off, then the analyst knocked out after the naming) fails on the reason Nightshade gives: N2.

## The hostile machinery (asked for specifically)

**Can an NPC turn hostile without the latch mapping firing?** No path in the scenario does it.
- The engine announces hostility in exactly two places:
  - `setNPCHostile` (`npc-hostile.js:111-145`), which emits with no `restored`. Its callers are a punch (`player-combat.js:329-331`), the `#hostile` tag, influence and the test bridge.
  - `announceRestoredHostile` (`npc-hostile.js:103-108`), which emits `restored: true` after a reload.
- The latch is a `setGlobal`, applied the moment its handler runs (`npc-manager.js:703-714`).
- The latched global, the hostility record and the fired-onceOnly record are all saved in the same state-sync snapshot (`state-sync.js:76-100`, on a 30 s timer and on page hide). A reload that restores a hostile NPC therefore restores its `<npc>_hostile` too, so the `restored !== true` guard loses nothing.
- m08 has no `#hostile` tags, and influence can't come near the -50 threshold (Phantom's is the only influence counter, and it only moves by small steps).
- A one-punch KO still sends the hostile event first (`player-combat.js:331` before `applyDamage`), so a KO'd Director is also `netherton_hostile`. The ink reads `netherton_ko or netherton_hostile`, and every hostile-only mapping excludes `netherton_ko`.

Two notes, not findings:
- A game saved before 8c7ece8e that already had a punched NPC restores with no latch, and its fired-onceOnly records point at the old handler indices. The browser check should start a new game, which the playtest scripts do anyway.
- `npc-lazy-loader.js:99-106` restores a KO from room state, which syncs at once, while globals sync on the 30 s timer or page hide. Only a browser crash between a KO and the next sync could split them. That is an engine edge and nothing new.

**The hostile-Director route to the naming.** It works from every state:
- Punched before the brief: `brief_taken` is set and the brief task completes (erb 916-917). The printer branch shows (phone 189-190), and the ladder sends the player to the audit and the clock (phone 107-114). HaX's reading is open on the door plus a clock (phone 90). C' sends the right flag-4 text (erb 770-775), and the debrief and credits have hostile lines (debrief 60-61, 119; erb 200, 228).
- After three misreads before flag 4: B is excluded (erb 761), so C' sends the player to HaX, whose reading is free to retry.
- With the Director hostile, the suite code comes from the safe in his office, with him in it. NPCs don't attack while a minigame is open (`npc-combat.js:48-50`), so the keypad can be used.

**The KO tip-off ordering.** The first tip-off wins, as designed: every setter is gated `nightshade_tipped_off !== true` (erb 1044-1092). But the confrontation picks its reason by a fixed priority over KO globals that can be set at any time, so it can name the wrong cause. See N2.

**Phantom's sight challenge.**
- The config is right (erb 1576-1588): `requireGlobal: brief_taken`, and it skips on interviewed, KO'd or hostile. `skipIfGlobal` takes a list (`npc-sight-challenge.js:68-72`).
- The mapping (erb 1601-1607) opens `start`. Phantom's `start` has a return-visit guard, and an interview before the brief sets `phantom_interviewed`, which skips the challenge.
- The onceOnly person-chat is saved only when it closes (`npc-manager.js:686-698`), so a reload mid-chat lets the next sighting fire it again.
- His room is 10x6 tiles and he stands at (5.0, 4.3), about two tiles from the south door, well inside 150 px. Whether he faces the door is for the browser check.
- It can't become an oracle: the innocent Phantom challenges, the mole doesn't.

## Severity table

| # | Sev. | Finding | Evidence (file:line) | Fix |
|---|---|---|---|---|
| N1 | minor | **A suspect punched and left standing never counts as seen.** Round 1 latched `cipher_hostile`, `phantom_hostile` and `nightshade_hostile`, but only step 4 reads them. The seen latches, the interview tasks and the Director's access check still need `_interviewed` or `_ko`. Punch Cipher before talking to him and leave him up (p1), and four things happen. "Interview Agent Cipher on the operations floor", a required task, stays open for good: the player can't talk to him, and only a KO completes it. The all-three access nudge never fires. At "[I'll need access.]" the Director says "You have not seen Cipher. Operations floor.", which sends the player back to a man who swings at them, and the clone stays shut. HaX's server-room topic says "See all three suspects, then clone the Director's card." The printer route still works, so the mission can be finished. The task list and the Director both point at something the player can't do. | erb 1022-1036 (seen latches: `_interviewed`, `_ko`); erb 1192-1227, 1475-1481, 1617-1623, 1830-1836 (interview completions: interviewed or KO only); Netherton ink 174-185, 434-435 (`interviews_done()`); phone ink 191-196 | Treat hostile like a KO, as round 1 did for step 4. (a) Add `"#{n}_hostile"` to the `%w[_interviewed _ko]` list that feeds `<n>_seen` (erb 1023). (b) Add a brief-gated pair on `<n>_hostile` to the interview completions on `closing_debrief`, as for `<n>_ko` (erb 1192-1227). (c) In Netherton's ink, declare `phantom_hostile` and read `(x_interviewed or x_ko or x_hostile)` in `interviews_done()` and in the three `access_request` lines. HaX's topic reads `_seen`, so it follows on its own. Add a route step: punch Cipher before his interview, interview the other two, then check the nudge, the clone offer and the task. |
| N2 | minor | **Nightshade can give the wrong reason for his tidy.** The tip-off goes to whichever source comes first, but the confrontation picks its reason by a fixed order: accusation, seen pick, off-duty KO, analyst KO, ATHENA KO, then the Director. The KO globals are set whenever the KO happens (`globalVarOnKO`), including after the tip-off and after the naming. In p2, three misreads before flag 4 make the Director tip him off, flag 4 names him, and the analyst is knocked out on the way to the suite. Nightshade then says "You knocked a junior analyst out at her desk, in front of the whole floor. So I tidied." The same happens with a KO of the off-duty agent or ATHENA after the naming (the off-duty case dates from puzzle chains C2), and with a KO tip-off followed by an accusation: "You said it to my face… So I tidied. The bag, the stick." | confrontation ink 83-108; erb 630, 1507 and the off-duty `globalVarOnKO` (set at any time); tip-off setters erb 1044-1092 and Netherton ink 350, 381 | Record the cause when the tip-off happens. Declare `tipoff_source: ""`. Add `"tipoff_source": "accused" / "locker" / "offduty" / "analyst" / "athena"` to the `setGlobal` of each tip-off mapping (erb 1049, 1060, 1072, 1083, 1090). These only fire when nobody has tipped him off yet, so exactly one value is ever written. In Netherton's `audit_wrong` before-the-box branch, add `~ tipoff_source = "director"` and `#set_global:tipoff_source:director`. In the confrontation, key the `nightshade_tidied` branches on `tipoff_source` (keep the two-innocents wording under "accused"). The untidied `accused_nightshade` line (88) stays as it is. Update r11, r14, r15, r19 and r20, and add p2 as a route. |
| N3 | minor | **A punched-but-standing suspect goes unremarked.** The Director has a debrief opener and a credit for being struck and left standing (round 1). Cipher, Phantom and Nightshade get nothing. The credits print "CIPHER: Cleared on the evidence. His post-quantum work goes on." for a Cipher the player punched in front of the ops floor, while a knocked-out Cipher gets "Knocked out. Innocent." It's an omission, not a contradiction, so it's polish. | erb 186-193 (THE SUSPECTS); debrief ink 92-103; confrontation ink 72-74 | Optional. In the credits, put `&& !globalVars.cipher_hostile` on the two "Cleared" lines for Cipher and Phantom, and add e.g. "CIPHER: Struck on the ops floor, then cleared by the logs." on `cipher_hostile && !cipher_ko` (the same for Phantom). The accusation and hostile lines can both print. One confrontation line for a hostile, not-KO'd Nightshade: "You swung at me in my own lab. I've had worse from people I liked less." can follow the KO line's shape. Reads only latched globals. |

Nits, no finding: the analyst's `_comment` still says "Carries no globals" (erb 1487), but she now sets `analyst_ko`.

## Confirmation of round 1

| # | Round-1 finding | Confirmed at | Status |
|---|---|---|---|
| D1 | Hostile Director strands the naming | Latch with `brief_taken` and the brief task, erb 916-917. Second text split on `mole_identified`, 921-933. Ladder rungs, `[I can name the leak.]`, K5 exclusion and the server-room hostile branch, phone 90, 107-114, 130, 189-190. Flag-4 C' and B/D exclusions, erb 761-778 (table checked). Audit-arrived twin, 809-814. All-flags split, 840-855. Nudge exclusion, 1032. Debrief 60-61 and 119; credits 200 and 228. Step-4 edge, Netherton 247 and phone 120. r16, r17 | Fixed |
| m1 | No sight challenge | erb 1576-1588 (los and challengeOnSight), 1601-1607 (onceOnly person-chat to `start`). r18 | Fixed (facing to confirm on screen) |
| m2 | Archive task ticks on entry | erb 581-591 (on `found_badge_audit`, both brief-gated), title 373. No `archives_entered` reader or setter left (only the comment at 1121) | Fixed |
| m3 | Action track in an empty suite | erb 162 (`&& mole_identified === true`). r19 | Fixed |
| m4 | "It's really Nightshade" stale | phone 95 | Fixed |
| m5 | Short brief names no rooms | erb 1095-1100 | Fixed (does not cover a Director punched before the brief: no conversation closes. The task titles carry the rooms, so I'm not raising it) |
| m6 | Analyst and ATHENA KOs silent | `globalVarOnKO` erb 1507 and 630, declared 2419-2420. HaX tip-offs 1079-1092. Credits 233-234. Debrief 98-103. Confrontation 102-105 (ordering: N2) | Fixed |
| m7 | Hostile watcher still catches | erb 2057. A failed condition lets the pick go ahead (`npc-manager.js:343`) | Fixed |
| m8 | Naming task names the Director | erb 388 | Fixed |
| m9 | Aim title | erb 432 | Fixed |
| m10 | Dead `else` in `the_hunt` | debrief 129-133 (comment only) | Fixed |
| m11 | "Bring me the logs." | Netherton 154 | Fixed |
| m12 | Hub order | phone 90-204: the reading, Nightshade, "Why isn't he…", the ladder, K5, the suite, the door logs, the VM steps, the server room, the guides, the exit | Fixed |
| E7 | Notes from containers | Carried to the browser check (`DECISIONS_PENDING.md`) | Open with the browser check |

## Design checks, briefly (what changed since C1)

- **2a Solvability**: OK. Every naming route, including both hostile-Director cases, reaches `mole_identified`. The confrontation waits only on `all_flags_submitted && mole_identified` (erb 1909-1915), and the conclusion on the four flags (`game.rb:1944-1969`). An open interview task (N1) costs score and doesn't block the ending.
- **2d Narrative**: OK. The hostile Director has a debrief opener and a `named_by_hax` variant. Nightshade's reason line is N2.
- **2g Scaffolding**: unchanged from C1, except a Work The Three Suspects that can't close after a punch (N1).
- **2h KO and hostility**: the Director, the witnesses, Phantom and the off-duty agent are all handled. Suspects punched and left standing have the gaps in N1 and N3. Of the person-chat mappings on NPCs a player can punch, Phantom's sighting and the off-duty catch both exclude the hostile state now. The confrontation can't be punched before its scene opens.
- **2i Struggling player**, in the order they'd meet things:
  1. Punches a suspect who stonewalls, leaves him up, then gets sent back to him by the Director and the task list (N1).
  2. Knocks someone over late in the mission and hears Nightshade blame that for a tidy that happened hours earlier (N2).

  Everything else C1 listed is fixed.

## Notes for the browser check (not findings)

- **Phantom's facing.** Confirm he spots the player coming in from the south door after the brief, once, and not before the brief.
- **Narrow edge: Nightshade appears with no scene.** Possible only with the Director unavailable and all four flags in, while the player is already standing in the suite (opened from the safe) and reads the audit to HaX by phone. Nightshade then appears at the table with no scene, because `room_entered` doesn't fire again. Clicking him opens the confrontation at `start` without `disableClose`, and HaX's "You walked out on him" text covers a close. If the browser check sees it, re-entering the room is the fix the player already has.
- **New game.** Use a new game, not one saved before 8c7ece8e (see the hostile machinery).

## Items for the user

Nothing new. U1 (the in-game VM claims, needs checking against SecGen by the user) and the engine items E1-E10 are unchanged from C1.
