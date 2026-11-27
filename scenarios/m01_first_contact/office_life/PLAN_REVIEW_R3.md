# m01 office-life plan review, round 3

Counts: B 0, M 1, m 4

Verdict: tiers 1 and 2 can be built as written. Step 5 (Maya's routine, 4.9) should not be built until M1 is fixed: once she has walked, her Derek topics can play in the open office beside the two extras, a few metres from Derek's door. The briefing itself warns that "Derek might be watching who she talks to".

Reviewed: PLAN.md, PLAN_REVIEW_R1.md and PLAN_REVIEW_R2.md (Outcomes), SPOKEN_LINES.md, ink/m01_npc_maya.ink, scenario.json.erb, room_office.json and the engine under `public/break_escape/js/` in worktree p-ol-m01 at 27011c8c3. Settled R1 and R2 points are not raised again.

## R2 fixes verified

- Seat spawns. Chair 158 (`chair-white-2-rotate6`) is anchored at (0.87, 5.41) and chair 157 (`chair-white-2-rotate3`) at (6.81, 5.39), both 32x32 (room_office.json items layer). Their centres are (1.37, 4.91) and (7.31, 4.89), which match PLAN.md:98 and :123. The foot point is the chair's bottom centre (seating.js:263-266), 16 px below each spawn, inside the 40 px seated search. Step 0's `seated` is read by `updateSeatedNPC` only while the NPC has no needs state (seating.js:1970-1972), so dropping it in step 2 is correct.
- `useFrom`. The approach is `findNearestWalkableWorldCell(centre + useFrom x 32, radius 1)` (npc-needs.js:5427-5430) on an 8 px grid (constants.js:37). room_office.json has no `deskBoxes` property, so desks use the legacy box: the bottom quarter, inset 10 px (desk-footprints.js, `legacyTableBox`). Fatima's target (43.8, 157.1) px sits in desk 92's padded box, but the cell below it, about (1.38, 5.13), lies in the 33 px corridor between desks 92 and 91 and is walkable. A radius-1 search finds it. Graham's target is similar. The plan's numbers hold, and the 12 px render check (PLAN.md:87) is the right final test.
- Cooler stand point (5.78, 7.93): correct from the 24x47 sprite centre (PLAN.md:212-213). Facing and the aisle are accepted compromises with a render check (PLAN.md:215, test 11).
- `ex_*` knots and `heard_ex_*` globals: consistent at PLAN.md:36, :226-231 and SPOKEN_LINES.md. The `requireGlobal: null` is gone.
- Fallback spare `pc`: has a name and plain observations (PLAN.md:85).

## R2 "not checked" items, now checked

- `needsCompany` groups. Group names are free-form strings (scenario-schema.json:4909). The validator only checks groups named in `avoids` or in group exchanges (validate_npc_needs.rb:881-898, :973-998). `vd_office_staff` is listed by both extras and is valid. See m1 for Maya.
- `facePlayer` against the work facing: no conflict. A needs seat is mounted with `facePlayer: false` (seating.js:1570), and the player-facing swivel in `updateSeatedNPC` runs only for non-needs sitters (seating.js:1970-2002). One side effect: a working extra does not swivel towards the player when talked to. That is acceptable for typists.
- A hidden seated NPC releases its chair. `setNPCVisible(false)` calls `unseatNPC(..., { instant: true })` (npc-behavior.js:426-433, seating.js:1640-1661), which frees the chair place and cancels a fetch. The needs tick then sees `status.hidden`, aborts the job with `cancel` and blocks the NPC (npc-needs.js:1235-1239, :1418-1425), so the PC or cooler slot is released too.

## D88 content

- Hide after `entropy_reveal_read` (PLAN.md:141-155). The plain hide fires once, on a global that turns once. A repeat hide does not re-emit `npc_hidden` (npc-behavior.js:404-408). The re-hides are `onceOnly`. Visibility restores before register. The hide carries no KO guard, which is intended. No needs state is left behind (above). See m3 for the KO-guard wording.
- Maya's gate. `discussed_operation` is set at ink :85 ("Tell me everything") and :96 (top of `operation_details`), and is declared at scenario :2278. The ink observer writes and emits as soon as the variable changes (npc-conversation-state.js:596-625), before `conversation_closed` is emitted in cleanup (person-chat-minigame.js:1980-1997). A false condition does not use up `onceOnly`: the handler is marked only after the conditions pass (npc-manager.js, "conditions passed" before `triggered.count++`). `needs.set` is a supported mapping action (npc-manager.js:1247, :1639-1640). A coordinate `needsHome` has precedent (m03 :874).
- Found at post first: holds. Every path to `informant_reveal` passes through `reveal_check` before `operation_details` (ink :53-89). `discussed_operation` is therefore false whenever the reveal can still play, and she has not moved. See m2 for the wording.
- Beats that assume she is at her desk: none found. `talk_to_maya` is completed by an ink tag and is optional (:228-233). The HaX phone report choice reads globals only (m01_phone_agent0x99.ink:149). She holds no item. Her office notes are scenario objects that stay put. No cutscene, Derek line or line-of-sight check names her position (grep of ink/ and scenario.json.erb). Her own `npc_attacked` and `npc_ko` texts (:702-715) are not tied to a room.

## M1. After her trip, Maya's Derek topics can play in the open office beside the extras (PLAN.md:272, :349; m01_npc_maya.ink:120-199; m01_opening_briefing.ink:209)

Evidence: her route is maya_office, hallway_east, main_office_area (PLAN.md:258). The cooler is in the main office, 3.4 tiles from Graham's desk, with Fatima also in the room. Capacity 2 means an extra can be standing beside her. Derek's break room opens off the main office's west wall (:1397-1400), and Derek's empty office shares hallway_east with hers (:1704-1706). The engine opens a chat wherever she stands and has no option to refuse talk (grep for any talk gate found none). Every topic left after the first talk names Derek as ENTROPY or blames him: `derek_intel` (:123-127), `patricia_story` (:179), `tactical_advice` (:188), and even the hub exit (:154). HaX's briefing tells the player that Derek may be watching who she talks to (m01_opening_briefing.ink:209).

Section 11 assumes the re-talk opener "Is it safe to talk?" plays first. That is true only after a reload. In the same session the hub exit diverts back to `-> hub` (ink :152-155), so the story is saved at a choice point (npc-conversation-state.js:86-92). The reopen then resumes the hub straight away and silently re-displays the last line (person-chat-reopen.js:1-14, :61-66). A player who presses Esc in `operation_details` just after the flag turns resumes at its choices, where "Derek, he's the one running it" (:108) is one click away at the cooler. Derek himself cannot overhear: he has no needs or patrol (:1403-1406), and his fight sets `m01_staff_alarmed`, which switches the cooler off. The extras can overhear, and the scene contradicts the briefing.

Smallest fix, with no new NPC line and no engine change:

1. Add a global `maya_away`, declared false. It is not monotonic, so name it as such in section 6. It tracks where the player is, which is enough: Maya is only ever in her office, hallway_east or the main office, and talk needs both in one room. Add three mappings at the end of agent_0x99's list (always registered), each guarded so it writes only on a change:
   - `room_entered:main_office_area` and `room_entered:hallway_east`, condition `!globalVars.maya_away`, set `maya_away` true.
   - `room_entered:maya_office`, condition `globalVars.maya_away === true`, set it false.
   Reload is safe: every path to her desk enters maya_office, which clears the flag.
2. In m01_npc_maya.ink, add `VAR maya_away = false` and a short knot:

   ```
   === not_here ===
   {not maya_away: -> hub}
   + [Not here. I'll come to your office.]
       #exit_conversation
       -> hub
   ```

   Put `{maya_away: -> not_here}` as the first line of `hub`, `derek_intel`, `patricia_story` and `tactical_advice`, and in `operation_details` after its two set lines. A choice-point reopen re-enters the knot that owns the choices (person-chat-reopen.js:79-110), so each guard covers a resumed conversation. After a reload, "Is it safe to talk?" (:26) leads to "Not here", which reads well.
3. Add to test 14: talk to her at the cooler both in-session and after a reload, and after Esc in `operation_details`. Expect only the "Not here" choice, and the full hub once back in her office.

Cost: one choice line of player text (check whether player choices are voiced; if they are, the clip needs the user's yes), five one-line guards, three mappings, one global. If the user rules out any change to her ink, the fallback is to drop 4.9 (D88 c), not to accept the leak.

## m1. Maya pairs with the extras at the cooler (PLAN.md:270; npc-needs.js:4368-4372, :4387-4403)

`_compatible` pairs two NPCs when either has no groups. Maya declares no `needsCompany`, so if she is the second user at the cooler she chats with Fatima or Graham, who say their pool lines to her while she shows picture turns. The plan says she has "No chatter", which is true of her own lines only. Fix: give her `"needsCompany": { "avoids": ["fatima_begum", "graham_whitfield"] }`. She then never shares the cooler with an extra (the schema says an avoid acts both ways and stops sharing a capacity-2 object), which also shrinks M1's audience. Expect one validator info line (validate_npc_needs.rb:1010-1033) and record it.

## m2. Re-talk and reveal wording (PLAN.md:249, :349)

- :249 says `informant_reveal` is "reachable only in the first conversation". If the player presses Esc in `reveal_check`, the saved state resumes there in a second talk. The gate still holds because `discussed_operation` is false, so she is at post. Reword it as "reachable only while `discussed_operation` is false, and she does not move until it is true".
- :349's "Her re-talk opener 'Is it safe to talk?'" applies after a reload only (see M1). Correct it when M1's fix goes in.

## m3. KO-guard claim (PLAN.md:152, :237, :241)

4.5 says every other mapping on the extras carries `!globalVars.<npc>_ko`. Fatima's break mapping (:237) and Graham's `npc_use_started` mapping (:241) do not. This is harmless in practice: an attack sets `m01_staff_alarmed`, and a knocked-out NPC is blocked in the needs tick (npc-needs.js:1235-1239). Either add the guards or reword the sentence.

## m4. Heading typo (PLAN.md:351)

"## 12. Lab sheet## 11. Lab sheet" should be "## 12. Lab sheet".

## Sync, locks, secrets

- Sync: tier 1 and tier 2 globals, `onceOnly` keys, `npcVisibility` and `npcHostility` are as section 6 states, all bounded scalars. Maya's routine adds one `onceOnly` key and no global. M1's fix adds one boolean, written only on a change, at most twice per visit to her office. It is not monotonic and must be named as such.
- Lock and key effect: none. The PC declarations claim existing decor, the cooler is a plain object, and Maya holds nothing and is not a key source. Nothing gates or opens a door.
- Secrets: none. The observations on the PCs and cooler, the barks and the pool lines carry no PIN, key, code or plot name (PLAN.md:69, :77, :199; SPOKEN_LINES.md:5, :17-18).

## Not checked

- Whether player choice text is voiced in person-chat (affects M1's clip count).
- The person-chat-minigame.js caller of the choice-point re-navigation. I read only the reopen helper and its comment.
- Whether hallway_east's motion lighting (:1702) reacts to Maya walking through.

## Outcomes

- M1: fixed in PLAN.md 4.9 ("Talking to her away from her post"), with section 2 step 5, 3, 5, 6, 7, 8 (test 14), 9 and 11 updated. `maya_away` global (not monotonic) set by three `room_entered` mappings on agent_0x99; `not_here` is a player-choice-only knot, so no Maya line is added or reused; the guard goes on `hub`, `operation_details`, `derek_intel`, `patricia_story` and `tactical_advice`, each with the reason it leaks. Player choice text is not voiced (person-chat-minigame.js:1688). Build step: compile the ink, lint, run the m01 regression run. D84 note added. New player text P1 listed in SPOKEN_LINES.md.
- m1: fixed in 4.9: `needsCompany.avoids` for Fatima and Graham, cited to npc-needs.js:4344-4365, with the 2-tile `avoidRadius` side effect and the one validator info line recorded.
- m2: fixed in 4.9: the reveal is "reachable only while `discussed_operation` is false"; the false "Is it safe to talk?" claim is removed from section 11.
- m3: fixed by adding the missing `!globalVars.<npc>_ko` guards to Fatima's break and Graham's cooler follow in 4.8, and rewording the 4.5 sentence to list them.
- m4: heading corrected to "## 12. Lab sheet".
- Not checked, carried into PLAN.md section 11: hallway_east motion lighting reacting to Maya.
