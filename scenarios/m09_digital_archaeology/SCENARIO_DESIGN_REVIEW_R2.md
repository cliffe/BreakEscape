# m09 Digital Archaeology: scenario design review, round 2

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 3 of the AGENTS.md five-phase loop, round 2. I reviewed the tree at 4adf5576 (the R1 fixes), with no uncommitted m09 changes. First I checked each R1 finding against the source and the engine. Then I ran `.claude/skills/scenario-design-review/SKILL.md` again on the current build. I didn't reopen rulings settled in CONTRACT.md or earlier rounds.

**Method.** I ran the validator (full, with graph; the graph files came out byte for byte the same, so git is clean), `dialoguelint` and `reopencheck`. I read the R1 diff, HaX's hub, status ladder and `bring_in_confirm`, the whole debrief, Sorensen's cage ink and the mappings around the cage, the stacks, the office and the lease. Engine paths I checked: delayed mappings (`systems/npc-manager.js:575-630`: a `delayMs` mapping re-checks its condition when the delay is up, and waits while any minigame or conversation is open), the phone reopen (`minigames/phone-chat/phone-chat-minigame.js:472-560`) and the pickup event payload (`systems/inventory.js:655`, `minigames/container/container-minigame.js:503`: `item_picked_up:<type>` with `itemId`). I opened no VM plan, SecGen file or field guide. There was no browser run. Scratch is in the session scratchpad under `m09_sdr2/`.

**Counts: 0 blockers, 0 majors, 2 minors, 4 nits.** All four R1 findings and all four R1 nits are resolved.

**Verdict.** The R1 fixes work. The ending now warns before the debrief and has a clean "Not yet". Victoria's gate announces itself, Sorensen notices the file without HaX naming the lever, and Netherton says where the bunker is. The two new minors come from those fixes. First, the confirm's two-line cap is spent on the notice, which the debrief asks about anyway, so the threads that really close (Nightshade's file, the lease) rarely get a line. Second, the Sun River line is the same whether or not the player found the lease, so going back for it, as the new confirm suggests, earns nothing at the end.

---

## Part 1: R1 findings

| R1 | Status | Evidence |
|---|---|---|
| M1 bring-in confirm | **Resolved**, with one new minor (m1 below) and a nit (n1) | `m09_phone_agent0x99.ink:672-673` (hub → `bring_in_confirm`), `:958-994` |
| m1 Victoria pointer | **Resolved**, with a nit (n4) | erb:180-181 (A3-36), phone:941-942 (status row), `texts/A_hax_texts.md` A3-36 |
| m2 Sorensen notices the file | **Resolved**, with a nit (n2) | `m09_sorensen_cage.ink:49-58`, erb:1760-1769 |
| m3 Sun River / `deed_found` | **Resolved**, with one new minor (m2 below) | erb:2098 (`onPickup`), erb:2558 (declared), `m09_closing_debrief.ink:261`, erb:486 (card) |
| n1 status row cipher | Resolved | phone:921-922; erb:807 observation |
| n2 `tape_card_held` | Resolved | erb:279 (the keycard's type is `keycard` and its id is `tape_room_keycard`, erb:2060-2061; the pickup emits `item_picked_up:keycard` with `itemId`), phone:925-926 |
| n3 Noor's ledger button | Resolved | `m09_noor_haddad.ink:127` |
| n4 Reading waits for the last page | Resolved | phone:739; `reading_finished` is set by the last page's `onRead` (erb:2046) and declared (erb:2466) |

### M1: `bring_in_confirm`

- **Point of no return.** "[Bring me in.]" in the hub now only diverts (phone:674-675). The confirm opens with "That's Helena done. Once you're on the plane, the archive's closed to us.", which says in HaX's own voice that this ends the night. The `start_debrief` tag, the `debrief_notice_before` copy and `#exit_conversation` sit only under the confirm's own "[Bring me in.]" (phone:981-990). That meets README_scenario_design.md:1550.
- **"Not yet" is a clean return.** It sets nothing and goes to `support_hub` (phone:991-993), so the hub button is still there and nothing is consumed. `open_told` is a `temp`, recounted on every entry, so a second visit lists whatever is open then. `reopencheck` on `agent_0x99`: 1597 reopens, 1404 re-runs, 0 problems. One wording nit (n1).
- **List order.** This doesn't hold up. See **m1**.

### m1: Victoria (A3-36 and the status row)

The text fires once, 3 s after entering the restricted stacks, only for a recruited Victoria with the cage shut and the code not yet asked for (erb:180-181). `stacks_entered` is set by the immediate mapping on the same event (erb:178), so hub topic 14's gate (phone:781) is already true when the text lands. The delayed mapping waits out any open conversation and re-checks its condition, so the text can't arrive after the gate is open. The topic's `maintenance_code_used` drives the unlock, the retry and the reload backstop (erb:188-190). The text table row matches the ERB.

The status row reads well, but it sits below the `hatch_talked` row, so it's skipped in one common order (n4).

### m2: Sorensen's glance and the once-only open

- **Guards against the engine.** The mapping (erb:1760-1769) is on `sorensen` itself. Its condition is `value === true && cage_opened && in_cage && sorensen_fate === 'left' && !flag3_submitted`, with `onceOnly` and `delayMs: 1500`. A `delayMs` mapping checks the condition when it is scheduled and again when it fires (npc-manager.js:610-629). At fire time, if `MinigameFramework.currentMinigame` is set (the plan cabinet's container, the biometric pad, a HaX call, any other person-chat), it re-queues instead of opening (:614-617). So it can't open mid-minigame or over another conversation, and a KO or a room exit during the wait cancels it. `!flag3_submitted` keeps it apart from the identity scene's call on the same event (erb:284), which needs `flag3_submitted`. The other `nightshade_file_held` handlers (legacy clock, task unlock, HaX's text, erb:212, 230-232) don't open anything.
- **MC §4.3 kept.** HaX still names no lever. The cue is the narrator line (cage:55-56) and the lever button that was already there.
- **One gap.** On a first meeting (the player went straight to the cabinet, which HaX's cage-entry text "That cabinet takes a print." invites), the open plays her opening. It then goes `-> back`, which sets `hub_quiet`, so the glance never shows (n2). The lever button still appears, so the talk-down is now offered either way. That's the point of the fix.

### m3: `deed_found` and Sun River

The flag is wired and declared, and the confirm reads it (phone:969-972). The card line reads "The Montana order: signed. Sun River." and the card is still five lines.

Is the line true on every route? Yes in canon, since m10 assumes Sun River. On the routes where the player never took the lease, though, it has no source the player has seen:

- **Lease taken.** HaX texted "There it is. Tomb Gamma has an address." (erb:328), and the line pays that off.
- **No lease, m08 coordinate known.** The briefing said "Nightshade gave us a coordinate" (briefing:67-68), so the line is a fair follow-up.
- **No lease, no coordinate, or m08 not played.** The briefing said "Not the bunker. Not yet." (briefing:63-64). Nothing the player found tonight names Sun River, a lease or 2016. Netherton states the lease's details (the state as lessor, 2016) as if the player had brought them in.

A player who goes back to the office because the new confirm says "It's the bunker's address" hears exactly what a player who never went hears. See **m2**.

---

## Part 2: the skill, run again

### Step 1: validator

**❌ INVALID.** None.

**⚠️ WARNING.** Same as R1, all known or ruled on:
- 13 onceOnly-overlap warnings (`agent_0x99`, `recruiter`; reasoning at erb:116-128).
- The biometric `unlock_object`.
- Four cutscenes without `onceOnly`, all deliberate.
- The salvage AND gate (`puzzle_graph_and_with`, the known false positive).
- The three no-credential locks (HaX's `unlockDoor` and the pick).
- Six hidden prefix speakers with "no behavior".

Dialogue lint: 5 `not-x-but-y` and 1 `you-after-choice` (allowed), unchanged and owned by the dialogue phase.

**✅ GOOD PRACTICE.** Event-driven cutscenes, `globalVarOnKO`, `skipIfGlobal`, music, hostiles, puzzle-graph metadata.

**💡 SUGGESTION.** As R1: the safe's evidence notes, the reading room's VM launcher, PC containers, timedMessages. None apply.

**Graph.** Puzzle 64/71, Story 6/5, Integrated 70/86, Rooms 11, Contents 89. Critical path (3 hops): Get In → Read The Initiative's Ledger → Take Tomb Beta's Server → Report To Netherton. Geometry and door alignment OK. `reopencheck` m09 `agent_0x99`: 0 problems.

### Step 2: design review

- **2a Solvability: OK.** Nothing in the R1 fixes touches a lock or a gate. The confirm's "Not yet" can't strand the player, and its "[Bring me in.]" keeps the reload-safe tag. Win condition: four flags plus HaX's button. No KO can block it.
- **2b Clues: OK.** The note's observation now says the code is still in their cipher (erb:807), which closes R1 n1 at the source.
- **2c Education: OK.** No change. The hour read and the Albion memo still carry the teaching.
- **2c′ Field guides: OK.** The placeholder `labUrl`s are deliberate until the lab-sheet stage.
- **2d Narrative: OK.** The ending now warns first. The debrief answers the briefing's open question, with the routing caveat in m2.
- **2d′ Ink conventions: OK.** The new glance is a `Narrator:` line, and the confirm knot is unvoiced HaX.
- **2d″ Patrol: OK.** Unchanged.
- **2e Graph: OK.** Unchanged.
- **2f Rooms: OK.** "The tape room's north of the stacks" (phone:926) is true (erb:1610).
- **2g Scaffolding.**

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Call or text at the transition |
|---|---|---|---|---|
| Get In And Set Up The Drop Terminal | 3 | 3 | none | `flag1_read` |
| Find The Restricted Series | 5 | 5 (now with A3-36 on the Victoria route) | none | alongside |
| Read The Initiative's Ledger | 2 | 2 | low (status covers it) | the deck choice |
| Search The Director's Office | 5 | 5 (the lease is now in the confirm list, but see m1) | none | alongside |
| Take Tomb Beta's Server | 6 | 6 | none | identity scene, hour read, Tesseract's call |
| Report To Netherton | 1 | 1 | none | `bring_in_confirm`, then the debrief |

- **2h KO: OK.** Unchanged from R1's table. The new Sorensen mapping requires `sorensen_fate === 'left'`, so a KO cancels it.
- **2i Recurring bugs.**
  - **Status answers.** I walked the two new rows through every stage. The `tape_card_held` row is right at every stage. The Victoria row is skipped after a hatch talk (n4).
  - **Credits and debrief against every route.** Sun River: see m2. The card is five lines on every route.
  - **Hub order.** The confirm sits first in the hub, as the newest topic should.
  - **Spoilers, deduction, look-alikes.** No change.

---

## Findings

### Minor

**m1. The confirm's two-line cap is spent on the notice, which the debrief asks about anyway. The threads that close for good get pushed out.** `m09_phone_agent0x99.ink:961-980`.

The order is: notice unsent, H&L boxes shut, the lease, Tran, Nightshade's file. The notice and H&L lines are not capped, so whenever both apply the list stops there. That is common: holding the notice for Netherton is a legitimate choice, and the H&L cross-reference is optional. In that case:
- **The lease line (the R1 m3 pointer) never shows.** That's the one thread the confirm was extended to cover.
- **Nightshade's file never shows on the triple-agent branch.** Its send button retires on `start_debrief` (phone:756), and the debrief never offers it, so this is the one choice that really is lost at this button. It is last in the list.
- **The notice still gets a line.** It is the one thread that isn't lost: the line itself says "Netherton will ask", and the debrief does ask (debrief:122-155).

**Fix (unvoiced, no audio cost).** Order the capped lines by what closes for good:
1. Nightshade's file undecided (triple-agent branch);
2. H&L's boxes;
3. the lease;
4. Tran.

Then print the notice line outside the cap, as a heads-up after them: "The notice is still on his box. Netherton will ask." Keep the cap at two for the other four. Update CONTRACT §2.1 row 1.

**m2. Netherton's Sun River line is the same whether or not the player found the lease. For a player who never did, he has no source.** `m09_closing_debrief.ink:261`.

The R1 fix made the canon true for every player, but it flattened the payoff. Taking the lease earns HaX's text and nothing in the ending, and the new confirm sends players back for "the bunker's address" with nothing said about it afterwards. On the no-lease, no-coordinate route, Netherton quotes the lease's details (the state's lessor, 2016) after the briefing's "Not the bunker. Not yet.", and nothing the player did tonight explains how he knows. This is the user's priority case: a choice the player made (going back for the file) should land.

**Fix (voiced, +2 lines; the `deed_found` arm keeps today's line).** Declare `VAR deed_found = false` in the debrief and branch:
- `deed_found`: "Sun River. A civil defence bunker Tesseract's people leased from the state in 2016. Her own file gave us the address. That is where the order sends us."
- `m08_tomb_gamma_location_known` (no lease): "Sun River. Nightshade's coordinate, and a lease his people took in 2016. That is where the order sends us."
- Otherwise: "Sun River. Analysis found the lease by morning. We would have had it tonight from her office. That is where the order sends us."

This sources the line on every route, and the third arm tells a player who left the folder what they missed. Add `deed_found` to the debrief's VAR list and CONTRACT §4.2 step 7. Recount the voiced lines.

### Nits

**n1. "Not yet" answers "Line's open." and leaves the hub up.** Phone:992. "Line's open." is also the hub's goodbye (phone:835-836). Choosing "Not yet" and then "[That's all for now.]" prints it twice in a row, and the first one reads as a goodbye while the menu stays open. **Fix (unvoiced):** "Go on. I'll be here."

**n2. On a first meeting the auto-open plays Sorensen's opening and skips the glance.** `m09_sorensen_cage.ink:27-38`. `start` ends `-> back`, which sets `hub_quiet`, so the R1 m2 glance never prints when the file was taken before the player spoke to her. The lever button still shows, so the talk-down is offered. **Fix (no audio cost):** end `start` with `{nightshade_file_held: -> hub - else: -> back}`. On a first meeting `hub_quiet` is still false, so the glance plays after her opening.

**n3. "H&L's boxes are still shut" is wrong once the box is open but the sheet is unread.** Phone:965-968 tests `sleeper_named`/`sleeper_shortlist`. The shortlist is set by the placing sheet's `onRead` (erb:1368), not by opening the box (`hl_box_opened`, erb:318). **Fix (unvoiced):** declare `VAR hl_box_opened = false` in the phone ink. When it is true, use "H&L's placing sheet is still in their box. You haven't read it."

**n4. The Victoria status row is skipped once the player has talked at the hatch.** Phone:938-942. The row `hatch_talked and not cage_opened` comes first. A recruited-Victoria player who talks to Sorensen before asking HaX is told "Clone her card at the hatch if you haven't". The A3-36 text has already fired, so this only matters to a player who missed it. **Fix:** move the Victoria row above the `hatch_talked` row.

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. m1: reorder the confirm list so the threads that close for good come first, with the notice as an uncapped heads-up (phone:960-980).
2. m2: branch the Sun River line by `deed_found` and `m08_tomb_gamma_location_known` (debrief:261), +2 voiced lines.

**Worth considering:** n1–n4, all unvoiced or free.

## Top five

1. **m1.** The confirm's cap hides the lease and Nightshade's file behind the notice, which the debrief asks about anyway.
2. **m2.** Sun River sounds the same with or without the lease, and has no source for a player who never found it or the m08 coordinate.
3. **n2.** Sorensen's file glance doesn't show when the auto-open is the first meeting.
4. **n3.** "H&L's boxes are still shut" after the box has been opened.
5. **n4.** The Victoria status row is skipped after a hatch talk.

## Browser checks owed (carried from R1, not findings)

1. The Alpha deck host's name and portrait before the identity scene (R1 browser check 1).
2. The confirm knot: both buttons, a close with the confirm showing, and a reload on it.
3. The Sorensen auto-open: it fires on taking the file in the cage once the container closes, and not after a talk-down, a KO, or with flag 3 in.

## Out of scope (engine track; uncounted)

- After a reload inside the cage, `in_cage` depends on the order of `game_loaded` (which sets it false, erb:252) and the load's room entry (which sets it true, erb:388). If `game_loaded` lands second, the Sorensen auto-open won't fire for that visit.
- R10 m1/m2 (F5 inside a bin reply's gap) are still on the engine track.
